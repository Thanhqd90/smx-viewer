import { describe, expect, it } from "vitest";

import {
  getBeatQuantization,
  QUANTIZATION_EPSILON,
} from "../lib/smx/rendering";

describe("getBeatQuantization", () => {
  it("classifies supported rhythmic subdivisions", () => {
    expect(getBeatQuantization(14)).toBe("4th");
    expect(getBeatQuantization(14.5)).toBe("8th");
    expect(getBeatQuantization(14 + 1 / 3)).toBe("12th");
    expect(getBeatQuantization(14.25)).toBe("16th");
    expect(getBeatQuantization(14 + 1 / 6)).toBe("24th");
    expect(getBeatQuantization(14.125)).toBe("32nd");
    expect(getBeatQuantization(14 + 1 / 12)).toBe("48th");
    expect(getBeatQuantization(14 + 1 / 16)).toBe("64th");
  });

  it("prefers simpler quantization when grids overlap", () => {
    expect(getBeatQuantization(14)).toBe("4th");
    expect(getBeatQuantization(14.5)).toBe("8th");
    expect(getBeatQuantization(14.25)).toBe("16th");
  });

  it("tolerates floating-point boundary error", () => {
    expect(getBeatQuantization(14.5 + QUANTIZATION_EPSILON / 2)).toBe("8th");
    expect(getBeatQuantization(14.5 + QUANTIZATION_EPSILON * 2)).toBe("other");
    expect(getBeatQuantization(14.2)).toBe("other");
  });

  it("falls back for non-finite and unsupported positions", () => {
    expect(getBeatQuantization(14.2)).toBe("other");
    expect(getBeatQuantization(Number.NaN)).toBe("other");
    expect(getBeatQuantization(Number.POSITIVE_INFINITY)).toBe("other");
  });
});
