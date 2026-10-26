import "server-only";
import { guides as rawGuides, stories as rawStories } from "../../site-data.js";
import { extendedGuides } from "../../site-data-extended.js";
import { inferRepairSector, type RepairSector } from "@/lib/repair-sectors";

export type RepairArea = "Bike" | "Home" | "Clothes" | "Other";

export type GuidePart = {
  name: string;
  details: string;
  retailer?: string | null;
  url?: string | null;
};

export type GuideStep = {
  ordinal: number;
  title: string;
  instruction: string;
  image?: string;
  imageAlt?: string;
  illustrationStatus?: "pending" | "ready" | "failed";
};

export type RepairGuide = {
  id: string;
  slug: string;
  shareToken?: string;
  title: string;
  desc: string;
  area: RepairArea;
  sector: RepairSector;
  level: string;
  time: string;
  confidence: number;
  safety: string;
  safetyNotes: string;
  tools: string[];
  image: string;
  alt: string;
  steps: GuideStep[];
  parts: GuidePart[];
  visibility: "public" | "unlisted";
  status: "published" | "needs_illustrations";
  source?: "curated" | "generated";
};

export type RepairStory = {
  title: string;
  tag: string;
  time: string;
  image: string;
  alt: string;
  situation: string;
  tools: string[];
  safety: string;
  steps: [string, string][];
  outcome: string;
};

export type RepairAssessment = {
  likely_issue: string;
  confidence: number;
  area: RepairArea;
  sector: RepairSector;
  level: string;
  estimated_time: string;
  safety: "safe_diy" | "get_help" | "do_not_attempt";
  summary: string;
  generalizable: boolean;
  tools: string[];
  steps: { title: string; instruction: string }[];
  parts: { name: string; details: string }[];
};

type CuratedGuide = {
  id: string;
  area: RepairArea;
  sector?: RepairSector;
  stepTitles?: string[];
  title: string;
  desc: string;
  image: string;
  alt: string;
  level: string;
  time: string;
  steps: string[];
  safety: string;
  tools: string[];
  parts: (string | { name: string; details: string })[];
};

export const curatedGuides = [...rawGuides, ...extendedGuides] as CuratedGuide[];
export const repairStories = rawStories as unknown as Record<string, RepairStory>;

export function titleForRepairStep(instruction: string, ordinal: number) {
  const clean = instruction.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  if (!clean) return `Step ${ordinal}`;
  const action = clean.split(/[,;]|\bthen\b/i)[0]?.trim() || clean;
  const words = action.split(" ").slice(0, 6);
  const title = words.join(" ");
  return title.length > 58 ? `${title.slice(0, 55).trimEnd()}…` : title;
}

export function localGuideView(guide: CuratedGuide): RepairGuide {
  return {
    id: guide.id,
    slug: guide.id,
    title: guide.title,
    desc: guide.desc,
    area: guide.area,
    sector: guide.sector || inferRepairSector({ id: guide.id, title: guide.title, area: guide.area }),
    level: guide.level,
    time: guide.time,
    confidence: 100,
    safety: "safe_diy",
    safetyNotes: guide.safety,
    tools: guide.tools,
    image: guide.image,
    alt: guide.alt,
    steps: guide.steps.map((instruction, index) => ({
      ordinal: index + 1,
      title: guide.stepTitles?.[index] || titleForRepairStep(instruction, index + 1),
      instruction,
      image: "",
      imageAlt: `${guide.title}, step ${index + 1}`,
      illustrationStatus: "pending",
    })),
    parts: guide.parts.map((part) => (typeof part === "string" ? { name: part, details: "" } : part)),
    visibility: "public",
    status: "published",
    source: "curated",
  };
}

export function getCuratedGuide(slug: string) {
  const match = curatedGuides.find((guide) => guide.id === slug);
  return match ? localGuideView(match) : null;
}

function decodeLocalCursor(cursor: string | null): number {
  if (!cursor) return 0;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      typeof decoded === "object" &&
      decoded &&
      "offset" in decoded &&
      typeof decoded.offset === "number" &&
      Number.isInteger(decoded.offset) &&
      decoded.offset >= 0
    ) {
      return decoded.offset;
    }
  } catch {
    return 0;
  }
  return 0;
}

export type LocalGuideListOptions = { query?: string; area?: string; sector?: string; cursor?: string | null; limit?: number | string };

export function localGuideList(options: LocalGuideListOptions = {}) {
  const { query = "", area = "All", sector = "All", cursor = null, limit = 6 } = options;
  const normalizedQuery = query.trim().toLowerCase();
  const matches = curatedGuides.filter((guide) => {
    const repairSector = guide.sector || inferRepairSector({ id: guide.id, title: guide.title, area: guide.area });
    const text = [guide.title, guide.desc, guide.area, repairSector, ...guide.tools, ...guide.steps].join(" ").toLowerCase();
    return (sector === "All" || !sector ? area === "All" || !area || guide.area === area : repairSector === sector) && (!normalizedQuery || text.includes(normalizedQuery));
  });
  const offset = decodeLocalCursor(cursor);
  const pageSize = Math.max(1, Math.min(Number(limit) || 6, 24));
  const items = matches.slice(offset, offset + pageSize).map(localGuideView);
  const makeCursor = (value: number) => Buffer.from(JSON.stringify({ offset: value })).toString("base64url");
  return {
    items,
    total: matches.length,
    nextCursor: offset + pageSize < matches.length ? makeCursor(offset + pageSize) : null,
    previousCursor: offset > 0 ? makeCursor(Math.max(0, offset - pageSize)) : null,
    persistent: false,
  };
}

export function getStory(id: string) {
  return repairStories[id] ? { id, ...repairStories[id] } : null;
}

export function getStoryEntries() {
  return Object.entries(repairStories).map(([id, story]) => ({ id, ...story }));
}
