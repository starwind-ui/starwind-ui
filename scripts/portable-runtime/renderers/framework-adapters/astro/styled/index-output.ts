import path from "node:path";

import type { StyledOutputComponentGroup } from "../../../styled-output-model/index.js";
import { renderNamedExport, renderNamedImport } from "./formatting.js";
import { renderIdentifierObject } from "./render-tree.js";

export function renderIndex(group: StyledOutputComponentGroup, tsHeader: string): string {
  const componentImports = [...group.components]
    .sort((left, right) => left.exportName.localeCompare(right.exportName))
    .map(
      (component) =>
        `import ${component.exportName} from "./${path.basename(
          component.sourceFileName ?? `${component.exportName}.astro`,
          ".astro",
        )}.astro";`,
    )
    .join("\n");
  const variantNames = [
    ...group.variants.map((variant) => variant.name),
    ...(group.variantAliases ?? []).map((alias) => alias.name),
  ].sort();
  const variantImport =
    variantNames.length > 0 ? renderNamedImport(variantNames, "./variants") : "";
  const sortedConstants = [...group.constants].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const constants = sortedConstants
    .map((constant) => `const ${constant.name} = ${constant.value};`)
    .join("\n");
  const variantCollection =
    variantNames.length > 0 && group.variantCollectionName
      ? `const ${group.variantCollectionName} = ${renderIdentifierObject(
          Object.fromEntries(variantNames.map((variant) => [variant, variant])),
        )};`
      : "";
  const exports = [
    ...sortedConstants.map((constant) => constant.name),
    ...group.publicExports,
    ...(group.variantCollectionName && variantNames.length > 0
      ? [group.variantCollectionName]
      : []),
  ];

  const importBlock = [componentImports, variantImport].filter(Boolean).join("\n");
  const declarationBlock = [constants, variantCollection].filter(Boolean).join("\n");

  return `${tsHeader}${[importBlock, declarationBlock].filter(Boolean).join("\n\n")}

${renderNamedExport(exports)}

export default ${renderDefaultExport(group)};
`;
}

function renderDefaultExport(group: StyledOutputComponentGroup): string {
  if (group.defaultExport.mode === "component") {
    const defaultExport = group.defaultExport.members[0]?.localName;
    if (!defaultExport) {
      throw new Error(`Component default export requires a default export target.`);
    }

    return defaultExport;
  }

  return renderIdentifierObject(
    Object.fromEntries(
      group.defaultExport.members.map((member) => [member.exportName, member.localName]),
    ),
  );
}
