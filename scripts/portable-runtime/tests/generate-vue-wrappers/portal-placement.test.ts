import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";

const portalFamilies = [
  ["alert-dialog", "AlertDialogPortal.vue", "alert-dialog"],
  ["combobox", "ComboboxPortal.vue", "combobox"],
  ["drawer", "DrawerPortal.vue", "drawer"],
  ["menu", "MenuPortal.vue", "menu"],
  ["navigation-menu", "NavigationMenuPortal.vue", "navigation-menu"],
  ["popover", "PopoverPortal.vue", "popover"],
  ["preview-card", "PreviewCardPortal.vue", "preview-card"],
  ["select", "SelectPortal.vue", "select"],
  ["tooltip", "TooltipPortal.vue", "tooltip"],
] as const;

describe("generated Vue framework-owned Portal placement", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("makes Teleport the sole placement owner for all nine public wrappers", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-portals-"));
    roots.push(repoRoot);
    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot });
    const outputRoot = path.join(repoRoot, "generated");

    for (const [family, fileName, runtimeSubpath] of portalFamilies) {
      const source = await readFile(path.join(outputRoot, family, fileName), "utf8");
      expect(() => assertVueSfcCompiles(source, fileName)).not.toThrow();
      expect(source).toContain(
        `import { reportPortalPlacement, resolvePortalPlacement } from "@starwind-ui/runtime/${runtimeSubpath}";`,
      );
      expect(source).toContain('import { useVuePortalPlacement } from "../_internal/portal";');
      expect(source).toContain('data-sw-portal-placement="framework"');
      expect(source).toContain("data-floating-root");
      expect(source).toContain(":data-disabled=\"props.disabled ? '' : undefined\"");
      expect(source).toContain(":data-placement=\"placement.ready.value ? 'ready' : 'pending'\"");
      expect(source).toContain(':to="placement.target.value"');
      expect(source).toContain(':disabled="placement.disabled.value"');
      expect(source).toContain("reference: () =>");
      expect(source).not.toContain(':to="props.container"');
      expect(source).not.toContain('container: "body"');
    }
  });

  it("emits one portal-only helper without a component-family dependency", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-portal-helper-"));
    roots.push(repoRoot);
    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot });
    const source = await readFile(path.join(repoRoot, "generated/_internal/portal.ts"), "utf8");

    expect(source).toContain("export function useVuePortalPlacement");
    expect(source).toContain("options.runtime.resolvePortalPlacement");
    expect(source).toContain("options.runtime.reportPortalPlacement");
    expect(source).toContain("options.reference?.()");
    expect(source).toContain("new MutationObserver");
    expect(source).toContain("wrapper.parentElement");
    expect(source).toContain("function acceptsTeleportTarget(");
    expect(source).toContain("target.ownerDocument === wrapper.ownerDocument");
    expect(source).toContain("target !== wrapper");
    expect(source).toContain("!wrapper.contains(target)");
    expect(source).toContain("wrapper.parentElement !== target.value");
    expect(source).toContain("targetChanged(wrapper, placedTarget)");
    expect(source).not.toContain("nextTarget.contains(wrapper)");
    expect(source.indexOf("ready.value = false")).toBeLessThan(
      source.indexOf("options.runtime.reportPortalPlacement(wrapper, null)"),
    );
    expect(source.indexOf("ready.value = true")).toBeLessThan(
      source.indexOf("options.runtime.reportPortalPlacement(wrapper, { ready: true"),
    );
    expect(source).toContain("observer?.disconnect()");
    expect(source).toContain("if (!mounted || !wrapper) return");
    expect(source).toContain('wrapper.setAttribute("data-disabled", "")');
    expect(source).toContain('const INLINE_TELEPORT_TARGET = "[data-sw-vue-inline-portal]"');
    expect(source).not.toContain('shallowRef<PortalTarget>("body")');
    expect(source).not.toContain("@starwind-ui/runtime/");
  });
});
