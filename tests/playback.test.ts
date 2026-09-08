import { describe, expect, it } from "vitest";

import { applyViewerOffset, formatPlaybackTime } from "../lib/smx/playback";

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
