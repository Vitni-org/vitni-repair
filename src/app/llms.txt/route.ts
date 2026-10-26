import { getStoryEntries } from "@/lib/content";
import { searchGuides } from "@/lib/guide-repository";
import { repairSectors } from "@/lib/repair-sectors";

export const runtime = "nodejs";

export async function GET() {
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  let guides: Awaited<ReturnType<typeof searchGuides>>["items"] = [];
  try {
    let cursor: string | null = null;
    for (let pageCount = 0; pageCount < 6; pageCount += 1) {
      const page = await searchGuides({ limit: 24, cursor });
      guides.push(...page.items);
      cursor = page.nextCursor;
      if (!cursor) break;
    }
  } catch {
    /* Keep agent index useful during storage downtime. */
  }
  const storyLinks = getStoryEntries()
    .map(
      (story) =>
        `- [Illustrative scenario: ${story.title}](${base}/stories/${story.id}/): Example repair scenario, not a customer testimonial. ${story.situation}`,
    )
    .join("\n");
  const guideLinks = guides
    .filter((guide) => guide.visibility === "public")
    .map((guide) => `- [${guide.title}](${base}/guides/${guide.slug}/): ${guide.desc}`)
    .join("\n");
  const sectorLinks = repairSectors.map((sector) => `- [${sector.label}](${base}/guides/sector/${sector.slug}/): ${sector.description}`).join("\n");
  const body = `# Vitni\n\n> Vitni helps people understand everyday repairs and find safe next steps. Describe an issue and optionally add a photo to get an illustrated repair plan.\n\n## Pages\n- [Home](${base}/): Start a repair with a photo and description.\n- [Repair guide library](${base}/guides/): Search repair guides across bikes and mobility, clothing, home fixtures, furniture, appliances, kitchen fittings, garden tools, personal gear, toys, vehicles, and everyday objects.\n- [Repair request](${base}/#diagnose): Describe an issue and optionally upload a photo.\n- [Community repair help](${base}/#help): Find repair cafés and workshops, starting around Paris.\n- [Partner with Vitni](${base}/partners/): Contact Vitni about local repair, community workshop, parts retailer, or product-maker partnerships.\n\n## Repair sectors\n${sectorLinks}\n\n## Repair guides (first ${guides.length} public entries)\n${guideLinks || "The library contains practical, safety-aware repair guides. Browse the sector pages above for current entries."}\n\n## Illustrative repair scenarios (not customer testimonials)\n${storyLinks}\n\n## Safety\nVitni offers general educational guidance, not a substitute for a qualified technician. Stop and seek professional help for electrical, gas, structural, heavy, pressurized, or otherwise unsafe repairs. Retailer search links are suggestions, not verified matches, stock checks, endorsements, or partnerships.\n\n## Machine-readable detail\nSee [llms-full.txt](${base}/llms-full.txt) and [sitemap.xml](${base}/sitemap.xml) for expanded and crawlable content.\n`;
  const discoverabilityBody = body.replace(
    "\n## Repair sectors\n",
    `\n- [Repair guide safety and standards](${base}/repair-safety/): How photo-based suggestions work, their limits, part-fit checks, and when to ask a qualified repairer.\n\n## Repair sectors\n`,
  );
  return new Response(discoverabilityBody, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
