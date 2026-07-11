const RUNTIME_PACKAGE = "@starwind-ui/runtime";
const RUNTIME_IMPORT_TYPE_PATTERN = /import\("@starwind-ui\/runtime(?<subpath>\/[^"]*)?"\)/g;
const RUNTIME_FROM_SOURCE_PATTERN = /from "@starwind-ui\/runtime(?<subpath>\/[^"]*)?"/g;

export type RuntimeImportRewriteContext = {
  primitiveImportBase?: string;
  rootImportSource?: string;
};

export function rewriteRuntimeImportSource(
  source: string,
  context: RuntimeImportRewriteContext,
): string {
  if (!context.primitiveImportBase) return source;

  if (source === RUNTIME_PACKAGE) {
    return context.rootImportSource ?? context.primitiveImportBase;
  }

  if (source.startsWith(`${RUNTIME_PACKAGE}/`)) {
    return `${context.primitiveImportBase}${source.slice(RUNTIME_PACKAGE.length)}`;
  }

  return source;
}

export function rewriteRuntimeImportReferences(
  source: string,
  context: RuntimeImportRewriteContext,
): string {
  if (!context.primitiveImportBase) return source;

  return rewriteRuntimeTypeImportReferences(source, context).replace(
    RUNTIME_FROM_SOURCE_PATTERN,
    (_match, subpath: string | undefined) => `from "${getFrameworkImportSource(subpath, context)}"`,
  );
}

export function rewriteRuntimeTypeImportReferences(
  source: string,
  context: RuntimeImportRewriteContext,
): string {
  if (!context.primitiveImportBase) return source;

  return source.replace(
    RUNTIME_IMPORT_TYPE_PATTERN,
    (_match, subpath: string | undefined) =>
      `import(${JSON.stringify(getFrameworkImportSource(subpath, context))})`,
  );
}

function getFrameworkImportSource(
  subpath: string | undefined,
  context: RuntimeImportRewriteContext,
): string {
  if (subpath) return `${context.primitiveImportBase}${subpath}`;

  return context.rootImportSource ?? context.primitiveImportBase!;
}
