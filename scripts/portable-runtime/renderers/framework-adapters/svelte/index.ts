import { defineFrameworkAdapterTarget } from "../target-definition.js";
import type { FrameworkAdapterTargetRegistration } from "../types.js";
import { svelteFrameworkAdapter, svelteFrameworkAdapterReadiness } from "./adapter.js";
import {
  collectSvelteStyledPackageImportSources,
  formatSveltePrimitiveVendoringContent,
  projectSveltePrimitiveVendoringContent,
  sveltePrimitiveEditableContentMarkers,
  sveltePrimitiveForbiddenContent,
} from "./cli-registry.js";
import { projectSvelteColorPickerOutput } from "./color-picker.js";
import { projectSvelteControlledValuePresenceOutput } from "./controlled-value-presence.js";
import { SVELTE_PACKAGE_COMPONENTS } from "./inventory.js";
import { svelteManualPrimitiveGenerators } from "./manual-primitives.js";
import { writeSvelteAdapterOutput } from "./primitive-output-writer.js";
import { generateSveltePrimitivePackage } from "./primitive-package.js";
import { svelteAdapterPublicContract } from "./public-contract.js";
import { projectSvelteRepeatedDisclosureOutput } from "./repeated-disclosure.js";
import { projectSvelteSidebarOutput, writeSvelteSidebarRootExports } from "./sidebar.js";

import { projectSvelteStyledOutput, writeSvelteStyledOutput } from "./styled/writer.js";

const svelteFrameworkAdapterTargetDefinition = {
  adapter: svelteFrameworkAdapter,
  cliRegistry: {
    exactAdapterPackageVersion: true,
    packageMetadataSources: [
      "packages/svelte/package.json",
      "packages/runtime/package.json",
      "apps/svelte-demo/package.json",
    ],
    primitiveArtifact: {
      editableContentMarkers: sveltePrimitiveEditableContentMarkers,
      forbiddenContent: sveltePrimitiveForbiddenContent,
      formatContent: formatSveltePrimitiveVendoringContent,
      includeLocalImportGraph: true,
      outputDir: "svelte-primitives",
      projectContent: projectSveltePrimitiveVendoringContent,
      sourceRoot: "packages/svelte/src",
    },
    generatedImportCandidateExtensions: [".svelte", ".ts", ".js"],
    styledArtifact: {
      collectPackageImportSources: collectSvelteStyledPackageImportSources,
      outputDir: "svelte",
      primitiveOutputDir: "svelte-primitives",
    },
    setupPackageRequirements: [
      { name: "svelte", range: `>=${svelteAdapterPublicContract.framework.minimumVersion} <6` },
    ],
  },
  displayName: "Svelte",
  home: "scripts/portable-runtime/renderers/framework-adapters/svelte",
  packageName: "@starwind-ui/svelte",
  primitive: {
    async generatePackage(args) {
      await generateSveltePrimitivePackage(args);
      if (args.components.includes("sidebar")) await writeSvelteSidebarRootExports(args.outputRoot);
    },
    manualPrimitives: svelteManualPrimitiveGenerators,
    outputModel: {
      projectSpecialized: (model) =>
        projectSvelteSidebarOutput(
          projectSvelteColorPickerOutput(
            projectSvelteControlledValuePresenceOutput(
              projectSvelteRepeatedDisclosureOutput(model),
            ),
          ),
        ),
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
      components: SVELTE_PACKAGE_COMPONENTS,
      kind: "subset",
    },
  },
  publicSupport: svelteAdapterPublicContract.publicSupport,
  styled: { project: projectSvelteStyledOutput, write: writeSvelteStyledOutput },
  target: "svelte",
} as const satisfies FrameworkAdapterTargetRegistration<"svelte">;

export const svelteFrameworkAdapterTarget = defineFrameworkAdapterTarget(
  svelteFrameworkAdapterTargetDefinition,
) as FrameworkAdapterTargetRegistration<"svelte"> & {
  publicSupport: (typeof svelteFrameworkAdapterTargetDefinition)["publicSupport"];
};

export { SVELTE_PRIMITIVE_COMPONENTS, sveltePackageExports } from "./inventory.js";
export type { SvelteAdapterPublicContract } from "./public-contract.js";
export { svelteAdapterPublicContract } from "./public-contract.js";
export { svelteFrameworkAdapter, svelteFrameworkAdapterReadiness };
