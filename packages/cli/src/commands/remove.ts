import * as p from "@clack/prompts";

import { type RemoveResult, type RemoveTarget, removeComponent } from "@/utils/component.js";
import {
  type ComponentConfig,
  getConfig,
  getStyledComponentDir,
  type StarwindConfig,
  type StarwindFramework,
  updateConfig,
} from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { sleep } from "@/utils/sleep.js";

interface RemoveOptions {
  all?: boolean;
  framework?: StarwindFramework | "all";
}

export async function remove(components?: string[], options?: RemoveOptions) {
  try {
    p.intro(highlighter.title(" Welcome to the Starwind CLI "));

    // Check if starwind.config.json exists
    const configExists = await fileExists(PATHS.LOCAL_CONFIG_FILE);

    if (!configExists) {
      p.log.error("No Starwind configuration found. Please run starwind init first.");
      process.exit(1);
    }

    // Read and validate config before planning any filesystem mutations.
    const config = await getConfig();
    const installedTargets = getInstalledRemovalTargets(config);

    if (installedTargets.length === 0) {
      p.log.warn("No components are currently installed.");
      process.exit(0);
    }

    const frameworkScope = options?.framework ?? getPrimaryFramework(config);
    const scopedTargets = installedTargets.filter(
      (target) => frameworkScope === "all" || target.framework === frameworkScope,
    );
    let targetsToRemove: RemoveTarget[] = [];

    // ================================================================
    //                     Get components to remove
    // ================================================================
    if (options?.all) {
      targetsToRemove = scopedTargets;
      p.log.info(`Removing all ${targetsToRemove.length} installed components...`);
    } else if (components && components.length > 0) {
      const requestedNames = [...new Set(components)];
      const invalid = requestedNames.filter(
        (name) => !scopedTargets.some((target) => target.name === name),
      );

      if (invalid.length > 0) {
        p.log.warn(
          `${highlighter.warn("Components not found:")}\n${invalid
            .map((name) => `  ${name}`)
            .join("\n")}`,
        );
      }

      const requestedNameSet = new Set(requestedNames);
      targetsToRemove = scopedTargets.filter((target) => requestedNameSet.has(target.name));

      if (targetsToRemove.length === 0) {
        p.log.warn("No valid components to remove");
        process.exit(0);
      }
    } else {
      const choices = scopedTargets.map((target) => ({
        value: getRemovalTargetKey(target),
        label: hasDuplicateName(scopedTargets, target.name)
          ? formatRemovalTarget(target)
          : target.name,
      }));

      const selected = await p.multiselect({
        message: "Select components to remove",
        options: choices,
      });

      if (p.isCancel(selected)) {
        p.cancel("Operation cancelled");
        process.exit(0);
      }

      const selectedKeys = new Set(selected as string[]);
      targetsToRemove = scopedTargets.filter((target) =>
        selectedKeys.has(getRemovalTargetKey(target)),
      );
    }

    if (targetsToRemove.length === 0) {
      p.log.warn("No components selected for removal");
      process.exit(0);
    }

    // Confirm removal using the exact framework-qualified identities.
    const confirmed = await p.confirm({
      message: `Remove ${targetsToRemove
        .map((target) => highlighter.info(formatRemovalTarget(target)))
        .join(", ")} ${targetsToRemove.length > 1 ? "components" : "component"}?`,
    });

    if (!confirmed || p.isCancel(confirmed)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    const results = {
      removed: [] as RemoveResult[],
      failed: [] as RemoveResult[],
    };

    // ================================================================
    //                     Remove Components
    // ================================================================
    for (const target of targetsToRemove) {
      const result = await removeComponent(target);
      if (result.status === "removed") {
        results.removed.push(result);
      } else {
        results.failed.push(result);
      }
    }

    // ================================================================
    //                     Update Config File
    // ================================================================
    if (results.removed.length > 0) {
      const successfulKeys = new Set(results.removed.map(getRemovalTargetKey));
      const updatedComponents = config.components.filter(
        (component) => !successfulKeys.has(getComponentConfigKey(config, component)),
      );

      await updateConfig({ components: updatedComponents }, { appendComponents: false });
    }

    // ================================================================
    //                     Removal summary
    // ================================================================
    p.log.message(`\n\n${highlighter.underline("Removal Summary")}`);

    if (results.failed.length > 0) {
      p.log.error(
        `${highlighter.error("Failed to remove components:")}\n${results.failed
          .map((result) => `  ${formatRemovalTarget(result)} - ${result.error}`)
          .join("\n")}`,
      );
    }

    if (results.removed.length > 0) {
      p.log.success(
        `${highlighter.success("Successfully removed components:")}\n${results.removed
          .map((result) => `  ${formatRemovalTarget(result)}`)
          .join("\n")}`,
      );
    }

    await sleep(1000);

    if (results.removed.length > 0) {
      p.outro("Components removed successfully 🗑️");
    } else {
      p.cancel("Errors occurred while removing components");
      process.exit(1);
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to remove components");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

function getInstalledRemovalTargets(config: StarwindConfig): RemoveTarget[] {
  const targets = new Map<string, RemoveTarget>();

  for (const component of config.components) {
    const framework = getComponentFramework(config, component);
    const configuredComponentDir = getStyledComponentDir(config, framework);
    const componentDir = isLegacyComponent(config, component)
      ? getLegacyStarwindComponentDir(configuredComponentDir)
      : configuredComponentDir;
    const target = {
      name: component.name,
      framework,
      componentDir,
    };

    targets.set(getRemovalTargetKey(target), target);
  }

  return [...targets.values()];
}

function getPrimaryFramework(config: StarwindConfig): StarwindFramework {
  if (config.framework === "astro" || config.framework === "react") {
    return config.framework;
  }

  if (config.version !== 2) {
    return "astro";
  }

  throw new Error("Unable to resolve the primary framework for installed components.");
}

function getComponentFramework(
  config: StarwindConfig,
  component: ComponentConfig,
): StarwindFramework {
  if (component.framework === "astro" || component.framework === "react") {
    return component.framework;
  }

  if (component.source === "legacy" || config.version !== 2) {
    return getPrimaryFramework(config);
  }

  throw new Error(`Unable to resolve the framework for component "${component.name}".`);
}

function isLegacyComponent(config: StarwindConfig, component: ComponentConfig): boolean {
  return component.source === "legacy" || config.version !== 2;
}

function getLegacyStarwindComponentDir(componentDir: string): string {
  const normalized = componentDir.replace(/\\/g, "/").replace(/\/+$/, "");

  return normalized.endsWith("/starwind") || normalized === "starwind"
    ? normalized
    : `${normalized}/starwind`;
}

function getComponentConfigKey(config: StarwindConfig, component: ComponentConfig): string {
  return `${getComponentFramework(config, component)}:${component.name}`;
}

function getRemovalTargetKey(target: Pick<RemoveTarget, "framework" | "name">): string {
  return `${target.framework}:${target.name}`;
}

function hasDuplicateName(targets: RemoveTarget[], name: string): boolean {
  return targets.filter((target) => target.name === name).length > 1;
}

function formatRemovalTarget(target: Pick<RemoveTarget, "framework" | "name">): string {
  return `${target.name} [${target.framework}]`;
}
