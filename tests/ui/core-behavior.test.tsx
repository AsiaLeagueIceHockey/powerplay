// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Club } from "@/app/actions/types";
import { ClubCard } from "@/components/club-card";
import { RegionFilterDrawer } from "@/components/region-filter-drawer";
import { RinkFilterDrawer } from "@/components/rink-filter-drawer";
import { MatchTypeFilterDrawer } from "@/components/match-type-filter-drawer";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("next/image", () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); document.body.style.overflow = ""; });
const club = { id: "club-a", name: "Long Club", description: "A description long enough to expand without following the club navigation.", kakao_open_chat_url: "https://open.kakao.com/example", rinks: [] } as unknown as Club;

describe("core controls preserve domain interactions", () => {
  it("keeps expand, vote and external chat isolated from card navigation", async () => {
    const vote = vi.fn();
    render(<ClubCard club={club} onVote={vote} />);
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    expect(screen.getByRole("button", { name: "Show Less" })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Vote" })); });
    fireEvent.click(screen.getByTitle("KakaoTalk Open Chat"));
    expect(vote).toHaveBeenCalledWith("club-a");
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Long Club"));
    expect(push).toHaveBeenCalledWith("/en/clubs/club-a");
  });
  it("activates the club by keyboard without capturing child button keys", () => {
    render(<ClubCard club={club} onVote={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Vote" }), { key: "Enter" });
    expect(push).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("link", { name: /Long Club/ }), { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/en/clubs/club-a");
  });
  it("suppresses repeated votes while the first request is pending", () => {
    const vote = vi.fn(() => new Promise<void>(() => {}));
    render(<ClubCard club={club} onVote={vote} />);
    const button = screen.getByRole("button", { name: "Vote" });
    fireEvent.click(button); fireEvent.click(button);
    expect(vote).toHaveBeenCalledTimes(1);
  });
  it("restores body scrolling when an open filter is unmounted", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(<RegionFilterDrawer isOpen onClose={vi.fn()} regions={["Seoul"]} selectedRegions={[]} onSelectRegions={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
  it.each(["region", "rink", "type"])("holds %s edits in a draft until Apply and resets only the draft", (kind) => {
    const select = vi.fn(); const close = vi.fn();
    if (kind === "region") render(<RegionFilterDrawer isOpen onClose={close} regions={["Seoul", "Busan"]} selectedRegions={["Seoul"]} onSelectRegions={select} />);
    if (kind === "rink") render(<RinkFilterDrawer isOpen onClose={close} rinks={[{ id: "a", name_en: "Seoul" }, { id: "b", name_en: "Busan" }] as never} selectedRinkIds={["a"]} onSelectRinkIds={select} />);
    if (kind === "type") render(<MatchTypeFilterDrawer isOpen onClose={close} selectedTypes={["training"]} onSelectTypes={select} />);
    fireEvent.click(screen.getByRole("button", { name: kind === "type" ? "types.game" : "Busan" }));
    expect(select).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Apply (2)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply (0)" }));
    expect(select).toHaveBeenCalledWith([]); expect(close).toHaveBeenCalledTimes(1);
  });
});
