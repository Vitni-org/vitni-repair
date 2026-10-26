import { getStoryEntries } from "@/lib/content";
import { searchGuides } from "@/lib/guide-repository";
import { repairSectors } from "@/lib/repair-sectors";

export const runtime = "nodejs";

export async function GET() {
  const base = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const guides: Awaited<ReturnType<typeof searchGuides>>["items"] = [];
  try {
    let cursor: string | null = null;
    for (let pageCount = 0; pageCount < 5; pageCount += 1) {
      const page = await searchGuides({ limit: 24, cursor });
      guides.push(...page.items);
      cursor = page.nextCursor;
      if (!cursor) break;
    }
  } catch {
    /* fall through to story index */
  }
  const guideText = guides
    .filter((guide) => guide.visibility === "public")
    .map((guide) => {
      const steps = guide.steps.map((step, index) => `  ${index + 1}. ${step.title}: ${step.instruction}`).join("\n");
      return `## ${guide.title}\nURL: ${base}/guides/${guide.slug}/\nSector: ${guide.sector}\nLevel: ${guide.level}\nEstimated time: ${guide.time}\nDescription: ${guide.desc}\nSafety: ${guide.safetyNotes}\nTools: ${guide.tools.join(", ") || "None listed"}\nParts: ${guide.parts.map((part) => [part.name, part.details].filter(Boolean).join(" — ")).join("; ") || "None listed"}\nSteps:\n${steps}`;
    })
    .join("\n\n");
  const storyText = getStoryEntries()
    .map(
      (story) =>
        `## Illustrative scenario: ${story.title}\nURL: ${base}/stories/${story.id}/\n${story.situation}\nSafety: ${story.safety}\nExample outcome: ${story.outcome}`,
    )
    .join("\n\n");
  const sectors = repairSectors
    .map((sector) => {
      const questions = sector.questions.map(({ question, answer }) => `Q: ${question}\nA: ${answer}`).join("\n\n");
      return `## ${sector.label}\nURL: ${base}/guides/sector/${sector.slug}/\n${sector.description}\n${sector.intro}\n\n${questions}`;
    })
    .join("\n\n");
  const body = `# Vitni expanded content\n\nPublic guide entries included: ${guides.length}. The sitemap and sector pages expose further crawlable guides.\n\n# Repair sectors\n\n${sectors}\n\n# Public repair guides\n\n${guideText}\n\n# Partner and community contact\n\nURL: ${base}/partners/\nVitni is looking to hear from local repairers, repair cafés and community workshops, parts retailers, and product makers. Partner relationships are not implied until agreed. Current retailer search links are generic and do not verify stock, compatibility, or commercial relationships.\n\n# Illustrative repair scenarios (not customer testimonials)\n\n${storyText}\n`;
  const discoverabilityBody = body.replace(
    "\n# Illustrative repair scenarios",
    `\n# Repair guide safety and standards\n\nURL: ${base}/repair-safety/\nVitni's built-in library offers general guidance. Photo-based repair suggestions are estimates, not inspections, product manuals, or professional diagnoses. Check model-specific instructions and exact part fit. Stop and ask qualified help for electrical, gas, structural, pressurized, unstable, or safety-critical repairs.\n\n# Illustrative repair scenarios`,
  );
  return new Response(discoverabilityBody, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
