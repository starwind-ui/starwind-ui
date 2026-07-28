import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { switchRuntimeAdapterContract } from "../../contracts/primitive/components/switch.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Switch Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Switch through structured boolean form-control facts", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(switchRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              facts: expect.objectContaining({
                behavior: expect.objectContaining({ inputPlacement: "external" }),
              }),
              kind: "boolean-form-control",
              part: "root",
            }),
          }),
        }),
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              kind: "boolean-form-control",
              part: "state-indicator",
            }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic, compiler-valid, checked-in Switch output", async () => {
    const first = await generateSwitch();
    const second = await generateSwitch();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "SwitchRoot.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(first.thumb, "SwitchThumb.vue")).not.toThrow();
    expect(first.root).toMatch(
      /emit\("checkedChange", checked, detail\);[\s\S]*if \(detail\.isCanceled\) return;[\s\S]*emit\("update:checked", checked\);/,
    );
    expect(first.root).toContain("Object.is(instance.getChecked(), checked)");
    expect(first.root).toContain("instance.setChecked(checked, { emit: false });");
    expect(first.root).toContain("instance.setFormOptions({");
    expect(first.root).toContain("data-sw-switch-input");
    expect(first.root).toContain("data-sw-switch-unchecked-input");
    expect(first.root).toContain("onMounted(setupRuntime);");
    expect(first.root).toContain("onBeforeUnmount(destroyOwnedInstance);");
    expect(first.thumb).toContain("data-sw-switch-thumb");
    expect(first.index).toContain('export { default as SwitchRoot } from "./SwitchRoot.vue";');
    expect(first.index).toContain('export { default as SwitchThumb } from "./SwitchThumb.vue";');

    await expect(first.root).toBe(
      await readFile(path.join(process.cwd(), "packages/vue/src/switch/SwitchRoot.vue"), "utf8"),
    );
    await expect(first.thumb).toBe(
      await readFile(path.join(process.cwd(), "packages/vue/src/switch/SwitchThumb.vue"), "utf8"),
    );
  });

  it("retains canonical Styled style and label bindings in Vue syntax", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-switch-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["switch"], outputDir: "styled", repoRoot });
    const styled = await readFile(path.join(repoRoot, "styled/switch/Switch.vue"), "utf8");

    expect(() => assertVueSfcCompiles(styled, "Switch.vue")).not.toThrow();
    expect(styled).toContain(':style="switchStyle"');
    expect(styled).toContain(':style="thumbStyle"');
    expect(styled).toContain(':for="id"');
    expect(styled).toContain("type ButtonHTMLAttributes");
    expect(styled).toContain(`v-bind="{ ...attrs, 'aria-label': ariaLabel }"`);
    expect(styled).not.toContain(':aria-label="ariaLabel"');
    expect(styled.match(/\bswitchStyle\b/g)).toHaveLength(2);
    expect(styled.match(/\bthumbStyle\b/g)).toHaveLength(2);
  });

  async function generateSwitch(): Promise<{ index: string; root: string; thumb: string }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-switch-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "switch");
    if (!entry) throw new Error("Switch Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    return {
      index: await readFile(path.join(outputRoot, "switch/index.ts"), "utf8"),
      root: await readFile(path.join(outputRoot, "switch/SwitchRoot.vue"), "utf8"),
      thumb: await readFile(path.join(outputRoot, "switch/SwitchThumb.vue"), "utf8"),
    };
  }
});
