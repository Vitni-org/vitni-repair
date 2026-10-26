import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnalyticsPreferencesButton } from "@/components/google-analytics";
import { InstallVitniButton } from "@/components/install-vitni-button";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("footer");
  const common = useTranslations("common");
  return (
    <footer className="border-border bg-background border-t px-[var(--page-gutter)] py-10">
      <div className="mx-auto grid max-w-[1450px] gap-8 md:grid-cols-[1.2fr_1fr_0.8fr]">
        <div>
          <Link className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.05em] no-underline" href="/">
            <span className="bg-primary grid size-9 place-items-center overflow-hidden rounded-full">
              <Image src="/images/vitni-mark.svg" alt="" width={36} height={36} className="size-full object-contain" />
            </span>
            Vitni
          </Link>
          <p className="text-muted-foreground mt-3 max-w-sm text-sm">
            {t("description")}
          </p>
        </div>
        <div>
          <p className="mb-2 font-extrabold">{t("everydayRepairs")}</p>
          <p className="text-muted-foreground max-w-md text-sm">
            {t("everydayDescription")}
          </p>
        </div>
        <nav aria-label={common("footerNavigation")} className="flex flex-col items-start gap-2 text-sm font-bold">
          <Link
            className="underline-offset-4 hover:underline"
            data-analytics-event="repair_flow_opened"
            data-analytics-location="footer"
            href="/#diagnose"
          >
            {t("getRepairSteps")}
          </Link>
          <Link
            className="underline-offset-4 hover:underline"
            data-analytics-event="guide_library_opened"
            data-analytics-location="footer"
            href="/guides/"
          >
            {t("exploreGuides")}
          </Link>
          <Link
            className="underline-offset-4 hover:underline"
            data-analytics-event="community_help_opened"
            data-analytics-link-type="cta"
            href="/#help"
          >
            {t("findRepairCafe")}
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/partners/">
            {t("partner")}
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/repair-safety/">
            {t("safety")}
          </Link>
          <AnalyticsPreferencesButton />
          <InstallVitniButton />
        </nav>
      </div>
      <div className="border-border text-muted-foreground mx-auto mt-8 flex max-w-[1450px] flex-wrap justify-between gap-3 border-t pt-5 font-mono text-xs">
        <span>Vitni</span>
        <span>{t("tagline")}</span>
      </div>
    </footer>
  );
}
