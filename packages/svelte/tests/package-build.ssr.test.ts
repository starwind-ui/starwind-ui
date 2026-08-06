import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import * as SveltePackage from "@starwind-ui/svelte";
import * as AccordionPackage from "@starwind-ui/svelte/accordion";
import * as ButtonPackage from "@starwind-ui/svelte/button";
import * as CarouselPackage from "@starwind-ui/svelte/carousel";
import * as CheckboxPackage from "@starwind-ui/svelte/checkbox";
import * as DialogPackage from "@starwind-ui/svelte/dialog";
import * as SelectPackage from "@starwind-ui/svelte/select";
import * as SliderPackage from "@starwind-ui/svelte/slider";
import * as ToastPackage from "@starwind-ui/svelte/toast";
import { render } from "svelte/server";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const temporaryRoots: string[] = [];
const testRequire = createRequire(import.meta.url);
const tscPath = testRequire.resolve("typescript/bin/tsc");

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

const componentPackages = {
  accordion: AccordionPackage,
  button: ButtonPackage,
  carousel: CarouselPackage,
  checkbox: CheckboxPackage,
  dialog: DialogPackage,
  select: SelectPackage,
  slider: SliderPackage,
  toast: ToastPackage,
} as const;

describe("private Svelte package build", () => {
  it("resolves the root and component subpath exports from processed output", () => {
    expect(SveltePackage.AccordionRoot).toBe(AccordionPackage.AccordionRoot);
    expect(SveltePackage.ButtonRoot).toBe(ButtonPackage.ButtonRoot);
    expect(SveltePackage.CarouselRoot).toBe(CarouselPackage.CarouselRoot);
    expect(SveltePackage.CheckboxRoot).toBe(CheckboxPackage.CheckboxRoot);
    expect(SveltePackage.DialogRoot).toBe(DialogPackage.DialogRoot);
    expect(SveltePackage.SelectRoot).toBe(SelectPackage.SelectRoot);
    expect(SveltePackage.SliderRoot).toBe(SliderPackage.SliderRoot);
    expect(SveltePackage.ToastRoot).toBe(ToastPackage.ToastRoot);
  });

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
      "./slider",
      "./toast",
    ]);
    expect(manifest.peerDependencies.svelte).toBe(">=5.29.0");
    expect(manifest.sideEffects).toBe(false);

    await Promise.all(
      Object.entries(manifest.exports).flatMap(([subpath, target]) =>
        Object.values(target).map(async (file) => {
          const source = await readFile(file.slice(2), "utf8");
          expect(source.length, `${subpath}:${file}`).toBeGreaterThan(0);
        }),
      ),
    );

    for (const component of ["accordion", "carousel", "dialog", "slider", "toast"] as const) {
      const rootName = `${component[0]?.toUpperCase()}${component.slice(1)}Root.svelte`;
      const source = await readFile(`dist/${component}/${rootName}`, "utf8");
      expect(source, component).toMatch(/from ["']svelte["']/);
      expect(source, component).not.toContain("node_modules/svelte");
      expect(componentPackages[component]).toHaveProperty(
        `${component[0]?.toUpperCase()}${component.slice(1)}Root`,
      );
    }
  });

  it("type-checks a dist-only consumer through the root and every private subpath", async () => {
    const consumerRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-dist-consumer-"));
    temporaryRoots.push(consumerRoot);
    const nodeModules = path.join(consumerRoot, "node_modules");
    const svelteInstall = path.join(nodeModules, "@starwind-ui/svelte");
    const runtimeInstall = path.join(nodeModules, "@starwind-ui/runtime");

    await mkdir(nodeModules, { recursive: true });
    await Promise.all([
      installBuiltPackage(process.cwd(), svelteInstall),
      installBuiltPackage(path.resolve("../runtime"), runtimeInstall),
      symlink(
        path.dirname(testRequire.resolve("svelte/package.json")),
        path.join(nodeModules, "svelte"),
        "junction",
      ),
    ]);
    await writeFile(
      path.join(consumerRoot, "package.json"),
      JSON.stringify({ name: "svelte-dist-consumer", private: true, type: "module" }, null, 2),
      "utf8",
    );
    await writeFile(
      path.join(consumerRoot, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
            skipLibCheck: true,
            strict: true,
            target: "ES2022",
            types: [],
          },
          include: ["consumer.ts"],
        },
        null,
        2,
      ),
      "utf8",
    );
    await writeFile(path.join(consumerRoot, "consumer.ts"), DIST_CONSUMER_SOURCE, "utf8");

    expect((await readdir(svelteInstall)).sort()).toEqual(["dist", "package.json"]);
    expect((await readdir(runtimeInstall)).sort()).toEqual(["dist", "package.json"]);
    await expect(
      execFileAsync(process.execPath, [tscPath, "-p", path.join(consumerRoot, "tsconfig.json")], {
        cwd: consumerRoot,
      }),
    ).resolves.toMatchObject({ stderr: "", stdout: "" });
  });

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

async function installBuiltPackage(sourceRoot: string, installRoot: string): Promise<void> {
  await mkdir(installRoot, { recursive: true });
  await Promise.all([
    cp(path.join(sourceRoot, "dist"), path.join(installRoot, "dist"), { recursive: true }),
    cp(path.join(sourceRoot, "package.json"), path.join(installRoot, "package.json")),
  ]);
}

const DIST_CONSUMER_SOURCE = `
import {
  AccordionRoot as RootAccordion,
  ButtonRoot as RootButton,
  CarouselRoot as RootCarousel,
  CheckboxRoot as RootCheckbox,
  DialogRoot as RootDialog,
  SelectRoot as RootSelect,
  SliderRoot as RootSlider,
  ToastRoot as RootToast,
  type AccordionValue as RootAccordionValue,
  type DialogOpenChangeDetails as RootDialogOpenChangeDetails,
  type SliderValue as RootSliderValue,
} from "@starwind-ui/svelte";
import {
  AccordionRoot,
  type AccordionValue,
  type AccordionValueChangeDetails,
} from "@starwind-ui/svelte/accordion";
import { ButtonRoot } from "@starwind-ui/svelte/button";
import {
  CarouselRoot,
  type CarouselInstance,
  type CarouselOptions,
  createCarousel,
} from "@starwind-ui/svelte/carousel";
import {
  CheckboxRoot,
  type CheckboxCheckedChangeDetails,
} from "@starwind-ui/svelte/checkbox";
import {
  DialogRoot,
  type DialogCloseCompleteDetails,
  type DialogOpenChangeDetails,
} from "@starwind-ui/svelte/dialog";
import {
  SelectRoot,
  type SelectOpenChangeDetails,
  type SelectValueChangeDetails,
} from "@starwind-ui/svelte/select";
import {
  SliderRoot,
  type SliderValue,
  type SliderValueChangeDetails,
  type SliderValueCommitDetails,
} from "@starwind-ui/svelte/slider";
import {
  ToastRoot,
  ToastViewport,
  toast,
  type ToastOptions,
  type ToastPromiseOptions,
} from "@starwind-ui/svelte/toast";
import type { ComponentProps } from "svelte";

const roots = [
  RootAccordion,
  RootButton,
  RootCarousel,
  RootCheckbox,
  RootDialog,
  RootSelect,
  RootSlider,
  RootToast,
  AccordionRoot,
  ButtonRoot,
  CarouselRoot,
  CheckboxRoot,
  DialogRoot,
  SelectRoot,
  SliderRoot,
  ToastRoot,
  ToastViewport,
] as const;
void roots;

type ComponentContracts = [
  ComponentProps<typeof AccordionRoot>,
  ComponentProps<typeof ButtonRoot>,
  ComponentProps<typeof CarouselRoot>,
  ComponentProps<typeof CheckboxRoot>,
  ComponentProps<typeof DialogRoot>,
  ComponentProps<typeof SelectRoot>,
  ComponentProps<typeof SliderRoot>,
  ComponentProps<typeof ToastViewport>,
];
type ValueContracts = AccordionValue | RootAccordionValue | SliderValue | RootSliderValue;
type CarouselContracts = CarouselInstance | CarouselOptions;
type ToastContracts = ToastOptions | ToastPromiseOptions<string>;
type ChangeContracts =
  | AccordionValueChangeDetails
  | CheckboxCheckedChangeDetails
  | DialogCloseCompleteDetails
  | DialogOpenChangeDetails
  | RootDialogOpenChangeDetails
  | SelectOpenChangeDetails
  | SelectValueChangeDetails
  | SliderValueChangeDetails
  | SliderValueCommitDetails;

declare const componentContracts: ComponentContracts;
declare const valueContract: ValueContracts;
declare const carouselContract: CarouselContracts;
declare const toastContract: ToastContracts;
declare const changeContract: ChangeContracts;
void [componentContracts, valueContract, changeContract, carouselContract, toastContract, createCarousel, toast];

const validButtonProps: ComponentProps<typeof ButtonRoot> = { disabled: true };
const validAccordionValue: AccordionValue = ["first", "second"];
const validSliderValue: SliderValue = [20, 80];
// @ts-expect-error Processed Button declarations must retain the native boolean prop type.
const invalidButtonProps: ComponentProps<typeof ButtonRoot> = { disabled: "yes" };
// @ts-expect-error Processed Accordion value declarations must reject non-string values.
const invalidAccordionValue: AccordionValue = 42;
// @ts-expect-error Processed Slider value declarations must reject non-number values.
const invalidSliderValue: SliderValue = ["20", "80"];
void [
  validButtonProps,
  validAccordionValue,
  validSliderValue,
  invalidButtonProps,
  invalidAccordionValue,
  invalidSliderValue,
];
`;
