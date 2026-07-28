import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { collapsibleRuntimeAdapterContract } from "../../contracts/primitive/components/collapsible.js";
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

describe("generated Vue Collapsible", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Collapsible through disclosure-presence facts", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(collapsibleRuntimeAdapterContract),
    );

    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              facts: expect.objectContaining({
                event: expect.objectContaining({
                  detailsType: "CollapsibleOpenChangeDetails",
                  name: "openChange",
                  valueProperty: "open",
                }),
                openGetter: "getOpen",
                setter: { method: "setOpen", options: { emit: false } },
              }),
              kind: "disclosure-presence",
              part: "root",
            }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic compiler-valid Primitive output from the registered family", async () => {
    const first = await generateCollapsible();
    const second = await generateCollapsible();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first)) {
      if (name === "index") continue;
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(first.root).toContain("onOpenChange: handleOpenChange");
    expect(first.root).toMatch(
      /emit\("openChange", nextOpen, detail\);[\s\S]*detail\.isCanceled[\s\S]*emit\("update:open", nextOpen\);/,
    );
    expect(first.root).not.toContain("queueMicrotask");
    expect(first.root).not.toContain("instanceGeneration");
    expect(first.root).toContain('emit("openChange", nextOpen, detail);');
    expect(first.root).toContain("if (detail.isCanceled) return;");
    expect(first.root).toContain('emit("update:open", nextOpen);');
    expect(first.root).toContain("instance.setOpen(nextOpen, { emit: false });");
    expect(first.root).toContain("watch(() => props.disabled, setupRuntime");
    expect(first.trigger).toContain("cloneVNode(child, mergeProps(");
    expect(first.trigger).toContain("exactly one native element VNode");
    expect(first.trigger).toContain('"data-sw-collapsible-trigger": ""');
    expect(first.panel).toContain(`:hidden="props.hiddenUntilFound ? 'until-found' : true"`);
    expect(first.index).toContain("const Collapsible =");
    expect(first.index).toContain("CollapsibleOpenChangeDetails");

    await expect(first.root).toBe(
      await readFile(
        path.join(process.cwd(), "packages/vue/src/collapsible/CollapsibleRoot.vue"),
        "utf8",
      ),
    );
  });

  it("generates Styled Collapsible with named open model and canonical slots", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-collapsible-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({
      groups: ["collapsible"],
      outputDir: "styled",
      repoRoot,
    });

    const root = await readFile(path.join(repoRoot, "styled/collapsible/Collapsible.vue"), "utf8");
    const trigger = await readFile(
      path.join(repoRoot, "styled/collapsible/CollapsibleTrigger.vue"),
      "utf8",
    );
    const content = await readFile(
      path.join(repoRoot, "styled/collapsible/CollapsibleContent.vue"),
      "utf8",
    );

    for (const [name, source] of Object.entries({ root, trigger, content })) {
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(root).toContain("open = undefined");
    expect(root).toContain(':open="open"');
    expect(root).toContain('@update:open="emit(&quot;update:open&quot;, $event)"');
    expect(root).toContain('@open-change="handleOpenChange"');
    expect(root).toContain('data-slot="collapsible"');
    expect(trigger).toContain('data-slot="collapsible-trigger"');
    expect(content).toContain('data-slot="collapsible-content"');
  });

  async function generateCollapsible(): Promise<{
    index: string;
    panel: string;
    root: string;
    trigger: string;
  }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-collapsible-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "collapsible",
    );
    if (!entry) throw new Error("Collapsible Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "collapsible");
    return {
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      panel: await readFile(path.join(directory, "CollapsiblePanel.vue"), "utf8"),
      root: await readFile(path.join(directory, "CollapsibleRoot.vue"), "utf8"),
      trigger: await readFile(path.join(directory, "CollapsibleTrigger.vue"), "utf8"),
    };
  }
});
