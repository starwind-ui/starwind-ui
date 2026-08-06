import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import "../styled-contracts/vue-portable-styled-foundation.test.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const FOUNDATIONAL_GROUPS = [
  "alert",
  "aspect-ratio",
  "badge",
  "kbd",
  "label",
  "separator",
  "skeleton",
  "spinner",
] as const;

const EXPECTED_COMPONENT_FILES = {
  alert: ["Alert.vue", "AlertDescription.vue", "AlertTitle.vue"],
  "aspect-ratio": ["AspectRatio.vue"],
  badge: ["Badge.vue"],
  kbd: ["Kbd.vue", "KbdGroup.vue"],
  label: ["Label.vue"],
  separator: ["Separator.vue"],
  skeleton: ["Skeleton.vue"],
  spinner: ["Spinner.vue"],
} as const;

const EXPECTED_NATIVE_REFS = [
  { file: "Alert.vue", group: "alert", targetType: "HTMLDivElement" },
  { file: "AlertDescription.vue", group: "alert", targetType: "HTMLParagraphElement" },
  { file: "AlertTitle.vue", group: "alert", targetType: "HTMLHeadingElement" },
  { file: "Kbd.vue", group: "kbd", targetType: "HTMLElement" },
  { file: "KbdGroup.vue", group: "kbd", targetType: "HTMLElement" },
  { file: "Label.vue", group: "label", targetType: "HTMLLabelElement" },
  { file: "Separator.vue", group: "separator", targetType: "HTMLDivElement" },
  { file: "Skeleton.vue", group: "skeleton", targetType: "HTMLDivElement" },
] as const;

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("Vue portable foundational Styled generation", () => {
  it("generates compiler-valid SFC groups in a temporary root", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-foundation-"));
    temporaryRoots.push(repoRoot);
    const outputRoot = await generateSelectedVueStyledGroups({
      groups: FOUNDATIONAL_GROUPS,
      outputDir: "styled",
      repoRoot,
    });

    expect((await readdir(outputRoot)).sort()).toEqual([...FOUNDATIONAL_GROUPS].sort());

    for (const [group, componentFiles] of Object.entries(EXPECTED_COMPONENT_FILES)) {
      expect((await readdir(path.join(outputRoot, group))).sort()).toEqual(
        [...componentFiles, "index.ts", "variants.ts"].sort(),
      );
      for (const file of componentFiles) {
        const source = await readFile(path.join(outputRoot, group, file), "utf8");
        expect(() => assertVueSfcCompiles(source, `${group}/${file}`)).not.toThrow();
        expect(source).toContain('<script setup lang="ts">');
        expect(source).toContain("data-slot");
      }
    }
    const read = (group: string, file: string) =>
      readFile(path.join(outputRoot, group, file), "utf8");

    await expect(read("alert", "Alert.vue")).resolves.toMatch(
      /role=.+inferredRole[\s\S]+<slot \/>/,
    );
    await expect(read("alert", "Alert.vue")).resolves.toMatch(
      /error[\s\S]+warning[\s\S]+alert[\s\S]+status/,
    );
    await expect(read("aspect-ratio", "AspectRatio.vue")).resolves.toMatch(
      /paddingBottom[\s\S]+<component/,
    );
    await expect(read("badge", "Badge.vue")).resolves.toMatch(
      /attrs\.href[\s\S]+<component[\s\S]+badge\(/,
    );
    await expect(read("kbd", "Kbd.vue")).resolves.toContain("<kbd");
    await expect(read("label", "Label.vue")).resolves.toMatch(/<label[\s\S]+<slot \/>/);
    await expect(read("separator", "Separator.vue")).resolves.toMatch(
      /role=\"separator\"[\s\S]+aria-orientation/,
    );
    await expect(read("spinner", "Spinner.vue")).resolves.toMatch(
      /<svg[\s\S]+aria-label=\"Loading\"/,
    );

    for (const { file, group, targetType } of EXPECTED_NATIVE_REFS) {
      const source = await read(group, file);
      expect(source).toContain(`const element = ref<${targetType} | null>(null);`);
      expect(source).toContain("defineExpose({ element });");
      expect(source).toContain('ref="element"');
    }
  });
});
