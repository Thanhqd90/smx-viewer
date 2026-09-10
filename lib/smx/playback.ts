export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function applyViewerOffset(seconds: number, offsetMs: number): number {
  // Positive calibration delays the chart visually; Assist Tick never uses this helper.
  return seconds - offsetMs / 1000;
}

export interface MeasureBeat {
  measure: number;
  beatInMeasure: number;
}

// SM/SSC charts are always 4 quarter-note beats per measure regardless of
// time signature notation, so this isn't chart-specific data to look up.
export function getMeasureBeat(
  beat: number,
  beatsPerMeasure = 4,
): MeasureBeat {
  if (!Number.isFinite(beat)) {
    return { measure: 1, beatInMeasure: 1 };
  }

  const measureIndex = Math.floor(beat / beatsPerMeasure);
  const beatIndex = Math.floor(beat) - measureIndex * beatsPerMeasure;

  return { measure: measureIndex + 1, beatInMeasure: beatIndex + 1 };
}
