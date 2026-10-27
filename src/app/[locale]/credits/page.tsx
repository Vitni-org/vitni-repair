import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, BookOpen, CreditCard, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PaddleCredits } from "@/components/paddle-credits";
import { buttonVariants } from "@/components/ui/button";
import { getPaddleCreditConfig, isRepairCreditLedgerReady } from "@/lib/repair-credits";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "credits" });
  const prefix = locale === "fr" ? "/fr" : "";
  return {
    title: `${t("title")} | Vitni`,
    description: t("intro"),
    alternates: { canonical: `${prefix}/credits/` },
    robots: { index: false, follow: true },
  };
}

export default async function CreditsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "credits" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  const config = getPaddleCreditConfig();
  const enabled = Boolean(config && (await isRepairCreditLedgerReady()));

  return (
    <main className="credits-page" id="content">
      <div className="credits-page__inner">
        <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/">
          <ArrowLeft aria-hidden="true" data-icon="inline-start" /> {common("home")}
        </Link>
        <header className="credits-hero">
          <p className="eyebrow"><Sparkles aria-hidden="true" /> {t("eyebrow")}</p>
          <h1 className="hero-title">{t("title")}</h1>
          <p className="credits-hero__intro">{t("intro")}</p>
        </header>

        <PaddleCredits
          clientToken={config?.clientToken || ""}
          enabled={enabled}
          environment={config?.environment || "sandbox"}
          locale={locale}
        />

        <div className="credits-policies">
          <p><CreditCard aria-hidden="true" /> <strong>{t("oneTime")}</strong></p>
          <p><BookOpen aria-hidden="true" /> {t("freeLibrary")}</p>
          <p>{t("walletNote")}</p>
        </div>

        <section className="credits-how" aria-labelledby="credits-how-title">
          <h2 id="credits-how-title">{t("faqTitle")}</h2>
          <p>{t("faqBody")}</p>
        </section>
      </div>
    </main>
  );
}
