import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  getPrimitiveFrameworkAdapterTargetsForComponent,
  resolveFrameworkAdapterPrimitiveSupport,
  resolvePrimitiveFrameworkAdapterTargetComponents,
} from "../renderers/framework-adapters/target-registry.js";
import { appendRuntimeTypeFacades, renderPrimitiveIndex } from "../renderers/primitive-index.js";
import { getPrimitivePackageExportNames } from "../renderers/primitive-inventory.js";

describe("partial Primitive Framework Adapter target generation", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("preserves full support for existing Astro and React targets", () => {
    const inventory = getPrimitivePackageExportNames();

    expect(resolvePrimitiveFrameworkAdapterTargetComponents("astro")).toEqual(inventory);
    expect(resolvePrimitiveFrameworkAdapterTargetComponents("react")).toEqual(inventory);
    expect(getPrimitiveFrameworkAdapterTargetsForComponent("theme")).toEqual([
      "astro",
      "react",
      "vue",
    ]);
  });

  it("resolves a declared subset in canonical inventory order", () => {
    const support = {
      components: ["select", "button", "checkbox"],
      kind: "subset",
    } as const;

    expect(resolveFrameworkAdapterPrimitiveSupport("vue", support)).toEqual([
      "button",
      "checkbox",
      "select",
    ]);
    expect(resolveFrameworkAdapterPrimitiveSupport("vue", support, ["select", "button"])).toEqual([
      "button",
      "select",
    ]);
  });

  it("rejects invalid declarations and requests with target/component diagnostics", () => {
    expect(() =>
      resolveFrameworkAdapterPrimitiveSupport("vue", { components: [], kind: "subset" }),
    ).toThrowError(
      'Primitive Framework Adapter target "vue" declares an empty supported component subset.',
    );
    expect(() =>
      resolveFrameworkAdapterPrimitiveSupport("vue", {
        components: ["button", "not-a-primitive"],
        kind: "subset",
      }),
    ).toThrowError(
      'Primitive Framework Adapter target "vue" declares unknown supported component "not-a-primitive".',
    );
    expect(() =>
      resolveFrameworkAdapterPrimitiveSupport("vue", {
        components: ["button", "button"],
        kind: "subset",
      }),
    ).toThrowError(
      'Primitive Framework Adapter target "vue" declares duplicate supported component "button".',
    );
    expect(() =>
      resolveFrameworkAdapterPrimitiveSupport(
        "vue",
        { components: ["button", "checkbox", "select"], kind: "subset" },
        ["unknown"],
      ),
    ).toThrowError(
      'Primitive Framework Adapter target "vue" requested unknown component "unknown".',
    );
    expect(() =>
      resolveFrameworkAdapterPrimitiveSupport(
        "vue",
        { components: ["button", "checkbox", "select"], kind: "subset" },
        ["theme"],
      ),
    ).toThrowError('Primitive Framework Adapter target "vue" does not support component "theme".');
  });

  it("limits root exports and Runtime facades to the resolved subset", async () => {
    const components = ["button", "checkbox", "select"];
    const index = renderPrimitiveIndex("// generated\n", components);

    expect(index).toContain('export * from "./button";');
    expect(index).toContain('export * from "./checkbox";');
    expect(index).toContain('export * from "./select";');
    expect(index).not.toContain('export * from "./theme";');
    expect(index).not.toContain('export * from "./dialog";');
    expect(index).toContain("CheckboxCheckedChangeDetails");
    expect(index).toContain("SelectOpenChangeDetails");
    expect(index).not.toContain("DialogOpenChangeDetails");

    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-partial-target-"));
    temporaryRoots.push(outputRoot);
    await Promise.all(
      components.map(async (component) => {
        const directory = path.join(outputRoot, component);
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, "index.ts"), `export const ${component} = {};\n`);
      }),
    );

    await appendRuntimeTypeFacades(outputRoot, components);

    expect(await readFile(path.join(outputRoot, "checkbox", "index.ts"), "utf8")).toContain(
      "CheckboxCheckedChangeDetails",
    );
    expect(await readFile(path.join(outputRoot, "select", "index.ts"), "utf8")).toContain(
      "SelectValueChangeDetails",
    );
  });
});
