import * as p from "@clack/prompts";

import {
  getConfigState,
  type StarwindConfig,
  type StarwindConfigFor,
  type StarwindFramework,
} from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import { sortComponentNames, sortComponentPresentation } from "@/utils/component-presentation.js";
import {
  type FrameworkTargetPolicy,
  isConfigTarget,
  type PrivateVueCliFrameworkTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "@/utils/framework-target-policy.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { detectPackageManager } from "@/utils/package-manager.js";
import { installProRegistryItems, type ProRegistryInstallSummary } from "@/utils/pro-registry.js";
import { selectComponents } from "@/utils/prompts.js";
import {
  getConfiguredRegistrySource,
  loadRegistry,
  parseRegistrySource,
  type ComponentFor,
  type RegistrySource,
  type StarwindRegistryFor,
} from "@/utils/registry.js";
import {
  installRuntimeComponents,
  type InstallRuntimeComponentsOptions,
} from "@/utils/runtime-component.js";
import { importStarwindProRegistryFromComponentsJson } from "@/utils/shadcn-config.js";
import { sleep } from "@/utils/sleep.js";
import { isValidComponent } from "@/utils/validate.js";

import { init } from "./init.js";
import { migrate } from "./migrate.js";

interface AddOptions {
  all?: boolean;
  yes?: boolean;
  overwrite?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn";
  registry?: string;
  framework?: StarwindFramework;
}

export type PrivateVueAddOptions = Omit<AddOptions, "framework"> & {
  framework?: PrivateVueCliFrameworkTarget;
};

export type PrivateVueAddDependencies = {
  registry: StarwindRegistryFor<PrivateVueCliFrameworkTarget>;
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>;
};

type AddResult = {
  name: string;
  status: "installed" | "skipped" | "failed";
  version?: string;
  error?: string;
};

type RuntimeRegistrySelection =
  | {
      availableComponents: ComponentFor<PrivateVueCliFrameworkTarget>[];
      mode: "single";
      registry: StarwindRegistryFor<PrivateVueCliFrameworkTarget>;
      source?: RegistrySource;
    }
  | {
      availableComponents: ComponentFor<PrivateVueCliFrameworkTarget>[];
      customRegistry: StarwindRegistryFor<PrivateVueCliFrameworkTarget>;
      customSource: RegistrySource;
      defaultRegistry: StarwindRegistryFor<PrivateVueCliFrameworkTarget>;
      defaultSource?: RegistrySource;
      mode: "overlay";
    };

export function add(components?: string[], options?: AddOptions): Promise<void>;
export function add(
  components: string[] | undefined,
  options: PrivateVueAddOptions,
  dependencies: PrivateVueAddDependencies,
): Promise<void>;
export async function add(
  components?: string[],
  options?: PrivateVueAddOptions,
  dependencies?: PrivateVueAddDependencies,
): Promise<void> {
  try {
    p.intro(highlighter.title(" Welcome to the Starwind CLI "));
    const packageManager = options?.packageManager ?? detectPackageManager().name;
    const targetPolicy =
      dependencies?.targetPolicy ??
      (PUBLIC_FRAMEWORK_TARGET_POLICY as FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>);
    if (options?.framework && !isConfigTarget(targetPolicy, options.framework)) {
      throw new Error(
        `Framework "${options.framework}" is not available under the ${targetPolicy.cacheKey} target policy.`,
      );
    }
    const loadRuntimeRegistry = (source: RegistrySource | undefined) =>
      dependencies
        ? loadRegistry(source, { targetPolicy })
        : (loadRegistry(source) as Promise<StarwindRegistryFor<PrivateVueCliFrameworkTarget>>);

    // Check if starwind.config.json exists
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
        const initOptions = {
          defaults: options?.yes,
          framework: options?.framework,
          packageManager,
        };
        if (dependencies) {
          await init(true, initOptions, dependencies);
        } else {
          await init(true, {
            ...initOptions,
            framework: initOptions.framework as StarwindFramework | undefined,
          });
        }
      } else {
        p.log.error(
          `Please initialize starwind with ${highlighter.info("starwind init")} before adding components`,
        );
        process.exit(1);
      }
    }

    let detectedConfigState = dependencies
      ? await getConfigState(targetPolicy)
      : await getConfigState();
    let configState = detectedConfigState.status === "missing" ? undefined : detectedConfigState;

    if (!configState) {
      p.log.error(
        "No Runtime Starwind configuration found. Run `starwind init` before adding components.",
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
          "This project uses the legacy Starwind component setup. Run `starwind migrate` before adding Runtime components.",
        );
        return;
      }

      await migrate({
        packageManager,
        withinInit: true,
        yes: options?.yes,
      });

      detectedConfigState = dependencies
        ? await getConfigState(targetPolicy)
        : await getConfigState();
      configState = detectedConfigState.status === "missing" ? undefined : detectedConfigState;

      if (!configState || configState.status !== "current") {
        p.log.warn(
          "Starwind migration did not produce a Runtime config. Run `starwind migrate` before adding Runtime components.",
        );
        return;
      }
    }

    const runtimeConfig: StarwindConfigFor<PrivateVueCliFrameworkTarget> | undefined =
      configState.status === "current" ? configState.config : undefined;
    const explicitRuntimeRegistrySource = parseRegistrySource(options?.registry);
    const configuredRuntimeRegistrySource = runtimeConfig
      ? getConfiguredRegistrySource(runtimeConfig)
      : undefined;
    const runtimeRegistrySource: RegistrySource | undefined =
      explicitRuntimeRegistrySource ?? configuredRuntimeRegistrySource;
    let runtimeRegistrySelection: RuntimeRegistrySelection | undefined;

    const getRuntimeRegistrySelection = async (): Promise<RuntimeRegistrySelection> => {
      if (runtimeRegistrySelection) return runtimeRegistrySelection;

      if (explicitRuntimeRegistrySource) {
        const [customRegistry, defaultRegistry] = await Promise.all([
          loadRuntimeRegistry(explicitRuntimeRegistrySource),
          dependencies?.registry ?? loadRuntimeRegistry(configuredRuntimeRegistrySource),
        ]);

        runtimeRegistrySelection = {
          availableComponents: mergeOverlayComponents(
            customRegistry.components,
            defaultRegistry.components,
            options?.framework ?? runtimeConfig?.framework,
          ),
          customRegistry,
          customSource: explicitRuntimeRegistrySource,
          defaultRegistry,
          defaultSource: configuredRuntimeRegistrySource,
          mode: "overlay",
        };
        return runtimeRegistrySelection;
      }

      const registry = dependencies?.registry ?? (await loadRuntimeRegistry(runtimeRegistrySource));
      runtimeRegistrySelection = {
        availableComponents: registry.components,
        mode: "single",
        registry,
        source: runtimeRegistrySource,
      };
      return runtimeRegistrySelection;
    };

    let componentsToInstall: string[] = [];
    const registryComponents: string[] = [];
    let registryResults: ProRegistryInstallSummary | null = null;

    // ================================================================
    //                  Get components to install
    // ================================================================
    if (options?.all) {
      // Get all available components
      const availableComponents = (await getRuntimeRegistrySelection()).availableComponents;
      const installableComponents = filterUninstalledComponents(
        availableComponents,
        runtimeConfig,
        options?.framework,
      );
      if (installableComponents.length === 0) {
        p.log.warn("All available components are already installed.");
        p.cancel("No components selected");
        return process.exit(0);
      }
      componentsToInstall = installableComponents.map((c) => c.name);
      p.log.info(`Adding all ${componentsToInstall.length} uninstalled components...`);
    } else if (components && components.length > 0) {
      // Separate registry components from regular components
      const regularComponents: string[] = [];

      for (const component of components) {
        if (component.startsWith("@")) {
          registryComponents.push(component);
        } else {
          regularComponents.push(component);
        }
      }

      // Handle registry components (e.g., @starwind-pro/login1)
      if (registryComponents.length > 0) {
        let proInstallConfig = runtimeConfig;

        if (runtimeConfig) {
          const proRegistryImport = await importStarwindProRegistryFromComponentsJson(
            runtimeConfig as StarwindConfig,
            {
              warn: (message) => p.log.warn(message),
            },
          );

          if (proRegistryImport.pro) {
            proInstallConfig = {
              ...runtimeConfig,
              pro: proRegistryImport.pro,
            };
          }
        }

        if (!proInstallConfig) {
          p.log.error(
            "No Runtime Starwind configuration found. Run `starwind init` before adding Pro registry components.",
          );
          process.exit(1);
        }

        p.log.info(
          `Installing Pro registry components: ${sortComponentNames(registryComponents).join(", ")}`,
        );
        registryResults = await installProRegistryItems(registryComponents, {
          config: proInstallConfig as StarwindConfig,
          overwrite: options?.overwrite,
          packageManager,
        });
      }

      // Handle regular Starwind components
      if (regularComponents.length > 0) {
        // Get all available components once to avoid multiple registry calls
        const availableComponents = (await getRuntimeRegistrySelection()).availableComponents;

        // Filter valid components and collect invalid ones
        const { valid, invalid } = await regularComponents.reduce<
          Promise<{ valid: string[]; invalid: string[] }>
        >(
          async (accPromise, component) => {
            const acc = await accPromise;
            const isValid = await isValidComponent(component, availableComponents);
            if (isValid) {
              acc.valid.push(component);
            } else {
              acc.invalid.push(component);
            }
            return acc;
          },
          Promise.resolve({ valid: [], invalid: [] }),
        );

        // Warn about invalid components
        if (invalid.length > 0) {
          p.log.warn(
            `${highlighter.warn("Invalid components found:")}\n${sortComponentNames(invalid)
              .map((name) => `  ${name}`)
              .join("\n")}`,
          );
        }

        // Proceed with valid components
        if (valid.length > 0) {
          componentsToInstall = valid;
        } else if (registryComponents.length === 0) {
          p.log.warn(`${highlighter.warn("No valid components to install")}`);
          p.cancel("Operation cancelled");
          return process.exit(0);
        }
      }
    } else {
      // If no components provided, show the interactive prompt
      const availableComponents = (await getRuntimeRegistrySelection()).availableComponents;
      const installableComponents = filterUninstalledComponents(
        availableComponents,
        runtimeConfig,
        options?.framework,
      );

      if (installableComponents.length === 0) {
        p.log.warn("All available components are already installed.");
        p.cancel("No components selected");
        return process.exit(0);
      }

      const selected = await selectComponents(installableComponents);
      if (!selected || selected.length === 0) {
        p.cancel("No components selected");
        return process.exit(0);
      }
      componentsToInstall = selected;
    }

    if (componentsToInstall.length === 0 && registryComponents.length === 0) {
      p.log.warn(`${highlighter.warn("No components selected")}`);
      p.cancel("Operation cancelled");
      return process.exit(0);
    }

    const results = {
      installed: [] as AddResult[],
      skipped: [] as AddResult[],
      failed: [] as AddResult[],
    };

    // Track components installed during this session to avoid duplicates
    const installedThisSession = new Set<string>();

    /**
     * Adds a result to the appropriate results array, avoiding duplicates.
     * If a component was already installed this session, it won't be added again.
     * If a component shows as "skipped" but was installed this session, ignore it.
     */
    const addResult = (result: AddResult) => {
      const name = result.name;

      if (result.status === "installed") {
        if (!installedThisSession.has(name)) {
          installedThisSession.add(name);
          results.installed.push(result);
        }
      } else if (result.status === "skipped") {
        // Only add to skipped if it wasn't installed this session
        if (!installedThisSession.has(name)) {
          results.skipped.push(result);
        }
      } else if (result.status === "failed") {
        // Always report failures
        results.failed.push(result);
      }
    };

    // ================================================================
    //                      Install components
    // ================================================================
    if (!runtimeConfig) {
      p.log.error(
        "No Runtime Starwind configuration found. Run `starwind init` before adding components.",
      );
      process.exit(1);
    }

    if (componentsToInstall.length > 0) {
      const registrySelection = await getRuntimeRegistrySelection();
      const installOptions = {
        config: runtimeConfig,
        framework: options?.framework,
        skipPrompts: options?.yes,
        overwrite: options?.overwrite,
        packageManager,
        registry:
          registrySelection.mode === "overlay"
            ? registrySelection.customRegistry
            : registrySelection.registry,
        registryMode:
          registrySelection.mode === "overlay" ? ("custom" as const) : ("default" as const),
        registryOverlay:
          registrySelection.mode === "overlay"
            ? {
                fallbackRegistry: registrySelection.defaultRegistry,
                fallbackRegistrySource: registrySelection.defaultSource,
              }
            : undefined,
        registrySource:
          registrySelection.mode === "overlay"
            ? registrySelection.customSource
            : registrySelection.source,
      };
      const runtimeResults = dependencies
        ? await installRuntimeComponents(componentsToInstall, {
            ...installOptions,
            targetPolicy,
          })
        : await installRuntimeComponents(
            componentsToInstall,
            installOptions as InstallRuntimeComponentsOptions,
          );

      if (runtimeResults.setupOutcome) return;

      for (const result of [
        ...runtimeResults.installed,
        ...runtimeResults.skipped,
        ...runtimeResults.failed,
      ]) {
        addResult(result);
      }
    }

    // ================================================================
    //                     Installation summary
    // ================================================================
    p.log.message(`\n\n${highlighter.underline("Installation Summary")}`);

    if (results.failed.length > 0) {
      p.log.error(
        `${highlighter.error("Failed to install components:")}\n${sortComponentPresentation(
          results.failed,
        )
          .map((r) => `  ${r.name} - ${r.status === "failed" ? r.error : "Unknown error"}`)
          .join("\n")}`,
      );
    }

    if (results.skipped.length > 0) {
      p.log.warn(
        `${highlighter.warn("Skipped components:")}\n${sortComponentPresentation(results.skipped)
          .map((r) =>
            r.error
              ? `  ${r.name} - ${r.error}`
              : `  ${r.name}${r.version ? ` v${r.version}` : ""} (already installed)`,
          )
          .join("\n")}`,
      );
    }

    if (results.installed.length > 0) {
      p.log.success(
        `${highlighter.success("Successfully installed components:")}
${sortComponentPresentation(results.installed)
  .map((r) => `  ${r.name} v${r.version}`)
  .join("\n")}`,
      );
    }

    // Show registry component results in the final summary
    if (registryResults) {
      if (registryResults.failed.length > 0) {
        p.log.error(
          `${highlighter.error("Failed to install Pro registry components:")}
${sortComponentPresentation(registryResults.failed)
  .map((result) => `  ${result.name} - ${result.error ?? "Unknown error"}`)
  .join("\n")}`,
        );

        if (hasProAuthorizationFailure(registryResults)) {
          p.note(getProAuthorizationNote(), "Starwind Pro authorization");
        }
      }

      if (registryResults.skipped.length > 0) {
        p.log.warn(
          `${highlighter.warn("Skipped Pro registry components:")}
${sortComponentPresentation(registryResults.skipped)
  .map((result) => `  ${result.name}`)
  .join("\n")}`,
        );
      }

      if (registryResults.installed.length > 0) {
        p.log.success(
          `${highlighter.success("Successfully installed Pro registry components:")}
${sortComponentPresentation(registryResults.installed)
  .map((result) => `  ${result.name}`)
  .join("\n")}`,
        );
      }
    }

    await sleep(1000);

    p.outro("Enjoy using Starwind UI 🚀");
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to add components");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

function filterUninstalledComponents(
  availableComponents: ComponentFor<PrivateVueCliFrameworkTarget>[],
  config: StarwindConfigFor<PrivateVueCliFrameworkTarget> | undefined,
  framework?: PrivateVueCliFrameworkTarget,
): ComponentFor<PrivateVueCliFrameworkTarget>[] {
  const targetFramework = framework ?? config?.framework;
  const installedNames = new Set(
    (config?.components ?? [])
      .filter((component) => component.source !== "legacy")
      .filter((component) => (component.framework ?? config?.framework) === targetFramework)
      .map((component) => component.name),
  );
  return availableComponents
    .filter(
      (component) => !targetFramework || !component.targets || component.targets[targetFramework],
    )
    .filter((component) => !installedNames.has(component.name));
}

function mergeOverlayComponents(
  customComponents: ComponentFor<PrivateVueCliFrameworkTarget>[],
  defaultComponents: ComponentFor<PrivateVueCliFrameworkTarget>[],
  framework?: PrivateVueCliFrameworkTarget,
): ComponentFor<PrivateVueCliFrameworkTarget>[] {
  const mergedComponents: ComponentFor<PrivateVueCliFrameworkTarget>[] = [];
  const seenNames = new Set<string>();

  const componentNames = new Set([
    ...customComponents.map((component) => component.name),
    ...defaultComponents.map((component) => component.name),
  ]);

  for (const name of componentNames) {
    const customComponent = customComponents.find((component) => component.name === name);
    const defaultComponent = defaultComponents.find((component) => component.name === name);
    const selectedComponent =
      framework && customComponent && !customComponent.targets?.[framework]
        ? (defaultComponent ?? customComponent)
        : (customComponent ?? defaultComponent);

    if (!selectedComponent || seenNames.has(selectedComponent.name)) continue;

    seenNames.add(selectedComponent.name);
    mergedComponents.push(selectedComponent);
  }

  return mergedComponents;
}

function hasProAuthorizationFailure(registryResults: ProRegistryInstallSummary): boolean {
  return registryResults.failed.some((result) => result.authFailure);
}

function getProAuthorizationNote(): string {
  return `Obtain a Starwind Pro license at ${highlighter.info("https://pro.starwind.dev")}\n\nThen add your license key to ${highlighter.infoBright(".env.local")} as ${highlighter.infoBright("STARWIND_LICENSE_KEY")}`;
}
