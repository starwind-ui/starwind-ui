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
  isVueHydrationMismatchWarning,
  parseArgs,
  stopPreviewTree,
  validateGraduatedDistTags,
  validateInstalledAdapterManifest,
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
  - svelte
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
    expect(
      parseArgs([
        "--version",
        "3.0.0-beta.1",
        "--vue-version",
        "0.1.0",
        "--svelte-version",
        "0.1.0",
      ]),
    ).toEqual({
      artifacts: undefined,
      keepTemp: false,
      svelteVersion: "0.1.0",
      version: "3.0.0-beta.1",
      vueVersion: "0.1.0",
    });
    expect(
      parseArgs([
        "--",
        "--version",
        "3.0.0-beta.1",
        "--vue-version=0.1.0",
        "--svelte-version=0.1.0",
      ]),
    ).toEqual({
      artifacts: undefined,
      keepTemp: false,
      svelteVersion: "0.1.0",
      version: "3.0.0-beta.1",
      vueVersion: "0.1.0",
    });

    expect(
      parseArgs(["--version", "3.0.0", "--vue-version", "0.1.0", "--svelte-version", "0.1.0"]),
    ).toMatchObject({
      version: "3.0.0",
    });
    expect(
      parseArgs(["--version", "3.0.0-rc.2", "--vue-version", "0.1.0", "--svelte-version", "0.1.0"]),
    ).toMatchObject({ version: "3.0.0-rc.2" });
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
      svelteVersion: "0.1.0",
      version: "3.0.0-beta.1",
      vueVersion: "0.1.0",
    });

    expect(plan.projects.map((project) => project.framework)).toEqual([
      "astro",
      "react",
      "vue",
      "svelte",
    ]);
    expect(plan.projects.map((project) => project.directory)).toEqual([
      path.join(root, "astro"),
      path.join(root, "react"),
      path.join(root, "vue"),
      path.join(root, "svelte"),
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
    expect(plan.projects[3]).toMatchObject({ expectedAdapterVersion: "0.1.0" });
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
    const svelte = getFixtureFiles("svelte");

    expect(astro.map((file) => file.path)).toEqual(["src/pages/index.astro"]);
    expect(react.map((file) => file.path)).toEqual(["src/App.tsx"]);
    expect(vue.map((file) => file.path)).toEqual(["src/App.vue"]);
    expect(svelte.map((file) => file.path)).toEqual(["src/App.svelte"]);

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
    expect(svelte[0].content).toContain("Open Svelte dialog");
  });

  it("installs every component imported by each published fixture", () => {
    const plan = createAcceptancePlan({
      root: "/tmp/published",
      svelteVersion: "0.1.0",
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
    expect(workflow).toContain("svelte_version:");
    expect(workflow).toContain("pnpm test:published-release -- --version");
    expect(workflow).toContain('--vue-version "${{ inputs.vue_version }}"');
    expect(workflow).toContain('--svelte-version "${{ inputs.svelte_version }}"');
    expect(workflow).toContain("playwright install --with-deps chrome");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).not.toContain("push:");
  });

  it("requires a stable adapter on latest with no older beta tag", () => {
    const name = "@starwind-ui/vue";
    expect(() => validateGraduatedDistTags(name, "1.6.0", { latest: "1.6.0" })).not.toThrow();
    expect(() =>
      validateGraduatedDistTags(name, "1.6.0", { beta: "1.6.0", latest: "1.6.0" }),
    ).not.toThrow();
    expect(() =>
      validateGraduatedDistTags(name, "1.6.0", { beta: "1.7.0-beta.0", latest: "1.6.0" }),
    ).not.toThrow();
    expect(() =>
      validateGraduatedDistTags(name, "1.6.0", { beta: "0.4.0", latest: "1.6.0" }),
    ).toThrow("older than 1.6.0");
    expect(() =>
      validateGraduatedDistTags(name, "1.6.0", { beta: "1.6.0-beta.1", latest: "1.6.0" }),
    ).toThrow("older than 1.6.0");
    expect(() => validateGraduatedDistTags(name, "1.6.0", { latest: "0.1.0" })).toThrow(
      "latest must be 1.6.0 or newer",
    );
    // Acceptance for an older release passes after a newer release owns latest.
    expect(() =>
      validateGraduatedDistTags(name, "1.6.0", { beta: "1.6.1", latest: "1.6.1" }),
    ).not.toThrow();
    // A historical beta version keeps the old channel rules.
    expect(() =>
      validateGraduatedDistTags(name, "0.4.0", { beta: "0.4.0", latest: "0.1.0" }),
    ).not.toThrow();
  });

  it("accepts a caret declaration and requires the matching Runtime pin", () => {
    const base = {
      adapterManifest: { version: "1.6.0", dependencies: { "@starwind-ui/runtime": "1.6.0" } },
      declaredVersion: "^1.6.0",
      expectedAdapterVersion: "1.6.0",
      packageName: "@starwind-ui/vue",
    };
    expect(() => validateInstalledAdapterManifest(base)).not.toThrow();
    expect(() =>
      validateInstalledAdapterManifest({ ...base, declaredVersion: "1.6.0" }),
    ).not.toThrow();
    expect(() => validateInstalledAdapterManifest({ ...base, declaredVersion: "^1.7.0" })).toThrow(
      "must satisfy the declared ^1.7.0",
    );
    expect(() =>
      validateInstalledAdapterManifest({
        ...base,
        adapterManifest: { version: "1.6.0", dependencies: { "@starwind-ui/runtime": "1.5.0" } },
      }),
    ).toThrow("must pin the Runtime version of its own fixed-group release");
    expect(() =>
      validateInstalledAdapterManifest({
        ...base,
        adapterManifest: { version: "1.6.0", dependencies: { "@starwind-ui/runtime": "^1.6.0" } },
      }),
    ).toThrow("exact Runtime version");
    expect(() =>
      validateInstalledAdapterManifest({ ...base, expectedAdapterVersion: "1.6.1" }),
    ).toThrow("must equal the requested published version");
    // An older release stays valid when the project declares its exact version.
    expect(() =>
      validateInstalledAdapterManifest({
        adapterManifest: { version: "1.6.0", dependencies: { "@starwind-ui/runtime": "1.6.0" } },
        declaredVersion: "1.6.0",
        expectedAdapterVersion: "1.6.0",
        packageName: "@starwind-ui/svelte",
      }),
    ).not.toThrow();
    // A historical beta adapter pinned an older Runtime, so the fixed-group rule skips it.
    expect(() =>
      validateInstalledAdapterManifest({
        adapterManifest: { version: "0.4.0", dependencies: { "@starwind-ui/runtime": "1.5.0" } },
        declaredVersion: "0.4.0",
        expectedAdapterVersion: "0.4.0",
        packageName: "@starwind-ui/vue",
      }),
    ).not.toThrow();
  });
});
