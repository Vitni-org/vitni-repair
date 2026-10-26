import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Package, ShieldCheck, Users, Wrench } from "lucide-react";
import { PartnerInquiryForm } from "@/components/partner-inquiry-form";
import { buttonVariants } from "@/components/ui/button";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Partner with Vitni | Repair cafés, local repairers, and parts",
  description:
    "Help make repair easier to find. Vitni is looking for local repairers, repair cafés, parts retailers, and product makers to build useful repair pathways.",
  alternates: { canonical: "/partners/" },
  openGraph: {
    type: "website",
    title: "Partner with Vitni",
    description: "Help people move from a repair guide to the right local help or compatible part.",
    url: "/partners/",
    images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: "Vitni, your repair sidekick" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner with Vitni",
    description: "Help people move from a repair guide to the right local help or compatible part.",
    images: ["/images/og/repairlens-share.png"],
  },
};

const opportunities = [
  {
    icon: Wrench,
    title: "Repairers and workshops",
    copy: "Help people find a skilled local repairer when a job needs tools, experience, or an in-person assessment.",
  },
  {
    icon: Users,
    title: "Repair cafés and community groups",
    copy: "Share opening details, the kinds of repairs you welcome, and ways people can volunteer or get involved.",
  },
  {
    icon: Package,
    title: "Parts shops and product makers",
    copy: "Help us make parts suggestions more useful with reliable compatibility information, product references, and local stock links.",
  },
];

export default function PartnersPage() {
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const contactPageSchema = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        name: "Partner with Vitni",
        description: "Contact Vitni about local repair services, repair cafés, parts retailers, or product partnerships.",
        url: `${origin}/partners/`,
      },
      createBreadcrumbList(origin, [
        { name: "Home", path: "/" },
        { name: "Partner with Vitni", path: "/partners/" },
      ]),
    ],
  });

  return (
    <main className="partners-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: contactPageSchema }} />
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Partner with Vitni</span>
      </nav>
      <section className="partners-hero">
        <p className="eyebrow">Repair works better together</p>
        <h1>Help good things stay in use.</h1>
        <p className="partners-hero__lede">
          Vitni turns a repair question into a clear next step. Now we’re looking for local repairers, community workshops, and parts partners who can make that next step real.
        </p>
        <div className="partners-hero__actions">
          <a className={buttonVariants()} href="#contact">
            Start a conversation <ArrowRight aria-hidden="true" />
          </a>
          <Link className={buttonVariants({ variant: "outline" })} href="/#help">
            <MapPin aria-hidden="true" /> Explore community help
          </Link>
        </div>
        <div className="partners-hero__note">
          <ShieldCheck aria-hidden="true" />
          <span>We’re building the network now. No business or retailer is shown as a partner until a relationship is agreed.</span>
        </div>
      </section>

      <section aria-labelledby="partners-opportunities" className="partner-opportunities">
        <div className="partner-section-heading">
          <div>
            <p className="eyebrow">Ways to get involved</p>
            <h2 id="partners-opportunities">Make the next repair easier.</h2>
          </div>
          <p>Start with Paris and nearby areas, learn what people need, then grow the network city by city.</p>
        </div>
        <div className="partner-opportunity-grid">
          {opportunities.map(({ icon: Icon, title, copy }) => (
            <article className="partner-opportunity" key={title}>
              <span aria-hidden="true" className="partner-opportunity__icon"><Icon /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="parts-path" className="partner-parts-path">
        <div>
          <p className="eyebrow">Useful parts, with fit checks</p>
          <h2 id="parts-path">A guide should help people find the right piece.</h2>
          <p>
            When a repair needs a replacement, Vitni can show the part description and compatibility checks beside search links. Visitors should confirm model, size, material, and return terms before ordering.
          </p>
          <p>
            We’re interested in verified product feeds, local stock links, and repairer recommendations. Today’s Amazon France and shopping links are generic searches, not confirmed matches or commercial partnerships.
          </p>
        </div>
        <div className="partner-parts-path__steps" aria-label="Parts sourcing approach">
          <div><span>01</span><p>Describe the part and what it needs to fit.</p></div>
          <div><span>02</span><p>Compare a retailer or ask a local parts specialist.</p></div>
          <div><span>03</span><p>Check fit before ordering or installing.</p></div>
        </div>
      </section>

      <section aria-labelledby="partner-contact-title" className="partner-contact" id="contact">
        <div className="partner-contact__intro">
          <p className="eyebrow">Local community · parts · repair</p>
          <h2 id="partner-contact-title">Tell us what you could bring.</h2>
          <p>Share your organization, service area, and what you’d like to explore. The Vitni team will use the details only to follow up about this enquiry.</p>
          <div className="partner-contact__callout">
            <MapPin aria-hidden="true" />
            <div><strong>Starting in Paris</strong><span>We’re interested in neighborhood repair cafés, independent ateliers, and parts sources, with a view to opening new cities over time.</span></div>
          </div>
        </div>
        <PartnerInquiryForm />
      </section>
    </main>
  );
}
