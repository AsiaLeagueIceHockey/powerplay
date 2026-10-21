// @vitest-environment jsdom
import { createRef, type ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, IconButton, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FilterChip } from "@/components/ui/filter-chip";
import { SegmentedControl, SegmentedItem } from "@/components/ui/segmented-control";
import { badgeStyles, buttonStyles, overlayStyles, surfaceStyles } from "@/components/ui/styles";

vi.mock("@/i18n/navigation", () => ({ Link: ({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) => { void prefetch; return <a {...props} />; } }));
afterEach(cleanup);

describe("native design-system controls", () => {
  it("defaults to a non-submitting button and forwards native props, events and refs", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const click = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<form onSubmit={submit}><Button ref={ref} name="intent" value="save" aria-label="Save" onClick={click}>Save</Button></form>);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(click).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    expect(ref.current?.type).toBe("button");
    expect(ref.current?.name).toBe("intent");
    expect(ref.current?.value).toBe("save");
  });

  it("supports explicit submit buttons associated with an external form", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<><form id="join" onSubmit={submit} /><Button type="submit" form="join">Join</Button></>);
    fireEvent.click(screen.getByRole("button", { name: "Join" }));
    expect(submit).toHaveBeenCalledOnce();
  });

  it.each([{ loading: true }, { disabled: true }])("suppresses actions while unavailable: %j", (props) => {
    const click = vi.fn();
    render(<Button {...props} onClick={click}>Apply</Button>);
    const button = screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(click).not.toHaveBeenCalled();
    if ("loading" in props) expect(button.getAttribute("aria-busy")).toBe("true");
  });

  it("gives an icon-only button a required accessible label", () => {
    render(<IconButton label="Close"><svg aria-hidden="true" /></IconButton>);
    expect(screen.getByRole("button", { name: "Close" }).className).toContain("pp-icon-button");
  });

  it("uses the locale-aware internal Link and preserves anchor attributes", () => {
    render(<LinkButton href="/clubs" aria-current="page" prefetch={false}>Clubs</LinkButton>);
    const link = screen.getByRole("link", { name: "Clubs" });
    expect(link.getAttribute("href")).toBe("/clubs");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.className).toContain("pp-button");
  });

  it("associates labels, help and errors while preserving supplied descriptions and refs", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Field id="nickname" label="Nickname" help="Visible to your team" error="Required">
      <Input ref={ref} name="nickname" aria-describedby="policy" required />
    </Field>);
    const input = screen.getByRole("textbox", { name: "Nickname" });
    expect(input).toBe(ref.current);
    expect(input.id).toBe("nickname");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("policy nickname-help nickname-error");
    expect(screen.getByRole("alert").id).toBe("nickname-error");
    expect(input.className).toContain("pp-field-invalid");
  });

  it("preserves select and textarea values, events, native form association and refs", () => {
    const selectRef = createRef<HTMLSelectElement>();
    const textareaRef = createRef<HTMLTextAreaElement>();
    const change = vi.fn();
    render(<><Field id="position" label="Position"><Select ref={selectRef} defaultValue="goalie" name="position" form="profile" onChange={change}><option value="skater">Skater</option><option value="goalie">Goalie</option></Select></Field>
      <Field id="bio" label="Bio"><Textarea ref={textareaRef} defaultValue="Hello" rows={4} /></Field></>);
    expect(selectRef.current?.value).toBe("goalie");
    expect(selectRef.current?.getAttribute("form")).toBe("profile");
    fireEvent.change(screen.getByRole("combobox", { name: "Position" }), { target: { value: "skater" } });
    expect(change).toHaveBeenCalledOnce();
    expect(textareaRef.current?.value).toBe("Hello");
    expect(textareaRef.current?.rows).toBe(4);
  });

  it("exposes chip and segmented selection without changing the caller's selection logic", () => {
    const click = vi.fn();
    render(<><FilterChip selected disabled onClick={click}>Today</FilterChip><SegmentedControl label="View"><SegmentedItem selected onClick={click}>List</SegmentedItem><SegmentedItem>Map</SegmentedItem></SegmentedControl></>);
    expect(screen.getByRole("button", { name: "Today" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "View" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "List" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Map" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps domain variants and card/modal recipes explicit", () => {
    expect(buttonStyles({ variant: "cheer", size: "club", fullWidth: true })).toBe("pp-button pp-button-cheer pp-button-club pp-full-width");
    expect(buttonStyles({ variant: "kakao" })).toContain("pp-button-kakao");
    expect(surfaceStyles({ interactive: true, density: "compact" })).toBe("pp-surface pp-surface-compact pp-surface-interactive");
    expect(surfaceStyles({ tone: "muted" })).toContain("pp-surface-muted-content");
    expect(badgeStyles({ tone: "success" })).toBe("pp-badge pp-badge-success");
    expect(overlayStyles({ kind: "sheet" })).toBe("pp-overlay-surface pp-overlay-sheet");
  });
});
