import { NextResponse } from "next/server";
import { z } from "zod";
import { allowApiRequest } from "@/lib/repair-ai";
import { createWalletToken, getPaddleCreditConfig, getRepairCreditBalance, hashWalletToken, isWalletToken } from "@/lib/repair-credits";

export const runtime = "nodejs";

const checkoutRequestSchema = z.object({ package: z.enum(["single", "five"]) });

function cookieToken(request: Request) {
  const raw = request.headers.get("cookie") || "";
  const token = raw
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("vitni_credit_wallet="))
    ?.slice("vitni_credit_wallet=".length);
  return isWalletToken(token) ? token : null;
}

export async function POST(request: Request) {
  const config = getPaddleCreditConfig();
  if (!config) return NextResponse.json({ error: "Checkout is not configured yet." }, { status: 503 });
  if (!allowApiRequest(request, "credit-checkout", 4, 60_000))
    return NextResponse.json({ error: "Please wait before starting another checkout." }, { status: 429 });

  let body: z.infer<typeof checkoutRequestSchema>;
  try {
    body = checkoutRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Choose a valid repair credit pack." }, { status: 400 });
  }

  const existingToken = cookieToken(request);
  const walletToken = existingToken || createWalletToken();
  const walletHash = hashWalletToken(walletToken);
  const priceId = config.priceIds[body.package];
  const base = config.environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

  try {
    // Check the credit schema before opening a paid checkout; this prevents collecting payment
    // while the matching Supabase migration is still missing.
    await getRepairCreditBalance(walletHash);
    const paddleResponse = await fetch(`${base}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { vitni_wallet_hash: walletHash },
        collection_mode: "automatic",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await paddleResponse.json();
    const transactionId = payload?.data?.id;
    if (!paddleResponse.ok || typeof transactionId !== "string" || !/^txn_[a-z0-9]{26}$/i.test(transactionId)) {
      console.error("Paddle transaction creation failed:", payload?.error?.code || paddleResponse.status);
      return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again later." }, { status: 503 });
    }

    const response = NextResponse.json({ transactionId });
    if (!existingToken) {
      response.cookies.set("vitni_credit_wallet", walletToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 2,
      });
    }
    return response;
  } catch (error) {
    console.error("Paddle checkout request failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
