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

describe("generated Vue Context Menu Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic, compiler-valid checked-in Context Menu output", async () => {
    const first = await generateContextMenu();
    expect(await generateContextMenu()).toEqual(first);

    for (const [name, source] of first) {
      if (name.endsWith(".vue")) {
        expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
      }
      const checkedInPath = path.join(process.cwd(), "packages/vue/src/context-menu", name);
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

  it("reuses the typed Menu seam and leaves context coordinates with Runtime", async () => {
    const output = new Map(await generateContextMenu());
    const root = output.get("ContextMenuRoot.vue")!;
    const trigger = output.get("ContextMenuTrigger.vue")!;
    const index = output.get("index.ts")!;

    expect(root).toContain("createContextMenu");
    expect(root).toContain('from "../menu/MenuContext"');
    expect(root).toContain("provide(MenuRootContext");
    expect(root).toContain('provide(MenuOwnerContext, { kind: "root" })');
    expect(trigger).toContain("useMenuRootContext");
    expect(index).toContain('import ContextMenuPortal from "../menu/MenuPortal.vue"');
    expect(index).toContain(
      'import ContextMenuSubmenuTrigger from "../menu/MenuSubmenuTrigger.vue"',
    );
    expect(index).toContain("RadioGroup: ContextMenuRadioGroup");
    expect([...output.values()].join("\n")).not.toMatch(
      /client[XY]|positionAnchor|data-sw-context-menu-anchor|specialized-future-framework-tracer/,
    );
  });

  async function generateContextMenu(): Promise<Array<[string, string]>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-context-menu-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "context-menu",
    );
    if (!entry) throw new Error("Context Menu Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    const directory = path.join(outputRoot, "context-menu");
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
