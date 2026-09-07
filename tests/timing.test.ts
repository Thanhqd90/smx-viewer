import { describe, expect, it } from "vitest";

import {
  beatToSeconds,
  parseTiming,
  secondsToBeat,
  type SMXTiming,
} from "../lib/smx/timing";

const constantTiming = parseTiming({
  timing_bpms: "0=120",
  timing_stops: "",
  timing_offset_ms: 0,
});

describe("SMX timing", () => {
  it("converts beats to seconds at a constant BPM", () => {
    expect(beatToSeconds(4, constantTiming)).toBeCloseTo(2);
  });

  it("converts seconds to beats at a constant BPM", () => {
    expect(secondsToBeat(2, constantTiming)).toBeCloseTo(4);
  });

  it("applies BPM changes", () => {
    const timing = parseTiming({
      timing_bpms: "0=120,4=60",
      timing_stops: "",
      timing_offset_ms: 0,
    });

    expect(beatToSeconds(6, timing)).toBeCloseTo(4);
    expect(secondsToBeat(4, timing)).toBeCloseTo(6);
  });

  it("includes stops before the target beat", () => {
    const timing = parseTiming({
      timing_bpms: "0=120",
      timing_stops: "2=1.5",
      timing_offset_ms: 0,
    });

    expect(beatToSeconds(4, timing)).toBeCloseTo(3.5);
    expect(secondsToBeat(3.75, timing)).toBeCloseTo(4.5);
  });

  it("applies the timing offset", () => {
    const timing = parseTiming({
      timing_bpms: "0=120",
      timing_stops: "",
      timing_offset_ms: 500,
    });

    expect(beatToSeconds(2, timing)).toBeCloseTo(1.5);
    expect(secondsToBeat(1.5, timing)).toBeCloseTo(2);
  });

  it("round-trips a beat through seconds with changes and stops", () => {
    const timing: SMXTiming = parseTiming({
      timing_bpms: "0=120,4=60",
      timing_stops: "2=0.5",
      timing_offset_ms: -250,
    });
    const beat = 6;

    expect(secondsToBeat(beatToSeconds(beat, timing), timing)).toBeCloseTo(
      beat,
    );
  });
});
