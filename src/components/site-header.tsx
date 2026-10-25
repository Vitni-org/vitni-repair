"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Wrench, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#diagnose", label: "Get repair steps", analyticsEvent: "repair_flow_opened", analyticsLocation: "site_nav" },
  { href: "/guides/", label: "Repair guides", analyticsEvent: "guide_library_opened", analyticsLocation: "site_nav" },
  { href: "/#help", label: "Community help", analyticsEvent: "community_help_opened", analyticsLinkType: "cta" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-border/90 bg-background/95 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between gap-6 px-[var(--page-gutter)]">
        <Link
          className="text-foreground flex shrink-0 items-center gap-2.5 text-[1.22rem] font-extrabold tracking-[-0.06em] no-underline"
          href="/"
          aria-label="Vitni home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="bg-primary grid size-10 place-items-center overflow-hidden rounded-full">
            <Image src="/images/vitni-mark.svg" alt="" width={40} height={40} priority className="size-full object-contain" />
          </span>
          Vitni
        </Link>

        <nav aria-label="Main menu" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-bold transition-colors"
              data-analytics-event={item.analyticsEvent}
              data-analytics-location={"analyticsLocation" in item ? item.analyticsLocation : undefined}
              data-analytics-link-type={"analyticsLinkType" in item ? item.analyticsLinkType : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 ml-2 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-extrabold transition-colors"
            data-analytics-event="guide_library_opened"
            data-analytics-location="site_nav"
            href="/guides/"
          >
            <Wrench aria-hidden="true" data-icon="inline-start" />
            Find a fix
          </Link>
        </nav>

        <Button
          aria-controls="mobile-site-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="size-11 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          size="icon"
          variant="outline"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </div>

      <nav
        aria-label="Mobile menu"
        className={cn(
          "border-border bg-background absolute inset-x-0 top-full grid gap-1 border-b px-[var(--page-gutter)] py-3 shadow-lg md:hidden",
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
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
