#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { getPackageManagerCommand } from "./command-process.mjs";
import {
  getFixtureFiles,
  runCommand,
  verifyBrowserProject,
} from "./published-release-acceptance.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const NEXT_SCAFFOLD_VERSION = "16.3.0";
const REACT_ROUTER_SCAFFOLD_VERSION = "8.3.0";
const TANSTACK_CLI_VERSION = "0.70.1";
const VITE_SCAFFOLD_VERSION = "9.1.1";

function fileSpecifier(file) {
  return `file:${file.replaceAll("\\", "/")}`;
}

export async function startCandidateRegistry(packageEntries) {
  const packagesByName = new Map();
  const versionsByName = new Map(
    Object.values(packageEntries).map((entry) => [entry.name, entry.version]),
  );

  for (const entry of Object.values(packageEntries)) {
    const tarball = await readFile(entry.file);
    const packageFileName = `${entry.name.split("/").at(-1)}-${entry.version}.tgz`;
    const manifest = structuredClone(entry.manifest ?? {});
    for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
      for (const [dependencyName, dependencyVersion] of Object.entries(manifest[field] ?? {})) {
        if (!dependencyVersion.startsWith("workspace:")) continue;
        const packedVersion = versionsByName.get(dependencyName);
        assert(packedVersion, `Missing packed workspace dependency ${dependencyName}`);
        const workspaceRange = dependencyVersion.slice("workspace:".length);
        manifest[field][dependencyName] =
          workspaceRange === "*"
            ? packedVersion
            : workspaceRange === "^" || workspaceRange === "~"
              ? `${workspaceRange}${packedVersion}`
              : workspaceRange;
      }
    }
    packagesByName.set(entry.name, {
      ...entry,
      integrity: `sha512-${createHash("sha512").update(tarball).digest("base64")}`,
      manifest,
      packageFileName,
      shasum: createHash("sha1").update(tarball).digest("hex"),
      tarball,
    });
  }

  let registryUrl = "";
  const server = createServer((request, response) => {
    if (request.method !== "GET" || !request.url) {
      response.writeHead(405).end();
      return;
    }

    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const entry = [...packagesByName.values()].find(
      (candidate) =>
        requestPath === `/${candidate.name}` ||
        requestPath === `/${candidate.name}/-/${candidate.packageFileName}`,
    );
    if (!entry) {
      response.writeHead(404).end();
      return;
    }

    if (requestPath.endsWith(`/-/${entry.packageFileName}`)) {
      response.writeHead(200, {
        "content-length": entry.tarball.length,
        "content-type": "application/octet-stream",
      });
      response.end(entry.tarball);
      return;
    }

    const tarballUrl = `${registryUrl}/${entry.name}/-/${entry.packageFileName}`;
    const body = JSON.stringify({
      "dist-tags": { beta: entry.version },
      name: entry.name,
      versions: {
        [entry.version]: {
          ...entry.manifest,
          dist: { integrity: entry.integrity, shasum: entry.shasum, tarball: tarballUrl },
          name: entry.name,
          version: entry.version,
        },
      },
    });
    response.writeHead(200, {
      "content-length": Buffer.byteLength(body),
      "content-type": "application/json",
    });
    response.end(body);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  registryUrl = `http://127.0.0.1:${address.port}`;

  return {
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
    url: registryUrl,
  };
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
    {
      framework: "react",
      frameworkVersion: "18.3.1",
      host: "vite",
      id: "react-18",
      packageManager: "pnpm",
    },
    {
      framework: "react",
      frameworkVersion: "19.2.0",
      host: "vite",
      id: "react-19",
      packageManager: "pnpm",
    },
    {
      framework: "react",
      frameworkVersion: "19.2.0",
      host: "vite",
      id: "react-19-js",
      language: "javascript",
      packageManager: "pnpm",
    },
    {
      browser: false,
      framework: "react",
      frameworkVersion: "19.2.0",
      host: "vite",
      id: "react-19-npm",
      packageManager: "npm",
    },
    {
      framework: "react",
      frameworkVersion: "19.2.0",
      host: "next-app",
      id: "next-app",
      packageManager: "pnpm",
    },
    {
      framework: "react",
      frameworkVersion: "19.2.0",
      host: "next-pages",
      id: "next-pages",
      packageManager: "pnpm",
    },
    {
      framework: "react",
      frameworkVersion: "19.2.0",
      host: "tanstack-start",
      id: "tanstack-start",
      packageManager: "pnpm",
    },
    {
      framework: "react",
      frameworkVersion: "19.2.0",
      host: "react-router",
      id: "react-router",
      packageManager: "pnpm",
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

  if (entry.host === "next-app" || entry.host === "next-pages") {
    return [
      "dlx",
      `create-next-app@${NEXT_SCAFFOLD_VERSION}`,
      entry.id,
      "--ts",
      "--tailwind",
      "--eslint",
      entry.host === "next-app" ? "--app" : "--no-app",
      entry.host === "next-app" ? "--src-dir" : "--no-src-dir",
      "--import-alias",
      "@/*",
      "--use-pnpm",
      "--skip-install",
      "--disable-git",
      "--yes",
    ];
  }

  if (entry.host === "tanstack-start") {
    return [
      "dlx",
      `@tanstack/cli@${TANSTACK_CLI_VERSION}`,
      "create",
      entry.id,
      "--framework",
      "React",
      "--package-manager",
      "pnpm",
      "--no-install",
      "--no-examples",
      "--no-git",
      "--no-intent",
      "--yes",
    ];
  }

  if (entry.host === "react-router") {
    return [
      "dlx",
      `create-react-router@${REACT_ROUTER_SCAFFOLD_VERSION}`,
      entry.id,
      "--package-manager",
      "pnpm",
      "--no-install",
      "--no-git-init",
      "--no-agent-skills",
      "--yes",
    ];
  }

  return [
    "create",
    `vite@${VITE_SCAFFOLD_VERSION}`,
    entry.id,
    "--template",
    entry.language === "javascript" ? "react" : "react-ts",
    "--no-interactive",
  ];
}

export function createCandidatePlan({ packages, projectIds, root }) {
  const cliEntrypoint = path.join(root, "node_modules", "starwind", "dist", "index.js");
  const matrix = getCandidateMatrix();
  const selectedIds = projectIds ? new Set(projectIds) : undefined;
  if (selectedIds) {
    for (const id of selectedIds) {
      if (!matrix.some((entry) => entry.id === id)) {
        throw new Error(`Unknown candidate project: ${id}`);
      }
    }
  }
  const projects = matrix
    .filter((entry) => !selectedIds || selectedIds.has(entry.id))
    .map((entry) => {
      const directory = path.join(root, entry.id);
      const command = entry.packageManager === "npm" ? getPackageManagerCommand("npm") : undefined;
      const packageManagerArgs = entry.packageManager === "npm" ? ["--package-manager", "npm"] : [];
      const lifecycleComponent = entry.host === "next-pages" ? "dialog" : "button";
      const isJavaScript = entry.language === "javascript";
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
            : entry.host === "react-router"
              ? ["typecheck"]
              : isJavaScript
                ? ["exec", "tsc", "--noEmit", "--project", "tsconfig.json"]
                : entry.packageManager === "npm"
                  ? ["exec", "tsc", "--", "--noEmit"]
                  : ["exec", "tsc", "--noEmit"],
        ),
        directory,
        init: cli(["init", "--defaults"]),
        lint:
          entry.host === "next-app" || entry.host === "next-pages"
            ? { cwd: directory, manifestScript: "lint" }
            : undefined,
        localAdapter: packages[entry.framework],
        preview: getCandidatePreview(entry),
        readd: cli(["add", lifecycleComponent, "--yes", ...packageManagerArgs]),
        remove: cli(["remove", lifecycleComponent, "--yes"]),
        scaffold: { args: getScaffoldArgs(entry), cwd: root },
        ssrMarker: entry.host && entry.host !== "vite" ? "data-sw-color-picker" : undefined,
        ssr:
          entry.host === "vite"
            ? packageCommand(
                entry.packageManager === "npm"
                  ? [
                      "exec",
                      "vite",
                      "--",
                      "build",
                      "--ssr",
                      `src/acceptance-ssr.${isJavaScript ? "jsx" : "tsx"}`,
                      "--outDir",
                      "dist-ssr",
                    ]
                  : [
                      "exec",
                      "vite",
                      "build",
                      "--ssr",
                      `src/acceptance-ssr.${isJavaScript ? "jsx" : "tsx"}`,
                      "--outDir",
                      "dist-ssr",
                    ],
              )
            : undefined,
        themeInitScriptCount:
          entry.host === "next-app" || entry.host === "next-pages" || entry.host === "react-router"
            ? 1
            : undefined,
        typegen:
          entry.host === "next-app" || entry.host === "next-pages"
            ? packageCommand(["exec", "next", "typegen"])
            : entry.host === "tanstack-start"
              ? packageCommand(["generate-routes"])
              : undefined,
        update: cli(["update", "button", "--yes", ...packageManagerArgs]),
      };
    });

  return { cliEntrypoint, packages, projects, root };
}

function getCandidatePreview(entry) {
  if (entry.host === "next-app" || entry.host === "next-pages") {
    return {
      args: ["--hostname", "{host}", "--port", "{port}"],
      script: "start",
    };
  }
  if (entry.host === "react-router") return { args: [], script: "start" };
  return { args: ["--host", "{host}", "--port", "{port}"], script: "preview" };
}

export function getCandidateWorkspacePolicy(_projects, packages) {
  return `packages: []\nminimumReleaseAge: 0\nminimumReleaseAgeStrict: false\nallowBuilds:\n  esbuild: true\n  sharp: true\n  unrs-resolver: true\noverrides:\n  "@starwind-ui/astro": "${fileSpecifier(packages.astro)}"\n  "@starwind-ui/react": "${fileSpecifier(packages.react)}"\n  "@starwind-ui/runtime": "${fileSpecifier(packages.runtime)}"\n  starwind: "${fileSpecifier(packages.cli)}"\n`;
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
      ...(project.language === "javascript" ? { "@types/node": "^24.0.0" } : {}),
      "@types/react": typeVersion,
      "@types/react-dom": typeVersion,
      ...(project.language === "javascript" ? { typescript: "^5.9.3" } : {}),
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

function createReactHostFixture({ importRoot, routeImport = "", routeRegistration = "" }) {
  return `${routeImport}import { Button } from "${importRoot}/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "${importRoot}/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "${importRoot}/context-menu";
import { ColorPicker } from "${importRoot}/color-picker";

${routeRegistration}${routeRegistration ? "" : "export default "}function AcceptancePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-10 p-10">
      <h1 className="text-2xl font-semibold">React published release acceptance</h1>
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
      <ColorPicker
        id="acceptance-color-picker"
        label="Accent color"
        defaultValue="#336699"
        swatches={[{ value: "#ff0000", label: "Published red" }]}
      />
    </main>
  );
}
`;
}

export function getCandidateFixtureFiles(project) {
  if (project.framework === "astro" || project.host === "vite") {
    const files = getFixtureFiles(project.framework);
    return project.language === "javascript"
      ? files.map((file) => ({ ...file, path: file.path.replace(/\.tsx$/, ".jsx") }))
      : files;
  }

  if (project.host === "next-app") {
    return [
      {
        content: createReactHostFixture({ importRoot: "../components/starwind" }),
        path: "src/app/page.tsx",
      },
    ];
  }
  if (project.host === "next-pages") {
    return [
      {
        content: createReactHostFixture({ importRoot: "../components/starwind" }),
        path: "pages/index.tsx",
      },
    ];
  }
  if (project.host === "tanstack-start") {
    return [
      {
        content: createReactHostFixture({
          importRoot: "../components/starwind",
          routeImport: 'import { createFileRoute } from "@tanstack/react-router";\n',
          routeRegistration:
            'export const Route = createFileRoute("/")({ component: AcceptancePage });\n\n',
        }),
        path: "src/routes/index.tsx",
      },
    ];
  }
  if (project.host === "react-router") {
    return [
      {
        content: createReactHostFixture({ importRoot: "../components/starwind" }),
        path: "app/routes/home.tsx",
      },
    ];
  }

  throw new Error(`Unsupported candidate host: ${project.host}`);
}

async function writeCandidateFixtures(project) {
  for (const file of getCandidateFixtureFiles(project)) {
    const target = path.join(project.directory, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content, "utf8");
  }
}

async function writeSsrFixture(project) {
  if (!project.ssr) return;
  const extension = project.language === "javascript" ? "jsx" : "tsx";
  await writeFile(
    path.join(project.directory, "src", `acceptance-ssr.${extension}`),
    SSR_FIXTURE,
    "utf8",
  );
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

async function getCandidateRegistryPackages(packages) {
  const packageDirectories = {
    astro: "packages/astro",
    react: "packages/react",
    runtime: "packages/runtime",
  };
  const entries = {};

  for (const name of Object.keys(packageDirectories)) {
    const manifest = JSON.parse(
      await readFile(path.join(REPO_ROOT, packageDirectories[name], "package.json"), "utf8"),
    );
    entries[name] = {
      file: packages[name],
      manifest,
      name: manifest.name,
      version: manifest.version,
    };
  }
  return entries;
}

async function installNpmCandidatePackages(project, packages) {
  const npmCommand = getPackageManagerCommand("npm");
  await runCommand({ args: ["install"], command: npmCommand, cwd: project.directory });
  await runCommand(project.init);
  await runCommand({
    args: ["install", packages.runtime, project.localAdapter, "--save-exact"],
    command: npmCommand,
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
  await runCommand(project.readd);
  await writeCandidateFixtures(project);
  await writeSsrFixture(project);
  await validateCandidateAdapter(project);
  const manifest = JSON.parse(await readFile(path.join(project.directory, "package.json"), "utf8"));
  for (const phase of createCandidateVerificationPlan(project, manifest)) {
    if (phase.name === "lint") {
      console.log(
        `[candidate] ${project.id} lint: ${manifest.scripts[project.lint.manifestScript]}`,
      );
    }
    await runCommand(phase.command);
  }

  if (project.ssr) {
    await runCommand(project.ssr);
    await runCommand({
      args: [path.join(project.directory, "dist-ssr", "acceptance-ssr.js")],
      command: process.execPath,
      cwd: project.directory,
    });
  }
}

export function getCandidateManifestScriptCommand({ cwd, manifestScript }, manifest) {
  const script = manifest.scripts?.[manifestScript];
  assert.equal(typeof script, "string", `Missing ${manifestScript} script in ${cwd}`);
  return { args: ["run", manifestScript], cwd };
}

export function createCandidateVerificationPlan(project, manifest = {}) {
  return [
    ...(project.lint
      ? [{ command: getCandidateManifestScriptCommand(project.lint, manifest), name: "lint" }]
      : []),
    ...(project.typegen ? [{ command: project.typegen, name: "typegen" }] : []),
    { command: project.check, name: "check" },
    { command: project.build, name: "build" },
  ];
}

export async function runReleaseCandidateAcceptance({
  artifacts: artifactsOption,
  keepTemp = false,
  projectIds,
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-release-candidate-"));
  const artifacts = artifactsOption
    ? path.resolve(artifactsOption)
    : await mkdtemp(path.join(os.tmpdir(), "starwind-release-candidate-artifacts-"));
  const packages = await packWorkspacePackages(path.join(root, "packs"));
  const plan = createCandidatePlan({ packages, projectIds, root });
  let browser;
  let registry;

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
    registry = await startCandidateRegistry(await getCandidateRegistryPackages(packages));
    for (const project of plan.projects) {
      await runCommand(project.scaffold);
      await prepareProjectManifest(project);
      await writeFile(
        path.join(project.directory, ".npmrc"),
        `@starwind-ui:registry=${registry.url}\n`,
        "utf8",
      );
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

    const summary = plan.projects.map(
      ({ framework, frameworkVersion, host, id, packageManager }) => ({
        framework,
        frameworkVersion,
        ...(host ? { host } : {}),
        id,
        packageManager,
      }),
    );
    await writeFile(path.join(artifacts, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    console.log("[candidate] packed Astro and React release candidate matrix passed");
    return { artifacts, summary };
  } finally {
    await browser?.close();
    await registry?.close();
    if (keepTemp) console.log(`[candidate] preserved temporary projects: ${root}`);
    else await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 500 });
  }
}

export function parseArgs(argv) {
  let artifacts;
  let keepTemp = false;
  const projectIds = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--keep-temp") keepTemp = true;
    else if (argument === "--artifacts") {
      artifacts = argv[index + 1];
      if (!artifacts) throw new Error("Expected a path after --artifacts.");
      index += 1;
    } else if (argument === "--project") {
      const projectId = argv[index + 1];
      if (!projectId) throw new Error("Expected an id after --project.");
      projectIds.push(projectId);
      index += 1;
    } else if (argument.startsWith("--project=")) {
      projectIds.push(argument.slice("--project=".length));
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return { artifacts, keepTemp, projectIds: projectIds.length > 0 ? projectIds : undefined };
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
