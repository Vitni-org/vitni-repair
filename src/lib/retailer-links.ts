export type RetailerSearch = { name: string; href: string };

const amazonAssociateTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim();

export function withAmazonAffiliateTag(href: string): string {
  if (!amazonAssociateTag) return href;
  try {
    const url = new URL(href);
    if (url.hostname !== "www.amazon.fr" && url.hostname !== "amazon.fr") return href;
    url.searchParams.set("tag", amazonAssociateTag);
    return url.toString();
  } catch {
    return href;
  }
}

export function retailerSearches(partName: string, details = ""): RetailerSearch[] {
  const query = [partName, details].filter(Boolean).join(" ").trim();
  const encoded = encodeURIComponent(query);
  const amazonSearch = new URL("https://www.amazon.fr/s");
  amazonSearch.searchParams.set("k", query);
  if (amazonAssociateTag) amazonSearch.searchParams.set("tag", amazonAssociateTag);
  return [
    { name: "Search Amazon France", href: amazonSearch.toString() },
    { name: "Compare shopping results", href: `https://www.google.com/search?tbm=shop&q=${encoded}` },
  ];
}
