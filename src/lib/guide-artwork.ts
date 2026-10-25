import type { RepairGuide } from "@/lib/content";

const artworkRules: [RegExp, string][] = [
  [/flat|puncture|tyre|tire|tube/, "/images/guides/bike-flat.webp"],
  [/chain|gear|drivetrain/, "/images/guides/bike-chain-care.svg"],
  [/saddle|seat/, "/images/guides/bike-saddle.svg"],
  [/zip|zipper/, "/images/guides/zipper.webp"],
  [/button|sew|stitch|seam/, "/images/guides/denim-seam.svg"],
  [/hem|trouser|pants/, "/images/guides/trouser-hem.svg"],
  [/window/, "/images/guides/window-hinge.svg"],
  [/door/, "/images/guides/door-hinge.webp"],
  [/drawer/, "/images/guides/drawer-track.svg"],
  [/kitchen|cabinet|hinge|handle/, "/images/guides/cabinet-hinge.svg"],
  [/wall|hole|crack/, "/images/guides/wall-hole.webp"],
  [/lamp|light/, "/images/lamp-repair.svg"],
];

const areaArtwork: Record<string, string> = {
  Bike: "/images/guides/bike-flat.webp",
  Clothes: "/images/guides/denim-seam.svg",
  Home: "/images/guides/kitchen-handle.webp",
};

export function guideArtwork(guide: Pick<RepairGuide, "title" | "slug" | "area" | "image" | "alt" | "steps">) {
  const savedStep = guide.steps.find((step) => step.image);
  if (guide.image) return { src: guide.image, alt: guide.alt, isFallback: false };
  if (savedStep?.image) return { src: savedStep.image, alt: savedStep.imageAlt || `Illustration for ${guide.title}`, isFallback: false };

  const searchable = `${guide.slug} ${guide.title}`.toLowerCase();
  const matched = artworkRules.find(([pattern]) => pattern.test(searchable))?.[1];
  const src = matched || areaArtwork[guide.area] || "/images/vitni.svg";
  const alt = matched
    ? `Illustrative artwork for ${guide.title}`
    : `Vitni’s ${guide.area.toLowerCase()} repair artwork; this is a category illustration, not a step image`;
  return { src, alt, isFallback: true };
}
