import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { HomePage } from "@/components/home-page";
import { getFeaturedRepairs } from "@/lib/guide-repository";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(routing.locales, requestedLocale) ? requestedLocale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "seo" });
  const route = locale === "fr" ? "/fr/" : "/";
  return {
    title: t("siteTitle"),
    description: t("siteDescription"),
    alternates: { canonical: route, languages: { en: "/", fr: "/fr/" } },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(routing.locales, requestedLocale) ? requestedLocale : routing.defaultLocale;
  const featured = await getFeaturedRepairs(locale);
  return <HomePage featured={featured.items} />;
}
