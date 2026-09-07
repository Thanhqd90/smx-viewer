export const DEFAULT_VOLUME = 0.5;
export const DEFAULT_SCROLL_SPEED = 80;
export const MIN_SCROLL_SPEED = 40;
export const MAX_SCROLL_SPEED = 200;

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(Math.max(value, 0), 1);
}

export function parseStoredVolume(value: string | null): number {
  if (value === null) {
    return DEFAULT_VOLUME;
  }

  return clampVolume(Number(value));
}

export function parseStoredMuted(value: string | null): boolean {
  return value === "true";
}

export function clampScrollSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SCROLL_SPEED;
  }

  return Math.min(Math.max(value, MIN_SCROLL_SPEED), MAX_SCROLL_SPEED);
}

export function parseStoredScrollSpeed(value: string | null): number {
  if (value === null) {
    return DEFAULT_SCROLL_SPEED;
  }

  return clampScrollSpeed(Number(value));
}
