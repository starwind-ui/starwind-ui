import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { renderSvelteStyledFiles } from "../renderers/framework-adapters/svelte/styled/render.js";
import type { SvelteStyledGroupProjection } from "../renderers/framework-adapters/svelte/styled/types.js";
import { generateFrameworkStyledWrappers } from "../renderers/framework-wrapper-generator.js";
import { projectStyledOutputComponentGroup } from "../renderers/styled-output-model/index.js";
import { TYPE_PARAMETERS_FIXTURE } from "./styled-contracts/styled-type-parameters.test.js";

const CHECK_TIMEOUT_MS = 60_000;

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

function runChecker(args: string[]): { output: string; status: number | null } {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: CHECK_TIMEOUT_MS,
  });
  expect(result.error).toBeUndefined();
  return { output: `${result.stdout ?? ""}${result.stderr ?? ""}`, status: result.status };
}

describe("Styled type parameters with real type checkers", () => {
  it(
    "infers Svelte props from the type parameters and rejects a wrong key",
    async () => {
      // svelte-check must resolve svelte from the workspace, so the root lives in it.
      const root = await mkdtemp(path.join(process.cwd(), ".svelte-type-parameters-"));
      roots.push(root);
      const typeParameters = TYPE_PARAMETERS_FIXTURE.components[0].typeParameters;
      // No Svelte family projection passes a contract field typed `T` today, so the fixture is a
      // projection. It checks what render.ts prints for a projection that uses the parameters.
      const projection: SvelteStyledGroupProjection = {
        group: projectStyledOutputComponentGroup(TYPE_PARAMETERS_FIXTURE),
        variantAliases: [],
        components: [
          {
            exportName: "TypedList",
            fileName: "TypedList.svelte",
            imports: [{ source: "svelte/elements", names: ["SvelteHTMLElements"], typeOnly: true }],
            publicTypes:
              'export type TypedListProps = Omit<SvelteHTMLElements["div"], "children"> & { items: T[]; labelKey?: K };',
            destructure: [{ name: "items" }, { name: "labelKey" }],
            rest: "rest",
            setup: [],
            typeParameters: typeParameters!,
            variables: [],
            render: [
              {
                type: "element",
                name: "div",
                attrs: [
                  { name: "spread", value: { type: "variable", name: "rest" } },
                  { name: "data-count", value: { type: "raw", code: "items.length" } },
                  { name: "data-label-key", value: { type: "raw", code: "String(labelKey)" } },
                ],
                children: [],
                selfClosing: false,
              },
            ],
          },
          {
            exportName: "PlainItem",
            fileName: "PlainItem.svelte",
            imports: [{ source: "svelte/elements", names: ["SvelteHTMLElements"], typeOnly: true }],
            publicTypes: 'export type PlainItemProps = SvelteHTMLElements["div"];',
            destructure: [{ name: "children" }],
            rest: "rest",
            setup: [],
            variables: [],
            render: [
              {
                type: "element",
                name: "div",
                attrs: [{ name: "spread", value: { type: "variable", name: "rest" } }],
                children: [{ type: "snippet", name: "children", fallback: [] }],
                selfClosing: false,
              },
            ],
          },
        ],
      };
      for (const file of renderSvelteStyledFiles(projection)) {
        await mkdir(path.join(root, path.dirname(file.relativePath)), { recursive: true });
        await writeFile(path.join(root, file.relativePath), file.content);
      }
      const component = "./type-parameters-fixture/TypedList.svelte";
      await writeFile(
        path.join(root, "Usage.svelte"),
        `<script lang="ts">\n  import TypedList from "${component}";\n</script>\n\n<TypedList items={[{ name: "a", count: 1 }]} labelKey="count" />\n`,
      );
      await writeFile(
        path.join(root, "WrongKey.svelte"),
        `<script lang="ts">\n  import TypedList from "${component}";\n</script>\n\n<TypedList items={[{ name: "a" }]} labelKey="missing" />\n`,
      );
      await writeFile(
        path.join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            lib: ["DOM", "ES2022"],
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
            skipLibCheck: true,
            strict: true,
            target: "ES2022",
            verbatimModuleSyntax: true,
          },
          include: ["**/*.ts", "**/*.svelte"],
        }),
      );

      const { output } = runChecker([
        path.join(process.cwd(), "node_modules/svelte-check/bin/svelte-check"),
        "--workspace",
        root,
        "--tsconfig",
        path.join(root, "tsconfig.json"),
        "--output",
        "machine",
      ]);
      const errors = output.split("\n").filter((line) => / ERROR /.test(line));
      const warnings = output.split("\n").filter((line) => / WARNING /.test(line));

      expect(warnings, output).toEqual([]);

      expect(errors, output).toHaveLength(1);
      expect(errors[0]).toContain('"WrongKey.svelte"');
      expect(errors[0]).toContain(`Type '\\"missing\\"' is not assignable to type '\\"name\\"'`);
    },
    CHECK_TIMEOUT_MS,
  );

  it(
    "infers Vue props from the generic script setup and rejects a wrong key",
    async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-type-parameters-"));
      roots.push(root);
      const outputRoot = path.join(root, "styled");
      await generateFrameworkStyledWrappers("vue", {
        contracts: [TYPE_PARAMETERS_FIXTURE],
        generatedBy: "styled-type-parameters-typecheck.test.ts",
        outputRoot,
        primitiveOutputRoot: path.join(root, "primitives"),
        roots: [TYPE_PARAMETERS_FIXTURE.component],
      });
      const componentRoot = path.join(outputRoot, TYPE_PARAMETERS_FIXTURE.component);
      await writeFile(
        path.join(root, "Usage.vue"),
        `<script setup lang="ts">
import { TypedList } from "./styled/${TYPE_PARAMETERS_FIXTURE.component}/index";
</script>

<template>
  <TypedList :items="[{ name: 'a', count: 1 }]" label-key="count" />
  <!-- @vue-expect-error labelKey must name a key of the item type -->
  <TypedList :items="[{ name: 'a' }]" label-key="missing" />
</template>
`,
      );
      await writeFile(
        path.join(root, "types.ts"),
        `import type { TypedListProps } from "./styled/${TYPE_PARAMETERS_FIXTURE.component}/index";

export const props: TypedListProps<{ name: string }> = { items: [{ name: "a" }], labelKey: "name" };
// @ts-expect-error labelKey must name a key of the item type
export const wrong: TypedListProps<{ name: string }> = { items: [{ name: "a" }], labelKey: "x" };
`,
      );
      const workspaceRoot = process.cwd().split(path.sep).join("/");
      await writeFile(
        path.join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            baseUrl: workspaceRoot,
            lib: ["DOM", "DOM.Iterable", "ES2022"],
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
            paths: { vue: ["node_modules/vue/dist/vue.d.mts"] },
            skipLibCheck: true,
            strict: true,
            target: "ES2022",
          },
          include: [
            path.join(root, "Usage.vue"),
            path.join(root, "types.ts"),
            path.join(componentRoot, "*.vue"),
            path.join(componentRoot, "*.ts"),
          ].map((file) => file.split(path.sep).join("/")),
          vueCompilerOptions: { strictTemplates: true },
        }),
      );

      const { output, status } = runChecker([
        path.join(process.cwd(), "node_modules/vue-tsc/bin/vue-tsc.js"),
        "--noEmit",
        "-p",
        path.join(root, "tsconfig.json"),
      ]);

      expect(status, output).toBe(0);
    },
    CHECK_TIMEOUT_MS,
  );
});
