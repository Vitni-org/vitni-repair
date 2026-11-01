import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Workers expose the country on request.cf; the header is a fallback when the managed transform is enabled.
  const cloudflareCountry = (request as Request & { cf?: { country?: string } }).cf?.country;
  const candidate = (cloudflareCountry || request.headers.get("cf-ipcountry") || "").trim().toUpperCase();
  const countryCode = /^[A-Z]{2}$/.test(candidate) && candidate !== "XX" ? candidate : null;

  return NextResponse.json({ countryCode }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
