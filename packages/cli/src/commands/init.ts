import path from "node:path";
import { tailwindConfig } from "@/templates/starwind.css.js";
import { setupAstroConfig } from "@/utils/astro-config.js";
import { updateConfig } from "@/utils/config.js";
import { ASTRO_PACKAGES, MIN_ASTRO_VERSION, PATHS, getOtherPackages } from "@/utils/constants.js";
import { ensureDirectory, fileExists, readJsonFile, writeCssFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { installDependencies, requestPackageManager } from "@/utils/package-manager.js";
import { sleep } from "@/utils/sleep.js";
import * as p from "@clack/prompts";
import semver from "semver";

export async function init(withinAdd: boolean = false) {
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
		const configChoices = await p.group(
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
		//                      Prepare CSS file
		// ================================================================
		// Check if CSS file already exists
		const cssFileExists = await fileExists(configChoices.cssFile);
		let updatedTailwindConfig = tailwindConfig;

		if (configChoices.twBaseColor !== "gray") {
			// replace all "--color-neutral" with "--color-twBaseColor"
			updatedTailwindConfig = updatedTailwindConfig.replace(
				/--color-neutral-/g,
				`--color-${configChoices.twBaseColor}-`,
			);
		}

		if (cssFileExists) {
			const shouldOverride = await p.confirm({
				message: `${highlighter.info(configChoices.cssFile)} already exists. Do you want to override it?`,
			});

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
		//                Prepare astro installation
		// ================================================================
		// Request package manager
		const pm = await requestPackageManager();

		if (pkg.dependencies?.astro) {
			const astroVersion = pkg.dependencies.astro.replace(/^\^|~/, "");
			if (!semver.gte(astroVersion, MIN_ASTRO_VERSION)) {
				const shouldUpgrade = await p.confirm({
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
			const shouldInstall = await p.confirm({
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

		const shouldInstall = await p.confirm({
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

		p.note(
			`Make sure your layout imports the ${highlighter.infoBright(configChoices.cssFile)} file`,
			"Next steps",
		);

		if (!withinAdd) {
			sleep(1000);
			p.outro("Enjoy using Starwind UI 🚀");
		}
	} catch (error) {
		p.log.error(error instanceof Error ? error.message : "Failed to add components");
		p.cancel("Operation cancelled");
		process.exit(1);
	}
}
