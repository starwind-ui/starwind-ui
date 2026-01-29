import { fileExists, readJsonFile } from "@/utils/fs.js";
import * as p from "@clack/prompts";
import { highlighter } from "@/utils/highlighter.js";
import { hasStarwindProRegistry, setupShadcnProConfig } from "@/utils/shadcn-config.js";
import { setupStarwindProEnv } from "@/utils/env.js";
import { sleep } from "@/utils/sleep.js";

export async function setup() {
  p.intro(highlighter.title(" Setting up Starwind Pro "));

  try {
    if (!(await fileExists("starwind.config.json"))) {
      p.log.error(
        "No starwind.config.json found. Please run `starwind init` first.",
      );
      process.exit(1);
    }

    const config = await readJsonFile("starwind.config.json");
    const configTasks = [];

    const alreadyHasPro = await hasStarwindProRegistry();

    if (!alreadyHasPro) {
      p.log.info(highlighter.info("Setting up Starwind Pro configuration..."));

      if (
        config &&
        typeof config === "object" &&
        config.tailwind &&
        typeof config.tailwind === "object" &&
        typeof config.tailwind.css === "string" &&
        typeof config.tailwind.baseColor === "string"
      ) {
        configTasks.push({
          title: "Setting up Starwind Pro registry",
          task: async () => {
            await setupShadcnProConfig(config.tailwind.css, config.tailwind.baseColor);
            await sleep(250);
            return "Configured Starwind Pro registry in components.json";
          },
        });
      } else {
        p.log.error("Invalid `starwind.config.json`. Could not set up Starwind Pro registry.");
      }

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

      if (configTasks.length > 0) {
        await p.tasks(configTasks);
      }
    } else {
      p.log.info(highlighter.info("Starwind Pro registry already configured"));
    }

    await sleep(250);

    let nextStepsMessage = `Starwind Pro is now configured! You can install pro components using:\n${highlighter.info("npx starwind@latest add @starwind-pro/component-name")}\n\nMake sure to set your ${highlighter.infoBright("STARWIND_LICENSE_KEY")} environment variable in ${highlighter.infoBright(".env.local")}.`;

    p.note(nextStepsMessage, "Next steps");

    await sleep(1000);
    p.outro("Enjoy using Starwind UI with Pro components! 🚀");

  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to add components");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}
