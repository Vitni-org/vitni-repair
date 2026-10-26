import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { repairSectors, isRepairSector } from "@/lib/repair-sectors";
import { searchGuides } from "@/lib/guide-repository";

export const metadata: Metadata = {
  title: "Repair guide library | Vitni",
  description:
    "Find clear repair guides for bikes, clothing, furniture, home fixtures, appliances, kitchen fittings, garden tools, personal gear, toys, and more.",
  alternates: { canonical: "/guides/" },
  openGraph: {
    title: "Repair guide library | Vitni",
    description: "Browse practical repair guides across the things people use every day.",
    url: "/guides/",
  },
};

const areas = ["All", "Bike", "Home", "Clothes", "Other"];

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; area?: string; sector?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").slice(0, 160);
  const sector = isRepairSector(params.sector || "") ? params.sector! : "All";
  const area = sector === "All" && areas.includes(params.area || "") ? params.area || "All" : "All";
  const page = await searchGuides({ query, area, sector, cursor: params.cursor || null, limit: 9 });

  const paginationHref = (cursor: string) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (sector !== "All") next.set("sector", sector);
    else if (area !== "All") next.set("area", area);
    next.set("cursor", cursor);
    return `/guides/?${next.toString()}`;
  };

  return (
    <main className="library-page" id="content">
      <section className="library-hero">
        <div>
          <p className="eyebrow">Vitni’s repair library</p>
          <h1 className="hero-title">
            Keep more
            <br /> things in use.
          </h1>
          <p>
            Start with a practical guide, from a bicycle puncture or loose button to a garden tool, household appliance, or
            furniture fix. Each guide makes the safe limits clear.
          </p>
        </div>
        <div className="library-hero__mascot">
          <Image alt="Vitni, your repair sidekick" fill priority sizes="(max-width: 760px) 40vw, 230px" src="/images/vitni.svg" />
          <span>LEARN · REPAIR · KEEP</span>
        </div>
      </section>

      <section aria-labelledby="sectors-title" className="sector-directory">
        <div className="sector-directory__heading">
          <div>
            <p className="eyebrow">Repairs for everyday life</p>
            <h2 className="section-title" id="sectors-title">
              Browse by what you’re fixing.
            </h2>
          </div>
          <Link href="/#diagnose">
            Describe a different repair <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="sector-grid">
          {repairSectors.map((item, index) => (
            <Link className="sector-card" href={`/guides/sector/${item.slug}/`} key={item.slug}>
              <span aria-hidden="true" className="sector-card__number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="sector-card__arrow" aria-hidden="true">
                <ArrowRight />
              </span>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="library-title" className="library-tools">
        <div className="library-tools__heading">
          <div>
            <p className="eyebrow">Common repairs</p>
            <h2 className="section-title" id="library-title">
              Find a clear starting point.
            </h2>
          </div>
          <span aria-live="polite">
            {page.total} {page.total === 1 ? "guide" : "guides"}
          </span>
        </div>
        <form action="/guides/" className="library-search" data-analytics-form="guide-search">
          <label className="sr-only" htmlFor="guide-query">
            Search repair guides
          </label>
          <Search aria-hidden="true" />
          <Input id="guide-query" maxLength={160} name="q" placeholder="Search a repair, item, or tool" defaultValue={query} />
          {sector !== "All" && <input name="sector" type="hidden" value={sector} />}
          {sector === "All" && area !== "All" && <input name="area" type="hidden" value={area} />}
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <div className="library-active-filter">
          <SlidersHorizontal aria-hidden="true" />
          <span>{sector !== "All" ? `Showing ${sector}` : area !== "All" ? `Showing ${area} repairs` : "Showing all sectors"}</span>
          {(sector !== "All" || area !== "All") && (
            <Link href={`/guides/${query ? `?q=${encodeURIComponent(query)}` : ""}`}>Clear filter</Link>
          )}
        </div>
        {!page.items.length ? (
          <div className="library-empty">
            <Image alt="" aria-hidden="true" height={100} src="/images/vitni-mark.svg" width={100} />
            <h3>No exact match yet.</h3>
            <p>Try a shorter search, browse another sector, or ask Vitni for a guide from a photo and a few words.</p>
            <Link className={buttonVariants()} href="/#diagnose">
              Ask Vitni for repair steps <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="guide-card-grid">
            {page.items.map((guide) => (
              <GuideCard guide={guide} key={guide.slug} />
            ))}
          </div>
        )}
        <div className="library-pagination">
          {page.previousCursor ? (
            <Link className={buttonVariants({ variant: "outline" })} href={paginationHref(page.previousCursor)}>
              <ArrowLeft aria-hidden="true" /> Previous
            </Link>
          ) : (
            <span />
          )}
          {page.nextCursor ? (
            <Link className={buttonVariants({ variant: "outline" })} href={paginationHref(page.nextCursor)}>
              More guides <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </div>
        {"degraded" in page && page.degraded && (
          <p className="library-note">The shared library is taking a break. Showing the built-in repair guides for now.</p>
        )}
        <p className="library-partner-nudge">
          Are you a repair café, workshop, parts shop, or maker? <Link href="/partners/">Help people find the right repair support and parts.</Link>
        </p>
      </section>
    </main>
  );
}
