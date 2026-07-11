import type {
  AdapterIndexFile,
  AdapterNamespaceExport,
  AdapterTypeFacadeFile,
} from "./types.js";

export type FrameworkAdapterRuntimeTypeReExportArgs = {
  names: readonly string[];
  source: string;
};

export type FrameworkAdapterExportPrinter = {
  printIndexFileExports(file: AdapterIndexFile): string;
  printNamespaceExport(exportsModel: AdapterNamespaceExport): string;
  printRuntimeTypeReExport(args: FrameworkAdapterRuntimeTypeReExportArgs): string;
  printTypeFacadeFileExports(file: AdapterTypeFacadeFile): string;
};
