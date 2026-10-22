import ts from "typescript";

export type PolicyIssue = { line: number; rule: "bypass" | "override" | "color" | "button-type"; message: string };
export type UiExceptions = { controls?: Record<string, string>; colors?: Record<string, string>; artwork?: Record<string, string>; legacyBranch?: { condition: string; reason: string } };
const shared = new Set(["Button", "IconButton", "LinkButton", "Input", "Select", "Textarea", "FilterChip", "SegmentedItem", "Badge", "Surface", "ModalSurface", "SheetSurface"]);
const native = new Set(["button", "input", "select", "textarea"]);
const recipe = /(?:linkStyles|iconButtonStyles|buttonStyles|fieldStyles|filterChipStyles|segmentedItemStyles|badgeStyles|surfaceStyles|overlayStyles|clubDetailActionButtonClass)/;
const visual = /^(?:(?:hover|focus|focus-visible|disabled|dark|sm|md|lg|active):)*(?:bg-|text-(?!(?:left|right|center|start|end|justify|ellipsis|wrap|nowrap|balance|pretty)$)|pp-text-|font-|rounded|shadow|ring-|border(?:-|$)|h-|min-h-|p[xytrblse]?-[\d[])/;
const rawColor = /(?:^|:)(?:bg|text|border|ring|shadow|from|via|to|outline|accent|fill|stroke)-(?:\[#[^\]]+\]|(?:zinc|slate|gray|neutral|stone|blue|indigo|violet|purple|pink|rose|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky)-\d+)(?:\/\S+)?$/;

/** Walk actual JSX attributes and their class expressions, never comments or arbitrary source text. */
export function inspectUiSource(source: string, exceptions: UiExceptions = {}): PolicyIssue[] {
  const file = ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues: PolicyIssue[] = [];
  function strings(node: ts.Node): string[] {
    if (ts.isConditionalExpression(node) && exceptions.legacyBranch?.reason && node.condition.getText(file) === exceptions.legacyBranch.condition) return strings(node.whenTrue);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) return node.text.split(/\s+/).filter(Boolean);
    const result: string[] = [];
    ts.forEachChild(node, child => { result.push(...strings(child)); });
    return result;
  }
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node)) {
      const artwork = node.openingElement.attributes.properties.filter(ts.isJsxAttribute).find(a => a.name.getText(file) === "data-ui-artwork");
      if (artwork?.initializer && ts.isStringLiteral(artwork.initializer) && exceptions.artwork?.[artwork.initializer.text]) return;
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(file);
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
      const attr = (name: string) => attributes.find(a => a.name.getText(file) === name);
      const classAttr = attr("className");
      const classes = classAttr ? strings(classAttr.initializer!) : [];
      const expression = classAttr?.initializer?.getText(file) || "";
      const isRecipe = recipe.test(expression);
      const exceptionId = attr("data-ui-exception")?.initializer?.getText(file).replaceAll('"', "").replaceAll("'", "");
      const controlException = exceptionId && exceptions.controls?.[exceptionId];
      const type = attr("type")?.initializer?.getText(file).replaceAll('"', "").replaceAll("'", "");
      const specialInput = tag === "input" && ["hidden", "file", "checkbox", "radio", "range", "color"].includes(type || "");
      const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
      const add = (rule: PolicyIssue["rule"], message: string) => issues.push({ line, rule, message });
      if (exceptionId && !controlException) add("bypass", `Document exception '${exceptionId}' with a reason.`);
      if (tag === "button" && !attr("type")) add("button-type", "Declare button type explicitly.");
      if (native.has(tag) && !specialInput && !isRecipe && !controlException) add("bypass", `Use a shared ${tag} or appearance recipe.`);
      if ((shared.has(tag) || isRecipe) && !controlException) {
        const overlay = expression.includes("overlayStyles") || ["ModalSurface", "SheetSurface"].includes(tag);
        // density "none" means the caller owns the surface padding, so padding utilities are layout there.
        const callerPadding = /surfaceStyles\(\s*\{[^}]*density:\s*["']none["']/.test(expression) || (tag === "Surface" && /density=["']none["']/.test(node.getText(file)));
        // A surface may stretch to its grid/flex cell (h-full) so cards in a row share one height.
        const surface = expression.includes("surfaceStyles") || tag === "Surface";
        const allowed = (c: string) => (overlay && /(?:^|:)(?:h-|min-h-)/.test(c)) || (callerPadding && /^(?:(?:sm|md|lg):)*p[xytrblse]?-[\d[]/.test(c)) || (surface && c === "h-full");
        for (const token of classes.filter(c => visual.test(c) && !allowed(c))) add("override", `Choose a component option instead of '${token}'.`);
      }
      for (const token of classes.filter(c => rawColor.test(c))) {
        if (!exceptions.colors?.[token]) add("color", `Use a semantic token or document '${token}'.`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return issues;
}
