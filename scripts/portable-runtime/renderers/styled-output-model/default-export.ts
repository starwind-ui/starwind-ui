import type { StyledOutputComponentGroup } from "./types.js";

const TYPESCRIPT_RESERVED_IDENTIFIERS = new Set([
  "arguments",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

export function allocateStyledPartsIdentifier(
  group: Omit<StyledOutputComponentGroup, "defaultExport"> & {
    defaultExport: Pick<StyledOutputComponentGroup["defaultExport"], "members" | "mode">;
  },
): string {
  const unavailable = collectIndexBindings(group);
  const componentIdentifier = toPascalCase(group.component);
  const validComponentIdentifier =
    !componentIdentifier || !/^[A-Za-z_$]/.test(componentIdentifier)
      ? `Styled${componentIdentifier}`
      : componentIdentifier;
  const baseIdentifier = `${validComponentIdentifier}Parts`;

  if (!unavailable.has(baseIdentifier)) return baseIdentifier;

  for (let suffix = 2; ; suffix += 1) {
    const identifier = `${baseIdentifier}${suffix}`;
    if (!unavailable.has(identifier)) return identifier;
  }
}

export function validateStyledPartsIdentifier(group: StyledOutputComponentGroup): string[] {
  if (group.defaultExport.mode === "component") return [];

  if (!group.defaultExport.identifier) {
    return ["Parts default export requires a private identifier."];
  }

  if (!isTypeScriptIdentifier(group.defaultExport.identifier)) {
    return [
      `Parts default export identifier "${group.defaultExport.identifier}" is not a valid TypeScript identifier.`,
    ];
  }

  return collectIndexBindings(group).has(group.defaultExport.identifier)
    ? [
        `Parts default export identifier "${group.defaultExport.identifier}" collides with an index binding.`,
      ]
    : [];
}

export function getStyledPartsIdentifier(group: StyledOutputComponentGroup): string {
  assertStyledPartsIdentifier(group);
  if (group.defaultExport.mode !== "parts" || !group.defaultExport.identifier) {
    throw new TypeError("Parts default export requires a private identifier.");
  }
  return group.defaultExport.identifier;
}

export function assertStyledPartsIdentifier(group: StyledOutputComponentGroup): void {
  const issues = validateStyledPartsIdentifier(group);
  if (issues.length > 0) throw new TypeError(issues.join("\n"));
}

function collectIndexBindings(
  group: Omit<StyledOutputComponentGroup, "defaultExport"> & {
    defaultExport: Pick<StyledOutputComponentGroup["defaultExport"], "members" | "mode">;
  },
): Set<string> {
  return new Set([
    ...group.components.map((component) => component.exportName),
    ...group.constants.map((constant) => constant.name),
    ...group.variants.map((variant) => variant.name),
    ...(group.variantAliases ?? []).map((alias) => alias.name),
    ...(group.variantCollectionName ? [group.variantCollectionName] : []),
    ...(group.primitiveFacadeExports?.types ?? []),
    ...(group.primitiveFacadeExports?.values ?? []),
    ...group.publicExports,
    ...group.defaultExport.members.map((member) => member.localName),
  ]);
}

function toPascalCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function isTypeScriptIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) && !TYPESCRIPT_RESERVED_IDENTIFIERS.has(value);
}
