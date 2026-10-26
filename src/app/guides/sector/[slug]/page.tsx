import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpLeft, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { GuideCard } from "@/components/guide-card";
import { buttonVariants } from "@/components/ui/button";
import { getRepairSector, repairSectors } from "@/lib/repair-sectors";
import { searchGuides } from "@/lib/guide-repository";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export const runtime = "nodejs";

export function generateStaticParams() {
  return repairSectors.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sector = getRepairSector(slug);
  if (!sector) return { title: "Repair sector not found | Vitni", robots: { index: false, follow: false } };
  return {
    title: `${sector.label} repair guides | Vitni`,
    description: sector.description,
    alternates: { canonical: `/guides/sector/${slug}/` },
    openGraph: {
      type: "website",
      title: `${sector.label} repair guides | Vitni`,
      description: sector.description,
      url: `/guides/sector/${slug}/`,
      images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: "Vitni repair guides" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${sector.label} repair guides | Vitni`,
      description: sector.description,
      images: ["/images/og/repairlens-share.png"],
    },
  };
}

export default async function RepairSectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = getRepairSector(slug);
  if (!sector) notFound();
  const page = await searchGuides({ sector: sector.label, limit: 24 });
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const jsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${sector.label} repair guides`,
        description: sector.description,
        url: `${base}/guides/sector/${slug}/`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: page.items.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: guide.title,
            url: `${base}/guides/${guide.slug}/`,
          })),
        },
      },
      createBreadcrumbList(base, [
        { name: "Home", path: "/" },
        { name: "Repair library", path: "/guides/" },
        { name: sector.label, path: `/guides/sector/${slug}/` },
      ]),
    ],
  });

  return (
    <main className="sector-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/guides/">Repair library</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{sector.label}</span>
      </nav>
      <header className="sector-page__hero">
        <Link className="sector-page__back" href="/guides/">
          <ArrowUpLeft aria-hidden="true" /> All repair sectors
        </Link>
        <p className="eyebrow">Repair guides · {page.total} available</p>
        <h1>{sector.label}</h1>
        <p>{sector.intro}</p>
        <div className="sector-page__actions">
          <Link className={buttonVariants()} href="/#diagnose">
            Ask Vitni about your repair <ArrowRight aria-hidden="true" />
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href={`/guides/?sector=${encodeURIComponent(sector.label)}`}>
            Search this sector
          </Link>
        </div>
        <div className="sector-safety-note">
          <ShieldCheck aria-hidden="true" />
          <p>Check the guide’s safety note and exact fit before starting. Stop and ask a qualified repairer when the job may affect safety.</p>
        </div>
      </header>

      <section aria-labelledby="sector-guides-title" className="sector-page__library">
        <div className="guide-detail-section-heading">
          <p className="eyebrow">Practical starting points</p>
          <h2 id="sector-guides-title">{page.total ? `Guides for ${sector.label.toLowerCase()}` : "Guides are on the way"}</h2>
        </div>
        {page.items.length ? (
          <div className="guide-card-grid">
            {page.items.map((guide) => <GuideCard guide={guide} key={guide.slug} />)}
          </div>
        ) : (
          <div className="sector-empty">
            <p>There isn’t a published guide in this section yet. Describe a repair to Vitni or help make the library more useful.</p>
            <Link className={buttonVariants({ variant: "outline" })} href="/partners/">
              Share a repair resource <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}
        {"degraded" in page && page.degraded && <p className="library-note">The shared library is temporarily unavailable. Check back soon.</p>}
      </section>
      <section aria-labelledby="sector-faq-title" className="sector-faq">
        <p className="eyebrow">Practical answers</p>
        <h2 id="sector-faq-title">Common {sector.label.toLowerCase()} repair questions</h2>
        <div className="sector-faq__list">
          {sector.questions.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
