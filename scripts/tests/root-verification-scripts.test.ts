import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type PackageJson = {
  scripts?: Record<string, string>;
};

type Workflow = {
  jobs: Record<
    string,
    {
      if?: string;
      name?: string;
      needs?: string | string[];
      steps?: Array<{ if?: string; name?: string; run?: string }>;
      uses?: string;
    }
  >;
  on?: Record<string, unknown>;
  permissions?: Record<string, string>;
};

async function readRootPackage(): Promise<PackageJson> {
  return JSON.parse(await readFile("package.json", "utf8")) as PackageJson;
}

function commandPhases(command: string | undefined): string[] {
  return command?.split(/\s*&&\s*/).filter(Boolean) ?? [];
}

describe("root verification scripts", () => {
  it("runs the real lint, typecheck, and format commands", async () => {
    const pkg = await readRootPackage();

    expect(commandPhases(pkg.scripts?.check)).toEqual([
      "pnpm lint:check",
      "pnpm typecheck",
      "pnpm format:check",
    ]);
  });

  it("keeps targeted suites and aggregates every public adapter test once", async () => {
    const pkg = await readRootPackage();

    expect(pkg.scripts?.["test:repo"]).toContain("--project=repo-scripts");
    expect(pkg.scripts?.["test:cli"]).toContain("--project=cli");
    expect(pkg.scripts?.["runtime:generate:test"]).toContain("--project=portable-runtime");
    expect(pkg.scripts?.["runtime:generate:vue:test"]).toContain("--project=portable-vue");
    expect(commandPhases(pkg.scripts?.["test:all"])).toEqual([
      "pnpm test:run",
      "pnpm runtime:test",
      "pnpm react:test",
    ]);
  });

  it("exposes an intent-aware Changesets status command", async () => {
    const pkg = await readRootPackage();

    expect(pkg.scripts?.["release:status"]).toBe(
      "tsx scripts/portable-runtime/changeset-status.ts",
    );
  });

  it("regenerates release-managed docs metadata during versioning and preparation", async () => {
    const pkg = await readRootPackage();

    expect(commandPhases(pkg.scripts?.["release:version"])).toEqual([
      "tsx scripts/portable-runtime/styled-component-release.ts version",
      "tsx scripts/portable-runtime/primitive-component-release.ts version",
      "changeset version",
      "pnpm runtime:registry:generate",
      "pnpm runtime:docs:metadata",
    ]);
    expect(commandPhases(pkg.scripts?.["release:prepare"])).toEqual([
      "pnpm runtime:generate:all",
      "pnpm runtime:registry:generate",
      "pnpm runtime:docs:metadata",
    ]);
  });

  it("runs every canonical verification phase without rerunning generator tests", async () => {
    const pkg = await readRootPackage();
    const phases = commandPhases(pkg.scripts?.verify);

    expect(phases).toEqual(
      expect.arrayContaining([
        "pnpm check",
        "pnpm styled:versions:check",
        "pnpm primitive:versions:check",
        "pnpm test:homes",
        "pnpm test:all",
        "pnpm runtime:generate:typecheck",
        "pnpm runtime:docs:metadata:check",
        "pnpm build",
        "pnpm audit --prod --audit-level high",
      ]),
    );
    expect(phases).not.toContain("pnpm runtime:generate:test");
    expect(new Set(phases).size).toBe(phases.length);
  });

  it("gates release automation on parallel read-only verification jobs", async () => {
    const [verifyWorkflowSource, releaseWorkflowSource] = await Promise.all([
      readFile(".github/workflows/verify.yml", "utf8"),
      readFile(".github/workflows/release.yml", "utf8"),
    ]);
    const verifyWorkflow = parse(verifyWorkflowSource) as Workflow;
    const releaseWorkflow = parse(releaseWorkflowSource) as Workflow;
    const verifyRuns = Object.values(verifyWorkflow.jobs).flatMap(
      ({ steps = [] }) => steps.map(({ run }) => run).filter(Boolean) as string[],
    );

    expect(verifyWorkflow.on).toMatchObject({ pull_request: null, workflow_call: null });
    expect(verifyWorkflow.permissions).toEqual({ contents: "read" });
    expect(Object.keys(verifyWorkflow.jobs)).toEqual(
      expect.arrayContaining([
        "scope",
        "static",
        "node-tests",
        "generator-tests",
        "browser-adapter-tests",
        "vue-tests",
        "build-drift",
        "verify",
      ]),
    );
    expect(verifyWorkflow.jobs["vue-tests"]).toMatchObject({
      if: "needs.scope.outputs.vue == 'true'",
      needs: "scope",
    });
    expect(verifyWorkflow.jobs["generator-tests"].steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Install Playwright Chromium",
          run: "pnpm --filter=react-demo exec playwright install --with-deps chromium",
        }),
      ]),
    );
    expect(verifyWorkflow.jobs.verify).toMatchObject({
      name: "Verify",
      needs: expect.arrayContaining([
        "static",
        "node-tests",
        "generator-tests",
        "browser-adapter-tests",
        "vue-tests",
        "build-drift",
      ]),
    });
    expect(verifyRuns).toEqual(
      expect.arrayContaining([
        "pnpm test:node && pnpm runtime:test:unit && pnpm react:test:ssr",
        "pnpm runtime:generate:test && pnpm runtime:generate:typecheck",
        "pnpm runtime:test:browser && pnpm react:test:browser",
        "pnpm runtime:generate:all && pnpm runtime:registry:generate",
        "git diff --exit-code",
      ]),
    );
    expect(verifyRuns).toContain(
      'pnpm styled:versions:check --base "${{ github.event.pull_request.base.sha }}"',
    );
    expect(verifyRuns).toContain(
      'pnpm primitive:versions:check --base "${{ github.event.pull_request.base.sha }}"',
    );
    expect(
      verifyRuns.filter((command) => command.includes("pnpm runtime:generate:test")),
    ).toHaveLength(1);

    expect(releaseWorkflow.jobs.verify.uses).toBe("./.github/workflows/verify.yml");
    expect(releaseWorkflow.jobs.release).toMatchObject({ name: "Release", needs: "verify" });
    expect(releaseWorkflow.jobs.release.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          run: "pnpm styled:versions:stage && pnpm primitive:versions:stage",
        }),
      ]),
    );
    expect(releaseWorkflowSource).toContain("commitMode: github-api");
    expect(releaseWorkflowSource).toContain("version: pnpm release:version");
  });
});
