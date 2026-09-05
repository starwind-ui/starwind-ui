import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  findMissingReleaseArtifacts,
  findStaleVueBetaReleaseArtifacts,
  recordVueBetaArtifactFingerprint,
} from "../check-release-artifacts.mjs";

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

  it("checks Vue and CLI for the independent beta plan", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-beta-artifacts-"));
    tempRoots.push(root);
    for (const packageName of ["vue", "cli"]) {
      const packageRoot = path.join(root, "packages", packageName);
      await mkdir(packageRoot, { recursive: true });
      await writeFile(
        path.join(packageRoot, "package.json"),
        JSON.stringify({ main: "./dist/index.js", types: "./dist/index.d.ts" }),
      );
    }
    await writeFile(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: {} }));
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    await writeFile(path.join(root, "packages/vue/tsconfig.json"), "{}\n");
    await writeFile(path.join(root, "packages/vue/tsconfig.build.json"), "{}\n");
    await writeFile(path.join(root, "packages/vue/tsup.config.ts"), "export default {};\n");
    await writeFile(path.join(root, "packages/cli/tsconfig.json"), "{}\n");
    await writeFile(path.join(root, "packages/cli/tsup.config.ts"), "export default {};\n");
    expect(findMissingReleaseArtifacts(root, { vueBeta: true })).toEqual([
      "packages/cli/dist/index.d.ts",
      "packages/cli/dist/index.js",
      "packages/vue/dist/index.d.ts",
      "packages/vue/dist/index.js",
    ]);
  });

  it("rejects Vue beta output after source, version, or dist content changes", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-beta-freshness-"));
    tempRoots.push(root);
    for (const packageName of ["vue", "cli"]) {
      const packageRoot = path.join(root, "packages", packageName);
      await mkdir(path.join(packageRoot, "src"), { recursive: true });
      await mkdir(path.join(packageRoot, "dist"), { recursive: true });
      await writeFile(
        path.join(packageRoot, "package.json"),
        JSON.stringify({ main: "./dist/index.js", types: "./dist/index.d.ts", version: "1.0.0" }),
      );
      await writeFile(
        path.join(packageRoot, "src/index.ts"),
        `export const value = "${packageName}";`,
      );
      await writeFile(
        path.join(packageRoot, "dist/index.js"),
        `export const value = "${packageName}";`,
      );
      await writeFile(
        path.join(packageRoot, "dist/index.d.ts"),
        "export declare const value: string;",
      );
    }

    recordVueBetaArtifactFingerprint(root);
    expect(findStaleVueBetaReleaseArtifacts(root)).toEqual([]);

    await writeFile(
      path.join(root, "packages/vue/src/index.ts"),
      "export const value = 'changed';",
    );
    expect(findStaleVueBetaReleaseArtifacts(root)).toContain("source inputs");
    recordVueBetaArtifactFingerprint(root);

    const manifestFile = path.join(root, "packages/cli/package.json");
    const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
    manifest.version = "1.1.0";
    await writeFile(manifestFile, JSON.stringify(manifest));
    expect(findStaleVueBetaReleaseArtifacts(root)).toContain("source inputs");
    recordVueBetaArtifactFingerprint(root);

    await writeFile(
      path.join(root, "packages/vue/tsup.config.ts"),
      "export default { minify: true };\n",
    );
    expect(findStaleVueBetaReleaseArtifacts(root)).toContain("source inputs");
    recordVueBetaArtifactFingerprint(root);

    await writeFile(
      path.join(root, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ESNext" } }),
    );
    expect(findStaleVueBetaReleaseArtifacts(root)).toContain("source inputs");
    recordVueBetaArtifactFingerprint(root);

    await writeFile(path.join(root, "packages/cli/dist/index.js"), "export const stale = true;");
    expect(findStaleVueBetaReleaseArtifacts(root)).toContain("built outputs");
  });
});
