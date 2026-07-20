import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { vueFutureFrameworkTracer } from "../../renderers/framework-adapters/vue/future-framework-tracer.js";

describe("Vue Primitive package generation", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-generator-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  it("emits only the root, Theme facade, and six approved component entries", async () => {
    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot: tempRoot });
    const outputRoot = path.join(tempRoot, "generated");

    expect(await readdir(outputRoot)).toEqual([
      "avatar",
      "button",
      "checkbox",
      "index.ts",
      "progress",
      "scroll-area",
      "select",
      "theme",
    ]);
    const rootIndex = await readFile(path.join(outputRoot, "index.ts"), "utf8");
    expect(rootIndex).toContain('export * from "./button";');
    expect(rootIndex).toContain('export * from "./avatar";');
    expect(rootIndex).toContain('export * from "./checkbox";');
    expect(rootIndex).toContain('export * from "./progress";');
    expect(rootIndex).toContain('export * from "./scroll-area";');
    expect(rootIndex).toContain('export * from "./select";');
    expect(rootIndex).toContain('export * from "./theme";');
    expect(rootIndex).not.toContain("dialog");

    const files = await readFiles(outputRoot);
    expect(files.some((file) => file.relativePath.includes("__future-fixtures"))).toBe(false);
    expect(files.filter((file) => file.relativePath.endsWith(".vue")).length).toBeGreaterThan(0);
    for (const file of files.filter((candidate) => candidate.relativePath.endsWith(".vue"))) {
      expect(() => assertVueSfcCompiles(file.contents, file.relativePath)).not.toThrow();
    }
  });

  it("generates identical paths and bytes in separate roots", async () => {
    await generateVuePrimitiveWrappers({ outputDir: "first", repoRoot: tempRoot });
    await generateVuePrimitiveWrappers({ outputDir: "second", repoRoot: tempRoot });

    expect(await readFiles(path.join(tempRoot, "first"))).toEqual(
      await readFiles(path.join(tempRoot, "second")),
    );
  });

  it("retains non-shipping tracer evidence for unsupported Vue components", () => {
    expect(vueFutureFrameworkTracer.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ component: "menu/vue" }),
        expect.objectContaining({ component: "navigation-menu/vue" }),
        expect.objectContaining({ component: "combobox/vue" }),
      ]),
    );
  });
});

async function readFiles(
  directory: string,
  root: string = directory,
): Promise<Array<{ contents: string; relativePath: string }>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return readFiles(entryPath, root);
      return [
        {
          contents: await readFile(entryPath, "utf8"),
          relativePath: path.relative(root, entryPath).split(path.sep).join("/"),
        },
      ];
    }),
  );
  return files.flat().sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
