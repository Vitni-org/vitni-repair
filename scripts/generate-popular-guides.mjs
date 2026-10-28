import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { extendedGuides } from "../site-data-extended.js";
import { makeGuideMatchKey, upsertGuideLocalization } from "../guide-store.mjs";

const targetIds = ["unclog-kitchen-sink", "fix-dripping-tap", "washer-not-draining"];
const guides = targetIds.map((id) => {
  const guide = extendedGuides.find((candidate) => candidate.id === id);
  if (!guide) throw new Error(`Missing curated guide definition: ${id}`);
  return guide;
});

async function loadLocalEnv() {
  for (const name of [".env", ".env.local"]) {
    try {
      const source = await readFile(new URL(`../${name}`, import.meta.url), "utf8");
      for (const line of source.split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || process.env[match[1]]) continue;
        let value = match[2];
        if (value.startsWith('"') && value.endsWith('"')) {
          try {
            value = JSON.parse(value);
          } catch {
            value = value.slice(1, -1);
          }
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        } else {
          value = value.replace(/\s+#.*$/, "");
        }
        process.env[match[1]] = value;
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

await loadLocalEnv();
const frenchGuideCatalog = JSON.parse(await readFile(new URL("../src/lib/catalog-fr.generated.json", import.meta.url), "utf8"));

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare";
if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in the environment or local .env file.");
const outputDir = new URL("../public/images/generated-guides/", import.meta.url);
await mkdir(outputDir, { recursive: true });
const forcedImages = new Set(process.argv.flatMap((arg) => (arg.startsWith("--force=") ? arg.slice("--force=".length).split(",") : [])));

function imageJobs() {
  const jobs = [];
  for (const guide of guides) {
    jobs.push({
      guide,
      filename: `${guide.id}-cover.jpg`,
      scene: `Editorial cover illustration for a practical repair guide titled “${guide.title}”. Show the whole relevant object and a simple, safe repair context, with a calm uncluttered composition and generous warm off-white negative space.`,
    });
    guide.steps.forEach((instruction, index) => {
      jobs.push({
        guide,
        filename: `${guide.id}-step-${index + 1}.jpg`,
        scene: `One clear instructional moment for step ${index + 1}, “${guide.stepTitles[index]}”. Depict only this action: ${instruction} Use one understandable view, a few correct parts, hands positioned safely, and no extra or invented mechanism.`,
      });
    });
  }
  return jobs;
}

const safetyCorrections = {
  "washer-not-draining-cover.jpg":
    "Show a washing machine closed and visibly unplugged: its power cord is disconnected from the wall and rests on a dry surface well away from the appliance. A person checks the exact-model manual beside a closed, dry pump access flap. The scene is about safe diagnosis only; no water, no open electrical panels, no tools inside the appliance.",
  "washer-not-draining-step-2.jpg":
    "Single-frame close view of an unplugged washing machine with its cord already disconnected and resting on a dry surface far from water. Show a cool appliance, a shallow tray and folded towels at the lower front access, with the access flap still closed. Do not show a hand near an outlet, water near electricity, multiple views, or a removed panel.",
  "washer-not-draining-step-4.jpg":
    "One single-frame close view of a hand gently seating and finger-tightening the correct pump filter cap into its opening on the lower front of a washing machine, then closing the small access flap. Dry floor, no leak, no tools, no second scene, no split panel, no collage.",
};

const style =
  "Warm French comic ligne claire editorial technical drawing: crisp confident dark forest-green ink contours, flat cream and deep green color blocks, small lime accent, restrained coral detail, subtle paper grain, natural proportions, clear hand positioning, practical and reassuring. No text, lettering, labels, numbers, brand marks, watermark, photorealism, collage, or panel borders. Make the depicted object and action legible at square thumbnail size.";

async function generate(job) {
  const path = new URL(job.filename, outputDir);
  try {
    const existing = await stat(path);
    if (existing.size > 10_000 && !forcedImages.has(job.filename)) {
      console.log(`Image already exists: ${job.filename}`);
      return { ...job, path };
    }
  } catch {
    /* Generate missing asset. */
  }

  const scene = safetyCorrections[job.filename] || job.scene;
  const prompt = `${scene}\n\nArt direction: ${style}\n\nRepair facts and step description are trusted editorial reference for this illustration. Do not add written instructions or imply work outside the described scope.`;
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      quality: "medium",
      output_format: "jpeg",
      output_compression: 76,
      n: 1,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.error?.message || `Image API returned HTTP ${response.status}`;
    throw new Error(`${job.filename}: ${message}`);
  }
  const base64 = result?.data?.[0]?.b64_json;
  if (!base64) throw new Error(`${job.filename}: image response contained no image data.`);
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length < 10_000) throw new Error(`${job.filename}: generated image is unexpectedly small.`);
  await writeFile(path, bytes);
  console.log(`Generated ${job.filename} (${Math.round(bytes.length / 1024)} KB)`);
  return { ...job, path };
}

async function runWithConcurrency(items, limit, worker) {
  let next = 0;
  const results = new Array(items.length);
  async function run() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const jobs = imageJobs();
console.log(`Preparing ${jobs.length} guide images for ${guides.length} guides with ${model}.`);
const generated = await runWithConcurrency(jobs, 2, generate);
const assets = new Map(guides.map((guide) => [guide.id, {}]));
for (const asset of generated) assets.get(asset.guide.id)[asset.filename] = await readFile(asset.path);

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to persist the guides.");
const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = client.storage.from("guide-illustrations");

const sectorProbe = await client.from("guides").select("sector").limit(0);
const sectorAvailable = !sectorProbe.error;
if (sectorProbe.error && !/sector.*(does not exist|schema cache|could not find)/i.test(sectorProbe.error.message || "")) {
  throw new Error(`Could not inspect guide sector schema: ${sectorProbe.error.message}`);
}
const matchKeyProbe = await client.from("guides").select("match_key").limit(0);
const matchKeyAvailable = !matchKeyProbe.error;
if (matchKeyProbe.error && !/match_key.*(does not exist|schema cache|could not find)/i.test(matchKeyProbe.error.message || "")) {
  throw new Error(`Could not inspect guide matching schema: ${matchKeyProbe.error.message}`);
}

function dbSector(guide) {
  if (guide.sector) return guide.sector;
  if (guide.area === "Bike") return "Bikes & mobility";
  if (guide.area === "Clothes") return "Clothing & textiles";
  if (guide.area === "Home") return "Home fixtures";
  return "Other everyday objects";
}

async function upload(path, bytes) {
  const { error } = await bucket.upload(path, bytes, { contentType: "image/jpeg", cacheControl: "31536000", upsert: true });
  if (error) throw new Error(`Could not store ${path} in Supabase Storage: ${error.message}`);
}

for (const guide of guides) {
  const frenchGuide = frenchGuideCatalog.guides[guide.id];
  if (!frenchGuide) throw new Error(`Missing French localization for ${guide.id}`);
  const matchKey = makeGuideMatchKey(guide.area, guide.title);
  let existing = null;
  const bySlug = await client
    .from("guides")
    .select("id,slug,status,cover_path,guide_steps(ordinal,illustration_path,illustration_status)")
    .eq("slug", guide.id)
    .maybeSingle();
  if (bySlug.error) throw new Error(`Could not check saved guide ${guide.id}: ${bySlug.error.message}`);
  existing = bySlug.data;

  if (matchKeyAvailable && matchKey) {
    const match = await client.from("guides").select("id,slug").eq("match_key", matchKey).maybeSingle();
    if (match.error) throw new Error(`Could not check for a duplicate guide ${guide.id}: ${match.error.message}`);
    if (match.data && match.data.slug !== guide.id) {
      throw new Error(`A guide with the same repair intent is already saved as “${match.data.slug}”; refusing to create a duplicate.`);
    }
  }

  const guidePayload = {
    slug: guide.id,
    ...(matchKeyAvailable ? { match_key: matchKey } : {}),
    title: guide.title,
    description: guide.desc,
    area: guide.area,
    ...(sectorAvailable ? { sector: dbSector(guide) } : {}),
    level: guide.level,
    estimated_time: guide.time,
    confidence: 100,
    safety: "safe_diy",
    safety_notes: guide.safety,
    tools: guide.tools,
    cover_alt: guide.alt,
    source: "curated",
    visibility: "public",
    ...(!existing ? { status: "draft" } : {}),
  };
  let guideId = existing?.id;
  if (existing) {
    const updated = await client.from("guides").update(guidePayload).eq("id", guideId);
    if (updated.error) throw new Error(`Could not update ${guide.id}: ${updated.error.message}`);
  } else {
    const inserted = await client.from("guides").insert(guidePayload).select("id").single();
    if (inserted.error) throw new Error(`Could not create ${guide.id}: ${inserted.error.message}`);
    guideId = inserted.data.id;
  }

  const store = assets.get(guide.id);
  const coverPath = `${guideId}/cover.jpg`;
  await upload(coverPath, store[`${guide.id}-cover.jpg`]);

  const parts = (guide.parts || []).map((part, index) => ({
    guide_id: guideId,
    ordinal: index + 1,
    name: typeof part === "string" ? part : part.name,
    details: typeof part === "string" ? "" : part.details || "",
    ...(typeof part === "string" ? {} : { retailer: part.retailer || null, url: part.url || null }),
  }));
  if (parts.length) {
    const savedParts = await client.from("guide_parts").upsert(parts, { onConflict: "guide_id,ordinal" });
    if (savedParts.error) throw new Error(`Could not save parts for ${guide.id}: ${savedParts.error.message}`);
  }

  const steps = [];
  for (let index = 0; index < guide.steps.length; index += 1) {
    const ordinal = index + 1;
    const path = `${guideId}/step-${ordinal}.jpg`;
    await upload(path, store[`${guide.id}-step-${ordinal}.jpg`]);
    steps.push({
      guide_id: guideId,
      ordinal,
      title: guide.stepTitles[index],
      instruction: guide.steps[index],
      illustration_path: path,
      illustration_alt: `${guide.title}: ${guide.stepTitles[index]}`,
      illustration_status: "ready",
    });
  }
  const savedSteps = await client.from("guide_steps").upsert(steps, { onConflict: "guide_id,ordinal" });
  if (savedSteps.error) throw new Error(`Could not save illustrated steps for ${guide.id}: ${savedSteps.error.message}`);
  const savedCover = await client.from("guides").update({ cover_path: coverPath, cover_alt: guide.alt }).eq("id", guideId);
  if (savedCover.error) throw new Error(`Could not save cover for ${guide.id}: ${savedCover.error.message}`);

  const localized = await upsertGuideLocalization(guideId, {
    locale: "fr",
    title: frenchGuide.title,
    description: frenchGuide.desc,
    image_alt: frenchGuide.alt,
    safety_notes: frenchGuide.safety,
    tools: frenchGuide.tools,
    steps: frenchGuide.steps.map((instruction, index) => ({ title: frenchGuide.stepTitles[index], instruction })),
    parts: frenchGuide.parts.map((part) => (typeof part === "string" ? { name: part, details: "" } : part)),
  });
  if (!localized) throw new Error(`Could not save French localization for ${guide.id}; check that the guide_localizations migration is applied.`);

  const published = await client.from("guides").update({ status: "published" }).eq("id", guideId);
  if (published.error) throw new Error(`Could not publish ${guide.id}: ${published.error.message}`);
  console.log(`Saved and published ${guide.id} (id ${guideId}) with cover, ${steps.length} illustrated steps, and French localization.`);
}

console.log(`Done. ${guides.length} guides and ${generated.length} generated images are available locally and in Supabase Storage.`);
