import type { EditChart573 } from "./types";

const API_BASE = "https://api.smx.573.no";

export interface Song573 {
  id: number;
  game_song_id: number;
  title: string;
  artist?: string;
}

export async function getEditByDisplayId(
  displayId: string,
): Promise<EditChart573 | null> {
  const query = encodeURIComponent(
    JSON.stringify({
      edit_display_id: displayId,
    }),
  );

  const response = await fetch(`${API_BASE}/charts?q=${query}`, {
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    throw new Error(`573 API failed with ${response.status}`);
  }

  const charts = (await response.json()) as EditChart573[];

  return charts[0] ?? null;
}

export async function getPublishedEdits(
  take = 100,
  skip = 0,
): Promise<EditChart573[]> {
  const query = encodeURIComponent(
    JSON.stringify({
      is_edit: true,
      edit_publicity: "published",
      _take: take,
      _skip: skip,
    }),
  );
  const response = await fetch(`${API_BASE}/charts?q=${query}`, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`573 API failed with ${response.status}`);
  }

  return (await response.json()) as EditChart573[];
}

export async function getSongById(songId: number): Promise<Song573 | null> {
  const query = encodeURIComponent(JSON.stringify({ id: songId }));
  const response = await fetch(`${API_BASE}/songs?q=${query}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`573 song API failed with ${response.status}`);
  }

  const songs = (await response.json()) as Song573[];
  return songs[0] ?? null;
}
