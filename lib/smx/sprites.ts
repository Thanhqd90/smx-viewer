import type { BeatQuantization } from "./rendering";
import type { SMXMode } from "./types";

export const SPRITE_CELL_SIZE = 128;

export interface SpriteRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaneSprite {
  region: SpriteRegion;
  rotationDegrees: number;
}

export const SMX_ARROW_SHEET = {
  src: "/assets/smx/arrows.png",
  width: 1152,
  height: 1152,
} as const;

const QUANTIZATION_ROWS: Record<BeatQuantization, number> = {
  "4th": 0,
  "8th": 1,
  "12th": 2,
  "16th": 3,
  "24th": 4,
  "32nd": 5,
  "48th": 6,
  "64th": 7,
  // Row 8 is kept as a neutral fallback until its semantic role is confirmed.
  other: 8,
};

function cell(column: number, row: number): SpriteRegion {
  return {
    x: column * SPRITE_CELL_SIZE,
    y: row * SPRITE_CELL_SIZE,
    width: SPRITE_CELL_SIZE,
    height: SPRITE_CELL_SIZE,
  };
}

export function getQuantizationRow(quantization: BeatQuantization): number {
  return QUANTIZATION_ROWS[quantization];
}

export function getSingleLaneRotation(track: number): number | null {
  return [-90, 180, 0, 0, 90][track] ?? null;
}

// Mine icon: column 3, row 0 of arrows.png. Verified by pixel inspection —
// content bbox x[399,500] y[13,114], a circular target icon padded within
// the cell like the arrow heads. All other rows in column 3 are empty.
export const MINE_SPRITE: SpriteRegion = cell(3, 0);

// Mine Pit body: column 5 (x=640) of arrows.png. Verified by pixel
// inspection — a red/black hazard-stripe tapered bar, content bbox
// x[658,749] y[0,754]. Meant to be stretched to the pit's rendered height.
export const PIT_BODY_REGION: SpriteRegion = {
  x: 640,
  y: 0,
  width: SPRITE_CELL_SIZE,
  height: 755,
};

// Roll body: column 6 (x=768) of arrows.png. Verified by pixel inspection —
// a gold chevron-patterned tapered bar, content bbox x[788,875] y[0,826].
// Meant to be stretched to the roll's rendered height.
export const ROLL_BODY_REGION: SpriteRegion = {
  x: 768,
  y: 0,
  width: SPRITE_CELL_SIZE,
  height: 827,
};

export function getMineSprite(): LaneSprite {
  return {
    region: MINE_SPRITE,
    rotationDegrees: 0,
  };
}

export function getPitBodyRegion(): SpriteRegion {
  return PIT_BODY_REGION;
}

export function getRollBodyRegion(): SpriteRegion {
  return ROLL_BODY_REGION;
}

export function getNoteHeadSprite(
  track: number,
  mode: SMXMode,
  quantization: BeatQuantization,
): LaneSprite | null {
  if (mode === "dual") {
    return null;
  }

  const singleTrack = mode === "full" ? track % 5 : track;
  const rotationDegrees = getSingleLaneRotation(singleTrack);

  if (rotationDegrees === null) {
    return null;
  }

  const row = getQuantizationRow(quantization);
  const column = singleTrack === 2 ? 1 : 0;

  return {
    region: cell(column, row),
    rotationDegrees: column === 1 ? 0 : rotationDegrees,
  };
}
