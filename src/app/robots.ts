import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.PUBLIC_SITE_URL || "https://vitni.cc";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/api/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/api/"] },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: ["/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
    host: base.replace(/\/$/, ""),
  };
}
