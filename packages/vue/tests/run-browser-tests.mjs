import { spawn, spawnSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertVueBrowserInventory, vueBrowserProjectOwnership } from "./browser-project.ts";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const testsRoot = path.join(repoRoot, "packages/vue/tests");
const vitest = path.join(repoRoot, "packages/runtime/node_modules/vitest/vitest.mjs");
const projectTimeoutMs = 120_000;
const browserFiles = await discoverBrowserTests(testsRoot);

assertVueBrowserInventory({ browserFiles });
await assertConfigsExist();

for (const project of [...vueBrowserProjectOwnership].sort((left, right) =>
  left.component.localeCompare(right.component),
)) {
  console.log(`\n[vue:test:browser] ${project.component}`);
  const status = await runBrowserProject(project);
  if (status !== 0) process.exit(status);
}

console.log(
  `\n[vue:test:browser] passed ${browserFiles.length} files across ${vueBrowserProjectOwnership.length} sequential Chromium projects`,
);

async function runBrowserProject(project) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [vitest, "run", "--config", project.config, "--project=browser"],
      {
        cwd: repoRoot,
        detached: process.platform !== "win32",
        stdio: "inherit",
      },
    );
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      console.error(
        `[vue:test:browser] ${project.component} exceeded ${projectTimeoutMs / 1_000}s; terminating its Vitest/Chromium process tree`,
      );
      terminateProcessTree(child.pid);
    }, projectTimeoutMs);

    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (timedOut) {
        reject(
          new Error(
            `Vue browser project ${project.component} timed out after ${projectTimeoutMs / 1_000}s${signal ? ` (${signal})` : ""}.`,
          ),
        );
        return;
      }
      resolve(code ?? 1);
    });
  });
}

function terminateProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    // The child may have exited between the timeout and termination attempt.
  }
}

async function assertConfigsExist() {
  const missing = [];
  for (const { config } of vueBrowserProjectOwnership) {
    try {
      if (!(await stat(path.join(repoRoot, config))).isFile()) missing.push(config);
    } catch {
      missing.push(config);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Vue browser project configs missing on disk: ${missing.sort().join(", ")}`);
  }
}

async function discoverBrowserTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const discovered = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return discoverBrowserTests(candidate);
      if (!entry.isFile() || !entry.name.endsWith(".browser.test.ts")) return [];
      return [path.relative(repoRoot, candidate).replaceAll("\\", "/")];
    }),
  );
  return discovered.flat().sort();
}
