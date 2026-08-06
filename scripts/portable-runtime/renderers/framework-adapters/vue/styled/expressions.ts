import type { StyledOutputValueExpression } from "../../../styled-output-model/index.js";
import ts from "typescript";

import { renderVuePropKey } from "./props.js";

export type VueExpressionReference = {
  name: string;
  nonNullable?: boolean;
  unwrap?: boolean;
};

export type VueComputedExpression =
  | { code: string; references?: readonly string[]; type: "source" }
  | { parts: Array<string | VueExpressionReference>; type: "parts" }
  | { type: "shared"; value: StyledOutputValueExpression };

export type VueExpressionBindings = {
  computed: readonly string[];
  props: ReadonlyArray<{ sourceName: string; targetName: string }>;
};

export function projectVueComputedExpression(
  value: StyledOutputValueExpression,
  bindings?: VueExpressionBindings,
): VueComputedExpression {
  if (value.type === "object") {
    const keys = Object.keys(value.entries);
    if (keys.join(",") === '"--padding","--height","--width","--border-offset"') {
      return parts(
        '({ "--padding": `${',
        ref("resolvedPadding"),
        '}px`, "--height": `calc((var(--spacing) * ${',
        ref("sizeMultiplier"),
        '}) + (var(--padding) * 2))`, "--width": `calc((var(--spacing) * ${',
        ref("sizeMultiplier"),
        '} * 2) + (var(--padding) * 3))`, "--border-offset": "1px" })',
      );
    }
    if (keys.join(",") === '"--translation"') {
      return parts(
        '({ "--translation": `calc((var(--spacing) * ${',
        ref("sizeMultiplier"),
        "}) + (var(--padding) * 2) - var(--border-offset))` })",
      );
    }
  }
  if (value.type !== "raw") return { type: "shared", value };

  switch (value.code) {
    case 'rest["aria-label"] ?? label':
      return parts({ name: "attrs", unwrap: false }, '["aria-label"] ?? label');
    case 'rest["aria-label"] ?? label ?? "switch"':
      return parts({ name: "attrs", unwrap: false }, '["aria-label"] ?? label ?? "switch"');
    case 'rest["id"]':
      return parts({ name: "attrs", unwrap: false }, '["id"]');
    case "Number.isFinite(min) ? min : 0":
    case "Number.isFinite(max) ? max : 100":
    case "className":
    case "pressed ?? defaultPressed ?? false":
    case 'padding ?? (size === "sm" ? 2.5 : size === "lg" ? 4 : 3)':
    case 'size === "sm" ? 4 : size === "lg" ? 6 : 5':
    case '({ "--sidebar-width": "18rem" })':
      return { type: "source", code: value.code };
    case '[{ "--sidebar-width": "18rem", "--sidebar-width-icon": "3.5rem" }, style]':
      return parts(
        '[{ "--sidebar-width": "18rem", "--sidebar-width-icon": "3.5rem" }, ',
        { name: "style", unwrap: false },
        "]",
      );
    case '({ "--skeleton-width": skeletonWidth })':
      return parts('({ "--skeleton-width": ', ref("skeletonWidth"), " })");
    case 'width ?? "70%"':
      return parts({ name: "width", unwrap: false }, ' ?? "70%"');
    case 'asChild ? "div" : href ? "a" : "button"':
      return parts(
        { name: "asChild", unwrap: false },
        ' ? "div" : ',
        { name: "href", unwrap: false },
        ' ? "a" : "button"',
      );
    case 'format ?? formats[0] ?? "hex"':
      return parts(
        { name: "format", unwrap: false },
        " ?? ",
        { name: "formats", unwrap: false },
        '[0] ?? "hex"',
      );
    case "Array.from(new Set(formats))":
      return parts("Array.from(new Set(", { name: "formats", unwrap: false }, "))");
    case "requestedFormats.includes(resolvedFormat) ? requestedFormats : [resolvedFormat, ...requestedFormats]":
      return parts(
        ref("requestedFormats"),
        ".includes(",
        ref("resolvedFormat"),
        ") ? ",
        ref("requestedFormats"),
        " : [",
        ref("resolvedFormat"),
        ", ...",
        ref("requestedFormats"),
        "]",
      );
    case 'swatches.map((swatch) => typeof swatch === "object" && swatch !== null && "value" in swatch ? swatch : { value: swatch, label: String(swatch) })':
      return parts(
        { name: "swatches", unwrap: false },
        '.map((swatch) => typeof swatch === "object" && swatch !== null && "value" in swatch ? swatch : { value: swatch, label: String(swatch) })',
      );
    case 'normalizedSwatches.length > 0 ? "true" : "false"':
      return parts(ref("normalizedSwatches"), '.length > 0 ? "true" : "false"');
    case '[{ "--gap": gap, "--peek": peek }, style]':
      return parts(
        '[{ "--gap": ',
        { name: "gap", unwrap: false },
        ', "--peek": ',
        { name: "peek", unwrap: false },
        " }, ",
        { name: "style", unwrap: false },
        "]",
      );
    case "asChild ? className : triggerBaseClassName":
      return parts("asChild ? className : ", ref("triggerBaseClassName"));
    case "value ?? defaultValue":
      return parts({ name: "modelValue", unwrap: false }, " ?? defaultValue");
    case "Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue]":
      return parts(
        "Array.isArray(",
        ref("resolvedValue"),
        ") ? ",
        ref("resolvedValue"),
        " : [",
        ref("resolvedValue"),
        "]",
      );
    case "(item: number) => (max === min ? 0 : ((item - min) / (max - min)) * 100)":
      return parts("(item: number) => (max === min ? 0 : ((item - min) / (max - min)) * 100)");
    case "values.length > 1 ? getPercentage(Math.min(...values)) : 0":
      return parts(
        ref("values"),
        ".length > 1 ? ",
        ref("getPercentage"),
        "(Math.min(...",
        ref("values"),
        ")) : 0",
      );
    case "values.length > 1 ? getPercentage(Math.max(...values)) : getPercentage(values[0] ?? min)":
      return parts(
        ref("values"),
        ".length > 1 ? ",
        ref("getPercentage"),
        "(Math.max(...",
        ref("values"),
        ")) : ",
        ref("getPercentage"),
        "(",
        ref("values"),
        "[0] ?? min)",
      );
    case 'orientation === "horizontal" ? { left: `${rangeStart}%`, width: `${rangeEnd - rangeStart}%` } : { bottom: `${rangeStart}%`, height: `${rangeEnd - rangeStart}%` }':
      return parts(
        'orientation === "horizontal" ? { left: `${',
        ref("rangeStart"),
        "}%`, width: `${",
        ref("rangeEnd"),
        " - ",
        ref("rangeStart"),
        "}%` } : { bottom: `${",
        ref("rangeStart"),
        "}%`, height: `${",
        ref("rangeEnd"),
        " - ",
        ref("rangeStart"),
        "}%` }",
      );
    case 'typeof style === "string" ? `--gap: ${spacing}; ${style}` : { "--gap": spacing, ...(style ?? {}) }':
      return parts(
        "typeof ",
        { name: "style", unwrap: false },
        ' === "string" ? `--gap: ${',
        { name: "spacing", unwrap: false },
        "}; ${",
        { name: "style", unwrap: false },
        '}` : { "--gap": ',
        { name: "spacing", unwrap: false },
        ", ...(",
        { name: "style", unwrap: false },
        " ?? {}) }",
      );
    case "Math.min(boundedMin, boundedMax)":
      return parts("Math.min(", ref("boundedMin"), ", ", ref("boundedMax"), ")");
    case "Math.max(boundedMin, boundedMax)":
      return parts("Math.max(", ref("boundedMin"), ", ", ref("boundedMax"), ")");
    case "value == null || !Number.isFinite(Number(value)) ? null : Math.min(Math.max(Number(value), normalizedMin), normalizedMax)":
      return parts(
        "value == null || !Number.isFinite(Number(value)) ? null : Math.min(Math.max(Number(value), ",
        ref("normalizedMin"),
        "), ",
        ref("normalizedMax"),
        ")",
      );
    case "progressValue === null":
      return parts(ref("progressValue"), " === null");
    case "isIndeterminate ? 0 : normalizedMax === normalizedMin ? progressValue >= normalizedMax ? 100 : 0 : Math.round(Math.min(Math.max(((progressValue - normalizedMin) / (normalizedMax - normalizedMin)) * 100, 0), 100))":
      return parts(
        ref("isIndeterminate"),
        " ? 0 : ",
        ref("normalizedMax"),
        " === ",
        ref("normalizedMin"),
        " ? ",
        ref("progressValue", true),
        " >= ",
        ref("normalizedMax"),
        " ? 100 : 0 : Math.round(Math.min(Math.max(((",
        ref("progressValue", true),
        " - ",
        ref("normalizedMin"),
        ") / (",
        ref("normalizedMax"),
        " - ",
        ref("normalizedMin"),
        ")) * 100, 0), 100))",
      );
    case "isIndeterminate ? undefined : { transform: `translateX(-${100 - progressPercent}%)` }":
      return parts(
        ref("isIndeterminate"),
        " ? undefined : { transform: `translateX(-${100 - ",
        ref("progressPercent"),
        "}%)` }",
      );
    default:
      if (bindings) {
        return { ...projectBindingAwareRawExpression(value.code, bindings), type: "source" };
      }
      throw new Error(
        `Unsupported Vue computed raw expression ${JSON.stringify(value.code)}. Add an explicit target-local expression projection instead of rewriting source identifiers.`,
      );
  }
}

function projectBindingAwareRawExpression(
  code: string,
  bindings: VueExpressionBindings,
): { code: string; references: readonly string[] } {
  const wrapped = `(${code})`;
  const sourceFile = ts.createSourceFile(
    "vue-styled-expression.ts",
    wrapped,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const statement = sourceFile.statements[0];
  if (!statement || !ts.isExpressionStatement(statement)) {
    throw new TypeError(`Invalid Vue Styled computed expression ${JSON.stringify(code)}.`);
  }
  const rootExpression = ts.isParenthesizedExpression(statement.expression)
    ? statement.expression.expression
    : statement.expression;
  const requiresGrouping = startsWithUngroupedObjectLiteral(rootExpression);

  const propBindings = new Map(
    bindings.props.map(({ sourceName, targetName }) => [sourceName, targetName]),
  );
  const computedBindings = new Set(bindings.computed);
  const safeGlobals = new Set([
    "Array",
    "BigInt",
    "Boolean",
    "Date",
    "Infinity",
    "JSON",
    "Map",
    "Math",
    "NaN",
    "Number",
    "Object",
    "Promise",
    "RegExp",
    "Set",
    "String",
    "Symbol",
    "URL",
    "URLSearchParams",
    "undefined",
  ]);
  const replacements: Array<{ end: number; start: number; value: string }> = [];
  const references = new Set<string>();
  const unresolved = new Set<string>();

  visit(statement.expression, new Set());
  if (unresolved.size) {
    throw new TypeError(
      `Unresolved Vue Styled computed binding${unresolved.size === 1 ? "" : "s"} ${[
        ...unresolved,
      ].join(
        ", ",
      )} in ${JSON.stringify(code)}. Declare each value as a prop, an earlier computed variable, a local expression binding, or a safe global.`,
    );
  }

  let projected = code;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    projected = `${projected.slice(0, replacement.start)}${replacement.value}${projected.slice(
      replacement.end,
    )}`;
  }
  return {
    code: requiresGrouping ? `(${projected})` : projected,
    references: [...references].sort(),
  };

  function visit(node: ts.Node, localBindings: ReadonlySet<string>): void {
    if (isRuntimeFunctionLike(node)) {
      const nestedBindings = new Set(localBindings);
      if (node.name && ts.isIdentifier(node.name)) {
        nestedBindings.add(node.name.text);
      }
      for (const parameter of node.parameters) {
        collectBindingName(parameter.name, nestedBindings);
      }
      collectFunctionScopedBindings(node, nestedBindings);
      ts.forEachChild(node, (child) => visit(child, nestedBindings));
      return;
    }
    if (ts.isCatchClause(node)) {
      const nestedBindings = new Set(localBindings);
      collectBindingName(node.variableDeclaration?.name, nestedBindings);
      ts.forEachChild(node, (child) => visit(child, nestedBindings));
      return;
    }
    if (ts.isClassStaticBlockDeclaration(node)) {
      const nestedBindings = new Set(localBindings);
      collectVarScopedBindings(node.body, nestedBindings);
      ts.forEachChild(node, (child) => visit(child, nestedBindings));
      return;
    }
    if (ts.isBlock(node) || ts.isCaseBlock(node)) {
      const nestedBindings = new Set(localBindings);
      collectBlockScopedBindings(node, nestedBindings);
      ts.forEachChild(node, (child) => visit(child, nestedBindings));
      return;
    }
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      const nestedBindings = new Set(localBindings);
      collectLoopScopedBindings(node, nestedBindings);
      ts.forEachChild(node, (child) => visit(child, nestedBindings));
      return;
    }
    if (ts.isIdentifier(node) && isExpressionReference(node)) {
      const name = node.text;
      const start = node.getStart(sourceFile) - 1;
      const end = node.getEnd() - 1;
      const propTarget = propBindings.get(name);
      if (localBindings.has(name)) {
        // The nearest expression-local binding owns this identifier.
      } else if (propTarget) {
        replacements.push({
          end,
          start,
          value: preserveShorthandKey(node, name, propTarget),
        });
        references.add(propTarget);
      } else if (computedBindings.has(name)) {
        const alreadyUnwrapped =
          ts.isPropertyAccessExpression(node.parent) &&
          node.parent.expression === node &&
          node.parent.name.text === "value";
        const value = alreadyUnwrapped ? name : `${name}.value`;
        replacements.push({ end, start, value: preserveShorthandKey(node, name, value) });
        references.add(name);
      } else if (!safeGlobals.has(name)) {
        unresolved.add(name);
      }
    }
    ts.forEachChild(node, (child) => visit(child, localBindings));
  }
}

function startsWithUngroupedObjectLiteral(expression: ts.Expression): boolean {
  if (ts.isObjectLiteralExpression(expression)) return true;
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return startsWithUngroupedObjectLiteral(expression.expression);
  }
  return false;
}

function collectFunctionScopedBindings(
  node: ts.FunctionLikeDeclaration,
  bindings: Set<string>,
): void {
  if (!node.body) return;
  collectVarScopedBindings(node.body, bindings);
}

function collectVarScopedBindings(body: ts.Node, bindings: Set<string>): void {
  visit(body);

  function visit(candidate: ts.Node): void {
    if (
      candidate !== body &&
      (isRuntimeFunctionLike(candidate) || ts.isClassStaticBlockDeclaration(candidate))
    ) {
      return;
    }
    if (
      ts.isVariableDeclaration(candidate) &&
      ts.isVariableDeclarationList(candidate.parent) &&
      !(candidate.parent.flags & ts.NodeFlags.BlockScoped)
    ) {
      collectBindingName(candidate.name, bindings);
    }
    ts.forEachChild(candidate, visit);
  }
}

function collectBlockScopedBindings(node: ts.Block | ts.CaseBlock, bindings: Set<string>): void {
  const statements = ts.isBlock(node)
    ? node.statements
    : node.clauses.flatMap((clause) => [...clause.statements]);
  for (const statement of statements) {
    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.flags & ts.NodeFlags.BlockScoped
    ) {
      for (const declaration of statement.declarationList.declarations) {
        collectBindingName(declaration.name, bindings);
      }
    }
    if (ts.isClassDeclaration(statement)) collectBindingName(statement.name, bindings);
    if (ts.isFunctionDeclaration(statement)) collectBindingName(statement.name, bindings);
  }
}

function collectLoopScopedBindings(
  node: ts.ForStatement | ts.ForInStatement | ts.ForOfStatement,
  bindings: Set<string>,
): void {
  const initializer = node.initializer;
  if (!initializer || !ts.isVariableDeclarationList(initializer)) return;
  if (!(initializer.flags & ts.NodeFlags.BlockScoped)) return;
  for (const declaration of initializer.declarations) {
    collectBindingName(declaration.name, bindings);
  }
}

function isRuntimeFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return ts.isFunctionLike(node) && "body" in node;
}

function preserveShorthandKey(node: ts.Identifier, sourceName: string, value: string): string {
  return ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
    ? value === sourceName
      ? sourceName
      : `${sourceName}: ${value}`
    : value;
}

function collectBindingName(name: ts.BindingName | undefined, bindings: Set<string>): void {
  if (!name) return;
  if (ts.isIdentifier(name)) {
    bindings.add(name.text);
    return;
  }
  for (const element of name.elements) {
    if (ts.isBindingElement(element)) collectBindingName(element.name, bindings);
  }
}

function isExpressionReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isMethodDeclaration(parent) && parent.name === node) ||
    (ts.isPropertySignature(parent) && parent.name === node) ||
    (ts.isTypeReferenceNode(parent) && parent.typeName === node) ||
    (ts.isTypeQueryNode(parent) && parent.exprName === node) ||
    (ts.isParameter(parent) && parent.name === node) ||
    (ts.isVariableDeclaration(parent) && parent.name === node) ||
    (ts.isBindingElement(parent) && parent.name === node)
  ) {
    return false;
  }
  return !isInsideTypeNode(node);
}

function isInsideTypeNode(node: ts.Node): boolean {
  let current = node.parent;
  while (current) {
    if (ts.isTypeNode(current)) return true;
    if (ts.isExpression(current) || ts.isStatement(current)) return false;
    current = current.parent;
  }
  return false;
}

export function renderVueComputedExpression(expression: VueComputedExpression): string {
  switch (expression.type) {
    case "source":
      return expression.code;
    case "shared":
      return renderVueExpression(expression.value);
    case "parts":
      return expression.parts
        .map((part) =>
          typeof part === "string"
            ? part
            : `${part.name}${part.unwrap === false ? "" : ".value"}${part.nonNullable ? "!" : ""}`,
        )
        .join("");
  }
}

export function computedExpressionUsesReference(
  expression: VueComputedExpression,
  name: string,
): boolean {
  if (expression.type === "source") return expression.references?.includes(name) ?? false;
  return expression.type === "parts"
    ? expression.parts.some((part) => typeof part !== "string" && part.name === name)
    : false;
}

export function renderVueExpression(value: StyledOutputValueExpression): string {
  switch (value.type) {
    case "class-join":
      return `[${value.items.map(renderVueExpression).join(", ")}].filter(Boolean).join(" ")`;
    case "class-variant":
      return `${value.variant}(${renderVariantArgs(value.args)})`;
    case "literal":
      return JSON.stringify(value.value);
    case "object":
      return `{ ${Object.entries(value.entries)
        .map(([key, entry]) => `${renderVuePropKey(key)}: ${renderVueExpression(entry)}`)
        .join(", ")} }`;
    case "raw":
      return value.code;
    case "template":
      return `\`${value.parts
        .map((part) => (typeof part === "string" ? part : `\${${renderVueExpression(part)}}`))
        .join("")}\``;
    case "variable":
      return value.name;
  }
}

function ref(name: string, nonNullable = false): VueExpressionReference {
  return { name, nonNullable };
}

function parts(...expressionParts: Array<string | VueExpressionReference>): VueComputedExpression {
  return { type: "parts", parts: expressionParts };
}

function renderVariantArgs(args: Record<string, string> | undefined): string {
  if (!args || !Object.keys(args).length) return "";
  return `{ ${Object.entries(args)
    .map(([key, value]) => (key === value ? value : `${key}: ${value}`))
    .join(", ")} }`;
}
