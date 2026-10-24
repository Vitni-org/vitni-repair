import { NextResponse } from "next/server";
import { getGuide } from "@/lib/guide-repository";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  try {
    const guide = await getGuide(slug);
    return guide
      ? NextResponse.json(
          { guide, persistent: guide.source !== "curated" },
          { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
        )
      : NextResponse.json({ error: "Guide not found." }, { status: 404 });
  } catch (error) {
    console.error(`Guide lookup failed for ${slug}:`, error);
    return NextResponse.json({ error: "This guide is temporarily unavailable." }, { status: 503 });
  }
}
