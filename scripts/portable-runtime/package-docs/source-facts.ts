import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";

import type { PublicFrameworkTarget } from "../docs/layered-docs/types.js";

/**
 * Facts read from committed public sources: the framework surface manifest, generated adapter
 * files, and Runtime source. Layered docs metadata covers shared and Astro/React facts; these
 * readers fill the Vue and Svelte gaps without guessing from React conventions.
 */

type ManifestExport = {
  readonly name: string;
  readonly kind: "default" | "type" | "value";
  readonly classification: string;
  readonly reference?: string;
};

type ManifestPart = {
  readonly name: string;
  readonly defaultElement: string;
  readonly runtimeHooks: readonly string[];
};

type ManifestTarget = {
  readonly familySubpaths: readonly string[];
  readonly primitive: {
    readonly namespaces: Readonly<Record<string, readonly string[]>>;
    readonly namespaceValues: Readonly<Record<string, readonly string[]>>;
    readonly exports: Readonly<Record<string, readonly ManifestExport[]>>;
    readonly parts: Readonly<Record<string, readonly ManifestPart[]>>;
  };
};

type FrameworkSurfaceManifest = {
  readonly targets: Readonly<Record<PublicFrameworkTarget, ManifestTarget>>;
};

export type FamilySurface = {
  readonly family: string;
  readonly namespace?: string;
  readonly parts: readonly { readonly part: string; readonly component: string }[];
  readonly exports: readonly ManifestExport[];
  readonly manifestParts: readonly ManifestPart[];
};

export const readFrameworkSurfaceManifest = (repoRoot: string): FrameworkSurfaceManifest =>
  JSON.parse(
    readFileSync(
      path.join(repoRoot, "scripts/portable-runtime/framework-surface-manifest.json"),
      "utf8",
    ),
  ) as FrameworkSurfaceManifest;

export const getTargetFamilies = (
  manifest: FrameworkSurfaceManifest,
  target: PublicFrameworkTarget,
): readonly string[] =>
  manifest.targets[target].familySubpaths
    .map((subpath) => subpath.replace(/^\.\//, ""))
    .sort((left, right) => left.localeCompare(right));

export const getFamilySurface = (
  manifest: FrameworkSurfaceManifest,
  target: PublicFrameworkTarget,
  family: string,
): FamilySurface => {
  const primitive = manifest.targets[target].primitive;
  const parts = primitive.namespaces[family] ?? [];
  const components = primitive.namespaceValues[family] ?? [];
  if (parts.length !== components.length) {
    throw new Error(`Framework surface manifest parts and values differ for ${target}/${family}.`);
  }
  const exports = primitive.exports[family] ?? [];
  return {
    family,
    namespace: exports.find((entry) => entry.kind === "default")?.reference,
    parts: parts.map((part, index) => ({ part, component: components[index]! })),
    // Names that start with "__" are internal wiring between generated parts.
    exports: exports.filter((entry) => entry.kind !== "default" && !entry.name.startsWith("__")),
    manifestParts: primitive.parts[family] ?? [],
  };
};

/** Returns the generated component file for a namespace part, or undefined when none exists. */
export const findComponentSource = (
  packageRoot: string,
  target: PublicFrameworkTarget,
  family: string,
  component: string,
): string | undefined => {
  const extension = { astro: ".astro", react: ".tsx", vue: ".vue", svelte: ".svelte" }[target];
  const file = path.join(packageRoot, "src", family, component + extension);
  if (existsSync(file)) return readFileSync(file, "utf8");
  // Some families reuse parts from a sibling family, such as Context Menu from Menu.
  const index = path.join(packageRoot, "src", family, "index.ts");
  if (!existsSync(index)) return undefined;
  const source = readFileSync(index, "utf8");
  const defaultImport = new RegExp(
    `import\\s+${component}\\s+from\\s+"\\.\\.?/(?:([\\w-]+)/)?([\\w-]+)(?:\\.\\w+)?"`,
  ).exec(source);
  if (defaultImport && defaultImport[2] !== component) {
    const sourceFamily = defaultImport[1] ?? family;
    return findComponentSource(packageRoot, target, sourceFamily, defaultImport[2]!);
  }
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*"\.\.\/([\w-]+)"/g)) {
    const original = new RegExp(`(\\w+)\\s+as\\s+${component}\\b`).exec(match[1]!)?.[1];
    if (original) return findComponentSource(packageRoot, target, match[2]!, original);
  }
  return undefined;
};

export const assertFamilySourceExists = (packageRoot: string, family: string) => {
  const directory = path.join(packageRoot, "src", family);
  if (!existsSync(directory) || !readdirSync(directory).some((file) => file.startsWith("index."))) {
    throw new Error(`Package source has no index for ${family}: ${directory}`);
  }
};

const findMatchingBrace = (source: string, openIndex: number): number => {
  let depth = 0;
  let quote: string | undefined;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    // Comments can hold apostrophes and braces, so skip them.
    if (character === "/" && source[index + 1] === "/") {
      const end = source.indexOf("\n", index);
      index = end === -1 ? source.length : end;
      continue;
    }
    if (character === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("Unbalanced braces in generated source.");
};

/** Splits text on separators that sit outside brackets, parentheses, braces, and strings. */
const splitTopLevel = (source: string, separators: readonly string[]): string[] => {
  const items: string[] = [];
  let depth = 0;
  let quote: string | undefined;
  let current = "";
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    if (quote) {
      current += character;
      if (character === "\\") {
        current += source[index + 1] ?? "";
        index += 1;
      } else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if ("([{<".includes(character)) depth += 1;
    else if (")]}>".includes(character) && source[index - 1] !== "=") depth -= 1;
    if (depth === 0 && separators.includes(character)) {
      items.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  items.push(current);
  return items.map((item) => item.trim()).filter(Boolean);
};

export type VueComponentFacts = {
  readonly props: readonly { readonly name: string; readonly type: string }[];
  readonly emits: readonly { readonly name: string; readonly args: string }[];
  readonly models: readonly string[];
};

/** Returns the content of each `<script>` block in a Vue or Svelte component. */
const readScriptBlocks = (source: string) =>
  [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]!);

// Formatters wrap long parameter lists, which leaves `( a: A, b: B, )` after spaces collapse.
const normalizeType = (text: string) =>
  text.replace(/\s+/g, " ").replace(/^\| /, "").replace(/\( /g, "(").replace(/,? \)/g, ")").trim();

const propertyNameText = (name: ts.PropertyName) =>
  ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;

/** Lists members written directly on a type literal, or on type literals inside an intersection. */
const typeLiteralMembers = (node: ts.TypeNode): ts.PropertySignature[] => {
  if (ts.isParenthesizedTypeNode(node)) return typeLiteralMembers(node.type);
  if (ts.isTypeLiteralNode(node)) return node.members.filter(ts.isPropertySignature);
  if (ts.isIntersectionTypeNode(node)) return node.types.flatMap(typeLiteralMembers);
  return [];
};

const VUE_CONSTRUCTOR_TYPES: Readonly<Record<string, string>> = {
  Array: "unknown[]",
  Boolean: "boolean",
  Function: "Function",
  Number: "number",
  Object: "object",
  String: "string",
};

/** Reads the type of a runtime prop option, such as `{ type: Object as PropType<T> }`. */
const readRuntimePropType = (file: ts.SourceFile, option: ts.Expression): string | undefined => {
  let type: ts.Expression | undefined = option;
  if (ts.isObjectLiteralExpression(option)) {
    const entry = option.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) && propertyNameText(property.name) === "type",
    );
    type = entry?.initializer;
  }
  if (!type) return undefined;
  if (ts.isAsExpression(type)) {
    const asType = type.type;
    if (
      ts.isTypeReferenceNode(asType) &&
      asType.typeName.getText(file) === "PropType" &&
      asType.typeArguments?.[0]
    ) {
      return normalizeType(asType.typeArguments[0].getText(file));
    }
    return normalizeType(asType.getText(file));
  }
  const constructors = ts.isArrayLiteralExpression(type) ? [...type.elements] : [type];
  const names = constructors.map((entry) =>
    ts.isIdentifier(entry) ? VUE_CONSTRUCTOR_TYPES[entry.text] : undefined,
  );
  return names.every(Boolean) ? names.join(" | ") : undefined;
};

/** Formats an emit validator, such as `(_value: string, _details: D) => true`, as a tuple. */
const readEmitValidatorArgs = (file: ts.SourceFile, validator: ts.Expression) => {
  if (!ts.isArrowFunction(validator) && !ts.isFunctionExpression(validator)) return undefined;
  const parameters = validator.parameters.map((parameter) => {
    const name = parameter.name.getText(file).replace(/^_+/, "");
    return parameter.type ? `${name}: ${normalizeType(parameter.type.getText(file))}` : name;
  });
  return `[${parameters.join(", ")}]`;
};

/**
 * Reads the public props, events, and models of a generated Vue component. The reader parses each
 * script block with the TypeScript parser and accepts these declaration forms:
 *
 * - `defineProps<{ ... }>()` and `defineEmits<{ ... }>()` type literals, including literals inside
 *   an intersection. Named types such as `/* @vue-ignore *\/ HTMLAttributes` are left out.
 * - `defineModel<T>()` and `defineModel<T>("name")`, which declare a prop and its model.
 * - `export default defineComponent({ props: { ... }, emits: { ... } })` object options.
 *
 * Emits named `update:<prop>` become models. Other emits become events with tuple arguments.
 */
export const readVueComponentFacts = (source: string): VueComponentFacts => {
  const props = new Map<string, string>();
  const emits = new Map<string, string>();
  const modelProps: string[] = [];
  const addProp = (name: string, type: string) => {
    if (!props.has(name)) props.set(name, type);
  };
  const addEmit = (name: string, args: string) => {
    if (!emits.has(name)) emits.set(name, args);
  };

  for (const script of readScriptBlocks(source)) {
    const file = ts.createSourceFile("Component.ts", script, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const callee = node.expression.text;
        const typeArgument = node.typeArguments?.[0];
        if (callee === "defineProps" && typeArgument) {
          for (const member of typeLiteralMembers(typeArgument)) {
            const name = propertyNameText(member.name);
            if (name && member.type) addProp(name, normalizeType(member.type.getText(file)));
          }
        } else if (callee === "defineEmits" && typeArgument) {
          for (const member of typeLiteralMembers(typeArgument)) {
            const name = propertyNameText(member.name);
            if (name && member.type) addEmit(name, normalizeType(member.type.getText(file)));
          }
        } else if (callee === "defineModel") {
          const first = node.arguments[0];
          const name = first && ts.isStringLiteralLike(first) ? first.text : "modelValue";
          addProp(name, typeArgument ? normalizeType(typeArgument.getText(file)) : "unknown");
          modelProps.push(name);
        } else if (
          callee === "defineComponent" &&
          ts.isExportAssignment(node.parent) &&
          node.arguments[0] &&
          ts.isObjectLiteralExpression(node.arguments[0])
        ) {
          for (const option of node.arguments[0].properties) {
            if (!ts.isPropertyAssignment(option)) continue;
            const optionName = propertyNameText(option.name);
            if (!ts.isObjectLiteralExpression(option.initializer)) continue;
            for (const entry of option.initializer.properties) {
              if (!ts.isPropertyAssignment(entry)) continue;
              const name = propertyNameText(entry.name);
              if (!name) continue;
              if (optionName === "props") {
                addProp(name, readRuntimePropType(file, entry.initializer) ?? "unknown");
              } else if (optionName === "emits") {
                addEmit(name, readEmitValidatorArgs(file, entry.initializer) ?? "[]");
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  const emitEntries = [...emits].map(([name, args]) => ({ name, args }));
  const models = [
    ...emitEntries
      .filter((emit) => emit.name.startsWith("update:"))
      .map((emit) => emit.name.slice("update:".length)),
    ...modelProps,
  ];
  return {
    props: [...props].map(([name, type]) => ({ name, type })),
    emits: emitEntries.filter((emit) => !emit.name.startsWith("update:")),
    models: [...new Set(models)],
  };
};

export type SvelteComponentFacts = {
  readonly props: readonly { readonly name: string; readonly bindable: boolean }[];
};

/** Reads the `$props()` destructuring pattern from a generated Svelte component. */
export const readSvelteComponentFacts = (source: string): SvelteComponentFacts => {
  const call = source.indexOf("$props()");
  if (call === -1) return { props: [] };
  // Some components keep every prop on one object and read named props from it.
  const whole = /let\s+([A-Za-z_$][\w$]*)\s*:\s*Props\s*=\s*\$props\(\)/.exec(source);
  if (whole) {
    const names = new Set(
      [...source.matchAll(new RegExp(`\\b${whole[1]}\\.([A-Za-z_$][\\w$]*)`, "g"))].map(
        (match) => match[1]!,
      ),
    );
    return { props: [...names].map((name) => ({ name, bindable: false })) };
  }
  const declarations = [...source.slice(0, call).matchAll(/\blet\s*\{/g)];
  const open = declarations.length > 0 ? source.indexOf("{", declarations.at(-1)!.index) : -1;
  if (open === -1) {
    throw new Error("Unexpected Svelte $props() declaration.");
  }
  const body = source.slice(open + 1, findMatchingBrace(source, open));
  const props = new Map<string, boolean>();
  for (const item of splitTopLevel(body, [","])) {
    if (item.startsWith("...")) continue;
    const name = /^([A-Za-z_$][\w$]*)/.exec(item)?.[1];
    if (!name) continue;
    props.set(name, (props.get(name) ?? false) || item.includes("$bindable("));
  }
  return { props: [...props].map(([name, bindable]) => ({ name, bindable })) };
};

/**
 * Returns the source of the component that a Svelte wrapper takes its props from, written as
 * `ComponentProps<typeof Wrapped>` with `import Wrapped from "./path.svelte"`. Field Control uses
 * this form to pass Input Root props through. Returns undefined for other components.
 */
export const readSvelteWrappedComponentSource = (
  packageRoot: string,
  family: string,
  source: string,
) => {
  const wrapped = /ComponentProps<typeof\s+([A-Za-z_$][\w$]*)>/.exec(source)?.[1];
  if (!wrapped) return undefined;
  const specifier = new RegExp(`import\\s+${wrapped}\\s+from\\s+"([^"]+\\.svelte)"`).exec(
    source,
  )?.[1];
  if (!specifier) return undefined;
  const file = path.resolve(packageRoot, "src", family, specifier);
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
};

/** Returns the instance `<script>` of a Svelte component, without the `module` script. */
const readSvelteInstanceScript = (source: string) => {
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/\bmodule\b|context\s*=\s*["']module["']/.test(match[1]!)) return match[2]!;
  }
  return undefined;
};

/**
 * Reads prop types from the `Props` declaration in a Svelte component's instance script. The
 * reader uses the TypeScript parser and reads only members written directly on `Props`, including
 * quoted names such as `"disabled"?: boolean`. Members that come from `Omit<...>` or other named
 * types are left out, so the docs never show a type from a different declaration. Union variants
 * contribute each member once, typed as the union of its variant types.
 */
export const readSveltePropTypes = (source: string): ReadonlyMap<string, string> => {
  const script = readSvelteInstanceScript(source);
  const types = new Map<string, string>();
  if (script === undefined) return types;
  const file = ts.createSourceFile("Component.ts", script, ts.ScriptTarget.Latest, true);
  const membersOf = (members: ts.NodeArray<ts.TypeElement>) => {
    const found = new Map<string, ts.TypeNode>();
    for (const member of members) {
      if (!ts.isPropertySignature(member) || !member.type) continue;
      const name = member.name;
      if (ts.isIdentifier(name) || ts.isStringLiteral(name)) found.set(name.text, member.type);
    }
    return found;
  };
  // Collects members written directly on a type. A union, such as a native-button variant and a
  // span variant, lists each member once with the union of its variant types.
  const collect = (node: ts.TypeNode): Map<string, string[]> => {
    if (ts.isParenthesizedTypeNode(node)) return collect(node.type);
    if (ts.isTypeLiteralNode(node)) {
      return new Map([...membersOf(node.members)].map(([name, type]) => [name, [text(type)]]));
    }
    const result = new Map<string, string[]>();
    if (ts.isIntersectionTypeNode(node)) {
      for (const part of node.types) {
        for (const [name, variants] of collect(part)) {
          if (!result.has(name)) result.set(name, variants);
        }
      }
    } else if (ts.isUnionTypeNode(node)) {
      for (const part of node.types) {
        for (const [name, variants] of collect(part)) {
          const current = result.get(name) ?? [];
          result.set(name, [...current, ...variants.filter((type) => !current.includes(type))]);
        }
      }
    }
    return result;
  };
  const text = (type: ts.TypeNode) => type.getText(file).replace(/\s+/g, " ").trim();
  const joinVariants = (variants: readonly string[]) => {
    if (variants.length === 1) return variants[0]!;
    if ([...variants].sort().join("|") === "false|true") return "boolean";
    return variants.map((type) => (type.includes("=>") ? `(${type})` : type)).join(" | ");
  };
  const visitType = (node: ts.TypeNode) => {
    for (const [name, variants] of collect(node)) {
      if (!types.has(name)) types.set(name, joinVariants(variants));
    }
  };
  const addMembers = (members: ts.NodeArray<ts.TypeElement>) => {
    for (const [name, type] of membersOf(members))
      if (!types.has(name)) types.set(name, text(type));
  };
  for (const statement of file.statements) {
    if (ts.isTypeAliasDeclaration(statement) && statement.name.text === "Props") {
      visitType(statement.type);
    } else if (ts.isInterfaceDeclaration(statement) && statement.name.text === "Props") {
      addMembers(statement.members);
    }
  }
  return types;
};

/** Tests whether a generated Astro or React component declares a prop with this name. */
export const sourceDeclaresProp = (source: string, name: string) =>
  new RegExp(`(^|[\\s{;,(])${name.replace(/[$]/g, "\\$")}\\??\\s*:`, "m").test(source);

/** Reads a Runtime factory signature, such as `createDialog(root: HTMLElement, ...)`. */
export const readRuntimeFactorySignature = (
  repoRoot: string,
  primitiveId: string,
  factory: string,
) => {
  const directory = path.join(repoRoot, "packages/runtime/src/components", primitiveId);
  const pattern = new RegExp(
    `export function ${factory}(<[\\s\\S]*?>(?=\\())?\\(([\\s\\S]*?)\\)\\s*:\\s*([^{]+?)\\s*\\{`,
  );
  const match = readdirSync(directory)
    .filter((file) => file.endsWith(".ts"))
    .sort()
    .map((file) => pattern.exec(readFileSync(path.join(directory, file), "utf8")))
    .find(Boolean);
  if (!match) throw new Error(`Cannot find ${factory} in ${directory}`);
  // Keep the type parameters, so the signature declares the names its types use.
  const typeParameters = (match[1] ?? "")
    .replace(/\s+/g, " ")
    .replace(/<\s+/, "<")
    .replace(/,?\s*>$/, ">");
  const parameters = splitTopLevel(match[2]!, [","]).map((parameter) => {
    const defaulted = /^([\w$]+)\s*:\s*([\s\S]+?)\s*=\s*[\s\S]+$/.exec(parameter);
    return (defaulted ? `${defaulted[1]}?: ${defaulted[2]}` : parameter).replace(/\s+/g, " ");
  });
  return `${factory}${typeParameters}(${parameters.join(", ")}): ${match[3]!.replace(/\s+/g, " ")}`;
};

/** Returns an exported type declaration from Runtime source, exactly as written. */
export const readRuntimeTypeDeclaration = (repoRoot: string, file: string, name: string) => {
  const source = readFileSync(path.join(repoRoot, "packages/runtime/src", file), "utf8");
  const start = source.indexOf(`export type ${name} =`);
  if (start === -1) throw new Error(`Cannot find type ${name} in ${file}`);
  const open = source.indexOf("{", start);
  return source.slice(start, findMatchingBrace(source, open) + 1) + ";";
};

/** Returns a controller instance type from its component folder, when declared there. */
export const findRuntimeComponentType = (repoRoot: string, primitiveId: string, name: string) => {
  const directory = path.join(repoRoot, "packages/runtime/src/components", primitiveId);
  for (const file of readdirSync(directory)
    .filter((entry) => entry.endsWith(".ts"))
    .sort()) {
    const source = readFileSync(path.join(directory, file), "utf8");
    const start = source.search(new RegExp(`export (?:type ${name} =|interface ${name}\\b)`));
    if (start === -1) continue;
    const open = source.indexOf("{", start);
    const end = findMatchingBrace(source, open) + 1;
    return source.slice(start, end) + (source.slice(start, open).includes("type ") ? ";" : "");
  }
  return undefined;
};

/**
 * Reads the declared type of a prop from generated component source, such as
 * `(open: boolean, details: DialogOpenChangeDetails) => void`. Returns undefined when absent.
 */
export const readDeclaredType = (source: string, name: string) => {
  const match = new RegExp(`(?:^|[\\s{;,(])${name.replace(/[$]/g, "\\$")}\\?\\s*:\\s*`, "m").exec(
    source,
  );
  if (!match) return undefined;
  let depth = 0;
  let end = match.index + match[0].length;
  for (; end < source.length; end += 1) {
    const character = source[end]!;
    if ("([{<".includes(character)) depth += 1;
    else if (")]}>".includes(character) && source[end - 1] !== "=") {
      if (depth === 0) break;
      depth -= 1;
    } else if (depth === 0 && (character === ";" || character === ",")) break;
    else if (depth === 0 && character === "\n") {
      // Formatters wrap long unions and intersections onto lines that start with | or &.
      const next = /^\s*(\S)/.exec(source.slice(end + 1))?.[1];
      if (next !== "|" && next !== "&") break;
    }
  }
  const type = source
    .slice(match.index + match[0].length, end)
    .replace(/\s+/g, " ")
    .replace(/^\| /, "")
    .trim();
  return type || undefined;
};
