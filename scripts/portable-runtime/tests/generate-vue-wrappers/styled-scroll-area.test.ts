import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { scrollAreaStyledContract } from "../../contracts/styled/components/scroll-area.js";
import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";

const COMPONENT_FILES = [
  "ScrollArea.vue",
  "ScrollAreaContent.vue",
  "ScrollAreaCorner.vue",
  "ScrollAreaThumb.vue",
  "ScrollAreaViewport.vue",
  "ScrollBar.vue",
] as const;

describe("generated Vue Styled Scroll Area", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("projects all six wrappers, anatomy, props, variants, CSS, and public refs through Primitive", async () => {
    const root = await createRoot("starwind-vue-styled-scroll-area-");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });
    const directory = path.join(root, "styled/scroll-area");
    const sources = Object.fromEntries(
      await Promise.all(
        COMPONENT_FILES.map(async (file) => [
          file,
          await readFile(path.join(directory, file), "utf8"),
        ]),
      ),
    ) as Record<(typeof COMPONENT_FILES)[number], string>;

    for (const [file, source] of Object.entries(sources)) {
      expect(() => assertVueSfcCompiles(source, file)).not.toThrow();
      expect(source, file).toContain(
        'import * as ScrollAreaPrimitive from "@starwind-ui/vue/scroll-area";',
      );
      expect(source, file).toContain("defineExpose({ element });");
      expect(source, file).toContain(':ref="setElement"');
      expect(source, file).not.toMatch(
        /createScrollArea|MutationObserver|ResizeObserver|onMounted|onUpdated|onBeforeUnmount|watch\(/,
      );
    }

    const rootSource = sources["ScrollArea.vue"];
    expect(rootSource).toMatch(/["']?viewportClass["']?\?: string;/);
    expect(rootSource).not.toContain("viewportClassName");
    expect(rootSource).toContain(':class="scrollAreaViewport({ class: viewportClass })"');
    expect(rootSource).toContain(':overflow-edge-threshold="overflowEdgeThreshold"');
    expect(rootSource).toContain('<slot name="scrollbar">');
    expect(rootSource).toContain("<slot />");
    expect(rootSource.match(/data-slot=/g)).toHaveLength(6);
    for (const slot of [
      "scroll-area",
      "scroll-area-viewport",
      "scroll-area-content",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-corner",
    ]) {
      expect(rootSource).toContain(`data-slot="${slot}"`);
    }

    const scrollBarSource = sources["ScrollBar.vue"];
    expect(scrollBarSource).toMatch(/["']?orientation["']?\?: "horizontal" \| "vertical";/);
    expect(scrollBarSource).toContain('orientation = "vertical"');
    expect(scrollBarSource).toContain(':keep-mounted="keepMounted"');
    expect(scrollBarSource).toContain(':data-orientation="orientation"');
    expect(scrollBarSource).toContain("<slot>");
    expect(scrollBarSource).toContain("<ScrollAreaPrimitive.ScrollAreaThumb");

    const index = await readFile(path.join(directory, "index.ts"), "utf8");
    const variants = await readFile(path.join(directory, "variants.ts"), "utf8");
    const styles = await readFile(path.join(directory, "styles.css"), "utf8");
    expect(index).toContain(
      "export { ScrollArea, ScrollAreaContent, ScrollAreaCorner, ScrollAreaThumb, ScrollAreaVariants, ScrollAreaViewport, ScrollBar };",
    );
    expect(index).toContain("Scrollbar: ScrollBar");
    expect(variants).toContain('base: "relative overflow-hidden"');
    expect(variants).toContain('base: "min-w-fit"');
    expect(variants).toContain("data-[orientation=horizontal]:inset-x-0");
    expect(variants).toContain("data-[orientation=vertical]:inset-y-0");
    expect(styles).toContain("[data-sw-scroll-area-viewport]");
    expect(styles).toContain("scrollbar-width: none");
    expect(styles).toContain("::-webkit-scrollbar");
    expect(scrollAreaStyledContract.publicExports).toEqual([
      "ScrollArea",
      "ScrollAreaContent",
      "ScrollAreaCorner",
      "ScrollAreaThumb",
      "ScrollAreaViewport",
      "ScrollBar",
    ]);
  });

  it("is byte-deterministic across fresh output roots", async () => {
    const firstRoot = await createRoot("starwind-vue-scroll-area-first-");
    const secondRoot = await createRoot("starwind-vue-scroll-area-second-");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: firstRoot });
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: secondRoot });

    for (const file of [...COMPONENT_FILES, "index.ts", "styles.css", "variants.ts"]) {
      await expect(
        readFile(path.join(firstRoot, "styled/scroll-area", file), "utf8"),
      ).resolves.toBe(await readFile(path.join(secondRoot, "styled/scroll-area", file), "utf8"));
    }
  });

  async function createRoot(prefix: string): Promise<string> {
    const root = await mkdtemp(path.join(os.tmpdir(), prefix));
    roots.push(root);
    return root;
  }
});
