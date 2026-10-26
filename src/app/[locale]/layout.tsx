import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import "@fontsource-variable/manrope";
import "@fontsource/dm-mono";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { routing, type Locale } from "@/i18n/routing";
import { createSiteStructuredData, serializeJsonLd } from "@/lib/structured-data";
import "../globals.css";

const publicSiteUrl = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");

export const viewport: Viewport = { themeColor: "#194c42", width: "device-width", initialScale: 1 };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale: Locale = hasLocale(routing.locales, requestedLocale) ? requestedLocale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    metadataBase: new URL(publicSiteUrl),
    title: t("siteTitle"),
    description: t("siteDescription"),
    applicationName: "Vitni",
    manifest: locale === "fr" ? "/fr/manifest.webmanifest" : "/manifest.webmanifest",
    icons: { icon: "/icon.svg?v=3", apple: "/images/vitni-mark.svg?v=3" },
    alternates: {
      canonical: locale === "fr" ? "/fr/" : "/",
      languages: { en: "/", fr: "/fr/" },
    },
    openGraph: {
      type: "website",
      siteName: "Vitni",
      title: t("siteTitle"),
      description: t("siteDescription"),
      url: locale === "fr" ? "/fr/" : "/",
      locale: locale === "fr" ? "fr_FR" : "en_GB",
      alternateLocale: [locale === "fr" ? "en_GB" : "fr_FR"],
      images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", title: t("siteTitle"), description: t("siteDescription"), images: ["/images/og/repairlens-share.png"] },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale;
  setRequestLocale(locale);
  const messages = await getMessages();
  const common = await getTranslations({ locale, namespace: "common" });
  const siteStructuredData = serializeJsonLd(createSiteStructuredData(publicSiteUrl, locale));

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteStructuredData }} />
          <a className="skip-link" href="#content">
            {common("skipToContent")}
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
          <GoogleAnalytics />
          <PwaRegistrar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
