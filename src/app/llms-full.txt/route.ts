import { getStoryEntries } from "@/lib/content";
import { searchGuides } from "@/lib/guide-repository";

export const runtime = "nodejs";

export async function GET() {
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  let guides: Awaited<ReturnType<typeof searchGuides>>["items"] = [];
  try {
    guides = (await searchGuides({ limit: 24 })).items;
  } catch {
    /* fall through to story index */
  }
  const guideText = guides
    .filter((guide) => guide.visibility === "public")
    .map((guide) => {
      const steps = guide.steps.map((step, index) => `  ${index + 1}. ${step.title}: ${step.instruction}`).join("\n");
      return `## ${guide.title}\nURL: ${base}/guides/${guide.slug}/\nArea: ${guide.area}\nLevel: ${guide.level}\nEstimated time: ${guide.time}\nDescription: ${guide.desc}\nSafety: ${guide.safetyNotes}\nSteps:\n${steps}`;
    })
    .join("\n\n");
  const storyText = getStoryEntries()
    .map((story) => `## ${story.title}\nURL: ${base}/stories/${story.id}/\n${story.situation}\nSafety: ${story.safety}\nOutcome: ${story.outcome}`)
    .join("\n\n");
  return new Response(`# Vitni expanded content\n\n${guideText}\n\n# Repair stories\n\n${storyText}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
