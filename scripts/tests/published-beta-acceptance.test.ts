import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createAcceptancePlan, getFixtureFiles, parseArgs } from "../published-beta-acceptance.mjs";

describe("published beta acceptance", () => {
  it("requires an exact numbered beta CLI version", () => {
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

    expect(() => parseArgs(["--version", "beta"])).toThrow(/exact numbered beta version/i);
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
      "astro@latest",
      "astro",
      "--template",
      "minimal",
      "--install",
      "--no-git",
      "--yes",
    ]);
    expect(plan.projects[1].scaffold.args).toEqual([
      "create",
      "vite@latest",
      "react",
      "--template",
      "react-ts",
      "--no-interactive",
    ]);
    expect(plan.projects[0].install).toBeUndefined();
    expect(plan.projects[1].install).toEqual({ args: ["install"], cwd: path.join(root, "react") });

    for (const project of plan.projects) {
      expect(project.version.args).toEqual(["dlx", "starwind@3.0.0-beta.1", "--version"]);
      expect(project.init.args).toEqual([
        "dlx",
        "starwind@3.0.0-beta.1",
        "init",
        "--defaults",
        `--${project.framework}`,
      ]);
      expect(project.add.args).toEqual([
        "dlx",
        "starwind@3.0.0-beta.1",
        "add",
        "button",
        "dialog",
        "context-menu",
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
      expect(fixture).toContain("Published package dialog");
      expect(fixture).toContain("Accept action");
    }
  });

  it("is exposed as an explicit root command and manual post-publish workflow", async () => {
    const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
    const workflow = await readFile(".github/workflows/published-beta-acceptance.yml", "utf8");
    const releaseGuide = await readFile("docs/portable-runtime/beta-release.md", "utf8");

    expect(rootPackage.scripts["test:published-beta"]).toBe(
      "node scripts/published-beta-acceptance.mjs",
    );
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("version:");
    expect(workflow).toContain("pnpm test:published-beta -- --version");
    expect(workflow).toContain("playwright install --with-deps chromium");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).not.toContain("push:");
    expect(releaseGuide).toContain("pnpm test:published-beta -- --version 3.0.0-beta.1");
  });
});
