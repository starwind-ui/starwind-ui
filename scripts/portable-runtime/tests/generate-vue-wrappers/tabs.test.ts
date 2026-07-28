import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Tabs", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic controlled-value-presence Primitive output", async () => {
    const first = await generateTabs();
    const second = await generateTabs();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first)) {
      if (name === "index" || name === "context") continue;
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(first.root).toContain("modelValue?: TabsValue");
    expect(first.root).toContain("defaultValue?: TabsValue");
    expect(first.root).toContain(
      "props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value",
    );
    expect(first.root).toMatch(
      /emit\("valueChange", nextValue, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:modelValue", nextValue\);/,
    );
    expect(first.root).toContain("instance.setValue(nextValue, { emit: false, sync: true });");
    expect(first.root).toContain("onUpdated(() => instance?.refresh())");
    expect(first.context).toContain("InjectionKey<TabsContextValue>");
    expect(first.context).toContain("Readonly<Ref<TabsOrientation>>");
    expect(first.list).toContain("useTabsContext");
    expect(first.tab).toContain(':data-value="props.value"');
    expect(first.panel).toContain(':hidden="!active"');
    expect(first.indicator).toContain("data-sw-tabs-indicator");
    expect(first.index).toContain("const Tabs =");
    expect(first.index).toContain("TabsValueChangeDetails");
  });

  it("generates Styled Tabs with the default value model and canonical slots", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-tabs-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["tabs"], outputDir: "styled", repoRoot });

    const root = await readFile(path.join(repoRoot, "styled/tabs/Tabs.vue"), "utf8");
    const list = await readFile(path.join(repoRoot, "styled/tabs/TabsList.vue"), "utf8");
    const trigger = await readFile(path.join(repoRoot, "styled/tabs/TabsTrigger.vue"), "utf8");
    const content = await readFile(path.join(repoRoot, "styled/tabs/TabsContent.vue"), "utf8");

    expect(root).toContain(':model-value="modelValue"');
    expect(root).toContain('@update:model-value="emit(&quot;update:modelValue&quot;, $event)"');
    expect(root).toContain('@value-change="handleValueChange"');
    expect(root).toContain('data-slot="tabs"');
    expect(list).toContain('data-slot="tabs-list"');
    expect(trigger).toContain('data-slot="tabs-trigger"');
    expect(content).toContain('data-slot="tabs-content"');
  });

  async function generateTabs(): Promise<Record<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-tabs-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "tabs");
    if (!entry) throw new Error("Tabs Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "tabs");
    return {
      context: await readFile(path.join(directory, "TabsContext.ts"), "utf8"),
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      indicator: await readFile(path.join(directory, "TabsIndicator.vue"), "utf8"),
      list: await readFile(path.join(directory, "TabsList.vue"), "utf8"),
      panel: await readFile(path.join(directory, "TabsPanel.vue"), "utf8"),
      root: await readFile(path.join(directory, "TabsRoot.vue"), "utf8"),
      tab: await readFile(path.join(directory, "TabsTab.vue"), "utf8"),
    };
  }
});
