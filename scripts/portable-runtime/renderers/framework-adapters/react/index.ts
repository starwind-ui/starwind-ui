import { projectStyledOutputModel } from "../../styled-output-model/index.js";
import { defineFrameworkAdapterTarget } from "../target-definition.js";
import { reactFrameworkAdapter } from "./adapter.js";
import { reactManualPrimitiveGenerators } from "./manual-primitives.js";
import { writeReactAdapterOutput } from "./primitive-output-writer.js";
import { generateReactPrimitivePackage } from "./primitive-package.js";
import { projectSpecializedAdapterOutputModel } from "./specialized-adapter-spec.js";
import { generateStarwindReactWrappers } from "./styled.js";
import { collectReactStyledPackageImportSources } from "./styled-artifact-metadata.js";

export const reactFrameworkAdapterTarget = defineFrameworkAdapterTarget({
  adapter: reactFrameworkAdapter,
  cliRegistry: {
    generatedImportCandidateExtensions: [".ts", ".tsx", ".js", ".jsx"],
    primitiveArtifact: {
      extraPackageRequirements: ["react", "react-dom"],
      includeLocalImportGraph: true,
      outputDir: "react-primitives",
      sourceRoot: "packages/react/src",
    },
    styledArtifact: {
      collectPackageImportSources: collectReactStyledPackageImportSources,
      outputDir: "react",
      primitiveOutputDir: "react-primitives",
    },
  },
  displayName: "React",
  home: "scripts/portable-runtime/renderers/framework-adapters/react",
  packageName: "@starwind-ui/react",
  primitive: {
    generatePackage: generateReactPrimitivePackage,
    manualPrimitives: reactManualPrimitiveGenerators,
    outputModel: {
      capabilities: {
        groupedValueControlContextHelper: {
          fileExtension: ".tsx",
        },
      },
      projectSpecialized: projectSpecializedAdapterOutputModel,
      write(args) {
        return writeReactAdapterOutput({
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
          (contract) => !contract.frameworks || contract.frameworks.includes("react"),
        ),
      );
    },
    write(args) {
      return generateStarwindReactWrappers(args);
    },
  },
  target: "react",
} as const);

export { reactFrameworkAdapter };
