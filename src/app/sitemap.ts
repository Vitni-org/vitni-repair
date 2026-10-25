import type { MetadataRoute } from "next";
import { getStoryEntries } from "@/lib/content";
import { curatedGuidePaths, searchGuides } from "@/lib/guide-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const guideUrls = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const path of curatedGuidePaths()) {
    const slug = path.split("/")[2];
    if (slug) guideUrls.set(slug, { url: `${base}/guides/${encodeURIComponent(slug)}/`, changeFrequency: "monthly", priority: 0.7 });
  }
  try {
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await searchGuides({ limit: 24, cursor });
      for (const guide of page.items)
        if (guide.slug && guide.visibility === "public")
          guideUrls.set(guide.slug, { url: `${base}/guides/${encodeURIComponent(guide.slug)}/`, changeFrequency: "monthly", priority: 0.7 });
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor && pages < 40);
  } catch (error) {
    console.warn("Could not load dynamic guides for sitemap.", error);
  }

  const stories = getStoryEntries().map(({ id }) => ({ url: `${base}/stories/${id}/`, changeFrequency: "yearly" as const, priority: 0.55 }));
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/guides/`, changeFrequency: "weekly", priority: 0.85 },
  ];
  return [...staticPages, ...guideUrls.values(), ...stories];
}
