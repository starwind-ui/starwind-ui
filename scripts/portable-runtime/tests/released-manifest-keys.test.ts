import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";
import { readReleasedManifestKeys } from "../release-intent-utils.js";

const run = promisify(execFile);
const MANIFEST = "packages/cli/registry/styled-component-versions.json";
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

async function repo(): Promise<{ root: string; commit: (message: string) => Promise<void> }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-released-keys-"));
  roots.push(root);
  await run("git", ["init", "-q", "-b", "main"], { cwd: root });
  await mkdir(path.join(root, "packages/cli/registry"), { recursive: true });
  return {
    root,
    commit: async (message) => {
      await run("git", ["add", "-A"], { cwd: root });
      await run(
        "git",
        [
          "-c",
          "user.name=test",
          "-c",
          "user.email=test@example.com",
          "commit",
          "-q",
          "-m",
          message,
        ],
        { cwd: root },
      );
    },
  };
}

async function write(root: string, file: string, value: unknown): Promise<void> {
  await writeFile(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
}

describe("readReleasedManifestKeys", () => {
  it("reads the manifest of the last commit that changed the CLI version", async () => {
    const { root, commit } = await repo();
    await write(root, "packages/cli/package.json", { name: "starwind", version: "3.6.0" });
    await write(root, MANIFEST, { components: { accordion: "2.0.0" } });
    await commit("release 3.6.0");
    await write(root, MANIFEST, { components: { accordion: "2.0.0", chart: "1.0.0" } });
    await write(root, "packages/cli/package.json", {
      name: "starwind",
      version: "3.6.0",
      dependencies: { semver: "^7.0.0" },
    });
    await commit("add chart");

    const keys = await readReleasedManifestKeys({
      repoRoot: root,
      ref: "HEAD",
      manifestPath: MANIFEST,
      key: "components",
    });
    expect(keys && [...keys]).toEqual(["accordion"]);

    await write(root, "packages/cli/package.json", { name: "starwind", version: "3.7.0" });
    await commit("release 3.7.0");
    const afterRelease = await readReleasedManifestKeys({
      repoRoot: root,
      ref: "HEAD",
      manifestPath: MANIFEST,
      key: "components",
    });
    expect(afterRelease && [...afterRelease].sort()).toEqual(["accordion", "chart"]);
  });

  it("returns undefined when the history has no CLI release", async () => {
    const { root, commit } = await repo();
    await write(root, MANIFEST, { components: { accordion: "2.0.0" } });
    await commit("no cli package");
    await expect(
      readReleasedManifestKeys({
        repoRoot: root,
        ref: "HEAD",
        manifestPath: MANIFEST,
        key: "components",
      }),
    ).resolves.toBeUndefined();
  });

  it("returns undefined when the release commit has no manifest", async () => {
    const { root, commit } = await repo();
    await write(root, "packages/cli/package.json", { name: "starwind", version: "3.6.0" });
    await commit("release without manifest");
    await expect(
      readReleasedManifestKeys({
        repoRoot: root,
        ref: "HEAD",
        manifestPath: MANIFEST,
        key: "components",
      }),
    ).resolves.toBeUndefined();
  });
});
