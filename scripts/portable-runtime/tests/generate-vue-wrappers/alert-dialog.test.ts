import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { alertDialogRuntimeAdapterContract } from "../../contracts/primitive/components/alert-dialog.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Alert Dialog", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates compiler-valid Primitive anatomy with delayed owner-scoped Teleport", async () => {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-alert-dialog-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === alertDialogRuntimeAdapterContract.component,
    );
    if (!entry) throw new Error("Alert Dialog Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "alert-dialog");
    const names = [
      "AlertDialogBackdrop.vue",
      "AlertDialogClose.vue",
      "AlertDialogDescription.vue",
      "AlertDialogPopup.vue",
      "AlertDialogPortal.vue",
      "AlertDialogRoot.vue",
      "AlertDialogTitle.vue",
      "AlertDialogTrigger.vue",
      "AlertDialogViewport.vue",
    ];
    const files = Object.fromEntries(
      await Promise.all(
        names.map(
          async (name) => [name, await readFile(path.join(directory, name), "utf8")] as const,
        ),
      ),
    );
    for (const [name, source] of Object.entries(files)) {
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }

    const root = files["AlertDialogRoot.vue"]!;
    const portal = files["AlertDialogPortal.vue"]!;
    expect(root).toContain("provide(AlertDialogContext");
    expect(root).toContain("mounted.value = false");
    expect(root).toContain("await nextTick()");
    expect(root).toContain("const recreating = recreatedOpen !== undefined");
    expect(root).toContain("instance.setOpen(true, { emit: false });");
    expect(root).not.toContain("recreatedReturnFocus");
    expect(root).not.toContain("document.activeElement");
    expect(root).not.toContain(".focus(");
    expect(root).toMatch(
      /emit\("openChange", nextOpen, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:open", nextOpen\);/,
    );
    expect(root).toContain("instance.setOpen(nextOpen, { emit: false });");
    expect(portal).toContain("container?: string | HTMLElement");
    expect(portal).toContain(':disabled="placement.disabled.value"');
    expect(portal).toContain('data-sw-portal-placement="framework"');
    expect(portal).toContain("root.registerPortal(owner, null)");
    expect(portal).toContain("data-sw-alert-dialog-portal");
    expect(files["AlertDialogPopup.vue"]).toContain('role="alertdialog"');
  });

  it("generates Styled model, Popup tree, and strict Button-composed actions", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-alert-dialog-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({
      groups: ["alert-dialog"],
      outputDir: "styled",
      repoRoot,
    });

    const directory = path.join(repoRoot, "styled/alert-dialog");
    const root = await readFile(path.join(directory, "AlertDialog.vue"), "utf8");
    const content = await readFile(path.join(directory, "AlertDialogContent.vue"), "utf8");
    const trigger = await readFile(path.join(directory, "AlertDialogTrigger.vue"), "utf8");
    const action = await readFile(path.join(directory, "AlertDialogAction.vue"), "utf8");
    const cancel = await readFile(path.join(directory, "AlertDialogCancel.vue"), "utf8");

    expect(root).toContain(':open="open"');
    expect(root).toContain('@update:open="emit(&quot;update:open&quot;, $event)"');
    expect(root).toContain('@open-change="handleOpenChange"');
    expect(content).toContain("<AlertDialogPrimitive.AlertDialogBackdrop");
    expect(content).toContain("<AlertDialogPrimitive.AlertDialogPopup");
    expect(content).toContain('role="alertdialog"');
    for (const [part, source] of [
      ["Trigger", trigger],
      ["Action", action],
      ["Cancel", cancel],
    ] as const) {
      expect(source).toContain(`const AsChild${part} = defineComponent`);
      expect(source).toContain("cloneVNode(child, mergeProps(");
      expect(source).toContain('typeof child.type !== "string"');
      expect(source).toContain("ref: setElement");
      expect(() => assertVueSfcCompiles(source, `AlertDialog${part}.vue`)).not.toThrow();
    }
    expect(action).toContain("alertDialogActionAsChild");
    expect(action).not.toContain("ButtonHTMLAttributes");
    expect(action).toContain("<Button");
    expect(action).toContain('data-slot="alert-dialog-action"');
    expect(cancel).toContain("alertDialogCancelAsChild");
    expect(cancel).not.toContain("ButtonHTMLAttributes");
    expect(cancel).toContain('data-slot="alert-dialog-cancel"');
    expect(trigger).toContain("ButtonHTMLAttributes");
  });
});
