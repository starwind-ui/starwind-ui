import type { StyledAdapterContract } from "../../../../contracts/styled/types.js";
import { isVueInventoryStyledComponent } from "../inventory.js";

export function supportsVueScope(scopes: readonly string[] | undefined): boolean {
  return !scopes || scopes.includes("vue");
}

export function isVueStyledCheckpointContract(contract: StyledAdapterContract): boolean {
  return isVueInventoryStyledComponent(contract.component) && supportsVueScope(contract.frameworks);
}
