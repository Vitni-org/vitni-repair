export type RetailerSearch = { name: string; href: string };

export function retailerSearches(partName: string, details = ""): RetailerSearch[] {
  const query = [partName, details].filter(Boolean).join(" ").trim();
  const encoded = encodeURIComponent(query);
  return [
    { name: "Search Amazon France", href: `https://www.amazon.fr/s?k=${encoded}` },
    { name: "Compare shopping results", href: `https://www.google.com/search?tbm=shop&q=${encoded}` },
  ];
}
