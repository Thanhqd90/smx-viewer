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

export interface BPMChange {
  beat: number;
  bpm: number;
}

export interface SMXChart {
  id: number;
  displayId: string;

  title: string;
  artist: string;
  author: string;

  mode: SMXMode;
  meter: number;
  tracks: number;

  timingOffsetMs: number;
  bpms: BPMChange[];

  audioUrl: string;
  coverUrl?: string;

  notes: SMXNote[];
}
