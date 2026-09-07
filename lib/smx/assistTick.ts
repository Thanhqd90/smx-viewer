import type { SMXNote } from "./types";
import { beatToSeconds, type SMXTiming } from "./timing";

export interface AssistEvent {
  timeSeconds: number;
}

export const ASSIST_EVENT_EPSILON = 0.001;

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

export class AssistTickPlayer {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;

  async resume(): Promise<void> {
    const context = this.getContext();

    if (context && context.state === "suspended") {
      await context.resume();
    }
  }

  setVolume(volume: number): void {
    if (this.gain) {
      this.gain.gain.value = volume;
    }
  }

  play(): void {
    const context = this.getContext();

    if (!context || context.state !== "running") {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1100, startTime);
    gain.gain.setValueAtTime(1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.045);
    oscillator.connect(gain);
    gain.connect(this.gain ?? context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.05);
  }

  close(): void {
    if (this.context && this.context.state !== "closed") {
      void this.context.close();
    }

    this.context = null;
    this.gain = null;
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
    this.gain.gain.value = 1;
    this.gain.connect(this.context.destination);

    return this.context;
  }
}
