export type SMXMode = "single" | "dual" | "full";

export type SMXNoteType = "tap" | "hold" | "mine";

export interface SMXNote {
  beat: number;
  lane: number;
  type: SMXNoteType;
  endBeat?: number;
  rawTimeMs?: number;
  rawLengthMs?: number;
}

import type { SMXTiming } from "./timing";

export interface PlayableSMXChart {
  id: number;
  displayId: string;

  title: string;
  subtitle?: string;
  artist: string;
  author: string;

  mode: SMXMode;
  meter: number;
  tracks: number;

  timing: SMXTiming;

  audioUrl: string;
  coverUrl?: string;

  notes: SMXNote[];
}

export type SMXChart = PlayableSMXChart;
