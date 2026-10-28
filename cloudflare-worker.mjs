import process from "node:process";
import vinextHandler from "vinext/server/fetch-handler";

export { WeeklyGuideScout } from "./workers/weekly-guide-scout.mjs";

const runtimeEnvironmentBindings = [
  "OPENAI_API_KEY",
  "PARTNER_INQUIRY_FROM_EMAIL",
  "PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
];

export default {
  fetch(request, env, ctx) {
    for (const name of runtimeEnvironmentBindings) {
      const value = env[name];
      if (typeof value === "string") process.env[name] = value;
    }

    return vinextHandler.fetch(request, env, ctx);
  },
};
