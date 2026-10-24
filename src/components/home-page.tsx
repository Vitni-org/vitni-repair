import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera, Check, MapPin, Recycle, Sparkles } from "lucide-react";
import { VitniMascot } from "@/components/vitni-mascot";
import { FeaturedCarousel, type FeaturedItem } from "@/components/featured-carousel";
import { DeferredRepairRequest } from "@/components/deferred-repair-request";
import { buttonVariants } from "@/components/ui/button";

const parisRepairSpots = [
  { name: "Repair Café Centre", venue: "Ressourcerie l’Alternative", address: "13 rue Léopold Bellan, 75002 Paris" },
  { name: "Repair Café Paris 5e", venue: "", address: "13 rue Santeuil, 75005 Paris" },
  { name: "Repair Café Paris 10e", venue: "Le Pari’s des Faubourgs", address: "12 rue Léon Schwartzenberg, 75010 Paris" },
  { name: "Repair Café Paris 11e", venue: "Le Picoulet", address: "59 rue de la Fontaine au Roi, 75011 Paris" },
  { name: "Repair Café Paris 14e", venue: "Florimont", address: "5–9 place Marcel Paul, 75014 Paris" },
  { name: "Repair Café Paris 18e", venue: "Le Poulpe", address: "4 bis rue d’Oran, 75018 Paris" },
];

const parisRepairMap = "https://maps.google.com/maps?q=repair+caf%C3%A9+Paris&z=12&output=embed";

export function HomePage({ featured }: { featured: FeaturedItem[] }) {
  return (
    <main id="content">
      <section className="home-hero" id="top">
        <div className="home-hero__copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Meet Vitni · your repair sidekick
          </p>
          <h1 className="hero-title">
            Keep good things <em>going.</em>
          </h1>
          <p className="home-hero__lede">I’m Vitni. Show me what changed, and I’ll help you find a safe, practical next step.</p>
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
          <p>Send me a photo and a few words about what changed. I’ll suggest safe steps, parts to check, and nearby help.</p>
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
          <p>Tell me what changed. A clear photo helps me spot the detail, but words work too.</p>
        </div>
        <DeferredRepairRequest />
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
          <a className="community-directory-link" href="https://www.repaircafeparis.fr/rc-quartier/" rel="noreferrer" target="_blank">
            <MapPin aria-hidden="true" />
            Explore the Paris Repair Café network <ArrowUpRight aria-hidden="true" />
          </a>
          <p className="community-note">Starting in Paris. Search Google Maps for repair cafés and check with each organizer before visiting.</p>
        </div>
        <div className="community-map">
          <iframe
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Google Maps search for repair cafés in Paris"
            src={parisRepairMap}
          />
          <a
            className="community-map__open"
            href="https://www.google.com/maps/search/?api=1&query=repair+caf%C3%A9+Paris"
            rel="noreferrer"
            target="_blank"
          >
            Open repair cafés in Google Maps <ArrowUpRight aria-hidden="true" />
          </a>
          <ul aria-label="Repair cafés in Paris" className="community-venues">
            {parisRepairSpots.map((spot, index) => {
              const destination = encodeURIComponent(`${spot.name}${spot.venue ? `, ${spot.venue}` : ""}, ${spot.address}`);
              return (
                <li key={spot.name}>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${destination}`} rel="noreferrer" target="_blank">
                    <span aria-hidden="true" className="community-venue__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="community-venue__details">
                      <strong>{spot.name}</strong>
                      <span>
                        {spot.venue ? `${spot.venue} · ` : ""}
                        {spot.address}
                      </span>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="community-map__source">
            Location directory:{" "}
            <a href="https://www.repaircafeparis.fr/rc-quartier/" rel="noreferrer" target="_blank">
              Repair Café Paris
            </a>{" "}
            ·{" "}
            <a href="https://www.paris.fr/pages/apprendre-a-reparer-a-paris-c-est-facile-31096" rel="noreferrer" target="_blank">
              Ville de Paris
            </a>
          </p>
        </div>
      </section>

      <section className="keep-section">
        <div className="keep-section__art">
          <Image alt="Vitni, a cheerful comic-style repair robot with a wrench" fill sizes="(max-width: 760px) 70vw, 360px" src="/images/vitni.svg" />
        </div>
        <div>
          <p className="eyebrow">Repairs worth keeping</p>
          <h2 className="section-title">
            Give good things
            <br />
            another chapter.
          </h2>
          <p>I love the little fixes that keep useful things in your life. I’ll help you see what’s safe to try and when to ask a repair pro.</p>
          <Link className="text-link text-link--arrow" href="#diagnose">
            Ask Vitni about your item <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
