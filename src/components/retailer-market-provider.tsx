"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

const STORAGE_KEY = "vitni.retailer-market.v1";
const fallbackMarket = "FR";
const knownMarkets = [
  "AT",
  "AU",
  "BE",
  "BR",
  "CA",
  "CH",
  "DE",
  "DK",
  "ES",
  "FI",
  "FR",
  "GB",
  "IE",
  "IN",
  "IT",
  "JP",
  "MX",
  "NL",
  "NO",
  "NZ",
  "PL",
  "PT",
  "SE",
  "SG",
  "TR",
  "US",
];

type RetailerMarketContextValue = {
  countryCode: string;
  setCountryCode: (countryCode: string) => void;
  countryOptions: { code: string; label: string }[];
};

const RetailerMarketContext = createContext<RetailerMarketContextValue | null>(null);

function validCountryCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{2}$/i.test(value) && value.toUpperCase() !== "XX";
}

function browserCountryCode() {
  try {
    const locale = new Intl.Locale(navigator.language);
    return validCountryCode(locale.region) ? locale.region.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function RetailerMarketProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [countryCode, setCountryCodeState] = useState(fallbackMarket);

  useEffect(() => {
    let active = true;
    let hasManualChoice = false;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (validCountryCode(saved)) {
        hasManualChoice = true;
        setCountryCodeState(saved.toUpperCase());
      }
    } catch {
      // Storage can be disabled; country detection still works for this visit.
    }

    if (!hasManualChoice) {
      void fetch("/api/market", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((result: { countryCode?: unknown } | null) => {
          const detected = result?.countryCode;
          if (active && validCountryCode(detected)) {
            setCountryCodeState(detected.toUpperCase());
          } else if (active) {
            setCountryCodeState(browserCountryCode() || (locale === "fr" ? "FR" : fallbackMarket));
          }
        })
        .catch(() => {
          if (active) setCountryCodeState(browserCountryCode() || (locale === "fr" ? "FR" : fallbackMarket));
        });
    }

    return () => {
      active = false;
    };
  }, [locale]);

  const setCountryCode = useCallback((value: string) => {
    if (!validCountryCode(value)) return;
    const normalized = value.toUpperCase();
    setCountryCodeState(normalized);
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // Keep the selection for this visit if persistent storage is unavailable.
    }
  }, []);

  const countryOptions = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    const codes = countryCode && !knownMarkets.includes(countryCode) ? [...knownMarkets, countryCode] : knownMarkets;
    return codes.map((code) => ({ code, label: names.of(code) || code })).sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [countryCode, locale]);

  const value = useMemo(() => ({ countryCode, setCountryCode, countryOptions }), [countryCode, setCountryCode, countryOptions]);
  return <RetailerMarketContext.Provider value={value}>{children}</RetailerMarketContext.Provider>;
}

export function useRetailerMarket() {
  const context = useContext(RetailerMarketContext);
  if (!context) throw new Error("useRetailerMarket must be used inside RetailerMarketProvider");
  return context;
}
