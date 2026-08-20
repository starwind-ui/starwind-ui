import path from "node:path";

import type { StyledAdapterContract } from "../../../../contracts/styled/types.js";
import { writeGeneratedFile } from "../../../shared.js";
import {
  projectStyledOutputModel,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
  type StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { REACT_FRAMEWORK } from "./constants.js";
import { isForFramework } from "./formatting.js";
import { renderComponentImports } from "./imports.js";
import { renderIndex } from "./index-output.js";
import { getReactPrimitiveAliases } from "./primitive-helpers.js";
import {
  getRuntimeImportRewriteContext,
  renderComponentBody,
  renderProps,
} from "./props-client.js";
import { renderVariants } from "./variants.js";

export type GenerateStarwindReactWrappersOptions = {
  contracts: StyledAdapterContract[];
  generatedBy: string;
  outputRoot: string;
  primitiveImportBase?: string;
  primitiveOutputRoot: string;
};

export async function generateStarwindReactWrappers({
  contracts,
  outputRoot,
  primitiveImportBase,
  primitiveOutputRoot,
}: GenerateStarwindReactWrappersOptions): Promise<void> {
  const targetContracts = contracts.filter((contract) => isForFramework(contract, REACT_FRAMEWORK));
  const outputModel = projectStyledOutputModel(targetContracts);

  await Promise.all(
    outputModel.componentGroups.map((group) =>
      generateStyledOutputComponentGroup(
        group,
        outputRoot,
        primitiveOutputRoot,
        primitiveImportBase,
      ),
    ),
  );
}

// Component group writing.
async function generateStyledOutputComponentGroup(
  group: StyledOutputComponentGroup,
  outputRoot: string,
  primitiveOutputRoot: string,
  primitiveImportBase: string | undefined,
): Promise<void> {
  const dir = path.join(outputRoot, group.component);
  const clientHeader = '"use client";\n\n';
  const groupHasClientComponent = group.components.some(isReactStyledClientComponent);
  const writes: Array<Promise<void>> = [
    ...group.components.map((component) =>
      writeGeneratedFile(
        dir,
        component.sourceFileName?.replace(/\.astro$/, ".tsx") ?? `${component.exportName}.tsx`,
        renderComponent(
          group,
          component,
          outputRoot,
          dir,
          primitiveOutputRoot,
          primitiveImportBase,
          isReactStyledClientComponent(component) ? clientHeader : "",
        ),
      ),
    ),
    writeGeneratedFile(
      dir,
      "index.ts",
      renderIndex(group, groupHasClientComponent ? clientHeader : "", {
        directory: dir,
        primitiveImportBase,
        primitiveOutputRoot,
      }),
    ),
  ];

  if (group.variants.length > 0 || (group.variantAliases ?? []).length > 0) {
    writes.push(writeGeneratedFile(dir, "variants.ts", renderVariants(group, "")));
  }

  if (group.styles) {
    writes.push(
      writeGeneratedFile(
        dir,
        group.styles.sourceFileName ?? "styles.css",
        `${group.styles.content.map((line) => line.trimEnd()).join("\n")}\n`,
      ),
    );
  }

  await Promise.all(writes);
}

function isReactStyledClientComponent(component: StyledOutputComponent): boolean {
  return Object.keys(getReactPrimitiveAliases(component)).length > 0;
}

function renderComponent(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  outputRoot: string,
  dir: string,
  primitiveOutputRoot: string,
  primitiveImportBase: string | undefined,
  tsHeader: string,
): string {
  const forwardRef =
    component.forwardRef && isForFramework(component.forwardRef, REACT_FRAMEWORK)
      ? component.forwardRef
      : undefined;
  const renderedComponent = forwardRef ? projectForwardedRef(component) : component;
  const primitiveAliases = getReactPrimitiveAliases(renderedComponent);
  const runtimeImportContext = getRuntimeImportRewriteContext(
    renderedComponent,
    primitiveImportBase,
  );
  const props = renderProps(renderedComponent, runtimeImportContext);
  const componentBody = renderComponentBody(
    renderedComponent,
    primitiveAliases,
    runtimeImportContext,
  );
  const imports = renderComponentImports(
    group,
    renderedComponent,
    outputRoot,
    dir,
    primitiveOutputRoot,
    primitiveImportBase,
    runtimeImportContext,
    Boolean(component.forwardRef) || /\bReact\./.test(`${props}\n${componentBody}`),
  );

  if (forwardRef) {
    return `${tsHeader}${imports}

${props}

const ${component.exportName} = React.forwardRef<${forwardRef.targetType}, ${component.exportName}Props>(
  function ${component.exportName}(props, forwardedRef) {
${componentBody
  .split("\n")
  .map((line) => (line ? `  ${line}` : line))
  .join("\n")}
  },
);

${component.exportName}.displayName = "${component.exportName}";

export default ${component.exportName};
`;
  }

  return `${tsHeader}${imports}

${props}

function ${component.exportName}(props: ${component.exportName}Props) {
${componentBody}
}

export default ${component.exportName};
`;
}

function projectForwardedRef(component: StyledOutputComponent): StyledOutputComponent {
  const projected = structuredClone(component);
  if (projected.destructure) {
    projected.destructure.props = projected.destructure.props.filter(({ name }) => name !== "ref");
  }
  projectForwardedRefNodes(projected.render);
  return projected;
}

function projectForwardedRefNodes(nodes: StyledOutputRenderNode[]): void {
  for (const node of nodes) {
    if ("attrs" in node) {
      node.attrs = node.attrs.map((attribute) =>
        attribute.name === "ref" &&
        attribute.value?.type === "variable" &&
        attribute.value.name === "ref"
          ? { ...attribute, value: { type: "variable", name: "forwardedRef" } }
          : attribute,
      );
    }
    if ("children" in node) projectForwardedRefNodes(node.children);
    if (node.type === "condition") {
      projectForwardedRefNodes(node.then);
      projectForwardedRefNodes(node.else);
    }
    if (node.type === "slot") projectForwardedRefNodes(node.fallback);
  }
}
