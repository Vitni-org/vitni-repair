import type { MetadataRoute } from "next";
import { getStoryEntries } from "@/lib/content";
import { searchGuides } from "@/lib/guide-repository";

export const runtime = "nodejs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const guides: MetadataRoute.Sitemap = [];
  try {
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await searchGuides({ limit: 24, cursor });
      for (const guide of page.items)
        if (guide.slug && guide.visibility === "public")
          guides.push({ url: `${base}/guides/${encodeURIComponent(guide.slug)}/`, changeFrequency: "monthly", priority: 0.7 });
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
  return [...staticPages, ...guides, ...stories];
}
