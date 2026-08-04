import { defineFrameworkAdapterTarget } from "../target-definition.js";
import type { FrameworkAdapterTargetRegistration } from "../types.js";
import { svelteFrameworkAdapter, svelteFrameworkAdapterReadiness } from "./adapter.js";
import { SVELTE_PRIMITIVE_COMPONENTS } from "./inventory.js";
import { generateSveltePrimitivePackage } from "./primitive-package.js";
import { writeSvelteAdapterOutput } from "./primitive-output-writer.js";
import { svelteAdapterPublicContract } from "./public-contract.js";
import { projectSvelteRepeatedDisclosureOutput } from "./repeated-disclosure.js";

const svelteFrameworkAdapterTargetDefinition = {
  adapter: svelteFrameworkAdapter,
  cliRegistry: {
    generatedImportCandidateExtensions: [".svelte", ".ts", ".js"],
    styledArtifact: {
      outputDir: "svelte",
      primitiveOutputDir: "svelte-primitives",
    },
    setupPackageRequirements: [],
  },
  displayName: "Svelte",
  home: "scripts/portable-runtime/renderers/framework-adapters/svelte",
  packageName: "@starwind-ui/svelte",
  primitive: {
    generatePackage: generateSveltePrimitivePackage,
    outputModel: {
      projectSpecialized: projectSvelteRepeatedDisclosureOutput,
      write(args) {
        return writeSvelteAdapterOutput({
          componentHeader: args.componentHeader ?? "",
          componentName: args.componentName,
          moduleHeader: args.moduleHeader,
          outputModel: args.outputModel,
          outputRoot: args.outputRoot,
        });
      },
    },
    support: {
      components: SVELTE_PRIMITIVE_COMPONENTS,
      kind: "subset",
    },
  },
  publicSupport: svelteAdapterPublicContract.publicSupport,
  target: "svelte",
} as const satisfies FrameworkAdapterTargetRegistration<"svelte">;

export const svelteFrameworkAdapterTarget = defineFrameworkAdapterTarget(
  svelteFrameworkAdapterTargetDefinition,
) as FrameworkAdapterTargetRegistration<"svelte"> & {
  publicSupport: (typeof svelteFrameworkAdapterTargetDefinition)["publicSupport"];
};

export { svelteFrameworkAdapter, svelteFrameworkAdapterReadiness };
export { SVELTE_PRIMITIVE_COMPONENTS, sveltePackageExports } from "./inventory.js";
export { svelteAdapterPublicContract } from "./public-contract.js";
export type { SvelteAdapterPublicContract } from "./public-contract.js";
