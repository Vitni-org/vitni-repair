import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { allowApiRequest } from "@/lib/repair-ai";
import { savePartnerInquiry } from "../../../../guide-store.mjs";

export const runtime = "nodejs";

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  partnerType: z.enum(["local_repair", "repair_cafe", "parts_retailer", "brand", "other"]),
  organization: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  website: z.string().trim().max(300).optional().default(""),
  message: z.string().trim().min(10).max(2000),
  consent: z.union([z.literal("true"), z.literal(true)]),
  company_website: z.string().max(300).optional().default(""),
}).strict();

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 16_000)
    return NextResponse.json({ error: "The enquiry is too large. Please shorten your message." }, { status: 413 });
  if (!allowApiRequest(request, "partner-inquiries", 3, 60 * 60_000))
    return NextResponse.json({ error: "Too many enquiries from this connection. Please try again later." }, { status: 429 });

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_000)
      return NextResponse.json({ error: "The enquiry is too large. Please shorten your message." }, { status: 413 });
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "This enquiry could not be read. Please check the form and try again." }, { status: 400 });
    }
    const input = inquirySchema.parse(payload);
    if (input.company_website) return NextResponse.json({ ok: true });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ error: "The partner form is not connected yet. Please try again later." }, { status: 503 });

    let website = "";
    if (input.website) {
      const candidate = /^https?:\/\//i.test(input.website) ? input.website : `https://${input.website}`;
      try {
        const url = new URL(candidate);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("invalid protocol");
        website = url.href;
      } catch {
        return NextResponse.json({ error: "Add a valid website link or leave the field blank." }, { status: 400 });
      }
    }

    await savePartnerInquiry({
      name: input.name,
      email: input.email.toLowerCase(),
      partnerType: input.partnerType,
      organization: input.organization,
      city: input.city,
      website,
      message: input.message,
    });
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json({ error: "Check the required fields and try again." }, { status: 400 });
    console.error("Partner enquiry could not be saved.", error);
    return NextResponse.json({ error: "The partner inbox is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
