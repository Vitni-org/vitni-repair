import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getPaddleCreditConfig, grantPaddleRepairCredits } from "@/lib/repair-credits";

export const runtime = "nodejs";

type PaddleItem = { quantity?: number; price?: { id?: string } };
type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  data?: {
    id?: string;
    status?: string;
    custom_data?: { vitni_wallet_hash?: string } | null;
    items?: PaddleItem[];
  };
};

function verifyPaddleSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const values = signatureHeader.split(";").map((segment) => segment.trim().split("=", 2));
  const timestamp = values.find(([key]) => key === "ts")?.[1];
  const signatures = values.filter(([key]) => key === "h1").map(([, value]) => value).filter(Boolean);
  if (!timestamp || !/^\d+$/.test(timestamp) || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}:${rawBody}`).digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

export async function POST(request: Request) {
  const config = getPaddleCreditConfig();
  if (!config) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  if (!verifyPaddleSignature(rawBody, request.headers.get("paddle-signature"), config.webhookSecret))
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (event.event_type !== "transaction.completed") return NextResponse.json({ ok: true });

  const transaction = event.data;
  const item = transaction?.items?.length === 1 ? transaction.items[0] : null;
  const walletHash = transaction?.custom_data?.vitni_wallet_hash;
  const priceId = item?.price?.id;
  const quantity = item?.quantity;
  if (
    transaction?.status !== "completed" ||
    !/^evt_[a-z0-9]{26}$/i.test(event.event_id || "") ||
    !/^txn_[a-z0-9]{26}$/i.test(transaction.id || "") ||
    !/^[a-f0-9]{64}$/.test(walletHash || "") ||
    quantity !== 1 ||
    !priceId ||
    !Object.values(config.priceIds).includes(priceId)
  ) {
    return NextResponse.json({ error: "The completed transaction does not match a Vitni credit pack." }, { status: 400 });
  }

  const credits = priceId === config.priceIds.single ? 1 : 5;
  try {
    await grantPaddleRepairCredits({
      walletHash: walletHash!,
      transactionId: transaction.id!,
      eventId: event.event_id!,
      priceId,
      credits,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Paddle credit webhook could not be recorded:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not record the purchased credits." }, { status: 500 });
  }
}
