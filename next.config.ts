import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
  async redirects() {
    return [
      { source: "/guides.html", destination: "/guides/", permanent: true },
      { source: "/guide.html", has: [{ type: "query", key: "guide", value: "(?<slug>[a-z0-9-]+)" }], destination: "/guides/:slug/", permanent: true },
      { source: "/guide.html", destination: "/guides/", permanent: true },
      {
        source: "/story.html",
        has: [{ type: "query", key: "story", value: "(?<slug>[a-z0-9-]+)" }],
        destination: "/stories/:slug/",
        permanent: true,
      },
      { source: "/story.html", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
