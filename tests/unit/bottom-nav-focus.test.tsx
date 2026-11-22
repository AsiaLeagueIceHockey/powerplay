// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/components/bottom-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/ko/clubs" }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/contexts/chat-unread-context", () => ({ useChatUnread: () => ({ totalUnreadCount: 0 }) }));

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("bottom navigation focus handling", () => {
  it("ignores window focus and hides and restores navigation for an input", () => {
    vi.useFakeTimers();
    render(<><BottomNav locale="ko" /><input aria-label="search" /></>);
    const nav = screen.getByRole("navigation");
    act(() => { window.dispatchEvent(new FocusEvent("focus")); });
    expect(nav.className).toContain("opacity-100");
    const input = screen.getByRole("textbox", { name: "search" });
    act(() => input.focus());
    expect(nav.className).toContain("opacity-0");
    act(() => { input.blur(); vi.advanceTimersByTime(50); });
    expect(nav.className).toContain("opacity-100");
  });
});
