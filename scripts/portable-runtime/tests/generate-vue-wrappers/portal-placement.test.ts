import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { compactCode } from "../source-comparison.js";

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
      expect(compactCode(source)).toContain(
        compactCode('import { useVuePortalPlacement } from "../_internal/portal";'),
      );
      expect(compactCode(source)).toContain(compactCode('data-sw-portal-placement="framework"'));
      expect(compactCode(source)).toContain(compactCode("data-floating-root"));
      expect(compactCode(source)).toContain(
        compactCode(":data-disabled=\"props.disabled ? '' : undefined\""),
      );
      expect(compactCode(source)).toContain(
        compactCode(":data-placement=\"placement.ready.value ? 'ready' : 'pending'\""),
      );
      expect(compactCode(source)).toContain(compactCode(':to="placement.target.value"'));
      expect(compactCode(source)).toContain(compactCode(':disabled="placement.disabled.value"'));
      expect(compactCode(source)).toContain(compactCode("reference: () =>"));
      expect(compactCode(source)).not.toContain(compactCode(':to="props.container"'));
      expect(compactCode(source)).not.toContain(compactCode('container: "body"'));
    }
  });

  it("emits one portal-only helper without a component-family dependency", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-portal-helper-"));
    roots.push(repoRoot);
    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot });
    const source = await readFile(path.join(repoRoot, "generated/_internal/portal.ts"), "utf8");

    expect(compactCode(source)).toContain(compactCode("export function useVuePortalPlacement"));
    expect(compactCode(source)).toContain(compactCode("options.runtime.resolvePortalPlacement"));
    expect(compactCode(source)).toContain(compactCode("options.runtime.reportPortalPlacement"));
    expect(compactCode(source)).toContain(compactCode("options.reference?.()"));
    expect(compactCode(source)).toContain(
      compactCode("if (inlineReference?.isConnected) return inlineReference"),
    );
    expect(compactCode(source)).toContain(
      compactCode(
        "if (authoredRoot instanceof HTMLElement && authoredRoot.isConnected) return authoredRoot",
      ),
    );
    expect(source.indexOf("inlineReference?.isConnected")).toBeLessThan(
      source.indexOf("options.reference?.()"),
    );
    expect(compactCode(source)).toContain(compactCode("new MutationObserver"));
    expect(compactCode(source)).toContain(compactCode("wrapper.parentElement"));
    expect(compactCode(source)).toContain(compactCode("function acceptsTeleportTarget("));
    expect(compactCode(source)).toContain(
      compactCode("target.ownerDocument === wrapper.ownerDocument"),
    );
    expect(compactCode(source)).toContain(compactCode("target !== wrapper"));
    expect(compactCode(source)).toContain(compactCode("!wrapper.contains(target)"));
    expect(compactCode(source)).toContain(compactCode("wrapper.parentElement !== target.value"));
    expect(compactCode(source)).toContain(compactCode("targetChanged(wrapper, placedTarget)"));
    expect(compactCode(source)).not.toContain(compactCode("nextTarget.contains(wrapper)"));
    expect(source.indexOf("ready.value = false")).toBeLessThan(
      source.indexOf("options.runtime.reportPortalPlacement(wrapper, null)"),
    );
    expect(source.indexOf("ready.value = true")).toBeLessThan(
      source.indexOf("options.runtime.reportPortalPlacement(wrapper, { ready: true"),
    );
    expect(compactCode(source)).toContain(compactCode("stopDocumentObservation?.()"));
    expect(compactCode(source)).toContain(compactCode("if (!mounted || !wrapper) return"));
    expect(compactCode(source)).toContain(compactCode('wrapper.setAttribute("data-disabled", "")'));
    expect(compactCode(source)).toContain(
      compactCode('const INLINE_TELEPORT_TARGET = "[data-sw-vue-inline-portal]"'),
    );
    expect(compactCode(source)).not.toContain(compactCode('shallowRef<PortalTarget>("body")'));
    expect(compactCode(source)).not.toContain(compactCode("@starwind-ui/runtime/"));
  });
});
