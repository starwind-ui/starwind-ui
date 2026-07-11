import * as p from "@clack/prompts";

import { getConfigState, type StarwindConfig, type StarwindFramework } from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { parseRegistrySource, type RegistrySource } from "@/utils/registry.js";
import { planRuntimeComponentUpdates, updateRuntimeComponents } from "@/utils/runtime-component.js";
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

type UpdateResult = {
  error?: string;
  framework?: StarwindFramework;
  name: string;
  newVersion?: string;
  oldVersion?: string;
  status: "updated" | "skipped" | "failed";
};

export async function update(components?: string[], options?: UpdateOptions) {
  try {
    p.intro(highlighter.title(" Welcome to the Starwind CLI "));

    // Check if starwind.config.json exists
    const configExists = await fileExists(PATHS.LOCAL_CONFIG_FILE);

    if (!configExists) {
      p.log.error("No Starwind configuration found. Please run starwind init first.");
      process.exit(1);
    }

    const configState = await getConfigState();

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

    const installedComponents = getInstalledComponentsForUpdate(config, options?.framework);
    const runtimeComponents = getInstalledComponentsForUpdate(config, "all");
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
          `${highlighter.warn("Components not found in project:")}\n${invalid
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
      const choices = getUniqueComponentNames(installedComponents).map((name) => ({
        value: name,
        label:
          options?.framework === "all" && hasMultipleInstalledFrameworks(config, name)
            ? `${name} [all frameworks]`
            : name,
      }));

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
      updated: [] as UpdateResult[],
      skipped: [] as UpdateResult[],
      failed: [] as UpdateResult[],
    };
    const previewMode = getPreviewMode(options);
    const registryOverride = runtimeRegistrySource ? { registrySource: runtimeRegistrySource } : {};
    const frameworkOverride = options?.framework ? { framework: options.framework } : {};

    // ================================================================
    //                     Update Components
    // ================================================================
    if (previewMode.enabled) {
      const plan = await planRuntimeComponentUpdates(componentsToUpdate, {
        config,
        ...frameworkOverride,
        packageManager: options?.packageManager,
        ...registryOverride,
        skipPrompts: true,
      });
      console.log(formatUpdatePreview(plan, previewMode));
      return;
    }

    const runtimeResults = await updateRuntimeComponents(componentsToUpdate, {
      config,
      ...frameworkOverride,
      packageManager: options?.packageManager,
      ...registryOverride,
      skipPrompts: options?.yes,
    });
    results.updated.push(...runtimeResults.updated);
    results.skipped.push(...runtimeResults.skipped);
    results.failed.push(...runtimeResults.failed);

    // ================================================================
    //                     Update summary
    // ================================================================
    p.log.message(`\n\n${highlighter.underline("Update Summary")}`);

    if (results.failed.length > 0) {
      p.log.error(
        `${highlighter.error("Failed to update components:")}\n${results.failed
          .map((r) => `  ${formatUpdateResultName(r)} - ${r.error}`)
          .join("\n")}`,
      );
    }

    if (results.skipped.length > 0) {
      p.log.info(
        `${highlighter.info("Components already up to date or skipped:")}\n${results.skipped
          .map((r) => `  ${formatUpdateResultName(r)} (${r.oldVersion})`)
          .join("\n")}`,
      );
    }

    if (results.updated.length > 0) {
      p.log.success(
        `${highlighter.success("Successfully updated components:")}\n${results.updated
          .map((r) => `  ${formatUpdateResultName(r)} (${r.oldVersion} → ${r.newVersion})`)
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
  config: StarwindConfig,
  frameworkScope?: StarwindFramework | "all",
): StarwindConfig["components"] {
  return config.components.filter((component) => {
    if (component.source === "legacy") return false;

    const componentFramework = component.framework ?? config.framework;
    if (componentFramework !== "astro" && componentFramework !== "react") return false;

    if (frameworkScope === "all") return true;

    const targetFramework = frameworkScope ?? config.framework;
    return componentFramework === targetFramework;
  });
}

function getUniqueComponentNames(components: StarwindConfig["components"]): string[] {
  return [...new Set(components.map((component) => component.name))];
}

function hasMultipleInstalledFrameworks(config: StarwindConfig, name: string): boolean {
  const frameworks = new Set(
    config.components
      .filter((component) => component.source !== "legacy")
      .filter((component) => component.name === name)
      .map((component) => component.framework ?? config.framework)
      .filter((framework) => framework === "astro" || framework === "react"),
  );

  return frameworks.size > 1;
}

function formatUpdateResultName(result: UpdateResult): string {
  return result.framework ? `${result.name} [${result.framework}]` : result.name;
}
