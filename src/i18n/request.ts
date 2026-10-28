import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

const messagesByLocale = {
  en: enMessages,
  fr: frMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(routing.locales, requestedLocale) ? requestedLocale : routing.defaultLocale;
  const messages = messagesByLocale[locale];

  return { locale, messages };
});
