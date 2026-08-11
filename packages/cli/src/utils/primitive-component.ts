import { createHash } from "node:crypto";
import path from "node:path";

import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";

import primitiveVendoringArtifacts from "../registry/primitive-vendoring-artifacts.json" with { type: "json" };
import {
  type PrimitiveConfigFor,
  type StarwindConfigFor,
  type StarwindFramework,
  updateConfig,
} from "./config.js";
import { PATHS } from "./constants.js";
import { filterUninstalledDependencies } from "./dependency-resolver.js";
import {
  type CliFrameworkTarget,
  type FrameworkTargetPolicy,
  getPrimitiveArtifactIntegrityFingerprint,
  isConfigTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "./framework-target-policy.js";
import { installDependenciesWithProgress, type PackageManager } from "./package-manager.js";
import {
  assertProjectRelativePath,
  resolveProjectMutationPath,
  resolveProjectPathLexically,
} from "./project-path.js";
import type { Component, RegistryPackageRequirement, RegistryTarget } from "./registry.js";
import type {
  RuntimeUpdatePlan,
  RuntimeUpdatePlanFile,
  RuntimeUpdatePlanItem,
} from "./runtime-component.js";

type PrimitiveVendoringFile = {
  content: string;
  path: string;
  sourceHash: string;
  sourcePath: string;
};

type PrimitiveVendoringTargetDescriptor = {
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

export type PrimitiveVendoringArtifact<TFramework extends CliFrameworkTarget = StarwindFramework> =
  {
    component: string;
    files: PrimitiveVendoringFile[];
    framework: TFramework;
    packageRequirements: RegistryPackageRequirement[];
    version: string;
  };

export type PrimitiveVendoringArtifactSet<
  TFramework extends CliFrameworkTarget = StarwindFramework,
> = {
  $schema?: string;
  primitives: PrimitiveVendoringArtifact<TFramework>[];
  integrity?: {
    algorithm: "sha256";
    fingerprint: string;
  };
  validation?: Partial<Record<TFramework, PrimitiveVendoringTargetDescriptor>>;
};

type PrimitiveInstallStatus = {
  error?: string;
  name: string;
  status: "installed" | "skipped" | "failed";
  version?: string;
};

export type PrimitiveInstallSummary = {
  failed: PrimitiveInstallStatus[];
  installed: PrimitiveInstallStatus[];
  skipped: PrimitiveInstallStatus[];
};

type PrimitiveUpdateStatus = {
  error?: string;
  name: string;
  newVersion?: string;
  oldVersion?: string;
  status: "updated" | "skipped" | "failed";
};

export type PrimitiveUpdateSummary = {
  failed: PrimitiveUpdateStatus[];
  skipped: PrimitiveUpdateStatus[];
  updated: PrimitiveUpdateStatus[];
};

export type PrimitiveUpdatePlan<TFramework extends CliFrameworkTarget = StarwindFramework> = Omit<
  RuntimeUpdatePlan,
  "updates"
> & {
  updates: Array<Omit<RuntimeUpdatePlanItem, "framework"> & { framework: TFramework }>;
};

type PrimitiveComponentOptions<TFramework extends CliFrameworkTarget = StarwindFramework> = {
  artifacts?: PrimitiveVendoringArtifactSet<TFramework>;
  config: StarwindConfigFor<TFramework>;
  framework?: TFramework;
  overwrite?: boolean;
  packageManager?: PackageManager;
  primitiveDir?: string;
  skipPrompts?: boolean;
  targetPolicy?: FrameworkTargetPolicy<TFramework>;
};

const DEFAULT_PRIMITIVE_ROOT = PATHS.LOCAL_STARWIND_PRIMITIVES_DIR;

export function getPrimitiveComponents<TFramework extends CliFrameworkTarget = StarwindFramework>(
  options: {
    artifacts?: PrimitiveVendoringArtifactSet<TFramework>;
    framework?: TFramework;
    targetPolicy?: FrameworkTargetPolicy<TFramework>;
  } = {},
): PrimitiveVendoringArtifact<TFramework>[] {
  const targetPolicy = getTargetPolicy(options.targetPolicy);
  const artifactSet: PrimitiveVendoringArtifactSet<TFramework> =
    options.artifacts ??
    (primitiveVendoringArtifacts as unknown as PrimitiveVendoringArtifactSet<TFramework>);
  const framework = options.framework ?? ("astro" as TFramework);

  if (!isConfigTarget(targetPolicy, framework)) return [];
  if (!isPublicPrimitiveFramework(framework)) {
    validatePrimitiveArtifactIntegrity(artifactSet, framework, targetPolicy);
  }

  return (artifactSet.primitives as PrimitiveVendoringArtifact<TFramework>[])
    .filter((primitive) => primitive.framework === framework)
    .map((primitive) => validatePrimitiveArtifact(primitive, artifactSet))
    .sort((a, b) => a.component.localeCompare(b.component));
}

export async function installPrimitiveComponents<TFramework extends CliFrameworkTarget>(
  componentNames: string[],
  options: PrimitiveComponentOptions<TFramework>,
): Promise<PrimitiveInstallSummary> {
  const summary: PrimitiveInstallSummary = {
    failed: [],
    installed: [],
    skipped: [],
  };
  const targetPolicy = getTargetPolicy(options.targetPolicy);
  const framework = getPrimitiveVendoringFramework(options.config, options.framework, targetPolicy);
  const unsupportedError = getUnsupportedConfigError(options.config, framework, targetPolicy);

  if (!framework || unsupportedError) {
    return {
      ...summary,
      failed: componentNames.map((name) => ({
        name,
        status: "failed",
        error: unsupportedError,
      })),
    };
  }

  const artifacts = getPrimitiveComponents({
    artifacts: options.artifacts,
    framework,
    targetPolicy,
  });
  const installedNames = new Set(
    (options.config.primitives ?? [])
      .filter(
        (primitive) =>
          getPrimitiveConfigFramework(options.config, primitive, targetPolicy) === framework,
      )
      .map((item) => item.name),
  );
  const plannedArtifacts: PrimitiveVendoringArtifact<TFramework>[] = [];

  for (const componentName of componentNames) {
    const artifact = artifacts.find((candidate) => candidate.component === componentName);

    if (!artifact) {
      summary.failed.push({
        name: componentName,
        status: "failed",
        error: "Primitive component not found in registry",
      });
      continue;
    }

    if (installedNames.has(artifact.component)) {
      summary.skipped.push({
        name: artifact.component,
        status: "skipped",
        version: artifact.version,
      });
      continue;
    }

    plannedArtifacts.push(artifact);
  }

  if (summary.failed.length > 0 || plannedArtifacts.length === 0) {
    return summary;
  }

  const plannedFiles = new Map<PrimitiveVendoringArtifact<TFramework>, PreparedPrimitiveFile[]>();

  try {
    for (const artifact of plannedArtifacts) {
      const files = preparePrimitiveFiles(
        options.config,
        artifact.files,
        framework,
        options.primitiveDir,
        targetPolicy,
      );
      plannedFiles.set(artifact, await resolvePreparedPrimitiveFiles(files));
    }
  } catch (error) {
    return {
      ...summary,
      failed: componentNames.map((name) => ({
        name,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      })),
    };
  }

  const writableArtifacts: PrimitiveVendoringArtifact<TFramework>[] = [];

  for (const artifact of plannedArtifacts) {
    const files = plannedFiles.get(artifact)!;
    const shouldWrite = await shouldWritePrimitiveFiles(files, options);

    if (!shouldWrite) {
      summary.skipped.push({
        name: artifact.component,
        status: "skipped",
        version: artifact.version,
      });
      continue;
    }

    writableArtifacts.push(artifact);
  }

  if (writableArtifacts.length === 0) {
    return summary;
  }

  const packageRequirements = dedupePackageRequirements(
    writableArtifacts.flatMap((artifact) => artifact.packageRequirements),
  );
  const packagesToInstall = await filterUninstalledDependencies(
    packageRequirements.map(formatPackageRequirement),
  );

  if (packagesToInstall.length > 0) {
    await installDependenciesWithProgress(packagesToInstall, options.packageManager);
  }

  for (const artifact of writableArtifacts) {
    const files = plannedFiles.get(artifact)!;
    await writePreparedPrimitiveFiles(files);
    summary.installed.push({
      name: artifact.component,
      status: "installed",
      version: artifact.version,
    });
  }

  if (summary.installed.length > 0) {
    await updateConfig(
      {
        ...getPrimitiveDirConfigUpdate(
          options.config,
          framework,
          getPrimitiveDir(options.config, framework, options.primitiveDir, targetPolicy),
          targetPolicy,
        ),
        primitives: summary.installed.map((primitive) => ({
          name: primitive.name,
          version: primitive.version!,
          framework,
          source: "bundled",
        })),
      },
      {
        appendComponents: true,
        ...(options.targetPolicy ? { targetPolicy } : {}),
      },
    );
  }

  return summary;
}

export async function planPrimitiveComponentUpdates<TFramework extends CliFrameworkTarget>(
  componentNames: string[],
  options: PrimitiveComponentOptions<TFramework>,
): Promise<PrimitiveUpdatePlan<TFramework>> {
  const plan: PrimitiveUpdatePlan<TFramework> = {
    failed: [],
    packageRequirements: [],
    packagesToInstall: [],
    skipped: [],
    updates: [],
  };
  const targetPolicy = getTargetPolicy(options.targetPolicy);
  const framework = getPrimitiveVendoringFramework(options.config, options.framework, targetPolicy);
  const unsupportedError = getUnsupportedConfigError(options.config, framework, targetPolicy);

  if (!framework || unsupportedError) {
    return {
      ...plan,
      failed: componentNames.map((name) => ({
        name,
        status: "failed",
        error: unsupportedError,
      })),
    };
  }

  const artifacts = getPrimitiveComponents({
    artifacts: options.artifacts,
    framework,
    targetPolicy,
  });

  for (const componentName of componentNames) {
    const currentPrimitiveIndex = (options.config.primitives ?? []).findIndex(
      (primitive) =>
        primitive.name === componentName &&
        getPrimitiveConfigFramework(options.config, primitive, targetPolicy) === framework,
    );
    const currentPrimitive =
      currentPrimitiveIndex >= 0 ? options.config.primitives![currentPrimitiveIndex] : undefined;

    if (!currentPrimitive) {
      plan.failed.push({
        name: componentName,
        status: "failed",
        error: "Primitive component is not installed in this project.",
      });
      continue;
    }

    const artifact = artifacts.find((candidate) => candidate.component === componentName);

    if (!artifact) {
      plan.failed.push({
        name: componentName,
        status: "failed",
        error: "Primitive component not found in registry",
      });
      continue;
    }

    if (!semver.gt(artifact.version, currentPrimitive.version)) {
      plan.skipped.push({
        name: componentName,
        status: "skipped",
        oldVersion: currentPrimitive.version,
        newVersion: artifact.version,
      });
      continue;
    }

    try {
      const preparedFiles = await resolvePreparedPrimitiveFiles(
        preparePrimitiveFiles(
          options.config,
          artifact.files,
          framework,
          options.primitiveDir,
          targetPolicy,
        ),
      );
      const files = await Promise.all(
        preparedFiles.map(async (file): Promise<RuntimeUpdatePlanFile> => {
          const exists = await fs.pathExists(file.destination);
          const currentContent = exists ? await fs.readFile(file.destination, "utf-8") : "";

          return {
            ...file,
            currentContent,
            exists,
            changed: currentContent !== file.content,
          };
        }),
      );

      plan.updates.push({
        component: toRegistryComponent(artifact),
        componentIndex: currentPrimitiveIndex,
        files,
        framework,
        newVersion: artifact.version,
        oldVersion: currentPrimitive.version,
        packageRequirements: dedupePackageRequirements(artifact.packageRequirements),
        packagesToInstall: [],
        target: toRegistryTarget(artifact),
      });
    } catch (error) {
      plan.failed.push({
        name: componentName,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await finalizePrimitiveUpdatePackagePlan(plan);

  return plan;
}

export async function updatePrimitiveComponents<TFramework extends CliFrameworkTarget>(
  componentNames: string[],
  options: PrimitiveComponentOptions<TFramework>,
): Promise<PrimitiveUpdateSummary> {
  const summary: PrimitiveUpdateSummary = {
    failed: [],
    skipped: [],
    updated: [],
  };
  const plan = await planPrimitiveComponentUpdates(componentNames, options);
  const targetPolicy = getTargetPolicy(options.targetPolicy);
  const framework = getPrimitiveVendoringFramework(
    options.config,
    options.framework,
    targetPolicy,
  )!;

  summary.failed.push(...plan.failed);
  summary.skipped.push(...plan.skipped);

  let skipPackageDependentUpdates = false;

  if (plan.packagesToInstall.length > 0) {
    if (!options.skipPrompts) {
      const packageDependentComponents = plan.updates
        .filter((item) => item.packagesToInstall.length > 0)
        .map((item) => item.component.name)
        .join(", ");

      p.log.warn(
        `Updating primitive source for ${packageDependentComponents} requires package updates: ${plan.packagesToInstall.join(", ")}`,
      );
      const shouldInstallPackages = await p.confirm({
        message: "Install required package updates before updating these primitives?",
        initialValue: true,
      });

      if (p.isCancel(shouldInstallPackages) || !shouldInstallPackages) {
        skipPackageDependentUpdates = true;
      }
    }

    if (!skipPackageDependentUpdates) {
      await installDependenciesWithProgress(plan.packagesToInstall, options.packageManager);
    }
  }

  const updatedPrimitives = [...(options.config.primitives ?? [])];

  for (const item of plan.updates) {
    if (skipPackageDependentUpdates && item.packagesToInstall.length > 0) {
      summary.skipped.push({
        name: item.component.name,
        status: "skipped",
        oldVersion: item.oldVersion,
        newVersion: item.newVersion,
      });
      continue;
    }

    await writePreparedPrimitiveFiles(item.files);

    const currentIndex = updatedPrimitives.findIndex(
      (primitive) =>
        primitive.name === item.component.name &&
        getPrimitiveConfigFramework(options.config, primitive, targetPolicy) === framework,
    );
    const nextPrimitive: PrimitiveConfigFor<TFramework> = {
      name: item.component.name,
      version: item.newVersion,
      framework,
      source: "bundled",
    };

    if (currentIndex === -1) {
      updatedPrimitives.push(nextPrimitive);
    } else {
      updatedPrimitives[currentIndex] = {
        ...updatedPrimitives[currentIndex],
        ...nextPrimitive,
      };
    }

    summary.updated.push({
      name: item.component.name,
      status: "updated",
      oldVersion: item.oldVersion,
      newVersion: item.newVersion,
    });
  }

  if (summary.updated.length > 0) {
    await updateConfig(
      {
        ...getPrimitiveDirConfigUpdate(
          options.config,
          framework,
          getPrimitiveDir(options.config, framework, options.primitiveDir, targetPolicy),
          targetPolicy,
        ),
        primitives: updatedPrimitives,
      },
      {
        appendComponents: false,
        ...(options.targetPolicy ? { targetPolicy } : {}),
      },
    );
  }

  return summary;
}

type PreparedPrimitiveFile = {
  content: string;
  destination: string;
  path: string;
};

function getUnsupportedConfigError<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  framework: TFramework | undefined,
  targetPolicy: FrameworkTargetPolicy<TFramework>,
): string | undefined {
  if (!framework || !getPrimitiveVendoringFramework(config, undefined, targetPolicy)) {
    return "Primitive vendoring currently supports Astro and React projects only.";
  }

  return undefined;
}

export function getPrimitiveVendoringFramework<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  framework?: TFramework,
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): TFramework | undefined {
  const policy = getTargetPolicy(targetPolicy);

  if (framework !== undefined) {
    return isConfigTarget(policy, framework) ? framework : undefined;
  }

  if (isConfigTarget(policy, config.framework)) return config.framework;

  return undefined;
}

function getPrimitiveConfigFramework<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  primitive: PrimitiveConfigFor<TFramework>,
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): TFramework | undefined {
  return primitive.framework ?? getPrimitiveVendoringFramework(config, undefined, targetPolicy);
}

function getDefaultAlternativePrimitiveDir(framework: CliFrameworkTarget): string {
  return `src/components/starwind-${framework}-primitives`;
}

function getPrimitiveDir<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  framework: TFramework,
  primitiveDirOverride?: string,
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): string {
  if (primitiveDirOverride) {
    return primitiveDirOverride;
  }

  const primaryFramework = getPrimitiveVendoringFramework(config, undefined, targetPolicy);

  if (primaryFramework && framework !== primaryFramework) {
    return config.primitiveDirs?.[framework] ?? getDefaultAlternativePrimitiveDir(framework);
  }

  return config.primitiveDir ?? DEFAULT_PRIMITIVE_ROOT;
}

function getPrimitiveDirConfigUpdate<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  framework: TFramework,
  primitiveDir: string,
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): Pick<StarwindConfigFor<TFramework>, "primitiveDir" | "primitiveDirs"> {
  const primaryFramework = getPrimitiveVendoringFramework(config, undefined, targetPolicy);

  if (!primaryFramework || framework === primaryFramework) {
    return { primitiveDir };
  }

  return {
    primitiveDirs: {
      [framework]: primitiveDir,
    } as Partial<Record<TFramework, string>>,
  };
}

function preparePrimitiveFiles<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  files: PrimitiveVendoringFile[],
  framework: TFramework,
  primitiveDirOverride?: string,
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): PreparedPrimitiveFile[] {
  const primitiveDir = normalizeProjectRelativePath(
    getPrimitiveDir(config, framework, primitiveDirOverride, targetPolicy),
    "primitive directory",
  );
  const defaultRoot = toPortablePath(DEFAULT_PRIMITIVE_ROOT);

  return files.map((file) => {
    if (!file.path.startsWith(`${defaultRoot}/`)) {
      throw new Error(`Primitive artifact file "${file.path}" must be inside ${defaultRoot}.`);
    }

    const relativePath = file.path.slice(defaultRoot.length + 1);
    const targetPath = toPortablePath(path.posix.join(primitiveDir, relativePath));

    if (!targetPath.startsWith(`${primitiveDir}/`)) {
      throw new Error(`Primitive artifact file "${file.path}" must stay inside ${primitiveDir}.`);
    }

    return {
      content: file.content,
      destination: resolveProjectPathLexically(targetPath),
      path: targetPath,
    };
  });
}

async function shouldWritePrimitiveFiles<TFramework extends CliFrameworkTarget>(
  files: PreparedPrimitiveFile[],
  options: PrimitiveComponentOptions<TFramework>,
): Promise<boolean> {
  if (options.overwrite) return true;

  const conflictingFiles = [];

  for (const file of files) {
    if (!(await fs.pathExists(file.destination))) continue;

    const currentContent = await fs.readFile(file.destination, "utf-8");

    if (currentContent !== file.content) {
      conflictingFiles.push(file.path);
    }
  }

  if (conflictingFiles.length === 0) return true;
  if (options.skipPrompts) return false;

  const shouldOverwrite = await p.confirm({
    message: `Existing primitive files were found at ${conflictingFiles[0]}. Do you want Starwind to overwrite matching generated files? Local-only files will be left alone.`,
    initialValue: false,
  });

  return !p.isCancel(shouldOverwrite) && shouldOverwrite;
}

async function writePreparedPrimitiveFiles(files: PreparedPrimitiveFile[]): Promise<void> {
  for (const file of files) {
    const directoryDestination = await resolveProjectMutationPath(file.path);
    await fs.ensureDir(path.dirname(directoryDestination));
    const fileDestination = await resolveProjectMutationPath(file.path);
    await fs.writeFile(fileDestination, file.content, "utf-8");
  }
}

async function resolvePreparedPrimitiveFiles(
  files: PreparedPrimitiveFile[],
): Promise<PreparedPrimitiveFile[]> {
  return Promise.all(
    files.map(async (file) => ({
      ...file,
      destination: await resolveProjectMutationPath(file.path),
    })),
  );
}

async function finalizePrimitiveUpdatePackagePlan<TFramework extends CliFrameworkTarget>(
  plan: PrimitiveUpdatePlan<TFramework>,
): Promise<void> {
  if (plan.updates.length === 0) return;

  plan.packageRequirements = dedupePackageRequirements(
    plan.updates.flatMap((item) => item.packageRequirements),
  );
  plan.packagesToInstall = await filterUninstalledDependencies(
    plan.packageRequirements.map(formatPackageRequirement),
  );

  const packagesToInstall = new Set(plan.packagesToInstall);

  for (const item of plan.updates) {
    item.packagesToInstall = item.packageRequirements
      .map(formatPackageRequirement)
      .filter((requirement) => packagesToInstall.has(requirement));
  }
}

function dedupePackageRequirements(
  requirements: RegistryPackageRequirement[],
): RegistryPackageRequirement[] {
  const deduped = new Map<string, RegistryPackageRequirement>();

  for (const requirement of requirements) {
    const existing = deduped.get(requirement.name);

    if (!existing) {
      deduped.set(requirement.name, requirement);
      continue;
    }

    if (existing.range !== requirement.range) {
      throw new Error(
        `Conflicting package requirements for ${requirement.name}: ${existing.range} and ${requirement.range}`,
      );
    }
  }

  return [...deduped.values()];
}

function formatPackageRequirement(requirement: RegistryPackageRequirement): string {
  return requirement.range === "*" ? requirement.name : `${requirement.name}@${requirement.range}`;
}

function toRegistryComponent(artifact: PrimitiveVendoringArtifact<CliFrameworkTarget>): Component {
  return {
    name: artifact.component,
    version: artifact.version,
    dependencies: [],
    type: "component",
  };
}

function toRegistryTarget(
  artifact: PrimitiveVendoringArtifact<CliFrameworkTarget>,
): RegistryTarget {
  return {
    files: artifact.files,
    componentDependencies: [],
    packageRequirements: artifact.packageRequirements,
  };
}

function normalizeProjectRelativePath(value: string, label: string): string {
  assertProjectRelativePath(value, `Starwind ${label}`);
  const portablePath = value.replace(/\\/g, "/");

  const normalizedPath = path.posix.normalize(portablePath);

  return toPortablePath(normalizedPath);
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/\/+$/, "");
}

function getTargetPolicy<TFramework extends CliFrameworkTarget>(
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): FrameworkTargetPolicy<TFramework> {
  return (
    targetPolicy ?? (PUBLIC_FRAMEWORK_TARGET_POLICY as unknown as FrameworkTargetPolicy<TFramework>)
  );
}

function validatePrimitiveArtifact<TFramework extends CliFrameworkTarget>(
  artifact: PrimitiveVendoringArtifact<TFramework>,
  artifactSet: PrimitiveVendoringArtifactSet<TFramework>,
): PrimitiveVendoringArtifact<TFramework> {
  const bundledArtifacts = getBundledPrimitiveArtifacts();
  const isPublicFramework = isPublicPrimitiveFramework(artifact.framework);

  if (artifact.component === "theme") {
    throw new Error("Theme is a package facade and cannot be vendored as primitive source.");
  }

  const descriptor = artifactSet.validation?.[artifact.framework];

  if (!descriptor) {
    if (isPublicFramework) return artifact;
    throw new Error(
      `Primitive artifact target "${artifact.framework}" is missing its generated validation descriptor.`,
    );
  }

  validatePrimitiveTargetDescriptor(artifact.framework, descriptor);

  const bundledArtifact = bundledArtifacts.find(
    (candidate) => candidate.component === artifact.component,
  );
  if (!bundledArtifact) {
    throw new Error(
      `Primitive artifact "${artifact.component}" is not in the bundled Primitive inventory.`,
    );
  }
  if (artifact.version !== bundledArtifact.version) {
    throw new Error(
      `Primitive artifact "${artifact.component}" must use manifest version ${bundledArtifact.version}.`,
    );
  }
  if (!hasExactPackageRequirements(artifact.packageRequirements, descriptor.packageRequirements)) {
    throw new Error(
      `Primitive artifact "${artifact.component}" must use its generated package requirements.`,
    );
  }
  if (artifact.files.length === 0) {
    throw new Error(`Primitive artifact "${artifact.component}" has no vendorable files.`);
  }

  const seenPaths = new Set<string>();
  for (const file of artifact.files) {
    validatePrimitiveArtifactFile(artifact.component, file, descriptor, seenPaths);
  }
  validatePrimitiveArtifactClosure(artifact, descriptor);

  return artifact;
}

function getBundledPrimitiveArtifacts(): PrimitiveVendoringArtifact<StarwindFramework>[] {
  return (primitiveVendoringArtifacts as PrimitiveVendoringArtifactSet<StarwindFramework>)
    .primitives;
}

function isPublicPrimitiveFramework(framework: CliFrameworkTarget): boolean {
  return new Set(getBundledPrimitiveArtifacts().map(({ framework: target }) => target)).has(
    framework as StarwindFramework,
  );
}

function validatePrimitiveArtifactIntegrity<TFramework extends CliFrameworkTarget>(
  artifactSet: PrimitiveVendoringArtifactSet<TFramework>,
  target: TFramework,
  targetPolicy: FrameworkTargetPolicy<TFramework>,
): void {
  const trustedFingerprint = getPrimitiveArtifactIntegrityFingerprint(targetPolicy, target);
  if (!trustedFingerprint) {
    throw new Error(`Primitive artifact target "${target}" has no trusted integrity fingerprint.`);
  }

  const integrity = artifactSet.integrity;
  if (
    !integrity ||
    integrity.algorithm !== "sha256" ||
    integrity.fingerprint !== trustedFingerprint
  ) {
    throw new Error(
      `Primitive artifact target "${target}" does not match its trusted integrity fingerprint.`,
    );
  }

  const { integrity: _integrity, ...rawDocument } = artifactSet;
  const document = normalizePrimitiveArtifactIntegrityDocument(rawDocument);
  const computedFingerprint = `sha256:${createHash("sha256")
    .update(toCanonicalPrimitiveArtifactJson(document))
    .digest("hex")}`;
  if (computedFingerprint !== trustedFingerprint) {
    throw new Error(
      `Primitive artifact target "${target}" does not match its trusted integrity fingerprint.`,
    );
  }
}

const RELEASE_MANAGED_PRIMITIVE_PACKAGES = new Set([
  "@starwind-ui/astro",
  "@starwind-ui/react",
  "@starwind-ui/runtime",
  "@starwind-ui/svelte",
  "@starwind-ui/vue",
]);

function normalizePrimitiveArtifactIntegrityDocument<TFramework extends CliFrameworkTarget>(
  artifactSet: Omit<PrimitiveVendoringArtifactSet<TFramework>, "integrity">,
) {
  return {
    ...artifactSet,
    primitives: artifactSet.primitives.map((artifact) => ({
      ...artifact,
      packageRequirements: normalizeIntegrityPackageRequirements(artifact.packageRequirements),
      version: "<release-managed>",
    })),
    validation: artifactSet.validation
      ? Object.fromEntries(
          (
            Object.entries(artifactSet.validation) as Array<
              [string, PrimitiveVendoringTargetDescriptor | undefined]
            >
          ).map(([target, descriptor]) => [
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
}

function normalizeIntegrityPackageRequirements(
  requirements: readonly { name: string; range: string }[],
) {
  return requirements.map((requirement) =>
    RELEASE_MANAGED_PRIMITIVE_PACKAGES.has(requirement.name)
      ? { ...requirement, range: "<release-managed>" }
      : requirement,
  );
}

function toCanonicalPrimitiveArtifactJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(toCanonicalPrimitiveArtifactJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${toCanonicalPrimitiveArtifactJson(record[key])}`)
    .join(",")}}`;
}
function validatePrimitiveTargetDescriptor(
  framework: string,
  descriptor: PrimitiveVendoringTargetDescriptor,
): void {
  assertProjectRelativePath(descriptor.sourceRoot, `Primitive target "${framework}" source root`);
  const sourceRoot = toPortablePath(descriptor.sourceRoot);
  if (
    sourceRoot !== descriptor.sourceRoot ||
    path.posix.normalize(sourceRoot) !== sourceRoot ||
    !sourceRoot.endsWith("/src")
  ) {
    throw new Error(`Primitive target "${framework}" has an unsafe generated source root.`);
  }

  const extensions = descriptor.generatedImportCandidateExtensions;
  if (
    extensions.length === 0 ||
    new Set(extensions).size !== extensions.length ||
    extensions.some((extension) => !/^\.[a-z0-9]+$/i.test(extension))
  ) {
    throw new Error(`Primitive target "${framework}" has invalid generated file extensions.`);
  }

  const coveredExtensions = new Set<string>();
  if (descriptor.editableContentMarkers.length === 0) {
    throw new Error(`Primitive target "${framework}" has no editable content rules.`);
  }
  for (const rule of descriptor.editableContentMarkers) {
    if (
      rule.extensions.length === 0 ||
      rule.markers.length === 0 ||
      !["contains", "prefix"].includes(rule.position) ||
      rule.markers.some((marker) => marker.length === 0)
    ) {
      throw new Error(`Primitive target "${framework}" has an invalid editable content rule.`);
    }
    for (const extension of rule.extensions) {
      if (!extensions.includes(extension) || coveredExtensions.has(extension)) {
        throw new Error(`Primitive target "${framework}" has overlapping editable content rules.`);
      }
      coveredExtensions.add(extension);
    }
  }
  if (coveredExtensions.size !== extensions.length) {
    throw new Error(`Primitive target "${framework}" has incomplete editable content rules.`);
  }
  if (
    descriptor.forbiddenContent.length === 0 ||
    new Set(descriptor.forbiddenContent).size !== descriptor.forbiddenContent.length ||
    descriptor.forbiddenContent.some((marker) => marker.length === 0)
  ) {
    throw new Error(`Primitive target "${framework}" has invalid forbidden content rules.`);
  }
  if (
    descriptor.packageRequirements.length === 0 ||
    new Set(descriptor.packageRequirements.map(({ name }) => name)).size !==
      descriptor.packageRequirements.length ||
    descriptor.packageRequirements.some(({ name, range }) => !name || !range)
  ) {
    throw new Error(`Primitive target "${framework}" has invalid package requirements.`);
  }
}

function validatePrimitiveArtifactFile(
  component: string,
  file: PrimitiveVendoringFile,
  descriptor: PrimitiveVendoringTargetDescriptor,
  seenPaths: Set<string>,
): void {
  assertProjectRelativePath(file.path, `Primitive artifact "${component}" file`);
  const portablePath = file.path.replace(/\\/g, "/");
  const normalizedPath = path.posix.normalize(portablePath);
  const primitiveRoot = toPortablePath(DEFAULT_PRIMITIVE_ROOT);
  if (
    portablePath !== file.path ||
    normalizedPath !== portablePath ||
    !normalizedPath.startsWith(`${primitiveRoot}/`) ||
    seenPaths.has(normalizedPath)
  ) {
    throw new Error(
      `Primitive artifact "${component}" has unsafe or duplicate file "${file.path}".`,
    );
  }
  seenPaths.add(normalizedPath);

  const portableSourcePath = file.sourcePath.replace(/\\/g, "/");
  const normalizedSourcePath = path.posix.normalize(portableSourcePath);
  if (
    portableSourcePath !== file.sourcePath ||
    normalizedSourcePath !== portableSourcePath ||
    path.posix.isAbsolute(normalizedSourcePath) ||
    !normalizedSourcePath.startsWith(`${descriptor.sourceRoot}/`)
  ) {
    throw new Error(`Primitive artifact "${component}" has unsafe source "${file.sourcePath}".`);
  }

  const extension = path.posix.extname(normalizedSourcePath);
  if (!descriptor.generatedImportCandidateExtensions.includes(extension)) {
    throw new Error(`Primitive artifact "${component}" has unsupported file "${file.path}".`);
  }
  const rule = descriptor.editableContentMarkers.find((candidate) =>
    candidate.extensions.includes(extension),
  )!;
  const hasEditableHeader = rule.markers.some((marker) =>
    rule.position === "prefix" ? file.content.startsWith(marker) : file.content.includes(marker),
  );
  if (!hasEditableHeader) {
    throw new Error(
      `Primitive artifact "${component}" file "${file.path}" is missing its generated vendoring header.`,
    );
  }
  if (descriptor.forbiddenContent.some((marker) => file.content.includes(marker))) {
    throw new Error(
      `Primitive artifact "${component}" file "${file.path}" contains private package quarantine content.`,
    );
  }

  const expectedHash = `sha256:${createHash("sha256").update(file.content).digest("hex")}`;
  if (!/^sha256:[a-f0-9]{64}$/.test(file.sourceHash) || file.sourceHash !== expectedHash) {
    throw new Error(
      `Primitive artifact "${component}" file "${file.path}" has an invalid source hash.`,
    );
  }
}

function validatePrimitiveArtifactClosure<TFramework extends CliFrameworkTarget>(
  artifact: PrimitiveVendoringArtifact<TFramework>,
  descriptor: PrimitiveVendoringTargetDescriptor,
): void {
  const sourcePaths = new Set(artifact.files.map(({ sourcePath }) => sourcePath));
  for (const file of artifact.files) {
    const importerPath = file.sourcePath.slice(descriptor.sourceRoot.length + 1);
    for (const importSource of collectLocalPrimitiveImportSources(file.content)) {
      const normalizedBase = path.posix.normalize(
        path.posix.join(path.posix.dirname(importerPath), importSource),
      );
      if (
        normalizedBase === "." ||
        normalizedBase === ".." ||
        normalizedBase.startsWith("../") ||
        path.posix.isAbsolute(normalizedBase)
      ) {
        throw new Error(
          `Primitive artifact "${artifact.component}" import "${importSource}" escapes its generated source root.`,
        );
      }
      const resolved = getLocalPrimitiveImportCandidates(
        normalizedBase,
        descriptor.generatedImportCandidateExtensions,
      ).some((candidate) => sourcePaths.has(path.posix.join(descriptor.sourceRoot, candidate)));
      if (!resolved) {
        throw new Error(
          `Primitive artifact "${artifact.component}" import "${importSource}" has no vendored file.`,
        );
      }
    }
  }
}

function collectLocalPrimitiveImportSources(content: string): string[] {
  const sources = new Set<string>();
  const pattern =
    /(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']|import\(["']([^"']+)["']\)/g;
  for (const match of content.matchAll(pattern)) {
    const source = match[1] ?? match[2];
    if (source?.startsWith(".")) sources.add(source);
  }
  return [...sources];
}

function getLocalPrimitiveImportCandidates(importPath: string, extensions: string[]): string[] {
  const importExtension = path.posix.extname(importPath);
  if (importExtension) {
    if (![".js", ".jsx", ".mjs", ".cjs"].includes(importExtension)) return [importPath];
    const importBase = importPath.slice(0, -importExtension.length);
    return [
      importPath,
      ...extensions
        .filter((extension) => [".ts", ".tsx", ".mts", ".cts"].includes(extension))
        .map((extension) => importBase + extension),
    ];
  }
  return [
    ...extensions.map((extension) => `${importPath}${extension}`),
    ...extensions.map((extension) => path.posix.join(importPath, `index${extension}`)),
  ];
}

function hasExactPackageRequirements(
  actual: RegistryPackageRequirement[],
  expected: RegistryPackageRequirement[],
): boolean {
  if (actual.length !== expected.length) return false;
  const requirements = new Map(actual.map(({ name, range }) => [name, range]));
  return (
    requirements.size === actual.length &&
    expected.every(({ name, range }) => requirements.get(name) === range)
  );
}
