import path from "node:path";

import ts from "typescript";

/**
 * Finds the property names that only Runtime source can see, so the build can shorten them.
 *
 * The rename is by name, through esbuild `mangleProps`: one name maps to one short name in the whole
 * build. A name stays unchanged when any of these reach it:
 *
 * - a public export of a Runtime entry, because adapters and users compile against those types;
 * - a declaration outside Runtime source, such as the DOM, Floating UI, or Embla;
 * - a string literal, because code can use it as a key;
 * - a value without a declared property, such as `dataset` or an index signature;
 * - a value that goes to `Object.keys`, `JSON.stringify`, `for...in`, a computed key, or an event
 *   `detail`, because those observe names at run time;
 * - a type in a registry from `shared()`, because another Runtime copy can read it. A private member
 *   stays out of this rule, because only `this.member` reaches one, and that code runs in the copy
 *   that created the controller.
 */

export type InternalPropertyPlan = {
  names: string[];
  reserved: Set<string>;
};

const REFLECTIVE_CALLS = new Set([
  "JSON.stringify",
  "Object.assign",
  "Object.entries",
  "Object.getOwnPropertyNames",
  "Object.keys",
  "Object.values",
  "Reflect.ownKeys",
  "structuredClone",
]);
const EVENT_DETAIL_CALLS = new Set(["dispatchCustomEvent"]);

function memberName(node: ts.Node): string | undefined {
  if (
    (ts.isPropertySignature(node) ||
      ts.isMethodSignature(node) ||
      ts.isPropertyDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)) &&
    ts.isIdentifier(node.name)
  ) {
    return node.name.text;
  }
  return undefined;
}

function isPrivateDeclaration(symbol: ts.Symbol): boolean {
  return (symbol.declarations ?? []).some(
    (declaration) =>
      ts.canHaveModifiers(declaration) &&
      (ts.getModifiers(declaration) ?? []).some((m) => m.kind === ts.SyntaxKind.PrivateKeyword),
  );
}

export function planInternalProperties(
  program: ts.Program,
  isSource: (fileName: string) => boolean,
  isEntry: (fileName: string) => boolean,
): InternalPropertyPlan {
  const checker = program.getTypeChecker();
  const reserved = new Set<string>();
  const candidates = new Set<string>();
  const sourceFiles = program.getSourceFiles();

  const isExternalType = (type: ts.Type): boolean => {
    const symbol = type.getSymbol();
    const declarations = symbol?.declarations;
    return (
      !!symbol &&
      !!(symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) &&
      !!declarations?.length &&
      declarations.some((declaration) => !isSource(declaration.getSourceFile().fileName))
    );
  };

  const walkType = (
    type: ts.Type,
    seen: Set<ts.Type>,
    skipPrivate: boolean,
    at: ts.Node,
    depth = 0,
  ): void => {
    if (seen.has(type) || depth > 16) return;
    seen.add(type);
    const next = (inner: ts.Type) => walkType(inner, seen, skipPrivate, at, depth + 1);
    if (type.isUnionOrIntersection()) {
      type.types.forEach(next);
      return;
    }
    if (
      type.flags & ts.TypeFlags.Object &&
      (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
    ) {
      checker.getTypeArguments(type as ts.TypeReference).forEach(next);
    }
    // Every name on a DOM or dependency type is reserved already, and generics in those types expand
    // without end.
    if (isExternalType(type)) return;
    for (const property of checker.getPropertiesOfType(type)) {
      if (skipPrivate && isPrivateDeclaration(property)) continue;
      reserved.add(property.name);
      next(checker.getTypeOfSymbolAtLocation(property, at));
    }
    for (const signature of [
      ...checker.getSignaturesOfType(type, ts.SignatureKind.Call),
      ...checker.getSignaturesOfType(type, ts.SignatureKind.Construct),
    ]) {
      for (const parameter of signature.parameters) {
        next(checker.getTypeOfSymbolAtLocation(parameter, at));
      }
      next(signature.getReturnType());
    }
    for (const info of checker.getIndexInfosOfType(type)) next(info.type);
    const constraint = checker.getBaseConstraintOfType(type);
    if (constraint && constraint !== type) next(constraint);
  };

  const publicSeen = new Set<ts.Type>();
  const crossCopySeen = new Set<ts.Type>();
  const reflectiveSeen = new Set<ts.Type>();

  for (const file of sourceFiles) {
    if (!isSource(file.fileName)) {
      const visit = (node: ts.Node): void => {
        const name = memberName(node);
        if (name) reserved.add(name);
        ts.forEachChild(node, visit);
      };
      visit(file);
      continue;
    }

    if (isEntry(file.fileName)) {
      const moduleSymbol = checker.getSymbolAtLocation(file);
      for (const exported of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
        reserved.add(exported.name);
        const symbol =
          exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
        if (symbol.flags & ts.SymbolFlags.Type) {
          walkType(checker.getDeclaredTypeOfSymbol(symbol), publicSeen, false, file);
        }
        if (symbol.flags & ts.SymbolFlags.Value) {
          walkType(checker.getTypeOfSymbolAtLocation(symbol, file), publicSeen, false, file);
        }
      }
    }

    const visit = (node: ts.Node): void => {
      const name = memberName(node);
      if (name) candidates.add(name);

      if (ts.isStringLiteralLike(node)) reserved.add(node.text);
      if (ts.isTemplateExpression(node)) {
        reserved.add(node.head.text);
        for (const span of node.templateSpans) reserved.add(span.literal.text);
      }

      if (ts.isPropertyAccessExpression(node) && !checker.getSymbolAtLocation(node.name)) {
        reserved.add(node.name.text);
      }

      if (ts.isElementAccessExpression(node) && !ts.isStringLiteralLike(node.argumentExpression)) {
        const argument = checker.getTypeAtLocation(node.argumentExpression);
        if (!(argument.flags & ts.TypeFlags.NumberLike)) {
          walkType(checker.getTypeAtLocation(node.expression), reflectiveSeen, false, node);
        }
      }

      // A shape that extends a DOM or global value describes a browser API or an expando property.
      if (ts.isIntersectionTypeNode(node)) {
        const parts = node.types.map((part) => checker.getTypeFromTypeNode(part));
        if (parts.some(isExternalType)) {
          for (const part of parts) walkType(part, reflectiveSeen, false, node);
        }
      }

      if (ts.isModuleDeclaration(node) && node.flags & ts.NodeFlags.GlobalAugmentation) {
        const reserve = (inner: ts.Node): void => {
          const innerName = memberName(inner);
          if (innerName) reserved.add(innerName);
          ts.forEachChild(inner, reserve);
        };
        reserve(node);
      }

      if (ts.isForInStatement(node)) {
        walkType(checker.getTypeAtLocation(node.expression), reflectiveSeen, false, node);
      }

      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(file);
        if (REFLECTIVE_CALLS.has(callee) && callee !== "Object.assign") {
          for (const argument of node.arguments) {
            walkType(checker.getTypeAtLocation(argument), reflectiveSeen, false, node);
          }
        }
        if (EVENT_DETAIL_CALLS.has(callee) && node.arguments[2]) {
          walkType(checker.getTypeAtLocation(node.arguments[2]), reflectiveSeen, false, node);
        }
        if (callee === "shared" && node.typeArguments?.[0]) {
          walkType(checker.getTypeFromTypeNode(node.typeArguments[0]), crossCopySeen, true, node);
        }
      }

      if (ts.isNewExpression(node) && node.expression.getText(file).endsWith("CustomEvent")) {
        for (const argument of node.arguments ?? []) {
          walkType(checker.getTypeAtLocation(argument), reflectiveSeen, false, node);
        }
      }

      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  const names = [...candidates].filter((name) => !reserved.has(name) && name.length > 1).sort();
  return { names, reserved };
}

function isRuntimeEntry(sourceRoot: string, fileName: string): boolean {
  const relative = path.relative(sourceRoot, path.normalize(fileName)).split(path.sep).join("/");
  return (
    relative === "index.ts" ||
    relative === "init-starwind.ts" ||
    relative === "theme/theme.ts" ||
    /^components\/[^/]+\/index\.ts$/.test(relative)
  );
}

/** Plans the rename for the Runtime source files that a tsconfig names. */
export function planRuntimeInternalProperties(tsconfigPath: string): InternalPropertyPlan {
  const sourceRoot = path.join(path.dirname(tsconfigPath), "src") + path.sep;
  const isSource = (fileName: string) => path.normalize(fileName).startsWith(sourceRoot);
  const parsed = ts.getParsedCommandLineOfConfigFile(
    tsconfigPath,
    { noEmit: true, types: [] },
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
  );
  if (!parsed) throw new Error(`Could not read ${tsconfigPath}.`);
  const program = ts.createProgram(parsed.fileNames.filter(isSource), parsed.options);
  return planInternalProperties(program, isSource, (fileName) =>
    isRuntimeEntry(sourceRoot, fileName),
  );
}

/** Builds the `mangleProps` pattern for a plan. */
export function internalPropertyPattern(plan: InternalPropertyPlan): RegExp {
  const body = plan.names.map((name) => name.replace(/\$/g, "\\$")).join("|");
  return new RegExp(body ? `^(?:${body})$` : "$^");
}
