import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildRuntimeRegistry, type RuntimeRegistry } from "../generate-cli-registry.js";
import {
  aggregateStyledVersionIntents,
  applyStyledVersionIntents,
  createStyledRegistryFingerprint,
  parseStyledVersionIntent,
  stageStyledVersionIntents,
  validateStyledVersionPullRequest,
  versionStyledComponents,
  type StyledReleaseSnapshot,
} from "../styled-component-release.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

function registryComponent(
  name: string,
  version: string,
  content = `${name} source`,
): RuntimeRegistry["components"][number] {
  return {
    name,
    version,
    type: "component",
    dependencies: [],
    targets: {
      astro: {
        files: [{ path: `src/components/starwind/${name}/index.astro`, content }],
        componentDependencies: [],
        packageRequirements: [
          { name: "@starwind-ui/astro", range: "^0.1.0-beta.2" },
          { name: "external-package", range: "^1.0.0" },
        ],
      },
      react: {
        files: [{ path: `src/components/starwind/${name}/index.tsx`, content }],
        componentDependencies: [],
        packageRequirements: [
          { name: "@starwind-ui/react", range: "^0.1.0-beta.2" },
          { name: "external-package", range: "^1.0.0" },
        ],
      },
    },
  };
}

function snapshot(
  options: {
    fragments?: Record<string, { components: Record<string, "major" | "minor" | "patch"> }>;
    manifest?: Record<string, string>;
    registryVersion?: string;
    registry?: RuntimeRegistry["components"];
    starwindChangesets?: string[];
  } = {},
): StyledReleaseSnapshot {
  const manifest = options.manifest ?? { accordion: "2.0.1", progress: "2.0.0" };
  const registryVersion = options.registryVersion ?? "2.0.0";
  return {
    fragments: options.fragments ?? {},
    manifest: {
      registryVersion,
      defaultComponentVersion: "1.0.0",
      components: manifest,
    },
    registry: {
      $schema: "https://starwind.dev/registry-schema.v2.json",
      version: registryVersion,
      setup: {},
      components:
        options.registry ??
        Object.entries(manifest).map(([name, version]) => registryComponent(name, version)),
    },
    starwindChangesets: options.starwindChangesets ?? [],
  };
}

describe("styled component release intents", () => {
  it("parses a strict non-empty component bump map", () => {
    expect(
      parseStyledVersionIntent(
        { components: { accordion: "patch", card: "minor" } },
        "example.json",
        new Set(["accordion", "card"]),
      ),
    ).toEqual({ components: { accordion: "patch", card: "minor" } });

    expect(() => parseStyledVersionIntent({ components: {} }, "empty.json", new Set())).toThrow(
      /at least one component/,
    );
    expect(() =>
      parseStyledVersionIntent(
        { components: { accordion: "fix" } },
        "invalid.json",
        new Set(["accordion"]),
      ),
    ).toThrow(/patch, minor, or major/);
    expect(() =>
      parseStyledVersionIntent(
        { components: { missing: "patch" }, extra: true },
        "unknown.json",
        new Set(["accordion"]),
      ),
    ).toThrow(/only a components object/);
    expect(() =>
      parseStyledVersionIntent(
        { components: { missing: "patch" } },
        "unknown.json",
        new Set(["accordion"]),
      ),
    ).toThrow(/unknown styled component/);
    expect(() =>
      applyStyledVersionIntents({ accordion: "beta-two" }, { accordion: "patch" }),
    ).toThrow(/invalid semver/i);
  });

  it("collapses repeated intents to one highest-severity bump", () => {
    const aggregated = aggregateStyledVersionIntents({
      "progress-a.json": { components: { progress: "patch" } },
      "progress-b.json": { components: { progress: "patch" } },
      "progress-c.json": { components: { progress: "minor" } },
      "accordion.json": { components: { accordion: "major" } },
    });

    expect(aggregated).toEqual({ accordion: "major", progress: "minor" });
    expect(
      applyStyledVersionIntents({ accordion: "2.0.1", progress: "2.0.0" }, aggregated),
    ).toEqual({ accordion: "3.0.0", progress: "2.1.0" });
  });

  it("rejects unsafe fragment filenames before changing the manifest", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "styled-component-unsafe-intent-"));
    temporaryRoots.push(root);
    const fragmentRoot = path.join(root, ".changeset/styled-components");
    const manifestPath = path.join(root, "packages/cli/registry/styled-component-versions.json");
    await mkdir(fragmentRoot, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(snapshot().manifest, null, 2)}\n`);
    await writeFile(
      path.join(fragmentRoot, "Unsafe Intent.json"),
      `${JSON.stringify({ components: { accordion: "patch" } }, null, 2)}\n`,
    );

    await expect(versionStyledComponents({ repoRoot: root })).rejects.toThrow(/unsafe.*filename/i);
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toEqual(snapshot().manifest);
  });

  it("normalizes release-managed package ranges without hiding installable source changes", () => {
    const before = registryComponent("accordion", "2.0.1");
    const releaseOnly = structuredClone(before);
    releaseOnly.version = "2.0.2";
    releaseOnly.targets!.astro.packageRequirements[0].range = "^0.1.0-beta.3";
    expect(createStyledRegistryFingerprint(before)).toBe(
      createStyledRegistryFingerprint(releaseOnly),
    );

    releaseOnly.targets!.astro.files[0].content = "changed source";
    expect(createStyledRegistryFingerprint(before)).not.toBe(
      createStyledRegistryFingerprint(releaseOnly),
    );
  });

  it("requires intent and a starwind changeset for normal feature PR source changes", () => {
    const base = snapshot();
    const head = snapshot({
      fragments: { "accordion-fix.json": { components: { accordion: "patch" } } },
      registry: [
        registryComponent("accordion", "2.0.1", "changed accordion"),
        registryComponent("progress", "2.0.0"),
      ],
      starwindChangesets: ["accordion-fix.md"],
    });

    expect(validateStyledVersionPullRequest({ base, head })).toMatchObject({
      changedComponents: ["accordion"],
      mode: "intent",
    });
    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: snapshot({ registry: head.registry.components }),
      }),
    ).toThrow(/missing styled version intent.*accordion/i);
    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: { ...head, starwindChangesets: [] },
      }),
    ).toThrow(/starwind package changeset/i);
    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: snapshot({
          fragments: { "progress-fix.json": { components: { progress: "patch" } } },
          starwindChangesets: ["progress-fix.md"],
        }),
      }),
    ).toThrow(/no installable source change.*progress/i);
    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: snapshot({
          manifest: { accordion: "2.0.2", progress: "2.0.0" },
          registry: [
            registryComponent("accordion", "2.0.2"),
            registryComponent("progress", "2.0.0"),
          ],
        }),
      }),
    ).toThrow(/defer accordion version changes/i);
  });

  it("rejects edits to merged fragments and requires intents for every generated source change", () => {
    const base = snapshot({
      fragments: { "merged.json": { components: { accordion: "patch" } } },
    });
    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: snapshot({
          fragments: { "merged.json": { components: { accordion: "minor" } } },
        }),
      }),
    ).toThrow(/must not modify or remove merged intents/i);

    expect(() =>
      validateStyledVersionPullRequest({
        base: snapshot(),
        head: snapshot({
          fragments: { "accordion.json": { components: { accordion: "patch" } } },
          registry: [
            registryComponent("accordion", "2.0.1", "changed accordion"),
            registryComponent("progress", "2.0.0", "changed progress"),
          ],
          starwindChangesets: ["generated-change.md"],
        }),
      }),
    ).toThrow(/missing styled version intent.*progress/i);
  });

  it("accepts a new component with an explicit initial version and no deferred bump", () => {
    const base = snapshot();
    const head = snapshot({
      manifest: { accordion: "2.0.1", progress: "2.0.0", "new-component": "0.1.0" },
      registry: [...base.registry.components, registryComponent("new-component", "0.1.0")],
      starwindChangesets: ["new-component.md"],
    });

    expect(validateStyledVersionPullRequest({ base, head })).toMatchObject({
      addedComponents: ["new-component"],
      mode: "intent",
    });
  });

  it("allows a forward baseline correction only during a guarded registry migration", () => {
    const base = snapshot({
      manifest: { "color-picker": "0.1.0", progress: "2.0.0" },
    });
    const migrated = snapshot({
      fragments: {
        "color-picker-area.json": { components: { "color-picker": "patch" } },
      },
      manifest: { "color-picker": "1.2.0", progress: "2.0.0" },
      registryVersion: "2.1.0",
      registry: [
        registryComponent("color-picker", "1.2.0", "changed color picker"),
        registryComponent("progress", "2.0.0"),
      ],
      starwindChangesets: ["color-picker-area.md"],
    });

    expect(validateStyledVersionPullRequest({ base, head: migrated })).toMatchObject({
      changedComponents: ["color-picker"],
      mode: "intent",
    });

    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: snapshot({
          fragments: migrated.fragments,
          manifest: migrated.manifest.components,
          registryVersion: "2.1.0",
          registry: [
            registryComponent("color-picker", "1.2.0"),
            registryComponent("progress", "2.0.0"),
          ],
          starwindChangesets: migrated.starwindChangesets,
        }),
      }),
    ).toThrow(/requires an installable source change/i);

    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: snapshot({
          fragments: migrated.fragments,
          manifest: { "color-picker": "0.0.9", progress: "2.0.0" },
          registryVersion: "2.1.0",
          registry: [
            registryComponent("color-picker", "0.0.9", "changed color picker"),
            registryComponent("progress", "2.0.0"),
          ],
          starwindChangesets: migrated.starwindChangesets,
        }),
      }),
    ).toThrow(/must advance/i);
  });

  it("validates an exact generated Version Packages PR and rejects double bumps", () => {
    const base = snapshot({
      fragments: {
        "progress-a.json": { components: { progress: "patch" } },
        "progress-b.json": { components: { progress: "patch" } },
        "accordion.json": { components: { accordion: "minor" } },
      },
    });
    const head = snapshot({
      manifest: { accordion: "2.1.0", progress: "2.0.1" },
      registry: [registryComponent("accordion", "2.1.0"), registryComponent("progress", "2.0.1")],
    });

    expect(validateStyledVersionPullRequest({ base, head })).toMatchObject({
      mode: "version",
      versionedComponents: ["accordion", "progress"],
    });
    expect(() =>
      validateStyledVersionPullRequest({
        base,
        head: snapshot({
          manifest: { accordion: "2.1.0", progress: "2.0.2" },
          registry: [
            registryComponent("accordion", "2.1.0"),
            registryComponent("progress", "2.0.2"),
          ],
        }),
      }),
    ).toThrow(/expected progress@2\.0\.1/i);

    const dependencyOnlyHead = structuredClone(head);
    dependencyOnlyHead.registry.components[0]!.targets!.astro!.packageRequirements[0]!.range =
      "^0.1.0-beta.3";
    expect(validateStyledVersionPullRequest({ base, head: dependencyOnlyHead })).toMatchObject({
      mode: "version",
    });
  });

  it("versions a temporary manifest once, consumes fragments, and is idempotent", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "styled-component-release-"));
    temporaryRoots.push(root);
    const fragmentRoot = path.join(root, ".changeset/styled-components");
    const manifestPath = path.join(root, "packages/cli/registry/styled-component-versions.json");
    await mkdir(fragmentRoot, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(snapshot().manifest, null, 2)}\n`);
    await writeFile(
      path.join(fragmentRoot, "progress-a.json"),
      `${JSON.stringify({ components: { progress: "patch" } }, null, 2)}\n`,
    );
    await writeFile(
      path.join(fragmentRoot, "progress-b.json"),
      `${JSON.stringify({ components: { progress: "patch" } }, null, 2)}\n`,
    );

    expect(await stageStyledVersionIntents({ repoRoot: root })).toEqual({ staged: true });
    await expect(readFile(fragmentRoot, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      readFile(path.join(root, ".styled-component-intents/progress-a.json"), "utf8"),
    ).resolves.toContain('"progress"');
    expect(await versionStyledComponents({ repoRoot: root })).toMatchObject({
      versions: { progress: { from: "2.0.0", to: "2.0.1", bump: "patch" } },
    });
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toMatchObject({
      components: { accordion: "2.0.1", progress: "2.0.1" },
    });
    await expect(
      readFile(path.join(root, ".styled-component-intents/progress-a.json"), "utf8"),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(await versionStyledComponents({ repoRoot: root })).toMatchObject({ versions: {} });
  });

  it("materializes component versions into generated Astro and React registry artifacts", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "styled-component-registry-"));
    temporaryRoots.push(root);
    const fragmentRoot = path.join(root, ".changeset/styled-components");
    const manifestPath = path.join(root, "packages/cli/registry/styled-component-versions.json");
    const currentManifestPath = path.resolve(
      "packages/cli/registry/styled-component-versions.json",
    );
    const currentManifest = JSON.parse(await readFile(currentManifestPath, "utf8")) as {
      components: Record<string, string>;
    };
    await mkdir(fragmentRoot, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, await readFile(currentManifestPath, "utf8"));
    await writeFile(
      path.join(fragmentRoot, "accordion.json"),
      `${JSON.stringify({ components: { accordion: "patch" } }, null, 2)}\n`,
    );

    await versionStyledComponents({ repoRoot: root });
    const registry = await buildRuntimeRegistry({
      repoRoot: process.cwd(),
      tempRoot: path.join(root, "generated"),
      versionManifestPath: manifestPath,
    });
    const accordion = registry.components.find((component) => component.name === "accordion")!;

    expect(accordion.version).toBe(
      applyStyledVersionIntents(currentManifest.components, { accordion: "patch" }).accordion,
    );
    expect(Object.keys(accordion.targets ?? {}).sort()).toEqual(["astro", "react"]);
    expect(
      Object.values(accordion.targets ?? {}).flatMap((target) =>
        target.files.map((file) => file.content),
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining("not-last:border-b")]));
  });
});
