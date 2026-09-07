const EDITS_HOST = "edits.stepmaniax.com";

function extractEditIdentifier(input: string): string | null {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      const url = new URL(input);

      if (url.hostname !== EDITS_HOST || url.search || url.hash) {
        return null;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      return segments.length === 1 ? segments[0] : null;
    } catch {
      return null;
    }
  }

  return input;
}

export function normalizeEditInput(input: string): string | null {
  const candidate = extractEditIdentifier(input.trim());

  if (
    !candidate ||
    candidate.length > 64 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(candidate)
  ) {
    return null;
  }

  return candidate.toUpperCase();
}
