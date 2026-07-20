import type { AdapterIndexFile, AdapterNamespaceExport, AdapterTypeFacadeFile } from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export type VueIndexPrintOptions = {
  partExportOrder?: "model" | "export-name";
  partExportSpacing?: "compact" | "separated";
};

export function printVueIndexFile(
  file: AdapterIndexFile,
  options: VueIndexPrintOptions = {},
): string {
  const namespace = file.exports.namespace;
  const valueMembers = file.exports.members.filter((member) => member.kind !== "type");
  const typeMembers = file.exports.members.filter((member) => member.kind === "type");
  const printedValueMembers =
    options.partExportOrder === "export-name"
      ? [...valueMembers].sort(compareExportMembers)
      : valueMembers;
  const imports = printedValueMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const namespaceMembers = getNamespaceMembers(
    file,
    valueMembers.map((member) => member.name),
  )
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const partExportSeparator = options.partExportSpacing === "separated" ? "\n\n" : "\n";
  const partExports = printedValueMembers
    .map((member) => `export { default as ${member.name} } from "${member.from}.vue";`)
    .join(partExportSeparator);

  return [
    `// ${NON_SHIPPING_COMMENT}`,
    imports,
    printVueIndexPrelude(file),
    `const ${namespace} = {\n${namespaceMembers}\n};`,
    `${partExports}\nexport { ${namespace} };`,
    `export default ${namespace};`,
    printVueIndexEpilogue(file),
    ...typeMembers.map((member) => `export type { ${member.name} } from "${member.from}";`),
    ...file.typeFacades.map((facade) => facade.body.code),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function compareExportMembers(
  left: AdapterNamespaceExport["members"][number],
  right: AdapterNamespaceExport["members"][number],
): number {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
}

export function printVueNamespaceExport(exportsModel: AdapterNamespaceExport): string {
  return exportsModel.members
    .map((member) => {
      const prefix = member.kind === "type" ? "export type" : "export";
      return `${prefix} { ${member.name} } from "${member.from}";`;
    })
    .join("\n");
}

export function printVueTypeFacadeFile(file: AdapterTypeFacadeFile): string {
  return file.typeFacades.map((facade) => facade.body.code).join("\n");
}

function getNamespaceKey(namespace: string, member: string): string {
  if (!member.startsWith(namespace) || member.length === namespace.length) {
    throw new TypeError(
      `Vue namespace ${namespace} cannot derive a property for export ${member}.`,
    );
  }

  return member.slice(namespace.length);
}

function getNamespaceMembers(
  file: AdapterIndexFile,
  valueExportNames: string[],
): Array<{ key: string; name: string }> {
  const projection = file.family as
    | { facts?: { index?: { namespaceMembers?: Array<{ key: string; name: string }> } } }
    | undefined;
  const projectedMembers = projection?.facts?.index?.namespaceMembers;
  if (!projectedMembers) {
    return valueExportNames.map((name) => ({
      key: getNamespaceKey(file.exports.namespace, name),
      name,
    }));
  }

  const exportedNames = new Set(valueExportNames);
  if (
    projectedMembers.length !== valueExportNames.length ||
    projectedMembers.some((member) => !exportedNames.has(member.name))
  ) {
    throw new TypeError(
      `Vue namespace ${file.exports.namespace} index facts do not match its value exports.`,
    );
  }

  return projectedMembers;
}

function printVueIndexPrelude(file: AdapterIndexFile): string {
  if (file.family?.kind !== "option-collection-overlay") return "";

  const facts = file.family.facts;
  return `export type {
  ${facts.context.rootContextValueType},
  ${facts.context.itemContextValueType},
} from "./${facts.exports.root}.vue";
export {
  ${facts.context.rootContext},
  ${facts.context.itemContext},
  ${facts.context.useRootContext},
  ${facts.context.useItemContext},
} from "./${facts.exports.root}.vue";`;
}

function printVueIndexEpilogue(file: AdapterIndexFile): string {
  if (file.family?.kind !== "option-collection-overlay") return "";

  const facts = file.family.facts;
  return `export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";`;
}
