// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegionFilterDrawer } from "@/components/region-filter-drawer";
import { RinkFilterDrawer } from "@/components/rink-filter-drawer";
import { MatchTypeFilterDrawer } from "@/components/match-type-filter-drawer";
import { TamagotchiCloset } from "@/components/tamagotchi-closet";
import { TAMAGOTCHI_PALETTE } from "@/lib/tamagotchi-palette";
import type { TamagotchiPetColors } from "@/lib/tamagotchi-types";

vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("@/components/tamagotchi-avatar", () => ({ TamagotchiAvatar: () => null }));
afterEach(() => { cleanup(); vi.useRealTimers(); document.body.style.overflow = ""; });

type Kind = "region" | "rink" | "type";
const rinks = [{ id: "a", name_en: "Seoul" }, { id: "b", name_en: "Busan" }] as never;
const otherOption: Record<Kind, string> = { region: "Busan", rink: "Busan", type: "types.game" };

function drawer(kind: Kind, isOpen: boolean, selected: string[], onSelect = vi.fn()) {
  if (kind === "region") return <RegionFilterDrawer isOpen={isOpen} onClose={vi.fn()} regions={["Seoul", "Busan"]} selectedRegions={selected} onSelectRegions={onSelect} />;
  if (kind === "rink") return <RinkFilterDrawer isOpen={isOpen} onClose={vi.fn()} rinks={rinks} selectedRinkIds={selected} onSelectRinkIds={onSelect} />;
  return <MatchTypeFilterDrawer isOpen={isOpen} onClose={vi.fn()} selectedTypes={selected} onSelectTypes={onSelect} />;
}
const initialSelection: Record<Kind, string[]> = { region: ["Seoul"], rink: ["a"], type: ["training"] };

describe("filter drawers keep their parent-controlled draft lifecycle", () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it.each<Kind>(["region", "rink", "type"])("%s: discards unapplied edits on reopen and unmounts after the close animation", (kind) => {
    const selected = initialSelection[kind];
    const { rerender, container } = render(drawer(kind, false, selected));
    expect(container.firstChild).toBeNull();

    rerender(drawer(kind, true, selected));
    expect(screen.getByRole("button", { name: "Apply (1)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: otherOption[kind] }));
    expect(screen.getByRole("button", { name: "Apply (2)" })).toBeTruthy();

    rerender(drawer(kind, false, selected));
    expect(screen.queryByRole("dialog")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(300); });
    expect(container.firstChild).toBeNull();

    rerender(drawer(kind, true, selected));
    expect(screen.getByRole("button", { name: "Apply (1)" })).toBeTruthy();
  });

  it.each<Kind>(["region", "rink", "type"])("%s: picks up a selection the parent changed while closed", (kind) => {
    const { rerender } = render(drawer(kind, false, initialSelection[kind]));
    rerender(drawer(kind, false, []));
    rerender(drawer(kind, true, []));
    expect(screen.getByRole("button", { name: "Apply (0)" })).toBeTruthy();
  });

  it("restores the previous body overflow on close and keeps the drawer when reopened mid-animation", () => {
    document.body.style.overflow = "auto";
    const { rerender } = render(drawer("region", false, ["Seoul"]));
    rerender(drawer("region", true, ["Seoul"]));
    expect(document.body.style.overflow).toBe("hidden");
    rerender(drawer("region", false, ["Seoul"]));
    expect(document.body.style.overflow).toBe("auto");
    act(() => { vi.advanceTimersByTime(150); });
    rerender(drawer("region", true, ["Seoul"]));
    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("tamagotchi closet resets its draft per open session", () => {
  const initial: TamagotchiPetColors = {
    helmet: TAMAGOTCHI_PALETTE.helmet[0].hex,
    jersey: TAMAGOTCHI_PALETTE.jersey[0].hex,
    skate: TAMAGOTCHI_PALETTE.skate[0].hex,
  };
  const closet = (isOpen: boolean, onSave: (next: TamagotchiPetColors) => Promise<{ success: boolean }>, colors = initial) =>
    <TamagotchiCloset isOpen={isOpen} initialColors={colors} alt="pet" onSave={onSave} onClose={vi.fn()} />;

  it("drops an unsaved draft and selected part after close/reopen", async () => {
    const onSave = vi.fn(async () => ({ success: true }));
    const { rerender, container } = render(closet(false, onSave));
    expect(container.firstChild).toBeNull();

    rerender(closet(true, onSave));
    fireEvent.click(screen.getAllByRole("tab")[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "swatchAria" })[1]);

    rerender(closet(false, onSave));
    rerender(closet(true, onSave));
    expect(screen.getAllByRole("tab")[0].getAttribute("aria-selected")).toBe("true");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "save" })); });
    expect(onSave).toHaveBeenCalledWith(initial);
  });

  it("saves the edited draft within one session", async () => {
    const onSave = vi.fn(async () => ({ success: true }));
    const { rerender } = render(closet(false, onSave));
    rerender(closet(true, onSave));
    fireEvent.click(screen.getAllByRole("button", { name: "swatchAria" })[1]);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "save" })); });
    expect(onSave).toHaveBeenCalledWith({ ...initial, helmet: TAMAGOTCHI_PALETTE.helmet[1].hex });
  });

  it("adopts new initial colors delivered while open", async () => {
    const onSave = vi.fn(async () => ({ success: true }));
    const next = { ...initial, jersey: TAMAGOTCHI_PALETTE.jersey[1].hex };
    const { rerender } = render(closet(true, onSave));
    rerender(closet(true, onSave, next));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "save" })); });
    expect(onSave).toHaveBeenCalledWith(next);
  });
});
