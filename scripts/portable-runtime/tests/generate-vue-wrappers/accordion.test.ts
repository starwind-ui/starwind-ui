import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";

import { formatGeneratedOutput } from "../../format-generated-output.js";
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
    const committed = await readGeneratedDirectory(
      path.join(process.cwd(), "packages/vue/src/accordion"),
    );

    expect(first).toEqual(second);
    expect(first).toEqual(committed);
    for (const [name, source] of Object.entries(first)) {
      if (!name.endsWith(".vue")) continue;
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
    expect(first["AccordionRoot.vue"]).toContain("modelValue?: AccordionValue");
    expect(first["AccordionRoot.vue"]).toContain("defaultValue?: AccordionValue");
    expect(first["AccordionRoot.vue"]).toContain(
      "props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value",
    );
    expect(first["AccordionRoot.vue"]).toMatch(
      /emit\("valueChange", nextValue, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:modelValue", nextValue\);/,
    );
    expect(first["AccordionRoot.vue"]).toContain("instance.setValue(nextValue, { emit: false });");
    expect(first["AccordionItemContext.ts"]).toContain("InjectionKey<AccordionItemContextValue>");
    expect(first["AccordionItem.vue"]).toContain("provide(accordionItemContextKey");
    expect(first["AccordionTrigger.vue"]).toContain("useAccordionItemContext");
    expect(first["AccordionPanel.vue"]).toContain("useAccordionItemContext");
    expect(first["AccordionPanel.vue"]).toContain("hidden");
    expect(first["AccordionPanel.vue"]).toContain('style="animation: none"');
    expect(first["index.ts"]).toContain("const Accordion =");
    expect(first["index.ts"]).toContain("AccordionValueChangeDetails");
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
    await formatGeneratedOutput([directory], process.cwd());
    return readGeneratedDirectory(directory, true);
  }
});

async function readGeneratedDirectory(
  directory: string,
  formatSources = false,
): Promise<Record<string, string>> {
  const names = (await readdir(directory)).sort();
  const prettierConfig = formatSources
    ? ((await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {})
    : {};
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => {
        const file = path.join(directory, name);
        const source = await readFile(file, "utf8");
        return [
          name,
          formatSources && name.endsWith(".ts")
            ? await format(source, { ...prettierConfig, filepath: file })
            : source,
        ] as const;
      }),
    ),
  );
}
