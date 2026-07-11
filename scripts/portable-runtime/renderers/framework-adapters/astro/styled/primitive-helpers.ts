import type {
  StyledOutputComponent,
  StyledOutputPrimitiveNode,
  StyledOutputRenderNode,
} from '../../../styled-output-model/index.js';
import { collectStyledOutputPrimitiveReferences } from '../../../styled-output-model/index.js';
import type { RuntimeImportRewriteContext } from '../../../styled-runtime-imports.js';
import { toPascalCase } from './formatting.js';

export function collectPrimitiveComponents(nodes: StyledOutputRenderNode[]): string[] {
  return collectStyledOutputPrimitiveReferences(nodes);
}

export function getAstroPrimitiveAliases(component: StyledOutputComponent): Record<string, string> {
  return Object.fromEntries(
    collectPrimitiveComponents(component.render).map((primitiveComponent) => [
      primitiveComponent,
      getPrimitiveAlias(component, primitiveComponent),
    ]),
  );
}

export function getRuntimeImportRewriteContext(
  component: StyledOutputComponent,
  primitiveImportBase: string | undefined,
): RuntimeImportRewriteContext {
  const primitiveComponents = collectPrimitiveComponents(component.render);

  return {
    primitiveImportBase,
    rootImportSource:
      primitiveImportBase && primitiveComponents.length === 1
        ? `${primitiveImportBase}/${primitiveComponents[0]}`
        : primitiveImportBase,
  };
}

function getPrimitiveAlias(component: StyledOutputComponent, primitiveComponent: string): string {
  const alias =
    component.primitiveAliases.find((candidate) => candidate.component === primitiveComponent)
      ?.alias ??
    `${toPascalCase(primitiveComponent)}Primitive`;

  return alias === component.exportName ? `${alias}Primitive` : alias;
}

export function getPrimitiveAliasForNode(
  node: StyledOutputPrimitiveNode,
  primitiveAliases: Record<string, string>,
): string {
  return primitiveAliases[node.component] ?? `${toPascalCase(node.component)}Primitive`;
}
