import type {
  FrameworkAdapterExportPrinter,
  FrameworkAdapterRuntimeTypeReExportArgs,
} from "../export-printer.js";
import {
  type AdapterReExportFacts,
  type AdapterTypeFacadeFacts,
  createAdapterExportInventory,
  createRuntimeTypeExportFacts,
} from "../export-toolkit.js";
import type {
  AdapterIndexFile,
  AdapterNamespaceExport,
  AdapterTypeFacadeFile,
} from "../types.js";

function printIndexFileExports(file: AdapterIndexFile): string {
  const inventory = createAdapterExportInventory({
    namespaceExport: file.exports,
    typeFacades: file.typeFacades,
  });

  return [
    printImports(file.imports),
    ...inventory.namespace.members.map((member) =>
      member.mode === "type"
        ? `export { type ${member.name} } from "${member.from}";`
        : `export { default as ${member.name} } from "${member.from}.astro";`,
    ),
    ...printTypeFacadeExports(inventory.typeFacades),
  ]
    .filter(Boolean)
    .join("\n");
}

function printTypeFacadeFileExports(file: AdapterTypeFacadeFile): string {
  const inventory = createAdapterExportInventory({
    namespaceExport: file.exports,
    typeFacades: file.typeFacades,
  });

  return [
    printImports(file.imports),
    ...inventory.typeFacades.map((typeFacade) => typeFacade.body.code),
  ]
    .filter(Boolean)
    .join("\n");
}

function printRuntimeTypeReExport({
  names,
  source,
}: FrameworkAdapterRuntimeTypeReExportArgs): string {
  return printReExport(createRuntimeTypeExportFacts({ names, source }));
}

function printNamespaceExport(exportsModel: AdapterNamespaceExport): string {
  return createAdapterExportInventory({ namespaceExport: exportsModel }).namespace.members
    .map((member) => `export { ${member.mode === "type" ? "type " : ""}${member.name} } from "${member.from}";`)
    .join("\n");
}

export const exportPrinter = {
  printIndexFileExports,
  printNamespaceExport,
  printRuntimeTypeReExport,
  printTypeFacadeFileExports,
} satisfies FrameworkAdapterExportPrinter;

function printTypeFacadeExports(
  typeFacades: readonly AdapterTypeFacadeFacts[],
): string[] {
  return typeFacades.flatMap((typeFacade) =>
    typeFacade.exports.map((exportName) => `export type { ${exportName} };`),
  );
}

function printReExport(reExport: AdapterReExportFacts): string {
  const prefix = reExport.mode === "type" ? "export type" : "export";
  const oneLine = `${prefix} { ${reExport.names.join(", ")} } from "${reExport.source}";`;

  if (oneLine.length <= 100) return oneLine;

  return `${prefix} {\n${reExport.names.map((name) => `  ${name},`).join("\n")}\n} from "${reExport.source}";`;
}

function printImports(imports: AdapterIndexFile["imports"]): string {
  return imports.map((importModel) => printImport(importModel)).join("\n");
}

function printImport(importModel: AdapterIndexFile["imports"][number]): string {
  const keyword = importModel.kind === "type" ? "import type" : "import";
  const members = importModel.members
    .map((member) => (member.local ? `${member.imported} as ${member.local}` : member.imported))
    .join(", ");
  return `${keyword} { ${members} } from "${importModel.source}";`;
}
