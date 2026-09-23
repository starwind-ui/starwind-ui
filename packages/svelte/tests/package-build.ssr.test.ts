import { readFile, rm, symlink } from "node:fs/promises";
import path from "node:path";
import * as SveltePackage from "@starwind-ui/svelte";
import * as AccordionPackage from "@starwind-ui/svelte/accordion";
import * as AlertDialogPackage from "@starwind-ui/svelte/alert-dialog";
import * as AvatarPackage from "@starwind-ui/svelte/avatar";
import * as ButtonPackage from "@starwind-ui/svelte/button";
import * as CarouselPackage from "@starwind-ui/svelte/carousel";
import * as CheckboxPackage from "@starwind-ui/svelte/checkbox";
import * as CheckboxGroupPackage from "@starwind-ui/svelte/checkbox-group";
import * as CollapsiblePackage from "@starwind-ui/svelte/collapsible";
import * as ColorPickerPackage from "@starwind-ui/svelte/color-picker";
import * as ComboboxPackage from "@starwind-ui/svelte/combobox";
import * as DialogPackage from "@starwind-ui/svelte/dialog";
import * as DrawerPackage from "@starwind-ui/svelte/drawer";
import * as FieldPackage from "@starwind-ui/svelte/field";
import * as FieldsetPackage from "@starwind-ui/svelte/fieldset";
import * as FormPackage from "@starwind-ui/svelte/form";
import * as InputPackage from "@starwind-ui/svelte/input";
import * as MenuPackage from "@starwind-ui/svelte/menu";
import * as NavigationMenuPackage from "@starwind-ui/svelte/navigation-menu";
import * as PopoverPackage from "@starwind-ui/svelte/popover";
import * as PreviewCardPackage from "@starwind-ui/svelte/preview-card";
import * as ProgressPackage from "@starwind-ui/svelte/progress";
import * as RadioPackage from "@starwind-ui/svelte/radio";
import * as RadioGroupPackage from "@starwind-ui/svelte/radio-group";
import * as ScrollAreaPackage from "@starwind-ui/svelte/scroll-area";
import * as SelectPackage from "@starwind-ui/svelte/select";
import * as SidebarPackage from "@starwind-ui/svelte/sidebar";
import * as SliderPackage from "@starwind-ui/svelte/slider";
import * as SwitchPackage from "@starwind-ui/svelte/switch";
import * as ThemePackage from "@starwind-ui/svelte/theme";
import * as ToastPackage from "@starwind-ui/svelte/toast";
import * as TogglePackage from "@starwind-ui/svelte/toggle";
import * as ToggleGroupPackage from "@starwind-ui/svelte/toggle-group";
import * as TooltipPackage from "@starwind-ui/svelte/tooltip";
import { render } from "svelte/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  consumerFamilies,
  createDistConsumer,
  type DistConsumer,
  openDistConsumer,
} from "./dist-consumer.js";
import {
  PRIMITIVE_NEGATIVE_FIXTURES,
  verifyNegativeConsumers,
  verifyPositiveConsumer,
} from "./verify-dist-consumer.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function createConsumer() {
  const consumer = await createDistConsumer();
  consumers.push(consumer);
  return consumer;
}

const componentPackages = {
  "color-picker": ColorPickerPackage,
  sidebar: SidebarPackage,
  combobox: ComboboxPackage,
  "navigation-menu": NavigationMenuPackage,
  menu: MenuPackage,
  field: FieldPackage,
  radio: RadioPackage,
  "radio-group": RadioGroupPackage,
  toggle: TogglePackage,
  "toggle-group": ToggleGroupPackage,
  "checkbox-group": CheckboxGroupPackage,
  switch: SwitchPackage,
  form: FormPackage,
  fieldset: FieldsetPackage,
  input: InputPackage,
  collapsible: CollapsiblePackage,
  "scroll-area": ScrollAreaPackage,
  progress: ProgressPackage,
  avatar: AvatarPackage,
  accordion: AccordionPackage,
  button: ButtonPackage,
  carousel: CarouselPackage,
  checkbox: CheckboxPackage,
  dialog: DialogPackage,
  drawer: DrawerPackage,
  popover: PopoverPackage,
  "preview-card": PreviewCardPackage,
  tooltip: TooltipPackage,
  "alert-dialog": AlertDialogPackage,
  select: SelectPackage,
  slider: SliderPackage,
  toast: ToastPackage,
} as const;

describe("private Svelte package build", () => {
  it("resolves the root and component subpath exports from processed output", () => {
    expect(SveltePackage.SidebarProvider).toBe(SidebarPackage.SidebarProvider);
    expect(SveltePackage.useSidebarContext).toBe(SidebarPackage.useSidebarContext);
    expect(SveltePackage.ColorPickerRoot).toBe(ColorPickerPackage.ColorPickerRoot);
    expect(SveltePackage.parseColor).toBe(ColorPickerPackage.parseColor);
    expect(SveltePackage.MenuRoot).toBe(MenuPackage.MenuRoot);
    expect(SveltePackage.FieldRoot).toBe(FieldPackage.FieldRoot);
    expect(SveltePackage.ToggleRoot).toBe(TogglePackage.ToggleRoot);
    expect(SveltePackage.ToggleGroupRoot).toBe(ToggleGroupPackage.ToggleGroupRoot);
    expect(SveltePackage.RadioRoot).toBe(RadioPackage.RadioRoot);
    expect(SveltePackage.RadioGroupRoot).toBe(RadioGroupPackage.RadioGroupRoot);
    expect(SveltePackage.CheckboxGroupRoot).toBe(CheckboxGroupPackage.CheckboxGroupRoot);
    expect(SveltePackage.InputRoot).toBe(InputPackage.InputRoot);
    expect(SveltePackage.CollapsibleRoot).toBe(CollapsiblePackage.CollapsibleRoot);
    expect(SveltePackage.ScrollAreaRoot).toBe(ScrollAreaPackage.ScrollAreaRoot);
    expect(SveltePackage.ProgressRoot).toBe(ProgressPackage.ProgressRoot);
    expect(SveltePackage.AvatarRoot).toBe(AvatarPackage.AvatarRoot);
    expect(SveltePackage.AccordionRoot).toBe(AccordionPackage.AccordionRoot);
    expect(SveltePackage.ButtonRoot).toBe(ButtonPackage.ButtonRoot);
    expect(SveltePackage.CarouselRoot).toBe(CarouselPackage.CarouselRoot);
    expect(SveltePackage.CheckboxRoot).toBe(CheckboxPackage.CheckboxRoot);
    expect(SveltePackage.DialogRoot).toBe(DialogPackage.DialogRoot);
    expect(SveltePackage.SelectRoot).toBe(SelectPackage.SelectRoot);
    expect(SveltePackage.SliderRoot).toBe(SliderPackage.SliderRoot);
    expect(SveltePackage.ToastRoot).toBe(ToastPackage.ToastRoot);
  });

  it("compiles and runs the built Theme facade in a dist-only consumer", async () => {
    expect(Object.keys(ThemePackage).sort()).toEqual(["getThemeInitScript", "initThemeController"]);
    expect(SveltePackage.getThemeInitScript).toBe(ThemePackage.getThemeInitScript);
    expect(SveltePackage.initThemeController).toBe(ThemePackage.initThemeController);
    const consumer = await createConsumer();
    await consumer.write({
      "Theme.svelte": `<script lang="ts">
import { getThemeInitScript, type ThemeInitScriptOptions } from "@starwind-ui/svelte/theme";
const options: ThemeInitScriptOptions = { defaultTheme: "system", storageKey: "private-theme" };
</script>
<output>{getThemeInitScript(options).length}</output>`,
      "theme.ts": `import { getThemeInitScript, initThemeController, type ThemeInitScriptOptions } from "@starwind-ui/svelte/theme";
import { getThemeInitScript as rootScript, initThemeController as rootInit, type ThemeInitScriptOptions as RootOptions } from "@starwind-ui/svelte";
const options: ThemeInitScriptOptions & RootOptions = { defaultTheme: "dark", storageKey: "private-theme", className: "dark" };
const script: string = rootScript(options) + getThemeInitScript(options);
const initialize: typeof initThemeController = rootInit;
const controller = () => initialize(document, { storageKey: options.storageKey });
// @ts-expect-error Theme values retain the Runtime union through the built facade.
getThemeInitScript({ defaultTheme: "invalid" });
void [script, controller];`,
      "theme.mjs": `import assert from "node:assert/strict";
import { getThemeInitScript, initThemeController } from "@starwind-ui/svelte/theme";
import { getThemeInitScript as runtimeScript, initThemeController as runtimeInit } from "@starwind-ui/runtime/theme";
assert.equal(globalThis.document, undefined);
assert.equal(getThemeInitScript, runtimeScript);
assert.equal(initThemeController, runtimeInit);
assert.match(getThemeInitScript({ storageKey: "private-theme" }), /private-theme/);
console.log(import.meta.resolve("@starwind-ui/svelte/theme"));`,
    });
    const result = await consumer.check();
    expect(result.code, result.output).toBe(0);
    expect(result.output).toMatch(/COMPLETED \d+ FILES 0 ERRORS 0 WARNINGS/);
    expect(await consumer.run("theme.mjs")).toContain(
      `${consumer.root}/node_modules/@starwind-ui/svelte/dist/theme/index.js`,
    );
  }, 60_000);

  it("emits processed declarations and external Svelte imports for every private subpath", async () => {
    const manifest = JSON.parse(await readFile("package.json", "utf8")) as {
      exports: Record<string, { default: string; svelte: string; types: string }>;
      peerDependencies: Record<string, string>;
      sideEffects: boolean;
    };

    expect(Object.keys(manifest.exports)).toEqual([
      ".",
      "./button",
      "./carousel",
      "./checkbox",
      "./select",
      "./accordion",
      "./dialog",
      "./sidebar",
      "./slider",
      "./toast",
      "./theme",
      "./avatar",
      "./progress",
      "./scroll-area",
      "./collapsible",
      "./input",
      "./form",
      "./fieldset",
      "./switch",
      "./checkbox-group",
      "./radio",
      "./radio-group",
      "./toggle",
      "./toggle-group",
      "./field",
      "./dropzone",
      "./input-otp",
      "./tabs",
      "./alert-dialog",
      "./drawer",
      "./popover",
      "./tooltip",
      "./preview-card",
      "./menu",
      "./context-menu",
      "./navigation-menu",
      "./color-picker",
      "./combobox",
    ]);
    expect(manifest.peerDependencies.svelte).toBe(">=5.29.0 <6");
    expect(manifest.sideEffects).toBe(false);

    await Promise.all(
      Object.entries(manifest.exports).flatMap(([subpath, target]) =>
        Object.values(target).map(async (file) => {
          const source = await readFile(file.slice(2), "utf8");
          expect(source.length, `${subpath}:${file}`).toBeGreaterThan(0);
        }),
      ),
    );

    for (const component of [
      "sidebar",
      "color-picker",
      "combobox",
      "navigation-menu",
      "menu",
      "alert-dialog",
      "drawer",
      "field",
      "radio",
      "radio-group",
      "toggle",
      "toggle-group",
      "checkbox-group",
      "switch",
      "form",
      "fieldset",
      "input",
      "collapsible",
      "scroll-area",
      "progress",
      "avatar",
      "accordion",
      "carousel",
      "dialog",
      "slider",
      "toast",
    ] as const) {
      const rootName =
        component === "sidebar"
          ? "SidebarProvider.svelte"
          : `${component
              .split("-")
              .map((word) => word[0]!.toUpperCase() + word.slice(1))
              .join("")}Root.svelte`;
      const source = await readFile(`dist/${component}/${rootName}`, "utf8");
      expect(source, component).toMatch(/from\s*["']svelte["']/);
      expect(source, component).not.toContain("node_modules/svelte");
      expect(componentPackages[component]).toHaveProperty(
        component === "sidebar"
          ? "SidebarProvider"
          : `${component
              .split("-")
              .map((word) => word[0]!.toUpperCase() + word.slice(1))
              .join("")}Root`,
      );
    }
  });

  it("compiles real dist-only Svelte consumers and records every SSR and type resolution", async () => {
    const consumer = await createConsumer();
    const rendered = await verifyPositiveConsumer(consumer);
    expect(Object.keys(rendered.provenance.modules)).toHaveLength(1 + consumerFamilies.length * 2);
    expect(
      JSON.parse(await readFile(path.join(consumer.root, "resolved-modules.json"), "utf8")),
    ).toEqual(rendered.provenance);
    for (const family of consumerFamilies)
      expect(rendered.body).toContain(
        `data-sw-${family === "navigation-menu" ? "nav-menu" : family}`,
      );
  }, 60_000);

  it("requires the designated diagnostic from every invalid real Svelte consumer", async () => {
    const consumer = await createConsumer();
    expect(await verifyNegativeConsumers(consumer)).toBe(PRIMITIVE_NEGATIVE_FIXTURES.length);
  }, 60_000);

  it("fails when a checker is missing or a Starwind package falls back to the workspace", async () => {
    const consumer = await createConsumer();
    await rm(path.join(consumer.root, "node_modules/svelte-check"));
    await expect(openDistConsumer(consumer.root)).rejects.toThrow(/svelte-check/);
    // Restore the local checker before checking the independent package boundary.
    await symlink(
      path.dirname(path.dirname(consumer.tools.checker)),
      path.join(consumer.root, "node_modules/svelte-check"),
      "junction",
    );
    const install = path.join(consumer.root, "node_modules/@starwind-ui/svelte");
    await rm(install, { force: true, recursive: true });
    await symlink(process.cwd(), install, "junction");
    await expect(openDistConsumer(consumer.root)).rejects.toThrow(/outside the consumer/);
  }, 60_000);

  it("rejects source aliases and SSR imports that escape to the workspace", async () => {
    const consumer = await createConsumer();
    await consumer.write({
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          paths: { "@starwind-ui/svelte/*": [path.join(process.cwd(), "src/*")] },
        },
      }),
    });
    await expect(consumer.check()).rejects.toThrow(/source aliases/);
    await consumer.write({
      "escaped.mjs": `import ${JSON.stringify(path.join(process.cwd(), "src/button/ButtonRoot.svelte"))};`,
    });
    await expect(consumer.run("escaped.mjs", { loader: true })).rejects.toThrow(
      /SSR escaped consumer/,
    );
  }, 60_000);

  it("server-renders the built Button without DOM globals", () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    const { body } = render(ButtonPackage.ButtonRoot, {
      props: {
        "aria-label": "Private Svelte package",
        disabled: true,
        focusableWhenDisabled: true,
      },
    });

    expect(body).toContain("<button");
    expect(body).toContain('aria-label="Private Svelte package"');
    expect(body).toContain('aria-disabled="true"');
  });

  it("server-renders the built expansion cohort without DOM globals", () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    const input = render(InputPackage.InputRoot, {
      props: { "aria-label": "Private Input", value: ["built", "input"] },
    }).body;
    const accordion = render(AccordionPackage.AccordionRoot, {
      props: { "aria-label": "Private Accordion", defaultValue: "item-a" },
    }).body;
    const dialog = render(DialogPackage.DialogRoot, {
      props: { "aria-label": "Private Dialog", defaultOpen: true },
    }).body;
    const carousel = render(CarouselPackage.CarouselRoot, {
      props: { "aria-label": "Private Carousel", orientation: "vertical", opts: { loop: true } },
    }).body;
    const slider = render(SliderPackage.SliderRoot, {
      props: { "aria-label": "Private Slider", defaultValue: [20, 80] },
    }).body;
    const toast = render(ToastPackage.ToastViewport, {
      props: { "aria-label": "Private Toasts", duration: 1000, limit: 2 },
    }).body;

    expect(input).toContain('data-sw-input=""');
    expect(input).toContain('value="built,input"');
    expect(accordion).toContain('data-sw-accordion=""');
    expect(accordion).toContain('aria-label="Private Accordion"');
    expect(dialog).toContain('data-sw-dialog=""');
    expect(dialog).toContain('data-state="open"');
    expect(carousel).toContain('data-sw-carousel=""');
    expect(carousel).toContain('data-axis="y"');
    expect(slider).toContain('data-sw-slider=""');
    expect(slider).toContain('aria-label="Private Slider"');
    expect(toast).toContain('data-sw-toast-viewport=""');
    expect(toast).toContain('aria-label="Private Toasts"');
  });
});
