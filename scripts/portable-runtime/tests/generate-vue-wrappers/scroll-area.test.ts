import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { scrollAreaRuntimeAdapterContract } from "../../contracts/primitive/components/scroll-area.js";
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
  "ScrollAreaRoot.vue",
  "ScrollAreaViewport.vue",
  "ScrollAreaContent.vue",
  "ScrollAreaScrollbar.vue",
  "ScrollAreaThumb.vue",
  "ScrollAreaCorner.vue",
] as const;

describe("generated Vue Scroll Area Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Scroll Area through the viewport-measurement family", () => {
    const plan = buildGenericAdapterPlan(scrollAreaRuntimeAdapterContract);
    const outputModel = buildGenericAdapterOutputModel(plan);

    expect(outputModel.files).toEqual(
      expect.arrayContaining([
        ...(["root", "viewport", "content", "scrollbar", "thumb", "corner"] as const).map((part) =>
          expect.objectContaining({
            component: expect.objectContaining({
              family: expect.objectContaining({ kind: "viewport-measurement", part }),
            }),
          }),
        ),
        expect.objectContaining({
          family: expect.objectContaining({ kind: "viewport-measurement" }),
        }),
      ]),
    );
  });

  it("generates deterministic compiler-valid anatomy with one Runtime owner", async () => {
    const first = await generateScrollArea();
    const second = await generateScrollArea();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first.sources)) {
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
      expect(source).toContain("defineExpose({ element:");
      expect(source).toContain('v-bind="attrs"');
      expect(source).toContain("<slot />");
    }

    const root = first.sources["ScrollAreaRoot.vue"];
    expect(root).toContain('import { createScrollArea } from "@starwind-ui/runtime/scroll-area";');
    expect(root).toContain("type ScrollAreaOverflowEdgeThreshold =");
    expect(root).toContain("const thresholdAttributes = computed(() =>");
    expect(root).toContain("instance = createScrollArea(element);");
    expect(root).toContain("onUpdated(scheduleRefresh);");
    expect(root).toContain("onBeforeUnmount(destroyOwnedInstance);");
    expect(root).toContain("ownedInstance.refresh();");
    expect(root).toContain('{ flush: "post" }');
    expect(root).toContain("normalizeOverflowEdgeThresholdValue");
    expect(root).toContain("data-sw-scroll-area");
    expect(root).toContain(':data-overflow-edge-threshold="thresholdAttributes.shared"');
    expect(root).toContain('role="presentation"');
    expect(root).not.toContain("ResizeObserver");
    expect(root).not.toContain("MutationObserver");
    expect(root).not.toContain("scrollHeight");

    for (const name of COMPONENT_FILES.filter((name) => name !== "ScrollAreaRoot.vue")) {
      expect(first.sources[name]).not.toContain("createScrollArea");
      expect(first.sources[name]).not.toContain("onMounted");
    }

    const viewport = first.sources["ScrollAreaViewport.vue"];
    expect(viewport).toContain("data-sw-scroll-area-viewport");
    expect(viewport).toContain(':tabindex="getViewportTabIndex()"');
    expect(viewport).toContain('typeof value === "number" || typeof value === "string"');
    expect(viewport).toContain(`:style="[attrs.style, { overflow: 'scroll' }]"`);

    const scrollbar = first.sources["ScrollAreaScrollbar.vue"];
    expect(scrollbar).toContain('orientation: "vertical"');
    expect(scrollbar).toContain("keepMounted: false");
    expect(scrollbar).toContain(`:data-keep-mounted="props.keepMounted ? '' : undefined"`);
    expect(scrollbar).toContain(':data-orientation="props.orientation"');
    expect(scrollbar).toContain('aria-hidden="true"');
    expect(scrollbar).not.toContain("v-if");

    expect(first.sources["ScrollAreaContent.vue"]).toContain("data-sw-scroll-area-content");
    expect(first.sources["ScrollAreaThumb.vue"]).toContain("data-sw-scroll-area-thumb");
    expect(first.sources["ScrollAreaCorner.vue"]).toContain("data-sw-scroll-area-corner");
    expect(first.sources["ScrollAreaCorner.vue"]).toContain('aria-hidden="true"');

    for (const exportName of [
      "ScrollAreaContent",
      "ScrollAreaCorner",
      "ScrollAreaRoot",
      "ScrollAreaScrollbar",
      "ScrollAreaThumb",
      "ScrollAreaViewport",
    ]) {
      expect(first.index).toContain(
        `export { default as ${exportName} } from "./${exportName}.vue";`,
      );
    }
  });

  async function generateScrollArea(): Promise<{
    index: string;
    sources: Record<(typeof COMPONENT_FILES)[number], string>;
  }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-scroll-area-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "scroll-area",
    );
    if (!entry) throw new Error("Scroll Area Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    const directory = path.join(outputRoot, "scroll-area");
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
