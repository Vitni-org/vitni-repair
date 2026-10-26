"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Wrench, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const navItems = [
  { href: "/#diagnose", label: "getRepairSteps", analyticsEvent: "repair_flow_opened", analyticsLocation: "site_nav" },
  { href: "/guides/", label: "repairGuides", analyticsEvent: "guide_library_opened", analyticsLocation: "site_nav" },
  { href: "/#help", label: "communityHelp", analyticsEvent: "community_help_opened", analyticsLinkType: "cta" },
  { href: "/partners/", label: "partners", analyticsEvent: undefined },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const changeLocale = (nextLocale: Locale) => {
    const search = new URLSearchParams(window.location.search);
    search.delete("cursor");
    const query = search.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}${window.location.hash}`, { locale: nextLocale });
    setMenuOpen(false);
  };

  const localeSelect = (
    <label className="inline-flex items-center gap-2 text-sm font-bold">
      <span className="sr-only">{common("switchLanguage")}</span>
      <select
        aria-label={common("switchLanguage")}
        className="border-border bg-background text-foreground min-h-10 rounded-md border px-2.5"
        onChange={(event) => changeLocale(event.target.value as Locale)}
        value={locale}
      >
        <option value="en">{common("english")}</option>
        <option value="fr">{common("french")}</option>
      </select>
    </label>
  );

  return (
    <header className="border-border/90 bg-background/95 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between gap-6 px-[var(--page-gutter)]">
        <Link
          className="text-foreground flex shrink-0 items-center gap-2.5 text-[1.22rem] font-extrabold tracking-[-0.06em] no-underline"
          href="/"
          aria-label={t("homeLabel")}
          onClick={() => setMenuOpen(false)}
        >
          <span className="bg-primary grid size-10 place-items-center overflow-hidden rounded-full">
            <Image src="/images/vitni-mark.svg" alt="" width={40} height={40} priority className="size-full object-contain" />
          </span>
          Vitni
        </Link>

        <nav aria-label={t("mainMenu")} className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-bold transition-colors"
              data-analytics-event={item.analyticsEvent}
              data-analytics-location={"analyticsLocation" in item ? item.analyticsLocation : undefined}
              data-analytics-link-type={"analyticsLinkType" in item ? item.analyticsLinkType : undefined}
              href={item.href}
              key={item.href}
            >
              {t(item.label)}
            </Link>
          ))}
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 ml-2 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-extrabold transition-colors"
            data-analytics-event="guide_library_opened"
            data-analytics-location="site_nav"
            href="/guides/"
          >
            <Wrench aria-hidden="true" data-icon="inline-start" />
            {t("findFix")}
          </Link>
          {localeSelect}
        </nav>

        <Button
          aria-controls="mobile-site-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
          className="size-11 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          size="icon"
          variant="outline"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </div>

      <nav
        aria-label={t("mobileMenu")}
        className={cn(
          "border-border bg-background absolute inset-x-0 top-full grid gap-1 border-b px-[var(--page-gutter)] py-3 shadow-lg lg:hidden",
          menuOpen ? "" : "hidden",
        )}
        id="mobile-site-menu"
      >
        {navItems.map((item) => (
          <Link
            className="text-foreground hover:bg-muted rounded-md px-3 py-3 font-bold transition-colors"
            data-analytics-event={item.analyticsEvent}
            data-analytics-location={"analyticsLocation" in item ? item.analyticsLocation : undefined}
            data-analytics-link-type={"analyticsLinkType" in item ? item.analyticsLinkType : undefined}
            href={item.href}
            key={item.href}
            onClick={() => setMenuOpen(false)}
          >
            {t(item.label)}
          </Link>
        ))}
        <div className="px-3 py-2">{localeSelect}</div>
      </nav>
    </header>
  );
}
