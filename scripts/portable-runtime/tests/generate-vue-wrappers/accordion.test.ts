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

describe("generated Vue Accordion", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic repeated-disclosure Primitive output", async () => {
    const first = await generateAccordion();
    const second = await generateAccordion();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first)) {
      if (name === "index" || name === "context") continue;
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(first.root).toContain("modelValue?: AccordionValue");
    expect(first.root).toContain("defaultValue?: AccordionValue");
    expect(first.root).toContain(
      "props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value",
    );
    expect(first.root).toMatch(
      /emit\("valueChange", nextValue, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:modelValue", nextValue\);/,
    );
    expect(first.root).toContain("instance.setValue(nextValue, { emit: false });");
    expect(first.context).toContain("InjectionKey<AccordionItemContextValue>");
    expect(first.item).toContain("provide(accordionItemContextKey");
    expect(first.trigger).toContain("useAccordionItemContext");
    expect(first.panel).toContain("useAccordionItemContext");
    expect(first.panel).toContain("hidden");
    expect(first.panel).toContain('style="animation: none"');
    expect(first.index).toContain("const Accordion =");
    expect(first.index).toContain("AccordionValueChangeDetails");
  });

  it("generates Styled Accordion with the default value model and canonical slots", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-accordion-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["accordion"], outputDir: "styled", repoRoot });

    const root = await readFile(path.join(repoRoot, "styled/accordion/Accordion.vue"), "utf8");
    const trigger = await readFile(
      path.join(repoRoot, "styled/accordion/AccordionTrigger.vue"),
      "utf8",
    );
    const content = await readFile(
      path.join(repoRoot, "styled/accordion/AccordionContent.vue"),
      "utf8",
    );

    expect(root).toContain(':model-value="modelValue"');
    expect(root).toContain('@update:model-value="emit(&quot;update:modelValue&quot;, $event)"');
    expect(root).toContain('@value-change="handleValueChange"');
    expect(root).toContain('data-slot="accordion"');
    expect(trigger).toContain('data-slot="accordion-trigger"');
    expect(trigger).toContain('name="icon"');
    expect(content).toContain('data-slot="accordion-content"');
    expect(content).toContain("accordionContent({ class: className })");
  });

  async function generateAccordion(): Promise<Record<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-accordion-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "accordion",
    );
    if (!entry) throw new Error("Accordion Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "accordion");
    return {
      context: await readFile(path.join(directory, "AccordionItemContext.ts"), "utf8"),
      header: await readFile(path.join(directory, "AccordionHeader.vue"), "utf8"),
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      item: await readFile(path.join(directory, "AccordionItem.vue"), "utf8"),
      panel: await readFile(path.join(directory, "AccordionPanel.vue"), "utf8"),
      root: await readFile(path.join(directory, "AccordionRoot.vue"), "utf8"),
      trigger: await readFile(path.join(directory, "AccordionTrigger.vue"), "utf8"),
    };
  }
});
