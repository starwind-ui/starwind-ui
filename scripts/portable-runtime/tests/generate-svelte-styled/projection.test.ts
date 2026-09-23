import { sidebarStyledContract } from "../../contracts/styled/components/sidebar.js";
import { colorPickerStyledContract } from "../../contracts/styled/components/color-picker.js";
import { toastStyledContract } from "../../contracts/styled/components/toast.js";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { carouselStyledContract } from "../../contracts/styled/components/carousel.js";
import { buttonStyledContract } from "../../contracts/styled/components/button.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";
import { writeSvelteStyledOutput } from "../../renderers/framework-adapters/svelte/styled/writer.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
const options = { primitiveImportBase: "@starwind-ui/svelte" };

describe("Svelte Styled typed projection", () => {
  it("projects Sidebar native controls, owned Sheet bridge and CSS without changing the shared model", () => {
    const group = projectStyledOutputComponentGroup(sidebarStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(projectSvelteStyledGroup(group, options));
    expect(group).toEqual(before);
    expect(files.filter((file) => file.relativePath.endsWith(".svelte"))).toHaveLength(23);
    const content = (name: string) =>
      files.find((file) => file.relativePath === `sidebar/${name}`)!.content;
    expect(content("Sidebar.svelte")).toContain("bind:open={() => context.mobileOpen");
    expect(content("Sidebar.svelte")).toContain('data-sidebar={"mobile"}');
    expect(content("SidebarMenuButton.svelte")).toContain('import "./styles.css"');
    expect(content("SidebarMenuButton.svelte")).toContain('"data-sw-tooltip-trigger"');
    expect(content("SidebarMenuButton.svelte")).not.toContain("<TooltipTrigger");
    expect(content("SidebarTrigger.svelte")).toContain("{@render icon()}");
    const unknown = structuredClone(group.components[0]!);
    unknown.exportName = "SidebarUnknown";
    group.components.push(unknown);
    expect(() => projectSvelteStyledGroup(group, options)).toThrow(/missing part owner/);
  });
  it("projects Button without mutating the shared model or its framework filters", () => {
    const group = projectStyledOutputComponentGroup(buttonStyledContract);
    const before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, options);
    expect(group).toEqual(before);
    const files = renderSvelteStyledFiles(projection);
    expect(files.map((file) => file.relativePath)).toEqual([
      "button/Button.svelte",
      "button/variants.ts",
      "button/index.ts",
    ]);
    const source = files[0]!.content;
    expect(source).toContain('buttonAs === "a" || href !== undefined');
    expect(source).toContain("tabindex={disabled ? -1 : tabindex}");
    expect(source).toContain('from "@starwind-ui/svelte/button"');
    expect(source).not.toMatch(/React\.|on:|v-bind|@starwind-ui\/runtime/);
  });

  it("projects a changed structured Button expression and variant into output", () => {
    const group = projectStyledOutputComponentGroup(buttonStyledContract);
    const root = group.components[0]!.render[0]!;
    if (root.type !== "condition") throw new Error("Button contract changed");
    root.condition = 'buttonAs === "a"';
    group.variants[0]!.definition.defaultVariants = { variant: "primary", size: "sm" };
    const files = renderSvelteStyledFiles(projectSvelteStyledGroup(group, options));
    expect(files[0]!.content).toContain('{#if buttonAs === "a"}');
    expect(files[1]!.content).toContain('variant: "primary"');
  });

  it.each(["repeat", "icon"] as const)(
    "rejects unsupported structured node %s with the component file",
    (type) => {
      const group = projectStyledOutputComponentGroup(buttonStyledContract);
      group.components[0]!.render.push(
        type === "repeat"
          ? { type, each: "items", item: "item", children: [] }
          : { type, importName: "Icon", attrs: [] },
      );
      expect(() => projectSvelteStyledGroup(group, options)).toThrow(
        new RegExp(`button/Button\\.svelte: unsupported structured node "${type}"`),
      );
    },
  );

  it("rejects an unknown variant at its projection owner", () => {
    const group = projectStyledOutputComponentGroup(buttonStyledContract);
    group.variants = [];
    expect(() => projectSvelteStyledGroup(group, options)).toThrow(
      /button\/Button\.svelte.*unknown variant "button"/,
    );
  });

  it.each([
    ["unknown", "Root", /unsupported Primitive dependency "unknown"/],
    ["button", "Unknown", /unsupported Primitive part "button.Unknown"/],
  ])(
    "rejects missing Primitive dependency %s.%s before printing",
    (component, part, diagnostic) => {
      const group = projectStyledOutputComponentGroup(buttonStyledContract);
      group.components[0]!.render.push({
        type: "primitive",
        component,
        part,
        attrs: [],
        children: [],
        selfClosing: true,
      });
      expect(() => projectSvelteStyledGroup(group, options)).toThrow(diagnostic);
    },
  );

  it("keeps typed sibling recipe aliases and their defaults in the variant collection", () => {
    const group = projectStyledOutputComponentGroup(carouselStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(projectSvelteStyledGroup(group, options));
    expect(group).toEqual(before);
    const variants = files.find((file) => file.relativePath === "carousel/variants.ts")!.content;
    expect(variants).toContain('import { button as buttonVariants } from "../button/variants.js"');
    expect(variants).toContain("export const carouselControl = tv({ extend: buttonVariants");
    expect(variants).toContain('variant: "outline"');
    expect(variants).toContain('size: "icon"');
    expect(files.find((file) => file.relativePath === "carousel/index.ts")!.content).toMatch(
      /const CarouselVariants = \{[^}]*carouselControl/,
    );
    delete group.variantAliases![0]!.defaultVariants;
    expect(
      renderSvelteStyledFiles(projectSvelteStyledGroup(group, options)).find(
        (file) => file.relativePath === "carousel/variants.ts",
      )!.content,
    ).toContain("export const carouselControl: typeof buttonVariants = buttonVariants;");
  });

  it.each(["undeclared", "path", "duplicate", "local", "identifier"])(
    "rejects unsupported %s alias output",
    (shape) => {
      const group = projectStyledOutputComponentGroup(carouselStyledContract);
      const alias = group.variantAliases![0]!;
      if (shape === "undeclared") group.dependencies = { styledComponents: [] };
      if (shape === "path") alias.source = "../../outside/variants";
      if (shape === "duplicate") group.variantAliases!.push({ ...alias });
      if (shape === "local") alias.localName = "carousel";
      if (shape === "identifier") alias.importName = "button; invalid";
      expect(() => projectSvelteStyledGroup(group, options)).toThrow(/unsupported variant alias/);
    },
  );

  it("rejects a missing dependency recipe before replacing generated files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-alias-"));
    roots.push(root);
    await mkdir(path.join(root, "carousel"));
    await writeFile(path.join(root, "carousel/retained.txt"), "prior output");
    const contract = structuredClone(carouselStyledContract);
    contract.variantAliases!.carouselControl!.importName = "missingRecipe";
    await expect(
      writeSvelteStyledOutput({
        contracts: [buttonStyledContract, contract],
        roots: ["carousel"],
        generatedBy: "test",
        outputRoot: root,
        primitiveOutputRoot: root,
      }),
    ).rejects.toThrow(/missing variant alias recipe/);
    expect(await readFile(path.join(root, "carousel/retained.txt"), "utf8")).toBe("prior output");
  });

  it("projects Color Picker aliases, bindings, stock styles and supported editor repeats", () => {
    const group = projectStyledOutputComponentGroup(colorPickerStyledContract),
      before = structuredClone(group);
    const files = renderSvelteStyledFiles(projectSvelteStyledGroup(group, options));
    expect(group).toEqual(before);
    const root = files.find(
      (file) => file.relativePath === "color-picker/ColorPicker.svelte",
    )!.content;
    for (const name of ["value", "format", "open"])
      expect(root).toContain(`bind:${name}={${name}}`);
    const content = files.find(
      (file) => file.relativePath === "color-picker/ColorPickerContent.svelte",
    )!.content;
    expect(content).toContain("container={ownedPortalContainer}");
    expect(content).toContain("<PopoverPortal");
    const variants = files.find(
      (file) => file.relativePath === "color-picker/variants.ts",
    )!.content;
    for (const alias of group.variantAliases!)
      expect(variants).toContain(`export const ${alias.name}: typeof ${alias.localName}`);
    expect(files.find((file) => file.relativePath === "color-picker/styles.css")!.content).toBe(
      group.styles!.content.join("\n") + "\n",
    );
    expect(files.filter((file) => file.content.includes('import "./styles.css";'))).toHaveLength(6);
    group.components[1]!.render.push({
      type: "repeat",
      each: "unowned",
      item: "item",
      children: [],
    });
    expect(() => projectSvelteStyledGroup(group, options)).toThrow(
      /unsupported structured node "repeat"/,
    );
  });

  it("projects Toast facade, styles and six default templates from the contract", () => {
    const group = projectStyledOutputComponentGroup(toastStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(projectSvelteStyledGroup(group, options));
    expect(group).toEqual(before);
    const toaster = files.find((file) => file.relativePath === "toast/Toaster.svelte")!.content;
    expect(toaster).toContain('import "./styles.css";');
    for (const variant of ["default", "success", "error", "warning", "info", "loading"])
      expect(toaster).toContain(`variant={"${variant}"}`);
    expect(toaster).toContain("gap={gap}");
    expect(toaster).toContain("peek={peek}");
    expect(toaster).toContain("style={style}");
    expect(toaster).not.toContain("viewportStyle");
    expect(files.filter((file) => file.content.includes('import "./styles.css";'))).toHaveLength(1);
    expect(files.find((file) => file.relativePath === "toast/styles.css")!.content).toBe(
      group.styles!.content.join("\n") + "\n",
    );
    const index = files.find((file) => file.relativePath === "toast/index.ts")!.content;
    expect(index).toContain('export { toast } from "@starwind-ui/svelte/toast";');
    expect(index).toContain(
      'export type { ToastApi, ToastOptions, ToastPromiseOptions } from "@starwind-ui/svelte/toast";',
    );
    const relative = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "../primitives" }),
    );
    expect(relative.find((file) => file.relativePath === "toast/index.ts")!.content).toContain(
      'export { toast } from "../primitives/toast/index.js";',
    );
  });

  it.each(["component", "type", "value", "duplicate"])(
    "rejects an unsupported Toast facade %s",
    (shape) => {
      const group = projectStyledOutputComponentGroup(toastStyledContract);
      const facade = group.primitiveFacadeExports!;
      if (shape === "component") facade.component = "button";
      if (shape === "type") facade.types.push("UnknownToastType");
      if (shape === "value") facade.values = ["createToastManager"];
      if (shape === "duplicate") facade.values.push("toast");
      expect(() => projectSvelteStyledGroup(group, options)).toThrow(
        /unsupported Primitive facade/,
      );
    },
  );

  it.each(["missing", "owner"])("rejects a %s Toast stylesheet", (shape) => {
    const group = projectStyledOutputComponentGroup(toastStyledContract);
    if (shape === "missing") delete group.styles;
    else group.styles!.importFrom = ["ToastItem"];
    expect(() => projectSvelteStyledGroup(group, options)).toThrow(
      /requires the contract stylesheet on Toaster/,
    );
  });

  it("validates the whole projection before touching an existing generated group", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-invalid-"));
    roots.push(root);
    await mkdir(path.join(root, "button"));
    await writeFile(path.join(root, "button/retained.txt"), "prior output");
    const contract = structuredClone(buttonStyledContract);
    contract.components[0]!.render.push({
      type: "repeat",
      each: "items",
      item: "item",
      children: [],
    });
    await expect(
      writeSvelteStyledOutput({
        contracts: [contract],
        roots: ["button"],
        generatedBy: "test",
        outputRoot: root,
        primitiveOutputRoot: root,
      }),
    ).rejects.toThrow(/button\/Button\.svelte.*unsupported structured node "repeat"/);
    expect(await readFile(path.join(root, "button/retained.txt"), "utf8")).toBe("prior output");
  });
});
