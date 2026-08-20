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
const PARTS = [
  "Action",
  "Close",
  "Content",
  "Description",
  "Root",
  "Template",
  "Title",
  "TitleText",
  "Viewport",
] as const;

describe("generated Vue Toast Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates the complete deterministic compiler-valid notification family", async () => {
    const first = await generateToast();
    expect(await generateToast()).toEqual(first);
    expect([...first.keys()].sort()).toEqual(
      [...PARTS.map((part) => `Toast${part}.vue`), "index.ts"].sort(),
    );
    for (const [name, source] of first) {
      if (name.endsWith(".vue")) expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
  });

  it("projects templates, manager ownership, options, parts, and Runtime service exports", async () => {
    const output = await generateToast();
    const viewport = output.get("ToastViewport.vue")!;
    const template = output.get("ToastTemplate.vue")!;
    const close = output.get("ToastClose.vue")!;
    const root = output.get("ToastRoot.vue")!;
    const index = output.get("index.ts")!;
    const all = [...output.values()].join("\n");

    expect(viewport).toContain("createToastManager");
    expect(viewport).toContain("onMounted");
    expect(viewport).toContain("owned?.destroy()");
    expect(viewport).toContain("data-sw-toast-viewport");
    expect(viewport).toContain('"--gap"');
    expect(viewport).toContain('"--peek"');
    expect(viewport.indexOf('aria-label="Notifications"')).toBeLessThan(
      viewport.indexOf('v-bind="attrs"'),
    );
    expect(template).toContain("HTMLTemplateElement");
    expect(template).toContain("data-sw-toast-template");
    expect(template).toContain("forwardedAttributeNames");
    expect(template).toContain("template.removeAttribute(attributeName)");
    expect(root).toContain('role="dialog"');
    expect(close.indexOf('aria-label="Close notification"')).toBeLessThan(
      close.indexOf('v-bind="$attrs"'),
    );
    expect(close.indexOf('v-bind="$attrs"')).toBeLessThan(close.indexOf('type="button"'));
    expect(index).toContain('export { toast } from "@starwind-ui/runtime/toast"');
    expect(index).toContain("ToastPromiseOptions");
    expect(all).not.toMatch(/queue|setTimeout|pointermove\s*=>|componentName[^\n]*toast/i);
  });

  async function generateToast(): Promise<Map<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-toast-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "toast");
    if (!entry) throw new Error("Toast Primitive generator is missing.");
    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "toast");
    const prettierConfig =
      (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
    return new Map(
      await Promise.all(
        (await readdir(directory)).sort().map(async (name): Promise<[string, string]> => {
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
