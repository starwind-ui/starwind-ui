import * as p from "@clack/prompts";

import { getConfigState, type StarwindConfigFor, type StarwindFramework } from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import {
  sortComponentNames,
  sortComponentPresentationByName,
} from "@/utils/component-presentation.js";
import {
  type CliFrameworkTarget,
  type FrameworkTargetPolicy,
  isConfigTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "@/utils/framework-target-policy.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import {
  getPrimitiveComponents,
  installPrimitiveComponents,
  planPrimitiveComponentUpdates,
  type PrimitiveInstallSummary,
  updatePrimitiveComponents,
  type PrimitiveVendoringArtifact,
  type PrimitiveVendoringArtifactSet,
  type PrimitiveUpdateSummary,
} from "@/utils/primitive-component.js";
import {
  getPrimitiveDiscoveryResults,
  getPrimitiveInstallCommand,
  resolvePrimitiveDiscoveryFramework,
  toPrimitiveDiscoveryMetadata,
  type PrimitiveDiscoveryFramework,
} from "@/utils/primitive-discovery.js";
import { sleep } from "@/utils/sleep.js";
import { formatUpdatePreview, getPreviewMode } from "@/utils/update-preview.js";

import { init } from "./init.js";
import { migrate } from "./migrate.js";

export type PrivatePrimitiveCommandDependencies = {
  artifacts: PrimitiveVendoringArtifactSet<CliFrameworkTarget>;
  targetPolicy: FrameworkTargetPolicy<CliFrameworkTarget>;
};

interface PrimitiveAddOptions {
  all?: boolean;
  framework?: StarwindFramework;
  overwrite?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn";
  path?: string;
  to?: string;
  yes?: boolean;
}

interface PrimitiveUpdateOptions {
  all?: boolean;
  diff?: true | string;
  dryRun?: boolean;
  framework?: StarwindFramework;
  packageManager?: "npm" | "pnpm" | "yarn";
  view?: true | string;
  yes?: boolean;
}

interface PrimitiveListOptions {
  framework?: PrimitiveDiscoveryFramework;
  json?: boolean;
}

type PrivatePrimitiveAddOptions = Omit<PrimitiveAddOptions, "framework"> & {
  framework?: CliFrameworkTarget;
};

type PrivatePrimitiveUpdateOptions = Omit<PrimitiveUpdateOptions, "framework"> & {
  framework?: CliFrameworkTarget;
};

type PrivatePrimitiveListOptions = Omit<PrimitiveListOptions, "framework"> & {
  framework?: PrimitiveDiscoveryFramework<CliFrameworkTarget>;
};

type PrimitiveCommandOptions = {
  packageManager?: "npm" | "pnpm" | "yarn";
  yes?: boolean;
};

type PrimitiveAddResult = {
  error?: string;
  name: string;
  status: "installed" | "skipped" | "failed";
  version?: string;
};

export function primitivesAdd(primitives?: string[], options?: PrimitiveAddOptions): Promise<void>;
export function primitivesAdd(
  primitives: string[] | undefined,
  options: PrivatePrimitiveAddOptions | undefined,
  dependencies: PrivatePrimitiveCommandDependencies,
): Promise<void>;
export async function primitivesAdd(
  primitives?: string[],
  options?: PrivatePrimitiveAddOptions,
  dependencies?: PrivatePrimitiveCommandDependencies,
) {
  try {
    p.intro(highlighter.title(" Welcome to the Starwind CLI "));

    if (options?.all && primitives && primitives.length > 0) {
      p.log.error("Use either primitive names or --all, not both.");
      process.exit(1);
    }

    const runtimeConfig = await getCurrentConfigForPrimitiveCommand(options, dependencies);

    if (!runtimeConfig) {
      return;
    }

    const targetPolicy = getTargetPolicy(dependencies);
    const primitiveFramework = getPrimitiveVendoringFramework(
      runtimeConfig,
      options?.framework,
      targetPolicy,
    );
    const availablePrimitives = getAvailablePrimitives(primitiveFramework, dependencies);
    const primitiveDir = options?.to ?? options?.path;
    const primitivesToInstall = await getPrimitivesToInstall(
      primitives,
      options,
      runtimeConfig,
      primitiveFramework,
      availablePrimitives,
    );

    if (primitivesToInstall.length === 0) {
      p.cancel("No primitives selected");
      return process.exit(0);
    }

    p.log.info(`Installing primitives: ${sortComponentNames(primitivesToInstall).join(", ")}`);

    const results = await installPrimitiveComponents(primitivesToInstall, {
      config: runtimeConfig,
      framework: primitiveFramework,
      overwrite: options?.overwrite,
      packageManager: options?.packageManager,
      primitiveDir,
      skipPrompts: options?.yes,
      ...(dependencies ? { artifacts: dependencies.artifacts, targetPolicy } : {}),
    });

    logPrimitiveInstallSummary(results);

    await sleep(1000);

    if (results.installed.length > 0) {
      p.outro("Primitive source installed successfully");
    } else if (results.skipped.length > 0 && results.failed.length === 0) {
      p.outro("Primitives already installed or skipped");
    } else {
      p.cancel("No primitives were installed");
      process.exit(1);
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to add primitives");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

type PrimitiveUpdateResult = {
  error?: string;
  name: string;
  newVersion?: string;
  oldVersion?: string;
  status: "updated" | "skipped" | "failed";
};

export function primitivesUpdate(
  primitives?: string[],
  options?: PrimitiveUpdateOptions,
): Promise<void>;
export function primitivesUpdate(
  primitives: string[] | undefined,
  options: PrivatePrimitiveUpdateOptions | undefined,
  dependencies: PrivatePrimitiveCommandDependencies,
): Promise<void>;
export async function primitivesUpdate(
  primitives?: string[],
  options?: PrivatePrimitiveUpdateOptions,
  dependencies?: PrivatePrimitiveCommandDependencies,
) {
  try {
    p.intro(highlighter.title(" Welcome to the Starwind CLI "));
    const previewMode = getPreviewMode(options);

    if (options?.all && primitives && primitives.length > 0) {
      p.log.error("Use either primitive names or --all, not both.");
      process.exit(1);
    }

    const runtimeConfig = previewMode.enabled
      ? await getCurrentConfigForPrimitivePreview(dependencies)
      : await getCurrentConfigForPrimitiveCommand(options, dependencies);

    if (!runtimeConfig) {
      return;
    }

    const targetPolicy = getTargetPolicy(dependencies);
    const primitiveFramework = getPrimitiveVendoringFramework(
      runtimeConfig,
      options?.framework,
      targetPolicy,
    );
    const installedPrimitives = runtimeConfig.primitives ?? [];

    if (installedPrimitives.length === 0) {
      p.log.warn("No primitives are currently installed.");
      process.exit(0);
    }

    if (!primitiveFramework) {
      p.log.warn("Primitive vendoring currently supports Astro and React projects only.");
      process.exit(0);
    }

    const primitivesToUpdate = getPrimitivesToUpdate(
      primitives,
      options,
      installedPrimitives,
      runtimeConfig,
      primitiveFramework,
    );

    if (primitivesToUpdate.length === 0) {
      p.log.warn("No valid primitives to update");
      process.exit(0);
    }

    p.log.info(`Updating primitives: ${sortComponentNames(primitivesToUpdate).join(", ")}`);

    if (previewMode.enabled) {
      const plan = await planPrimitiveComponentUpdates(primitivesToUpdate, {
        config: runtimeConfig,
        framework: primitiveFramework,
        packageManager: options?.packageManager,
        skipPrompts: true,
        ...(dependencies ? { artifacts: dependencies.artifacts, targetPolicy } : {}),
      });
      console.log(formatUpdatePreview(plan, previewMode));
      return;
    }

    const results = await updatePrimitiveComponents(primitivesToUpdate, {
      config: runtimeConfig,
      framework: primitiveFramework,
      packageManager: options?.packageManager,
      skipPrompts: options?.yes,
      ...(dependencies ? { artifacts: dependencies.artifacts, targetPolicy } : {}),
    });

    logPrimitiveUpdateSummary(results);

    await sleep(1000);

    if (results.failed.length > 0) {
      p.cancel("Some primitives failed to update");
      process.exit(1);
    } else if (results.updated.length > 0) {
      p.outro("Primitive source updated successfully");
    } else if (results.skipped.length > 0 && results.failed.length === 0) {
      p.outro("Primitives already up to date or skipped");
    } else {
      p.cancel("No primitives were updated");
      process.exit(1);
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to update primitives");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

export function primitivesList(options?: PrimitiveListOptions): Promise<void>;
export function primitivesList(
  options: PrivatePrimitiveListOptions | undefined,
  dependencies: PrivatePrimitiveCommandDependencies,
): Promise<void>;
export async function primitivesList(
  options?: PrivatePrimitiveListOptions,
  dependencies?: PrivatePrimitiveCommandDependencies,
) {
  try {
    if (!options?.json) {
      p.intro(highlighter.title(" Starwind Primitives "));
    }

    const targetPolicy = getTargetPolicy(dependencies);
    const framework = await resolvePrimitiveDiscoveryFramework(options?.framework, {
      targetPolicy: dependencies?.targetPolicy,
    });

    if (!framework) {
      if (options?.json) {
        console.log(
          JSON.stringify(
            {
              filters: {
                framework: null,
              },
              primitives: {
                total: 0,
                results: [],
              },
              warning: "Primitive source discovery supports Astro and React Runtime projects only.",
            },
            null,
            2,
          ),
        );
        return;
      }

      p.log.warn("Primitive source discovery supports Astro and React Runtime projects only.");
      p.outro("Run `starwind migrate` before adding primitive source.");
      return;
    }

    const primitives = getPrimitiveDiscoveryResults({
      framework,
      ...(dependencies
        ? { artifacts: dependencies.artifacts, targetPolicy: dependencies.targetPolicy }
        : {}),
    });

    if (options?.json) {
      const includeFrameworkFlag = options.framework !== undefined;
      console.log(
        JSON.stringify(
          {
            filters: {
              framework,
            },
            primitives: {
              total: primitives.length,
              results: primitives.map((primitive) =>
                toPrimitiveDiscoveryMetadata(primitive, {
                  includeFrameworkFlag,
                }),
              ),
            },
          },
          null,
          2,
        ),
      );
      return;
    }

    if (primitives.length === 0) {
      p.log.warn("No primitives found.");
      p.outro("Try a different framework.");
      return;
    }

    p.log.message(
      highlighter.underline(`${formatFrameworkLabel(framework, targetPolicy)} Primitives`),
    );

    const maxNameLen = Math.max(...primitives.map((primitive) => primitive.component.length));
    const includeFrameworkFlag = options?.framework !== undefined;

    for (const primitive of primitives) {
      const paddedName = primitive.component.padEnd(maxNameLen + 2);
      const frameworkBadge =
        framework === "all" ? `${highlighter.info(`[${primitive.framework}] `)}` : "";
      p.log.info(
        `  ${frameworkBadge}${highlighter.info(paddedName)}${getPrimitiveInstallCommand(
          primitive.component,
          includeFrameworkFlag ? primitive.framework : undefined,
        )}`,
      );
    }

    console.log();
    p.outro(`Found ${primitives.length} primitive${primitives.length === 1 ? "" : "s"}`);
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to list primitives");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

function getPrimitivesToUpdate(
  primitives: string[] | undefined,
  options: PrivatePrimitiveUpdateOptions | undefined,
  installedPrimitives: NonNullable<StarwindConfigFor<CliFrameworkTarget>["primitives"]>,
  config: StarwindConfigFor<CliFrameworkTarget>,
  framework: CliFrameworkTarget,
): string[] {
  const targetFrameworkPrimitives = installedPrimitives.filter(
    (primitive) => (primitive.framework ?? config.framework) === framework,
  );

  if (options?.all) {
    p.log.info(
      `Checking updates for all ${targetFrameworkPrimitives.length} installed primitive${
        targetFrameworkPrimitives.length === 1 ? "" : "s"
      }...`,
    );
    return targetFrameworkPrimitives.map((primitive) => primitive.name);
  }

  if (!primitives || primitives.length === 0) {
    return [];
  }

  return primitives;
}

async function getPrimitivesToInstall(
  primitives: string[] | undefined,
  options: PrivatePrimitiveAddOptions | undefined,
  config: StarwindConfigFor<CliFrameworkTarget>,
  framework: CliFrameworkTarget | undefined,
  availablePrimitives: PrimitiveVendoringArtifact<CliFrameworkTarget>[] | undefined,
): Promise<string[]> {
  if (options?.all) {
    if (!availablePrimitives) {
      p.log.warn("Primitive vendoring currently supports Astro and React projects only.");
      return [];
    }

    const uninstalledPrimitives = filterUninstalledPrimitives(
      availablePrimitives,
      config,
      framework,
    );

    if (uninstalledPrimitives.length === 0) {
      p.log.warn("All available primitives are already installed.");
      return [];
    }

    p.log.info(`Adding all ${uninstalledPrimitives.length} uninstalled primitives...`);
    return uninstalledPrimitives.map((primitive) => primitive.component);
  }

  if (primitives && primitives.length > 0) {
    if (!availablePrimitives) {
      return primitives;
    }

    const { valid, invalid } = partitionPrimitiveNames(primitives, availablePrimitives);

    if (invalid.length > 0) {
      p.log.warn(
        `${highlighter.warn("Invalid primitives found:")}\n${sortComponentNames(invalid)
          .map((name) => `  ${name}`)
          .join("\n")}`,
      );
    }

    if (valid.length === 0) {
      p.log.warn(`${highlighter.warn("No valid primitives to install")}`);
    }

    return valid;
  }

  if (!availablePrimitives) {
    p.log.warn("Primitive vendoring currently supports Astro and React projects only.");
    return [];
  }

  const uninstalledPrimitives = filterUninstalledPrimitives(availablePrimitives, config, framework);

  if (uninstalledPrimitives.length === 0) {
    p.log.warn("All available primitives are already installed.");
    return [];
  }

  const selected = await p.multiselect({
    message: "Select primitives to add ('a' for all, space to select, enter to confirm)",
    options: sortComponentPresentationByName(
      uninstalledPrimitives,
      (primitive) => primitive.component,
      (primitive) => primitive.framework,
    ).map((primitive) => ({
      label: primitive.component,
      value: primitive.component,
    })),
    required: false,
  });

  if (p.isCancel(selected)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  return Array.isArray(selected) ? selected : [];
}

function getAvailablePrimitives(
  framework: CliFrameworkTarget | undefined,
  dependencies?: PrivatePrimitiveCommandDependencies,
): PrimitiveVendoringArtifact<CliFrameworkTarget>[] | undefined {
  if (!framework) return undefined;

  return dependencies
    ? getPrimitiveComponents({
        artifacts: dependencies.artifacts,
        framework,
        targetPolicy: dependencies.targetPolicy,
      })
    : getPrimitiveComponents({ framework });
}

function getPrimitiveVendoringFramework(
  config: StarwindConfigFor<CliFrameworkTarget>,
  framework: CliFrameworkTarget | undefined,
  targetPolicy: FrameworkTargetPolicy<CliFrameworkTarget>,
): CliFrameworkTarget | undefined {
  if (framework !== undefined) {
    return isConfigTarget(targetPolicy, framework) ? framework : undefined;
  }

  return isConfigTarget(targetPolicy, config.framework) ? config.framework : undefined;
}

function filterUninstalledPrimitives(
  availablePrimitives: PrimitiveVendoringArtifact<CliFrameworkTarget>[],
  config: StarwindConfigFor<CliFrameworkTarget>,
  framework: CliFrameworkTarget | undefined,
): PrimitiveVendoringArtifact<CliFrameworkTarget>[] {
  const installedNames = new Set(
    (config.primitives ?? [])
      .filter((primitive) => (primitive.framework ?? config.framework) === framework)
      .map((primitive) => primitive.name),
  );
  return availablePrimitives.filter((primitive) => !installedNames.has(primitive.component));
}

function partitionPrimitiveNames(
  names: string[],
  availablePrimitives: PrimitiveVendoringArtifact<CliFrameworkTarget>[],
): { invalid: string[]; valid: string[] } {
  const availableNames = new Set(availablePrimitives.map((primitive) => primitive.component));
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const name of names) {
    if (availableNames.has(name)) {
      valid.push(name);
    } else {
      invalid.push(name);
    }
  }

  return { invalid, valid };
}

async function getCurrentConfigForPrimitivePreview(
  dependencies?: PrivatePrimitiveCommandDependencies,
): Promise<StarwindConfigFor<CliFrameworkTarget> | undefined> {
  const configState = dependencies
    ? await getConfigState(dependencies.targetPolicy)
    : await getConfigState();

  if (configState.status === "missing") {
    p.log.error(
      "No Runtime Starwind configuration found. Run `starwind init` before updating primitive source.",
    );
    process.exit(1);
  }

  if (configState.status === "legacy") {
    p.log.warn(
      "This project uses the legacy Starwind component setup. Run `starwind migrate` before updating primitive source.",
    );
    return undefined;
  }

  return configState.config;
}

async function getCurrentConfigForPrimitiveCommand(
  options: PrimitiveCommandOptions | undefined,
  dependencies?: PrivatePrimitiveCommandDependencies,
): Promise<StarwindConfigFor<CliFrameworkTarget> | undefined> {
  const configExists = await fileExists(PATHS.LOCAL_CONFIG_FILE);

  if (!configExists) {
    const shouldInit = options?.yes
      ? true
      : await p.confirm({
          message: `Starwind configuration not found. Would you like to run ${highlighter.info("starwind init")} now?`,
          initialValue: true,
        });

    if (p.isCancel(shouldInit)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    if (shouldInit) {
      await init(true, { defaults: options?.yes, packageManager: options?.packageManager });
    } else {
      p.log.error(
        `Please initialize starwind with ${highlighter.info("starwind init")} before adding primitives`,
      );
      process.exit(1);
    }
  }

  let detectedConfigState = dependencies
    ? await getConfigState(dependencies.targetPolicy)
    : await getConfigState();
  let configState = detectedConfigState.status === "missing" ? undefined : detectedConfigState;

  if (!configState) {
    p.log.error(
      "No Runtime Starwind configuration found. Run `starwind init` before adding primitives.",
    );
    process.exit(1);
  }

  if (configState?.status === "legacy") {
    const shouldMigrate = options?.yes
      ? true
      : await p.confirm({
          message:
            "This project already has a legacy Starwind config. Would you like to run `starwind migrate` now?",
          initialValue: true,
        });

    if (p.isCancel(shouldMigrate)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    if (!shouldMigrate) {
      p.log.warn(
        "This project uses the legacy Starwind component setup. Run `starwind migrate` before adding primitive source.",
      );
      return undefined;
    }

    await migrate({
      packageManager: options?.packageManager,
      withinInit: true,
      yes: options?.yes,
    });

    detectedConfigState = dependencies
      ? await getConfigState(dependencies.targetPolicy)
      : await getConfigState();
    configState = detectedConfigState.status === "missing" ? undefined : detectedConfigState;

    if (!configState || configState.status !== "current") {
      p.log.warn(
        "Starwind migration did not produce a Runtime config. Run `starwind migrate` before adding primitive source.",
      );
      return undefined;
    }
  }

  return configState.status === "current" ? configState.config : undefined;
}

function logPrimitiveInstallSummary(results: PrimitiveInstallSummary): void {
  p.log.message(`\n\n${highlighter.underline("Primitive Installation Summary")}`);

  if (results.failed.length > 0) {
    p.log.error(
      `${highlighter.error("Failed to install primitives:")}\n${formatPrimitiveResults(
        results.failed,
      )}`,
    );
  }

  if (results.skipped.length > 0) {
    p.log.warn(
      `${highlighter.warn("Skipped primitives:")}\n${formatPrimitiveResults(results.skipped)}`,
    );
  }

  if (results.installed.length > 0) {
    p.log.success(
      `${highlighter.success("Successfully installed primitives:")}\n${formatPrimitiveResults(
        results.installed,
      )}`,
    );
  }
}

function logPrimitiveUpdateSummary(results: PrimitiveUpdateSummary): void {
  p.log.message(`\n\n${highlighter.underline("Primitive Update Summary")}`);

  if (results.failed.length > 0) {
    p.log.error(
      `${highlighter.error("Failed to update primitives:")}\n${formatPrimitiveUpdateResults(
        results.failed,
      )}`,
    );
  }

  if (results.skipped.length > 0) {
    p.log.info(
      `${highlighter.info("Primitives already up to date or skipped:")}\n${formatPrimitiveUpdateResults(
        results.skipped,
      )}`,
    );
  }

  if (results.updated.length > 0) {
    p.log.success(
      `${highlighter.success("Successfully updated primitives:")}\n${formatPrimitiveUpdateResults(
        results.updated,
      )}`,
    );
  }
}

function formatPrimitiveResults(results: PrimitiveAddResult[]): string {
  return sortComponentPresentationByName(results, (result) => result.name)
    .map((result) => {
      if (result.status === "failed") {
        return `  ${result.name} - ${result.error ?? "Unknown error"}`;
      }

      return `  ${result.name}${result.version ? ` v${result.version}` : ""}`;
    })
    .join("\n");
}

function formatPrimitiveUpdateResults(results: PrimitiveUpdateResult[]): string {
  return sortComponentPresentationByName(results, (result) => result.name)
    .map((result) => {
      if (result.status === "failed") {
        return `  ${result.name} - ${result.error ?? "Unknown error"}`;
      }

      return `  ${result.name} (${result.oldVersion ?? "unknown"} -> ${
        result.newVersion ?? "unknown"
      })`;
    })
    .join("\n");
}

function formatFrameworkLabel(
  framework: PrimitiveDiscoveryFramework<CliFrameworkTarget>,
  targetPolicy: FrameworkTargetPolicy<CliFrameworkTarget>,
): string {
  if (framework === "all") return "All";
  return targetPolicy.labels[framework];
}

function getTargetPolicy(
  dependencies?: PrivatePrimitiveCommandDependencies,
): FrameworkTargetPolicy<CliFrameworkTarget> {
  return (
    dependencies?.targetPolicy ??
    (PUBLIC_FRAMEWORK_TARGET_POLICY as FrameworkTargetPolicy<CliFrameworkTarget>)
  );
}
