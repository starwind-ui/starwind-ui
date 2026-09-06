import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format as formatWithPrettier, resolveConfig as resolvePrettierConfig } from "prettier";
import semver from "semver";
import type { RuntimeAdapterContract } from "./contracts/primitive/types.js";
import { starwindStyledContracts } from "./contracts/styled/starwind.js";
import type { FrameworkTarget, StyledAdapterContract } from "./contracts/styled/types.js";
import { formatGeneratedOutput } from "./format-generated-output.js";
import {
  type FrameworkAdapterRegisteredTarget,
  getFrameworkAdapterTargetsWithStyledCapability,
  getPrimitiveFrameworkAdapterTarget,
  primitiveFrameworkAdapterTargets,
} from "./renderers/framework-adapters/index.js";
import {
  generateFrameworkPrimitiveWrappers,
  generateFrameworkStyledWrappers,
} from "./renderers/framework-wrapper-generator.js";
import { getPrimitiveVendoringContracts } from "./renderers/primitive-inventory.js";
import { toPortablePath } from "./renderers/shared.js";
import type { StyledOutputComponentGroup } from "./renderers/styled-output-model/index.js";
import { analyzeStyledOutputGroup } from "./renderers/styled-output-model/index.js";

export const DEFAULT_REGISTRY_VERSION_MANIFEST =
  "packages/cli/registry/styled-component-versions.json";
export const DEFAULT_PRIMITIVE_VERSION_MANIFEST = "packages/cli/registry/primitive-versions.json";
export const DEFAULT_COMPONENT_INSTALL_ROOT = "src/components/starwind";
export const DEFAULT_PRIMITIVE_INSTALL_ROOT = "src/components/starwind-primitives";
export const DEFAULT_CLI_REGISTRY_OUTPUT = "packages/cli/src/registry/bundled-registry.json";

type RegistryImplementationTarget = FrameworkTarget;
type PrimitiveVendoringFramework = FrameworkTarget;
export type CliRegistryTargetRegistration = (typeof primitiveFrameworkAdapterTargets)[number];
type RegistryFile = {
  content: string;
  path: string;
};

type RegistryPackageRequirement = {
  name: string;
  range: string;
};

type RegistryTarget = {
  componentDependencies: string[];
  files: RegistryFile[];
  packageRequirements: RegistryPackageRequirement[];
};

type RegistrySetupTarget = {
  adapterPackage: RegistryPackageRequirement;
  packageRequirements: RegistryPackageRequirement[];
};

type RegistryComponent = {
  dependencies: string[];
  name: string;
  sourceVersion: string;
  targets: Partial<Record<RegistryImplementationTarget, RegistryTarget>>;
  type: "component";
  version: string;
};

type RegistryComponentIndex = Omit<RegistryComponent, "targets"> & {
  artifact?: {
    path: string;
  };
  targets?: RegistryComponent["targets"];
};

export type RuntimeRegistry = {
  $schema: string;
  components: RegistryComponentIndex[];
  setup: Partial<Record<RegistryImplementationTarget, RegistrySetupTarget>>;
  version: string;
};

export type RegistryVersionManifest = {
  components: Record<string, string>;
  defaultComponentVersion: string;
  registryVersion: string;
  sourceVersions: Record<string, string>;
};

export type PrimitiveVersionManifest = {
  defaultPrimitiveVersion: string;
  primitives: Record<string, string>;
  sourceVersions: Record<string, string>;
};

type RegistryVersionManifestSource = Omit<RegistryVersionManifest, "sourceVersions"> & {
  sourceVersions?: Record<string, string>;
};

type PrimitiveVersionManifestSource = Omit<PrimitiveVersionManifest, "sourceVersions"> & {
  sourceVersions?: Record<string, string>;
};

export type RuntimeRegistryArtifactDocument = {
  $schema: string;
  registryVersion: string;
  component: RegistryComponent;
};

export type SplitRuntimeRegistry = {
  artifacts: Array<{
    artifact: RuntimeRegistryArtifactDocument;
    path: string;
  }>;
  registry: RuntimeRegistry;
};

export type PrimitiveVendoringFile = {
  content: string;
  path: string;
  sourceHash: string;
  sourcePath: string;
};

export type PrimitiveVendoringArtifact = {
  component: string;
  files: PrimitiveVendoringFile[];
  framework: PrimitiveVendoringFramework;
  packageRequirements: RegistryPackageRequirement[];
  sourceVersion: string;
  version: string;
};

export type PrimitiveVendoringTargetDescriptor = {
  editableContentMarkers: Array<{
    extensions: string[];
    markers: string[];
    position: "contains" | "prefix";
  }>;
  forbiddenContent: string[];
  generatedImportCandidateExtensions: string[];
  packageRequirements: RegistryPackageRequirement[];
  sourceRoot: string;
};

export type PrimitiveVendoringArtifacts = {
  $schema: string;
  integrity?: {
    algorithm: "sha256";
    fingerprint: string;
  };
  primitives: PrimitiveVendoringArtifact[];
  validation?: Partial<Record<PrimitiveVendoringFramework, PrimitiveVendoringTargetDescriptor>>;
};

export type CliRegistryBuildPolicy = Readonly<{
  targetRegistrations: readonly CliRegistryTargetRegistration[];
}>;

type BuildRuntimeRegistryOptions = {
  artifactDir?: string;
  componentInstallRoot?: string;
  componentVersion?: string;
  contracts?: StyledAdapterContract[];
  repoRoot?: string;
  registryVersion?: string;
  tempRoot?: string;
  targetPolicy?: CliRegistryBuildPolicy;
  versionManifestPath?: string;
};

type BuildPrimitiveVendoringArtifactsOptions = {
  contracts?: readonly RuntimeAdapterContract[];
  primitiveInstallRoot?: string;
  primitiveVersionManifestPath?: string;
  repoRoot?: string;
  tempRoot?: string;
  targetPolicy?: CliRegistryBuildPolicy;
};

type WriteRuntimeRegistryOptions = BuildRuntimeRegistryOptions & {
  artifactDir?: string;
  outputRoot?: string;
  outputPath?: string;
  repoRoot?: string;
  splitArtifacts?: boolean;
};

type TargetDefinition = {
  adapterPackage: string;
  collectPackageImportSources?: (args: {
    group: StyledOutputComponentGroup;
    primitiveImportBase: string;
  }) => readonly string[];
  generatedImportCandidateExtensions: readonly string[];
  outputDir: string;
  primitiveImportBase: string;
  primitiveOutputDir: string;
  project(args: {
    contracts: StyledAdapterContract[];
    outputRoot: string;
    primitiveImportBase?: string;
    primitiveOutputRoot: string;
  }): { componentGroups: StyledOutputComponentGroup[] };
  setupPackageRequirements: readonly RegistryPackageRequirement[];
  target: RegistryImplementationTarget;
};

type PrimitiveVendoringTargetDefinition = {
  editableContentMarkers: PrimitiveVendoringTargetDescriptor["editableContentMarkers"];
  extraPackageRequirements?: readonly string[];
  forbiddenContent: string[];
  framework: PrimitiveVendoringFramework;
  generatedImportCandidateExtensions: readonly string[];
  includeLocalImportGraph?: boolean;
  outputDir: string;
  projectContent(content: string): string;
  publicRegistry: boolean;
  sourceRoot: string;
};

type PackageMetadata = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  version?: string;
};

function createTargetDefinitions(
  registrations: readonly CliRegistryTargetRegistration[],
): TargetDefinition[] {
  const capabilities = new Map(
    getFrameworkAdapterTargetsWithStyledCapability().map(({ capability, target }) => [
      target,
      capability,
    ]),
  );

  return registrations.map((registration) => {
    const capability = capabilities.get(registration.target);
    if (!capability) {
      throw new Error(
        `CLI registry target "${registration.target}" is missing Styled adapter capability.`,
      );
    }
    const adapterPackage = getCliRegistryAdapterPackage(registration.target);

    return {
      adapterPackage,
      collectPackageImportSources:
        registration.cliRegistry.styledArtifact.collectPackageImportSources,
      generatedImportCandidateExtensions:
        registration.cliRegistry.generatedImportCandidateExtensions,
      outputDir: registration.cliRegistry.styledArtifact.outputDir,
      primitiveImportBase: adapterPackage,
      primitiveOutputDir: registration.cliRegistry.styledArtifact.primitiveOutputDir,
      project: capability.project,
      setupPackageRequirements: registration.cliRegistry.setupPackageRequirements,
      target: registration.target as RegistryImplementationTarget,
    };
  });
}

function createPrimitiveVendoringTargetDefinitions(
  registrations: readonly CliRegistryTargetRegistration[],
): PrimitiveVendoringTargetDefinition[] {
  return registrations.map((registration) => {
    const primitiveArtifact = registration.cliRegistry.primitiveArtifact;
    if (!primitiveArtifact) {
      throw new Error(
        `CLI registry target "${registration.target}" is missing Primitive artifact metadata.`,
      );
    }

    return {
      editableContentMarkers: primitiveArtifact.editableContentMarkers.map((rule) => ({
        extensions: [...rule.extensions],
        markers: [...rule.markers],
        position: rule.position,
      })),
      extraPackageRequirements: primitiveArtifact.extraPackageRequirements,
      forbiddenContent: [...primitiveArtifact.forbiddenContent],
      framework: registration.target as PrimitiveVendoringFramework,
      generatedImportCandidateExtensions:
        registration.cliRegistry.generatedImportCandidateExtensions,
      includeLocalImportGraph: primitiveArtifact.includeLocalImportGraph,
      outputDir: primitiveArtifact.outputDir,
      projectContent: primitiveArtifact.projectContent,
      publicRegistry: registration.publicSupport.cliRegistry,
      sourceRoot: primitiveArtifact.sourceRoot,
    };
  });
}

export function createCliRegistryBuildPolicy(
  targetRegistrations: readonly CliRegistryTargetRegistration[],
): CliRegistryBuildPolicy {
  const seenTargets = new Set<FrameworkAdapterRegisteredTarget>();

  for (const registration of targetRegistrations) {
    const authoritativeRegistration = getPrimitiveFrameworkAdapterTarget(registration.target);
    if (registration !== authoritativeRegistration) {
      throw new Error(
        `CLI registry target "${registration.target}" must use its registered target metadata.`,
      );
    }
    if (seenTargets.has(registration.target)) {
      throw new Error(`Duplicate CLI registry target "${registration.target}".`);
    }
    seenTargets.add(registration.target);
  }

  createTargetDefinitions(targetRegistrations);
  createPrimitiveVendoringTargetDefinitions(targetRegistrations);

  return Object.freeze({
    targetRegistrations: Object.freeze([...targetRegistrations]),
  });
}

function resolveCliRegistryBuildPolicy(
  targetPolicy?: CliRegistryBuildPolicy,
): CliRegistryBuildPolicy {
  return createCliRegistryBuildPolicy(
    targetPolicy?.targetRegistrations ??
      primitiveFrameworkAdapterTargets.filter(
        (registration) => registration.publicSupport.cliRegistry,
      ),
  );
}

export type StyledArtifactTargetPlanningFacts = {
  component: string;
  componentDependencies: string[];
  packageRequirementSources: string[];
  target: RegistryImplementationTarget;
};

export type StyledArtifactPlanningFacts = {
  targets: Partial<
    Record<RegistryImplementationTarget, Record<string, StyledArtifactTargetPlanningFacts>>
  >;
};

export function buildStyledArtifactPlanningFacts(
  options: { contracts?: StyledAdapterContract[]; targetPolicy?: CliRegistryBuildPolicy } = {},
): StyledArtifactPlanningFacts {
  const contracts = options.contracts ?? starwindStyledContracts;
  const targets: StyledArtifactPlanningFacts["targets"] = {};
  const targetDefinitions = createTargetDefinitions(
    resolveCliRegistryBuildPolicy(options.targetPolicy).targetRegistrations,
  );

  for (const target of targetDefinitions) {
    const targetContracts = contracts.filter((contract) => isForFramework(contract, target.target));
    if (targetContracts.length === 0) continue;

    const outputModel = target.project({
      contracts: targetContracts,
      outputRoot: "",
      primitiveImportBase: target.primitiveImportBase,
      primitiveOutputRoot: "",
    });
    const targetFacts: Record<string, StyledArtifactTargetPlanningFacts> = {};

    for (const group of outputModel.componentGroups) {
      const analysis = analyzeStyledOutputGroup(group, { target: target.target });

      targetFacts[group.component] = {
        component: group.component,
        componentDependencies: analysis.dependencies.styledComponents.filter(
          (dependency) => dependency !== group.component,
        ),
        packageRequirementSources: collectStyledPackageRequirementSources(group, target),
        target: target.target,
      };
    }

    targets[target.target] = targetFacts;
  }

  return { targets };
}

export async function buildRuntimeRegistry(
  options: BuildRuntimeRegistryOptions = {},
): Promise<RuntimeRegistry> {
  const tempRoot =
    options.tempRoot ?? (await mkdtemp(path.join(os.tmpdir(), "starwind-cli-registry-")));
  const shouldRemoveTempRoot = !options.tempRoot;
  const contracts = options.contracts ?? starwindStyledContracts;
  const componentInstallRoot = options.componentInstallRoot ?? DEFAULT_COMPONENT_INSTALL_ROOT;
  const repoRoot = options.repoRoot ?? process.cwd();
  const targetPolicy = resolveCliRegistryBuildPolicy(options.targetPolicy);
  const targetDefinitions = createTargetDefinitions(targetPolicy.targetRegistrations);
  const packageRanges = await loadPackageRanges(repoRoot, targetPolicy.targetRegistrations);
  const versionManifest = await loadRegistryVersionManifest({
    repoRoot,
    versionManifestPath: options.versionManifestPath,
  });
  validateRegistryVersionManifest(versionManifest, {
    contracts,
    manifestPath: options.versionManifestPath ?? DEFAULT_REGISTRY_VERSION_MANIFEST,
    requireComponentVersions: options.componentVersion === undefined,
  });
  const styledArtifactPlanningFacts = buildStyledArtifactPlanningFacts({
    contracts,
    targetPolicy,
  });

  try {
    const targetOutputs = new Map<RegistryImplementationTarget, string>();

    for (const target of targetDefinitions) {
      const targetContracts = contracts.filter((contract) =>
        isForFramework(contract, target.target),
      );
      if (targetContracts.length === 0) continue;

      const outputRoot = path.join(tempRoot, target.outputDir);
      await generateFrameworkStyledWrappers(target.target, {
        contracts: targetContracts,
        generatedBy: "scripts/portable-runtime/generate-cli-registry.ts",
        outputRoot,
        primitiveImportBase: target.primitiveImportBase,
        primitiveOutputRoot: path.join(tempRoot, target.primitiveOutputDir),
      });
      if (target.target === "vue") await formatGeneratedOutput([outputRoot], repoRoot);

      targetOutputs.set(target.target, outputRoot);
    }

    return {
      $schema: "https://starwind.dev/registry-schema.v2.json",
      version: options.registryVersion ?? versionManifest.registryVersion,
      setup: buildRegistrySetup(packageRanges, targetDefinitions),
      components: await Promise.all(
        contracts.map(async (contract) => ({
          name: contract.component,
          sourceVersion:
            options.componentVersion ??
            versionManifest.sourceVersions[contract.component] ??
            versionManifest.defaultComponentVersion,
          version:
            options.componentVersion ??
            versionManifest.components[contract.component] ??
            versionManifest.defaultComponentVersion,
          type: "component" as const,
          dependencies: [],
          targets: await buildTargetsForContract({
            componentInstallRoot,
            contract,
            packageRanges,
            styledArtifactPlanningFacts,
            targetDefinitions,
            targetOutputs,
          }),
        })),
      ),
    };
  } finally {
    if (shouldRemoveTempRoot) {
      await rm(tempRoot, { force: true, recursive: true });
    }
  }
}

function buildRegistrySetup(
  packageRanges: Map<string, string>,
  targetDefinitions: readonly TargetDefinition[],
): RuntimeRegistry["setup"] {
  const setup: RuntimeRegistry["setup"] = {};

  for (const target of targetDefinitions) {
    if (setup[target.target]) {
      throw new Error(`Duplicate CLI registry setup target "${target.target}".`);
    }

    const seenPackageNames = new Set<string>();
    const packageRequirements = target.setupPackageRequirements
      .map((requirement) => {
        if (!isValidRegistryPackageName(requirement.name)) {
          throw new Error(
            `Invalid setup package name "${requirement.name}" for target "${target.target}".`,
          );
        }
        if (!semver.validRange(requirement.range)) {
          throw new Error(
            `Invalid setup package range "${requirement.range}" for ${requirement.name} on target "${target.target}".`,
          );
        }
        if (requirement.name === target.adapterPackage) {
          throw new Error(
            `Setup package requirements for target "${target.target}" must not repeat adapter package ${target.adapterPackage}.`,
          );
        }
        if (seenPackageNames.has(requirement.name)) {
          throw new Error(
            `Duplicate setup package requirement ${requirement.name} for target "${target.target}".`,
          );
        }

        seenPackageNames.add(requirement.name);
        return { ...requirement };
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    setup[target.target] = {
      adapterPackage: {
        name: target.adapterPackage,
        range: getPackageRange(target.adapterPackage, packageRanges),
      },
      packageRequirements,
    };
  }

  return setup;
}

const MAX_REGISTRY_PACKAGE_NAME_LENGTH = 214;
const REGISTRY_PACKAGE_NAME_SEGMENT = /^[a-z0-9](?:[a-z0-9._~-]*[a-z0-9])?$/;
const REGISTRY_PACKAGE_NAME_WHITESPACE_OR_CONTROL = /[\s\u0000-\u001f\u007f]/;

export function isValidRegistryPackageName(value: string): boolean {
  if (
    value.length === 0 ||
    value.length > MAX_REGISTRY_PACKAGE_NAME_LENGTH ||
    REGISTRY_PACKAGE_NAME_WHITESPACE_OR_CONTROL.test(value) ||
    value.startsWith("-")
  ) {
    return false;
  }

  if (!value.startsWith("@")) {
    return REGISTRY_PACKAGE_NAME_SEGMENT.test(value);
  }

  const scopedMatch = /^@([^/]+)\/([^/]+)$/.exec(value);
  return Boolean(
    scopedMatch &&
    REGISTRY_PACKAGE_NAME_SEGMENT.test(scopedMatch[1]!) &&
    REGISTRY_PACKAGE_NAME_SEGMENT.test(scopedMatch[2]!),
  );
}

export async function buildSplitRuntimeRegistry(
  options: BuildRuntimeRegistryOptions = {},
): Promise<SplitRuntimeRegistry> {
  const fullRegistry = await buildRuntimeRegistry(options);
  const artifactDir = normalizeArtifactDir(options.artifactDir ?? "artifacts");

  return {
    registry: {
      ...fullRegistry,
      components: fullRegistry.components.map((component) => {
        const { targets: _targets, ...componentIndex } = component;

        return {
          ...componentIndex,
          artifact: {
            path: toPortablePath(path.posix.join(artifactDir, `${component.name}.json`)),
          },
        };
      }),
    },
    artifacts: fullRegistry.components.map((component) => ({
      path: toPortablePath(path.posix.join(artifactDir, `${component.name}.json`)),
      artifact: {
        $schema: "https://starwind.dev/registry-component-artifact-schema.v2.json",
        registryVersion: fullRegistry.version,
        component: component as RegistryComponent,
      },
    })),
  };
}

export async function buildPrimitiveVendoringArtifacts(
  options: BuildPrimitiveVendoringArtifactsOptions = {},
): Promise<PrimitiveVendoringArtifacts> {
  const tempRoot =
    options.tempRoot ?? (await mkdtemp(path.join(os.tmpdir(), "starwind-primitive-artifacts-")));
  const shouldRemoveTempRoot = !options.tempRoot;
  const repoRoot = options.repoRoot ?? process.cwd();
  const contracts = options.contracts ?? getPrimitiveVendoringContracts();
  const primitiveInstallRoot = normalizePrimitiveInstallRoot(
    options.primitiveInstallRoot ?? DEFAULT_PRIMITIVE_INSTALL_ROOT,
  );
  validatePrimitiveVendoringContracts(contracts);
  const primitiveVersionManifest = await loadPrimitiveVersionManifest({
    repoRoot,
    primitiveVersionManifestPath: options.primitiveVersionManifestPath,
  });
  validatePrimitiveVersionManifest(primitiveVersionManifest, {
    contracts,
    manifestPath: options.primitiveVersionManifestPath ?? DEFAULT_PRIMITIVE_VERSION_MANIFEST,
  });

  try {
    const targetPolicy = resolveCliRegistryBuildPolicy(options.targetPolicy);
    const packageRanges = await loadPackageRanges(repoRoot, targetPolicy.targetRegistrations);
    const primitiveTargets = createPrimitiveVendoringTargetDefinitions(
      targetPolicy.targetRegistrations,
    );
    const primitives: PrimitiveVendoringArtifact[] = [];
    const validation: Partial<
      Record<PrimitiveVendoringFramework, PrimitiveVendoringTargetDescriptor>
    > = {};

    for (const target of primitiveTargets) {
      const outputRoot = path.join(tempRoot, target.outputDir);

      await generateFrameworkPrimitiveWrappers(target.framework, {
        generatedBy: "scripts/portable-runtime/generate-cli-registry.ts",
        outputRoot,
      });

      const targetArtifacts = await Promise.all(
        contracts.map(async (contract) => {
          const files = await readGeneratedPrimitiveFiles({
            component: contract.component,
            generatedImportCandidateExtensions: target.generatedImportCandidateExtensions,
            includeLocalImportGraph: target.includeLocalImportGraph,
            outputRoot,
            primitiveInstallRoot,
            projectContent: target.projectContent,
            repoRoot,
            sourceRoot: target.sourceRoot,
          });

          return {
            component: contract.component,
            framework: target.framework,
            sourceVersion: primitiveVersionManifest.sourceVersions[contract.component],
            version: primitiveVersionManifest.primitives[contract.component],
            files,
            packageRequirements: collectPrimitivePackageRequirements({
              extraPackageNames: target.extraPackageRequirements,
              files,
              packageRanges,
            }),
          };
        }),
      );
      primitives.push(...targetArtifacts);

      if (!target.publicRegistry) {
        const packageRequirements = targetArtifacts[0]?.packageRequirements;
        if (
          !packageRequirements ||
          targetArtifacts.some(
            (artifact) =>
              JSON.stringify(artifact.packageRequirements) !== JSON.stringify(packageRequirements),
          )
        ) {
          throw new Error(
            `Primitive artifacts for "${target.framework}" must use one package requirement set.`,
          );
        }
        validation[target.framework] = {
          editableContentMarkers: target.editableContentMarkers,
          forbiddenContent: target.forbiddenContent,
          generatedImportCandidateExtensions: [...target.generatedImportCandidateExtensions],
          packageRequirements,
          sourceRoot: target.sourceRoot,
        };
      }
    }

    const artifactSet: PrimitiveVendoringArtifacts = {
      $schema: "https://starwind.dev/primitive-vendoring-artifacts-schema.v1.json",
      primitives,
      ...(Object.keys(validation).length > 0 ? { validation } : {}),
    };

    return artifactSet.validation
      ? {
          ...artifactSet,
          integrity: {
            algorithm: "sha256",
            fingerprint: createPrimitiveArtifactIntegrityFingerprint(artifactSet),
          },
        }
      : artifactSet;
  } finally {
    if (shouldRemoveTempRoot) {
      await rm(tempRoot, { force: true, recursive: true });
    }
  }
}

export async function writeRuntimeRegistry(
  options: WriteRuntimeRegistryOptions = {},
): Promise<RuntimeRegistry> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const outputRoot = options.outputRoot ?? repoRoot;
  const outputPath = path.join(outputRoot, options.outputPath ?? DEFAULT_CLI_REGISTRY_OUTPUT);
  const outputDir = path.dirname(outputPath);
  const registryOutput = options.splitArtifacts
    ? await buildSplitRuntimeRegistry(options)
    : { registry: await buildRuntimeRegistry(options), artifacts: [] };
  const { registry } = registryOutput;

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, await formatJsonDocument(registry, outputPath), "utf8");

  for (const artifact of registryOutput.artifacts) {
    const artifactPath = path.join(outputDir, artifact.path);

    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(
      artifactPath,
      await formatJsonDocument(artifact.artifact, artifactPath),
      "utf8",
    );
  }

  return registry;
}

async function buildTargetsForContract(options: {
  componentInstallRoot: string;
  contract: StyledAdapterContract;
  packageRanges: Map<string, string>;
  styledArtifactPlanningFacts: StyledArtifactPlanningFacts;
  targetDefinitions: readonly TargetDefinition[];
  targetOutputs: Map<RegistryImplementationTarget, string>;
}): Promise<Partial<Record<RegistryImplementationTarget, RegistryTarget>>> {
  const targets: Partial<Record<RegistryImplementationTarget, RegistryTarget>> = {};

  for (const target of options.targetDefinitions) {
    if (!isForFramework(options.contract, target.target)) continue;

    const outputRoot = options.targetOutputs.get(target.target);
    if (!outputRoot) continue;

    const files = await readGeneratedComponentFiles({
      component: options.contract.component,
      componentInstallRoot: options.componentInstallRoot,
      outputRoot,
    });
    const planningFacts =
      options.styledArtifactPlanningFacts.targets[target.target]?.[options.contract.component];

    targets[target.target] = {
      files,
      componentDependencies: planningFacts?.componentDependencies ?? [],
      packageRequirements: collectPackageRequirements({
        packageRanges: options.packageRanges,
        packageRequirementSources: planningFacts?.packageRequirementSources ?? [
          target.adapterPackage,
        ],
        target,
      }),
    };
  }

  return targets;
}

async function readGeneratedComponentFiles(options: {
  component: string;
  componentInstallRoot: string;
  outputRoot: string;
}): Promise<RegistryFile[]> {
  const componentOutputRoot = path.join(options.outputRoot, options.component);
  const relativeFiles = await readFilesRecursively(componentOutputRoot);

  return Promise.all(
    relativeFiles.map(async (relativePath) => ({
      path: toPortablePath(
        path.join(options.componentInstallRoot, options.component, relativePath),
      ),
      content: await readFile(path.join(componentOutputRoot, relativePath), "utf8"),
    })),
  );
}

export async function loadPackageRanges(
  repoRoot: string,
  targetRegistrations: readonly CliRegistryTargetRegistration[],
): Promise<Map<string, string>> {
  const ranges = new Map<string, string>();
  const exactAdapterPackages = new Set(
    targetRegistrations
      .filter((registration) => registration.cliRegistry.exactAdapterPackageVersion)
      .map((registration) => getCliRegistryAdapterPackage(registration.target)),
  );
  const packageMetadataSources = [
    ...new Set(
      targetRegistrations.flatMap(
        (registration) => registration.cliRegistry.packageMetadataSources ?? [],
      ),
    ),
  ];

  for (const packageMetadataSource of packageMetadataSources) {
    await addPackageVersionRange(ranges, repoRoot, packageMetadataSource, exactAdapterPackages);
    await addPackageDependencyRanges(ranges, repoRoot, packageMetadataSource);
  }

  return ranges;
}

export async function loadRegistryVersionManifest(
  options: { repoRoot?: string; versionManifestPath?: string } = {},
): Promise<RegistryVersionManifest> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const manifestPath = options.versionManifestPath ?? DEFAULT_REGISTRY_VERSION_MANIFEST;
  const resolvedManifestPath = path.isAbsolute(manifestPath)
    ? manifestPath
    : path.join(repoRoot, manifestPath);

  let rawManifest: unknown;

  try {
    rawManifest = JSON.parse(await readFile(resolvedManifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to read registry version manifest at ${manifestPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!isRegistryVersionManifest(rawManifest)) {
    throw new Error(
      `Invalid registry version manifest at ${manifestPath}: expected registryVersion, defaultComponentVersion, and components.`,
    );
  }

  return {
    ...rawManifest,
    sourceVersions: rawManifest.sourceVersions ?? rawManifest.components,
  };
}

export async function loadPrimitiveVersionManifest(
  options: { primitiveVersionManifestPath?: string; repoRoot?: string } = {},
): Promise<PrimitiveVersionManifest> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const manifestPath = options.primitiveVersionManifestPath ?? DEFAULT_PRIMITIVE_VERSION_MANIFEST;
  const resolvedManifestPath = path.isAbsolute(manifestPath)
    ? manifestPath
    : path.join(repoRoot, manifestPath);

  let rawManifest: unknown;

  try {
    rawManifest = JSON.parse(await readFile(resolvedManifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to read primitive version manifest at ${manifestPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!isPrimitiveVersionManifest(rawManifest)) {
    throw new Error(
      `Invalid primitive version manifest at ${manifestPath}: expected defaultPrimitiveVersion and primitives.`,
    );
  }

  return {
    ...rawManifest,
    sourceVersions: rawManifest.sourceVersions ?? rawManifest.primitives,
  };
}

function validateRegistryVersionManifest(
  manifest: RegistryVersionManifest,
  options: {
    contracts: StyledAdapterContract[];
    manifestPath: string;
    requireComponentVersions: boolean;
  },
): void {
  assertSemver(manifest.registryVersion, `${options.manifestPath} registryVersion`);
  assertSemver(manifest.defaultComponentVersion, `${options.manifestPath} defaultComponentVersion`);

  for (const [componentName, version] of Object.entries(manifest.components)) {
    assertSemver(version, `${options.manifestPath} component "${componentName}"`);
  }

  assertMatchingVersionMapKeys({
    manifestPath: options.manifestPath,
    sourceVersions: manifest.sourceVersions,
    versions: manifest.components,
  });

  for (const [componentName, sourceVersion] of Object.entries(manifest.sourceVersions)) {
    assertSemver(sourceVersion, `${options.manifestPath} sourceVersion "${componentName}"`);
  }

  assertSourceVersionsDoNotExceedVersions({
    manifestPath: options.manifestPath,
    sourceVersions: manifest.sourceVersions,
    versions: manifest.components,
  });

  if (!options.requireComponentVersions) return;

  const missingComponents = options.contracts
    .map((contract) => contract.component)
    .filter((componentName) => manifest.components[componentName] === undefined);

  if (missingComponents.length > 0) {
    throw new Error(
      `Registry version manifest ${options.manifestPath} is missing component version entries for: ${missingComponents.join(", ")}`,
    );
  }
}

function validatePrimitiveVersionManifest(
  manifest: PrimitiveVersionManifest,
  options: {
    contracts: readonly RuntimeAdapterContract[];
    manifestPath: string;
  },
): void {
  assertSemver(manifest.defaultPrimitiveVersion, `${options.manifestPath} defaultPrimitiveVersion`);

  for (const [componentName, version] of Object.entries(manifest.primitives)) {
    assertSemver(version, `${options.manifestPath} primitive "${componentName}"`);
  }

  assertMatchingVersionMapKeys({
    manifestPath: options.manifestPath,
    sourceVersions: manifest.sourceVersions,
    versions: manifest.primitives,
  });

  for (const [componentName, sourceVersion] of Object.entries(manifest.sourceVersions)) {
    assertSemver(sourceVersion, `${options.manifestPath} sourceVersion "${componentName}"`);
  }

  assertSourceVersionsDoNotExceedVersions({
    manifestPath: options.manifestPath,
    sourceVersions: manifest.sourceVersions,
    versions: manifest.primitives,
  });

  const missingComponents = options.contracts
    .map((contract) => contract.component)
    .filter((componentName) => manifest.primitives[componentName] === undefined);

  if (missingComponents.length > 0) {
    throw new Error(
      `Primitive version manifest ${options.manifestPath} is missing primitive version entries for: ${missingComponents.join(", ")}`,
    );
  }
}

function isRegistryVersionManifest(value: unknown): value is RegistryVersionManifestSource {
  if (!value || typeof value !== "object") return false;

  const manifest = value as Partial<RegistryVersionManifestSource>;
  return (
    typeof manifest.registryVersion === "string" &&
    typeof manifest.defaultComponentVersion === "string" &&
    Boolean(manifest.components) &&
    typeof manifest.components === "object" &&
    Object.values(manifest.components).every((version) => typeof version === "string") &&
    (manifest.sourceVersions === undefined ||
      (Boolean(manifest.sourceVersions) &&
        typeof manifest.sourceVersions === "object" &&
        Object.values(manifest.sourceVersions).every((version) => typeof version === "string")))
  );
}

function isPrimitiveVersionManifest(value: unknown): value is PrimitiveVersionManifestSource {
  if (!value || typeof value !== "object") return false;

  const manifest = value as Partial<PrimitiveVersionManifestSource>;
  return (
    typeof manifest.defaultPrimitiveVersion === "string" &&
    Boolean(manifest.primitives) &&
    typeof manifest.primitives === "object" &&
    Object.values(manifest.primitives).every((version) => typeof version === "string") &&
    (manifest.sourceVersions === undefined ||
      (Boolean(manifest.sourceVersions) &&
        typeof manifest.sourceVersions === "object" &&
        Object.values(manifest.sourceVersions).every((version) => typeof version === "string")))
  );
}

function assertSemver(version: string, label: string): void {
  if (!isSemverVersion(version)) {
    throw new Error(`${label} must be a semver version. Received "${version}".`);
  }
}

function assertMatchingVersionMapKeys(options: {
  manifestPath: string;
  sourceVersions: Record<string, string>;
  versions: Record<string, string>;
}): void {
  const missingKeys = Object.keys(options.versions).filter(
    (componentName) => !Object.hasOwn(options.sourceVersions, componentName),
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `${options.manifestPath} sourceVersions is missing entries for: ${missingKeys.join(", ")}`,
    );
  }

  const extraKeys = Object.keys(options.sourceVersions).filter(
    (componentName) => !Object.hasOwn(options.versions, componentName),
  );

  if (extraKeys.length > 0) {
    throw new Error(
      `${options.manifestPath} sourceVersions has extra entries for: ${extraKeys.join(", ")}`,
    );
  }
}

function assertSourceVersionsDoNotExceedVersions(options: {
  manifestPath: string;
  sourceVersions: Record<string, string>;
  versions: Record<string, string>;
}): void {
  for (const [componentName, sourceVersion] of Object.entries(options.sourceVersions)) {
    const version = options.versions[componentName]!;
    if (semver.gt(sourceVersion, version)) {
      throw new Error(
        `${options.manifestPath} sourceVersion "${componentName}" ${sourceVersion} must not exceed version ${version}.`,
      );
    }
  }
}

function isSemverVersion(version: string): boolean {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(
    version,
  );
}

async function addPackageVersionRange(
  ranges: Map<string, string>,
  repoRoot: string,
  packageJsonPath: string,
  exactPackageNames: ReadonlySet<string>,
): Promise<void> {
  const packageJson = await readPackageJson(repoRoot, packageJsonPath);
  const name = getPackageName(packageJson, packageJsonPath);

  if (exactPackageNames.has(name)) {
    if (semver.valid(packageJson.version) !== packageJson.version) {
      throw new Error(
        `CLI registry adapter package ${name} requires an exact package version; received "${packageJson.version}" from ${packageJsonPath}.`,
      );
    }
    ranges.set(name, packageJson.version);
    return;
  }
  ranges.set(name, packageJson.version === "0.0.0" ? "*" : `^${packageJson.version}`);
}

async function addPackageDependencyRanges(
  ranges: Map<string, string>,
  repoRoot: string,
  packageJsonPath: string,
): Promise<void> {
  const packageJson = await readPackageJson(repoRoot, packageJsonPath);
  const dependencySources = [
    packageJson.dependencies,
    packageJson.peerDependencies,
    packageJson.devDependencies,
  ];

  for (const dependencies of dependencySources) {
    for (const [name, range] of Object.entries(dependencies ?? {})) {
      if (!ranges.has(name)) {
        ranges.set(name, range);
      }
    }
  }
}

async function readPackageJson(
  repoRoot: string,
  packageJsonPath: string,
): Promise<PackageMetadata & { name?: string }> {
  return JSON.parse(
    await readFile(path.join(repoRoot, packageJsonPath), "utf8"),
  ) as PackageMetadata & {
    name?: string;
  };
}

function getPackageName(packageJson: { name?: string }, packageJsonPath: string): string {
  if (!packageJson.name) {
    throw new Error(`${packageJsonPath} is missing package name.`);
  }

  return packageJson.name;
}

function collectPackageRequirements(options: {
  packageRanges: Map<string, string>;
  packageRequirementSources: readonly string[];
  target: TargetDefinition;
}): RegistryPackageRequirement[] {
  const packageNames = new Set<string>([options.target.adapterPackage]);

  for (const source of options.packageRequirementSources) {
    const packageName = getImportedPackageName(source);
    if (packageName) {
      packageNames.add(packageName);
    }
  }

  return [...packageNames].sort().map((name) => ({
    name,
    range: getPackageRange(name, options.packageRanges),
  }));
}

function collectStyledPackageRequirementSources(
  group: StyledOutputComponentGroup,
  target: TargetDefinition,
): string[] {
  const sources = new Set<string>([target.adapterPackage]);

  for (const source of target.collectPackageImportSources?.({
    group,
    primitiveImportBase: target.primitiveImportBase,
  }) ?? []) {
    sources.add(source);
  }

  return [...sources].sort();
}

function collectPrimitivePackageRequirements(options: {
  extraPackageNames?: readonly string[];
  files: RegistryFile[];
  packageRanges: Map<string, string>;
}): RegistryPackageRequirement[] {
  const packageNames = new Set<string>(options.extraPackageNames ?? []);

  for (const file of options.files) {
    for (const importSource of collectImportSources(file.content)) {
      const packageName = getImportedPackageName(importSource);

      if (packageName) {
        packageNames.add(packageName);
      }
    }
  }

  return [...packageNames]
    .sort()
    .map((name) => ({ name, range: getPackageRange(name, options.packageRanges) }));
}

function collectImportSources(source: string): string[] {
  const importSources = new Set<string>();
  const staticImportPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportPattern = /import\(["']([^"']+)["']\)/g;

  for (const match of source.matchAll(staticImportPattern)) {
    importSources.add(match[1]);
  }

  for (const match of source.matchAll(dynamicImportPattern)) {
    importSources.add(match[1]);
  }

  return [...importSources];
}

function getImportedPackageName(importSource: string): string | undefined {
  if (
    importSource.startsWith(".") ||
    importSource.startsWith("/") ||
    importSource.startsWith("node:") ||
    importSource.startsWith("@/")
  ) {
    return undefined;
  }

  if (importSource.startsWith("astro:")) {
    return "astro";
  }

  if (importSource.startsWith("@")) {
    const [scope, name] = importSource.split("/");
    return scope && name ? `${scope}/${name}` : importSource;
  }

  return importSource.split("/")[0];
}

function getPackageRange(name: string, packageRanges: Map<string, string>): string {
  const range = packageRanges.get(name);
  if (!range) {
    throw new Error(`No package range is known for generated import "${name}".`);
  }

  return normalizePackageRange(range);
}

function normalizePackageRange(range: string): string {
  return range === "workspace:*" ? "*" : range;
}

function getCliRegistryAdapterPackage(target: FrameworkAdapterRegisteredTarget): string {
  const packageName = getPrimitiveFrameworkAdapterTarget(target).packageName;

  if (!packageName) {
    throw new Error(
      `Framework Adapter target "${target}" is missing packageName metadata for CLI registry generation.`,
    );
  }

  return packageName;
}

function normalizeArtifactDir(artifactDir: string): string {
  const portablePath = artifactDir.replace(/\\/g, "/");

  if (
    /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(portablePath) ||
    portablePath.startsWith("/") ||
    path.win32.isAbsolute(artifactDir)
  ) {
    throw new Error(`Registry artifact directory "${artifactDir}" must be relative.`);
  }

  const normalizedPath = path.posix.normalize(portablePath);

  if (normalizedPath === "." || normalizedPath === ".." || normalizedPath.startsWith("../")) {
    throw new Error(`Registry artifact directory "${artifactDir}" must stay inside the registry.`);
  }

  return normalizedPath;
}

function normalizePrimitiveInstallRoot(primitiveInstallRoot: string): string {
  const portablePath = primitiveInstallRoot.replace(/\\/g, "/");

  if (
    /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(portablePath) ||
    portablePath.startsWith("/") ||
    path.win32.isAbsolute(primitiveInstallRoot)
  ) {
    throw new Error(`Primitive install root "${primitiveInstallRoot}" must be relative.`);
  }

  const normalizedPath = path.posix.normalize(portablePath);

  if (normalizedPath === "." || normalizedPath === ".." || normalizedPath.startsWith("../")) {
    throw new Error(
      `Primitive install root "${primitiveInstallRoot}" must stay inside the project.`,
    );
  }

  return normalizedPath;
}

function validatePrimitiveVendoringContracts(contracts: readonly RuntimeAdapterContract[]): void {
  const supportedComponents = new Set<string>(
    getPrimitiveVendoringContracts().map((contract) => contract.component),
  );

  for (const contract of contracts) {
    assertSafePrimitiveComponentName(contract.component);

    if (!supportedComponents.has(contract.component)) {
      throw new Error(
        `Primitive component "${contract.component}" is not supported by primitive vendoring artifacts.`,
      );
    }
  }
}

function assertSafePrimitiveComponentName(component: string): void {
  const portablePath = component.replace(/\\/g, "/");
  const normalizedPath = path.posix.normalize(portablePath);

  if (
    component.length === 0 ||
    portablePath.includes("/") ||
    normalizedPath !== portablePath ||
    normalizedPath === "." ||
    normalizedPath === ".." ||
    normalizedPath.startsWith("../") ||
    /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(portablePath) ||
    path.win32.isAbsolute(component)
  ) {
    throw new Error(`Unsafe primitive component name "${component}".`);
  }
}

async function readGeneratedPrimitiveFiles(options: {
  component: string;
  generatedImportCandidateExtensions: readonly string[];
  includeLocalImportGraph?: boolean;
  outputRoot: string;
  primitiveInstallRoot: string;
  projectContent(content: string): string;
  repoRoot: string;
  sourceRoot: string;
}): Promise<PrimitiveVendoringFile[]> {
  const relativeFiles = await readPrimitiveRootRelativeFiles({
    component: options.component,
    generatedImportCandidateExtensions: options.generatedImportCandidateExtensions,
    includeLocalImportGraph: options.includeLocalImportGraph,
    outputRoot: options.outputRoot,
  });

  return Promise.all(
    relativeFiles.map(async (relativePath) => {
      const sourcePath = path.join(options.repoRoot, options.sourceRoot, relativePath);
      const generatedContent = await readFile(path.join(options.outputRoot, relativePath), "utf8");
      const content = options.projectContent(
        await formatWithPrettier(generatedContent, {
          ...((await resolvePrettierConfig(sourcePath)) ?? {}),
          filepath: sourcePath,
        }),
      );
      const targetPath = createPrimitiveVendoringPath(options.primitiveInstallRoot, relativePath);

      return {
        path: targetPath,
        content,
        sourceHash: createSourceHash(content),
        sourcePath: toPortablePath(path.posix.join(options.sourceRoot, relativePath)),
      };
    }),
  );
}

async function readPrimitiveRootRelativeFiles(options: {
  component: string;
  generatedImportCandidateExtensions: readonly string[];
  includeLocalImportGraph?: boolean;
  outputRoot: string;
}): Promise<string[]> {
  const componentOutputRoot = path.join(options.outputRoot, options.component);
  const componentFiles = (await readFilesRecursively(componentOutputRoot)).map((relativePath) =>
    toPortablePath(path.posix.join(options.component, relativePath)),
  );

  if (options.includeLocalImportGraph === false) {
    return componentFiles;
  }

  const allFiles = new Set(await readFilesRecursively(options.outputRoot));
  const visitedFiles = new Set<string>();
  const queue = [...componentFiles];

  for (let index = 0; index < queue.length; index += 1) {
    const relativePath = queue[index];

    if (visitedFiles.has(relativePath)) continue;
    visitedFiles.add(relativePath);

    const content = await readFile(path.join(options.outputRoot, relativePath), "utf8");

    for (const importSource of collectImportSources(content)) {
      const importedPath = resolveLocalGeneratedImport({
        allFiles,
        generatedImportCandidateExtensions: options.generatedImportCandidateExtensions,
        importerPath: relativePath,
        importSource,
      });

      if (importedPath && !visitedFiles.has(importedPath)) {
        queue.push(importedPath);
      }
    }
  }

  return [...visitedFiles].sort();
}

function resolveLocalGeneratedImport(options: {
  allFiles: Set<string>;
  generatedImportCandidateExtensions: readonly string[];
  importerPath: string;
  importSource: string;
}): string | undefined {
  if (!options.importSource.startsWith(".")) return undefined;

  const importerDir = path.posix.dirname(options.importerPath);
  const normalizedBase = path.posix.normalize(path.posix.join(importerDir, options.importSource));

  if (
    normalizedBase === "." ||
    normalizedBase === ".." ||
    normalizedBase.startsWith("../") ||
    path.posix.isAbsolute(normalizedBase)
  ) {
    throw new Error(
      `Primitive artifact import "${options.importSource}" from "${options.importerPath}" escapes the generated output root.`,
    );
  }

  for (const candidate of getLocalGeneratedImportCandidates(
    normalizedBase,
    options.generatedImportCandidateExtensions,
  )) {
    if (options.allFiles.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Primitive artifact import "${options.importSource}" from "${options.importerPath}" could not be resolved.`,
  );
}

export function getLocalGeneratedImportCandidates(
  importPath: string,
  generatedImportCandidateExtensions: readonly string[],
): string[] {
  const importExtension = path.posix.extname(importPath);
  const candidateExtensions = [...new Set(generatedImportCandidateExtensions)];

  if (importExtension) {
    if (![".js", ".jsx", ".mjs", ".cjs"].includes(importExtension)) return [importPath];

    const importBase = importPath.slice(0, -importExtension.length);
    const sourceExtensions = candidateExtensions.filter((extension) =>
      [".ts", ".tsx", ".mts", ".cts"].includes(extension),
    );

    return [importPath, ...sourceExtensions.map((extension) => importBase + extension)];
  }

  return [
    ...candidateExtensions.map((extension) => `${importPath}${extension}`),
    ...candidateExtensions.map((extension) => path.posix.join(importPath, `index${extension}`)),
  ];
}

function createPrimitiveVendoringPath(primitiveInstallRoot: string, relativePath: string): string {
  const normalizedPath = path.posix.normalize(
    path.posix.join(primitiveInstallRoot, relativePath.replace(/\\/g, "/")),
  );

  if (
    normalizedPath === primitiveInstallRoot ||
    !normalizedPath.startsWith(`${primitiveInstallRoot}/`)
  ) {
    throw new Error(
      `Primitive artifact path "${normalizedPath}" must stay inside the primitive install root.`,
    );
  }

  return toPortablePath(normalizedPath);
}

function createSourceHash(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

const RELEASE_MANAGED_PRIMITIVE_PACKAGE_PREFIX = "@starwind-ui/";

function createPrimitiveArtifactIntegrityFingerprint(
  artifactSet: PrimitiveVendoringArtifacts,
): string {
  const document = {
    ...artifactSet,
    primitives: artifactSet.primitives.map(({ sourceVersion: _sourceVersion, ...artifact }) => ({
      ...artifact,
      packageRequirements: normalizeIntegrityPackageRequirements(artifact.packageRequirements),
      version: "<release-managed>",
    })),
    validation: artifactSet.validation
      ? Object.fromEntries(
          Object.entries(artifactSet.validation).map(([target, descriptor]) => [
            target,
            descriptor
              ? {
                  ...descriptor,
                  packageRequirements: normalizeIntegrityPackageRequirements(
                    descriptor.packageRequirements,
                  ),
                }
              : descriptor,
          ]),
        )
      : undefined,
  };

  return `sha256:${createHash("sha256").update(toCanonicalJson(document)).digest("hex")}`;
}

function normalizeIntegrityPackageRequirements(
  requirements: RegistryPackageRequirement[],
): RegistryPackageRequirement[] {
  return requirements.map((requirement) =>
    requirement.name.startsWith(RELEASE_MANAGED_PRIMITIVE_PACKAGE_PREFIX)
      ? { ...requirement, range: "<release-managed>" }
      : requirement,
  );
}

function toCanonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(toCanonicalJson).join(",")}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${toCanonicalJson(record[key])}`)
    .join(",")}}`;
}

async function formatJsonDocument(value: unknown, filepath: string): Promise<string> {
  return formatWithPrettier(JSON.stringify(value), {
    ...((await resolvePrettierConfig(filepath)) ?? {}),
    filepath,
    parser: "json",
  });
}

async function readFilesRecursively(dir: string, root: string = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return readFilesRecursively(entryPath, root);
      }

      return [toPortablePath(path.relative(root, entryPath))];
    }),
  );

  return files.flat().sort();
}

function isForFramework(
  contract: { frameworks?: FrameworkTarget[] },
  framework: FrameworkTarget,
): boolean {
  return !contract.frameworks || contract.frameworks.includes(framework);
}

if (isDirectExecution()) {
  const outputPath = getArgValue("--out");
  const outputRoot = getArgValue("--output-root");
  const artifactDir = getArgValue("--artifact-dir");
  const versionManifestPath = getArgValue("--version-manifest");
  await writeRuntimeRegistry({
    artifactDir,
    outputPath,
    outputRoot,
    splitArtifacts: process.argv.includes("--split-artifacts"),
    versionManifestPath,
  });
}

function getArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;

  return process.argv[index + 1];
}

function isDirectExecution(): boolean {
  return (
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}
