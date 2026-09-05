#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_OUTPUT_DIRECTORY = ".release-packs";

const PUBLIC_PACKAGES = [
  {
    directory: "packages/runtime",
    fileName: "starwind-runtime.tgz",
    key: "runtime",
    name: "@starwind-ui/runtime",
  },
  {
    directory: "packages/astro",
    fileName: "starwind-astro.tgz",
    key: "astro",
    name: "@starwind-ui/astro",
  },
  {
    directory: "packages/react",
    fileName: "starwind-react.tgz",
    key: "react",
    name: "@starwind-ui/react",
  },
  { directory: "packages/cli", fileName: "starwind-cli.tgz", key: "cli", name: "starwind" },
];

const VUE_BETA_PACKAGES = [
  ...PUBLIC_PACKAGES.slice(0, -1),
  {
    directory: "packages/vue",
    fileName: "starwind-vue.tgz",
    key: "vue",
    name: "@starwind-ui/vue",
  },
  PUBLIC_PACKAGES.at(-1),
];

function getPnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function quoteWindowsCommandArg(argument) {
  if (/^[A-Za-z0-9._:/=@+\\-]+$/.test(argument)) return argument;
  if (/["&<>|^%!\r\n]/.test(argument)) {
    throw new Error(`Cannot safely pass argument to cmd.exe: ${argument}`);
  }
  return `"${argument}"`;
}

function createSpawn(command, args) {
  if (process.platform === "win32" && command.endsWith(".cmd")) {
    return {
      args: ["/d", "/s", "/c", [command, ...args].map(quoteWindowsCommandArg).join(" ")],
      command: process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
    };
  }
  return { args, command };
}

async function runCommand({ args, command = getPnpmCommand(), cwd }) {
  const spawned = createSpawn(command, args);
  await new Promise((resolve, reject) => {
    const child = spawn(spawned.command, spawned.args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}.`)),
    );
  });
}

export function createPackPlan({ outputDirectory, vueBeta = false }) {
  return {
    outputDirectory,
    packages: (vueBeta ? VUE_BETA_PACKAGES : PUBLIC_PACKAGES).map((entry) => ({
      ...entry,
      directory: path.join(REPO_ROOT, entry.directory),
      file: path.join(outputDirectory, entry.fileName),
    })),
  };
}

export function parseArgs(argv) {
  let outputDirectory = DEFAULT_OUTPUT_DIRECTORY;
  let vueBeta = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--vue-beta") vueBeta = true;
    else if (argument === "--output") {
      outputDirectory = argv[index + 1];
      if (!outputDirectory) throw new Error("Expected a path after --output.");
      index += 1;
    } else if (argument.startsWith("--output=")) {
      outputDirectory = argument.slice("--output=".length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return vueBeta
    ? { outputDirectory: path.resolve(outputDirectory), vueBeta }
    : { outputDirectory: path.resolve(outputDirectory) };
}

export async function packPublicReleaseArtifacts({ outputDirectory, vueBeta = false }) {
  const plan = createPackPlan({ outputDirectory, vueBeta });
  await mkdir(outputDirectory, { recursive: true });
  const artifactPackages = {};

  for (const entry of plan.packages) {
    const packageManifest = JSON.parse(
      await readFile(path.join(entry.directory, "package.json"), "utf8"),
    );
    assert.equal(typeof packageManifest.name, "string");
    assert.equal(typeof packageManifest.version, "string");
    assert.equal(packageManifest.name, entry.name);
    await runCommand({ args: ["pack", "--out", entry.file], cwd: entry.directory });
    artifactPackages[entry.key] = {
      file: entry.fileName,
      name: packageManifest.name,
      version: packageManifest.version,
    };
  }

  const artifactManifest = {
    builtWithNode: process.version,
    packages: artifactPackages,
    schemaVersion: 1,
  };
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(artifactManifest, null, 2)}\n`,
    "utf8",
  );
  return artifactManifest;
}

async function main() {
  await packPublicReleaseArtifacts(parseArgs(process.argv.slice(2)));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}
