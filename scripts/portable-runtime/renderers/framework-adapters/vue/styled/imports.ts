import path from "node:path";

import { getRelativeImportPath } from "../../../shared.js";
import {
  collectStyledOutputComposedComponentReferences,
  collectStyledOutputPrimitiveReferences,
  collectStyledOutputVariantReferences,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
  type StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

import { supportsVueScope } from "./scope.js";
import type {
  RenderVueComponentOptions,
  VueImportName,
  VueImportsProjection,
  VueModuleImport,
} from "./types.js";

export function projectVueImports(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: RenderVueComponentOptions,
  frameworkImports: VueImportName[],
): VueImportsProjection {
  const entries: VueModuleImport[] = [];
  if (frameworkImports.length) {
    entries.push({ kind: "framework", names: frameworkImports });
  }
  const inlineIcons = collectInlineIconNames(component.render);
  for (const componentImport of component.imports.filter(isForVue)) {
    if (componentImport.kind === "default" && inlineIcons.has(componentImport.importName)) continue;
    entries.push(
      componentImport.kind === "default"
        ? {
            kind: "default",
            localName: componentImport.importName,
            source: componentImport.source,
          }
        : {
            importName: componentImport.importName,
            kind: "named",
            localName: componentImport.localName,
            source: componentImport.source,
          },
    );
  }
  const tailwindNames = [
    ...((component.props?.extends ?? []).some(
      (extend) => isForVue(extend) && extend.kind === "variant-props",
    )
      ? ["VariantProps"]
      : []),
    ...((component.props?.fields ?? []).some(
      (field) => isForVue(field) && field.name === "class",
    ) ||
    (component.destructure?.props ?? []).some((prop) => isForVue(prop) && prop.name === "class")
      ? ["ClassValue"]
      : []),
  ].sort();
  if (tailwindNames.length) {
    entries.push({
      kind: "named-group",
      names: tailwindNames,
      source: "tailwind-variants",
      typeOnly: true,
    });
  }
  if (group.styles?.importFrom.includes(component.exportName)) {
    entries.push({
      kind: "side-effect",
      source: `./${group.styles.sourceFileName ?? "styles.css"}`,
    });
  }

  const primitiveAliases = getPrimitiveAliases(component);
  const primitiveSources: Record<string, string> = {};
  for (const primitive of collectStyledOutputPrimitiveReferences(component.render)) {
    const source = options.primitiveImportBase
      ? `${options.primitiveImportBase}/${primitive}`
      : getRelativeImportPath(options.directory, path.join(options.primitiveOutputRoot, primitive));
    primitiveSources[primitive] = source;
    entries.push({
      kind: "namespace",
      localName: primitiveAliases[primitive]!,
      source,
    });
  }
  for (const reference of collectStyledOutputComposedComponentReferences(component, {
    target: "vue",
  })) {
    const localName = reference.localName ?? reference.exportName;
    if (reference.component === group.component) {
      entries.push({
        kind: "default",
        localName,
        source: `./${reference.exportName}.vue`,
      });
    } else {
      entries.push({
        importName: reference.exportName,
        kind: "named",
        localName: localName === reference.exportName ? undefined : localName,
        source: getRelativeImportPath(
          options.directory,
          path.join(options.outputRoot, reference.component),
        ),
      });
    }
  }
  const variants = collectStyledOutputVariantReferences(component, { target: "vue" });
  if (variants.length) {
    entries.push({ kind: "named-group", names: variants, source: "./variants" });
  }

  return { entries, primitiveAliases, primitiveSources };
}

export function renderVueImports(
  projection: VueImportsProjection,
  options: { includeFramework?: boolean } = {},
): string {
  const statements = projection.entries
    .filter((entry) => options.includeFramework !== false || entry.kind !== "framework")
    .map(renderImport);
  return [...new Set(statements)].join("\n");
}

function renderImport(entry: VueModuleImport): string {
  switch (entry.kind) {
    case "framework":
      return `import { ${entry.names
        .map((name) => `${name.kind === "type" ? "type " : ""}${name.name}`)
        .join(", ")} } from "vue";`;
    case "default":
      return `import ${entry.localName} from ${JSON.stringify(entry.source)};`;
    case "named":
      return `import { ${entry.importName}${entry.localName ? ` as ${entry.localName}` : ""} } from ${JSON.stringify(entry.source)};`;
    case "named-group":
      return `import ${entry.typeOnly ? "type " : ""}{ ${entry.names.join(", ")} } from ${JSON.stringify(entry.source)};`;
    case "namespace":
      return `import * as ${entry.localName} from ${JSON.stringify(entry.source)};`;
    case "side-effect":
      return `import ${JSON.stringify(entry.source)};`;
  }
}

function getPrimitiveAliases(component: StyledOutputComponent): Record<string, string> {
  return Object.fromEntries(
    collectStyledOutputPrimitiveReferences(component.render).map((primitive) => {
      const configured = component.primitiveAliases.find(
        (candidate) => candidate.component === primitive,
      )?.alias;
      const alias =
        configured && configured !== component.exportName
          ? configured
          : `${toPascalCase(primitive)}Primitive`;
      return [primitive, alias];
    }),
  );
}

function collectInlineIconNames(nodes: readonly StyledOutputRenderNode[]): Set<string> {
  const icons = new Set<string>();
  const visit = (node: StyledOutputRenderNode): void => {
    if (node.type === "icon") {
      icons.add(node.importName);
      return;
    }
    if (node.type === "condition") [...node.then, ...node.else].forEach(visit);
    else if (node.type === "slot") node.fallback.forEach(visit);
    else if ("children" in node) node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return icons;
}

function isForVue(value: { targetScopes?: readonly string[] }): boolean {
  return supportsVueScope(value.targetScopes);
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}
