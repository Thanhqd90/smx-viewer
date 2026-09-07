import type { EditChart573 } from "./types";

const API_BASE = "https://api.smx.573.no";

export async function getEditByDisplayId(
  displayId: string,
): Promise<EditChart573 | null> {
  const query = encodeURIComponent(
    JSON.stringify({
      edit_display_id: displayId,
    }),
  );

  const response = await fetch(`${API_BASE}/charts?q=${query}`, {
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    throw new Error(`573 API failed with ${response.status}`);
  }

  const charts = (await response.json()) as EditChart573[];

  return charts[0] ?? null;
}
