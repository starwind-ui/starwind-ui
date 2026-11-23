export type PackageDocsBudget = { readonly maxGzipBytes: number; readonly maxRawBytes: number };

export type PackedDocsReport = {
  readonly archiveBytes: number;
  readonly budget: PackageDocsBudget;
  readonly docs: readonly string[];
  readonly docsFileCount: number;
  readonly docsGzipBytes: number;
  readonly docsRawBytes: number;
  readonly failures: readonly string[];
};

export declare const PACKAGE_DOCS_BUDGET: PackageDocsBudget;

export declare function measurePackedDocs(options: {
  readonly archiveBytes: number;
  readonly contents: ReadonlyMap<string, Uint8Array>;
  readonly budget?: PackageDocsBudget;
}): PackedDocsReport;

export declare function formatPackedDocsReport(name: string, report: PackedDocsReport): string;

export declare function verifyPackedPackageDocs(options: {
  readonly archive: string;
  readonly name: string;
  readonly version: string;
  readonly budget?: PackageDocsBudget;
}): PackedDocsReport;
