import type { SMXNote } from "./types";

export const PIXELS_PER_BEAT = 80;

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
