// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserThemeScope } from "@/components/ui/user-theme-scope";

const route = vi.hoisted(() => ({ pathname: "/ko/clubs" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
afterEach(cleanup);

describe("explicit user theme boundaries", () => {
  it.each([["/ko/clubs", "powerplay"], ["/en/onboarding", "powerplay"], ["/ko/chat/fixture-room", "powerplay"], ["/en/lounge", "lounge"], ["/ko/lounge-membership", "lounge"], ["/en/youth/write", "youth"], ["/ko/admin-apply", "powerplay"]])("scopes %s to %s", (pathname, theme) => {
    route.pathname = pathname;
    const { container } = render(<UserThemeScope><div>Fixture</div></UserThemeScope>);
    expect(container.querySelector(".pp-ui")?.getAttribute("data-ui-theme")).toBe(theme);
  });
  it.each(["/ko/admin/clubs", "/en/instagram/club-ranking"])("keeps excluded route %s outside the public scope", pathname => {
    route.pathname = pathname;
    const { container } = render(<UserThemeScope><div>Fixture</div></UserThemeScope>);
    expect(container.querySelector(".pp-ui")).toBeNull();
  });
});
