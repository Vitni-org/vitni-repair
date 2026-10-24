import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { allowApiRequest, generateRepairGuide, parseRepairInput, requestTooLarge } from "@/lib/repair-ai";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  if (requestTooLarge(request)) return NextResponse.json({ error: "The request is too large. Choose a smaller photo." }, { status: 413 });
  if (!allowApiRequest(request, "repair-guide", 5, 60_000))
    return NextResponse.json({ error: "Too many repair requests. Wait a minute and try again." }, { status: 429 });
  try {
    const input = parseRepairInput(await request.json());
    const result = await generateRepairGuide(input);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json({ error: "Describe the issue in up to 1,000 characters and use a PNG, JPEG, or WebP photo." }, { status: 400 });
    console.error("Repair guide generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Repair guide generation failed. Please try again." },
      { status: 503 },
    );
  }
}
