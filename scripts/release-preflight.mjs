#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createSpawnCommand, getPackageManagerCommand } from "./command-process.mjs";
import { releaseSourceFiles } from "./release-inputs.mjs";
import { assertRoutineReleaseMetadata } from "./release-packages.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function runReleaseCommand(args, cwd = ROOT) {
  const shape = createSpawnCommand(getPackageManagerCommand("pnpm"), args);
  return new Promise((resolve, reject) => {
    const child = spawn(shape.command, shape.args, { cwd, stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`pnpm ${args.join(" ")} failed (${code}).`)),
    );
  });
}

export async function collectPreflightFailures(checks) {
  const failures = [];
  for (const [name, check] of checks) {
    try {
      await check();
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  }
  if (failures.length)
    throw new Error(
      `Release preflight found ${failures.length} failed check(s):\n${failures.join("\n")}`,
    );
}

export async function rehearseRelease({ root = ROOT, run = runReleaseCommand } = {}) {
  const candidate = await mkdtemp(path.join(os.tmpdir(), "starwind-release-preflight-"));
  console.log(`[preflight] Disposable version rehearsal: ${candidate}`);
  try {
    for (const file of releaseSourceFiles(root)) {
      const target = path.join(candidate, file);
      await mkdir(path.dirname(target), { recursive: true });
      try {
        await copyFile(path.join(root, file), target);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    const git = (...args) => execFileSync("git", args, { cwd: candidate, stdio: "pipe" });
    git("init", "-b", "main");
    git("config", "user.name", "Release preflight");
    git("config", "user.email", "release-preflight@localhost");
    git("add", ".");
    git("commit", "--quiet", "-m", "chore: prepare disposable release rehearsal");
    await collectPreflightFailures([
      [
        "version rehearsal",
        async () => {
          await run(["install", "--frozen-lockfile", "--ignore-scripts"], candidate);
          await run(["release:version"], candidate);
          await run(["install", "--frozen-lockfile", "--ignore-scripts", "--offline"], candidate);
          await collectPreflightFailures([
            [
              "package metadata",
              () => run(["exec", "node", "scripts/release-preflight.mjs", "--metadata"], candidate),
            ],
            ["styled versions", () => run(["styled:versions:check"], candidate)],
            ["primitive versions", () => run(["primitive:versions:check"], candidate)],
            [
              "versioned registry",
              () =>
                run(
                  [
                    "exec",
                    "vitest",
                    "run",
                    "--project=portable-runtime",
                    "scripts/portable-runtime/tests/generate-cli-registry.test.ts",
                    "scripts/portable-runtime/tests/primitive-generator-registry.test.ts",
                  ],
                  candidate,
                ),
            ],
            [
              "release helpers",
              () =>
                run(
                  [
                    "exec",
                    "vitest",
                    "run",
                    "--project=repo-scripts",
                    "scripts/tests/release-packages.test.ts",
                    "scripts/tests/release-publication-plan.test.mjs",
                  ],
                  candidate,
                ),
            ],
            [
              "Vue release contract",
              async () => {
                await run(
                  [
                    "exec",
                    "vitest",
                    "run",
                    "--project=portable-vue",
                    "scripts/portable-runtime/tests/generate-vue-wrappers/package-foundation.test.ts",
                  ],
                  candidate,
                );
                await run(
                  [
                    "--filter=@starwind-ui/vue",
                    "test:run",
                    "packages/vue/tests/integration/workspace-contract.test.ts",
                  ],
                  candidate,
                );
              },
            ],
          ]);
        },
      ],
      ["dependency audit", () => run(["audit:prod"], candidate)],
    ]);
    console.log(
      "[preflight] Versioning, frozen install, registry, release helpers, and dependency audit passed.",
    );
  } finally {
    await rm(candidate, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const operation =
    args.length === 1 && args[0] === "--metadata"
      ? assertRoutineReleaseMetadata()
      : args.length === 0
        ? rehearseRelease()
        : Promise.reject(new Error("Expected no arguments or --metadata."));
  operation.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
