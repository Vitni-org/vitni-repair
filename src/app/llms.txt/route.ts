import { getStoryEntries } from "@/lib/content";
import { searchGuides } from "@/lib/guide-repository";

export const runtime = "nodejs";

export async function GET() {
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  let guides = [] as Awaited<ReturnType<typeof searchGuides>>["items"];
  try {
    guides = (await searchGuides({ limit: 24 })).items;
  } catch {
    /* Keep agent index useful during storage downtime. */
  }
  const storyLinks = getStoryEntries()
    .map((story) => `- [${story.title}](${base}/stories/${story.id}/): ${story.situation}`)
    .join("\n");
  const guideLinks = guides
    .filter((guide) => guide.visibility === "public")
    .map((guide) => `- [${guide.title}](${base}/guides/${guide.slug}/): ${guide.desc}`)
    .join("\n");
  const body = `# RepairLens\n\n> RepairLens helps people understand everyday repairs and find safe next steps. Vitni is the repair assistant.\n\n## Pages\n- [Home](${base}/): Start a repair with a photo and description.\n- [Repair guide library](${base}/guides/): Search illustrated guides for bikes, home, and clothes.\n- [Repair request](${base}/#diagnose): Describe an issue and optionally upload a photo.\n- [Community repair help](${base}/#help): Find repair cafés and workshops, starting around Paris.\n\n## Repair guides\n${guideLinks || "The library includes practical guides for bicycles, home fixtures, furniture, walls, and clothing."}\n\n## Repair stories\n${storyLinks}\n\n## Safety\nRepairLens offers general educational guidance, not a substitute for a qualified technician. Stop and seek professional help for electrical, gas, structural, heavy, pressurized, or otherwise unsafe repairs.\n\n## Machine-readable detail\nSee [llms-full.txt](${base}/llms-full.txt) for expanded guide and story descriptions.\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
