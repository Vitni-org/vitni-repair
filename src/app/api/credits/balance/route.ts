import { NextResponse } from "next/server";
import { getPaddleCreditConfig, getRepairCreditBalance, hashWalletToken, isWalletToken } from "@/lib/repair-credits";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ready = Boolean(getPaddleCreditConfig());
  if (!ready) return NextResponse.json({ ready: false, credits: 0 }, { headers: { "Cache-Control": "no-store" } });
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("vitni_credit_wallet="))
    ?.slice("vitni_credit_wallet=".length);
  if (!isWalletToken(token)) return NextResponse.json({ ready: true, credits: 0 }, { headers: { "Cache-Control": "no-store" } });
  try {
    const credits = await getRepairCreditBalance(hashWalletToken(token));
    return NextResponse.json({ ready: true, credits }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ready: true, credits: 0 }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
