import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { drawerRuntimeAdapterContract } from "../../contracts/primitive/components/drawer.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Drawer and Styled Sheet", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("projects Drawer anatomy, delayed owner Teleport, and all-side popup facts", async () => {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-drawer-"));
    roots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      ({ component }) => component === drawerRuntimeAdapterContract.component,
    );
    if (!entry) throw new Error("Drawer Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "drawer");
    const names = [
      "DrawerBackdrop.vue",
      "DrawerClose.vue",
      "DrawerDescription.vue",
      "DrawerPopup.vue",
      "DrawerPortal.vue",
      "DrawerRoot.vue",
      "DrawerTitle.vue",
      "DrawerTrigger.vue",
      "DrawerViewport.vue",
    ];
    const files = Object.fromEntries(
      await Promise.all(
        names.map(
          async (name) => [name, await readFile(path.join(directory, name), "utf8")] as const,
        ),
      ),
    );
    for (const [name, source] of Object.entries(files)) {
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }

    expect(files["DrawerRoot.vue"]).toContain("provide(DrawerContext");
    expect(files["DrawerRoot.vue"]).toContain("await nextTick()");
    expect(files["DrawerRoot.vue"]).not.toContain("document.activeElement");
    expect(files["DrawerPortal.vue"]).toContain(
      ':disabled="props.disabled || !root.mounted.value"',
    );
    expect(files["DrawerViewport.vue"]).toContain("data-sw-drawer-viewport");
    expect(files["DrawerPopup.vue"]).toContain('side?: "top" | "right" | "bottom" | "left"');
    expect(files["DrawerPopup.vue"]).toContain(`:data-side='props.side ?? "right"'`);
  });

  it("generates only Styled Sheet with models, side styling, slots, and strict composition", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-sheet-"));
    roots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["sheet"], outputDir: "styled", repoRoot });

    const directory = path.join(repoRoot, "styled/sheet");
    const root = await readFile(path.join(directory, "Sheet.vue"), "utf8");
    const content = await readFile(path.join(directory, "SheetContent.vue"), "utf8");
    const trigger = await readFile(path.join(directory, "SheetTrigger.vue"), "utf8");
    const close = await readFile(path.join(directory, "SheetClose.vue"), "utf8");

    expect(root).toContain(':open="open"');
    expect(root).toContain('@update:open="emit(&quot;update:open&quot;, $event)"');
    expect(root).toContain('@open-change="handleOpenChange"');
    expect(content).toContain("<SheetPrimitive.DrawerBackdrop");
    expect(content).toContain("<SheetPrimitive.DrawerPopup");
    expect(content).toContain(':side="side"');
    expect(content).toContain('<slot name="backdrop">');
    expect(content).toContain('<slot name="icon">');
    expect(content).toContain('<path d="M18 6l-12 12" />');
    expect(content).toContain('<path d="M6 6l12 12" />');
    expect(content).not.toContain('<path d="M5 12l5 5l10 -10" />');
    for (const [part, source] of [
      ["Trigger", trigger],
      ["Close", close],
    ] as const) {
      expect(source).toContain(`const AsChild${part} = defineComponent`);
      expect(source).toContain("cloneVNode(child, mergeProps(");
      expect(source).toContain(`Sheet${part} asChild requires exactly one native element VNode.`);
      expect(() => assertVueSfcCompiles(source, `Sheet${part}.vue`)).not.toThrow();
    }
  });
});
