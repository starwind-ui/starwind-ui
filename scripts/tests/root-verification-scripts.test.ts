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
      env?: Record<string, string>;
      if?: string;
      id?: string;
      name?: string;
      needs?: string | string[];
      permissions?: Record<string, string>;
      steps?: Array<{
        env?: Record<string, string>;
        id?: string;
        if?: string;
        name?: string;
        run?: string;
        uses?: string;
        with?: Record<string, unknown>;
      }>;
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
      "pnpm vue:test",
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
    expect(pkg.scripts?.["build:public"]).toContain("--filter=@starwind-ui/vue");
    expect(pkg.scripts?.["build:public"]).toContain("--filter=vue-demo");
    expect(pkg.scripts?.["build:public"]).not.toMatch(/svelte/);
    expect(pkg.scripts?.["typecheck:public"]).toContain("--filter=@starwind-ui/vue");
    expect(pkg.scripts?.["typecheck:public"]).toContain("--filter=vue-demo");
    expect(pkg.scripts?.["typecheck:public"]).not.toMatch(/svelte/);
    expect(commandPhases(pkg.scripts?.["runtime:generate:all"])).toEqual([
      "pnpm runtime:generate:astro",
      "pnpm runtime:generate:react",
      "pnpm runtime:generate:vue",
    ]);
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
      "pnpm vue-demo:smoke",
      "pnpm runtime:size:check:prepared",
      "pnpm runtime:perf:vue:check",
      "pnpm release:candidate:acceptance",
    ]);
    expect(pkg.scripts?.["runtime:size:check:prepared"]).toContain("--private-vue");
    expect(commandPhases(pkg.scripts?.["publish:release:dry-run"])).toEqual([
      "pnpm release:artifacts",
      "node scripts/release-packages.mjs --dry-run",
    ]);
    expect(pkg.scripts?.["publish:release"]).toBe("node scripts/release-packages.mjs --publish");
  });

  it("runs public Vue and private Svelte checks in their intended scopes", async () => {
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
      workflow_dispatch: {
        inputs: {
          base_sha: { required: true, type: "string" },
          expected_head_sha: { required: true, type: "string" },
        },
      },
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
      if: expect.not.stringContaining("inputs.private_adapters"),
      needs: "scope",
    });
    expect(verifyWorkflow.jobs["vue-tests"].if).toContain("needs.scope.outputs.vue == 'true'");
    expect(verifyWorkflow.jobs["vue-tests"].steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ run: "pnpm vue:verify" }),
        expect.objectContaining({ run: "pnpm test:vue-cli-host-acceptance" }),
      ]),
    );
    const scopeStep = verifyWorkflow.jobs.scope.steps?.find((step) => step.id === "changes");
    const vueScopePattern = scopeStep?.env?.VUE_SCOPE_PATTERN;
    expect(vueScopePattern).toBeDefined();
    const matchesVueScope = (file: string): boolean => new RegExp(vueScopePattern!).test(file);
    for (const file of [
      "apps/vue-demo/src/App.vue",
      "packages/vue/src/index.ts",
      "packages/runtime/src/index.ts",
      "packages/cli/registry/styled-components.json",
      "packages/cli/src/registry/bundled-registry.json",
      "packages/cli/src/commands/init.ts",
      "packages/cli/tests/commands/init.test.ts",
      "packages/cli/package.json",
      "packages/cli/tsup.config.ts",
      "scripts/portable-runtime/contracts/primitive/components/dialog.ts",
      "scripts/portable-runtime/contracts/styled/components/dialog.ts",
      "scripts/portable-runtime/renderers/shared.ts",
      "scripts/portable-runtime/renderers/generic-adapter-plan/index.ts",
      "scripts/portable-runtime/renderers/framework-adapters/vue/renderer.ts",
      "scripts/portable-runtime/renderers/framework-adapters/target-definition.ts",
      "scripts/portable-runtime/generate-cli-registry.ts",
      "scripts/release-candidate-acceptance.mjs",
      "scripts/tests/root-verification-scripts.test.ts",
      ".github/workflows/verify.yml",
      "package.json",
      "turbo.json",
    ]) {
      expect(matchesVueScope(file), file).toBe(true);
    }
    expect(matchesVueScope("docs/product/positioning.md")).toBe(false);
    expect(
      matchesVueScope("scripts/portable-runtime/renderers/framework-adapters/svelte/renderer.ts"),
    ).toBe(false);
    expect(verifyWorkflow.jobs["svelte-tests"]).toMatchObject({
      if: expect.stringContaining("inputs.private_adapters"),
      needs: "scope",
    });
    expect(verifyWorkflow.jobs["svelte-tests"].if).toContain(
      "needs.scope.outputs.svelte == 'true'",
    );
    const shouldRunSvelte = new Function(
      "github",
      "inputs",
      "needs",
      `return (${verifyWorkflow.jobs["svelte-tests"].if});`,
    );
    for (const isPrivate of [false, true]) {
      expect(
        shouldRunSvelte(
          {
            event: { repository: { private: isPrivate } },
            event_name: "pull_request",
            head_ref: "runtime",
          },
          { private_adapters: false },
          { scope: { outputs: { svelte: "true" } } },
        ),
      ).toBe(isPrivate);
    }
    expect(verifyWorkflowSource).not.toMatch(/packages\/\(runtime\|svelte\)/u);
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
          run: "pnpm exec playwright install --with-deps chromium",
        }),
      ]),
    );
    const browserInstallSteps = Object.values(verifyWorkflow.jobs).flatMap(({ steps = [] }) =>
      steps.filter(({ name }) => name === "Install Playwright Chromium"),
    );
    expect(browserInstallSteps).toHaveLength(4);
    for (const step of browserInstallSteps) {
      expect(step.run).toBe("pnpm exec playwright install --with-deps chromium");
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
      'pnpm styled:versions:check --base "${{ inputs.base_sha || github.event.pull_request.base.sha }}"',
    );
    expect(verifyRuns).toContain(
      'pnpm primitive:versions:check --base "${{ inputs.base_sha || github.event.pull_request.base.sha }}"',
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
        expect.objectContaining({
          id: "changesets",
          name: "Create Release Pull Request",
        }),
        expect.objectContaining({
          if: "steps.changesets.outputs.pullRequestNumber != ''",
          name: "Verify Release Pull Request",
          run: expect.stringContaining("gh workflow run verify.yml"),
        }),
      ]),
    );
    expect(releaseWorkflowSource).toContain("commitMode: github-api");
    expect(releaseWorkflow.jobs.release.permissions).toEqual({
      actions: "write",
      contents: "write",
      "pull-requests": "write",
    });
    expect(releaseWorkflowSource).toContain("version: pnpm release:version");
  });
});
