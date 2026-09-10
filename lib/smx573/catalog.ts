import { cache } from "react";

import { toBrowseEdit, type BrowseEdit } from "../smx/popular";
import { getPublishedEdits, getSongById, type Song573 } from "./api";
import type { EditChart573 } from "./types";

const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const SONG_LOOKUP_CONCURRENCY = 10;

export const CATALOG_LIMIT = PAGE_SIZE * MAX_PAGES;

export type EditStyle = "single" | "dual" | "full";

export interface BrowseFilters {
  query?: string;
  style?: EditStyle;
  meterMin?: number;
  meterMax?: number;
}

export type SortKey = "newest" | "likes" | "plays";

async function resolveSongs(
  edits: EditChart573[],
): Promise<Map<number, Song573 | null>> {
  const songIds = [...new Set(edits.map((edit) => edit.song_id))];
  const songsById = new Map<number, Song573 | null>();

  for (
    let index = 0;
    index < songIds.length;
    index += SONG_LOOKUP_CONCURRENCY
  ) {
    const batch = songIds.slice(index, index + SONG_LOOKUP_CONCURRENCY);
    const songs = await Promise.all(
      batch.map((songId) => getSongById(songId)),
    );

    batch.forEach((songId, batchIndex) => {
      songsById.set(songId, songs[batchIndex]);
    });
  }

  return songsById;
}

export const getEditCatalog = cache(async (): Promise<BrowseEdit[]> => {
  const edits: EditChart573[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const pageEdits = await getPublishedEdits(PAGE_SIZE, page * PAGE_SIZE);
    edits.push(...pageEdits);

    if (pageEdits.length < PAGE_SIZE) {
      break;
    }
  }

  const validEdits = edits.filter(
    (edit) =>
      edit.is_edit &&
      edit.edit_publicity === "published" &&
      ["single", "dual", "full"].includes(edit.edit_style),
  );

  const songsById = await resolveSongs(validEdits);

  return validEdits
    .map((edit) => {
      const song = songsById.get(edit.song_id);
      return song ? toBrowseEdit(edit, song) : null;
    })
    .filter((edit): edit is BrowseEdit => edit !== null);
});

export function filterEdits(
  edits: BrowseEdit[],
  filters: BrowseFilters,
): BrowseEdit[] {
  const query = filters.query?.trim().toLowerCase();

  return edits.filter((edit) => {
    if (filters.style && edit.mode !== filters.style) {
      return false;
    }

    if (filters.meterMin !== undefined && edit.meter < filters.meterMin) {
      return false;
    }

    if (filters.meterMax !== undefined && edit.meter > filters.meterMax) {
      return false;
    }

    if (query) {
      const haystack = [edit.title, edit.artist, edit.author, edit.displayId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export function sortEdits(edits: BrowseEdit[], sort: SortKey): BrowseEdit[] {
  const sorted = [...edits];

  switch (sort) {
    case "likes":
      return sorted.sort((a, b) => b.likes - a.likes);
    case "plays":
      return sorted.sort((a, b) => b.playCount - a.playCount);
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
      );
  }
}
