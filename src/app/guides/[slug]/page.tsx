import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, ShieldCheck, ShoppingBag, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { GuideIllustrations } from "@/components/guide-illustrations";
import { buttonVariants } from "@/components/ui/button";
import { getGuide, curatedGuidePaths } from "@/lib/guide-repository";

export const runtime = "nodejs";

export async function generateStaticParams() {
  return curatedGuidePaths().map((path) => ({ slug: path.split("/")[2] }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "Guide not found | RepairLens", robots: { index: false, follow: false } };
  return {
    title: `${guide.title} | RepairLens repair guide`,
    description: guide.desc,
    alternates: { canonical: `/guides/${guide.slug}/` },
    openGraph: {
      type: "article",
      url: `/guides/${guide.slug}/`,
      title: guide.title,
      description: guide.desc,
      images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: "RepairLens · Vitni helps you make repairs" }],
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.desc, images: ["/images/og/repairlens-share.png"] },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const structuredData =
    guide.safety === "safe_diy"
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: guide.title,
          description: guide.desc,
          totalTime: guide.time,
          image: `${origin}/images/og/repairlens-share.png`,
          tool: guide.tools.map((name) => ({ "@type": "HowToTool", name })),
          supply: guide.parts.map((part) => ({ "@type": "HowToSupply", name: part.name, description: part.details })),
          step: guide.steps.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.title, text: step.instruction })),
        }
      : {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.desc,
          image: `${origin}/images/og/repairlens-share.png`,
          url: `${origin}/guides/${guide.slug}/`,
        };
  const jsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");

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
            <span>{guide.area}</span>
            <span>{guide.level}</span>
            <span>
              <Clock3 aria-hidden="true" />
              {guide.time}
            </span>
          </div>
          <h1>{guide.title}</h1>
          <p className="guide-detail-hero__desc">{guide.desc}</p>
          <p className="guide-detail-hero__hint">Illustrations are being prepared where needed. Use the written steps as your source of truth.</p>
        </div>
        <div className="guide-detail-hero__image">
          <Image
            alt={guide.alt}
            fill
            priority
            sizes="(max-width: 800px) 92vw, 44vw"
            src={guide.image || "/images/og/repairlens-share.png"}
            unoptimized
          />
        </div>
      </section>

      <div className="guide-detail-layout">
        <section aria-labelledby="steps-title" className="guide-detail-main">
          <div className="guide-detail-section-heading">
            <p className="eyebrow">Take it one step at a time</p>
            <h2 id="steps-title">Repair steps</h2>
          </div>
          <GuideIllustrations
            area={guide.area}
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
              <p>Vitni says: stop if a part feels unsafe or needs force.</p>
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
              <ul className="parts-links">
                {guide.parts.map((part) => (
                  <li key={part.name}>
                    {part.url ? (
                      <a href={part.url} rel="noreferrer" target="_blank">
                        {part.name}
                        {part.details ? ` — ${part.details}` : ""}
                      </a>
                    ) : (
                      <a
                        href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${part.name} ${part.details}`)}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {part.name}
                        {part.details ? ` — ${part.details}` : ""}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="guide-aside-links">
            <Link href="/guides/">
              Browse all repair guides <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/#help">
              Find nearby repair help <ArrowRight aria-hidden="true" />
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
