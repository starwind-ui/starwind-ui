import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import "../styled-contracts/vue-styled-public-prop-facts.test.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const VUE_TSC_TIMEOUT_MS = 30_000;
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("source-owned Vue Styled public prop generation", () => {
  it("strictly types Item's dynamic tag and Video's iframe source document", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-public-prop-facts-"));
    temporaryRoots.push(root);
    const outputRoot = await generateSelectedVueStyledGroups({
      format: true,
      groups: ["item", "video"],
      outputDir: "styled",
      repoRoot: root,
    });
    const itemSource = await readFile(path.join(outputRoot, "item", "Item.vue"), "utf8");
    const videoSource = await readFile(path.join(outputRoot, "video", "Video.vue"), "utf8");

    expect(itemSource).toContain("as?: string;");
    expect(itemSource).toContain('as: Tag = "div"');
    expect(videoSource).toContain("srcdoc?: string;");
    expect(videoSource).toContain(':srcdoc="srcdoc"');

    const fixturePath = path.join(root, "public-prop-facts.fixture.vue");
    await writeFile(
      fixturePath,
      `<script setup lang="ts">
import { Item } from "./styled/item";
import { Video } from "./styled/video";
</script>

<template>
  <Item as="article">Article</Item>
  <Video src="https://www.youtube.com/watch?v=example" srcdoc="<p>Embedded video</p>" />
</template>
`,
      "utf8",
    );

    await expectVueTypecheck(root, [outputRoot, fixturePath]);
  });
});

async function expectVueTypecheck(root: string, includedPaths: readonly string[]): Promise<void> {
  const workspaceRoot = process.cwd().split(path.sep).join("/");
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const tailwindVariants = path
    .join(
      path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
      "dist/index.d.ts",
    )
    .split(path.sep)
    .join("/");
  const configPath = path.join(root, "tsconfig.json");

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
        include: includedPaths.flatMap((entry) => {
          const normalized = entry.split(path.sep).join("/");
          return path.extname(entry)
            ? [normalized]
            : [`${normalized}/**/*.ts`, `${normalized}/**/*.vue`];
        }),
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
  expect(result.error, diagnostics).toBeUndefined();
  expect(result.status, diagnostics).toBe(0);
}
