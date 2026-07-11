import path from "node:path";

import * as p from "@clack/prompts";
import semver from "semver";

import { tailwindConfig } from "@/templates/starwind.css.js";
import { setupAstroConfig } from "@/utils/astro-config.js";
import {
  CONFIG_SCHEMA_V2_URL,
  getConfigState,
  hasStarwindProAuthConfig,
  setupStarwindProConfig,
  type StarwindFramework,
  updateConfig,
} from "@/utils/config.js";
import { ASTRO_PACKAGES, getOtherPackages, MIN_ASTRO_VERSION, PATHS } from "@/utils/constants.js";
import { checkStarwindProEnv, setupStarwindProEnv } from "@/utils/env.js";
import { ensureDirectory, fileExists, readJsonFile, writeCssFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { setupLayoutCssImport } from "@/utils/layout.js";
import {
  detectPackageManager,
  installDependencies,
  type PackageManager,
} from "@/utils/package-manager.js";
import { loadRegistry, type StarwindRegistry } from "@/utils/registry.js";
import { sleep } from "@/utils/sleep.js";
import { setupSnippets } from "@/utils/snippets.js";
import { setupTsConfig } from "@/utils/tsconfig.js";
import { setupReactCssImport, setupReactViteConfig } from "@/utils/vite-config.js";

import { migrate } from "./migrate.js";

type InitOptions = {
  astro?: boolean;
  defaults?: boolean;
  framework?: StarwindFramework;
  packageManager?: PackageManager;
  pro?: boolean;
  react?: boolean;
};

function resolveFrameworkOption(options?: InitOptions): StarwindFramework | undefined {
  const selected = [
    options?.framework,
    options?.astro ? "astro" : undefined,
    options?.react ? "react" : undefined,
  ].filter(Boolean) as StarwindFramework[];

  if (new Set(selected).size > 1) {
    throw new Error("Choose only one Starwind framework target.");
  }

  return selected[0];
}

function getRuntimeSetupPackages(
  framework: StarwindFramework,
  registry: StarwindRegistry,
): string[] {
  const adapterPackage = framework === "astro" ? "@starwind-ui/astro" : "@starwind-ui/react";
  const adapterRanges = new Set(
    registry.components.flatMap((component) =>
      (component.targets?.[framework]?.packageRequirements ?? [])
        .filter((requirement) => requirement.name === adapterPackage)
        .map((requirement) => requirement.range),
    ),
  );

  if (adapterRanges.size !== 1) {
    throw new Error(
      `Bundled registry must declare one consistent ${adapterPackage} package requirement.`,
    );
  }

  const adapterRange = [...adapterRanges][0]!;
  const adapterVersion = semver.minVersion(adapterRange)?.version;
  if (!adapterVersion) {
    throw new Error(
      `Bundled registry declares an invalid ${adapterPackage} range: ${adapterRange}`,
    );
  }

  return [`${adapterPackage}@${adapterVersion}`];
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

export async function init(withinAdd: boolean = false, options?: InitOptions) {
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
    const configState = await getConfigState();

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

    const selectedFramework = resolveFrameworkOption(options);
    const bundledRegistry = await loadRegistry({ type: "bundled" });

    // Check Astro version compatibility
    const installTasks = [];
    const configTasks = [];

    // ================================================================
    //         Prepare project structure and configuration tasks
    // ================================================================
    let configChoices;

    // Use defaults if specified, otherwise prompt user for choices
    if (options?.defaults) {
      configChoices = {
        framework: selectedFramework ?? "astro",
        componentDir: PATHS.LOCAL_STARWIND_COMPONENTS_DIR,
        cssFile: PATHS.LOCAL_CSS_FILE,
        twBaseColor: "neutral",
      };

      if (!withinAdd) {
        p.log.info("Using default configuration values");
      }
    } else {
      configChoices = await p.group(
        {
          framework: async () =>
            selectedFramework ??
            ((await p.select({
              message: "Which framework is this project using?",
              initialValue: "astro",
              options: [
                { label: "Astro", value: "astro" },
                { label: "React", value: "react" },
              ],
            })) as StarwindFramework),
          // ask where to install components
          componentDir: () =>
            p.text({
              message: "What is your components directory?",
              placeholder: PATHS.LOCAL_STARWIND_COMPONENTS_DIR,
              initialValue: PATHS.LOCAL_STARWIND_COMPONENTS_DIR,
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
              placeholder: PATHS.LOCAL_CSS_FILE,
              initialValue: PATHS.LOCAL_CSS_FILE,
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

    const utilsDir = PATHS.LOCAL_UTILS_DIR;

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

    if (configChoices.framework === "astro") {
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
    } else {
      configTasks.push({
        title: "Setup React Vite config",
        task: async () => {
          const success = await setupReactViteConfig();
          if (!success) {
            throw new Error("Failed to setup React Vite config");
          }
          await sleep(250);
          return "React Vite config setup completed";
        },
      });
    }

    // ================================================================
    //                Prepare TypeScript config file setup
    // ================================================================
    configTasks.push({
      title: "Setup TypeScript path aliases",
      task: async () => {
        const success = await setupTsConfig(configChoices.framework as StarwindFramework);
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

    if (configChoices.framework === "astro") {
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
    } else {
      configTasks.push({
        title: "Adding CSS import to React entry",
        task: async () => {
          const success = await setupReactCssImport(configChoices.cssFile);
          if (!success) {
            throw new Error("Failed to add CSS import to React entry");
          }
          await sleep(250);
          return "CSS import added to React entry";
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
            framework: configChoices.framework as StarwindFramework,
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
            componentDir: configChoices.componentDir,
            utilsDir,
            components: [],
          },
          { appendComponents: false },
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
    const pm: PackageManager = options?.packageManager ?? detectPackageManager().name;
    const runtimeSetupPackages = getRuntimeSetupPackages(
      configChoices.framework as StarwindFramework,
      bundledRegistry,
    );

    if (runtimeSetupPackages.length > 0) {
      installTasks.push({
        title: "Installing Starwind Runtime packages",
        task: async () => {
          await installDependencies(runtimeSetupPackages, pm);
          return "Installed Starwind Runtime packages successfully";
        },
      });
    }

    if (configChoices.framework === "astro") {
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
    const otherPackages = getOtherPackages();

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
          await installDependencies(getOtherPackages(), pm, false, false);
          return `${highlighter.info("Packages installed successfully")}`;
        },
      });
    } else {
      p.log.warn(
        highlighter.warn(`Skipped installation of packages. Make sure to install them manually`),
      );
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
      sleep(1000);
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
