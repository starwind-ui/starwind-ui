import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";
import { dialogRuntimeAdapterContract } from "../../contracts/primitive/components/dialog.js";
import { formatGeneratedOutput } from "../../format-generated-output.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { compactCode } from "../source-comparison.js";
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
    await formatGeneratedOutput([directory], process.cwd());
    const files = await readGeneratedDirectory(directory, true);
    const committed = await readGeneratedDirectory(
      path.join(process.cwd(), "packages/vue/src/dialog"),
    );
    expect(files).toEqual(committed);
    for (const [name, source] of Object.entries(files)) {
      if (!name.endsWith(".vue")) continue;
      expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
    const root = files["DialogRoot.vue"]!;
    expect(() => assertVueSfcCompiles(root, "Component.vue")).not.toThrow();

    for (const control of [files["DialogTrigger.vue"]!, files["DialogClose.vue"]!]) {
      expect(control).toContain(
        'import { useVueNativeControl } from "../_internal/native-control"',
      );
      expect(control).toContain("asChild?: boolean");
      expect(control).toContain("root?.requestRefresh()");
      expect(control).not.toContain("cloneVNode");
    }

    expect(files["index.ts"]).not.toMatch(/Portal|Viewport/);
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

    for (const control of [trigger, close]) {
      expect(control).toContain("defineComponent");
      expect(control).toContain("{ default: slots.default }");
      expect(control).toContain("watch(");
      expect(control).not.toContain("cloneVNode");
      expect(control).not.toContain("requestRefresh");
    }
    expect(compactCode(root)).toContain(compactCode(':open="open"'));
    expect(compactCode(root)).toContain(
      compactCode('@update:open="emit(&quot;update:open&quot;, $event)"'),
    );
    expect(compactCode(root)).toContain(compactCode('@open-change="handleOpenChange"'));
    expect(compactCode(root)).toContain(compactCode('@close-complete="handleCloseComplete"'));
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
      expect(source).toContain(`<DialogPrimitive.${name}`);
      expect(compactCode(source)).toContain(compactCode(':ref="setElement"'));
      expect(compactCode(source)).not.toContain(compactCode("<div\n      :class="));
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(compactCode(trigger)).toContain(compactCode(':target-id="targetId"'));
    expect(compactCode(trigger)).toContain(compactCode('data-slot="dialog-trigger"'));
    expect(close).toContain('data-slot="dialog-close"');
    expect(styles).toContain("--nested-offset");
  });
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
