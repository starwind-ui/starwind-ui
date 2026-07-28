import path from "node:path";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { formatGeneratedOutput } from "../../format-generated-output.js";
import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";
import {
  analyzeStyledOutputGroup,
  projectStyledOutputComponentGroup,
} from "../../renderers/styled-output-model/index.js";

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

  await generateStarwindVueWrappers({ contracts, outputDir, repoRoot });
  if (format) {
    await formatGeneratedOutput(
      selectedGroups.map((group) => path.join(outputRoot, group)),
      process.cwd(),
    );
  }

  return outputRoot;
}

function resolveSelectedVueStyledContracts(groups: readonly string[]): StyledAdapterContract[] {
  const contractsByComponent = new Map(
    starwindStyledContracts.map((contract) => [contract.component, contract]),
  );
  const pending = [...new Set(groups)].sort();
  const selected = new Set<string>();

  for (const group of pending) {
    if (!contractsByComponent.has(group)) {
      throw new TypeError(`Unknown Vue Styled group "${group}".`);
    }
  }

  while (pending.length > 0) {
    const component = pending.shift();
    if (!component || selected.has(component)) continue;
    const contract = contractsByComponent.get(component);
    if (!contract) {
      throw new TypeError(`Missing Vue Styled dependency "${component}".`);
    }
    selected.add(component);

    const dependencies = analyzeStyledOutputGroup(projectStyledOutputComponentGroup(contract), {
      target: "vue",
    }).dependencies.styledComponents;
    for (const dependency of dependencies) {
      if (!contractsByComponent.has(dependency)) {
        throw new TypeError(
          `Missing Vue Styled dependency "${dependency}" required by "${component}".`,
        );
      }
      if (!selected.has(dependency) && !pending.includes(dependency)) {
        pending.push(dependency);
      }
    }
    pending.sort();
  }

  return [...selected].sort().map((component) => {
    const contract = contractsByComponent.get(component);
    if (!contract) {
      throw new TypeError(`Missing Vue Styled dependency "${component}".`);
    }
    return contract;
  });
}
