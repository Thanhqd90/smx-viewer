import { describe, expect, it } from "vitest";

import type { RawSMXChartResponse } from "../lib/smx/api";
import { normalizePlayableChart } from "../lib/smx/normalize";
import type { EditChart573 } from "../lib/smx573/types";

const metadata: EditChart573 = {
  _id: 7435,
  id: 7435,
  difficulty: 22,
  difficulty_display: "edit",
  edit_author: "Adrei",
  edit_display_id: "2P6-239",
  edit_gamer_id: 0,
  edit_likes: 0,
  edit_publicity: "published",
  edit_published_at: "2023-01-01T00:00:00Z",
  edit_serial: 0,
  edit_style: "single",
  edit_tags: [],
  game_song_id: 1564,
  song_id: 593,
  meter: 22,
  is_edit: true,
  user_bookmarked: false,
  user_liked: false,
};

const rawChart: RawSMXChartResponse = {
  success: true,
  chart: null,
  gamer: null,
  song: {
    title: "Night In Motion",
    subtitle: "",
    artist: "Cubic 22",
    timing_bpms: "0=127.389",
    timing_stops: "",
    timing_offset_ms: -8,
    music: "uploads/songs/NightInMotion/song.mp3?version=1",
    cover: "uploads/songs/NightInMotion/cover.png",
  },
  chart_data: {
    tracks: 5,
    noteData: [
      { version: 1 },
      { track: 0, beat: [14, 1], time: 6602 },
      { track: 4, beat: [1, 2], time: 235 },
    ],
  },
};

describe("normalizePlayableChart", () => {
  it("combines metadata, notes, timing, and absolute assets", () => {
    const chart = normalizePlayableChart(metadata, rawChart);

    expect(chart).toMatchObject({
      id: 7435,
      displayId: "2P6-239",
      title: "Night In Motion",
      artist: "Cubic 22",
      author: "Adrei",
      mode: "single",
      meter: 22,
      tracks: 5,
      audioUrl:
        "https://data.stepmaniax.com/uploads/songs/NightInMotion/song.mp3?version=1",
      coverUrl:
        "https://data.stepmaniax.com/uploads/songs/NightInMotion/cover.png",
    });
    expect(chart.notes.map((note) => note.beat)).toEqual([14, 14.5]);
    expect(chart.timing.bpms).toEqual([{ beat: 0, bpm: 127.389 }]);
    expect(chart.timing.offsetSeconds).toBe(-0.008);
  });
});
