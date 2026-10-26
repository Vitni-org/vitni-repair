import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GuidePart } from "@/lib/content";
import { retailerSearches } from "@/lib/retailer-links";

export function PartSourcingLinks({
  part,
  context,
}: {
  part: GuidePart;
  context: "guide_detail" | "generated_plan";
}) {
  const t = useTranslations("parts");
  const searches = retailerSearches(part.name, part.details || "");
  const directUrl = (() => {
    if (!part.url) return null;
    try {
      const url = new URL(part.url);
      const isExistingSearch =
        (url.hostname === "www.google.com" && url.pathname === "/search" && url.searchParams.get("tbm") === "shop") ||
        (url.hostname === "www.amazon.fr" && url.pathname === "/s");
      return isExistingSearch ? null : part.url;
    } catch {
      return null;
    }
  })();
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
            href={directUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("viewSuggested")} <ExternalLink aria-hidden="true" />
          </a>
        ) : null}
        {searches.map((search) => (
          <a
            data-analytics-event="parts_link_opened"
            data-analytics-page-context={context}
            href={search.href}
            key={search.name}
            rel="noopener noreferrer"
            target="_blank"
          >
            {search.name === "Search Amazon France" ? t("amazon") : t("compare")} <ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function PartSourcingNote() {
  const t = useTranslations("parts");
  return <p className="part-sourcing-note">{t("note")}</p>;
}
