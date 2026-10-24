import { NextResponse } from "next/server";
import { getFeaturedRepairs } from "@/lib/guide-repository";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getFeaturedRepairs(), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
