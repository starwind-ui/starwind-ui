import path from 'node:path';

import type { FrameworkTarget } from '../../../../contracts/styled/types.js';
import { getRelativeImportPath } from '../../../shared.js';
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputComponentReference,
} from '../../../styled-output-model/index.js';
import {
  collectStyledOutputComposedComponentReferences,
  collectStyledOutputVariantReferences,
} from '../../../styled-output-model/index.js';
import { ASTRO_FRAMEWORK } from './constants.js';

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

  for (const reference of collectStyledOutputComposedComponentReferences(component, {
    target: ASTRO_FRAMEWORK,
  })) {
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

export function getComponentReferenceName(reference: StyledOutputComponentReference): string {
  return reference.localName ?? reference.exportName;
}
