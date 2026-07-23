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
    setupPackageRequirements: [
      { name: "@tabler/icons-react", range: "^3" },
      { name: "@tailwindcss/forms", range: "^0.5" },
      { name: "@tailwindcss/vite", range: "^4" },
      { name: "tailwind-merge", range: "^3" },
      { name: "tailwind-variants", range: "^3" },
      { name: "tailwindcss", range: "^4" },
      { name: "tw-animate-css", range: "^1" },
    ],
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
