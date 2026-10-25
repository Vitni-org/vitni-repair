import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchGuides } from "@/lib/guide-repository";

export const metadata: Metadata = {
  title: "Repair guide library | Vitni",
  description: "Meet Vitni, your repair sidekick, and browse practical guides for bicycles, home fixtures, furniture, and clothes.",
  alternates: { canonical: "/guides/" },
};

const areas = ["All", "Bike", "Home", "Clothes"];

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ q?: string; area?: string; cursor?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").slice(0, 160);
  const area = areas.includes(params.area || "") ? params.area || "All" : "All";
  const page = await searchGuides({ query, area, cursor: params.cursor || null, limit: 6 });

  const paginationHref = (cursor: string) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (area !== "All") next.set("area", area);
    next.set("cursor", cursor);
    return `/guides/?${next.toString()}`;
  };

  return (
    <main className="library-page" id="content">
      <section className="library-hero">
        <div>
          <p className="eyebrow">Vitni’s repair library</p>
          <h1 className="hero-title">
            Start with the
            <br /> everyday fixes.
          </h1>
          <p>I’ve gathered practical starting points for bikes, home repairs, and clothes. Check the tools and safety notes before you begin.</p>
        </div>
        <div className="library-hero__mascot">
          <Image alt="Vitni, your repair sidekick" fill priority sizes="(max-width: 760px) 40vw, 230px" src="/images/vitni.svg" />
          <span>LEARN · REPAIR · KEEP</span>
        </div>
      </section>

      <section aria-labelledby="library-title" className="library-tools">
        <div className="library-tools__heading">
          <div>
            <p className="eyebrow">Common repairs</p>
            <h2 className="section-title" id="library-title">
              Pick a place to start.
            </h2>
          </div>
          <span>
            {page.total} {page.total === 1 ? "guide" : "guides"}
          </span>
        </div>
        <form action="/guides/" className="library-search" data-analytics-form="guide-search">
          <label className="sr-only" htmlFor="guide-query">
            Search repair guides
          </label>
          <Search aria-hidden="true" />
          <Input id="guide-query" maxLength={160} name="q" placeholder="Search a repair, item, or tool" defaultValue={query} />
          {area !== "All" && <input name="area" type="hidden" value={area} />}
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <nav aria-label="Filter guides by area" className="library-filters">
          <SlidersHorizontal aria-hidden="true" />
          {areas.map((item) => {
            const queryString = new URLSearchParams();
            if (query) queryString.set("q", query);
            if (item !== "All") queryString.set("area", item);
            return (
              <Link
                aria-current={area === item ? "page" : undefined}
                className={area === item ? "is-active" : ""}
                href={`/guides/${queryString.size ? `?${queryString.toString()}` : ""}`}
                key={item}
              >
                {item}
              </Link>
            );
          })}
        </nav>
        {!page.items.length ? (
          <div className="library-empty">
            <Image alt="" aria-hidden="true" height={100} src="/images/vitni-mark.svg" width={100} />
            <h3>No exact match yet.</h3>
            <p>Try a shorter search, browse another area, or ask Vitni for a guide from a photo.</p>
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
              <ArrowLeft aria-hidden="true" />
              Previous
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
      </section>
    </main>
  );
}
