"use client";

import Script from "next/script";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type PaddleEvent = { name?: string };
type PaddleSdk = {
  Environment: { set: (environment: "sandbox") => void };
  Initialize: (options: { token: string; eventCallback: (event: PaddleEvent) => void }) => void;
  Checkout: {
    open: (options: {
      transactionId: string;
      settings: { displayMode: "overlay"; theme: "light"; locale: string };
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleSdk;
  }
}

export function PaddleCredits({
  enabled,
  clientToken,
  environment,
  locale,
}: {
  enabled: boolean;
  clientToken: string;
  environment: "sandbox" | "production";
  locale: string;
}) {
  const t = useTranslations("credits");
  const [paddleReady, setPaddleReady] = useState(false);
  const [busy, setBusy] = useState<"single" | "five" | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const balanceRef = useRef<number | null>(null);
  const initialized = useRef(false);

  const updateBalance = useCallback(async () => {
    const response = await fetch("/api/credits/balance", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { credits?: number };
    if (typeof data.credits === "number") {
      balanceRef.current = data.credits;
      setBalance(data.credits);
      return data.credits;
    }
    return null;
  }, []);

  const initialize = useCallback(() => {
    if (!enabled || initialized.current || !clientToken || !window.Paddle) return;
    if (environment === "sandbox") window.Paddle.Environment.set("sandbox");
    window.Paddle.Initialize({
      token: clientToken,
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          setStatus(t("paymentDone"));
          const initialBalance = balanceRef.current ?? 0;
          void (async () => {
            for (let attempt = 0; attempt < 15; attempt += 1) {
              await new Promise((resolve) => window.setTimeout(resolve, 1200));
              const nextBalance = await updateBalance().catch(() => null);
              if (nextBalance !== null && nextBalance > initialBalance) {
                setStatus(t("creditAdded"));
                return;
              }
            }
          })();
        }
      },
    });
    initialized.current = true;
    setPaddleReady(true);
  }, [clientToken, enabled, environment, t, updateBalance]);

  useEffect(() => {
    let active = true;
    void fetch("/api/credits/balance", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { credits?: number } | null) => {
        if (!active || typeof data?.credits !== "number") return;
        balanceRef.current = data.credits;
        setBalance(data.credits);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const buy = async (pack: "single" | "five") => {
    if (!enabled || !paddleReady || !window.Paddle || busy) return;
    setBusy(pack);
    setStatus("");
    try {
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pack }),
      });
      const data = (await response.json()) as { transactionId?: string };
      if (!response.ok || !data.transactionId) throw new Error("checkout");
      window.Paddle.Checkout.open({
        transactionId: data.transactionId,
        settings: { displayMode: "overlay", theme: "light", locale: locale === "fr" ? "fr" : "en" },
      });
    } catch {
      setStatus(t("checkoutError"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {enabled ? <Script onReady={initialize} src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" /> : null}
      <div className="credits-packs">
        <article className="credits-pack">
          <div>
            <p className="eyebrow">{t("singleTitle")}</p>
            <p className="credits-pack__price">{t("singlePrice")}</p>
            <p>{t("singleDescription")}</p>
          </div>
          <Button disabled={!enabled || !paddleReady || Boolean(busy)} onClick={() => void buy("single")} type="button">
            {busy === "single" ? t("working") : t("buy")}
          </Button>
        </article>
        <article className="credits-pack credits-pack--featured">
          <div>
            <span className="credits-pack__badge">{t("bestValue")}</span>
            <p className="eyebrow">{t("fiveTitle")}</p>
            <p className="credits-pack__price">{t("fivePrice")}</p>
            <p>{t("fiveDescription")}</p>
          </div>
          <Button disabled={!enabled || !paddleReady || Boolean(busy)} onClick={() => void buy("five")} type="button">
            {busy === "five" ? t("working") : t("buy")}
          </Button>
        </article>
      </div>
      <div aria-live="polite" className="credits-status" role="status">
        {balance !== null && enabled ? t("balance", { count: balance }) : null}
        {status ? <span>{status}</span> : null}
        {!enabled ? <p>{t("setupNotice")}</p> : <p>{t("readyNotice")}</p>}
      </div>
    </>
  );
}
