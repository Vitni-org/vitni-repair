import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ArrowUpRight, Camera, Check, MapPin, Recycle, Sparkles } from "lucide-react";
import { VitniMascot } from "@/components/vitni-mascot";
import { FeaturedCarousel, type FeaturedItem } from "@/components/featured-carousel";
import { DeferredRepairRequest } from "@/components/deferred-repair-request";
import { buttonVariants } from "@/components/ui/button";

const parisRepairSpots = [
  { name: "Repair Café Centre", venue: "Ressourcerie l’Alternative", address: "13 rue Léopold Bellan, 75002 Paris" },
  { name: "Repair Café Paris 10e", venue: "Le Pari’s des Faubourgs", address: "12 rue Léon Schwartzenberg, 75010 Paris" },
  { name: "Repair Café Paris 11e", venue: "Le Picoulet", address: "59 rue de la Fontaine au Roi, 75011 Paris" },
  { name: "Repair Café Paris 12e", venue: "Centre Reuilly", address: "19 rue Antoine-Julien Hénard, 75012 Paris" },
  { name: "Repair Café Paris 14e", venue: "Florimont", address: "5–9 place Marcel Paul, 75014 Paris" },
  { name: "Repair Café Paris 18e", venue: "Le Poulpe", address: "4 bis rue d’Oran, 75018 Paris" },
];

const parisRepairMap = "https://maps.google.com/maps?q=repair+caf%C3%A9+Paris&z=12&output=embed";

export function HomePage({ featured }: { featured: FeaturedItem[] }) {
  const t = useTranslations("home");
  const lib = useTranslations("guideLibrary");
  return (
    <main id="content">
      <section className="home-hero" id="top">
        <div className="home-hero__copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {t("eyebrow")}
          </p>
          <h1 className="hero-title">
            {t("titleFirst")} <em>{t("titleEmphasis")}</em>
          </h1>
          <p className="home-hero__lede">{t("lede")}</p>
          <div className="home-hero__actions">
            <Link
              className={buttonVariants({ className: "primary-action", size: "lg" })}
              data-analytics-event="repair_flow_opened"
              data-analytics-location="home_hero"
              href="#diagnose"
            >
              {t("getSteps")} <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              className={buttonVariants({ className: "secondary-action", size: "lg", variant: "outline" })}
              data-analytics-event="guide_library_opened"
              data-analytics-location="home_hero"
              href="/guides/"
            >
              {t("browseGuides")}
            </Link>
            <Link
              className={buttonVariants({ className: "community-action", size: "lg", variant: "outline" })}
              data-analytics-event="community_help_opened"
              data-analytics-link-type="cta"
              href="#help"
            >
              {t("community")}
            </Link>
          </div>
          <div className="home-hero__trust">
            <span>
              <Check aria-hidden="true" /> {t("noCategory")}
            </span>
            <span>
              <Check aria-hidden="true" /> {t("safetyFirst")}
            </span>
            <span>
              <Check aria-hidden="true" /> {t("keepInUse")}
            </span>
          </div>
        </div>
        <div className="home-hero__visual">
          <div className="hero-orbit hero-orbit--one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit--two" aria-hidden="true" />
          <span className="hero-sticker hero-sticker--top">
            <Sparkles aria-hidden="true" /> {t("topSticker")}
          </span>
          <VitniMascot className="hero-vitni" imageClassName="hero-vitni__fallback" priority />
          <div className="hero-featured">
            <FeaturedCarousel items={featured} />
          </div>
          <span className="hero-sticker hero-sticker--bottom">
            <Recycle aria-hidden="true" /> {t("bottomSticker")}
          </span>
        </div>
      </section>

      <section aria-labelledby="flow-title" className="flow-section">
        <div className="flow-section__header">
          <div>
            <p className="eyebrow">{t("clearPath")}</p>
            <h2 className="section-title" id="flow-title">{t("flowTitle")}</h2>
          </div>
          <p>{t("flowIntro")}</p>
        </div>
        <div className="flow-steps">
          <article>
            <span className="flow-icon flow-icon--lime">
              <Camera aria-hidden="true" />
            </span>
            <p className="eyebrow">01 · {t("see")}</p>
            <h3>{t("showIssue")}</h3>
            <p>{t("showIssueDescription")}</p>
          </article>
          <article>
            <span className="flow-icon flow-icon--coral">
              <Sparkles aria-hidden="true" />
            </span>
            <p className="eyebrow">02 · {t("understand")}</p>
            <h3>{t("safeRoute")}</h3>
            <p>{t("safeRouteDescription")}</p>
          </article>
          <article>
            <span className="flow-icon flow-icon--mint">
              <MapPin aria-hidden="true" />
            </span>
            <p className="eyebrow">03 · {t("act")}</p>
            <h3>{t("rightHelp")}</h3>
            <p>{t("rightHelpDescription")}</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="diagnose-title" className="diagnose-section" id="diagnose">
        <div className="diagnose-section__intro">
          <p className="eyebrow">{lib("diagnoseEyebrow")}</p>
          <h2 className="section-title" id="diagnose-title">{t("repairTitle")}</h2>
          <p>{t("repairIntro")}</p>
        </div>
        <DeferredRepairRequest />
      </section>

      <section aria-labelledby="guides-title" className="guide-promo">
        <div className="guide-promo__copy">
          <p className="eyebrow">{lib("commonRepairs")}</p>
          <h2 className="section-title" id="guides-title">{lib("promoTitle")}</h2>
          <p>{lib("promoDescription")}</p>
        </div>
        <div className="guide-promo__action">
          <Link
            className={buttonVariants({ size: "lg" })}
            data-analytics-event="guide_library_opened"
            data-analytics-location="home_promo"
            href="/guides/"
          >
            {lib("promoLink")} <ArrowRight aria-hidden="true" />
          </Link>
          <span>{lib("promoNote")}</span>
        </div>
      </section>

      <section aria-labelledby="community-title" className="community-section" id="help">
        <div className="community-section__copy">
          <p className="eyebrow">{lib("communityEyebrow")}</p>
          <h2 className="section-title" id="community-title">{lib("communityTitle")}</h2>
          <p>{lib("communityDescription")}</p>
          <a
            className="community-directory-link"
            data-analytics-event="community_help_opened"
            data-analytics-link-type="directory"
            href="https://www.repaircafeparis.fr/rc-quartier/"
            rel="noreferrer"
            target="_blank"
          >
            <MapPin aria-hidden="true" />
            {lib("networkLink")} <ArrowUpRight aria-hidden="true" />
          </a>
          <p className="community-note">{lib("communityNote")}</p>
        </div>
        <div className="community-map">
          <iframe
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title={lib("mapSearchTitle")}
            src={parisRepairMap}
          />
          <a
            className="community-map__open"
            data-analytics-event="community_help_opened"
            data-analytics-link-type="map"
            href="https://www.google.com/maps/search/?api=1&query=repair+caf%C3%A9+Paris"
            rel="noreferrer"
            target="_blank"
          >
            {lib("openMap")} <ArrowUpRight aria-hidden="true" />
          </a>
          <ul aria-label={lib("venuesLabel")} className="community-venues">
            {parisRepairSpots.map((spot, index) => {
              const destination = encodeURIComponent(`${spot.name}${spot.venue ? `, ${spot.venue}` : ""}, ${spot.address}`);
              return (
                <li key={spot.name}>
                  <a
                    data-analytics-event="community_help_opened"
                    data-analytics-link-type="venue"
                    href={`https://www.google.com/maps/search/?api=1&query=${destination}`}
                    rel="noreferrer"
                    target="_blank"
                  >
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
            {lib("checkedDate")} · {lib("source")}:{" "}
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
          <Image alt={t("vitniAlt")} fill sizes="(max-width: 760px) 70vw, 360px" src="/images/vitni.svg" />
        </div>
        <div>
          <p className="eyebrow">{lib("repairWorthKeeping")}</p>
          <h2 className="section-title">{lib("giveChapter")}</h2>
          <p>{lib("keepDescription")}</p>
          <Link className="text-link text-link--arrow" href="#diagnose">
            {lib("askItem")} <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
