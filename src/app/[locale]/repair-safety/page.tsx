import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, BookOpenCheck, ShieldCheck, ShoppingBag, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";
import type { Locale } from "@/i18n/routing";

const baseUrl = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
const route = "/repair-safety/";
const localizedRoute = (locale: Locale) => `${locale === "fr" ? "/fr" : ""}${route}`;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "repairSafety" });
  const url = localizedRoute(locale);
  return {
    title: t("metaTitle"),
    description: t("description"),
    alternates: { canonical: url, languages: { en: route, fr: `/fr${route}` } },
    openGraph: { type: "article", title: t("metaTitle"), description: t("description"), url },
  };
}

export default async function RepairSafetyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "repairSafety" });
  const url = localizedRoute(locale);
  const jsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: t("breadcrumb"),
        description: t("description"),
        url: new URL(url, baseUrl).href,
        inLanguage: locale,
      },
      createBreadcrumbList(baseUrl, [
        { name: t("home"), path: locale === "fr" ? "/fr/" : "/" },
        { name: t("breadcrumb"), path: url },
      ]),
    ],
  });

  return (
    <main className="repair-safety-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label={t("breadcrumbLabel")} className="breadcrumb">
        <Link href="/">{t("home")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("breadcrumb")}</span>
      </nav>
      <header className="repair-safety-hero">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("heroTitle")}</h1>
        <p>{t("heroIntro")}</p>
      </header>

      <div className="repair-safety-content">
        <section aria-labelledby="safety-how-title">
          <span aria-hidden="true"><BookOpenCheck /></span>
          <div>
            <h2 id="safety-how-title">{t("howTitle")}</h2>
            <p>{t("howP1")}</p>
            <p>{t("howP2")}</p>
          </div>
        </section>
        <section aria-labelledby="safety-stop-title">
          <span aria-hidden="true"><ShieldCheck /></span>
          <div>
            <h2 id="safety-stop-title">{t("stopTitle")}</h2>
            <p>{t("stopP")}</p>
            <p>{t("stopP2")}</p>
          </div>
        </section>
        <section aria-labelledby="safety-parts-title">
          <span aria-hidden="true"><ShoppingBag /></span>
          <div>
            <h2 id="safety-parts-title">{t("partsTitle")}</h2>
            <p>{t("partsP")}</p>
          </div>
        </section>
        <section aria-labelledby="safety-community-title">
          <span aria-hidden="true"><Wrench /></span>
          <div>
            <h2 id="safety-community-title">{t("communityTitle")}</h2>
            <p>{t("communityP")}</p>
            <div className="repair-safety-actions">
              <Link className={buttonVariants({ variant: "outline" })} href="/guides/">{t("browse")} <ArrowRight aria-hidden="true" /></Link>
              <Link className={buttonVariants()} href="/#help">{t("help")} <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
