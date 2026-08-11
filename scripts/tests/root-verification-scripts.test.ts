import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type PackageJson = {
  scripts?: Record<string, string>;
};

type Workflow = {
  concurrency?: {
    "cancel-in-progress"?: boolean | string;
    group?: string;
  };
  jobs: Record<
    string,
    {
      if?: string;
      name?: string;
      needs?: string | string[];
      steps?: Array<{ if?: string; name?: string; run?: string }>;
      uses?: string;
      with?: Record<string, unknown>;
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
    expect(pkg.scripts?.["runtime:generate:svelte:test"]).toContain("--project=portable-svelte");
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

  it("keeps development verification local and delegates production audit only to release", async () => {
    const pkg = await readRootPackage();
    const phases = commandPhases(pkg.scripts?.verify);

    expect(phases).toEqual([
      "pnpm check",
      "pnpm styled:versions:check",
      "pnpm primitive:versions:check",
      "pnpm test:homes",
      "pnpm test:all",
      "pnpm runtime:generate:typecheck",
      "pnpm runtime:docs:metadata:check",
      "pnpm build",
    ]);
    expect(commandPhases(pkg.scripts?.["verify:public"])).toEqual([
      "pnpm check:public",
      "pnpm styled:versions:check",
      "pnpm primitive:versions:check",
      "pnpm test:homes",
      "pnpm test:all",
      "pnpm runtime:generate:typecheck",
      "pnpm runtime:docs:metadata:check",
      "pnpm build:public",
    ]);
    expect(pkg.scripts?.["build:public"]).not.toMatch(/vue|svelte/);
    expect(pkg.scripts?.["typecheck:public"]).not.toMatch(/vue|svelte/);
    expect(phases.some((phase) => /audit/i.test(phase))).toBe(false);
    expect(phases).not.toContain("pnpm runtime:generate:test");
    expect(new Set(phases).size).toBe(phases.length);
    expect(pkg.scripts?.["audit:prod"]).toBe("pnpm audit --prod --audit-level high");
    expect(
      Object.entries(pkg.scripts ?? {})
        .filter(
          ([name, command]) =>
            name !== "audit:prod" && commandPhases(command).includes("pnpm audit:prod"),
        )
        .map(([name]) => name),
    ).toEqual(["release:gate"]);
  });

  it("runs the complete candidate gate once before the package dry-run", async () => {
    const pkg = await readRootPackage();

    expect(commandPhases(pkg.scripts?.["release:gate"])).toEqual([
      "pnpm verify:public",
      "pnpm --filter=starwind package:check",
      "pnpm audit:prod",
      "pnpm demo:smoke",
      "pnpm react-demo:smoke",
      "pnpm runtime:size:check:prepared",
      "pnpm release:candidate:acceptance",
    ]);
    expect(commandPhases(pkg.scripts?.["publish:release:dry-run"])).toEqual([
      "pnpm release:artifacts",
      "node scripts/release-packages.mjs --dry-run",
    ]);
    expect(pkg.scripts?.["publish:release"]).toBe("node scripts/release-packages.mjs --publish");
  });

  it("runs private adapters only for relevant development PRs", async () => {
    const [verifyWorkflowSource, releaseWorkflowSource] = await Promise.all([
      readFile(".github/workflows/verify.yml", "utf8"),
      readFile(".github/workflows/release.yml", "utf8"),
    ]);
    const verifyWorkflow = parse(verifyWorkflowSource) as Workflow;
    const releaseWorkflow = parse(releaseWorkflowSource) as Workflow;
    const verifyRuns = Object.values(verifyWorkflow.jobs).flatMap(
      ({ steps = [] }) => steps.map(({ run }) => run).filter(Boolean) as string[],
    );

    expect(verifyWorkflow.on).toMatchObject({
      pull_request: null,
      workflow_call: { inputs: { private_adapters: { default: false, type: "boolean" } } },
    });
    expect(verifyWorkflow.permissions).toEqual({ contents: "read" });
    expect(Object.keys(verifyWorkflow.jobs)).toEqual(
      expect.arrayContaining([
        "scope",
        "static",
        "node-tests",
        "generator-tests",
        "browser-adapter-tests",
        "svelte-tests",
        "vue-tests",
        "build-drift",
        "verify",
      ]),
    );
    expect(verifyWorkflow.jobs["vue-tests"]).toMatchObject({
      if: expect.stringContaining("inputs.private_adapters"),
      needs: "scope",
    });
    expect(verifyWorkflow.jobs["vue-tests"].if).toContain("needs.scope.outputs.vue == 'true'");
    expect(verifyWorkflow.jobs["svelte-tests"]).toMatchObject({
      if: expect.stringContaining("inputs.private_adapters"),
      needs: "scope",
    });
    expect(verifyWorkflow.jobs["svelte-tests"].if).toContain(
      "needs.scope.outputs.svelte == 'true'",
    );
    expect(verifyWorkflowSource).not.toMatch(/packages\/\(cli\|runtime\|vue\)/u);
    expect(verifyWorkflowSource).not.toMatch(/packages\/\(runtime\|svelte\)/u);
    expect(verifyWorkflowSource).toContain("packages/vue/");
    expect(verifyWorkflowSource).toContain("packages/svelte/");
    expect(verifyWorkflow.jobs["windows-packed-cli"]).toMatchObject({
      if: "needs.scope.outputs.windows == 'true'",
      needs: "scope",
    });
    expect(verifyWorkflow.jobs["node22-public-consumer"]).toMatchObject({
      if: "needs.scope.outputs.node22 == 'true'",
      needs: "scope",
    });
    expect(verifyWorkflow.jobs["generator-tests"].steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Install Playwright Chromium",
          run: expect.stringContaining(
            "pnpm --filter=react-demo exec playwright install --with-deps chromium",
          ),
        }),
      ]),
    );
    const browserInstallSteps = Object.values(verifyWorkflow.jobs).flatMap(({ steps = [] }) =>
      steps.filter(({ name }) => name === "Install Playwright Chromium"),
    );
    expect(browserInstallSteps).toHaveLength(4);
    for (const step of browserInstallSteps) {
      expect(step.run).toContain(
        "pnpm --filter=react-demo exec playwright install --with-deps chromium",
      );
      expect(step.run).toContain("pnpm exec playwright install chromium");
    }
    expect(verifyWorkflow.jobs.verify).toMatchObject({
      name: "Verify",
      needs: expect.arrayContaining([
        "static",
        "node-tests",
        "generator-tests",
        "browser-adapter-tests",
        "svelte-tests",
        "vue-tests",
        "build-drift",
      ]),
    });
    expect(verifyRuns).toEqual(
      expect.arrayContaining([
        "pnpm test:node && pnpm runtime:test:unit && pnpm react:test:ssr",
        "pnpm runtime:generate:test && pnpm runtime:generate:typecheck",
        "pnpm runtime:test:browser && pnpm react:test:browser",
        "pnpm svelte:verify",
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
    expect(
      verifyRuns.filter((command) => /(?:^|[\s;&])pnpm\s+audit(?::prod)?(?:\s|$)/u.test(command)),
    ).toEqual([]);
    expect(verifyWorkflowSource).toContain(`needs.windows-packed-cli.result }}" != "skipped"`);
    expect(verifyWorkflowSource).toContain(`needs.node22-public-consumer.result }}" != "skipped"`);

    expect(verifyWorkflow.concurrency).toMatchObject({
      "cancel-in-progress": "${{ github.event_name == 'pull_request' }}",
    });
    expect(releaseWorkflow.concurrency).toMatchObject({ "cancel-in-progress": true });
    expect(releaseWorkflow.jobs.verify).toMatchObject({
      if: "needs.scope.outputs.versioned == 'true'",
      needs: "scope",
      uses: "./.github/workflows/verify.yml",
      with: { private_adapters: false },
    });
    expect(releaseWorkflow.jobs.release).toMatchObject({
      name: "Release",
      needs: ["scope", "verify"],
    });
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
