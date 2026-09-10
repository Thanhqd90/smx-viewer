import { describe, expect, it } from "vitest";

import {
  applyViewerOffset,
  formatPlaybackTime,
  getMeasureBeat,
} from "../lib/smx/playback";

describe("formatPlaybackTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatPlaybackTime(37)).toBe("0:37");
    expect(formatPlaybackTime(222)).toBe("3:42");
  });

  it("handles fractional, invalid, and negative values", () => {
    expect(formatPlaybackTime(37.9)).toBe("0:37");
    expect(formatPlaybackTime(Number.NaN)).toBe("0:00");
    expect(formatPlaybackTime(-1)).toBe("0:00");
  });

  it("applies the viewer offset to visual time only", () => {
    expect(applyViewerOffset(10, 0)).toBe(10);
    expect(applyViewerOffset(10, 50)).toBe(9.95);
    expect(applyViewerOffset(10, -50)).toBe(10.05);
  });
});

describe("getMeasureBeat", () => {
  it("starts at measure 1, beat 1", () => {
    expect(getMeasureBeat(0)).toEqual({ measure: 1, beatInMeasure: 1 });
  });

  it("counts beats within a measure before rolling over", () => {
    expect(getMeasureBeat(1)).toEqual({ measure: 1, beatInMeasure: 2 });
    expect(getMeasureBeat(3.9)).toEqual({ measure: 1, beatInMeasure: 4 });
  });

  it("advances to the next measure on beat 4", () => {
    expect(getMeasureBeat(4)).toEqual({ measure: 2, beatInMeasure: 1 });
  });

  it("matches the app's default starting beat", () => {
    expect(getMeasureBeat(14)).toEqual({ measure: 4, beatInMeasure: 3 });
  });

  it("floors fractional beats to the containing beat", () => {
    expect(getMeasureBeat(17.75)).toEqual({ measure: 5, beatInMeasure: 2 });
  });

  it("falls back to measure 1, beat 1 for non-finite input", () => {
    expect(getMeasureBeat(Number.NaN)).toEqual({
      measure: 1,
      beatInMeasure: 1,
    });
  });
});
