import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  BETA_PACKAGE_SET,
  createPublishCommands,
  formatCommandFailure,
  isDirtyGitStatusOutput,
  parseArgs,
  redactCommandArgs,
  validateBetaChangesetConfig,
  validateBetaPrereleaseState,
  validatePublishGitState,
} from "../release-beta-packages.mjs";

type PackageJson = {
  description?: string;
  scripts?: Record<string, string>;
  version?: string;
};

type PackageRequirement = {
  name: string;
  range: string;
};

const CURRENT_BETA_PACKAGE_RANGE = "^0.1.0-beta.1";
const STARWIND_BETA_DEPENDENCIES = new Set([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
]);

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

describe("beta release scripts", () => {
  it("targets the public beta package set in publish order", () => {
    expect(BETA_PACKAGE_SET.map((entry) => entry.name)).toEqual([
      "@starwind-ui/runtime",
      "@starwind-ui/astro",
      "@starwind-ui/react",
      "starwind",
    ]);
  });

  it("keeps Runtime and adapter package versions in lockstep beta prerelease metadata", async () => {
    const runtime = await readJson<PackageJson>("packages/runtime/package.json");
    const astro = await readJson<PackageJson>("packages/astro/package.json");
    const react = await readJson<PackageJson>("packages/react/package.json");
    const cli = await readJson<PackageJson>("packages/cli/package.json");

    expect([runtime.version, astro.version, react.version]).toEqual([
      "0.1.0-beta.1",
      "0.1.0-beta.1",
      "0.1.0-beta.1",
    ]);
    expect(cli.version).toBe("3.0.0-beta.1");
    expect(runtime.description?.toLowerCase()).not.toContain("prototype");
  });

  it("exposes root one-command beta dry-run and publish scripts", async () => {
    const root = await readJson<PackageJson>("package.json");

    expect(root.scripts?.["release:beta:prepare"]).toBe(
      "pnpm runtime:generate:all && pnpm runtime:registry:generate && pnpm runtime:build && pnpm --filter=@starwind-ui/astro typecheck && pnpm react:build && pnpm cli:build",
    );
    expect(root.scripts?.["publish:beta:dry-run"]).toBe(
      "pnpm release:beta:prepare && pnpm release:beta:gate && node scripts/release-beta-packages.mjs --dry-run",
    );
    expect(root.scripts?.["publish:beta"]).toBe(
      "pnpm release:beta:prepare && pnpm release:beta:gate && node scripts/release-beta-packages.mjs --publish",
    );
    expect(root.scripts?.["release:beta:gate"]).toContain("pnpm verify");
    expect(root.scripts?.["release:beta:gate"]).toContain("pnpm runtime:size:check");
  });

  it("requires Changesets beta prerelease mode", () => {
    const readyState = {
      changesets: ["cli-runtime-release", "runtime-adapter-platform"],
      mode: "pre",
      tag: "beta",
    };
    expect(validateBetaPrereleaseState(readyState)).toEqual({
      errors: [],
      ok: true,
    });
    expect(validateBetaPrereleaseState({ ...readyState, mode: "exit" }).ok).toBe(false);
    expect(validateBetaPrereleaseState({ ...readyState, tag: "next" }).ok).toBe(false);
    expect(validateBetaPrereleaseState({ ...readyState, changesets: [] }).ok).toBe(false);
    expect(validateBetaChangesetConfig({ ignore: ["demo", "react-demo"] }).ok).toBe(true);
    expect(validateBetaChangesetConfig({ ignore: ["demo"] }).ok).toBe(false);
  });

  it("records beta.1 release preparation without scheduling beta.2", async () => {
    const releasePreparation = await readFile(
      ".changeset/runtime-beta-release-preparation.md",
      "utf8",
    );

    expect(releasePreparation).toMatch(/^---\r?\n---\r?\n/);
    expect(releasePreparation).toContain("must not create a beta.2 package release");
  });

  it("publishes and dry-runs the same packages with beta tag and public access", () => {
    const dryRunCommands = createPublishCommands({ dryRun: true });
    const publishCommands = createPublishCommands({ dryRun: false });

    expect(dryRunCommands.map((command) => command.packageName)).toEqual(
      publishCommands.map((command) => command.packageName),
    );

    for (const command of dryRunCommands) {
      expect(command.args).toEqual([
        "publish",
        "--tag",
        "beta",
        "--access",
        "public",
        "--no-git-checks",
        "--dry-run",
      ]);
    }

    for (const command of publishCommands) {
      expect(command.args).toEqual([
        "publish",
        "--tag",
        "beta",
        "--access",
        "public",
        "--no-git-checks",
      ]);
    }
  });

  it("rejects ambiguous modes and invalid OTP input before publishing", () => {
    expect(() => parseArgs(["--dry-run", "--publish"])).toThrow(/exactly one mode/);
    expect(() => parseArgs(["--publish", "--otp"])).toThrow(/value after --otp/);
    expect(() => createPublishCommands({ dryRun: false, otp: "abc123" })).toThrow(
      /numeric one-time password/,
    );
    expect(createPublishCommands({ dryRun: false, otp: "123456" })[0].args).toEqual([
      "publish",
      "--tag",
      "beta",
      "--access",
      "public",
      "--no-git-checks",
      "--otp",
      "123456",
    ]);
  });

  it("resumes a real publish from an explicit package without changing dependency order", () => {
    expect(parseArgs(["--publish", "--resume-from", "@starwind-ui/astro"])).toEqual({
      dryRun: false,
      otp: undefined,
      resumeFrom: "@starwind-ui/astro",
    });
    expect(
      createPublishCommands({ resumeFrom: "@starwind-ui/astro" }).map(
        (command) => command.packageName,
      ),
    ).toEqual(["@starwind-ui/astro", "@starwind-ui/react", "starwind"]);
    expect(() => parseArgs(["--dry-run", "--resume-from", "starwind"])).toThrow(
      /only with --publish/,
    );
    expect(() => parseArgs(["--publish", "--resume-from", "@starwind-ui/missing"])).toThrow(
      /Unknown --resume-from package/,
    );
    expect(() => parseArgs(["--publish", "--resume-from"])).toThrow(/Expected a package name/);
  });

  it("redacts a separate publish OTP value from display arguments", () => {
    expect(redactCommandArgs(["publish", "--otp", "123456", "--tag", "beta"])).toEqual([
      "publish",
      "--otp",
      "<redacted>",
      "--tag",
      "beta",
    ]);
  });

  it("redacts an inline publish OTP from display arguments", () => {
    expect(redactCommandArgs(["publish", "--otp=123456", "--tag", "beta"])).toEqual([
      "publish",
      "--otp=<redacted>",
      "--tag",
      "beta",
    ]);
  });

  it("does not throw or consume another flag when an OTP value is missing", () => {
    expect(redactCommandArgs(["publish", "--otp", "--tag", "beta"])).toEqual([
      "publish",
      "--otp",
      "--tag",
      "beta",
    ]);
  });

  it("keeps publish failure context without exposing the OTP", () => {
    const message = formatCommandFailure(
      "pnpm.cmd",
      ["publish", "--tag", "beta", "--otp", "123456", "--access", "public"],
      1,
      {
        cwd: "packages/runtime",
        packageName: "@starwind-ui/runtime",
      },
    );

    expect(message).toContain("pnpm.cmd publish --tag beta --otp <redacted> --access public");
    expect(message).toContain("@starwind-ui/runtime");
    expect(message).toContain("packages/runtime");
    expect(message).toContain("exit code 1");
    expect(message).not.toContain("123456");
  });

  it("detects dirty git status output for real publish guardrails", () => {
    expect(isDirtyGitStatusOutput("")).toBe(false);
    expect(isDirtyGitStatusOutput("\n")).toBe(false);
    expect(isDirtyGitStatusOutput(" M package.json\n")).toBe(true);
    expect(isDirtyGitStatusOutput("?? scripts/release-beta-packages.mjs\n")).toBe(true);
  });

  it("allows real publishing only from clean public main at origin/main", () => {
    const readyState = {
      branch: "main",
      head: "abc123",
      originMain: "abc123",
      originUrl: "https://github.com/starwind-ui/starwind-ui.git",
      status: "",
    };

    expect(validatePublishGitState(readyState)).toEqual({ errors: [], ok: true });
    expect(validatePublishGitState({ ...readyState, status: " M package.json" }).ok).toBe(false);
    expect(validatePublishGitState({ ...readyState, branch: "runtime" }).ok).toBe(false);
    expect(validatePublishGitState({ ...readyState, originMain: "def456" }).ok).toBe(false);
    expect(validatePublishGitState({ ...readyState, originMain: "" }).ok).toBe(false);
    expect(
      validatePublishGitState({
        ...readyState,
        originUrl: "https://github.com/starwind-ui/private-worktree.git",
      }).ok,
    ).toBe(false);
    expect(
      validatePublishGitState({
        ...readyState,
        originUrl: "git@github.com:starwind-ui/starwind-ui.git",
      }).ok,
    ).toBe(true);
  });

  it("keeps generated Starwind package requirements on publishable beta ranges", async () => {
    const bundledRegistry = await readJson<unknown>(
      "packages/cli/src/registry/bundled-registry.json",
    );
    const primitiveArtifacts = await readJson<unknown>(
      "packages/cli/src/registry/primitive-vendoring-artifacts.json",
    );
    const requirements = collectStarwindPackageRequirements([bundledRegistry, primitiveArtifacts]);

    expect(requirements.length).toBeGreaterThan(0);

    for (const requirement of requirements) {
      expect(requirement.range).not.toContain("workspace:");
      expect(requirement.range).not.toBe("*");

      if (STARWIND_BETA_DEPENDENCIES.has(requirement.name)) {
        expect(requirement.range).toBe(CURRENT_BETA_PACKAGE_RANGE);
      }
    }
  });

  it("documents beta and stable release command intent", async () => {
    const guide = await readFile("docs/portable-runtime/beta-release.md", "utf8");

    expect(guide).toContain("pnpm publish:beta:dry-run");
    expect(guide).toContain("pnpm publish:beta");
    expect(guide).toContain("0.1.0-beta.1");
    expect(guide).toContain("3.0.0-beta.1");
    expect(guide).toContain("beta");
    expect(guide).toContain("latest");
    expect(guide).toContain("0.1.0");
    expect(guide).toContain("--resume-from");
    expect(guide).toContain("origin/main");
  });
});

function collectStarwindPackageRequirements(value: unknown): PackageRequirement[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStarwindPackageRequirements(item));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const current =
    typeof record.name === "string" &&
    typeof record.range === "string" &&
    STARWIND_BETA_DEPENDENCIES.has(record.name)
      ? [{ name: record.name, range: record.range }]
      : [];

  return [
    ...current,
    ...Object.values(record).flatMap((item) => collectStarwindPackageRequirements(item)),
  ];
}
