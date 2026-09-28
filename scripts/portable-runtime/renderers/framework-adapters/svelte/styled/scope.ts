import type { StyledAdapterContract } from "../../../../contracts/styled/types.js";
import {
  analyzeStyledOutputGroup,
  projectStyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { getImplementedSvelteStyledRoots } from "../inventory.js";

export function supportsSvelteScope(scopes: readonly string[] | undefined): boolean {
  return scopes === undefined || scopes.includes("svelte");
}

/** The explicit supported inventory argument lets scope tests use synthetic dependency graphs. */
export function selectSvelteStyledContracts(
  contracts: readonly StyledAdapterContract[],
  roots: readonly string[] = getImplementedSvelteStyledRoots(),
  supportedComponents: readonly string[] = getImplementedSvelteStyledRoots(),
): StyledAdapterContract[] {
  const byComponent = new Map<string, StyledAdapterContract>();
  for (const contract of contracts) {
    if (byComponent.has(contract.component)) {
      throw new TypeError(`Svelte Styled scope: duplicate contract "${contract.component}".`);
    }
    byComponent.set(contract.component, contract);
  }
  const selected = new Set<string>();
  const pending = [...roots].sort();
  if (new Set(roots).size !== roots.length) {
    throw new TypeError(`Svelte Styled scope: duplicate root in ${JSON.stringify(roots)}.`);
  }
  const requireContract = (component: string, parent?: string) => {
    const label = parent
      ? `dependency "${component}" required by "${parent}"`
      : `root "${component}"`;
    const contract = byComponent.get(component);
    if (!contract) throw new TypeError(`Svelte Styled scope: unknown or missing ${label}.`);
    if (!supportsSvelteScope(contract.frameworks)) {
      throw new TypeError(`Svelte Styled scope: unsupported target scope for ${label}.`);
    }
    if (!supportedComponents.includes(component)) {
      throw new TypeError(`Svelte Styled scope: ${label} has no implemented output owner.`);
    }
    return contract;
  };
  for (const root of roots) requireContract(root);
  while (pending.length > 0) {
    const component = pending.shift()!;
    if (selected.has(component)) continue;
    const contract = requireContract(component);
    selected.add(component);
    const dependencies = analyzeStyledOutputGroup(projectStyledOutputComponentGroup(contract), {
      target: "svelte",
    }).dependencies.styledComponents;
    for (const dependency of dependencies) {
      requireContract(dependency, component);
      if (!selected.has(dependency) && !pending.includes(dependency)) pending.push(dependency);
    }
    pending.sort();
  }
  return [...selected].sort().map((component) => byComponent.get(component)!);
}
