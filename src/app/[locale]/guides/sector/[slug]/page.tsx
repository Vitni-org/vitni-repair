import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ArrowUpLeft, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { GuideCard } from "@/components/guide-card";
import { buttonVariants } from "@/components/ui/button";
import { getRepairSector, repairSectors } from "@/lib/repair-sectors";
import { getLocalizedSectors } from "@/lib/catalog-localization";
import { searchGuides } from "@/lib/guide-repository";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export const runtime = "nodejs";

export function generateStaticParams() {
  return repairSectors.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const canonical = getRepairSector(slug);
  const sector = getLocalizedSectors(locale).find((item) => item.slug === slug);
  if (!canonical || !sector) return { title: await (await getTranslations({ locale, namespace: "sectorPage" }))("notFound"), robots: { index: false, follow: false } };
  const t = await getTranslations({ locale, namespace: "sectorPage" });
  const prefix = locale === "fr" ? "/fr" : "";
  const title = t("metaTitle", { sector: sector.label });
  const description = t("metaDescription", { sector: sector.label.toLowerCase() });
  return {
    title,
    description,
    alternates: { canonical: `${prefix}/guides/sector/${slug}/`, languages: { en: `/guides/sector/${slug}/`, fr: `/fr/guides/sector/${slug}/` } },
    openGraph: { type: "website", title, description, url: `${prefix}/guides/sector/${slug}/`, images: [{ url: "/images/og/repairlens-share.png", alt: locale === "fr" ? "Vitni, votre compagnon réparation" : "Vitni repair guides" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/images/og/repairlens-share.png"] },
  };
}

export default async function RepairSectorPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const canonicalSector = getRepairSector(slug);
  const sector = getLocalizedSectors(locale).find((item) => item.slug === slug);
  if (!canonicalSector || !sector) notFound();
  const t = await getTranslations({ locale, namespace: "sectorPage" });
  const common = await getTranslations({ locale, namespace: "common" });
  const page = await searchGuides({ sector: canonicalSector.label, limit: 24, locale });
  const prefix = locale === "fr" ? "/fr" : "";
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const jsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: t("metaTitle", { sector: sector.label }),
        description: sector.description,
        url: `${base}${prefix}/guides/sector/${slug}/`,
        inLanguage: locale,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: page.items.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: guide.title,
            url: `${base}${prefix}/guides/${guide.slug}/`,
          })),
        },
      },
      createBreadcrumbList(base, [
        { name: common("home"), path: `${prefix}/` },
        { name: t("allSectors"), path: `${prefix}/guides/` },
        { name: sector.label, path: `${prefix}/guides/sector/${slug}/` },
      ]),
    ],
  });

  return (
    <main className="sector-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label={t("allSectors")} className="breadcrumb">
        <Link href="/">{common("home")}</Link><span aria-hidden="true">/</span>
        <Link href="/guides/">{t("allSectors")}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{sector.label}</span>
      </nav>
      <header className="sector-page__hero">
        <Link className="sector-page__back" href="/guides/"><ArrowUpLeft aria-hidden="true" /> {t("allSectors")}</Link>
        <p className="eyebrow">{t("available", { count: page.total })}</p>
        <h1>{sector.label}</h1>
        <p>{sector.intro}</p>
        <div className="sector-page__actions">
          <Link className={buttonVariants()} href="/#diagnose">{t("ask")} <ArrowRight aria-hidden="true" /></Link>
          <Link className={buttonVariants({ variant: "outline" })} href={`/guides/?sector=${encodeURIComponent(canonicalSector.label)}`}>{t("search")}</Link>
        </div>
        <div className="sector-safety-note"><ShieldCheck aria-hidden="true" /><p>{t("safety")}</p></div>
      </header>

      <section aria-labelledby="sector-guides-title" className="sector-page__library">
        <div className="guide-detail-section-heading">
          <p className="eyebrow">{t("startingPoints")}</p>
          <h2 id="sector-guides-title">{page.total ? t("guidesFor", { sector: sector.label.toLowerCase() }) : t("onTheWay")}</h2>
        </div>
        {page.items.length ? (
          <div className="guide-card-grid">{page.items.map((guide) => <GuideCard guide={guide} key={guide.slug} />)}</div>
        ) : (
          <div className="sector-empty">
            <p>{t("empty")}</p>
            <Link className={buttonVariants({ variant: "outline" })} href="/partners/">{t("shareResource")} <ArrowRight aria-hidden="true" /></Link>
          </div>
        )}
        {"degraded" in page && page.degraded && <p className="library-note">{t("unavailable")}</p>}
      </section>
      <section aria-labelledby="sector-faq-title" className="sector-faq">
        <p className="eyebrow">{t("faqEyebrow")}</p>
        <h2 id="sector-faq-title">{t("faqTitle", { sector: sector.label.toLowerCase() })}</h2>
        <div className="sector-faq__list">
          {sector.questions.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </div>
      </section>
    </main>
  );
}
