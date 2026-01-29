#!/usr/bin/env node

import { Command, Option } from "commander";

import pkg from "../package.json" with { type: "json" };
import { add } from "./commands/add.js";
import { init } from "./commands/init.js";
import { remove } from "./commands/remove.js";
import { setup } from "./commands/setup.js";
import { update } from "./commands/update.js";

const program = new Command()
  .name("starwind")
  .description("Add beautifully designed components to your Astro applications")
  .version(pkg.version);

program
  .command("init")
  .description("Initialize your project with Starwind")
  .option("-d, --defaults", "Use default values for all prompts")
  .option("-p, --pro", "Initialize with Starwind Pro setup")
  .action((options) => init(false, { defaults: options.defaults, pro: options.pro }));

program
  .command("add")
  .description("Add Starwind components to your project")
  .argument("[components...]", "The components to add (space separated)")
  .allowExcessArguments()
  .option("-a, --all", "Add all available components")
  .option("-y, --yes", "Skip confirmation prompts")
  .addOption(
    new Option("-m, --package-manager <pm>", "Package manager to use").choices([
      "npm",
      "pnpm",
      "yarn",
    ]),
  )
  .action(add);

program
  .command("update")
  .description("Update Starwind components to their latest versions")
  .argument("[components...]", "The components to update (space separated)")
  .allowExcessArguments()
  .option("-a, --all", "Update all installed components")
  .option("-y, --yes", "Skip confirmation prompts")
  .addOption(
    new Option("-m, --package-manager <pm>", "Package manager to use").choices([
      "npm",
      "pnpm",
      "yarn",
    ]),
  )
  .action(update);

program
  .command("remove")
  .description("Remove Starwind components from your project")
  .argument("[components...]", "The components to remove (space separated)")
  .allowExcessArguments()
  .option("-a, --all", "Remove all installed components")
  .action(remove);

program
  .command("setup")
  .description("Setup Starwind Pro in your project")
  .action(setup);

program.parse(process.argv);
