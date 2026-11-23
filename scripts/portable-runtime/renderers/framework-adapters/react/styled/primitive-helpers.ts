import { getPrimitiveInventoryEntry } from "../../../primitive-inventory.js";
import type {
  StyledOutputAttribute,
  StyledOutputComponent,
  StyledOutputPrimitiveNode,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { collectStyledOutputPrimitiveReferences } from "../../../styled-output-model/index.js";
import { normalizeReactClassHookName } from "../../future-readiness.js";
import { toPascalCase } from "./formatting.js";

export function collectPrimitiveComponents(nodes: StyledOutputRenderNode[]): string[] {
  return collectStyledOutputPrimitiveReferences(nodes);
}

export function getReactPrimitiveAliases(component: StyledOutputComponent): Record<string, string> {
  return Object.fromEntries(
    collectPrimitiveComponents(component.render).map((primitiveComponent) => [
      primitiveComponent,
      getPrimitiveAlias(component, primitiveComponent),
    ]),
  );
}

function getPrimitiveAlias(component: StyledOutputComponent, primitiveComponent: string): string {
  const configuredAlias =
    component.primitiveAliases.find((candidate) => candidate.component === primitiveComponent)
      ?.alias ?? `${toPascalCase(primitiveComponent)}Primitive`;

  return configuredAlias === component.exportName ? `${configuredAlias}Primitive` : configuredAlias;
}

export function getPrimitiveAliasForNode(
  node: StyledOutputPrimitiveNode,
  primitiveAliases: Record<string, string>,
): string {
  return primitiveAliases[node.component] ?? `${toPascalCase(node.component)}Primitive`;
}

/** Renames the class hooks that the Primitive contract declares for the part, as React names them. */
export function mapPrimitiveClassHooks(node: StyledOutputPrimitiveNode): StyledOutputAttribute[] {
  const entry = getPrimitiveInventoryEntry(node.component);
  const contract = entry?.kind === "runtime-adapter-contract" ? entry.contract : undefined;
  const part = contract?.parts.find(
    (candidate) => candidate.name.toLowerCase() === node.part.toLowerCase(),
  );
  const hooks = new Set(
    (contract?.props ?? [])
      .filter((prop) => prop.classHook && part && prop.targets?.includes(part.name))
      .map((prop) => prop.name),
  );
  return (node.attrs ?? []).map((attr) =>
    hooks.has(attr.name) ? { ...attr, name: normalizeReactClassHookName(attr.name) } : attr,
  );
}
