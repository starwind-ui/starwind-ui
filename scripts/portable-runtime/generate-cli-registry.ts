import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format as formatWithPrettier, resolveConfig as resolvePrettierConfig } from "prettier";
import type { RuntimeAdapterContract } from "./contracts/primitive/types.js";
import { starwindStyledContracts } from "./contracts/styled/starwind.js";
import type { FrameworkTarget, StyledAdapterContract } from "./contracts/styled/types.js";
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

type RegistryImplementationTarget = FrameworkAdapterRegisteredTarget;
type PrimitiveVendoringFramework = FrameworkAdapterRegisteredTarget;
type PrimitiveTargetRegistration = (typeof primitiveFrameworkAdapterTargets)[number];
type CliRegisteredPrimitiveTarget = PrimitiveTargetRegistration & {
  target: FrameworkAdapterRegisteredTarget;
};
type PrimitiveVendoringTarget = CliRegisteredPrimitiveTarget & {
  cliRegistry: PrimitiveTargetRegistration["cliRegistry"] & {
    primitiveArtifact: NonNullable<PrimitiveTargetRegistration["cliRegistry"]["primitiveArtifact"]>;
  };
};

type StyledCapabilityEntry = ReturnType<
  typeof getFrameworkAdapterTargetsWithStyledCapability
>[number];
type CliRegisteredStyledCapabilityEntry = StyledCapabilityEntry & {
  target: FrameworkAdapterRegisteredTarget;
};

function isCliRegisteredStyledCapabilityEntry(
  entry: StyledCapabilityEntry,
): entry is CliRegisteredStyledCapabilityEntry {
  return getPrimitiveFrameworkAdapterTarget(entry.target).publicSupport.cliRegistry;
}

function isPrimitiveVendoringTarget(
  registration: PrimitiveTargetRegistration,
): registration is PrimitiveVendoringTarget {
  return Boolean(
    registration.publicSupport.cliRegistry && registration.cliRegistry.primitiveArtifact,
  );
}

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

type RegistryComponent = {
  dependencies: string[];
  name: string;
  targets: Record<RegistryImplementationTarget, RegistryTarget>;
  type: "component";
  version: string;
};

type RegistryComponentIndex = Omit<RegistryComponent, "targets"> & {
  artifact?: {
    path: string;
  };
  targets?: Record<RegistryImplementationTarget, RegistryTarget>;
};

export type RuntimeRegistry = {
  $schema: string;
  components: RegistryComponentIndex[];
  version: string;
};

export type RegistryVersionManifest = {
  components: Record<string, string>;
  defaultComponentVersion: string;
  registryVersion: string;
};

export type PrimitiveVersionManifest = {
  defaultPrimitiveVersion: string;
  primitives: Record<string, string>;
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
  version: string;
};

export type PrimitiveVendoringArtifacts = {
  $schema: string;
  primitives: PrimitiveVendoringArtifact[];
};

type BuildRuntimeRegistryOptions = {
  artifactDir?: string;
  componentInstallRoot?: string;
  componentVersion?: string;
  contracts?: StyledAdapterContract[];
  repoRoot?: string;
  registryVersion?: string;
  tempRoot?: string;
  versionManifestPath?: string;
};

type BuildPrimitiveVendoringArtifactsOptions = {
  contracts?: readonly RuntimeAdapterContract[];
  primitiveInstallRoot?: string;
  primitiveVersionManifestPath?: string;
  repoRoot?: string;
  tempRoot?: string;
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
  target: RegistryImplementationTarget;
};

type PrimitiveVendoringTargetDefinition = {
  extraPackageRequirements?: readonly string[];
  framework: PrimitiveVendoringFramework;
  generatedImportCandidateExtensions: readonly string[];
  includeLocalImportGraph?: boolean;
  outputDir: string;
  sourceRoot: string;
};

type PackageMetadata = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  version?: string;
};

const TARGETS: TargetDefinition[] = getFrameworkAdapterTargetsWithStyledCapability()
  .filter(isCliRegisteredStyledCapabilityEntry)
  .map(({ capability, target }) => ({
    capability,
    registration: getPrimitiveFrameworkAdapterTarget(target),
  }))
  .map(({ capability, registration }) => {
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
      target: registration.target,
    };
  });

const PRIMITIVE_VENDORED_TARGETS: PrimitiveVendoringTargetDefinition[] =
  primitiveFrameworkAdapterTargets.filter(isPrimitiveVendoringTarget).map((target) => {
    const primitiveArtifact = target.cliRegistry.primitiveArtifact;

    return {
      extraPackageRequirements: primitiveArtifact.extraPackageRequirements,
      framework: target.target,
      generatedImportCandidateExtensions: target.cliRegistry.generatedImportCandidateExtensions,
      includeLocalImportGraph: primitiveArtifact.includeLocalImportGraph,
      outputDir: primitiveArtifact.outputDir,
      sourceRoot: primitiveArtifact.sourceRoot,
    };
  });

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
  options: { contracts?: StyledAdapterContract[] } = {},
): StyledArtifactPlanningFacts {
  const contracts = options.contracts ?? starwindStyledContracts;
  const targets: StyledArtifactPlanningFacts["targets"] = {};

  for (const target of TARGETS) {
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
  const packageRanges = await loadPackageRanges(repoRoot);
  const versionManifest = await loadRegistryVersionManifest({
    repoRoot,
    versionManifestPath: options.versionManifestPath,
  });
  validateRegistryVersionManifest(versionManifest, {
    contracts,
    manifestPath: options.versionManifestPath ?? DEFAULT_REGISTRY_VERSION_MANIFEST,
    requireComponentVersions: options.componentVersion === undefined,
  });
  const styledArtifactPlanningFacts = buildStyledArtifactPlanningFacts({ contracts });

  try {
    const targetOutputs = new Map<RegistryImplementationTarget, string>();

    for (const target of TARGETS) {
      const targetContracts = contracts.filter((contract) =>
        isForFramework(contract, target.target),
      );
      if (targetContracts.length === 0) continue;

      await generateFrameworkStyledWrappers(target.target, {
        contracts: targetContracts,
        generatedBy: "scripts/portable-runtime/generate-cli-registry.ts",
        outputRoot: path.join(tempRoot, target.outputDir),
        primitiveImportBase: target.primitiveImportBase,
        primitiveOutputRoot: path.join(tempRoot, target.primitiveOutputDir),
      });

      targetOutputs.set(target.target, path.join(tempRoot, target.outputDir));
    }

    return {
      $schema: "https://starwind.dev/registry-schema.v2.json",
      version: options.registryVersion ?? versionManifest.registryVersion,
      components: await Promise.all(
        contracts.map(async (contract) => ({
          name: contract.component,
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
    const packageRanges = await loadPackageRanges(repoRoot);
    const primitives: PrimitiveVendoringArtifact[] = [];

    for (const target of PRIMITIVE_VENDORED_TARGETS) {
      const outputRoot = path.join(tempRoot, target.outputDir);

      await generateFrameworkPrimitiveWrappers(target.framework, {
        generatedBy: "scripts/portable-runtime/generate-cli-registry.ts",
        outputRoot,
      });

      primitives.push(
        ...(await Promise.all(
          contracts.map(async (contract) => {
            const files = await readGeneratedPrimitiveFiles({
              component: contract.component,
              generatedImportCandidateExtensions: target.generatedImportCandidateExtensions,
              framework: target.framework,
              includeLocalImportGraph: target.includeLocalImportGraph,
              outputRoot,
              primitiveInstallRoot,
              repoRoot,
              sourceRoot: target.sourceRoot,
            });

            return {
              component: contract.component,
              framework: target.framework,
              version: primitiveVersionManifest.primitives[contract.component],
              files,
              packageRequirements: collectPrimitivePackageRequirements({
                extraPackageNames: target.extraPackageRequirements,
                files,
                packageRanges,
              }),
            };
          }),
        )),
      );
    }

    return {
      $schema: "https://starwind.dev/primitive-vendoring-artifacts-schema.v1.json",
      primitives,
    };
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
  targetOutputs: Map<RegistryImplementationTarget, string>;
}): Promise<Record<RegistryImplementationTarget, RegistryTarget>> {
  const targets = {} as Record<RegistryImplementationTarget, RegistryTarget>;

  for (const target of TARGETS) {
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

async function loadPackageRanges(repoRoot: string): Promise<Map<string, string>> {
  const ranges = new Map<string, string>();

  await addPackageVersionRange(ranges, repoRoot, "packages/astro/package.json");
  await addPackageVersionRange(ranges, repoRoot, "packages/react/package.json");
  await addPackageVersionRange(ranges, repoRoot, "packages/runtime/package.json");
  await addPackageDependencyRanges(ranges, repoRoot, "packages/astro/package.json");
  await addPackageDependencyRanges(ranges, repoRoot, "packages/react/package.json");
  await addPackageDependencyRanges(ranges, repoRoot, "apps/demo/package.json");
  await addPackageDependencyRanges(ranges, repoRoot, "apps/react-demo/package.json");

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

  return rawManifest;
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

  return rawManifest;
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

  const missingComponents = options.contracts
    .map((contract) => contract.component)
    .filter((componentName) => manifest.primitives[componentName] === undefined);

  if (missingComponents.length > 0) {
    throw new Error(
      `Primitive version manifest ${options.manifestPath} is missing primitive version entries for: ${missingComponents.join(", ")}`,
    );
  }
}

function isRegistryVersionManifest(value: unknown): value is RegistryVersionManifest {
  if (!value || typeof value !== "object") return false;

  const manifest = value as Partial<RegistryVersionManifest>;
  return (
    typeof manifest.registryVersion === "string" &&
    typeof manifest.defaultComponentVersion === "string" &&
    Boolean(manifest.components) &&
    typeof manifest.components === "object" &&
    Object.values(manifest.components).every((version) => typeof version === "string")
  );
}

function isPrimitiveVersionManifest(value: unknown): value is PrimitiveVersionManifest {
  if (!value || typeof value !== "object") return false;

  const manifest = value as Partial<PrimitiveVersionManifest>;
  return (
    typeof manifest.defaultPrimitiveVersion === "string" &&
    Boolean(manifest.primitives) &&
    typeof manifest.primitives === "object" &&
    Object.values(manifest.primitives).every((version) => typeof version === "string")
  );
}

function assertSemver(version: string, label: string): void {
  if (!isSemverVersion(version)) {
    throw new Error(`${label} must be a semver version. Received "${version}".`);
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
): Promise<void> {
  const packageJson = await readPackageJson(repoRoot, packageJsonPath);
  const name = getPackageName(packageJson, packageJsonPath);

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

  return [...packageNames]
    .sort()
    .map((name) => ({ name, range: getPackageRange(name, options.packageRanges) }));
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

function getCliRegistryAdapterPackage(target: RegistryImplementationTarget): string {
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
  framework: PrimitiveVendoringArtifact["framework"];
  generatedImportCandidateExtensions: readonly string[];
  includeLocalImportGraph?: boolean;
  outputRoot: string;
  primitiveInstallRoot: string;
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
      const content = formatPrimitiveVendoringContent(
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
  if (path.posix.extname(importPath)) {
    return [importPath];
  }

  const candidateExtensions = [...new Set(generatedImportCandidateExtensions)];

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

async function formatJsonDocument(value: unknown, filepath: string): Promise<string> {
  return formatWithPrettier(JSON.stringify(value), {
    ...((await resolvePrettierConfig(filepath)) ?? {}),
    filepath,
    parser: "json",
  });
}

function formatPrimitiveVendoringContent(content: string): string {
  return content.replace(
    /\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-cli-registry\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\//g,
    "/**\n * Vendored by the Starwind CLI.\n * You own this file in your project.\n */",
  );
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
