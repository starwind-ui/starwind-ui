import path from "node:path";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { formatGeneratedOutput } from "../../format-generated-output.js";
import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";
import { selectVueStyledContracts } from "../../renderers/framework-adapters/vue/styled.js";

type GenerateSelectedVueStyledGroupsOptions = {
  format?: boolean;
  groups: readonly string[];
  outputDir: string;
  repoRoot: string;
};

export async function generateSelectedVueStyledGroups({
  format = false,
  groups,
  outputDir,
  repoRoot,
}: GenerateSelectedVueStyledGroupsOptions): Promise<string> {
  const contracts = resolveSelectedVueStyledContracts(groups);
  const selectedGroups = contracts.map((contract) => contract.component);
  const outputRoot = path.join(repoRoot, outputDir);

  await generateStarwindVueWrappers({ contracts, outputDir, repoRoot, roots: groups });
  if (format) {
    await formatGeneratedOutput(
      selectedGroups.map((group) => path.join(outputRoot, group)),
      process.cwd(),
    );
  }

  return outputRoot;
}

function resolveSelectedVueStyledContracts(groups: readonly string[]): StyledAdapterContract[] {
  return selectVueStyledContracts(starwindStyledContracts, groups);
}
