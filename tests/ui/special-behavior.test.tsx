// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoungeCtaButton } from "@/components/lounge-cta-button";
import { YouthClient } from "@/components/youth-client";
import { YouthWriteClient } from "@/components/youth-write-client";

const mocks = vi.hoisted(() => ({ track: vi.fn(), create: vi.fn(), nickname: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/actions/lounge", () => ({ trackLoungeClick: mocks.track }));
vi.mock("@/app/actions/parent", () => ({ createParentPost: mocks.create, updateParentNickname: mocks.nickname }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/components/youth-access-banner", () => ({ YouthAccessBanner: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Lounge tracking behavior", () => {
  it("opens the safe destination immediately while tracking is unresolved and prevents repeat pending clicks", async () => {
    let resolve!: () => void;
    mocks.track.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<LoungeCtaButton entityType="business" businessId="business" ctaType="website" url="https://example.com" locale="en" source="card">Visit</LoungeCtaButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(open).toHaveBeenCalledWith("https://example.com/", "_blank", "noopener,noreferrer");
    expect(mocks.track).toHaveBeenCalledWith("business", "business", "website", undefined, "en", "card");
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button"));
    expect(open).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(); });
    open.mockRestore();
  });
  it("does not render unsafe destinations", () => {
    render(<LoungeCtaButton entityType="business" businessId="business" ctaType="website" url="javascript:alert(1)" locale="ko">Visit</LoungeCtaButton>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(mocks.track).not.toHaveBeenCalled();
  });
});

describe("Youth access and compose states", () => {
  const base = { locale: "en", myApplication: null, initialPosts: [], newsList: [], isSuperUser: false };
  it("preserves nickname editing, trims the value and disables save while pending", async () => {
    let finish!: (result: { success: boolean }) => void;
    mocks.nickname.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<YouthClient {...base} user={{ id: "u" } as never} userProfile={{ full_name: "Parent", parent_verification_status: "approved", parent_nickname: "Parent" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Nickname" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nickname" }), { target: { value: "  LittleHockey  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.nickname).toHaveBeenCalledExactlyOnceWith("LittleHockey");
    const pending = screen.getByRole("button", { name: "..." }) as HTMLButtonElement;
    expect(pending.disabled).toBe(true);
    fireEvent.click(pending);
    expect(mocks.nickname).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ success: true }); });
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole("textbox", { name: "Nickname" })).toBeNull();
  });
  it("keeps logged-out visitors on the login path without a compose link", () => {
    render(<YouthClient {...base} user={null} userProfile={null} />);
    expect(screen.getByRole("link", { name: /login/i }).getAttribute("href")).toContain("/en/login");
    expect(screen.queryByRole("link", { name: /write/i })).toBeNull();
  });
  it("does not expose compose actions while verification is pending", () => {
    render(<YouthClient {...base} user={{ id: "u" } as never} userProfile={{ full_name: "Parent", parent_verification_status: "pending" }} />);
    expect(screen.getByText("Verification Under Review")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /write/i })).toBeNull();
  });
  it("keeps a compose submission disabled until the mocked action resolves", async () => {
    let resolve!: (result: { success: boolean }) => void;
    mocks.create.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<YouthWriteClient locale="en" user={{ id: "u" }} userProfile={{ full_name: "Parent", parent_verification_status: "approved", parent_nickname: "Parent" }} myApplication={null} />);
    const fields = screen.getAllByRole("textbox");
    fireEvent.change(fields[0], { target: { value: "Title" } });
    fireEvent.change(fields[1], { target: { value: "Content" } });
    fireEvent.submit(fields[0].closest("form")!);
    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(mocks.create).toHaveBeenCalledWith("Title", "Content", "Parent", undefined);
    await act(async () => { resolve({ success: true }); });
    expect(mocks.push).toHaveBeenCalledWith("/en/youth");
  });
});
