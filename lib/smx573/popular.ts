import { getPublishedEdits, getSongById } from "./api";
import {
  rankPopularEdits,
  toPopularEdit,
  type PopularEdit,
} from "../smx/popular";

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export async function getPopularEdits(): Promise<PopularEdit[]> {
  const edits = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const pageEdits = await getPublishedEdits(PAGE_SIZE, page * PAGE_SIZE);
    edits.push(...pageEdits);

    if (pageEdits.length < PAGE_SIZE) {
      break;
    }
  }

  const rankedEdits = rankPopularEdits(edits).slice(0, 6);
  const popularEdits = await Promise.all(
    rankedEdits.map(async (edit) => {
      const song = await getSongById(edit.song_id);

      return song ? toPopularEdit(edit, song) : null;
    }),
  );

  return popularEdits.filter((edit): edit is PopularEdit => edit !== null);
}
