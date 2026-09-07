import type { SMXNote } from "./types";

export const PIXELS_PER_BEAT = 80;
export const QUANTIZATION_EPSILON = 0.0001;

export type BeatQuantization =
  | "4th"
  | "8th"
  | "12th"
  | "16th"
  | "24th"
  | "32nd"
  | "48th"
  | "64th"
  | "other";

const QUANTIZATION_GRIDS: readonly [BeatQuantization, number][] = [
  ["4th", 1],
  ["8th", 2],
  ["12th", 3],
  ["16th", 4],
  ["24th", 6],
  ["32nd", 8],
  ["48th", 12],
  ["64th", 16],
];

// This palette is intentionally local so it can be replaced if official SMX colors are established.
export const QUANTIZATION_COLORS: Record<BeatQuantization, string> = {
  "4th": "#f4c95d",
  "8th": "#64b5f6",
  "12th": "#b39ddb",
  "16th": "#81c784",
  "24th": "#ffb74d",
  "32nd": "#ef5350",
  "48th": "#26c6da",
  "64th": "#ec407a",
  other: "#b0bec5",
};

export function getBeatQuantization(beat: number): BeatQuantization {
  if (!Number.isFinite(beat)) {
    return "other";
  }

  const fractionalBeat = beat - Math.floor(beat);

  for (const [quantization, subdivisions] of QUANTIZATION_GRIDS) {
    const nearestGridPosition = Math.round(fractionalBeat * subdivisions);
    const nearestGridBeat = nearestGridPosition / subdivisions;

    if (Math.abs(fractionalBeat - nearestGridBeat) <= QUANTIZATION_EPSILON) {
      return quantization;
    }
  }

  return "other";
}

export function laneX(width: number, tracks: number, lane: number): number {
  return ((lane + 0.5) / tracks) * width;
}

export function beatToY(
  beat: number,
  currentBeat: number,
  receptorY: number,
  pixelsPerBeat = PIXELS_PER_BEAT,
): number {
  return receptorY + (beat - currentBeat) * pixelsPerBeat;
}

export function isNoteVisible(
  note: SMXNote,
  currentBeat: number,
  viewportHeight: number,
  receptorY: number,
  pixelsPerBeat = PIXELS_PER_BEAT,
): boolean {
  const startY = beatToY(note.beat, currentBeat, receptorY, pixelsPerBeat);
  const endY =
    note.endBeat === undefined
      ? startY
      : beatToY(note.endBeat, currentBeat, receptorY, pixelsPerBeat);
  const top = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  return bottom >= 0 && top <= viewportHeight;
}
