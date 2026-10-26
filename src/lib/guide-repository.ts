import "server-only";
import { cache } from "react";
import { curatedGuides, getStoryEntries, getCuratedGuide, localGuideList, type RepairGuide } from "@/lib/content";
import { inferRepairSector } from "@/lib/repair-sectors";
import { guideArtwork } from "@/lib/guide-artwork";
import { localizedSectorLabel, localizeStoredGuide } from "@/lib/catalog-localization";
import { getFrenchGuideView } from "@/lib/repair-ai";
import type { Locale } from "@/i18n/routing";
import {
  getGuideLocalization,
  getGuideLocalizations,
  getPublicGuideBySlug,
  getUnlistedGuideByToken,
  isGuideStoreConfigured,
  listPublishedGuides,
  toPublicGuide,
  toPublicGuides,
} from "../../guide-store.mjs";

export { isGuideStoreConfigured };

export const getGuide = cache(async (slug: string, locale: Locale | string = "en"): Promise<RepairGuide | null> => {
  if (isGuideStoreConfigured()) {
    try {
      const row = await getPublicGuideBySlug(slug);
      if (row) {
        const guide = (await toPublicGuide(row)) as RepairGuide;
        if (locale === "fr") {
          try {
            const localization = await getGuideLocalization(row.id, locale);
            if (localization) return localizeStoredGuide(guide, localization);
          } catch (error) {
            console.warn(`Could not load French localization for ${slug}; using fallback content.`, error);
          }
          if (guide.source === "generated") return getFrenchGuideView(guide, row.id);
          return localizeStoredGuide(guide, null);
        }
        return guide;
      }
    } catch (error) {
      if (!getCuratedGuide(slug, locale)) throw error;
      console.warn(`Using local guide content while Supabase is unavailable for ${slug}.`);
    }
  }
  return getCuratedGuide(slug, locale);
});

export const getUnlistedGuide = cache(async (token: string, locale: Locale | string = "en"): Promise<RepairGuide | null> => {
  if (!isGuideStoreConfigured()) return null;
  const row = await getUnlistedGuideByToken(token);
  if (!row) return null;
  const guide = (await toPublicGuide(row)) as RepairGuide;
  if (locale !== "fr") return guide;
  try {
    const localization = await getGuideLocalization(row.id, locale);
    if (localization) return localizeStoredGuide(guide, localization);
  } catch (error) {
    console.warn("Could not load the saved French guide view; using fallback content.", error);
  }
  return guide.source === "generated" ? getFrenchGuideView(guide, row.id) : localizeStoredGuide(guide, null);
});

export async function searchGuides(options: { query?: string; area?: string; sector?: string; cursor?: string | null; limit?: number | string; locale?: Locale | string }) {
  const locale = options.locale || "en";
  if (!isGuideStoreConfigured()) return localGuideList({ ...options, locale });
  try {
    const page = await listPublishedGuides({ ...options, locale });
    if (!page) return localGuideList({ ...options, locale });
    const localizations = locale === "fr" ? await getGuideLocalizations(page.items.map((row: { id: number }) => row.id), locale) : new Map();
    const guides = (await toPublicGuides(page.items)) as RepairGuide[];
    const localizedGuides = guides.map((guide, index) => localizeStoredGuide(guide, localizations.get(page.items[index]?.id)));
    if (locale === "fr" && options.query?.trim() && !options.cursor) {
      // The built-in French catalog remains searchable before the Supabase
      // localization migration is applied, and complements saved translations.
      const local = localGuideList({ ...options, locale, cursor: null, limit: 24 });
      const unique = new Map<string, RepairGuide>();
      for (const guide of [...localizedGuides, ...local.items]) if (!unique.has(guide.slug)) unique.set(guide.slug, guide);
      return {
        ...page,
        items: [...unique.values()].slice(0, Number(options.limit) || 6),
        total: Math.max(page.total, local.total),
        nextCursor: page.nextCursor,
        persistent: true,
        degraded: false,
      };
    }
    return {
      ...page,
      items: localizedGuides,
      persistent: true,
      degraded: false,
    };
  } catch (error) {
    console.warn("Saved guide listing is temporarily unavailable; showing curated guides.", error);
    return { ...localGuideList({ ...options, locale }), degraded: true };
  }
}

export async function getFeaturedRepairs(locale: Locale | string = "en") {
  const storyCards = getStoryEntries(locale).map((story) => ({
    id: story.id,
    kind: "story" as const,
    contentLocale: locale,
    tag: story.tag,
    title: story.title,
    description: story.situation,
    outcome: `${locale === "fr" ? "Résultat illustratif" : "Example outcome"} · ${story.outcome}`,
    image: story.image,
    alt: story.alt,
    href: `/stories/${story.id}/`,
    stepCount: story.steps.length,
  }));

  const localGuideCards = curatedGuides.slice(0, 6).map((sourceGuide) => {
    const guide = getCuratedGuide(sourceGuide.id, locale)!;
    return ({
    id: guide.id,
    kind: "guide" as const,
    contentLocale: guide.contentLocale || locale,
    tag: `${localizedSectorLabel(guide.sector || inferRepairSector({ id: guide.id, title: guide.title, area: guide.area }), locale).toUpperCase()} · ${guide.level.toUpperCase()}`,
    title: guide.title,
    description: guide.desc,
    outcome: locale === "fr" ? `${guide.steps.length} étapes illustrées` : `${guide.steps.length} illustrated steps`,
    image: guide.image,
    alt: guide.alt,
    href: `/guides/${guide.id}/`,
    stepCount: guide.steps.length,
  });
  });

  if (!isGuideStoreConfigured()) return { items: [...storyCards, ...localGuideCards], persistent: false };
  try {
    const page = await searchGuides({ limit: 6, locale });
    const guides = page.items;
    const guideCards = guides.map((guide) => ({
      id: guide.slug,
      kind: "guide" as const,
      contentLocale: guide.contentLocale || locale,
      tag: `${localizedSectorLabel(guide.sector, locale).toUpperCase()} · ${guide.level.toUpperCase()}`,
      title: guide.title,
      description: guide.desc,
      outcome: locale === "fr" ? `${guide.steps.length} étapes de réparation` : `${guide.steps.length} repair steps`,
      image: guideArtwork(guide).src,
      alt: guideArtwork(guide).alt,
      href: `/guides/${guide.slug}/`,
      stepCount: guide.steps.length,
    }));
    const curatedIds = new Set(guides.map((guide) => guide.slug));
    const remainingCurated = localGuideCards.filter((guide) => !curatedIds.has(guide.id));
    return { items: [...storyCards, ...guideCards, ...remainingCurated], persistent: true };
  } catch (error) {
    console.warn("Featured guides unavailable; showing demo stories only.", error);
    return { items: [...storyCards, ...localGuideCards], persistent: false };
  }
}

export function curatedGuidePaths() {
  return curatedGuides.map((guide) => `/guides/${guide.id}/`);
}
