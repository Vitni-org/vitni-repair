import { bindings, defineConfig, defineWorker, exports as workerExports } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "repairlens",
    entrypoint: "cloudflare-worker.mjs",
    compatibilityDate: "2026-10-25",
    compatibilityFlags: ["nodejs_compat", "nodejs_compat_populate_process_env"],
    exports: {
      WeeklyGuideScout: workerExports.workflow({
        name: "vitni-weekly-guide-scout",
        schedules: "0 8 * * 1",
        concurrency: { limit: 1 },
        limits: { steps: 20 },
        defaultRetention: { successRetention: "14 days", errorRetention: "30 days" },
      }),
    },
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
