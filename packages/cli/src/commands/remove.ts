import * as p from "@clack/prompts";

import { type RemoveResult, type RemoveTarget, removeComponent } from "@/utils/component.js";
import {
  type ComponentConfigFor,
  getConfig,
  getStyledComponentDir,
  type StarwindConfigFor,
  type StarwindFramework,
  updateConfig,
} from "@/utils/config.js";
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
import { syncReactProjectComponentStyles } from "@/utils/runtime-component.js";
import { sleep } from "@/utils/sleep.js";

interface RemoveOptions {
  all?: boolean;
  framework?: StarwindFramework | "all";
  yes?: boolean;
}

export type PrivateVueRemoveOptions = Omit<RemoveOptions, "framework"> & {
  framework?: PrivateVueCliFrameworkTarget | "all";
};

export type PrivateVueRemoveDependencies = {
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>;
};

type LifecycleRemoveTarget = RemoveTarget<PrivateVueCliFrameworkTarget>;
type LifecycleRemoveResult = RemoveResult<PrivateVueCliFrameworkTarget>;

export function remove(components?: string[], options?: RemoveOptions): Promise<void>;
export function remove(
  components: string[] | undefined,
  options: PrivateVueRemoveOptions,
  dependencies: PrivateVueRemoveDependencies,
): Promise<void>;
export async function remove(
  components?: string[],
  options?: PrivateVueRemoveOptions,
  dependencies?: PrivateVueRemoveDependencies,
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

    // Read and validate config before planning any filesystem mutations.
    const config = dependencies ? await getConfig(targetPolicy) : await getConfig();
    const installedTargets = getInstalledRemovalTargets(config, targetPolicy);

    if (installedTargets.length === 0) {
      p.log.warn("No components are currently installed.");
      process.exit(0);
    }

    const frameworkScope = options?.framework ?? getPrimaryFramework(config, targetPolicy);
    const scopedTargets = installedTargets.filter(
      (target) => frameworkScope === "all" || target.framework === frameworkScope,
    );
    let targetsToRemove: LifecycleRemoveTarget[] = [];

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
          `${highlighter.warn("Components not found:")}\n${sortComponentNames(invalid)
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
      const choices = sortComponentPresentation(scopedTargets).map((target) => ({
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
    if (!options?.yes) {
      const confirmed = await p.confirm({
        message: `Remove ${sortComponentPresentation(targetsToRemove)
          .map((target) => highlighter.info(formatRemovalTarget(target)))
          .join(", ")} ${targetsToRemove.length > 1 ? "components" : "component"}?`,
      });

      if (!confirmed || p.isCancel(confirmed)) {
        p.cancel("Operation cancelled");
        process.exit(0);
      }
    }

    const results = {
      removed: [] as LifecycleRemoveResult[],
      failed: [] as LifecycleRemoveResult[],
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
        (component) => !successfulKeys.has(getComponentConfigKey(config, component, targetPolicy)),
      );

      await updateConfig(
        { components: updatedComponents },
        dependencies ? { appendComponents: false, targetPolicy } : { appendComponents: false },
      );
      await syncReactProjectComponentStyles(config);
    }

    // ================================================================
    //                     Removal summary
    // ================================================================
    p.log.message(`\n\n${highlighter.underline("Removal Summary")}`);

    if (results.failed.length > 0) {
      p.log.error(
        `${highlighter.error("Failed to remove components:")}\n${sortComponentPresentation(
          results.failed,
        )
          .map((result) => `  ${formatRemovalTarget(result)} - ${result.error}`)
          .join("\n")}`,
      );
    }

    if (results.removed.length > 0) {
      p.log.success(
        `${highlighter.success("Successfully removed components:")}\n${sortComponentPresentation(
          results.removed,
        )
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

function getInstalledRemovalTargets(
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget>,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): LifecycleRemoveTarget[] {
  const targets = new Map<string, LifecycleRemoveTarget>();

  for (const component of config.components) {
    const framework = getComponentFramework(config, component, targetPolicy);
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

function getPrimaryFramework(
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget>,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): PrivateVueCliFrameworkTarget {
  if (isConfigTarget(targetPolicy, config.framework)) {
    return config.framework;
  }

  if (config.version !== 2) {
    return "astro";
  }

  throw new Error("Unable to resolve the primary framework for installed components.");
}

function getComponentFramework(
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget>,
  component: ComponentConfigFor<PrivateVueCliFrameworkTarget>,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): PrivateVueCliFrameworkTarget {
  if (isConfigTarget(targetPolicy, component.framework)) {
    return component.framework;
  }

  if (component.source === "legacy" || config.version !== 2) {
    return getPrimaryFramework(config, targetPolicy);
  }

  throw new Error(`Unable to resolve the framework for component "${component.name}".`);
}

function isLegacyComponent(
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget>,
  component: ComponentConfigFor<PrivateVueCliFrameworkTarget>,
): boolean {
  return component.source === "legacy" || config.version !== 2;
}

function getLegacyStarwindComponentDir(componentDir: string): string {
  const normalized = componentDir.replace(/\\/g, "/").replace(/\/+$/, "");

  return normalized.endsWith("/starwind") || normalized === "starwind"
    ? normalized
    : `${normalized}/starwind`;
}

function getComponentConfigKey(
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget>,
  component: ComponentConfigFor<PrivateVueCliFrameworkTarget>,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): string {
  return `${getComponentFramework(config, component, targetPolicy)}:${component.name}`;
}

function getRemovalTargetKey(target: Pick<LifecycleRemoveTarget, "framework" | "name">): string {
  return `${target.framework}:${target.name}`;
}

function hasDuplicateName(targets: LifecycleRemoveTarget[], name: string): boolean {
  return targets.filter((target) => target.name === name).length > 1;
}

function formatRemovalTarget(target: Pick<LifecycleRemoveTarget, "framework" | "name">): string {
  return `${target.name} [${target.framework}]`;
}
