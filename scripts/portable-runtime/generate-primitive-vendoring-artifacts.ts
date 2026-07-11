import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildPrimitiveVendoringArtifacts } from "./generate-cli-registry.js";

export const DEFAULT_PRIMITIVE_VENDORED_ARTIFACTS_OUTPUT =
  "packages/cli/src/registry/primitive-vendoring-artifacts.json";

export async function writePrimitiveVendoringArtifacts(
  outputPath = DEFAULT_PRIMITIVE_VENDORED_ARTIFACTS_OUTPUT,
): Promise<void> {
  const artifacts = await buildPrimitiveVendoringArtifacts();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(artifacts, null, 2)}\n`, "utf8");
}

if (isDirectExecution()) {
  await writePrimitiveVendoringArtifacts(getArgValue("--out"));
}

function getArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;

  return process.argv[index + 1];
}

function isDirectExecution(): boolean {
  return (
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}
