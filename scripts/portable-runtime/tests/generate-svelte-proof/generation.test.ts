import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compile } from "svelte/compiler";

import { afterEach, describe, expect, it } from "vitest";
import { generateSveltePrimitiveWrappers } from "../../generate-svelte-wrappers.js";
import { printSveltePortalPlacement } from "../../renderers/framework-adapters/svelte/portal-placement.js";
import { generateSveltePrimitivePackage } from "../../renderers/framework-adapters/svelte/primitive-package.js";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("Svelte Button proof generation", () => {
  it("generates the current Primitive inventory deterministically and removes stale files", async () => {
    const outputRoot = await createTemporaryRoot();
    await generateSveltePrimitiveWrappers({ outputRoot });
    const first = await readTree(outputRoot);
    const expected = await readTree("packages/svelte/src");
    expect(first).toEqual(expected);
    await writeFile(path.join(outputRoot, "button/stale.ts"), "stale output");
    await generateSveltePrimitiveWrappers({ outputRoot });
    expect(await readTree(outputRoot)).toEqual(first);
  });

  it("compiles the generated Button for client and server without diagnostics", async () => {
    const source = await readFile(
      path.join(process.cwd(), "packages/svelte/src/button/ButtonRoot.svelte"),
      "utf8",
    );

    expect(source).not.toContain("child?: Snippet");
    expect(source).not.toContain("{#if child}");
    expect(source).toContain("{@attach attachRef}");

    for (const generate of ["client", "server"] as const) {
      const result = compile(source, {
        filename: "ButtonRoot.svelte",
        generate,
        modernAst: true,
      });
      expect(result.warnings).toEqual([]);
      expect(result.js.code).not.toHaveLength(0);
      expect(result.js.code).not.toContain("console.warn");
    }
  });
});

describe("Svelte Checkbox proof generation", () => {
  it.each([
    ["theme", ["index.ts", "theme/index.ts"]],
    ["button", ["button/ButtonRoot.svelte", "button/index.ts", "index.ts"]],
    [
      "checkbox",
      [
        "_internal/ref-attachment.ts",
        "checkbox/CheckboxGroupContext.svelte.ts",
        "checkbox/CheckboxIndicator.svelte",
        "checkbox/CheckboxRoot.svelte",
        "checkbox/index.ts",
        "index.ts",
      ],
    ],
    [
      "select",
      [
        "_internal/portal-document-observer.ts",
        "_internal/portal-placement.ts",
        "_internal/ref-attachment.ts",
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

  it("rejects duplicate package identities before removing existing output", async () => {
    const outputRoot = await createTemporaryRoot();
    await writeFile(path.join(outputRoot, "retained.txt"), "keep existing output");
    await expect(
      generateSveltePrimitivePackage({
        components: ["theme", "theme"],
        generatePrimitiveEntries: async () => {
          throw new Error("caller must not run");
        },
        generatedBy: "Svelte package ownership test",
        outputRoot,
      }),
    ).rejects.toThrow(/duplicate component identities/);
    expect(await readFile(path.join(outputRoot, "retained.txt"), "utf8")).toBe(
      "keep existing output",
    );
  });

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
      "checkbox/CheckboxGroupContext.svelte.ts",
      "checkbox/CheckboxIndicator.svelte",
      "checkbox/CheckboxRoot.svelte",
      "checkbox/index.ts",
    ]);
    const root = tree.get("checkbox/CheckboxRoot.svelte") ?? "";
    const indicator = tree.get("checkbox/CheckboxIndicator.svelte") ?? "";
    expect(root).toContain("checked = $bindable()");

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

describe("Svelte Carousel proof generation", () => {
  it("generates and compiles the engine-viewport family from neutral facts", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "carousel",
    );
    expect(entry).toBeDefined();

    await entry!.generateTarget({
      componentHeader: "<!-- carousel proof -->\n",
      moduleHeader: "/** carousel proof */\n",
      outputRoot,
      target: "svelte",
    });

    const tree = await readTree(path.join(outputRoot, "carousel"));
    expect([...tree.keys()]).toEqual([
      "CarouselContainer.svelte",
      "CarouselItem.svelte",
      "CarouselNext.svelte",
      "CarouselPrevious.svelte",
      "CarouselRoot.svelte",
      "CarouselViewport.svelte",
      "index.ts",
    ]);
    expect(tree.get("CarouselRoot.svelte")).toContain("createCarousel");
    expect(tree.get("CarouselRoot.svelte")).toContain("instance.reInit");

    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const) {
        expect(compile(source, { filename: file, generate, modernAst: true }).warnings).toEqual([]);
      }
    }
  });
});

describe("Svelte Select proof generation", () => {
  it("prints attachment-owned framework placement through the Runtime portal policy", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "select",
    );
    expect(entry).toBeDefined();

    await entry!.generateTarget({
      componentHeader: "<!-- select portal proof -->\n",
      moduleHeader: "/** select portal proof */\n",
      outputRoot,
      target: "svelte",
    });

    const portal = await readFile(path.join(outputRoot, "select/SelectPortal.svelte"), "utf8");
    expect(portal).toContain("resolvePortalPlacement");
    expect(portal).toContain("reportPortalPlacement");
    const helper = printSveltePortalPlacement();
    expect(helper).toContain('mode: "framework"');
    expect(portal).toContain('data-sw-portal-placement="framework"');
    expect(portal).toContain("const attachPortal: Attachment<HTMLDivElement>");
    expect(portal).toContain("createPortalPlacement(element,");
    expect(helper).toContain("parent.insertBefore(element, next)");
    expect(portal).toContain("restore();");
    expect(helper).toMatch(
      /reportPortalPlacement\(element, \{ ready: false, target \}\)[\s\S]*move\(target\)[\s\S]*reportPortalPlacement\(element, \{ ready: true, target \}\)/,
    );
    expect(portal).not.toContain("document.querySelector(container)");

    for (const generate of ["client", "server"] as const) {
      expect(
        compile(portal, {
          filename: "SelectPortal.svelte",
          generate,
          modernAst: true,
        }).warnings,
      ).toEqual([]);
    }
  });

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

describe("Svelte Color Picker proof generation", () => {
  it("generates and compiles all 23 Color Picker parts and the target context", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "color-picker",
    );
    expect(entry).toBeDefined();
    await entry!.generateTarget({
      componentHeader: "<!-- Color Picker proof -->\n",
      moduleHeader: "/** Color Picker proof */\n",
      outputRoot,
      target: "svelte",
    });
    const tree = await readTree(path.join(outputRoot, "color-picker"));
    expect(tree.size).toBe(25);
    expect(tree.has("context.ts")).toBe(true);
    expect(tree.has("index.ts")).toBe(true);
    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const)
        expect(compile(source, { filename: file, generate }).warnings).toEqual([]);
    }
  });
});

describe("Svelte Sidebar proof generation", () => {
  it("generates and compiles all five Sidebar parts and their semantic helpers", async () => {
    const outputRoot = await createTemporaryRoot();
    const entry = getPrimitiveGeneratorEntries().find(
      (candidate) => candidate.component === "sidebar",
    );
    expect(entry).toBeDefined();
    await entry!.generateTarget({
      componentHeader: "<!-- Sidebar proof -->\n",
      moduleHeader: "/** Sidebar proof */\n",
      outputRoot,
      target: "svelte",
    });
    const tree = await readTree(path.join(outputRoot, "sidebar"));
    expect(tree.size).toBe(7);
    expect(tree.has("SidebarContext.ts")).toBe(true);
    expect(tree.has("index.ts")).toBe(true);
    for (const [file, source] of tree) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const)
        expect(compile(source, { filename: file, generate }).warnings).toEqual([]);
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
