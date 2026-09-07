import type { SMXNote } from "./types";

type Fraction = [number, number];

interface RawNote {
  track: number;
  beat: Fraction;
  len?: Fraction;
  time?: number;
  slen?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFraction(value: unknown, fieldName: string): Fraction {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every((part) => typeof part === "number" && Number.isFinite(part)) ||
    value[1] === 0
  ) {
    throw new Error(`Invalid ${fieldName} fraction`);
  }

  return [value[0], value[1]];
}

function readNumber(
  record: Record<string, unknown>,
  fieldName: string,
): number | undefined {
  const value = record[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return value;
}

function readRawNote(value: unknown, index: number): RawNote {
  if (!isRecord(value)) {
    throw new Error(`Invalid note at index ${index}`);
  }

  const track = value.track;

  if (typeof track !== "number" || !Number.isInteger(track)) {
    throw new Error(`Invalid track at index ${index}`);
  }

  const note: RawNote = {
    track,
    beat: readFraction(value.beat, "beat"),
  };
  const len = value.len;

  if (len !== undefined) {
    note.len = readFraction(len, "len");
  }

  note.time = readNumber(value, "time");
  note.slen = readNumber(value, "slen");

  return note;
}

export function parseNoteData(noteData: unknown[]): SMXNote[] {
  let absoluteBeat = 0;
  const notes: SMXNote[] = [];

  for (const [index, value] of noteData.entries()) {
    if (index === 0) {
      continue;
    }

    const rawNote = readRawNote(value, index);
    const [beatNumerator, beatDenominator] = rawNote.beat;
    const beatDelta = beatNumerator / beatDenominator;
    const beat = absoluteBeat + beatDelta;

    if (rawNote.len) {
      const [lengthNumerator, lengthDenominator] = rawNote.len;
      const endBeat = beat + lengthNumerator / lengthDenominator;

      notes.push({
        beat,
        endBeat,
        lane: rawNote.track,
        type: "hold",
        rawLengthMs: rawNote.slen,
        rawTimeMs: rawNote.time,
      });
    } else {
      notes.push({
        beat,
        lane: rawNote.track,
        type: "tap",
        rawTimeMs: rawNote.time,
      });
    }

    absoluteBeat = beat;
  }

  return notes;
}
