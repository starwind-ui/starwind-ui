import path from "node:path";

import type { StyledAdapterContract } from "../../../../contracts/styled/types.js";
import { writeGeneratedFile } from "../../../shared.js";
import {
  projectStyledOutputModel,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
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
  const tsHeader = "";
  const targetContracts = contracts.filter((contract) => isForFramework(contract, REACT_FRAMEWORK));
  const outputModel = projectStyledOutputModel(targetContracts);

  await Promise.all(
    outputModel.componentGroups.map((group) =>
      generateStyledOutputComponentGroup(
        group,
        outputRoot,
        primitiveOutputRoot,
        primitiveImportBase,
        tsHeader,
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
  tsHeader: string,
): Promise<void> {
  const dir = path.join(outputRoot, group.component);
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
          tsHeader,
        ),
      ),
    ),
    writeGeneratedFile(dir, "index.ts", renderIndex(group, tsHeader)),
  ];

  if (group.variants.length > 0 || (group.variantAliases ?? []).length > 0) {
    writes.push(writeGeneratedFile(dir, "variants.ts", renderVariants(group, tsHeader)));
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

function renderComponent(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  outputRoot: string,
  dir: string,
  primitiveOutputRoot: string,
  primitiveImportBase: string | undefined,
  tsHeader: string,
): string {
  const primitiveAliases = getReactPrimitiveAliases(component);
  const runtimeImportContext = getRuntimeImportRewriteContext(component, primitiveImportBase);
  const imports = renderComponentImports(
    group,
    component,
    outputRoot,
    dir,
    primitiveOutputRoot,
    primitiveImportBase,
    runtimeImportContext,
  );
  const props = renderProps(component, runtimeImportContext);
  const componentBody = renderComponentBody(component, primitiveAliases, runtimeImportContext);

  return `${tsHeader}${imports}

${props}

function ${component.exportName}(props: ${component.exportName}Props) {
${componentBody}
}

export default ${component.exportName};
`;
}
