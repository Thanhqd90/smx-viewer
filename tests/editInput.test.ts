import { describe, expect, it } from "vitest";

import { normalizeEditInput } from "../lib/smx/editInput";

describe("normalizeEditInput", () => {
  it.each([
    ["2P6-239", "2P6-239"],
    ["2p6-239", "2P6-239"],
    ["  2P6-239  ", "2P6-239"],
    ["https://edits.stepmaniax.com/2P6-239", "2P6-239"],
    ["https://edits.stepmaniax.com/2P6-239/", "2P6-239"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeEditInput(input)).toBe(expected);
  });

  it.each(["", "https://example.com/2P6-239", "not an edit"])(
    "rejects %s",
    (input) => {
      expect(normalizeEditInput(input)).toBeNull();
    },
  );
});
