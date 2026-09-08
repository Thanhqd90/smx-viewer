import { describe, expect, it } from "vitest";

import {
  clampScrollSpeed,
  clampVolume,
  DEFAULT_SCROLL_SPEED,
  clampViewerOffsetMs,
  DEFAULT_VIEWER_OFFSET_MS,
  DEFAULT_ASSIST_TICK_VOLUME,
  clampAssistTickVolume,
  MAX_SCROLL_SPEED,
  MIN_SCROLL_SPEED,
  parseStoredMuted,
  parseStoredAssistTick,
  parseStoredAssistTickVolume,
  parseStoredViewerOffsetMs,
  parseStoredScrollSpeed,
  parseStoredPlaybackRate,
  parseStoredVolume,
} from "../lib/smx/preferences";

describe("viewer preferences", () => {
  it("clamps volume and falls back for invalid values", () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
    expect(parseStoredVolume("0.25")).toBe(0.25);
    expect(parseStoredVolume("invalid")).toBe(0.5);
    expect(parseStoredVolume(null)).toBe(0.5);
  });

  it("parses the muted preference safely", () => {
    expect(parseStoredMuted("true")).toBe(true);
    expect(parseStoredMuted("false")).toBe(false);
    expect(parseStoredMuted("invalid")).toBe(false);
    expect(parseStoredMuted(null)).toBe(false);
  });

  it("clamps scroll speed to the supported range", () => {
    expect(clampScrollSpeed(MIN_SCROLL_SPEED - 1)).toBe(MIN_SCROLL_SPEED);
    expect(clampScrollSpeed(MAX_SCROLL_SPEED + 1)).toBe(MAX_SCROLL_SPEED);
    expect(parseStoredScrollSpeed("120")).toBe(120);
    expect(parseStoredScrollSpeed("invalid")).toBe(DEFAULT_SCROLL_SPEED);
    expect(parseStoredScrollSpeed(null)).toBe(DEFAULT_SCROLL_SPEED);
  });

  it("accepts only supported playback rates", () => {
    expect(parseStoredPlaybackRate("0.5")).toBe(0.5);
    expect(parseStoredPlaybackRate("1.25")).toBe(1.25);
    expect(parseStoredPlaybackRate("invalid")).toBe(1);
    expect(parseStoredPlaybackRate("2")).toBe(1);
    expect(parseStoredPlaybackRate(null)).toBe(1);
  });

  it("parses and clamps assist tick preferences", () => {
    expect(parseStoredAssistTick("true")).toBe(true);
    expect(parseStoredAssistTick("false")).toBe(false);
    expect(parseStoredAssistTick("invalid")).toBe(false);
    expect(clampAssistTickVolume(-1)).toBe(0);
    expect(clampAssistTickVolume(2)).toBe(1);
    expect(parseStoredAssistTickVolume("invalid")).toBe(
      DEFAULT_ASSIST_TICK_VOLUME,
    );
    expect(parseStoredAssistTickVolume(null)).toBe(DEFAULT_ASSIST_TICK_VOLUME);
  });

  it("parses and clamps browser-local viewer offsets", () => {
    expect(DEFAULT_VIEWER_OFFSET_MS).toBe(0);
    expect(parseStoredViewerOffsetMs("100")).toBe(100);
    expect(parseStoredViewerOffsetMs("-100")).toBe(-100);
    expect(parseStoredViewerOffsetMs("garbage")).toBe(0);
    expect(clampViewerOffsetMs(9999)).toBe(250);
    expect(clampViewerOffsetMs(-9999)).toBe(-250);
  });
});
