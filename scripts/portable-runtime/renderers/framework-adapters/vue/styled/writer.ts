import path from "node:path";

import type { StyledAdapterContract } from "../../../../contracts/styled/types.js";
import { writeGeneratedFile } from "../../../shared.js";
import {
  projectStyledOutputModel,
  type StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { renderIndex } from "./index-output.js";
import { renderVueComponent } from "./render.js";
import { isVueStyledCheckpointContract } from "./scope.js";
import { renderVariants } from "./variants.js";

export type GenerateStarwindVueWrappersOptions = {
  contracts: StyledAdapterContract[];
  generatedBy: string;
  outputRoot: string;
  primitiveImportBase?: string;
  primitiveOutputRoot: string;
};

export async function generateStarwindVueWrappers({
  contracts,
  outputRoot,
  primitiveImportBase,
  primitiveOutputRoot,
}: GenerateStarwindVueWrappersOptions): Promise<void> {
  const outputModel = projectStyledOutputModel(contracts.filter(isVueStyledCheckpointContract));

  await Promise.all(
    outputModel.componentGroups.map((group) =>
      writeGroup(group, outputRoot, primitiveOutputRoot, primitiveImportBase),
    ),
  );
}

async function writeGroup(
  group: StyledOutputComponentGroup,
  outputRoot: string,
  primitiveOutputRoot: string,
  primitiveImportBase: string | undefined,
): Promise<void> {
  const directory = path.join(outputRoot, group.component);
  const writes: Array<Promise<void>> = [
    ...group.components.map((component) =>
      writeGeneratedFile(
        directory,
        `${component.exportName}.vue`,
        renderVueComponent(group, component, {
          directory,
          outputRoot,
          primitiveImportBase,
          primitiveOutputRoot,
        }),
      ),
    ),
    writeGeneratedFile(directory, "index.ts", renderIndex(group)),
  ];

  if (group.variants.length > 0 || (group.variantAliases?.length ?? 0) > 0) {
    writes.push(writeGeneratedFile(directory, "variants.ts", renderVariants(group)));
  }
  if (group.styles) {
    writes.push(
      writeGeneratedFile(
        directory,
        group.styles.sourceFileName ?? "styles.css",
        group.styles.content.join("\n"),
      ),
    );
  }

  await Promise.all(writes);
}
