import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { vueFutureFrameworkTracer } from "../../renderers/framework-adapters/vue/future-framework-tracer.js";
import { vueStyledComponents } from "../../renderers/framework-adapters/vue/inventory.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const VUE_TSC_TIMEOUT_MS = 30_000;
const EXPECTED_MATERIALIZED_STYLED_COMPONENTS = [...vueStyledComponents].sort();

describe("Vue Primitive package generation", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-generator-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  it("emits only the root, Theme facade, and approved component entries", async () => {
    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot: tempRoot });
    const outputRoot = path.join(tempRoot, "generated");

    expect(await readdir(outputRoot)).toEqual([
      "accordion",
      "alert-dialog",
      "avatar",
      "button",
      "carousel",
      "checkbox",
      "checkbox-group",
      "collapsible",
      "color-picker",
      "combobox",
      "context-menu",
      "dialog",
      "drawer",
      "dropzone",
      "field",
      "fieldset",
      "form",
      "index.ts",
      "input",
      "input-otp",
      "menu",
      "navigation-menu",
      "popover",
      "preview-card",
      "progress",
      "radio",
      "radio-group",
      "scroll-area",
      "select",
      "sidebar",
      "slider",
      "switch",
      "tabs",
      "theme",
      "toast",
      "toggle",
      "toggle-group",
      "tooltip",
      "_internal",
    ]);
    const rootIndex = await readFile(path.join(outputRoot, "index.ts"), "utf8");
    expect(rootIndex).toContain('export * from "./accordion";');
    expect(rootIndex).toContain('export * from "./alert-dialog";');
    expect(rootIndex).toContain('export * from "./button";');
    expect(rootIndex).toContain('export * from "./avatar";');
    expect(rootIndex).toContain('export * from "./checkbox";');
    expect(rootIndex).toContain('export * from "./checkbox-group";');
    expect(rootIndex).toContain('export * from "./collapsible";');
    expect(rootIndex).toContain('export * from "./color-picker";');
    expect(rootIndex).toContain('export * from "./context-menu";');
    expect(rootIndex).toContain('export * from "./dialog";');
    expect(rootIndex).toContain('export * from "./field";');
    expect(rootIndex).toContain('export * from "./fieldset";');
    expect(rootIndex).toContain('export * from "./form";');
    expect(rootIndex).toContain('export * from "./input";');
    expect(rootIndex).toContain('export * from "./menu";');
    expect(rootIndex).toContain('export * from "./navigation-menu";');
    expect(rootIndex).toContain('export * from "./popover";');
    expect(rootIndex).toContain('export * from "./preview-card";');
    expect(rootIndex).toContain('export * from "./progress";');
    expect(rootIndex).toContain('export * from "./radio";');
    expect(rootIndex).toContain('export * from "./radio-group";');
    expect(rootIndex).toContain('export * from "./scroll-area";');
    expect(rootIndex).toContain('export * from "./slider";');
    expect(rootIndex).toContain('export * from "./select";');
    expect(rootIndex).toContain('export * from "./sidebar";');
    expect(rootIndex).toContain('export * from "./switch";');
    expect(rootIndex).toContain('export * from "./tabs";');
    expect(rootIndex).toContain('export * from "./theme";');
    expect(rootIndex).toContain('export * from "./toggle";');
    expect(rootIndex).toContain('export * from "./toggle-group";');
    expect(rootIndex).toContain('export * from "./tooltip";');
    const files = await readFiles(outputRoot);
    expect(files.some((file) => file.relativePath.includes("__future-fixtures"))).toBe(false);
    expect(files.filter((file) => file.relativePath.endsWith(".vue")).length).toBeGreaterThan(0);
    for (const file of files.filter((candidate) => candidate.relativePath.endsWith(".vue"))) {
      expect(() => assertVueSfcCompiles(file.contents, file.relativePath)).not.toThrow();
    }
  });

  it("generates the complete Primitive and Styled surfaces with identical paths and bytes in isolated roots", async () => {
    const firstRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-complete-first-"));
    const secondRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-complete-second-"));

    try {
      for (const root of [firstRoot, secondRoot]) {
        await generateVuePrimitiveWrappers({ outputDir: "primitive", repoRoot: root });
        const styledRoot = await generateSelectedVueStyledGroups({
          groups: vueStyledComponents,
          outputDir: "styled",
          repoRoot: root,
        });
        expect((await readdir(styledRoot)).sort()).toEqual(EXPECTED_MATERIALIZED_STYLED_COMPONENTS);
      }

      expect(await readFiles(firstRoot)).toEqual(await readFiles(secondRoot));
    } finally {
      await Promise.all(
        [firstRoot, secondRoot].map((root) => rm(root, { force: true, recursive: true })),
      );
    }
  });

  it("retains historical non-normative tracer artifacts outside production output", () => {
    expect(vueFutureFrameworkTracer.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ component: "menu/vue" }),
        expect.objectContaining({ component: "navigation-menu/vue" }),
        expect.objectContaining({ component: "combobox/vue" }),
      ]),
    );
  });

  it("generates selected Vue Styled groups with their composed dependency closure", async () => {
    const outputRoot = await generateSelectedVueStyledGroups({
      groups: ["alert-dialog"],
      outputDir: "styled",
      repoRoot: tempRoot,
    });

    expect((await readdir(outputRoot)).sort()).toEqual(["alert-dialog", "button"]);
    expect(await readdir(path.join(outputRoot, "button"))).toContain("Button.vue");
  });

  it("typechecks a selected composite Vue Styled mini-tree in isolation", async () => {
    const outputRoot = await generateSelectedVueStyledGroups({
      format: true,
      groups: ["alert-dialog"],
      outputDir: "styled",
      repoRoot: tempRoot,
    });

    await expectSelectedStyledMiniTreeTypechecks(tempRoot, outputRoot);
  });

  it("rejects an unknown Vue Styled group before generation", async () => {
    await expect(
      generateSelectedVueStyledGroups({
        groups: ["missing-styled-group"],
        outputDir: "styled",
        repoRoot: tempRoot,
      }),
    ).rejects.toThrow('Unknown Vue Styled group "missing-styled-group".');
  });
});

async function expectSelectedStyledMiniTreeTypechecks(
  root: string,
  outputRoot: string,
): Promise<void> {
  const fixturePath = path.join(root, "alert-dialog-action.fixture.vue");
  await writeFile(
    fixturePath,
    `<script setup lang="ts">
import { AlertDialogAction } from "./styled/alert-dialog";
</script>

<template>
  <AlertDialogAction>Delete</AlertDialogAction>
</template>
`,
    "utf8",
  );
  const workspaceRoot = process.cwd().split(path.sep).join("/");
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const tailwindVariants = path
    .join(
      path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
      "dist/index.d.ts",
    )
    .split(path.sep)
    .join("/");
  const configPath = path.join(root, "alert-dialog-action.tsconfig.json");
  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: workspaceRoot,
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          paths: {
            "@starwind-ui/runtime": ["packages/runtime/src/index.ts"],
            "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
            "@starwind-ui/vue": ["packages/vue/src/index.ts"],
            "@starwind-ui/vue/*": ["packages/vue/src/*/index.ts"],
            "tailwind-variants": [tailwindVariants],
            vue: ["node_modules/vue/dist/vue.d.mts"],
          },
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: [fixturePath.split(path.sep).join("/")],
        vueCompilerOptions: { dataAttributes: ["data-*"], strictTemplates: true },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const vueTsc = path.join(process.cwd(), "node_modules", "vue-tsc", "bin", "vue-tsc.js");
  const result = spawnSync(process.execPath, [vueTsc, "--noEmit", "-p", configPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: VUE_TSC_TIMEOUT_MS,
  });
  const diagnostics = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.error) {
    const reason = result.error.message.includes("ETIMEDOUT")
      ? `timed out after ${VUE_TSC_TIMEOUT_MS}ms`
      : "failed to execute";
    throw new Error(`Vue Styled mini-tree typecheck ${reason}: ${result.error.message}`, {
      cause: result.error,
    });
  }
  expect(result.status, diagnostics).toBe(0);
}

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
