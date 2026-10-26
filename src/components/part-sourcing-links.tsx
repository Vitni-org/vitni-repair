import { ExternalLink } from "lucide-react";
import type { GuidePart } from "@/lib/content";
import { retailerSearches } from "@/lib/retailer-links";

export function PartSourcingLinks({
  part,
  context,
}: {
  part: GuidePart;
  context: "guide_detail" | "generated_plan";
}) {
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
            View suggested link <ExternalLink aria-hidden="true" />
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
            {search.name} <ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function PartSourcingNote() {
  return <p className="part-sourcing-note">Search links help you compare options; they are not confirmed matches, stock checks, or Vitni endorsements. Check size, model, compatibility, seller, and return terms before buying.</p>;
}
