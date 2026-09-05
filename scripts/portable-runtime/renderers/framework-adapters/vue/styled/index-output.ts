import path from "node:path";
import { getRelativeImportPath } from "../../../shared.js";
import {
  assertStyledPartsIdentifier,
  getStyledPartsIdentifier,
  type StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";

export type RenderVueStyledIndexOptions = {
  directory: string;
  primitiveImportBase?: string;
  primitiveOutputRoot: string;
};

export function renderIndex(
  group: StyledOutputComponentGroup,
  options?: RenderVueStyledIndexOptions,
): string {
  assertStyledPartsIdentifier(group);
  const importedComponentNames = new Set([
    ...group.publicExports,
    ...group.defaultExport.members.map((member) => member.localName),
  ]);
  const imports = [...group.components]
    .filter((component) => importedComponentNames.has(component.exportName))
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
  const partsDeclaration =
    group.defaultExport.mode === "parts"
      ? `const ${getStyledPartsIdentifier(group)} = { ${group.defaultExport.members
          .map((member) =>
            member.exportName === member.localName
              ? member.exportName
              : `${member.exportName}: ${member.localName}`,
          )
          .join(", ")} };`
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
      : getStyledPartsIdentifier(group);
  const primitiveFacadeExports = renderPrimitiveFacadeExports(group, options);

  return `${[imports, variantImport].filter(Boolean).join("\n")}\n\n${typeExports}\n\n${[
    constants,
    variantCollection,
    partsDeclaration,
  ]
    .filter(Boolean)
    .join(
      "\n\n",
    )}\n\n${primitiveFacadeExports ? `${primitiveFacadeExports}\n\n` : ""}export { ${namedExports.join(", ")} };\n\nexport default ${defaultExport};\n`;
}

function renderPrimitiveFacadeExports(
  group: StyledOutputComponentGroup,
  options: RenderVueStyledIndexOptions | undefined,
): string {
  const facade = group.primitiveFacadeExports;
  if (!facade) return "";
  if (!options) throw new Error("Primitive facade exports require styled index source options.");

  const source = options.primitiveImportBase
    ? `${options.primitiveImportBase}/${facade.component}`
    : getRelativeImportPath(
        options.directory,
        path.join(options.primitiveOutputRoot, facade.component),
      );
  const valueNames = [...facade.values].sort();
  const valueNameSet = new Set(valueNames);
  const typeNames = [...facade.types].filter((name) => !valueNameSet.has(name)).sort();

  return [
    valueNames.length ? `export { ${valueNames.join(", ")} } from ${JSON.stringify(source)};` : "",
    typeNames.length
      ? `export type { ${typeNames.join(", ")} } from ${JSON.stringify(source)};`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
