import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, MapPin, Package, ShieldCheck, Users, Wrench } from "lucide-react";
import { PartnerInquiryForm } from "@/components/partner-inquiry-form";
import { buttonVariants } from "@/components/ui/button";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  const prefix = locale === "fr" ? "/fr" : "";
  return {
    title: `${t("title")} | Vitni`,
    description: t("intro"),
    alternates: { canonical: `${prefix}/partners/`, languages: { en: "/partners/", fr: "/fr/partners/" } },
    openGraph: {
      type: "website",
      title: `${t("title")} | Vitni`,
      description: t("intro"),
      url: `${prefix}/partners/`,
      images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: locale === "fr" ? "Vitni, votre compagnon réparation" : "Vitni, your repair sidekick" }],
    },
    twitter: { card: "summary_large_image", title: `${t("title")} | Vitni`, description: t("intro"), images: ["/images/og/repairlens-share.png"] },
  };
}

const opportunities = [
  { icon: Wrench, title: "opportunityRepairers", copy: "opportunityRepairersCopy" },
  { icon: Users, title: "opportunityCafes", copy: "opportunityCafesCopy" },
  { icon: Package, title: "opportunityParts", copy: "opportunityPartsCopy" },
];

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  const common = await getTranslations({ locale, namespace: "common" });
  const prefix = locale === "fr" ? "/fr" : "";
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const contactPageSchema = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        name: t("title"),
        description: t("intro"),
        url: `${origin}${prefix}/partners/`,
      },
      createBreadcrumbList(origin, [
        { name: common("home"), path: `${prefix}/` },
        { name: t("breadcrumb"), path: `${prefix}/partners/` },
      ]),
    ],
  });

  return (
    <main className="partners-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: contactPageSchema }} />
      <nav aria-label={common("breadcrumb")} className="breadcrumb">
        <Link href="/">{common("home")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("breadcrumb")}</span>
      </nav>
      <section className="partners-hero">
        <p className="eyebrow">{t("heroEyebrow")}</p>
        <h1>{t("heroTitle")}</h1>
        <p className="partners-hero__lede">{t("heroDescription")}</p>
        <div className="partners-hero__actions">
          <a className={buttonVariants()} href="#contact">
            {t("startConversation")} <ArrowRight aria-hidden="true" />
          </a>
          <Link className={buttonVariants({ variant: "outline" })} href="/#help">
            <MapPin aria-hidden="true" /> {t("exploreCommunity")}
          </Link>
        </div>
        <div className="partners-hero__note">
          <ShieldCheck aria-hidden="true" />
          <span>{t("networkNote")}</span>
        </div>
      </section>

      <section aria-labelledby="partners-opportunities" className="partner-opportunities">
        <div className="partner-section-heading">
          <div>
            <p className="eyebrow">{t("opportunitiesEyebrow")}</p>
            <h2 id="partners-opportunities">{t("opportunitiesTitle")}</h2>
          </div>
          <p>{t("opportunitiesIntro")}</p>
        </div>
        <div className="partner-opportunity-grid">
          {opportunities.map(({ icon: Icon, title, copy }) => (
            <article className="partner-opportunity" key={title}>
              <span aria-hidden="true" className="partner-opportunity__icon"><Icon /></span>
              <h3>{t(title)}</h3>
              <p>{t(copy)}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="parts-path" className="partner-parts-path">
        <div>
          <p className="eyebrow">{t("partsEyebrow")}</p>
          <h2 id="parts-path">{t("partsTitle")}</h2>
          <p>{t("partsCopy1")}</p>
          <p>{t("partsCopy2")}</p>
        </div>
        <div className="partner-parts-path__steps" aria-label={t("partsApproachLabel")}>
          <div><span>01</span><p>{t("partStep1")}</p></div>
          <div><span>02</span><p>{t("partStep2")}</p></div>
          <div><span>03</span><p>{t("partStep3")}</p></div>
        </div>
      </section>

      <section aria-labelledby="partner-contact-title" className="partner-contact" id="contact">
        <div className="partner-contact__intro">
          <p className="eyebrow">{t("contactEyebrow")}</p>
          <h2 id="partner-contact-title">{t("contactTitle")}</h2>
          <p>{t("contactDescription")}</p>
          <div className="partner-contact__callout">
            <MapPin aria-hidden="true" />
            <div><strong>{t("startingParis")}</strong><span>{t("parisNote")}</span></div>
          </div>
        </div>
        <PartnerInquiryForm />
      </section>
    </main>
  );
}
