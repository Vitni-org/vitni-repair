import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { allowApiRequest, illustrateRepair } from "@/lib/repair-ai";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  if (!allowApiRequest(request, "illustrate", 12, 60_000))
    return NextResponse.json({ error: "Too many illustration requests. Try again in a minute." }, { status: 429 });
  try {
    return NextResponse.json(await illustrateRepair(await request.json()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Provide a title and one to five repair steps." }, { status: 400 });
    console.error("Repair illustration failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not illustrate this guide." }, { status: 503 });
  }
}
