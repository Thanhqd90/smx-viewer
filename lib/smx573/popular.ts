import type { BrowseEdit } from "../smx/popular";
import { getEditCatalog } from "./catalog";

const POPULAR_COUNT = 6;

export type { BrowseEdit as PopularEdit } from "../smx/popular";

export async function getPopularEdits(): Promise<BrowseEdit[]> {
  const catalog = await getEditCatalog();

  return [...catalog]
    .sort((a, b) => b.likes - a.likes || b.playCount - a.playCount)
    .slice(0, POPULAR_COUNT);
}
