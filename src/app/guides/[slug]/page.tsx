import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, ShieldCheck, ShoppingBag, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { GuideIllustrations } from "@/components/guide-illustrations";
import { SaveGuideOffline } from "@/components/save-guide-offline";
import { PartSourcingLinks, PartSourcingNote } from "@/components/part-sourcing-links";
import { guideArtwork } from "@/lib/guide-artwork";
import { buttonVariants } from "@/components/ui/button";
import { getGuide, curatedGuidePaths } from "@/lib/guide-repository";
import { repairSectorByLabel } from "@/lib/repair-sectors";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export const runtime = "nodejs";

export async function generateStaticParams() {
  return curatedGuidePaths().map((path) => ({ slug: path.split("/")[2] }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "Guide not found | Vitni", robots: { index: false, follow: false } };
  return {
    title: `${guide.title} | Vitni repair guide`,
    description: guide.desc,
    category: guide.sector,
    alternates: { canonical: `/guides/${guide.slug}/` },
    openGraph: {
      type: "article",
      url: `/guides/${guide.slug}/`,
      title: guide.title,
      description: guide.desc,
      images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: "Vitni, your repair sidekick, helps you make repairs" }],
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.desc, images: ["/images/og/repairlens-share.png"] },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();
  const artwork = guideArtwork(guide);
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const imageUrl = new URL(artwork.src, origin).href;
  const guideStructuredData =
    guide.safety === "safe_diy"
      ? {
          "@type": "HowTo",
          name: guide.title,
          description: guide.desc,
          category: guide.sector,
          totalTime: Number.parseInt(guide.time, 10) > 0 ? `PT${Number.parseInt(guide.time, 10)}M` : undefined,
          image: imageUrl,
          mainEntityOfPage: `${origin}/guides/${guide.slug}/`,
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
          url: `${origin}/guides/${guide.slug}/`,
        };
  const jsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      guideStructuredData,
      createBreadcrumbList(origin, [
        { name: "Home", path: "/" },
        { name: "Repair library", path: "/guides/" },
        { name: guide.title, path: `/guides/${guide.slug}/` },
      ]),
    ],
  });

  return (
    <main className="detail-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/guides/">Guides</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{guide.title}</span>
      </nav>
      <section className="guide-detail-hero">
        <div className="guide-detail-hero__copy">
          <div className="guide-labels">
            <span>{guide.sector}</span>
            <span>{guide.level}</span>
            <span>
              <Clock3 aria-hidden="true" />
              {guide.time}
            </span>
          </div>
          <h1>{guide.title}</h1>
          <p className="guide-detail-hero__desc">{guide.desc}</p>
          <p className="guide-detail-hero__hint">
            {guide.steps.length > 0 && guide.steps.every((step) => Boolean(step.image))
              ? "Every step has an illustration. Follow the written instructions and safety notes as your guide."
              : "Vitni can draw missing steps; the written instructions and safety notes are the source of truth."}
          </p>
          <SaveGuideOffline slug={guide.slug} />
        </div>
        <div className="guide-detail-hero__image">
          <Image alt={artwork.alt} fill priority sizes="(max-width: 800px) 92vw, 44vw" src={artwork.src} data-offline-guide-image="" unoptimized />
          {artwork.isFallback && <span className="guide-detail-hero__artwork-label">Category illustration</span>}
        </div>
      </section>

      <div className="guide-detail-layout">
        <section aria-labelledby="steps-title" className="guide-detail-main">
          <div className="guide-detail-section-heading">
            <p className="eyebrow">Take it one step at a time</p>
            <h2 id="steps-title">Repair steps</h2>
          </div>
          <GuideIllustrations
            area={guide.sector}
            canGenerate={Boolean(process.env.OPENAI_API_KEY)}
            slug={guide.slug}
            steps={guide.steps}
            title={guide.title}
          />
        </section>
        <aside className="guide-detail-aside">
          <div className="guide-aside-card">
            <p className="eyebrow">Before you begin</p>
            <h2>
              <ShieldCheck aria-hidden="true" /> Safety first
            </h2>
            <p>{guide.safetyNotes || "If the item feels unstable, unsafe, or unfamiliar, stop and ask a qualified repairer."}</p>
            <div className="vitni-aside">
              <Image alt="" aria-hidden="true" height={80} src="/images/vitni.svg" width={76} />
              <p>I’m Vitni. If a part feels unsafe or needs force, stop and ask a repair pro.</p>
            </div>
          </div>
          {!!guide.tools.length && (
            <div className="guide-aside-card">
              <h2>
                <Wrench aria-hidden="true" /> Tools
              </h2>
              <ul>
                {guide.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          )}
          {!!guide.parts.length && (
            <div className="guide-aside-card">
              <h2>
                <ShoppingBag aria-hidden="true" /> Parts to check
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
              Browse all repair guides <ArrowRight aria-hidden="true" />
            </Link>
            {repairSectorByLabel(guide.sector) && (
              <Link href={`/guides/sector/${repairSectorByLabel(guide.sector)!.slug}/`}>
                More {guide.sector.toLowerCase()} guides <ArrowRight aria-hidden="true" />
              </Link>
            )}
            <Link data-analytics-event="community_help_opened" data-analytics-link-type="cta" href="/#help">
              Find nearby repair help <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/partners/">
              Suggest a local partner or parts source <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/repair-safety/">
              How Vitni repair guidance works <ArrowRight aria-hidden="true" />
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/#diagnose">
              <ArrowLeft aria-hidden="true" /> Ask Vitni about your item
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
