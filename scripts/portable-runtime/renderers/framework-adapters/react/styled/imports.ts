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
import { REACT_FRAMEWORK } from './constants.js';
import { isForFramework } from './formatting.js';
import { collectPrimitiveComponents, getReactPrimitiveAliases } from './primitive-helpers.js';

export function renderComponentImports(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  outputRoot: string,
  dir: string,
  primitiveOutputRoot: string,
  primitiveImportBase: string | undefined,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const imports: string[] = [
    component.client?.effects || component.forwardRef
      ? 'import * as React from "react";'
      : 'import type * as React from "react";',
  ];
  const usesVariantProps = component.props?.extends?.some(
    (propExtend) =>
      isForFramework(propExtend, REACT_FRAMEWORK) && propExtend.kind === "variant-props",
  );

  if (usesVariantProps) {
    imports.push('import type { VariantProps } from "tailwind-variants";');
  }

  if (group.styles?.importFrom.includes(component.exportName)) {
    imports.push(`import "./${group.styles.sourceFileName ?? "styles.css"}";`);
  }

  const iconImports = collectIconImports(
    (component.imports ?? []).filter(
      (importContract): importContract is Extract<StyledOutputImport, { kind: "default" }> =>
        importContract.kind === "default" && isForFramework(importContract, REACT_FRAMEWORK),
    ),
  );
  if (iconImports.length > 0) {
    imports.push(`import { ${iconImports.join(", ")} } from "@tabler/icons-react";`);
  }

  for (const importLine of renderNamedExternalImports(component, runtimeImportContext)) {
    imports.push(importLine);
  }

  for (const primitiveComponent of collectPrimitiveComponents(component.render)) {
    const alias = getReactPrimitiveAliases(component)[primitiveComponent];
    const importPath = primitiveImportBase
      ? `${primitiveImportBase}/${primitiveComponent}`
      : getRelativeImportPath(dir, path.join(primitiveOutputRoot, primitiveComponent));

    imports.push(`import ${alias} from "${importPath}";`);
  }

  for (const importLine of renderComposedComponentImports(group, component, outputRoot, dir)) {
    imports.push(importLine);
  }

  const usedVariants = collectComponentVariants(component, REACT_FRAMEWORK);
  if (usedVariants.size > 0) {
    imports.push(`import { ${[...usedVariants].sort().join(", ")} } from "./variants";`);
  }

  return organizeImports(imports);
}

function collectIconImports(
  imports: Array<Extract<StyledOutputImport, { kind: "default" }>>,
): string[] {
  return imports.map((importContract) => {
    const iconName = toTablerReactIconName(importContract);

    return `${iconName} as ${importContract.importName}`;
  });
}

function renderNamedExternalImports(
  component: StyledOutputComponent,
  runtimeImportContext: RuntimeImportRewriteContext,
): string[] {
  const imports = new Map<string, Map<string, string | undefined>>();

  for (const importContract of (component.imports ?? []).filter(
    (candidate): candidate is Extract<StyledOutputImport, { kind: "named" }> =>
      candidate.kind === "named" && isForFramework(candidate, REACT_FRAMEWORK),
  )) {
    const source = rewriteRuntimeImportSource(importContract.source, runtimeImportContext);
    const specifiers = imports.get(source) ?? new Map<string, string | undefined>();
    specifiers.set(importContract.importName, importContract.localName);
    imports.set(source, specifiers);
  }

  return [...imports.entries()].map(([source, specifiers]) => {
    const renderedSpecifiers = [...specifiers.entries()]
      .map(([importName, localName]) =>
        localName && localName !== importName ? `${importName} as ${localName}` : importName,
      )
      .sort();

    return `import { ${renderedSpecifiers.join(", ")} } from "${source}";`;
  });
}

function toTablerReactIconName(importContract: StyledOutputImport): string {
  const { importName, source } = importContract;
  if (importName === "X") return "IconX";

  return source.includes("/filled/") && !importName.endsWith("Filled")
    ? `Icon${importName}Filled`
    : `Icon${importName}`;
}

function organizeImports(imports: string[]): string {
  const chunks: string[][] = [[]];

  for (const importLine of imports) {
    if (isSideEffectImport(importLine)) {
      const activeChunk = chunks.at(-1)!;
      if (activeChunk.length === 0) {
        activeChunk.push(importLine);
      } else {
        chunks.push([importLine]);
      }
      chunks.push([]);
      continue;
    }

    chunks.at(-1)!.push(importLine);
  }

  return chunks
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const [firstLine] = chunk;
      if (chunk.length === 1 && firstLine && isSideEffectImport(firstLine)) return chunk;

      return [...chunk].sort(compareImports);
    })
    .flat()
    .join("\n");
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
