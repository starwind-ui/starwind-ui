import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { dialogRuntimeAdapterContract } from "../../contracts/primitive/components/dialog.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Dialog", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Dialog through native-overlay facts without Portal or Viewport", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(dialogRuntimeAdapterContract),
    );
    const families = output.files.flatMap((file) => {
      if (file.kind === "component") {
        return file.component.family ? [file.component.family] : [];
      }
      return file.kind === "index" && file.family ? [file.family] : [];
    });

    expect(families).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          facts: expect.objectContaining({
            events: expect.objectContaining({
              openChange: expect.objectContaining({
                detailsType: "DialogOpenChangeDetails",
                name: "openChange",
              }),
            }),
            setter: { method: "setOpen", options: { emit: false } },
          }),
          kind: "native-overlay",
        }),
      ]),
    );
    expect(output.files.map((file) => file.path)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/Portal|Viewport/)]),
    );
  });

  it("generates compiler-valid Primitive output with synchronous cancel-before-model ordering", async () => {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-dialog-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "dialog");
    if (!entry) throw new Error("Dialog Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "dialog");
    const files = await Promise.all(
      [
        "DialogBackdrop.vue",
        "DialogClose.vue",
        "DialogDescription.vue",
        "DialogPopup.vue",
        "DialogRoot.vue",
        "DialogTitle.vue",
        "DialogTrigger.vue",
      ].map(async (name) => [name, await readFile(path.join(directory, name), "utf8")] as const),
    );
    for (const [name, source] of files) {
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
    const root = Object.fromEntries(files)["DialogRoot.vue"]!;
    expect(root).toMatch(
      /emit\("openChange", nextOpen, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:open", nextOpen\);/,
    );
    expect(root).toContain("instance.setOpen(nextOpen, { emit: false });");
    expect(root).toContain("onCloseComplete: handleCloseComplete");
    expect(root).toContain("ownedInstance.destroy()");
    expect(await readFile(path.join(directory, "index.ts"), "utf8")).not.toMatch(/Portal|Viewport/);
  });

  it("generates Styled Dialog's backdrop fallback, Popup tree, close affordance, model, and CSS", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-dialog-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["dialog"], outputDir: "styled", repoRoot });

    const root = await readFile(path.join(repoRoot, "styled/dialog/Dialog.vue"), "utf8");
    const content = await readFile(path.join(repoRoot, "styled/dialog/DialogContent.vue"), "utf8");
    const trigger = await readFile(path.join(repoRoot, "styled/dialog/DialogTrigger.vue"), "utf8");
    const close = await readFile(path.join(repoRoot, "styled/dialog/DialogClose.vue"), "utf8");
    const styles = await readFile(path.join(repoRoot, "styled/dialog/styles.css"), "utf8");

    expect(root).toContain(':open="open"');
    expect(root).toContain('@update:open="emit(&quot;update:open&quot;, $event)"');
    expect(root).toContain('@open-change="handleOpenChange"');
    expect(root).toContain('@close-complete="handleCloseComplete"');
    expect(content).toContain('<slot name="backdrop">');
    expect(content).toContain("<DialogPrimitive.DialogBackdrop");
    expect(content).toContain("<DialogPrimitive.DialogPopup");
    expect(content).toContain("data-sw-dialog-close");
    expect(content).toContain('data-slot="dialog-content"');
    expect(content).toContain('<path d="M18 6l-12 12" />');
    expect(content).toContain('<path d="M6 6l12 12" />');
    expect(content).not.toContain('<path d="M5 12l5 5l10 -10" />');
    for (const [name, source] of [
      ["DialogTrigger", trigger],
      ["DialogClose", close],
    ] as const) {
      expect(source).toContain(`const AsChild${name.slice("Dialog".length)} = defineComponent`);
      expect(source).toContain("cloneVNode(child, mergeProps(");
      expect(source).toContain('typeof child.type !== "string"');
      expect(source).toContain("ref: setElement");
      expect(source).not.toContain("<div\n      :class=");
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(trigger).toContain('"data-sw-dialog-trigger": ""');
    expect(trigger).toContain('"data-sw-dialog-target-id": targetId');
    expect(close).toContain('"data-sw-dialog-close": ""');
    expect(styles).toContain("--nested-offset");
  });
});
