import type { StyledAdapterContract } from "../../../../contracts/styled/types.js";
import {
  analyzeStyledOutputGroup,
  projectStyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { vueStyledComponents } from "../inventory.js";

export function supportsVueScope(scopes: readonly string[] | undefined): boolean {
  return !scopes || scopes.includes("vue");
}

export function selectVueStyledContracts(
  contracts: readonly StyledAdapterContract[],
  roots: readonly string[] = vueStyledComponents.filter((root) =>
    contracts.some(
      (contract) => contract.component === root && supportsVueScope(contract.frameworks),
    ),
  ),
): StyledAdapterContract[] {
  const contractsByComponent = new Map<string, StyledAdapterContract>();

  for (const contract of contracts) {
    if (contractsByComponent.has(contract.component)) {
      throw new TypeError(`Duplicate Vue Styled contract "${contract.component}".`);
    }
    contractsByComponent.set(contract.component, contract);
  }

  const pending = [...new Set(roots)].sort();
  const selected = new Set<string>();

  for (const root of pending) {
    if (!contractsByComponent.has(root)) {
      throw new TypeError(`Unknown Vue Styled group "${root}".`);
    }
  }

  while (pending.length > 0) {
    const component = pending.shift();
    if (!component || selected.has(component)) continue;

    const contract = contractsByComponent.get(component);
    if (!contract || !supportsVueScope(contract.frameworks)) {
      throw new TypeError(`Missing Vue Styled dependency "${component}".`);
    }
    selected.add(component);

    const dependencies = analyzeStyledOutputGroup(projectStyledOutputComponentGroup(contract), {
      target: "vue",
    }).dependencies.styledComponents;

    for (const dependency of dependencies) {
      const dependencyContract = contractsByComponent.get(dependency);
      if (!dependencyContract || !supportsVueScope(dependencyContract.frameworks)) {
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
