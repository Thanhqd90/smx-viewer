import type { SMXMode, SMXNote } from "./types";

export const PIXELS_PER_BEAT = 80;
export const NOTE_FIELD_WIDTH_RATIO = 0.96;
export const NOTE_FIELD_LANE_GAP = 0;
export const SINGLE_FIELD_WIDTH_RATIO = 0.55;
export const SINGLE_LANE_GAP = 0;
export const SINGLE_NOTE_SCALE = 0.8;
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

export interface LaneGeometry {
  left: number;
  laneWidth: number;
  gap: number;
}

export function getLaneGeometry(
  width: number,
  tracks: number,
  mode: SMXMode = tracks === 5 ? "single" : "full",
): LaneGeometry {
  const isSingle = mode === "single";
  const fieldWidth =
    width * (isSingle ? SINGLE_FIELD_WIDTH_RATIO : NOTE_FIELD_WIDTH_RATIO);
  const gap = isSingle ? SINGLE_LANE_GAP : NOTE_FIELD_LANE_GAP;
  const left = (width - fieldWidth) / 2;
  const laneWidth = (fieldWidth - gap * (tracks - 1)) / tracks;

  return { left, laneWidth, gap };
}

export function laneCenterX(geometry: LaneGeometry, lane: number): number {
  return (
    geometry.left +
    lane * (geometry.laneWidth + geometry.gap) +
    geometry.laneWidth / 2
  );
}

export interface HoldGeometry {
  top: number;
  bodyHeight: number;
  tailY: number;
  tailRadius: number;
}

export function getHoldGeometry(
  startY: number,
  endY: number,
  noteSize: number,
): HoldGeometry {
  return {
    top: Math.min(startY, endY),
    bodyHeight: Math.max(1, Math.abs(endY - startY)),
    tailY: endY,
    tailRadius: Math.max(5, noteSize * 0.18),
  };
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
