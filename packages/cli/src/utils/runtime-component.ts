import { createHash } from "node:crypto";
import path from "node:path";

import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";

import type {
  ComponentConfigFor,
  StarwindConfigFor,
  StarwindFramework,
  StyledRegistryConfig,
} from "./config.js";
import { DEFAULT_STYLED_REGISTRY_REFERENCE } from "./config.js";
import { getStyledComponentDir, getStyledComponentDirConfigUpdate } from "./config.js";
import { updateConfig } from "./config.js";
import { PATHS } from "./constants.js";
import { filterUninstalledDependencies } from "./dependency-resolver.js";
import { ensureAstroReactIntegration } from "./astro-react-integration.js";
import {
  type CliFrameworkTarget,
  type FrameworkTargetPolicy,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
  type PublicCliFrameworkTarget,
} from "./framework-target-policy.js";
import { installDependenciesWithProgress, type PackageManager } from "./package-manager.js";
import { resolveProjectMutationPath, resolveProjectPathLexically } from "./project-path.js";
import {
  detectReactProjectPlan,
  prepareReactComponentFile,
  type ReactHostKind,
  syncNextPagesComponentStyles,
} from "./react-project.js";
import {
  type ComponentFor,
  loadRegistry,
  type RegistryPackageRequirement,
  type RegistrySource,
  type RegistryTarget,
  type StarwindRegistryFor,
  getStyledRegistrySource,
} from "./registry.js";

type RuntimeInstallStatus = {
  name: string;
  status: "installed" | "skipped" | "failed";
  version?: string;
  error?: string;
};

export type RuntimeInstallSummary = {
  failed: RuntimeInstallStatus[];
  installed: RuntimeInstallStatus[];
  skipped: RuntimeInstallStatus[];
  setupOutcome?: "cancelled" | "declined";
};

type RuntimeUpdateStatus<TFramework extends CliFrameworkTarget = StarwindFramework> = {
  delivery?: RuntimeUpdateDelivery;
  error?: string;
  framework?: TFramework;
  name: string;
  newVersion?: string;
  oldVersion?: string;
  status: "updated" | "skipped" | "failed";
};

export type RuntimeUpdatedStatus<TFramework extends CliFrameworkTarget = StarwindFramework> = Omit<
  RuntimeUpdateStatus<TFramework>,
  "delivery" | "status"
> & {
  delivery: RuntimeUpdateDelivery;
  status: "updated";
};

export type RuntimeUpdateDelivery = "source" | "behavior";

export type RuntimeUpdateSummary<TFramework extends CliFrameworkTarget = StarwindFramework> = {
  failed: RuntimeUpdateStatus<TFramework>[];
  skipped: RuntimeUpdateStatus<TFramework>[];
  updated: RuntimeUpdatedStatus<TFramework>[];
};

export type RuntimeUpdatePlanFile = {
  content: string;
  currentContent: string;
  destination: string;
  exists: boolean;
  path: string;
  changed: boolean;
};

export type RuntimeUpdatePlanItem<TFramework extends CliFrameworkTarget = CliFrameworkTarget> = {
  component: ComponentFor<TFramework>;
  componentIndex: number;
  delivery: RuntimeUpdateDelivery;
  files: RuntimeUpdatePlanFile[];
  framework: TFramework;
  newVersion: string;
  oldVersion: string;
  packageRequirements: RegistryPackageRequirement[];
  packagesToInstall: string[];
  registryReference?: RegistryReference;
  target: RegistryTarget;
};

export type RuntimeUpdatePlan<TFramework extends CliFrameworkTarget = CliFrameworkTarget> = {
  failed: RuntimeUpdateStatus<TFramework>[];
  packageRequirements: RegistryPackageRequirement[];
  packagesToInstall: string[];
  skipped: RuntimeUpdateStatus<TFramework>[];
  updates: RuntimeUpdatePlanItem<TFramework>[];
};

type RuntimeTargetPolicyOption<TFramework extends CliFrameworkTarget> =
  Exclude<TFramework, PublicCliFrameworkTarget> extends never
    ? { targetPolicy?: FrameworkTargetPolicy<TFramework> }
    : { targetPolicy: FrameworkTargetPolicy<TFramework> };

export type InstallRuntimeComponentsOptions<
  TFramework extends CliFrameworkTarget = StarwindFramework,
> = {
  config: StarwindConfigFor<TFramework>;
  framework?: TFramework;
  includeDependencies?: boolean;
  overwrite?: boolean;
  packageManager?: PackageManager;
  registry?: StarwindRegistryFor<TFramework>;
  registryMode?: "custom" | "default";
  registryOverlay?: {
    fallbackRegistry: StarwindRegistryFor<TFramework>;
    fallbackRegistrySource?: RegistrySource;
  };
  registrySource?: RegistrySource;
  skipPrompts?: boolean;
  writeConfig?: boolean;
} & RuntimeTargetPolicyOption<TFramework>;

export type RuntimeUpdateFramework<TFramework extends CliFrameworkTarget = StarwindFramework> =
  | TFramework
  | "all";

export type UpdateRuntimeComponentsOptions<
  TFramework extends CliFrameworkTarget = StarwindFramework,
> = Omit<InstallRuntimeComponentsOptions<TFramework>, "framework"> & {
  framework?: RuntimeUpdateFramework<TFramework>;
};

export type RegistryReference = {
  componentRegistry: string;
  registries?: Record<string, StyledRegistryConfig>;
};
type ResolvedInstallComponent<TFramework extends CliFrameworkTarget> = {
  component: ComponentFor<TFramework>;
  registryReference: RegistryReference;
};
type ResolvingInstallComponent = {
  key: string;
  name: string;
};
type PlannedComponent<TFramework extends CliFrameworkTarget> = {
  component: ComponentFor<TFramework>;
  files: ClassifiedRegistryFile[];
  registryReference: RegistryReference;
  registryTarget: RegistryTarget;
};

type PreparedRegistryFile = {
  content: string;
  destination: string;
  path: string;
};

type RuntimeInstallFileState = "create" | "identical" | "overwrite" | "conflict";

type ClassifiedRegistryFile = PreparedRegistryFile & {
  state: RuntimeInstallFileState;
};

export async function installRuntimeComponents<TFramework extends CliFrameworkTarget>(
  componentNames: string[],
  options: InstallRuntimeComponentsOptions<TFramework>,
): Promise<RuntimeInstallSummary> {
  const summary: RuntimeInstallSummary = {
    failed: [],
    installed: [],
    skipped: [],
  };

  const configTargets =
    options.targetPolicy?.configTargets ?? PUBLIC_FRAMEWORK_TARGET_POLICY.configTargets;
  const targetFramework = getRuntimeTarget(
    options.framework ?? options.config.framework,
    configTargets,
  );
  if (!targetFramework) {
    return {
      ...summary,
      failed: componentNames.map((name) => ({
        name,
        status: "failed",
        error: `Configured framework "${String(options.config.framework)}" is not supported by runtime-backed components. Run starwind migrate first.`,
      })),
    };
  }

  if (options.config.framework === "astro" && targetFramework === "react") {
    try {
      const setupOutcome = await ensureAstroReactIntegration({
        packageManager: options.packageManager,
        skipPrompts: options.skipPrompts,
      });
      if (setupOutcome.status === "cancelled" || setupOutcome.status === "declined") {
        return {
          ...summary,
          setupOutcome: setupOutcome.status,
        };
      }
    } catch (error) {
      return {
        ...summary,
        failed: componentNames.map((name) => ({
          name,
          status: "failed" as const,
          error: error instanceof Error ? error.message : String(error),
        })),
      };
    }
  }

  const reactHostKind = await getConfiguredReactHostKind(options.config);

  const registry =
    options.registry ?? (await loadRuntimeRegistry(options.registrySource, options.targetPolicy));
  const registryReference = resolveInstallRegistryReference({
    config: options.config,
    registry,
    registryMode: options.registryMode ?? "default",
    registrySource: options.registrySource,
  });
  const includeDependencies = options.includeDependencies ?? true;
  const installedNames = new Set(
    options.config.components
      .filter((component) => component.source !== "legacy")
      .filter((component) => (component.framework ?? options.config.framework) === targetFramework)
      .map((component) => component.name),
  );
  const plannedNames = new Set<string>();
  const resolvingKeys = new Set<string>();
  const resolvingStack: ResolvingInstallComponent[] = [];
  const orderedComponents: Array<{
    component: ComponentFor<TFramework>;
    registryReference: RegistryReference;
    target: RegistryTarget;
  }> = [];
  const resolveComponent = createInstallComponentResolver({
    fallbackRegistry: options.registryOverlay?.fallbackRegistry,
    fallbackRegistryReference: { componentRegistry: DEFAULT_STYLED_REGISTRY_REFERENCE },
    primaryRegistry: registry,
    primaryRegistryReference: registryReference,
    target: targetFramework,
  });

  let plannedComponents: PlannedComponent<TFramework>[];
  let packageRequirements: RegistryPackageRequirement[];

  try {
    for (const componentName of componentNames) {
      collectInstallPlan({
        componentName,
        installedNames,
        orderedComponents,
        plannedNames,
        resolvingKeys,
        resolvingStack,
        summary,
        target: targetFramework,
        includeDependencies,
        resolveComponent,
      });
    }

    if (summary.failed.length > 0) {
      return summary;
    }

    plannedComponents = await Promise.all(
      orderedComponents.map(async ({ component, registryReference, target }) => ({
        component,
        registryReference,
        registryTarget: target,
        files: await classifyPreparedRegistryFiles(
          await resolvePreparedRegistryFiles(
            prepareRegistryFiles({
              componentDir: getStyledComponentDir(options.config, targetFramework),
              componentName: component.name,
              files: target.files,
              reactHostKind: targetFramework === "react" ? reactHostKind : undefined,
            }),
          ),
          options.overwrite ?? false,
        ),
      })),
    );
    const installableComponents: PlannedComponent<TFramework>[] = [];
    const installOutcomes = new Map<string, { installable: boolean; reason?: string }>();

    for (const planned of plannedComponents) {
      const conflictPaths = planned.files
        .filter((file) => file.state === "conflict")
        .map((file) => file.path);
      let reason = conflictPaths.length > 0 ? formatInstallFileConflicts(conflictPaths) : undefined;

      if (!reason) {
        const blockedDependency = planned.registryTarget.componentDependencies.find(
          (dependencyName) => installOutcomes.get(dependencyName)?.installable === false,
        );
        const blockedOutcome = blockedDependency
          ? installOutcomes.get(blockedDependency)
          : undefined;

        if (blockedDependency && blockedOutcome?.reason) {
          reason = `Required component "${blockedDependency}" was skipped: ${blockedOutcome.reason}`;
        }
      }

      if (reason) {
        installOutcomes.set(planned.component.name, { installable: false, reason });
        summary.skipped.push({
          name: planned.component.name,
          status: "skipped",
          version: planned.component.version,
          error: reason,
        });
        continue;
      }

      installOutcomes.set(planned.component.name, { installable: true });
      installableComponents.push(planned);
    }

    plannedComponents = installableComponents;
    packageRequirements = dedupePackageRequirements(
      plannedComponents.flatMap(({ registryTarget }) => registryTarget.packageRequirements),
    );
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

  const packagesToInstall = await filterUninstalledDependencies(
    packageRequirements.map(formatPackageRequirement),
  );

  if (packagesToInstall.length > 0) {
    await installDependenciesWithProgress(packagesToInstall, options.packageManager);
  }

  const installedComponents: PlannedComponent<TFramework>[] = [];
  const applyOutcomes = new Map<string, { installed: boolean; reason?: string }>();

  for (const planned of plannedComponents) {
    const blockedDependency = planned.registryTarget.componentDependencies.find(
      (dependencyName) => applyOutcomes.get(dependencyName)?.installed === false,
    );
    const blockedOutcome = blockedDependency ? applyOutcomes.get(blockedDependency) : undefined;

    if (blockedDependency && blockedOutcome?.reason) {
      const reason = `Required component "${blockedDependency}" was skipped: ${blockedOutcome.reason}`;
      applyOutcomes.set(planned.component.name, { installed: false, reason });
      summary.skipped.push({
        name: planned.component.name,
        status: "skipped",
        version: planned.component.version,
        error: reason,
      });
      continue;
    }

    try {
      const refreshedFiles = await classifyPreparedRegistryFiles(
        await resolvePreparedRegistryFiles(planned.files),
        options.overwrite ?? false,
      );
      const conflictPaths = refreshedFiles
        .filter((file) => file.state === "conflict")
        .map((file) => file.path);

      if (conflictPaths.length > 0) {
        const reason = formatInstallFileConflicts(conflictPaths);
        applyOutcomes.set(planned.component.name, { installed: false, reason });
        summary.skipped.push({
          name: planned.component.name,
          status: "skipped",
          version: planned.component.version,
          error: reason,
        });
        continue;
      }

      await writeClassifiedRegistryFiles(refreshedFiles);
      installedComponents.push({ ...planned, files: refreshedFiles });
      applyOutcomes.set(planned.component.name, { installed: true });
      summary.installed.push({
        name: planned.component.name,
        status: "installed",
        version: planned.component.version,
      });
    } catch (error) {
      applyOutcomes.set(planned.component.name, {
        installed: false,
        reason: error instanceof Error ? error.message : String(error),
      });
      summary.failed.push({
        name: planned.component.name,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (summary.installed.length > 0) {
    await syncReactProjectComponentStyles(options.config, reactHostKind);
  }

  if (summary.installed.length > 0 && options.writeConfig !== false) {
    const registries = mergeRegistryReferences(installedComponents);
    const componentDir = getStyledComponentDir(options.config, targetFramework);
    const componentDirUpdates =
      options.config.framework && targetFramework !== options.config.framework
        ? getStyledComponentDirConfigUpdate(options.config, targetFramework, componentDir)
        : {};

    await updateConfig(
      {
        ...componentDirUpdates,
        ...(registries ? { registries } : {}),
        components: installedComponents.map((planned) => ({
          framework: targetFramework,
          name: planned.component.name,
          registry: planned.registryReference.componentRegistry,
          version: planned.component.version,
        })),
      },
      options.targetPolicy
        ? { appendComponents: true, targetPolicy: options.targetPolicy }
        : { appendComponents: true },
    );
  }

  return summary;
}

function formatInstallFileConflicts(conflictPaths: string[]): string {
  return `Existing file conflicts: ${conflictPaths.join(", ")}. Re-run with --overwrite to replace ${
    conflictPaths.length === 1 ? "it" : "them"
  }.`;
}

function createInstallComponentResolver<TFramework extends CliFrameworkTarget>(options: {
  fallbackRegistry?: StarwindRegistryFor<TFramework>;
  fallbackRegistryReference: RegistryReference;
  primaryRegistry: StarwindRegistryFor<TFramework>;
  primaryRegistryReference: RegistryReference;
  target: TFramework;
}): (componentName: string) => ResolvedInstallComponent<TFramework> | undefined {
  return (componentName) => {
    const primaryComponent = options.primaryRegistry.components.find(
      (component) => component.name === componentName,
    );

    if (primaryComponent?.targets?.[options.target]) {
      return {
        component: primaryComponent,
        registryReference: options.primaryRegistryReference,
      };
    }

    const fallbackComponent = options.fallbackRegistry?.components.find(
      (component) => component.name === componentName,
    );

    if (!fallbackComponent) return undefined;

    if (fallbackComponent.targets?.[options.target]) {
      return {
        component: fallbackComponent,
        registryReference: options.fallbackRegistryReference,
      };
    }

    if (primaryComponent) {
      return {
        component: primaryComponent,
        registryReference: options.primaryRegistryReference,
      };
    }

    return {
      component: fallbackComponent,
      registryReference: options.fallbackRegistryReference,
    };
  };
}

function mergeRegistryReferences(
  plannedComponents: Array<{ registryReference?: RegistryReference }>,
): Record<string, StyledRegistryConfig> | undefined {
  const registries: Record<string, StyledRegistryConfig> = {};

  for (const planned of plannedComponents) {
    if (!planned.registryReference) continue;

    Object.assign(registries, planned.registryReference.registries);
  }

  return Object.keys(registries).length > 0 ? registries : undefined;
}

function resolveInstallRegistryReference<TFramework extends CliFrameworkTarget>(options: {
  config: StarwindConfigFor<TFramework>;
  registry: StarwindRegistryFor<TFramework>;
  registryMode: "custom" | "default";
  registrySource: RegistrySource | undefined;
}): {
  componentRegistry: string;
  registries?: Record<string, StyledRegistryConfig>;
} {
  if (options.registryMode !== "custom" || !options.registrySource) {
    return { componentRegistry: DEFAULT_STYLED_REGISTRY_REFERENCE };
  }

  const registryConfig = toStyledRegistryConfig(options.registrySource, options.registry.version);

  if (!registryConfig) {
    return { componentRegistry: DEFAULT_STYLED_REGISTRY_REFERENCE };
  }

  const existingRegistry = findMatchingStyledRegistry(options.config.registries, registryConfig);
  const registryId = existingRegistry ?? createStyledRegistryId(registryConfig, options.config);

  return {
    componentRegistry: registryId,
    registries: {
      [registryId]: registryConfig,
    },
  };
}

function toStyledRegistryConfig(
  source: RegistrySource,
  version: string,
): StyledRegistryConfig | undefined {
  switch (source.type) {
    case "bundled":
      return undefined;
    case "local":
      return {
        source: "local",
        path: source.path,
        version,
      };
    case "remote":
      return {
        source: "remote",
        url: source.url,
        version,
      };
  }
}

function findMatchingStyledRegistry(
  registries: StarwindConfigFor<CliFrameworkTarget>["registries"],
  registryConfig: StyledRegistryConfig,
): string | undefined {
  for (const [id, existing] of Object.entries(registries ?? {})) {
    if (isSameStyledRegistrySource(existing, registryConfig)) {
      return id;
    }
  }

  return undefined;
}

function isSameStyledRegistrySource(
  left: StyledRegistryConfig,
  right: StyledRegistryConfig,
): boolean {
  if (left.source !== right.source) return false;

  switch (left.source) {
    case "bundled":
      return right.source === "bundled";
    case "local":
      return left.path === right.path;
    case "remote":
      return left.url === right.url;
  }
}

function createStyledRegistryId(
  registryConfig: StyledRegistryConfig,
  config: StarwindConfigFor<CliFrameworkTarget>,
): string {
  const sourceValue =
    registryConfig.source === "local"
      ? registryConfig.path
      : registryConfig.source === "remote"
        ? registryConfig.url
        : registryConfig.source;
  const baseId = `${registryConfig.source}-${createHash("sha256")
    .update(`${registryConfig.source}:${sourceValue}`)
    .digest("hex")
    .slice(0, 8)}`;

  let registryId = baseId;
  let suffix = 2;

  while (
    config.registries?.[registryId] &&
    !isSameStyledRegistrySource(config.registries[registryId], registryConfig)
  ) {
    registryId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return registryId;
}

export async function updateRuntimeComponents<TFramework extends CliFrameworkTarget>(
  componentNames: string[],
  options: UpdateRuntimeComponentsOptions<TFramework>,
): Promise<RuntimeUpdateSummary<TFramework>> {
  const summary: RuntimeUpdateSummary<TFramework> = {
    failed: [],
    skipped: [],
    updated: [],
  };
  const plan = await planRuntimeComponentUpdates(componentNames, options);
  const reactHostKind = await getConfiguredReactHostKind(options.config);

  summary.failed.push(...plan.failed);
  summary.skipped.push(...plan.skipped);

  const updatedComponents = [...options.config.components];
  let skipPackageDependentUpdates = false;
  let hasSourceDelivery = false;

  if (plan.packagesToInstall.length > 0) {
    if (!options.skipPrompts) {
      const packageDependentComponents = plan.updates
        .filter((item) => item.packagesToInstall.length > 0)
        .map((item) => item.component.name)
        .join(", ");

      p.log.warn(
        `Updating ${packageDependentComponents} requires package updates: ${plan.packagesToInstall.join(", ")}`,
      );
      const shouldInstallPackages = await p.confirm({
        message: "Install required package updates before updating these components?",
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

  for (const item of plan.updates) {
    if (skipPackageDependentUpdates && item.packagesToInstall.length > 0) {
      summary.skipped.push({
        delivery: item.delivery,
        name: item.component.name,
        ...getFrameworkStatusMetadata(
          options.config,
          item.component.name,
          item.framework,
          getConfigTargets(options),
        ),
        status: "skipped",
        oldVersion: item.oldVersion,
        newVersion: item.newVersion,
      });
      continue;
    }

    if (item.delivery === "source") {
      await writePreparedRegistryFiles(item.files, true);
      hasSourceDelivery = true;
    }

    const currentIndex = item.componentIndex;
    const currentComponent = updatedComponents[currentIndex]!;
    const registryReference = item.registryReference ?? {
      componentRegistry: currentComponent.registry ?? DEFAULT_STYLED_REGISTRY_REFERENCE,
    };
    const { source: _source, ...currentRuntimeComponent } = currentComponent;
    updatedComponents[currentIndex] = {
      ...currentRuntimeComponent,
      framework: item.framework,
      registry: registryReference.componentRegistry,
      version: item.newVersion,
    };
    summary.updated.push({
      delivery: item.delivery,
      name: item.component.name,
      ...getFrameworkStatusMetadata(
        options.config,
        item.component.name,
        item.framework,
        getConfigTargets(options),
      ),
      status: "updated",
      oldVersion: item.oldVersion,
      newVersion: item.newVersion,
    });
  }

  if (summary.updated.length > 0) {
    if (hasSourceDelivery) {
      await syncReactProjectComponentStyles(options.config, reactHostKind);
    }
    const registries = mergeRegistryReferences(plan.updates);
    await updateConfig(
      {
        ...(registries ? { registries } : {}),
        components: updatedComponents,
      },
      options.targetPolicy
        ? { appendComponents: false, targetPolicy: options.targetPolicy }
        : { appendComponents: false },
    );
  }

  return summary;
}

export async function planRuntimeComponentUpdates<TFramework extends CliFrameworkTarget>(
  componentNames: string[],
  options: UpdateRuntimeComponentsOptions<TFramework>,
): Promise<RuntimeUpdatePlan<TFramework>> {
  const plan: RuntimeUpdatePlan<TFramework> = {
    failed: [],
    packageRequirements: [],
    packagesToInstall: [],
    skipped: [],
    updates: [],
  };

  const configTargets = getConfigTargets(options);
  const targetFrameworks = getRuntimeUpdateFrameworks(
    options.config,
    options.framework,
    configTargets,
  );
  if (targetFrameworks.length === 0) {
    return {
      ...plan,
      failed: componentNames.map((name) => ({
        name,
        status: "failed",
        error: `Configured framework "${String(options.config.framework)}" is not supported by runtime-backed components. Run starwind migrate first.`,
      })),
    };
  }

  const reactHostKind = await getConfiguredReactHostKind(options.config);

  const explicitRegistry =
    options.registry ??
    (options.registrySource
      ? await loadRuntimeRegistry(options.registrySource, options.targetPolicy)
      : undefined);
  const explicitRegistryReference = explicitRegistry
    ? resolveInstallRegistryReference({
        config: options.config,
        registry: explicitRegistry,
        registryMode: options.registrySource ? "custom" : "default",
        registrySource: options.registrySource,
      })
    : undefined;
  const registryCache = new Map<string, Promise<StarwindRegistryFor<TFramework>>>();

  for (const componentName of componentNames) {
    const currentComponents = getInstalledRuntimeComponentsForUpdate(
      options.config,
      componentName,
      targetFrameworks,
      configTargets,
    );

    if (currentComponents.length === 0) {
      plan.failed.push({
        name: componentName,
        status: "failed",
        error: getMissingUpdateTargetMessage(options.framework, targetFrameworks),
      });
      continue;
    }

    for (const { componentIndex, currentComponent, framework } of currentComponents) {
      let registry: StarwindRegistryFor<TFramework>;
      let registryReference: RegistryReference;

      try {
        if (explicitRegistry) {
          registry = explicitRegistry;
          registryReference = explicitRegistryReference!;
        } else {
          registryReference = {
            componentRegistry: currentComponent.registry ?? DEFAULT_STYLED_REGISTRY_REFERENCE,
          };
          registry = await loadComponentUpdateRegistry({
            config: options.config,
            registryCache,
            registryReference: registryReference.componentRegistry,
            targetPolicy: options.targetPolicy,
          });
        }
      } catch (error) {
        plan.failed.push({
          name: componentName,
          ...getFrameworkStatusMetadata(options.config, componentName, framework, configTargets),
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      const registryComponent = registry.components.find(
        (component) => component.name === componentName,
      );

      if (!registryComponent) {
        plan.failed.push({
          name: componentName,
          ...getFrameworkStatusMetadata(options.config, componentName, framework, configTargets),
          status: "failed",
          error: `Component not found in registry "${registryReference.componentRegistry}"`,
        });
        continue;
      }

      const registryTarget = registryComponent.targets?.[framework];

      if (!registryTarget) {
        plan.failed.push({
          name: componentName,
          ...getFrameworkStatusMetadata(options.config, componentName, framework, configTargets),
          status: "failed",
          error: `Component "${componentName}" does not support the "${framework}" target.`,
        });
        continue;
      }

      const currentVersion = currentComponent.version;

      if (!semver.gt(registryComponent.version, currentVersion)) {
        plan.skipped.push({
          name: componentName,
          ...getFrameworkStatusMetadata(options.config, componentName, framework, configTargets),
          status: "skipped",
          oldVersion: currentVersion,
          newVersion: registryComponent.version,
        });
        continue;
      }

      try {
        const sourceVersion = registryComponent.sourceVersion ?? registryComponent.version;
        const delivery: RuntimeUpdateDelivery = semver.lt(currentVersion, sourceVersion)
          ? "source"
          : "behavior";
        const packageRequirements = dedupePackageRequirements(registryTarget.packageRequirements);
        const files =
          delivery === "source"
            ? await resolveRuntimeUpdateFiles({
                componentDir: getStyledComponentDir(options.config, framework),
                componentName,
                files: registryTarget.files,
                reactHostKind: framework === "react" ? reactHostKind : undefined,
              })
            : [];

        plan.updates.push({
          component: registryComponent,
          componentIndex,
          delivery,
          files,
          framework,
          newVersion: registryComponent.version,
          oldVersion: currentVersion,
          packageRequirements,
          packagesToInstall: [],
          registryReference,
          target: registryTarget,
        });
      } catch (error) {
        plan.failed.push({
          name: componentName,
          ...getFrameworkStatusMetadata(options.config, componentName, framework, configTargets),
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await finalizeRuntimeUpdatePackagePlan(plan);

  return plan;
}

async function loadComponentUpdateRegistry<TFramework extends CliFrameworkTarget>(options: {
  config: StarwindConfigFor<TFramework>;
  registryCache: Map<string, Promise<StarwindRegistryFor<TFramework>>>;
  registryReference: string;
  targetPolicy?: FrameworkTargetPolicy<TFramework>;
}): Promise<StarwindRegistryFor<TFramework>> {
  const source = getStyledRegistrySource(options.config, options.registryReference);

  if (!source) {
    throw new Error(`Styled registry "${options.registryReference}" is not configured.`);
  }

  const cacheKey = options.registryReference;
  let registryPromise = options.registryCache.get(cacheKey);

  if (!registryPromise) {
    registryPromise = loadRuntimeRegistry(source, options.targetPolicy);
    options.registryCache.set(cacheKey, registryPromise);
  }

  try {
    return await registryPromise;
  } catch (error) {
    throw new Error(
      `Failed to load styled registry "${options.registryReference}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function resolveRuntimeUpdateFiles(options: {
  componentDir: string;
  componentName: string;
  files: RegistryTarget["files"];
  reactHostKind?: ReactHostKind;
}): Promise<RuntimeUpdatePlanFile[]> {
  const preparedFiles = await resolvePreparedRegistryFiles(prepareRegistryFiles(options));

  return Promise.all(
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
}

async function finalizeRuntimeUpdatePackagePlan<TFramework extends CliFrameworkTarget>(
  plan: RuntimeUpdatePlan<TFramework>,
): Promise<void> {
  if (plan.updates.length === 0) return;

  const rangesByPackage = new Map<string, Set<string>>();

  for (const item of plan.updates) {
    for (const requirement of item.packageRequirements) {
      const ranges = rangesByPackage.get(requirement.name) ?? new Set<string>();
      ranges.add(requirement.range);
      rangesByPackage.set(requirement.name, ranges);
    }
  }

  const conflictingPackages = new Map(
    [...rangesByPackage.entries()].filter(([, ranges]) => ranges.size > 1),
  );
  const duplicateUpdateNames = getDuplicateUpdateNames(plan.updates);

  if (conflictingPackages.size > 0) {
    const retainedUpdates: RuntimeUpdatePlanItem<TFramework>[] = [];

    for (const item of plan.updates) {
      const conflicts = item.packageRequirements.filter((requirement) =>
        conflictingPackages.has(requirement.name),
      );

      if (conflicts.length === 0) {
        retainedUpdates.push(item);
        continue;
      }

      plan.failed.push({
        name: item.component.name,
        ...(duplicateUpdateNames.has(item.component.name) ? { framework: item.framework } : {}),
        status: "failed",
        oldVersion: item.oldVersion,
        newVersion: item.newVersion,
        error: `Conflicting package requirements for ${conflicts
          .map((requirement) =>
            formatPackageRequirementConflict(
              requirement.name,
              conflictingPackages.get(requirement.name)!,
            ),
          )
          .join(", ")}`,
      });
    }

    plan.updates = retainedUpdates;
  }

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

function collectInstallPlan<TFramework extends CliFrameworkTarget>(options: {
  componentName: string;
  installedNames: Set<string>;
  orderedComponents: Array<{
    component: ComponentFor<TFramework>;
    registryReference: RegistryReference;
    target: RegistryTarget;
  }>;
  plannedNames: Set<string>;
  resolvingKeys: Set<string>;
  resolvingStack: ResolvingInstallComponent[];
  resolveComponent: (componentName: string) => ResolvedInstallComponent<TFramework> | undefined;
  summary: RuntimeInstallSummary;
  target: TFramework;
  includeDependencies: boolean;
}): void {
  if (options.plannedNames.has(options.componentName)) return;

  const resolvedComponent = options.resolveComponent(options.componentName);

  if (!resolvedComponent) {
    options.summary.failed.push({
      name: options.componentName,
      status: "failed",
      error: "Component not found in registry",
    });
    return;
  }

  const { component, registryReference } = resolvedComponent;
  const target = component.targets?.[options.target];

  if (!target) {
    options.summary.failed.push({
      name: component.name,
      status: "failed",
      error: `Component "${component.name}" does not support the "${options.target}" target.`,
    });
    return;
  }

  const resolutionKey = JSON.stringify([
    registryReference.componentRegistry,
    options.target,
    component.name,
  ]);

  if (options.resolvingKeys.has(resolutionKey)) {
    const cycleStart = options.resolvingStack.findIndex(({ key }) => key === resolutionKey);
    const cycle = options.resolvingStack.slice(cycleStart).map(({ name }) => name);
    cycle.push(component.name);
    throw new Error(
      `Dependency cycle detected in styled component dependencies: ${cycle.join(" -> ")}`,
    );
  }

  options.resolvingKeys.add(resolutionKey);
  options.resolvingStack.push({ key: resolutionKey, name: component.name });

  try {
    if (options.includeDependencies) {
      for (const dependency of target.componentDependencies) {
        collectInstallPlan({
          ...options,
          componentName: dependency,
        });
      }
    }
  } finally {
    options.resolvingStack.pop();
    options.resolvingKeys.delete(resolutionKey);
  }

  if (options.installedNames.has(component.name)) {
    options.summary.skipped.push({
      name: component.name,
      status: "skipped",
      version: component.version,
    });
    options.plannedNames.add(component.name);
    return;
  }

  options.plannedNames.add(component.name);
  options.orderedComponents.push({ component, registryReference, target });
}

function loadRuntimeRegistry<TFramework extends CliFrameworkTarget>(
  source: RegistrySource | undefined,
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): Promise<StarwindRegistryFor<TFramework>> {
  return targetPolicy
    ? loadRegistry(source, { targetPolicy })
    : (loadRegistry(source) as Promise<StarwindRegistryFor<TFramework>>);
}

function getConfigTargets<TFramework extends CliFrameworkTarget>(
  options: Pick<InstallRuntimeComponentsOptions<TFramework>, "targetPolicy">,
): readonly CliFrameworkTarget[] {
  return options.targetPolicy?.configTargets ?? PUBLIC_FRAMEWORK_TARGET_POLICY.configTargets;
}

function getRuntimeTarget<TFramework extends CliFrameworkTarget>(
  framework: StarwindConfigFor<TFramework>["framework"],
  configTargets: readonly CliFrameworkTarget[],
): TFramework | undefined {
  return framework && configTargets.includes(framework) ? framework : undefined;
}

function getRuntimeUpdateFrameworks<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  framework: RuntimeUpdateFramework<TFramework> | undefined,
  configTargets: readonly CliFrameworkTarget[],
): TFramework[] {
  if (framework === "all") {
    const configuredFrameworks = [
      config.framework,
      ...config.components.map((component) => component.framework),
    ];
    return [
      ...new Set(
        configuredFrameworks.flatMap((candidate) => {
          const target = getRuntimeTarget(candidate, configTargets);
          return target ? [target] : [];
        }),
      ),
    ];
  }

  const target = getRuntimeTarget(framework ?? config.framework, configTargets);
  return target ? [target] : [];
}

function getInstalledRuntimeComponentsForUpdate<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  componentName: string,
  targetFrameworks: TFramework[],
  configTargets: readonly CliFrameworkTarget[],
): Array<{
  componentIndex: number;
  currentComponent: ComponentConfigFor<TFramework>;
  framework: TFramework;
}> {
  const targetFrameworkSet = new Set(targetFrameworks);

  return config.components.flatMap((component, componentIndex) => {
    if (component.source === "legacy" || component.name !== componentName) return [];

    const framework = getRuntimeTarget(component.framework ?? config.framework, configTargets);
    if (!framework || !targetFrameworkSet.has(framework)) return [];

    return [{ componentIndex, currentComponent: component, framework }];
  });
}

function getMissingUpdateTargetMessage<TFramework extends CliFrameworkTarget>(
  framework: RuntimeUpdateFramework<TFramework> | undefined,
  targetFrameworks: TFramework[],
): string {
  if (framework === "all") {
    return "Component is not installed for any supported Runtime framework.";
  }

  const targetFramework = targetFrameworks[0];
  if (targetFramework) {
    return `Component is not installed for the "${targetFramework}" framework.`;
  }

  return "Component is not installed in this project.";
}

function getFrameworkStatusMetadata<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  componentName: string,
  framework: TFramework,
  configTargets: readonly CliFrameworkTarget[],
): Pick<RuntimeUpdateStatus<TFramework>, "framework"> {
  const installedFrameworks = new Set(
    config.components
      .filter((component) => component.source !== "legacy")
      .filter((component) => component.name === componentName)
      .map((component) => component.framework ?? config.framework)
      .filter((value): value is TFramework => value !== undefined && configTargets.includes(value)),
  );

  return installedFrameworks.size > 1 ? { framework } : {};
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

function formatPackageRequirementConflict(packageName: string, ranges: Set<string>): string {
  return `${packageName}: ${[...ranges].join(" and ")}`;
}

function getDuplicateUpdateNames<TFramework extends CliFrameworkTarget>(
  updates: RuntimeUpdatePlanItem<TFramework>[],
): Set<string> {
  const counts = new Map<string, number>();

  for (const item of updates) {
    counts.set(item.component.name, (counts.get(item.component.name) ?? 0) + 1);
  }

  return new Set(
    [...counts.entries()].filter(([, count]) => count > 1).map(([componentName]) => componentName),
  );
}

async function writePreparedRegistryFiles(
  files: PreparedRegistryFile[],
  overwrite = false,
): Promise<void> {
  for (const file of files) {
    if (!overwrite && (await fs.pathExists(file.destination))) {
      continue;
    }

    const directoryDestination = await resolveProjectMutationPath(file.path);
    await fs.ensureDir(path.dirname(directoryDestination));
    const fileDestination = await resolveProjectMutationPath(file.path);
    await fs.writeFile(fileDestination, file.content, "utf-8");
  }
}

async function writeClassifiedRegistryFiles(files: ClassifiedRegistryFile[]): Promise<void> {
  for (const file of files) {
    if (file.state === "identical" || file.state === "conflict") continue;

    const directoryDestination = await resolveProjectMutationPath(file.path);
    await fs.ensureDir(path.dirname(directoryDestination));
    const fileDestination = await resolveProjectMutationPath(file.path);
    await fs.writeFile(fileDestination, file.content, {
      encoding: "utf-8",
      flag: file.state === "create" ? "wx" : "w",
    });
  }
}

async function classifyPreparedRegistryFiles(
  files: PreparedRegistryFile[],
  overwrite: boolean,
): Promise<ClassifiedRegistryFile[]> {
  return Promise.all(
    files.map(async (file) => {
      if (!(await fs.pathExists(file.destination))) {
        return { ...file, state: "create" as const };
      }

      const currentContent = await fs.readFile(file.destination);
      return {
        ...file,
        state: classifyRuntimeInstallFile(Buffer.from(file.content), currentContent, overwrite),
      };
    }),
  );
}

function classifyRuntimeInstallFile(
  intendedContent: Buffer,
  currentContent: Buffer,
  overwrite: boolean,
): RuntimeInstallFileState {
  if (intendedContent.equals(currentContent)) return "identical";
  return overwrite ? "overwrite" : "conflict";
}

async function resolvePreparedRegistryFiles(
  files: PreparedRegistryFile[],
): Promise<PreparedRegistryFile[]> {
  return Promise.all(
    files.map(async (file) => ({
      ...file,
      destination: await resolveProjectMutationPath(file.path),
    })),
  );
}

function prepareRegistryFiles(options: {
  componentDir: string;
  componentName: string;
  files: RegistryTarget["files"];
  reactHostKind?: ReactHostKind;
}): PreparedRegistryFile[] {
  return options.files.map((file) => {
    if (file.content === undefined) {
      throw new Error(`Registry file "${file.path}" does not include inline content.`);
    }

    const destination = resolveSafeProjectPath({
      componentDir: options.componentDir,
      componentName: options.componentName,
      filePath: file.path,
    });

    return {
      content: options.reactHostKind
        ? prepareReactComponentFile(file.content, options.reactHostKind)
        : file.content,
      destination,
      path: toPortablePath(path.relative(process.cwd(), destination)),
    };
  });
}

async function getConfiguredReactHostKind<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
): Promise<ReactHostKind | undefined> {
  if (config.framework !== "react") return undefined;

  try {
    const projectPackage = (await fs.readJson("package.json")) as Parameters<
      typeof detectReactProjectPlan
    >[0];
    return (await detectReactProjectPlan(projectPackage)).kind;
  } catch {
    return undefined;
  }
}

export async function syncReactProjectComponentStyles<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  detectedHostKind?: ReactHostKind,
): Promise<void> {
  const hostKind = detectedHostKind ?? (await getConfiguredReactHostKind(config));
  if (hostKind !== "next-pages") return;

  await syncNextPagesComponentStyles(
    config.tailwind.css,
    getStyledComponentDir(config, "react" as TFramework),
  );
}

function resolveSafeProjectPath(options: {
  componentDir: string;
  componentName: string;
  filePath: string;
}): string {
  const { componentDir, componentName, filePath } = options;
  const normalized = filePath.replace(/\\/g, "/");

  if (path.posix.isAbsolute(normalized)) {
    throw new Error(`Registry file "${filePath}" must be a relative path.`);
  }

  const safePath = path.posix.normalize(normalized);

  if (safePath.startsWith("..") || safePath === ".") {
    throw new Error(`Registry file "${filePath}" contains an invalid path.`);
  }

  const targetRoot = toPortablePath(path.posix.join(componentDir, componentName));
  const defaultRoot = toPortablePath(
    path.posix.join(PATHS.LOCAL_STARWIND_COMPONENTS_DIR, componentName),
  );
  const relativePath = getRelativeComponentFilePath(safePath, targetRoot, defaultRoot);

  if (relativePath === undefined) {
    throw new Error(`Registry file "${filePath}" must be inside ${targetRoot}.`);
  }

  return resolveProjectPathLexically(path.posix.join(targetRoot, relativePath));
}

function getRelativeComponentFilePath(
  safePath: string,
  targetRoot: string,
  defaultRoot: string,
): string | undefined {
  for (const root of [targetRoot, defaultRoot]) {
    if (safePath === root) return "";
    if (safePath.startsWith(`${root}/`)) {
      return safePath.slice(root.length + 1);
    }
  }

  return undefined;
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/\/+$/, "");
}
