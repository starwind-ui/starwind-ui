import path from 'node:path';

import { getRelativeImportPath } from '../../../shared.js';
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputImport,
} from '../../../styled-output-model/index.js';
import type { RuntimeImportRewriteContext } from '../../../styled-runtime-imports.js';
import { rewriteRuntimeImportSource } from '../../../styled-runtime-imports.js';
import { collectComponentVariants, renderComposedComponentImports } from './component-discovery.js';
import { ASTRO_FRAMEWORK } from './constants.js';
import { isForFramework } from './formatting.js';
import { collectPrimitiveComponents, getAstroPrimitiveAliases } from './primitive-helpers.js';
import { hasAstroPolymorphicAsProp } from './props-client.js';

export function renderComponentImports(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  outputRoot: string,
  dir: string,
  primitiveOutputRoot: string,
  primitiveImportBase: string | undefined,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const externalValueImports: string[] = [];
  const relativeValueImports: string[] = [];
  const sideEffectImports: string[] = [];
  const typeImports: string[] = [];
  const primitiveAliases = getAstroPrimitiveAliases(component);
  const hasStyleSideEffect = Boolean(group.styles?.importFrom.includes(component.exportName));
  const usesAstroPolymorphic = hasAstroPolymorphicAsProp(component.props);
  const usesHtmlAttributes = component.props?.extends?.some(
    (propExtend) =>
      isForFramework(propExtend, ASTRO_FRAMEWORK) &&
      !usesAstroPolymorphic &&
      (propExtend.kind === "element-attributes" ||
        propExtend.kind === "omit-element-attributes"),
  );
  const usesComponentProps = component.props?.extends?.some(
    (propExtend) =>
      isForFramework(propExtend, ASTRO_FRAMEWORK) && propExtend.kind === "component-props",
  );
  const usesVariantProps = component.props?.extends?.some(
    (propExtend) =>
      isForFramework(propExtend, ASTRO_FRAMEWORK) && propExtend.kind === "variant-props",
  );

  const astroTypeImports = [
    ...(usesComponentProps ? ["ComponentProps"] : []),
    ...(usesAstroPolymorphic ? ["HTMLTag", "Polymorphic"] : []),
    ...(usesHtmlAttributes ? ["HTMLAttributes"] : []),
  ];

  if (astroTypeImports.length > 0) {
    typeImports.push(`import type { ${astroTypeImports.join(", ")} } from "astro/types";`);
  }

  if (usesVariantProps) {
    typeImports.push('import type { VariantProps } from "tailwind-variants";');
  }

  if (hasStyleSideEffect && group.styles) {
    sideEffectImports.push(`import "./${group.styles.sourceFileName ?? "styles.css"}";`);
  }

  for (const importContract of (component.imports ?? []).filter((importContract) =>
    isForFramework(importContract, ASTRO_FRAMEWORK),
  )) {
    externalValueImports.push(renderImport(importContract, runtimeImportContext));
  }

  for (const primitiveComponent of collectPrimitiveComponents(component.render)) {
    const alias = primitiveAliases[primitiveComponent];
    const importPath = primitiveImportBase
      ? `${primitiveImportBase}/${primitiveComponent}`
      : getRelativeImportPath(dir, path.join(primitiveOutputRoot, primitiveComponent));

    const importLine = `import ${alias} from "${importPath}";`;
    if (primitiveImportBase && !hasStyleSideEffect) {
      externalValueImports.push(importLine);
    } else {
      relativeValueImports.push(importLine);
    }
  }

  relativeValueImports.push(
    ...renderComposedComponentImports(group, component, outputRoot, dir),
  );

  const usedVariants = collectComponentVariants(component, ASTRO_FRAMEWORK);
  if (usedVariants.size > 0) {
    relativeValueImports.push(
      `import { ${[...usedVariants].sort().join(", ")} } from "./variants";`,
    );
  }

  return organizeImports([
    ...externalValueImports,
    ...typeImports,
    ...sideEffectImports,
    ...relativeValueImports,
  ]);
}

function renderImport(
  importContract: StyledOutputImport,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const source = rewriteRuntimeImportSource(importContract.source, runtimeImportContext);

  if (importContract.kind === "named") {
    const specifier = importContract.localName
      ? `${importContract.importName} as ${importContract.localName}`
      : importContract.importName;

    return `import { ${specifier} } from "${source}";`;
  }

  return `import ${importContract.importName} from "${source}";`;
}

function organizeImports(imports: string[]): string {
  const chunks = splitImportChunks(imports).flatMap((chunk) => splitAstroRelativeChunk(chunk));

  return chunks
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const [firstLine] = chunk;
      if (firstLine && isSideEffectImport(firstLine)) {
        return [firstLine, ...chunk.slice(1).sort(compareImports)];
      }

      return [...chunk].sort(compareImports);
    })
    .map((chunk) => chunk.join("\n"))
    .join("\n\n");
}

function splitImportChunks(imports: string[]): string[][] {
  const chunks: string[][] = [[]];

  for (const importLine of imports) {
    if (isSideEffectImport(importLine)) {
      const activeChunk = chunks.at(-1)!;
      if (activeChunk.length === 0) {
        activeChunk.push(importLine);
      } else {
        chunks.push([importLine]);
      }
      continue;
    }

    chunks.at(-1)!.push(importLine);
  }

  return chunks;
}

function splitAstroRelativeChunk(chunk: string[]): string[][] {
  if (
    chunk.some(isSideEffectImport) ||
    chunk.some((importLine) => getImportSource(importLine).startsWith("@starwind-ui/astro/")) ||
    !chunk.some((importLine) => getImportSource(importLine).startsWith("."))
  ) {
    return [chunk];
  }

  const externalImports = chunk.filter(
    (importLine) => !getImportSource(importLine).startsWith("."),
  );
  const relativeImports = chunk.filter((importLine) => getImportSource(importLine).startsWith("."));

  return [externalImports, relativeImports].filter((candidate) => candidate.length > 0);
}

function compareImports(left: string, right: string): number {
  return (
    getImportCategory(left) - getImportCategory(right) ||
    getImportSource(left).localeCompare(getImportSource(right)) ||
    left.localeCompare(right)
  );
}

function getImportCategory(importLine: string): number {
  return getImportSource(importLine).startsWith(".") ? 1 : 0;
}

function getImportSource(importLine: string): string {
  return (
    importLine.match(/\sfrom\s"([^"]+)";$/)?.[1] ??
    importLine.match(/^import\s"([^"]+)";$/)?.[1] ??
    importLine
  );
}

function isSideEffectImport(importLine: string): boolean {
  return /^import\s"[^"]+";$/.test(importLine);
}
