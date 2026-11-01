import * as p from "@clack/prompts";
import semver from "semver";

import runtimeBundledRegistry from "../registry/bundled-registry.json" with { type: "json" };
import primitiveVendoringArtifacts from "../registry/primitive-vendoring-artifacts.json" with { type: "json" };
import { DEFAULT_STYLED_REGISTRY_REFERENCE } from "./config.js";
import { readJsonFile } from "./fs.js";
import {
  buildInstallDependencyCommands,
  detectPackageManager,
  installDependenciesWithProgress,
  type PackageManager,
} from "./package-manager.js";
import type { RegistryPackageRequirement, RegistrySetupTarget } from "./registry.js";
import type { UpdatePreviewPlan } from "./update-preview.js";

const RUNTIME_PACKAGE_NAME = "@starwind-ui/runtime";

export type RuntimePackageUpdate = {
  currentRange: string;
  dev: boolean;
  name: string;
  requiredRange: string;
};

export type RuntimePackageConfig = {
  components: readonly { framework?: string; registry?: string }[];
  framework?: string;
  primitives?: readonly { framework?: string }[];
};

export type OfferRuntimePackageUpdatesOptions = {
  config: RuntimePackageConfig;
  packageManager?: PackageManager;
  skipPrompts?: boolean;
};

export type RuntimePackageUpdateStatus = "current" | "declined" | "failed" | "updated";

/**
 * Finds direct Starwind package entries that fall behind this CLI when the project lists Runtime
 * directly. Package managers treat that entry apart from the copy each adapter depends on, so an
 * adapter update alone leaves it behind. Stale adapters move with it to keep the versions aligned.
 */
export async function planRuntimePackageUpdates(
  config: RuntimePackageConfig,
): Promise<RuntimePackageUpdate[]> {
  let pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  try {
    pkg = await readJsonFile("package.json");
  } catch {
    return [];
  }

  const dependencies = pkg?.dependencies ?? {};
  const devDependencies = pkg?.devDependencies ?? {};

  const updates = await Promise.all(
    getStarwindPackageRequirements(config).map(
      async (requirement): Promise<RuntimePackageUpdate | null> => {
        const dev = !dependencies[requirement.name];
        const currentRange = dependencies[requirement.name] ?? devDependencies[requirement.name];

        return currentRange &&
          (await isPackageOutdated(requirement.name, currentRange, requirement.range))
          ? { name: requirement.name, currentRange, requiredRange: requirement.range, dev }
          : null;
      },
    ),
  );
  const outdated = updates.filter((update) => update !== null);

  return outdated.some((update) => update.name === RUNTIME_PACKAGE_NAME) ? outdated : [];
}

/**
 * Bundled versions cannot speak for a custom registry, whose components may need other adapter
 * versions, so the commands leave these packages to that registry's own requirements.
 */
export function usesCustomStyledRegistry(config: RuntimePackageConfig): boolean {
  return config.components.some(
    (component) =>
      (component.registry ?? DEFAULT_STYLED_REGISTRY_REFERENCE) !==
      DEFAULT_STYLED_REGISTRY_REFERENCE,
  );
}

/**
 * Asks to update the packages from planRuntimePackageUpdates. Run this before component updates:
 * they can install Runtime themselves, which would hide the stale adapters that should move with it.
 */
export async function offerRuntimePackageUpdates(
  options: OfferRuntimePackageUpdatesOptions,
): Promise<RuntimePackageUpdateStatus> {
  const updates = await planRuntimePackageUpdates(options.config);

  if (updates.length === 0) return "current";

  const sections = getInstallSections(updates);
  const packageManager = options.packageManager ?? detectPackageManager().name;
  const manualCommand = sections
    .flatMap(({ dev, packages }) => buildInstallDependencyCommands(packages, packageManager, dev))
    .map((args) => [packageManager, ...args.filter((arg) => arg !== "--")].join(" "))
    .join(" && ");

  if (!options.skipPrompts) {
    p.log.warn(
      `Some Starwind packages in your project are out of date:\n${updates
        .map((update) => `  ${update.name} (${update.currentRange} → ${update.requiredRange})`)
        .join("\n")}`,
    );
    const shouldUpdate = await p.confirm({
      message: "Update them now?",
      initialValue: true,
    });

    if (p.isCancel(shouldUpdate) || !shouldUpdate) {
      p.log.info(`Skipped. To update them later, run: ${manualCommand}`);
      return "declined";
    }
  }

  try {
    for (const { dev, packages } of sections) {
      await installDependenciesWithProgress(packages, options.packageManager, dev);
    }

    p.log.success(`Updated ${updates.map(formatPackageSpec).join(", ")}`);
    return "updated";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    p.log.warn(`Couldn't update these packages: ${message}\nTo try again, run: ${manualCommand}`);
    return "failed";
  }
}

export async function addRuntimePackageUpdatesToPreview<TPlan extends UpdatePreviewPlan>(
  plan: TPlan,
  config: RuntimePackageConfig,
): Promise<TPlan> {
  const updates = await planRuntimePackageUpdates(config);

  return {
    ...plan,
    packageRequirements: [
      ...plan.packageRequirements,
      ...updates
        .filter((update) => !plan.packageRequirements.some(({ name }) => name === update.name))
        .map((update) => ({ name: update.name, range: update.requiredRange })),
    ],
    packagesToInstall: [...new Set([...plan.packagesToInstall, ...updates.map(formatPackageSpec)])],
  };
}

function getStarwindPackageRequirements(
  config: RuntimePackageConfig,
): RegistryPackageRequirement[] {
  const { primitives } = primitiveVendoringArtifacts as {
    primitives: { framework: string; packageRequirements: RegistryPackageRequirement[] }[];
  };
  const { setup } = runtimeBundledRegistry as {
    setup?: Record<string, RegistrySetupTarget>;
  };
  const projectFrameworks = new Set(
    [config, ...config.components, ...(config.primitives ?? [])].map(
      (item) => item.framework ?? config.framework,
    ),
  );
  const runtimeRequirements = primitives
    .filter((primitive) => projectFrameworks.has(primitive.framework))
    .flatMap((primitive) => primitive.packageRequirements)
    .filter((requirement) => requirement.name === RUNTIME_PACKAGE_NAME);
  // Vue and Svelte adapters pin one exact Runtime, so a project that mixes targets must match it.
  const runtimeRequirement =
    runtimeRequirements.find((requirement) => semver.valid(requirement.range)) ??
    runtimeRequirements[0];

  return [
    ...(runtimeRequirement ? [runtimeRequirement] : []),
    ...Object.values(setup ?? {}).map((target) => target.adapterPackage),
  ];
}

// Runtime installs last. After a partial failure it still reads as stale, so the next run retries.
function getInstallSections(
  updates: RuntimePackageUpdate[],
): { dev: boolean; packages: string[] }[] {
  const runtimeIsDev = updates.some((update) => update.name === RUNTIME_PACKAGE_NAME && update.dev);

  return [!runtimeIsDev, runtimeIsDev]
    .map((dev) => ({
      dev,
      packages: updates.filter((update) => update.dev === dev).map(formatPackageSpec),
    }))
    .filter(({ packages }) => packages.length > 0);
}

async function isPackageOutdated(
  name: string,
  currentRange: string,
  requiredRange: string,
): Promise<boolean> {
  // Tags, wildcards, and specs such as workspace: or catalog: are the project's own choice.
  const normalizedRange = semver.validRange(currentRange);
  if (!normalizedRange || normalizedRange === "*") return false;

  const requiredVersion = semver.minVersion(requiredRange);
  if (!requiredVersion) return false;

  const installedVersion = await getInstalledVersion(name);

  // An exact requirement replaces any range that could drift past it. Newer versions stay put.
  if (semver.valid(requiredRange)) {
    const version = installedVersion ?? semver.minVersion(normalizedRange);

    return Boolean(
      version &&
      semver.lte(version, requiredVersion) &&
      semver.valid(currentRange) !== semver.valid(requiredRange),
    );
  }

  if (installedVersion) return semver.lt(installedVersion, requiredVersion);

  // Nothing to read, as with Yarn PnP or a hoisted package. A range that overlaps the requirement
  // can already resolve to a new enough version, and replacing it could narrow what the project allows.
  const currentVersion = semver.minVersion(normalizedRange);

  return Boolean(
    currentVersion &&
    semver.lt(currentVersion, requiredVersion) &&
    !semver.intersects(normalizedRange, requiredRange),
  );
}

async function getInstalledVersion(name: string): Promise<string | null> {
  try {
    const { version } = await readJsonFile(`node_modules/${name}/package.json`);
    return semver.valid(version);
  } catch {
    return null;
  }
}

function formatPackageSpec(update: RuntimePackageUpdate): string {
  return `${update.name}@${update.requiredRange}`;
}
