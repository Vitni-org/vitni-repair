import "server-only";
import { cache } from "react";
import { curatedGuides, getStoryEntries, getCuratedGuide, localGuideList, type RepairGuide } from "@/lib/content";
import { inferRepairSector } from "@/lib/repair-sectors";
import { guideArtwork } from "@/lib/guide-artwork";
import {
  getPublicGuideBySlug,
  getUnlistedGuideByToken,
  isGuideStoreConfigured,
  listPublishedGuides,
  toPublicGuide,
  toPublicGuides,
} from "../../guide-store.mjs";

export { isGuideStoreConfigured };

export const getGuide = cache(async (slug: string): Promise<RepairGuide | null> => {
  if (isGuideStoreConfigured()) {
    try {
      const row = await getPublicGuideBySlug(slug);
      if (row) return (await toPublicGuide(row)) as RepairGuide;
    } catch (error) {
      if (!getCuratedGuide(slug)) throw error;
      console.warn(`Using local guide content while Supabase is unavailable for ${slug}.`);
    }
  }
  return getCuratedGuide(slug);
});

export const getUnlistedGuide = cache(async (token: string): Promise<RepairGuide | null> => {
  if (!isGuideStoreConfigured()) return null;
  const row = await getUnlistedGuideByToken(token);
  return row ? ((await toPublicGuide(row)) as RepairGuide) : null;
});

export async function searchGuides(options: { query?: string; area?: string; sector?: string; cursor?: string | null; limit?: number | string }) {
  if (!isGuideStoreConfigured()) return localGuideList(options);
  try {
    const page = await listPublishedGuides(options);
    if (!page) return localGuideList(options);
    return {
      ...page,
      items: (await toPublicGuides(page.items)) as RepairGuide[],
      persistent: true,
      degraded: false,
    };
  } catch (error) {
    console.warn("Saved guide listing is temporarily unavailable; showing curated guides.", error);
    return { ...localGuideList(options), degraded: true };
  }
}

export async function getFeaturedRepairs() {
  const storyCards = getStoryEntries().map((story) => ({
    id: story.id,
    kind: "story" as const,
    tag: story.tag,
    title: story.title,
    description: story.situation,
    outcome: `Example outcome · ${story.outcome}`,
    image: story.image,
    alt: story.alt,
    href: `/stories/${story.id}/`,
    stepCount: story.steps.length,
  }));

  const localGuideCards = curatedGuides.slice(0, 6).map((guide) => ({
    id: guide.id,
    kind: "guide" as const,
    tag: `${(guide.sector || inferRepairSector({ id: guide.id, title: guide.title, area: guide.area })).toUpperCase()} · ${guide.level.toUpperCase()}`,
    title: guide.title,
    description: guide.desc,
    outcome: `${guide.steps.length} illustrated steps`,
    image: guide.image,
    alt: guide.alt,
    href: `/guides/${guide.id}/`,
    stepCount: guide.steps.length,
  }));

  if (!isGuideStoreConfigured()) return { items: [...storyCards, ...localGuideCards], persistent: false };
  try {
    const page = await listPublishedGuides({ limit: 6 });
    const guides = page ? ((await toPublicGuides(page.items)) as RepairGuide[]) : [];
    const guideCards = guides.map((guide) => ({
      id: guide.slug,
      kind: "guide" as const,
      tag: `${guide.sector.toUpperCase()} · ${guide.level.toUpperCase()}`,
      title: guide.title,
      description: guide.desc,
      outcome: `${guide.steps.length} repair steps`,
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
