import type { RepairArea } from "@/lib/content";

export const repairSectors = [
  {
    slug: "bikes-mobility",
    label: "Bikes & mobility",
    area: "Bike",
    description: "Everyday bicycle fixes, from punctures and slipped chains to adjustments that should be checked before a ride.",
    intro: "Find practical bicycle repair guides for common problems. Each guide lists the tools, checks, and stop signs to review before riding.",
  },
  {
    slug: "clothing-textiles",
    label: "Clothing & textiles",
    area: "Clothes",
    description: "Mending, seams, hems, buttons, zips, and small textile repairs that help garments stay in use.",
    intro: "Browse clothing and textile repairs for small tears, loose buttons, stuck zips, and hems. Guides note when a tailor is the safer or more durable choice.",
  },
  {
    slug: "home-fixtures",
    label: "Home fixtures",
    area: "Home",
    description: "Small, non-structural fixes for doors, windows, drawers, walls, and everyday fixtures.",
    intro: "These home repair guides cover small, visible, non-structural problems. Stop and contact a qualified tradesperson if you suspect hidden wiring, plumbing, structural damage, or an unstable fixture.",
  },
  {
    slug: "furniture-upholstery",
    label: "Furniture & upholstery",
    area: "Home",
    description: "Simple checks and upkeep for furniture, with clear limits around load-bearing joints and damaged frames.",
    intro: "Explore furniture repairs and checks for loose fasteners, worn pads, and minor upholstery issues. A cracked leg, split frame, or failed load-bearing joint needs a repair professional before the item is used.",
  },
  {
    slug: "appliances-electronics",
    label: "Appliances & electronics",
    area: "Other",
    description: "Low-risk maintenance and external fixes, with electrical and battery hazards clearly routed to qualified help.",
    intro: "Start with accessible maintenance such as removable filters or user-replaceable batteries. Vitni does not treat mains wiring, swollen batteries, or internal electrical faults as casual DIY repairs.",
  },
  {
    slug: "kitchen-household",
    label: "Kitchen & household",
    area: "Home",
    description: "Cabinet hardware, drawers, and everyday kitchen fittings, with fit checks before buying replacement parts.",
    intro: "Find guides for common kitchen and household fittings. Check hole spacing, fastener thread, and manufacturer instructions before ordering replacement hardware.",
  },
  {
    slug: "garden-outdoor",
    label: "Garden & outdoor",
    area: "Other",
    description: "Small outdoor repairs and maintenance for hand tools, hoses, and garden equipment.",
    intro: "Browse small garden and outdoor repairs. Guides call out sharp edges, pressure, and damaged equipment that should be taken out of use.",
  },
  {
    slug: "personal-gear",
    label: "Personal gear",
    area: "Other",
    description: "Small repairs for bags, luggage, and other everyday carry items.",
    intro: "Find practical fixes for zips, straps, and other personal gear. Do not rely on a DIY repair for climbing, child-restraint, protective, or other safety-critical equipment.",
  },
  {
    slug: "toys-leisure",
    label: "Toys & leisure",
    area: "Other",
    description: "Simple, non-safety-critical repairs for play and leisure items.",
    intro: "Browse basic repairs for toys and leisure items. Small parts, batteries, and structural damage can create safety risks, especially for young children; stop when a repair affects safe use.",
  },
  {
    slug: "vehicles-powered-equipment",
    label: "Vehicles & powered equipment",
    area: "Other",
    description: "Conservative checks and low-risk replaceable items, with safety-critical work referred to a qualified mechanic.",
    intro: "Find conservative maintenance guidance for vehicles and powered equipment. Vitni should direct brakes, steering, fuel, high-voltage systems, and uncertain safety faults to a qualified mechanic.",
  },
  {
    slug: "other-everyday-objects",
    label: "Other everyday objects",
    area: "Other",
    description: "Photo-led repair help for useful objects that do not fit another sector.",
    intro: "If an item does not fit another sector, describe what changed and add a photo. Vitni will identify a likely next step or recommend a repairer when the fault is uncertain or unsafe.",
  },
] as const satisfies readonly { slug: string; label: string; area: RepairArea; description: string; intro: string }[];

export type RepairSector = (typeof repairSectors)[number]["label"];

type RepairSectorEntry = (typeof repairSectors)[number];
const bySlug = new Map<string, RepairSectorEntry>(repairSectors.map((sector) => [sector.slug, sector]));
const byLabel = new Map<string, RepairSectorEntry>(repairSectors.map((sector) => [sector.label, sector]));

export function getRepairSector(slug: string) {
  return bySlug.get(slug) || null;
}

export function isRepairSector(value: string): value is RepairSector {
  return byLabel.has(value);
}

export function inferRepairSector({ id = "", title = "", area = "Other" }: { id?: string; title?: string; area?: string }): RepairSector {
  const text = `${id} ${title}`.toLowerCase();
  if (area === "Bike" || /bike|bicycle|tyre|tire|mudguard|saddle|chain|handlebar/.test(text)) return "Bikes & mobility";
  if (/bag|backpack|luggage|suitcase|wallet|personal-gear/.test(text)) return "Personal gear";
  if (area === "Clothes" || /clothes|textile|seam|sock|trouser|hem|button|zipper|fabric|darn|garment/.test(text)) return "Clothing & textiles";
  if (/chair|furniture|upholster|table|stool/.test(text)) return "Furniture & upholstery";
  if (/remote|vacuum|appliance|electronic|laptop|computer|lamp|battery/.test(text)) return "Appliances & electronics";
  if (/garden|hose|pruner|shears|outdoor|plant/.test(text)) return "Garden & outdoor";
  if (/toy|plush|teddy|board-game|leisure/.test(text)) return "Toys & leisure";
  if (/vehicle|car-|wiper|engine|motor|powered-equipment/.test(text)) return "Vehicles & powered equipment";
  if (/kitchen|cabinet|drawer|cookware|pan-handle/.test(text)) return "Kitchen & household";
  if (area === "Home" || /door|window|wall|hinge|latch|fixture/.test(text)) return "Home fixtures";
  return "Other everyday objects";
}

export function repairSectorByLabel(label: string) {
  return byLabel.get(label) || null;
}
