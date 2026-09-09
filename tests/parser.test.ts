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

  it("parses a mine (real raw shape from chart 32284)", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 2, beat: [0, 1], mine: true, time: 0 },
    ]);

    expect(notes[0]).toEqual({
      beat: 0,
      lane: 2,
      rawTimeMs: 0,
      type: "mine",
    });
  });

  it("keeps a simultaneous mine at the same absolute beat", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 0, beat: [1, 1] },
      { track: 2, beat: [0, 1], mine: true },
    ]);

    expect(notes.map((note) => [note.lane, note.beat, note.type])).toEqual([
      [0, 1, "tap"],
      [2, 1, "mine"],
    ]);
  });

  it("parses a mine pit / long mine (real raw shape from chart 32284)", () => {
    const notes = parseNoteData([
      { version: 1 },
      {
        track: 4,
        beat: [0, 1],
        mine: true,
        len: [1, 1],
        time: 0,
        slen: 429,
      },
    ]);

    expect(notes[0]).toEqual({
      beat: 0,
      endBeat: 1,
      lane: 4,
      rawLengthMs: 429,
      rawTimeMs: 0,
      type: "pit",
    });
  });

  it("parses a lift (real raw shape from chart 32148)", () => {
    const notes = parseNoteData([
      { version: 1 },
      {
        track: 3,
        beat: [0, 1],
        len: [1, 2],
        time: 0,
        slen: 1545,
        lift: true,
      },
    ]);

    expect(notes[0]).toEqual({
      beat: 0,
      endBeat: 0.5,
      lane: 3,
      rawLengthMs: 1545,
      rawTimeMs: 0,
      type: "lift",
    });
  });

  it("parses a roll with a required hit count (real raw shape from chart 32284)", () => {
    const notes = parseNoteData([
      { version: 1 },
      {
        track: 4,
        beat: [1, 4],
        len: [3, 4],
        time: 107,
        slen: 321,
        taps: 4,
      },
    ]);

    expect(notes[0]).toEqual({
      beat: 0.25,
      endBeat: 1,
      lane: 4,
      requiredHits: 4,
      rawLengthMs: 321,
      rawTimeMs: 107,
      type: "roll",
    });
  });

  it("accumulates delta beats correctly across mixed tap/hold/mine/pit/roll/lift events", () => {
    const notes = parseNoteData([
      { version: 1 },
      { track: 0, beat: [1, 4] },
      { track: 1, beat: [1, 4], len: [1, 2] },
      { track: 2, beat: [1, 4], mine: true },
      { track: 3, beat: [1, 4], mine: true, len: [1, 2] },
      { track: 4, beat: [1, 4], len: [1, 2], lift: true },
      { track: 0, beat: [1, 4], len: [1, 2], taps: 3 },
    ]);

    expect(
      notes.map((note) => [note.type, Number(note.beat.toFixed(2))]),
    ).toEqual([
      ["tap", 0.25],
      ["hold", 0.5],
      ["mine", 0.75],
      ["pit", 1],
      ["lift", 1.25],
      ["roll", 1.5],
    ]);
  });
});
