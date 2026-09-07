"use client";

import { useEffect, useState } from "react";

import ChartCanvas from "@/components/viewer/ChartCanvas";
import type { PlayableSMXChart } from "@/lib/smx/types";

interface EditViewerProps {
  displayId: string;
}

interface EditResponse {
  normalized: PlayableSMXChart;
}

export default function EditViewer({ displayId }: EditViewerProps) {
  const [chart, setChart] = useState<PlayableSMXChart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadChart = async () => {
      try {
        const response = await fetch(
          `/api/edits/${encodeURIComponent(displayId)}`,
          {
            signal: controller.signal,
          },
        );

        if (response.status === 404) {
          setError("Edit not found.");
          return;
        }

        if (!response.ok) {
          throw new Error("The edit could not be loaded.");
        }

        const data = (await response.json()) as EditResponse;
        setChart(data.normalized);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setError("The edit could not be loaded.");
      }
    };

    void loadChart();

    return () => controller.abort();
  }, [displayId]);

  if (error) {
    return (
      <main className="edit-state">
        <p className="eyebrow">SMX VIEWER</p>
        <h1>{error}</h1>
        <p>Check the edit display ID and try again.</p>
      </main>
    );
  }

  if (!chart) {
    return (
      <main className="edit-state">
        <p className="eyebrow">SMX VIEWER</p>
        <h1>Loading chart...</h1>
      </main>
    );
  }

  return (
    <main className="viewer-page">
      <header className="viewer-header">
        <div>
          <p className="eyebrow">{chart.displayId} / STATIC PREVIEW</p>
          <h1>{chart.title}</h1>
          {chart.subtitle && <p className="subtitle">{chart.subtitle}</p>}
          <p className="artist">{chart.artist}</p>
        </div>
        <dl className="chart-meta">
          <div>
            <dt>Author</dt>
            <dd>{chart.author}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{chart.mode}</dd>
          </div>
          <div>
            <dt>Meter</dt>
            <dd>{chart.meter}</dd>
          </div>
          <div>
            <dt>Tracks</dt>
            <dd>{chart.tracks}</dd>
          </div>
        </dl>
      </header>
      <section className="chart-panel" aria-label="Static chart preview">
        <ChartCanvas chart={chart} currentBeat={14} />
      </section>
    </main>
  );
}
