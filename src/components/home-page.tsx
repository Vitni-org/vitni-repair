import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera, Check, MapPin, Recycle, Sparkles, Wrench } from "lucide-react";
import { VitniMascot } from "@/components/vitni-mascot";
import { FeaturedCarousel, type FeaturedItem } from "@/components/featured-carousel";
import { RepairRequest } from "@/components/repair-request";
import { buttonVariants } from "@/components/ui/button";

export function HomePage({ featured }: { featured: FeaturedItem[] }) {
  return (
    <main id="content">
      <section className="home-hero" id="top">
        <div className="home-hero__copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Your pocket repair guide
          </p>
          <h1 className="hero-title">
            Keep good things <em>going.</em>
          </h1>
          <p className="home-hero__lede">Show us what changed. Get a safe, illustrated route to fixing it.</p>
          <div className="home-hero__actions">
            <Link className={buttonVariants({ className: "primary-action", size: "lg" })} href="#diagnose">
              Get my repair steps <ArrowRight aria-hidden="true" />
            </Link>
            <Link className={buttonVariants({ className: "secondary-action", size: "lg", variant: "outline" })} href="/guides/">
              Browse our guides
            </Link>
            <Link className={buttonVariants({ className: "community-action", size: "lg", variant: "outline" })} href="#help">
              Get help from our community
            </Link>
          </div>
          <div className="home-hero__trust">
            <span>
              <Check aria-hidden="true" /> No item category needed
            </span>
            <span>
              <Check aria-hidden="true" /> Safety-first advice
            </span>
            <span>
              <Check aria-hidden="true" /> Keep useful things in use
            </span>
          </div>
        </div>
        <div className="home-hero__visual">
          <div className="hero-orbit hero-orbit--one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit--two" aria-hidden="true" />
          <span className="hero-sticker hero-sticker--top">
            <Sparkles aria-hidden="true" /> A little help goes a long way
          </span>
          <VitniMascot className="hero-vitni" imageClassName="hero-vitni__fallback" priority />
          <div className="hero-featured">
            <FeaturedCarousel items={featured} />
          </div>
          <span className="hero-sticker hero-sticker--bottom">
            <Recycle aria-hidden="true" /> Repair more. Waste less.
          </span>
        </div>
      </section>

      <section aria-labelledby="flow-title" className="flow-section">
        <div className="flow-section__header">
          <div>
            <p className="eyebrow">One clear path</p>
            <h2 className="section-title" id="flow-title">
              From a problem in your hand
              <br className="desktop-break" /> to the next right move.
            </h2>
          </div>
          <p>Vitni turns a photo and a few words into a practical repair plan, then helps you find the right parts and nearby help.</p>
        </div>
        <div className="flow-steps">
          <article>
            <span className="flow-icon flow-icon--lime">
              <Camera aria-hidden="true" />
            </span>
            <p className="eyebrow">01 · See</p>
            <h3>Show the issue</h3>
            <p>Take a clear photo and describe what changed, snapped, slipped, or stopped working.</p>
          </article>
          <article>
            <span className="flow-icon flow-icon--coral">
              <Sparkles aria-hidden="true" />
            </span>
            <p className="eyebrow">02 · Understand</p>
            <h3>Get a safe route</h3>
            <p>See likely causes, suitable tools, and clear stop signs before you take anything apart.</p>
          </article>
          <article>
            <span className="flow-icon flow-icon--mint">
              <MapPin aria-hidden="true" />
            </span>
            <p className="eyebrow">03 · Act</p>
            <h3>Find the right help</h3>
            <p>Locate parts and nearby repair support when the job needs more than a home toolkit.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="diagnose-title" className="diagnose-section" id="diagnose">
        <div className="diagnose-section__intro">
          <p className="eyebrow">A good repair starts with a closer look</p>
          <h2 className="section-title" id="diagnose-title">
            What happened to it?
          </h2>
          <p>Share the change you noticed. Add a photo if you can. Vitni will look for the likely issue and suggest a safe next step.</p>
        </div>
        <RepairRequest />
      </section>

      <section aria-labelledby="guides-title" className="guide-promo">
        <div className="guide-promo__copy">
          <p className="eyebrow">Common fixes</p>
          <h2 className="section-title" id="guides-title">
            Find a guide before you reach for a tool.
          </h2>
          <p>Browse illustrated starting points for bikes, windows, doors, kitchens, walls, clothes, and everyday household items.</p>
        </div>
        <div className="guide-promo__action">
        <Link className={buttonVariants({ size: "lg" })} href="/guides/">
            Explore repair guides <ArrowRight aria-hidden="true" />
        </Link>
          <span>Clear steps · safety notes · parts to check</span>
        </div>
      </section>

      <section aria-labelledby="community-title" className="community-section" id="help">
        <div className="community-section__copy">
          <p className="eyebrow">A hand when you need one</p>
          <h2 className="section-title" id="community-title">
            Repair is better together.
          </h2>
          <p>Some fixes need another pair of hands or a specialist tool. Find a repair café, shared workshop, or local bricolage space near you.</p>
          <div className="community-links">
            <a href="https://www.google.com/maps/search/repair+caf%C3%A9+Paris" rel="noreferrer" target="_blank">
              <MapPin aria-hidden="true" />
              Repair cafés near Paris <ArrowUpRight aria-hidden="true" />
            </a>
            <a href="https://www.google.com/maps/search/atelier+bricolage+Paris" rel="noreferrer" target="_blank">
              <Wrench aria-hidden="true" />
              Bricolage workshops in Paris <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <p className="community-note">Map searches open with Paris as a starting point. Search your own area to find nearby help.</p>
        </div>
        <div className="community-map">
          <iframe
            loading="lazy"
            referrerPolicy="no-referrer"
            title="Map centred on Paris, France"
            src="https://www.openstreetmap.org/export/embed.html?bbox=2.275%2C48.815%2C2.42%2C48.89&layer=mapnik&marker=48.8566%2C2.3522"
          />
          <a href="https://www.openstreetmap.org/?mlat=48.8566&mlon=2.3522#map=13/48.8566/2.3522" rel="noreferrer" target="_blank">
            View the Paris map <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="keep-section">
        <div className="keep-section__art">
          <Image alt="Vitni, a cheerful comic-style repair robot with a wrench" fill sizes="(max-width: 760px) 70vw, 360px" src="/images/vitni.svg" />
        </div>
        <div>
          <p className="eyebrow">Small repairs, longer stories</p>
          <h2 className="section-title">
            Give good things
            <br />
            another chapter.
          </h2>
          <p>
            Learn a repair, share what worked, and pass useful things on. Vitni is here for the satisfying little fixes and the moments when it’s time
            to ask a pro.
          </p>
          <Link className="text-link text-link--arrow" href="/guides/">
            Meet your next repair <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
