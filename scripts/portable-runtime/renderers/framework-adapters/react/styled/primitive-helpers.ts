import type {
  StyledOutputComponent,
  StyledOutputPrimitiveNode,
  StyledOutputRenderNode,
} from '../../../styled-output-model/index.js';
import { collectStyledOutputPrimitiveReferences } from '../../../styled-output-model/index.js';
import { toPascalCase } from './formatting.js';

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
      ?.alias ??
    `${toPascalCase(primitiveComponent)}Primitive`;

  return configuredAlias === component.exportName ? `${configuredAlias}Primitive` : configuredAlias;
}

export function getPrimitiveAliasForNode(
  node: StyledOutputPrimitiveNode,
  primitiveAliases: Record<string, string>,
): string {
  return primitiveAliases[node.component] ?? `${toPascalCase(node.component)}Primitive`;
}
