import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { createLlmsIndex } from "@/lib/llms-content";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) return new Response("Not found", { status: 404 });
  const body = await createLlmsIndex(requestedLocale as Locale, true);
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
