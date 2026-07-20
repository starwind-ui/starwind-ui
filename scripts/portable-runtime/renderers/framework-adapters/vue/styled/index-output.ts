import type { StyledOutputComponentGroup } from "../../../styled-output-model/index.js";

export function renderIndex(group: StyledOutputComponentGroup): string {
  const imports = [...group.components]
    .sort((left, right) => left.exportName.localeCompare(right.exportName))
    .map((component) => `import ${component.exportName} from "./${component.exportName}.vue";`)
    .join("\n");
  const variantNames = [
    ...group.variants.map((variant) => variant.name),
    ...(group.variantAliases ?? []).map((alias) => alias.name),
  ].sort();
  const variantImport = variantNames.length
    ? `import { ${variantNames.join(", ")} } from "./variants";`
    : "";
  const constants = [...group.constants]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((constant) => `const ${constant.name} = ${constant.value};`)
    .join("\n");
  const variantCollection =
    variantNames.length && group.variantCollectionName
      ? `const ${group.variantCollectionName} = { ${variantNames.join(", ")} };`
      : "";
  const namedExports = [
    ...group.constants.map((constant) => constant.name),
    ...group.publicExports,
    ...(variantCollection && group.variantCollectionName ? [group.variantCollectionName] : []),
  ].sort();
  const typeExports = [...group.components]
    .sort((left, right) => left.exportName.localeCompare(right.exportName))
    .map(
      (component) =>
        `export type { ${component.exportName}Props } from "./${component.exportName}.vue";`,
    )
    .join("\n");
  const defaultExport =
    group.defaultExport.mode === "component"
      ? group.defaultExport.members[0]?.localName
      : `{ ${group.defaultExport.members
          .map((member) =>
            member.exportName === member.localName
              ? member.exportName
              : `${member.exportName}: ${member.localName}`,
          )
          .join(", ")} }`;

  return `${[imports, variantImport].filter(Boolean).join("\n")}\n\n${typeExports}\n\n${[
    constants,
    variantCollection,
  ]
    .filter(Boolean)
    .join("\n\n")}\n\nexport { ${namedExports.join(", ")} };\n\nexport default ${defaultExport};\n`;
}
