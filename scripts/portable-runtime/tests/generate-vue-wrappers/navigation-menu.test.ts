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

describe("generated Vue Navigation Menu Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic compiler-valid shared viewport output", async () => {
    const first = await generateNavigationMenu();
    expect(await generateNavigationMenu()).toEqual(first);
    expect([...first.keys()].sort()).toEqual([
      "NavigationMenuArrow.vue",
      "NavigationMenuContent.vue",
      "NavigationMenuIcon.vue",
      "NavigationMenuItem.vue",
      "NavigationMenuLink.vue",
      "NavigationMenuList.vue",
      "NavigationMenuPopup.vue",
      "NavigationMenuPortal.vue",
      "NavigationMenuPositioner.vue",
      "NavigationMenuRoot.vue",
      "NavigationMenuTrigger.vue",
      "NavigationMenuViewport.vue",
      "index.ts",
    ]);

    for (const [name, source] of first) {
      if (name.endsWith(".vue")) expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
  });

  it("keeps viewport behavior and measurement in Runtime", async () => {
    const output = await generateNavigationMenu();
    const root = output.get("NavigationMenuRoot.vue")!;
    const item = output.get("NavigationMenuItem.vue")!;
    const list = output.get("NavigationMenuList.vue")!;
    const trigger = output.get("NavigationMenuTrigger.vue")!;
    const portal = output.get("NavigationMenuPortal.vue")!;
    const viewport = output.get("NavigationMenuViewport.vue")!;
    const index = output.get("index.ts")!;
    const all = [...output.values()].join("\n");

    expect(root).toContain("createNavigationMenu");
    expect(root).toContain('emit("valueChange", next, detail)');
    expect(root).toContain('emit("update:modelValue", detail.value)');
    expect(root).toContain('instance.subscribe("valueChange"');
    expect(root).toContain("onUpdated(syncUncontrolledFromRuntime)");
    expect(root).not.toContain("refreshPortalTarget");
    expect(root).toContain("owned?.destroy()");
    expect(root).toContain("provide(NavigationMenuRootContext");
    expect(root).toContain("NavigationMenuViewportContext");
    expect(item).toContain(':data-value="props.value"');
    expect(trigger).toContain("useNavigationMenuItemContext");
    expect(portal).toContain("<Teleport");
    expect(portal).toContain("data-floating-root");
    expect(portal).toContain("useVuePortalPlacement");
    expect(portal).toContain(':disabled="placement.disabled.value"');
    expect(list).toContain("useNavigationMenuRootContext");
    expect(list).toContain(':data-orientation="root.orientation.value"');
    expect(viewport).toContain("provide(NavigationMenuViewportContext");
    expect(index).toContain("NavigationMenuValueChangeDetails");
    expect(index).not.toMatch(/Context|useNavigationMenu/);
    expect(all).not.toMatch(
      /ResizeObserver|getBoundingClientRect|offsetWidth|offsetHeight|specialized-future-framework-tracer/,
    );
  });

  async function generateNavigationMenu(): Promise<Map<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-navigation-menu-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "navigation-menu",
    );
    if (!entry) throw new Error("Navigation Menu Primitive generator is missing.");
    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "navigation-menu");
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
