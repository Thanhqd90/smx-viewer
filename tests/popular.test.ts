import { describe, expect, it } from "vitest";

import { rankPopularEdits, toPopularEdit } from "../lib/smx/popular";
import type { EditChart573 } from "../lib/smx573/types";

function edit(overrides: Partial<EditChart573>): EditChart573 {
  return {
    _id: 1,
    id: 1,
    difficulty: 10,
    difficulty_display: "edit",
    edit_author: "Author",
    edit_display_id: "AAA-111",
    edit_gamer_id: 1,
    edit_likes: 0,
    edit_publicity: "published",
    edit_published_at: "2026-01-01T00:00:00Z",
    edit_serial: 1,
    edit_style: "single",
    edit_tags: [],
    game_song_id: 1,
    song_id: 1,
    meter: 10,
    is_edit: true,
    user_bookmarked: false,
    user_liked: false,
    ...overrides,
  };
}

describe("popular edit ranking", () => {
  it("ranks likes first and play count as the tiebreaker", () => {
    const ranked = rankPopularEdits([
      edit({ edit_display_id: "LOW-111", edit_likes: 2, play_count: 99 }),
      edit({ edit_display_id: "HIGH-111", edit_likes: 5, play_count: 1 }),
      edit({ edit_display_id: "TIE-111", edit_likes: 5, play_count: 10 }),
    ]);

    expect(ranked.map((item) => item.edit_display_id)).toEqual([
      "TIE-111",
      "HIGH-111",
      "LOW-111",
    ]);
  });

  it("filters unpublished edits and maps to the homepage domain", () => {
    const published = edit({ edit_likes: 3, play_count: 4, pass_count: 2 });
    const ranked = rankPopularEdits([
      published,
      edit({ edit_publicity: "draft", edit_display_id: "DRAFT-111" }),
    ]);

    expect(ranked).toHaveLength(1);
    expect(toPopularEdit(published, { title: "Song Title" })).toEqual({
      displayId: "AAA-111",
      title: "Song Title",
      author: "Author",
      mode: "single",
      meter: 10,
      likes: 3,
      playCount: 4,
      passCount: 2,
    });
  });
});
