import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  createAcceptancePlan,
  getAcceptanceCleanupOptions,
  getAcceptancePnpmEnvironment,
  getAcceptanceRootPackage,
  getAcceptanceWorkspacePolicy,
  getFixtureFiles,
  getPreviewEnvironment,
  isPreviewTreeAlive,
  parseArgs,
  stopPreviewTree,
} from "../published-release-acceptance.mjs";

describe("published release acceptance", () => {
  it("isolates disposable projects from local minimum-release-age policy", () => {
    expect(getAcceptancePnpmEnvironment()).toEqual({
      PNPM_CONFIG_MINIMUM_RELEASE_AGE: "0",
      PNPM_CONFIG_MINIMUM_RELEASE_AGE_STRICT: "false",
    });
    expect(getAcceptanceWorkspacePolicy()).toBe(`packages:
  - astro
  - react
minimumReleaseAge: 0
minimumReleaseAgeStrict: false
allowBuilds:
  esbuild: true
`);
    expect(JSON.parse(getAcceptanceRootPackage("3.0.0-beta.1"))).toMatchObject({
      devDependencies: { starwind: "3.0.0-beta.1" },
      private: true,
    });
  });

  it("keeps Astro preview attached to the acceptance process", () => {
    expect(getPreviewEnvironment({ CODEX_THREAD_ID: "test-thread" })).toMatchObject({
      ASTRO_PREVIEW_BACKGROUND: "0",
      ASTRO_TELEMETRY_DISABLED: "1",
      CODEX_THREAD_ID: "test-thread",
    });
  });

  it("retries temporary-project cleanup for transient Windows locks", () => {
    expect(getAcceptanceCleanupOptions()).toEqual({
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 500,
    });
  });

  it.skipIf(process.platform === "win32")("stops a detached preview process group", async () => {
    const child = spawn(
      process.execPath,
      ["-e", "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"],
      { detached: true, stdio: "ignore" },
    );
    const preview = { child, getOutput: () => "" };

    await stopPreviewTree(preview);

    expect(child.exitCode ?? child.signalCode).not.toBeNull();
    expect(isPreviewTreeAlive(preview)).toBe(false);
  });

  it("requires an exact prerelease or stable CLI version", () => {
    expect(parseArgs(["--version", "3.0.0-beta.1"])).toEqual({
      artifacts: undefined,
      keepTemp: false,
      version: "3.0.0-beta.1",
    });
    expect(parseArgs(["--", "--version", "3.0.0-beta.1"])).toEqual({
      artifacts: undefined,
      keepTemp: false,
      version: "3.0.0-beta.1",
    });

    expect(parseArgs(["--version", "3.0.0"])).toMatchObject({ version: "3.0.0" });
    expect(parseArgs(["--version", "3.0.0-rc.2"])).toMatchObject({ version: "3.0.0-rc.2" });
    expect(() => parseArgs(["--version", "beta"])).toThrow(/exact semver version/i);
    expect(() => parseArgs([])).toThrow(/--version/);
    expect(() => parseArgs(["--version", "3.0.0-beta.1", "--artifacts"])).toThrow(
      /path after --artifacts/i,
    );
  });

  it("plans fresh Astro and React projects against the exact CLI version", () => {
    const root = path.resolve("published-beta-test-root");
    const plan = createAcceptancePlan({ root, version: "3.0.0-beta.1" });

    expect(plan.projects.map((project) => project.framework)).toEqual(["astro", "react"]);
    expect(plan.projects.map((project) => project.directory)).toEqual([
      path.join(root, "astro"),
      path.join(root, "react"),
    ]);
    expect(plan.projects[0].scaffold.args).toEqual([
      "create",
      "astro@5.2.2",
      "astro",
      "--template",
      "minimal",
      "--no-install",
      "--no-git",
      "--yes",
    ]);
    expect(plan.projects[1].scaffold.args).toEqual([
      "create",
      "vite@9.1.1",
      "react",
      "--template",
      "react-ts",
      "--no-interactive",
    ]);
    expect(plan.install).toEqual({ args: ["install"], cwd: root });

    for (const project of plan.projects) {
      const cliEntrypoint = path.join(root, "node_modules", "starwind", "dist", "index.js");
      expect(project.version).toMatchObject({
        args: [cliEntrypoint, "--version"],
        command: process.execPath,
      });
      expect(project.init.args).toEqual([cliEntrypoint, "init", "--defaults"]);
      expect(project.add.args).toEqual([
        cliEntrypoint,
        "add",
        "button",
        "dialog",
        "context-menu",
        "color-picker",
        "--yes",
      ]);
    }
  });

  it("provides browser-observable Dialog and Context Menu fixtures for both frameworks", () => {
    const astro = getFixtureFiles("astro");
    const react = getFixtureFiles("react");

    expect(astro.map((file) => file.path)).toEqual(["src/pages/index.astro"]);
    expect(react.map((file) => file.path)).toEqual(["src/App.tsx"]);

    for (const fixture of [astro[0].content, react[0].content]) {
      expect(fixture).toContain('id="dialog-trigger"');
      expect(fixture).toContain('id="dialog-content"');
      expect(fixture).toContain('id="context-trigger"');
      expect(fixture).toContain('id="context-item"');
      expect(fixture).toContain('id="acceptance-color-picker"');
      expect(fixture).toContain("Published package dialog");
      expect(fixture).toContain("Accept action");
      expect(fixture).toContain("Published red");
    }
  });

  it("is exposed as an explicit root command and manual post-publish workflow", async () => {
    const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
    const workflow = await readFile(".github/workflows/published-release-acceptance.yml", "utf8");
    const releaseGuide = await readFile("docs/portable-runtime/beta-release.md", "utf8");

    expect(rootPackage.scripts["test:published-release"]).toBe(
      "node scripts/published-release-acceptance.mjs",
    );
    expect(rootPackage.scripts["test:published-beta"]).toBe("pnpm test:published-release");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("version:");
    expect(workflow).toContain("pnpm test:published-release -- --version");
    expect(workflow).toContain("playwright install --with-deps chromium");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).not.toContain("push:");
    expect(releaseGuide).toContain("pnpm test:published-release -- --version <cli-version>");
    expect(releaseGuide).not.toContain("pnpm test:published-release -- --version 3.0.0-beta.1");
  });
});
