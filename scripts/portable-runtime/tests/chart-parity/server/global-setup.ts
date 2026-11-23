import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

const here = path.dirname(fileURLToPath(import.meta.url));
// The same root text as vitest.config.ts, so the folder hash matches its temporary root.
const root = fileURLToPath(new URL("../../../../../", import.meta.url));

/** Where the server fixtures live. The Vite config allows the browser to read this folder. */
export function chartParityServerDirectory(): string {
  const workspaceId = createHash("sha256").update(root).digest("hex").slice(0, 12);
  return path.join(tmpdir(), "starwind-chart-parity", workspaceId, "server");
}

// The fixtures render in a child process, so their Vite server stays apart from the browser run.
// Server HTML is too large for provided context, so the browser fetches it from a file.
export default function setup(project: TestProject) {
  const output = execFileSync(
    path.join(root, "node_modules/.bin/tsx"),
    [path.join(here, "render-fixtures.ts")],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const directory = chartParityServerDirectory();
  mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "fixtures.json");
  writeFileSync(file, output);
  project.provide("chartParityServerUrl", `/@fs${file}`);
}

declare module "vitest" {
  export interface ProvidedContext {
    chartParityServerUrl: string;
  }
}
