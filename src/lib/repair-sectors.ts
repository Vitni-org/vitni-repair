import type { RepairArea } from "@/lib/content";

export const repairSectors = [
  {
    slug: "bikes-mobility",
    label: "Bikes & mobility",
    area: "Bike",
    description: "Bicycle repair guides for flat tyres, slipped chains, loose saddles, and routine adjustments, with checks to make before riding.",
    intro: "Find practical bicycle repair steps for common problems. Each guide lists tools, checks, and clear stop signs; confirm the wheel, brakes, steering, and repair before riding.",
    questions: [
      { question: "Can I ride with a loose or slipping bike chain?", answer: "Stop and check the chain before riding. If it is bent, jammed, repeatedly slipping, or the derailleur looks damaged, keep the bike out of use and ask a bicycle mechanic." },
      { question: "What should I check after a bicycle repair?", answer: "With the bike stationary, confirm the wheel is secured, the tyre is seated, brakes work, steering is stable, and no tool or loose part remains. If anything feels uncertain, walk the bike to a repair shop instead of riding it." },
    ],
  },
  {
    slug: "clothing-textiles",
    label: "Clothing & textiles",
    area: "Clothes",
    description: "Mending, seams, hems, buttons, zips, and small textile repairs that help garments stay in use.",
    intro: "Browse clothing and textile repairs for small tears, loose buttons, stuck zips, and hems. Guides note when a tailor is the safer or more durable choice.",
    questions: [
      { question: "Can I mend a torn seam by hand?", answer: "A short tear can often be stitched when the fabric beside it is still strong and the seam is not safety-critical. Use small stitches along the original seam, then test gently. Choose a tailor for a large tear, fragile fabric, or a high-stress seam." },
      { question: "How do I choose thread for a clothing repair?", answer: "Check the garment care label and choose thread and a needle suited to the fabric weight. Test on a hidden area or scrap first; delicate, stretchy, or coated fabrics may need specialist tools or a tailor." },
    ],
  },
  {
    slug: "home-fixtures",
    label: "Home fixtures",
    area: "Home",
    description: "Small, non-structural fixes for doors, windows, drawers, walls, and everyday fixtures.",
    intro: "These home repair guides cover small, visible, non-structural problems. Stop and contact a qualified tradesperson if you suspect hidden wiring, plumbing, structural damage, or an unstable fixture.",
    questions: [
      { question: "Which home repairs are reasonable to try yourself?", answer: "Start with small, visible jobs such as a known screw hole or a loose cabinet handle, using the correct fastener and tool. Do not drill or remove fittings when you are unsure what is behind them." },
      { question: "When should I call a tradesperson for a door or window?", answer: "Stop if a window is heavy or unstable, glass is cracked, a frame is damaged, or you suspect wiring, plumbing, or structural movement. Secure the area and contact a qualified local professional." },
    ],
  },
  {
    slug: "furniture-upholstery",
    label: "Furniture & upholstery",
    area: "Home",
    description: "Simple checks and upkeep for furniture, with clear limits around load-bearing joints and damaged frames.",
    intro: "Explore furniture repairs and checks for loose fasteners, worn pads, and minor upholstery issues. A cracked leg, split frame, or failed load-bearing joint needs a repair professional before the item is used.",
    questions: [
      { question: "Is it safe to use a chair after tightening a screw?", answer: "First inspect the frame and joints. Do not use the chair if a leg is cracked, a joint is separating, or it still rocks after the correct fastener is tightened; load-bearing damage needs a proper repair." },
      { question: "How do I stop furniture scratching a floor?", answer: "Clean the contact points and fit pads made for the furniture leg and floor surface. Replace pads when they are worn, loose, or holding grit; pads do not repair a weak or unstable leg." },
    ],
  },
  {
    slug: "appliances-electronics",
    label: "Appliances & electronics",
    area: "Other",
    description: "Low-risk maintenance and external fixes, with electrical and battery hazards clearly routed to qualified help.",
    intro: "Start with accessible maintenance such as removable filters or user-replaceable batteries. Vitni does not treat mains wiring, swollen batteries, or internal electrical faults as casual DIY repairs.",
    questions: [
      { question: "Can I replace an appliance battery myself?", answer: "Only if the manufacturer designed it as user-replaceable and provides instructions. Use the specified battery type and polarity. Stop if a battery is swollen, hot, leaking, or enclosed behind a service panel." },
      { question: "Can I replace an oven light bulb at home?", answer: "Only follow the oven manufacturer’s instructions for a user-replaceable lamp. Let the oven cool and isolate power as the manual directs; use the specified heat-rated bulb. Do not remove panels or handle wiring." },
    ],
  },
  {
    slug: "kitchen-household",
    label: "Kitchen & household",
    area: "Home",
    description: "Cabinet hardware, drawers, and everyday kitchen fittings, with fit checks before buying replacement parts.",
    intro: "Find guides for common kitchen and household fittings. Check hole spacing, fastener thread, and manufacturer instructions before ordering replacement hardware.",
    questions: [
      { question: "How do I choose a replacement cabinet handle?", answer: "Measure the distance between the existing screw holes and check the screw diameter, length, and thread. Compare the new handle’s fixing dimensions before buying; do not force a mismatched screw into the cabinet." },
      { question: "What should I check before replacing a drawer runner?", answer: "Remove the drawer only as its instructions allow, then note the runner length, mounting style, extension type, and left/right orientation. Replace like for like and stop if the cabinet or runner is bent or damaged." },
    ],
  },
  {
    slug: "garden-outdoor",
    label: "Garden & outdoor",
    area: "Other",
    description: "Small outdoor repairs and maintenance for hand tools, hoses, and garden equipment.",
    intro: "Browse small garden and outdoor repairs. Guides call out sharp edges, pressure, and damaged equipment that should be taken out of use.",
    questions: [
      { question: "How can I maintain hand garden shears?", answer: "Brush away plant residue, dry the tool before storage, and follow its maker’s care instructions. Keep hands clear of the blade; do not use shears with a cracked handle, loose blade, or faulty lock." },
      { question: "Can I repair a cracked garden-tool handle?", answer: "Do not use a tool with a cracked or loose handle. Replace it only with a compatible part fitted securely according to the manufacturer’s instructions; otherwise take it to a tool repairer or replace the tool." },
    ],
  },
  {
    slug: "personal-gear",
    label: "Personal gear",
    area: "Other",
    description: "Small repairs for bags, luggage, and other everyday carry items.",
    intro: "Find practical fixes for zips, straps, and other personal gear. Do not rely on a DIY repair for climbing, child-restraint, protective, or other safety-critical equipment.",
    questions: [
      { question: "Can I sew a torn backpack strap?", answer: "A decorative or lightly loaded strap may be mendable if the surrounding fabric is sound. Do not trust a home repair for climbing gear, child restraints, protective equipment, or any strap whose failure could injure someone." },
      { question: "Can I replace a broken zipper pull?", answer: "If the slider and teeth still work, a compatible replacement pull can restore grip. If teeth are missing, the slider is split, or the zip separates under light use, ask a bag repairer or tailor to replace the zipper." },
    ],
  },
  {
    slug: "toys-leisure",
    label: "Toys & leisure",
    area: "Other",
    description: "Simple, non-safety-critical repairs for play and leisure items.",
    intro: "Browse basic repairs for toys and leisure items. Small parts, batteries, and structural damage can create safety risks, especially for young children; stop when a repair affects safe use.",
    questions: [
      { question: "When should a damaged toy be taken out of use?", answer: "Remove it from play if it has loose small parts, sharp edges, exposed wiring, a leaking battery, or structural damage. Follow the manufacturer’s age and repair guidance, especially for toys used by very young children." },
      { question: "Can I open an electronic toy to fix it?", answer: "Only use a battery compartment or maintenance access the manufacturer marks for users. Remove batteries before cleaning as instructed; do not solder, open a mains adapter, or handle a damaged or leaking battery." },
    ],
  },
  {
    slug: "vehicles-powered-equipment",
    label: "Vehicles & powered equipment",
    area: "Other",
    description: "Conservative checks and low-risk replaceable items, with safety-critical work referred to a qualified mechanic.",
    intro: "Find conservative maintenance guidance for vehicles and powered equipment. Vitni should direct brakes, steering, fuel, high-voltage systems, and uncertain safety faults to a qualified mechanic.",
    questions: [
      { question: "Which vehicle maintenance tasks are suitable for a beginner?", answer: "A simple user-serviceable task, such as changing a windscreen wiper blade, may be suitable when the vehicle manual explains it. Do not attempt brake, steering, airbag, fuel, or high-voltage repairs without qualified training." },
      { question: "Can I repair an electric bike or scooter battery?", answer: "Do not open or repair a lithium battery pack yourself. If it is hot, swollen, leaking, damaged, or behaving unusually, stop using and charging it and contact the manufacturer or a qualified service centre." },
    ],
  },
  {
    slug: "other-everyday-objects",
    label: "Other everyday objects",
    area: "Other",
    description: "Photo-led repair help for useful objects that do not fit another sector.",
    intro: "If an item does not fit another sector, describe what changed and add a photo. Vitni will identify a likely next step or recommend a repairer when the fault is uncertain or unsafe.",
    questions: [
      { question: "What information helps identify a replacement part?", answer: "Share the item’s make and model, any part number, a clear close-up, and key measurements. Compare the exact dimensions and manufacturer compatibility before ordering; a photo alone may not reveal a hidden fit difference." },
      { question: "When should I stop a repair and ask for help?", answer: "Stop if the item is unstable, hot, smoking, leaking, pressurized, connected to mains electricity, or could cause injury if it fails. Keep it out of use and contact a qualified repairer or the manufacturer." },
    ],
  },
] as const satisfies readonly {
  slug: string;
  label: string;
  area: RepairArea;
  description: string;
  intro: string;
  questions: readonly { question: string; answer: string }[];
}[];

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
