import { NextResponse } from "next/server";
import { allowApiRequest, retryGuideIllustration } from "@/lib/repair-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request, context: { params: Promise<{ slug: string; ordinal: string }> }) {
  const { slug, ordinal: rawOrdinal } = await context.params;
  const ordinal = Number(rawOrdinal);
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 5) return NextResponse.json({ error: "Invalid repair step." }, { status: 400 });
  if (!allowApiRequest(request, "illustration-retry", 8, 60_000))
    return NextResponse.json({ error: "Too many illustration retries. Try again in a minute." }, { status: 429 });
  const result = await retryGuideIllustration(slug, ordinal);
  return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
