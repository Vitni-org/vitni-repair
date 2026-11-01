"use client";

import { ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import type { GuidePart } from "@/lib/content";
import { useRetailerMarket } from "@/components/retailer-market-provider";
import { retailerSearches, withAmazonAffiliateTag, withVitniReferralTags, type RetailerArea } from "@/lib/retailer-links";

const amazonAffiliateEnabled = Boolean(process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim());

function isAmazonAffiliateLink(href: string) {
  try {
    const hostname = new URL(href).hostname;
    return hostname === "amazon.fr" || hostname === "www.amazon.fr";
  } catch {
    return false;
  }
}

function isExistingSearch(href: string) {
  try {
    const url = new URL(href);
    return (
      (url.hostname === "www.google.com" && url.pathname === "/search" && url.searchParams.get("tbm") === "shop") ||
      (/^(www\.)?amazon\.[a-z.]+$/.test(url.hostname) && url.pathname === "/s")
    );
  } catch {
    return false;
  }
}

function directRetailerLink(href: string, countryCode: string, area: RetailerArea, context: "guide_detail" | "generated_plan") {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || isExistingSearch(href)) return null;
    const hostKey = url.hostname
      .replace(/^www\./, "")
      .split(".")
      .slice(-2)
      .join("_");
    return withAmazonAffiliateTag(withVitniReferralTags(url.toString(), countryCode, hostKey, area, context));
  } catch {
    return null;
  }
}

export function PartSourcingLinks({
  part,
  area = "Other",
  context,
}: {
  part: GuidePart;
  area?: RetailerArea;
  context: "guide_detail" | "generated_plan";
}) {
  const t = useTranslations("parts");
  const locale = useLocale();
  const { countryCode } = useRetailerMarket();
  const searches = retailerSearches(part.name, part.details || "", countryCode, area, context, locale);
  const directUrl = part.url ? directRetailerLink(part.url, countryCode, area, context) : null;

  return (
    <div className="part-sourcing">
      <p>
        <strong>{part.name}</strong>
        {part.details ? <span> — {part.details}</span> : null}
      </p>
      <div className="part-sourcing__links">
        {directUrl ? (
          <a
            data-analytics-event="parts_link_opened"
            data-analytics-page-context={context}
            data-analytics-market={countryCode}
            href={directUrl}
            rel={`noopener noreferrer${amazonAffiliateEnabled && isAmazonAffiliateLink(directUrl) ? " sponsored" : ""}`}
            target="_blank"
          >
            {t("viewSuggested")} <ExternalLink aria-hidden="true" />
          </a>
        ) : null}
        {searches.map((search) => (
          <a
            data-analytics-event="parts_link_opened"
            data-analytics-page-context={context}
            data-analytics-market={countryCode}
            href={search.href}
            key={search.id}
            rel={`noopener noreferrer${amazonAffiliateEnabled && search.id === "amazon" && countryCode === "FR" ? " sponsored" : ""}`}
            target="_blank"
          >
            {search.kind === "marketplace"
              ? t("amazon")
              : search.kind === "compare"
                ? t("compare")
                : search.action === "visit"
                  ? t("visitStore", { store: search.name })
                  : t("localStore", { store: search.name })}
            {search.id === "amazon" && amazonAffiliateEnabled && countryCode === "FR" ? ` · ${t("affiliateLink")}` : null}
            <ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function PartSourcingNote() {
  const t = useTranslations("parts");
  const { countryCode, setCountryCode, countryOptions } = useRetailerMarket();
  const marketId = useId();
  return (
    <div className="part-sourcing-note">
      <label className="part-sourcing-market" htmlFor={marketId}>
        <span>{t("marketLabel")}</span>
        <select id={marketId} value={countryCode} onChange={(event) => setCountryCode(event.currentTarget.value)}>
          {countryOptions.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>
      </label>
      <p>{t("note")}</p>
      <p>{t("referralNote")}</p>
      {amazonAffiliateEnabled && countryCode === "FR" ? <p>{t("affiliateDisclosure")}</p> : null}
    </div>
  );
}
