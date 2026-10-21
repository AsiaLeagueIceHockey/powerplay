import ts from "typescript";
import { createHash } from "node:crypto";

export const uiHash = (value: string) => createHash("sha256").update(value).digest("hex");

/** Compare render-source artwork without executing exports or reading user data. */
export function artworkHashes(source: string) {
  const file = ts.createSourceFile("artwork.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const printer = ts.createPrinter({ removeComments: true });
  const hashes: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(file) === "ref" && /cardRef|slideRefs/.test(attribute.getText(file)))) {
      const printed = printer.printNode(ts.EmitHint.Unspecified, node, file)
        .replace(/\s+data-ui-artwork="export-canvas"/g, "")
        .replace(/\bconst\b/g, "let");
      // JSX compilation removes formatting-only whitespace exactly as the renderer does.
      const compiled = ts.transpileModule(`const Artwork = () => (${printed});`, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.ESNext, removeComments: true },
      }).outputText;
      hashes.push(uiHash(compiled));
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return hashes;
}

export function legacyClassHash(source: string) {
  const file = ts.createSourceFile("about.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const classes: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && node.name.getText(file) === "className" && node.initializer) {
      let expression: ts.Node = node.initializer;
      if (ts.isJsxExpression(expression) && expression.expression && ts.isConditionalExpression(expression.expression) && expression.expression.condition.getText(file) === "designSystem") expression = expression.expression.whenFalse;
      classes.push(expression.getText(file));
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return uiHash(JSON.stringify(classes));
}
