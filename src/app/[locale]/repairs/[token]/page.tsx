import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { GuideIllustrations } from "@/components/guide-illustrations";
import { getUnlistedGuide } from "@/lib/guide-repository";
import { localizedSectorLabel } from "@/lib/catalog-localization";
import type { Locale } from "@/i18n/routing";

export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sharedGuide" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}

export default async function SharedRepairPage({ params }: { params: Promise<{ locale: Locale; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const guide = await getUnlistedGuide(token, locale);
  if (!guide) notFound();
  const t = await getTranslations({ locale, namespace: "sharedGuide" });
  const sector = localizedSectorLabel(guide.sector, locale);
  const contentLocale = guide.contentLocale || locale;
  return (
    <main className="detail-page" id="content">
      <nav aria-label={t("breadcrumbLabel")} className="breadcrumb">
        <Link href="/">{t("home")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("breadcrumb")}</span>
      </nav>
      <header className="shared-guide-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 lang={contentLocale}>{guide.title}</h1>
        <p lang={contentLocale}>{guide.desc}</p>
      </header>
      <div className="guide-detail-layout">
        <section className="guide-detail-main">
          <div className="guide-detail-section-heading">
            <p className="eyebrow">{t("stepsEyebrow")}</p>
            <h2>{t("stepsTitle")}</h2>
          </div>
          <GuideIllustrations area={sector} canGenerate={Boolean(process.env.OPENAI_API_KEY)} contentLocale={contentLocale} slug="" steps={guide.steps} title={guide.title} />
        </section>
        <aside className="guide-detail-aside">
          <div className="guide-aside-card">
            <p className="eyebrow">{t("safety")}</p>
            <p lang={contentLocale}>{guide.safetyNotes}</p>
            <h2>{t("tools")}</h2>
            <ul>
              {guide.tools.map((tool) => (
                <li key={tool} lang={contentLocale}>{tool}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
