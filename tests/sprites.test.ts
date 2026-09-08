import { describe, expect, it } from "vitest";

import {
  getNoteHeadSprite,
  getQuantizationRow,
  getSingleLaneRotation,
  SPRITE_CELL_SIZE,
} from "../lib/smx/sprites";

describe("SMX sprite mapping", () => {
  it("maps quantization rows explicitly", () => {
    expect(getQuantizationRow("4th")).toBe(0);
    expect(getQuantizationRow("64th")).toBe(7);
    expect(getQuantizationRow("other")).toBe(8);
  });

  it("maps Single lanes to the documented rotations", () => {
    expect(getSingleLaneRotation(0)).toBe(-90);
    expect(getSingleLaneRotation(1)).toBe(180);
    expect(getSingleLaneRotation(2)).toBe(0);
    expect(getSingleLaneRotation(3)).toBe(0);
    expect(getSingleLaneRotation(4)).toBe(90);
  });

  it("uses directional and center columns without cropping padding", () => {
    expect(getNoteHeadSprite(0, "single", "8th")).toEqual({
      region: { x: 0, y: SPRITE_CELL_SIZE, width: 128, height: 128 },
      rotationDegrees: -90,
    });
    expect(getNoteHeadSprite(2, "single", "8th")).toEqual({
      region: { x: 128, y: SPRITE_CELL_SIZE, width: 128, height: 128 },
      rotationDegrees: 0,
    });
  });

  it("repeats the Single mapping for Full and leaves Dual unmapped", () => {
    expect(getNoteHeadSprite(7, "full", "4th")).toEqual({
      region: { x: 128, y: 0, width: 128, height: 128 },
      rotationDegrees: 0,
    });
    expect(getNoteHeadSprite(0, "dual", "4th")).toBeNull();
  });
});
