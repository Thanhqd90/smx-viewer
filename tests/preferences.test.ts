import { describe, expect, it } from "vitest";

import {
  clampScrollSpeed,
  clampVolume,
  parseStoredMuted,
  parseStoredScrollSpeed,
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
    expect(clampScrollSpeed(20)).toBe(40);
    expect(clampScrollSpeed(240)).toBe(200);
    expect(parseStoredScrollSpeed("120")).toBe(120);
    expect(parseStoredScrollSpeed("invalid")).toBe(80);
    expect(parseStoredScrollSpeed(null)).toBe(80);
  });
});
