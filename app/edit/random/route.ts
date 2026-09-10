import { NextResponse } from "next/server";

import { getEditCatalog } from "@/lib/smx573/catalog";

export async function GET(request: Request) {
  const catalog = await getEditCatalog();

  if (catalog.length === 0) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const edit = catalog[Math.floor(Math.random() * catalog.length)];

  return NextResponse.redirect(
    new URL(`/edit/${encodeURIComponent(edit.displayId)}`, request.url),
  );
}
