import path from "node:path";
import { fileURLToPath } from "node:url";

import { starwindStyledContracts } from "./contracts/styled/starwind.js";
import type { StyledAdapterContract } from "./contracts/styled/types.js";
import { getPrimitiveFrameworkAdapterTarget } from "./renderers/framework-adapters/target-registry.js";

export const SVELTE_STYLED_OUTPUT_DIR = "apps/svelte-demo/src/lib/starwind-runtime";
export type GenerateSvelteStyledOptions = {
  repoRoot?: string;
  outputRoot?: string;
  roots?: readonly string[];
  contracts?: StyledAdapterContract[];
};

export async function generateSvelteStyled(
  options: GenerateSvelteStyledOptions = {},
): Promise<void> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const capability = getPrimitiveFrameworkAdapterTarget("svelte").styled;
  if (!capability) throw new Error("Svelte Styled capability is missing.");
  await capability.write({
    contracts: options.contracts ?? starwindStyledContracts,
    generatedBy: "scripts/portable-runtime/generate-svelte-styled.ts",
    outputRoot: options.outputRoot ?? path.join(repoRoot, SVELTE_STYLED_OUTPUT_DIR),
    primitiveImportBase: "@starwind-ui/svelte",
    primitiveOutputRoot: path.join(repoRoot, "packages/svelte/src"),
    roots: options.roots,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await generateSvelteStyled();
