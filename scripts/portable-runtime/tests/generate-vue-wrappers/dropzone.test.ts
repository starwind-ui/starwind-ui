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

describe("generated Vue Dropzone", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic file-drop-control Primitive output", async () => {
    const first = await generateDropzone();
    const second = await generateDropzone();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first)) {
      if (name === "index") continue;
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(first.root.match(/createDropzone\(/g)).toHaveLength(1);
    expect(first.root).toContain(
      "filesChange: [files: File[], detail: DropzoneFilesChangeDetails]",
    );
    expect(first.root).toContain('emit("filesChange", files, detail)');
    expect(first.root).toContain("instance?.setDisabled(value)");
    expect(first.root).toContain("instance?.setUploading(value)");
    expect(first.root).not.toContain("defineModel");
    expect(first.input.match(/type="file"/g)).toHaveLength(1);
    expect(first.input).toContain(':accept="props.accept"');
    expect(first.filesList).toContain('data-has-files="false"');
    expect(first.index).toContain("DropzoneFilesChangeDetails");
  });

  it("generates Styled Dropzone composition without upload behavior", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-dropzone-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["dropzone"], outputDir: "styled", repoRoot });

    const root = await readFile(path.join(repoRoot, "styled/dropzone/Dropzone.vue"), "utf8");
    const filesList = await readFile(
      path.join(repoRoot, "styled/dropzone/DropzoneFilesList.vue"),
      "utf8",
    );
    expect(root).toContain('@files-change="handleFilesChange"');
    expect(root.match(/<DropzonePrimitive\.DropzoneInput/g)).toHaveLength(1);
    expect(root).not.toContain("} & /* @vue-ignore */ DropzoneProps;");
    expect(root).toContain('"id"?: DropzoneProps["id"];');
    expect(root).toContain('"ariaInvalid"?: DropzoneProps["aria-invalid"];');
    expect(root).toContain(`v-bind="{ id, 'aria-invalid': ariaInvalid }"`);
    expect(root).toContain(`v-bind="{ ...attrs, 'aria-invalid': ariaInvalid }"`);
    expect(root).not.toContain("defineModel");
    expect(root).not.toMatch(/fetch\(|XMLHttpRequest|createObjectURL|localStorage/);
    expect(filesList).toContain('data-slot="dropzone-files-list"');
    expect(filesList).toContain(
      `v-bind="{ 'aria-live': 'polite', 'aria-label': 'Uploaded files', ...attrs }"`,
    );
    expect(() => assertVueSfcCompiles(root, "Dropzone.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(filesList, "DropzoneFilesList.vue")).not.toThrow();
  });

  async function generateDropzone(): Promise<Record<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-dropzone-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "dropzone",
    );
    if (!entry) throw new Error("Dropzone Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "dropzone");
    return {
      filesList: await readFile(path.join(directory, "DropzoneFilesList.vue"), "utf8"),
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      input: await readFile(path.join(directory, "DropzoneInput.vue"), "utf8"),
      loadingIndicator: await readFile(
        path.join(directory, "DropzoneLoadingIndicator.vue"),
        "utf8",
      ),
      root: await readFile(path.join(directory, "DropzoneRoot.vue"), "utf8"),
      uploadIndicator: await readFile(path.join(directory, "DropzoneUploadIndicator.vue"), "utf8"),
    };
  }
});
