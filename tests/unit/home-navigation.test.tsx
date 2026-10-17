import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/[locale]/(public)/page";
import { PublicSectionTabs } from "@/components/public-section-tabs";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/i18n/navigation", () => ({ Link: (props: ComponentProps<"a">) => <a {...props} /> }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));
vi.mock("@/lib/public-matches", () => ({ getPublicHomeMatches: vi.fn() }));
vi.mock("@/components/home-client", () => ({ HomeClient: () => null }));
vi.mock("@/components/feedback-banner", () => ({ FeedbackBanner: () => null }));
vi.mock("@/components/find-club-banner", () => ({ FindClubBanner: () => null }));
vi.mock("@/components/skeletons", () => ({ HomePageSkeleton: () => null }));

describe("club-first home navigation", () => {
  beforeEach(() => { redirect.mockClear(); });

  it.each(["ko", "en"])("opens the %s club directory on a normal home visit", async (locale) => {
    await expect(HomePage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow(`REDIRECT:/${locale}/clubs`);
  });

  it.each([
    { tab: "match" },
    { date: "2026-10-18" },
    { tab: "match", date: "2026-10-18" },
  ])("keeps an explicit match or shared date link on the match feed: %j", async (query) => {
    const page = await HomePage({
      params: Promise.resolve({ locale: "ko" }),
      searchParams: Promise.resolve(query),
    });
    expect(page).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("opens the rink directory for an existing rink-tab link", async () => {
    await expect(HomePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ tab: "rink" }),
    })).rejects.toThrow("REDIRECT:/en/rinks");
  });

  it.each(["ko", "en"])("renders Clubs / Rinks / Matches destinations in %s", (locale) => {
    const html = renderToStaticMarkup(<PublicSectionTabs locale={locale} activeTab="club" />);
    const destinations = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(destinations).toEqual([
      `/${locale}/clubs`,
      `/${locale}/rinks`,
      `/${locale}?tab=match`,
    ]);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});
