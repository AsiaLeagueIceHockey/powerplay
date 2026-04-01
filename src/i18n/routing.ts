import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // List of all locales that are supported
  locales: ["ko", "en"],

  // Default locale when no locale matches
  defaultLocale: "ko",

  // Use prefix for all locales (including default)
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
