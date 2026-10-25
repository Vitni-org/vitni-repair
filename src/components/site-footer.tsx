import Image from "next/image";
import Link from "next/link";
import { AnalyticsPreferencesButton } from "@/components/google-analytics";

export function SiteFooter() {
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
            Make more of the things you already own. Vitni helps you find a safe, practical way to repair them.
          </p>
        </div>
        <div>
          <p className="mb-2 font-extrabold">Everyday repairs</p>
          <p className="text-muted-foreground max-w-md text-sm">
            Bikes, clothes, furniture, fixtures, kitchen bits, and the useful things that make a home.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col items-start gap-2 text-sm font-bold">
          <Link
            className="underline-offset-4 hover:underline"
            data-analytics-event="repair_flow_opened"
            data-analytics-location="footer"
            href="/#diagnose"
          >
            Get repair steps
          </Link>
          <Link
            className="underline-offset-4 hover:underline"
            data-analytics-event="guide_library_opened"
            data-analytics-location="footer"
            href="/guides/"
          >
            Explore common guides
          </Link>
          <Link
            className="underline-offset-4 hover:underline"
            data-analytics-event="community_help_opened"
            data-analytics-link-type="cta"
            href="/#help"
          >
            Find a repair café
          </Link>
          <AnalyticsPreferencesButton />
        </nav>
      </div>
      <div className="border-border text-muted-foreground mx-auto mt-8 flex max-w-[1450px] flex-wrap justify-between gap-3 border-t pt-5 font-mono text-xs">
        <span>Vitni</span>
        <span>Fix · wear · ride</span>
      </div>
    </footer>
  );
}
