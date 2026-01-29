import path from "node:path";

import * as p from "@clack/prompts";
import semver from "semver";

import { tailwindConfig } from "@/templates/starwind.css.js";
import { setupAstroConfig } from "@/utils/astro-config.js";
import { updateConfig } from "@/utils/config.js";
import { ASTRO_PACKAGES, getOtherPackages, MIN_ASTRO_VERSION, PATHS } from "@/utils/constants.js";
import { setupStarwindProEnv } from "@/utils/env.js";
import { ensureDirectory, fileExists, readJsonFile, writeCssFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { setupLayoutCssImport } from "@/utils/layout.js";
import {
  detectPackageManager,
  installDependencies,
  type PackageManager,
} from "@/utils/package-manager.js";
import { hasStarwindProRegistry, setupShadcnProConfig } from "@/utils/shadcn-config.js";
import { sleep } from "@/utils/sleep.js";
import { setupTsConfig } from "@/utils/tsconfig.js";

export async function init(
  withinAdd: boolean = false,
  options?: { defaults?: boolean; pro?: boolean; packageManager?: PackageManager },
) {
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
        installLocation: PATHS.LOCAL_COMPONENTS_DIR,
        cssFile: PATHS.LOCAL_CSS_FILE,
        twBaseColor: "neutral",
      };

      if (!withinAdd) {
        p.log.info("Using default configuration values");
      }
    } else {
      configChoices = await p.group(
        {
          // ask where to install components
          installLocation: () =>
            p.text({
              message: "What is your components directory?",
              placeholder: PATHS.LOCAL_COMPONENTS_DIR,
              initialValue: PATHS.LOCAL_COMPONENTS_DIR,
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

    // ================================================================
    //            Make sure appropriate directories exist
    // ================================================================
    const cssFileDir = path.dirname(configChoices.cssFile);
    const componentInstallDir = path.join(configChoices.installLocation, "starwind");
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

    // ================================================================
    //                Prepare TypeScript config file setup
    // ================================================================
    configTasks.push({
      title: "Setup TypeScript path aliases",
      task: async () => {
        const success = await setupTsConfig();
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

    // ================================================================
    //             Prepare project starwind configuration
    // ================================================================
    configTasks.push({
      title: "Updating project configuration",
      task: async () => {
        await updateConfig({
          tailwind: {
            css: configChoices.cssFile,
            baseColor: configChoices.twBaseColor as "slate" | "gray" | "zinc" | "neutral" | "stone",
            cssVariables: true,
          },
          // aliases: {
          // 	components: "@/components",
          // },
          componentDir: configChoices.installLocation,
          components: [],
        });
        await sleep(250);
        return "Updated project starwind configuration";
      },
    });

    // ================================================================
    //             Prepare Starwind Pro configuration (if enabled)
    // ================================================================
    if (options?.pro) {
      const alreadyHasPro = await hasStarwindProRegistry();

      if (!alreadyHasPro) {
        if (!withinAdd) {
          p.log.info(highlighter.info("Setting up Starwind Pro configuration..."));
        }

        configTasks.push({
          title: "Setting up Starwind Pro registry",
          task: async () => {
            await setupShadcnProConfig(configChoices.cssFile, configChoices.twBaseColor);
            await sleep(250);
            return "Configured Starwind Pro registry in components.json";
          },
        });

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
      } else {
        if (!withinAdd) {
          p.log.warn(
            `${highlighter.warn("Starwind Pro registry already configured.")} Use the ${highlighter.info("setup")} command to update your Pro configuration.`,
          );
        }
      }
    }

    // ================================================================
    //                Prepare astro installation
    // ================================================================
    // Determine package manager: use provided option or auto-detect
    const pm: PackageManager = options?.packageManager ?? detectPackageManager().name;

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

    let nextStepsMessage = `Make sure your layout imports the ${highlighter.infoBright(configChoices.cssFile)} file`;

    if (options?.pro) {
      nextStepsMessage += `\n\nStarwind Pro is now configured! You can install pro components using:\n${highlighter.info("npx starwind@latest add @starwind-pro/component-name")}\n\nMake sure to set your ${highlighter.infoBright("STARWIND_LICENSE_KEY")} environment variable in ${highlighter.infoBright(".env.local")}.`;
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
