import { describe, expect, it } from "vitest";

import {
  deriveAssistEvents,
  getAssistEventsBetween,
  getCrossedAssistEvents,
} from "../lib/smx/assistTick";
import { parseTiming } from "../lib/smx/timing";

const timing = parseTiming({
  timing_bpms: "0=120",
  timing_stops: "",
  timing_offset_ms: 0,
});

describe("assist tick scheduling", () => {
  it("derives a note timestamp from its beat", () => {
    const events = deriveAssistEvents(
      [{ beat: 14, lane: 0, type: "tap" }],
      timing,
    );

    expect(events).toEqual([{ timeSeconds: 7 }]);
  });

  it("deduplicates simultaneous notes and keeps hold starts only", () => {
    const events = deriveAssistEvents(
      [
        { beat: 14, lane: 0, type: "tap" },
        { beat: 14, lane: 2, type: "tap" },
        { beat: 14.5, endBeat: 16, lane: 1, type: "hold" },
      ],
      timing,
    );

    expect(events).toEqual([{ timeSeconds: 7 }, { timeSeconds: 7.25 }]);
  });

  it("returns every event crossed between frames", () => {
    const events = [
      { timeSeconds: 7 },
      { timeSeconds: 7.25 },
      { timeSeconds: 7.5 },
    ];

    expect(getCrossedAssistEvents(events, 7, 7.5)).toEqual(events.slice(1));
  });

  it("finds events in a scheduled lookahead window", () => {
    const events = [{ timeSeconds: 7 }, { timeSeconds: 7.25 }];

    expect(getAssistEventsBetween(events, 6.95, 7.05)).toEqual([
      { timeSeconds: 7 },
    ]);
  });

  it("returns no events for backward discontinuities such as seeks", () => {
    const events = [{ timeSeconds: 7 }, { timeSeconds: 8 }];

    expect(getCrossedAssistEvents(events, 20, 2)).toEqual([]);
    expect(getCrossedAssistEvents(events, 7, 7)).toEqual([]);
  });
});
