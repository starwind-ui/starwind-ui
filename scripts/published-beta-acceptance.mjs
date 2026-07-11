#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const HOST = "127.0.0.1";

const BETA_VERSION_PATTERN = /^\d+\.\d+\.\d+-beta\.\d+$/;

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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../components/starwind/context-menu";
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Starwind published beta acceptance</title>
  </head>
  <body>
    <main class="mx-auto flex min-h-screen max-w-xl flex-col gap-10 p-10">
      <h1 class="text-2xl font-semibold">Starwind Astro published beta acceptance</h1>
      <Dialog id="acceptance-dialog">
        <DialogTrigger asChild>
          <Button id="dialog-trigger" type="button">Open dialog</Button>
        </DialogTrigger>
        <DialogContent id="dialog-content">
          <DialogHeader>
            <DialogTitle>Published package dialog</DialogTitle>
            <DialogDescription>Runtime-backed dialog acceptance test.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <ContextMenu id="acceptance-context-menu">
        <ContextMenuTrigger
          id="context-trigger"
          class="border-input bg-card flex min-h-40 items-center justify-center rounded-md border border-dashed p-6"
        >
          Right-click this area
        </ContextMenuTrigger>
        <ContextMenuContent id="context-content">
          <ContextMenuItem id="context-item">Accept action</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </main>
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./components/starwind/context-menu";

function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-10 p-10">
      <h1 className="text-2xl font-semibold">Starwind React published beta acceptance</h1>
      <Dialog id="acceptance-dialog">
        <DialogTrigger asChild>
          <Button id="dialog-trigger" type="button">Open dialog</Button>
        </DialogTrigger>
        <DialogContent id="dialog-content">
          <DialogHeader>
            <DialogTitle>Published package dialog</DialogTitle>
            <DialogDescription>Runtime-backed dialog acceptance test.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <ContextMenu id="acceptance-context-menu">
        <ContextMenuTrigger
          id="context-trigger"
          className="border-input bg-card flex min-h-40 items-center justify-center rounded-md border border-dashed p-6"
        >
          Right-click this area
        </ContextMenuTrigger>
        <ContextMenuContent id="context-content">
          <ContextMenuItem id="context-item">Accept action</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </main>
  );
}

export default App;
`;

export function parseArgs(argv) {
  let artifacts;
  let keepTemp = false;
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    } else if (argument === "--version") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Expected a value after --version.");
      version = value;
      index += 1;
    } else if (argument.startsWith("--version=")) {
      version = argument.slice("--version=".length);
    } else if (argument === "--artifacts") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Expected a path after --artifacts.");
      artifacts = value;
      index += 1;
    } else if (argument.startsWith("--artifacts=")) {
      artifacts = argument.slice("--artifacts=".length);
    } else if (argument === "--keep-temp") {
      keepTemp = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!version) throw new Error("Pass --version <version>.");
  if (!BETA_VERSION_PATTERN.test(version)) {
    throw new Error(`Expected an exact numbered beta version, received: ${version}`);
  }
  return { artifacts, keepTemp, version };
}

export function createAcceptancePlan({ root, version }) {
  const cliSpecifier = `starwind@${version}`;
  const components = ["button", "dialog", "context-menu"];
  const createProject = (framework, scaffoldArgs, { install = false } = {}) => {
    const directory = path.join(root, framework);

    return {
      add: {
        args: ["dlx", cliSpecifier, "add", ...components, "--yes"],
        cwd: directory,
      },
      build: { args: ["build"], cwd: directory },
      directory,
      framework,
      init: {
        args: ["dlx", cliSpecifier, "init", "--defaults", `--${framework}`],
        cwd: directory,
      },
      ...(install ? { install: { args: ["install"], cwd: directory } } : {}),
      scaffold: { args: scaffoldArgs, cwd: root },
      version: { args: ["dlx", cliSpecifier, "--version"], cwd: directory },
    };
  };

  return {
    cliSpecifier,
    projects: [
      createProject("astro", [
        "create",
        "astro@latest",
        "astro",
        "--template",
        "minimal",
        "--install",
        "--no-git",
        "--yes",
      ]),
      createProject(
        "react",
        ["create", "vite@latest", "react", "--template", "react-ts", "--no-interactive"],
        { install: true },
      ),
    ],
    root,
    version,
  };
}

export function getFixtureFiles(framework) {
  if (framework === "astro") {
    return [{ content: ASTRO_FIXTURE, path: "src/pages/index.astro" }];
  }
  if (framework === "react") {
    return [{ content: REACT_FIXTURE, path: "src/App.tsx" }];
  }

  throw new Error(`Unsupported acceptance framework: ${framework}`);
}

function getPnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function quoteWindowsCommandArg(argument) {
  if (/^[A-Za-z0-9._:/=@+-]+$/.test(argument)) return argument;
  if (/["&<>|^%!\r\n]/.test(argument)) {
    throw new Error(`Cannot safely pass argument to cmd.exe: ${argument}`);
  }
  return `"${argument}"`;
}

function createSpawn(command, args) {
  if (process.platform === "win32" && command.endsWith(".cmd")) {
    return {
      args: ["/d", "/s", "/c", [command, ...args].map(quoteWindowsCommandArg).join(" ")],
      command: "cmd.exe",
    };
  }

  return { args, command };
}

async function runCommand({ args, cwd }, { capture = false } = {}) {
  const command = getPnpmCommand();
  const spawned = createSpawn(command, args);
  console.log(`[acceptance] ${path.basename(cwd)}: ${command} ${args.join(" ")}`);

  return await new Promise((resolve, reject) => {
    let stderr = "";
    let stdout = "";
    const child = spawn(spawned.command, spawned.args, {
      cwd,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    if (capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stderr, stdout });
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed in ${cwd} with exit code ${code}.${stderr ? `\n${stderr}` : ""}`,
        ),
      );
    });
  });
}

async function writeFixtures(project) {
  for (const file of getFixtureFiles(project.framework)) {
    const target = path.join(project.directory, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content, "utf8");
  }
}

async function validateInstalledAdapter(project) {
  const projectManifest = JSON.parse(
    await readFile(path.join(project.directory, "package.json"), "utf8"),
  );
  const packageName = `@starwind-ui/${project.framework}`;
  const declaredVersion = projectManifest.dependencies?.[packageName];

  assert.equal(typeof declaredVersion, "string", `${packageName} must be a project dependency`);
  assert.doesNotMatch(
    declaredVersion,
    /^(?:workspace|file|link):/,
    `${packageName} must come from npm`,
  );

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
  assert.equal(
    adapterManifest.version,
    declaredVersion,
    `${packageName} must install its exact version`,
  );
  assert.match(
    adapterManifest.version,
    BETA_VERSION_PATTERN,
    `${packageName} must be a numbered beta`,
  );
  assert.match(
    adapterManifest.dependencies?.["@starwind-ui/runtime"] ?? "",
    BETA_VERSION_PATTERN,
    `${packageName} must depend on an exact Runtime beta`,
  );

  return {
    adapter: `${packageName}@${adapterManifest.version}`,
    runtime: `@starwind-ui/runtime@${adapterManifest.dependencies["@starwind-ui/runtime"]}`,
  };
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : undefined;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function resolvePreviewBin(project) {
  const projectRequire = createRequire(path.join(project.directory, "package.json"));
  const packageName = project.framework === "astro" ? "astro" : "vite";
  const packageJsonPath = projectRequire.resolve(`${packageName}/package.json`);
  return path.join(
    path.dirname(packageJsonPath),
    project.framework === "astro" ? "bin/astro.mjs" : "bin/vite.js",
  );
}

function startPreview(project, port) {
  const child = spawn(
    process.execPath,
    [resolvePreviewBin(project), "preview", "--host", HOST, "--port", String(port)],
    {
      cwd: project.directory,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  return { child, getOutput: () => output };
}

async function waitForPreview(url, preview) {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    if (preview.child.exitCode !== null) {
      throw new Error(`Preview exited before it became ready.\n${preview.getOutput()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview socket is not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}.\n${preview.getOutput()}`);
}

async function stopPreview(preview) {
  if (preview.child.exitCode !== null) return;
  preview.child.kill();
  await Promise.race([
    new Promise((resolve) => preview.child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
}

async function verifyBrowserProject({ artifacts, browser, project }) {
  const port = await getFreePort();
  const url = `http://${HOST}:${port}/`;
  const preview = startPreview(project, port);
  const page = await browser.newPage({ viewport: { height: 900, width: 1280 } });
  const browserErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console error: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`page error: ${error.message}`));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown failure";
    if (failure !== "net::ERR_ABORTED") {
      browserErrors.push(`request failed: ${request.url()} ${failure}`);
    }
  });

  try {
    await waitForPreview(url, preview);
    await page.goto(url, { waitUntil: "networkidle" });
    await page
      .getByRole("heading", { name: new RegExp(`${project.framework} published beta`, "i") })
      .waitFor();

    const dialogTrigger = page.getByRole("button", { name: "Open dialog" });
    await dialogTrigger.click();
    const dialog = page.getByRole("dialog", { name: "Published package dialog" });
    await dialog.waitFor({ state: "visible" });
    await dialog.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await page.evaluate(() => document.activeElement?.id),
      "dialog-trigger",
      `${project.framework} Dialog must restore focus after Escape`,
    );

    await page.locator("#context-trigger").click({ button: "right" });
    const menuItem = page.getByRole("menuitem", { name: "Accept action" });
    await menuItem.waitFor({ state: "visible" });
    await menuItem.click();
    await menuItem.waitFor({ state: "hidden" });

    assert.deepEqual(browserErrors, [], `${project.framework} browser errors`);
    console.log(`[acceptance] ${project.framework} browser behavior passed at ${url}`);
  } catch (error) {
    await page.screenshot({
      fullPage: true,
      path: path.join(artifacts, `${project.framework}-failure.png`),
    });
    throw error;
  } finally {
    await writeFile(
      path.join(artifacts, `${project.framework}-preview.log`),
      preview.getOutput(),
      "utf8",
    );
    await page.close();
    await stopPreview(preview);
  }
}

export async function runPublishedBetaAcceptance(options) {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-published-beta-"));
  const artifacts = options.artifacts
    ? path.resolve(options.artifacts)
    : await mkdtemp(path.join(os.tmpdir(), "starwind-published-beta-artifacts-"));
  const plan = createAcceptancePlan({ root, version: options.version });
  const packageVersions = [];
  let browser;

  await mkdir(artifacts, { recursive: true });
  console.log(`[acceptance] temporary projects: ${root}`);
  console.log(`[acceptance] diagnostic artifacts: ${artifacts}`);

  try {
    for (const project of plan.projects) {
      await runCommand(project.scaffold);
      if (project.install) await runCommand(project.install);
      const versionResult = await runCommand(project.version, { capture: true });
      assert.equal(
        versionResult.stdout.trim(),
        options.version,
        `Published CLI version must equal ${options.version}`,
      );
      await runCommand(project.init);
      await runCommand(project.add);
      await writeFixtures(project);
      packageVersions.push({
        framework: project.framework,
        ...(await validateInstalledAdapter(project)),
      });
      await runCommand(project.build);
    }

    const reactDemoRequire = createRequire(path.join(REPO_ROOT, "apps/react-demo/package.json"));
    const { chromium } = reactDemoRequire("playwright");
    browser = await chromium.launch({ headless: true });

    for (const project of plan.projects) {
      await verifyBrowserProject({ artifacts, browser, project });
    }

    await writeFile(
      path.join(artifacts, "summary.json"),
      `${JSON.stringify({ cli: `starwind@${options.version}`, packages: packageVersions }, null, 2)}\n`,
      "utf8",
    );
    console.log(`[acceptance] published beta ${options.version} passed in Astro and React`);
  } finally {
    await browser?.close();
    if (options.keepTemp) console.log(`[acceptance] preserved temporary projects: ${root}`);
    else await rm(root, { force: true, recursive: true });
  }

  return { artifacts, packageVersions };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await runPublishedBetaAcceptance(options);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}
