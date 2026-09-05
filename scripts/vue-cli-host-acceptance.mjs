#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

import { runLoggedCommand } from "./cli-host-acceptance.mjs";
import { startCandidateRegistry } from "./release-candidate-acceptance.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const ASTRO_SCAFFOLD_VERSION = "5.2.3";
const ASTRO_VERSION = "7.0.0";
const VITE_SCAFFOLD_VERSION = "9.1.1";
const VUE_VERSION = "3.5.39";
const NUXT_3_VERSION = "3.21.0";
const NUXT_4_VERSION = "4.2.0";
const QUASAR_APP_VERSION = "3.0.0";
const VUE_BETA_REGISTRY_VERSION = "0.1.0";
const HOST = "127.0.0.1";
const PRIVATE_PACKAGES = [
  {
    directory: "packages/runtime",
    fileName: "starwind-runtime.tgz",
    key: "runtime",
    name: "@starwind-ui/runtime",
  },
  {
    directory: "packages/vue",
    fileName: "starwind-vue.tgz",
    key: "vue",
    name: "@starwind-ui/vue",
  },
  {
    directory: "packages/cli",
    fileName: "starwind-cli.tgz",
    key: "cli",
    name: "starwind",
  },
];

function packageCommand(directory, args) {
  return { args, cwd: directory };
}

function fileSpecifier(file) {
  return `file:${file.replaceAll("\\", "/")}`;
}

export function createVueBetaPackPlan({ outputDirectory }) {
  return {
    outputDirectory,
    packages: PRIVATE_PACKAGES.map((entry) => ({
      ...entry,
      directory: path.join(REPO_ROOT, entry.directory),
      file: path.join(outputDirectory, entry.fileName),
    })),
  };
}

/** @deprecated Use createVueBetaPackPlan. */
export const createPrivateVuePackPlan = createVueBetaPackPlan;

export function createVueLocalLinkAcceptancePlan({ root }) {
  const pnpmHome = path.join(root, "pnpm-global");
  return {
    builds: ["runtime:build", "vue:build", "cli:build"],
    cleanup: ["ul", "vue:unlink", "runtime:unlink", "cli:unlink"],
    consumerDirectory: path.join(root, "linked-consumer"),
    globalDirectory: path.join(pnpmHome, "global"),
    links: ["runtime:link", "vue:link", "cli:link"],
    pnpmHome,
  };
}

function createBaselineVueCliHostAcceptancePlan({ packages, root }) {
  const packedDependencies = {
    "@starwind-ui/runtime": packages.runtime,
    "@starwind-ui/vue": packages.vue,
    starwind: packages.cli,
  };
  const viteDirectory = path.join(root, "vite-vue");
  const astroDirectory = path.join(root, "astro-vue");

  return {
    packages,
    projects: [
      {
        browser: { buttonName: "Toggle acceptance", resultText: "Runtime panel content" },
        build: packageCommand(viteDirectory, ["build"]),
        check: packageCommand(viteDirectory, [
          "exec",
          "vue-tsc",
          "--noEmit",
          "--project",
          "tsconfig.app.json",
        ]),
        directory: viteDirectory,
        framework: "vue",
        host: "vite",
        id: "vite-vue",
        sourceIsolationFiles: [
          "vite.config.ts",
          "tsconfig.json",
          "tsconfig.app.json",
          "src/main.ts",
          "src/App.vue",
          "starwind.config.json",
        ],
        lifecycle: [
          "init",
          "repeat-init",
          "search",
          "styled-add",
          "styled-update",
          "styled-remove",
          "styled-re-add",
          "primitive-add",
        ],
        packedDependencies,
        preview: {
          args: ["--host", "{host}", "--port", "{port}"],
          script: "preview",
        },
        primitiveDir: "src/components/starwind-primitives",
        registryDependencies: [
          "@tailwindcss/forms",
          "@tailwindcss/vite",
          "@vitejs/plugin-vue",
          "tailwindcss",
          "tw-animate-css",
          "vite",
          "vue",
        ],
        scaffold: {
          args: [
            "create",
            `vite@${VITE_SCAFFOLD_VERSION}`,
            "vite-vue",
            "--template",
            "vue-ts",
            "--no-interactive",
          ],
          cwd: root,
        },
        styledDir: "src/components/starwind",
      },
      {
        browser: { buttonName: "Toggle acceptance", resultText: "Runtime panel content" },
        build: packageCommand(astroDirectory, ["build"]),
        check: packageCommand(astroDirectory, ["exec", "astro", "check"]),
        directory: astroDirectory,
        framework: "vue",
        host: "astro",
        id: "astro-vue",
        sourceIsolationFiles: [
          "astro.config.mjs",
          "tsconfig.json",
          "src/pages/index.astro",
          "src/components/Acceptance.vue",
          "starwind.config.json",
        ],
        lifecycle: [
          "init",
          "repeat-init",
          "search",
          "styled-add",
          "styled-update",
          "styled-remove",
          "styled-re-add",
          "primitive-add",
        ],
        packedDependencies,
        preview: {
          args: ["--host", "{host}", "--port", "{port}"],
          script: "preview",
        },
        primitiveDir: "src/components/starwind-vue-primitives",
        registryDependencies: [
          "@astrojs/vue",
          "@tailwindcss/forms",
          "@tailwindcss/vite",
          "astro",
          "tailwindcss",
          "tw-animate-css",
          "vue",
        ],
        scaffold: {
          args: [
            "create",
            `astro@${ASTRO_SCAFFOLD_VERSION}`,
            "astro-vue",
            "--template",
            "minimal",
            "--no-install",
            "--no-git",
            "--yes",
          ],
          cwd: root,
        },
        styledDir: "src/components/starwind-vue",
      },
    ],
    root,
  };
}

export function getVueFixture(project, sourceDirectory) {
  const styled = `./${path
    .relative(sourceDirectory, project.styledDir)
    .replaceAll("\\", "/")}/collapsible`;
  const primitive = `./${path
    .relative(sourceDirectory, project.primitiveDir)
    .replaceAll("\\", "/")}/button`;
  return `<script setup lang="ts">
import { ref } from "vue";
import { getThemeInitScript } from "@starwind-ui/vue/theme";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "${styled}";
import { ButtonRoot } from "${primitive}";

const open = ref(false);
const themePayloadLength = getThemeInitScript().length;
</script>

<template>
  <main :data-theme-payload-length="themePayloadLength">
    <Collapsible v-model:open="open">
      <CollapsibleTrigger>Toggle acceptance</CollapsibleTrigger>
      <CollapsibleContent>Runtime panel content</CollapsibleContent>
    </Collapsible>
    <ButtonRoot data-testid="primitive-button">Vendored primitive</ButtonRoot>
    <output data-testid="open-state">{{ open ? "open" : "closed" }}</output>
  </main>
</template>
`;
}

export function getViteVueFixture(project) {
  return getVueFixture(project, "src");
}

export function getAstroVueFixture(project) {
  return getVueFixture(project, "src/components");
}

export function getAstroPageFixture() {
  return `---
import Acceptance from "../components/Acceptance.vue";
import "../styles/starwind.css";
---

<Acceptance client:load />
`;
}

export function shouldPreserveVueHostRoot({ failed, keepTemp }) {
  return failed || keepTemp;
}

export function parseArgs(argv) {
  let keepTemp = false;
  let localLinkOnly = false;
  const projectIds = [];
  let rootDirectory;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--keep-temp") keepTemp = true;
    else if (argument === "--local-link-only") localLinkOnly = true;
    else if (argument === "--project") {
      const projectId = argv[index + 1];
      if (!projectId) throw new Error("Expected an id after --project.");
      projectIds.push(projectId);
      index += 1;
    } else if (argument.startsWith("--project=")) projectIds.push(argument.slice(10));
    else if (argument === "--root") {
      rootDirectory = argv[index + 1];
      if (!rootDirectory) throw new Error("Expected a path after --root.");
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return {
    keepTemp,
    localLinkOnly,
    projectIds: projectIds.length > 0 ? projectIds : undefined,
    rootDirectory,
  };
}

export function assertPackedVueHostProvenance({
  expected,
  installed,
  lockfile,
  lockfileDirectory,
}) {
  const parsed = parseYaml(lockfile);
  const importer = parsed.importers?.["."];
  assert.ok(importer, "The project pnpm importer is missing.");
  const packageEntries = Object.entries(parsed.packages ?? {});
  const snapshotEntries = Object.entries(parsed.snapshots ?? {});
  const expectedEntries = Object.entries(expected);
  const snapshotMatches = new Map();

  for (const [packageName, packed] of expectedEntries) {
    assert.equal(installed[packageName]?.name, packageName, `${packageName} installed name`);
    assert.equal(
      installed[packageName]?.version,
      packed.version,
      `${packageName} installed version`,
    );

    const dependency =
      importer.dependencies?.[packageName] ?? importer.devDependencies?.[packageName];
    if (packed.direct !== false) {
      assert.ok(dependency, `${packageName} is missing from the pnpm importer.`);
      assert.ok(
        matchesPackedFile(dependency.version, packed.file, lockfileDirectory),
        `${packageName} importer version does not resolve to ${packed.file}.`,
      );
      if (typeof dependency.specifier === "string" && dependency.specifier.startsWith("file:")) {
        assert.ok(
          matchesPackedFile(dependency.specifier, packed.file, lockfileDirectory),
          `${packageName} importer specifier does not resolve to ${packed.file}.`,
        );
      }
    }

    const ownedPackages = packageEntries.filter(
      ([, entry]) =>
        entry &&
        typeof entry === "object" &&
        matchesPackedFile(entry.resolution?.tarball, packed.file, lockfileDirectory),
    );
    assert.equal(
      ownedPackages.length,
      1,
      `${packageName} must have exactly one package resolution for ${packed.file}.`,
    );
    assert.ok(
      ownedPackages[0][0].startsWith(`${packageName}@`),
      `${packageName} package resolution is owned by ${ownedPackages[0][0]}.`,
    );
    assert.ok(
      matchesPackedFile(ownedPackages[0][0], packed.file, lockfileDirectory),
      `${packageName} package key does not resolve to ${packed.file}.`,
    );

    const ownedSnapshots = snapshotEntries.filter(([key]) =>
      matchesPackedFile(key, packed.file, lockfileDirectory),
    );
    assert.equal(
      ownedSnapshots.length,
      1,
      `${packageName} must have exactly one package snapshot for ${packed.file}.`,
    );
    assert.ok(
      ownedSnapshots[0][0].startsWith(`${packageName}@`),
      `${packageName} snapshot is owned by ${ownedSnapshots[0][0]}.`,
    );
    snapshotMatches.set(packageName, ownedSnapshots[0]);
  }

  const runtime = expected["@starwind-ui/runtime"];
  const vueSnapshot = snapshotMatches.get("@starwind-ui/vue")?.[1];
  assert.ok(runtime && vueSnapshot, "The Runtime or Vue structural provenance entry is missing.");
  assert.ok(
    matchesPackedFile(
      vueSnapshot.dependencies?.["@starwind-ui/runtime"],
      runtime.file,
      lockfileDirectory,
    ),
    "The Vue snapshot does not resolve its Runtime dependency to the expected tarball.",
  );

  for (const location of collectFileReferenceLocations(parsed)) {
    const match = expectedEntries.find(([, packed]) =>
      matchesPackedFile(location.value, packed.file, lockfileDirectory),
    );
    if (!match) continue;
    const [packageName] = match;
    assert.ok(
      ["overrides", "importers", "packages", "snapshots"].includes(location.path[0]),
      `${packageName} has an orphaned lockfile reference at ${location.path.join(".")}.`,
    );
    assert.ok(
      location.path.some(
        (segment) => segment === packageName || segment.startsWith(`${packageName}@`),
      ),
      `${packageName} lockfile reference is associated with ${location.path.join(".")}.`,
    );
  }
}

function collectFileReferenceLocations(value, pathSegments = [], locations = []) {
  if (!value || typeof value !== "object") return locations;
  for (const [key, entry] of Object.entries(value)) {
    const nextPath = [...pathSegments, key];
    if (key.includes("file:")) locations.push({ path: nextPath, value: key });
    if (typeof entry === "string" && entry.includes("file:")) {
      locations.push({ path: nextPath, value: entry });
    } else if (entry && typeof entry === "object") {
      collectFileReferenceLocations(entry, nextPath, locations);
    }
  }
  return locations;
}

function matchesPackedFile(value, file, lockfileDirectory) {
  if (typeof value !== "string") return false;
  const marker = value.indexOf("file:");
  if (marker === -1) return false;
  const reference = value.slice(marker).replace(/(\.tgz)\(.*$/, "$1");
  return samePath(path.resolve(lockfileDirectory, reference.slice("file:".length)), file);
}

function samePath(left, right) {
  const normalize = (value) => {
    const normalized = path.normalize(path.resolve(value));
    return process.platform === "win32" ? normalized.toLowerCase() : normalized;
  };
  return normalize(left) === normalize(right);
}

export async function runWithTemporaryVueHostRoot(
  { keepTemp = false, rootDirectory } = {},
  operation,
) {
  const root = rootDirectory
    ? path.resolve(rootDirectory)
    : await mkdtemp(path.join(os.tmpdir(), "starwind-vue-cli-host-acceptance-"));
  if (rootDirectory) await mkdir(root, { recursive: true });
  let failed = false;
  console.log(`[vue-cli-host] project root: ${root}`);
  try {
    return await operation(root);
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    if (shouldPreserveVueHostRoot({ failed, keepTemp })) {
      console.log(`[vue-cli-host] preserved project root and logs: ${root}`);
    } else {
      await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 500 });
    }
  }
}

export async function runCleanupOperations(operations) {
  const failures = [];
  for (const operation of operations) {
    try {
      await operation();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "Multiple cleanup operations failed.");
}

export async function runWithCleanup(operation, cleanupOperations) {
  let operationError;
  let result;
  try {
    result = await operation();
  } catch (error) {
    operationError = error;
  }

  let cleanupError;
  try {
    await runCleanupOperations(cleanupOperations);
  } catch (error) {
    cleanupError = error;
  }

  if (operationError && cleanupError) {
    throw new AggregateError([operationError, cleanupError], "Operation and cleanup failed.");
  }
  if (operationError) throw operationError;
  if (cleanupError) throw cleanupError;
  return result;
}

function createIsolatedPnpmEnvironment(plan) {
  const pathValue = [plan.pnpmHome, path.join(plan.pnpmHome, "bin"), process.env.PATH]
    .filter(Boolean)
    .join(path.delimiter);
  return {
    PATH: pathValue,
    PNPM_HOME: plan.pnpmHome,
    XDG_CONFIG_HOME: path.join(plan.pnpmHome, "xdg-config"),
    XDG_DATA_HOME: path.join(plan.pnpmHome, "xdg-data"),
  };
}

async function withProcessEnvironment(environment, operation) {
  const original = new Map();
  for (const [key, value] of Object.entries(environment)) {
    original.set(key, process.env[key]);
    process.env[key] = value;
  }
  try {
    return await operation();
  } finally {
    for (const [key, value] of original) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function findGlobalLinkedPackageDirectories(globalDirectory, packageName) {
  const packageSegments = packageName.split("/");
  const matches = [];

  async function visit(directory, depth) {
    if (depth > 4) return;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const entryPath = path.join(directory, entry.name);
      if (entry.name === "node_modules") {
        const candidate = path.join(entryPath, ...packageSegments);
        try {
          await access(candidate);
          matches.push(candidate);
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
      } else if (entry.name !== "store") {
        await visit(entryPath, depth + 1);
      }
    }
  }

  await visit(globalDirectory, 0);
  return matches;
}

async function getGlobalLinkedPackageDirectory(plan, packageName) {
  const matches = await findGlobalLinkedPackageDirectories(plan.globalDirectory, packageName);
  assert.equal(matches.length, 1, `${packageName} must have one isolated global link.`);
  return matches[0];
}

async function assertGlobalLinksRemoved(plan) {
  for (const packageName of ["@starwind-ui/runtime", "@starwind-ui/vue", "starwind"]) {
    assert.deepEqual(
      await findGlobalLinkedPackageDirectories(plan.globalDirectory, packageName),
      [],
      `${packageName} global link remains after cleanup.`,
    );
  }
}

export async function runVueLocalLinkAcceptance({ root, runCommand = runLoggedCommand }) {
  const plan = createVueLocalLinkAcceptancePlan({ root });
  const logsDirectory = path.join(root, "logs", "local-link");
  const environment = createIsolatedPnpmEnvironment(plan);
  const run = (phase, commandPlan) =>
    withProcessEnvironment(environment, () => runCommand(phase, commandPlan, logsDirectory));

  await runWithCleanup(async () => {
    for (const script of plan.builds) {
      await run(`build-${script}`, packageCommand(REPO_ROOT, [script]));
    }
    for (const script of plan.links) {
      await run(`link-${script}`, packageCommand(REPO_ROOT, [script]));
    }

    const linkedPackages = {};
    for (const [key, packageName, packageDirectory] of [
      ["runtime", "@starwind-ui/runtime", "packages/runtime"],
      ["vue", "@starwind-ui/vue", "packages/vue"],
      ["cli", "starwind", "packages/cli"],
    ]) {
      const globalPackage = await getGlobalLinkedPackageDirectory(plan, packageName);
      assert.ok(
        samePath(await realpath(globalPackage), path.join(REPO_ROOT, packageDirectory)),
        `${packageName} global link points outside its repository package.`,
      );
      linkedPackages[key] = globalPackage;
    }

    await mkdir(plan.consumerDirectory, { recursive: true });
    await writeFile(
      path.join(plan.consumerDirectory, "package.json"),
      `${JSON.stringify(
        {
          dependencies: { vue: VUE_VERSION },
          name: "starwind-vue-local-link-consumer",
          private: true,
          type: "module",
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    await run("consumer-install", packageCommand(plan.consumerDirectory, ["install"]));
    for (const [key, packageDirectory] of Object.entries(linkedPackages)) {
      await run(
        `consumer-link-${key}`,
        packageCommand(plan.consumerDirectory, ["link", packageDirectory]),
      );
    }

    for (const [packageName, packageDirectory] of [
      ["@starwind-ui/runtime", "packages/runtime"],
      ["@starwind-ui/vue", "packages/vue"],
      ["starwind", "packages/cli"],
    ]) {
      const installed = path.join(
        plan.consumerDirectory,
        "node_modules",
        ...packageName.split("/"),
      );
      assert.ok(
        samePath(await realpath(installed), path.join(REPO_ROOT, packageDirectory)),
        `${packageName} consumer link does not resolve to its built package.`,
      );
    }

    await run("consumer-imports", {
      args: [
        "--input-type=module",
        "--eval",
        'const vue = await import("@starwind-ui/vue/button"); const runtime = await import("@starwind-ui/runtime/button"); if (typeof vue.ButtonRoot !== "object" || typeof runtime.createButton !== "function") process.exit(1);',
      ],
      command: process.execPath,
      cwd: plan.consumerDirectory,
    });
    await run(
      "consumer-cli",
      packageCommand(plan.consumerDirectory, ["exec", "starwind", "--version"]),
    );

    const consumerManifest = await readFile(
      path.join(plan.consumerDirectory, "package.json"),
      "utf8",
    );
    assert.ok(!consumerManifest.includes("workspace:"));
    assert.ok(!consumerManifest.includes("portal:"));
    assert.ok(!consumerManifest.includes(REPO_ROOT.replaceAll("\\", "/")));
  }, [
    ...plan.cleanup.map(
      (script) => () => run(`cleanup-${script}`, packageCommand(REPO_ROOT, [script])),
    ),
    () => assertGlobalLinksRemoved(plan),
  ]);
  console.log("[vue-cli-host] isolated Runtime, Vue, and CLI local-link acceptance passed");
}

export function getVueBetaPackVersion(key, version) {
  return key === "vue" ? VUE_BETA_REGISTRY_VERSION : version;
}

async function packVueBetaPackages(outputDirectory, logsDirectory) {
  const plan = createVueBetaPackPlan({ outputDirectory });
  await mkdir(outputDirectory, { recursive: true });
  const packages = {};
  const manifests = {};
  for (const entry of plan.packages) {
    let packageDirectory = entry.directory;
    const manifest = JSON.parse(
      await readFile(path.join(packageDirectory, "package.json"), "utf8"),
    );
    const plannedVersion = getVueBetaPackVersion(entry.key, manifest.version);
    if (plannedVersion !== manifest.version) {
      packageDirectory = path.join(outputDirectory, "staged", entry.key);
      await cp(entry.directory, packageDirectory, {
        filter: (source) => path.basename(source) !== "node_modules",
        recursive: true,
      });
      manifest.version = plannedVersion;
      await writeFile(
        path.join(packageDirectory, "package.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
      );
    }
    assert.equal(manifest.name, entry.name);
    assert.equal(typeof manifest.version, "string");
    await runLoggedCommand(
      `pack-${entry.key}`,
      { args: ["pack", "--out", entry.file], cwd: packageDirectory },
      logsDirectory,
    );
    packages[entry.key] = entry.file;
    manifests[entry.key] = manifest;
  }
  return { manifests, packages };
}

function getWorkspacePolicy(packages) {
  return `packages: []
minimumReleaseAge: 0
minimumReleaseAgeStrict: false
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
overrides:
  "@starwind-ui/runtime": "${fileSpecifier(packages.runtime)}"
  "@starwind-ui/vue": "${fileSpecifier(packages.vue)}"
  "starwind": "${fileSpecifier(packages.cli)}"
`;
}

async function prepareManifest(project, packages, registryUrl) {
  const manifestFile = path.join(project.directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.devDependencies = {
    ...manifest.devDependencies,
    starwind: fileSpecifier(packages.cli),
    typescript: "^5.9.3",
  };
  if (project.host === "astro") {
    manifest.dependencies = { ...manifest.dependencies, astro: ASTRO_VERSION, vue: VUE_VERSION };
    manifest.devDependencies["@astrojs/check"] = "^0.9.8";
  } else {
    manifest.dependencies = { ...manifest.dependencies, vue: VUE_VERSION };
    manifest.devDependencies["@types/node"] ??= "^24.0.0";
    manifest.devDependencies["vue-tsc"] ??= "^3.1.8";
  }
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(project.directory, "pnpm-workspace.yaml"),
    getWorkspacePolicy(packages),
    "utf8",
  );
  await writeFile(
    path.join(project.directory, ".npmrc"),
    `@starwind-ui:registry=${registryUrl}\n`,
    "utf8",
  );
}

async function loadProductionCapability() {
  const [
    initModule,
    addModule,
    updateModule,
    removeModule,
    primitivesModule,
    policyModule,
    searchModule,
  ] = await Promise.all([
    import("../packages/cli/src/commands/init.ts"),
    import("../packages/cli/src/commands/add.ts"),
    import("../packages/cli/src/commands/update.ts"),
    import("../packages/cli/src/commands/remove.ts"),
    import("../packages/cli/src/commands/primitives.ts"),
    import("../packages/cli/src/utils/framework-target-policy.ts"),
    import("../packages/cli/src/commands/search.ts"),
  ]);
  const [registry, artifacts] = await Promise.all([
    readFile(path.join(REPO_ROOT, "packages/cli/src/registry/bundled-registry.json"), "utf8").then(
      JSON.parse,
    ),
    readFile(
      path.join(REPO_ROOT, "packages/cli/src/registry/primitive-vendoring-artifacts.json"),
      "utf8",
    ).then(JSON.parse),
  ]);
  assert.equal(registry.setup.vue.adapterPackage.range, "0.1.0");
  return {
    add: addModule.add,
    artifacts,
    init: initModule.init,
    primitivesAdd: primitivesModule.primitivesAdd,
    registry,
    remove: removeModule.remove,
    search: searchModule.search,
    targetPolicy: policyModule.PUBLIC_FRAMEWORK_TARGET_POLICY,
    update: updateModule.update,
  };
}

async function runProductionPhase(project, logsDirectory, phase, operation) {
  const originalDirectory = process.cwd();
  const originalExit = process.exit;
  const logFile = path.join(logsDirectory, `${phase}.log`);
  await mkdir(logsDirectory, { recursive: true });
  process.exit = (code) => {
    throw new Error(`Production CLI phase ${phase} requested process exit ${code ?? 0}.`);
  };
  process.chdir(project.directory);
  try {
    await operation();
    await writeFile(logFile, `phase: ${phase}\nstatus: passed\n`, "utf8");
  } catch (error) {
    await writeFile(logFile, `phase: ${phase}\nstatus: failed\n${formatError(error)}\n`, "utf8");
    throw error;
  } finally {
    process.chdir(originalDirectory);
    process.exit = originalExit;
  }
}
async function captureProjectBytes(project) {
  const candidates = [
    "package.json",
    "starwind.config.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "astro.config.mjs",
    "nuxt.config.ts",
    "vite.config.ts",
    "quasar.config.ts",
    "artisan",
    "composer.json",
    "resources/js/app.ts",
    "resources/css/app.css",
  ];
  const bytes = {};
  for (const relative of candidates) {
    try {
      bytes[relative] = await readFile(path.join(project.directory, relative), "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return bytes;
}

export async function capturePreservedVueHostBytes(project) {
  const bytes = {};
  for (const relative of project.preserveFiles ?? []) {
    bytes[relative] = await readFile(path.join(project.directory, relative));
  }
  return bytes;
}

export async function assertPreservedVueHostBytes(project, expected) {
  const actual = await capturePreservedVueHostBytes(project);
  assert.deepEqual(actual, expected, project.id + " changed preserved backend fixture bytes.");
}

const PACKAGE_RANGE_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

export async function captureVueHostPackageRanges(project) {
  const manifest = JSON.parse(await readFile(path.join(project.directory, "package.json"), "utf8"));
  const declarations = {};
  for (const packageName of project.registryDependencies ?? []) {
    for (const field of PACKAGE_RANGE_FIELDS) {
      const range = manifest[field]?.[packageName];
      if (typeof range === "string") {
        declarations[packageName] ??= {};
        declarations[packageName][field] = range;
      }
    }
  }
  return declarations;
}

export async function assertPreservedVueHostPackageRanges(project, expected) {
  const actual = await captureVueHostPackageRanges(project);
  for (const [packageName, declarations] of Object.entries(expected)) {
    assert.deepEqual(
      actual[packageName],
      declarations,
      project.id + " changed the direct " + packageName + " package declaration.",
    );
  }
}

async function runProductionLifecycle(project, capability, logsDirectory) {
  const preservedPackageRanges = await captureVueHostPackageRanges(project);
  const dependencies = { registry: capability.registry, targetPolicy: capability.targetPolicy };
  await runProductionPhase(project, logsDirectory, "03-init", () =>
    capability.init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      dependencies,
    ),
  );
  await assertPreservedVueHostPackageRanges(project, preservedPackageRanges);
  const stableFiles = await captureProjectBytes(project);
  await runProductionPhase(project, logsDirectory, "03-repeat-init", () =>
    capability.init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      dependencies,
    ),
  );
  assert.deepEqual(
    await captureProjectBytes(project),
    stableFiles,
    `${project.id} repeat init changed host or Starwind bytes.`,
  );
  await assertPreservedVueHostPackageRanges(project, preservedPackageRanges);
  await runProductionPhase(project, logsDirectory, "04-search", () =>
    capability.search(
      "button",
      { framework: "vue", json: true, primitives: true },
      { artifacts: capability.artifacts, targetPolicy: capability.targetPolicy },
    ),
  );
  await runProductionPhase(project, logsDirectory, "05-styled-add", () =>
    capability.add(
      ["collapsible"],
      { framework: "vue", packageManager: "pnpm", yes: true },
      dependencies,
    ),
  );
  await assertStyledPayload(project, capability.registry);

  const configFile = path.join(project.directory, "starwind.config.json");
  const config = JSON.parse(await readFile(configFile, "utf8"));
  const installed = config.components.find(
    (component) => component.name === "collapsible" && component.framework === "vue",
  );
  assert.ok(installed, "The Vue collapsible config entry is missing after add.");
  installed.version = "0.0.0";
  await writeFile(configFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  const styledArtifact = getStyledArtifact(capability.registry);
  await writeFile(
    resolveStyledFile(project, styledArtifact.files[0].path),
    "stale source\n",
    "utf8",
  );
  await runProductionPhase(project, logsDirectory, "06-styled-update", () =>
    capability.update(
      ["collapsible"],
      { framework: "vue", packageManager: "pnpm", yes: true },
      dependencies,
    ),
  );
  await assertStyledPayload(project, capability.registry);
  await runProductionPhase(project, logsDirectory, "07-styled-remove", () =>
    capability.remove(
      ["collapsible"],
      { framework: "vue", yes: true },
      { targetPolicy: capability.targetPolicy },
    ),
  );
  for (const file of styledArtifact.files) {
    await assertMissing(resolveStyledFile(project, file.path));
  }
  await runProductionPhase(project, logsDirectory, "08-styled-re-add", () =>
    capability.add(
      ["collapsible"],
      { framework: "vue", packageManager: "pnpm", yes: true },
      dependencies,
    ),
  );
  await assertStyledPayload(project, capability.registry);
  await runProductionPhase(project, logsDirectory, "09-primitive-add", () =>
    capability.primitivesAdd(
      ["button"],
      {
        framework: "vue",
        packageManager: "pnpm",
        to: project.primitiveDir,
        yes: true,
      },
      { artifacts: capability.artifacts, targetPolicy: capability.targetPolicy },
    ),
  );
  await assertPrimitivePayload(project, capability.artifacts);
}

function getStyledArtifact(registry) {
  const component = registry.components.find((candidate) => candidate.name === "collapsible");
  const target = component?.targets?.vue;
  assert.ok(component && target, "The generated Vue collapsible registry artifact is missing.");
  return { files: target.files, version: component.version };
}

function resolveStyledFile(project, registryPath) {
  const relative = registryPath.replace(/^src\/components\/starwind/, project.styledDir);
  return path.join(project.directory, relative);
}

async function assertStyledPayload(project, registry) {
  const artifact = getStyledArtifact(registry);
  for (const file of artifact.files) {
    assert.equal(await readFile(resolveStyledFile(project, file.path), "utf8"), file.content);
  }
  const config = JSON.parse(
    await readFile(path.join(project.directory, "starwind.config.json"), "utf8"),
  );
  assert.equal(config.componentDirs?.vue ?? config.componentDir, project.styledDir);
  assert.equal(
    config.components.find(
      (component) => component.name === "collapsible" && component.framework === "vue",
    )?.version,
    artifact.version,
  );
}

async function assertPrimitivePayload(project, artifacts) {
  const artifact = artifacts.primitives.find(
    (candidate) => candidate.component === "button" && candidate.framework === "vue",
  );
  assert.ok(artifact, "The generated Vue button Primitive artifact is missing.");
  for (const file of artifact.files) {
    const relative = file.path.replace(
      /^src\/components\/starwind-primitives/,
      project.primitiveDir,
    );
    const content = await readFile(path.join(project.directory, relative), "utf8");
    assert.equal(content, file.content, `${project.id}:${relative}`);
    assert.equal(
      file.sourceHash,
      `sha256:${createHash("sha256").update(content).digest("hex")}`,
      `${project.id}:${relative} source hash`,
    );
    assert.match(file.sourcePath, /^packages\/vue\/src\//);
    assert.ok(
      content.startsWith(
        file.path.endsWith(".vue")
          ? "<!-- Vendored by the Starwind CLI. You own this file in your project. -->"
          : "/**\n * Vendored by the Starwind CLI.\n * You own this file in your project.\n */",
      ),
      `${project.id}:${relative} editable header`,
    );
  }
  const config = JSON.parse(
    await readFile(path.join(project.directory, "starwind.config.json"), "utf8"),
  );
  assert.equal(config.primitiveDirs?.vue ?? config.primitiveDir, project.primitiveDir);
  assert.equal(
    config.primitives?.find(
      (primitive) => primitive.name === "button" && primitive.framework === "vue",
    )?.version,
    artifact.version,
  );
}

async function assertMissing(file) {
  await assert.rejects(access(file));
}

async function writeFixture(project) {
  if (project.host === "nuxt" || project.host === "quasar") {
    const sourceDirectory =
      project.host === "nuxt" && project.fixture.major === 4
        ? "app/components"
        : project.host === "nuxt"
          ? "components"
          : "src/components";
    await mkdir(path.join(project.directory, sourceDirectory), { recursive: true });
    await writeFile(
      path.join(project.directory, sourceDirectory, "Acceptance.vue"),
      getVueFixture(project, sourceDirectory),
      "utf8",
    );
    return;
  }
  if (project.host === "laravel") return;
  if (project.host === "vite") {
    await writeFile(
      path.join(project.directory, "src", "App.vue"),
      getViteVueFixture(project),
      "utf8",
    );
    return;
  }
  await mkdir(path.join(project.directory, "src", "components"), { recursive: true });
  await writeFile(
    path.join(project.directory, "src", "components", "Acceptance.vue"),
    getAstroVueFixture(project),
    "utf8",
  );
  await writeFile(
    path.join(project.directory, "src", "pages", "index.astro"),
    getAstroPageFixture(),
    "utf8",
  );
}

async function verifyPackedProvenance(project, packages, manifests) {
  const installed = {};
  for (const [key, packageName] of [
    ["runtime", "@starwind-ui/runtime"],
    ["vue", "@starwind-ui/vue"],
    ["cli", "starwind"],
  ]) {
    const manifestFile = path.join(
      project.directory,
      "node_modules",
      ...packageName.split("/"),
      "package.json",
    );
    installed[packageName] = JSON.parse(await readFile(await realpath(manifestFile), "utf8"));
    assert.equal(installed[packageName].version, manifests[key].version);
  }
  assertPackedVueHostProvenance({
    expected: {
      "@starwind-ui/runtime": {
        direct: false,
        file: packages.runtime,
        version: manifests.runtime.version,
      },
      "@starwind-ui/vue": { file: packages.vue, version: manifests.vue.version },
      starwind: { file: packages.cli, version: manifests.cli.version },
    },
    installed,
    lockfile: await readFile(path.join(project.directory, "pnpm-lock.yaml"), "utf8"),
    lockfileDirectory: project.directory,
  });
}

export function createPackedVueExportProbe(manifest) {
  const specifiers = Object.keys(manifest.exports)
    .filter((subpath) => subpath !== "./package.json")
    .map((subpath) =>
      subpath === "." ? "@starwind-ui/vue" : `@starwind-ui/vue/${subpath.slice(2)}`,
    );
  return {
    runtimeSource: `${specifiers.map((specifier) => `await import(${JSON.stringify(specifier)});`).join("\n")}\n`,
    typeSource: `${specifiers
      .map(
        (specifier, index) => `import type * as Export${index} from ${JSON.stringify(specifier)};`,
      )
      .join("\n")}\n`,
  };
}

export async function verifyPackedVueExports(
  project,
  logsDirectory,
  { runCommand = runLoggedCommand } = {},
) {
  const packageRoot = path.join(project.directory, "node_modules", "@starwind-ui", "vue");
  const manifest = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  const { runtimeSource, typeSource } = createPackedVueExportProbe(manifest);
  const probeDirectory = path.join(project.directory, ".starwind-vue-export-probe");
  await mkdir(probeDirectory, { recursive: true });
  await writeFile(path.join(probeDirectory, "index.ts"), typeSource, "utf8");
  await writeFile(
    path.join(probeDirectory, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        files: ["index.ts"],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await runCommand(
    "09-packed-declarations",
    {
      args: [
        path.join(project.directory, "node_modules", "typescript", "bin", "tsc"),
        "--project",
        path.join(probeDirectory, "tsconfig.json"),
      ],
      command: process.execPath,
      cwd: project.directory,
    },
    logsDirectory,
  );
  const source = `
import { access, readFile } from "node:fs/promises";
import path from "node:path";
const packageRoot = ${JSON.stringify(packageRoot)};
const manifest = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
for (const [subpath, target] of Object.entries(manifest.exports)) {
  if (subpath === "./package.json") continue;
  const conditions = typeof target === "string" ? { import: target } : target;
  if (!conditions.types) throw new Error(subpath + " has no declaration export");
  await access(path.join(packageRoot, conditions.types));
}
${runtimeSource}
`;
  await runCommand(
    "09-packed-exports",
    {
      args: ["--input-type=module", "--eval", source],
      command: process.execPath,
      cwd: project.directory,
    },
    logsDirectory,
  );
}

export function isVueHydrationMismatchWarning(text) {
  return /(?:hydration[^\n]*(?:mismatch|mismatches|failed)|(?:mismatch|mismatches)[^\n]*hydration)/i.test(
    text,
  );
}

export function shouldCaptureVueHydrationWarnings(project) {
  return project.host === "nuxt" || project.id === "astro-vue" || project.fixture?.mode === "ssr";
}

export function isNuxtComponentCollisionWarning(text) {
  return /(?:Two component files resolving to the same name|duplicated imports[^\n]*component)/i.test(
    text,
  );
}

export async function assertNuxtComponentDiscovery(project, logsDirectory) {
  if (project.host !== "nuxt") return;
  const commandOutput = await Promise.all(
    ["09-typecheck.log", "10-build.log"].map((file) =>
      readFile(path.join(logsDirectory, file), "utf8"),
    ),
  );
  assert.equal(
    commandOutput.some(isNuxtComponentCollisionWarning),
    false,
    `${project.id} reported a duplicate Nuxt component registration.`,
  );

  const declarations = await readFile(
    path.join(project.directory, ".nuxt", "components.d.ts"),
    "utf8",
  );
  for (const name of [
    "StarwindCollapsible",
    "StarwindPrimitivesButtonRoot",
    "UserTypeScript",
    "UserVue",
  ]) {
    assert.match(declarations, new RegExp(`\\b${name}\\b`), `${project.id} missing ${name}.`);
  }
  assert.doesNotMatch(
    declarations,
    /components[\\/]starwind[\\/][^'"\n]*\.ts\b/i,
    `${project.id} registered a Styled TypeScript file as a component.`,
  );
  assert.doesNotMatch(
    declarations,
    /components[\\/]starwind-primitives[\\/][^'"\n]*\.ts\b/i,
    `${project.id} registered a Primitive TypeScript file as a component.`,
  );
}

export async function assertRegistryVueHostProvenance(project) {
  const manifest = JSON.parse(await readFile(path.join(project.directory, "package.json"), "utf8"));
  const lockfile = parseYaml(
    await readFile(path.join(project.directory, "pnpm-lock.yaml"), "utf8"),
  );
  const resolutions = [
    ...Object.keys(lockfile.packages ?? {}),
    ...Object.keys(lockfile.snapshots ?? {}),
  ];
  for (const packageName of project.registryDependencies ?? []) {
    const specifier =
      manifest.dependencies?.[packageName] ?? manifest.devDependencies?.[packageName];
    assert.equal(
      typeof specifier,
      "string",
      `${project.id} is missing ${packageName} as a direct dependency.`,
    );
    assert.ok(
      !/^(?:file|link|portal|workspace):/.test(specifier) &&
        !specifier.replaceAll("\\", "/").includes(REPO_ROOT.replaceAll("\\", "/")),
      `${project.id} ${packageName} bypasses registry provenance.`,
    );
    const installedFile = path.join(
      project.directory,
      "node_modules",
      ...packageName.split("/"),
      "package.json",
    );
    const installed = JSON.parse(await readFile(installedFile, "utf8"));
    assert.equal(installed.name, packageName);
    assert.equal(typeof installed.version, "string");
    const resolution = `${packageName}@${installed.version}`;
    assert.ok(
      resolutions.some((key) => key === resolution || key.startsWith(`${resolution}(`)),
      `${project.id} lockfile does not pin installed ${resolution}.`,
    );
  }
  for (const nested of project.registryDependencyRoots ?? []) {
    await assertRegistryVueHostProvenance({
      directory: path.join(project.directory, nested.directory),
      id: `${project.id}:${nested.directory}`,
      registryDependencies: nested.packages,
    });
  }
}

export async function assertNoWorkspaceSourceAliases(project) {
  const files = [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ...project.sourceIsolationFiles,
  ];
  const forbidden = [
    "workspace:",
    "link:",
    "portal:",
    "packages/vue/src",
    "packages/runtime/src",
    REPO_ROOT.replaceAll("\\", "/"),
  ];
  for (const relative of files) {
    let source;
    try {
      source = await readFile(path.join(project.directory, relative), "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const normalized = source.replaceAll("\\", "/");
    for (const token of forbidden) {
      assert.ok(!normalized.includes(token), `${project.id}:${relative} contains ${token}`);
    }
  }
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      const port = address && typeof address === "object" ? address.port : undefined;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function getPnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function startPreview(project, port) {
  const previewArgs = project.preview.args.map((argument) =>
    argument.replace("{host}", HOST).replace("{port}", String(port)),
  );
  const command = project.preview.command ?? getPnpmCommand();
  const args = project.preview.command ? previewArgs : [project.preview.script, ...previewArgs];
  const child = spawn(command, args, {
    cwd: project.directory,
    detached: process.platform !== "win32",
    env: { ...process.env, HOST, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  let spawnError;
  child.stdout.on("data", (chunk) => (output += chunk.toString()));
  child.stderr.on("data", (chunk) => (output += chunk.toString()));
  child.once("error", (error) => {
    spawnError = error;
  });
  return { child, getOutput: () => output, getSpawnError: () => spawnError };
}

async function waitForPreview(url, preview) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (preview.getSpawnError()) throw preview.getSpawnError();
    if (preview.child.exitCode !== null || preview.child.signalCode !== null) {
      throw new Error(`Preview exited before it became ready.\n${preview.getOutput()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview socket is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}.\n${preview.getOutput()}`);
}

export function isPreviewTreeAlive(preview) {
  if (!preview.child.pid) return false;
  try {
    process.kill(process.platform === "win32" ? preview.child.pid : -preview.child.pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    if (error?.code === "EPERM") return true;
    throw error;
  }
}

async function waitForPreviewTreeExit(preview, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isPreviewTreeAlive(preview)) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return !isPreviewTreeAlive(preview);
}

async function waitForPreviewChildClose(preview, timeoutMs) {
  if (preview.child.exitCode !== null || preview.child.signalCode !== null) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Preview child did not report process exit.")),
      timeoutMs,
    );
    preview.child.once("close", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

export async function stopPreviewTree(preview) {
  if (!preview.child.pid) return;
  if (process.platform === "win32") {
    if (isPreviewTreeAlive(preview)) {
      await new Promise((resolve, reject) => {
        const killer = spawn("taskkill.exe", ["/PID", String(preview.child.pid), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        });
        killer.once("error", reject);
        killer.once("close", (code) =>
          code === 0 ? resolve() : reject(new Error(`taskkill exited with code ${code}.`)),
        );
      });
    }
    await waitForPreviewChildClose(preview, 5_000);
    return;
  }

  if (isPreviewTreeAlive(preview)) {
    try {
      process.kill(-preview.child.pid, "SIGTERM");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  }
  if (!(await waitForPreviewTreeExit(preview, 3_000))) {
    try {
      process.kill(-preview.child.pid, "SIGKILL");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
    assert.ok(
      await waitForPreviewTreeExit(preview, 5_000),
      `Preview process group ${preview.child.pid} survived SIGKILL.`,
    );
  }
  await waitForPreviewChildClose(preview, 5_000);
  assert.equal(isPreviewTreeAlive(preview), false, "Preview process group remains alive.");
}

async function verifyBrowser(project, logsDirectory, browser) {
  let page;
  let preview;
  await runWithCleanup(async () => {
    const port = await getFreePort();
    const url = `http://${HOST}:${port}/`;
    preview = startPreview(project, port);
    page = await browser.newPage({ viewport: { height: 800, width: 1200 } });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
      else if (
        message.type() === "warning" &&
        shouldCaptureVueHydrationWarnings(project) &&
        isVueHydrationMismatchWarning(message.text())
      ) {
        errors.push(`console warning: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
    try {
      await waitForPreview(url, preview);
      if (project.host === "nuxt" || project.fixture?.mode === "ssr") {
        const serverHtml = await (await fetch(url)).text();
        assert.match(
          serverHtml,
          /Runtime panel content/,
          `${project.id} did not server-render acceptance markup.`,
        );
      }
      await page.goto(url, { waitUntil: "networkidle" });
      const trigger = page.getByRole("button", { name: project.browser.buttonName });
      const content = page.getByText(project.browser.resultText);
      await trigger.click();
      await content.waitFor({ state: "visible" });
      assert.equal(await page.getByTestId("open-state").textContent(), "open");
      assert.equal(await page.getByTestId("primitive-button").count(), 1);
      await trigger.click();
      await content.waitFor({ state: "hidden" });
      assert.equal(await page.getByTestId("open-state").textContent(), "closed");
      assert.deepEqual(errors, []);
    } catch (error) {
      try {
        await page.screenshot({
          fullPage: true,
          path: path.join(logsDirectory, "browser-failure.png"),
        });
      } catch (screenshotError) {
        throw new AggregateError([error, screenshotError], "Browser check and screenshot failed.");
      }
      throw error;
    }
  }, [
    async () => {
      if (preview) {
        await writeFile(path.join(logsDirectory, "preview.log"), preview.getOutput(), "utf8");
      }
    },
    async () => {
      if (page) await page.close();
    },
    async () => {
      if (preview) await stopPreviewTree(preview);
    },
  ]);
}

function formatError(error) {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

export async function runVueCliHostAcceptance({
  keepTemp = false,
  localLinkOnly = false,
  projectIds,
  rootDirectory,
  skipLocalLink = true,
} = {}) {
  return runWithTemporaryVueHostRoot({ keepTemp, rootDirectory }, async (root) => {
    if (localLinkOnly || !skipLocalLink) await runVueLocalLinkAcceptance({ root });
    if (localLinkOnly) return { root };

    const rootLogs = path.join(root, "logs");
    const packsDirectory = path.join(root, "packs");
    let browser;
    let registry;
    await runWithCleanup(async () => {
      const { manifests, packages } = await packVueBetaPackages(packsDirectory, rootLogs);
      const plan = createVueCliHostAcceptancePlan({ packages, root });
      if (projectIds) {
        const requested = new Set(projectIds);
        plan.projects = plan.projects.filter(({ id }) => requested.has(id));
        assert.equal(
          plan.projects.length,
          requested.size,
          "Unknown Vue host acceptance project id.",
        );
      }
      registry = await startCandidateRegistry(
        Object.fromEntries(
          ["runtime", "vue"].map((key) => [
            key,
            {
              file: packages[key],
              manifest: manifests[key],
              name: manifests[key].name,
              version: manifests[key].version,
            },
          ]),
        ),
      );
      const capability = await loadProductionCapability();
      const require = createRequire(path.join(REPO_ROOT, "package.json"));
      const { chromium } = require("playwright");
      browser = await chromium.launch();
      for (const project of plan.projects) {
        const logs = path.join(rootLogs, project.id);
        if (project.scaffold) await runLoggedCommand("01-scaffold", project.scaffold, logs);
        else await createOfficialVueHostFixture(project);
        const preservedBytes = await capturePreservedVueHostBytes(project);
        await prepareManifest(project, packages, registry.url);
        await runLoggedCommand("02-install", packageCommand(project.directory, ["install"]), logs);
        if (project.ssrInstall) await runLoggedCommand("02-ssr-install", project.ssrInstall, logs);
        if (project.prepare) await runLoggedCommand("02-prepare", project.prepare, logs);
        try {
          await runProductionLifecycle(project, capability, logs);
        } catch (error) {
          throw new Error(
            `${project.id} production CLI lifecycle failed. Expected setup, repeat setup, search, add, update, remove, and Primitive checks to pass. Evidence: ${logs}.\n${formatError(error)}`,
            { cause: error },
          );
        }
        await runLoggedCommand(
          "09-sync-lockfile",
          packageCommand(project.directory, ["install", "--no-frozen-lockfile"]),
          logs,
        );
        await assertPreservedVueHostBytes(project, preservedBytes);
        await writeFixture(project);
        await verifyPackedProvenance(project, packages, manifests);
        await verifyPackedVueExports(project, logs);
        await assertRegistryVueHostProvenance(project);
        await assertNoWorkspaceSourceAliases(project);
        await runLoggedCommand("09-typecheck", project.check, logs);
        await runLoggedCommand("10-build", project.build, logs);
        await assertNuxtComponentDiscovery(project, logs);
        if (project.postBuild) await runLoggedCommand("11-output-install", project.postBuild, logs);
        await assertPreservedVueHostBytes(project, preservedBytes);
        if (project.preview) await verifyBrowser(project, logs, browser);
      }
    }, [
      async () => {
        if (browser) await browser.close();
      },
      async () => {
        if (registry) await registry.close();
      },
    ]);
    console.log(
      "[vue-cli-host] packed Vite Vue, Astro Vue, Nuxt 3/4, Laravel/Inertia, and Quasar SPA/SSR acceptance passed",
    );
    return { root };
  });
}

async function main() {
  await runVueCliHostAcceptance(parseArgs(process.argv.slice(2)));
}
export async function createOfficialVueHostFixture(project) {
  const write = async (relative, content) => {
    const file = path.join(project.directory, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content, "utf8");
  };
  await mkdir(project.directory, { recursive: true });

  if (project.fixture.kind === "nuxt") {
    const source = project.fixture.major === 4 ? "app/" : "";
    await write(
      "package.json",
      `${JSON.stringify(
        {
          name: project.id,
          private: true,
          type: "module",
          scripts: { build: "nuxt build" },
          dependencies: { nuxt: project.fixture.version, vue: VUE_VERSION },
        },
        null,
        2,
      )}\n`,
    );
    await write(
      "nuxt.config.ts",
      'export default defineNuxtConfig({ compatibilityDate: "2025-07-15", ssr: true });\n',
    );
    await write(
      "tsconfig.json",
      project.fixture.major === 4
        ? '{"files":[],"references":[{"path":"./.nuxt/tsconfig.app.json"},{"path":"./.nuxt/tsconfig.server.json"},{"path":"./.nuxt/tsconfig.shared.json"},{"path":"./.nuxt/tsconfig.node.json"}]}\n'
        : '{"extends":"./.nuxt/tsconfig.json"}\n',
    );
    await write(
      `${source}app.vue`,
      `<template>
  <Acceptance />
  <StarwindCollapsible data-testid="auto-styled">
    <StarwindCollapsibleTrigger>Auto toggle</StarwindCollapsibleTrigger>
    <StarwindCollapsibleContent>Auto content</StarwindCollapsibleContent>
  </StarwindCollapsible>
  <StarwindPrimitivesButtonRoot data-testid="auto-primitive">Auto primitive</StarwindPrimitivesButtonRoot>
  <UserTypeScript />
  <UserVue />
</template>
`,
    );
    await write(
      `${source}components/UserTypeScript.ts`,
      `import { defineComponent, h } from "vue";
export default defineComponent({ name: "UserTypeScript", render: () => h("p", "User TypeScript") });
`,
    );
    await write(`${source}components/UserVue.vue`, "<template><p>User Vue</p></template>\n");
    return;
  }

  if (project.fixture.kind === "laravel") {
    await write(
      "package.json",
      `${JSON.stringify(
        {
          name: project.id,
          private: true,
          type: "module",
          scripts: { build: "vite build" },
          dependencies: {
            "@inertiajs/vite": "^3.0.0",
            "@inertiajs/vue3": "^3.0.0",
            "laravel-vite-plugin": "^3.0.0",
            tailwindcss: "^4.1",
            vue: VUE_VERSION,
          },
          devDependencies: {
            "@tailwindcss/vite": "^4.1.0",
            "@vitejs/plugin-vue": "^6.0.0",
            vite: "^8.0.0",
            "vue-tsc": "^2.2.4",
          },
        },
        null,
        2,
      )}\n`,
    );
    await write("artisan", "#!/usr/bin/env php\n<?php // inert acceptance fixture\n");
    await write("composer.json", '{"require":{"laravel/framework":"^13.0"}}\n');
    await write(
      "resources/css/app.css",
      `@import 'tailwindcss';
@import 'tw-animate-css';

@source '../../vendor/laravel/framework/**/*.blade.php';
@custom-variant dark (&:is(.dark *));
@theme inline {
  --color-background: var(--background);
}
:root { --background: white; }
.dark { --background: black; }
`,
    );
    await write(
      "resources/js/app.ts",
      "import '../css/app.css';\nimport { createInertiaApp } from '@inertiajs/vue3';\ncreateInertiaApp({ setup() {} });\n",
    );
    await write(
      "tsconfig.json",
      '{"compilerOptions":{"strict":true,"module":"ESNext","moduleResolution":"Bundler","target":"ESNext","lib":["ESNext","DOM","DOM.Iterable"],"jsx":"preserve","jsxImportSource":"vue","types":["vite/client"],"allowJs":true,"resolveJsonModule":true,"isolatedModules":true,"esModuleInterop":true,"forceConsistentCasingInFileNames":true,"noEmit":true,"skipLibCheck":true,"paths":{"@/*":["./resources/js/*"]}},"include":["resources/js/**/*.ts","resources/js/**/*.d.ts","resources/js/**/*.tsx","resources/js/**/*.vue"]}\n',
    );
    await write(
      "vite.config.ts",
      `import inertia from '@inertiajs/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [
  laravel({ input: ['resources/css/app.css', 'resources/js/app.ts'], refresh: true }),
  inertia(), tailwindcss(), vue(),
] });
`,
    );
    return;
  }

  await write(
    "package.json",
    `${JSON.stringify(
      {
        name: project.id,
        private: true,
        type: "module",
        scripts: { build: "quasar build" },
        dependencies: {
          "@quasar/extras": "^1.16.0",
          quasar: "^2.18.0",
          vue: VUE_VERSION,
          "vue-router": "^5.0.6",
        },
        devDependencies: {
          "@quasar/app-vite": QUASAR_APP_VERSION,
          "@types/node": "^24.0.0",
          "sass-embedded": "^1.93.0",
          typescript: "^5.9.3",
          vite: "^8.0.0",
          "vue-tsc": "^3.1.8",
        },
      },
      null,
      2,
    )}\n`,
  );
  await write(
    "quasar.config.ts",
    `import { defineConfig } from '#q-app';
export default defineConfig(() => ({
  css: ['app.scss'],
  build: { target: { browser: ['es2022'], node: 'node22' }, vitePlugins: [] },
}));
`,
  );
  await write(
    "index.html",
    "<!doctype html><html><head></head><body><!-- quasar:entry-point --></body></html>\n",
  );
  await write("src/App.vue", "<template><router-view /></template>\n");
  await write("src/css/app.scss", "");
  await write(
    "src/layouts/MainLayout.vue",
    "<template><q-layout><q-page-container><router-view /></q-page-container></q-layout></template>\n",
  );
  await write(
    "src/pages/IndexPage.vue",
    '<script setup lang="ts">\nimport Acceptance from "../components/Acceptance.vue";\n</script>\n<template><Acceptance /></template>\n',
  );
  await write(
    "src/router/routes.ts",
    "export default [{ path: '/', component: () => import('../layouts/MainLayout.vue'), children: [{ path: '', component: () => import('../pages/IndexPage.vue') }] }];\n",
  );
  await write(
    "src/router/index.ts",
    "import { defineRouter } from '#q-app';\nimport { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';\nimport routes from './routes';\nexport default defineRouter(() => createRouter({ routes, history: import.meta.env.QUASAR_SERVER ? createMemoryHistory() : createWebHistory() }));\n",
  );
  await write("tsconfig.json", '{"extends":"./.quasar/tsconfig.json"}\n');
  if (project.fixture.mode === "ssr") {
    await write(
      "src-ssr/package.json",
      '{"name":"quasar-ssr-app-hono","version":"1.0.0","description":"Quasar SSR server folder","type":"module","private":true,"dependencies":{"hono":"^4.12.12","@hono/node-server":"^2.0.0"}}\n',
    );
    await write(
      "src-ssr/pnpm-workspace.yaml",
      "# This file exists to force pnpm install deps here, regardless of upper workspaces\n# https://pnpm.io/settings\n",
    );
    await write(
      "src-ssr/server.ts",
      `import { lstatSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { defineSsrClose, defineSsrCreate, defineSsrListen, defineSsrRenderPreloadTag, defineSsrServeStaticContent } from "#q-app";
interface NodeEnv { Bindings: { incoming: IncomingMessage; outgoing: ServerResponse } }
declare module "#q-app" { interface SsrDriver { app: Hono<NodeEnv>; listenResult: ReturnType<typeof serve>; request: IncomingMessage; response: ServerResponse } }
export const create = defineSsrCreate(async () => new Hono<NodeEnv>());
export const listen = defineSsrListen(async ({ app, port }) => serve({ fetch: app.fetch, port }));
export const close = defineSsrClose(({ listenResult }) => listenResult.close());
export const renderPreloadTag = defineSsrRenderPreloadTag((file) => {
  if (file.endsWith(".js")) return '<link rel="modulepreload" href="' + file + '" crossorigin>';
  if (file.endsWith(".css")) return '<link rel="stylesheet" href="' + file + '" crossorigin>';
  return "";
});
export const serveStaticContent = defineSsrServeStaticContent(
  ({ app, resolve }) => ({ urlPath, pathToServe }) => {
    const publicFile = resolve.public(pathToServe);
    const isDirectory = lstatSync(publicFile).isDirectory();
    const resolvedUrl = resolve.urlPath(urlPath);
    const route = isDirectory && !resolvedUrl.endsWith("*") ? resolvedUrl + "*" : resolvedUrl;
    app.use(route, serveStatic(isDirectory ? { root: publicFile } : { path: publicFile }));
  },
);
`,
    );
    await write("src-ssr/server-assets/.gitkeep", "");
    await write(
      "src-ssr/middlewares/render.ts",
      `import { defineSsrMiddleware } from "#q-app";
export default defineSsrMiddleware(({ app, resolve, render }) => {
  app.get(resolve.urlPath("/*"), async (context) => {
    const html = await render({ req: context.env.incoming, res: context.env.outgoing });
    return context.html(html);
  });
});
`,
    );
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(formatError(error));
    process.exitCode = 1;
  });
}
export function createVueCliHostAcceptancePlan({ packages, root }) {
  const baseline = createBaselineVueCliHostAcceptancePlan({ packages, root });
  const packedDependencies = baseline.projects[0].packedDependencies;
  const lifecycle = [
    "init",
    "repeat-init",
    "search",
    "styled-add",
    "styled-update",
    "styled-remove",
    "styled-re-add",
    "primitive-add",
  ];
  for (const project of baseline.projects) {
    project.lifecycle = lifecycle;
    project.preserveFiles = [];
  }
  const scenario = (id, options) => ({
    browser: { buttonName: "Toggle acceptance", resultText: "Runtime panel content" },
    directory: path.join(root, id),
    framework: "vue",
    id,
    lifecycle,
    packedDependencies,
    preserveFiles: [],
    scaffold: null,
    ...options,
  });
  baseline.projects.push(
    ...[
      ["nuxt-4", 4, NUXT_4_VERSION, "app"],
      ["nuxt-3", 3, NUXT_3_VERSION, ""],
    ].map(([id, major, version, source]) =>
      scenario(id, {
        build: packageCommand(path.join(root, id), ["build"]),
        check: packageCommand(path.join(root, id), ["exec", "nuxt", "typecheck"]),
        fixture: { kind: "nuxt", major, version },
        host: "nuxt",
        sourceIsolationFiles: [
          "nuxt.config.ts",
          "tsconfig.json",
          source ? source + "/app.vue" : "app.vue",
          source ? source + "/components/Acceptance.vue" : "components/Acceptance.vue",
          "starwind.config.json",
        ],
        preview: { args: [".output/server/index.mjs"], command: process.execPath },
        primitiveDir: `${source ? `${source}/` : ""}components/starwind-primitives`,
        registryDependencies: [
          "@tailwindcss/forms",
          "@tailwindcss/vite",
          "nuxt",
          "tailwindcss",
          "tw-animate-css",
          "vue",
        ],
        styledDir: `${source ? `${source}/` : ""}components/starwind`,
      }),
    ),
    scenario("laravel-inertia-vue", {
      build: packageCommand(path.join(root, "laravel-inertia-vue"), ["build"]),
      check: packageCommand(path.join(root, "laravel-inertia-vue"), [
        "exec",
        "vue-tsc",
        "--noEmit",
        "--project",
        "tsconfig.json",
      ]),
      fixture: { kind: "laravel" },
      host: "laravel",
      sourceIsolationFiles: [
        "vite.config.ts",
        "tsconfig.json",
        "resources/js/app.ts",
        "resources/css/app.css",
        "starwind.config.json",
      ],
      preview: null,
      primitiveDir: "resources/js/components/starwind-primitives",
      preserveFiles: ["artisan", "composer.json"],
      registryDependencies: [
        "@inertiajs/vite",
        "@inertiajs/vue3",
        "@tailwindcss/forms",
        "@tailwindcss/vite",
        "@vitejs/plugin-vue",
        "laravel-vite-plugin",
        "tailwindcss",
        "tw-animate-css",
        "vite",
        "vue",
      ],
      styledDir: "resources/js/components/starwind",
    }),
    ...["spa", "ssr"].map((mode) =>
      scenario(`quasar-${mode}`, {
        build: packageCommand(path.join(root, `quasar-${mode}`), [
          "exec",
          "quasar",
          "build",
          ...(mode === "ssr" ? ["-m", "ssr"] : []),
        ]),
        check: packageCommand(path.join(root, `quasar-${mode}`), [
          "exec",
          "vue-tsc",
          "--noEmit",
          "--project",
          "tsconfig.json",
        ]),
        fixture: { kind: "quasar", mode },
        host: "quasar",
        sourceIsolationFiles: [
          "quasar.config.ts",
          "tsconfig.json",
          "src/router/index.ts",
          "src/router/routes.ts",
          "src/pages/IndexPage.vue",
          "src/components/Acceptance.vue",
          "starwind.config.json",
          ...(mode === "ssr" ? ["src-ssr/server.ts", "src-ssr/middlewares/render.ts"] : []),
        ],
        prepare: packageCommand(path.join(root, `quasar-${mode}`), ["exec", "quasar", "prepare"]),
        preview:
          mode === "ssr"
            ? { args: ["dist/ssr/index.js"], command: process.execPath }
            : {
                args: [
                  "node_modules/vite/bin/vite.js",
                  "preview",
                  "--host",
                  "{host}",
                  "--port",
                  "{port}",
                  "--strictPort",
                  "--outDir",
                  "dist/spa",
                ],
                command: process.execPath,
              },
        primitiveDir: "src/components/starwind-primitives",
        registryDependencies: [
          "@quasar/app-vite",
          "@quasar/extras",
          "@tailwindcss/forms",
          "@tailwindcss/vite",
          "quasar",
          "tailwindcss",
          "tw-animate-css",
          "vite",
          "vue",
          "vue-router",
        ],
        styledDir: "src/components/starwind",
        registryDependencyRoots:
          mode === "ssr" ? [{ directory: "src-ssr", packages: ["@hono/node-server", "hono"] }] : [],
        ssrInstall:
          mode === "ssr"
            ? packageCommand(path.join(root, `quasar-${mode}`, "src-ssr"), ["install"])
            : null,
        postBuild:
          mode === "ssr"
            ? packageCommand(path.join(root, `quasar-${mode}`, "dist/ssr"), ["install", "--prod"])
            : null,
      }),
    ),
  );
  return baseline;
}
