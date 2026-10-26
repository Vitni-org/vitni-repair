import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/dm-mono";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { createSiteStructuredData, serializeJsonLd } from "@/lib/structured-data";
import "./globals.css";

const publicSiteUrl = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: "Vitni — Keep good things going",
  description: "Get a safe, practical repair plan for everyday things you want to keep.",
  applicationName: "Vitni",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg?v=3", apple: "/images/vitni-mark.svg?v=3" },
  openGraph: {
    type: "website",
    siteName: "Vitni",
    title: "Vitni — Keep good things going",
    description: "Get a safe, practical repair plan for everyday things you want to keep.",
    url: "/",
    images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: "Vitni, your repair sidekick" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitni — Keep good things going",
    description: "Get a safe, practical repair plan for everyday things you want to keep.",
    images: ["/images/og/repairlens-share.png"],
  },
};

export const viewport: Viewport = { themeColor: "#194c42", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteStructuredData = serializeJsonLd(createSiteStructuredData(publicSiteUrl));
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteStructuredData }} />
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <GoogleAnalytics />
        <PwaRegistrar />
      </body>
    </html>
  );
}
