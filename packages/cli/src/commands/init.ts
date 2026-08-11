import path from "node:path";

import * as p from "@clack/prompts";
import semver from "semver";

import { tailwindConfig } from "@/templates/starwind.css.js";
import { setupAstroConfig } from "@/utils/astro-config.js";
import { ensureAstroReactIntegration } from "@/utils/astro-react-integration.js";
import {
  CONFIG_SCHEMA_V2_URL,
  getConfigState,
  hasStarwindProAuthConfig,
  setupStarwindProConfig,
  type StarwindFramework,
  updateConfig,
} from "@/utils/config.js";
import { ASTRO_PACKAGES, MIN_ASTRO_VERSION, PATHS } from "@/utils/constants.js";
import { filterUninstalledDependencies } from "@/utils/dependency-resolver.js";
import { checkStarwindProEnv, setupStarwindProEnv } from "@/utils/env.js";
import {
  type FrameworkTargetPolicy,
  isConfigTarget,
  type PrivateVueCliFrameworkTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "@/utils/framework-target-policy.js";
import { ensureDirectory, fileExists, readJsonFile, writeCssFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import {
  detectHostPlan,
  detectPrivateVueHostPlan,
  formatDetectedHost,
  formatPrivateDetectedHost,
  validateHostTarget,
  validatePrivateHostTarget,
  type HostPlan,
} from "@/utils/host-planner.js";
import { setupLayoutCssImport } from "@/utils/layout.js";
import {
  detectPackageManager,
  installDependencies,
  type PackageManager,
} from "@/utils/package-manager.js";
import { loadRegistry, type StarwindRegistryFor } from "@/utils/registry.js";
import {
  getReactPackageRequirements,
  setupReactProject,
  type ReactProjectPlan,
  validateReactProjectSetup,
} from "@/utils/react-project.js";
import { getRuntimeSetupPlan } from "@/utils/runtime-setup.js";
import { sleep } from "@/utils/sleep.js";
import { setupSnippets } from "@/utils/snippets.js";
import { setupTsConfig } from "@/utils/tsconfig.js";
import type { VueHostProjectPreparation } from "@/utils/vue-host-project.js";

import { migrate } from "./migrate.js";

type InitOptions = {
  astro?: boolean;
  defaults?: boolean;
  framework?: StarwindFramework;
  packageManager?: PackageManager;
  pro?: boolean;
  react?: boolean;
};

export type PrivateVueInitOptions = Omit<InitOptions, "framework"> & {
  framework?: PrivateVueCliFrameworkTarget;
};

export type PrivateVueInitDependencies = {
  hostPlan?: HostPlan<PrivateVueCliFrameworkTarget>;
  registry: StarwindRegistryFor<PrivateVueCliFrameworkTarget>;
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>;
};

function resolveFrameworkOption<TFramework extends PrivateVueCliFrameworkTarget>(
  options: PrivateVueInitOptions | undefined,
  targetPolicy: FrameworkTargetPolicy<TFramework>,
): TFramework | undefined {
  const selected = [
    options?.framework,
    options?.astro ? "astro" : undefined,
    options?.react ? "react" : undefined,
  ].filter(Boolean);

  if (new Set(selected).size > 1) {
    throw new Error("Choose only one Starwind framework target.");
  }

  const framework = selected[0];
  if (framework !== undefined && !isConfigTarget(targetPolicy, framework)) {
    throw new Error(
      `Framework "${framework}" is not available under the ${targetPolicy.cacheKey} target policy.`,
    );
  }
  return framework;
}

async function selectHostTarget(
  plan: HostPlan<PrivateVueCliFrameworkTarget>,
  explicitFramework: PrivateVueCliFrameworkTarget | undefined,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
  privateVue: boolean,
): Promise<PrivateVueCliFrameworkTarget> {
  if (explicitFramework) {
    const framework = privateVue
      ? validatePrivateHostTarget(plan, explicitFramework, targetPolicy)
      : (validateHostTarget(
          plan as HostPlan<StarwindFramework>,
          explicitFramework as StarwindFramework,
        ) as PrivateVueCliFrameworkTarget);
    p.log.info(
      privateVue
        ? formatPrivateDetectedHost(plan, framework, targetPolicy)
        : formatDetectedHost(plan as HostPlan<StarwindFramework>, framework as StarwindFramework),
    );
    return framework;
  }

  const readyTargets = plan.targets.filter((target) => target.readiness === "ready");
  if (readyTargets.length === 0) {
    throw new Error(
      plan.diagnostic ??
        "No supported Starwind target was detected. Pass --astro or run Starwind in a supported React host.",
    );
  }

  if (readyTargets.length === 1) {
    const framework = readyTargets[0]!.framework;
    p.log.info(
      privateVue
        ? formatPrivateDetectedHost(plan, framework, targetPolicy)
        : formatDetectedHost(plan as HostPlan<StarwindFramework>, framework as StarwindFramework),
    );
    return framework;
  }

  const framework = (await p.select({
    message: "Which detected framework target would you like to use?",
    initialValue: readyTargets[0]!.framework,
    options: readyTargets.map((target) => ({
      label: targetPolicy.labels[target.framework],
      value: target.framework,
    })),
  })) as PrivateVueCliFrameworkTarget | symbol;

  if (p.isCancel(framework)) {
    p.cancel("Operation cancelled.");
    return process.exit(0);
  }

  p.log.info(
    privateVue
      ? formatPrivateDetectedHost(plan, framework, targetPolicy)
      : formatDetectedHost(plan as HostPlan<StarwindFramework>, framework as StarwindFramework),
  );
  return framework;
}

function getProNextStepsMessage(): string {
  return `Starwind Pro is now configured! You can install pro components using \n${highlighter.info("starwind add @starwind-pro/component-name")}\n\nAdd your license key to ${highlighter.infoBright(".env.local")} as ${highlighter.infoBright("STARWIND_LICENSE_KEY")}`;
}

async function setupProForExistingRuntime(options: { withinAdd: boolean }): Promise<void> {
  const configState = await getConfigState();
  const alreadyHasProAuth =
    configState.status === "current" && hasStarwindProAuthConfig(configState.config);
  const alreadyHasEnv = await checkStarwindProEnv();
  const configTasks = [];

  if (!alreadyHasProAuth) {
    configTasks.push({
      title: "Configuring Starwind Pro authorization",
      task: async () => {
        await setupStarwindProConfig();
        await sleep(250);
        return "Configured Starwind Pro authorization in starwind.config.json";
      },
    });
  }

  if (!alreadyHasEnv) {
    configTasks.push({
      title: "Setting up Starwind Pro environment",
      task: async () => {
        const success = await setupStarwindProEnv();
        if (!success) {
          throw new Error("Failed to setup Starwind Pro environment");
        }
        await sleep(250);
        return "Created .env.local and updated .gitignore";
      },
    });
  }

  if (configTasks.length > 0) {
    if (!options.withinAdd) {
      p.log.info(highlighter.info("Setting up Starwind Pro configuration..."));
    }

    await p.tasks(configTasks);
  } else if (!options.withinAdd) {
    p.log.info(highlighter.info("Starwind Pro paid authorization is already configured"));
  }

  p.note(getProNextStepsMessage(), "Next steps");

  if (!options.withinAdd) {
    await sleep(1000);
    p.outro("Enjoy using Starwind UI with Pro components! 🚀");
  }
}

export function init(withinAdd?: boolean, options?: InitOptions): Promise<void>;
export function init(
  withinAdd: boolean,
  options: PrivateVueInitOptions,
  dependencies: PrivateVueInitDependencies,
): Promise<void>;
export async function init(
  withinAdd: boolean = false,
  options?: PrivateVueInitOptions,
  dependencies?: PrivateVueInitDependencies,
): Promise<void> {
  if (!withinAdd) {
    p.intro(highlighter.title(" Welcome to the Starwind CLI "));
  }

  try {
    // Validate project structure
    if (!(await fileExists("package.json"))) {
      throw new Error(
        "No package.json found. Please run this command in the root of your project.",
      );
    }

    const pkg = await readJsonFile("package.json");
    const pm: PackageManager = options?.packageManager ?? detectPackageManager().name;
    const targetPolicy =
      dependencies?.targetPolicy ??
      (PUBLIC_FRAMEWORK_TARGET_POLICY as FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>);
    const selectedFramework = resolveFrameworkOption(options, targetPolicy);
    const configState = dependencies ? await getConfigState(targetPolicy) : await getConfigState();

    if (configState.status === "legacy") {
      const shouldMigrate = options?.defaults
        ? false
        : await p.confirm({
            message:
              "This project already has a legacy Starwind config. Would you like to run `starwind migrate` now?",
            initialValue: true,
          });

      if (p.isCancel(shouldMigrate)) {
        p.cancel("Operation cancelled");
        return process.exit(0);
      }

      if (!shouldMigrate) {
        p.log.warn(
          "This project already has a legacy Starwind config. Run `starwind migrate` before adopting the Runtime setup.",
        );
        return;
      }

      await migrate({ packageManager: options?.packageManager, withinInit: true });

      if (options?.pro) {
        await setupProForExistingRuntime({
          withinAdd,
        });
      } else if (!withinAdd) {
        p.outro("Starwind migration complete");
      }

      return;
    }

    if (configState.status === "current") {
      p.log.info("Starwind Runtime is already configured for this project.");

      if (options?.pro) {
        await setupProForExistingRuntime({
          withinAdd,
        });
      }

      return;
    }

    const hostPlan =
      dependencies?.hostPlan ??
      (dependencies
        ? await detectPrivateVueHostPlan(pkg, dependencies.targetPolicy)
        : await detectHostPlan(pkg));
    const defaultFramework = await selectHostTarget(
      hostPlan as HostPlan<PrivateVueCliFrameworkTarget>,
      selectedFramework,
      targetPolicy,
      dependencies !== undefined,
    );
    const isAstroReactTarget = hostPlan.host.kind === "astro" && defaultFramework === "react";
    const vueHostProject = defaultFramework === "vue" ? hostPlan.vueHostProject : undefined;
    if (defaultFramework === "vue" && !vueHostProject) {
      throw new Error(
        "The Vue target requires a supported host before initialization can continue.",
      );
    }
    const isAstroSecondaryTarget = isAstroReactTarget || vueHostProject?.isSecondaryTarget === true;
    const projectFramework: PrivateVueCliFrameworkTarget =
      vueHostProject?.projectFramework ?? (isAstroReactTarget ? "astro" : defaultFramework);
    const reactProjectPlan: ReactProjectPlan | undefined = hostPlan.reactProject;
    if (isAstroReactTarget) {
      const setupOutcome = await ensureAstroReactIntegration({
        packageManager: pm,
        skipPrompts: options?.defaults,
      });
      if (setupOutcome.status === "cancelled" || setupOutcome.status === "declined") return;
    } else if (defaultFramework === "react") {
      if (!reactProjectPlan) {
        throw new Error(
          "The React target requires host configuration before initialization can continue.",
        );
      }
      await validateReactProjectSetup(reactProjectPlan);
    }
    await vueHostProject?.validate();
    const bundledRegistry =
      dependencies?.registry ?? (await loadRegistry({ type: "bundled" }, { targetPolicy }));
    const runtimeSetupPlan = dependencies
      ? getRuntimeSetupPlan(defaultFramework, bundledRegistry, targetPolicy)
      : getRuntimeSetupPlan(defaultFramework as StarwindFramework, bundledRegistry);
    let vueHostPreparation: VueHostProjectPreparation | undefined;
    if (vueHostProject) {
      vueHostPreparation = await vueHostProject.prepare({
        packageManager: pm,
        projectPackage: pkg,
        skipPrompts: options?.defaults,
      });
      if (vueHostPreparation.status === "cancelled" || vueHostPreparation.status === "declined") {
        return;
      }
    }

    // Check Astro version compatibility
    const installTasks = [];
    const configTasks = [];
    if (vueHostPreparation?.status === "prepared" && vueHostPreparation.applyIntegration) {
      configTasks.push({
        title: vueHostPreparation.integrationLabel,
        task: async () => {
          await vueHostPreparation.applyIntegration();
          await sleep(250);
          return vueHostPreparation.integrationResult;
        },
      });
    }

    // ================================================================
    //         Prepare project structure and configuration tasks
    // ================================================================
    let configChoices;
    const defaultComponentDir =
      reactProjectPlan?.componentDir ??
      vueHostProject?.componentDir ??
      (isAstroSecondaryTarget
        ? "src/components/starwind-" + defaultFramework
        : PATHS.LOCAL_STARWIND_COMPONENTS_DIR);
    const defaultCssFile =
      reactProjectPlan?.cssFile ?? vueHostProject?.cssFile ?? PATHS.LOCAL_CSS_FILE;

    // Use defaults if specified, otherwise prompt user for choices
    if (options?.defaults) {
      configChoices = {
        framework: defaultFramework!,
        componentDir: defaultComponentDir,
        cssFile: defaultCssFile,
        twBaseColor: "neutral",
      };

      if (!withinAdd) {
        p.log.info("Using default configuration values");
      }
    } else {
      configChoices = await p.group(
        {
          framework: async () => defaultFramework,
          // ask where to install components
          componentDir: () =>
            p.text({
              message: "What is your components directory?",
              placeholder: defaultComponentDir,
              initialValue: defaultComponentDir,
              validate(value) {
                // Check for empty value
                if (value.length === 0) return `Value is required!`;

                // Check for absolute paths
                if (path.isAbsolute(value)) return `Please use a relative path`;

                // Check for path traversal attempts
                if (value.includes("..")) return `Path traversal is not allowed`;

                // Check for invalid characters in path
                const invalidChars = /[<>:"|?*]/;
                if (invalidChars.test(value)) return `Path contains invalid characters`;

                // Check if path starts with system directories
                const systemDirs = ["windows", "program files", "system32"];
                if (systemDirs.some((dir) => value.toLowerCase().startsWith(dir))) {
                  return `Cannot install in system directories`;
                }
              },
            }),
          // ask where to add the css file
          cssFile: () =>
            p.text({
              message: `Where would you like to add the Tailwind ${highlighter.info(".css")} file?`,
              placeholder: defaultCssFile,
              initialValue: defaultCssFile,
              validate(value) {
                // Check for empty value
                if (value.length === 0) return `Value is required!`;

                // Must end with .css
                if (!value.endsWith(".css")) return `File must end with .css extension`;

                // Check for absolute paths
                if (path.isAbsolute(value)) return `Please use a relative path`;

                // Check for path traversal attempts
                if (value.includes("..")) return `Path traversal is not allowed`;

                // Check for invalid characters in path
                const invalidChars = /[<>:"|?*]/;
                if (invalidChars.test(value)) return `Path contains invalid characters`;

                // Check if path starts with system directories
                const systemDirs = ["windows", "program files", "system32"];
                if (systemDirs.some((dir) => value.toLowerCase().startsWith(dir))) {
                  return `Cannot use system directories`;
                }

                // Ensure the path has a valid filename
                const basename = path.basename(value, ".css");
                if (!basename || basename.trim().length === 0) {
                  return `Invalid filename`;
                }
              },
            }),

          twBaseColor: () =>
            p.select({
              message: "What Tailwind base color would you like to use?",
              initialValue: "neutral",
              options: [
                { label: "Neutral (default)", value: "neutral" },
                { label: "Stone", value: "stone" },
                { label: "Zinc", value: "zinc" },
                { label: "Gray", value: "gray" },
                { label: "Slate", value: "slate" },
              ],
            }),
        },
        {
          // On Cancel callback that wraps the group
          // So if the user cancels one of the prompts in the group this function will be called
          onCancel: () => {
            p.cancel("Operation cancelled.");
            process.exit(0);
          },
        },
      );
    }

    if (vueHostProject?.lockCssFile && configChoices.cssFile !== vueHostProject.cssFile) {
      throw new Error(
        "The detected " +
          vueHostProject.hostLabel +
          " host requires the plan-owned stylesheet path " +
          vueHostProject.cssFile +
          ".",
      );
    }

    const utilsDir =
      reactProjectPlan?.utilsDir ?? vueHostProject?.utilsDir ?? PATHS.LOCAL_UTILS_DIR;

    // ================================================================
    //            Make sure appropriate directories exist
    // ================================================================
    const cssFileDir = path.dirname(configChoices.cssFile);
    const componentInstallDir = configChoices.componentDir;
    configTasks.push({
      title: "Creating project structure",
      task: async () => {
        await ensureDirectory(componentInstallDir);
        await ensureDirectory(cssFileDir);
        await sleep(250);
        return "Created project structure";
      },
    });

    // ================================================================
    //                     Prepare VS Code snippets
    // ================================================================
    configTasks.push({
      title: "Setting up VS Code snippets",
      task: async () => {
        await setupSnippets();
        await sleep(250);
        return "VS Code snippets configured";
      },
    });

    if (vueHostProject) {
      configTasks.push({
        title: vueHostProject.setupLabel,
        task: async () => {
          await vueHostProject.setup(configChoices.cssFile);
          await sleep(250);
          return vueHostProject.setupResult;
        },
      });
    } else if (projectFramework === "astro") {
      // ================================================================
      //                Prepare Astro config file setup
      // ================================================================
      configTasks.push({
        title: "Setup Astro config file",
        task: async () => {
          const success = await setupAstroConfig();
          if (!success) {
            throw new Error("Failed to setup Astro config");
          }
          await sleep(250);
          return "Astro config setup completed";
        },
      });
    } else if (projectFramework === "react") {
      configTasks.push({
        title: `Setup ${reactProjectPlan!.kind} React project`,
        task: async () => {
          await setupReactProject(reactProjectPlan!, configChoices.cssFile);
          await sleep(250);
          return "React project setup completed";
        },
      });
    }

    // ================================================================
    //                Prepare TypeScript config file setup
    // ================================================================
    configTasks.push({
      title: "Setup TypeScript path aliases",
      task: async () => {
        const success = vueHostProject
          ? await vueHostProject.setupTypeScript()
          : projectFramework === "react"
            ? await setupTsConfig(
                "react",
                reactProjectPlan!.sourceRoot,
                reactProjectPlan!.kind === "vite" &&
                  /\.(?:js|jsx)$/.test(reactProjectPlan!.cssEntry),
              )
            : await setupTsConfig("astro");
        if (!success) {
          throw new Error("Failed to setup tsconfig.json");
        }
        await sleep(250);
        return "TypeScript path aliases configured";
      },
    });

    // ================================================================
    //                      Prepare CSS file
    // ================================================================
    // Check if CSS file already exists
    const cssFileExists = await fileExists(configChoices.cssFile);
    let updatedTailwindConfig = tailwindConfig;

    if (configChoices.twBaseColor !== "neutral") {
      // replace all "--color-neutral" with "--color-twBaseColor"
      updatedTailwindConfig = updatedTailwindConfig.replace(
        /--color-neutral-/g,
        `--color-${configChoices.twBaseColor}-`,
      );
    }
    updatedTailwindConfig =
      vueHostProject?.prepareStylesheet(updatedTailwindConfig) ?? updatedTailwindConfig;

    if (cssFileExists) {
      const shouldOverride = options?.defaults
        ? true
        : await p.confirm({
            message: `${highlighter.info(configChoices.cssFile)} already exists. Do you want to override it?`,
          });

      if (p.isCancel(shouldOverride)) {
        p.cancel("Operation cancelled");
        return process.exit(0);
      }

      if (!shouldOverride) {
        p.log.info("Skipping Tailwind CSS configuration");
      } else {
        configTasks.push({
          title: "Creating Tailwind CSS configuration",
          task: async () => {
            await writeCssFile(configChoices.cssFile, updatedTailwindConfig);
            await sleep(250);
            return "Created Tailwind configuration";
          },
        });
      }
    } else {
      configTasks.push({
        title: "Creating Tailwind CSS configuration",
        task: async () => {
          await writeCssFile(configChoices.cssFile, updatedTailwindConfig);
          await sleep(250);
          return "Created Tailwind configuration";
        },
      });
    }

    if (vueHostProject?.setupCss) {
      configTasks.push({
        title: vueHostProject.setupCssLabel,
        task: async () => {
          const success = await vueHostProject.setupCss(configChoices.cssFile);
          if (!success) {
            throw new Error("Failed to configure the host CSS entry");
          }
          await sleep(250);
          return vueHostProject.setupCssResult;
        },
      });
    } else if (!vueHostProject && projectFramework === "astro") {
      // ================================================================
      //                 Add CSS import to layout file
      // ================================================================
      configTasks.push({
        title: "Adding CSS import to layout",
        task: async () => {
          const success = await setupLayoutCssImport(configChoices.cssFile);
          if (!success) {
            throw new Error("Failed to add CSS import to layout");
          }
          await sleep(250);
          return "CSS import added to layout";
        },
      });
    }

    // ================================================================
    //             Prepare project starwind configuration
    // ================================================================
    configTasks.push({
      title: "Updating project configuration",
      task: async () => {
        await updateConfig(
          {
            $schema: CONFIG_SCHEMA_V2_URL,
            version: 2,
            framework: projectFramework,
            registry: {
              source: "bundled",
              version: bundledRegistry.version,
            },
            tailwind: {
              css: configChoices.cssFile,
              baseColor: configChoices.twBaseColor as
                | "slate"
                | "gray"
                | "zinc"
                | "neutral"
                | "stone",
              cssVariables: true,
            },
            // aliases: {
            // 	components: "@/components",
            // },
            componentDir: isAstroSecondaryTarget
              ? PATHS.LOCAL_STARWIND_COMPONENTS_DIR
              : configChoices.componentDir,
            ...(isAstroSecondaryTarget
              ? { componentDirs: { [defaultFramework]: configChoices.componentDir } }
              : {}),
            utilsDir,
            components: [],
          },
          dependencies ? { appendComponents: false, targetPolicy } : { appendComponents: false },
        );
        await sleep(250);
        return "Updated project starwind configuration";
      },
    });

    // ================================================================
    //             Prepare Starwind Pro configuration (if enabled)
    // ================================================================
    if (options?.pro) {
      if (!withinAdd) {
        p.log.info(highlighter.info("Setting up Starwind Pro paid authorization..."));
      }

      configTasks.push({
        title: "Configuring Starwind Pro authorization",
        task: async () => {
          await setupStarwindProConfig();
          await sleep(250);
          return "Configured Starwind Pro authorization in starwind.config.json";
        },
      });

      if (!(await checkStarwindProEnv())) {
        configTasks.push({
          title: "Setting up Starwind Pro environment",
          task: async () => {
            const success = await setupStarwindProEnv();
            if (!success) {
              throw new Error("Failed to setup Starwind Pro environment");
            }
            await sleep(250);
            return "Created .env.local and updated .gitignore";
          },
        });
      }
    }

    // ================================================================
    //                Prepare astro installation
    // ================================================================
    // Determine package manager: use provided option or auto-detect
    installTasks.push({
      title: "Installing Starwind Runtime packages",
      task: async () => {
        const missingPackages = await filterUninstalledDependencies([
          runtimeSetupPlan.adapterPackage,
        ]);
        if (missingPackages.length > 0) await installDependencies(missingPackages, pm);
        return "Starwind Runtime packages are ready";
      },
    });

    if (projectFramework === "astro") {
      if (pkg.dependencies?.astro) {
        const astroVersion = pkg.dependencies.astro.replace(/^\^|~/, "");
        if (!semver.gte(astroVersion, MIN_ASTRO_VERSION)) {
          const shouldUpgrade = options?.defaults
            ? true
            : await p.confirm({
                message: `Starwind requires Astro v${MIN_ASTRO_VERSION} or higher. Would you like to upgrade from v${astroVersion}?`,
                initialValue: true,
              });

          if (p.isCancel(shouldUpgrade)) {
            p.cancel("Operation cancelled");
            return process.exit(0);
          }

          if (!shouldUpgrade) {
            p.cancel("Astro v5 or higher is required to use Starwind");
            return process.exit(1);
          }

          installTasks.push({
            title: "Upgrading Astro",
            task: async () => {
              await installDependencies([ASTRO_PACKAGES.core], pm);
              return "Upgraded Astro successfully";
            },
          });
        }
      } else {
        const shouldInstall = options?.defaults
          ? true
          : await p.confirm({
              message: `Starwind requires Astro v${MIN_ASTRO_VERSION} or higher. Would you like to install it?`,
              initialValue: true,
            });

        if (p.isCancel(shouldInstall)) {
          p.cancel("Operation cancelled");
          return process.exit(0);
        }

        if (!shouldInstall) {
          p.cancel("Astro is required to use Starwind");
          return process.exit(1);
        }

        installTasks.push({
          title: `Installing ${ASTRO_PACKAGES.core}`,
          task: async () => {
            await installDependencies([ASTRO_PACKAGES.core], pm);
            return `Installed ${highlighter.info(ASTRO_PACKAGES.core)} successfully`;
          },
        });
      }
    }

    // ================================================================
    //         Prepare tailwind and other package installation
    // ================================================================
    const otherPackages = reactProjectPlan
      ? getReactPackageRequirements(runtimeSetupPlan.packageRequirements, reactProjectPlan.kind)
      : vueHostProject
        ? vueHostProject.requirements(runtimeSetupPlan.packageRequirements)
        : runtimeSetupPlan.packageRequirements;
    const vueUpgradeRequired = vueHostProject?.vueUpgradeRequired ?? false;

    if (otherPackages.length > 0) {
      const shouldInstall = options?.defaults
        ? true
        : await p.confirm({
            message: `Install ${highlighter.info(otherPackages.join(", "))} using ${highlighter.info(pm)}?`,
          });

      if (p.isCancel(shouldInstall)) {
        p.cancel("Operation cancelled");
        return process.exit(0);
      }

      if (shouldInstall) {
        installTasks.push({
          title: `Installing packages`,
          task: async () => {
            await installDependencies(otherPackages, pm, false, false);
            return `${highlighter.info("Packages installed successfully")}`;
          },
        });
      } else if (vueUpgradeRequired) {
        p.cancel("Vue 3.5 or later is required before Starwind can configure this project.");
        return process.exit(1);
      } else {
        p.log.warn(
          highlighter.warn(`Skipped installation of packages. Make sure to install them manually`),
        );
      }
    }

    // ================================================================
    //                      Execute all tasks
    // ================================================================
    if (installTasks.length > 0) {
      await p.tasks(installTasks);
    }

    if (configTasks.length > 0) {
      await p.tasks(configTasks);
    }

    await sleep(250);

    let nextStepsMessage = `Add components with ${highlighter.info("starwind add")}. The configured stylesheet is ${highlighter.infoBright(configChoices.cssFile)}.`;

    if (options?.pro) {
      nextStepsMessage += `\n\n${getProNextStepsMessage()}`;
    }

    p.note(nextStepsMessage, "Next steps");

    if (!withinAdd) {
      await sleep(1000);
      const outroMessage = options?.pro
        ? "Enjoy using Starwind UI with Pro components! 🚀"
        : "Enjoy using Starwind UI 🚀";
      p.outro(outroMessage);
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to add components");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}
