import { describe, expect, it } from "vitest";

import {
  beatToY,
  getHoldGeometry,
  getLaneGeometry,
  isNoteVisible,
  laneCenterX,
  laneX,
} from "../lib/smx/rendering";

describe("chart rendering math", () => {
  it("centers lanes within the dynamic track count", () => {
    expect(laneX(500, 5, 0)).toBe(50);
    expect(laneX(500, 10, 9)).toBe(475);
  });

  it("places later beats below the receptor", () => {
    expect(beatToY(14, 14, 80)).toBe(80);
    expect(beatToY(14.5, 14, 80)).toBe(120);
  });

  it("keeps a hold visible when its body crosses the viewport", () => {
    expect(
      isNoteVisible(
        { beat: 10, endBeat: 15, lane: 0, type: "hold" },
        14,
        400,
        80,
      ),
    ).toBe(true);
  });

  it("centers tightened lanes with a gutter", () => {
    const geometry = getLaneGeometry(500, 5, "single");

    expect(geometry.gap).toBe(0);
    expect(geometry.left).toBeCloseTo(112.5);
    expect(geometry.laneWidth).toBeCloseTo(55);
    expect(laneCenterX(geometry, 0)).toBeCloseTo(140);
    expect(laneCenterX(geometry, 4)).toBeCloseTo(360);
  });

  it("keeps a dedicated tail position for short holds", () => {
    expect(getHoldGeometry(100, 104, 100)).toEqual({
      top: 100,
      bodyHeight: 4,
      tailY: 104,
      tailRadius: 18,
    });
  });
});
