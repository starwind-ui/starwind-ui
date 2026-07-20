import { readdir } from "node:fs/promises";
import path from "node:path";

import { projectStyledOutputModel } from "../../styled-output-model/index.js";
import { defineFrameworkAdapterTarget } from "../target-definition.js";
import { vueFrameworkAdapter, vueFrameworkAdapterReadiness } from "./adapter.js";
import { generateVuePrimitivePackage } from "./primitive-package.js";
import { writeVueAdapterOutput } from "./primitive-output-writer.js";
import { vueManualPrimitiveGenerators } from "./manual-primitives.js";
import { projectVueSpecializedAdapterOutputModel } from "./specialized-adapter-spec.js";
import { vueAdapterPublicContract } from "./public-contract.js";
import type { FrameworkAdapterTargetRegistration } from "../types.js";
import { generateStarwindVueWrappers, isVueStyledCheckpointContract } from "./styled.js";
import {
  assertVueInventorySnapshot,
  vuePackageExports,
  vuePrimitiveComponents,
} from "./inventory.js";

async function generateValidatedVuePrimitivePackage(
  args: Parameters<typeof generateVuePrimitivePackage>[0],
): Promise<void> {
  await generateVuePrimitivePackage(args);
  assertVueInventorySnapshot({
    packageExports: vuePackageExports,
    sourceFiles: await readGeneratedFiles(args.outputRoot),
  });
}

async function readGeneratedFiles(directory: string, root: string = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return readGeneratedFiles(candidate, root);
      return entry.isFile() ? [path.relative(root, candidate).replaceAll("\\", "/")] : [];
    }),
  );
  return files.flat().sort();
}

const vueFrameworkAdapterTargetDefinition = {
  adapter: vueFrameworkAdapter,
  cliRegistry: {
    generatedImportCandidateExtensions: [".vue", ".ts", ".js"],
    styledArtifact: {
      outputDir: "vue",
      primitiveOutputDir: "vue-primitives",
    },
  },
  displayName: "Vue",
  home: "scripts/portable-runtime/renderers/framework-adapters/vue",
  packageName: "@starwind-ui/vue",
  primitive: {
    generatePackage: generateValidatedVuePrimitivePackage,
    manualPrimitives: vueManualPrimitiveGenerators,
    outputModel: {
      capabilities: {},
      projectSpecialized: projectVueSpecializedAdapterOutputModel,
      write(args) {
        return writeVueAdapterOutput({
          componentHeader: args.componentHeader ?? "",
          componentName: args.componentName,
          moduleHeader: args.moduleHeader,
          outputModel: args.outputModel,
          outputRoot: args.outputRoot,
        });
      },
    },
    support: {
      components: vuePrimitiveComponents,
      kind: "subset",
    },
  },
  publicSupport: vueAdapterPublicContract.publicSupport,
  styled: {
    project(args) {
      return projectStyledOutputModel(args.contracts.filter(isVueStyledCheckpointContract));
    },
    write(args) {
      return generateStarwindVueWrappers(args);
    },
  },
  target: "vue",
} as const satisfies FrameworkAdapterTargetRegistration<"vue">;

export const vueFrameworkAdapterTarget = defineFrameworkAdapterTarget(
  vueFrameworkAdapterTargetDefinition,
) as FrameworkAdapterTargetRegistration<"vue"> & {
  publicSupport: (typeof vueFrameworkAdapterTargetDefinition)["publicSupport"];
};

export { vueFrameworkAdapter, vueFrameworkAdapterReadiness };
export { vueFutureFrameworkTracer } from "./future-framework-tracer.js";
export {
  projectVueDetailedEvent,
  projectVueModel,
  vueAdapterPublicContract,
} from "./public-contract.js";
export type {
  VueAdapterPublicContract,
  VueDetailedEventProjection,
  VueModelProjection,
} from "./public-contract.js";
