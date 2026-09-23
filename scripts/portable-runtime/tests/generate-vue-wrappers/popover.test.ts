import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { popoverRuntimeAdapterContract } from "../../contracts/primitive/components/popover.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { compactCode } from "../source-comparison.js";
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
    expect(() => assertVueSfcCompiles(root, "Component.vue")).not.toThrow();

    expect(compactCode(trigger)).toContain(compactCode("const AsChildTrigger = defineComponent"));
    expect(compactCode(trigger)).toContain(
      compactCode('import { createVueAsChild } from "../_internal/as-child";'),
    );
    expect(compactCode(trigger)).toContain(compactCode("asChild.render({"));
    expect(portal).toContain("container?: string | HTMLElement");
    expect(portal).toContain('import { useVuePortalPlacement } from "../_internal/portal";');
    expect(portal).toContain('data-sw-portal-placement="framework"');
    expect(portal).toContain(':to="placement.target.value"');
    expect(portal).toContain(':disabled="placement.disabled.value"');
    expect(portal).toContain(":data-disabled=\"props.disabled ? '' : undefined\"");
    expect(portal).toContain("useVuePortalPlacement");
    expect(compactCode(popup)).toContain(compactCode(':data-side="props.side"'));
    expect(compactCode(popup)).toContain(compactCode(':data-align="props.align"'));
    expect(compactCode(popup)).toContain(compactCode('data-collision-strategy="'));
    expect(compactCode(popup)).toContain(compactCode('role="dialog"'));
    expect(compactCode(popup)).toContain(compactCode("hidden"));
  });

  it("generates Styled Popover model, placement, Portal/Popup tree, and strict Trigger", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-popover-"));
    roots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["popover"], outputDir: "styled", repoRoot });

    const directory = path.join(repoRoot, "styled/popover");
    const root = await readFile(path.join(directory, "Popover.vue"), "utf8");
    const content = await readFile(path.join(directory, "PopoverContent.vue"), "utf8");
    const trigger = await readFile(path.join(directory, "PopoverTrigger.vue"), "utf8");

    expect(compactCode(root)).toContain(compactCode(':open="open"'));
    expect(compactCode(root)).toContain(
      compactCode('@update:open="emit(&quot;update:open&quot;, $event)"'),
    );
    expect(compactCode(root)).toContain(compactCode('@open-change="handleOpenChange"'));
    expect(content).toContain("<PopoverPrimitive.PopoverPortal");
    expect(content).toContain("<PopoverPrimitive.PopoverPopup");
    expect(content).toContain(':side="side"');
    expect(content).toContain(':align="align"');
    expect(content).toContain(':side-offset="sideOffset"');
    expect(content).toContain(':avoid-collisions="avoidCollisions"');
    expect(content).toContain(':collision-strategy="collisionStrategy"');
    expect(content).toContain('data-slot="popover-content"');
    expect(compactCode(trigger)).toContain(compactCode(':as-child="asChild"'));
    expect(compactCode(trigger)).toContain(compactCode("<PopoverPrimitive.PopoverTrigger"));
    expect(() => assertVueSfcCompiles(trigger, "PopoverTrigger.vue")).not.toThrow();
  });
});
