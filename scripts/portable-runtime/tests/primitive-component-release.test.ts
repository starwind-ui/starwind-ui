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
    fragments?: PrimitiveReleaseSnapshot["fragments"];
    manifest?: Record<string, string>;
    starwindChangesets?: string[];
  } = {},
): PrimitiveReleaseSnapshot {
  const versions = options.manifest ?? { avatar: "0.1.0", select: "0.1.2" };
  return {
    artifacts: options.artifacts ?? artifacts(versions),
    fragments: options.fragments ?? {},
    manifest: { defaultPrimitiveVersion: "0.1.0", primitives: versions },
    starwindChangesets: options.starwindChangesets ?? [],
  };
}

describe("primitive component release intents", () => {
  it("parses strict patch and minor intents and rejects invalid input", () => {
    const known = new Set(["avatar", "select"]);
    expect(
      parsePrimitiveVersionIntent(
        { primitives: { avatar: "patch", select: "minor" } },
        "intent.json",
        known,
      ),
    ).toEqual({ primitives: { avatar: "patch", select: "minor" } });
    expect(() => parsePrimitiveVersionIntent({ primitives: {} }, "empty.json", known)).toThrow(
      /at least one primitive/i,
    );
    expect(() =>
      parsePrimitiveVersionIntent({ primitives: { avatar: "major" } }, "major.json", known),
    ).toThrow(/patch or minor/i);
    expect(() =>
      parsePrimitiveVersionIntent({ primitives: { missing: "patch" } }, "unknown.json", known),
    ).toThrow(/unknown primitive/i);
    expect(() =>
      parsePrimitiveVersionIntent(
        { primitives: { avatar: "patch" }, extra: true },
        "extra.json",
        known,
      ),
    ).toThrow(/only a primitives object/i);
  });

  it("aggregates each primitive to one highest-severity pre-1.0 bump", () => {
    const aggregate = aggregatePrimitiveVersionIntents({
      "avatar-a.json": { primitives: { avatar: "patch" } },
      "avatar-b.json": { primitives: { avatar: "minor" } },
      "select.json": { primitives: { select: "patch" } },
    });
    expect(aggregate).toEqual({ avatar: "minor", select: "patch" });
    expect(applyPrimitiveVersionIntents({ avatar: "0.1.0", select: "0.1.2" }, aggregate)).toEqual({
      avatar: "0.2.0",
      select: "0.1.3",
    });
    expect(() => applyPrimitiveVersionIntents({ avatar: "bad" }, { avatar: "patch" })).toThrow(
      /invalid semver/i,
    );
  });

  it("fingerprints Astro, React, and shared vendored source but ignores release metadata", () => {
    const before = [artifact("avatar", "astro", "0.1.0"), artifact("avatar", "react", "0.1.0")];
    const releaseOnly = structuredClone(before);
    releaseOnly.forEach((entry) => {
      entry.version = "0.1.1";
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

  it("requires an intent and starwind Changeset for each changed vendored primitive", () => {
    const base = snapshot();
    const changed = artifacts(base.manifest.primitives);
    changed.primitives.find(
      (entry) => entry.component === "avatar" && entry.framework === "react",
    )!.files[0]!.content = "lazy avatar source";
    const head = snapshot({
      artifacts: changed,
      fragments: { "avatar-lazy-image.json": { primitives: { avatar: "patch" } } },
      starwindChangesets: ["avatar-lazy-image.md"],
    });
    expect(validatePrimitiveVersionPullRequest({ base, head })).toMatchObject({
      changedPrimitives: ["avatar"],
      mode: "intent",
    });
    expect(() =>
      validatePrimitiveVersionPullRequest({ base, head: snapshot({ artifacts: changed }) }),
    ).toThrow(/missing primitive version intent.*avatar/i);
    expect(() =>
      validatePrimitiveVersionPullRequest({ base, head: { ...head, starwindChangesets: [] } }),
    ).toThrow(/starwind package Changeset/i);
    expect(() =>
      validatePrimitiveVersionPullRequest({
        base,
        head: snapshot({
          fragments: { "select.json": { primitives: { select: "patch" } } },
          starwindChangesets: ["select.md"],
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
          starwindChangesets: ["tooltip.md"],
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
    });
    await expect(
      readFile(path.join(root, ".primitive-component-intents/avatar.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(await versionPrimitiveComponents({ repoRoot: root })).toMatchObject({ versions: {} });
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
