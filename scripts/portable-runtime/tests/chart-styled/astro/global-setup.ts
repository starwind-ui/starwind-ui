import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
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
  // The docs example is one Astro page built from chart parts. It needs no chart module.
  const pageSource = primitiveDocsExamples.chart?.basic?.astro?.code;
  if (!pageSource) throw new Error("Missing Astro chart docs example");
  if (/<script>/.test(pageSource))
    throw new Error("The Astro chart docs example must not need a page script");
  const directory = astroChartFixtureDirectory();
  const pageDirectory = path.join(directory, "docs-example/src/pages");
  const pagePath = path.join(pageDirectory, "example.astro");
  mkdirSync(pageDirectory, { recursive: true });
  writeFileSync(pagePath, pageSource);
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
  }
}
