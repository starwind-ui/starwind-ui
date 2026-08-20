import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  formatPackageCategories,
  measurePublishedPackagePayload,
  measureStyledCopiedSourcePayload,
} from "../package-size-payloads.mjs";
import {
  starwindVueStyledComponents,
  starwindVueStyledExclusions,
} from "../package-size-vue-plan.mjs";

describe("published package payloads", () => {
  it("measures the exact packed file list with run-local npm state and separate declarations", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "package-size-payload-test-"));
    const packageDirectory = path.join(root, "package");
    const npmCache = path.join(root, "npm-cache");
    const packDestination = path.join(root, "pack-output");
    mkdirSync(path.join(packageDirectory, "dist"), { recursive: true });
    mkdirSync(npmCache);
    mkdirSync(packDestination);
    writeFileSync(path.join(packageDirectory, "package.json"), '{"name":"fixture"}\n');
    writeFileSync(path.join(packageDirectory, "dist", "index.js"), "export const value = 1;\n");
    writeFileSync(
      path.join(packageDirectory, "dist", "index.d.ts"),
      "export declare const value: 1;\n",
    );
    writeFileSync(path.join(packageDirectory, "dist", "extra.d.ts"), "x");
    writeFileSync(path.join(packageDirectory, "dist", "index.d.ts.map"), "{}\n");
    writeFileSync(path.join(packageDirectory, "dist", "index.js.map"), "{}\n");
    const calls = [];

    try {
      const payload = await measurePublishedPackagePayload({
        minifyJavaScript: async (source) => source.replaceAll(/\s+/g, ""),
        npmCache,
        packageDirectory,
        packDestination,
        runNpm(args, options) {
          calls.push({ args, options });
          return JSON.stringify([
            {
              files: [
                { path: "dist/extra.d.ts", size: 1 },
                { path: "dist/index.d.ts", size: 31 },
                { path: "dist/index.d.ts.map", size: 3 },
                { path: "dist/index.js", size: 24 },
                { path: "dist/index.js.map", size: 3 },
                { path: "package.json", size: 19 },
              ],
              size: 101,
              unpackedSize: 81,
              version: "0.0.0",
            },
          ]);
        },
      });

      expect(calls).toEqual([
        {
          args: ["pack", "--json", "--ignore-scripts", "--pack-destination", packDestination],
          options: expect.objectContaining({
            cwd: packageDirectory,
            env: expect.objectContaining({ npm_config_cache: npmCache }),
            encoding: "utf8",
          }),
        },
      ]);
      expect(payload.files).toEqual([
        { path: "dist/extra.d.ts", size: 1 },
        { path: "dist/index.d.ts", size: 31 },
        { path: "dist/index.d.ts.map", size: 3 },
        { path: "dist/index.js", size: 24 },
        { path: "dist/index.js.map", size: 3 },
        { path: "package.json", size: 19 },
      ]);
      expect(payload).toMatchObject({
        declarationBytes: 32,
        declarationFileCount: 2,
        packageGzipBytes: 101,
        packageUnpackedBytes: 81,
        runtimeFileCount: 1,
        runtimeMinifiedBytes: 19,
        version: "0.0.0",
      });
      expect(formatPackageCategories(payload.categories)).toEqual([
        { bytes: 24, fileCount: 1, label: "Runtime-bearing code" },
        { bytes: 32, fileCount: 2, label: "Declarations" },
        { bytes: 3, fileCount: 1, label: "Declaration maps" },
        { bytes: 3, fileCount: 1, label: "Source maps" },
        { bytes: 19, fileCount: 1, label: "Package metadata" },
        { bytes: 0, fileCount: 0, label: "Other" },
      ]);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("rejects a packed path that escapes the measured package", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "package-size-payload-escape-test-"));
    const packageDirectory = path.join(root, "package");
    const npmCache = path.join(root, "npm-cache");
    const packDestination = path.join(root, "pack-output");
    mkdirSync(packageDirectory);
    mkdirSync(npmCache);
    mkdirSync(packDestination);

    try {
      await expect(
        measurePublishedPackagePayload({
          minifyJavaScript: async (source) => source,
          npmCache,
          packageDirectory,
          packDestination,
          runNpm: () =>
            JSON.stringify([
              {
                files: [{ path: "../outside.js", size: 1 }],
                size: 1,
                unpackedSize: 1,
                version: "0",
              },
            ]),
        }),
      ).rejects.toThrow("file path must stay inside its approved root");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});

describe("Vue Styled copied-source payloads", () => {
  it("measures the generated tree from the reviewed Vue inventory", () => {
    const rootDirectory = path.resolve(
      import.meta.dirname,
      "../../../apps/vue-demo/src/components/starwind-runtime",
    );
    const payload = measureStyledCopiedSourcePayload({
      rootDirectory,
      roots: starwindVueStyledComponents,
    });

    expect(payload.rootCount).toBe(54);
    expect(payload.roots).toEqual([...starwindVueStyledComponents]);
    expect(starwindVueStyledExclusions).toEqual([
      { component: "image", reason: "Astro-only Styled contract" },
    ]);
  });

  it("requires the authoritative 54 roots and keeps the Image exclusion outside the payload", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "vue-styled-payload-test-"));
    const roots = Array.from(
      { length: 54 },
      (_, index) => `component-${String(index).padStart(2, "0")}`,
    );
    for (const component of roots) {
      const directory = path.join(root, component);
      mkdirSync(directory);
      writeFileSync(path.join(directory, "Component.vue"), "<template><div /></template>\n");
      writeFileSync(path.join(directory, "variants.ts"), "export const variant = {};\n");
      writeFileSync(path.join(directory, "types.ts"), "x");
    }

    try {
      const payload = measureStyledCopiedSourcePayload({ rootDirectory: root, roots });
      expect(payload.rootCount).toBe(54);
      expect(payload.roots).toEqual(roots);
      expect(payload.files).toHaveLength(162);
      expect(payload.codeFileCount).toBe(108);
      expect(payload.typeSourceFileCount).toBe(54);
      expect(payload.typeSourceBytes).toBe(54);
      expect(payload.aggregateBytes).toBe(
        payload.files.reduce((total, file) => total + file.size, 0),
      );
      expect(payload.codeBytes + payload.typeSourceBytes).toBe(payload.aggregateBytes);
      expect(payload.roots).not.toContain("image");
      expect(payload.aggregateGzipBytes).toBeGreaterThan(0);
      expect(() =>
        measureStyledCopiedSourcePayload({ rootDirectory: root, roots: [...roots, "image"] }),
      ).toThrow("Styled copied-source roots differ");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
