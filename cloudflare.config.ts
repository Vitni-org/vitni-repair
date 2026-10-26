import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "repairlens",
    entrypoint: "cloudflare-worker.mjs",
    compatibilityDate: "2026-10-25",
    compatibilityFlags: ["nodejs_compat", "nodejs_compat_populate_process_env"],
    domains: ["vitni.cc"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      PUBLIC_SITE_URL: bindings.text("https://vitni.cc"),
    },
  }),
});
