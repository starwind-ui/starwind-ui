import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { hasPrivateSvelte } from "../portable-runtime/tests/workspace-support.js";

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
    if (hasPrivateSvelte)
      expect(pkg.scripts?.["runtime:generate:svelte:test"]).toContain("--project=portable-svelte");
    else expect(pkg.scripts?.["runtime:generate:svelte:test"]).toBeUndefined();
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
      "pnpm install --lockfile-only --ignore-scripts --no-frozen-lockfile",
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
    ).toEqual([]);
  });

  it("runs the complete candidate gate once before the package dry-run", async () => {
    const pkg = await readRootPackage();

    expect(pkg.scripts?.["release:gate"]).toBe("node scripts/release-gate.mjs");
    expect(pkg.scripts?.["release:preflight"]).toBe("node scripts/release-preflight.mjs");
    expect(pkg.scripts?.["runtime:size:check:prepared"]).toContain("--private-vue");
    expect(commandPhases(pkg.scripts?.["publish:release:dry-run"])).toEqual([
      "pnpm release:artifacts",
      "node scripts/release-packages.mjs --dry-run",
    ]);
    expect(pkg.scripts?.["publish:release"]).toBe("node scripts/release-packages.mjs --publish");
  });

  it("keeps CI focused and checks every shipping adapter", async () => {
    const source = await readFile(".github/workflows/verify.yml", "utf8");
    const workflow = parse(source) as Workflow;
    const pkg = await readRootPackage();
    const jobs = Object.values(workflow.jobs);
    const runs = jobs.flatMap(({ steps = [] }) => steps.flatMap(({ run }) => (run ? [run] : [])));

    expect(workflow.on).toMatchObject({
      pull_request: null,
      workflow_call: null,
      workflow_dispatch: {
        inputs: {
          base_sha: { required: true, type: "string" },
          expected_head_sha: { required: true, type: "string" },
        },
      },
    });
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.jobs.static.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          if: "github.event_name == 'workflow_dispatch'",
          env: { EXPECTED_HEAD_SHA: "${{ inputs.expected_head_sha }}" },
          run: 'test "$GITHUB_SHA" = "$EXPECTED_HEAD_SHA"',
        }),
      ]),
    );
    expect(runs).toEqual(
      expect.arrayContaining([
        "pnpm check && pnpm test:homes && pnpm runtime:generate:typecheck",
        "pnpm test:node && pnpm runtime:test:unit && pnpm react:test:ssr && pnpm --filter=@starwind-ui/vue test:run",
        "pnpm runtime:generate:test:ci",
        "pnpm runtime:test:browser && pnpm react:test:browser && pnpm vue:test:browser:ci",
        "pnpm runtime:generate:all && pnpm runtime:registry:generate",
        "pnpm exec turbo build --filter=@starwind-ui/runtime --filter=@starwind-ui/react --filter=@starwind-ui/vue --filter=starwind",
        "git diff --exit-code",
        "pnpm --filter=starwind package:check",
        'pnpm styled:versions:check --base "${{ inputs.base_sha || github.event.pull_request.base.sha }}"',
        'pnpm primitive:versions:check --base "${{ inputs.base_sha || github.event.pull_request.base.sha }}"',
      ]),
    );
    expect(runs.join("\n")).not.toMatch(
      /pnpm (?:vue:verify|vue:test(?:\s|$)|svelte:verify|build(?:\s|$)|runtime:size:|runtime:perf:|test:vue-cli-host-acceptance|test:windows-packed-cli|release:consumer:node22)/,
    );
    expect(pkg.scripts?.["runtime:generate:test:ci"]).toContain("generate-cli-registry.test.ts");
    expect(pkg.scripts?.["runtime:generate:test:ci"]).toContain("runtime-adapter-contract.test.ts");
    expect(pkg.scripts?.["runtime:generate:test"]).toBe("vitest run --project=portable-runtime");
    for (const component of ["checkbox", "dialog", "select"]) {
      expect(pkg.scripts?.["vue:test:browser:ci"]).toContain(
        `packages/vue/tests/${component}/vitest.config.ts --project=browser`,
      );
    }
    for (const job of jobs) {
      for (const value of Object.values(job.env ?? {})) {
        expect(value).not.toMatch(/\$\{\{[^}]*\brunner\./);
      }
    }
    expect(workflow.concurrency).toMatchObject({
      "cancel-in-progress": "${{ github.event_name == 'pull_request' }}",
    });
  });

  it("fails Verify when any required job fails, skips, or is cancelled", async () => {
    const workflow = parse(await readFile(".github/workflows/verify.yml", "utf8")) as Workflow;
    const gate = workflow.jobs.verify;
    const requiredJobs = Object.keys(workflow.jobs).filter((name) => name !== "verify");
    expect(gate.name).toBe("Verify");
    expect(gate.if).toBe("always()");
    expect(gate.needs).toEqual(requiredJobs);
    const step = gate.steps?.find(({ name }) => name === "Require every verification gate");
    expect(step?.env).toEqual({ CHECK_RESULTS: "${{ join(needs.*.result, ',') }}" });
    const gateScript = step?.run?.match(/^node -e "(.*)"$/)?.[1];
    expect(gateScript).toBeDefined();
    const check = (results: string[]) =>
      spawnSync(process.execPath, ["-e", gateScript!], {
        env: { ...process.env, CHECK_RESULTS: results.join(",") },
      }).status;
    const success = requiredJobs.map(() => "success");
    expect(check(success)).toBe(0);
    for (let index = 0; index < requiredJobs.length; index += 1) {
      for (const result of ["failure", "cancelled", "skipped"]) {
        const results = [...success];
        results[index] = result;
        expect(check(results)).not.toBe(0);
      }
    }
  });

  it("preserves exact-head release verification and the publication boundary", async () => {
    const source = await readFile(".github/workflows/release.yml", "utf8");
    const workflow = parse(source) as Workflow;
    expect(workflow.concurrency).toMatchObject({ "cancel-in-progress": true });
    expect(workflow.jobs.scope).toMatchObject({
      outputs: {
        verification_reused: "${{ steps.verification.outputs.reusable }}",
        versioned: "${{ steps.changes.outputs.versioned }}",
      },
      permissions: { actions: "read", contents: "read", "pull-requests": "read" },
    });
    expect(workflow.jobs.verify).toMatchObject({
      if: "needs.scope.outputs.versioned == 'true' && needs.scope.outputs.verification_reused != 'true'",
      needs: "scope",
      uses: "./.github/workflows/verify.yml",
    });
    expect(workflow.jobs.scope.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "verification",
          if: "steps.changes.outputs.versioned == 'true'",
          run: 'node scripts/check-release-verification.mjs >> "$GITHUB_OUTPUT"',
        }),
      ]),
    );
    expect(workflow.jobs.release.needs).toEqual(["scope", "verify"]);
    expect(workflow.jobs.release.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          run: "pnpm styled:versions:stage && pnpm primitive:versions:stage",
        }),
        expect.objectContaining({ id: "changesets", name: "Create Release Pull Request" }),
        expect.objectContaining({
          if: "steps.changesets.outputs.pullRequestNumber != ''",
          name: "Verify Release Pull Request",
          run: expect.stringContaining('--field expected_head_sha="$HEAD_SHA"'),
        }),
      ]),
    );
    expect(source).toContain("commitMode: github-api");
    expect(source).toContain("version: pnpm release:version");
    expect(source).not.toMatch(/pnpm (?:publish|release:gate)/);
  });
});
