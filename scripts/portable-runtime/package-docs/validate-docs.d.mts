export declare const PACKAGE_DOCS_DIRECTORY: "docs";
export declare const PACKAGE_DOCS_ENTRY_FILES: readonly string[];
export declare const STARWIND_SITE_ORIGIN: "https://starwind.dev";

export declare function absolutizeSiteLinks(contents: string): string;

export declare function compareCodeUnits(left: string, right: string): number;

export declare function findBrokenPackageDocsLinks(files: ReadonlyMap<string, string>): string[];

export declare function findSiteRelativePackageDocsLinks(
  files: ReadonlyMap<string, string>,
): string[];

export declare function validatePackageDocs(options: {
  readonly files: ReadonlyMap<string, string>;
  readonly name: string;
  readonly version: string;
}): string[];
