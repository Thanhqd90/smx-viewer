const SMX_DATA_BASE = "https://data.stepmaniax.com";

export interface RawSMXSong {
  title: string;
  subtitle: string;
  artist: string;
  timing_bpms: string;
  timing_stops: string;
  timing_offset_ms: number;
  music: string;
  cover?: string;
}

export interface RawSMXChartResponse {
  success: boolean;
  chart: unknown;
  song: RawSMXSong;
  gamer: unknown;
  chart_data: {
    tracks: number;
    noteData: unknown[];
  };
}

export async function getRawChart(
  chartId: number,
): Promise<RawSMXChartResponse> {
  const response = await fetch(`${SMX_DATA_BASE}/chart/${chartId}/view`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiVersion: 6,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SMX API failed with ${response.status}`);
  }

  return response.json();
}
