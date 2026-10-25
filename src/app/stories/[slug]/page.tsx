import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { getStory, getStoryEntries } from "@/lib/content";

export async function generateStaticParams() {
  return getStoryEntries().map(({ id }) => ({ slug: id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) return { title: "Story not found | Vitni", robots: { index: false, follow: false } };
  return {
    title: `${story.title} | Vitni repair story`,
    description: story.situation,
    alternates: { canonical: `/stories/${slug}/` },
    openGraph: {
      type: "article",
      url: `/stories/${slug}/`,
      title: story.title,
      description: story.situation,
      images: [{ url: story.image, alt: story.alt }],
    },
    twitter: { card: "summary_large_image", title: story.title, description: story.situation, images: [story.image] },
  };
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.situation,
    image: `${origin}${story.image}`,
    url: `${origin}/stories/${slug}/`,
  }).replace(/</g, "\\u003c");
  return (
    <main className="detail-page story-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/guides/">Repair library</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{story.title}</span>
      </nav>
      <section className="story-hero">
        <div>
          <p className="eyebrow">A repair story · {story.tag}</p>
          <h1>{story.title}</h1>
          <p>{story.situation}</p>
          <span className="story-outcome">{story.outcome}</span>
        </div>
        <div className="story-hero__image">
          <Image alt={story.alt} fill priority sizes="(max-width: 800px) 92vw, 45vw" src={story.image} unoptimized />
        </div>
      </section>
      <div className="guide-detail-layout story-detail-layout">
        <section className="story-steps">
          <div className="guide-detail-section-heading">
            <p className="eyebrow">How it was handled</p>
            <h2>Steps taken</h2>
          </div>
          <ol>
            {story.steps.map(([title, detail], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <aside className="guide-detail-aside">
          <div className="guide-aside-card">
            <h2>
              <Wrench aria-hidden="true" /> Tools
            </h2>
            <ul>
              {story.tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </div>
          <div className="guide-aside-card safety-note">
            <h2>
              <ShieldCheck aria-hidden="true" /> Safety note
            </h2>
            <p>{story.safety}</p>
          </div>
        </aside>
      </div>
      <section className="story-next">
        <div>
          <p className="eyebrow">Your turn</p>
          <h2>Want a guide for your repair?</h2>
          <p>Tell me what changed. I’ll help you find a safe next step for your repair.</p>
        </div>
        <Link href="/#diagnose">
          Get my repair steps <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
