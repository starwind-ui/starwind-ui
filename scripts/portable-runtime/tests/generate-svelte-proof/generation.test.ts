import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";

import { checkSvelteWrappers } from "../../check-svelte-wrappers.js";
import { generateSveltePrimitiveWrappers } from "../../generate-svelte-wrappers.js";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";
import { generateSveltePrimitivePackage } from "../../renderers/framework-adapters/svelte/primitive-package.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("Svelte Button proof generation", () => {
  it("generates Button deterministically from its registered Adapter Output Model", async () => {
    const outputRoot = await createTemporaryRoot();
    const protectedTargetRoots = [
      "packages/astro/src",
      "packages/react/src",
      "packages/vue/src",
    ] as const;
    const protectedTargetsBefore = await Promise.all(
      protectedTargetRoots.map((root) => readTree(path.join(process.cwd(), root))),
    );

    await generateSveltePrimitiveWrappers({ outputRoot });
    const first = await readTree(outputRoot);
    await generateSveltePrimitiveWrappers({ outputRoot });
    const second = await readTree(outputRoot);

    expect([...first.keys()]).toEqual([
      "accordion/AccordionHeader.svelte",
      "accordion/AccordionItem.svelte",
      "accordion/AccordionItemContext.ts",
      "accordion/AccordionPanel.svelte",
      "accordion/AccordionRoot.svelte",
      "accordion/AccordionTrigger.svelte",
      "accordion/index.ts",
      "button/ButtonRoot.svelte",
      "button/index.ts",
      "checkbox/CheckboxIndicator.svelte",
      "checkbox/CheckboxRoot.svelte",
      "checkbox/index.ts",
      "dialog/DialogBackdrop.svelte",
      "dialog/DialogClose.svelte",
      "dialog/DialogDescription.svelte",
      "dialog/DialogPopup.svelte",
      "dialog/DialogRoot.svelte",
      "dialog/DialogTitle.svelte",
      "dialog/DialogTrigger.svelte",
      "dialog/index.ts",
      "index.ts",
      "select/SelectGroup.svelte",
      "select/SelectGroupLabel.svelte",
      "select/SelectIcon.svelte",
      "select/SelectItem.svelte",
      "select/SelectItemIndicator.svelte",
      "select/SelectItemText.svelte",
      "select/SelectLabel.svelte",
      "select/SelectList.svelte",
      "select/SelectPopup.svelte",
      "select/SelectPortal.svelte",
      "select/SelectPositioner.svelte",
      "select/SelectRoot.svelte",
      "select/SelectScrollDownArrow.svelte",
      "select/SelectScrollUpArrow.svelte",
      "select/SelectSeparator.svelte",
      "select/SelectTrigger.svelte",
      "select/SelectValue.svelte",
      "select/index.ts",
      "slider/SliderControl.svelte",
      "slider/SliderIndicator.svelte",
      "slider/SliderLabel.svelte",
      "slider/SliderRoot.svelte",
      "slider/SliderThumb.svelte",
      "slider/SliderTrack.svelte",
      "slider/index.ts",
    ]);
    expect(second).toEqual(first);

    const retainedPaths = [...first.keys()].filter((file) =>
      /^(?:button|checkbox|select)\//.test(file),
    );
    const expansionPaths = [...first.keys()].filter((file) =>
      /^(?:accordion|dialog|slider)\//.test(file),
    );
    const retainedBefore = new Map(retainedPaths.map((file) => [file, first.get(file)!]));
    const expansionBefore = new Map(expansionPaths.map((file) => [file, first.get(file)!]));

    await Promise.all(
      ["accordion", "dialog", "slider"].map((component) =>
        rm(path.join(outputRoot, component), { force: true, recursive: true }),
      ),
    );
    const afterCohortDeletion = await readTree(outputRoot);
    expect(new Map(retainedPaths.map((file) => [file, afterCohortDeletion.get(file)!]))).toEqual(
      retainedBefore,
    );
    expect(expansionPaths.some((file) => afterCohortDeletion.has(file))).toBe(false);

    await generateSveltePrimitiveWrappers({ outputRoot });
    const restored = await readTree(outputRoot);
    expect(restored).toEqual(first);
    expect(new Map(expansionPaths.map((file) => [file, restored.get(file)!]))).toEqual(
      expansionBefore,
    );
    expect(
      await Promise.all(
        protectedTargetRoots.map((root) => readTree(path.join(process.cwd(), root))),
      ),
    ).toEqual(protectedTargetsBefore);

    const component = first.get("button/ButtonRoot.svelte") ?? "";
    expect(component).toContain("$props()");
    expect(component).toContain("{@render children?.()}");
    expect(component).toContain("{@attach attachRuntime}");
    expect(component.match(/<button\b/g)).toHaveLength(1);
    expect(component).not.toContain("$bindable");
  });

  it("compiles the generated Button for client and server without diagnostics", async () => {
    const source = await readFile(
      path.join(process.cwd(), "packages/svelte/src/button/ButtonRoot.svelte"),
      "utf8",
    );

    for (const generate of ["client", "server"] as const) {
      const result = compile(source, {
        filename: "ButtonRoot.svelte",
        generate,
        modernAst: true,
      });
      expect(result.warnings).toEqual([]);
      expect(result.js.code).not.toHaveLength(0);
    }
  });

  it("keeps the committed private fixture at the generator fixed point", async () => {
    await expect(checkSvelteWrappers()).resolves.toBeUndefined();
  });
});

describe("Svelte Checkbox proof generation", () => {
  it.each([
    ["button", ["button/ButtonRoot.svelte", "button/index.ts", "index.ts"]],
    [
      "checkbox",
      [
        "checkbox/CheckboxIndicator.svelte",
        "checkbox/CheckboxRoot.svelte",
        "checkbox/index.ts",
        "index.ts",
      ],
    ],
    [
      "select",
      [
        "index.ts",
        "select/SelectGroup.svelte",
        "select/SelectGroupLabel.svelte",
        "select/SelectIcon.svelte",
        "select/SelectItem.svelte",
        "select/SelectItemIndicator.svelte",
        "select/SelectItemText.svelte",
        "select/SelectLabel.svelte",
        "select/SelectList.svelte",
        "select/SelectPopup.svelte",
        "select/SelectPortal.svelte",
        "select/SelectPositioner.svelte",
        "select/SelectRoot.svelte",
        "select/SelectScrollDownArrow.svelte",
        "select/SelectScrollUpArrow.svelte",
        "select/SelectSeparator.svelte",
        "select/SelectTrigger.svelte",
        "select/SelectValue.svelte",
        "select/index.ts",
      ],
    ],
  ] as const)(
    "emits exactly the requested %s package tree through the caller seam",
    async (component, expectedPaths) => {
      const outputRoot = await createTemporaryRoot();
      let callbackInvocations = 0;

      await generateSveltePrimitivePackage({
        components: [component],
        generatePrimitiveEntries: async ({ componentHeader, moduleHeader, outputRoot }) => {
          callbackInvocations += 1;
          const entry = getPrimitiveGeneratorEntries().find(
            (candidate) => candidate.component === component,
          );
          expect(entry).toBeDefined();
          await entry!.generateTarget({
            componentHeader,
            moduleHeader,
            outputRoot,
            target: "svelte",
          });
        },
        generatedBy: "Svelte package ownership test",
        outputRoot,
      });

      expect(callbackInvocations).toBe(1);
      expect([...(await readTree(outputRoot)).keys()]).toEqual(expectedPaths);
    },
  );

  it("rejects an unsupported requested package entry before invoking the caller seam", async () => {
    const outputRoot = await createTemporaryRoot();
    let callbackInvocations = 0;

    await expect(
      generateSveltePrimitivePackage({
        components: ["not-in-the-proof"],
        generatePrimitiveEntries: async () => {
          callbackInvocations += 1;
        },
        generatedBy: "Svelte package ownership test",
        outputRoot,
      }),
    ).rejects.toThrow('cannot emit unsupported component "not-in-the-proof"');
    expect(callbackInvocations).toBe(0);
  });

  it("generates the Boolean family Root, Indicator, and index without handwritten source", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "checkbox",
    );
    expect(entry).toBeDefined();

    await entry!.generateTarget({
      componentHeader: "<!-- checkbox proof -->\n",
      moduleHeader: "/** checkbox proof */\n",
      outputRoot,
      target: "svelte",
    });

    const tree = await readTree(outputRoot);
    expect([...tree.keys()]).toEqual([
      "checkbox/CheckboxIndicator.svelte",
      "checkbox/CheckboxRoot.svelte",
      "checkbox/index.ts",
    ]);
    const root = tree.get("checkbox/CheckboxRoot.svelte") ?? "";
    const indicator = tree.get("checkbox/CheckboxIndicator.svelte") ?? "";
    expect(root).toContain("checked = $bindable()");
    expect(root).toMatch(
      /onCheckedChange\?\.[\s\S]*detail\.isCanceled[\s\S]*checked = nextChecked/,
    );
    expect(root).toContain("getContext");
    expect(root).toContain("setContext");
    expect(root).toContain("createCheckbox");
    expect(indicator).toContain("keepMounted");
    expect(indicator).toContain("{@render children?.()}");

    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const) {
        expect(compile(source, { filename: file, generate, modernAst: true }).warnings).toEqual([]);
      }
    }
  });
});

describe("Svelte Accordion proof generation", () => {
  it("generates and compiles the repeated-disclosure family from one semantic projector", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "accordion",
    );
    expect(entry).toBeDefined();

    await entry!.generateTarget({
      componentHeader: "<!-- accordion proof -->\n",
      moduleHeader: "/** accordion proof */\n",
      outputRoot,
      target: "svelte",
    });

    const tree = await readTree(path.join(outputRoot, "accordion"));
    expect([...tree.keys()]).toEqual([
      "AccordionHeader.svelte",
      "AccordionItem.svelte",
      "AccordionItemContext.ts",
      "AccordionPanel.svelte",
      "AccordionRoot.svelte",
      "AccordionTrigger.svelte",
      "index.ts",
    ]);
    expect(tree.get("AccordionRoot.svelte")).toMatch(
      /onValueChange\?\.\(nextValue, detail\)[\s\S]*detail\.isCanceled[\s\S]*value = nextValue/,
    );
    expect(tree.get("AccordionItem.svelte")).toContain("setAccordionItemContext");
    expect(tree.get("AccordionTrigger.svelte")).toContain("getAccordionItemContext");
    expect(tree.get("AccordionPanel.svelte")).toContain('style:animation="none"');
    expect(tree.get("AccordionPanel.svelte")).not.toContain('style="animation: none"');

    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const) {
        expect(compile(source, { filename: file, generate, modernAst: true }).warnings).toEqual([]);
      }
    }
  });
});

describe("Svelte Dialog proof generation", () => {
  it("generates and compiles the native-overlay family without portal-only parts", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "dialog",
    );
    expect(entry).toBeDefined();

    await entry!.generateTarget({
      componentHeader: "<!-- dialog proof -->\n",
      moduleHeader: "/** dialog proof */\n",
      outputRoot,
      target: "svelte",
    });

    const tree = await readTree(path.join(outputRoot, "dialog"));
    expect([...tree.keys()]).toEqual([
      "DialogBackdrop.svelte",
      "DialogClose.svelte",
      "DialogDescription.svelte",
      "DialogPopup.svelte",
      "DialogRoot.svelte",
      "DialogTitle.svelte",
      "DialogTrigger.svelte",
      "index.ts",
    ]);
    expect(tree.get("DialogRoot.svelte")).toMatch(
      /onOpenChange\?\.\(nextOpen, detail\)[\s\S]*detail\.isCanceled[\s\S]*open = nextOpen/,
    );
    expect(tree.get("DialogRoot.svelte")).toContain('setOpen(nextOpen, {"emit":false})');
    expect(tree.get("DialogPopup.svelte")).toContain("<dialog");
    expect([...tree.keys()].join("\n")).not.toMatch(/Portal|Viewport/);

    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const) {
        expect(compile(source, { filename: file, generate, modernAst: true }).warnings).toEqual([]);
      }
    }
  });
});

describe("Svelte Slider proof generation", () => {
  it("generates and compiles the range-control family with nested native range inputs", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "slider",
    );
    expect(entry).toBeDefined();

    await entry!.generateTarget({
      componentHeader: "<!-- slider proof -->\n",
      moduleHeader: "/** slider proof */\n",
      outputRoot,
      target: "svelte",
    });

    const tree = await readTree(path.join(outputRoot, "slider"));
    expect([...tree.keys()]).toEqual([
      "SliderControl.svelte",
      "SliderIndicator.svelte",
      "SliderLabel.svelte",
      "SliderRoot.svelte",
      "SliderThumb.svelte",
      "SliderTrack.svelte",
      "index.ts",
    ]);
    expect(tree.get("SliderRoot.svelte")).toMatch(
      /onValueChange\?\.\(nextValue, detail\)[\s\S]*detail\.isCanceled[\s\S]*value = nextValue/,
    );
    expect(tree.get("SliderRoot.svelte")).toMatch(
      /instance\.refresh\(\)[\s\S]*instance\.setValue\(nextValue, \{"emit":false\}\)/,
    );
    expect(tree.get("SliderRoot.svelte")).toMatch(
      /const instance = untrack\(\(\) => createSlider\(root,[\s\S]*\)\);/,
    );
    expect(tree.get("SliderThumb.svelte")).toMatch(
      /<div[\s\S]*data-sw-slider-thumb[\s\S]*<input[\s\S]*data-sw-slider-input[\s\S]*type="range"/,
    );

    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const) {
        expect(compile(source, { filename: file, generate, modernAst: true }).warnings).toEqual([]);
      }
    }
  });
});

describe("Svelte Select proof generation", () => {
  it("generates and compiles every option-collection-overlay part from one semantic projector", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "select",
    );
    expect(entry).toBeDefined();

    await entry!.generateTarget({
      componentHeader: "<!-- select proof -->\n",
      moduleHeader: "/** select proof */\n",
      outputRoot,
      target: "svelte",
    });

    const tree = await readTree(path.join(outputRoot, "select"));
    expect(tree.size).toBe(18);
    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const) {
        expect(compile(source, { filename: file, generate, modernAst: true }).warnings).toEqual([]);
      }
    }
  });
});

async function createTemporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-proof-"));
  temporaryRoots.push(root);
  return root;
}

async function readTree(root: string): Promise<Map<string, string>> {
  const files = await listFiles(root);
  return new Map(
    await Promise.all(
      files.map(
        async (file) =>
          [path.relative(root, file).replaceAll("\\", "/"), await readFile(file, "utf8")] as const,
      ),
    ),
  );
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const candidate = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(candidate) : [candidate];
    }),
  );
  return files.flat().sort();
}
