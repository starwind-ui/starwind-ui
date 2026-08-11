import { parse } from "@babel/parser";

export type SourceRange = { end: number; start: number };

export type AstNode = {
  end: number | null;
  start: number | null;
  type: string;
};

export type AstIdentifier = AstNode & {
  extra?: { parenthesized?: boolean };
  name: string;
  type: "Identifier";
};
export type AstStringLiteral = AstNode & { type: "StringLiteral"; value: string };
export type AstBooleanLiteral = AstNode & { type: "BooleanLiteral"; value: boolean };
export type AstCallExpression = AstNode & {
  arguments: AstNode[];
  callee: AstNode;
  type: "CallExpression";
};
type AstImportSpecifier = AstNode & {
  importKind?: "type" | "value" | null;
  imported: AstIdentifier | AstStringLiteral;
  local: AstIdentifier;
  type: "ImportSpecifier";
};
type AstImportDeclaration = AstNode & {
  importKind?: "type" | "value";
  source: AstStringLiteral;
  specifiers: Array<
    | (AstNode & {
        importKind?: "type" | "value" | null;
        local: AstIdentifier;
        type: "ImportDefaultSpecifier";
      })
    | (AstNode & {
        importKind?: "type" | "value" | null;
        local: AstIdentifier;
        type: "ImportNamespaceSpecifier";
      })
    | AstImportSpecifier
  >;
  type: "ImportDeclaration";
};
export type AstObjectProperty = AstNode & {
  computed: boolean;
  key: AstNode;
  shorthand: boolean;
  type: "ObjectProperty";
  value: AstNode;
};
export type AstObjectExpression = AstNode & {
  properties: AstNode[];
  type: "ObjectExpression";
};
export type AstArrayExpression = AstNode & {
  elements: Array<AstNode | null>;
  type: "ArrayExpression";
};
export type AstArrowFunctionExpression = AstNode & {
  async: boolean;
  body: AstNode;
  params: AstNode[];
  type: "ArrowFunctionExpression";
};

export type ParsedSourceModule = {
  body: AstNode[];
  hasRegularExpression: boolean;
  source: string;
};

export type AstPropertyResult =
  | { status: "found"; property: AstObjectProperty; value: AstNode }
  | { status: "missing" }
  | { status: "unsafe" };

export type ImportBindingResult =
  | { status: "found"; localName: string }
  | { status: "missing" }
  | { status: "unsafe" };

export function parseSourceModule(source: string): ParsedSourceModule | undefined {
  try {
    const file = parse(source, {
      plugins: ["typescript"],
      sourceType: "module",
    }) as unknown as { program: { body: AstNode[] } };
    return {
      body: file.program.body,
      hasRegularExpression: hasAstNodeType(file.program, "RegExpLiteral"),
      source,
    };
  } catch {
    return undefined;
  }
}

export function getAstNodeRange(node: AstNode): SourceRange | undefined {
  if (!Number.isInteger(node.start) || !Number.isInteger(node.end)) return undefined;
  if (node.start === null || node.end === null || node.end <= node.start) return undefined;
  return { end: node.end, start: node.start };
}

export function getAstDefaultExportCall(
  module: ParsedSourceModule,
  callName: string,
): AstCallExpression | undefined {
  const exports = module.body.filter((node) => node.type === "ExportDefaultDeclaration") as Array<
    AstNode & { declaration: AstNode }
  >;
  if (exports.length !== 1) return undefined;
  const declaration = exports[0]!.declaration as AstCallExpression;
  if (declaration.type !== "CallExpression") return undefined;
  const callee = declaration.callee as AstIdentifier;
  const range = getAstNodeRange(callee);
  return callee.type === "Identifier" &&
    callee.name === callName &&
    !callee.extra?.parenthesized &&
    range &&
    module.source.slice(range.start, range.end) === callName
    ? declaration
    : undefined;
}

export function getAstDefaultExportCallObject(
  module: ParsedSourceModule,
  callName: string,
): AstObjectExpression | undefined {
  const call = getAstDefaultExportCall(module, callName);
  if (!call || call.arguments.length !== 1) return undefined;
  const object = asAstObjectExpression(call.arguments[0]!);
  return object && !hasUnsafeAstObjectShape(object) ? object : undefined;
}

export function getAstDefaultExportRange(module: ParsedSourceModule): SourceRange | undefined {
  const exports = module.body.filter((node) => node.type === "ExportDefaultDeclaration");
  return exports.length === 1 ? getAstNodeRange(exports[0]!) : undefined;
}

export function getAstObjectProperty(
  object: AstObjectExpression,
  name: string,
  options: { allowStringKey?: boolean } = {},
): AstPropertyResult {
  let match: AstObjectProperty | undefined;
  for (const member of object.properties) {
    if (member.type === "SpreadElement") return { status: "unsafe" };
    if (member.type !== "ObjectProperty") {
      const method = member as AstNode & { computed?: boolean; key?: AstNode };
      if (method.computed) return { status: "unsafe" };
      if (method.key && getAstPropertyKeyName(method.key) === name) return { status: "unsafe" };
      continue;
    }
    const property = member as AstObjectProperty;
    if (property.computed) return { status: "unsafe" };
    if (getAstPropertyKeyName(property.key) !== name) continue;
    if (property.key.type === "StringLiteral" && !options.allowStringKey) {
      return { status: "unsafe" };
    }
    if (property.shorthand || match) return { status: "unsafe" };
    match = property;
  }
  return match ? { status: "found", property: match, value: match.value } : { status: "missing" };
}

export function hasAstObjectProperty(
  object: AstObjectExpression,
  name: string,
  options: { allowStringKey?: boolean } = {},
): boolean {
  return getAstObjectProperty(object, name, options).status !== "missing";
}

export function hasAstEscapedObjectKey(
  module: ParsedSourceModule,
  object: AstObjectExpression,
): boolean {
  return object.properties.some((member) => {
    if (member.type !== "ObjectProperty") return false;
    const key = (member as AstObjectProperty).key;
    const range = getAstNodeRange(key);
    return Boolean(range && module.source.slice(range.start, range.end).includes("\\"));
  });
}

export function hasOnlyAstBareObjectKeys(
  module: ParsedSourceModule,
  object: AstObjectExpression,
): boolean {
  return object.properties.every((member) => {
    if (member.type !== "ObjectProperty") return false;
    const property = member as AstObjectProperty;
    const range = getAstNodeRange(property.key);
    return (
      !property.computed &&
      property.key.type === "Identifier" &&
      Boolean(range) &&
      !module.source.slice(range!.start, range!.end).includes("\\")
    );
  });
}

export function asAstObjectExpression(node: AstNode): AstObjectExpression | undefined {
  return node.type === "ObjectExpression" && getAstNodeRange(node)
    ? (node as AstObjectExpression)
    : undefined;
}

export function asAstArrayExpression(node: AstNode): AstArrayExpression | undefined {
  return node.type === "ArrayExpression" && getAstNodeRange(node)
    ? (node as AstArrayExpression)
    : undefined;
}

export function asAstArrowFunctionExpression(
  node: AstNode,
): AstArrowFunctionExpression | undefined {
  return node.type === "ArrowFunctionExpression" ? (node as AstArrowFunctionExpression) : undefined;
}

export function getAstStringValue(node: AstNode): string | undefined {
  return node.type === "StringLiteral" ? (node as AstStringLiteral).value : undefined;
}

export function getAstIdentifierName(node: AstNode): string | undefined {
  return node.type === "Identifier" ? (node as AstIdentifier).name : undefined;
}

export function getAstBooleanValue(node: AstNode): boolean | undefined {
  return node.type === "BooleanLiteral" ? (node as AstBooleanLiteral).value : undefined;
}

export function getAstDirectCall(
  array: AstArrayExpression,
  name: string,
): AstCallExpression | undefined {
  const matches = array.elements.filter((element) => {
    if (element?.type !== "CallExpression") return false;
    return getAstIdentifierName((element as AstCallExpression).callee) === name;
  }) as AstCallExpression[];
  return matches.length === 1 ? matches[0] : undefined;
}

export function hasAstDirectCall(array: AstArrayExpression, name: string): boolean {
  return array.elements.some((element) => {
    if (element?.type !== "CallExpression") return false;
    return getAstIdentifierName((element as AstCallExpression).callee) === name;
  });
}

export function hasOnlyAstDirectCalls(array: AstArrayExpression): boolean {
  return array.elements.every(
    (element) =>
      element !== null &&
      element.type === "CallExpression" &&
      getAstIdentifierName((element as AstCallExpression).callee) !== undefined,
  );
}

export function getAstDefaultImportBinding(
  module: ParsedSourceModule,
  moduleName: string,
): ImportBindingResult {
  const declarations = getAstImportsForModule(module, moduleName);
  if (declarations.length === 0) return { status: "missing" };
  if (declarations.length !== 1 || declarations[0]!.importKind === "type") {
    return { status: "unsafe" };
  }
  const specifiers = declarations[0]!.specifiers;
  if (
    specifiers.length !== 1 ||
    specifiers[0]!.type !== "ImportDefaultSpecifier" ||
    specifiers[0]!.importKind === "type"
  ) {
    return { status: "unsafe" };
  }
  const defaults = specifiers;
  return { status: "found", localName: defaults[0]!.local.name };
}

export function getAstNamedImportBinding(
  module: ParsedSourceModule,
  moduleName: string,
  importedName: string,
): ImportBindingResult {
  const declarations = getAstImportsForModule(module, moduleName);
  if (declarations.length === 0) return { status: "missing" };
  if (declarations.length !== 1 || declarations[0]!.importKind === "type") {
    return { status: "unsafe" };
  }
  const matches = declarations[0]!.specifiers.filter((specifier) => {
    if (specifier.type !== "ImportSpecifier") return false;
    return getAstPropertyKeyName(specifier.imported) === importedName;
  });
  if (matches.length !== 1 || matches[0]!.importKind === "type") {
    return { status: "unsafe" };
  }
  return { status: "found", localName: matches[0]!.local.name };
}

export function hasAstSoleNamedImport(
  module: ParsedSourceModule,
  moduleName: string,
  importedName: string,
): boolean {
  const declarations = getAstImportsForModule(module, moduleName);
  if (
    declarations.length !== 1 ||
    declarations[0]!.importKind === "type" ||
    declarations[0]!.specifiers.length !== 1
  )
    return false;
  const specifier = declarations[0]!.specifiers[0];
  if (specifier?.type !== "ImportSpecifier" || specifier.importKind === "type") return false;
  const importedRange = getAstNodeRange(specifier.imported);
  const localRange = getAstNodeRange(specifier.local);
  return (
    getAstPropertyKeyName(specifier.imported) === importedName &&
    specifier.local.name === importedName &&
    Boolean(importedRange && localRange) &&
    module.source.slice(importedRange!.start, importedRange!.end) === importedName &&
    module.source.slice(localRange!.start, localRange!.end) === importedName
  );
}

export function countAstTopLevelDirectCalls(module: ParsedSourceModule, name: string): number {
  return module.body.filter((node) => {
    if (node.type !== "ExpressionStatement") return false;
    const expression = (node as AstNode & { expression: AstNode }).expression;
    if (expression.type !== "CallExpression") return false;
    const callee = (expression as AstCallExpression).callee;
    const range = getAstNodeRange(callee);
    return (
      getAstIdentifierName(callee) === name &&
      Boolean(range) &&
      module.source.slice(range!.start, range!.end) === name
    );
  }).length;
}

export function hasAstTopLevelFunction(module: ParsedSourceModule, name: string): boolean {
  return module.body.some((node) => {
    if (node.type !== "FunctionDeclaration") return false;
    const identifier = (node as AstNode & { id?: AstIdentifier }).id;
    return identifier?.type === "Identifier" && identifier.name === name;
  });
}

export function isAstSourceAliasValue(
  node: AstNode,
  fileUrlName: string,
  options: { allowGlobalThisUrl?: boolean } = {},
): boolean {
  const outerCall = node as AstCallExpression;
  if (outerCall.type !== "CallExpression" || outerCall.arguments.length !== 1) return false;
  if (getAstIdentifierName(outerCall.callee) !== fileUrlName) return false;
  const url = outerCall.arguments[0] as AstNode & {
    arguments: AstNode[];
    callee: AstNode;
    type: "NewExpression";
  };
  if (url.type !== "NewExpression" || url.arguments.length !== 2) return false;
  const directUrl = url.callee as AstIdentifier;
  const globalUrl = url.callee as AstNode & { object: AstIdentifier; property: AstIdentifier };
  const hasSupportedUrl =
    (directUrl.type === "Identifier" && directUrl.name === "URL") ||
    (options.allowGlobalThisUrl === true &&
      globalUrl.type === "MemberExpression" &&
      globalUrl.object.type === "Identifier" &&
      globalUrl.object.name === "globalThis" &&
      globalUrl.property.type === "Identifier" &&
      globalUrl.property.name === "URL");
  if (!hasSupportedUrl) return false;
  if (getAstStringValue(url.arguments[0]!) !== "./src") return false;
  const importMetaUrl = url.arguments[1] as AstNode & { object: AstNode; property: AstIdentifier };
  if (importMetaUrl.type !== "MemberExpression") return false;
  const meta = importMetaUrl.object as AstNode & { meta: AstIdentifier; property: AstIdentifier };
  return (
    meta.type === "MetaProperty" &&
    meta.meta.name === "import" &&
    meta.property.name === "meta" &&
    importMetaUrl.property.type === "Identifier" &&
    importMetaUrl.property.name === "url"
  );
}

export function getAvailableIdentifier(
  source: string,
  candidates: readonly string[],
  fallbackBase: string,
): string {
  const identifiers = new Set(source.match(/[A-Za-z_$][\w$]*/g) ?? []);
  for (const candidate of candidates) {
    if (!identifiers.has(candidate)) return candidate;
  }
  let suffix = 2;
  while (identifiers.has(`${fallbackBase}${suffix}`)) suffix += 1;
  return `${fallbackBase}${suffix}`;
}

function hasUnsafeAstObjectShape(object: AstObjectExpression): boolean {
  return object.properties.some((member) => {
    if (member.type === "SpreadElement") return true;
    return Boolean((member as AstNode & { computed?: boolean }).computed);
  });
}

function getAstImportsForModule(
  module: ParsedSourceModule,
  moduleName: string,
): AstImportDeclaration[] {
  return module.body.filter(
    (node) =>
      node.type === "ImportDeclaration" &&
      (node as AstImportDeclaration).source.value === moduleName,
  ) as AstImportDeclaration[];
}

function getAstPropertyKeyName(node: AstNode): string | undefined {
  if (node.type === "Identifier") return (node as AstIdentifier).name;
  if (node.type === "StringLiteral") return (node as AstStringLiteral).value;
  return undefined;
}

function hasAstNodeType(value: unknown, type: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => hasAstNodeType(entry, type));
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.type === type) return true;
  return Object.entries(record).some(
    ([key, entry]) => key !== "loc" && hasAstNodeType(entry, type),
  );
}
