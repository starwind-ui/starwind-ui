import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputPropExtend,
  StyledOutputRenderNode,
} from "../../styled-output-model/index.js";
import {
  collectStyledOutputPrimitiveReferences,
  collectStyledOutputVariantReferences,
} from "../../styled-output-model/index.js";
import { rewriteRuntimeImportSource } from "../../styled-runtime-imports.js";
import { ASTRO_FRAMEWORK } from "./styled/constants.js";
import { isForFramework } from "./styled/formatting.js";
import { hasAstroPolymorphicAsProp } from "./styled/props-client.js";

export function collectAstroStyledPackageImportSources(args: {
  group: StyledOutputComponentGroup;
  primitiveImportBase: string;
}): string[] {
  const sources = new Set<string>();

  if (args.group.variants.length > 0) {
    sources.add("tailwind-variants");
  }

  for (const component of args.group.components) {
    collectAstroComponentPackageImportSources(component, args.primitiveImportBase).forEach(
      (source) => sources.add(source),
    );
  }

  return [...sources].sort();
}

function collectAstroComponentPackageImportSources(
  component: StyledOutputComponent,
  primitiveImportBase: string,
): string[] {
  const sources = new Set<string>();

  for (const importContract of component.imports.filter((candidate) =>
    isForFramework(candidate, ASTRO_FRAMEWORK),
  )) {
    sources.add(
      projectAstroImportSource(importContract.source, component.render, primitiveImportBase),
    );
  }

  for (const primitiveComponent of collectStyledOutputPrimitiveReferences(component.render)) {
    sources.add(`${primitiveImportBase}/${primitiveComponent}`);
  }

  if (collectStyledOutputVariantReferences(component, { target: ASTRO_FRAMEWORK }).length > 0) {
    sources.add("tailwind-variants");
  }

  if (usesAstroTypes(component)) {
    sources.add("astro/types");
  }

  for (const source of collectRawImportSources(component)) {
    sources.add(projectAstroImportSource(source, component.render, primitiveImportBase));
  }

  return [...sources].sort();
}

function projectAstroImportSource(
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

function usesAstroTypes(component: StyledOutputComponent): boolean {
  const propExtends = component.props?.extends ?? [];
  const usesAstroTypedProps = propExtends.some(
    (propExtend) =>
      isForFramework(propExtend, ASTRO_FRAMEWORK) &&
      (propExtend.kind === "component-props" ||
        propExtend.kind === "element-attributes" ||
        propExtend.kind === "omit-element-attributes" ||
        propExtend.kind === "variant-props"),
  );

  return usesAstroTypedProps || hasAstroPolymorphicAsProp(component.props);
}

function collectRawImportSources(component: StyledOutputComponent): string[] {
  const sources = new Set<string>();

  for (const propExtend of component.props?.extends ?? []) {
    if (isForFramework(propExtend, ASTRO_FRAMEWORK)) {
      collectPropExtendImportSources(propExtend).forEach((source) => sources.add(source));
    }
  }

  for (const field of component.props?.fields ?? []) {
    if (isForFramework(field, ASTRO_FRAMEWORK)) {
      collectImportSources(field.type).forEach((source) => sources.add(source));
    }
  }

  for (const line of component.client?.setup ?? []) {
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
