import ts from "typescript";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { projectStyledOutputModel } from "./index.js";
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "./types.js";

// These are framework/native syntax, not additional component capabilities.
const nativeProps = new Set([
  "children",
  "ref",
  "class",
  "as",
  "tabindex",
  "onclick",
  "disabled",
  "required",
  "name",
  "form",
  "type",
  "href",
  "id",
  "style",
  "defaultValue",
  "value",
  "autoplay",
  "srcdoc",
  "playsinline",
  "allowfullscreen",
]);
const canonicalName = (name: string) =>
  ({
    autoPlay: "autoplay",
    srcDoc: "srcdoc",
    playsInline: "playsinline",
    allowFullScreen: "allowfullscreen",
    className: "class",
    viewportClassName: "viewportClass",
    modelValue: "value",
    defaultvalue: "defaultValue",
    child: "asChild",
  })[name] ?? name.replace(/ClassName$/, "Class");
const modelProps = new Set([
  "open",
  "mobileOpen",
  "checked",
  "pressed",
  "inputValue",
  "files",
  "value",
]);
const slotName = (name: string) =>
  name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

type File = { relativePath: string; content: string };

/** Validate emitted public fields and Styled composition against the shared contract.
 * Runs on generated code, so a target cannot self-certify its rewritten model.
 */
export function assertStyledContractFiles(
  contracts: readonly StyledAdapterContract[],
  files: readonly File[],
  target: string,
): void {
  const groups = projectStyledOutputModel(contracts).componentGroups;
  for (const file of files) {
    if (!/\.(astro|tsx|vue|svelte)$/.test(file.relativePath)) continue;
    const [groupName, filename] = file.relativePath.split("/");
    const group = groups.find((g) => g.component === groupName);
    const component = group?.components.find(
      (c) =>
        `${c.sourceFileName ?? c.exportName}.${file.relativePath.split(".").at(-1)}` === filename,
    );
    if (!group || !component)
      throw new Error(`${target} Styled ${file.relativePath}: no contract component.`);
    assertComponent(group, component, groups, file, target);
  }
}

function assertComponent(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  groups: StyledOutputComponentGroup[],
  file: File,
  target: string,
): void {
  const fail = (message: string): never => {
    throw new Error(`${target} Styled ${file.relativePath}: ${message}`);
  };
  const allowed = new Set<string>(nativeProps);
  const defaults = new Map<string, string>();
  function collect(
    ownerGroup: StyledOutputComponentGroup,
    owner: StyledOutputComponent,
    seen = new Set<string>(),
  ) {
    const key = `${ownerGroup.component}/${owner.exportName}`;
    if (seen.has(key)) return;
    seen.add(key);
    for (const field of owner.props?.fields ?? []) {
      if (
        !field.targetScopes ||
        field.targetScopes.includes(target) ||
        /(?:Class(?:Name)?)$/.test(field.name) ||
        (target !== "astro" && modelProps.has(field.name)) ||
        /^on[A-Z]/.test(field.name) ||
        field.name === "asChild"
      )
        allowed.add(canonicalName(field.name));
    }
    for (const prop of owner.destructure?.props ?? []) {
      const name = canonicalName(prop.name);
      if (
        !prop.targetScopes ||
        prop.targetScopes.includes(target) ||
        /(?:Class(?:Name)?)$/.test(prop.name) ||
        (target !== "astro" && modelProps.has(prop.name)) ||
        /^on[A-Z]/.test(prop.name) ||
        prop.name === "asChild"
      )
        allowed.add(name);
      if (
        !defaults.has(name) &&
        prop.defaultValue !== undefined &&
        (!prop.targetScopes || prop.targetScopes.includes(target))
      )
        defaults.set(name, prop.defaultValue);
    }
    visit(owner.render, (node) => {
      if (node.type === "slot" && node.name) allowed.add(slotName(node.name));
    });
    for (const variant of ownerGroup.variants)
      for (const name of Object.keys(variant.definition.variants ?? {})) allowed.add(name);
    for (const base of owner.props?.extends ?? []) {
      if (base.kind !== "component-props") continue;
      const dependency = groups.find((g) => g.component === base.component);
      const inherited = dependency?.components.find((c) => c.exportName === base.exportName);
      if (dependency && inherited) collect(dependency, inherited, seen);
    }
  }
  collect(group, component);
  const script =
    target === "astro"
      ? (file.content.split("---")[1] ?? "")
      : target === "react"
        ? file.content
        : [...file.content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
            .map((m) => m[1])
            .join("\n");
  const source = ts.createSourceFile(
    file.relativePath + ".tsx",
    script,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fields: string[] = [];
  const aliases = new Map(
    source.statements.filter(ts.isTypeAliasDeclaration).map((node) => [node.name.text, node.type]),
  );
  const imports = new Map<string, string>();
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    if (node.importClause?.name)
      imports.set(node.importClause.name.text, node.moduleSpecifier.text);
    const bindings = node.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings))
      for (const item of bindings.elements) imports.set(item.name.text, node.moduleSpecifier.text);
  }
  const visitedAliases = new Set<string>();
  function readType(node: ts.TypeNode | ts.InterfaceDeclaration): void {
    if (
      ts.isTypeReferenceNode(node) &&
      ts.isIdentifier(node.typeName) &&
      !visitedAliases.has(node.typeName.text)
    ) {
      visitedAliases.add(node.typeName.text);
      const alias = aliases.get(node.typeName.text);
      if (alias) readType(alias);
    }
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) node.types.forEach(readType);
    if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
      for (const member of node.members)
        if (member.name && (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) {
          if (
            ts.isPropertySignature(member) &&
            member.type?.kind === ts.SyntaxKind.NeverKeyword &&
            allowed.has(canonicalName(member.name.text))
          )
            fail(`public prop "${member.name.text}" is forbidden by the target type.`);
          fields.push(member.name.text);
        }
    }
  }
  for (const statement of source.statements) {
    if (
      (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
      ["Props", `${component.exportName}Props`].includes(statement.name.text)
    )
      readType(ts.isTypeAliasDeclaration(statement) ? statement.type : statement);
  }
  for (const field of fields) {
    if (!allowed.has(canonicalName(field)) && !/^(data-|aria-)/.test(field))
      fail(`public prop "${field}" is absent from the shared contract.`);
  }
  // Check literal defaults at the framework's public prop binding. Model initializers
  // such as $bindable() retain their framework-owned state acceptance semantics.
  function checkDefault(name: string, node: ts.Expression | undefined) {
    if (!node) return;
    const expected = defaults.get(canonicalName(name));
    if (expected === undefined) return;
    const actual = node.getText(source);
    const literal = /^(?:true|false|null|-?\d+(?:\.\d+)?|"[^"\\]*"|'[^'\\]*')$/;
    if (
      literal.test(actual) &&
      literal.test(expected) &&
      actual.replaceAll("'", '"') !== expected.replaceAll("'", '"')
    )
      fail(
        `default for "${name}" differs from the shared contract (${actual} instead of ${expected}).`,
      );
  }
  function walk(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      (/^(?:props|Astro\.props|\$props\(\))$/.test(node.initializer.getText(source)) ||
        (ts.isCallExpression(node.initializer) &&
          ts.isIdentifier(node.initializer.expression) &&
          node.initializer.expression.text === "defineProps"))
    ) {
      for (const entry of node.name.elements) {
        const name = entry.propertyName ?? entry.name;
        if (ts.isIdentifier(name) || ts.isStringLiteral(name))
          checkDefault(name.text, entry.initializer);
      }
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "withDefaults" &&
      node.arguments[1] &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      for (const entry of node.arguments[1].properties)
        if (
          ts.isPropertyAssignment(entry) &&
          (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name))
        )
          checkDefault(entry.name.text, entry.initializer);
    }
    ts.forEachChild(node, walk);
  }
  walk(source);
  // asChild explicitly requests semantic-element merging. A target may lower that
  // boundary to its native child/snippet mechanism; ordinary Styled calls must remain.
  const required = new Map<string, { component: string; exportName: string }>();
  function composition(nodes: StyledOutputRenderNode[], merged = false) {
    for (const node of nodes) {
      const childProp =
        node.type === "component" || node.type === "primitive"
          ? node.attrs.find((a) => a.name === "asChild")
          : undefined;
      const dependency =
        node.type === "component"
          ? groups
              .find((g) => g.component === node.component)
              ?.components.find((c) => c.exportName === node.exportName)
          : undefined;
      const defaultChild =
        dependency?.destructure?.props.find((p) => p.name === "asChild")?.defaultValue === "true";
      const merging =
        merged ||
        (childProp
          ? childProp.value?.type === "literal" && childProp.value.value === true
          : defaultChild);
      if (node.type === "component" && !merging)
        required.set(node.localName ?? node.exportName, node);
      if ("children" in node) composition(node.children, merging);
      if (node.type === "condition") {
        composition(node.then, merged);
        composition(node.else, merged);
      }
      if (node.type === "slot") composition(node.fallback, merged);
    }
  }
  composition(component.render);
  for (const [name, dependency] of required) {
    if (!new RegExp(`<${name}\\b`).test(file.content))
      fail(`missing contracted Styled composition "${name}".`);
    const source = imports.get(name)?.replace(/\.(?:js|ts|tsx|astro|vue|svelte)$/, "");
    const allowedSources =
      dependency.component === group.component
        ? [`./${dependency.exportName}`, "./index", "."]
        : [
            `../${dependency.component}`,
            `../${dependency.component}/index`,
            `../${dependency.component}/${dependency.exportName}`,
          ];
    if (!source || !allowedSources.includes(source))
      fail(`Styled composition "${name}" must import its contracted Styled component.`);
  }
}

function visit(nodes: StyledOutputRenderNode[], fn: (node: StyledOutputRenderNode) => void): void {
  for (const node of nodes) {
    fn(node);
    if ("children" in node) visit(node.children, fn);
    if (node.type === "condition") {
      visit(node.then, fn);
      visit(node.else, fn);
    }
    if (node.type === "slot") visit(node.fallback, fn);
  }
}
