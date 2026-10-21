// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChargeForm } from "@/components/charge-form";
import { ProfileForm } from "@/components/profile-form";
import { MatchApplication } from "@/components/match-application";
import { CopyButton } from "@/components/copy-button";

const actions = vi.hoisted(() => ({
  charge: vi.fn(), update: vi.fn(), join: vi.fn(), cancel: vi.fn(), waitlist: vi.fn(),
  push: vi.fn(), refresh: vi.fn(), copy: vi.fn(),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: actions.push, refresh: actions.refresh }) }));
vi.mock("@/app/actions/points", () => ({ requestPointCharge: actions.charge }));
vi.mock("@/app/actions/auth", () => ({ updateProfile: actions.update }));
vi.mock("@/app/actions/match", () => ({ joinMatch: actions.join, cancelJoin: actions.cancel, joinWaitlist: actions.waitlist }));

const match = {
  matchId: "fixture-match", positions: { FW: true, DF: true, G: true }, isJoined: false,
  isAuthenticated: true, matchStatus: "open", matchStartTime: "2099-10-20T13:00:00Z",
};

describe("account controls preserve native and domain behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: actions.copy.mockResolvedValue(undefined) } });
  });
  afterEach(() => cleanup());

  it("quick charge choices never submit and a pending charge suppresses duplicate clicks", async () => {
    let finish!: (result: { error: string }) => void;
    actions.charge.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const { container } = render(<ChargeForm bankAccount={null} initialAmount={12500} />);
    const quickChoice = screen.getByRole("button", { name: "50,000KRW" });
    expect(quickChoice.getAttribute("type")).toBe("button");
    fireEvent.click(quickChoice);
    expect(actions.charge).not.toHaveBeenCalled();
    const name = container.querySelector<HTMLInputElement>("input[required]")!;
    fireEvent.change(name, { target: { value: "  Fixture User  " } });
    const submit = screen.getByRole("button", { name: "submit" });
    expect(submit.getAttribute("type")).toBe("submit");
    fireEvent.click(submit);
    expect(actions.charge).toHaveBeenCalledExactlyOnceWith(50000, "Fixture User");
    expect((screen.getByRole("button", { name: "submitting" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "submitting" }));
    expect(actions.charge).toHaveBeenCalledTimes(1);
    await act(async () => finish({ error: "Fixture failure" }));
    expect(screen.getByText("Fixture failure")).toBeTruthy();
    expect((screen.getByRole("button", { name: "submit" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("profile submits the existing FormData names and keeps pending save disabled", async () => {
    let finish!: (result: { error: string }) => void;
    actions.update.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<ProfileForm profile={{ id: "fixture", email: "fixture@example.test", full_name: "Fixture", position: "DF", preferred_lang: "en", role: "user" }} />);
    fireEvent.change(screen.getByLabelText("fullName"), { target: { value: "Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(actions.update).toHaveBeenCalledTimes(1);
    const payload = actions.update.mock.calls[0][0] as FormData;
    expect(Object.fromEntries(payload.entries())).toEqual({ fullName: "Updated", position: "DF", preferredLang: "en" });
    expect((screen.getByRole("button", { name: "saving" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => finish({ error: "Fixture profile error" }));
    expect(screen.getByText("Fixture profile error")).toBeTruthy();
  });

  it("pending payment retains rental shortage and navigates to charging without joining again", () => {
    render(<MatchApplication {...match} isJoined currentStatus="pending_payment" currentPosition="DF" entryPoints={30000} rentalFee={10000} rentalOptIn rentalAvailable userPoints={12000} />);
    expect(screen.getByText("28,000KRW")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to Charge →" }));
    expect(actions.push).toHaveBeenCalledWith("/en/mypage/points/charge");
    expect(actions.join).not.toHaveBeenCalled();
  });

  it("anonymous participation routes to login and ended games never offer a join action", () => {
    const { rerender } = render(<MatchApplication {...match} isAuthenticated={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Login to Join" }));
    expect(actions.push).toHaveBeenCalledWith("/en/login");
    rerender(<MatchApplication {...match} matchStartTime="2000-01-01T00:00:00Z" />);
    expect(screen.getByText("This match has ended")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("copy is isolated from a parent card click and preserves its payload", async () => {
    const parentClick = vi.fn();
    render(<div onClick={parentClick}><CopyButton text="Fixture account" /></div>);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })));
    expect(actions.copy).toHaveBeenCalledExactlyOnceWith("Fixture account");
    expect(parentClick).not.toHaveBeenCalled();
  });
});
