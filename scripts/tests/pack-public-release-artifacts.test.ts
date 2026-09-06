import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPackPlan, loadPublicReleaseArtifacts } from "../pack-public-release-artifacts.mjs";
import { releaseSourceFingerprint } from "../release-inputs.mjs";

describe("public release artifact packing", () => {
  it("rejects source edits, archive replacement, and forged packed metadata", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "release-pack-proof-"));
    try {
      execFileSync("git", ["init", "--quiet"], { cwd: root });
      await writeFile(path.join(root, ".gitignore"), "node_modules/\n");
      const outputDirectory = path.join(root, "node_modules/packs");
      const stage = path.join(root, "node_modules/stage/package");
      await mkdir(outputDirectory, { recursive: true });
      await mkdir(stage, { recursive: true });
      const packages: Record<
        string,
        {
          file: string;
          name: string;
          version: string;
          manifest: { name: string; version: string };
          sha256: string;
        }
      > = {};
      for (const { key, name, fileName } of createPackPlan({ outputDirectory, vueBeta: true })
        .packages) {
        const directory = path.join(root, "packages", key);
        await mkdir(directory, { recursive: true });
        const metadata = { name, version: key === "vue" ? "0.1.1" : "1.2.1" };
        await writeFile(path.join(directory, "package.json"), JSON.stringify(metadata));
        await writeFile(path.join(stage, "package.json"), JSON.stringify(metadata));
        const archive = path.join(outputDirectory, fileName);
        execFileSync("tar", ["-czf", archive, "-C", path.dirname(stage), "package"]);
        packages[key] = {
          file: fileName,
          ...metadata,
          manifest: metadata,
          sha256: createHash("sha256")
            .update(await readFile(archive))
            .digest("hex"),
        };
      }
      const entry = packages.vue;
      const metadata = entry.manifest;
      const archive = path.join(outputDirectory, entry.file);
      const bytes = await readFile(archive);
      const manifest = {
        schemaVersion: 2,
        sourceFingerprint: releaseSourceFingerprint(root),
        packages,
      };
      const save = () =>
        writeFile(path.join(outputDirectory, "manifest.json"), JSON.stringify(manifest));
      await save();
      await expect(
        loadPublicReleaseArtifacts({ outputDirectory, repoRoot: root }),
      ).resolves.toEqual(manifest);
      delete manifest.packages.vue;
      await save();
      await expect(
        loadPublicReleaseArtifacts({ outputDirectory, repoRoot: root, requireVue: true }),
      ).rejects.toThrow("inventory");
      manifest.packages.vue = entry;
      manifest.packages.extra = entry;
      await save();
      await expect(loadPublicReleaseArtifacts({ outputDirectory, repoRoot: root })).rejects.toThrow(
        "inventory",
      );
      delete manifest.packages.extra;
      await save();
      await writeFile(path.join(root, "new-release-input.js"), "export {};");
      await expect(loadPublicReleaseArtifacts({ outputDirectory, repoRoot: root })).rejects.toThrow(
        "sources or toolchain changed",
      );
      await rm(path.join(root, "new-release-input.js"));
      await writeFile(archive, "replaced");
      await expect(loadPublicReleaseArtifacts({ outputDirectory, repoRoot: root })).rejects.toThrow(
        "archive changed",
      );
      await writeFile(archive, bytes);
      entry.manifest = { ...metadata, version: "0.2.0" };
      await save();
      await expect(loadPublicReleaseArtifacts({ outputDirectory, repoRoot: root })).rejects.toThrow(
        "Packed metadata changed",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it("keeps the stable pack plan and selects Vue only for the beta plan", () => {
    const outputDirectory = path.resolve(".release-packs-test");
    expect(createPackPlan({ outputDirectory }).packages.map(({ key }) => key)).toEqual([
      "runtime",
      "astro",
      "react",
      "cli",
    ]);
    const plan = createPackPlan({ outputDirectory, vueBeta: true });
    expect(plan.packages.map(({ key, name }) => ({ key, name }))).toEqual([
      { key: "runtime", name: "@starwind-ui/runtime" },
      { key: "astro", name: "@starwind-ui/astro" },
      { key: "react", name: "@starwind-ui/react" },
      { key: "vue", name: "@starwind-ui/vue" },
      { key: "cli", name: "starwind" },
    ]);
    expect(plan.packages.find(({ key }) => key === "vue")?.file).toBe(
      path.join(outputDirectory, "starwind-vue.tgz"),
    );
  });
});
