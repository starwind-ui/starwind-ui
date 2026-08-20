import * as p from "@clack/prompts";

import { getConfigState, type StarwindConfigFor, type StarwindFramework } from "@/utils/config.js";
import { sortComponentNames, sortComponentPresentation } from "@/utils/component-presentation.js";
import { PATHS } from "@/utils/constants.js";
import {
  type FrameworkTargetPolicy,
  isConfigTarget,
  type PrivateVueCliFrameworkTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "@/utils/framework-target-policy.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import {
  parseRegistrySource,
  type RegistrySource,
  type StarwindRegistryFor,
} from "@/utils/registry.js";
import {
  planRuntimeComponentUpdates,
  type RuntimeUpdateDelivery,
  updateRuntimeComponents,
  type UpdateRuntimeComponentsOptions,
} from "@/utils/runtime-component.js";
import { sleep } from "@/utils/sleep.js";
import { formatUpdatePreview, getPreviewMode } from "@/utils/update-preview.js";

interface UpdateOptions {
  all?: boolean;
  diff?: true | string;
  dryRun?: boolean;
  framework?: StarwindFramework | "all";
  yes?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn";
  registry?: string;
  view?: true | string;
}

export type PrivateVueUpdateOptions = Omit<UpdateOptions, "framework"> & {
  framework?: PrivateVueCliFrameworkTarget | "all";
};

export type PrivateVueUpdateDependencies = {
  registry: StarwindRegistryFor<PrivateVueCliFrameworkTarget>;
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>;
};

type UpdateResult = {
  delivery?: RuntimeUpdateDelivery;
  error?: string;
  framework?: PrivateVueCliFrameworkTarget;
  name: string;
  newVersion?: string;
  oldVersion?: string;
  status: "updated" | "skipped" | "failed";
};

type UpdatedUpdateResult = Omit<UpdateResult, "delivery" | "status"> & {
  delivery: RuntimeUpdateDelivery;
  status: "updated";
};

export function update(components?: string[], options?: UpdateOptions): Promise<void>;
export function update(
  components: string[] | undefined,
  options: PrivateVueUpdateOptions,
  dependencies: PrivateVueUpdateDependencies,
): Promise<void>;
export async function update(
  components?: string[],
  options?: PrivateVueUpdateOptions,
  dependencies?: PrivateVueUpdateDependencies,
): Promise<void> {
  try {
    p.intro(highlighter.title(" Welcome to the Starwind CLI "));
    const targetPolicy =
      dependencies?.targetPolicy ??
      (PUBLIC_FRAMEWORK_TARGET_POLICY as FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>);
    if (
      options?.framework &&
      options.framework !== "all" &&
      !isConfigTarget(targetPolicy, options.framework)
    ) {
      throw new Error(
        `Framework "${options.framework}" is not available under the ${targetPolicy.cacheKey} target policy.`,
      );
    }

    // Check if starwind.config.json exists
    const configExists = await fileExists(PATHS.LOCAL_CONFIG_FILE);

    if (!configExists) {
      p.log.error("No Starwind configuration found. Please run starwind init first.");
      process.exit(1);
    }

    const configState = dependencies ? await getConfigState(targetPolicy) : await getConfigState();

    if (configState.status === "missing") {
      p.log.error("No Runtime Starwind configuration found. Please run starwind init first.");
      process.exit(1);
    }

    if (configState.status === "legacy") {
      p.log.warn(
        "This project uses the legacy Starwind component setup. Run `starwind migrate` before updating Runtime components.",
      );
      return;
    }

    // Get current config and installed components
    const config = configState.config;

    const installedComponents = getInstalledComponentsForUpdate(
      config,
      options?.framework,
      targetPolicy,
    );
    const runtimeComponents = getInstalledComponentsForUpdate(config, "all", targetPolicy);
    const runtimeRegistrySource: RegistrySource | undefined = parseRegistrySource(
      options?.registry,
    );

    if (runtimeComponents.length === 0) {
      p.log.warn("No components are currently installed.");
      process.exit(0);
    }

    let componentsToUpdate: string[] = [];

    // ================================================================
    //                     Get components to update
    // ================================================================
    if (options?.all) {
      // Update all installed components
      componentsToUpdate = getUniqueComponentNames(installedComponents);
      p.log.info(`Checking updates for all ${componentsToUpdate.length} installed components...`);
    } else if (components && components.length > 0) {
      // Validate that all specified components are installed
      const invalid = components.filter(
        (comp) => !runtimeComponents.some((ic) => ic.name === comp),
      );

      if (invalid.length > 0) {
        p.log.warn(
          `${highlighter.warn("Components not found in project:")}\n${sortComponentNames(invalid)
            .map((name) => `  ${name}`)
            .join("\n")}`,
        );
      }

      componentsToUpdate = components.filter((comp) =>
        runtimeComponents.some((ic) => ic.name === comp),
      );

      if (componentsToUpdate.length === 0) {
        p.log.warn("No valid components to update");
        process.exit(0);
      }
    } else {
      // Show interactive prompt with installed components
      const choices = sortComponentNames(getUniqueComponentNames(installedComponents)).map(
        (name) => ({
          value: name,
          label:
            options?.framework === "all" &&
            hasMultipleInstalledFrameworks(config, name, targetPolicy)
              ? `${name} [all frameworks]`
              : name,
        }),
      );

      const selected = await p.multiselect({
        message: "Select components to update",
        options: choices,
      });

      if (p.isCancel(selected)) {
        p.cancel("Operation cancelled");
        process.exit(0);
      }

      componentsToUpdate = selected as string[];
    }

    if (componentsToUpdate.length === 0) {
      p.log.warn("No components selected for update");
      process.exit(0);
    }

    const results = {
      updated: [] as UpdatedUpdateResult[],
      skipped: [] as UpdateResult[],
      failed: [] as UpdateResult[],
    };
    const previewMode = getPreviewMode(options);
    const registryOverride = runtimeRegistrySource
      ? { registrySource: runtimeRegistrySource }
      : dependencies
        ? { registry: dependencies.registry }
        : {};
    const frameworkOverride = options?.framework ? { framework: options.framework } : {};

    // ================================================================
    //                     Update Components
    // ================================================================
    if (previewMode.enabled) {
      const previewOptions = {
        config,
        ...frameworkOverride,
        packageManager: options?.packageManager,
        ...registryOverride,
        skipPrompts: true,
      };
      const plan = dependencies
        ? await planRuntimeComponentUpdates(componentsToUpdate, {
            ...previewOptions,
            targetPolicy,
          })
        : await planRuntimeComponentUpdates(
            componentsToUpdate,
            previewOptions as UpdateRuntimeComponentsOptions,
          );
      console.log(formatUpdatePreview(plan, previewMode));
      return;
    }

    const updateOptions = {
      config,
      ...frameworkOverride,
      packageManager: options?.packageManager,
      ...registryOverride,
      skipPrompts: options?.yes,
    };
    const runtimeResults = dependencies
      ? await updateRuntimeComponents(componentsToUpdate, {
          ...updateOptions,
          targetPolicy,
        })
      : await updateRuntimeComponents(
          componentsToUpdate,
          updateOptions as UpdateRuntimeComponentsOptions,
        );
    results.updated.push(...runtimeResults.updated);
    results.skipped.push(...runtimeResults.skipped);
    results.failed.push(...runtimeResults.failed);

    // ================================================================
    //                     Update summary
    // ================================================================
    p.log.message(`\n\n${highlighter.underline("Update Summary")}`);

    if (results.failed.length > 0) {
      p.log.error(
        `${highlighter.error("Failed to update components:")}\n${sortComponentPresentation(
          results.failed,
        )
          .map((r) => `  ${formatUpdateResultName(r)} - ${r.error}`)
          .join("\n")}`,
      );
    }

    if (results.skipped.length > 0) {
      p.log.info(
        `${highlighter.info("Components already up to date or skipped:")}\n${sortComponentPresentation(
          results.skipped,
        )
          .map(
            (r) =>
              `  ${formatUpdateResultName(r)} (${r.oldVersion})${r.delivery ? ` [${r.delivery}]` : ""}`,
          )
          .join("\n")}`,
      );
    }

    if (results.updated.length > 0) {
      p.log.success(
        `${highlighter.success("Successfully updated components:")}\n${sortComponentPresentation(
          results.updated,
        )
          .map(
            (r) =>
              `  ${formatUpdateResultName(r)} (${r.oldVersion} → ${r.newVersion}) [${r.delivery}]`,
          )
          .join("\n")}`,
      );
    }

    await sleep(1000);

    if (results.updated.length > 0) {
      p.outro("Components updated successfully 🚀");
    } else if (results.skipped.length > 0 && results.failed.length === 0) {
      p.outro("Components already up to date or skipped ✨");
    } else {
      p.cancel("No components were updated");
      process.exit(1);
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to update components");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

function getInstalledComponentsForUpdate(
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget>,
  frameworkScope: PrivateVueCliFrameworkTarget | "all" | undefined,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): StarwindConfigFor<PrivateVueCliFrameworkTarget>["components"] {
  return config.components.filter((component) => {
    if (component.source === "legacy") return false;

    const componentFramework = component.framework ?? config.framework;
    if (!isConfigTarget(targetPolicy, componentFramework)) return false;

    if (frameworkScope === "all") return true;

    const targetFramework = frameworkScope ?? config.framework;
    return componentFramework === targetFramework;
  });
}

function getUniqueComponentNames(
  components: StarwindConfigFor<PrivateVueCliFrameworkTarget>["components"],
): string[] {
  return [...new Set(components.map((component) => component.name))];
}

function hasMultipleInstalledFrameworks(
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget>,
  name: string,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): boolean {
  const frameworks = new Set(
    config.components
      .filter((component) => component.source !== "legacy")
      .filter((component) => component.name === name)
      .map((component) => component.framework ?? config.framework)
      .filter((framework) => isConfigTarget(targetPolicy, framework)),
  );

  return frameworks.size > 1;
}

function formatUpdateResultName(result: UpdateResult): string {
  return result.framework ? `${result.name} [${result.framework}]` : result.name;
}
