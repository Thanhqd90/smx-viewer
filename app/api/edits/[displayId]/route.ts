import { getRawChart } from "@/lib/smx/api";
import { getEditByDisplayId } from "@/lib/smx573/api";
import { normalizePlayableChart } from "@/lib/smx/normalize";

interface RouteContext {
  params: Promise<{
    displayId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { displayId } = await context.params;
  const normalizedDisplayId = displayId.toUpperCase();

  try {
    const metadata = await getEditByDisplayId(normalizedDisplayId);

    if (!metadata) {
      return Response.json({ error: "Edit not found" }, { status: 404 });
    }

    const rawChart = await getRawChart(metadata.id);
    const normalized = normalizePlayableChart(metadata, rawChart);

    return Response.json({
      metadata,
      rawChart,
      normalized,
    });
  } catch (error) {
    console.error("Failed to fetch edit", {
      displayId: normalizedDisplayId,
      error,
    });

    return Response.json({ error: "Failed to fetch edit" }, { status: 502 });
  }
}
