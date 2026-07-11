import path from "node:path";

import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";

import primitiveVendoringArtifacts from "../registry/primitive-vendoring-artifacts.json" with { type: "json" };
import {
  type PrimitiveConfig,
  type StarwindConfig,
  type StarwindFramework,
  updateConfig,
} from "./config.js";
import { PATHS } from "./constants.js";
import { filterUninstalledDependencies } from "./dependency-resolver.js";
import { installDependencies, type PackageManager } from "./package-manager.js";
import {
  assertProjectRelativePath,
  resolveProjectMutationPath,
  resolveProjectPathLexically,
} from "./project-path.js";
import type { Component, RegistryPackageRequirement, RegistryTarget } from "./registry.js";
import type { RuntimeUpdatePlan, RuntimeUpdatePlanFile } from "./runtime-component.js";

type PrimitiveVendoringFile = {
  content: string;
  path: string;
  sourceHash: string;
  sourcePath: string;
};

export type PrimitiveVendoringArtifact = {
  component: string;
  files: PrimitiveVendoringFile[];
  framework: StarwindFramework;
  packageRequirements: RegistryPackageRequirement[];
  version: string;
};

type PrimitiveVendoringArtifactSet = {
  $schema?: string;
  primitives: PrimitiveVendoringArtifact[];
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

type PrimitiveComponentOptions = {
  artifacts?: PrimitiveVendoringArtifactSet;
  config: StarwindConfig;
  framework?: StarwindFramework;
  overwrite?: boolean;
  packageManager?: PackageManager;
  primitiveDir?: string;
  skipPrompts?: boolean;
};

const DEFAULT_PRIMITIVE_ROOT = PATHS.LOCAL_STARWIND_PRIMITIVES_DIR;

export function getPrimitiveComponents(
  options: { artifacts?: PrimitiveVendoringArtifactSet; framework?: StarwindFramework } = {},
): PrimitiveVendoringArtifact[] {
  const artifactSet =
    options.artifacts ?? (primitiveVendoringArtifacts as PrimitiveVendoringArtifactSet);
  const framework = options.framework ?? "astro";

  return artifactSet.primitives
    .filter((primitive) => primitive.framework === framework)
    .sort((a, b) => a.component.localeCompare(b.component));
}

export async function installPrimitiveComponents(
  componentNames: string[],
  options: PrimitiveComponentOptions,
): Promise<PrimitiveInstallSummary> {
  const summary: PrimitiveInstallSummary = {
    failed: [],
    installed: [],
    skipped: [],
  };
  const framework = getPrimitiveVendoringFramework(options.config, options.framework);
  const unsupportedError = getUnsupportedConfigError(options.config, framework);

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
  });
  const installedNames = new Set(
    (options.config.primitives ?? [])
      .filter((primitive) => getPrimitiveConfigFramework(options.config, primitive) === framework)
      .map((item) => item.name),
  );
  const plannedArtifacts: PrimitiveVendoringArtifact[] = [];

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

  const plannedFiles = new Map<PrimitiveVendoringArtifact, PreparedPrimitiveFile[]>();

  try {
    for (const artifact of plannedArtifacts) {
      const files = preparePrimitiveFiles(
        options.config,
        artifact.files,
        framework,
        options.primitiveDir,
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

  const writableArtifacts: PrimitiveVendoringArtifact[] = [];

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
    await installDependencies(packagesToInstall, options.packageManager ?? "npm");
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
          getPrimitiveDir(options.config, framework, options.primitiveDir),
        ),
        primitives: summary.installed.map((primitive) => ({
          name: primitive.name,
          version: primitive.version!,
          framework,
          source: "bundled",
        })),
      },
      { appendComponents: true },
    );
  }

  return summary;
}

export async function planPrimitiveComponentUpdates(
  componentNames: string[],
  options: PrimitiveComponentOptions,
): Promise<RuntimeUpdatePlan> {
  const plan: RuntimeUpdatePlan = {
    failed: [],
    packageRequirements: [],
    packagesToInstall: [],
    skipped: [],
    updates: [],
  };
  const framework = getPrimitiveVendoringFramework(options.config, options.framework);
  const unsupportedError = getUnsupportedConfigError(options.config, framework);

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
  });

  for (const componentName of componentNames) {
    const currentPrimitiveIndex = (options.config.primitives ?? []).findIndex(
      (primitive) =>
        primitive.name === componentName &&
        getPrimitiveConfigFramework(options.config, primitive) === framework,
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
        preparePrimitiveFiles(options.config, artifact.files, framework, options.primitiveDir),
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

export async function updatePrimitiveComponents(
  componentNames: string[],
  options: PrimitiveComponentOptions,
): Promise<PrimitiveUpdateSummary> {
  const summary: PrimitiveUpdateSummary = {
    failed: [],
    skipped: [],
    updated: [],
  };
  const plan = await planPrimitiveComponentUpdates(componentNames, options);
  const framework = getPrimitiveVendoringFramework(options.config, options.framework)!;

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
      await installDependencies(plan.packagesToInstall, options.packageManager ?? "npm");
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
        getPrimitiveConfigFramework(options.config, primitive) === framework,
    );
    const nextPrimitive: PrimitiveConfig = {
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
          getPrimitiveDir(options.config, framework, options.primitiveDir),
        ),
        primitives: updatedPrimitives,
      },
      { appendComponents: false },
    );
  }

  return summary;
}

type PreparedPrimitiveFile = {
  content: string;
  destination: string;
  path: string;
};

function getUnsupportedConfigError(
  config: StarwindConfig,
  framework: StarwindFramework | undefined,
): string | undefined {
  if (!framework || !getPrimitiveVendoringFramework(config)) {
    return "Primitive vendoring currently supports Astro and React projects only.";
  }

  return undefined;
}

export function getPrimitiveVendoringFramework(
  config: StarwindConfig,
  framework?: StarwindFramework,
): StarwindFramework | undefined {
  if (framework) {
    return framework;
  }

  if (config.framework === "astro") {
    return "astro";
  }

  if (config.framework === "react") {
    return "react";
  }

  return undefined;
}

function getPrimitiveConfigFramework(
  config: StarwindConfig,
  primitive: PrimitiveConfig,
): StarwindFramework | undefined {
  return primitive.framework ?? getPrimitiveVendoringFramework(config);
}

function getDefaultAlternativePrimitiveDir(framework: StarwindFramework): string {
  return `src/components/starwind-${framework}-primitives`;
}

function getPrimitiveDir(
  config: StarwindConfig,
  framework: StarwindFramework,
  primitiveDirOverride?: string,
): string {
  if (primitiveDirOverride) {
    return primitiveDirOverride;
  }

  const primaryFramework = getPrimitiveVendoringFramework(config);

  if (primaryFramework && framework !== primaryFramework) {
    return config.primitiveDirs?.[framework] ?? getDefaultAlternativePrimitiveDir(framework);
  }

  return config.primitiveDir ?? DEFAULT_PRIMITIVE_ROOT;
}

function getPrimitiveDirConfigUpdate(
  config: StarwindConfig,
  framework: StarwindFramework,
  primitiveDir: string,
): Pick<StarwindConfig, "primitiveDir" | "primitiveDirs"> {
  const primaryFramework = getPrimitiveVendoringFramework(config);

  if (!primaryFramework || framework === primaryFramework) {
    return { primitiveDir };
  }

  return {
    primitiveDirs: {
      [framework]: primitiveDir,
    },
  };
}

function preparePrimitiveFiles(
  config: StarwindConfig,
  files: PrimitiveVendoringFile[],
  framework: StarwindFramework,
  primitiveDirOverride?: string,
): PreparedPrimitiveFile[] {
  const primitiveDir = normalizeProjectRelativePath(
    getPrimitiveDir(config, framework, primitiveDirOverride),
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

async function shouldWritePrimitiveFiles(
  files: PreparedPrimitiveFile[],
  options: PrimitiveComponentOptions,
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

async function finalizePrimitiveUpdatePackagePlan(plan: RuntimeUpdatePlan): Promise<void> {
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

function toRegistryComponent(artifact: PrimitiveVendoringArtifact): Component {
  return {
    name: artifact.component,
    version: artifact.version,
    dependencies: [],
    type: "component",
  };
}

function toRegistryTarget(artifact: PrimitiveVendoringArtifact): RegistryTarget {
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
