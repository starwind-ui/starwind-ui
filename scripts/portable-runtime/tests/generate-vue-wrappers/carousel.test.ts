import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";

import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Carousel Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic compiler-valid engine viewport output", async () => {
    const first = await generateCarousel();
    expect(await generateCarousel()).toEqual(first);
    expect([...first.keys()].sort()).toEqual([
      "CarouselContainer.vue",
      "CarouselItem.vue",
      "CarouselNext.vue",
      "CarouselPrevious.vue",
      "CarouselRoot.vue",
      "CarouselTypes.ts",
      "CarouselViewport.vue",
      "index.ts",
    ]);

    for (const [name, source] of first) {
      if (name.endsWith(".vue")) expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
  });

  it("projects lifecycle, options, refs, and API while Runtime keeps engine behavior", async () => {
    const output = await generateCarousel();
    const root = output.get("CarouselRoot.vue")!;
    const item = output.get("CarouselItem.vue")!;
    const previous = output.get("CarouselPrevious.vue")!;
    const index = output.get("index.ts")!;
    const all = [...output.values()].join("\n");

    expect(root).toContain("createCarousel");
    expect(root).toContain("onMounted");
    expect(root).toContain("onBeforeUnmount");
    expect(root).toContain("watch(");
    expect(root).toContain("instance.reInit");
    expect(root).toContain("setApi(instance.api)");
    expect(root).toContain("defineExpose");
    expect(root).toContain("defineExpose({ element })");
    expect(root).toContain('data-auto-init="false"');
    expect(item).toContain('role="group"');
    expect(item).toContain('aria-roledescription="slide"');
    expect(previous).toContain('type="button"');
    expect(index).toContain("CarouselInstance");
    expect(index).toContain("createCarousel");
    expect(all).not.toMatch(/EmblaCarousel|ResizeObserver|getBoundingClientRect|scroll physics/i);
  });

  async function generateCarousel(): Promise<Map<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-carousel-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "carousel",
    );
    if (!entry) throw new Error("Carousel Primitive generator is missing.");
    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "carousel");
    const names = (await readdir(directory)).sort();
    const prettierConfig =
      (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
    return new Map(
      await Promise.all(
        names.map(async (name): Promise<[string, string]> => {
          const file = path.join(directory, name);
          return [
            name,
            await format(await readFile(file, "utf8"), { ...prettierConfig, filepath: file }),
          ];
        }),
      ),
    );
  }
});
