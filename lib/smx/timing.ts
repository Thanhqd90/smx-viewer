export interface BPMChange {
  beat: number;
  bpm: number;
}

export interface SMXStop {
  beat: number;
  durationSeconds: number;
}

export interface SMXTiming {
  bpms: BPMChange[];
  stops: SMXStop[];
  offsetSeconds: number;
}

export interface RawSMXTimingMetadata {
  timing_bpms: string;
  timing_stops: string;
  timing_offset_ms: number;
}

function parseTimingEntries(
  value: string,
  fieldName: string,
): [number, number][] {
  if (value.trim() === "") {
    return [];
  }

  return value.split(",").map((entry) => {
    const [rawBeat, rawValue] = entry.trim().split("=");
    const beat = Number(rawBeat);
    const parsedValue = Number(rawValue);

    if (
      rawBeat === undefined ||
      rawValue === undefined ||
      !Number.isFinite(beat) ||
      !Number.isFinite(parsedValue)
    ) {
      throw new Error(`Invalid ${fieldName} entry`);
    }

    return [beat, parsedValue];
  });
}

export function parseTiming(metadata: RawSMXTimingMetadata): SMXTiming {
  if (
    typeof metadata.timing_offset_ms !== "number" ||
    !Number.isFinite(metadata.timing_offset_ms)
  ) {
    throw new Error("Invalid timing offset");
  }

  const bpms = parseTimingEntries(metadata.timing_bpms, "timing_bpms")
    .map(([beat, bpm]) => {
      if (bpm <= 0) {
        throw new Error("BPM must be greater than zero");
      }

      return { beat, bpm };
    })
    .sort((first, second) => first.beat - second.beat);

  if (bpms.length === 0) {
    throw new Error("At least one BPM change is required");
  }

  const stops = parseTimingEntries(metadata.timing_stops, "timing_stops")
    .map(([beat, durationSeconds]) => {
      if (durationSeconds < 0) {
        throw new Error("Stop duration cannot be negative");
      }

      return { beat, durationSeconds };
    })
    .sort((first, second) => first.beat - second.beat);

  return {
    bpms,
    offsetSeconds: metadata.timing_offset_ms / 1000,
    stops,
  };
}

function bpmAtBeat(beat: number, bpms: BPMChange[]): number {
  let bpm = bpms[0].bpm;

  for (const change of bpms) {
    if (change.beat > beat) {
      break;
    }

    bpm = change.bpm;
  }

  return bpm;
}

function secondsBeforeBeat(beat: number, timing: SMXTiming): number {
  let seconds = 0;
  let segmentStart = 0;
  let bpm = bpmAtBeat(0, timing.bpms);

  for (const change of timing.bpms) {
    if (change.beat <= 0) {
      bpm = change.bpm;
      continue;
    }

    if (change.beat >= beat) {
      break;
    }

    seconds += ((change.beat - segmentStart) * 60) / bpm;
    segmentStart = change.beat;
    bpm = change.bpm;
  }

  seconds += ((beat - segmentStart) * 60) / bpm;
  return seconds;
}

function stopSecondsBeforeBeat(beat: number, timing: SMXTiming): number {
  return timing.stops
    .filter((stop) => stop.beat < beat)
    .reduce((total, stop) => total + stop.durationSeconds, 0);
}

function stopSecondsThroughBeat(beat: number, timing: SMXTiming): number {
  return timing.stops
    .filter((stop) => stop.beat <= beat)
    .reduce((total, stop) => total + stop.durationSeconds, 0);
}

export function beatToSeconds(beat: number, timing: SMXTiming): number {
  if (!Number.isFinite(beat)) {
    throw new Error("Beat must be finite");
  }

  return (
    timing.offsetSeconds +
    secondsBeforeBeat(beat, timing) +
    stopSecondsThroughBeat(beat, timing)
  );
}

export function secondsToBeat(seconds: number, timing: SMXTiming): number {
  if (!Number.isFinite(seconds)) {
    throw new Error("Seconds must be finite");
  }

  for (const stop of timing.stops) {
    const stopStart =
      timing.offsetSeconds +
      secondsBeforeBeat(stop.beat, timing) +
      stopSecondsBeforeBeat(stop.beat, timing);
    const stopEnd = stopStart + stop.durationSeconds;

    if (seconds >= stopStart && seconds <= stopEnd) {
      return stop.beat;
    }
  }

  let lowerBeat = Math.min(0, secondsBeforeBeat(0, timing));
  let upperBeat = Math.max(1, secondsBeforeBeat(0, timing) + 1);

  while (beatToSeconds(lowerBeat, timing) > seconds) {
    lowerBeat *= 2;
    if (lowerBeat === 0) {
      lowerBeat = -1;
    }
  }

  while (beatToSeconds(upperBeat, timing) < seconds) {
    upperBeat *= 2;
  }

  for (let iteration = 0; iteration < 60; iteration += 1) {
    const middleBeat = (lowerBeat + upperBeat) / 2;

    if (beatToSeconds(middleBeat, timing) <= seconds) {
      lowerBeat = middleBeat;
    } else {
      upperBeat = middleBeat;
    }
  }

  return (lowerBeat + upperBeat) / 2;
}
