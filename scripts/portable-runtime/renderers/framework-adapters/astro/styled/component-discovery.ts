import path from "node:path";

import type { FrameworkTarget } from "../../../../contracts/styled/types.js";
import { getRelativeImportPath } from "../../../shared.js";
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputComponentReference,
} from "../../../styled-output-model/index.js";
import {
  collectStyledOutputComposedComponentReferences,
  collectStyledOutputVariantReferences,
} from "../../../styled-output-model/index.js";
import { ASTRO_FRAMEWORK } from "./constants.js";
import { isForFramework } from "./formatting.js";

export function collectComponentVariants(
  component: StyledOutputComponent,
  framework: FrameworkTarget,
): Set<string> {
  return new Set(collectStyledOutputVariantReferences(component, { target: framework }));
}

export function renderComposedComponentImports(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  outputRoot: string,
  dir: string,
): string[] {
  const siblingImports: string[] = [];
  const imports = new Map<string, Map<string, string | undefined>>();
  const siblingFiles = new Map(
    group.components.map((sibling) => [
      sibling.exportName,
      path.basename(sibling.sourceFileName ?? `${sibling.exportName}.astro`, ".astro"),
    ]),
  );

  const references = collectStyledOutputComposedComponentReferences(component, {
    target: ASTRO_FRAMEWORK,
  });
  // A raw attribute value, such as a component passed as a prop, can name a sibling part.
  const rawValues = collectAstroRawAttributeValues(component.render).join("\n");
  for (const sibling of group.components) {
    if (
      sibling.exportName !== component.exportName &&
      !references.some(
        (reference) =>
          reference.component === group.component && reference.exportName === sibling.exportName,
      ) &&
      new RegExp(`\\b${sibling.exportName}\\b`).test(rawValues)
    ) {
      references.push({ component: group.component, exportName: sibling.exportName });
    }
  }

  for (const reference of references) {
    if (reference.component === group.component) {
      const fileName = siblingFiles.get(reference.exportName) ?? reference.exportName;
      siblingImports.push(
        `import ${getComponentReferenceName(reference)} from "./${fileName}.astro";`,
      );
      continue;
    }

    const importPath = getRelativeImportPath(dir, path.join(outputRoot, reference.component));
    const specifiers = imports.get(importPath) ?? new Map<string, string | undefined>();

    specifiers.set(reference.exportName, reference.localName);
    imports.set(importPath, specifiers);
  }

  const packageImports = [...imports.entries()].map(([source, specifiers]) => {
    const renderedSpecifiers = [...specifiers.entries()]
      .map(([exportName, localName]) =>
        localName && localName !== exportName ? `${exportName} as ${localName}` : exportName,
      )
      .sort();

    return `import { ${renderedSpecifiers.join(", ")} } from "${source}";`;
  });

  return [...siblingImports.sort(), ...packageImports];
}

function collectAstroRawAttributeValues(nodes: readonly unknown[] | undefined): string[] {
  const values: string[] = [];
  for (const node of nodes ?? []) {
    if (!node || typeof node !== "object") continue;
    const record = node as {
      attrs?: Array<{ targetScopes?: string[]; value?: { type: string; code?: string } }>;
      children?: unknown[];
      else?: unknown[];
      fallback?: unknown[];
      then?: unknown[];
    };
    for (const attr of record.attrs ?? []) {
      if (isForFramework(attr, ASTRO_FRAMEWORK) && attr.value?.type === "raw" && attr.value.code)
        values.push(attr.value.code);
    }
    values.push(
      ...collectAstroRawAttributeValues(record.children),
      ...collectAstroRawAttributeValues(record.then),
      ...collectAstroRawAttributeValues(record.else),
      ...collectAstroRawAttributeValues(record.fallback),
    );
  }
  return values;
}

export function getComponentReferenceName(reference: StyledOutputComponentReference): string {
  return reference.localName ?? reference.exportName;
}
