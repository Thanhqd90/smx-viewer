import type { RawSMXChartResponse } from "./api";
import { parseNoteData } from "./parser";
import { parseTiming } from "./timing";
import type { PlayableSMXChart } from "./types";
import type { EditChart573 } from "../smx573/types";

const SMX_DATA_BASE = "https://data.stepmaniax.com/";

function assetUrl(path: string): string {
  return new URL(path, SMX_DATA_BASE).toString();
}

export function normalizePlayableChart(
  metadata: EditChart573,
  rawChart: RawSMXChartResponse,
): PlayableSMXChart {
  const song = rawChart.song;

  return {
    id: metadata.id,
    displayId: metadata.edit_display_id,
    title: song.title,
    subtitle: song.subtitle || undefined,
    artist: song.artist,
    author: metadata.edit_author,
    mode: metadata.edit_style,
    meter: metadata.meter,
    tracks: rawChart.chart_data.tracks,
    notes: parseNoteData(rawChart.chart_data.noteData),
    timing: parseTiming({
      timing_bpms: song.timing_bpms,
      timing_stops: song.timing_stops,
      timing_offset_ms: song.timing_offset_ms,
    }),
    audioUrl: assetUrl(song.music),
    ...(song.cover ? { coverUrl: assetUrl(song.cover) } : {}),
  };
}
