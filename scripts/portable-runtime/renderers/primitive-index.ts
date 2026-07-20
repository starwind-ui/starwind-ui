import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getPrimitiveHelperExportNames,
  getPrimitivePackageExportNames,
  getPrimitiveRuntimeComponentNames,
  getPrimitiveRuntimeFacadeTypeNames,
  getPrimitiveRuntimeFacadeValueNames,
} from "./primitive-inventory.js";
import { writeGeneratedFile } from "./shared.js";

export const PRIMITIVE_COMPONENTS = getPrimitiveRuntimeComponentNames();
export const PRIMITIVE_HELPER_EXPORTS = getPrimitiveHelperExportNames();

export function renderPrimitiveIndex(
  tsHeader: string,
  components: readonly string[] = getPrimitivePackageExportNames(),
): string {
  const componentSet = new Set(components);
  const runtimeTypesExport = renderRuntimeTypesExport(getRootRuntimeTypeNames(componentSet));
  const exports = getPrimitivePackageExportNames()
    .filter((component) => componentSet.has(component))
    .map((component) => `export * from "./${component}";`);

  return `${tsHeader}${runtimeTypesExport}
${exports.join("\n")}
`;
}

export async function appendRuntimeTypeFacades(
  outputRoot: string,
  components: readonly string[] = PRIMITIVE_COMPONENTS,
): Promise<void> {
  const componentSet = new Set(components);
  await Promise.all(
    PRIMITIVE_COMPONENTS.filter((component) => componentSet.has(component)).map(
      async (component) => {
        const runtimeTypeNames = getPrimitiveRuntimeFacadeTypeNames(component);
        const runtimeValueNames = getPrimitiveRuntimeFacadeValueNames(component);
        if (runtimeTypeNames.length === 0 && runtimeValueNames.length === 0) return;

        const dir = path.join(outputRoot, component);
        const indexPath = path.join(dir, "index.ts");
        const contents = await readFile(indexPath, "utf8");
        const missingRuntimeValueNames = runtimeValueNames.filter(
          (name) => !containsExportedName(contents, name),
        );
        const missingRuntimeTypeNames = runtimeTypeNames.filter(
          (name) => !containsExportedName(contents, name),
        );

        if (missingRuntimeValueNames.length === 0 && missingRuntimeTypeNames.length === 0) {
          return;
        }

        const runtimeFacadeExports = [
          missingRuntimeValueNames.length > 0
            ? renderRuntimeValueExport(component, missingRuntimeValueNames)
            : undefined,
          missingRuntimeTypeNames.length > 0
            ? renderRuntimeTypesExport(missingRuntimeTypeNames)
            : undefined,
        ].filter((line): line is string => Boolean(line));
        const runtimeFacadeBlock = runtimeFacadeExports.join("\n");

        await writeGeneratedFile(
          dir,
          "index.ts",
          `${contents.trimEnd()}

${runtimeFacadeBlock}
`,
        );
      },
    ),
  );
}

function getRootRuntimeTypeNames(components: ReadonlySet<string>): string[] {
  return [
    ...new Set(
      PRIMITIVE_COMPONENTS.filter((component) => components.has(component)).flatMap(
        getPrimitiveRuntimeFacadeTypeNames,
      ),
    ),
  ].sort();
}

function renderRuntimeTypesExport(typeNames: string[]): string {
  if (typeNames.length === 0) return "";
  return `export type { ${typeNames.join(", ")} } from "@starwind-ui/runtime";`;
}

function renderRuntimeValueExport(component: string, valueNames: string[]): string {
  return `export { ${valueNames.join(", ")} } from "@starwind-ui/runtime/${component}";`;
}

function containsExportedName(contents: string, name: string): boolean {
  const exportBlocks = contents.matchAll(/\bexport\s+(?:type\s+)?\{([\s\S]*?)\}/g);

  for (const exportBlock of exportBlocks) {
    if (exportBlockIncludesName(exportBlock[1], name)) {
      return true;
    }
  }

  return false;
}

function exportBlockIncludesName(exportBlock: string, name: string): boolean {
  return exportBlock
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .split(",")
    .map((specifier) => parseExportedName(specifier.trim()))
    .includes(name);
}

function parseExportedName(specifier: string): string | undefined {
  const match = specifier.match(/^(?:type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
  if (!match) return undefined;

  return match[2] ?? match[1];
}
