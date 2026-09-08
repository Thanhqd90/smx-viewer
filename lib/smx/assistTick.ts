import type { SMXNote } from "./types";
import { beatToSeconds, type SMXTiming } from "./timing";

export interface AssistEvent {
  timeSeconds: number;
}

export const ASSIST_EVENT_EPSILON = 0.001;
export const ASSIST_SCHEDULE_LOOKAHEAD_SECONDS = 0.04;

export function deriveAssistEvents(
  notes: SMXNote[],
  timing: SMXTiming,
  tolerance = ASSIST_EVENT_EPSILON,
): AssistEvent[] {
  const timestamps = notes
    .map((note) => beatToSeconds(note.beat, timing))
    .filter(Number.isFinite)
    .sort((first, second) => first - second);
  const events: AssistEvent[] = [];

  for (const timestamp of timestamps) {
    const previous = events[events.length - 1];

    if (!previous || timestamp - previous.timeSeconds > tolerance) {
      events.push({ timeSeconds: timestamp });
    }
  }

  return events;
}

export function getCrossedAssistEvents(
  events: AssistEvent[],
  previousTime: number,
  currentTime: number,
  tolerance = ASSIST_EVENT_EPSILON,
): AssistEvent[] {
  if (
    !Number.isFinite(previousTime) ||
    !Number.isFinite(currentTime) ||
    currentTime < previousTime - tolerance
  ) {
    return [];
  }

  return events.filter(
    (event) =>
      event.timeSeconds > previousTime + tolerance &&
      event.timeSeconds <= currentTime + tolerance,
  );
}

export function getAssistEventsBetween(
  events: AssistEvent[],
  startTime: number,
  endTime: number,
  tolerance = ASSIST_EVENT_EPSILON,
): AssistEvent[] {
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return [];
  }

  return events.filter(
    (event) =>
      event.timeSeconds > startTime + tolerance &&
      event.timeSeconds <= endTime + tolerance,
  );
}

export class AssistTickPlayer {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loadPromise: Promise<void> | null = null;
  private volume = 0.3;
  private sources = new Set<AudioBufferSourceNode>();

  async resume(): Promise<void> {
    const context = this.getContext();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    await this.loadBuffer(context);
  }

  setVolume(volume: number): void {
    this.volume = volume;

    if (this.gain) {
      this.gain.gain.value = volume;
    }
  }

  play(delaySeconds = 0): void {
    const context = this.getContext();

    if (!context || !this.buffer || context.state !== "running") {
      return;
    }

    const source = context.createBufferSource();
    const startTime = context.currentTime;

    source.buffer = this.buffer;
    source.connect(this.gain ?? context.destination);
    this.sources.add(source);
    source.addEventListener("ended", () => this.sources.delete(source), {
      once: true,
    });
    source.start(startTime + Math.max(0, delaySeconds));
  }

  stop(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // The source may already have ended.
      }
    }

    this.sources.clear();
  }

  close(): void {
    if (this.context && this.context.state !== "closed") {
      void this.context.close();
    }

    this.context = null;
    this.gain = null;
    this.buffer = null;
    this.loadPromise = null;
    this.sources.clear();
  }

  private getContext(): AudioContext | null {
    if (this.context || typeof window === "undefined") {
      return this.context;
    }

    const AudioContextConstructor = window.AudioContext;

    if (!AudioContextConstructor) {
      return null;
    }

    this.context = new AudioContextConstructor();
    this.gain = this.context.createGain();
    this.gain.gain.value = this.volume;
    this.gain.connect(this.context.destination);

    return this.context;
  }

  private loadBuffer(context: AudioContext): Promise<void> {
    if (this.buffer) {
      return Promise.resolve();
    }

    if (!this.loadPromise) {
      this.loadPromise = fetch("/assets/smx/Tick.mp3")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Assist Tick asset failed with ${response.status}`);
          }

          return response.arrayBuffer();
        })
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => {
          this.buffer = buffer;
        })
        .catch((error: unknown) => {
          this.loadPromise = null;
          console.error("Failed to load Assist Tick asset", error);
        });
    }

    return this.loadPromise;
  }
}
