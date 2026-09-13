import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { providers } from "./registry.mjs";

export const suiteRoot = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(suiteRoot, "../../../..");
const require = createRequire(path.join(repoRoot, "package.json"));
export const sha256 = (content) => createHash("sha256").update(content).digest("hex");
export function inventory(root, relativePaths) {
  const files = [];
  const visit = (relative) => {
    const full = path.join(root, relative);
    if (statSync(full).isDirectory()) {
      for (const name of readdirSync(full).sort())
        if (!["node_modules", ".git"].includes(name)) visit(path.join(relative, name));
    } else
      files.push({ path: relative.split(path.sep).join("/"), sha256: sha256(readFileSync(full)) });
  };
  for (const relative of relativePaths) visit(relative);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { sha256: sha256(JSON.stringify(files)), files };
}
export function sourceInventory() {
  return inventory(repoRoot, [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "packages/runtime/src",
    "packages/runtime/package.json",
    "packages/runtime/tsup.config.ts",
    "packages/react/src",
    "packages/react/package.json",
    "packages/react/tsup.config.ts",
    "scripts/portable-runtime/measure-react-interactions.mjs",
    "scripts/portable-runtime/measure-performance.mjs",
    "scripts/portable-runtime/measure-react-stress.mjs",
    "scripts/portable-runtime/runtime-performance/stress",
    "docs/portable-runtime/runtime-performance-comparison-2026-09-11.md",
    "docs/portable-runtime/diagnostics/runtime-performance-portal-validation-2026-09-11.md",
    "docs/portable-runtime/diagnostics/saved-performance-evidence",
    path.relative(repoRoot, suiteRoot),
  ]);
}
export function command(args, cwd = repoRoot) {
  return execFileSync("corepack", ["pnpm", ...args], {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    timeout: 180000,
  });
}
export function copyFrozenDependencyWorkspace(source, destination) {
  cpSync(source, destination, {
    recursive: true,
    filter: (entry) => path.basename(entry) !== "node_modules",
  });
}
export function copyFixtureApp(destination) {
  cpSync(path.join(suiteRoot, "fixtures"), destination, { recursive: true });
}
export async function prepareBuild(
  runDirectory,
  { fixtureDirectory = path.join(suiteRoot, "fixtures") } = {},
) {
  const temporaryRoot = realpathSync(
    mkdtempSync(path.join(os.tmpdir(), "starwind-react-interactions-")),
  );
  try {
    const dependencyRoot = path.join(temporaryRoot, "dependencies");
    copyFrozenDependencyWorkspace(path.join(suiteRoot, "dependencies"), dependencyRoot);
    copyFrozenDependencyWorkspace(
      path.join(suiteRoot, "dependencies"),
      path.join(runDirectory, "dependencies"),
    );
    const buildCommands = [];
    for (const args of [
      ["install", "--frozen-lockfile", "--ignore-scripts"],
      ["--filter=@starwind-ui/runtime", "build"],
      ["--filter=@starwind-ui/react", "build"],
    ]) {
      const cwd = args[0] === "install" ? dependencyRoot : repoRoot;
      const output = command(args, cwd);
      buildCommands.push({ command: `corepack pnpm ${args.join(" ")}`, cwd, output });
    }
    writeFileSync(
      path.join(runDirectory, "build-commands.json"),
      JSON.stringify(buildCommands, null, 2),
    );
    const depRequire = createRequire(path.join(dependencyRoot, "package.json"));
    const dependencyManifest = JSON.parse(
      readFileSync(path.join(dependencyRoot, "package.json"), "utf8"),
    );
    const versions = Object.fromEntries(
      Object.keys(dependencyManifest.dependencies).map((name) => [
        name,
        JSON.parse(
          readFileSync(path.join(dependencyRoot, "node_modules", name, "package.json"), "utf8"),
        ).version,
      ]),
    );
    for (const [name, pin] of Object.entries(dependencyManifest.dependencies))
      if (versions[name] !== pin) throw new Error(`Dependency identity mismatch: ${name}`);
    const store = path.join(dependencyRoot, "node_modules/.pnpm");
    const transitiveZag = readdirSync(store)
      .filter((name) => name.startsWith("@zag-js+"))
      .sort();
    const reactResolutions = readdirSync(store).filter((name) => /^react(?:-dom)?@/.test(name));
    if (
      reactResolutions.length !== 2 ||
      reactResolutions.some(
        (name) => !name.startsWith("react@19.3.0") && !name.startsWith("react-dom@19.3.0"),
      )
    )
      throw new Error("Expected one frozen React/React DOM pair.");
    const appRoot = path.join(dependencyRoot, "app");
    cpSync(fixtureDirectory, appRoot, { recursive: true });
    for (const provider of providers)
      writeFileSync(
        path.join(appRoot, `${provider}.html`),
        `<!doctype html><html><head><meta charset="utf-8"><title>${provider} menu-20</title></head><body><div id="root"></div><script type="module" src="./${provider}.jsx"></script></body></html>`,
      );
    const distRoot = path.join(runDirectory, "dist");
    const { build } = await import("vite");
    let graph;
    await build({
      root: appRoot,
      configFile: false,
      mode: "production",
      logLevel: "error",
      resolve: {
        alias: [
          {
            find: /^@starwind-ui\/react\/(.+)$/,
            replacement: path.join(repoRoot, "packages/react/dist/$1/index.js"),
          },
          {
            find: /^@starwind-ui\/runtime\/(.+)$/,
            replacement: path.join(repoRoot, "packages/runtime/dist/$1.js"),
          },
          ...[
            "react-dom/client",
            "react-dom",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react",
          ].map((name) => ({
            find: new RegExp(`^${name}$`),
            replacement: depRequire.resolve(name),
          })),
        ],
      },
      plugins: [
        {
          name: "audit-provider-entry-graphs",
          generateBundle(_, bundle) {
            graph = Object.values(bundle)
              .filter((chunk) => chunk.type === "chunk")
              .map((chunk) => ({
                fileName: chunk.fileName,
                name: chunk.name,
                isEntry: chunk.isEntry,
                imports: chunk.imports,
                modules: Object.keys(chunk.modules),
              }));
            for (const provider of providers) {
              const entry = graph.find((chunk) => chunk.isEntry && chunk.name === provider);
              if (!entry) throw new Error(`Missing production entry: ${provider}`);
              const visited = new Set();
              const visit = (chunk) => {
                if (visited.has(chunk.fileName)) return [];
                visited.add(chunk.fileName);
                return [
                  ...chunk.modules,
                  ...chunk.imports.flatMap((name) => {
                    const imported = graph.find((candidate) => candidate.fileName === name);
                    return imported ? visit(imported) : [];
                  }),
                ];
              };
              const modules = visit(entry);
              for (const other of providers.filter((candidate) => candidate !== provider)) {
                const marker =
                  other === "starwind"
                    ? "/packages/react/dist/"
                    : other === "base-ui"
                      ? "/@base-ui/react/"
                      : "/@ark-ui/react/";
                if (modules.some((module) => module.includes(marker)))
                  throw new Error(`${provider} entry imports unrelated ${other} code.`);
              }
            }
          },
        },
      ],
      build: {
        outDir: distRoot,
        emptyOutDir: true,
        minify: "esbuild",
        target: "es2022",
        rollupOptions: {
          input: Object.fromEntries(
            providers.map((provider) => [provider, path.join(appRoot, `${provider}.html`)]),
          ),
        },
      },
    });
    cpSync(path.join(appRoot, "control.html"), path.join(distRoot, "control.html"));
    writeFileSync(path.join(runDirectory, "entry-graphs.json"), JSON.stringify(graph, null, 2));
    const dependencies = {
      versions,
      transitiveZag,
      reactResolutions,
      vite: require("vite/package.json").version,
      playwright: require("playwright/package.json").version,
      frozenInputs: inventory(dependencyRoot, [
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
      ]),
    };
    return {
      temporaryRoot,
      distRoot,
      dependencies,
      bundles: inventory(distRoot, ["."]),
      localDistributions: inventory(repoRoot, ["packages/runtime/dist", "packages/react/dist"]),
    };
  } catch (error) {
    rmSync(temporaryRoot, { recursive: true, force: true });
    throw error;
  }
}

export async function serve(distRoot) {
  const server = createServer((request, response) => {
    const relative = decodeURIComponent(new URL(request.url, "http://localhost").pathname).slice(1);
    const file = path.resolve(distRoot, relative);
    if (
      !file.startsWith(`${distRoot}${path.sep}`) ||
      !existsSync(file) ||
      !statSync(file).isFile()
    ) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const mime =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
      }[path.extname(file)] ?? "application/octet-stream";
    response.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" });
    response.end(readFileSync(file));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
