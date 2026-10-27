import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getGuideStore } from "../../guide-store.mjs";

export type CreditPackage = "single" | "five";

export type PaddleCreditConfig = {
  apiKey: string;
  webhookSecret: string;
  priceIds: Record<CreditPackage, string>;
  clientToken: string;
  environment: "sandbox" | "production";
};

const paddlePriceIdPattern = /^pri_[a-z0-9]{26}$/i;

export function getPaddleCreditConfig(): PaddleCreditConfig | null {
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  const single = process.env.PADDLE_PRICE_REPAIR_GUIDE_SINGLE?.trim();
  const five = process.env.PADDLE_PRICE_REPAIR_GUIDE_FIVE?.trim();
  const clientToken = process.env.PADDLE_CLIENT_TOKEN?.trim();
  const environment = process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
  const storeConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!storeConfigured || !apiKey || !webhookSecret || !clientToken || !single || !five) return null;
  if (!paddlePriceIdPattern.test(single) || !paddlePriceIdPattern.test(five) || single === five) return null;
  return { apiKey, webhookSecret, priceIds: { single, five }, clientToken, environment };
}

export function createWalletToken() {
  return randomBytes(32).toString("base64url");
}

export function isWalletToken(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

export function hashWalletToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getCreditStore() {
  const store = getGuideStore();
  if (!store) throw new Error("The shared credit ledger is not configured.");
  return store;
}

export async function isRepairCreditLedgerReady() {
  try {
    const store = getCreditStore();
    const { error } = await store.from("repair_credit_wallets").select("wallet_hash").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function getRepairCreditBalance(walletHash: string) {
  const store = getCreditStore();
  const { data, error } = await store
    .from("repair_credit_wallets")
    .select("credits")
    .eq("wallet_hash", walletHash)
    .maybeSingle();
  if (error) throw new Error("The repair credit balance is temporarily unavailable.");
  return Number(data?.credits || 0);
}

export async function reserveRepairCredit(walletHash: string, reservationId: string) {
  const store = getCreditStore();
  const { data, error } = await store.rpc("reserve_repair_credit", {
    p_wallet_hash: walletHash,
    p_reservation_id: reservationId,
  });
  if (error) throw new Error("The repair credit balance is temporarily unavailable.");
  return data === true;
}

export async function settleRepairCredit(reservationId: string, succeeded: boolean) {
  const store = getCreditStore();
  const { error } = await store.rpc("settle_repair_credit", {
    p_reservation_id: reservationId,
    p_succeeded: succeeded,
  });
  if (error) throw new Error("The repair credit could not be settled.");
}

export async function grantPaddleRepairCredits(input: {
  walletHash: string;
  transactionId: string;
  eventId: string;
  priceId: string;
  credits: number;
}) {
  const store = getCreditStore();
  const { data, error } = await store.rpc("grant_paddle_repair_credits", {
    p_wallet_hash: input.walletHash,
    p_transaction_id: input.transactionId,
    p_event_id: input.eventId,
    p_price_id: input.priceId,
    p_credits: input.credits,
  });
  if (error) throw new Error("The purchased repair credits could not be recorded.");
  return data === true;
}
