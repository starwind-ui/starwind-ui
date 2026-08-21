import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import {
  RELEASE_PACKAGE_SET,
  createPublishCommands,
  createUserPublishHandoff,
  executeReleasePublication,
  formatCommandFailure,
  isDirtyGitStatusOutput,
  parseArgs,
  parsePublishOutput,
  readGitOutput,
  redactCommandArgs,
  validatePublishGitState,
  validatePublishedPrefix,
  validateReleaseChangesetConfig,
  validateReleasePackageManifests,
} from "../release-packages.mjs";
import {
  createGitHubReleaseArgs,
  createCommandSystem,
  deriveReleaseIdentity,
  finalizeVerifiedRelease,
  runReleaseFinalization,
  verifyPublishedPackages,
} from "../release-finalization.mjs";
import { createSpawnCommand, getPackageManagerCommand } from "../command-process.mjs";
import {
  CHANGESET_IGNORED_PACKAGES,
  CHANGESET_PRIVATE_PACKAGE_POLICY,
  RUNTIME_FIXED_GROUP,
  RUNTIME_RELEASE_PACKAGE_SET,
} from "../runtime-release-policy.mjs";

type PackageJson = {
  dependencies?: Record<string, string>;
  description?: string;
  exports?: Record<string, unknown>;
  name?: string;
  peerDependencies?: Record<string, string>;
  private?: boolean;
  scripts?: Record<string, string>;
  sideEffects?: boolean;
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

function commandPhases(command: string | undefined): string[] {
  return command?.split(/\s*&&\s*/).filter(Boolean) ?? [];
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

const CHANGESET_BUMPS = new Set<unknown>(["major", "minor", "patch"]);
const PRIVATE_ADAPTER_PACKAGE_NAMES = new Set(["@starwind-ui/vue", "@starwind-ui/svelte"]);

function parseChangesetReleasePackageNames(file: string, source: string): string[] {
  const frontmatter = source.match(/^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*$/m);
  if (!frontmatter) throw new Error(`Invalid Changeset frontmatter: ${file}`);

  const parsed: unknown = parseYaml(frontmatter[1]);
  if (parsed === null) return [];
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid Changeset release entries: ${file}`);
  }

  return Object.entries(parsed).map(([packageName, bump]) => {
    if (!CHANGESET_BUMPS.has(bump)) {
      throw new Error(`Invalid Changeset bump for ${packageName} in ${file}.`);
    }
    return packageName;
  });
}

function assertNoPrivateAdapterChangesetReleases(file: string, source: string): void {
  for (const packageName of parseChangesetReleasePackageNames(file, source)) {
    if (PRIVATE_ADAPTER_PACKAGE_NAMES.has(packageName)) {
      throw new Error(`Private package ${packageName} appears in ${file}.`);
    }
  }
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
    expect(RELEASE_PACKAGE_SET.map((entry) => entry.name)).not.toContain("@starwind-ui/svelte");
  });

  it("keeps Vue and Svelte quarantined outside Changesets and publication", async () => {
    expect(CHANGESET_IGNORED_PACKAGES).toEqual([
      "demo",
      "react-demo",
      "vue-demo",
      "@starwind-ui/vue",
      "@starwind-ui/svelte",
    ]);
    expect(RUNTIME_FIXED_GROUP).toEqual([
      "@starwind-ui/runtime",
      "@starwind-ui/astro",
      "@starwind-ui/react",
    ]);
    expect(
      createPublishCommands({ dryRun: true }).map((command) => command.packageName),
    ).not.toContain("@starwind-ui/vue");
    expect(
      createPublishCommands({ dryRun: true }).map((command) => command.packageName),
    ).not.toContain("@starwind-ui/svelte");

    const [vuePackage, sveltePackage] = await Promise.all([
      readJson<PackageJson>("packages/vue/package.json"),
      readJson<PackageJson>("packages/svelte/package.json"),
    ]);
    expect(vuePackage).toMatchObject({
      name: "@starwind-ui/vue",
      private: true,
      version: "0.0.0",
    });
    expect(sveltePackage).toMatchObject({
      dependencies: { "@starwind-ui/runtime": "workspace:*" },
      name: "@starwind-ui/svelte",
      peerDependencies: { svelte: ">=5.29.0" },
      private: true,
      sideEffects: false,
      version: "0.0.0",
    });
    expect(Object.keys(sveltePackage.exports ?? {})).toEqual([
      ".",
      "./button",
      "./carousel",
      "./checkbox",
      "./select",
      "./accordion",
      "./dialog",
      "./slider",
      "./toast",
    ]);
    expect(
      Object.keys(sveltePackage.scripts ?? {}).filter((script) => script.startsWith("publish")),
    ).toEqual([]);

    const changesetFiles = (await readdir(".changeset", { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md")
      .map((entry) => entry.name);
    for (const file of changesetFiles) {
      assertNoPrivateAdapterChangesetReleases(file, await readFile(`.changeset/${file}`, "utf8"));
    }
  });

  it("keeps ignored private packages out of the stable prerelease exit plan", () => {
    const rootRequire = createRequire(import.meta.url);
    const changesetsRequire = createRequire(rootRequire.resolve("@changesets/cli/package.json"));
    const assembleReleasePlan = changesetsRequire("@changesets/assemble-release-plan").default as (
      changesets: Array<{
        id: string;
        releases: Array<{ name: string; type: "major" }>;
        summary: string;
      }>,
      packages: {
        root: { dir: string; packageJson: PackageJson };
        packages: Array<{ dir: string; packageJson: PackageJson }>;
      },
      config: Record<string, unknown>,
      preState: {
        changesets: string[];
        initialVersions: Record<string, string>;
        mode: "exit";
        tag: string;
      },
    ) => { releases: Array<{ name: string; newVersion: string; type: string }> };
    const makePackage = (name: string, version: string, extra: PackageJson = {}) => ({
      dir: `/tmp/starwind-changesets-exit/${name.replaceAll("/", "-")}`,
      packageJson: { name, version, ...extra },
    });
    const packages = {
      root: {
        dir: "/tmp/starwind-changesets-exit",
        packageJson: { name: "root", private: true, version: "0.0.0" },
      },
      packages: [
        makePackage("@starwind-ui/runtime", "0.1.0-beta.1"),
        makePackage("@starwind-ui/astro", "0.1.0-beta.1", {
          dependencies: { "@starwind-ui/runtime": "workspace:^" },
        }),
        makePackage("@starwind-ui/react", "0.1.0-beta.1", {
          dependencies: { "@starwind-ui/runtime": "workspace:^" },
        }),
        makePackage("starwind", "3.0.0-beta.1"),
        makePackage("@starwind-ui/vue", "0.0.0", {
          dependencies: { "@starwind-ui/runtime": "workspace:^" },
          private: true,
        }),
        makePackage("@starwind-ui/svelte", "0.0.0", {
          dependencies: { "@starwind-ui/runtime": "workspace:^" },
          private: true,
        }),
      ],
    };
    const changesets = [
      {
        id: "runtime-stable",
        releases: [{ name: "@starwind-ui/runtime", type: "major" as const }],
        summary: "Release Runtime as stable.",
      },
      {
        id: "cli-stable",
        releases: [{ name: "starwind", type: "major" as const }],
        summary: "Release the CLI as stable.",
      },
    ];
    const initialVersions = Object.fromEntries(
      packages.packages.map(({ packageJson }) => [packageJson.name, packageJson.version]),
    ) as Record<string, string>;

    const plan = assembleReleasePlan(
      changesets,
      packages,
      {
        ___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH: {
          onlyUpdatePeerDependentsWhenOutOfRange: false,
          updateInternalDependents: "out-of-range",
        },
        access: "public",
        baseBranch: "main",
        bumpVersionsWithWorkspaceProtocolOnly: false,
        changedFilePatterns: ["**"],
        changelog: false,
        commit: false,
        fixed: [["@starwind-ui/runtime", "@starwind-ui/astro", "@starwind-ui/react"]],
        ignore: ["@starwind-ui/vue", "@starwind-ui/svelte"],
        linked: [],
        prettier: true,
        privatePackages: CHANGESET_PRIVATE_PACKAGE_POLICY,
        snapshot: { prereleaseTemplate: null, useCalculatedVersion: false },
        updateInternalDependencies: "patch",
      },
      {
        changesets: changesets.map(({ id }) => id),
        initialVersions,
        mode: "exit",
        tag: "beta",
      },
    );
    const versionedReleases = Object.fromEntries(
      plan.releases
        .filter(({ type }) => type !== "none")
        .map(({ name, newVersion }) => [name, newVersion]),
    );

    expect(versionedReleases).toEqual({
      "@starwind-ui/astro": "1.0.0",
      "@starwind-ui/react": "1.0.0",
      "@starwind-ui/runtime": "1.0.0",
      starwind: "3.0.0",
    });
    expect(
      plan.releases
        .filter(({ name }) => PRIVATE_ADAPTER_PACKAGE_NAMES.has(name))
        .every(({ newVersion, type }) => newVersion === "0.0.0" && type === "none"),
    ).toBe(true);
  });

  it("rejects single-quoted private package releases in Changeset frontmatter", () => {
    expect(() =>
      assertNoPrivateAdapterChangesetReleases(
        "private-vue.md",
        "---\n'@starwind-ui/vue': patch\n---\n\nPrivate Vue release.\n",
      ),
    ).toThrow(/@starwind-ui\/vue/);
  });

  it("exposes generic release commands and beta compatibility aliases", async () => {
    const root = await readJson<PackageJson>("package.json");
    expect(root.scripts?.["release:version"]).toBe(
      "tsx scripts/portable-runtime/styled-component-release.ts version && tsx scripts/portable-runtime/primitive-component-release.ts version && changeset version && pnpm runtime:registry:generate && pnpm runtime:docs:metadata",
    );
    expect(root.scripts?.version).toBe("pnpm release:version");
    expect(root.scripts?.["styled:versions:stage"]).toBe(
      "tsx scripts/portable-runtime/styled-component-release.ts stage",
    );
    expect(root.scripts?.["primitive:versions:stage"]).toBe(
      "tsx scripts/portable-runtime/primitive-component-release.ts stage",
    );
    expect(root.scripts?.["local:release"]).toContain("pnpm release:version");
    expect(commandPhases(root.scripts?.["publish:release:dry-run"])).toEqual([
      "pnpm release:artifacts",
      "node scripts/release-packages.mjs --dry-run",
    ]);
    expect(root.scripts?.["publish:release"]).toBe("node scripts/release-packages.mjs --publish");
    expect(root.scripts?.["release:finalize"]).toBe("node scripts/release-finalization.mjs");
    expect(root.scripts?.["release:consumer:node22"]).toBe(
      "node scripts/node22-public-consumer-smoke.mjs",
    );
    expect(root.scripts?.["release:pack:public-artifacts"]).toBe(
      "node scripts/pack-public-release-artifacts.mjs --output .release-packs",
    );
    expect(root.scripts?.["publish:beta:dry-run"]).toBe("pnpm publish:release:dry-run");
    expect(root.scripts?.["publish:beta"]).toBe("pnpm publish:release");
    expect(commandPhases(root.scripts?.["release:gate"])).toEqual([
      "pnpm verify:public",
      "pnpm --filter=starwind package:check",
      "pnpm audit:prod",
      "pnpm demo:smoke",
      "pnpm react-demo:smoke",
      "pnpm runtime:size:check:prepared",
      "pnpm release:candidate:acceptance",
    ]);
    expect(root.scripts?.["publish:release:dry-run"]).not.toContain("release:prepare");
    expect(root.scripts?.["publish:release:dry-run"]).not.toContain("release:gate");
    expect(root.scripts?.["runtime:size:check"]).toBe(
      "pnpm runtime:build && pnpm react:build && pnpm vue:build && node scripts/portable-runtime/measure-package-sizes.mjs --check --private-vue",
    );
    expect(root.scripts?.["runtime:size:check:prepared"]).toBe(
      "node scripts/portable-runtime/measure-package-sizes.mjs --check",
    );
    expect(root.scripts?.["runtime:size:check:prepared:private"]).toBe(
      "node scripts/portable-runtime/measure-package-sizes.mjs --check --private-vue",
    );
    expect(root.scripts?.["runtime:size:baseline:vue"]).toBe(
      "node scripts/portable-runtime/measure-package-sizes.mjs --baseline-vue",
    );
    expect(root.scripts?.["release:candidate:acceptance"]).toBe(
      "node scripts/release-candidate-acceptance.mjs",
    );
    expect(root.scripts?.["release:prepare"]).not.toContain("build");
    expect(root.scripts?.["release:artifacts"]).toBe("node scripts/check-release-artifacts.mjs");
  });

  it("derives the one product tag from the CLI version", () => {
    expect(
      deriveReleaseIdentity(manifests({ cli: "3.0.0-beta.8", runtime: "0.1.0-beta.8" }), "beta"),
    ).toMatchObject({
      npmTag: "beta",
      prerelease: true,
      tagName: "v3.0.0-beta.8",
    });
    expect(
      deriveReleaseIdentity(manifests({ cli: "3.0.0", runtime: "1.0.0" }), "latest"),
    ).toMatchObject({ npmTag: "latest", prerelease: false, tagName: "v3.0.0" });
  });

  it("creates prerelease and stable GitHub releases from an existing verified tag", () => {
    expect(createGitHubReleaseArgs({ prerelease: true, tagName: "v3.0.0-rc.1" })).toEqual([
      "release",
      "create",
      "v3.0.0-rc.1",
      "--repo",
      "starwind-ui/starwind-ui",
      "--verify-tag",
      "--generate-notes",
      "--prerelease",
      "--latest=false",
    ]);
    expect(createGitHubReleaseArgs({ prerelease: false, tagName: "v3.0.0" })).toEqual([
      "release",
      "create",
      "v3.0.0",
      "--repo",
      "starwind-ui/starwind-ui",
      "--verify-tag",
      "--generate-notes",
      "--latest",
    ]);
  });

  it("verifies every exact npm version and its release dist-tag", async () => {
    const expected = deriveReleaseIdentity(
      manifests({ cli: "3.0.0-beta.8", runtime: "0.1.0-beta.8" }),
      "beta",
    );
    const calls: string[] = [];
    await verifyPublishedPackages(expected, {
      capture: async (command: string, args: string[]) => {
        calls.push([command, ...args].join(" "));
        const packageName = args[1].slice(0, args[1].lastIndexOf("@"));
        const item = expected.packages.find((entry) => entry.name === packageName)!;
        return args[2] === "version"
          ? { code: 0, stderr: "", stdout: JSON.stringify(item.version) }
          : { code: 0, stderr: "", stdout: JSON.stringify({ beta: item.version }) };
      },
      run: async () => undefined,
    });
    expect(calls).toHaveLength(8);
  });

  it("retries a package version while npm publication propagates", async () => {
    const expected = deriveReleaseIdentity(manifests({ cli: "3.0.0", runtime: "1.0.0" }), "latest");
    const calls: string[] = [];
    const waits: number[] = [];
    let runtimeVersionAttempts = 0;

    await verifyPublishedPackages(
      expected,
      {
        capture: async (command: string, args: string[]) => {
          calls.push([command, ...args].join(" "));
          const packageName = args[1].slice(0, args[1].lastIndexOf("@"));
          const item = expected.packages.find((entry) => entry.name === packageName)!;
          if (packageName === "@starwind-ui/runtime" && args[2] === "version") {
            runtimeVersionAttempts += 1;
            if (runtimeVersionAttempts === 1) {
              return { code: 1, stderr: "npm error E404", stdout: "" };
            }
          }
          return args[2] === "version"
            ? { code: 0, stderr: "", stdout: JSON.stringify(item.version) }
            : { code: 0, stderr: "", stdout: JSON.stringify({ latest: item.version }) };
        },
        run: async () => undefined,
      },
      {
        attempts: 3,
        retryDelayMs: 5_000,
        wait: async (delayMs: number) => {
          waits.push(delayMs);
        },
      },
    );

    expect(runtimeVersionAttempts).toBe(2);
    expect(waits).toEqual([5_000]);
    expect(calls).toHaveLength(9);
  });

  it("reports safe recovery after dist-tag propagation retries are exhausted", async () => {
    const expected = deriveReleaseIdentity(manifests({ cli: "3.0.0", runtime: "1.0.0" }), "latest");
    const waits: number[] = [];
    let runtimeTagAttempts = 0;

    await expect(
      verifyPublishedPackages(
        expected,
        {
          capture: async (_command: string, args: string[]) => {
            if (args[2] === "version") {
              return { code: 0, stderr: "", stdout: JSON.stringify("1.0.0") };
            }
            runtimeTagAttempts += 1;
            return { code: 1, stderr: "npm error E404", stdout: "" };
          },
          run: async () => undefined,
        },
        {
          attempts: 3,
          onRetry: () => undefined,
          retryDelayMs: 5_000,
          wait: async (delayMs: number) => {
            waits.push(delayMs);
          },
        },
      ),
    ).rejects.toThrow(/dist-tag latest.*pnpm release:finalize/);

    expect(runtimeTagAttempts).toBe(3);
    expect(waits).toEqual([5_000, 5_000]);
  });

  it("preserves non-retryable version lookup errors", async () => {
    const expected = deriveReleaseIdentity(manifests({ cli: "3.0.0", runtime: "1.0.0" }), "latest");
    const waits: number[] = [];
    let attempts = 0;

    const error = await verifyPublishedPackages(
      expected,
      {
        capture: async () => {
          attempts += 1;
          return { code: 1, stderr: "npm error E401", stdout: "" };
        },
        run: async () => undefined,
      },
      {
        attempts: 3,
        onRetry: () => undefined,
        retryDelayMs: 5_000,
        wait: async (delayMs: number) => {
          waits.push(delayMs);
        },
      },
    ).then(
      () => undefined,
      (failure: unknown) => failure,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("version could not be verified: npm error E401");
    expect((error as Error).message).not.toContain("pnpm release:finalize");
    expect(attempts).toBe(1);
    expect(waits).toEqual([]);
  });

  it("stops before Git changes when any package version is missing", async () => {
    const expected = deriveReleaseIdentity(
      manifests({ cli: "3.0.0-beta.8", runtime: "0.1.0-beta.8" }),
      "beta",
    );
    const commands: string[] = [];
    const system = {
      capture: async (command: string, args: string[]) => {
        commands.push([command, ...args].join(" "));
        return { code: 1, stderr: "npm error E404", stdout: "" };
      },
      run: async (command: string, args: string[]) => {
        commands.push([command, ...args].join(" "));
      },
    };
    await expect(verifyPublishedPackages(expected, system, { attempts: 1 })).rejects.toThrow(
      /did not become visible/,
    );
    expect(commands.every((command) => command.startsWith("npm view"))).toBe(true);
  });

  it("keeps the public finalization command read-only until registry verification passes", async () => {
    const commands: string[] = [];
    await expect(
      runReleaseFinalization({
        gitStateLoader: async () => ({ head: "abc123" }),
        metadataLoader: async () => ({
          packageManifests: manifests({ cli: "3.0.0-beta.8", runtime: "0.1.0-beta.8" }),
          tag: "beta",
        }),
        registryVerificationOptions: { attempts: 1 },
        system: {
          capture: async (command: string, args: string[]) => {
            commands.push([command, ...args].join(" "));
            return { code: 1, stderr: "npm error E404", stdout: "" };
          },
          run: async (command: string, args: string[]) => {
            commands.push([command, ...args].join(" "));
          },
        },
      }),
    ).rejects.toThrow(/did not become visible/);
    expect(commands).toEqual(["npm view @starwind-ui/runtime@0.1.0-beta.8 version --json"]);
  });

  it("finalizes an absent tag and prerelease through explicit refs", async () => {
    const commands: string[] = [];
    const captures = new Map([
      ["git rev-parse -q --verify refs/tags/v3.0.0-beta.8^{}", { code: 1, stderr: "", stdout: "" }],
      [
        "git ls-remote --tags origin refs/tags/v3.0.0-beta.8 refs/tags/v3.0.0-beta.8^{}",
        { code: 0, stderr: "", stdout: "" },
      ],
      [
        "gh release view v3.0.0-beta.8 --repo starwind-ui/starwind-ui --json tagName,isPrerelease,isDraft",
        { code: 1, stderr: "release not found", stdout: "" },
      ],
    ]);
    await finalizeVerifiedRelease(
      {
        head: "abc123",
        npmTag: "beta",
        packages: [],
        prerelease: true,
        tagName: "v3.0.0-beta.8",
      },
      {
        capture: async (command: string, args: string[]) =>
          captures.get([command, ...args].join(" ")) ?? {
            code: 2,
            stderr: "unexpected",
            stdout: "",
          },
        run: async (command: string, args: string[]) => {
          commands.push([command, ...args].join(" "));
        },
      },
    );
    expect(commands).toEqual([
      "git tag --annotate v3.0.0-beta.8 abc123 --message Release v3.0.0-beta.8",
      "git push origin refs/tags/v3.0.0-beta.8:refs/tags/v3.0.0-beta.8",
      "gh release create v3.0.0-beta.8 --repo starwind-ui/starwind-ui --verify-tag --generate-notes --prerelease --latest=false",
    ]);
  });

  it("treats a matching tag and GitHub release as an idempotent success", async () => {
    const commands: string[] = [];
    await finalizeVerifiedRelease(
      {
        head: "abc123",
        npmTag: "beta",
        packages: [],
        prerelease: true,
        tagName: "v3.0.0-beta.8",
      },
      {
        capture: async (command: string) => {
          if (command === "gh") {
            return {
              code: 0,
              stderr: "",
              stdout: JSON.stringify({
                isDraft: false,
                isPrerelease: true,
                tagName: "v3.0.0-beta.8",
              }),
            };
          }
          return { code: 0, stderr: "", stdout: "abc123\trefs/tags/v3.0.0-beta.8\n" };
        },
        run: async (command: string, args: string[]) => {
          commands.push([command, ...args].join(" "));
        },
      },
    );
    expect(commands).toEqual([]);
  });

  it("rejects tag targets and GitHub release classifications that conflict", async () => {
    const release = {
      head: "abc123",
      npmTag: "latest",
      packages: [],
      prerelease: false,
      tagName: "v3.0.0",
    };
    await expect(
      finalizeVerifiedRelease(release, {
        capture: async () => ({ code: 0, stderr: "", stdout: "def456" }),
        run: async () => undefined,
      }),
    ).rejects.toThrow(/points to def456/);

    await expect(
      finalizeVerifiedRelease(release, {
        capture: async (command: string) =>
          command === "gh"
            ? {
                code: 0,
                stderr: "",
                stdout: JSON.stringify({
                  isDraft: false,
                  isPrerelease: true,
                  tagName: "v3.0.0",
                }),
              }
            : { code: 0, stderr: "", stdout: "abc123" },
        run: async () => undefined,
      }),
    ).rejects.toThrow(/classification/);
  });

  it("rejects a matching draft GitHub release as unfinished", async () => {
    await expect(
      finalizeVerifiedRelease(
        {
          head: "abc123",
          npmTag: "beta",
          packages: [],
          prerelease: true,
          tagName: "v3.0.0-beta.8",
        },
        {
          capture: async (command: string) =>
            command === "gh"
              ? {
                  code: 0,
                  stderr: "",
                  stdout: JSON.stringify({
                    isDraft: true,
                    isPrerelease: true,
                    tagName: "v3.0.0-beta.8",
                  }),
                }
              : {
                  code: 0,
                  stderr: "",
                  stdout: "abc123\trefs/tags/v3.0.0-beta.8",
                },
          run: async () => undefined,
        },
      ),
    ).rejects.toThrow(/draft/);
  });

  it("repairs Latest status for an existing stable GitHub release", async () => {
    const commands: string[] = [];
    await finalizeVerifiedRelease(
      {
        head: "abc123",
        npmTag: "latest",
        packages: [],
        prerelease: false,
        tagName: "v3.0.0",
      },
      {
        capture: async (command: string, args: string[]) => {
          if (command !== "gh") {
            return { code: 0, stderr: "", stdout: "abc123\trefs/tags/v3.0.0" };
          }
          if (args.includes("v3.0.0")) {
            return {
              code: 0,
              stderr: "",
              stdout: JSON.stringify({
                isDraft: false,
                isPrerelease: false,
                tagName: "v3.0.0",
              }),
            };
          }
          return {
            code: 0,
            stderr: "",
            stdout: JSON.stringify({ tagName: "v2.0.1" }),
          };
        },
        run: async (command: string, args: string[]) => {
          commands.push([command, ...args].join(" "));
        },
      },
    );
    expect(commands).toEqual(["gh release edit v3.0.0 --repo starwind-ui/starwind-ui --latest"]);
  });

  it("captures process output through close and settles once", async () => {
    const child = new EventEmitter() as EventEmitter & {
      stderr: PassThrough;
      stdout: PassThrough;
    };
    child.stderr = new PassThrough();
    child.stdout = new PassThrough();
    const system = createCommandSystem({
      cwd: ".",
      spawnProcess: () => child,
    });
    let settled = false;
    const resultPromise = system.capture("example", []).then((result) => {
      settled = true;
      return result;
    });
    child.stdout.write("before ");
    child.emit("exit", 0);
    await Promise.resolve();
    expect(settled).toBe(false);
    child.stdout.write("close");
    child.emit("close", 0);
    child.emit("error", new Error("late error"));
    await expect(resultPromise).resolves.toMatchObject({ code: 0, stdout: "before close" });
  });

  it("resolves package-manager executables for Linux and Windows", () => {
    expect(getPackageManagerCommand("npm", "linux")).toBe("npm");
    expect(getPackageManagerCommand("pnpm", "linux")).toBe("pnpm");
    expect(getPackageManagerCommand("npm", "win32")).toBe("npm.cmd");
    expect(getPackageManagerCommand("pnpm", "win32")).toBe("pnpm.cmd");
    expect(() => getPackageManagerCommand("yarn", "linux")).toThrow("Unsupported package manager");
  });

  it("uses one Windows command wrapper and rejects cmd metacharacters", () => {
    expect(createSpawnCommand("pnpm.cmd", ["publish", "--tag", "beta"], "win32")).toEqual({
      args: ["/d", "/s", "/c", "pnpm.cmd publish --tag beta"],
      command: "cmd.exe",
    });
    expect(() => createSpawnCommand("pnpm.cmd", ["refs/tags/v1^{}"], "win32")).toThrow(
      /safely pass argument/,
    );
  });

  it("creates an annotated tag at the exact release commit in a bare remote", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "starwind-release-tag-"));
    const remote = path.join(directory, "origin.git");
    const checkout = path.join(directory, "checkout");
    try {
      const setup = createCommandSystem({ cwd: directory });
      await setup.run("git", ["init", "--bare", remote]);
      await setup.run("git", ["init", "--initial-branch=main", checkout]);
      const git = createCommandSystem({ cwd: checkout });
      await git.run("git", ["config", "user.email", "release-test@starwind-ui.com"]);
      await git.run("git", ["config", "user.name", "Starwind Release Test"]);
      await writeFile(path.join(checkout, "release.txt"), "release\n");
      await git.run("git", ["add", "release.txt"]);
      await git.run("git", ["commit", "-m", "release fixture"]);
      await git.run("git", ["remote", "add", "origin", remote]);
      await git.run("git", ["push", "origin", "main"]);
      const head = (await git.capture("git", ["rev-parse", "HEAD"])).stdout;
      const githubCommands: string[] = [];
      const system = {
        capture: async (command: string, args: string[]) =>
          command === "gh"
            ? { code: 1, stderr: "release not found", stdout: "" }
            : git.capture(command, args),
        run: async (command: string, args: string[]) => {
          if (command === "gh") githubCommands.push([command, ...args].join(" "));
          else await git.run(command, args);
        },
      };
      await finalizeVerifiedRelease(
        {
          head,
          npmTag: "beta",
          packages: [],
          prerelease: true,
          tagName: "v3.0.0-beta.8",
        },
        system,
      );
      const remoteGit = createCommandSystem({ cwd: directory });
      const remoteTarget = await remoteGit.capture("git", [
        `--git-dir=${remote}`,
        "rev-parse",
        "refs/tags/v3.0.0-beta.8^{}",
      ]);
      expect(remoteTarget).toMatchObject({ code: 0, stdout: head });
      expect(githubCommands).toHaveLength(1);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
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
      validateReleasePackageManifests(manifests({ cli: "3.0.0", runtime: "0.1.0" }), undefined).ok,
    ).toBe(false);
    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0", runtime: "1.0.0" }), undefined),
    ).toEqual({ errors: [], ok: true, tag: "latest" });

    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0-beta.2", runtime: "0.1.0-beta.2" }), {
        mode: "exit",
        tag: "beta",
      }).ok,
    ).toBe(false);
    expect(
      validateReleasePackageManifests(manifests({ cli: "3.0.0", runtime: "1.0.0" }), {
        mode: "pre",
        tag: "beta",
      }).ok,
    ).toBe(false);
    expect(
      validateReleaseChangesetConfig({
        ignore: [...CHANGESET_IGNORED_PACKAGES],
        privatePackages: CHANGESET_PRIVATE_PACKAGE_POLICY,
      }).ok,
    ).toBe(true);
    expect(validateReleaseChangesetConfig({ ignore: [...CHANGESET_IGNORED_PACKAGES] }).ok).toBe(
      false,
    );
    expect(
      validateReleaseChangesetConfig({
        ignore: [...CHANGESET_IGNORED_PACKAGES],
        privatePackages: { version: true, tag: false },
      }).ok,
    ).toBe(false);
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

  it("never finalizes after a publish failure at any package prefix", async () => {
    const publishCommands = createPublishCommands({ tag: "beta" });
    for (let failureIndex = 0; failureIndex < publishCommands.length; failureIndex += 1) {
      let finalizations = 0;
      let publishAttempts = 0;
      await expect(
        executeReleasePublication({
          dryRun: false,
          finalize: async () => {
            finalizations += 1;
          },
          publishCommands,
          runPublish: async () => {
            const currentIndex = publishAttempts;
            publishAttempts += 1;
            if (currentIndex === failureIndex) throw new Error("publish failed");
          },
        }),
      ).rejects.toThrow(/publish failed/);
      expect(publishAttempts).toBe(failureIndex + 1);
      expect(finalizations).toBe(0);
    }
  });

  it("finalizes once after a resumed publication completes", async () => {
    const published: string[] = [];
    let finalizations = 0;
    await executeReleasePublication({
      dryRun: false,
      finalize: async () => {
        finalizations += 1;
      },
      publishCommands: createPublishCommands({
        resumeFrom: "@starwind-ui/react",
        tag: "beta",
      }),
      runPublish: async (_command, _args, options) => {
        published.push(options.packageName);
      },
    });
    expect(published).toEqual(["@starwind-ui/react", "starwind"]);
    expect(finalizations).toBe(1);
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

  it("waits for Git stdout to close before validating publish state", async () => {
    const child = new EventEmitter() as EventEmitter & { stdout: PassThrough };
    child.stdout = new PassThrough();
    const outputPromise = readGitOutput(["rev-parse", "HEAD"], () => child);

    child.emit("exit", 0);
    await Promise.resolve();
    child.stdout.end("abc123\n");
    child.emit("close", 0);

    await expect(outputPromise).resolves.toBe("abc123");
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
