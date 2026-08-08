#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const ANSI_PATTERN = /\x1b\[[0-?]*[ -/]*[@-~]/g;
const INTRO_TEXT = "Welcome to the Starwind CLI";
const OUTRO_TEXT = "Enjoy using Starwind UI";
const DEFAULT_COMMAND_TIMEOUT_MS = 180_000;
const LOCAL_DEPENDENCY_NOTE =
  "Project-local file: and HTTP CLI dependencies are unsuitable for this manual test because pnpm can rewrite the active shim during nested installs.";

export function createWindowsPackedCliPlan(root, packageUrl) {
  const createProject = (name) => {
    const directory = path.join(root, name);
    return {
      directory,
      shim: path.join(directory, "node_modules", ".bin", "starwind.CMD"),
    };
  };

  return {
    packageUrl,
    launcher: createProject("launcher"),
    projects: {
      add: createProject("add-driven"),
      standalone: createProject("standalone"),
    },
    tarball: path.join(root, "artifacts", "starwind-cli.tgz"),
  };
}

export function extractWindowsShimTarget(source) {
  const matches = [...source.matchAll(/node\s+"%~dp0\\([^"\r\n]+)"\s+%\*/g)];
  assert.ok(matches.length > 0, "Expected the pnpm Windows shim to invoke Starwind with Node.");
  return matches.at(-1)[1];
}

export function createPackedLifecycleArgs(packageUrl, args) {
  return ["dlx", packageUrl, ...args];
}

export function assertStableShim(before, after) {
  assert.equal(after.source, before.source, "pnpm rewrote the active Starwind command shim.");
  assert.equal(after.hash, before.hash, "The Starwind command shim hash changed during install.");
}

export function assertCleanLifecycle(
  result,
  { expectedIntro = 1, expectedOutro = 1, expectedSummary = 0 } = {},
) {
  const output = cleanOutput(`${result.stdout}\n${result.stderr}`);
  assert.equal(result.code, 0, output);
  assert.equal(countOccurrences(output, INTRO_TEXT), expectedIntro, output);
  assert.equal(countOccurrences(output, OUTRO_TEXT), expectedOutro, output);
  assert.equal(countOccurrences(output, "Installation Summary"), expectedSummary, output);
  assert.doesNotMatch(output, /['"]?(?:\.JS|S)['"]?\s+is not recognized/i);
  assert.doesNotMatch(output, /was unexpected at this time/i);
}

export async function runWindowsPackedCliSmoke() {
  if (process.platform !== "win32") {
    console.log("Windows packed CLI smoke skipped on a non-Windows host.");
    return;
  }

  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-windows-packed-cli-"));
  let succeeded = false;
  const diagnostics = [];

  try {
    const tarball = path.join(root, "artifacts", "starwind-cli.tgz");
    await mkdir(path.dirname(tarball), { recursive: true });
    await runRequired({
      ...createPnpmInvocation(["pack", "--out", tarball]),
      cwd: path.join(REPO_ROOT, "packages", "cli"),
    });

    const server = await startTarballServer(tarball);
    const packageUrl = `http://127.0.0.1:${server.port}/starwind-cli.tgz`;
    const plan = createWindowsPackedCliPlan(root, packageUrl);

    try {
      for (const project of Object.values(plan.projects)) {
        await createAstroProject(project.directory);
        await runRequired({ ...createPnpmInvocation(["install"]), cwd: project.directory });
      }
      await createLauncherProject(plan.launcher.directory, packageUrl);
      await runRequired({ ...createPnpmInvocation(["install"]), cwd: plan.launcher.directory });

      await verifyInvocationSurface(plan.launcher, diagnostics);
      await verifyStandaloneInit(plan.projects.standalone, packageUrl, diagnostics);
      await verifyAddDrivenInit(plan.projects.add, packageUrl, diagnostics);
    } finally {
      await server.close();
    }

    succeeded = true;
  } catch (error) {
    await writeFile(
      path.join(root, "diagnostics.json"),
      `${JSON.stringify(
        { error: formatError(error), manualTestingNote: LOCAL_DEPENDENCY_NOTE, runs: diagnostics },
        null,
        2,
      )}\n`,
      "utf8",
    );
    console.error(`[windows-packed-cli] diagnostics retained at ${root}`);
    throw error;
  } finally {
    if (succeeded) await rm(root, { recursive: true, force: true });
  }
}

async function verifyInvocationSurface(project, diagnostics) {
  const before = await readShim(project.shim);
  const successfulInvocations = [
    { name: "direct", command: project.shim, args: ["--version"] },
    { name: "pnpm-exec", ...createPnpmInvocation(["exec", "starwind", "--version"]) },
    {
      name: "package-script",
      ...createPnpmInvocation(["run", "starwind-command", "--version"]),
    },
  ];

  for (const invocation of successfulInvocations) {
    const result = await runCommand({ ...invocation, cwd: project.directory });
    diagnostics.push({ name: invocation.name, ...result });
    assert.equal(result.code, 0, `${invocation.name}\n${result.stdout}\n${result.stderr}`);
    assert.match(cleanOutput(`${result.stdout}\n${result.stderr}`), /3\.0\.0-beta\.7/);
  }

  const failingInvocations = [
    { name: "direct-failure", command: project.shim, args: ["missing-command"] },
    {
      name: "pnpm-exec-failure",
      ...createPnpmInvocation(["exec", "starwind", "missing-command"]),
    },
    {
      name: "package-script-failure",
      ...createPnpmInvocation(["run", "starwind-command", "missing-command"]),
    },
  ];

  for (const invocation of failingInvocations) {
    const result = await runCommand({ ...invocation, cwd: project.directory });
    diagnostics.push({ name: invocation.name, ...result });
    assert.notEqual(result.code, 0, `${invocation.name} lost the command's nonzero exit status.`);
    assert.match(cleanOutput(`${result.stdout}\n${result.stderr}`), /unknown command/i);
  }
  assertStableShim(before, await readShim(project.shim));
}

async function verifyStandaloneInit(project, packageUrl, diagnostics) {
  assert.equal(await pathExists(project.shim), false);
  const result = await runCommand({
    ...createPnpmInvocation(
      createPackedLifecycleArgs(packageUrl, ["init", "--defaults", "--astro"]),
    ),
    cwd: project.directory,
  });
  diagnostics.push({ name: "standalone-init", ...result });
  assertCleanLifecycle(result);
  assertValidConfig(await readFile(path.join(project.directory, "starwind.config.json"), "utf8"));
  assert.equal(await pathExists(project.shim), false, "The packed CLI became project-local.");
}

async function verifyAddDrivenInit(project, packageUrl, diagnostics) {
  assert.equal(await pathExists(project.shim), false);
  const result = await runCommand({
    ...createPnpmInvocation(
      createPackedLifecycleArgs(packageUrl, ["add", "button", "--yes", "--framework", "astro"]),
    ),
    cwd: project.directory,
  });
  diagnostics.push({ name: "add-driven-init", ...result });
  assertCleanLifecycle(result, { expectedSummary: 1 });
  assertValidConfig(await readFile(path.join(project.directory, "starwind.config.json"), "utf8"));
  assert.equal(await pathExists(project.shim), false, "The packed CLI became project-local.");
}

async function createAstroProject(directory) {
  // Keep the packed CLI outside the target project. pnpm can relink a project-local URL dependency
  // while init installs Runtime packages, which does not model a published registry dependency.
  await mkdir(path.join(directory, "src", "layouts"), { recursive: true });
  await writeFile(
    path.join(directory, "package.json"),
    `${JSON.stringify(
      {
        name: path.basename(directory),
        private: true,
        type: "module",
        dependencies: { astro: "7.0.0" },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(directory, "pnpm-workspace.yaml"),
    "packages: []\nminimumReleaseAge: 0\nminimumReleaseAgeStrict: false\nallowBuilds:\n  esbuild: true\n  sharp: true\n  unrs-resolver: true\n",
  );
  await writeFile(
    path.join(directory, "astro.config.mjs"),
    'import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n',
  );
  await writeFile(
    path.join(directory, "tsconfig.json"),
    '{ "extends": "astro/tsconfigs/strict" }\n',
  );
  await writeFile(path.join(directory, "src", "layouts", "Layout.astro"), "<slot />\n");
}

async function createLauncherProject(directory, packageUrl) {
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "package.json"),
    `${JSON.stringify(
      {
        name: "packed-cli-launcher",
        private: true,
        scripts: { "starwind-command": "starwind" },
        devDependencies: { starwind: packageUrl },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(directory, "pnpm-workspace.yaml"),
    "packages: []\nminimumReleaseAge: 0\nminimumReleaseAgeStrict: false\n",
  );
}

async function startTarballServer(tarball) {
  const tarballStat = await stat(tarball);
  const server = http.createServer((request, response) => {
    if (request.url !== "/starwind-cli.tgz") {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Length": tarballStat.size,
      "Content-Type": "application/octet-stream",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(tarball).pipe(response);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return {
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
    port: address.port,
  };
}

async function readShim(file) {
  const source = await readFile(file, "utf8");
  return { hash: createHash("sha256").update(source).digest("hex"), source };
}

async function pathExists(file) {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function createPnpmInvocation(args) {
  const pnpmCli = process.env.npm_execpath;
  return pnpmCli
    ? { command: process.execPath, args: [pnpmCli, ...args] }
    : { command: "pnpm.cmd", args };
}

async function runRequired(options) {
  const result = await runCommand(options);
  assert.equal(result.code, 0, `${options.command}\n${result.stdout}\n${result.stderr}`);
  return result;
}

export async function runCommand({ command, args, cwd, timeoutMs = DEFAULT_COMMAND_TIMEOUT_MS }) {
  assert.ok(timeoutMs > 0, "Command timeout must be greater than zero.");
  const spawned = createWindowsSpawnCommand(command, args);
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(spawned.command, spawned.args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let termination = Promise.resolve();
    const timeout = setTimeout(() => {
      timedOut = true;
      termination = terminateProcessTree(child.pid);
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
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
            [
              "Command exceeded its deadline.",
              `command: ${command} ${args.join(" ")}`,
              `cwd: ${cwd}`,
              `elapsed: ${Date.now() - startedAt}ms`,
              `deadline: ${timeoutMs}ms`,
              `stdout:\n${stdout}`,
              `stderr:\n${stderr}${terminationError}`,
            ].join("\n"),
          ),
        );
        return;
      }
      resolve({ code, stderr, stdout });
    });
  });
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

function createWindowsSpawnCommand(command, args) {
  if (command.toLowerCase().endsWith(".cmd")) {
    return {
      args: ["/d", "/s", "/c", [command, ...args].map(quoteWindowsCommandArg).join(" ")],
      command: process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
    };
  }
  return { args, command };
}

function quoteWindowsCommandArg(value) {
  if (/^[A-Za-z0-9._:/=@+\\-]+$/.test(value)) return value;
  if (/["&<>|^%!\r\n]/.test(value)) throw new Error(`Unsafe cmd.exe argument: ${value}`);
  return `"${value}"`;
}

function assertValidConfig(source) {
  const config = JSON.parse(source);
  assert.equal(config.version, 2);
  assert.equal(config.framework, "astro");
}

function cleanOutput(value) {
  return value.replace(ANSI_PATTERN, "");
}

function countOccurrences(value, expected) {
  return value.split(expected).length - 1;
}

function formatError(error) {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  runWindowsPackedCliSmoke().catch((error) => {
    console.error(formatError(error));
    process.exitCode = 1;
  });
}
