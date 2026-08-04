import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";

import { formatGeneratedOutput } from "../../format-generated-output.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Slider", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic range-control Primitive output", async () => {
    const first = await generateSlider();
    const second = await generateSlider();
    const committed = await readGeneratedDirectory(
      path.join(process.cwd(), "packages/vue/src/slider"),
    );

    expect(first).toEqual(second);
    expect(first).toEqual(committed);
    for (const [name, source] of Object.entries(first)) {
      if (!name.endsWith(".vue")) continue;
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
    expect(first["SliderRoot.vue"]).toContain("defineModel<SliderValue>()");
    expect(first["SliderRoot.vue"]).toMatch(
      /emit\("valueChange", detail\.value, detail\);[\s\S]*detail\.isCanceled[\s\S]*modelValue\.value = detail\.value/,
    );
    expect(first["SliderRoot.vue"]).toContain('emit("valueCommitted", detail.value, detail)');
    expect(first["SliderRoot.vue"]).toContain(
      'createdInstance.subscribe("stateSync", handleStateSync)',
    );
    expect(first["SliderRoot.vue"]).toMatch(
      /function handleStateSync\(\): void \{[\s\S]*if \(controlled \|\| !instance\) return;[\s\S]*instance\.getValue\(\)[\s\S]*valuesEqual\(uncontrolledValue\.value, nextValue\)[\s\S]*uncontrolledValue\.value = nextValue;[\s\S]*modelValue\.value = nextValue;/,
    );
    expect(first["SliderRoot.vue"]).toMatch(
      /unsubscribeStateSync\?\.\(\);[\s\S]*instance\?\.destroy\(\)/,
    );
    expect(first["SliderRoot.vue"]).toMatch(
      /await nextTick\(\);[\s\S]*instance\.refresh\(\);[\s\S]*instance\.setValue\(value, \{ emit: false \}\)/,
    );
    expect(first["SliderThumb.vue"]).toContain("<input");
    expect(first["SliderThumb.vue"]).toContain("data-sw-slider-input");
    expect(first["index.ts"]).toContain("SliderValueCommitDetails");
  });

  it("generates Styled Slider with model, events, geometry, and canonical slots", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-slider-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["slider"], outputDir: "styled", repoRoot });

    const source = await readFile(path.join(repoRoot, "styled/slider/Slider.vue"), "utf8");
    expect(source).toContain(':model-value="modelValue"');
    expect(source).toContain('@update:model-value="emit(&quot;update:modelValue&quot;, $event)"');
    expect(source).toContain('@value-change="handleValueChange"');
    expect(source).toContain('@value-committed="handleValueCommitted"');
    expect(source).toContain('data-slot="slider-range"');
    expect(source).toContain('data-slot="slider-thumb"');
    expect(source).toContain(':key="index"');
    expect(() => assertVueSfcCompiles(source, "Slider.vue")).not.toThrow();
  });

  async function generateSlider(): Promise<Record<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-slider-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "slider");
    if (!entry) throw new Error("Slider Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "slider");
    await formatGeneratedOutput([directory], process.cwd());
    return readGeneratedDirectory(directory, true);
  }
});

async function readGeneratedDirectory(
  directory: string,
  formatSources = false,
): Promise<Record<string, string>> {
  const names = (await readdir(directory)).sort();
  const prettierConfig = formatSources
    ? ((await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {})
    : {};
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => {
        const file = path.join(directory, name);
        const source = await readFile(file, "utf8");
        return [
          name,
          formatSources && name.endsWith(".ts")
            ? await format(source, { ...prettierConfig, filepath: file })
            : source,
        ] as const;
      }),
    ),
  );
}
