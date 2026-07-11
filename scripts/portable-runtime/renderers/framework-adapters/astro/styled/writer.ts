import path from "node:path";

import type { StyledAdapterContract } from "../../../../contracts/styled/types.js";
import { writeGeneratedFile } from "../../../shared.js";
import {
  projectStyledOutputModel,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { ASTRO_FRAMEWORK } from "./constants.js";
import { isForFramework } from "./formatting.js";
import { renderComponentImports } from "./imports.js";
import { renderIndex } from "./index-output.js";
import { getAstroPrimitiveAliases, getRuntimeImportRewriteContext } from "./primitive-helpers.js";
import {
  renderClientScript,
  renderDestructure,
  renderProps,
  renderVariables,
} from "./props-client.js";
import { renderNodes } from "./render-tree.js";
import { renderVariants } from "./variants.js";

export type GenerateStarwindAstroWrappersOptions = {
  contracts: StyledAdapterContract[];
  generatedBy: string;
  outputRoot: string;
  primitiveImportBase?: string;
  primitiveOutputRoot: string;
};

export async function generateStarwindAstroWrappers({
  contracts,
  outputRoot,
  primitiveImportBase,
  primitiveOutputRoot,
}: GenerateStarwindAstroWrappersOptions): Promise<void> {
  const astroHeader = "---\n";
  const tsHeader = "";
  const targetContracts = contracts.filter((contract) => isForFramework(contract, ASTRO_FRAMEWORK));
  const outputModel = projectStyledOutputModel(targetContracts);

  await Promise.all(
    outputModel.componentGroups.map((group) =>
      generateStyledOutputComponentGroup(
        group,
        outputRoot,
        primitiveOutputRoot,
        primitiveImportBase,
        astroHeader,
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
  astroHeader: string,
  tsHeader: string,
): Promise<void> {
  const dir = path.join(outputRoot, group.component);
  const writes: Array<Promise<void>> = [
    ...group.components.map((component) =>
      writeGeneratedFile(
        dir,
        component.sourceFileName ?? `${component.exportName}.astro`,
        renderComponent(
          group,
          component,
          outputRoot,
          dir,
          primitiveOutputRoot,
          primitiveImportBase,
          astroHeader,
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
  astroHeader: string,
): string {
  const primitiveAliases = getAstroPrimitiveAliases(component);
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
  const props = renderProps(component.props, runtimeImportContext);
  const destructure = renderDestructure(component.destructure);
  const variables = renderVariables(component.variables ?? [], ASTRO_FRAMEWORK);
  const script = [imports, props, destructure, variables].filter(Boolean).join("\n\n");
  const renderedNodes = renderNodes(component.render, 0, primitiveAliases);
  const clientScript = renderClientScript(component, runtimeImportContext);

  return `${astroHeader}${script}
---

${renderedNodes}
${clientScript}
`;
}
