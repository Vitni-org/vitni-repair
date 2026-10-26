import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Clock3, ShieldCheck, ShoppingBag, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { GuideIllustrations } from "@/components/guide-illustrations";
import { SaveGuideOffline } from "@/components/save-guide-offline";
import { PartSourcingLinks, PartSourcingNote } from "@/components/part-sourcing-links";
import { guideArtwork } from "@/lib/guide-artwork";
import { buttonVariants } from "@/components/ui/button";
import { getGuide, curatedGuidePaths } from "@/lib/guide-repository";
import { repairSectorByLabel } from "@/lib/repair-sectors";
import { localizedLevel, localizedSectorLabel } from "@/lib/catalog-localization";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export const runtime = "nodejs";

export async function generateStaticParams() {
  return curatedGuidePaths().map((path) => ({ slug: path.split("/")[2] }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "guideDetail" });
  const guide = await getGuide(slug, locale);
  if (!guide) return { title: t("guideNotFound"), robots: { index: false, follow: false } };
  const prefix = locale === "fr" ? "/fr" : "";
  const contentLocale = guide.contentLocale || locale;
  return {
    title: t("metaTitle", { title: guide.title }),
    description: guide.desc,
    category: localizedSectorLabel(guide.sector, locale),
    alternates: { canonical: `${prefix}/guides/${guide.slug}/`, languages: { en: `/guides/${guide.slug}/`, fr: `/fr/guides/${guide.slug}/` } },
    openGraph: {
      type: "article",
      url: `${prefix}/guides/${guide.slug}/`,
      title: guide.title,
      description: guide.desc,
      locale: contentLocale === "fr" ? "fr_FR" : "en_GB",
      alternateLocale: [contentLocale === "fr" ? "en_GB" : "fr_FR"],
      images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.desc, images: ["/images/og/repairlens-share.png"] },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "guideDetail" });
  const common = await getTranslations({ locale, namespace: "common" });
  const guide = await getGuide(slug, locale);
  if (!guide) notFound();
  const prefix = locale === "fr" ? "/fr" : "";
  const contentLocale = guide.contentLocale || locale;
  const artwork = guideArtwork(guide);
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const imageUrl = new URL(artwork.src, origin).href;
  const guideStructuredData =
    guide.safety === "safe_diy"
      ? {
          "@type": "HowTo",
          name: guide.title,
          description: guide.desc,
          category: localizedSectorLabel(guide.sector, locale),
          totalTime: Number.parseInt(guide.time, 10) > 0 ? `PT${Number.parseInt(guide.time, 10)}M` : undefined,
          image: imageUrl,
          mainEntityOfPage: `${origin}${prefix}/guides/${guide.slug}/`,
          inLanguage: guide.contentLocale || locale,
          tool: guide.tools.map((name) => ({ "@type": "HowToTool", name })),
          supply: guide.parts.map((part) => ({ "@type": "HowToSupply", name: part.name, description: part.details })),
          step: guide.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.instruction,
            ...(step.image ? { image: new URL(step.image, origin).href } : {}),
          })),
        }
      : {
          "@type": "Article",
          headline: guide.title,
          description: guide.desc,
          image: imageUrl,
          url: `${origin}${prefix}/guides/${guide.slug}/`,
          inLanguage: guide.contentLocale || locale,
        };
  const jsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      guideStructuredData,
      createBreadcrumbList(origin, [
        { name: common("home"), path: `${prefix}/` },
        { name: t("repairLibrary"), path: `${prefix}/guides/` },
        { name: guide.title, path: `${prefix}/guides/${guide.slug}/` },
      ]),
    ],
  });

  return (
    <main className="detail-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label={t("breadcrumb")} className="breadcrumb">
        <Link href="/">{common("home")}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/guides/">{t("repairLibrary")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" lang={contentLocale}>{guide.title}</span>
      </nav>
      <section className="guide-detail-hero">
        <div className="guide-detail-hero__copy">
          <div className="guide-labels">
            <span>{localizedSectorLabel(guide.sector, locale)}</span>
            <span>{localizedLevel(guide.level, locale)}</span>
            <span>
              <Clock3 aria-hidden="true" />
              {guide.time}
            </span>
          </div>
          <h1 lang={contentLocale}>{guide.title}</h1>
          <p className="guide-detail-hero__desc" lang={contentLocale}>{guide.desc}</p>
          <p className="guide-detail-hero__hint">
            {guide.steps.length > 0 && guide.steps.every((step) => Boolean(step.image))
              ? t("stepsReady")
              : t("stepsMissing")}
          </p>
          <SaveGuideOffline slug={guide.slug} />
        </div>
        <div className="guide-detail-hero__image">
          <Image alt={artwork.alt} fill priority sizes="(max-width: 800px) 92vw, 44vw" src={artwork.src} data-offline-guide-image="" unoptimized />
          {artwork.isFallback && <span className="guide-detail-hero__artwork-label">{t("categoryArtwork")}</span>}
        </div>
      </section>

      <div className="guide-detail-layout">
        <section aria-labelledby="steps-title" className="guide-detail-main">
          <div className="guide-detail-section-heading">
            <p className="eyebrow">{t("stepsEyebrow")}</p>
            <h2 id="steps-title">{t("repairSteps")}</h2>
          </div>
          <GuideIllustrations
            area={guide.sector}
            canGenerate={Boolean(process.env.OPENAI_API_KEY)}
            contentLocale={contentLocale}
            slug={guide.slug}
            steps={guide.steps}
            title={guide.title}
          />
        </section>
        <aside className="guide-detail-aside">
          <div className="guide-aside-card">
            <p className="eyebrow">{t("beforeBegin")}</p>
            <h2>
              <ShieldCheck aria-hidden="true" /> {t("safetyFirst")}
            </h2>
            <p lang={contentLocale}>{guide.safetyNotes || t("fallbackSafety")}</p>
            <div className="vitni-aside">
              <Image alt="" aria-hidden="true" height={80} src="/images/vitni.svg" width={76} />
              <p>{t("vitniSafety")}</p>
            </div>
          </div>
          {!!guide.tools.length && (
            <div className="guide-aside-card">
              <h2>
                <Wrench aria-hidden="true" /> {t("tools")}
              </h2>
              <ul>
                {guide.tools.map((tool) => (
                  <li key={tool} lang={contentLocale}>{tool}</li>
                ))}
              </ul>
            </div>
          )}
          {!!guide.parts.length && (
            <div className="guide-aside-card">
              <h2>
                <ShoppingBag aria-hidden="true" /> {t("parts")}
              </h2>
              <div className="parts-sourcing-list">
                {guide.parts.map((part) => (
                  <PartSourcingLinks context="guide_detail" key={part.name} part={part} />
                ))}
              </div>
              <PartSourcingNote />
            </div>
          )}
          <div className="guide-aside-links">
            <Link href="/guides/">
              {t("browseAll")} <ArrowRight aria-hidden="true" />
            </Link>
            {repairSectorByLabel(guide.sector) && (
              <Link href={`/guides/sector/${repairSectorByLabel(guide.sector)!.slug}/`}>
                {t("moreSector", { sector: localizedSectorLabel(guide.sector, locale).toLowerCase() })} <ArrowRight aria-hidden="true" />
              </Link>
            )}
            <Link data-analytics-event="community_help_opened" data-analytics-link-type="cta" href="/#help">
              {t("nearbyHelp")} <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/partners/">
              {t("suggestPartner")} <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/repair-safety/">
              {t("howGuidanceWorks")} <ArrowRight aria-hidden="true" />
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/#diagnose">
              <ArrowLeft aria-hidden="true" /> {t("askVitni")}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
