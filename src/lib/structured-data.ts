export type BreadcrumbEntry = { name: string; path: string };

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function createBreadcrumbList(baseUrl: string, entries: BreadcrumbEntry[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: entries.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: new URL(path, baseUrl).href,
    })),
  };
}

export function createSiteStructuredData(baseUrl: string, locale: "en" | "fr" = "en") {
  const siteUrl = baseUrl.replace(/\/$/, "");
  const localizedSiteUrl = locale === "fr" ? `${siteUrl}/fr/` : `${siteUrl}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Vitni",
        url: localizedSiteUrl,
        inLanguage: locale,
        description: "Practical repair guides and safe next steps for the things people use every day.",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/vitni-mark.svg`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Vitni",
        url: localizedSiteUrl,
        inLanguage: locale,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}
