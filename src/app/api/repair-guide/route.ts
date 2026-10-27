import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { allowApiRequest, generateRepairGuide, parseRepairInput, requestTooLarge } from "@/lib/repair-ai";
import { getPaddleCreditConfig, hashWalletToken, isWalletToken, reserveRepairCredit, settleRepairCredit } from "@/lib/repair-credits";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  if (requestTooLarge(request)) return NextResponse.json({ error: "The request is too large. Choose a smaller photo." }, { status: 413 });
  if (!allowApiRequest(request, "repair-guide", 5, 60_000))
    return NextResponse.json({ error: "Too many repair requests. Wait a minute and try again." }, { status: 429 });
  let reservationId: string | null = null;
  try {
    const input = parseRepairInput(await request.json());
    if (getPaddleCreditConfig()) {
      const token = (request.headers.get("cookie") || "")
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("vitni_credit_wallet="))
        ?.slice("vitni_credit_wallet=".length);
      if (!isWalletToken(token))
        return NextResponse.json({ error: "A repair credit is needed to create a custom guide." }, { status: 402 });
      reservationId = randomUUID();
      const reserved = await reserveRepairCredit(hashWalletToken(token), reservationId);
      if (!reserved) {
        reservationId = null;
        return NextResponse.json({ error: "A repair credit is needed to create a custom guide." }, { status: 402 });
      }
    }
    const result = await generateRepairGuide(input);
    if (reservationId) await settleRepairCredit(reservationId, true);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (reservationId) await settleRepairCredit(reservationId, false).catch(() => undefined);
    if (error instanceof ZodError)
      return NextResponse.json({ error: "Describe the issue in up to 1,000 characters and use a PNG, JPEG, or WebP photo." }, { status: 400 });
    console.error("Repair guide generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Repair guide generation failed. Please try again." },
      { status: 503 },
    );
  }
}
