#!/usr/bin/env node
// Runs every generator that the CI drift check needs, at the same time where the machine allows.
// Each generator writes its own output folders and reads only contracts and package metadata, so
// the order between them does not change the output.
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createSpawnCommand, getPackageManagerCommand } from "../command-process.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// The longest generators come first, so that the short ones fill the gaps at the end.
export const GENERATE_CI_TASKS = [
  { name: "vue", args: ["run", "--silent", "runtime:generate:vue"] },
  { name: "astro", args: ["run", "--silent", "runtime:generate:astro"] },
  {
    name: "cli registry",
    args: ["exec", "tsx", "scripts/portable-runtime/generate-cli-registry.ts"],
  },
  { name: "react", args: ["run", "--silent", "runtime:generate:react"] },
  {
    name: "primitive vendoring artifacts",
    args: ["exec", "tsx", "scripts/portable-runtime/generate-primitive-vendoring-artifacts.ts"],
  },
  { name: "svelte", args: ["run", "--silent", "runtime:generate:svelte"] },
  { name: "svelte styled", args: ["run", "--silent", "svelte:styled:generate"] },
];

export async function runGenerateCiTasks({
  concurrency = os.availableParallelism(),
  log = console.log,
  tasks = GENERATE_CI_TASKS,
  verbose = false,
} = {}) {
  const queue = [...tasks];
  const failures = [];
  const startedAt = performance.now();

  async function worker() {
    for (let task = queue.shift(); task; task = queue.shift()) {
      const result = await runTask(task);
      const seconds = (result.durationMs / 1000).toFixed(1);
      if (result.code === 0) {
        log(`ok   ${task.name} (${seconds}s)`);
        if (verbose && result.output) log(result.output);
      } else {
        failures.push(task.name);
        log(`FAIL ${task.name} (${seconds}s, exit code ${result.code})`);
        log(result.output);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, tasks.length)) }, worker),
  );
  log(`Generated in ${((performance.now() - startedAt) / 1000).toFixed(1)}s.`);
  return failures;
}

function runTask(task) {
  const startedAt = performance.now();
  const { command, args } = createSpawnCommand(getPackageManagerCommand("pnpm"), task.args);

  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    const chunks = [];
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => chunks.push(chunk));
    child.on("error", (error) => {
      chunks.push(Buffer.from(`${error.stack ?? error.message}\n`));
    });
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        durationMs: performance.now() - startedAt,
        output: Buffer.concat(chunks).toString("utf8").trimEnd(),
      });
    });
  });
}

function getConcurrencyArg(argv) {
  const index = argv.indexOf("--concurrency");
  if (index === -1) return undefined;
  const value = Number.parseInt(argv[index + 1] ?? "", 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("--concurrency needs a positive whole number.");
  }
  return value;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = await runGenerateCiTasks({
    concurrency: getConcurrencyArg(process.argv),
    verbose: process.argv.includes("--verbose"),
  });
  if (failures.length > 0) {
    console.error(`Generation failed: ${failures.join(", ")}.`);
    process.exitCode = 1;
  }
}
