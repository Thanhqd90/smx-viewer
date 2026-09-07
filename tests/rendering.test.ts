import { describe, expect, it } from "vitest";

import { beatToY, isNoteVisible, laneX } from "../lib/smx/rendering";

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
});
