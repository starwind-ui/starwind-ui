import { projectStyledOutputModel } from "../../styled-output-model/index.js";
import { defineFrameworkAdapterTarget } from "../target-definition.js";
import { astroFrameworkAdapter } from "./adapter.js";
import { astroManualPrimitiveGenerators } from "./manual-primitives.js";
import { writeAstroAdapterOutput } from "./primitive-output-writer.js";
import { generateAstroPrimitivePackage } from "./primitive-package.js";
import { projectSpecializedAdapterOutputModel } from "./specialized-adapter-spec.js";
import { generateStarwindAstroWrappers } from "./styled.js";
import { collectAstroStyledPackageImportSources } from "./styled-artifact-metadata.js";

export const astroFrameworkAdapterTarget = defineFrameworkAdapterTarget({
  adapter: astroFrameworkAdapter,
  cliRegistry: {
    generatedImportCandidateExtensions: [".astro", ".ts", ".js"],
    primitiveArtifact: {
      outputDir: "astro-primitives",
      sourceRoot: "packages/astro/src",
    },
    styledArtifact: {
      collectPackageImportSources: collectAstroStyledPackageImportSources,
      outputDir: "astro",
      primitiveOutputDir: "astro-primitives",
    },
  },
  displayName: "Astro",
  home: "scripts/portable-runtime/renderers/framework-adapters/astro",
  packageName: "@starwind-ui/astro",
  primitive: {
    generatePackage: generateAstroPrimitivePackage,
    manualPrimitives: astroManualPrimitiveGenerators,
    outputModel: {
      capabilities: {},
      projectSpecialized: projectSpecializedAdapterOutputModel,
      write(args) {
        return writeAstroAdapterOutput({
          astroHeader: args.componentHeader ?? "",
          componentName: args.componentName,
          outputModel: args.outputModel,
          outputRoot: args.outputRoot,
          tsHeader: args.moduleHeader,
        });
      },
    },
  },
  publicSupport: {
    cliRegistry: true,
    demoIntegration: true,
    packageExports: true,
    publicDocsClaim: true,
    status: "shipping",
  },
  styled: {
    project(args) {
      return projectStyledOutputModel(
        args.contracts.filter(
          (contract) => !contract.frameworks || contract.frameworks.includes("astro"),
        ),
      );
    },
    write(args) {
      return generateStarwindAstroWrappers(args);
    },
  },
  target: "astro",
} as const);

export { astroFrameworkAdapter };
