import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideIllustrations } from "@/components/guide-illustrations";
import { getUnlistedGuide } from "@/lib/guide-repository";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shared repair guide | Vitni",
    robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}

export default async function SharedRepairPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guide = await getUnlistedGuide(token);
  if (!guide) notFound();
  return (
    <main className="detail-page" id="content">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Shared repair guide</span>
      </nav>
      <header className="shared-guide-heading">
        <p className="eyebrow">A guide shared with you</p>
        <h1>{guide.title}</h1>
        <p>{guide.desc}</p>
      </header>
      <div className="guide-detail-layout">
        <section className="guide-detail-main">
          <div className="guide-detail-section-heading">
            <p className="eyebrow">Take it one step at a time</p>
            <h2>Repair steps</h2>
          </div>
          <GuideIllustrations area={guide.area} canGenerate={Boolean(process.env.OPENAI_API_KEY)} slug="" steps={guide.steps} title={guide.title} />
        </section>
        <aside className="guide-detail-aside">
          <div className="guide-aside-card">
            <p className="eyebrow">Safety first</p>
            <p>{guide.safetyNotes}</p>
            <h2>Tools</h2>
            <ul>
              {guide.tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
