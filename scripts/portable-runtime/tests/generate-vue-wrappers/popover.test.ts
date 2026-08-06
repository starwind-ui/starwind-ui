import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { popoverRuntimeAdapterContract } from "../../contracts/primitive/components/popover.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Popover", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("generates compiler-valid floating anatomy with strict Trigger and delayed Teleport", async () => {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-popover-"));
    roots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      ({ component }) => component === popoverRuntimeAdapterContract.component,
    );
    if (!entry) throw new Error("Popover Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "popover");
    const names = [
      "PopoverArrow.vue",
      "PopoverBackdrop.vue",
      "PopoverClose.vue",
      "PopoverDescription.vue",
      "PopoverPopup.vue",
      "PopoverPortal.vue",
      "PopoverPositioner.vue",
      "PopoverRoot.vue",
      "PopoverTitle.vue",
      "PopoverTrigger.vue",
      "PopoverViewport.vue",
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

    const root = files["PopoverRoot.vue"]!;
    const trigger = files["PopoverTrigger.vue"]!;
    const portal = files["PopoverPortal.vue"]!;
    const popup = files["PopoverPopup.vue"]!;
    expect(root).toContain("provide(PopoverContext");
    expect(root).toContain("await nextTick()");
    expect(root).toContain("openOnHover: props.openOnHover");
    expect(root).toContain(':data-close-delay="props.closeDelay"');
    expect(root).toMatch(
      /emit\("openChange", nextOpen, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:open", nextOpen\);/,
    );
    expect(trigger).toContain("const AsChildTrigger = defineComponent");
    expect(trigger).toContain('import { createVueAsChild } from "../_internal/as-child";');
    expect(trigger).toContain("asChild.render({");
    expect(portal).toContain("container?: string | HTMLElement");
    expect(portal).toContain(':disabled="props.disabled || !root.mounted.value"');
    expect(portal).toContain("root.registerPortal(owner, null)");
    expect(popup).toContain(':data-side="props.side"');
    expect(popup).toContain(':data-align="props.align"');
    expect(popup).toContain('data-collision-strategy="');
    expect(popup).toContain('role="dialog"');
    expect(popup).toContain("hidden");
  });

  it("generates Styled Popover model, placement, Portal/Popup tree, and strict Trigger", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-popover-"));
    roots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["popover"], outputDir: "styled", repoRoot });

    const directory = path.join(repoRoot, "styled/popover");
    const root = await readFile(path.join(directory, "Popover.vue"), "utf8");
    const content = await readFile(path.join(directory, "PopoverContent.vue"), "utf8");
    const trigger = await readFile(path.join(directory, "PopoverTrigger.vue"), "utf8");

    expect(root).toContain(':open="open"');
    expect(root).toContain('@update:open="emit(&quot;update:open&quot;, $event)"');
    expect(root).toContain('@open-change="handleOpenChange"');
    expect(content).toContain("<PopoverPrimitive.PopoverPortal");
    expect(content).toContain("<PopoverPrimitive.PopoverPopup");
    expect(content).toContain(':side="side"');
    expect(content).toContain(':align="align"');
    expect(content).toContain(':side-offset="sideOffset"');
    expect(content).toContain(':avoid-collisions="avoidCollisions"');
    expect(content).toContain(':collision-strategy="collisionStrategy"');
    expect(content).toContain('data-slot="popover-content"');
    expect(trigger).toContain(':as-child="asChild"');
    expect(trigger).toContain("<PopoverPrimitive.PopoverTrigger");
    expect(() => assertVueSfcCompiles(trigger, "PopoverTrigger.vue")).not.toThrow();
  });
});
