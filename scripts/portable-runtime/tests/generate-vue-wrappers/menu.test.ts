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

describe("generated Vue Menu Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic, compiler-valid checked-in Menu output", async () => {
    const first = await generateMenu();
    const second = await generateMenu();
    expect(first).toEqual(second);

    for (const [name, source] of first) {
      if (name.endsWith(".vue")) {
        expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
      }
      const checkedInPath = path.join(process.cwd(), "packages/vue/src/menu", name);
      const checkedIn = await readFile(checkedInPath, "utf8");
      const prettierConfig =
        (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
      const formattedCheckedIn = await format(checkedIn, {
        ...prettierConfig,
        filepath: checkedInPath,
      });
      expect(withoutBlankLines(source)).toBe(withoutBlankLines(formattedCheckedIn));
    }
  });

  it("prints typed context, model, event, submenu, collection, and Teleport ownership", async () => {
    const output = new Map(await generateMenu());
    const context = output.get("MenuContext.ts")!;
    const root = output.get("MenuRoot.vue")!;
    const portal = output.get("MenuPortal.vue")!;
    const checkbox = output.get("MenuCheckboxItem.vue")!;
    const radioGroup = output.get("MenuRadioGroup.vue")!;
    const radioItem = output.get("MenuRadioItem.vue")!;
    const submenuRoot = output.get("MenuSubmenuRoot.vue")!;
    const index = output.get("index.ts")!;

    expect(context).toContain("InjectionKey<MenuRootContextValue>");
    expect(context).toContain("InjectionKey<MenuRadioGroupContextValue>");
    expect(context).toContain("useMenuSubmenuContext");
    expect(root).toContain("createMenu(element");
    expect(root).toMatch(/emit\("openChange"[\s\S]*detail\.isCanceled[\s\S]*emit\("update:open"/);
    expect(root).toContain("portalReference: portalReference ?? undefined");
    expect(portal).toContain("active: () => menu.mounted.value");
    expect(portal).not.toContain(
      'active: () => menu.mounted.value && ownerContext.kind === "root"',
    );
    expect(portal).toContain(':disabled="placement.disabled.value"');
    expect(portal).toContain("useVuePortalPlacement");
    expect(portal).toContain("menu.registerPortal(owner, null)");
    expect(checkbox).toMatch(
      /emit\("checkedChange"[\s\S]*detail\.isCanceled[\s\S]*emit\("update:checked"/,
    );
    expect(radioGroup).toContain('"update:modelValue"');
    expect(radioGroup).toMatch(
      /emit\("valueChange"[\s\S]*detail\.isCanceled[\s\S]*emit\("update:modelValue"/,
    );
    expect(radioItem).toMatch(
      /group\.value\.value === undefined[\s\S]*\? \(props\.checked \?\? props\.defaultChecked\)[\s\S]*: group\.value\.value === props\.value/,
    );
    expect(submenuRoot).toContain('provide(MenuOwnerContext, { kind: "submenu" })');
    expect(index).toContain("const Menu = {");
    expect(index).toContain("MenuOpenChangeDetails");
    expect(index).not.toMatch(/MenuContext|ContextValue|useMenu/);
    expect(root).toContain('from "./MenuContext"');
    expect([...output.values()].join("\n")).not.toContain("specialized-future-framework-tracer");
  });

  async function generateMenu(): Promise<Array<[string, string]>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-menu-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "menu");
    if (!entry) throw new Error("Menu Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    const directory = path.join(outputRoot, "menu");
    const names = (await readdir(directory)).sort();
    const prettierConfig =
      (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
    return Promise.all(
      names.map(async (name): Promise<[string, string]> => {
        const file = path.join(directory, name);
        return [
          name,
          await format(await readFile(file, "utf8"), { ...prettierConfig, filepath: file }),
        ];
      }),
    );
  }
});

function withoutBlankLines(source: string): string {
  return source.replace(/\n\s*\n/g, "\n");
}
