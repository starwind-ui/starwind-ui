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

describe("generated Vue Sidebar Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic compiler-valid sidebar output with typed context", async () => {
    const first = await generateSidebar();
    expect(await generateSidebar()).toEqual(first);
    expect([...first.keys()].sort()).toEqual([
      "Sidebar.vue",
      "SidebarContext.ts",
      "SidebarMenuButton.vue",
      "SidebarProvider.vue",
      "SidebarRail.vue",
      "SidebarTrigger.vue",
      "index.ts",
    ]);

    for (const [name, source] of first) {
      if (name.endsWith(".vue")) expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
  });

  it("projects dual models, readonly context, asChild, subscriptions, and exact cleanup", async () => {
    const output = await generateSidebar();
    const provider = output.get("SidebarProvider.vue")!;
    const context = output.get("SidebarContext.ts")!;
    const trigger = output.get("SidebarTrigger.vue")!;
    const menuButton = output.get("SidebarMenuButton.vue")!;
    const all = [...output.values()].join("\n");

    expect(provider).toContain("createSidebarController");
    expect(provider).toContain('"update:open"');
    expect(provider).toContain('"update:mobileOpen"');
    expect(provider).toContain('subscribe("openChange"');
    expect(provider).toContain('subscribe("mobileOpenChange"');
    expect(provider).toContain("onMounted");
    expect(provider).toContain("onBeforeUnmount");
    expect(provider).toContain("owned?.destroy()");
    expect(context).toContain("InjectionKey<SidebarContextValue>");
    expect(context).toContain("Readonly<Ref<boolean>>");
    expect(trigger).toContain("createVueAsChild");
    expect(menuButton).toContain("createVueAsChild");
    expect(all).not.toMatch(/localStorage\.setItem|document\.cookie\s*=|matchMedia\([^)]*\)\s*\?/);
    const adapter = await readFile(
      path.join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/vue/adapter.ts",
      ),
      "utf8",
    );
    expect(adapter).not.toMatch(/componentName[^\n]*sidebar|sidebar[^\n]*componentName/i);
  });

  async function generateSidebar(): Promise<Map<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-sidebar-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "sidebar");
    if (!entry) throw new Error("Sidebar Primitive generator is missing.");
    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "sidebar");
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
