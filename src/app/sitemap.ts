import type { MetadataRoute } from "next";
import { getStoryEntries } from "@/lib/content";
import { curatedGuidePaths, searchGuides } from "@/lib/guide-repository";
import { repairSectors } from "@/lib/repair-sectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
const languages = (path: string) => ({
  en: path,
  fr: `/fr${path}`,
  "x-default": path,
});
const localizedEntries = (path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number) => [
  { url: `${base}${path}`, changeFrequency, priority, alternates: { languages: languages(path) } },
  { url: `${base}/fr${path}`, changeFrequency, priority, alternates: { languages: languages(path) } },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guideSlugs = new Set(curatedGuidePaths().map((path) => path.split("/")[2]).filter(Boolean));
  try {
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await searchGuides({ limit: 24, cursor, locale: "en" });
      for (const guide of page.items) if (guide.slug && guide.visibility === "public") guideSlugs.add(guide.slug);
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor && pages < 40);
  } catch (error) {
    console.warn("Could not load dynamic guides for sitemap.", error);
  }

  const staticPaths = [
    { path: "/", frequency: "weekly" as const, priority: 1 },
    { path: "/guides/", frequency: "weekly" as const, priority: 0.85 },
    { path: "/partners/", frequency: "monthly" as const, priority: 0.65 },
    { path: "/repair-safety/", frequency: "yearly" as const, priority: 0.55 },
    ...repairSectors.map(({ slug }) => ({ path: `/guides/sector/${slug}/`, frequency: "weekly" as const, priority: 0.7 })),
  ];
  const staticPages = staticPaths.flatMap(({ path, frequency, priority }) => localizedEntries(path, frequency, priority));
  const guidePages = [...guideSlugs].flatMap((slug) => localizedEntries(`/guides/${encodeURIComponent(slug)}/`, "monthly", 0.7));
  const storyPages = getStoryEntries().flatMap(({ id }) => localizedEntries(`/stories/${id}/`, "yearly", 0.55));
  return [...staticPages, ...guidePages, ...storyPages];
}
