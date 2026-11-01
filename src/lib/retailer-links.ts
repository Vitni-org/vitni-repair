export type RetailerArea = "Bike" | "Home" | "Clothes" | "Other";
export type RetailerContext = "guide_detail" | "generated_plan";
export type RetailerSearch = { id: string; name: string; href: string; kind: "local" | "marketplace" | "compare"; action?: "search" | "visit" };

const amazonAssociateTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim();

type LocalRetailer = {
  id: string;
  name: string;
  baseUrl: string;
  queryKey?: string;
};

// Keep these as retailer search pages, not guessed product links. Local availability and fit still need checking.
const localRetailers: Record<string, Partial<Record<RetailerArea, LocalRetailer>>> = {
  FR: {
    Bike: { id: "alltricks", name: "Alltricks", baseUrl: "https://www.alltricks.fr/search", queryKey: "query" },
    Home: { id: "leroy-merlin", name: "Leroy Merlin", baseUrl: "https://www.leroymerlin.fr/search", queryKey: "q" },
    Clothes: { id: "mondial-tissus", name: "Mondial Tissus", baseUrl: "https://www.mondialtissus.fr/catalogsearch/result/", queryKey: "q" },
  },
  IT: {
    Bike: { id: "decathlon", name: "Decathlon", baseUrl: "https://www.decathlon.it/search", queryKey: "query" },
    Home: { id: "leroy-merlin", name: "Leroy Merlin", baseUrl: "https://www.leroymerlin.it/search", queryKey: "q" },
    Clothes: { id: "mondial-tissus", name: "Mondial Tissus", baseUrl: "https://www.mondialtissus.it/catalogsearch/result/", queryKey: "q" },
  },
  DE: {
    Bike: { id: "bike24", name: "BIKE24", baseUrl: "https://www.bike24.de/suchergebnis", queryKey: "searchTerm" },
    Home: { id: "obi", name: "OBI", baseUrl: "https://www.obi.de/" },
    Clothes: { id: "stoffe", name: "Stoffe.de", baseUrl: "https://www.stoffe.de/suche/", queryKey: "q" },
  },
};

const amazonDomains: Record<string, string> = {
  AU: "amazon.com.au",
  BE: "amazon.com.be",
  BR: "amazon.com.br",
  CA: "amazon.ca",
  DE: "amazon.de",
  EG: "amazon.eg",
  ES: "amazon.es",
  FR: "amazon.fr",
  GB: "amazon.co.uk",
  IN: "amazon.in",
  IT: "amazon.it",
  JP: "amazon.co.jp",
  MX: "amazon.com.mx",
  NL: "amazon.nl",
  PL: "amazon.pl",
  SA: "amazon.sa",
  SE: "amazon.se",
  SG: "amazon.sg",
  TR: "amazon.com.tr",
  US: "amazon.com",
};

function normalizeCountryCode(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) && normalized !== "XX" ? normalized : "FR";
}

function addVitniReferralTags(href: string, countryCode: string, retailerId: string, area: RetailerArea, context: RetailerContext) {
  const url = new URL(href);
  url.searchParams.set("utm_source", "vitni");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "repair_parts");
  // These values are fixed identifiers; repair descriptions and user-entered text never enter UTMs.
  url.searchParams.set("utm_content", `${countryCode.toLowerCase()}_${area.toLowerCase()}_${retailerId}_${context}`);
  return url.toString();
}

function retailerHref(retailer: LocalRetailer, query: string) {
  const url = new URL(retailer.baseUrl);
  if (retailer.queryKey) {
    url.searchParams.set(retailer.queryKey, query);
  }
  return url.toString();
}

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

export function withVitniReferralTags(href: string, countryCode: string, retailerId: string, area: RetailerArea, context: RetailerContext) {
  try {
    return addVitniReferralTags(href, normalizeCountryCode(countryCode), retailerId, area, context);
  } catch {
    return href;
  }
}

export function retailerSearches(
  partName: string,
  details = "",
  countryCode = "FR",
  area: RetailerArea = "Other",
  context: RetailerContext = "guide_detail",
  locale = "en",
): RetailerSearch[] {
  const country = normalizeCountryCode(countryCode);
  const query = [partName, details].filter(Boolean).join(" ").trim();
  const searches: RetailerSearch[] = [];
  const localRetailer = localRetailers[country]?.[area] || (area === "Other" ? localRetailers[country]?.Home : undefined);

  if (localRetailer) {
    searches.push({
      id: localRetailer.id,
      name: localRetailer.name,
      href: withVitniReferralTags(retailerHref(localRetailer, query), country, localRetailer.id, area, context),
      kind: "local",
      action: localRetailer.queryKey ? "search" : "visit",
    });
  }

  const amazonDomain = amazonDomains[country];
  if (amazonDomain) {
    const amazonSearch = new URL(`https://www.${amazonDomain}/s`);
    amazonSearch.searchParams.set("k", query);
    const href = withVitniReferralTags(amazonSearch.toString(), country, "amazon", area, context);
    searches.push({ id: "amazon", name: "Amazon", href: withAmazonAffiliateTag(href), kind: "marketplace" });
  }

  const shoppingSearch = new URL("https://www.google.com/search");
  shoppingSearch.searchParams.set("tbm", "shop");
  shoppingSearch.searchParams.set("q", query);
  shoppingSearch.searchParams.set("gl", country.toLowerCase());
  shoppingSearch.searchParams.set("hl", locale === "fr" ? "fr" : "en");
  searches.push({
    id: "shopping-compare",
    name: "Compare prices",
    href: withVitniReferralTags(shoppingSearch.toString(), country, "shopping_compare", area, context),
    kind: "compare",
  });

  return searches;
}
