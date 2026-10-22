import { describe, expect, it } from "vitest";
import { inspectUiSource } from "../../scripts/ui-policy";

describe("UI policy AST guard", () => {
  it("allows native contracts, layout and shared appearances", () => {
    expect(inspectUiSource('<><Button type="submit" className="w-full mt-4">Save</Button><input className={fieldStyles()} /><button type="button" className={buttonStyles({size: "compact"})}>Go</button></>')).toEqual([]);
  });
  it("rejects bypasses, visual overrides and direct palette colors", () => {
    const issues = inspectUiSource('<><button className="bg-blue-600">Go</button><Button className="h-8 rounded-full text-lg bg-red-500" /></>');
    expect(issues.map(i => i.rule)).toContain("bypass");
    expect(issues.map(i => i.rule)).toContain("button-type");
    expect(issues.filter(i => i.rule === "override")).toHaveLength(4);
    expect(issues.filter(i => i.rule === "color")).toHaveLength(2);
  });
  it("checks template expressions, variants and join calls", () => {
    const issues = inspectUiSource('<Button className={join(`w-full ${ok ? "dark:bg-zinc-900" : "bg-[#fee500]"}`, "sm:h-12")} />');
    expect(issues.filter(i => i.rule === "color")).toHaveLength(2);
    expect(issues.filter(i => i.rule === "override")).toHaveLength(3);
  });
  it("lets callers own padding only on a density-none surface", () => {
    expect(inspectUiSource('<details className={`${surfaceStyles({ density: "none" })} group px-4 py-3 md:p-5`} />')).toEqual([]);
    expect(inspectUiSource('<div className={`${surfaceStyles({ interactive: true })} flex h-full flex-col`} />')).toEqual([]);
    expect(inspectUiSource('<button type="button" className={buttonStyles() + " h-full"} />').map(i => i.rule)).toEqual(["override"]);
    const issues = inspectUiSource('<><div className={surfaceStyles({ density: "compact" }) + " px-4"} /><div className={`${surfaceStyles({ density: "none" })} px-4 bg-pp-surface rounded-xl`} /></>');
    expect(issues.filter(i => i.rule === "override").map(i => i.message)).toEqual([
      "Choose a component option instead of 'px-4'.",
      "Choose a component option instead of 'bg-pp-surface'.",
      "Choose a component option instead of 'rounded-xl'.",
    ]);
  });
  it("permits narrow provider and artwork exceptions with reasons", () => {
    expect(inspectUiSource('<><input type="hidden" name="id" /><input type="file" /><button type="button" data-ui-exception="provider" className="bg-[#fee500]">Kakao</button></>', { controls: { provider: "Existing provider popup control" }, colors: { "bg-[#fee500]": "Kakao brand" } })).toEqual([]);
  });
  it("limits a legacy branch exception to its named opt-in boundary", () => {
    const source = '<div className={designSystem ? "bg-pp-surface" : "bg-blue-600"} />';
    expect(inspectUiSource(source)).toHaveLength(1);
    expect(inspectUiSource(source, { legacyBranch: { condition: "designSystem", reason: "SEO legacy renderer" } })).toEqual([]);
    expect(inspectUiSource(source, { legacyBranch: { condition: "otherFlag", reason: "Different boundary" } })).toHaveLength(1);
  });
  it("does not scan comments or class-like user text", () => {
    expect(inspectUiSource('/* bg-blue-600 */ const text="bg-red-500"; const node=<p>bg-green-100</p>')).toEqual([]);
  });
  it("rejects semantic color overrides on controls and undocumented exceptions", () => {
    expect(inspectUiSource('<Button className="text-pp-danger" />').some(issue => issue.rule === "override")).toBe(true);
    expect(inspectUiSource('<button type="button" data-ui-exception="unknown" />').some(issue => issue.message.includes("Document exception"))).toBe(true);
  });
});
