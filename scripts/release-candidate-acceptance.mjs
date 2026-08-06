#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  runCommand,
  verifyBrowserProject,
  writeFixtures,
} from "./published-release-acceptance.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const VITE_SCAFFOLD_VERSION = "9.1.1";

function fileSpecifier(file) {
  return `file:${file.replaceAll("\\", "/")}`;
}

export function getCandidateMatrix() {
  return [
    {
      framework: "astro",
      frameworkVersion: "5.2.2",
      id: "astro-5",
      packageManager: "pnpm",
      scaffoldVersion: "5.2.2",
    },
    {
      framework: "astro",
      frameworkVersion: "7.0.0",
      id: "astro-7",
      packageManager: "pnpm",
      scaffoldVersion: "5.2.3",
    },
    { framework: "react", frameworkVersion: "18.3.1", id: "react-18", packageManager: "pnpm" },
    { framework: "react", frameworkVersion: "19.2.0", id: "react-19", packageManager: "pnpm" },
    {
      browser: false,
      framework: "react",
      frameworkVersion: "19.2.0",
      id: "react-19-npm",
      packageManager: "npm",
    },
  ];
}

export function getCandidateWorkspacePackage(packages) {
  return `${JSON.stringify(
    {
      devDependencies: { starwind: fileSpecifier(packages.cli) },
      name: "starwind-release-candidate-acceptance",
      private: true,
    },
    null,
    2,
  )}\n`;
}

function getScaffoldArgs(entry) {
  if (entry.framework === "astro") {
    return [
      "create",
      `astro@${entry.scaffoldVersion}`,
      entry.id,
      "--template",
      "minimal",
      "--no-install",
      "--no-git",
      "--yes",
    ];
  }

  return [
    "create",
    `vite@${VITE_SCAFFOLD_VERSION}`,
    entry.id,
    "--template",
    "react-ts",
    "--no-interactive",
  ];
}

export function createCandidatePlan({ packages, root }) {
  const cliEntrypoint = path.join(root, "node_modules", "starwind", "dist", "index.js");
  const projects = getCandidateMatrix().map((entry) => {
    const directory = path.join(root, entry.id);
    const command = entry.packageManager === "npm" ? "npm.cmd" : undefined;
    const packageManagerArgs = entry.packageManager === "npm" ? ["--package-manager", "npm"] : [];
    const cli = (args) => ({
      args: [cliEntrypoint, ...args],
      command: process.execPath,
      cwd: directory,
    });
    const packageCommand = (args) => ({ args, command, cwd: directory });

    return {
      ...entry,
      add: cli(["add", "--all", "--yes", ...packageManagerArgs]),
      browser: entry.browser ?? true,
      build: packageCommand(entry.packageManager === "npm" ? ["run", "build"] : ["build"]),
      check: packageCommand(
        entry.framework === "astro"
          ? ["exec", "astro", "check"]
          : entry.packageManager === "npm"
            ? ["exec", "tsc", "--", "--noEmit"]
            : ["exec", "tsc", "--noEmit"],
      ),
      directory,
      init: cli(["init", "--defaults"]),
      localAdapter: packages[entry.framework],
      remove: cli(["remove", "button", "--yes"]),
      scaffold: { args: getScaffoldArgs(entry), cwd: root },
      ssr:
        entry.framework === "react"
          ? packageCommand(
              entry.packageManager === "npm"
                ? [
                    "exec",
                    "vite",
                    "--",
                    "build",
                    "--ssr",
                    "src/acceptance-ssr.tsx",
                    "--outDir",
                    "dist-ssr",
                  ]
                : [
                    "exec",
                    "vite",
                    "build",
                    "--ssr",
                    "src/acceptance-ssr.tsx",
                    "--outDir",
                    "dist-ssr",
                  ],
            )
          : undefined,
      update: cli(["update", "button", "--yes", ...packageManagerArgs]),
    };
  });

  return { cliEntrypoint, packages, projects, root };
}

export function getCandidateWorkspacePolicy(_projects, packages) {
  return `packages: []\nminimumReleaseAge: 0\nminimumReleaseAgeStrict: false\nallowBuilds:\n  esbuild: true\n  sharp: true\noverrides:\n  "@starwind-ui/astro": "${fileSpecifier(packages.astro)}"\n  "@starwind-ui/react": "${fileSpecifier(packages.react)}"\n  "@starwind-ui/runtime": "${fileSpecifier(packages.runtime)}"\n  starwind: "${fileSpecifier(packages.cli)}"\n`;
}

async function prepareProjectManifest(project) {
  const manifestPath = path.join(project.directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (project.framework === "astro") {
    manifest.dependencies = { ...manifest.dependencies, astro: project.frameworkVersion };
    manifest.devDependencies = {
      ...manifest.devDependencies,
      "@astrojs/check": "^0.9.8",
      typescript: "^5.9.3",
    };
  } else {
    manifest.dependencies = {
      ...manifest.dependencies,
      react: project.frameworkVersion,
      "react-dom": project.frameworkVersion,
    };
    const typeVersion = project.frameworkVersion.startsWith("18.") ? "^18.3.0" : "^19.2.0";
    manifest.devDependencies = {
      ...manifest.devDependencies,
      "@types/react": typeVersion,
      "@types/react-dom": typeVersion,
    };
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

const SSR_FIXTURE = `import { renderToString } from "react-dom/server";
import { ColorPicker } from "./components/starwind/color-picker";

const html = renderToString(
  <ColorPicker id="acceptance-ssr-color-picker" label="SSR color" defaultValue="#336699" />,
);
if (!html.includes("acceptance-ssr-color-picker") || !html.includes("data-sw-color-picker")) {
  throw new Error("React Color Picker SSR output is incomplete");
}
console.log("React Color Picker SSR passed");
`;

async function writeSsrFixture(project) {
  if (!project.ssr) return;
  await writeFile(path.join(project.directory, "src", "acceptance-ssr.tsx"), SSR_FIXTURE, "utf8");
}

async function packWorkspacePackages(packDirectory) {
  await mkdir(packDirectory, { recursive: true });
  const packages = {
    astro: path.join(packDirectory, "starwind-astro.tgz"),
    cli: path.join(packDirectory, "starwind-cli.tgz"),
    react: path.join(packDirectory, "starwind-react.tgz"),
    runtime: path.join(packDirectory, "starwind-runtime.tgz"),
  };
  const packageDirectories = {
    astro: "packages/astro",
    cli: "packages/cli",
    react: "packages/react",
    runtime: "packages/runtime",
  };

  for (const name of ["runtime", "astro", "react", "cli"]) {
    await runCommand({
      args: ["pack", "--out", packages[name]],
      cwd: path.join(REPO_ROOT, packageDirectories[name]),
    });
  }
  return packages;
}

async function installNpmCandidatePackages(project, packages) {
  await runCommand({ args: ["install"], command: "npm.cmd", cwd: project.directory });
  await runCommand(project.init);
  await runCommand({
    args: ["install", packages.runtime, project.localAdapter, "--save-exact"],
    command: "npm.cmd",
    cwd: project.directory,
  });
}

async function validateCandidateAdapter(project) {
  const packageName = `@starwind-ui/${project.framework}`;
  const manifest = JSON.parse(
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
  assert.equal(manifest.name, packageName);

  if (project.packageManager === "npm") {
    const lock = await readFile(path.join(project.directory, "package-lock.json"), "utf8");
    assert.match(lock, /starwind-react\.tgz/);
    assert.match(lock, /starwind-runtime\.tgz/);
  }
}

async function runProjectLifecycle(project, plan) {
  if (project.packageManager === "npm") {
    await installNpmCandidatePackages(project, plan.packages);
  } else {
    await runCommand(project.init);
  }

  await runCommand(project.add);
  await runCommand(project.update);
  await runCommand(project.remove);
  await runCommand({
    args: [
      plan.cliEntrypoint,
      "add",
      "button",
      "--yes",
      ...(project.packageManager === "npm" ? ["--package-manager", "npm"] : []),
    ],
    command: process.execPath,
    cwd: project.directory,
  });
  await writeFixtures(project);
  await writeSsrFixture(project);
  await validateCandidateAdapter(project);
  await runCommand(project.check);
  await runCommand(project.build);

  if (project.ssr) {
    await runCommand(project.ssr);
    await runCommand({
      args: [path.join(project.directory, "dist-ssr", "acceptance-ssr.js")],
      command: process.execPath,
      cwd: project.directory,
    });
  }
}

export async function runReleaseCandidateAcceptance({
  artifacts: artifactsOption,
  keepTemp = false,
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-release-candidate-"));
  const artifacts = artifactsOption
    ? path.resolve(artifactsOption)
    : await mkdtemp(path.join(os.tmpdir(), "starwind-release-candidate-artifacts-"));
  const packages = await packWorkspacePackages(path.join(root, "packs"));
  const plan = createCandidatePlan({ packages, root });
  let browser;

  await mkdir(artifacts, { recursive: true });
  await writeFile(path.join(root, "package.json"), getCandidateWorkspacePackage(packages), "utf8");
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    getCandidateWorkspacePolicy(plan.projects, packages),
    "utf8",
  );
  console.log(`[candidate] temporary projects: ${root}`);
  console.log(`[candidate] diagnostic artifacts: ${artifacts}`);

  try {
    for (const project of plan.projects) {
      await runCommand(project.scaffold);
      await prepareProjectManifest(project);
      if (project.packageManager === "pnpm") {
        await writeFile(
          path.join(project.directory, "pnpm-workspace.yaml"),
          getCandidateWorkspacePolicy([project], packages),
          "utf8",
        );
      }
    }
    await runCommand({ args: ["install"], cwd: root });

    for (const project of plan.projects.filter((entry) => entry.packageManager === "pnpm")) {
      await runCommand({ args: ["install"], cwd: project.directory });
    }

    for (const project of plan.projects) await runProjectLifecycle(project, plan);

    const reactDemoRequire = createRequire(path.join(REPO_ROOT, "apps/react-demo/package.json"));
    const { chromium } = reactDemoRequire("playwright");
    browser = await chromium.launch({ headless: true });
    for (const project of plan.projects.filter((candidate) => candidate.browser)) {
      await verifyBrowserProject({ artifacts, browser, project });
    }

    const summary = plan.projects.map(({ framework, frameworkVersion, id, packageManager }) => ({
      framework,
      frameworkVersion,
      id,
      packageManager,
    }));
    await writeFile(path.join(artifacts, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    console.log("[candidate] packed Astro and React release candidate matrix passed");
    return { artifacts, summary };
  } finally {
    await browser?.close();
    if (keepTemp) console.log(`[candidate] preserved temporary projects: ${root}`);
    else await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 500 });
  }
}

function parseArgs(argv) {
  let artifacts;
  let keepTemp = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--keep-temp") keepTemp = true;
    else if (argument === "--artifacts") {
      artifacts = argv[index + 1];
      if (!artifacts) throw new Error("Expected a path after --artifacts.");
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return { artifacts, keepTemp };
}

async function main() {
  await runReleaseCandidateAcceptance(parseArgs(process.argv.slice(2)));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}
