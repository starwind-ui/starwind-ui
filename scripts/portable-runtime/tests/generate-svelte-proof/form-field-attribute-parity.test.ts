import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";

async function generate(component: string, outputRoot: string): Promise<void> {
  await getPrimitiveGeneratorEntries()
    .find((entry) => entry.component === component)!
    .generateTarget({ componentHeader: "", moduleHeader: "", outputRoot, target: "svelte" });
}

it("prints no Primitive data-slot on Field parts, as React, Vue and Astro do", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-field-attributes-"));
  try {
    await generate("field", outputRoot);
    for (const part of ["Root", "Label", "Description", "Item", "Error", "Validity"]) {
      const source = await readFile(path.join(outputRoot, "field", `Field${part}.svelte`), "utf8");
      expect(source, `Field${part}`).not.toContain("data-slot");
    }
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

it("prints the Form timing attributes only when the consumer sets them", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-form-attributes-"));
  try {
    await generate("form", outputRoot);
    const source = await readFile(path.join(outputRoot, "form", "FormRoot.svelte"), "utf8");
    expect(source).not.toMatch(/errorVisibility\s*=\s*"/);
    expect(source).not.toMatch(/revalidationTiming\s*=\s*"/);
    expect(source).not.toMatch(/validationTiming\s*=\s*"/);
    expect(source).toContain("data-error-visibility={dataErrorVisibility ?? errorVisibility}");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
