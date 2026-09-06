#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED_NODE_VERSION = "v22.12.0";
const ASTRO_SCAFFOLD_VERSION = "5.2.3";
const VITE_SCAFFOLD_VERSION = "9.1.1";
const DEFAULT_PACKAGES_DIRECTORY = ".release-packs";
const JAVASCRIPT_TYPECHECK_CONFIG = "tsconfig.starwind-acceptance.json";

const ASTRO_FIXTURE = `---
import "../styles/starwind.css";
import { Button } from "../components/starwind/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/starwind/dialog";
import { ColorPicker } from "../components/starwind/color-picker";
---

<html lang="en">
  <head><meta charset="utf-8" /><title>Node floor Astro consumer</title></head>
  <body>
    <Button type="button">Node floor button</Button>
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Node floor dialog</DialogTitle>
          <DialogDescription>Packed public package smoke.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    <ColorPicker label="Node floor color" defaultValue="#336699" />
  </body>
</html>
`;

const REACT_FIXTURE = `import { Button } from "./components/starwind/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/starwind/dialog";
import { ColorPicker } from "./components/starwind/color-picker";

export default function App() {
  return (
    <main>
      <Button type="button">Node floor button</Button>
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Node floor dialog</DialogTitle>
            <DialogDescription>Packed public package smoke.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <ColorPicker label="Node floor color" defaultValue="#336699" />
    </main>
  );
}
`;

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function getCliShim(root, platform = process.platform) {
  return path.join(
    root,
    "node_modules",
    ".bin",
    platform === "win32" ? "starwind.cmd" : "starwind",
  );
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

async function runCommand({ args, command = getNpmCommand(), cwd }, { capture = false } = {}) {
  const spawned = createSpawn(command, args);
  console.log(`[node-floor] ${path.basename(cwd)}: ${command} ${args.join(" ")}`);
  return await new Promise((resolve, reject) => {
    let stderr = "";
    let stdout = "";
    const child = spawn(spawned.command, spawned.args, {
      cwd,
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: "1",
        npm_config_audit: "false",
        npm_config_fund: "false",
      },
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    if (capture) {
      child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
      child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    }
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve({ stderr, stdout })
        : reject(
            new Error(
              `${command} ${args.join(" ")} failed in ${cwd} with exit code ${code}.${stderr ? `\n${stderr}` : ""}`,
            ),
          ),
    );
  });
}

export function assertExactNodeVersion(actual, expected = REQUIRED_NODE_VERSION) {
  if (actual !== expected) {
    throw new Error(
      `The public consumer smoke must run on exactly ${expected}; received ${actual}.`,
    );
  }
}

export function parseArgs(argv) {
  let keepTemp = false;
  let packagesDirectory = DEFAULT_PACKAGES_DIRECTORY;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--keep-temp") keepTemp = true;
    else if (argument === "--packages") {
      packagesDirectory = argv[index + 1];
      if (!packagesDirectory) throw new Error("Expected a path after --packages.");
      index += 1;
    } else if (argument.startsWith("--packages=")) {
      packagesDirectory = argument.slice("--packages=".length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { keepTemp, packagesDirectory: path.resolve(packagesDirectory) };
}

export function createNodeFloorPlan({ packagesDirectory, root, platform = process.platform }) {
  const cliShim = getCliShim(root, platform);
  const packageManager = platform === "win32" ? "npm.cmd" : "npm";
  const createProject = ({ framework, host, language, scaffoldArgs }) => {
    const directory = path.join(root, framework);
    return {
      add: {
        args: ["add", "button", "dialog", "color-picker", "--yes", "--package-manager", "npm"],
        command: cliShim,
        cwd: directory,
      },
      build: { args: ["run", "build"], command: packageManager, cwd: directory },
      directory,
      framework,
      host,
      init: { args: ["init", "--defaults"], command: cliShim, cwd: directory },
      language,
      scaffold: { args: scaffoldArgs, command: packageManager, cwd: root },
    };
  };

  return {
    cliShim,
    packageManager,
    packagesDirectory,
    projects: [
      createProject({
        framework: "astro",
        host: "astro",
        language: "astro",
        scaffoldArgs: [
          "create",
          `astro@${ASTRO_SCAFFOLD_VERSION}`,
          "--",
          "astro",
          "--template",
          "minimal",
          "--no-install",
          "--no-git",
          "--yes",
        ],
      }),
      createProject({
        framework: "react",
        host: "vite",
        language: "javascript",
        scaffoldArgs: [
          "create",
          `vite@${VITE_SCAFFOLD_VERSION}`,
          "--",
          "react",
          "--template",
          "react",
          "--no-interactive",
        ],
      }),
    ],
    requiredNodeVersion: REQUIRED_NODE_VERSION,
    root,
  };
}

function fileSpecifier(file) {
  return `file:${file.replaceAll("\\", "/")}`;
}

export async function loadArtifactManifest(packagesDirectory) {
  const manifest = JSON.parse(
    await readFile(path.join(packagesDirectory, "manifest.json"), "utf8"),
  );
  assert(
    manifest.schemaVersion === 1 || manifest.schemaVersion === 2,
    `Unsupported public artifact manifest schema: ${String(manifest.schemaVersion)}.`,
  );
  assert.match(manifest.builtWithNode, /^v24\./, "Public artifacts must be built under Node 24");
  const expectedNames = {
    astro: "@starwind-ui/astro",
    cli: "starwind",
    react: "@starwind-ui/react",
    runtime: "@starwind-ui/runtime",
  };
  for (const [key, name] of Object.entries(expectedNames)) {
    const entry = manifest.packages?.[key];
    assert.equal(entry?.name, name);
    assert.equal(typeof entry.version, "string");
    assert.equal(typeof entry.file, "string");
    const archive = path.join(packagesDirectory, entry.file);
    await access(archive);
    if (manifest.schemaVersion === 2) {
      assert.equal(typeof entry.sha256, "string", `${name} must record its archive SHA-256`);
      assert.match(entry.sha256, /^[a-f0-9]{64}$/, `${name} must record its archive SHA-256`);
      const actual = createHash("sha256")
        .update(await readFile(archive))
        .digest("hex");
      assert.equal(actual, entry.sha256, `${name} archive SHA-256 does not match its manifest`);
    }
  }
  return manifest;
}

export function getPackedProjectDependencies(project, packagesDirectory, artifactManifest) {
  const packageFile = (key) =>
    fileSpecifier(path.join(packagesDirectory, artifactManifest.packages[key].file));
  return {
    [`@starwind-ui/${project.framework}`]: packageFile(project.framework),
    "@starwind-ui/runtime": packageFile("runtime"),
  };
}

async function prepareProjectManifest(project, packagesDirectory, artifactManifest) {
  const manifestPath = path.join(project.directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const packedDependencies = getPackedProjectDependencies(
    project,
    packagesDirectory,
    artifactManifest,
  );
  if (project.framework === "astro") {
    manifest.dependencies = {
      ...manifest.dependencies,
      ...packedDependencies,
      astro: "7.0.0",
    };
    manifest.devDependencies = {
      ...manifest.devDependencies,
      "@astrojs/check": "^0.9.8",
      typescript: "^5.9.3",
    };
  } else {
    manifest.dependencies = {
      ...manifest.dependencies,
      ...packedDependencies,
      react: "19.2.0",
      "react-dom": "19.2.0",
    };
    manifest.devDependencies = {
      ...manifest.devDependencies,
      "@types/node": "^22.0.0",
      "@types/react": "^19.2.0",
      "@types/react-dom": "^19.2.0",
      typescript: "^5.9.3",
    };
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function writeFixture(project) {
  const relativePath = project.framework === "astro" ? "src/pages/index.astro" : "src/App.jsx";
  const target = path.join(project.directory, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, project.framework === "astro" ? ASTRO_FIXTURE : REACT_FIXTURE, "utf8");
}

export function getJavaScriptTypecheckConfig() {
  return {
    extends: "./tsconfig.json",
    compilerOptions: {
      allowArbitraryExtensions: true,
      allowJs: true,
      checkJs: true,
      jsx: "react-jsx",
      module: "ESNext",
      moduleResolution: "Bundler",
      noEmit: true,
      skipLibCheck: true,
      target: "ES2022",
    },
    include: ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"],
  };
}

async function writeJavaScriptTypecheckConfig(project) {
  if (project.language !== "javascript") return;
  await writeFile(
    path.join(project.directory, JAVASCRIPT_TYPECHECK_CONFIG),
    `${JSON.stringify(getJavaScriptTypecheckConfig(), null, 2)}\n`,
    "utf8",
  );
}

export function assertPackedPackageProvenance(
  project,
  packagesDirectory,
  artifactManifest,
  projectManifest,
  lockfile,
) {
  const expectedDependencies = getPackedProjectDependencies(
    project,
    packagesDirectory,
    artifactManifest,
  );
  for (const [packageName, expectedSpecifier] of Object.entries(expectedDependencies)) {
    assert.equal(projectManifest.dependencies?.[packageName], expectedSpecifier);
    const resolved = lockfile.packages?.[`node_modules/${packageName}`]?.resolved;
    assert.equal(typeof resolved, "string");
    assert.match(resolved, /^file:/);
    assert.equal(path.basename(resolved), path.basename(expectedSpecifier));
  }
}

async function validateInstalledPackages(project, packagesDirectory, artifactManifest) {
  const adapter = artifactManifest.packages[project.framework];
  const adapterManifest = JSON.parse(
    await readFile(
      path.join(
        project.directory,
        "node_modules",
        "@starwind-ui",
        project.framework,
        "package.json",
      ),
      "utf8",
    ),
  );
  const runtimeManifest = JSON.parse(
    await readFile(
      path.join(project.directory, "node_modules", "@starwind-ui", "runtime", "package.json"),
      "utf8",
    ),
  );
  const projectManifest = JSON.parse(
    await readFile(path.join(project.directory, "package.json"), "utf8"),
  );
  const lockfile = JSON.parse(
    await readFile(path.join(project.directory, "package-lock.json"), "utf8"),
  );
  assert.equal(adapterManifest.version, adapter.version);
  assert.equal(runtimeManifest.version, artifactManifest.packages.runtime.version);
  assertPackedPackageProvenance(
    project,
    packagesDirectory,
    artifactManifest,
    projectManifest,
    lockfile,
  );
}

export function getProjectCheck(project) {
  if (project.framework === "astro") {
    return {
      args: ["exec", "--", "astro", "check"],
      command: getNpmCommand(),
      cwd: project.directory,
    };
  }
  return {
    args: ["exec", "--", "tsc", "--project", JAVASCRIPT_TYPECHECK_CONFIG],
    command: getNpmCommand(),
    cwd: project.directory,
  };
}

export async function runNodeFloorSmoke({ keepTemp = false, packagesDirectory }) {
  assertExactNodeVersion(process.version);
  const artifactManifest = await loadArtifactManifest(packagesDirectory);
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-node-22-public-consumer-"));
  const plan = createNodeFloorPlan({ packagesDirectory, root });
  try {
    await writeFile(
      path.join(root, "package.json"),
      `${JSON.stringify(
        {
          devDependencies: {
            starwind: fileSpecifier(
              path.join(packagesDirectory, artifactManifest.packages.cli.file),
            ),
          },
          name: "starwind-node-22-public-consumer",
          private: true,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    await runCommand({ args: ["install"], cwd: root });
    const versionResult = await runCommand(
      { args: ["--version"], command: plan.cliShim, cwd: root },
      { capture: true },
    );
    assert.equal(versionResult.stdout.trim(), artifactManifest.packages.cli.version);

    for (const project of plan.projects) {
      await runCommand(project.scaffold);
      await prepareProjectManifest(project, packagesDirectory, artifactManifest);
      await runCommand({ args: ["install"], cwd: project.directory });
      await runCommand(project.init);
      await runCommand(project.add);
      await prepareProjectManifest(project, packagesDirectory, artifactManifest);
      await runCommand({ args: ["install"], cwd: project.directory });
      await writeFixture(project);
      await writeJavaScriptTypecheckConfig(project);
      await validateInstalledPackages(project, packagesDirectory, artifactManifest);
      await runCommand(getProjectCheck(project));
      await runCommand(project.build);
    }
    console.log("[node-floor] Node 22.12.0 packed public consumer smoke passed");
  } finally {
    if (keepTemp) console.log(`[node-floor] preserved temporary projects: ${root}`);
    else await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 500 });
  }
}

async function main() {
  await runNodeFloorSmoke(parseArgs(process.argv.slice(2)));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}
