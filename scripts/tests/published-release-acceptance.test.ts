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
  isVueHydrationMismatchWarning,
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
  - vue
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
    expect(parseArgs(["--version", "3.0.0-beta.1", "--vue-version", "0.1.0"])).toEqual({
      artifacts: undefined,
      keepTemp: false,
      version: "3.0.0-beta.1",
      vueVersion: "0.1.0",
    });
    expect(parseArgs(["--", "--version", "3.0.0-beta.1", "--vue-version=0.1.0"])).toEqual({
      artifacts: undefined,
      keepTemp: false,
      version: "3.0.0-beta.1",
      vueVersion: "0.1.0",
    });

    expect(parseArgs(["--version", "3.0.0", "--vue-version", "0.1.0"])).toMatchObject({
      version: "3.0.0",
    });
    expect(parseArgs(["--version", "3.0.0-rc.2", "--vue-version", "0.1.0"])).toMatchObject({
      version: "3.0.0-rc.2",
    });
    expect(() => parseArgs(["--version", "beta"])).toThrow(/exact semver version/i);
    expect(() => parseArgs([])).toThrow(/--version/);
    expect(() => parseArgs(["--version", "3.0.0-beta.1"])).toThrow(/--vue-version/);
    expect(() => parseArgs(["--version", "3.0.0-beta.1", "--vue-version", "beta"])).toThrow(
      /exact Vue SemVer version/i,
    );
    expect(() =>
      parseArgs(["--version", "3.0.0-beta.1", "--vue-version", "0.1.0", "--artifacts"]),
    ).toThrow(/path after --artifacts/i);
  });

  it("plans fresh Astro and React projects against the exact CLI version", () => {
    const root = path.resolve("published-beta-test-root");
    const plan = createAcceptancePlan({
      root,
      version: "3.0.0-beta.1",
      vueVersion: "0.1.0",
    });

    expect(plan.projects.map((project) => project.framework)).toEqual(["astro", "react", "vue"]);
    expect(plan.projects.map((project) => project.directory)).toEqual([
      path.join(root, "astro"),
      path.join(root, "react"),
      path.join(root, "vue"),
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
    expect(plan.projects[2]).toMatchObject({ expectedAdapterVersion: "0.1.0" });
    expect(plan.projects[2].scaffold.args).toEqual([
      "create",
      "vite@9.1.1",
      "vue",
      "--template",
      "vue-ts",
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

  it("provides browser-observable fixtures for every public framework", () => {
    const astro = getFixtureFiles("astro");
    const react = getFixtureFiles("react");
    const vue = getFixtureFiles("vue");

    expect(astro.map((file) => file.path)).toEqual(["src/pages/index.astro"]);
    expect(react.map((file) => file.path)).toEqual(["src/App.tsx"]);
    expect(vue.map((file) => file.path)).toEqual(["src/App.vue"]);

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
    expect(vue[0].content).toContain('from "./components/starwind/dialog"');
    expect(vue[0].content).toContain("Open Vue dialog");
    expect(vue[0].content).toContain("Published Vue Runtime panel");
  });

  it("installs every component imported by each published fixture", () => {
    const plan = createAcceptancePlan({
      root: "/tmp/published",
      version: "3.3.0",
      vueVersion: "0.1.0",
    });

    for (const project of plan.projects) {
      const importedComponents = getFixtureFiles(project.framework).flatMap(({ content }) =>
        [...content.matchAll(/components\/starwind\/([a-z0-9-]+)/gu)].map((match) => match[1]),
      );

      expect(project.add.args).toEqual(expect.arrayContaining(importedComponents));
    }
  });

  it("recognizes Vue hydration mismatch warnings without capturing unrelated warnings", () => {
    expect(isVueHydrationMismatchWarning("Hydration text mismatch in <div>")).toBe(true);
    expect(isVueHydrationMismatchWarning("Hydration completed but contains mismatches.")).toBe(
      true,
    );
    expect(isVueHydrationMismatchWarning("Vue Devtools is available")).toBe(false);
  });

  it("is exposed as an explicit root command and manual post-publish workflow", async () => {
    const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
    const workflow = await readFile(".github/workflows/published-release-acceptance.yml", "utf8");

    expect(rootPackage.scripts["test:published-release"]).toBe(
      "node scripts/published-release-acceptance.mjs",
    );
    expect(rootPackage.scripts["test:published-beta"]).toBe("pnpm test:published-release");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("version:");
    expect(workflow).toContain("vue_version:");
    expect(workflow).toContain("pnpm test:published-release -- --version");
    expect(workflow).toContain('--vue-version "${{ inputs.vue_version }}"');
    expect(workflow).toContain("playwright install --with-deps chromium");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).not.toContain("push:");
  });
});
