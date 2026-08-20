import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type {
  PrimitiveVendoringArtifact,
  PrimitiveVendoringArtifacts,
} from "../generate-cli-registry.js";
import {
  aggregatePrimitiveVersionIntents,
  applyPrimitiveVersionIntents,
  createPrimitiveArtifactFingerprint,
  parsePrimitiveVersionIntent,
  stagePrimitiveVersionIntents,
  validatePrimitiveVersionPullRequest,
  versionPrimitiveComponents,
  type PrimitiveReleaseSnapshot,
  type PrimitiveVersionIntent,
} from "../primitive-component-release.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

function artifact(
  component: string,
  framework: "astro" | "react",
  version: string,
  content = `${component} ${framework} source`,
): PrimitiveVendoringArtifact {
  return {
    component,
    framework,
    version,
    sourceVersion: version,
    files: [
      {
        path: `src/components/starwind-primitives/${component}/index.${framework === "astro" ? "astro" : "tsx"}`,
        content,
        sourceHash: `sha256:${content}`,
        sourcePath: `packages/${framework}/src/${component}/index.ts`,
      },
    ],
    packageRequirements: [
      { name: "@starwind-ui/runtime", range: "^0.1.0-beta.3" },
      { name: framework, range: "^1.0.0" },
    ],
  };
}

function artifacts(versions: Record<string, string>): PrimitiveVendoringArtifacts {
  return {
    $schema: "https://starwind.dev/primitive-vendoring-artifacts-schema.v1.json",
    primitives: Object.entries(versions).flatMap(([component, version]) => [
      artifact(component, "astro", version),
      artifact(component, "react", version),
    ]),
  };
}

function snapshot(
  options: {
    artifacts?: PrimitiveVendoringArtifacts;
    defaultPrimitiveVersion?: string;
    fragments?: PrimitiveReleaseSnapshot["fragments"];
    manifest?: Record<string, string>;
    packageReleases?: PrimitiveReleaseSnapshot["packageReleases"];
    sourceVersions?: Record<string, string>;
  } = {},
): PrimitiveReleaseSnapshot {
  const versions = options.manifest ?? { avatar: "0.1.0", select: "0.1.2" };
  return {
    artifacts: options.artifacts ?? artifacts(versions),
    fragments: options.fragments ?? {},
    manifest: {
      defaultPrimitiveVersion: options.defaultPrimitiveVersion ?? "0.1.0",
      primitives: versions,
      sourceVersions: options.sourceVersions ?? versions,
    },
    packageReleases: options.packageReleases ?? {},
  };
}

describe("primitive component release intents", () => {
  it("parses strict SemVer intents and rejects invalid input", () => {
    const legacyIntent = {
      primitives: { avatar: "patch" },
    } satisfies PrimitiveVersionIntent;
    expect(legacyIntent).toEqual({ primitives: { avatar: "patch" } });

    const known = new Set(["avatar", "select"]);
    expect(
      parsePrimitiveVersionIntent(
        { primitives: { avatar: "major", select: "minor" } },
        "intent.json",
        known,
      ),
    ).toEqual({ impact: "source", primitives: { avatar: "major", select: "minor" } });
    expect(
      parsePrimitiveVersionIntent(
        { impact: "behavior", primitives: { avatar: "patch" } },
        "behavior.json",
        known,
      ),
    ).toEqual({ impact: "behavior", primitives: { avatar: "patch" } });
    expect(() => parsePrimitiveVersionIntent({ primitives: {} }, "empty.json", known)).toThrow(
      /at least one primitive/i,
    );
    expect(() =>
      parsePrimitiveVersionIntent({ primitives: { avatar: "none" } }, "none.json", known),
    ).toThrow(/patch, minor, or major/i);
    expect(() =>
      parsePrimitiveVersionIntent({ primitives: { missing: "patch" } }, "unknown.json", known),
    ).toThrow(/unknown primitive/i);
    expect(() =>
      parsePrimitiveVersionIntent(
        { primitives: { avatar: "patch" }, extra: true },
        "extra.json",
        known,
      ),
    ).toThrow(/only primitives and optional impact/i);
    expect(() =>
      parsePrimitiveVersionIntent(
        { impact: "files", primitives: { avatar: "patch" } },
        "invalid-impact.json",
        known,
      ),
    ).toThrow(/impact must be source or behavior/i);
  });

  it("aggregates each primitive to one highest-severity SemVer bump", () => {
    const aggregate = aggregatePrimitiveVersionIntents({
      "avatar-a.json": { primitives: { avatar: "patch" } },
      "avatar-b.json": { primitives: { avatar: "minor" } },
      "avatar-c.json": { primitives: { avatar: "major" } },
      "select.json": { primitives: { select: "patch" } },
    });
    expect(aggregate).toEqual({
      avatar: { bump: "major", impact: "source" },
      select: { bump: "patch", impact: "source" },
    });
    expect(applyPrimitiveVersionIntents({ avatar: "0.1.0", select: "0.1.2" }, aggregate)).toEqual({
      avatar: "1.0.0",
      select: "0.1.3",
    });
    expect(() => applyPrimitiveVersionIntents({ avatar: "bad" }, { avatar: "patch" })).toThrow(
      /invalid semver/i,
    );
  });

  it("lets source impact win independently from the highest bump", () => {
    expect(
      aggregatePrimitiveVersionIntents({
        "behavior.json": { impact: "behavior", primitives: { avatar: "major" } },
        "source.json": { impact: "source", primitives: { avatar: "patch" } },
      }),
    ).toEqual({ avatar: { bump: "major", impact: "source" } });
  });

  it("accepts one full-inventory stable promotion intent without source churn", () => {
    const base = snapshot();
    const head = snapshot({
      fragments: {
        "stable-baseline.json": { primitives: { avatar: "major", select: "major" } },
      },
      packageReleases: { "stable-baseline.md": { starwind: "patch" } },
    });
    expect(validatePrimitiveVersionPullRequest({ base, head })).toMatchObject({
      mode: "intent",
      promotedPrimitives: ["avatar", "select"],
    });
  });

  it("fingerprints Astro, React, and shared vendored source but ignores release metadata", () => {
    const before = [artifact("avatar", "astro", "0.1.0"), artifact("avatar", "react", "0.1.0")];
    const releaseOnly = structuredClone(before);
    releaseOnly.forEach((entry) => {
      entry.version = "0.1.1";
      entry.sourceVersion = "0.1.1";
      entry.packageRequirements[0]!.range = "^0.1.0-beta.4";
    });
    expect(createPrimitiveArtifactFingerprint(before)).toBe(
      createPrimitiveArtifactFingerprint(releaseOnly),
    );
    releaseOnly[1]!.files.push({
      path: "src/components/starwind-primitives/internal/shared.ts",
      content: "changed shared source",
      sourceHash: "sha256:changed",
      sourcePath: "packages/react/src/internal/shared.ts",
    });
    expect(createPrimitiveArtifactFingerprint(before)).not.toBe(
      createPrimitiveArtifactFingerprint(releaseOnly),
    );
  });

  it("accepts behavior intent only with Runtime backing and complete package release facts", () => {
    const base = snapshot();
    const head = snapshot({
      fragments: {
        "avatar-behavior.json": { impact: "behavior", primitives: { avatar: "patch" } },
      },
      packageReleases: {
        "runtime-behavior.md": {
          starwind: "patch",
          "@starwind-ui/runtime": "patch",
          "@starwind-ui/astro": "patch",
          "@starwind-ui/react": "patch",
        },
      },
    });
    expect(validatePrimitiveVersionPullRequest({ base, head })).toMatchObject({ mode: "intent" });
    expect(() =>
      validatePrimitiveVersionPullRequest({
        base,
        head: { ...head, packageReleases: { "runtime-behavior.md": { starwind: "patch" } } },
      }),
    ).toThrow(/requires new release intent.*runtime/i);
    expect(() =>
      validatePrimitiveVersionPullRequest({
        base,
        head: {
          ...head,
          packageReleases: {
            "runtime-behavior.md": {
              starwind: "patch",
              "@starwind-ui/runtime": "minor",
              "@starwind-ui/astro": "patch",
              "@starwind-ui/react": "patch",
            },
          },
        },
      }),
    ).toThrow(/matching fixed-group release bumps/i);

    const externalArtifacts = artifacts(base.manifest.primitives);
    externalArtifacts.primitives
      .filter((entry) => entry.component === "avatar")
      .forEach((entry) => {
        entry.packageRequirements = [{ name: "external-package", range: "^1.0.0" }];
      });
    expect(() =>
      validatePrimitiveVersionPullRequest({
        base: snapshot({ artifacts: externalArtifacts }),
        head: snapshot({
          artifacts: externalArtifacts,
          fragments: head.fragments,
          packageReleases: head.packageReleases,
        }),
      }),
    ).toThrow(/Runtime-backed primitive/i);
  });

  it("requires an intent and starwind Changeset for each changed vendored primitive", () => {
    const base = snapshot();
    const changed = artifacts(base.manifest.primitives);
    changed.primitives.find(
      (entry) => entry.component === "avatar" && entry.framework === "react",
    )!.files[0]!.content = "lazy avatar source";
    const head = snapshot({
      artifacts: changed,
      fragments: { "avatar-lazy-image.json": { primitives: { avatar: "patch" } } },
      packageReleases: { "avatar-lazy-image.md": { starwind: "patch" } },
    });
    expect(validatePrimitiveVersionPullRequest({ base, head })).toMatchObject({
      changedPrimitives: ["avatar"],
      mode: "intent",
    });
    expect(() =>
      validatePrimitiveVersionPullRequest({ base, head: snapshot({ artifacts: changed }) }),
    ).toThrow(/missing primitive version intent.*avatar/i);
    expect(() =>
      validatePrimitiveVersionPullRequest({ base, head: { ...head, packageReleases: {} } }),
    ).toThrow(/starwind package Changeset/i);
    expect(() =>
      validatePrimitiveVersionPullRequest({
        base,
        head: snapshot({
          fragments: { "select.json": { primitives: { select: "patch" } } },
          packageReleases: { "select.md": { starwind: "patch" } },
        }),
      }),
    ).toThrow(/no installable source change.*select/i);
  });

  it("rejects direct edits, removals, and changes to merged intents", () => {
    const base = snapshot({
      fragments: { "merged.json": { primitives: { avatar: "patch" } } },
    });
    expect(() =>
      validatePrimitiveVersionPullRequest({
        base,
        head: snapshot({ fragments: { "merged.json": { primitives: { avatar: "minor" } } } }),
      }),
    ).toThrow(/must not modify or remove merged intents/i);

    expect(() =>
      validatePrimitiveVersionPullRequest({
        base: snapshot(),
        head: snapshot({ manifest: { avatar: "0.1.1", select: "0.1.2" } }),
      }),
    ).toThrow(/expected avatar@0\.1\.0/i);

    expect(() =>
      validatePrimitiveVersionPullRequest({
        base: snapshot(),
        head: snapshot({ manifest: { avatar: "0.1.0" } }),
      }),
    ).toThrow(/removing vendorable primitives/i);
  });

  it("accepts a new primitive with an explicit initial version and no intent", () => {
    const base = snapshot();
    const versions = { ...base.manifest.primitives, tooltip: "0.1.0" };
    expect(
      validatePrimitiveVersionPullRequest({
        base,
        head: snapshot({
          manifest: versions,
          artifacts: artifacts(versions),
          packageReleases: { "tooltip.md": { starwind: "minor" } },
        }),
      }),
    ).toMatchObject({ addedPrimitives: ["tooltip"], mode: "intent" });
  });

  it("validates the exact Version Packages PR and prevents double bumps", () => {
    const base = snapshot({
      fragments: {
        "avatar-a.json": { primitives: { avatar: "patch" } },
        "avatar-b.json": { primitives: { avatar: "patch" } },
      },
    });
    const expected = { avatar: "0.1.1", select: "0.1.2" };
    expect(
      validatePrimitiveVersionPullRequest({
        base,
        head: snapshot({ manifest: expected, artifacts: artifacts(expected) }),
      }),
    ).toMatchObject({ mode: "version", versionedPrimitives: ["avatar"] });
    expect(() =>
      validatePrimitiveVersionPullRequest({
        base,
        head: snapshot({
          manifest: { avatar: "0.1.2", select: "0.1.2" },
          artifacts: artifacts({ avatar: "0.1.2", select: "0.1.2" }),
        }),
      }),
    ).toThrow(/expected avatar@0\.1\.1/i);
  });

  it("validates the Version Packages PR for the stable Primitive baseline", () => {
    const base = snapshot({
      fragments: {
        "stable-baseline.json": { primitives: { avatar: "major", select: "major" } },
      },
    });
    const expected = { avatar: "1.0.0", select: "1.0.0" };
    expect(
      validatePrimitiveVersionPullRequest({
        base,
        head: snapshot({
          artifacts: artifacts(expected),
          defaultPrimitiveVersion: "1.0.0",
          manifest: expected,
        }),
      }),
    ).toMatchObject({
      mode: "version",
      promotedPrimitives: ["avatar", "select"],
      versionedPrimitives: ["avatar", "select"],
    });
  });

  it("stages, versions, consumes, and remains idempotent", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "primitive-component-release-"));
    temporaryRoots.push(root);
    const fragmentRoot = path.join(root, ".changeset/primitive-components");
    const manifestPath = path.join(root, "packages/cli/registry/primitive-versions.json");
    await mkdir(fragmentRoot, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(snapshot().manifest, null, 2)}\n`);
    await writeFile(
      path.join(fragmentRoot, "avatar.json"),
      `${JSON.stringify({ primitives: { avatar: "patch" } }, null, 2)}\n`,
    );
    expect(await stagePrimitiveVersionIntents({ repoRoot: root })).toEqual({ staged: true });
    expect(await versionPrimitiveComponents({ repoRoot: root })).toMatchObject({
      versions: { avatar: { bump: "patch", from: "0.1.0", to: "0.1.1" } },
    });
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toMatchObject({
      primitives: { avatar: "0.1.1", select: "0.1.2" },
      sourceVersions: { avatar: "0.1.1", select: "0.1.2" },
    });
    await expect(
      readFile(path.join(root, ".primitive-component-intents/avatar.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(await versionPrimitiveComponents({ repoRoot: root })).toMatchObject({ versions: {} });
  });

  it("preserves sourceVersion when materializing behavior impact", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "primitive-component-behavior-"));
    temporaryRoots.push(root);
    const fragmentRoot = path.join(root, ".changeset/primitive-components");
    const manifestPath = path.join(root, "packages/cli/registry/primitive-versions.json");
    await mkdir(fragmentRoot, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(snapshot().manifest, null, 2)}\n`);
    await writeFile(
      path.join(fragmentRoot, "avatar.json"),
      `${JSON.stringify({ impact: "behavior", primitives: { avatar: "patch" } }, null, 2)}\n`,
    );
    await versionPrimitiveComponents({ repoRoot: root });
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toMatchObject({
      primitives: { avatar: "0.1.1" },
      sourceVersions: { avatar: "0.1.0" },
    });
  });

  it("promotes the complete Primitive inventory and default baseline to 1.0.0", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "primitive-component-stable-"));
    temporaryRoots.push(root);
    const fragmentRoot = path.join(root, ".changeset/primitive-components");
    const manifestPath = path.join(root, "packages/cli/registry/primitive-versions.json");
    await mkdir(fragmentRoot, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(snapshot().manifest, null, 2)}\n`);
    await writeFile(
      path.join(fragmentRoot, "stable-baseline.json"),
      `${JSON.stringify({ primitives: { avatar: "major", select: "major" } }, null, 2)}\n`,
    );
    expect(await stagePrimitiveVersionIntents({ repoRoot: root })).toEqual({ staged: true });
    expect(await versionPrimitiveComponents({ repoRoot: root })).toMatchObject({
      versions: {
        avatar: { bump: "major", from: "0.1.0", to: "1.0.0" },
        select: { bump: "major", from: "0.1.2", to: "1.0.0" },
      },
    });
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toEqual({
      defaultPrimitiveVersion: "1.0.0",
      primitives: { avatar: "1.0.0", select: "1.0.0" },
      sourceVersions: { avatar: "1.0.0", select: "1.0.0" },
    });
  });

  it("rejects unsafe names and simultaneous pending and staged directories", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "primitive-component-invalid-"));
    temporaryRoots.push(root);
    const manifestPath = path.join(root, "packages/cli/registry/primitive-versions.json");
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(snapshot().manifest, null, 2)}\n`);
    await mkdir(path.join(root, ".changeset/primitive-components"), { recursive: true });
    await writeFile(
      path.join(root, ".changeset/primitive-components/Unsafe Name.json"),
      '{"primitives":{"avatar":"patch"}}\n',
    );
    await expect(versionPrimitiveComponents({ repoRoot: root })).rejects.toThrow(
      /unsafe.*filename/i,
    );

    await rm(path.join(root, ".changeset/primitive-components"), { recursive: true });
    await mkdir(path.join(root, ".changeset/primitive-components"), { recursive: true });
    await mkdir(path.join(root, ".primitive-component-intents"), { recursive: true });
    await expect(versionPrimitiveComponents({ repoRoot: root })).rejects.toThrow(
      /both pending and staged/i,
    );
  });
});
