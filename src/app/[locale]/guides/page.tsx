import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isRepairSector } from "@/lib/repair-sectors";
import { getLocalizedSectors, localizedAreaLabel, localizedSectorLabel } from "@/lib/catalog-localization";
import { searchGuides } from "@/lib/guide-repository";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guideLibrary" });
  const prefix = locale === "fr" ? "/fr" : "";
  return {
    title: `${t("title")} | Vitni`,
    description: t("intro"),
    alternates: { canonical: `${prefix}/guides/`, languages: { en: "/guides/", fr: "/fr/guides/" } },
    openGraph: { type: "website", title: `${t("title")} | Vitni`, description: t("intro"), url: `${prefix}/guides/` },
  };
}

const areas = ["All", "Bike", "Home", "Clothes", "Other"];

export default async function GuidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; area?: string; sector?: string; cursor?: string }>;
}) {
  const [{ locale }, paramsValue] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "guideLibrary" });
  const common = await getTranslations({ locale, namespace: "common" });
  const query = (paramsValue.q || "").slice(0, 160);
  const sector = isRepairSector(paramsValue.sector || "") ? paramsValue.sector! : "All";
  const area = sector === "All" && areas.includes(paramsValue.area || "") ? paramsValue.area || "All" : "All";
  const page = await searchGuides({ query, area, sector, cursor: paramsValue.cursor || null, limit: 9, locale });
  const prefix = locale === "fr" ? "/fr" : "";
  const sectors = getLocalizedSectors(locale);

  const paginationHref = (cursor: string) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (sector !== "All") next.set("sector", sector);
    else if (area !== "All") next.set("area", area);
    next.set("cursor", cursor);
    return `/guides/?${next.toString()}`;
  };
  const showing = sector !== "All"
    ? t("showingSector", { sector: localizedSectorLabel(sector, locale) })
    : area !== "All"
      ? t("showingArea", { area: localizedAreaLabel(area as "Bike" | "Home" | "Clothes" | "Other", locale) })
      : t("showingAll");

  return (
    <main className="library-page" id="content">
      <section className="library-hero">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="hero-title">
            {t("heroLead")}
            <br /> {t("heroEmphasis")}
          </h1>
          <p>{t("heroIntro")}</p>
        </div>
        <div className="library-hero__mascot">
          <Image alt={t("mascotAlt")} fill priority sizes="(max-width: 760px) 40vw, 230px" src="/images/vitni.svg" />
          <span>{t("learnRepairKeep")}</span>
        </div>
      </section>

      <section aria-labelledby="sectors-title" className="sector-directory">
        <div className="sector-directory__heading">
          <div>
            <p className="eyebrow">{t("sectorHeading")}</p>
            <h2 className="section-title" id="sectors-title">{t("sectorTitle")}</h2>
          </div>
          <Link href="/#diagnose">{t("describeRepair")} <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="sector-grid">
          {sectors.map((item, index) => (
            <Link className="sector-card" href={`/guides/sector/${item.slug}/`} key={item.slug}>
              <span aria-hidden="true" className="sector-card__number">{String(index + 1).padStart(2, "0")}</span>
              <span className="sector-card__arrow" aria-hidden="true"><ArrowRight /></span>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="library-title" className="library-tools">
        <div className="library-tools__heading">
          <div>
            <p className="eyebrow">{t("commonEyebrow")}</p>
            <h2 className="section-title" id="library-title">{t("findStartingPoint")}</h2>
          </div>
          <span aria-live="polite">{page.total === 1 ? t("resultCountOne", { count: page.total }) : t("resultCountOther", { count: page.total })}</span>
        </div>
        <form action={`${prefix}/guides/`} className="library-search" data-analytics-form="guide-search">
          <label className="sr-only" htmlFor="guide-query">{t("searchLabel")}</label>
          <Search aria-hidden="true" />
          <Input id="guide-query" maxLength={160} name="q" placeholder={t("searchPlaceholder")} defaultValue={query} />
          {sector !== "All" && <input name="sector" type="hidden" value={sector} />}
          {sector === "All" && area !== "All" && <input name="area" type="hidden" value={area} />}
          <Button type="submit" variant="outline">{t("searchButton")}</Button>
        </form>
        <div className="library-active-filter">
          <SlidersHorizontal aria-hidden="true" />
          <span>{showing}</span>
          {(sector !== "All" || area !== "All") && <Link href={`/guides/${query ? `?q=${encodeURIComponent(query)}` : ""}`}>{t("clearFilter")}</Link>}
        </div>
        {!page.items.length ? (
          <div className="library-empty">
            <Image alt="" aria-hidden="true" height={100} src="/images/vitni-mark.svg" width={100} />
            <h3>{t("emptyTitle")}</h3>
            <p>{t("emptyDescription")}</p>
            <Link className={buttonVariants()} href="/#diagnose">{t("askVitni")} <ArrowRight aria-hidden="true" /></Link>
          </div>
        ) : (
          <div className="guide-card-grid">{page.items.map((guide) => <GuideCard guide={guide} key={guide.slug} />)}</div>
        )}
        <div className="library-pagination">
          {page.previousCursor ? <Link className={buttonVariants({ variant: "outline" })} href={paginationHref(page.previousCursor)}><ArrowLeft aria-hidden="true" /> {common("previous")}</Link> : <span />}
          {page.nextCursor ? <Link className={buttonVariants({ variant: "outline" })} href={paginationHref(page.nextCursor)}>{t("moreGuides")} <ArrowRight aria-hidden="true" /></Link> : <span />}
        </div>
        {"degraded" in page && page.degraded && <p className="library-note">{t("libraryUnavailable")}</p>}
        <p className="library-partner-nudge">{t("partnerNudge")} <Link href="/partners/">{t("partnerLink")}</Link></p>
      </section>
    </main>
  );
}
