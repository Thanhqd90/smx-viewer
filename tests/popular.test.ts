import { describe, expect, it } from "vitest";

import { toBrowseEdit } from "../lib/smx/popular";
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

describe("toBrowseEdit", () => {
  it("maps a raw edit and its song metadata to the browse domain", () => {
    const published = edit({
      edit_likes: 3,
      play_count: 4,
      pass_count: 2,
      edit_tags: ["fast"],
    });

    expect(
      toBrowseEdit(published, { title: "Song Title", artist: "Some Artist" }),
    ).toEqual({
      displayId: "AAA-111",
      title: "Song Title",
      artist: "Some Artist",
      author: "Author",
      mode: "single",
      meter: 10,
      tags: ["fast"],
      publishedAt: "2026-01-01T00:00:00Z",
      likes: 3,
      playCount: 4,
      passCount: 2,
    });
  });

  it("defaults missing counts and tags", () => {
    const published = edit({});

    expect(toBrowseEdit(published, { title: "Song Title" })).toMatchObject({
      artist: undefined,
      tags: [],
      likes: 0,
      playCount: 0,
      passCount: 0,
    });
  });
});
