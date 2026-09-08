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
