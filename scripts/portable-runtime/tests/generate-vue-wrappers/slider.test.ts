import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

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

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first)) {
      if (name === "index") continue;
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(first.root).toContain("defineModel<SliderValue>()");
    expect(first.root).toMatch(
      /emit\("valueChange", detail\.value, detail\);[\s\S]*detail\.isCanceled[\s\S]*modelValue\.value = detail\.value/,
    );
    expect(first.root).toContain('emit("valueCommitted", detail.value, detail)');
    expect(first.root).toMatch(
      /await nextTick\(\);[\s\S]*instance\.refresh\(\);[\s\S]*instance\.setValue\(value, \{ emit: false \}\)/,
    );
    expect(first.thumb).toContain("<input");
    expect(first.thumb).toContain("data-sw-slider-input");
    expect(first.index).toContain("SliderValueCommitDetails");
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
    return {
      control: await readFile(path.join(directory, "SliderControl.vue"), "utf8"),
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      indicator: await readFile(path.join(directory, "SliderIndicator.vue"), "utf8"),
      label: await readFile(path.join(directory, "SliderLabel.vue"), "utf8"),
      root: await readFile(path.join(directory, "SliderRoot.vue"), "utf8"),
      thumb: await readFile(path.join(directory, "SliderThumb.vue"), "utf8"),
      track: await readFile(path.join(directory, "SliderTrack.vue"), "utf8"),
    };
  }
});
