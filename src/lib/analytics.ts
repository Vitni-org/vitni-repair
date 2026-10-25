export const ANALYTICS_CONSENT_KEY = "repairlens.analytics-consent.v1";
const ANALYTICS_CONSENT_CHANGE_EVENT = "repairlens:analytics-consent-change";

export type AnalyticsConsent = "granted" | "denied" | "unknown";
export type GuideArea = "All" | "Bike" | "Home" | "Clothes";

export type SafePageView = {
  page_path: string;
  page_title: string;
  page_type: "home" | "guide_library" | "guide_detail" | "story_detail" | "other";
};

export type AnalyticsEventPayloads = {
  page_view: SafePageView & { page_location: string; page_referrer: string };
  repair_flow_opened: { location: "home_hero" | "site_nav" | "footer" };
  guide_library_opened: { location: "home_hero" | "home_promo" | "site_nav" | "footer" };
  community_help_opened: { link_type: "cta" | "map" | "directory" | "venue" };
  guide_search_submitted: { area: GuideArea; has_query: boolean };
  guide_opened: { source: "guide_library" };
  repair_request_started: { has_photo: boolean };
  repair_guide_completed: {
    safety: "safe_diy" | "get_help" | "do_not_attempt";
    saved: boolean;
    reused: boolean;
    has_photo: boolean;
  };
  repair_guide_failed: { stage: "request" };
  parts_link_opened: { page_context: "guide_detail" | "generated_plan" };
};

export type AnalyticsEventName = keyof AnalyticsEventPayloads;
export type AnalyticsConsentState = AnalyticsConsent;

type GoogleTag = (command: string, ...parameters: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GoogleTag;
    __repairlensAnalyticsReady?: boolean;
    __repairlensAnalyticsConsent?: Exclude<AnalyticsConsent, "unknown">;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export function isAnalyticsConfigured(): boolean {
  return /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID);
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unknown";
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // Keep an explicit in-memory choice for this tab when browser storage is unavailable.
  }
  return window.__repairlensAnalyticsConsent || "unknown";
}

export function saveAnalyticsConsent(consent: Exclude<AnalyticsConsent, "unknown">): void {
  window.__repairlensAnalyticsConsent = consent;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
  } catch {
    // The visitor can still change their choice for the current tab.
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGE_EVENT));
}

export function subscribeAnalyticsConsent(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key !== ANALYTICS_CONSENT_KEY && event.key !== null) return;
    const value = event.key === ANALYTICS_CONSENT_KEY ? event.newValue : null;
    if (value === "granted" || value === "denied") window.__repairlensAnalyticsConsent = value;
    else delete window.__repairlensAnalyticsConsent;
    onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onChange);
  };
}

export function getSafePageView(pathname: string): SafePageView {
  const normalized = pathname.split("?")[0] || "/";
  const path = normalized === "/" ? "/" : `${normalized.replace(/\/+$/, "")}/`;

  if (path === "/") {
    return { page_path: "/", page_title: "Vitni", page_type: "home" };
  }
  if (path === "/guides/") {
    return { page_path: "/guides/", page_title: "Repair library", page_type: "guide_library" };
  }
  if (/^\/guides\/[^/]+\/$/.test(path)) {
    return { page_path: "/guides/[guide]/", page_title: "Repair guide", page_type: "guide_detail" };
  }
  if (/^\/stories\/[^/]+\/$/.test(path)) {
    return { page_path: "/stories/[story]/", page_title: "Repair story", page_type: "story_detail" };
  }

  return { page_path: "/[page]/", page_title: "Vitni page", page_type: "other" };
}

export function getSafePageReferrer(referrer: string, currentOrigin: string): string {
  if (!referrer) return "";

  try {
    const url = new URL(referrer);
    if (url.origin !== currentOrigin) return `${url.origin}/`;
    const safePage = getSafePageView(url.pathname);
    return `${url.origin}${safePage.page_path}`;
  } catch {
    return "";
  }
}

export function trackAnalyticsEvent<EventName extends AnalyticsEventName>(eventName: EventName, payload: AnalyticsEventPayloads[EventName]): void {
  if (!isAnalyticsConfigured() || getAnalyticsConsent() !== "granted") return;
  if (typeof window === "undefined" || !window.__repairlensAnalyticsReady || !window.gtag) return;

  window.gtag("event", eventName, payload);
}
