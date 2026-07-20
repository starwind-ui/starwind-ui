import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { progressRuntimeAdapterContract } from "../../contracts/primitive/components/progress.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";
const COMPONENT_FILES = [
  "ProgressRoot.vue",
  "ProgressTrack.vue",
  "ProgressIndicator.vue",
  "ProgressValue.vue",
  "ProgressLabel.vue",
] as const;

describe("generated Vue Progress Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Progress through the range-status family", () => {
    const plan = buildGenericAdapterPlan(progressRuntimeAdapterContract);
    const outputModel = buildGenericAdapterOutputModel(plan);

    expect(outputModel.files).toEqual(
      expect.arrayContaining([
        ...(["root", "track", "indicator", "value", "label"] as const).map((part) =>
          expect.objectContaining({
            component: expect.objectContaining({
              family: expect.objectContaining({ kind: "range-status", part }),
            }),
          }),
        ),
        expect.objectContaining({ family: expect.objectContaining({ kind: "range-status" }) }),
      ]),
    );
  });

  it("generates deterministic compiler-valid semantic parts and narrow Runtime synchronization", async () => {
    const first = await generateProgress();
    const second = await generateProgress();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first.sources)) {
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
      expect(source).toContain("defineExpose({ element:");
      expect(source).toContain('v-bind="attrs"');
    }

    const root = first.sources["ProgressRoot.vue"];
    expect(root).toContain(
      'import { createProgress, type ProgressValue } from "@starwind-ui/runtime/progress";',
    );
    expect(root).toContain("value?: ProgressValue;");
    expect(root).not.toContain("defineModel");
    expect(root).not.toContain("defineEmits");
    expect(root).toContain("const isIndeterminate = computed(() => props.value == null);");
    expect(root).toContain("onMounted(setupRuntime);");
    expect(root).toContain("onBeforeUnmount(destroyOwnedInstance);");
    expect(root).toContain("ownedInstance.setFormatOptions({");
    expect(root).toContain("ownedInstance.setValue(value, { max, min });");
    expect(root).toContain('() => attrs["aria-valuetext"]');
    expect(root).toContain("() => props.value");
    expect(root).toContain("data-sw-progress");
    expect(root).toContain('role="progressbar"');
    expect(root).toContain(':data-value="isIndeterminate ? undefined : props.value"');
    expect(root).toContain(":data-indeterminate=\"isIndeterminate ? '' : undefined\"");

    expect(first.sources["ProgressTrack.vue"]).toContain("data-sw-progress-track");
    expect(first.sources["ProgressIndicator.vue"]).toContain("data-sw-progress-indicator");
    expect(first.sources["ProgressValue.vue"]).toContain("data-sw-progress-value");
    expect(first.sources["ProgressValue.vue"]).toContain(
      `:data-preserve-text="slots.default ? '' : undefined"`,
    );
    expect(first.sources["ProgressValue.vue"]).toContain('aria-hidden="true"');
    expect(first.sources["ProgressLabel.vue"]).toContain("data-sw-progress-label");
    expect(first.sources["ProgressLabel.vue"]).toContain('role="presentation"');
    for (const file of COMPONENT_FILES) expect(first.sources[file]).toContain("<slot />");

    for (const exportName of [
      "ProgressRoot",
      "ProgressTrack",
      "ProgressIndicator",
      "ProgressValue",
      "ProgressLabel",
    ]) {
      expect(first.index).toContain(
        `export { default as ${exportName} } from "./${exportName}.vue";`,
      );
    }
  });

  async function generateProgress(): Promise<{
    index: string;
    sources: Record<(typeof COMPONENT_FILES)[number], string>;
  }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-progress-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "progress",
    );
    if (!entry) throw new Error("Progress Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    const directory = path.join(outputRoot, "progress");
    return {
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      sources: Object.fromEntries(
        await Promise.all(
          COMPONENT_FILES.map(async (name) => [
            name,
            await readFile(path.join(directory, name), "utf8"),
          ]),
        ),
      ) as Record<(typeof COMPONENT_FILES)[number], string>,
    };
  }
});
