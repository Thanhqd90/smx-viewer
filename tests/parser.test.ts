import { describe, expect, it } from "vitest";

import { parseNoteData } from "../lib/smx/parser";

describe("parseNoteData", () => {
  it("parses the first note as an absolute beat", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 2, beat: [1, 4], time: 118 },
    ]);

    expect(notes).toEqual([
      {
        beat: 0.25,
        lane: 2,
        rawTimeMs: 118,
        type: "tap",
      },
    ]);
  });

  it("accumulates fractional beat deltas", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 0, beat: [1, 4] },
      { track: 1, beat: [1, 2] },
      { track: 2, beat: [3, 4] },
    ]);

    expect(notes.map((note) => note.beat)).toEqual([0.25, 0.75, 1.5]);
  });

  it("keeps simultaneous notes at the same absolute beat", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 0, beat: [1, 1] },
      { track: 3, beat: [0, 1] },
    ]);

    expect(notes.map((note) => [note.lane, note.beat])).toEqual([
      [0, 1],
      [3, 1],
    ]);
  });

  it("parses a two-beat hold", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 1, beat: [1, 4], len: [2, 1], time: 250, slen: 1000 },
    ]);

    expect(notes[0]).toEqual({
      beat: 0.25,
      endBeat: 2.25,
      lane: 1,
      rawLengthMs: 1000,
      rawTimeMs: 250,
      type: "hold",
    });
  });

  it("parses a one-and-a-half-beat hold", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 4, beat: [1, 2], len: [3, 2] },
    ]);

    expect(notes[0]).toMatchObject({
      beat: 0.5,
      endBeat: 2,
      lane: 4,
      type: "hold",
    });
  });
});
