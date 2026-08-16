import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

type Messages = Record<string, unknown>;

function flattenMessages(
  value: Messages,
  prefix = "",
  keys = new Set<string>()
): Set<string> {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenMessages(child as Messages, path, keys);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  return ts.isAwaitExpression(expression)
    ? unwrapExpression(expression.expression)
    : expression;
}

function getTranslatorNamespace(expression: ts.Expression): string | null | undefined {
  const unwrapped = unwrapExpression(expression);
  if (!ts.isCallExpression(unwrapped) || !ts.isIdentifier(unwrapped.expression)) {
    return undefined;
  }
  if (!["useTranslations", "getTranslations"].includes(unwrapped.expression.text)) {
    return undefined;
  }

  const argument = unwrapped.arguments[0];
  if (!argument) return "";
  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    return argument.text;
  }
  if (ts.isObjectLiteralExpression(argument)) {
    const namespaceProperty = argument.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) &&
        ((ts.isIdentifier(property.name) && property.name.text === "namespace") ||
          (ts.isStringLiteral(property.name) && property.name.text === "namespace"))
    );
    if (
      namespaceProperty &&
      (ts.isStringLiteral(namespaceProperty.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(namespaceProperty.initializer))
    ) {
      return namespaceProperty.initializer.text;
    }
  }
  return null;
}

function getStaticTranslationKey(call: ts.CallExpression): {
  translator: string;
  key: string;
} | null {
  let translator: string | null = null;
  if (ts.isIdentifier(call.expression)) {
    translator = call.expression.text;
  } else if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.expression) &&
    ["rich", "raw", "markup", "has"].includes(call.expression.name.text)
  ) {
    translator = call.expression.expression.text;
  }
  if (!translator) return null;

  const argument = call.arguments[0];
  if (!argument) return null;
  if (!ts.isStringLiteral(argument) && !ts.isNoSubstitutionTemplateLiteral(argument)) {
    return null;
  }
  return { translator, key: argument.text };
}

function collectMissingStaticKeys(messageKeys: Set<string>): string[] {
  const sourceRoot = join(process.cwd(), "src");
  const missing: string[] = [];

  for (const filePath of listSourceFiles(sourceRoot)) {
    const sourceFile = ts.createSourceFile(
      filePath,
      readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const translators = new Map<string, Set<string>>();

    const collectTranslators = (node: ts.Node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer
      ) {
        const namespace = getTranslatorNamespace(node.initializer);
        if (namespace !== undefined && namespace !== null) {
          const namespaces = translators.get(node.name.text) || new Set<string>();
          namespaces.add(namespace);
          translators.set(node.name.text, namespaces);
        }
      }
      ts.forEachChild(node, collectTranslators);
    };
    collectTranslators(sourceFile);

    const inspectCalls = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const translation = getStaticTranslationKey(node);
        const namespaces = translation ? translators.get(translation.translator) : undefined;
        if (translation && namespaces?.size === 1) {
          const namespace = [...namespaces][0];
          const fullKey = namespace ? `${namespace}.${translation.key}` : translation.key;
          if (!messageKeys.has(fullKey)) {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            missing.push(`${relative(process.cwd(), filePath)}:${line} -> ${fullKey}`);
          }
        }
      }
      ts.forEachChild(node, inspectCalls);
    };
    inspectCalls(sourceFile);
  }

  return missing.sort();
}

describe("i18n messages", () => {
  const ko = flattenMessages(
    JSON.parse(readFileSync(join(process.cwd(), "messages/ko.json"), "utf8"))
  );
  const en = flattenMessages(
    JSON.parse(readFileSync(join(process.cwd(), "messages/en.json"), "utf8"))
  );

  it("keeps Korean and English message keys in sync", () => {
    expect([...ko].filter((key) => !en.has(key))).toEqual([]);
    expect([...en].filter((key) => !ko.has(key))).toEqual([]);
  });

  it("resolves statically declared translation calls", () => {
    expect(collectMissingStaticKeys(ko)).toEqual([]);
    expect(collectMissingStaticKeys(en)).toEqual([]);
  });
});
