import * as p from "@clack/prompts";

import { getConfig } from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import { checkStarwindProEnv, setupStarwindProEnv } from "@/utils/env.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { hasStarwindProRegistry, setupShadcnProConfig } from "@/utils/shadcn-config.js";
import { sleep } from "@/utils/sleep.js";

import { init } from "./init.js";

interface SetupOptions {
  yes?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn";
  pro?: boolean;
}

interface SetupTask {
  name: string;
  value: string;
  flag: keyof SetupOptions;
  description: string;
  run: () => Promise<void>;
}

export async function setup(options?: SetupOptions) {
  p.intro(highlighter.title(" Using Starwind Setup "));

  try {
    // 1. Check if Starwind is initialized
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
        await init(true, { defaults: options?.yes, packageManager: options?.packageManager });
      } else {
        p.log.error(
          `Please initialize starwind with ${highlighter.info("starwind init")} before running setup`,
        );
        process.exit(1);
      }
    }

    // 2. Define available setup tasks
    const tasks: SetupTask[] = [
      {
        name: "Starwind Pro",
        value: "pro",
        flag: "pro",
        description: "Setup Starwind Pro registry and environment",
        run: runProSetup,
      },
      // Future tasks (e.g., Prettier, ESLint) can be added here
    ];

    // 3. Determine which tasks to run
    // Since "Pro" is currently the only option, we default to it if no other specific flags are passed.
    // In the future, if no flags are passed, we would show a multiselect.
    const selectedTasks: SetupTask[] = [];

    if (options?.pro) {
      const proTask = tasks.find((t) => t.value === "pro");
      if (proTask) selectedTasks.push(proTask);
    } else {
      // Default to Pro for now since it's the only one
      const proTask = tasks.find((t) => t.value === "pro");
      if (proTask) selectedTasks.push(proTask);
    }

    if (selectedTasks.length === 0) {
      p.log.warn("No setup tasks selected.");
      process.exit(0);
    }

    // 4. Run selected tasks
    for (const task of selectedTasks) {
      await task.run();
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to run setup");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

async function runProSetup() {
  p.log.info(highlighter.info("Setting up Starwind Pro..."));

  const configTasks = [];
  const hasRegistry = await hasStarwindProRegistry();
  const hasEnv = await checkStarwindProEnv();

  if (hasRegistry && hasEnv) {
    p.log.info(highlighter.info("Starwind Pro registry and environment already configured"));
  } else {
    let cssFile: string = PATHS.LOCAL_CSS_FILE;
    let baseColor = "neutral";

    try {
      const config = await getConfig();
      if (config.tailwind?.css) cssFile = config.tailwind.css;
      if (config.tailwind?.baseColor) baseColor = config.tailwind.baseColor;
    } catch {
      // Use defaults if config can't be read
    }

    if (!hasRegistry) {
      configTasks.push({
        title: "Setting up Starwind Pro registry",
        task: async () => {
          await setupShadcnProConfig(cssFile, baseColor);
          await sleep(250);
          return "Configured Starwind Pro registry in components.json";
        },
      });
    }

    if (!hasEnv) {
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
      await p.tasks(configTasks);
    }
  }

  await sleep(250);

  const nextStepsMessage = `Starwind Pro is now configured! You can install pro components using:\n${highlighter.info("npx starwind@latest add @starwind-pro/component-name")}\n\nMake sure to set your ${highlighter.infoBright("STARWIND_LICENSE_KEY")} environment variable in ${highlighter.infoBright(".env.local")}`;

  p.note(nextStepsMessage, "Next steps");

  await sleep(1000);
  p.outro("Enjoy using Starwind UI with Pro components! 🚀");
}
