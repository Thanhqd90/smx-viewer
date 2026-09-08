"use client";

import { useEffect, useRef, useState } from "react";

import ChartCanvas from "@/components/viewer/ChartCanvas";
import {
  AssistTickPlayer,
  deriveAssistEvents,
  getCrossedAssistEvents,
} from "@/lib/smx/assistTick";
import { applyViewerOffset, formatPlaybackTime } from "@/lib/smx/playback";
import {
  clampAssistTickVolume,
  clampScrollSpeed,
  clampVolume,
  clampViewerOffsetMs,
  DEFAULT_ASSIST_TICK_VOLUME,
  DEFAULT_SCROLL_SPEED,
  DEFAULT_VOLUME,
  DEFAULT_VIEWER_OFFSET_MS,
  MAX_SCROLL_SPEED,
  MIN_SCROLL_SPEED,
  parseStoredMuted,
  parseStoredAssistTick,
  parseStoredAssistTickVolume,
  parseStoredViewerOffsetMs,
  parseStoredScrollSpeed,
  parseStoredVolume,
  DEFAULT_PLAYBACK_RATE,
  PLAYBACK_RATES,
  parseStoredPlaybackRate,
} from "@/lib/smx/preferences";
import { secondsToBeat } from "@/lib/smx/timing";
import type { PlayableSMXChart } from "@/lib/smx/types";

interface EditViewerProps {
  displayId: string;
}

interface EditResponse {
  normalized: PlayableSMXChart;
}

function ensureAssistTickPlayer(
  playerRef: { current: AssistTickPlayer | null },
  volume: number,
): AssistTickPlayer {
  if (!playerRef.current) {
    playerRef.current = new AssistTickPlayer();
    playerRef.current.setVolume(volume);
  }

  return playerRef.current;
}

function closeAssistTickPlayer(playerRef: {
  current: AssistTickPlayer | null;
}): void {
  playerRef.current?.close();
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
  const [playbackRate, setPlaybackRate] = useState(DEFAULT_PLAYBACK_RATE);
  const [assistTickEnabled, setAssistTickEnabled] = useState(false);
  const [assistTickVolume, setAssistTickVolume] = useState(
    DEFAULT_ASSIST_TICK_VOLUME,
  );
  const [viewerOffsetMs, setViewerOffsetMs] = useState(
    DEFAULT_VIEWER_OFFSET_MS,
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const assistEventsRef = useRef<ReturnType<typeof deriveAssistEvents>>([]);
  const previousAudioTimeRef = useRef(0);
  const assistTickEnabledRef = useRef(false);
  const assistTickVolumeRef = useRef(DEFAULT_ASSIST_TICK_VOLUME);
  const assistTickPlayerRef = useRef<AssistTickPlayer | null>(null);
  const viewerOffsetMsRef = useRef(DEFAULT_VIEWER_OFFSET_MS);

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
        setPlaybackRate(
          parseStoredPlaybackRate(
            localStorage.getItem("smx-viewer.playbackRate"),
          ),
        );
        setAssistTickEnabled(
          parseStoredAssistTick(localStorage.getItem("smx-viewer.assistTick")),
        );
        setAssistTickVolume(
          parseStoredAssistTickVolume(
            localStorage.getItem("smx-viewer.assistTickVolume"),
          ),
        );
        setViewerOffsetMs(
          parseStoredViewerOffsetMs(
            localStorage.getItem("smx-viewer.syncOffsetMs"),
          ),
        );
      } catch {
        setVolume(DEFAULT_VOLUME);
        setMuted(false);
        setScrollSpeed(DEFAULT_SCROLL_SPEED);
        setPlaybackRate(DEFAULT_PLAYBACK_RATE);
        setAssistTickEnabled(false);
        setAssistTickVolume(DEFAULT_ASSIST_TICK_VOLUME);
        setViewerOffsetMs(DEFAULT_VIEWER_OFFSET_MS);
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
      localStorage.setItem("smx-viewer.playbackRate", String(playbackRate));
      localStorage.setItem("smx-viewer.assistTick", String(assistTickEnabled));
      localStorage.setItem(
        "smx-viewer.assistTickVolume",
        String(assistTickVolume),
      );
      localStorage.setItem("smx-viewer.syncOffsetMs", String(viewerOffsetMs));
    } catch {
      // Browser storage can be unavailable; in-memory preferences still work.
    }
  }, [
    assistTickEnabled,
    assistTickVolume,
    muted,
    playbackRate,
    preferencesLoaded,
    scrollSpeed,
    volume,
    viewerOffsetMs,
  ]);

  useEffect(() => {
    assistTickEnabledRef.current = assistTickEnabled;
    assistTickVolumeRef.current = assistTickVolume;
    assistTickPlayerRef.current?.setVolume(assistTickVolume);
  }, [assistTickEnabled, assistTickVolume]);

  useEffect(() => {
    viewerOffsetMsRef.current = viewerOffsetMs;
  }, [viewerOffsetMs]);

  useEffect(() => {
    assistEventsRef.current = chart
      ? deriveAssistEvents(chart.notes, chart.timing)
      : [];
    previousAudioTimeRef.current = audioRef.current?.currentTime ?? 0;
  }, [chart]);

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

      if (assistTickEnabledRef.current) {
        const crossedEvents = getCrossedAssistEvents(
          assistEventsRef.current,
          previousAudioTimeRef.current,
          time,
        );
        const player = assistTickPlayerRef.current;

        if (player) {
          for (let index = 0; index < crossedEvents.length; index += 1) {
            player.play();
          }
        }
      }

      previousAudioTimeRef.current = time;
      setCurrentTime(time);
      setCurrentBeat(
        secondsToBeat(
          applyViewerOffset(time, viewerOffsetMsRef.current),
          chart.timing,
        ),
      );

      if (!audio.paused && !audio.ended) {
        frameId = requestAnimationFrame(updateFromAudio);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      previousAudioTimeRef.current = audio.currentTime;

      if (assistTickEnabledRef.current) {
        const player = ensureAssistTickPlayer(
          assistTickPlayerRef,
          assistTickVolumeRef.current,
        );
        void player.resume();
      }

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
      setCurrentBeat(
        secondsToBeat(
          applyViewerOffset(time, viewerOffsetMsRef.current),
          chart.timing,
        ),
      );
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
    return () => closeAssistTickPlayer(assistTickPlayerRef);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !chart) {
      return;
    }

    audio.volume = clampVolume(volume);
    audio.muted = muted;
    audio.playbackRate = playbackRate;
  }, [chart, muted, playbackRate, volume]);

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

  const handlePlaybackRateChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextRate = parseStoredPlaybackRate(event.target.value);

    setPlaybackRate(nextRate);

    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;

    if (!audio || !chart || !Number.isFinite(audio.duration)) {
      return;
    }

    const requestedTime = Number(event.target.value);
    const nextTime = Math.min(Math.max(requestedTime, 0), audio.duration);

    audio.currentTime = nextTime;
    previousAudioTimeRef.current = nextTime;
    setCurrentTime(audio.currentTime);
    setCurrentBeat(
      secondsToBeat(
        applyViewerOffset(audio.currentTime, viewerOffsetMs),
        chart.timing,
      ),
    );
  };

  const handleViewerOffsetChange = (nextOffsetMs: number) => {
    const clampedOffsetMs = clampViewerOffsetMs(nextOffsetMs);

    setViewerOffsetMs(clampedOffsetMs);

    if (audioRef.current && chart) {
      setCurrentBeat(
        secondsToBeat(
          applyViewerOffset(audioRef.current.currentTime, clampedOffsetMs),
          chart.timing,
        ),
      );
    }
  };

  const handleAssistTickToggle = () => {
    const nextEnabled = !assistTickEnabled;

    setAssistTickEnabled(nextEnabled);
    assistTickEnabledRef.current = nextEnabled;

    if (nextEnabled) {
      void ensureAssistTickPlayer(
        assistTickPlayerRef,
        assistTickVolumeRef.current,
      ).resume();
    }
  };

  const handleAssistTickVolumeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextVolume = clampAssistTickVolume(Number(event.target.value));

    setAssistTickVolume(nextVolume);
    assistTickVolumeRef.current = nextVolume;
    ensureAssistTickPlayer(assistTickPlayerRef, nextVolume).setVolume(
      nextVolume,
    );
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
          <label>
            Playback Rate
            <select
              aria-label="Playback rate"
              value={playbackRate}
              onChange={handlePlaybackRateChange}
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleAssistTickToggle}>
            Assist Tick: {assistTickEnabled ? "On" : "Off"}
          </button>
          <label>
            Assist Volume
            <input
              aria-label="Assist Tick volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={assistTickVolume}
              onChange={handleAssistTickVolumeChange}
            />
            <span>{Math.round(assistTickVolume * 100)}%</span>
          </label>
          <div className="sync-offset-control">
            <span>Sync Offset</span>
            <button
              type="button"
              onClick={() => handleViewerOffsetChange(viewerOffsetMs - 10)}
            >
              -10 ms
            </button>
            <output>{viewerOffsetMs} ms</output>
            <button
              type="button"
              onClick={() => handleViewerOffsetChange(viewerOffsetMs + 10)}
            >
              +10 ms
            </button>
            <input
              aria-label="Sync offset"
              type="range"
              min="-250"
              max="250"
              step="1"
              value={viewerOffsetMs}
              onChange={(event) =>
                handleViewerOffsetChange(Number(event.target.value))
              }
            />
            <button
              type="button"
              onClick={() => handleViewerOffsetChange(DEFAULT_VIEWER_OFFSET_MS)}
            >
              Reset
            </button>
          </div>
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
