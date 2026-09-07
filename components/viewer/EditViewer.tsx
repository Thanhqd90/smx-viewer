"use client";

import { useEffect, useRef, useState } from "react";

import ChartCanvas from "@/components/viewer/ChartCanvas";
import { formatPlaybackTime } from "@/lib/smx/playback";
import {
  clampScrollSpeed,
  clampVolume,
  DEFAULT_SCROLL_SPEED,
  DEFAULT_VOLUME,
  MAX_SCROLL_SPEED,
  MIN_SCROLL_SPEED,
  parseStoredMuted,
  parseStoredScrollSpeed,
  parseStoredVolume,
} from "@/lib/smx/preferences";
import { secondsToBeat } from "@/lib/smx/timing";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(14);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(DEFAULT_SCROLL_SPEED);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setVolume(parseStoredVolume(localStorage.getItem("smx-viewer.volume")));
        setMuted(parseStoredMuted(localStorage.getItem("smx-viewer.muted")));
        setScrollSpeed(
          parseStoredScrollSpeed(
            localStorage.getItem("smx-viewer.scrollSpeed"),
          ),
        );
      } catch {
        setVolume(DEFAULT_VOLUME);
        setMuted(false);
        setScrollSpeed(DEFAULT_SCROLL_SPEED);
      } finally {
        setPreferencesLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    try {
      localStorage.setItem("smx-viewer.volume", String(volume));
      localStorage.setItem("smx-viewer.muted", String(muted));
      localStorage.setItem("smx-viewer.scrollSpeed", String(scrollSpeed));
    } catch {
      // Browser storage can be unavailable; in-memory preferences still work.
    }
  }, [muted, preferencesLoaded, scrollSpeed, volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !chart) {
      return;
    }

    let frameId: number | null = null;

    const stopFrameLoop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const updateFromAudio = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      setCurrentBeat(secondsToBeat(time, chart.timing));

      if (!audio.paused && !audio.ended) {
        frameId = requestAnimationFrame(updateFromAudio);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      stopFrameLoop();
      frameId = requestAnimationFrame(updateFromAudio);
    };

    const handlePause = () => {
      stopFrameLoop();
      setIsPlaying(false);
    };

    const updateDuration = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const updateFromMedia = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      setCurrentBeat(secondsToBeat(time, chart.timing));
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("timeupdate", updateFromMedia);
    updateDuration();
    updateFromMedia();

    return () => {
      stopFrameLoop();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("timeupdate", updateFromMedia);
      audio.pause();
    };
  }, [chart]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !chart) {
      return;
    }

    audio.volume = clampVolume(volume);
    audio.muted = muted;
  }, [chart, muted, volume]);

  const handlePlay = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setError(null);
    void audio.play().catch(() => {
      setError("Audio could not be played.");
    });
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = clampVolume(Number(event.target.value));

    setVolume(nextVolume);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !muted;

    setMuted(nextMuted);

    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleScrollSpeedChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setScrollSpeed(clampScrollSpeed(Number(event.target.value)));
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;

    if (!audio || !chart || !Number.isFinite(audio.duration)) {
      return;
    }

    const requestedTime = Number(event.target.value);
    const nextTime = Math.min(Math.max(requestedTime, 0), audio.duration);

    audio.currentTime = nextTime;
    setCurrentTime(audio.currentTime);
    setCurrentBeat(secondsToBeat(audio.currentTime, chart.timing));
  };

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
        <div className="viewer-controls">
          <button type="button" onClick={handlePlay} disabled={isPlaying}>
            Play
          </button>
          <button type="button" onClick={handlePause} disabled={!isPlaying}>
            Pause
          </button>
          <span aria-live="polite">{currentTime.toFixed(2)} s</span>
        </div>
        <div className="timeline-control">
          <input
            aria-label="Seek through chart"
            type="range"
            min="0"
            max={duration}
            step="0.01"
            value={Math.min(currentTime, duration)}
            disabled={!duration}
            onChange={handleSeek}
          />
          <span aria-live="polite">
            {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
          </span>
        </div>
        <div className="preference-controls">
          <label>
            Volume
            <input
              aria-label="Volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
            />
            <span>{Math.round(volume * 100)}%</span>
          </label>
          <button type="button" onClick={handleMuteToggle}>
            {muted ? "Unmute" : "Mute"}
          </button>
          <label>
            Scroll Speed
            <input
              aria-label="Scroll speed"
              type="range"
              min={MIN_SCROLL_SPEED}
              max={MAX_SCROLL_SPEED}
              step="1"
              value={scrollSpeed}
              onChange={handleScrollSpeedChange}
            />
            <span>{scrollSpeed} px/beat</span>
          </label>
        </div>
        <audio ref={audioRef} src={chart.audioUrl} preload="auto" />
        <ChartCanvas
          chart={chart}
          currentBeat={currentBeat}
          pixelsPerBeat={scrollSpeed}
        />
      </section>
    </main>
  );
}
