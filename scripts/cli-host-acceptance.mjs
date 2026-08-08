#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

import { packPublicReleaseArtifacts } from "./pack-public-release-artifacts.mjs";
import {
  getCandidateWorkspacePackage,
  getCandidateWorkspacePolicy,
  startCandidateRegistry,
} from "./release-candidate-acceptance.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const ASTRO_SCAFFOLD_VERSION = "5.2.3";
const ASTRO_VERSION = "7.0.0";
const VITE_SCAFFOLD_VERSION = "9.1.1";
const REACT_VERSION = "19.2.0";
const DEFAULT_COMMAND_TIMEOUT_MS = 180_000;

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

export async function runLoggedCommand(phase, commandPlan, logsDirectory) {
  await mkdir(logsDirectory, { recursive: true });
  const logFile = path.join(logsDirectory, `${phase}.log`);
  const command = commandPlan.command ?? getPnpmCommand();
  const spawned = createSpawn(command, commandPlan.args);
  const timeoutMs = commandPlan.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
  assert.ok(timeoutMs > 0, "Command timeout must be greater than zero.");
  console.log(`[cli-host] ${phase}: ${command} ${commandPlan.args.join(" ")}`);

  const stdout = [];
  const stderr = [];
  const startedAt = Date.now();
  await new Promise((resolve, reject) => {
    const child = spawn(spawned.command, spawned.args, {
      cwd: commandPlan.cwd,
      env: { ...process.env, CI: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let timedOut = false;
    let termination = Promise.resolve();
    const timeout = setTimeout(() => {
      timedOut = true;
      termination = terminateProcessTree(child.pid);
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout.push(chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr.push(chunk);
      process.stderr.write(chunk);
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", async (code) => {
      clearTimeout(timeout);
      if (timedOut) {
        let terminationError = "";
        try {
          await termination;
        } catch (error) {
          terminationError = `\ntermination error: ${formatError(error)}`;
        }
        reject(
          new Error(
            formatCommandDiagnostics({
              command,
              commandPlan,
              elapsedMs: Date.now() - startedAt,
              headline: "Command exceeded its deadline.",
              phase,
              stderr: Buffer.concat(stderr).toString("utf8") + terminationError,
              stdout: Buffer.concat(stdout).toString("utf8"),
              timeoutMs,
            }),
          ),
        );
        return;
      }
      if (code === 0) resolve();
      else {
        reject(
          new Error(
            `${formatCommandDiagnostics({
              command,
              commandPlan,
              elapsedMs: Date.now() - startedAt,
              headline: "Command failed.",
              phase,
              stderr: Buffer.concat(stderr).toString("utf8"),
              stdout: Buffer.concat(stdout).toString("utf8"),
              timeoutMs,
            })}\nexit code: ${code}`,
          ),
        );
      }
    });
  }).finally(async () => {
    await writeFile(
      logFile,
      `phase: ${phase}\ncommand: ${command} ${commandPlan.args.join(" ")}\ncwd: ${commandPlan.cwd}\nstdout:\n${Buffer.concat(stdout).toString("utf8")}\nstderr:\n${Buffer.concat(stderr).toString("utf8")}`,
      "utf8",
    );
  });
}

function formatCommandDiagnostics({
  command,
  commandPlan,
  elapsedMs,
  headline,
  phase,
  stderr,
  stdout,
  timeoutMs,
}) {
  return [
    headline,
    `phase: ${phase}`,
    `command: ${command} ${commandPlan.args.join(" ")}`,
    `cwd: ${commandPlan.cwd}`,
    `elapsed: ${elapsedMs}ms`,
    `deadline: ${timeoutMs}ms`,
    `stdout:\n${stdout}`,
    `stderr:\n${stderr}`,
  ].join("\n");
}

async function terminateProcessTree(pid) {
  if (!pid) return;
  if (process.platform !== "win32") {
    try {
      process.kill(pid, "SIGKILL");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
    return;
  }

  await new Promise((resolve, reject) => {
    const killer = spawn("taskkill.exe", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    killer.once("error", reject);
    killer.once("close", resolve);
  });
}

function formatError(error) {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

function packageCommand(directory, args) {
  return { args, cwd: directory };
}

export function createCliHostAcceptancePlan({ packages, root }) {
  const cliEntrypoint = path.join(root, "node_modules", "starwind", "dist", "index.js");
  const packedDependencies = {
    "@starwind-ui/react": packages.react,
    "@starwind-ui/runtime": packages.runtime,
  };
  const cli = (directory, args) => ({
    args: [cliEntrypoint, ...args],
    command: process.execPath,
    cwd: directory,
  });
  const astroDirectory = path.join(root, "astro-react");
  const viteDirectory = path.join(root, "vite-react-js");

  return {
    cliEntrypoint,
    packages,
    projects: [
      {
        add: cli(astroDirectory, ["add", "button", "--framework", "react", "--yes"]),
        build: packageCommand(astroDirectory, ["build"]),
        check: packageCommand(astroDirectory, ["exec", "astro", "check"]),
        directory: astroDirectory,
        framework: "react",
        host: "astro",
        id: "astro-react",
        init: cli(astroDirectory, ["init", "--defaults", "--framework", "react"]),
        packedDependencies,
        scaffold: {
          args: [
            "create",
            `astro@${ASTRO_SCAFFOLD_VERSION}`,
            "astro-react",
            "--template",
            "minimal",
            "--no-install",
            "--no-git",
            "--yes",
          ],
          cwd: root,
        },
      },
      {
        add: cli(viteDirectory, ["add", "button", "--yes"]),
        build: packageCommand(viteDirectory, ["build"]),
        check: packageCommand(viteDirectory, [
          "exec",
          "tsc",
          "--noEmit",
          "--project",
          "tsconfig.json",
        ]),
        directory: viteDirectory,
        framework: "react",
        host: "vite",
        id: "vite-react-js",
        init: cli(viteDirectory, ["init", "--defaults"]),
        packedDependencies,
        scaffold: {
          args: [
            "create",
            `vite@${VITE_SCAFFOLD_VERSION}`,
            "vite-react-js",
            "--template",
            "react",
            "--no-interactive",
          ],
          cwd: root,
        },
      },
    ],
    root,
  };
}

export function getAstroPageFixture() {
  return `---
import { Button } from "../components/starwind-react/button";
---

<main><Button>Astro mixed React passed</Button></main>
`;
}

export function getViteAppFixture() {
  return `import { Button } from "./components/starwind/button";

export default function App() {
  return <Button>Vite React JavaScript passed</Button>;
}
`;
}

export function shouldPreserveHostRoot({ failed, keepTemp }) {
  return failed || keepTemp;
}

export function parseArgs(argv) {
  let keepTemp = false;
  for (const argument of argv) {
    if (argument === "--keep-temp") keepTemp = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return { keepTemp };
}

async function prepareManifest(project) {
  const manifestFile = path.join(project.directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  if (project.host === "astro") {
    manifest.dependencies = { ...manifest.dependencies, astro: ASTRO_VERSION };
    manifest.devDependencies = {
      ...manifest.devDependencies,
      "@astrojs/check": "^0.9.8",
      typescript: "^5.9.3",
    };
  } else {
    manifest.dependencies = {
      ...manifest.dependencies,
      react: REACT_VERSION,
      "react-dom": REACT_VERSION,
    };
    manifest.devDependencies = {
      ...manifest.devDependencies,
      "@types/node": "^24.0.0",
      "@types/react": "^19.2.0",
      "@types/react-dom": "^19.2.0",
      typescript: "^5.9.3",
    };
  }
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function getRegistryEntries(packages) {
  const entries = {};
  for (const [key, directory] of [
    ["astro", "packages/astro"],
    ["react", "packages/react"],
    ["runtime", "packages/runtime"],
  ]) {
    const manifest = JSON.parse(
      await readFile(path.join(REPO_ROOT, directory, "package.json"), "utf8"),
    );
    entries[key] = {
      file: packages[key],
      manifest,
      name: manifest.name,
      version: manifest.version,
    };
  }
  return entries;
}

async function verifyPackedProvenance(project) {
  const lockfile = await readFile(path.join(project.directory, "pnpm-lock.yaml"), "utf8");
  const expected = {};
  const installed = {};
  const adapterManifestFile = path.join(
    project.directory,
    "node_modules",
    "@starwind-ui",
    "react",
    "package.json",
  );
  const realAdapterManifestFile = await realpath(adapterManifestFile);
  for (const [packageName, tarball] of Object.entries(project.packedDependencies)) {
    const manifestFile =
      packageName === "@starwind-ui/react"
        ? adapterManifestFile
        : path.resolve(path.dirname(realAdapterManifestFile), "..", "runtime", "package.json");
    const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
    const sourceDirectory = packageName.endsWith("/react") ? "packages/react" : "packages/runtime";
    const sourceManifest = JSON.parse(
      await readFile(path.join(REPO_ROOT, sourceDirectory, "package.json"), "utf8"),
    );
    expected[packageName] = { file: tarball, version: sourceManifest.version };
    installed[packageName] = manifest;
  }
  assertPackedHostProvenance({
    expected,
    installed,
    lockfile,
    lockfileDirectory: project.directory,
  });
  console.log(`[cli-host] ${project.id}: packed React adapter and Runtime provenance passed`);
}

export function assertPackedHostProvenance({ expected, installed, lockfile, lockfileDirectory }) {
  for (const [packageName, packed] of Object.entries(expected)) {
    assert.equal(installed[packageName]?.name, packageName, `${packageName} installed name`);
    assert.equal(
      installed[packageName]?.version,
      packed.version,
      `${packageName} installed version`,
    );
  }

  const parsed = parseYaml(lockfile);
  const importer = parsed.importers?.["."];
  const reactName = "@starwind-ui/react";
  const runtimeName = "@starwind-ui/runtime";
  if (expected[reactName]) {
    const reactDependency = importer?.dependencies?.[reactName];
    assert.ok(reactDependency, `${reactName} is missing from the pnpm importer.`);
    assertPackedFileReference(
      reactName,
      reactDependency.specifier,
      expected[reactName].file,
      lockfileDirectory,
    );
    assertPackedPackageResolution(
      parsed,
      reactName,
      reactDependency.version,
      expected[reactName].file,
      lockfileDirectory,
    );

    if (expected[runtimeName]) {
      const reactSnapshot = parsed.snapshots?.[`${reactName}@${reactDependency.version}`];
      assert.ok(reactSnapshot, `${reactName} packed snapshot is missing.`);
      const runtimeReference = reactSnapshot.dependencies?.[runtimeName];
      assert.equal(typeof runtimeReference, "string", `${runtimeName} dependency is missing.`);
      assertPackedPackageResolution(
        parsed,
        runtimeName,
        runtimeReference,
        expected[runtimeName].file,
        lockfileDirectory,
      );
    }
  }
}

function assertPackedPackageResolution(
  lockfile,
  packageName,
  reference,
  expectedFile,
  lockfileDirectory,
) {
  const prefix = `${packageName}@`;
  const entry = Object.entries(lockfile.packages ?? {}).find(([key]) => {
    if (!key.startsWith(prefix)) return false;
    const packageReference = key.slice(prefix.length);
    return reference === packageReference || reference.startsWith(`${packageReference}(`);
  });
  assert.ok(entry, `${packageName} packed resolution is missing.`);
  const tarball = entry[1]?.resolution?.tarball;
  assert.equal(typeof tarball, "string", `${packageName} packed resolution has no tarball.`);
  assertPackedFileReference(packageName, tarball, expectedFile, lockfileDirectory);
}

function assertPackedFileReference(packageName, reference, expectedFile, lockfileDirectory) {
  assert.match(reference, /^file:/, `${packageName} does not use a packed resolution.`);
  const resolved = path.resolve(lockfileDirectory, reference.slice("file:".length));
  const normalize = (file) => {
    const value = path.normalize(file);
    return process.platform === "win32" ? value.toLowerCase() : value;
  };
  assert.equal(
    normalize(resolved),
    normalize(path.resolve(expectedFile)),
    `${packageName} packed resolution does not match ${expectedFile}.`,
  );
}

async function writeFixture(project) {
  const relativeFile = project.host === "astro" ? "src/pages/index.astro" : "src/App.jsx";
  const file = path.join(project.directory, relativeFile);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    project.host === "astro" ? getAstroPageFixture() : getViteAppFixture(),
    "utf8",
  );
}

export async function runWithTemporaryHostRoot({ keepTemp = false } = {}, operation) {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-cli-host-acceptance-"));
  let failed = false;
  console.log(`[cli-host] project root: ${root}`);
  try {
    return await operation(root);
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    if (shouldPreserveHostRoot({ failed, keepTemp })) {
      console.log(`[cli-host] preserved project root and logs: ${root}`);
    } else {
      await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 500 });
    }
  }
}

export async function runCliHostAcceptance({ keepTemp = false } = {}) {
  return runWithTemporaryHostRoot({ keepTemp }, async (root) => {
    const packsDirectory = path.join(root, "packs");
    let registry;

    try {
      const artifactManifest = await packPublicReleaseArtifacts({
        outputDirectory: packsDirectory,
      });
      const packages = Object.fromEntries(
        Object.entries(artifactManifest.packages).map(([key, entry]) => [
          key,
          path.join(packsDirectory, entry.file),
        ]),
      );
      const plan = createCliHostAcceptancePlan({ packages, root });
      const rootLogs = path.join(root, "logs");
      await writeFile(
        path.join(root, "package.json"),
        getCandidateWorkspacePackage(packages),
        "utf8",
      );
      await writeFile(
        path.join(root, "pnpm-workspace.yaml"),
        getCandidateWorkspacePolicy(plan.projects, packages),
        "utf8",
      );
      await runLoggedCommand("workspace-install", { args: ["install"], cwd: root }, rootLogs);
      registry = await startCandidateRegistry(await getRegistryEntries(packages));

      for (const project of plan.projects) {
        const logs = path.join(rootLogs, project.id);
        await runLoggedCommand("01-scaffold", project.scaffold, logs);
        await prepareManifest(project);
        await writeFile(
          path.join(project.directory, ".npmrc"),
          `@starwind-ui:registry=${registry.url}\n`,
          "utf8",
        );
        await writeFile(
          path.join(project.directory, "pnpm-workspace.yaml"),
          getCandidateWorkspacePolicy([project], packages),
          "utf8",
        );
        await runLoggedCommand("02-install", packageCommand(project.directory, ["install"]), logs);
        await runLoggedCommand("03-init", project.init, logs);
        await runLoggedCommand("04-add", project.add, logs);
        await writeFixture(project);
        await verifyPackedProvenance(project);
        await runLoggedCommand("05-check", project.check, logs);
        await runLoggedCommand("06-build", project.build, logs);
      }
      console.log("[cli-host] focused packed Astro and Vite host acceptance passed");
      return { root };
    } finally {
      await registry?.close();
    }
  });
}

async function main() {
  await runCliHostAcceptance(parseArgs(process.argv.slice(2)));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}
