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
  // A named import that a type parameter reads and no value position reads is a type import.
  const typeText = JSON.stringify(component.typeParameters ?? []);
  const valueText = JSON.stringify([component.variables, component.render, component.destructure]);
  const readsName = (text: string, name: string) => text.split(/[^\w$]+/).includes(name);
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
            ...(readsName(typeText, componentImport.localName ?? componentImport.importName) &&
            !readsName(valueText, componentImport.localName ?? componentImport.importName)
              ? { typeOnly: true }
              : {}),
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
  const controlFamily = /^(Dialog|Sheet)(Trigger|Close)$/.test(component.exportName)
    ? component.exportName.startsWith("Dialog")
      ? "Dialog"
      : "Drawer"
    : /^AlertDialog(Trigger|Action|Cancel)$/.test(component.exportName)
      ? "AlertDialog"
      : undefined;
  if (controlFamily) {
    const primitive =
      controlFamily === "AlertDialog" ? "alert-dialog" : controlFamily.toLowerCase();
    const source = options.primitiveImportBase
      ? `${options.primitiveImportBase}/${primitive}`
      : getRelativeImportPath(options.directory, path.join(options.primitiveOutputRoot, primitive));
    primitiveSources[primitive] ??= source;
  }
  const references = collectStyledOutputComposedComponentReferences(component, {
    target: "vue",
  });
  // A raw attribute value that is a sibling part name passes that component as a prop.
  const rawValues = new Set(
    collectVueRawAttributeValues(component.render).map((code) => code.trim()),
  );
  for (const sibling of group.components) {
    if (
      sibling.exportName !== component.exportName &&
      !references.some(
        (reference) =>
          reference.component === group.component && reference.exportName === sibling.exportName,
      ) &&
      rawValues.has(sibling.exportName)
    ) {
      references.push({ component: group.component, exportName: sibling.exportName });
    }
  }
  for (const reference of references) {
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
    case "framework": {
      // A type-only import uses `import type` so no bare side-effect import stays behind.
      const typeOnly = entry.names.every((name) => name.kind === "type");
      return `import ${typeOnly ? "type " : ""}{ ${entry.names
        .map((name) => `${!typeOnly && name.kind === "type" ? "type " : ""}${name.name}`)
        .join(", ")} } from "vue";`;
    }
    case "default":
      return `import ${entry.localName} from ${JSON.stringify(entry.source)};`;
    case "named":
      return `import ${entry.typeOnly ? "type " : ""}{ ${entry.importName}${entry.localName ? ` as ${entry.localName}` : ""} } from ${JSON.stringify(entry.source)};`;
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

function collectVueRawAttributeValues(nodes: readonly StyledOutputRenderNode[]): string[] {
  const values: string[] = [];
  const visit = (node: StyledOutputRenderNode): void => {
    if ("attrs" in node) {
      for (const attr of node.attrs) {
        if (isForVue(attr) && attr.value?.type === "raw") values.push(attr.value.code);
      }
    }
    if (node.type === "condition") [...node.then, ...node.else].forEach(visit);
    else if (node.type === "slot") node.fallback.forEach(visit);
    else if ("children" in node) node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return values;
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
