import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";

describe("generated Vue component-rooted asChild support", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("emits one private helper and makes every production Primitive asChild part use it", async () => {
    const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-as-child-"));
    temporaryRoots.push(temporaryRoot);
    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot: temporaryRoot });

    const outputRoot = path.join(temporaryRoot, "generated");
    const helper = await readFile(path.join(outputRoot, "_internal/as-child.ts"), "utf8");
    expect(helper).toContain("export function createVueAsChild");
    expect(helper).toContain("cloneVNode");
    expect(helper).toContain("mergeProps");
    expect(helper).toContain("Fragment");
    expect(helper).toContain("exposedElement = isRef(component.element)");
    expect(helper).toContain("publicRoot = component.$el");
    expect(helper).toContain("element.value = null");
    expect(helper).toContain("previousNativeElement !== nativeElement");
    expect(helper).toContain(
      "new Event(nativeTargetChangeEvent, { bubbles: true, composed: true })",
    );
    expect(helper).toContain("export function useVueAsChildRuntimeOwner");
    expect(helper).toContain("event.stopPropagation()");
    expect(helper).toContain('if (typeof child.type === "string") return props;');
    expect(helper).toContain("booleanDomAttributes.has(normalizePropName(key))");
    expect(helper).toContain("!componentDeclaresProp(child.type, key)");
    expect(helper).toContain("normalized[key] = undefined");

    const asChildParts = [
      "collapsible/CollapsibleTrigger.vue",
      "combobox/ComboboxClear.vue",
      "combobox/ComboboxTrigger.vue",
      "menu/MenuTrigger.vue",
      "navigation-menu/NavigationMenuTrigger.vue",
      "popover/PopoverTrigger.vue",
      "preview-card/PreviewCardTrigger.vue",
      "tooltip/TooltipTrigger.vue",
    ];
    for (const relativePath of asChildParts) {
      const source = await readFile(path.join(outputRoot, relativePath), "utf8");
      expect(source, relativePath).toContain(
        'import { createVueAsChild } from "../_internal/as-child";',
      );
      expect(source, relativePath).not.toMatch(/\b(?:cloneVNode|isVNode|mergeProps)\b/);
      expect(source, relativePath).not.toContain("typeof child.type");
      expect(source, relativePath).not.toContain("isNativeElementVNode");
    }

    const owningRoots = [
      "collapsible/CollapsibleRoot.vue",
      "combobox/ComboboxRoot.vue",
      "menu/MenuRoot.vue",
      "navigation-menu/NavigationMenuRoot.vue",
      "popover/PopoverRoot.vue",
      "preview-card/PreviewCardRoot.vue",
      "tooltip/TooltipRoot.vue",
    ];
    for (const relativePath of owningRoots) {
      const source = await readFile(path.join(outputRoot, relativePath), "utf8");
      expect(source, relativePath).toContain(
        'import { useVueAsChildRuntimeOwner } from "../_internal/as-child";',
      );
      expect(source, relativePath).toContain("useVueAsChildRuntimeOwner(");
    }
  });
});
