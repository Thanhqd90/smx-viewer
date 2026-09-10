import { describe, expect, it } from "vitest";

import { filterEdits, sortEdits } from "../lib/smx573/catalog";
import type { BrowseEdit } from "../lib/smx/popular";

function browseEdit(overrides: Partial<BrowseEdit>): BrowseEdit {
  return {
    displayId: "AAA-111",
    title: "Song Title",
    artist: "Some Artist",
    author: "Author",
    mode: "single",
    meter: 10,
    tags: [],
    publishedAt: "2026-01-01T00:00:00Z",
    likes: 0,
    playCount: 0,
    passCount: 0,
    ...overrides,
  };
}

describe("filterEdits", () => {
  const edits = [
    browseEdit({
      displayId: "A",
      title: "Night In Motion",
      artist: "Discotronic",
      mode: "single",
      meter: 12,
    }),
    browseEdit({
      displayId: "B",
      title: "Energizer",
      artist: "Some Band",
      mode: "dual",
      meter: 22,
    }),
  ];

  it("filters by style", () => {
    expect(filterEdits(edits, { style: "dual" }).map((e) => e.displayId)).toEqual([
      "B",
    ]);
  });

  it("filters by meter range", () => {
    expect(
      filterEdits(edits, { meterMin: 15, meterMax: 25 }).map(
        (e) => e.displayId,
      ),
    ).toEqual(["B"]);
  });

  it("filters by search query across title, artist, author, and displayId", () => {
    expect(
      filterEdits(edits, { query: "discotronic" }).map((e) => e.displayId),
    ).toEqual(["A"]);
  });
});

describe("sortEdits", () => {
  const edits = [
    browseEdit({
      displayId: "OLD",
      publishedAt: "2025-01-01T00:00:00Z",
      likes: 10,
      playCount: 1,
    }),
    browseEdit({
      displayId: "NEW",
      publishedAt: "2026-01-01T00:00:00Z",
      likes: 5,
      playCount: 20,
    }),
  ];

  it("sorts by newest first", () => {
    expect(sortEdits(edits, "newest").map((e) => e.displayId)).toEqual([
      "NEW",
      "OLD",
    ]);
  });

  it("sorts by likes", () => {
    expect(sortEdits(edits, "likes").map((e) => e.displayId)).toEqual([
      "OLD",
      "NEW",
    ]);
  });

  it("sorts by plays", () => {
    expect(sortEdits(edits, "plays").map((e) => e.displayId)).toEqual([
      "NEW",
      "OLD",
    ]);
  });
});
