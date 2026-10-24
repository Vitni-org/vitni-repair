import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/dm-mono";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PwaRegistrar } from "@/components/pwa-registrar";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || "https://vitni.cc"),
  title: "RepairLens — Keep good things going",
  description: "Get a safe, practical repair plan for everyday things you want to keep.",
  applicationName: "RepairLens",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg?v=3", apple: "/images/vitni-mark.svg?v=3" },
  openGraph: {
    type: "website",
    siteName: "RepairLens",
    title: "RepairLens — Keep good things going",
    description: "Get a safe, practical repair plan for everyday things you want to keep.",
    url: "/",
    images: [{ url: "/images/og/repairlens-share.png", width: 1200, height: 630, alt: "RepairLens with Vitni, your repair sidekick" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepairLens — Keep good things going",
    description: "Get a safe, practical repair plan for everyday things you want to keep.",
    images: ["/images/og/repairlens-share.png"],
  },
};

export const viewport: Viewport = { themeColor: "#194c42", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <PwaRegistrar />
      </body>
    </html>
  );
}
