"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  GA_MEASUREMENT_ID,
  getAnalyticsConsent,
  getSafePageReferrer,
  getSafePageView,
  isAnalyticsConfigured,
  saveAnalyticsConsent,
  subscribeAnalyticsConsent,
  trackAnalyticsEvent,
  type AnalyticsConsent,
  type GuideArea,
  type GuideSector,
} from "@/lib/analytics";
import { repairSectors } from "@/lib/repair-sectors";

const OPEN_PREFERENCES_EVENT = "repairlens:open-analytics-preferences";

const CONSENT_DEFAULTS = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

const SAFE_LOCATIONS = ["home_hero", "home_promo", "site_nav", "footer"] as const;
const SAFE_AREAS = ["All", "Bike", "Home", "Clothes", "Other"] as const;
const SAFE_SECTORS = ["All", ...repairSectors.map(({ label }) => label)] as const;

function getInlineBootstrap(pathname: string, consent: AnalyticsConsent | "loading"): string {
  const page = getSafePageView(pathname);
  const measurementId = JSON.stringify(GA_MEASUREMENT_ID);
  const path = JSON.stringify(page.page_path);
  const title = JSON.stringify(page.page_title);
  const pageType = JSON.stringify(page.page_type);
  const consentDefaults = JSON.stringify(CONSENT_DEFAULTS);
  const analyticsConsent = JSON.stringify(consent === "granted" ? "granted" : "denied");

  return `
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('consent', 'default', ${consentDefaults});
    window.gtag('consent', 'update', {analytics_storage: ${analyticsConsent}});
    window.gtag('js', new Date());
    window.gtag('config', ${measurementId}, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_path: ${path},
      page_location: window.location.origin + ${path},
      page_referrer: window.location.origin,
      page_title: ${title},
      page_type: ${pageType}
    });
  `;
}

function updateGoogleConsent(consent: Exclude<AnalyticsConsent, "unknown">): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("consent", "update", {
    analytics_storage: consent === "granted" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function dispatchMarkedClick(element: HTMLElement): void {
  const name = element.dataset.analyticsEvent;
  switch (name) {
    case "repair_flow_opened": {
      const location = element.dataset.analyticsLocation;
      if (location === "home_hero" || location === "site_nav" || location === "footer") {
        trackAnalyticsEvent("repair_flow_opened", { location });
      }
      break;
    }
    case "guide_library_opened": {
      const location = element.dataset.analyticsLocation;
      if (SAFE_LOCATIONS.includes(location as (typeof SAFE_LOCATIONS)[number])) {
        trackAnalyticsEvent("guide_library_opened", { location: location as (typeof SAFE_LOCATIONS)[number] });
      }
      break;
    }
    case "community_help_opened": {
      const linkType = element.dataset.analyticsLinkType;
      if (linkType === "cta" || linkType === "map" || linkType === "directory" || linkType === "venue") {
        trackAnalyticsEvent("community_help_opened", { link_type: linkType });
      }
      break;
    }
    case "guide_opened":
      trackAnalyticsEvent("guide_opened", { source: "guide_library" });
      break;
    case "parts_link_opened": {
      const context = element.dataset.analyticsPageContext;
      if (context === "guide_detail" || context === "generated_plan") {
        trackAnalyticsEvent("parts_link_opened", { page_context: context });
      }
      break;
    }
  }
}

export function GoogleAnalytics() {
  const t = useTranslations("analytics");
  const pathname = usePathname();
  const consent = useSyncExternalStore<AnalyticsConsent | "loading">(subscribeAnalyticsConsent, getAnalyticsConsent, () => "loading");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [tagReady, setTagReady] = useState(false);
  const [tagWasLoaded, setTagWasLoaded] = useState(false);

  useEffect(() => {
    const openPreferences = () => setPreferencesOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
    return () => {
      window.removeEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
    };
  }, []);

  useEffect(() => {
    if (!isAnalyticsConfigured() || consent === "loading") return;
    updateGoogleConsent(consent === "granted" ? "granted" : "denied");
  }, [consent]);

  useEffect(() => {
    if (!isAnalyticsConfigured()) return;

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const markedElement = event.target.closest<HTMLElement>("[data-analytics-event]");
      if (markedElement) dispatchMarkedClick(markedElement);
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.dataset.analyticsForm !== "guide-search") return;

      const formData = new FormData(form);
      const rawArea = formData.get("area");
      const area: GuideArea = SAFE_AREAS.includes(rawArea as GuideArea) ? (rawArea as GuideArea) : "All";
      const rawSector = formData.get("sector");
      const sector: GuideSector = SAFE_SECTORS.includes(rawSector as GuideSector) ? (rawSector as GuideSector) : "All";
      const query = formData.get("q");
      trackAnalyticsEvent("guide_search_submitted", {
        area,
        sector,
        has_query: typeof query === "string" && query.trim().length > 0,
      });
    };

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  useEffect(() => {
    if (consent !== "granted" || !tagReady || !pathname || !window.gtag) return;

    const page = getSafePageView(pathname);
    const pageLocation = `${window.location.origin}${page.page_path}`;
    const pageReferrer = getSafePageReferrer(document.referrer, window.location.origin);
    const safePage = {
      ...page,
      page_location: pageLocation,
      page_referrer: pageReferrer,
    };

    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...safePage,
    });
    trackAnalyticsEvent("page_view", safePage);
  }, [consent, pathname, tagReady]);

  const onTagReady = useCallback(() => {
    window.__repairlensAnalyticsReady = true;
    setTagReady(true);
    setTagWasLoaded(true);
  }, []);

  const chooseConsent = (nextConsent: Exclude<AnalyticsConsent, "unknown">) => {
    saveAnalyticsConsent(nextConsent);
    setPreferencesOpen(false);
  };

  const showBanner = isAnalyticsConfigured() && consent !== "loading" && (consent === "unknown" || preferencesOpen);
  const shouldKeepTag = consent === "granted" || tagWasLoaded;

  return (
    <>
      {shouldKeepTag && (
        <>
          <Script
            id="repairlens-google-analytics-bootstrap"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: getInlineBootstrap(pathname || "/", consent) }}
          />
          <Script
            id="repairlens-google-analytics"
            onReady={onTagReady}
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`}
            strategy="afterInteractive"
          />
        </>
      )}
      {showBanner && (
        <section aria-label={t("preferences")} className="analytics-consent" id="analytics-preferences" role="region">
          <div className="analytics-consent__copy">
            <strong>{t("title")}</strong>
            <p>{t("description")}</p>
          </div>
          <div className="analytics-consent__actions">
            {preferencesOpen && consent !== "unknown" && (
              <button className="analytics-consent__close" onClick={() => setPreferencesOpen(false)} type="button">
                {t("close")}
              </button>
            )}
            <button className="analytics-consent__reject" onClick={() => chooseConsent("denied")} type="button">
              {t("reject")}
            </button>
            <button className="analytics-consent__accept" onClick={() => chooseConsent("granted")} type="button">
              {t("allow")}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

export function AnalyticsPreferencesButton() {
  const t = useTranslations("analytics");
  if (!isAnalyticsConfigured()) return null;

  return (
    <button
      className="analytics-preferences-button"
      aria-controls="analytics-preferences"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))}
      type="button"
    >
      {t("preferences")}
    </button>
  );
}
