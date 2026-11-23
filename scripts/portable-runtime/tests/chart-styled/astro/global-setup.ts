import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

import { primitiveDocsExamples } from "../../../docs/layered-docs/examples.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// The same root text as vitest.config.ts, so the folder hash matches its temporary root.
const root = fileURLToPath(new URL("../../../../../", import.meta.url));

/** Where the rendered fixtures live. The Vite config allows the browser to read this folder. */
export function astroChartFixtureDirectory(): string {
  const workspaceId = createHash("sha256").update(root).digest("hex").slice(0, 12);
  return path.join(tmpdir(), "starwind-chart-styled", workspaceId, "astro");
}

// The fixtures render in a child process, so their Vite server stays apart from the browser run.
// Server HTML is too large for provided context, so the browser fetches it from a file.
export default function setup(project: TestProject) {
  // The docs store both files in one code string. Split that exact string into files for Astro.
  const code = primitiveDocsExamples.chart?.basic?.astro?.code;
  if (!code) throw new Error("Missing Astro chart docs example");
  const match =
    /^\/\/ src\/charts\/visitors\.ts\n([\s\S]+?)\n\/\/ src\/pages\/example\.astro\n([\s\S]+)$/.exec(
      code,
    );
  if (!match) throw new Error("Astro chart docs example file markers changed");
  const [, moduleSource, pageSource] = match;
  const clientScript = /<script>\s*import ["']([^"']+)["'];\s*<\/script>/.exec(pageSource!);
  if (!clientScript)
    throw new Error("Astro chart docs example must import its module in a client script");
  const directory = astroChartFixtureDirectory();
  const docsRoot = path.join(directory, "docs-example");
  const chartDirectory = path.join(docsRoot, "src/charts");
  const pageDirectory = path.join(docsRoot, "src/pages");
  const modulePath = path.join(chartDirectory, "visitors.ts");
  const pagePath = path.join(pageDirectory, "example.astro");
  if (`${path.resolve(pageDirectory, clientScript[1]!)}.ts` !== modulePath) {
    throw new Error("Astro chart docs client script must import the example module");
  }
  mkdirSync(chartDirectory, { recursive: true });
  mkdirSync(pageDirectory, { recursive: true });
  const dependencyDirectory = path.join(docsRoot, "node_modules/@tanstack");
  mkdirSync(dependencyDirectory, { recursive: true });
  const dependencyLink = path.join(dependencyDirectory, "charts");
  try {
    symlinkSync(
      path.join(root, "packages/runtime/node_modules/@tanstack/charts"),
      dependencyLink,
      "dir",
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  writeFileSync(modulePath, moduleSource!);
  writeFileSync(pagePath, pageSource!);
  project.provide("astroDocsChartModuleUrl", `/@fs${modulePath}`);
  const output = execFileSync(
    path.join(root, "node_modules/.bin/tsx"),
    [path.join(here, "render-fixtures.ts"), pagePath],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "fixtures.json");
  writeFileSync(file, output);
  project.provide("astroChartFixturesUrl", `/@fs${file}`);
}

declare module "vitest" {
  export interface ProvidedContext {
    astroChartFixturesUrl: string;
    astroDocsChartModuleUrl: string;
  }
}
