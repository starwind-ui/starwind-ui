import * as p from "@clack/prompts";

import {
  getConfigState,
  hasLegacyStarwindUiV2ConfigShape,
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
import { detectPackageManager, type PackageManager } from "@/utils/package-manager.js";
import {
  installProRegistryItems,
  isStarwindProRegistryItem,
  type ProRegistryInstallSummary,
} from "@/utils/pro-registry.js";
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
import {
  importStarwindProRegistryFromComponentsJson,
  readStarwindProRegistryFromComponentsJson,
  resolveStarwindProRegistryImport,
} from "@/utils/shadcn-config.js";
import { sleep } from "@/utils/sleep.js";

import { init } from "./init.js";
import { migrate } from "./migrate.js";

interface AddOptions {
  all?: boolean;
  yes?: boolean;
  overwrite?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn";
  registry?: string;
  framework?: StarwindFramework;
  starwindUiVersion?: "2" | "3";
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
    const selectedStarwindUiMajor = options?.starwindUiVersion === "2" ? 2 : 3;
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
      if (selectedStarwindUiMajor === 2) {
        throw new Error(
          "Selected Starwind UI major 2, but detected no starwind.config.json. This escape hatch requires an existing legacy pre-Runtime V2 project. Restore or initialize that V2 project with starwind@2, then retry the Pro block command.",
        );
      }

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

    if (selectedStarwindUiMajor === 2) {
      assertV2ProAddRequest(configState, components, options, packageManager);
    }

    if (configState?.status === "legacy" && selectedStarwindUiMajor === 3) {
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
        let proInstallConfig = selectedStarwindUiMajor === 2 ? configState.config : runtimeConfig;

        if (selectedStarwindUiMajor === 2) {
          if (!proInstallConfig) {
            throw new Error(
              "Selected Starwind UI major 2, but no legacy pre-Runtime V2 config is available.",
            );
          }

          const proRegistryImport = resolveStarwindProRegistryImport(
            proInstallConfig as StarwindConfig,
            await readStarwindProRegistryFromComponentsJson(),
            (message) => p.log.warn(message),
          );

          if (proRegistryImport.pro) {
            proInstallConfig = {
              ...proInstallConfig,
              pro: proRegistryImport.pro,
            };
          }
        } else if (runtimeConfig) {
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
          starwindUiMajor: selectedStarwindUiMajor,
        });
      }

      // Handle regular Starwind components
      if (regularComponents.length > 0) {
        // Get all available components once to avoid multiple registry calls
        const availableComponents = (await getRuntimeRegistrySelection()).availableComponents;

        const availableNames = new Set(availableComponents.map(({ name }) => name));
        const valid: string[] = [];
        const invalid: string[] = [];
        for (const component of regularComponents) {
          if (availableNames.has(component)) valid.push(component);
          else invalid.push(component);
        }

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
    if (componentsToInstall.length > 0) {
      if (!runtimeConfig) {
        p.log.error(
          "No Runtime Starwind configuration found. Run `starwind init` before adding components.",
        );
        process.exit(1);
      }

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

function assertV2ProAddRequest(
  configState: Exclude<Awaited<ReturnType<typeof getConfigState>>, { status: "missing" }>,
  components: string[] | undefined,
  options: PrivateVueAddOptions | undefined,
  packageManager: PackageManager,
): void {
  const detectedShape = describeProjectShape(configState);
  const requestedComponents = components ?? [];
  const normalV3Command = formatStarwindCommand(
    packageManager,
    "latest",
    requestedComponents.length > 0 ? requestedComponents : ["@starwind-pro/<block>"],
  );

  if (!hasLegacyStarwindUiV2ConfigShape(configState)) {
    throw new Error(
      `Selected Starwind UI major 2, but detected ${detectedShape}. V2 blocks cannot be installed into a Runtime V3 project. Run the normal V3 command without the flag: ${normalV3Command}`,
    );
  }

  if (options?.registry) {
    throw new Error(
      `Selected Starwind UI major 2 for a ${detectedShape}, but received the custom registry URL "${options.registry}". The immutable V2 archive is available only through the official Starwind Pro route. Remove --registry and retry.`,
    );
  }

  const proComponents = requestedComponents.filter(isStarwindProRegistryItem);
  const baseComponents = requestedComponents.filter(
    (component) => !isStarwindProRegistryItem(component),
  );

  if (proComponents.length > 0 && baseComponents.length > 0) {
    const proCommand = `${formatStarwindCommand(packageManager, "latest", proComponents)} --starwind-ui-version 2`;
    const baseCommand = formatStarwindCommand(packageManager, "2", baseComponents);
    throw new Error(
      `Selected Starwind UI major 2 for a ${detectedShape}. Mixed Pro and base-component names cannot be installed together with this flag. Run separate Pro and base-component commands:\n${proCommand}\n${baseCommand}`,
    );
  }

  if (baseComponents.length > 0 || proComponents.length === 0) {
    const componentNames = baseComponents.length > 0 ? baseComponents : ["<component>"];
    throw new Error(
      `Selected Starwind UI major 2 for a ${detectedShape}. --starwind-ui-version 2 applies only to @starwind-pro/* blocks. Install a V2 base component with: ${formatStarwindCommand(packageManager, "2", componentNames)}`,
    );
  }
}

function describeProjectShape(
  configState: Exclude<Awaited<ReturnType<typeof getConfigState>>, { status: "missing" }>,
): string {
  if (configState.status === "current") {
    return "Runtime V3 project using config-schema.v2.json, top-level version: 2, framework, and Runtime registry metadata";
  }

  if (hasLegacyStarwindUiV2ConfigShape(configState)) {
    return "legacy pre-Runtime V2 project using config-schema.json without a numeric version field";
  }

  return `unsupported Starwind project config using schema "${configState.config.$schema}"`;
}

function formatStarwindCommand(
  packageManager: PackageManager,
  version: "2" | "latest",
  components: string[],
): string {
  const runner =
    packageManager === "pnpm"
      ? "pnpm dlx"
      : packageManager === "yarn"
        ? "yarn dlx"
        : packageManager === "bun"
          ? "bunx"
          : "npx";
  return `${runner} starwind@${version} add ${components.join(" ")}`;
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
