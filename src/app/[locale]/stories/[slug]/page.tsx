import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ShieldCheck, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { getStory, getStoryEntries } from "@/lib/content";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export async function generateStaticParams() {
  return getStoryEntries().map(({ id }) => ({ slug: id }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const story = getStory(slug, locale);
  const t = await getTranslations({ locale, namespace: "stories" });
  if (!story) return { title: t("notFound"), robots: { index: false, follow: false } };
  const prefix = locale === "fr" ? "/fr" : "";
  const title = t("titlePrefix", { title: story.title });
  const description = t("metaDescription", { situation: story.situation });
  return {
    title,
    description,
    alternates: { canonical: `${prefix}/stories/${slug}/`, languages: { en: `/stories/${slug}/`, fr: `/fr/stories/${slug}/` } },
    openGraph: { type: "article", url: `${prefix}/stories/${slug}/`, title, description, images: [{ url: story.image, alt: story.alt }] },
    twitter: { card: "summary_large_image", title, description, images: [story.image] },
  };
}

export default async function StoryDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const story = getStory(slug, locale);
  if (!story) notFound();
  const t = await getTranslations({ locale, namespace: "stories" });
  const detail = await getTranslations({ locale, namespace: "guideDetail" });
  const common = await getTranslations({ locale, namespace: "common" });
  const prefix = locale === "fr" ? "/fr" : "";
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const jsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: t("titlePrefix", { title: story.title }),
        description: `${t("label")}. ${story.situation}`,
        image: `${origin}${story.image}`,
        url: `${origin}${prefix}/stories/${slug}/`,
        inLanguage: locale,
      },
      createBreadcrumbList(origin, [
        { name: common("home"), path: `${prefix}/` },
        { name: detail("repairLibrary"), path: `${prefix}/guides/` },
        { name: story.title, path: `${prefix}/stories/${slug}/` },
      ]),
    ],
  });
  return (
    <main className="detail-page story-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label={detail("breadcrumb")} className="breadcrumb">
        <Link href="/">{common("home")}</Link><span aria-hidden="true">/</span>
        <Link href="/guides/">{detail("repairLibrary")}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{story.title}</span>
      </nav>
      <section className="story-hero">
        <div>
          <p className="eyebrow">{t("eyebrow", { tag: story.tag })}</p>
          <h1>{story.title}</h1>
          <p>{story.situation}</p>
          <span className="story-outcome">{t("outcome", { outcome: story.outcome })}</span>
        </div>
        <div className="story-hero__image">
          <Image alt={story.alt} fill priority sizes="(max-width: 800px) 92vw, 45vw" src={story.image} unoptimized />
          <span className="story-image-caption">{t("imageCaption")}</span>
        </div>
      </section>
      <div className="guide-detail-layout story-detail-layout">
        <section className="story-steps">
          <div className="guide-detail-section-heading">
            <p className="eyebrow">{t("stepsEyebrow")}</p>
            <h2>{t("stepsTitle")}</h2>
          </div>
          <ol>
            {story.steps.map(([title, detail], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{detail}</p></div>
              </li>
            ))}
          </ol>
        </section>
        <aside className="guide-detail-aside">
          <div className="guide-aside-card">
            <h2><Wrench aria-hidden="true" /> {t("tools")}</h2>
            <ul>{story.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>
          </div>
          <div className="guide-aside-card safety-note">
            <h2><ShieldCheck aria-hidden="true" /> {t("safety")}</h2>
            <p>{story.safety}</p>
          </div>
        </aside>
      </div>
      <section className="story-next">
        <div>
          <p className="eyebrow">{t("yourTurn")}</p>
          <h2>{t("ctaTitle")}</h2>
          <p>{t("ctaDescription")}</p>
        </div>
        <Link href="/#diagnose">{t("cta")} <ArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
