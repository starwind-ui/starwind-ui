import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findMissingReleaseArtifacts } from "../check-release-artifacts.mjs";

describe("release artifact check", () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("reports missing entrypoints without rebuilding packages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-release-artifacts-"));
    tempRoots.push(root);

    for (const packageName of ["runtime", "react", "cli"]) {
      const packageRoot = path.join(root, "packages", packageName);
      await mkdir(packageRoot, { recursive: true });
      await writeFile(
        path.join(packageRoot, "package.json"),
        JSON.stringify({ main: "./dist/index.js", types: "./dist/index.d.ts" }),
      );
    }

    await mkdir(path.join(root, "packages/runtime/dist"), { recursive: true });
    await writeFile(path.join(root, "packages/runtime/dist/index.js"), "");
    await writeFile(path.join(root, "packages/runtime/dist/index.d.ts"), "");

    expect(findMissingReleaseArtifacts(root)).toEqual([
      "packages/cli/dist/index.d.ts",
      "packages/cli/dist/index.js",
      "packages/react/dist/index.d.ts",
      "packages/react/dist/index.js",
    ]);
  });
});
