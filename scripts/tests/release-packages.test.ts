import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  RELEASE_PACKAGE_SET,
  createPublishCommands,
  createUserPublishHandoff,
  formatCommandFailure,
  isDirtyGitStatusOutput,
  parseArgs,
  parsePublishOutput,
  redactCommandArgs,
  validatePublishGitState,
  validatePublishedPrefix,
  validateReleaseChangesetConfig,
  validateReleasePackageManifests,
} from "../release-packages.mjs";
import {
  CHANGESET_IGNORED_PACKAGES,
  RUNTIME_FIXED_GROUP,
  RUNTIME_RELEASE_PACKAGE_SET,
} from "../runtime-release-policy.mjs";

type PackageJson = {
  description?: string;
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  version?: string;
};

type PackageRequirement = { name: string; range: string };

const STARWIND_RUNTIME_DEPENDENCIES = new Set([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
]);

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

function manifests(versions: { cli: string; runtime: string }) {
  return RELEASE_PACKAGE_SET.map((entry) => ({
    entry,
    manifest: {
      description: `${entry.name} release package`,
      name: entry.name,
      version: entry.name === "starwind" ? versions.cli : versions.runtime,
    },
  }));
}

describe("release package tooling", () => {
  it("keeps the dependency-aware Runtime publish order", () => {
    expect(RELEASE_PACKAGE_SET.map((entry) => entry.name)).toEqual([
      "@starwind-ui/runtime",
      "@starwind-ui/astro",
      "@starwind-ui/react",
      "starwind",
    ]);
    expect(RELEASE_PACKAGE_SET).toBe(RUNTIME_RELEASE_PACKAGE_SET);
    expect(RELEASE_PACKAGE_SET.map((entry) => entry.name)).not.toContain("@starwind-ui/vue");
  });

  it("keeps Vue quarantined outside Changesets and publication", async () => {
    expect(CHANGESET_IGNORED_PACKAGES).toEqual([
      "demo",
      "react-demo",
      "vue-demo",
      "@starwind-ui/core",
      "@starwind-ui/vue",
    ]);
    expect(RUNTIME_FIXED_GROUP).toEqual([
      "@starwind-ui/runtime",
      "@starwind-ui/astro",
      "@starwind-ui/react",
    ]);
    expect(
      createPublishCommands({ dryRun: true }).map((command) => command.packageName),
    ).not.toContain("@starwind-ui/vue");

    const vuePackage = await readJson<PackageJson>("packages/vue/package.json");
    expect(vuePackage).toMatchObject({
      name: "@starwind-ui/vue",
      private: true,
      version: "0.0.0",
    });
  });

  it("keeps the retired Core package permanently source-only", async () => {
    expect(CHANGESET_IGNORED_PACKAGES).toContain("@starwind-ui/core");
    expect(RELEASE_PACKAGE_SET.map((entry) => entry.name)).not.toContain("@starwind-ui/core");

    const [root, corePackage] = await Promise.all([
      readJson<PackageJson>("package.json"),
      readJson<PackageJson>("packages/core/package.json"),
    ]);
    expect(corePackage).toMatchObject({ name: "@starwind-ui/core", private: true });
    expect(
      Object.keys(root.scripts ?? {}).filter((name) => name.startsWith("core:publish")),
    ).toEqual([]);
    expect(
      Object.keys(corePackage.scripts ?? {}).filter((name) => name.startsWith("publish:")),
    ).toEqual([]);
  });

  it("exposes generic release commands and beta compatibility aliases", async () => {
    const root = await readJson<PackageJson>("package.json");
    expect(root.scripts?.["release:version"]).toBe(
      "tsx scripts/portable-runtime/styled-component-release.ts version && changeset version && pnpm runtime:registry:generate",
    );
    expect(root.scripts?.version).toBe("pnpm release:version");
    expect(root.scripts?.["styled:versions:stage"]).toBe(
      "tsx scripts/portable-runtime/styled-component-release.ts stage",
    );
    expect(root.scripts?.["local:release"]).toContain("pnpm release:version");
    expect(root.scripts?.["publish:release:dry-run"]).toContain(
      "node scripts/release-packages.mjs --dry-run",
    );
    expect(root.scripts?.["publish:release"]).toBe("node scripts/release-packages.mjs --publish");
    expect(root.scripts?.["publish:beta:dry-run"]).toBe("pnpm publish:release:dry-run");
    expect(root.scripts?.["publish:beta"]).toBe("pnpm publish:release");
    expect(root.scripts?.["release:gate"]).toContain("pnpm verify");
    expect(root.scripts?.["release:gate"]).toContain("pnpm runtime:size:check");
  });

  it("derives prerelease and stable channels from package and Changesets state", () => {
    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0-beta.2", runtime: "0.1.0-beta.2" }), {
        mode: "pre",
        tag: "beta",
      }),
    ).toEqual({ errors: [], ok: true, tag: "beta" });
    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0-rc.1", runtime: "0.1.0-rc.1" }), {
        mode: "pre",
        tag: "rc",
      }),
    ).toEqual({ errors: [], ok: true, tag: "rc" });
    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0", runtime: "0.1.0" }), undefined),
    ).toEqual({ errors: [], ok: true, tag: "latest" });

    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0-beta.2", runtime: "0.1.0-beta.2" }), {
        mode: "exit",
        tag: "beta",
      }).ok,
    ).toBe(false);
    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0", runtime: "0.1.0" }), {
        mode: "pre",
        tag: "beta",
      }).ok,
    ).toBe(false);
    expect(validateReleaseChangesetConfig({ ignore: [...CHANGESET_IGNORED_PACKAGES] }).ok).toBe(
      true,
    );
    expect(validateReleaseChangesetConfig({ ignore: ["demo"] }).ok).toBe(false);
  });

  it("builds prerelease, stable, and resume publish commands", () => {
    expect(createPublishCommands({ dryRun: true, tag: "rc" })[0].args).toEqual([
      "publish",
      "--tag",
      "rc",
      "--access",
      "public",
      "--no-git-checks",
      "--dry-run",
    ]);
    expect(createPublishCommands({ tag: "latest" })[0].args).toEqual([
      "publish",
      "--tag",
      "latest",
      "--access",
      "public",
      "--no-git-checks",
    ]);
    expect(
      createPublishCommands({ resumeFrom: "@starwind-ui/astro", tag: "beta" }).map(
        (command) => command.packageName,
      ),
    ).toEqual(["@starwind-ui/astro", "@starwind-ui/react", "starwind"]);
  });

  it("generates the exact user-operated publication handoff", () => {
    expect(createUserPublishHandoff({ tag: "beta" })).toMatchObject({
      command: "pnpm publish:beta",
      packages: RELEASE_PACKAGE_SET.map((entry) => entry.name),
    });
    expect(createUserPublishHandoff({ tag: "latest" }).command).toBe("pnpm publish:release");
    expect(createUserPublishHandoff({ resumeFrom: "@starwind-ui/react", tag: "beta" })).toEqual({
      command: "node scripts/release-packages.mjs --publish --resume-from @starwind-ui/react",
      packages: ["@starwind-ui/react", "starwind"],
    });
  });

  it("parses pasted publish output and validates dependency-order prefixes", () => {
    const output = [
      "✅ Published package @starwind-ui/runtime@0.1.0-beta.2",
      "✅ Published package @starwind-ui/astro@0.1.0-beta.2",
    ].join("\n");
    expect(parsePublishOutput(output)).toEqual([
      { name: "@starwind-ui/runtime", version: "0.1.0-beta.2" },
      { name: "@starwind-ui/astro", version: "0.1.0-beta.2" },
    ]);
    expect(validatePublishedPrefix(["@starwind-ui/runtime", "@starwind-ui/astro"])).toEqual({
      complete: false,
      firstMissing: "@starwind-ui/react",
      valid: true,
    });
    expect(validatePublishedPrefix(["@starwind-ui/astro"]).valid).toBe(false);
    expect(validatePublishedPrefix(RELEASE_PACKAGE_SET.map((entry) => entry.name)).complete).toBe(
      true,
    );
  });

  it("rejects ambiguous modes, invalid OTP, and invalid resume input", () => {
    expect(() => parseArgs(["--dry-run", "--publish"])).toThrow(/exactly one mode/);
    expect(() => parseArgs(["--publish", "--otp"])).toThrow(/value after --otp/);
    expect(() => createPublishCommands({ otp: "abc123" })).toThrow(/numeric one-time password/);
    expect(() => parseArgs(["--dry-run", "--resume-from", "starwind"])).toThrow(
      /only with --publish/,
    );
    expect(() => parseArgs(["--publish", "--resume-from", "missing"])).toThrow(
      /Unknown --resume-from package/,
    );
  });

  it("redacts OTP values from display and failure output", () => {
    expect(redactCommandArgs(["publish", "--otp", "123456", "--tag", "beta"])).toEqual([
      "publish",
      "--otp",
      "<redacted>",
      "--tag",
      "beta",
    ]);
    const message = formatCommandFailure(
      "pnpm.cmd",
      ["publish", "--tag", "beta", "--otp", "123456"],
      1,
      { cwd: "packages/runtime", packageName: "@starwind-ui/runtime" },
    );
    expect(message).not.toContain("123456");
    expect(message).toContain("<redacted>");
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
    expect(
      validatePublishGitState({
        ...readyState,
        originUrl: "git@github.com:starwind-ui/starwind-ui.git",
      }).ok,
    ).toBe(true);
  });

  it("keeps generated Runtime package requirements publishable", async () => {
    const runtimePackage = await readJson<Required<Pick<PackageJson, "version">>>(
      "packages/runtime/package.json",
    );
    const currentRuntimeRange = `^${runtimePackage.version}`;
    const values = [
      await readJson<unknown>("packages/cli/src/registry/bundled-registry.json"),
      await readJson<unknown>("packages/cli/src/registry/primitive-vendoring-artifacts.json"),
    ];
    const requirements = collectStarwindPackageRequirements(values);
    expect(requirements.length).toBeGreaterThan(0);
    for (const requirement of requirements) {
      expect(requirement.range).not.toContain("workspace:");
      expect(requirement.range).not.toBe("*");
      if (STARWIND_RUNTIME_DEPENDENCIES.has(requirement.name)) {
        expect(requirement.range).toBe(currentRuntimeRange);
      }
    }
  });
});

function collectStarwindPackageRequirements(value: unknown): PackageRequirement[] {
  if (Array.isArray(value)) return value.flatMap(collectStarwindPackageRequirements);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const current =
    typeof record.name === "string" &&
    typeof record.range === "string" &&
    STARWIND_RUNTIME_DEPENDENCIES.has(record.name)
      ? [{ name: record.name, range: record.range }]
      : [];
  return [...current, ...Object.values(record).flatMap(collectStarwindPackageRequirements)];
}
