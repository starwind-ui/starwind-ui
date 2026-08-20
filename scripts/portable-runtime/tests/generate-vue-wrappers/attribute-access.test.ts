import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { projectVueAttributeAccess } from "../../renderers/framework-adapters/vue/public-contract.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("Vue attribute access projection", () => {
  let root = "";

  beforeAll(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-attribute-access-"));
    const primitiveRoot = path.join(root, "primitive");
    for (const component of ["avatar", "collapsible", "dropzone", "toggle"]) {
      const entry = primitiveGeneratorRegistry.find(
        (candidate) => candidate.component === component,
      );
      if (!entry) throw new TypeError(`Missing ${component} Primitive generator.`);
      await entry.generateTarget({
        componentHeader: createVueComponentHeader(GENERATED_BY),
        moduleHeader: createTsHeader(GENERATED_BY),
        outputRoot: primitiveRoot,
        target: "vue",
      });
    }
    await generateSelectedVueStyledGroups({
      groups: ["alert", "dropzone", "spinner"],
      outputDir: "styled",
      repoRoot: root,
    });
  });

  afterAll(async () => {
    if (root) await rm(root, { force: true, recursive: true });
  });

  it("classifies template-only and script attribute consumers before serialization", () => {
    expect(projectVueAttributeAccess([])).toEqual({
      kind: "template-only",
      setupBinding: null,
      templateBinding: "$attrs",
      vueImport: null,
    });
    expect(projectVueAttributeAccess(["style-read", "protected-merge"])).toEqual({
      kind: "setup",
      reasons: ["style-read", "protected-merge"],
      setupBinding: "const attrs = useAttrs();",
      templateBinding: "attrs",
      vueImport: "useAttrs",
    });
  });

  it("uses template $attrs for template-only Primitive and Styled output", async () => {
    const primitive = await source("primitive/dropzone/DropzoneFilesList.vue");
    const styled = await source("styled/alert/Alert.vue");
    const styledIcon = await source("styled/spinner/Spinner.vue");

    for (const output of [primitive, styled, styledIcon]) {
      expect(output).toContain('v-bind="$attrs"');
      expect(output).not.toContain("useAttrs");
      expect(output).not.toContain("const attrs");
    }
  });

  it("keeps setup attrs for hidden reads, asChild, protected merges, and dynamic composition", async () => {
    const fixtures = [
      "primitive/avatar/AvatarFallback.vue",
      "primitive/collapsible/CollapsibleTrigger.vue",
      "primitive/dropzone/DropzoneInput.vue",
      "primitive/toggle/ToggleRoot.vue",
      "styled/dropzone/DropzoneFilesList.vue",
    ];

    for (const fixture of fixtures) {
      const output = await source(fixture);
      expect(output, fixture).toContain("useAttrs");
      expect(output, fixture).toContain("const attrs = useAttrs();");
    }
  });

  it("freezes the complete generated template and setup attribute cohorts", async () => {
    const files = (
      await Promise.all([
        listVueFiles(path.join(process.cwd(), "packages/vue/src")),
        listVueFiles(path.join(process.cwd(), "apps/vue-demo/src/components/starwind-runtime")),
      ])
    ).flat();
    const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
    const templateOnly = sources.filter((output) => output.includes('v-bind="$attrs"'));
    const setup = sources.filter((output) => output.includes("const attrs = useAttrs();"));

    expect(templateOnly).toHaveLength(354);
    expect(setup).toHaveLength(138);
    for (const output of templateOnly) {
      expect(output).not.toContain("const attrs = useAttrs();");
      expect(output.replaceAll("$attrs", "")).not.toMatch(/\battrs\b/);
    }
  });

  async function source(relativePath: string): Promise<string> {
    return readFile(path.join(root, relativePath), "utf8");
  }
});

async function listVueFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) return listVueFiles(candidate);
        return entry.isFile() && entry.name.endsWith(".vue") ? [candidate] : [];
      }),
    )
  ).flat();
}
