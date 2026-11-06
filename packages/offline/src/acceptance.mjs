#!/usr/bin/env node
// Installs a test offline kit and runs the CLI with outbound network access blocked in real
// projects for each available package manager. Setup steps that create projects run online.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { buildOfflineKit, selectPlatforms } from "./build.mjs";
import { REPO_ROOT } from "./builder.mjs";

const ASTRO_SCAFFOLD = "create-astro@5.2.3";
const VITE_SCAFFOLD = "create-vite@9.1.1";
const TOOL_VERSIONS = {
  yarn1: "yarn@1.22.22",
  yarn4: "@yarnpkg/cli-dist@4.18.1",
  bun: "bun@1.4.4",
};
export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn4", "yarn4-pnp"];
const COMMAND_TIMEOUT_MS = 300_000;
const MACOS_OFFLINE_PROFILE =
  '(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))';

/**
 * Wraps a command so it cannot reach any host except the loopback interface. macOS uses
 * `sandbox-exec`. Linux uses a new network namespace that has only the loopback interface.
 */
export function offlineCommand(command, args, platform = process.platform) {
  if (platform === "darwin") {
    return { command: "sandbox-exec", args: ["-p", MACOS_OFFLINE_PROFILE, command, ...args] };
  }
  if (platform === "linux") {
    return {
      command: "unshare",
      args: [
        "--user",
        "--map-root-user",
        "--net",
        "sh",
        "-c",
        'ip link set lo up && exec "$@"',
        "offline",
        command,
        ...args,
      ],
    };
  }
  throw new Error(
    "Offline acceptance needs macOS sandbox-exec or Linux unshare to block the network.",
  );
}

const NETWORK_PROBE = `require("node:https").get("https://registry.npmjs.org/", () => process.exit(1)).on("error", () => process.exit(0)).setTimeout(5000, () => process.exit(0));`;

/** Fails unless the wrapper starts and really blocks an outbound connection. */
async function assertNetworkBlocked(logDirectory) {
  const start = offlineCommand(process.execPath, ["-e", "process.exit(0)"]);
  const started = await run("network-wrapper", start.command, start.args, {
    cwd: os.tmpdir(),
    logDirectory,
    allowFailure: true,
  });
  if (started.code !== 0) {
    throw new Error(
      `The offline network wrapper (${start.command}) could not start. On Linux it needs unprivileged user namespaces and the ip command.`,
    );
  }
  const probe = offlineCommand(process.execPath, ["-e", NETWORK_PROBE]);
  const { code } = await run("network-probe", probe.command, probe.args, {
    cwd: os.tmpdir(),
    logDirectory,
    allowFailure: true,
  });
  if (code !== 0) {
    throw new Error("The offline wrapper did not block a direct connection to registry.npmjs.org.");
  }
}

export const FROZEN_INSTALL = {
  npm: ["ci", "--no-audit", "--no-fund"],
  pnpm: ["install", "--frozen-lockfile"],
  yarn4: ["install", "--immutable"],
  "yarn4-pnp": ["install", "--immutable"],
};

const LOCKFILES = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "node_modules/.package-lock.json",
  "node_modules/.modules.yaml",
  "node_modules/.pnpm/lock.yaml",
];

function run(
  label,
  command,
  args,
  { cwd, env = process.env, logDirectory, timeoutMs = COMMAND_TIMEOUT_MS, allowFailure = false },
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", reject);
    child.on("close", async (code) => {
      clearTimeout(timer);
      const file = path.join(logDirectory, `${label.replace(/[^a-z0-9-]+/gi, "_")}.log`);
      await writeFile(file, `$ ${command} ${args.join(" ")}\n(cwd ${cwd})\n\n${output}`);
      if (code !== 0 && !allowFailure) {
        reject(
          new Error(`${label} failed with exit code ${code}. See ${file}\n${output.slice(-3000)}`),
        );
        return;
      }
      resolve({ code, output });
    });
  });
}

async function writeExecutable(file, content) {
  await writeFile(file, content);
  await chmod(file, 0o755);
}

/** Installs Yarn 1, Yarn 4, and Bun into a private tools folder with one `bin` folder each. */
async function prepareTools(root, logDirectory) {
  const tools = path.join(root, "tools");
  await mkdir(tools, { recursive: true });
  await writeFile(path.join(tools, "package.json"), '{"private":true}');
  const bins = {};
  for (const [manager, spec] of Object.entries(TOOL_VERSIONS)) {
    const prefix = path.join(tools, manager);
    await mkdir(prefix, { recursive: true });
    await writeFile(path.join(prefix, "package.json"), '{"private":true}');
    await run(`tools-${manager}`, "npm", ["install", spec, "--no-audit", "--no-fund"], {
      cwd: prefix,
      logDirectory,
    });
    const bin = path.join(tools, `${manager}-bin`);
    await mkdir(bin, { recursive: true });
    if (manager === "bun") {
      await writeExecutable(
        path.join(bin, "bun"),
        `#!/bin/sh\nexec "${path.join(prefix, "node_modules/.bin/bun")}" "$@"\n`,
      );
    } else {
      const entry =
        manager === "yarn1"
          ? "node_modules/yarn/bin/yarn.js"
          : "node_modules/@yarnpkg/cli-dist/bin/yarn.js";
      await writeExecutable(
        path.join(bin, "yarn"),
        `#!/bin/sh\nexec "${process.execPath}" "${path.join(prefix, entry)}" "$@"\n`,
      );
    }
    bins[manager] = bin;
  }
  return bins;
}

function managerCommand(manager) {
  return manager.startsWith("yarn") ? "yarn" : manager;
}

function pathFor(manager, bins) {
  const bin = bins[manager === "yarn4-pnp" ? "yarn4" : manager];
  return bin ? `${bin}${path.delimiter}${process.env.PATH}` : process.env.PATH;
}

async function assertNoLocalRegistry(directory) {
  for (const name of LOCKFILES) {
    const file = path.join(directory, name);
    if (!existsSync(file)) continue;
    const content = await readFile(file, "utf8");
    if (/127\.0\.0\.1|__archiveUrl/.test(content)) {
      throw new Error(`${file} still references the local offline registry.`);
    }
  }
}

/**
 * Proves that the package manager read the adapter metadata from the kit registry. A manager that
 * ignores the registry setting could otherwise pass by reading its own cache.
 */
export async function assertServedByKit(requestLog, adapter) {
  const log = existsSync(requestLog) ? await readFile(requestLog, "utf8") : "";
  const metadata = new RegExp(`^200 GET /@starwind-ui(?:%2[fF]|/)${adapter}(?:[/?]|$)`, "m");
  if (!metadata.test(log)) {
    throw new Error(
      `The package manager did not read @starwind-ui/${adapter} from the offline kit registry. Requests:\n${log.slice(0, 2000)}`,
    );
  }
}

const ASTRO_PAGE = `---
import { Button } from "@/components/starwind/button";
import "@/styles/starwind.css";
---

<Button>Offline Astro passed</Button>
`;

const ASTRO_REACT_PAGE = `---
import { Button } from "../components/starwind-react/button";
---

<main><Button>Offline Astro React passed</Button></main>
`;

const VITE_APP = `import { Button } from "./components/starwind/button";

export default function App() {
  return <Button>Offline Vite React passed</Button>;
}
`;

export function createScenarios(managers) {
  const scenarios = [];
  for (const manager of managers) {
    scenarios.push({ id: `astro-${manager}`, manager, host: "astro", framework: undefined });
    if (manager === "npm" || manager === "pnpm") {
      scenarios.push({ id: `astro-react-${manager}`, manager, host: "astro", framework: "react" });
      scenarios.push({ id: `vite-react-${manager}`, manager, host: "vite", framework: "react" });
    }
    if (manager === "npm") {
      // Astro declared only as a dev dependency must count as installed.
      scenarios.push({ id: "astro-devdeps-npm", manager, host: "astro", astroDevDependency: true });
      scenarios.push({ id: "astro-workspace-npm", manager, host: "astro", workspace: true });
    }
    if (manager === "pnpm") {
      // The pnpm launcher switches to a project's pinned version through registry metadata.
      scenarios.push({ id: "astro-pnpm-pinned", manager, host: "astro", pinPnpm: true });
    }
  }
  return scenarios;
}

/**
 * Creates each host template once and copies it for every scenario. Template downloads come from
 * GitHub, which limits how often one machine may fetch them.
 */
const templates = new Map();
async function hostTemplate(host, root, logDirectory) {
  if (!templates.has(host)) {
    templates.set(
      host,
      (async () => {
        const name = `template-${host}`;
        const args =
          host === "astro"
            ? [
                "--yes",
                ASTRO_SCAFFOLD,
                name,
                "--template",
                "minimal",
                "--no-install",
                "--no-git",
                "--yes",
              ]
            : ["--yes", VITE_SCAFFOLD, name, "--template", "react", "--no-interactive"];
        await run(`${name}-scaffold`, "npx", args, { cwd: root, logDirectory });
        return path.join(root, name);
      })(),
    );
  }
  return templates.get(host);
}

async function scaffold(scenario, root, logDirectory) {
  // A workspace scenario puts the app in a member folder, where npm hoists Astro to the root.
  const directory = scenario.workspace
    ? path.join(root, scenario.id, "apps/site")
    : path.join(root, scenario.id);
  if (scenario.workspace) {
    await mkdir(path.join(root, scenario.id), { recursive: true });
    await writeFile(
      path.join(root, scenario.id, "package.json"),
      `${JSON.stringify({ name: scenario.id, private: true, workspaces: ["apps/*"] }, null, 2)}\n`,
    );
  }
  await cp(await hostTemplate(scenario.host, root, logDirectory), directory, { recursive: true });
  const manifestPath = path.join(directory, "package.json");
  const templateManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  templateManifest.name = scenario.id;
  if (scenario.astroDevDependency) {
    templateManifest.devDependencies = {
      ...templateManifest.devDependencies,
      astro: templateManifest.dependencies.astro,
    };
    delete templateManifest.dependencies.astro;
  }
  await writeFile(manifestPath, `${JSON.stringify(templateManifest, null, 2)}\n`);
  if (scenario.manager === "pnpm")
    await writeFile(path.join(directory, "pnpm-workspace.yaml"), "packages: []\n");
  if (scenario.pinPnpm) {
    const manifestFile = path.join(directory, "package.json");
    const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
    const { output } = await run(`${scenario.id}-pnpm-version`, "pnpm", ["--version"], {
      cwd: os.tmpdir(),
      logDirectory,
    });
    // 11.16.0 switches through `@pnpm/exe`, which needs more metadata than `pnpm` alone.
    manifest.packageManager = output.trim().startsWith("11.16.0") ? "pnpm@11.8.0" : "pnpm@11.16.0";
    await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  // Yarn quarantines npm versions for a few days. A fresh template can need a newer version, so
  // the test projects turn the gate off. Online and offline installs follow the same setting.
  if (scenario.manager === "yarn4") {
    await writeFile(
      path.join(directory, ".yarnrc.yml"),
      "nodeLinker: node-modules\nenableTelemetry: false\nnpmMinimalAgeGate: 0\n",
    );
  }
  if (scenario.manager === "yarn4-pnp") {
    await writeFile(
      path.join(directory, ".yarnrc.yml"),
      "enableTelemetry: false\nnpmMinimalAgeGate: 0\n",
    );
  }
  return directory;
}

async function runScenario(scenario, { root, kitBin, bins, logDirectory }) {
  const started = Date.now();
  const directory = await scaffold(scenario, root, logDirectory);
  const installRoot = scenario.workspace ? path.resolve(directory, "../..") : directory;
  const command = managerCommand(scenario.manager);
  const env = {
    ...process.env,
    PATH: pathFor(scenario.manager, bins),
    ASTRO_TELEMETRY_DISABLED: "1",
    DO_NOT_TRACK: "1",
  };
  await run(`${scenario.id}-install`, command, ["install"], {
    cwd: installRoot,
    env,
    logDirectory,
  });

  const requestLog = path.join(logDirectory, `${scenario.id}-registry-requests.log`);
  // Empty npm and pnpm metadata caches make them read the kit registry instead of earlier data.
  // Bun keeps its cache: it relinks installed packages from it, and its metadata cache key includes
  // the registry port. The request log proves the routing for every manager.
  const caches = path.join(root, "caches", scenario.id);
  const offlineEnvironment = {
    ...env,
    STARWIND_OFFLINE_REQUEST_LOG: requestLog,
    npm_config_cache: path.join(caches, "npm"),
    pnpm_config_cache_dir: path.join(caches, "pnpm"),
    // pnpm 10 and earlier read the npm-style name.
    npm_config_cache_dir: path.join(caches, "pnpm"),
  };
  const offline = (label, cliArgs) => {
    const wrapped = offlineCommand(process.execPath, [kitBin, ...cliArgs]);
    return run(`${scenario.id}-${label}`, wrapped.command, wrapped.args, {
      cwd: directory,
      env: offlineEnvironment,
      logDirectory,
    });
  };
  const frameworkArgs =
    scenario.framework && scenario.host === "astro" ? ["--framework", scenario.framework] : [];
  await offline("init", ["init", "--defaults", ...frameworkArgs]);
  await assertServedByKit(
    requestLog,
    scenario.host === "astro" && !scenario.framework ? "astro" : "react",
  );
  await offline("add", ["add", "button", "dialog", ...frameworkArgs, "--yes"]);
  if (scenario.pinPnpm) {
    const pinned = JSON.parse(
      await readFile(path.join(directory, "package.json"), "utf8"),
    ).packageManager;
    const modules = await readFile(path.join(directory, "node_modules/.modules.yaml"), "utf8");
    // pnpm 11 and later write this file as JSON; earlier versions write YAML.
    if (!new RegExp(`"?packageManager"?:\\s*"?${pinned.replace(/\./g, "\\.")}"?`).test(modules)) {
      throw new Error(`The offline install did not run the pinned ${pinned}.`);
    }
  }
  if (scenario.host === "astro" && !scenario.framework) {
    // A second offline install of new packages, after the first one changed the lockfile.
    await offline("add-react", ["add", "button", "--framework", "react", "--yes"]);
    await assertServedByKit(requestLog, "react");
  }

  if (scenario.host === "astro") {
    await writeFile(
      path.join(directory, "src/pages/index.astro"),
      scenario.framework ? ASTRO_REACT_PAGE : ASTRO_PAGE,
    );
  } else {
    await writeFile(path.join(directory, "src/App.jsx"), VITE_APP);
  }
  // Astro does not support Yarn Plug'n'Play builds, with or without the kit.
  if (scenario.manager !== "yarn4-pnp") {
    const build = offlineCommand(command, ["run", "build"]);
    await run(`${scenario.id}-build`, build.command, build.args, {
      cwd: directory,
      env,
      logDirectory,
    });
  }

  await assertNoLocalRegistry(installRoot);
  await assertNoLocalRegistry(directory);
  await rm(path.join(installRoot, "node_modules"), { recursive: true, force: true });
  await rm(path.join(directory, "node_modules"), { recursive: true, force: true });
  await run(`${scenario.id}-frozen-install`, command, FROZEN_INSTALL[scenario.manager], {
    cwd: installRoot,
    env,
    logDirectory,
  });
  return { id: scenario.id, seconds: Math.round((Date.now() - started) / 1000) };
}

/** A command that needs a package outside the kit stops with a clear message. */
async function runMissingPackageScenario({ root, kitBin, logDirectory }) {
  const directory = path.join(root, "missing-astro");
  await mkdir(path.join(directory, "src/pages"), { recursive: true });
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ name: "missing-astro", private: true, type: "module" }),
  );
  await writeFile(path.join(directory, "astro.config.mjs"), "export default {};\n");
  await writeFile(
    path.join(directory, "package-lock.json"),
    JSON.stringify({ name: "missing-astro", lockfileVersion: 3, packages: {} }),
  );
  const wrapped = offlineCommand(process.execPath, [kitBin, "init", "--defaults"]);
  const { code, output } = await run("missing-astro-init", wrapped.command, wrapped.args, {
    cwd: directory,
    env: process.env,
    logDirectory,
    allowFailure: true,
  });
  if (code === 0 || !/offline kit does not contain astro\b/.test(output)) {
    throw new Error(
      `Offline init without Astro should name astro. Exit ${code}.\n${output.slice(-2000)}`,
    );
  }
  if (existsSync(path.join(directory, "node_modules"))) {
    throw new Error("Offline init without Astro ran the package manager before it stopped.");
  }
  return { id: "missing-astro", seconds: 0 };
}

/** Yarn 1 and Bun stop with a clear message instead of failing partway through an install. */
async function runRefusedManagerScenario(manager, { root, kitBin, bins, logDirectory }) {
  const id = `${manager}-refused`;
  const directory = path.join(root, id);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ name: id, private: true, type: "module", dependencies: { astro: "^7.4.5" } }),
  );
  await writeFile(path.join(directory, "astro.config.mjs"), "export default {};\n");
  await writeFile(path.join(directory, manager === "bun" ? "bun.lock" : "yarn.lock"), "");
  // Offline init checks the installed Astro before it reaches the package manager.
  await mkdir(path.join(directory, "node_modules/astro"), { recursive: true });
  await writeFile(
    path.join(directory, "node_modules/astro/package.json"),
    JSON.stringify({ name: "astro", version: "7.4.5" }),
  );
  const wrapped = offlineCommand(process.execPath, [kitBin, "init", "--defaults"]);
  const { code, output } = await run(`${id}-init`, wrapped.command, wrapped.args, {
    cwd: directory,
    env: { ...process.env, PATH: `${bins[manager]}${path.delimiter}${process.env.PATH}` },
    logDirectory,
    allowFailure: true,
  });
  const expected = manager === "bun" ? /does not support Bun/ : /does not support Yarn 1/;
  if (code === 0 || !expected.test(output)) {
    throw new Error(
      `Offline init with ${manager} should refuse. Exit ${code}.\n${output.slice(-2000)}`,
    );
  }
  return { id, seconds: 0 };
}

async function packDirectory(directory, destination, logDirectory) {
  const { output } = await run(
    `pack-${path.basename(directory)}`,
    "npm",
    ["pack", "--pack-destination", destination],
    { cwd: directory, logDirectory },
  );
  return path.join(destination, output.trim().split("\n").at(-1));
}

/** Installs either a freshly built test kit or a published kit version into `kitHome`. */
async function installKit({ root, kitHome, logDirectory, localArchives, published }) {
  await mkdir(kitHome);
  await writeFile(path.join(kitHome, "package.json"), '{"private":true}');
  if (published) {
    await run(
      "kit-install",
      "npm",
      ["install", `@starwind-ui/offline@${published}`, "--no-audit", "--no-fund"],
      { cwd: kitHome, logDirectory },
    );
    return;
  }
  await run("cli-build", "pnpm", ["--filter", "starwind", "build"], {
    cwd: REPO_ROOT,
    logDirectory,
  });
  const packs = path.join(root, "packs");
  await mkdir(packs, { recursive: true });
  await run("cli-pack", "pnpm", ["pack", "--pack-destination", packs], {
    cwd: path.join(REPO_ROOT, "packages/cli"),
    logDirectory,
  });
  const cliArchive = path.join(
    packs,
    (await readdir(packs)).find((file) => file.startsWith("starwind-")),
  );
  const kit = await buildOfflineKit({
    outputDirectory: path.join(root, "kit"),
    platforms: selectPlatforms("current"),
    localArchives,
  });
  const archives = [cliArchive, await packDirectory(kit.mainDirectory, packs, logDirectory)];
  for (const { directory } of kit.platformDirectories)
    archives.push(await packDirectory(directory, packs, logDirectory));
  await run("kit-install", "npm", ["install", ...archives, "--no-audit", "--no-fund"], {
    cwd: kitHome,
    logDirectory,
  });
}

export async function runOfflineAcceptance({
  managers = PACKAGE_MANAGERS,
  keepTemp = false,
  localArchives = [],
  published,
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-offline-acceptance-"));
  const logDirectory = path.join(root, "logs");
  await mkdir(logDirectory, { recursive: true });
  console.log(`[offline-acceptance] Working in ${root}`);
  let failed = false;
  try {
    const kitHome = path.join(root, "kit-home");
    await installKit({ root, kitHome, logDirectory, localArchives, published });
    const kitBin = path.join(kitHome, "node_modules/@starwind-ui/offline/bin/starwind-offline.mjs");

    await assertNetworkBlocked(logDirectory);
    const bins = await prepareTools(root, logDirectory);
    const results = [
      await runMissingPackageScenario({ root, kitBin, logDirectory }),
      await runRefusedManagerScenario("yarn1", { root, kitBin, bins, logDirectory }),
      await runRefusedManagerScenario("bun", { root, kitBin, bins, logDirectory }),
    ];
    for (const scenario of createScenarios(managers)) {
      console.log(`[offline-acceptance] ${scenario.id}`);
      results.push(await runScenario(scenario, { root, kitBin, bins, logDirectory }));
    }
    console.log(
      `[offline-acceptance] Passed ${results.length} scenarios with outbound network blocked by ${process.platform === "darwin" ? "sandbox-exec" : "a network namespace"}:`,
    );
    for (const result of results) console.log(`  ${result.id} (${result.seconds}s)`);
    return results;
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    if (failed || keepTemp) console.log(`[offline-acceptance] Kept ${root}`);
    else await rm(root, { recursive: true, force: true });
  }
}

async function main() {
  // `pnpm run <script> -- --flag` forwards the separator, so drop it before strict parsing.
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((argument) => argument !== "--"),
    options: {
      managers: { type: "string" },
      "keep-temp": { type: "boolean" },
      "local-archive": { type: "string", multiple: true },
      published: { type: "string" },
    },
  });
  const managers = values.managers
    ? values.managers.split(",").map((value) => value.trim())
    : PACKAGE_MANAGERS;
  for (const manager of managers) {
    if (!PACKAGE_MANAGERS.includes(manager)) throw new Error(`Unknown package manager: ${manager}`);
  }
  await runOfflineAcceptance({
    managers,
    keepTemp: Boolean(values["keep-temp"]),
    localArchives: (values["local-archive"] ?? []).map((file) => path.resolve(file)),
    published: values.published,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
