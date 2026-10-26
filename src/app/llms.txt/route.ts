import { createLlmsIndex } from "@/lib/llms-content";

export const runtime = "nodejs";

export async function GET() {
  const body = await createLlmsIndex("en");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
