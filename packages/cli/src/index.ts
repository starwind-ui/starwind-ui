#!/usr/bin/env node
import { Command } from "commander";

import { add } from "./commands/add.js";
import { init } from "./commands/init.js";
import { remove } from "./commands/remove.js";
import { update } from "./commands/update.js";

const program = new Command()
  .name("starwind")
  .description("Add beautifully designed components to your Astro applications")
  .version("1.10.1");

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
  .action(add);

program
  .command("update")
  .description("Update Starwind components to their latest versions")
  .argument("[components...]", "The components to update (space separated)")
  .allowExcessArguments()
  .option("-a, --all", "Update all installed components")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(update);

program
  .command("remove")
  .description("Remove Starwind components from your project")
  .argument("[components...]", "The components to remove (space separated)")
  .allowExcessArguments()
  .option("-a, --all", "Remove all installed components")
  .action(remove);

program.parse();
