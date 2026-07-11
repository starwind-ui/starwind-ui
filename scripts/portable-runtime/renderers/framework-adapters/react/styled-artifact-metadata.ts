import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputImport,
  StyledOutputPropExtend,
  StyledOutputRenderNode,
} from "../../styled-output-model/index.js";
import {
  collectStyledOutputPrimitiveReferences,
  collectStyledOutputVariantReferences,
} from "../../styled-output-model/index.js";
import { rewriteRuntimeImportSource } from "../../styled-runtime-imports.js";
import { REACT_FRAMEWORK } from "./styled/constants.js";
import { isForFramework } from "./styled/formatting.js";

export function collectReactStyledPackageImportSources(args: {
  group: StyledOutputComponentGroup;
  primitiveImportBase: string;
}): string[] {
  const sources = new Set<string>(["react"]);

  if (args.group.variants.length > 0) {
    sources.add("tailwind-variants");
  }

  for (const component of args.group.components) {
    collectReactComponentPackageImportSources(component, args.primitiveImportBase).forEach(
      (source) => sources.add(source),
    );
  }

  return [...sources].sort();
}

function collectReactComponentPackageImportSources(
  component: StyledOutputComponent,
  primitiveImportBase: string,
): string[] {
  const sources = new Set<string>();

  for (const importContract of component.imports.filter((candidate) =>
    isForFramework(candidate, REACT_FRAMEWORK),
  )) {
    sources.add(projectReactImportSource(importContract, component.render, primitiveImportBase));
  }

  for (const primitiveComponent of collectStyledOutputPrimitiveReferences(component.render)) {
    sources.add(`${primitiveImportBase}/${primitiveComponent}`);
  }

  if (collectStyledOutputVariantReferences(component, { target: REACT_FRAMEWORK }).length > 0) {
    sources.add("tailwind-variants");
  }

  for (const source of collectRawImportSources(component)) {
    sources.add(projectRuntimeImportSource(source, component.render, primitiveImportBase));
  }

  return [...sources].sort();
}

function projectReactImportSource(
  importContract: StyledOutputImport,
  render: StyledOutputRenderNode[],
  primitiveImportBase: string,
): string {
  if (
    importContract.kind === "default" &&
    importContract.source.startsWith("@tabler/icons/") &&
    importContract.source.endsWith(".svg")
  ) {
    return "@tabler/icons-react";
  }

  return projectRuntimeImportSource(importContract.source, render, primitiveImportBase);
}

function projectRuntimeImportSource(
  source: string,
  render: StyledOutputRenderNode[],
  primitiveImportBase: string,
): string {
  const primitiveComponents = collectStyledOutputPrimitiveReferences(render);

  return rewriteRuntimeImportSource(source, {
    primitiveImportBase,
    rootImportSource:
      primitiveComponents.length === 1
        ? `${primitiveImportBase}/${primitiveComponents[0]}`
        : primitiveImportBase,
  });
}

function collectRawImportSources(component: StyledOutputComponent): string[] {
  const sources = new Set<string>();

  for (const propExtend of component.props?.extends ?? []) {
    if (isForFramework(propExtend, REACT_FRAMEWORK)) {
      collectPropExtendImportSources(propExtend).forEach((source) => sources.add(source));
    }
  }

  for (const field of component.props?.fields ?? []) {
    if (isForFramework(field, REACT_FRAMEWORK)) {
      collectImportSources(field.type).forEach((source) => sources.add(source));
    }
  }

  for (const line of component.client?.effects ?? []) {
    collectImportSources(line).forEach((source) => sources.add(source));
  }

  return [...sources].sort();
}

function collectPropExtendImportSources(propExtend: StyledOutputPropExtend): string[] {
  return propExtend.kind === "raw" ? collectImportSources(propExtend.code) : [];
}

function collectImportSources(source: string): string[] {
  const importSources = new Set<string>();
  const staticImportPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportPattern = /import\(["']([^"']+)["']\)/g;

  for (const match of source.matchAll(staticImportPattern)) {
    importSources.add(match[1]);
  }

  for (const match of source.matchAll(dynamicImportPattern)) {
    importSources.add(match[1]);
  }

  return [...importSources].sort();
}
