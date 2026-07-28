import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { toggleRuntimeAdapterContract } from "../../contracts/primitive/components/toggle.js";
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

describe("generated Vue Toggle Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Toggle through structured single-boolean-control facts", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(toggleRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              facts: expect.objectContaining({
                props: expect.objectContaining({
                  nativeButton: expect.objectContaining({ name: "nativeButton" }),
                  syncGroup: expect.objectContaining({ name: "syncGroup" }),
                }),
                group: expect.objectContaining({
                  hookName: "useToggleGroupContext",
                  requirement: "optional",
                  valueFields: ["disabled", "value"],
                }),
                render: expect.objectContaining({ nonNativeElement: "span" }),
                setters: expect.objectContaining({
                  state: expect.objectContaining({
                    method: "setPressed",
                    options: { emit: false, sync: true },
                  }),
                }),
              }),
              kind: "single-boolean-control",
              part: "root",
            }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic, compiler-valid, checked-in Toggle output", async () => {
    const first = await generateToggle();
    const second = await generateToggle();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "ToggleRoot.vue")).not.toThrow();
    expect(first.root).toMatch(
      /emit\("pressedChange", pressed, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:pressed", pressed\);/,
    );
    expect(first.root).toContain("const eventGeneration = instanceGeneration;");
    expect(first.root).toContain(
      "const eventWasControlled = !eventWasGroupOwned && props.pressed !== undefined;",
    );
    expect(first.root).toContain("instance !== eventInstance");
    expect(first.root).toContain("instanceGeneration !== eventGeneration");
    expect(first.root).toContain("if (!eventWasGroupOwned && !eventWasControlled)");
    expect(first.root).toContain("instanceGeneration += 1;");
    expect(first.root).toContain("mounted = false;");
    expect(first.root).toContain("instance.setPressed(pressed, { emit: false, sync: true });");
    expect(first.root).toContain(":is=\"props.nativeButton ? 'button' : 'span'\"");
    expect(first.root).toContain("const toggleGroup = useToggleGroupContext();");
    expect(first.root).toContain("const effectiveDisabled = computed");
    expect(first.root).toContain("groupPressed.value ??");
    expect(first.root).toContain(':data-sync-group="props.syncGroup"');
    expect(first.root).toContain("onMounted(() => {");
    expect(first.root).toContain("onBeforeUnmount(() => {");
    expect(first.index).toContain('export { default as ToggleRoot } from "./ToggleRoot.vue";');
    expect(first.index).toContain("TogglePressedChangeDetails");

    await expect(first.root).toBe(
      await readFile(path.join(process.cwd(), "packages/vue/src/toggle/ToggleRoot.vue"), "utf8"),
    );
    await expect(first.index).toBe(
      await readFile(path.join(process.cwd(), "packages/vue/src/toggle/index.ts"), "utf8"),
    );
  });

  it("generates Styled Toggle with named pressed model and canonical variants", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-toggle-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["toggle"], outputDir: "styled", repoRoot });
    const styled = await readFile(path.join(repoRoot, "styled/toggle/Toggle.vue"), "utf8");

    expect(() => assertVueSfcCompiles(styled, "Toggle.vue")).not.toThrow();
    expect(styled).toContain("VariantProps<typeof toggle>");
    expect(styled).toContain('"data-slot"?: string;');
    expect(styled).toContain('"dataSlot"?: string;');
    expect(styled).toContain('dataSlot = "toggle"');
    expect(styled).toContain("pressed = undefined");
    expect(styled).toContain(':data-slot="dataSlot ?? &quot;toggle&quot;"');
    expect(styled).toContain(':pressed="pressed"');
    expect(styled).toContain('@update:pressed="emit(&quot;update:pressed&quot;, $event)"');
    expect(styled).toContain('@pressed-change="handlePressedChange"');
    expect(styled).toContain(
      "const element = ref<HTMLButtonElement | HTMLSpanElement | null>(null);",
    );
    expect(styled).toContain("defineExpose({ element });");
    expect(styled).toContain(':ref="setElement"');
  });

  async function generateToggle(): Promise<{ index: string; root: string }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-toggle-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "toggle");
    if (!entry) throw new Error("Toggle Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    return {
      index: await readFile(path.join(outputRoot, "toggle/index.ts"), "utf8"),
      root: await readFile(path.join(outputRoot, "toggle/ToggleRoot.vue"), "utf8"),
    };
  }
});
