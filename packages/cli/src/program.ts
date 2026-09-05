import { Command, Option } from "commander";

import pkg from "../package.json" with { type: "json" };
import { add } from "./commands/add.js";
import { docs } from "./commands/docs.js";
import { init } from "./commands/init.js";
import { migrate } from "./commands/migrate.js";
import { primitivesAdd, primitivesList, primitivesUpdate } from "./commands/primitives.js";
import { remove } from "./commands/remove.js";
import { search } from "./commands/search.js";
import { setup } from "./commands/setup.js";
import { update } from "./commands/update.js";

export function createProgram(): Command {
  const program = new Command()
    .name("starwind")
    .description("Add beautifully designed components to Astro, React, and Vue (beta) applications")
    .version(pkg.version);

  program
    .command("init")
    .description("Initialize your project with Starwind")
    .option("-d, --defaults", "Use default values for all prompts")
    .option("-p, --pro", "Initialize with Starwind Pro setup")
    .addOption(
      new Option("--framework <framework>", "Framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
      ]),
    )
    .option("--astro", "Initialize for Astro")
    .option("--react", "Initialize for React")
    .action((options) =>
      init(false, {
        astro: options.astro,
        defaults: options.defaults,
        framework: options.framework,
        pro: options.pro,
        react: options.react,
      }),
    );

  program
    .command("add")
    .description("Add Starwind components to your project")
    .argument("[components...]", "The components to add (space separated)")
    .allowExcessArguments()
    .option("-a, --all", "Add all available components")
    .option("-y, --yes", "Skip confirmation prompts")
    .option("-o, --overwrite", "Overwrite existing files")
    .option("--registry <registry>", "Remote registry URL or local registry file")
    .addOption(
      new Option(
        "--starwind-ui-version <major>",
        "Starwind UI compatibility line for Starwind Pro blocks",
      )
        .choices(["2", "3"])
        .default("3"),
    )
    .addOption(
      new Option("--framework <framework>", "Framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
      ]),
    )
    .addOption(
      new Option("-m, --package-manager <pm>", "Package manager to use").choices([
        "npm",
        "pnpm",
        "yarn",
      ]),
    )
    .action((components, options) => add(components, options));

  program
    .command("docs")
    .description("Open documentation for Starwind components")
    .argument("[components...]", "The components to look up (space separated)")
    .allowExcessArguments()
    .option("--json", "Output as JSON")
    .option("--registry <registry>", "Remote registry URL or local registry file")
    .action((components, options) => docs(components, options));

  program
    .command("search")
    .description("Search Starwind components and Pro blocks")
    .argument("[query]", "Search query string")
    .allowExcessArguments()
    .addOption(
      new Option("-p, --plan <plan>", "Filter Pro blocks by plan type").choices(["free", "pro"]),
    )
    .option("-c, --category <category>", "Filter Pro blocks by category")
    .option("-l, --limit <number>", "Maximum number of Pro blocks to display", "20")
    .option("-o, --offset <number>", "Offset for paginating Pro block results", "0")
    .option("--json", "Output as JSON")
    .option("--registry <registry>", "Remote registry URL or local registry file")
    .option("--primitives", "Search Starwind primitive source")
    .addOption(
      new Option("--framework <framework>", "Primitive framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
        "all",
      ]),
    )
    .action(
      async (
        query: string,
        opts: {
          plan?: "free" | "pro";
          category?: string;
          limit: string;
          offset: string;
          json?: boolean;
          registry?: string;
          primitives?: boolean;
          framework?: "astro" | "react" | "vue" | "all";
        },
      ) => {
        const parsedLimit = Math.min(Math.max(parseInt(opts.limit, 10) || 20, 1), 50);
        const parsedOffset = Math.max(parseInt(opts.offset, 10) || 0, 0);

        await search(query, {
          plan: opts.plan,
          category: opts.category,
          limit: parsedLimit,
          offset: parsedOffset,
          json: opts.json,
          registry: opts.registry,
          primitives: opts.primitives,
          framework: opts.framework,
        });
      },
    );

  program
    .command("update")
    .description("Update Starwind components to their latest versions")
    .argument("[components...]", "The components to update (space separated)")
    .allowExcessArguments()
    .option("-a, --all", "Update all installed components")
    .option("-y, --yes", "Skip confirmation prompts")
    .option("--dry-run", "Preview changes without writing files")
    .option("--diff [path]", "Show update diff for all files or one planned file")
    .option("--view [path]", "Show new file contents for all files or one planned file")
    .option("--registry <registry>", "Remote registry URL or local registry file")
    .addOption(
      new Option("--framework <framework>", "Framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
        "all",
      ]),
    )
    .addOption(
      new Option("-m, --package-manager <pm>", "Package manager to use").choices([
        "npm",
        "pnpm",
        "yarn",
      ]),
    )
    .action((components, options) => update(components, options));

  program
    .command("migrate")
    .description("Migrate a legacy Starwind project to the Runtime setup")
    .option("-y, --yes", "Skip confirmation prompts")
    .addOption(
      new Option("-m, --package-manager <pm>", "Package manager to use").choices([
        "npm",
        "pnpm",
        "yarn",
      ]),
    )
    .action(migrate);

  const primitivesCommand = program
    .command("primitives")
    .description("Manage Starwind primitive source");

  primitivesCommand
    .command("add")
    .description("Add Starwind primitive source to your project")
    .argument("[primitives...]", "The primitives to add (space separated)")
    .allowExcessArguments()
    .option("-a, --all", "Add all available primitives")
    .option("-y, --yes", "Skip confirmation prompts")
    .option("-o, --overwrite", "Overwrite existing files")
    .addOption(
      new Option("--framework <framework>", "Primitive framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
      ]),
    )
    .option("--to <dir>", "Primitive source destination directory")
    .option("-p, --path <dir>", "Alias for --to")
    .addOption(
      new Option("-m, --package-manager <pm>", "Package manager to use").choices([
        "npm",
        "pnpm",
        "yarn",
      ]),
    )
    .action((primitives, options) => primitivesAdd(primitives, options));

  primitivesCommand
    .command("update")
    .description("Update Starwind primitive source in your project")
    .argument("[primitives...]", "The primitives to update (space separated)")
    .allowExcessArguments()
    .option("-a, --all", "Update all installed primitives")
    .option("-y, --yes", "Skip confirmation prompts")
    .option("--dry-run", "Preview changes without writing files")
    .option("--diff [path]", "Show update diff for all files or one planned file")
    .option("--view [path]", "Show new file contents for all files or one planned file")
    .addOption(
      new Option("--framework <framework>", "Primitive framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
      ]),
    )
    .addOption(
      new Option("-m, --package-manager <pm>", "Package manager to use").choices([
        "npm",
        "pnpm",
        "yarn",
      ]),
    )
    .action((primitives, options) => primitivesUpdate(primitives, options));

  primitivesCommand
    .command("list")
    .description("List Starwind primitive source")
    .option("--json", "Output as JSON")
    .addOption(
      new Option("--framework <framework>", "Primitive framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
        "all",
      ]),
    )
    .action((options) => primitivesList(options));

  program
    .command("remove")
    .description("Remove Starwind components from your project")
    .argument("[components...]", "The components to remove (space separated)")
    .allowExcessArguments()
    .option("-a, --all", "Remove all installed components")
    .option("-y, --yes", "Skip confirmation prompts")
    .addOption(
      new Option("--framework <framework>", "Framework target; Vue is beta").choices([
        "astro",
        "react",
        "vue",
        "all",
      ]),
    )
    .action((components, options) => remove(components, options));

  program
    .command("setup")
    .description("Setup Starwind Pro in your project")
    .option("-y, --yes", "Skip confirmation prompts")
    .addOption(
      new Option("-m, --package-manager <pm>", "Package manager to use").choices([
        "npm",
        "pnpm",
        "yarn",
      ]),
    )
    .option("-p, --pro", "Setup Starwind Pro (default)")
    .action(setup);

  return program;
}
