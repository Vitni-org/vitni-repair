import { readFile } from "node:fs/promises";
import { guides as originalGuides } from "../site-data.js";
import { extendedGuides } from "../site-data-extended.js";
import { getGuideStore, makeGuideMatchKey } from "../guide-store.mjs";

const guides = [...originalGuides, ...extendedGuides];

function sectorFor(guide) {
  if (guide.sector) return guide.sector;
  const text = `${guide.id} ${guide.title}`.toLowerCase();
  if (guide.area === "Bike") return "Bikes & mobility";
  if (guide.area === "Clothes") return "Clothing & textiles";
  if (/chair|furniture|upholster/.test(text)) return "Furniture & upholstery";
  if (/kitchen|cabinet|drawer/.test(text)) return "Kitchen & household";
  if (guide.area === "Home") return "Home fixtures";
  return "Other everyday objects";
}

try {
  const envText = await readFile(new URL("../.env", import.meta.url), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
} catch {
  /* Environment variables can be exported by the shell. */
}

const client = getGuideStore();
if (!client) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding guides.");
const sectorProbe = await client.from("guides").select("sector").limit(0);
const sectorColumnAvailable = !sectorProbe.error;
if (sectorProbe.error && !/sector.*(does not exist|schema cache|could not find)/i.test(sectorProbe.error.message || ""))
  throw new Error("Could not inspect the guide schema before seeding.");
if (!sectorColumnAvailable)
  console.warn("The Supabase sector migration is pending; guides will be saved using the legacy area field until it is applied.");

const requestedIds = new Set(process.argv.slice(2).flatMap((arg) => arg.split(",").filter(Boolean)));
const guidesToSeed = requestedIds.size ? guides.filter((guide) => requestedIds.has(guide.id)) : guides;
if (guidesToSeed.length !== requestedIds.size && requestedIds.size) {
  const foundIds = new Set(guidesToSeed.map((guide) => guide.id));
  const missing = [...requestedIds].filter((id) => !foundIds.has(id));
  throw new Error(`Unknown guide IDs: ${missing.join(", ")}`);
}

for (const guide of guidesToSeed) {
  const payload = {
    slug: guide.id,
    match_key: makeGuideMatchKey(guide.area, guide.title),
    title: guide.title,
    description: guide.desc,
    area: guide.area,
    ...(sectorColumnAvailable ? { sector: sectorFor(guide) } : {}),
    level: guide.level,
    estimated_time: guide.time,
    confidence: 100,
    safety: "safe_diy",
    safety_notes: guide.safety,
    tools: guide.tools,
    cover_path: guide.image,
    cover_alt: guide.alt,
    source: "curated",
    status: "published",
    visibility: "public",
  };
  const guideResult = await client.from("guides").upsert(payload, { onConflict: "slug" }).select("id").single();
  if (guideResult.error) throw new Error(`Could not seed ${guide.id}: ${guideResult.error.message}`);
  const id = guideResult.data.id;
  const stepRows = guide.steps.map((instruction, index) => ({
    guide_id: id,
    ordinal: index + 1,
    title: guide.stepTitles?.[index] || String(instruction).split(/[,;]|\bthen\b/i)[0].trim().slice(0, 58),
    instruction,
    illustration_alt: `Illustration for ${guide.title}, step ${index + 1}`,
  }));
  const stepResult = await client.from("guide_steps").upsert(stepRows, { onConflict: "guide_id,ordinal" });
  if (stepResult.error) throw new Error(`Could not seed steps for ${guide.id}: ${stepResult.error.message}`);
  const partRows = guide.parts.map((part, index) => ({
    guide_id: id,
    ordinal: index + 1,
    name: typeof part === "string" ? part : part.name,
    details: typeof part === "string" ? "" : part.details || "",
  }));
  if (partRows.length) {
    const partResult = await client.from("guide_parts").upsert(partRows, { onConflict: "guide_id,ordinal" });
    if (partResult.error) throw new Error(`Could not seed parts for ${guide.id}: ${partResult.error.message}`);
  }
}

console.log(`Seeded ${guidesToSeed.length} curated guides${requestedIds.size ? ` (${[...requestedIds].join(", ")})` : ""}.`);
