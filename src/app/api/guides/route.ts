import { NextResponse } from "next/server";
import { searchGuides } from "@/lib/guide-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const result = await searchGuides({
      query: params.get("q") || "",
      area: params.get("area") || "All",
      sector: params.get("sector") || "All",
      limit: params.get("limit") || 6,
      cursor: params.get("cursor") || null,
      locale: params.get("locale") === "fr" ? "fr" : "en",
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Guide library query failed:", error);
    return NextResponse.json({ error: "The guide library is temporarily unavailable." }, { status: 503 });
  }
}
