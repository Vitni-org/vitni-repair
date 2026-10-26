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

const partnerInbox = "miki.lombi+vitni@gmail.com";
const partnerTypeLabel = {
  local_repair: "Local repairer or repair shop",
  repair_cafe: "Repair café or community workshop",
  parts_retailer: "Parts retailer or marketplace",
  brand: "Product brand or manufacturer",
  other: "Other community or partnership idea",
} as const;

async function emailPartnerInquiry(input: z.infer<typeof inquirySchema>, website: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.PARTNER_INQUIRY_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;

  const subject = "New Vitni partnership enquiry";
  const text = [
    "New partnership enquiry for Vitni",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Partner type: ${partnerTypeLabel[input.partnerType]}`,
    `Organization: ${input.organization || "Not provided"}`,
    `City or service area: ${input.city || "Not provided"}`,
    `Website: ${website || "Not provided"}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [partnerInbox], reply_to: input.email, subject, text }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    console.error(`Partner enquiry email provider returned HTTP ${response.status}.`);
    return false;
  }
  return true;
}

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

    let saved = false;
    try {
      await savePartnerInquiry({
        name: input.name,
        email: input.email.toLowerCase(),
        partnerType: input.partnerType,
        organization: input.organization,
        city: input.city,
        website,
        message: input.message,
      });
      saved = true;
    } catch (error) {
      // Keep email delivery available if the partner table is missing or the database is temporarily unavailable.
      console.error("Partner enquiry could not be saved.", error instanceof Error ? error.message : "Unknown database error");
    }

    const emailSent = await emailPartnerInquiry(input, website).catch((error) => {
      console.error("Partner enquiry email delivery failed.", error instanceof Error ? error.message : "Unknown email error");
      return false;
    });

    if (!saved && emailSent) {
      return NextResponse.json(
        {
          ok: true,
          saved: false,
          emailSent: true,
          message: "Your enquiry was emailed to the Vitni team, but could not be added to the shared enquiry list.",
        },
        { status: 202, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!saved && !emailSent) {
      return NextResponse.json(
        { error: "We couldn't save or email your enquiry. Please email the Vitni team directly." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!emailSent) {
      return NextResponse.json(
        {
          ok: true,
          saved: true,
          emailSent: false,
          error: "Your enquiry was saved, but the email notification could not be sent. Please email the Vitni team directly to make sure we see it.",
        },
        { status: 202, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, saved: true, emailSent: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json({ error: "Check the required fields and try again." }, { status: 400 });
    console.error("Partner enquiry request failed.", error instanceof Error ? error.message : "Unknown request error");
    return NextResponse.json({ error: "The partner inbox is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
