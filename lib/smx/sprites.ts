export interface SpriteRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SMX_ARROW_SHEET = {
  src: "/assets/arrows.png",
  width: 1152,
  height: 1152,
  cellSize: 128,
} as const;

// The official atlas is available, but semantic crop coordinates are not yet verified.
export const VERIFIED_SPRITE_REGIONS: Record<string, SpriteRegion> = {};
