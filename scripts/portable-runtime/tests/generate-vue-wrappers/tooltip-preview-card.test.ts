import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue timed floating overlays", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  for (const component of ["tooltip", "preview-card"] as const) {
    it(`projects compiler-valid ${component} output through the registered Vue target`, async () => {
      const outputRoot = await mkdtemp(path.join(os.tmpdir(), `starwind-vue-${component}-`));
      roots.push(outputRoot);
      const entry = primitiveGeneratorRegistry.find(
        (candidate) => candidate.component === component,
      );
      if (!entry) throw new Error(`${component} Primitive generator is missing.`);

      await entry.generateTarget({
        componentHeader: createVueComponentHeader(GENERATED_BY),
        moduleHeader: createTsHeader(GENERATED_BY),
        outputRoot,
        target: "vue",
      });

      const prefix = component === "tooltip" ? "Tooltip" : "PreviewCard";
      const directory = path.join(outputRoot, component);
      const root = await readFile(path.join(directory, `${prefix}Root.vue`), "utf8");
      const trigger = await readFile(path.join(directory, `${prefix}Trigger.vue`), "utf8");
      const portal = await readFile(path.join(directory, `${prefix}Portal.vue`), "utf8");
      const popup = await readFile(path.join(directory, `${prefix}Popup.vue`), "utf8");

      for (const [name, source] of Object.entries({ root, trigger, portal, popup })) {
        expect(() => assertVueSfcCompiles(source, `${prefix}${name}.vue`)).not.toThrow();
      }
      expect(root).toContain(`provide(${prefix}Context`);
      expect(root).toMatch(
        /emit\("openChange", nextOpen, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:open", nextOpen\);/,
      );
      expect(root).toContain("owned.destroy()");
      expect(root).toContain("mounted.value = false");
      expect(root).toContain("await nextTick()");
      expect(root).toContain("generation !== runtimeGeneration");
      expect(trigger).toContain("const AsChildTrigger = defineComponent");
      expect(portal).toContain(':disabled="props.disabled || !root.mounted.value"');
      expect(popup).toContain(':data-side="props.side"');
      expect(popup).toContain(':data-align="props.align"');
      expect(popup).toContain("hidden");
    });
  }
});
