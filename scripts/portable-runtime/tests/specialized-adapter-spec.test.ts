import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";

import {
  accordionRuntimeAdapterContract,
  carouselRuntimeAdapterContract,
  comboboxRuntimeAdapterContract,
  contextMenuRuntimeAdapterContract,
  dialogRuntimeAdapterContract,
  dropzoneRuntimeAdapterContract,
  fieldRuntimeAdapterContract,
  inputOtpRuntimeAdapterContract,
  menuRuntimeAdapterContract,
  navigationMenuRuntimeAdapterContract,
  previewCardRuntimeAdapterContract,
  scrollAreaRuntimeAdapterContract,
  selectRuntimeAdapterContract,
  sidebarRuntimeAdapterContract,
  sliderRuntimeAdapterContract,
  tabsRuntimeAdapterContract,
  toastRuntimeAdapterContract,
  tooltipRuntimeAdapterContract,
} from "../contracts/primitive/representatives.js";
import {
  normalizeAstroPrimitiveOutput,
  writeAstroAdapterOutput,
} from "../renderers/framework-adapters/astro/primitive-output-writer.js";
import {
  type AdapterOutputModel,
  type AdapterPrintedFile,
  astroFrameworkAdapter,
  getPrimitiveFrameworkAdapterTarget,
  printAdapterOutput,
  reactFrameworkAdapter,
} from "../renderers/framework-adapters/index.js";
import {
  applyReactEffectTiming,
  applyReactRefCleanup,
  writeReactAdapterOutput,
} from "../renderers/framework-adapters/react/primitive-output-writer.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
  printGenericAdapterOutputModel,
} from "../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../renderers/primitive-generator-registry.js";
import {
  type AccordionSpecializedAdapterSpec,
  buildAccordionAdapterOutputModel,
  buildAccordionSpecializedAdapterSpec,
  buildBaseSpecializedAdapterSpec,
  buildCarouselAdapterOutputModel,
  buildCarouselSpecializedAdapterSpec,
  buildComboboxAdapterOutputModel,
  buildComboboxSpecializedAdapterSpec,
  buildContextMenuAdapterOutputModel,
  buildContextMenuSpecializedAdapterSpec,
  buildDropzoneAdapterOutputModel,
  buildDropzoneSpecializedAdapterSpec,
  buildFieldAdapterOutputModel,
  buildFieldSpecializedAdapterSpec,
  buildInputOtpAdapterOutputModel,
  buildInputOtpSpecializedAdapterSpec,
  buildMenuAdapterOutputModel,
  buildMenuSpecializedAdapterSpec,
  buildNavigationMenuAdapterOutputModel,
  buildNavigationMenuSpecializedAdapterSpec,
  buildPreviewCardAdapterOutputModel,
  buildPreviewCardSpecializedAdapterSpec,
  buildSelectAdapterOutputModel,
  buildSelectSpecializedAdapterSpec,
  buildSidebarAdapterOutputModel,
  buildSidebarSpecializedAdapterSpec,
  buildSliderAdapterOutputModel,
  buildSliderSpecializedAdapterSpec,
  buildTabsAdapterOutputModel,
  buildTabsSpecializedAdapterSpec,
  buildToastAdapterOutputModel,
  buildToastSpecializedAdapterSpec,
  buildTooltipAdapterOutputModel,
  buildTooltipSpecializedAdapterSpec,
  type CarouselSpecializedAdapterSpec,
  type ComboboxSpecializedAdapterSpec,
  type ContextMenuSpecializedAdapterSpec,
  type DropzoneSpecializedAdapterSpec,
  type FieldSpecializedAdapterSpec,
  type InputOtpSpecializedAdapterSpec,
  type MenuSpecializedAdapterSpec,
  type NavigationMenuSpecializedAdapterSpec,
  type PreviewCardSpecializedAdapterSpec,
  printContextMenuCompositeOverlayFixture,
  printFutureSelectSpecializedAdapterSpecFixture,
  printFutureSpecializedAdapterSpecFixture,
  printMenuCheckboxItemRecipeBlock,
  printMenuCompositeOverlayFixture,
  printMenuNamespaceExportBlock,
  printMenuRadioRecipeBlock,
  printMenuSubmenuRecipeBlock,
  printNavigationMenuSharedViewportFixture,
  type SelectSpecializedAdapterSpec,
  type SidebarSpecializedAdapterSpec,
  type SliderSpecializedAdapterSpec,
  type SpecializedAdapterSpec,
  type TabsSpecializedAdapterSpec,
  type ToastSpecializedAdapterSpec,
  type TooltipSpecializedAdapterSpec,
  validateAccordionSpecializedAdapterSpec,
  validateCarouselSpecializedAdapterSpec,
  validateComboboxSpecializedAdapterSpec,
  validateContextMenuSpecializedAdapterSpec,
  validateDropzoneSpecializedAdapterSpec,
  validateFieldSpecializedAdapterSpec,
  validateInputOtpSpecializedAdapterSpec,
  validateMenuSpecializedAdapterSpec,
  validateNavigationMenuSpecializedAdapterSpec,
  validatePreviewCardSpecializedAdapterSpec,
  validateSidebarSpecializedAdapterSpec,
  validateSliderSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
  validateTabsSpecializedAdapterSpec,
  validateToastSpecializedAdapterSpec,
  validateTooltipSpecializedAdapterSpec,
} from "../renderers/specialized-adapter-spec/index.js";

const astroPrimitiveTarget = getPrimitiveFrameworkAdapterTarget("astro");
const reactPrimitiveTarget = getPrimitiveFrameworkAdapterTarget("react");

function projectAstroSpecializedOutputModel(model: AdapterOutputModel): AdapterOutputModel {
  return astroPrimitiveTarget.primitive.outputModel.projectSpecialized(model);
}

function projectReactSpecializedOutputModel(model: AdapterOutputModel): AdapterOutputModel {
  return reactPrimitiveTarget.primitive.outputModel.projectSpecialized(model);
}

function printAstroSpecializedOutputModel(model: AdapterOutputModel): AdapterPrintedFile[] {
  return astroPrimitiveTarget.adapter.printOutput(projectAstroSpecializedOutputModel(model));
}

function printReactSpecializedOutputModel(model: AdapterOutputModel): AdapterPrintedFile[] {
  return reactPrimitiveTarget.adapter.printOutput(projectReactSpecializedOutputModel(model));
}

function expectReactSpecializedProjectionToBeIdempotent(model: AdapterOutputModel): void {
  expect(projectReactSpecializedOutputModel(projectReactSpecializedOutputModel(model))).toEqual(
    projectReactSpecializedOutputModel(model),
  );
}

function printAstroSpecializedAdapterSpec(spec: SpecializedAdapterSpec) {
  assertValidSpecializedAdapterSpec(spec);

  return printGenericAdapterOutputModel(
    astroFrameworkAdapter,
    buildGenericAdapterOutputModel(spec.renderPlan),
  );
}

function printReactSpecializedAdapterSpec(spec: SpecializedAdapterSpec) {
  assertValidSpecializedAdapterSpec(spec);

  return printGenericAdapterOutputModel(
    reactFrameworkAdapter,
    buildGenericAdapterOutputModel(spec.renderPlan),
  );
}

function assertValidSpecializedAdapterSpec(spec: SpecializedAdapterSpec): void {
  const errors = validateSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

function printAstroAccordionAdapterOutputModel(
  spec: AccordionSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildAccordionAdapterOutputModel(spec));
}

function printReactAccordionAdapterOutputModel(
  spec: AccordionSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildAccordionAdapterOutputModel(spec));
}

function printAstroCarouselAdapterOutputModel(
  spec: CarouselSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildCarouselAdapterOutputModel(spec));
}

function printReactCarouselAdapterOutputModel(
  spec: CarouselSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildCarouselAdapterOutputModel(spec));
}

function printAstroComboboxAdapterOutputModel(
  spec: ComboboxSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildComboboxAdapterOutputModel(spec));
}

function printReactComboboxAdapterOutputModel(
  spec: ComboboxSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildComboboxAdapterOutputModel(spec));
}

function printAstroContextMenuAdapterOutputModel(
  spec: ContextMenuSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildContextMenuAdapterOutputModel(spec));
}

function printReactContextMenuAdapterOutputModel(
  spec: ContextMenuSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildContextMenuAdapterOutputModel(spec));
}

function printAstroDropzoneAdapterOutputModel(
  spec: DropzoneSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildDropzoneAdapterOutputModel(spec));
}

function printReactDropzoneAdapterOutputModel(
  spec: DropzoneSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildDropzoneAdapterOutputModel(spec));
}

function printAstroFieldAdapterOutputModel(
  spec: FieldSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildFieldAdapterOutputModel(spec));
}

function printReactFieldAdapterOutputModel(
  spec: FieldSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildFieldAdapterOutputModel(spec));
}

function printAstroInputOtpAdapterOutputModel(
  spec: InputOtpSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildInputOtpAdapterOutputModel(spec));
}

function printReactInputOtpAdapterOutputModel(
  spec: InputOtpSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildInputOtpAdapterOutputModel(spec));
}

function printAstroMenuAdapterOutputModel(spec: MenuSpecializedAdapterSpec): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildMenuAdapterOutputModel(spec));
}

function printReactMenuAdapterOutputModel(spec: MenuSpecializedAdapterSpec): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildMenuAdapterOutputModel(spec));
}

function printAstroNavigationMenuAdapterOutputModel(
  spec: NavigationMenuSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildNavigationMenuAdapterOutputModel(spec));
}

function printReactNavigationMenuAdapterOutputModel(
  spec: NavigationMenuSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildNavigationMenuAdapterOutputModel(spec));
}

function printAstroPreviewCardAdapterOutputModel(
  spec: PreviewCardSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildPreviewCardAdapterOutputModel(spec));
}

function printReactPreviewCardAdapterOutputModel(
  spec: PreviewCardSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildPreviewCardAdapterOutputModel(spec));
}

function printAstroSelectAdapterOutputModel(
  spec: SelectSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildSelectAdapterOutputModel(spec));
}

function printReactSelectAdapterOutputModel(
  spec: SelectSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildSelectAdapterOutputModel(spec));
}

function printAstroSidebarAdapterOutputModel(
  spec: SidebarSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildSidebarAdapterOutputModel(spec));
}

function printReactSidebarAdapterOutputModel(
  spec: SidebarSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildSidebarAdapterOutputModel(spec));
}

function printAstroSliderAdapterOutputModel(
  spec: SliderSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildSliderAdapterOutputModel(spec));
}

function printReactSliderAdapterOutputModel(
  spec: SliderSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildSliderAdapterOutputModel(spec));
}

function printAstroTabsAdapterOutputModel(spec: TabsSpecializedAdapterSpec): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildTabsAdapterOutputModel(spec));
}

function printReactTabsAdapterOutputModel(spec: TabsSpecializedAdapterSpec): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildTabsAdapterOutputModel(spec));
}

function printAstroToastAdapterOutputModel(
  spec: ToastSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildToastAdapterOutputModel(spec));
}

function printReactToastAdapterOutputModel(
  spec: ToastSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildToastAdapterOutputModel(spec));
}

function printAstroTooltipAdapterOutputModel(
  spec: TooltipSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printAstroSpecializedOutputModel(buildTooltipAdapterOutputModel(spec));
}

function printReactTooltipAdapterOutputModel(
  spec: TooltipSpecializedAdapterSpec,
): AdapterPrintedFile[] {
  return printReactSpecializedOutputModel(buildTooltipAdapterOutputModel(spec));
}

const overlayPresenceVocabularyGuardFiles = [
  "scripts/portable-runtime/renderers/primitive-generator-registry.ts",
  "scripts/portable-runtime/renderers/primitive-route-free-generator.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/accordion-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/preview-card-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/sidebar-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/tabs-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/tooltip-specialized-adapter-spec.ts",
  "scripts/portable-runtime/tests/specialized-adapter-spec.test.ts",
] as const;

const deprecatedOverlayPresenceVocabulary = [
  ["timed", " overlay writer"].join(""),
  ["controlled value", " presence writer"].join(""),
  ["repeated", " disclosure writer"].join(""),
  ["disclosure", " control writer"].join(""),
  ["Tooltip", " timed overlay"].join(""),
  ["Preview Card", " timed overlay"].join(""),
  ["Accordion", " repeated disclosure"].join(""),
  ["Tabs", " controlled value presence"].join(""),
  ["Sidebar", " disclosure control"].join(""),
] as const;

const formControlVocabularyGuardFiles = [
  "scripts/portable-runtime/renderers/primitive-generator-registry.ts",
  "scripts/portable-runtime/renderers/primitive-route-free-generator.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/dropzone-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/field-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/input-otp-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/slider-specialized-adapter-spec.ts",
  "scripts/portable-runtime/tests/specialized-adapter-spec.test.ts",
] as const;

const deprecatedFormControlVocabulary = [
  ["composition", " writer"].join(""),
  ["range control", " writer"].join(""),
  ["range", "-control writer"].join(""),
  ["range-control", "-spec-writer"].join(""),
  ["hidden input slot", " writer"].join(""),
  ["hidden-input", " visual-slot writer"].join(""),
  ["hidden-input-visual-slot", "-spec-writer"].join(""),
  ["file drop control", " writer"].join(""),
  ["file-drop", "-control writer"].join(""),
  ["file-drop-control", "-spec-writer"].join(""),
  ["field", " composition spec"].join(""),
  ["range", " control spec"].join(""),
  ["range", "-control spec"].join(""),
  ["hidden input", " slot spec"].join(""),
  ["hidden-input", " visual-slot spec"].join(""),
  ["file drop", " control spec"].join(""),
  ["file-drop", "-control spec"].join(""),
  ["Field", " composition"].join(""),
  ["Slider", " range control"].join(""),
  ["Slider", " range-control"].join(""),
  ["Input OTP", " hidden input slot"].join(""),
  ["Input OTP", " hidden-input", " visual-slot"].join(""),
  ["Dropzone", " file drop control"].join(""),
  ["Dropzone", " file-drop-control"].join(""),
] as const;

const engineSystemVocabularyGuardFiles = [
  "scripts/portable-runtime/renderers/primitive-generator-registry.ts",
  "scripts/portable-runtime/renderers/primitive-route-free-generator.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/carousel-specialized-adapter-spec.ts",
  "scripts/portable-runtime/renderers/specialized-adapter-spec/toast-specialized-adapter-spec.ts",
  "scripts/portable-runtime/tests/generator-structure.test.ts",
  "scripts/portable-runtime/tests/specialized-adapter-spec.test.ts",
] as const;

const deprecatedEngineSystemVocabulary = [
  ["engine", "-backed writer"].join(""),
  ["engine", "-backed spec"].join(""),
  ["engine-backed", "-spec-writer"].join(""),
  ["Carousel", " engine-backed"].join(""),
  ["notification", "-system writer"].join(""),
  ["notification", "-system spec"].join(""),
  ["notification-system", "-spec-writer"].join(""),
  ["Toast", " notification-system"].join(""),
] as const;

type SpecializedAdapterOutputModelBuilder<TSpec> = (spec: TSpec) => AdapterOutputModel;

type SpecializedAdapterOutputPrinter<TSpec> = (spec: TSpec) => AdapterPrintedFile[];

function createAstroSpecializedSpecWriter<TSpec>({
  buildOutputModel,
  componentName,
  printOutput,
}: {
  buildOutputModel: SpecializedAdapterOutputModelBuilder<TSpec>;
  componentName: string;
  printOutput: SpecializedAdapterOutputPrinter<TSpec>;
}) {
  return async (
    outputRoot: string,
    spec: TSpec,
    astroHeader: string,
    tsHeader: string,
  ): Promise<void> => {
    const outputModel = projectAstroSpecializedOutputModel(buildOutputModel(spec));
    expect(printAstroSpecializedOutputModel(outputModel)).toEqual(printOutput(spec));

    await writeAstroAdapterOutput({
      astroHeader,
      componentName,
      outputModel,
      outputRoot,
      tsHeader,
    });
  };
}

function createReactSpecializedSpecWriter<TSpec>({
  buildOutputModel,
  componentName,
  printOutput,
}: {
  buildOutputModel: SpecializedAdapterOutputModelBuilder<TSpec>;
  componentName: string;
  printOutput: SpecializedAdapterOutputPrinter<TSpec>;
}) {
  return async (outputRoot: string, spec: TSpec, tsHeader: string): Promise<void> => {
    const outputModel = projectReactSpecializedOutputModel(buildOutputModel(spec));
    expect(printReactSpecializedOutputModel(outputModel)).toEqual(printOutput(spec));

    await writeReactAdapterOutput({
      componentName,
      outputModel,
      outputRoot,
      tsHeader,
    });
  };
}

function getPrimitiveGeneratorEntry(component: string) {
  const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === component);
  if (!entry) {
    throw new Error(`Missing primitive generator registry entry for "${component}".`);
  }

  return entry;
}

function expectSpecializedPrimitiveRegistrySource({
  buildOutputModel,
  buildSpec,
  component,
}: {
  buildOutputModel: string;
  buildSpec: string;
  component: string;
}): void {
  const entry = getPrimitiveGeneratorEntry(component);
  const registrySource = readFileSync(
    join(process.cwd(), "scripts/portable-runtime/renderers/primitive-generator-registry.ts"),
    "utf8",
  );

  expect(entry.source).toBe("specialized-adapter-spec");
  expect(entry.routeFree).toMatchObject({
    kind: "adapter-output-model",
    strategy: "specialized-adapter-spec",
    targets: ["astro", "react"],
  });
  expect(registrySource).toContain(component.includes("-") ? `"${component}":` : `${component}:`);
  expect(registrySource).toContain("component: entry.component");
  expect(registrySource).toContain(`buildSpec: ${buildSpec}`);
  expect(registrySource).toContain(`buildOutputModel: ${buildOutputModel}`);
}

function generateAstroPrimitive(component: string) {
  return (outputRoot: string, astroHeader: string, tsHeader: string) =>
    getPrimitiveGeneratorEntry(component).generateTarget({
      componentHeader: astroHeader,
      moduleHeader: tsHeader,
      outputRoot,
      target: "astro",
    });
}

function generateReactPrimitive(component: string) {
  return (outputRoot: string, tsHeader: string) =>
    getPrimitiveGeneratorEntry(component).generateTarget({
      moduleHeader: tsHeader,
      outputRoot,
      target: "react",
    });
}

const generateAstroPrimitiveAccordion = generateAstroPrimitive("accordion");
const generateReactPrimitiveAccordion = generateReactPrimitive("accordion");
const generateAstroPrimitiveCarousel = generateAstroPrimitive("carousel");
const generateReactPrimitiveCarousel = generateReactPrimitive("carousel");
const generateAstroPrimitiveDropzone = generateAstroPrimitive("dropzone");
const generateReactPrimitiveDropzone = generateReactPrimitive("dropzone");
const generateAstroPrimitiveField = generateAstroPrimitive("field");
const generateReactPrimitiveField = generateReactPrimitive("field");
const generateAstroPrimitiveInputOtp = generateAstroPrimitive("input-otp");
const generateReactPrimitiveInputOtp = generateReactPrimitive("input-otp");
const generateAstroPrimitiveSidebar = generateAstroPrimitive("sidebar");
const generateReactPrimitiveSidebar = generateReactPrimitive("sidebar");
const generateAstroPrimitiveSlider = generateAstroPrimitive("slider");
const generateReactPrimitiveSlider = generateReactPrimitive("slider");
const generateAstroPrimitiveToast = generateAstroPrimitive("toast");
const generateReactPrimitiveToast = generateReactPrimitive("toast");

const writeAstroAccordionSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildAccordionAdapterOutputModel,
  componentName: "Accordion",
  printOutput: printAstroAccordionAdapterOutputModel,
});
const writeReactAccordionSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildAccordionAdapterOutputModel,
  componentName: "Accordion",
  printOutput: printReactAccordionAdapterOutputModel,
});
const writeAstroCarouselSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildCarouselAdapterOutputModel,
  componentName: "Carousel",
  printOutput: printAstroCarouselAdapterOutputModel,
});
const writeReactCarouselSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildCarouselAdapterOutputModel,
  componentName: "Carousel",
  printOutput: printReactCarouselAdapterOutputModel,
});
const writeAstroComboboxSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildComboboxAdapterOutputModel,
  componentName: "Combobox",
  printOutput: printAstroComboboxAdapterOutputModel,
});
const writeReactComboboxSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildComboboxAdapterOutputModel,
  componentName: "Combobox",
  printOutput: printReactComboboxAdapterOutputModel,
});
const writeAstroDropzoneSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildDropzoneAdapterOutputModel,
  componentName: "Dropzone",
  printOutput: printAstroDropzoneAdapterOutputModel,
});
const writeReactDropzoneSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildDropzoneAdapterOutputModel,
  componentName: "Dropzone",
  printOutput: printReactDropzoneAdapterOutputModel,
});
const writeAstroFieldSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildFieldAdapterOutputModel,
  componentName: "Field",
  printOutput: printAstroFieldAdapterOutputModel,
});
const writeReactFieldSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildFieldAdapterOutputModel,
  componentName: "Field",
  printOutput: printReactFieldAdapterOutputModel,
});
const writeAstroInputOtpSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildInputOtpAdapterOutputModel,
  componentName: "Input OTP",
  printOutput: printAstroInputOtpAdapterOutputModel,
});
const writeReactInputOtpSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildInputOtpAdapterOutputModel,
  componentName: "Input OTP",
  printOutput: printReactInputOtpAdapterOutputModel,
});
const writeAstroNavigationMenuSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildNavigationMenuAdapterOutputModel,
  componentName: "Navigation Menu",
  printOutput: printAstroNavigationMenuAdapterOutputModel,
});
const writeReactNavigationMenuSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildNavigationMenuAdapterOutputModel,
  componentName: "Navigation Menu",
  printOutput: printReactNavigationMenuAdapterOutputModel,
});
const writeAstroPreviewCardSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildPreviewCardAdapterOutputModel,
  componentName: "Preview Card",
  printOutput: printAstroPreviewCardAdapterOutputModel,
});
const writeReactPreviewCardSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildPreviewCardAdapterOutputModel,
  componentName: "Preview Card",
  printOutput: printReactPreviewCardAdapterOutputModel,
});
const writeAstroSelectSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildSelectAdapterOutputModel,
  componentName: "Select",
  printOutput: printAstroSelectAdapterOutputModel,
});
const writeReactSelectSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildSelectAdapterOutputModel,
  componentName: "Select",
  printOutput: printReactSelectAdapterOutputModel,
});
const writeAstroSidebarSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildSidebarAdapterOutputModel,
  componentName: "Sidebar",
  printOutput: printAstroSidebarAdapterOutputModel,
});
const writeReactSidebarSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildSidebarAdapterOutputModel,
  componentName: "Sidebar",
  printOutput: printReactSidebarAdapterOutputModel,
});
const writeAstroSliderSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildSliderAdapterOutputModel,
  componentName: "Slider",
  printOutput: printAstroSliderAdapterOutputModel,
});
const writeReactSliderSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildSliderAdapterOutputModel,
  componentName: "Slider",
  printOutput: printReactSliderAdapterOutputModel,
});
const writeAstroTabsSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildTabsAdapterOutputModel,
  componentName: "Tabs",
  printOutput: printAstroTabsAdapterOutputModel,
});
const writeReactTabsSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildTabsAdapterOutputModel,
  componentName: "Tabs",
  printOutput: printReactTabsAdapterOutputModel,
});
const writeAstroToastSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildToastAdapterOutputModel,
  componentName: "Toast",
  printOutput: printAstroToastAdapterOutputModel,
});
const writeReactToastSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildToastAdapterOutputModel,
  componentName: "Toast",
  printOutput: printReactToastAdapterOutputModel,
});
const writeAstroTooltipSpecializedAdapterSpec = createAstroSpecializedSpecWriter({
  buildOutputModel: buildTooltipAdapterOutputModel,
  componentName: "Tooltip",
  printOutput: printAstroTooltipAdapterOutputModel,
});
const writeReactTooltipSpecializedAdapterSpec = createReactSpecializedSpecWriter({
  buildOutputModel: buildTooltipAdapterOutputModel,
  componentName: "Tooltip",
  printOutput: printReactTooltipAdapterOutputModel,
});

describe("SpecializedAdapterSpec", () => {
  it("keeps overlay and presence diagnostics on Specialized Adapter Spec vocabulary", () => {
    for (const file of overlayPresenceVocabularyGuardFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      for (const deprecatedPhrase of deprecatedOverlayPresenceVocabulary) {
        expect(source, `${file} contains deprecated vocabulary: ${deprecatedPhrase}`).not.toContain(
          deprecatedPhrase,
        );
      }
    }
  });

  it("keeps form and control diagnostics on Specialized Adapter Spec vocabulary", () => {
    for (const file of formControlVocabularyGuardFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      for (const deprecatedPhrase of deprecatedFormControlVocabulary) {
        expect(source, `${file} contains deprecated vocabulary: ${deprecatedPhrase}`).not.toContain(
          deprecatedPhrase,
        );
      }
    }
  });

  it("keeps engine and system diagnostics on Specialized Adapter Spec vocabulary", () => {
    for (const file of engineSystemVocabularyGuardFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      for (const deprecatedPhrase of deprecatedEngineSystemVocabulary) {
        expect(source, `${file} contains deprecated vocabulary: ${deprecatedPhrase}`).not.toContain(
          deprecatedPhrase,
        );
      }
    }
  });

  it("builds a framework-neutral adapter spec from primitive contract facts", () => {
    const spec = buildBaseSpecializedAdapterSpec(scrollAreaRuntimeAdapterContract);

    expect(spec.component).toBe("scroll-area");
    expect(spec.displayName).toBe("ScrollArea");
    expect(spec.category).toBe("viewport-measurement");
    expect(spec.root).toEqual({
      defaultElement: "div",
      discoveryAttribute: "data-sw-scroll-area",
      ownsRuntime: true,
      part: "root",
      runtimeFactory: "createScrollArea",
      runtimeImportSource: "@starwind-ui/runtime/scroll-area",
    });
    expect(spec.files.map((file) => [file.kind, file.path, file.part])).toEqual([
      ["part", "scroll-area/ScrollAreaRoot", "root"],
      ["part", "scroll-area/ScrollAreaViewport", "viewport"],
      ["part", "scroll-area/ScrollAreaContent", "content"],
      ["part", "scroll-area/ScrollAreaScrollbar", "scrollbar"],
      ["part", "scroll-area/ScrollAreaThumb", "thumb"],
      ["part", "scroll-area/ScrollAreaCorner", "corner"],
      ["index", "scroll-area/index", undefined],
    ]);
    expect(spec.parts.map((part) => [part.name, part.discoveryAttribute])).toEqual([
      ["root", "data-sw-scroll-area"],
      ["viewport", "data-sw-scroll-area-viewport"],
      ["content", "data-sw-scroll-area-content"],
      ["scrollbar", "data-sw-scroll-area-scrollbar"],
      ["thumb", "data-sw-scroll-area-thumb"],
      ["corner", "data-sw-scroll-area-corner"],
    ]);
    expect(spec.props.map((prop) => prop.name)).toEqual([
      "overflowEdgeThreshold",
      "keepMounted",
      "orientation",
    ]);
    expect(spec.stateModels).toEqual([]);
    expect(spec.setterSync).toEqual([]);
  });

  it("builds a Select specialized adapter spec with adapter-facing facts but no Runtime-owned behavior", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);

    expect(spec.component).toBe("select");
    expect(spec.root).toMatchObject({
      discoveryAttribute: "data-sw-select",
      part: "root",
      runtimeFactory: "createSelect",
      runtimeImportSource: "@starwind-ui/runtime/select",
    });
    expect(spec.select.contextProjection).toEqual({
      filePath: "select/SelectContext",
      itemContext: "SelectItemContext",
      rootContext: "SelectContext",
      values: ["open", "value"],
    });
    expect(spec.select.hiddenInput).toEqual({
      part: "input",
      props: ["autoComplete", "form", "name", "required", "value"],
      type: "hidden",
    });
    expect(spec.select.floating).toEqual({
      anchorPart: "trigger",
      optionProps: [
        "side",
        "align",
        "sideOffset",
        "alignOffset",
        "avoidCollisions",
        "alignItemWithTrigger",
      ],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });
    expect(spec.select.itemContext).toEqual({
      part: "item",
      valueProp: "value",
    });
    expect(spec.select.itemIndicator).toEqual({
      hiddenPart: "itemIndicator",
      selectedStateAttribute: "data-state",
    });
    expect(spec.select.scrollArrows).toEqual(["scrollUpArrow", "scrollDownArrow"]);
    expect(spec.select.asChildTrigger).toEqual({
      merges: ["aria", "className", "data", "ref"],
      part: "trigger",
    });
    expect(spec.select.runtimeBoundary).toEqual([
      "collection registration",
      "item text extraction",
      "keyboard navigation",
      "typeahead",
      "value normalization",
      "hidden input sync",
      "form reset",
      "floating placement",
      "scroll arrow behavior",
      "dismissal",
      "cleanup",
    ]);
  });

  it("builds and prints Select through the Adapter Output Model", async () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const astroOutputModel = projectAstroSpecializedOutputModel(
      buildSelectAdapterOutputModel(spec),
    );
    const reactOutputModel = projectReactSpecializedOutputModel(
      buildSelectAdapterOutputModel(spec),
    );
    const astroFiles = printAstroSelectAdapterOutputModel(spec);
    const reactFiles = printReactSelectAdapterOutputModel(spec);

    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(astroOutputModel.files.at(-1)).toMatchObject({
      kind: "index",
      path: "select/index.ts",
    });
    expect(reactOutputModel.files.at(-1)).toMatchObject({
      kind: "index",
      path: "select/index.ts",
    });
    expect(astroFiles.map((file) => file.path)).toEqual(
      astroOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );
    expect(reactFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.tsx` : file.path,
      ),
    );
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "option-collection-overlay", part: "root" }),
        expect.objectContaining({ kind: "option-collection-overlay", part: "trigger" }),
        expect.objectContaining({ kind: "option-collection-overlay", part: "item" }),
        expect.objectContaining({ kind: "option-collection-overlay", part: "itemIndicator" }),
      ]),
    );
    expect(
      reactOutputModel.files.filter((file) => file.kind === "helper").map((file) => file.family),
    ).toEqual([expect.objectContaining({ kind: "option-collection-overlay" })]);

    const astroRoot = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "select/SelectRoot.astro"),
      join(process.cwd(), "packages/astro/src/select/SelectRoot.astro"),
    );
    const astroTrigger = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "select/SelectTrigger.astro"),
      join(process.cwd(), "packages/astro/src/select/SelectTrigger.astro"),
    );
    const astroItem = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "select/SelectItem.astro"),
      join(process.cwd(), "packages/astro/src/select/SelectItem.astro"),
    );
    const astroItemIndicator = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "select/SelectItemIndicator.astro"),
      join(process.cwd(), "packages/astro/src/select/SelectItemIndicator.astro"),
    );
    const astroPositioner = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "select/SelectPositioner.astro"),
      join(process.cwd(), "packages/astro/src/select/SelectPositioner.astro"),
    );
    const astroIndex = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "select/index.ts"),
      join(process.cwd(), "packages/astro/src/select/index.ts"),
    );
    const reactRoot = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "select/SelectRoot.tsx"),
      join(process.cwd(), "packages/react/src/select/SelectRoot.tsx"),
    );
    const reactContext = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "select/SelectContext.tsx"),
      join(process.cwd(), "packages/react/src/select/SelectContext.tsx"),
    );
    const reactTrigger = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "select/SelectTrigger.tsx"),
      join(process.cwd(), "packages/react/src/select/SelectTrigger.tsx"),
    );
    const reactItem = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "select/SelectItem.tsx"),
      join(process.cwd(), "packages/react/src/select/SelectItem.tsx"),
    );
    const reactItemIndicator = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "select/SelectItemIndicator.tsx"),
      join(process.cwd(), "packages/react/src/select/SelectItemIndicator.tsx"),
    );
    const reactPopup = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "select/SelectPopup.tsx"),
      join(process.cwd(), "packages/react/src/select/SelectPopup.tsx"),
    );
    const reactIndex = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "select/index.ts"),
      join(process.cwd(), "packages/react/src/select/index.ts"),
    );

    expect(astroRoot).toContain('import { createSelect } from "@starwind-ui/runtime/select";');
    expect(astroRoot).toContain("data-sw-select");
    expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(astroRoot).toContain("data-default-value={defaultValue ?? undefined}");
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain("data-form={form}");
    expect(astroRoot).toContain(
      'data-highlight-item-on-hover={highlightItemOnHover ? "true" : "false"}',
    );
    expect(astroRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(astroRoot).toContain("data-name={name}");
    expect(astroRoot).toContain('data-readonly={readOnly ? "" : undefined}');
    expect(astroRoot).toContain('data-required={required ? "" : undefined}');
    expect(astroRoot).toContain('data-state={defaultOpen ? "open" : "closed"}');
    expect(astroRoot).toContain("data-sw-select-input");
    expect(astroRoot).toContain('type="hidden"');
    expect(astroRoot).toContain("autocomplete={autoComplete}");
    expect(astroRoot).toContain('tabindex="-1"');
    expect(astroRoot).toContain("createSelect(root)");
    expect(astroRoot).toContain("registerAstroControllerLifecycle");
    expect(astroTrigger).toContain("data-sw-select-trigger");
    expect(astroTrigger).toContain("data-as-child");
    expect(astroTrigger).toContain('role="combobox"');
    expect(astroTrigger).toContain('aria-haspopup="listbox"');
    expect(astroTrigger).toContain('aria-expanded="false"');
    expect(astroItem).toContain("data-sw-select-item");
    expect(astroItem).toContain("data-value={value}");
    expect(astroItem).toContain('role="option"');
    expect(astroItem).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(astroItemIndicator).toContain("data-sw-select-item-indicator");
    expect(astroItemIndicator).toContain('data-state="unchecked"');
    expect(astroItemIndicator).toContain("data-hidden");
    expect(astroItemIndicator).toContain("hidden");
    expect(astroPositioner).toContain("data-sw-select-positioner");
    expect(astroPositioner).toContain("data-align-item-with-trigger={");
    expect(astroPositioner).toContain("data-avoid-collisions={avoidCollisions");
    expect(astroIndex).toContain("SelectScrollDownArrow");
    expect(astroIndex).toContain("SelectScrollUpArrow");
    expect(astroIndex).toContain("SelectOpenChangeDetails");
    expect(astroIndex).toContain("SelectValueChangeDetails");

    expect(reactRoot).toContain(
      "createSelect,\n  type SelectOpenChangeDetails,\n  type SelectValueChangeDetails,",
    );
    expect(reactRoot).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(reactRoot).toContain("const onValueChangeRef = React.useRef(onValueChange);");
    expect(reactRoot).toContain("createSelect(root, {");
    expect(reactRoot).toContain("defaultOpen: uncontrolledOpenRef.current,");
    expect(reactRoot).toContain("defaultValue: uncontrolledValueRef.current,");
    expect(reactRoot).toContain("onOpenChangeRef.current?.(nextOpen, details);");
    expect(reactRoot).toContain("onValueChangeRef.current?.(nextValue, details);");
    expect(reactRoot).toContain("instanceRef.current?.setFormOptions");
    expect(reactRoot).toContain("instanceRef.current?.setDisabled(disabled);");
    expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
    expect(reactRoot).toContain("instance.setValue(value, { emit: false });");
    expect(reactRoot).toContain("<SelectContext.Provider value={contextValue}>");
    expect(reactRoot).toContain("data-sw-select");
    expect(reactRoot).toContain("data-sw-select-input");
    expect(reactRoot).toContain("value={renderedValue}");
    expect(reactRoot).toContain("readOnly");
    expect(reactContext).toContain("export type SelectContextValue");
    expect(reactContext).toContain("open: boolean;");
    expect(reactContext).toContain("value: string | null;");
    expect(reactContext).toContain(
      "export const SelectItemContext = React.createContext<SelectItemContextValue | null>(null);",
    );
    expect(reactTrigger).toContain("const select = useSelectContext();");
    expect(reactTrigger).toContain('"data-sw-select-trigger": ""');
    expect(reactTrigger).toContain('"aria-haspopup": "listbox"');
    expect(reactTrigger).toContain('"aria-expanded": select.open ? "true" : "false"');
    expect(reactTrigger).toContain("React.cloneElement(child, {");
    expect(reactItem).toContain("SelectItemContext.Provider value={itemContextValue}");
    expect(reactItem).toContain("const selected = select.value === value;");
    expect(reactItem).toContain("data-sw-select-item");
    expect(reactItem).toContain("data-value={value}");
    expect(reactItem).toContain('role="option"');
    expect(reactItem).toContain("aria-selected={selected}");
    expect(reactItemIndicator).toContain("const selected = select.value === item.value;");
    expect(reactItemIndicator).toContain("data-sw-select-item-indicator");
    expect(reactItemIndicator).toContain('data-state={selected ? "checked" : "unchecked"}');
    expect(reactItemIndicator).toContain('data-visible={selected ? "" : undefined}');
    expect(reactItemIndicator).toContain("hidden={!selected}");
    expect(reactPopup).toContain("const select = useSelectContext();");
    expect(reactPopup).toContain("data-sw-select-popup");
    expect(reactPopup).toContain("keepMounted?: boolean;");
    expect(reactPopup).toContain("keepMounted = false");
    expect(reactPopup).toContain(
      'import { useClosePresence } from "../internal/use-close-presence";',
    );
    expect(reactPopup).toContain("const closePresence = useClosePresence<HTMLDivElement>({");
    expect(reactPopup).toContain("open: select.open,");
    expect(reactPopup).toContain('role="listbox"');
    expect(reactPopup).toContain('data-state={select.open ? "open" : "closed"}');
    expect(reactPopup).toContain("hidden={closePresence.hidden}");
    expect(reactPopup).toContain("{closePresence.present ? props.children : null}");
    expect(reactPopup).not.toContain("initialHiddenRef");
    expect(reactPopup).not.toContain("suppressHydrationWarning");
    expect(reactPopup).not.toContain("const shouldRenderChildren = keepMounted || select.open;");
    expect(reactPopup).not.toContain("hidden={!select.open}");
    expect(reactIndex).toContain("SelectContext");
    expect(reactIndex).toContain("useSelectItemContext");
    expect(reactIndex).toContain("SelectScrollDownArrow");
    expect(reactIndex).toContain("SelectScrollUpArrow");
    expect(reactIndex).toContain("SelectOpenChangeDetails");
    expect(reactIndex).toContain("SelectValueChangeDetails");

    for (const file of astroFiles) {
      const packagePath = join(process.cwd(), "packages/astro/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", file.path),
      );
    }

    for (const file of reactFiles) {
      const packagePath = join(process.cwd(), "packages/react/src", file.path);

      expect(await formatGeneratedOutput(applyReactEffectTiming(file.contents), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", file.path),
      );
    }

    const sharedFrameworkAdapterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/astro/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/adapter.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));
    const targetFamilyPrinterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/astro/option-collection-overlay.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/option-collection-overlay.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));
    const selectExportedPartNames = [
      "SelectRoot",
      "SelectLabel",
      "SelectTrigger",
      "SelectIcon",
      "SelectValue",
      "SelectPortal",
      "SelectPositioner",
      "SelectPopup",
      "SelectList",
      "SelectGroup",
      "SelectGroupLabel",
      "SelectItem",
      "SelectItemText",
      "SelectItemIndicator",
      "SelectSeparator",
      "SelectScrollUpArrow",
      "SelectScrollDownArrow",
    ];

    for (const adapterSource of [...sharedFrameworkAdapterSources, ...targetFamilyPrinterSources]) {
      expect(adapterSource).not.toContain("createSelect");
      expect(adapterSource).not.toContain("setupSelects");
    }

    // Target-family printers may interpolate concrete export names from facts; shared dispatchers stay generic.
    for (const adapterSource of sharedFrameworkAdapterSources) {
      for (const partName of selectExportedPartNames) {
        expect(adapterSource).not.toContain(partName);
      }
      expect(adapterSource).not.toMatch(/\bconst select\s*=/);
      expect(adapterSource).not.toMatch(/\bselect\./);
    }
  }, 60_000);

  it("rejects Select writer specs when adapter-facing facts drift from the writer assumptions", async () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const specWithoutHiddenInput = {
      ...spec,
      select: {
        ...spec.select,
        hiddenInput: {
          ...spec.select.hiddenInput,
          part: "value",
        },
      },
    } as unknown as SelectSpecializedAdapterSpec;
    const specWithoutTriggerAsChild = {
      ...spec,
      select: {
        ...spec.select,
        asChildTrigger: {
          ...spec.select.asChildTrigger,
          merges: ["aria"],
        },
      },
    };

    await expect(
      writeAstroSelectSpecializedAdapterSpec(
        "C:/tmp/starwind-select-spec-drift",
        specWithoutHiddenInput,
        "",
        "",
      ),
    ).rejects.toThrow("Select specialized adapter spec hidden input must target the input part.");
    await expect(
      writeReactSelectSpecializedAdapterSpec(
        "C:/tmp/starwind-select-spec-drift",
        specWithoutHiddenInput,
        "",
      ),
    ).rejects.toThrow("Select specialized adapter spec hidden input must target the input part.");
    await expect(
      writeReactSelectSpecializedAdapterSpec(
        "C:/tmp/starwind-select-spec-drift",
        specWithoutTriggerAsChild,
        "",
      ),
    ).rejects.toThrow(
      "Select specialized adapter spec trigger asChild merges must include aria, className, data, ref.",
    );
  });

  it("builds a Combobox floating editable collection spec shell from shared Select and Combobox facts", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);

    expect(validateComboboxSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("combobox");
    expect(spec.category).toBe("floating-value-control");
    expect(spec.combobox.adapterKind).toBe("floating-editable-collection");
    expect(spec.root).toMatchObject({
      discoveryAttribute: "data-sw-combobox",
      part: "root",
      runtimeFactory: "createCombobox",
      runtimeImportSource: "@starwind-ui/runtime/combobox",
    });
    expect(spec.combobox.reusedSelectMetadata).toEqual({
      floating: {
        optionProps: ["side", "align", "sideOffset", "alignOffset", "avoidCollisions"],
        portalPart: "portal",
        popupPart: "popup",
        positionerPart: "positioner",
      },
      form: {
        fieldIntegration: true,
        hiddenInputPart: "hiddenInput",
        props: ["autoComplete", "form", "name", "required", "value"],
        type: "hidden",
      },
      itemContext: { part: "item", valueProp: "value" },
      itemIndicator: {
        hiddenPart: "itemIndicator",
        selectedStateAttribute: "data-state",
      },
      popupRole: "listbox",
    });
    expect(spec.combobox.editableInput).toEqual({
      clearPart: "clear",
      inputGroupPart: "inputGroup",
      inputPart: "input",
      inputSemantics: {
        ariaAutocomplete: "list",
        ariaControlsAttribute: "aria-controls",
        ariaExpandedAttribute: "aria-expanded",
        autocomplete: "off",
        role: "combobox",
      },
      inputValueEvent: {
        callbackProp: "onInputValueChange",
        cancelable: true,
        detailsType: "ComboboxInputValueChangeDetails",
        domEvent: "starwind:input-value-change",
        emitsFrom: "root",
        name: "inputValueChange",
        valueProperty: "inputValue",
        valueType: "string",
      },
      inputValueSetterSync: {
        method: "setInputValue",
        options: { emit: false, filter: false },
        stateModel: "inputValue",
        suppressesEmit: true,
      },
      inputValueState: {
        controlledProp: "inputValue",
        defaultProp: "defaultInputValue",
        getter: "getInputValue",
        name: "inputValue",
        setter: "setInputValue",
        valueType: "string",
      },
      valuePreviewPart: "value",
    });
    expect(spec.combobox.controlledStates).toEqual([
      {
        controlledProp: "inputValue",
        defaultProp: "defaultInputValue",
        getter: "getInputValue",
        name: "inputValue",
        setter: "setInputValue",
        valueType: "string",
      },
      {
        controlledProp: "open",
        defaultProp: "defaultOpen",
        getter: "getOpen",
        name: "open",
        setter: "setOpen",
        valueType: "boolean",
      },
      {
        controlledProp: "value",
        defaultProp: "defaultValue",
        getter: "getValue",
        name: "value",
        setter: "setValue",
        valueType: "string | null",
      },
    ]);
    expect(spec.combobox.runtimeBoundary).toEqual([
      "editable input control",
      "client-side filtering",
      "clear action behavior",
      "collection registration",
      "item text extraction",
      "highlighted item and active descendant state",
      "keyboard navigation",
      "typeahead",
      "value normalization",
      "hidden input sync",
      "form reset",
      "floating placement and updates",
      "dismissal",
      "cleanup",
    ]);
  });

  it("describes Combobox anatomy, namespace, state control, presence, and floating recipes", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);

    expect(spec.combobox.anatomy.map((part) => [part.part, part.defaultElement])).toEqual([
      ["root", "div"],
      ["label", "div"],
      ["inputGroup", "div"],
      ["input", "input"],
      ["trigger", "button"],
      ["icon", "span"],
      ["clear", "button"],
      ["value", "span"],
      ["hiddenInput", "input"],
      ["portal", "div"],
      ["positioner", "div"],
      ["popup", "div"],
      ["empty", "div"],
      ["list", "div"],
      ["group", "div"],
      ["groupLabel", "div"],
      ["item", "div"],
      ["itemText", "span"],
      ["itemIndicator", "span"],
      ["separator", "div"],
    ]);
    expect(
      Object.fromEntries(
        spec.combobox.anatomy.map((part) => [
          part.part,
          {
            discoveryAttribute: part.discoveryAttribute,
            initialAttributes: part.initialAttributes,
            publicRef: part.publicRef,
          },
        ]),
      ),
    ).toEqual({
      clear: {
        discoveryAttribute: "data-sw-combobox-clear",
        initialAttributes: ["type"],
        publicRef: false,
      },
      empty: {
        discoveryAttribute: "data-sw-combobox-empty",
        initialAttributes: ["hidden"],
        publicRef: false,
      },
      group: {
        discoveryAttribute: "data-sw-combobox-group",
        initialAttributes: [],
        publicRef: false,
      },
      groupLabel: {
        discoveryAttribute: "data-sw-combobox-group-label",
        initialAttributes: [],
        publicRef: false,
      },
      hiddenInput: {
        discoveryAttribute: "data-sw-combobox-hidden-input",
        initialAttributes: ["type", "form", "name", "value", "aria-hidden", "tabIndex"],
        publicRef: false,
      },
      icon: {
        discoveryAttribute: "data-sw-combobox-icon",
        initialAttributes: ["aria-hidden"],
        publicRef: false,
      },
      input: {
        discoveryAttribute: "data-sw-combobox-input",
        initialAttributes: [
          "aria-autocomplete",
          "aria-controls",
          "aria-expanded",
          "autocomplete",
          "value",
        ],
        publicRef: true,
      },
      inputGroup: {
        discoveryAttribute: "data-sw-combobox-input-group",
        initialAttributes: [],
        publicRef: false,
      },
      item: {
        discoveryAttribute: "data-sw-combobox-item",
        initialAttributes: ["data-value", "aria-selected", "aria-disabled", "data-disabled"],
        publicRef: true,
      },
      itemIndicator: {
        discoveryAttribute: "data-sw-combobox-item-indicator",
        initialAttributes: ["aria-hidden", "data-state", "data-hidden", "hidden"],
        publicRef: false,
      },
      itemText: {
        discoveryAttribute: "data-sw-combobox-item-text",
        initialAttributes: [],
        publicRef: false,
      },
      label: {
        discoveryAttribute: "data-sw-combobox-label",
        initialAttributes: [],
        publicRef: false,
      },
      list: {
        discoveryAttribute: "data-sw-combobox-list",
        initialAttributes: [],
        publicRef: false,
      },
      popup: {
        discoveryAttribute: "data-sw-combobox-popup",
        initialAttributes: [
          "hidden",
          "tabIndex",
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-align-offset",
          "data-avoid-collisions",
        ],
        publicRef: true,
      },
      portal: {
        discoveryAttribute: "data-sw-combobox-portal",
        initialAttributes: [],
        publicRef: false,
      },
      positioner: {
        discoveryAttribute: "data-sw-combobox-positioner",
        initialAttributes: [
          "data-side",
          "data-align",
          "data-side-offset",
          "data-align-offset",
          "data-avoid-collisions",
        ],
        publicRef: false,
      },
      root: {
        discoveryAttribute: "data-sw-combobox",
        initialAttributes: [
          "data-state",
          "data-autocomplete",
          "data-default-input-value",
          "data-default-open",
          "data-default-value",
          "data-disabled",
          "data-filter-mode",
          "data-form",
          "data-highlight-item-on-hover",
          "data-input-value",
          "data-locale",
          "data-modal",
          "data-name",
          "data-readonly",
          "data-required",
        ],
        publicRef: true,
      },
      separator: {
        discoveryAttribute: "data-sw-combobox-separator",
        initialAttributes: ["aria-orientation"],
        publicRef: false,
      },
      trigger: {
        discoveryAttribute: "data-sw-combobox-trigger",
        initialAttributes: ["aria-haspopup", "aria-expanded", "data-state"],
        publicRef: true,
      },
      value: {
        discoveryAttribute: "data-sw-combobox-value",
        initialAttributes: [],
        publicRef: false,
      },
    });

    expect(spec.combobox.namespace).toEqual({
      defaultExport: "Combobox",
      defaultNamespace: true,
      memberParts: [
        "root",
        "label",
        "inputGroup",
        "input",
        "trigger",
        "icon",
        "clear",
        "value",
        "portal",
        "positioner",
        "popup",
        "empty",
        "list",
        "group",
        "groupLabel",
        "item",
        "itemText",
        "itemIndicator",
        "separator",
      ],
      namedExports: [
        "Combobox",
        "ComboboxClear",
        "ComboboxEmpty",
        "ComboboxGroup",
        "ComboboxGroupLabel",
        "ComboboxIcon",
        "ComboboxInput",
        "ComboboxInputGroup",
        "ComboboxItem",
        "ComboboxItemIndicator",
        "ComboboxItemText",
        "ComboboxLabel",
        "ComboboxList",
        "ComboboxPopup",
        "ComboboxPortal",
        "ComboboxPositioner",
        "ComboboxRoot",
        "ComboboxSeparator",
        "ComboboxTrigger",
        "ComboboxValue",
      ],
      namespace: "Combobox",
      objectEntries: [
        { exportName: "ComboboxRoot", part: "root", property: "Root" },
        { exportName: "ComboboxLabel", part: "label", property: "Label" },
        { exportName: "ComboboxInputGroup", part: "inputGroup", property: "InputGroup" },
        { exportName: "ComboboxInput", part: "input", property: "Input" },
        { exportName: "ComboboxTrigger", part: "trigger", property: "Trigger" },
        { exportName: "ComboboxIcon", part: "icon", property: "Icon" },
        { exportName: "ComboboxClear", part: "clear", property: "Clear" },
        { exportName: "ComboboxValue", part: "value", property: "Value" },
        { exportName: "ComboboxPortal", part: "portal", property: "Portal" },
        { exportName: "ComboboxPositioner", part: "positioner", property: "Positioner" },
        { exportName: "ComboboxPopup", part: "popup", property: "Popup" },
        { exportName: "ComboboxEmpty", part: "empty", property: "Empty" },
        { exportName: "ComboboxList", part: "list", property: "List" },
        { exportName: "ComboboxGroup", part: "group", property: "Group" },
        { exportName: "ComboboxGroupLabel", part: "groupLabel", property: "GroupLabel" },
        { exportName: "ComboboxItem", part: "item", property: "Item" },
        { exportName: "ComboboxItemText", part: "itemText", property: "ItemText" },
        {
          exportName: "ComboboxItemIndicator",
          part: "itemIndicator",
          property: "ItemIndicator",
        },
        { exportName: "ComboboxSeparator", part: "separator", property: "Separator" },
      ],
    });
    expect(spec.combobox.namespace.memberParts).not.toContain("hiddenInput");
    expect(spec.combobox.namespace.namedExports).not.toContain("ComboboxHiddenInput");
    expect(spec.combobox.namespace.objectEntries).not.toContainEqual(
      expect.objectContaining({ part: "hiddenInput" }),
    );
    expect(spec.combobox.reusedSelectMetadata.form.hiddenInputPart).toBe("hiddenInput");
    expect(spec.combobox.stateControl).toEqual({
      events: [
        {
          callbackProp: "onInputValueChange",
          cancelable: true,
          detailsType: "ComboboxInputValueChangeDetails",
          domEvent: "starwind:input-value-change",
          emitsFrom: "root",
          name: "inputValueChange",
          valueProperty: "inputValue",
          valueType: "string",
        },
        {
          callbackProp: "onOpenChange",
          cancelable: true,
          detailsType: "ComboboxOpenChangeDetails",
          domEvent: "starwind:open-change",
          emitsFrom: "root",
          name: "openChange",
          valueProperty: "open",
          valueType: "boolean",
        },
        {
          callbackProp: "onValueChange",
          cancelable: true,
          detailsType: "ComboboxValueChangeDetails",
          domEvent: "starwind:value-change",
          emitsFrom: "root",
          name: "valueChange",
          valueProperty: "value",
          valueType: "string | null",
        },
      ],
      runtimeBoundary: [
        "Runtime owns client-side filtering; adapters only suppress filtering during controlled inputValue resync.",
        "Runtime owns item resolution; adapters only project state, events, and setter sync facts.",
      ],
      setterSync: [
        {
          method: "setInputValue",
          options: { emit: false, filter: false },
          stateModel: "inputValue",
          suppressesEmit: true,
        },
        {
          method: "setOpen",
          stateModel: "open",
          suppressesEmit: true,
        },
        {
          method: "setValue",
          stateModel: "value",
          suppressesEmit: true,
        },
      ],
      states: [
        {
          controlledProp: "inputValue",
          defaultProp: "defaultInputValue",
          getter: "getInputValue",
          name: "inputValue",
          setter: "setInputValue",
          valueType: "string",
        },
        {
          controlledProp: "open",
          defaultProp: "defaultOpen",
          getter: "getOpen",
          name: "open",
          setter: "setOpen",
          valueType: "boolean",
        },
        {
          controlledProp: "value",
          defaultProp: "defaultValue",
          getter: "getValue",
          name: "value",
          setter: "setValue",
          valueType: "string | null",
        },
      ],
    });
    for (const setter of spec.combobox.stateControl.setterSync) {
      expect(Object.keys(setter)).not.toContain("filtering");
      expect(Object.keys(setter)).not.toContain("itemResolution");
      expect(Object.keys(setter)).not.toContain("runtimeBehavior");
    }
    expect(spec.sourcePrimitiveContract.runtime.optionPropLifecycles?.disabled).toBe(
      "setter-backed",
    );
    expect(spec.setterSync).toContainEqual({ method: "setDisabled", prop: "disabled" });
    expect(spec.combobox.presence).toEqual({
      initialHiddenParts: ["empty", "popup", "itemIndicator"],
      unmountPolicy: "runtime-owned",
    });
    expect(spec.combobox.floating).toEqual({
      anchorPart: "inputGroup",
      optionProps: ["side", "align", "sideOffset", "alignOffset", "avoidCollisions"],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });

    const withoutIconPart = {
      ...spec,
      parts: spec.parts.filter((part) => part.name !== "icon"),
    } as ComboboxSpecializedAdapterSpec;
    const withNamespaceDrift = {
      ...spec,
      combobox: {
        ...spec.combobox,
        namespace: {
          ...spec.combobox.namespace,
          objectEntries: [...spec.combobox.namespace.objectEntries].reverse(),
        },
      },
    } as unknown as ComboboxSpecializedAdapterSpec;
    const withoutOpenEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "openChange"),
    } as ComboboxSpecializedAdapterSpec;

    expect(validateComboboxSpecializedAdapterSpec(withoutIconPart)).toContain(
      "Combobox specialized adapter spec requires icon anatomy part.",
    );
    expect(validateComboboxSpecializedAdapterSpec(withNamespaceDrift)).toContain(
      "Combobox specialized adapter spec namespace objectEntries must match current package export order.",
    );
    expect(validateComboboxSpecializedAdapterSpec(withoutOpenEvent)).toContain(
      "Combobox specialized adapter spec requires openChange event metadata.",
    );
  });

  it("describes Combobox collection, form, and clear recipes without owning Runtime behavior", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);

    expect(spec.combobox.collection).toEqual({
      empty: {
        hiddenAttribute: "hidden",
        part: "empty",
        runtimeProjection: "filtered-empty-state",
      },
      group: {
        part: "group",
        role: "group",
      },
      groupLabel: {
        part: "groupLabel",
      },
      item: {
        defaultElement: "div",
        disabled: {
          ariaAttribute: "aria-disabled",
          dataAttribute: "data-disabled",
          defaultValue: "false",
          prop: "disabled",
          type: "boolean",
        },
        initialProjection: {
          ariaSelected: "false",
          tabIndex: -1,
        },
        part: "item",
        role: "option",
        runtimeProjection: {
          activeDescendant: {
            attribute: "aria-activedescendant",
            targetPart: "input",
          },
          filtered: {
            attribute: "data-filtered",
          },
          highlighted: {
            attribute: "data-highlighted",
          },
          selected: {
            ariaAttribute: "aria-selected",
            dataAttribute: "data-selected",
            indicatorPart: "itemIndicator",
          },
        },
        value: {
          attribute: "data-value",
          prop: "value",
          required: true,
          type: "string",
        },
      },
      itemIndicator: {
        dataHiddenAttribute: "data-hidden",
        hiddenAttribute: "hidden",
        initialState: "unchecked",
        part: "itemIndicator",
        selectedStateAttribute: "data-state",
      },
      itemText: {
        discoveryAttribute: "data-sw-combobox-item-text",
        part: "itemText",
        textExtraction: "runtime-owned",
      },
      list: {
        part: "list",
      },
      runtimeBoundary: [
        "collection registration",
        "item text extraction",
        "client-side filtering",
        "selected item projection",
        "highlighted item projection",
        "active descendant projection",
        "filtered item projection",
      ],
      separator: {
        ariaOrientation: "horizontal",
        part: "separator",
        role: "separator",
      },
    });
    expect(spec.combobox.collection.itemText).not.toHaveProperty("extractText");
    expect(JSON.stringify(spec.combobox.collection)).not.toContain("innerText");
    expect(JSON.stringify(spec.combobox.collection)).not.toContain("textContent");

    expect(spec.combobox.formControl).toEqual({
      hiddenInput: {
        constantAttributes: {
          ariaHidden: "true",
          tabIndex: "-1",
          type: "hidden",
        },
        contractProps: ["autoComplete", "form", "name", "required", "value"],
        fieldIntegration: true,
        part: "hiddenInput",
        publicExport: false,
        renderedAttributes: ["type", "form", "name", "value", "aria-hidden", "tabIndex"],
        renderedInsidePart: "root",
        type: "hidden",
        valueState: "value",
      },
      rootAttributes: {
        autoComplete: "data-autocomplete",
        form: "data-form",
        name: "data-name",
        required: "data-required",
      },
      runtimeBoundary: ["hidden input sync", "form reset", "field integration"],
      setFormOptions: {
        effectDependencies: ["autoComplete", "form", "name", "required"],
        method: "setFormOptions",
        props: ["autoComplete", "form", "name", "required"],
        runtimeBoundary: "Runtime owns hidden input sync and form participation updates.",
      },
    });
    expect(spec.combobox.formControl.hiddenInput.publicExport).toBe(false);
    expect(spec.combobox.namespace.namedExports).not.toContain("ComboboxHiddenInput");

    expect(spec.combobox.clearAction).toEqual({
      asChild: {
        attribute: "data-as-child",
        merges: ["aria", "className", "data", "events", "ref"],
        part: "clear",
        prop: "asChild",
      },
      defaultElement: "button",
      part: "clear",
      runtimeBoundary: ["clear action behavior", "value reset", "inputValue reset", "filter reset"],
      typeAttribute: {
        attribute: "type",
        value: "button",
      },
    });

    const withCollectionBehavior = {
      ...spec,
      combobox: {
        ...spec.combobox,
        hiddenInputSync: {},
        itemExtraction: {},
      },
    } as unknown as ComboboxSpecializedAdapterSpec;
    const withoutHiddenInputForm = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        form: {
          ...spec.renderPlan.form,
          hiddenInput: undefined,
        },
      },
    } as unknown as ComboboxSpecializedAdapterSpec;
    const withHiddenInputAriaHiddenDrift = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        staticAttributes: spec.renderPlan.staticAttributes.map((attribute) => {
          if (attribute.part === "hiddenInput" && attribute.name === "aria-hidden") {
            return { ...attribute, value: "false" };
          }
          return attribute;
        }),
      },
    } as unknown as ComboboxSpecializedAdapterSpec;
    const withHiddenInputTabIndexDrift = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        staticAttributes: spec.renderPlan.staticAttributes.map((attribute) => {
          if (attribute.part === "hiddenInput" && attribute.name === "tabIndex") {
            return { ...attribute, value: "0" };
          }
          return attribute;
        }),
      },
    } as unknown as ComboboxSpecializedAdapterSpec;
    const withItemTextBehavior = {
      ...spec,
      combobox: {
        ...spec.combobox,
        collection: {
          ...spec.combobox.collection,
          itemText: {
            ...spec.combobox.collection.itemText,
            extractText: "innerText",
          },
        },
      },
    } as unknown as ComboboxSpecializedAdapterSpec;

    expect(validateComboboxSpecializedAdapterSpec(withCollectionBehavior)).toEqual(
      expect.arrayContaining([
        "Combobox specialized adapter spec must not declare combobox.hiddenInputSync; keep Runtime-owned behavior in Runtime controllers.",
        "Combobox specialized adapter spec must not declare combobox.itemExtraction; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
    expect(validateComboboxSpecializedAdapterSpec(withoutHiddenInputForm)).toContain(
      "Combobox specialized adapter spec requires hiddenInput hidden-input metadata.",
    );
    expect(validateComboboxSpecializedAdapterSpec(withHiddenInputAriaHiddenDrift)).toContain(
      'Combobox specialized adapter spec requires aria-hidden="true" metadata for hiddenInput.',
    );
    expect(validateComboboxSpecializedAdapterSpec(withHiddenInputTabIndexDrift)).toContain(
      'Combobox specialized adapter spec requires tabIndex="-1" metadata for hiddenInput.',
    );
    expect(validateComboboxSpecializedAdapterSpec(withItemTextBehavior)).toContain(
      "Combobox specialized adapter spec collection itemText must keep item text extraction Runtime-owned.",
    );
  });

  it("rejects Combobox spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      combobox: {
        ...spec.combobox,
        collectionRegistration: {},
        filtering: {},
        itemResolution: {},
        itemTextExtraction: {},
        keyboardNavigation: {},
        typeahead: {},
      },
    } as unknown as ComboboxSpecializedAdapterSpec;

    expect(validateComboboxSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Combobox specialized adapter spec must not declare combobox.collectionRegistration; keep Runtime-owned behavior in Runtime controllers.",
        "Combobox specialized adapter spec must not declare combobox.filtering; keep Runtime-owned behavior in Runtime controllers.",
        "Combobox specialized adapter spec must not declare combobox.itemResolution; keep Runtime-owned behavior in Runtime controllers.",
        "Combobox specialized adapter spec must not declare combobox.itemTextExtraction; keep Runtime-owned behavior in Runtime controllers.",
        "Combobox specialized adapter spec must not declare combobox.keyboardNavigation; keep Runtime-owned behavior in Runtime controllers.",
        "Combobox specialized adapter spec must not declare combobox.typeahead; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("describes Tooltip specialized adapter spec anatomy, state, options, floating, and namespace recipes", () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);

    expect(validateTooltipSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("tooltip");
    expect(spec.category).toBe("presence-floating-overlay");
    expect(spec.tooltip.adapterKind).toBe("timed-floating-overlay");
    expect(spec.root).toMatchObject({
      discoveryAttribute: "data-sw-tooltip",
      part: "root",
      runtimeFactory: "createTooltip",
      runtimeImportSource: "@starwind-ui/runtime/tooltip",
    });
    expect(spec.tooltip.anatomy.map((part) => [part.part, part.defaultElement])).toEqual([
      ["root", "div"],
      ["trigger", "button"],
      ["portal", "div"],
      ["positioner", "div"],
      ["popup", "div"],
      ["arrow", "div"],
    ]);
    expect(
      Object.fromEntries(
        spec.tooltip.anatomy.map((part) => [
          part.part,
          {
            discoveryAttribute: part.discoveryAttribute,
            initialAttributes: part.initialAttributes,
            publicRef: part.publicRef,
            role: part.role,
          },
        ]),
      ),
    ).toEqual({
      arrow: {
        discoveryAttribute: "data-sw-tooltip-arrow",
        initialAttributes: ["data-state"],
        publicRef: true,
        role: undefined,
      },
      popup: {
        discoveryAttribute: "data-sw-tooltip-popup",
        initialAttributes: [
          "role",
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
          "hidden",
        ],
        publicRef: true,
        role: "tooltip",
      },
      portal: {
        discoveryAttribute: "data-sw-tooltip-portal",
        initialAttributes: [],
        publicRef: true,
        role: undefined,
      },
      positioner: {
        discoveryAttribute: "data-sw-tooltip-positioner",
        initialAttributes: [
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
        ],
        publicRef: true,
        role: undefined,
      },
      root: {
        discoveryAttribute: "data-sw-tooltip",
        initialAttributes: [
          "data-default-open",
          "data-close-delay",
          "data-close-on-escape",
          "data-close-on-outside-interact",
          "data-content-hoverable",
          "data-disabled",
          "data-open-delay",
          "data-state",
        ],
        publicRef: true,
        role: undefined,
      },
      trigger: {
        discoveryAttribute: "data-sw-tooltip-trigger",
        initialAttributes: [
          "type",
          "data-as-child",
          "data-disabled",
          "aria-disabled",
          "data-state",
          "disabled",
        ],
        publicRef: true,
        role: undefined,
      },
    });
    expect(spec.tooltip.stateControl).toEqual({
      event: {
        callbackProp: "onOpenChange",
        cancelable: true,
        detailsType: "TooltipOpenChangeDetails",
        domEvent: "starwind:open-change",
        emitsFrom: "root",
        name: "openChange",
        valueProperty: "open",
        valueType: "boolean",
      },
      runtimeBoundary: [
        "Runtime owns hover/focus timing; adapters only project open state and event forwarding.",
        "Runtime owns delayed hide and cancellation; adapters only call setOpen for controlled resync.",
      ],
      setterSync: {
        disabled: {
          method: "setDisabled",
          prop: "disabled",
        },
        open: {
          method: "setOpen",
          options: { emit: false },
          stateModel: "open",
          suppressesEmit: true,
        },
      },
      state: {
        controlledProp: "open",
        defaultProp: "defaultOpen",
        getter: "getOpen",
        name: "open",
        setter: "setOpen",
        valueType: "boolean",
      },
    });
    expect(spec.tooltip.options).toEqual({
      disabled: {
        defaultValue: "false",
        prop: "disabled",
        rootAttribute: "data-disabled",
        setter: "setDisabled",
        triggerAttributes: {
          ariaDisabled: "aria-disabled",
          dataDisabled: "data-disabled",
          nativeDisabled: "disabled",
        },
        type: "boolean",
      },
      dismissal: {
        closeOnEscape: {
          attribute: "data-close-on-escape",
          defaultValue: "true",
          prop: "closeOnEscape",
          type: "boolean",
        },
        closeOnOutsideInteract: {
          attribute: "data-close-on-outside-interact",
          defaultValue: "true",
          prop: "closeOnOutsideInteract",
          type: "boolean",
        },
        runtimeBoundary: "Runtime owns Escape and outside interaction dismissal.",
      },
      timing: {
        closeDelay: {
          attribute: "data-close-delay",
          defaultValue: "200",
          prop: "closeDelay",
          type: "number",
        },
        disableHoverableContent: {
          contentHoverableAttribute: "data-content-hoverable",
          defaultValue: "false",
          prop: "disableHoverableContent",
          type: "boolean",
        },
        openDelay: {
          attribute: "data-open-delay",
          defaultValue: "200",
          prop: "openDelay",
          type: "number",
        },
        runtimeBoundary: "Runtime owns hover/focus timers and hoverable-content coordination.",
      },
    });
    expect(spec.tooltip.accessibility).toEqual({
      ariaDescription: {
        relationship: "runtime-owned-aria-describedby",
        popupPart: "popup",
        triggerPart: "trigger",
      },
      nonInteractivePopup: {
        part: "popup",
        runtimeBoundary: [
          "Runtime warns on interactive descendants.",
          "Adapters omit popup tabIndex and only project tooltip role.",
        ],
        tabIndex: "omitted",
      },
      popupRole: "tooltip",
    });
    expect(spec.tooltip.asChildTrigger).toEqual({
      attribute: "data-as-child",
      merges: ["data", "ref"],
      part: "trigger",
      prop: "asChild",
      wrapperElement: "span",
    });
    expect(spec.tooltip.presence).toEqual({
      initialHiddenParts: ["popup"],
      unmountPolicy: "runtime-owned",
    });
    expect(spec.tooltip.floating).toEqual({
      anchorPart: "trigger",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });
    expect(spec.tooltip.namespace).toEqual({
      defaultExport: "Tooltip",
      defaultNamespace: true,
      memberParts: ["root", "trigger", "portal", "positioner", "popup", "arrow"],
      namedExports: [
        "Tooltip",
        "TooltipArrow",
        "TooltipPopup",
        "TooltipPortal",
        "TooltipPositioner",
        "TooltipRoot",
        "TooltipTrigger",
      ],
      namespace: "Tooltip",
      objectEntries: [
        { exportName: "TooltipRoot", part: "root", property: "Root" },
        { exportName: "TooltipTrigger", part: "trigger", property: "Trigger" },
        { exportName: "TooltipPortal", part: "portal", property: "Portal" },
        { exportName: "TooltipPositioner", part: "positioner", property: "Positioner" },
        { exportName: "TooltipPopup", part: "popup", property: "Popup" },
        { exportName: "TooltipArrow", part: "arrow", property: "Arrow" },
      ],
    });
    expect(spec.tooltip.runtimeBoundary).toEqual([
      "hover/focus timing",
      "non-interactive content guardrails",
      "aria-describedby wiring",
      "hoverable-content coordination",
      "delayed hide and presence cleanup",
      "portal movement",
      "Floating UI auto-update",
      "Escape and outside interaction dismissal",
      "controller destroy cleanup",
    ]);
  });

  it("rejects Tooltip specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      tooltip: {
        ...spec.tooltip,
        dismissalAlgorithms: {},
        hoverFocusTimers: {},
      },
    } as unknown as TooltipSpecializedAdapterSpec;

    expect(validateTooltipSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Tooltip specialized adapter spec must not declare tooltip.dismissalAlgorithms; keep Runtime-owned behavior in Runtime controllers.",
        "Tooltip specialized adapter spec must not declare tooltip.hoverFocusTimers; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Tooltip source-fact drift without throwing", () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);
    const withoutOpenState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "open"),
    } as TooltipSpecializedAdapterSpec;
    const withPopupTabIndex = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        staticAttributes: [
          ...spec.renderPlan.staticAttributes,
          { name: "tabIndex", part: "popup", source: "constant", value: "-1" },
        ],
      },
    } as TooltipSpecializedAdapterSpec;
    const withNamespaceDrift = {
      ...spec,
      tooltip: {
        ...spec.tooltip,
        namespace: {
          ...spec.tooltip.namespace,
          objectEntries: [...spec.tooltip.namespace.objectEntries].reverse(),
        },
      },
    } as TooltipSpecializedAdapterSpec;

    expect(() => validateTooltipSpecializedAdapterSpec(withoutOpenState)).not.toThrow();
    expect(() => validateTooltipSpecializedAdapterSpec(withPopupTabIndex)).not.toThrow();
    expect(() => validateTooltipSpecializedAdapterSpec(withNamespaceDrift)).not.toThrow();
    expect(validateTooltipSpecializedAdapterSpec(withoutOpenState)).toContain(
      "Tooltip specialized adapter spec requires open state metadata.",
    );
    expect(validateTooltipSpecializedAdapterSpec(withPopupTabIndex)).toContain(
      "Tooltip specialized adapter spec popup must omit tabIndex metadata.",
    );
    expect(validateTooltipSpecializedAdapterSpec(withNamespaceDrift)).toContain(
      "Tooltip specialized adapter spec namespace objectEntries must match generated export order.",
    );
  });

  it("rejects Tooltip output models when adapter-facing floating facts drift", () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);
    const withoutSideFloatingFact = {
      ...spec,
      tooltip: {
        ...spec.tooltip,
        floating: {
          ...spec.tooltip.floating,
          optionProps: spec.tooltip.floating.optionProps.filter((prop) => prop !== "side"),
        },
      },
    } as TooltipSpecializedAdapterSpec;
    const withoutPopupSideAttribute = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        staticAttributes: spec.renderPlan.staticAttributes.filter(
          (attribute) => !(attribute.part === "popup" && attribute.name === "data-side"),
        ),
      },
    } as TooltipSpecializedAdapterSpec;

    expect(() => buildTooltipAdapterOutputModel(withoutSideFloatingFact)).toThrow(
      "Tooltip Adapter Output Model cannot build from invalid Tooltip spec:",
    );
    expect(() => buildTooltipAdapterOutputModel(withoutPopupSideAttribute)).toThrow(
      "Tooltip specialized adapter spec popup initialAttributes must match contract.",
    );
  });

  it("describes Preview Card specialized adapter spec anatomy, trigger projection, state, options, floating, optional parts, and namespace recipes", () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);

    expect(validatePreviewCardSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("preview-card");
    expect(spec.category).toBe("presence-floating-overlay");
    expect(spec.previewCard.adapterKind).toBe("timed-floating-overlay");
    expect(spec.root).toMatchObject({
      discoveryAttribute: "data-sw-preview-card",
      part: "root",
      runtimeFactory: "createPreviewCard",
      runtimeImportSource: "@starwind-ui/runtime/preview-card",
    });
    expect(spec.previewCard.anatomy.map((part) => [part.part, part.defaultElement])).toEqual([
      ["root", "div"],
      ["trigger", "button"],
      ["portal", "div"],
      ["positioner", "div"],
      ["popup", "div"],
      ["arrow", "div"],
      ["backdrop", "div"],
      ["viewport", "div"],
    ]);
    expect(
      Object.fromEntries(
        spec.previewCard.anatomy.map((part) => [
          part.part,
          {
            discoveryAttribute: part.discoveryAttribute,
            initialAttributes: part.initialAttributes,
            publicRef: part.publicRef,
            role: part.role,
          },
        ]),
      ),
    ).toEqual({
      arrow: {
        discoveryAttribute: "data-sw-preview-card-arrow",
        initialAttributes: ["data-state"],
        publicRef: true,
        role: undefined,
      },
      backdrop: {
        discoveryAttribute: "data-sw-preview-card-backdrop",
        initialAttributes: ["data-state", "hidden"],
        publicRef: true,
        role: undefined,
      },
      popup: {
        discoveryAttribute: "data-sw-preview-card-popup",
        initialAttributes: [
          "role",
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
          "hidden",
        ],
        publicRef: true,
        role: "tooltip",
      },
      portal: {
        discoveryAttribute: "data-sw-preview-card-portal",
        initialAttributes: [],
        publicRef: true,
        role: undefined,
      },
      positioner: {
        discoveryAttribute: "data-sw-preview-card-positioner",
        initialAttributes: [
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
        ],
        publicRef: true,
        role: undefined,
      },
      root: {
        discoveryAttribute: "data-sw-preview-card",
        initialAttributes: [
          "data-default-open",
          "data-close-delay",
          "data-close-on-escape",
          "data-close-on-outside-interact",
          "data-content-hoverable",
          "data-open-delay",
          "data-state",
        ],
        publicRef: true,
        role: undefined,
      },
      trigger: {
        discoveryAttribute: "data-sw-preview-card-trigger",
        initialAttributes: [
          "type",
          "data-as-child",
          "data-close-delay",
          "data-disabled",
          "data-open-delay",
          "aria-disabled",
          "data-state",
          "disabled",
        ],
        publicRef: true,
        role: undefined,
      },
      viewport: {
        discoveryAttribute: "data-sw-preview-card-viewport",
        initialAttributes: ["data-state"],
        publicRef: true,
        role: undefined,
      },
    });
    expect(spec.previewCard.stateControl).toEqual({
      event: {
        callbackProp: "onOpenChange",
        cancelable: true,
        detailsType: "PreviewCardOpenChangeDetails",
        domEvent: "starwind:open-change",
        emitsFrom: "root",
        name: "openChange",
        valueProperty: "open",
        valueType: "boolean",
      },
      runtimeBoundary: [
        "Runtime owns hover/focus timing; adapters only project open state and event forwarding.",
        "Runtime owns delayed hide and cancellation; adapters only call setOpen for controlled resync.",
      ],
      setterSync: {
        open: {
          method: "setOpen",
          options: { emit: false },
          stateModel: "open",
          suppressesEmit: true,
        },
      },
      state: {
        controlledProp: "open",
        defaultProp: "defaultOpen",
        getter: "getOpen",
        name: "open",
        setter: "setOpen",
        valueType: "boolean",
      },
    });
    expect(spec.previewCard.options).toEqual({
      dismissal: {
        closeOnEscape: {
          attribute: "data-close-on-escape",
          defaultValue: "true",
          prop: "closeOnEscape",
          type: "boolean",
        },
        closeOnOutsideInteract: {
          attribute: "data-close-on-outside-interact",
          defaultValue: "true",
          prop: "closeOnOutsideInteract",
          type: "boolean",
        },
        runtimeBoundary: "Runtime owns Escape and outside interaction dismissal.",
      },
      timing: {
        closeDelay: {
          attribute: "data-close-delay",
          defaultValue: "300",
          prop: "closeDelay",
          type: "number",
        },
        disableHoverableContent: {
          contentHoverableAttribute: "data-content-hoverable",
          defaultValue: "false",
          prop: "disableHoverableContent",
          type: "boolean",
        },
        openDelay: {
          attribute: "data-open-delay",
          defaultValue: "600",
          prop: "openDelay",
          type: "number",
        },
        runtimeBoundary: "Runtime owns hover/focus timers and hoverable-content coordination.",
      },
      triggerDisabled: {
        attributes: {
          ariaDisabled: "aria-disabled",
          dataDisabled: "data-disabled",
        },
        defaultValue: "false",
        navigationWhenDisabled: {
          href: "removed",
          tabIndex: -1,
        },
        prop: "disabled",
        type: "boolean",
      },
    });
    expect(spec.previewCard.triggerProjection).toEqual({
      asChildWrapperElement: "div",
      attribute: "data-as-child",
      delayOverrideAttributes: {
        closeDelay: "data-close-delay",
        openDelay: "data-open-delay",
      },
      disabledAttributes: {
        ariaDisabled: "aria-disabled",
        dataDisabled: "data-disabled",
      },
      merges: ["aria", "className", "data", "ref"],
      omittedNativeAttributes: ["type", "disabled"],
      part: "trigger",
      prop: "asChild",
      renderedElement: "a",
      transferAttributes: ["href", "tabindex"],
    });
    expect(spec.previewCard.optionalOverlayParts).toEqual([
      {
        hiddenAttribute: "hidden",
        initialHidden: true,
        part: "backdrop",
        stateAttribute: "data-state",
      },
      {
        hiddenAttribute: undefined,
        initialHidden: false,
        part: "viewport",
        stateAttribute: "data-state",
      },
      {
        hiddenAttribute: undefined,
        initialHidden: false,
        part: "arrow",
        stateAttribute: "data-state",
      },
    ]);
    expect(spec.previewCard.presence).toEqual({
      initialHiddenParts: ["popup", "backdrop"],
      unmountPolicy: "runtime-owned",
    });
    expect(spec.previewCard.floating).toEqual({
      anchorPart: "trigger",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });
    expect(spec.previewCard.namespace).toEqual({
      defaultExport: "PreviewCard",
      defaultNamespace: true,
      memberParts: [
        "root",
        "trigger",
        "portal",
        "positioner",
        "popup",
        "arrow",
        "backdrop",
        "viewport",
      ],
      namedExports: [
        "PreviewCard",
        "PreviewCardArrow",
        "PreviewCardBackdrop",
        "PreviewCardPopup",
        "PreviewCardPortal",
        "PreviewCardPositioner",
        "PreviewCardRoot",
        "PreviewCardTrigger",
        "PreviewCardViewport",
      ],
      namespace: "PreviewCard",
      objectEntries: [
        { exportName: "PreviewCardRoot", part: "root", property: "Root" },
        { exportName: "PreviewCardTrigger", part: "trigger", property: "Trigger" },
        { exportName: "PreviewCardPortal", part: "portal", property: "Portal" },
        { exportName: "PreviewCardPositioner", part: "positioner", property: "Positioner" },
        { exportName: "PreviewCardPopup", part: "popup", property: "Popup" },
        { exportName: "PreviewCardArrow", part: "arrow", property: "Arrow" },
        { exportName: "PreviewCardBackdrop", part: "backdrop", property: "Backdrop" },
        { exportName: "PreviewCardViewport", part: "viewport", property: "Viewport" },
      ],
    });
    expect(spec.previewCard.runtimeBoundary).toEqual([
      "hover/focus timing",
      "hoverable-content coordination",
      "delayed hide and presence cleanup",
      "portal movement",
      "Floating UI auto-update",
      "Escape and outside interaction dismissal",
      "aria-describedby wiring",
      "active trigger and anchor switching",
      "controller destroy cleanup",
    ]);
  });

  it("rejects Preview Card specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      previewCard: {
        ...spec.previewCard,
        delayedHiding: {},
        dismissalAlgorithms: {},
        floatingUpdates: {},
        hoverFocusTimers: {},
        hoverableContentCoordination: {},
      },
    } as unknown as PreviewCardSpecializedAdapterSpec;

    expect(validatePreviewCardSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Preview Card specialized adapter spec must not declare previewCard.delayedHiding; keep Runtime-owned behavior in Runtime controllers.",
        "Preview Card specialized adapter spec must not declare previewCard.dismissalAlgorithms; keep Runtime-owned behavior in Runtime controllers.",
        "Preview Card specialized adapter spec must not declare previewCard.floatingUpdates; keep Runtime-owned behavior in Runtime controllers.",
        "Preview Card specialized adapter spec must not declare previewCard.hoverFocusTimers; keep Runtime-owned behavior in Runtime controllers.",
        "Preview Card specialized adapter spec must not declare previewCard.hoverableContentCoordination; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Preview Card source-fact drift without throwing", () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const withoutOpenState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "open"),
    } as unknown as PreviewCardSpecializedAdapterSpec;
    const withMissingBackdropPresence = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        presence: {
          ...spec.renderPlan.presence!,
          initialHiddenParts: spec.renderPlan.presence!.initialHiddenParts.filter(
            (part) => part !== "backdrop",
          ),
        },
      },
    } as unknown as PreviewCardSpecializedAdapterSpec;
    const withTriggerProjectionDrift = {
      ...spec,
      previewCard: {
        ...spec.previewCard,
        triggerProjection: {
          ...spec.previewCard.triggerProjection,
          renderedElement: "button",
        },
      },
    } as unknown as PreviewCardSpecializedAdapterSpec;
    const withPopupRoleDrift = {
      ...spec,
      previewCard: {
        ...spec.previewCard,
        anatomy: spec.previewCard.anatomy.map((part) =>
          part.part === "popup" ? { ...part, role: undefined } : part,
        ),
      },
    } as PreviewCardSpecializedAdapterSpec;
    const withNamespaceDrift = {
      ...spec,
      previewCard: {
        ...spec.previewCard,
        namespace: {
          ...spec.previewCard.namespace,
          objectEntries: [...spec.previewCard.namespace.objectEntries].reverse(),
        },
      },
    } as PreviewCardSpecializedAdapterSpec;
    const withOptionalPartDrift = {
      ...spec,
      previewCard: {
        ...spec.previewCard,
        optionalOverlayParts: spec.previewCard.optionalOverlayParts.filter(
          (part) => part.part !== "viewport",
        ),
      },
    } as PreviewCardSpecializedAdapterSpec;
    const withoutOpenSetter = {
      ...spec,
      setterSync: spec.setterSync.filter(
        (setter) => !("stateModel" in setter) || setter.stateModel !== "open",
      ),
    } as PreviewCardSpecializedAdapterSpec;

    expect(() => validatePreviewCardSpecializedAdapterSpec(withoutOpenState)).not.toThrow();
    expect(() =>
      validatePreviewCardSpecializedAdapterSpec(withMissingBackdropPresence),
    ).not.toThrow();
    expect(() =>
      validatePreviewCardSpecializedAdapterSpec(withTriggerProjectionDrift),
    ).not.toThrow();
    expect(() => validatePreviewCardSpecializedAdapterSpec(withPopupRoleDrift)).not.toThrow();
    expect(() => validatePreviewCardSpecializedAdapterSpec(withNamespaceDrift)).not.toThrow();
    expect(() => validatePreviewCardSpecializedAdapterSpec(withOptionalPartDrift)).not.toThrow();
    expect(() => validatePreviewCardSpecializedAdapterSpec(withoutOpenSetter)).not.toThrow();
    expect(validatePreviewCardSpecializedAdapterSpec(withoutOpenState)).toContain(
      "Preview Card specialized adapter spec requires open state metadata.",
    );
    expect(validatePreviewCardSpecializedAdapterSpec(withMissingBackdropPresence)).toContain(
      "Preview Card specialized adapter spec presence metadata must match Runtime-owned hidden popup/backdrop facts.",
    );
    expect(validatePreviewCardSpecializedAdapterSpec(withTriggerProjectionDrift)).toContain(
      "Preview Card specialized adapter spec trigger projection must match anchor/asChild output parity facts.",
    );
    expect(validatePreviewCardSpecializedAdapterSpec(withPopupRoleDrift)).toContain(
      "Preview Card specialized adapter spec popup role must stay tooltip.",
    );
    expect(validatePreviewCardSpecializedAdapterSpec(withNamespaceDrift)).toContain(
      "Preview Card specialized adapter spec namespace objectEntries must match generated export order.",
    );
    expect(validatePreviewCardSpecializedAdapterSpec(withOptionalPartDrift)).toContain(
      "Preview Card specialized adapter spec optional overlay parts must match backdrop, viewport, and arrow metadata.",
    );
    expect(validatePreviewCardSpecializedAdapterSpec(withoutOpenSetter)).toContain(
      "Preview Card specialized adapter spec requires open setter metadata.",
    );
  });

  it("describes Accordion specialized adapter spec anatomy, value control, item repetition, presence, framework, and namespace recipes", () => {
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);

    expect(validateAccordionSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.sourcePrimitiveContract).toBe(accordionRuntimeAdapterContract);
    expect(spec.component).toBe("accordion");
    expect(spec.accordion.adapterKind).toBe("repeated-disclosure");
    expect(spec.accordion.anatomy).toEqual([
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-accordion",
        initialAttributes: ["data-type", "data-default-value", "data-collapsible", "data-state"],
        part: "root",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-accordion-item",
        initialAttributes: ["data-value", "data-disabled", "data-state"],
        part: "item",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "h3",
        discoveryAttribute: "data-sw-accordion-header",
        initialAttributes: [],
        part: "header",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "button",
        discoveryAttribute: "data-sw-accordion-trigger",
        initialAttributes: ["type", "aria-expanded", "data-state"],
        part: "trigger",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-accordion-content",
        initialAttributes: ["data-state", "hidden"],
        part: "panel",
        publicRef: true,
        role: "region",
      },
    ]);
    expect(spec.accordion.rootOptions).toEqual({
      collapsible: {
        attribute: "data-collapsible",
        defaultValue: "true",
        lifecycle: "constructor-only",
        prop: "collapsible",
        type: "boolean",
      },
      defaultValue: {
        attribute: "data-default-value",
        lifecycle: "constructor-only",
        prop: "defaultValue",
        type: "AccordionValue",
      },
      type: {
        attribute: "data-type",
        defaultValue: '"single"',
        lifecycle: "constructor-only",
        prop: "type",
        type: '"single" | "multiple"',
      },
    });
    expect(spec.accordion.valueControl).toEqual({
      event: {
        callbackProp: "onValueChange",
        detailsType: "AccordionValueChangeDetails",
        domEvent: "starwind:value-change",
        emitsFrom: "root",
        name: "valueChange",
        valueProperty: "value",
        valueType: "AccordionValue",
      },
      runtimeBoundary: [
        "Runtime owns single/multiple value normalization and item toggle rules.",
        "Adapters only project value state, event forwarding, and setValue controlled resync.",
      ],
      initialRuntimeOption: {
        prop: "value",
        runtimeOption: "value",
        source: "controlledProp",
        targetPart: "root",
      },
      setterSync: {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      state: {
        controlledStateSync: "unsupported",
        controlledProp: "value",
        defaultProp: "defaultValue",
        getter: "getValue",
        initialAttribute: "data-default-value",
        name: "value",
        setter: "setValue",
        valueType: "AccordionValue",
      },
    });
    expect(spec.accordion.repetition).toEqual({
      disabled: {
        attribute: "data-disabled",
        defaultValue: "false",
        prop: "disabled",
        targetPart: "item",
        type: "boolean",
      },
      headerPart: "header",
      itemPart: "item",
      itemValue: {
        attribute: "data-value",
        prop: "value",
        targetPart: "item",
        type: "string",
      },
      panelPart: "panel",
      triggerPart: "trigger",
    });
    expect(spec.accordion.itemContext).toEqual({
      consumers: ["trigger", "panel"],
      name: "accordionItem",
      providerPart: "item",
      provides: ["value", "disabled"],
    });
    expect(spec.accordion.trigger).toEqual({
      buttonTypeAttribute: "type",
      expandedAttribute: "aria-expanded",
      part: "trigger",
      stateAttribute: "data-state",
    });
    expect(spec.accordion.panelVisibility).toEqual({
      activeAttributes: {
        dataState: "data-state",
        hidden: "hidden",
      },
      panelPart: "panel",
      presencePolicy: "runtime-owned-visibility",
      runtimeBoundary:
        "Runtime owns linked trigger/panel ids, panel height measurement, and close-animation hidden cleanup.",
    });
    expect(spec.accordion.namespace).toEqual({
      defaultExport: "Accordion",
      defaultNamespace: true,
      memberParts: ["root", "item", "header", "trigger", "panel"],
      namedExports: [
        "Accordion",
        "AccordionHeader",
        "AccordionItem",
        "AccordionPanel",
        "AccordionRoot",
        "AccordionTrigger",
      ],
      namespace: "Accordion",
      objectEntries: [
        { exportName: "AccordionRoot", part: "root", property: "Root" },
        { exportName: "AccordionItem", part: "item", property: "Item" },
        { exportName: "AccordionHeader", part: "header", property: "Header" },
        { exportName: "AccordionTrigger", part: "trigger", property: "Trigger" },
        { exportName: "AccordionPanel", part: "panel", property: "Panel" },
      ],
    });
    expect(spec.accordion.runtimeBoundary).toEqual([
      "value normalization for single and multiple modes",
      "item discovery and structural child changes",
      "trigger button keyboarding",
      "trigger and panel id linking",
      "panel height measurement",
      "close-animation hidden cleanup",
      "controller recreation for creation-only root options",
    ]);
  });

  it("builds and prints Accordion through the Adapter Output Model", async () => {
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);
    const outputModel = buildAccordionAdapterOutputModel(spec);
    const astroFiles = printAstroAccordionAdapterOutputModel(spec);
    const reactFiles = printReactAccordionAdapterOutputModel(spec);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(outputModel.files)).toBe(false);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "repeated-disclosure", part: "root" }),
      expect.objectContaining({ kind: "repeated-disclosure", part: "item" }),
      expect.objectContaining({ kind: "repeated-disclosure", part: "header" }),
      expect.objectContaining({ kind: "repeated-disclosure", part: "trigger" }),
      expect.objectContaining({ kind: "repeated-disclosure", part: "panel" }),
    ]);
    expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "repeated-disclosure" }),
      }),
    );

    const root = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "root",
    );
    const item = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "item",
    );
    if (!root || root.kind !== "component") {
      throw new Error("Accordion output model is missing root component file.");
    }
    expect(root).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          lifecycle: expect.objectContaining({ factory: "createAccordion" }),
          render: expect.objectContaining({
            attrs: [{ name: "data-sw-accordion" }],
          }),
          stateSync: [
            expect.objectContaining({
              setter: "setValue",
              state: "value",
              valueProp: "value",
            }),
          ],
        }),
      }),
    );
    expect(root?.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          attrs: expect.objectContaining({
            collapsible: "data-collapsible",
            defaultValue: "data-default-value",
            rootState: "data-state",
            type: "data-type",
          }),
        }),
      }),
    );
    expect(item).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          context: [
            expect.objectContaining({
              name: "accordionItem",
              role: "provider",
            }),
          ],
        }),
      }),
    );

    for (const [targetPackage, files, extension] of [
      ["astro", astroFiles, ".astro"],
      ["react", reactFiles, ".tsx"],
    ] as const) {
      for (const file of spec.files) {
        const filePath = `${file.path}${file.kind === "index" ? ".ts" : extension}`;
        const printedFile = getPrintedFile(files, filePath);
        const packagePath = join(process.cwd(), "packages", targetPackage, "src", filePath);

        expect(await formatGeneratedOutput(printedFile, packagePath)).toBe(
          readGeneratedPackageBody(`packages/${targetPackage}/src`, filePath),
        );
      }
    }
  }, 20_000);

  it("rejects Accordion specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      accordion: {
        ...spec.accordion,
        buttonKeyboarding: {},
        cleanup: {},
        idLinking: {},
        panelMeasurement: {},
        valueNormalization: {},
      },
    } as unknown as AccordionSpecializedAdapterSpec;

    expect(validateAccordionSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Accordion specialized adapter spec must not declare accordion.buttonKeyboarding; keep Runtime-owned behavior in Runtime controllers.",
        "Accordion specialized adapter spec must not declare accordion.cleanup; keep Runtime-owned behavior in Runtime controllers.",
        "Accordion specialized adapter spec must not declare accordion.idLinking; keep Runtime-owned behavior in Runtime controllers.",
        "Accordion specialized adapter spec must not declare accordion.panelMeasurement; keep Runtime-owned behavior in Runtime controllers.",
        "Accordion specialized adapter spec must not declare accordion.valueNormalization; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Accordion specialized adapter spec source-fact drift without throwing", () => {
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);
    const withoutValueState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "value"),
    } as unknown as AccordionSpecializedAdapterSpec;
    const withRootOptionDrift = {
      ...spec,
      accordion: {
        ...spec.accordion,
        rootOptions: {
          ...spec.accordion.rootOptions,
          type: {
            ...spec.accordion.rootOptions.type,
            defaultValue: '"multiple"',
          },
        },
      },
    } as unknown as AccordionSpecializedAdapterSpec;
    const withRepetitionDrift = {
      ...spec,
      accordion: {
        ...spec.accordion,
        repetition: {
          ...spec.accordion.repetition,
          disabled: {
            ...spec.accordion.repetition.disabled,
            attribute: "data-disabled-item",
          },
        },
      },
    } as AccordionSpecializedAdapterSpec;
    const withPanelVisibilityDrift = {
      ...spec,
      accordion: {
        ...spec.accordion,
        panelVisibility: {
          ...spec.accordion.panelVisibility,
          presencePolicy: "framework-owned",
        },
      },
    } as unknown as AccordionSpecializedAdapterSpec;
    const withoutItemValueProp = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "value" || !prop.targets?.includes("item")),
    } as AccordionSpecializedAdapterSpec;
    const withoutItemDisabledProp = {
      ...spec,
      props: spec.props.filter(
        (prop) => prop.name !== "disabled" || !prop.targets?.includes("item"),
      ),
    } as AccordionSpecializedAdapterSpec;
    const withItemContextDrift = {
      ...spec,
      accordion: {
        ...spec.accordion,
        itemContext: {
          ...spec.accordion.itemContext,
          provides: ["value"],
        },
      },
    } as unknown as AccordionSpecializedAdapterSpec;
    const withNamespaceDrift = {
      ...spec,
      accordion: {
        ...spec.accordion,
        namespace: {
          ...spec.accordion.namespace,
          namedExports: [...spec.accordion.namespace.namedExports].reverse(),
        },
      },
    } as AccordionSpecializedAdapterSpec;

    expect(() => validateAccordionSpecializedAdapterSpec(withoutValueState)).not.toThrow();
    expect(() => validateAccordionSpecializedAdapterSpec(withRootOptionDrift)).not.toThrow();
    expect(() => validateAccordionSpecializedAdapterSpec(withRepetitionDrift)).not.toThrow();
    expect(() => validateAccordionSpecializedAdapterSpec(withPanelVisibilityDrift)).not.toThrow();
    expect(() => validateAccordionSpecializedAdapterSpec(withoutItemValueProp)).not.toThrow();
    expect(() => validateAccordionSpecializedAdapterSpec(withoutItemDisabledProp)).not.toThrow();
    expect(() => validateAccordionSpecializedAdapterSpec(withItemContextDrift)).not.toThrow();
    expect(() => validateAccordionSpecializedAdapterSpec(withNamespaceDrift)).not.toThrow();
    expect(validateAccordionSpecializedAdapterSpec(withoutValueState)).toContain(
      "Accordion specialized adapter spec requires value state metadata.",
    );
    expect(validateAccordionSpecializedAdapterSpec(withRootOptionDrift)).toContain(
      "Accordion specialized adapter spec root options must match type, defaultValue, and collapsible facts.",
    );
    expect(validateAccordionSpecializedAdapterSpec(withRepetitionDrift)).toContain(
      "Accordion specialized adapter spec repetition metadata must match item value/disabled and trigger/panel part facts.",
    );
    expect(validateAccordionSpecializedAdapterSpec(withPanelVisibilityDrift)).toContain(
      "Accordion specialized adapter spec panel visibility metadata must match Runtime-owned panel visibility facts.",
    );
    expect(validateAccordionSpecializedAdapterSpec(withoutItemValueProp)).toContain(
      "Accordion specialized adapter spec requires item value prop metadata.",
    );
    expect(validateAccordionSpecializedAdapterSpec(withoutItemDisabledProp)).toContain(
      "Accordion specialized adapter spec requires item disabled prop metadata.",
    );
    expect(validateAccordionSpecializedAdapterSpec(withItemContextDrift)).toContain(
      "Accordion specialized adapter spec item context metadata must match item value/disabled projection facts.",
    );
    expect(validateAccordionSpecializedAdapterSpec(withNamespaceDrift)).toContain(
      "Accordion specialized adapter spec namespace namedExports must match generated export order.",
    );
  });

  it("routes Accordion Astro production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildAccordionAdapterOutputModel",
      buildSpec: "buildAccordionSpecializedAdapterSpec",
      component: "accordion",
    });
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);
    const outputRoot = join(
      "C:/tmp",
      "starwind-accordion-astro-production-repeated-disclosure-spec-writer",
    );

    rmSync(outputRoot, { force: true, recursive: true });
    await generateAstroPrimitiveAccordion(outputRoot, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Accordion Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-accordion-astro-repeated-disclosure-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroAccordionSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Accordion React production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildAccordionAdapterOutputModel",
      buildSpec: "buildAccordionSpecializedAdapterSpec",
      component: "accordion",
    });
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);
    const outputRoot = join(
      "C:/tmp",
      "starwind-accordion-react-production-repeated-disclosure-spec-writer",
    );

    rmSync(outputRoot, { force: true, recursive: true });
    await generateReactPrimitiveAccordion(outputRoot, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Accordion React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildAccordionSpecializedAdapterSpec(accordionRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-accordion-react-repeated-disclosure-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactAccordionSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("describes Sidebar disclosure-control anatomy, states, options, context, asChild, namespace, and boundaries", () => {
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);

    expect(spec.sourcePrimitiveContract).toBe(sidebarRuntimeAdapterContract);
    expect(spec.component).toBe("sidebar");
    expect(spec.category).toBe("presence-disclosure-control");
    expect(spec.sidebar.adapterKind).toBe("presence-disclosure-control");
    expect(
      spec.sidebar.anatomy.map((part) => [
        part.part,
        part.discoveryAttribute,
        part.initialAttributes,
        part.publicRef,
      ]),
    ).toEqual([
      [
        "provider",
        "data-sw-sidebar-provider",
        [
          "data-sw-sidebar-provider",
          "data-default-open",
          "data-default-mobile-open",
          "data-state",
          "data-mobile-open",
          "data-keyboard-shortcut",
          "data-mobile-query",
          "data-persist-open",
          "data-persistence-key",
          "data-persistence-storage",
          "data-persistence-max-age",
        ],
        true,
      ],
      [
        "sidebar",
        "data-sw-sidebar",
        [
          "data-sw-sidebar",
          "data-state",
          "data-collapsible",
          "data-collapsible-mode",
          "data-variant",
          "data-side",
        ],
        true,
      ],
      [
        "trigger",
        "data-sw-sidebar-trigger",
        ["data-sw-sidebar-trigger", "type", "aria-expanded", "data-state"],
        true,
      ],
      [
        "rail",
        "data-sw-sidebar-rail",
        ["data-sw-sidebar-rail", "type", "aria-expanded", "data-state", "tabindex"],
        true,
      ],
      [
        "menuButton",
        "data-sw-sidebar-menu-button",
        ["data-sw-sidebar-menu-button", "data-sidebar-state"],
        true,
      ],
    ]);
    expect(spec.sidebar.stateControls).toEqual({
      mobileOpen: {
        event: {
          callbackProp: "onMobileOpenChange",
          detailsType: "SidebarMobileOpenChangeDetails",
          domEvent: "starwind:sidebar-mobile-change",
          emitsFrom: "provider",
          name: "mobileOpenChange",
          valueProperty: "open",
          valueType: "boolean",
        },
        renderedAttribute: "data-mobile-open",
        setterSync: {
          method: "setMobileOpen",
          options: { emit: false },
          stateModel: "mobileOpen",
          suppressesEmit: true,
        },
        state: {
          controlledProp: "mobileOpen",
          defaultProp: "defaultMobileOpen",
          defaultValue: "false",
          getter: "getMobileOpen",
          initialAttribute: "data-default-mobile-open",
          name: "mobileOpen",
          setter: "setMobileOpen",
          valueType: "boolean",
        },
      },
      open: {
        event: {
          callbackProp: "onOpenChange",
          detailsType: "SidebarOpenChangeDetails",
          domEvent: "starwind:sidebar-change",
          emitsFrom: "provider",
          name: "openChange",
          valueProperty: "open",
          valueType: "boolean",
        },
        renderedAttribute: "data-state",
        setterSync: {
          method: "setOpen",
          options: { emit: false },
          stateModel: "open",
          suppressesEmit: true,
        },
        state: {
          controlledProp: "open",
          defaultProp: "defaultOpen",
          defaultValue: "true",
          getter: "getOpen",
          initialAttribute: "data-default-open",
          name: "open",
          setter: "setOpen",
          valueType: "boolean",
        },
      },
    });
    expect(spec.sidebar.providerOptions).toEqual({
      keyboardShortcut: {
        adapterDefault: true,
        attribute: "data-keyboard-shortcut",
        defaultValue: '"b"',
        lifecycle: "constructor-only",
        prop: "keyboardShortcut",
        type: "string",
      },
      mobileQuery: {
        adapterDefault: true,
        attribute: "data-mobile-query",
        defaultValue: '"(max-width: 767.98px)"',
        lifecycle: "constructor-only",
        prop: "mobileQuery",
        type: "string",
      },
      persistOpen: {
        adapterDefault: true,
        attribute: "data-persist-open",
        defaultValue: "false",
        lifecycle: "constructor-only",
        prop: "persistOpen",
        type: "boolean",
      },
      persistenceKey: {
        adapterDefault: false,
        attribute: "data-persistence-key",
        defaultValue: '"starwind-sidebar-open"',
        lifecycle: "constructor-only",
        prop: "persistenceKey",
        type: "string",
      },
      persistenceMaxAge: {
        adapterDefault: true,
        attribute: "data-persistence-max-age",
        defaultValue: "604800",
        lifecycle: "constructor-only",
        prop: "persistenceMaxAge",
        type: "number",
      },
      persistenceStorage: {
        adapterDefault: false,
        attribute: "data-persistence-storage",
        defaultValue: '"localStorage"',
        lifecycle: "constructor-only",
        prop: "persistenceStorage",
        type: "SidebarPersistenceStorage",
      },
    });
    expect(spec.sidebar.sidebarOptions).toEqual({
      collapsible: {
        attribute: "data-collapsible-mode",
        defaultValue: '"offcanvas"',
        prop: "collapsible",
        type: '"offcanvas" | "icon"',
      },
      side: {
        attribute: "data-side",
        defaultValue: '"left"',
        prop: "side",
        type: '"left" | "right"',
      },
      variant: {
        attribute: "data-variant",
        defaultValue: '"sidebar"',
        prop: "variant",
        type: '"sidebar" | "floating" | "inset"',
      },
    });
    expect(spec.sidebar.toggleTargets).toEqual({
      menuButton: {
        asChild: { merges: ["aria", "className", "data", "events", "ref"], prop: "asChild" },
        discoveryAttribute: "data-sw-sidebar-menu-button",
        part: "menuButton",
        stateAttribute: "data-sidebar-state",
      },
      rail: {
        buttonTypeAttribute: "type",
        discoveryAttribute: "data-sw-sidebar-rail",
        expandedAttribute: "aria-expanded",
        part: "rail",
        stateAttribute: "data-state",
        tabIndexAttribute: "tabindex",
        tabIndexValue: "-1",
      },
      trigger: {
        asChild: { merges: ["aria", "className", "data", "ref"], prop: "asChild" },
        buttonTypeAttribute: "type",
        discoveryAttribute: "data-sw-sidebar-trigger",
        expandedAttribute: "aria-expanded",
        part: "trigger",
        stateAttribute: "data-state",
      },
    });
    expect(spec.sidebar.context).toEqual({
      consumers: ["sidebar", "trigger", "rail", "menuButton"],
      file: "sidebar/SidebarContext",
      hook: "useSidebarContext",
      name: "SidebarContext",
      providerPart: "provider",
      typeName: "SidebarContextValue",
      values: ["expanded", "mobileOpen", "open", "state"],
    });
    expect(spec.sidebar.namespace).toEqual({
      contextExports: ["SidebarContext", "useSidebarContext"],
      contextTypeExports: ["SidebarContextValue"],
      defaultExport: "Sidebar",
      defaultNamespace: true,
      memberParts: ["provider", "sidebar", "trigger", "rail", "menuButton"],
      namedExports: [
        "Sidebar",
        "SidebarComponent",
        "SidebarMenuButton",
        "SidebarProvider",
        "SidebarRail",
        "SidebarTrigger",
      ],
      namespace: "Sidebar",
      objectEntries: [
        { exportName: "SidebarProvider", part: "provider", property: "Provider" },
        { exportName: "SidebarComponent", part: "sidebar", property: "Sidebar" },
        { exportName: "SidebarTrigger", part: "trigger", property: "Trigger" },
        { exportName: "SidebarRail", part: "rail", property: "Rail" },
        { exportName: "SidebarMenuButton", part: "menuButton", property: "MenuButton" },
      ],
    });
    expect(spec.sidebar.runtimeBoundary).toEqual([
      "desktop open state commit and controlled sync",
      "mobile open state commit and controlled sync",
      "storage persistence reads and writes",
      "keyboard shortcut handling",
      "responsive media query controller behavior",
      "provider attribute synchronization",
      "controller cleanup",
    ]);
    expect(spec.sidebar.styledBoundary).toEqual({
      description:
        "Styled Sidebar owns app-layout composition, mobile Sheet composition, menu layout anatomy, tooltip decoration, and visual variants outside provider/sidebar/trigger/rail/menuButton primitive behavior.",
      styledOnlyParts: [
        "inset",
        "content",
        "header",
        "footer",
        "group",
        "groupLabel",
        "groupAction",
        "groupContent",
        "input",
        "separator",
        "menu",
        "menuItem",
        "menuAction",
        "menuBadge",
        "menuSkeleton",
        "menuSub",
        "menuSubItem",
        "menuSubButton",
        "mobileSheet",
      ],
    });
  });

  it("rejects Sidebar disclosure-control behavior fields and drift from contract facts", () => {
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);
    const withStoragePersistence = {
      ...spec,
      sidebar: { ...spec.sidebar, storagePersistence: {} },
    } as unknown as typeof spec;
    const withoutMenuButtonPart = {
      ...spec,
      parts: spec.parts.filter((part) => part.name !== "menuButton"),
    } as unknown as typeof spec;
    const withStateDrift = {
      ...spec,
      sidebar: {
        ...spec.sidebar,
        stateControls: {
          ...spec.sidebar.stateControls,
          open: {
            ...spec.sidebar.stateControls.open,
            state: { ...spec.sidebar.stateControls.open.state, getter: "readOpen" },
          },
        },
      },
    } as unknown as typeof spec;
    const withProviderOptionDrift = {
      ...spec,
      sidebar: {
        ...spec.sidebar,
        providerOptions: {
          ...spec.sidebar.providerOptions,
          keyboardShortcut: {
            ...spec.sidebar.providerOptions.keyboardShortcut,
            attribute: "data-shortcut",
          },
        },
      },
    } as unknown as typeof spec;
    const withContextDrift = {
      ...spec,
      sidebar: {
        ...spec.sidebar,
        context: { ...spec.sidebar.context, consumers: ["trigger"] },
      },
    } as unknown as typeof spec;
    const withAsChildDrift = {
      ...spec,
      sidebar: {
        ...spec.sidebar,
        toggleTargets: {
          ...spec.sidebar.toggleTargets,
          menuButton: {
            ...spec.sidebar.toggleTargets.menuButton,
            asChild: { merges: ["aria", "data", "ref"], prop: "asChild" },
          },
        },
      },
    } as unknown as typeof spec;
    const withoutOpenState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "open"),
    } as unknown as typeof spec;
    const withoutMobileEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "mobileOpenChange"),
    } as unknown as typeof spec;
    const withoutOpenSetter = {
      ...spec,
      setterSync: spec.setterSync.filter(
        (setter) => !("stateModel" in setter) || setter.stateModel !== "open",
      ),
    } as unknown as typeof spec;
    const withoutProviderOptionProp = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "keyboardShortcut"),
    } as unknown as typeof spec;
    const withoutSidebarOptionProp = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "collapsible"),
    } as unknown as typeof spec;

    expect(validateSidebarSpecializedAdapterSpec(withStoragePersistence)).toContain(
      "Sidebar specialized adapter spec must not declare sidebar.storagePersistence; keep Runtime-owned behavior in Runtime controllers.",
    );
    expect(validateSidebarSpecializedAdapterSpec(withoutMenuButtonPart)).toContain(
      "Sidebar specialized adapter spec requires menuButton part.",
    );
    expect(validateSidebarSpecializedAdapterSpec(withStateDrift)).toContain(
      "Sidebar specialized adapter spec state controls must match desktop and mobile state/event/setter facts.",
    );
    expect(validateSidebarSpecializedAdapterSpec(withProviderOptionDrift)).toContain(
      "Sidebar specialized adapter spec provider options must match shortcut, mobile query, and persistence facts.",
    );
    expect(validateSidebarSpecializedAdapterSpec(withContextDrift)).toContain(
      "Sidebar specialized adapter spec context metadata must match provider state projection facts.",
    );
    expect(validateSidebarSpecializedAdapterSpec(withAsChildDrift)).toContain(
      "Sidebar specialized adapter spec toggle targets must match trigger, rail, and menuButton projection facts.",
    );
    expect(() => validateSidebarSpecializedAdapterSpec(withoutOpenState)).not.toThrow();
    expect(validateSidebarSpecializedAdapterSpec(withoutOpenState)).toContain(
      "Sidebar specialized adapter spec requires open state metadata.",
    );
    expect(() => validateSidebarSpecializedAdapterSpec(withoutMobileEvent)).not.toThrow();
    expect(validateSidebarSpecializedAdapterSpec(withoutMobileEvent)).toContain(
      "Sidebar specialized adapter spec requires mobileOpenChange event metadata.",
    );
    expect(() => validateSidebarSpecializedAdapterSpec(withoutOpenSetter)).not.toThrow();
    expect(validateSidebarSpecializedAdapterSpec(withoutOpenSetter)).toContain(
      "Sidebar specialized adapter spec requires open setter metadata.",
    );
    expect(() => validateSidebarSpecializedAdapterSpec(withoutProviderOptionProp)).not.toThrow();
    expect(validateSidebarSpecializedAdapterSpec(withoutProviderOptionProp)).toContain(
      "Sidebar specialized adapter spec requires keyboardShortcut provider option metadata.",
    );
    expect(() => validateSidebarSpecializedAdapterSpec(withoutSidebarOptionProp)).not.toThrow();
    expect(validateSidebarSpecializedAdapterSpec(withoutSidebarOptionProp)).toContain(
      "Sidebar specialized adapter spec requires collapsible sidebar option metadata.",
    );
  });

  it("routes Sidebar Astro production generation through the disclosure-control spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildSidebarAdapterOutputModel",
      buildSpec: "buildSidebarSpecializedAdapterSpec",
      component: "sidebar",
    });
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-sidebar-astro-production-disclosure-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await generateAstroPrimitiveSidebar(outputRoot, getGeneratedAstroWrappersAstroHeader(), "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("builds and prints Sidebar Astro through the Adapter Output Model", async () => {
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);
    const outputModel = buildSidebarAdapterOutputModel(spec);
    const printedFiles = printAstroSidebarAdapterOutputModel(spec);

    expect(printedFiles.map((file) => file.path)).toEqual(
      outputModel.files
        .filter((file) => !file.target || file.target === "astro")
        .map((file) => (file.kind === "component" ? `${file.path}.astro` : file.path)),
    );

    const provider = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarProvider.astro"),
      join(process.cwd(), "packages/astro/src/sidebar/SidebarProvider.astro"),
    );
    const sidebar = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/Sidebar.astro"),
      join(process.cwd(), "packages/astro/src/sidebar/Sidebar.astro"),
    );
    const trigger = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarTrigger.astro"),
      join(process.cwd(), "packages/astro/src/sidebar/SidebarTrigger.astro"),
    );
    const rail = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarRail.astro"),
      join(process.cwd(), "packages/astro/src/sidebar/SidebarRail.astro"),
    );
    const menuButton = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarMenuButton.astro"),
      join(process.cwd(), "packages/astro/src/sidebar/SidebarMenuButton.astro"),
    );
    const index = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/index.ts"),
      join(process.cwd(), "packages/astro/src/sidebar/index.ts"),
    );

    expect(provider).toContain(
      'import type { SidebarPersistenceStorage } from "@starwind-ui/runtime/sidebar";',
    );
    expect(provider).toContain("data-sw-sidebar-provider");
    expect(provider).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(provider).toContain('data-default-mobile-open={defaultMobileOpen ? "true" : undefined}');
    expect(provider).toContain('data-state={defaultOpen ? "expanded" : "collapsed"}');
    expect(provider).toContain('data-mobile-open={defaultMobileOpen ? "true" : "false"}');
    expect(provider).toContain("data-keyboard-shortcut={keyboardShortcut}");
    expect(provider).toContain("data-mobile-query={mobileQuery}");
    expect(provider).toContain('data-persist-open={persistOpen ? "true" : undefined}');
    expect(provider).toContain("data-persistence-key={persistenceKey}");
    expect(provider).toContain(
      'data-persistence-storage={persistenceStorage === false ? "false" : persistenceStorage}',
    );
    expect(provider).toContain("data-persistence-max-age={persistenceMaxAge}");
    expect(provider).toContain(
      'import { createSidebarController } from "@starwind-ui/runtime/sidebar";',
    );
    expect(provider).toContain("createSidebarController(provider)");
    expect(provider).toContain("registerAstroControllerLifecycle");
    expect(sidebar).toContain("data-sw-sidebar");
    expect(sidebar).toContain('data-state="expanded"');
    expect(sidebar).toContain('data-collapsible=""');
    expect(sidebar).toContain("data-collapsible-mode={collapsible}");
    expect(sidebar).toContain("data-variant={variant}");
    expect(sidebar).toContain("data-side={side}");
    expect(trigger).toContain("data-sw-sidebar-trigger");
    expect(trigger).toContain("data-as-child");
    expect(trigger).toContain('aria-expanded="false"');
    expect(trigger).toContain('data-state="expanded"');
    expect(trigger).toContain('type="button"');
    expect(rail).toContain("data-sw-sidebar-rail");
    expect(rail).toContain('aria-expanded="false"');
    expect(rail).toContain('data-state="expanded"');
    expect(rail).toContain('tabindex="-1"');
    expect(menuButton).toContain("data-sw-sidebar-menu-button");
    expect(menuButton).toContain("data-as-child");
    expect(menuButton).toContain('data-sidebar-state="expanded"');
    expect(menuButton).toContain('type="button"');
    expect(index).toContain("SidebarComponent");
    expect(index).toContain("SidebarMenuButton");
    expect(index).toContain("SidebarMobileOpenChangeDetails");
    expect(index).toContain("SidebarOpenChangeDetails");
    expect(index).toContain("SidebarPersistenceStorage");

    const outputRoot = join("C:/tmp", "starwind-sidebar-astro-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroSidebarSpecializedAdapterSpec(
      outputRoot,
      spec,
      getGeneratedAstroWrappersAstroHeader(),
      "",
    );

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Sidebar Astro output from the disclosure-control spec without changing package bodies", async () => {
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-sidebar-astro-disclosure-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroSidebarSpecializedAdapterSpec(
      outputRoot,
      spec,
      getGeneratedAstroWrappersAstroHeader(),
      "",
    );

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Sidebar React production generation through the disclosure-control spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildSidebarAdapterOutputModel",
      buildSpec: "buildSidebarSpecializedAdapterSpec",
      component: "sidebar",
    });
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-sidebar-react-production-disclosure-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await generateReactPrimitiveSidebar(outputRoot, "");

    for (const filePath of getSidebarReactPackageFilePaths(spec)) {
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("builds and prints Sidebar React through the Adapter Output Model", async () => {
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);
    const outputModel = buildSidebarAdapterOutputModel(spec);
    const reactOutputModel = projectReactSpecializedOutputModel(outputModel);
    const printedFiles = printReactSidebarAdapterOutputModel(spec);

    expect(outputModel.files.some((file) => file.kind === "helper")).toBe(false);
    expect(reactOutputModel.files.find((file) => file.kind === "helper")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "sidebar-context" }),
        path: "sidebar/SidebarContext.tsx",
      }),
    );
    expect(
      projectReactSpecializedOutputModel(reactOutputModel).files.filter(
        (file) => file.path === "sidebar/SidebarContext.tsx",
      ),
    ).toHaveLength(1);
    expectReactSpecializedProjectionToBeIdempotent(outputModel);
    expect(printedFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files
        .filter((file) => !file.target || file.target === "react")
        .map((file) => (file.kind === "component" ? `${file.path}.tsx` : file.path)),
    );

    const provider = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarProvider.tsx"),
      join(process.cwd(), "packages/react/src/sidebar/SidebarProvider.tsx"),
    );
    const context = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarContext.tsx"),
      join(process.cwd(), "packages/react/src/sidebar/SidebarContext.tsx"),
    );
    const sidebar = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/Sidebar.tsx"),
      join(process.cwd(), "packages/react/src/sidebar/Sidebar.tsx"),
    );
    const trigger = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarTrigger.tsx"),
      join(process.cwd(), "packages/react/src/sidebar/SidebarTrigger.tsx"),
    );
    const rail = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarRail.tsx"),
      join(process.cwd(), "packages/react/src/sidebar/SidebarRail.tsx"),
    );
    const menuButton = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/SidebarMenuButton.tsx"),
      join(process.cwd(), "packages/react/src/sidebar/SidebarMenuButton.tsx"),
    );
    const index = await formatGeneratedOutput(
      getPrintedFile(printedFiles, "sidebar/index.ts"),
      join(process.cwd(), "packages/react/src/sidebar/index.ts"),
    );

    const outputRoot = join("C:/tmp", "starwind-sidebar-react-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactSidebarSpecializedAdapterSpec(outputRoot, spec, "");

    const generatedProvider = readFileSync(join(outputRoot, "sidebar/SidebarProvider.tsx"), "utf8");
    expect(generatedProvider).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(generatedProvider).toContain("useIsomorphicLayoutEffect(() => {");
    expect(generatedProvider).not.toContain("React.useEffect(() => {");
    expect(provider).toContain("createSidebarController,");
    expect(provider).toContain("type SidebarMobileOpenChangeDetails");
    expect(provider).toContain("type SidebarOpenChangeDetails");
    expect(provider).toContain("type SidebarPersistenceStorage");
    expect(provider).toContain("const openRef = React.useRef(open);");
    expect(provider).toContain("const mobileOpenRef = React.useRef(mobileOpen);");
    expect(provider).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(provider).toContain("const onMobileOpenChangeRef = React.useRef(onMobileOpenChange);");
    expect(provider).toContain("const defaultOpenRef = React.useRef(defaultOpen);");
    expect(provider).toContain("const defaultMobileOpenRef = React.useRef(defaultMobileOpen);");
    expect(provider).toContain("window.matchMedia(mobileQuery)");
    expect(provider).toContain("createSidebarController(provider, {");
    expect(provider).toContain("defaultOpen: uncontrolledOpenRef.current,");
    expect(provider).toContain("defaultMobileOpen: uncontrolledMobileOpenRef.current,");
    expect(provider).toContain("onOpenChangeRef.current?.(nextOpen, details);");
    expect(provider).toContain("onMobileOpenChangeRef.current?.(nextOpen, details);");
    expect(provider).toContain("instance.setOpen(open, { emit: false });");
    expect(provider).toContain("instance.setMobileOpen(mobileOpen, { emit: false });");
    expect(provider).toContain("expanded: isMobile ? renderedMobileOpen : renderedOpen,");
    expect(provider).toContain('"data-sw-sidebar-provider": ""');
    expect(provider).toContain(
      '"data-default-mobile-open": defaultMobileOpenRef.current ? "true" : undefined',
    );
    expect(provider).toContain('"data-mobile-open": renderedMobileOpen ? "true" : "false"');
    expect(provider).toContain('"data-persist-open": persistOpen ? "true" : undefined');
    expect(provider).toContain("<SidebarContext.Provider value={contextValue}>");
    expect(context).toContain("export type SidebarContextValue");
    expect(context).toContain("expanded: boolean;");
    expect(context).toContain('state: "collapsed" | "expanded";');
    expect(context).toContain(
      "export const SidebarContext = React.createContext<SidebarContextValue | null>(null);",
    );
    expect(sidebar).toContain("const sidebarContext = useSidebarContext();");
    expect(sidebar).toContain('const sidebarState = sidebarContext?.state ?? "expanded";');
    expect(sidebar).toContain("data-sw-sidebar");
    expect(sidebar).toContain('data-collapsible={sidebarState === "collapsed" ? collapsible : ""}');
    expect(sidebar).toContain("data-collapsible-mode={collapsible}");
    expect(trigger).toContain("const sidebarContext = useSidebarContext();");
    expect(trigger).toContain('"data-sw-sidebar-trigger": ""');
    expect(trigger).toContain('"aria-expanded": sidebarContext?.expanded ?? false');
    expect(trigger).toContain('"data-state": sidebarContext?.state ?? "expanded"');
    expect(trigger).toContain("React.cloneElement(child, {");
    expect(rail).toContain("data-sw-sidebar-rail");
    expect(rail).toContain("aria-expanded={sidebarContext?.expanded ?? false}");
    expect(rail).toContain("tabIndex={-1}");
    expect(menuButton).toContain('"data-sw-sidebar-menu-button": ""');
    expect(menuButton).toContain('"data-sidebar-state": sidebarContext?.state ?? "expanded"');
    expect(menuButton).toContain("mergeAsChildProps({ ...menuButtonProps, className }, childProps");
    expect(menuButton).toContain("protectedProps: protectedMenuButtonProps");
    expect(menuButton).not.toContain("function mergeAsChildProps");
    expect(index).toContain("SidebarContext");
    expect(index).toContain("useSidebarContext");
    expect(index).toContain("SidebarContextValue");
    expect(index).toContain("SidebarMobileOpenChangeDetails");
    expect(index).toContain("SidebarOpenChangeDetails");
    expect(index).toContain("SidebarPersistenceStorage");

    for (const filePath of getSidebarReactPackageFilePaths(spec)) {
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Sidebar React output from the disclosure-control spec without changing package bodies", async () => {
    const spec = buildSidebarSpecializedAdapterSpec(sidebarRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-sidebar-react-disclosure-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactSidebarSpecializedAdapterSpec(outputRoot, spec, "");

    for (const filePath of getSidebarReactPackageFilePaths(spec)) {
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("describes Tabs specialized adapter spec anatomy, value control, presence, context, and namespace recipes", () => {
    const spec = buildTabsSpecializedAdapterSpec(tabsRuntimeAdapterContract);

    expect(spec.sourcePrimitiveContract).toBe(tabsRuntimeAdapterContract);
    expect(spec.component).toBe("tabs");
    expect(spec.tabs.adapterKind).toBe("controlled-value-presence");
    expect(spec.tabs.anatomy).toEqual([
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-tabs",
        initialAttributes: [
          "data-default-value",
          "data-orientation",
          "data-sync-key",
          "data-value",
        ],
        part: "root",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-tabs-list",
        initialAttributes: [
          "aria-orientation",
          "data-activate-on-focus",
          "data-loop-focus",
          "data-orientation",
        ],
        part: "list",
        publicRef: true,
        role: "tablist",
      },
      {
        defaultElement: "button",
        discoveryAttribute: "data-sw-tabs-tab",
        initialAttributes: [
          "aria-selected",
          "data-active",
          "data-disabled",
          "data-orientation",
          "data-state",
          "data-value",
          "type",
        ],
        part: "tab",
        publicRef: true,
        role: "tab",
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-tabs-panel",
        initialAttributes: [
          "data-active",
          "data-keep-mounted",
          "data-orientation",
          "data-state",
          "data-value",
          "hidden",
        ],
        part: "panel",
        publicRef: true,
        role: "tabpanel",
      },
      {
        defaultElement: "span",
        discoveryAttribute: "data-sw-tabs-indicator",
        initialAttributes: ["data-orientation", "hidden"],
        part: "indicator",
        publicRef: true,
        role: "presentation",
      },
    ]);
    expect(spec.tabs.valueControl).toEqual({
      event: {
        callbackProp: "onValueChange",
        callbackTiming: "before-state-commit",
        cancelable: true,
        detailsType: "TabsValueChangeDetails",
        domEvent: "starwind:value-change",
        emitsFrom: "root",
        name: "valueChange",
        valueProperty: "value",
        valueType: "TabsValue",
      },
      runtimeBoundary: [
        "Runtime owns value coordination, sync storage, and cancellation timing.",
        "Adapters only project value state, event forwarding, and setValue controlled resync.",
      ],
      setterSync: {
        method: "setValue",
        options: { emit: false, sync: true },
        stateModel: "value",
        suppressesEmit: true,
      },
      state: {
        controlledProp: "value",
        defaultProp: "defaultValue",
        getter: "getValue",
        initialAttribute: "data-default-value",
        name: "value",
        setter: "setValue",
        valueType: "TabsValue",
      },
    });
    expect(spec.tabs.options).toEqual({
      activateOnFocus: {
        attribute: "data-activate-on-focus",
        defaultValue: "false",
        prop: "activateOnFocus",
        targetPart: "list",
        type: "boolean",
      },
      orientation: {
        ariaAttribute: "aria-orientation",
        attribute: "data-orientation",
        defaultValue: '"horizontal"',
        prop: "orientation",
        type: "TabsOrientation",
      },
      loopFocus: {
        attribute: "data-loop-focus",
        defaultValue: "true",
        prop: "loopFocus",
        targetPart: "list",
        type: "boolean",
      },
      syncKey: {
        attribute: "data-sync-key",
        prop: "syncKey",
        type: "string",
      },
    });
    expect(spec.tabs.panelVisibility).toEqual({
      activeAttributes: {
        dataActive: "data-active",
        dataState: "data-state",
        hidden: "hidden",
      },
      keepMounted: {
        attribute: "data-keep-mounted",
        defaultValue: "false",
        prop: "keepMounted",
        targetPart: "panel",
        type: "boolean",
      },
      panelPart: "panel",
      runtimeBoundary:
        "Runtime owns panel hidden cleanup, linked ids, nested refresh, and keep-mounted visibility timing.",
      tabPart: "tab",
      valueAttribute: "data-value",
    });
    expect(spec.tabs.context).toEqual({
      name: "tabs",
      provides: ["orientation", "value"],
      providerPart: "root",
      consumers: ["list", "tab", "panel", "indicator"],
    });
    expect(spec.tabs.presence).toEqual({
      keepMountedProp: "keepMounted",
      initialHiddenParts: [],
      unmountPolicy: "runtime-owned-visibility",
    });
    expect(spec.tabs.namespace).toEqual({
      defaultExport: "Tabs",
      defaultNamespace: true,
      memberParts: ["root", "list", "tab", "panel", "indicator"],
      namedExports: ["Tabs", "TabsIndicator", "TabsList", "TabsPanel", "TabsRoot", "TabsTab"],
      namespace: "Tabs",
      objectEntries: [
        { exportName: "TabsRoot", part: "root", property: "Root" },
        { exportName: "TabsList", part: "list", property: "List" },
        { exportName: "TabsTab", part: "tab", property: "Tab" },
        { exportName: "TabsPanel", part: "panel", property: "Panel" },
        { exportName: "TabsIndicator", part: "indicator", property: "Indicator" },
      ],
    });
    expect(spec.tabs.runtimeBoundary).toEqual([
      "roving focus",
      "linked tab and panel ids",
      "indicator measurement",
      "nested tabs refresh",
      "structural child refresh",
      "panel hidden cleanup",
      "syncKey storage and cross-root event wiring",
    ]);
  });

  it("builds and prints Tabs through the Adapter Output Model", async () => {
    const spec = buildTabsSpecializedAdapterSpec(tabsRuntimeAdapterContract);
    const outputModel = buildTabsAdapterOutputModel(spec);
    const astroFiles = printAstroTabsAdapterOutputModel(spec);
    const reactFiles = printReactTabsAdapterOutputModel(spec);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(outputModel.files)).toBe(false);
    expect(outputModel.files.some((file) => file.kind === "helper")).toBe(false);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "controlled-value-presence", part: "root" }),
      expect.objectContaining({ kind: "controlled-value-presence", part: "list" }),
      expect.objectContaining({ kind: "controlled-value-presence", part: "tab" }),
      expect.objectContaining({ kind: "controlled-value-presence", part: "panel" }),
      expect.objectContaining({ kind: "controlled-value-presence", part: "indicator" }),
    ]);
    const reactOutputModel = projectReactSpecializedOutputModel(outputModel);
    expect(reactOutputModel.files.find((file) => file.kind === "helper")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "controlled-value-presence" }),
        path: "tabs/TabsContext.tsx",
      }),
    );
    expect(
      projectReactSpecializedOutputModel(reactOutputModel).files.filter(
        (file) => file.path === "tabs/TabsContext.tsx",
      ),
    ).toHaveLength(1);
    expectReactSpecializedProjectionToBeIdempotent(outputModel);
    expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "controlled-value-presence" }),
      }),
    );

    const root = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "root",
    );
    if (!root || root.kind !== "component") {
      throw new Error("Tabs output model is missing root component file.");
    }
    expect(root).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          context: [
            expect.objectContaining({
              name: "tabs",
              role: "provider",
            }),
          ],
          lifecycle: expect.objectContaining({ factory: "createTabs" }),
          stateSync: [
            expect.objectContaining({
              setter: "setValue",
              state: "value",
              valueProp: "value",
            }),
          ],
        }),
      }),
    );
    expect(root.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          attrs: expect.objectContaining({
            defaultValue: "data-default-value",
            orientation: "data-orientation",
            syncKey: "data-sync-key",
            value: "data-value",
          }),
        }),
      }),
    );

    for (const [targetPackage, files, extension] of [
      ["astro", astroFiles, ".astro"],
      ["react", reactFiles, ".tsx"],
    ] as const) {
      const filePaths = [
        ...spec.files.map((file) => `${file.path}${file.kind === "index" ? ".ts" : extension}`),
        ...(targetPackage === "react" ? [`${spec.component}/TabsContext.tsx`] : []),
      ];
      for (const filePath of filePaths) {
        const printedFile = getPrintedFile(files, filePath);
        const packagePath = join(process.cwd(), "packages", targetPackage, "src", filePath);

        expect(await formatGeneratedOutput(printedFile, packagePath)).toBe(
          readGeneratedPackageBody(`packages/${targetPackage}/src`, filePath),
        );
      }
    }

    const reactRoot = getPrintedFile(reactFiles, "tabs/TabsRoot.tsx");
    expect(reactRoot).toContain("createTabs(root, {");
    expect(reactRoot).toContain("onValueChangeRef.current?.(details.value, details);");
    expect(reactRoot).toContain("instance.setValue(value, { emit: false, sync: true });");
    expect(reactRoot).toContain("<TabsContext.Provider value={contextValue}>");
    expect(reactRoot).toContain("data-default-value={serializeTabsValue(defaultValueRef.current)}");
    expect(reactRoot).toContain("data-sync-key={syncKey}");

    const reactList = getPrintedFile(reactFiles, "tabs/TabsList.tsx");
    expect(reactList).toContain('data-loop-focus={!loopFocus ? "false" : undefined}');
    expect(reactList).toContain(
      'aria-orientation={orientation === "vertical" ? "vertical" : undefined}',
    );

    const reactPanel = getPrintedFile(reactFiles, "tabs/TabsPanel.tsx");
    expect(reactPanel).toContain('data-keep-mounted={keepMounted ? "" : undefined}');
    expect(reactPanel).toContain("hidden={!active}");

    const reactIndex = getPrintedFile(reactFiles, "tabs/index.ts");
    expect(reactIndex).toContain('export { TabsContext, useTabsContext } from "./TabsContext";');
    expect(reactIndex).toContain(
      'export type { TabsOrientation, TabsValue, TabsValueChangeDetails } from "@starwind-ui/runtime";',
    );

    const astroRoot = getPrintedFile(astroFiles, "tabs/TabsRoot.astro");
    expect(astroRoot).toContain('import { createTabs } from "@starwind-ui/runtime/tabs";');
    expect(astroRoot).toContain("data-default-value={defaultValueAttribute}");
    expect(astroRoot).toContain('document.addEventListener("astro:after-swap", setupTabs);');
    expect(astroRoot).toContain('document.addEventListener("starwind:init", setupTabs);');

    const astroList = getPrintedFile(astroFiles, "tabs/TabsList.astro");
    expect(astroList).toContain('data-loop-focus={!loopFocus ? "false" : undefined}');

    const astroPanel = getPrintedFile(astroFiles, "tabs/TabsPanel.astro");
    expect(astroPanel).toContain('data-keep-mounted={keepMounted ? "" : undefined}');
  }, 20_000);

  it("rejects Tabs specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildTabsSpecializedAdapterSpec(tabsRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      tabs: {
        ...spec.tabs,
        idLinking: {},
        indicatorMeasurement: {},
        nestedRefresh: {},
        rovingFocus: {},
      },
    } as unknown as TabsSpecializedAdapterSpec;

    expect(validateTabsSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Tabs specialized adapter spec must not declare tabs.idLinking; keep Runtime-owned behavior in Runtime controllers.",
        "Tabs specialized adapter spec must not declare tabs.indicatorMeasurement; keep Runtime-owned behavior in Runtime controllers.",
        "Tabs specialized adapter spec must not declare tabs.nestedRefresh; keep Runtime-owned behavior in Runtime controllers.",
        "Tabs specialized adapter spec must not declare tabs.rovingFocus; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Tabs specialized adapter spec source-fact drift without throwing", () => {
    const spec = buildTabsSpecializedAdapterSpec(tabsRuntimeAdapterContract);
    const withoutValueState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "value"),
    } as unknown as TabsSpecializedAdapterSpec;
    const withoutValueEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "valueChange"),
    } as unknown as TabsSpecializedAdapterSpec;
    const withoutSetterSyncOption = {
      ...spec,
      setterSync: spec.setterSync.map((setter) =>
        "stateModel" in setter && setter.stateModel === "value"
          ? { ...setter, options: { emit: false } }
          : setter,
      ),
    } as unknown as TabsSpecializedAdapterSpec;
    const withPanelVisibilityDrift = {
      ...spec,
      tabs: {
        ...spec.tabs,
        panelVisibility: {
          ...spec.tabs.panelVisibility,
          activeAttributes: {
            ...spec.tabs.panelVisibility.activeAttributes,
            hidden: "aria-hidden",
          },
        },
      },
    } as unknown as TabsSpecializedAdapterSpec;
    const withContextDrift = {
      ...spec,
      tabs: {
        ...spec.tabs,
        context: {
          ...spec.tabs.context,
          provides: ["orientation"],
        },
      },
    } as unknown as TabsSpecializedAdapterSpec;
    const withNamespaceDrift = {
      ...spec,
      tabs: {
        ...spec.tabs,
        namespace: {
          ...spec.tabs.namespace,
          objectEntries: [...spec.tabs.namespace.objectEntries].reverse(),
        },
      },
    } as TabsSpecializedAdapterSpec;

    expect(() => validateTabsSpecializedAdapterSpec(withoutValueState)).not.toThrow();
    expect(() => validateTabsSpecializedAdapterSpec(withoutValueEvent)).not.toThrow();
    expect(() => validateTabsSpecializedAdapterSpec(withoutSetterSyncOption)).not.toThrow();
    expect(() => validateTabsSpecializedAdapterSpec(withPanelVisibilityDrift)).not.toThrow();
    expect(() => validateTabsSpecializedAdapterSpec(withContextDrift)).not.toThrow();
    expect(() => validateTabsSpecializedAdapterSpec(withNamespaceDrift)).not.toThrow();
    expect(validateTabsSpecializedAdapterSpec(withoutValueState)).toContain(
      "Tabs specialized adapter spec requires value state metadata.",
    );
    expect(validateTabsSpecializedAdapterSpec(withoutValueEvent)).toContain(
      "Tabs specialized adapter spec requires valueChange event metadata.",
    );
    expect(validateTabsSpecializedAdapterSpec(withoutSetterSyncOption)).toContain(
      "Tabs specialized adapter spec valueControl metadata must match contract state/event/setter facts.",
    );
    expect(validateTabsSpecializedAdapterSpec(withPanelVisibilityDrift)).toContain(
      "Tabs specialized adapter spec panelVisibility metadata must match panel visibility and keep-mounted contract facts.",
    );
    expect(validateTabsSpecializedAdapterSpec(withContextDrift)).toContain(
      "Tabs specialized adapter spec context metadata must match tabs provider facts.",
    );
    expect(validateTabsSpecializedAdapterSpec(withNamespaceDrift)).toContain(
      "Tabs specialized adapter spec namespace objectEntries must match generated export order.",
    );
  });

  it("routes Tabs Astro production generation through the specialized adapter spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildTabsAdapterOutputModel",
      buildSpec: "buildTabsSpecializedAdapterSpec",
      component: "tabs",
    });
  });

  it("writes Tabs Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildTabsSpecializedAdapterSpec(tabsRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-tabs-astro-controlled-presence-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroTabsSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Tabs React production generation through the specialized adapter spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildTabsAdapterOutputModel",
      buildSpec: "buildTabsSpecializedAdapterSpec",
      component: "tabs",
    });
  });

  it("writes Tabs React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildTabsSpecializedAdapterSpec(tabsRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-tabs-react-controlled-presence-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactTabsSpecializedAdapterSpec(outputRoot, spec, "");

    const filePaths = [
      ...spec.files.map((file) => `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`),
      `${spec.component}/TabsContext.tsx`,
    ];
    for (const filePath of filePaths) {
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("describes Slider specialized adapter spec anatomy, value, options, thumb input bridge, framework, and namespace recipes", () => {
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);

    expect(validateSliderSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.sourcePrimitiveContract).toBe(sliderRuntimeAdapterContract);
    expect(spec.component).toBe("slider");
    expect(spec.category).toBe("form-value-control");
    expect(spec.slider.adapterKind).toBe("range-control");
    expect(spec.files.map((file) => [file.kind, file.path, file.part])).toEqual([
      ["part", "slider/SliderRoot", "root"],
      ["part", "slider/SliderControl", "control"],
      ["part", "slider/SliderTrack", "track"],
      ["part", "slider/SliderIndicator", "indicator"],
      ["part", "slider/SliderLabel", "label"],
      ["part", "slider/SliderThumb", "thumb"],
      ["index", "slider/index", undefined],
    ]);
    expect(spec.slider.anatomy).toEqual([
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-slider",
        initialAttributes: [
          "data-default-value",
          "data-disabled",
          "data-form",
          "data-large-step",
          "data-max",
          "data-min",
          "data-min-steps-between-values",
          "data-name",
          "data-orientation",
          "data-step",
          "data-value",
        ],
        part: "root",
        publicRef: true,
        role: "group",
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-slider-control",
        initialAttributes: [],
        part: "control",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-slider-track",
        initialAttributes: [],
        part: "track",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-slider-indicator",
        initialAttributes: [],
        part: "indicator",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "span",
        discoveryAttribute: "data-sw-slider-label",
        initialAttributes: [],
        part: "label",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-slider-thumb",
        initialAttributes: ["data-index"],
        part: "thumb",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "input",
        discoveryAttribute: "data-sw-slider-input",
        initialAttributes: ["type", "aria-hidden", "tabIndex"],
        part: "input",
        publicRef: false,
        role: undefined,
      },
    ]);
    expect(spec.slider.valueControl).toEqual({
      events: {
        valueChange: {
          callbackProp: "onValueChange",
          detailsType: "SliderValueChangeDetails",
          domEvent: "starwind:value-change",
          emitsFrom: "root",
          name: "valueChange",
          valueProperty: "value",
          valueType: "SliderValue",
        },
        valueCommitted: {
          callbackProp: "onValueCommitted",
          detailsType: "SliderValueCommitDetails",
          domEvent: "starwind:value-committed",
          emitsFrom: "root",
          name: "valueCommitted",
          valueProperty: "value",
          valueType: "SliderValue",
        },
      },
      renderedAttribute: "data-value",
      runtimeBoundary: [
        "Runtime owns value normalization, clamping, and multi-thumb ordering.",
        "Adapters only project value attributes, event forwarding, and setValue controlled resync.",
      ],
      serialization: {
        arrayType: "number[]",
        defaultAttribute: "data-default-value",
        scalarType: "number",
        strategy: "number-or-json-array",
        valueAttribute: "data-value",
        valueType: "SliderValue",
      },
      setterSync: {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      state: {
        controlledStateSync: "unsupported",
        controlledProp: "value",
        defaultProp: "defaultValue",
        defaultValue: "0",
        getter: "getValue",
        initialAttribute: "data-default-value",
        name: "value",
        setter: "setValue",
        valueType: "SliderValue",
      },
    });
    expect(spec.slider.options).toEqual([
      {
        attribute: "data-disabled",
        defaultValue: "false",
        lifecycle: "setter-backed",
        prop: "disabled",
        setter: "setDisabled",
        targetPart: "root",
        type: "boolean",
      },
      {
        attribute: "data-form",
        lifecycle: "setter-backed",
        prop: "form",
        setter: "setOptions",
        targetPart: "root",
        type: "string",
      },
      {
        attribute: "data-large-step",
        defaultValue: "10",
        lifecycle: "setter-backed",
        prop: "largeStep",
        setter: "setOptions",
        targetPart: "root",
        type: "number",
      },
      {
        attribute: "data-max",
        defaultValue: "100",
        lifecycle: "setter-backed",
        prop: "max",
        setter: "setOptions",
        targetPart: "root",
        type: "number",
      },
      {
        attribute: "data-min",
        defaultValue: "0",
        lifecycle: "setter-backed",
        prop: "min",
        setter: "setOptions",
        targetPart: "root",
        type: "number",
      },
      {
        attribute: "data-min-steps-between-values",
        defaultValue: "0",
        lifecycle: "setter-backed",
        prop: "minStepsBetweenValues",
        setter: "setOptions",
        targetPart: "root",
        type: "number",
      },
      {
        attribute: "data-name",
        lifecycle: "setter-backed",
        prop: "name",
        setter: "setName",
        targetPart: "root",
        type: "string",
      },
      {
        attribute: "data-orientation",
        defaultValue: '"horizontal"',
        lifecycle: "setter-backed",
        prop: "orientation",
        setter: "setOptions",
        targetPart: "root",
        type: "SliderOrientation",
      },
      {
        attribute: "data-step",
        defaultValue: "1",
        lifecycle: "setter-backed",
        prop: "step",
        setter: "setOptions",
        targetPart: "root",
        type: "number",
      },
    ]);
    expect(spec.slider.thumbInput).toEqual({
      hiddenRangeInput: {
        ariaHiddenAttribute: "aria-hidden",
        ariaHiddenValue: "true",
        styleBoundary: "adapter-owned-visually-hidden-placeholder-style",
        tabIndexAttribute: "tabIndex",
        tabIndexValue: "-1",
        typeAttribute: "type",
        typeValue: "range",
      },
      indexProp: {
        attribute: "data-index",
        prop: "index",
        targetPart: "thumb",
        type: "number",
      },
      inputPart: "input",
      inputRef: {
        prop: "inputRef",
        targetPart: "input",
      },
      nesting: "input-inside-thumb",
      refs: {
        inputPublicRef: false,
        thumbPublicRef: true,
      },
      runtimeBoundary:
        "Runtime owns thumb ARIA, range input value/name/form reflection, measurement, pointer capture, and drag/keyboard interaction.",
      thumbPart: "thumb",
    });
    expect(spec.slider.thumbInput).not.toHaveProperty("inputNameProp");
    expect(spec.slider.formBridge).toEqual({
      fieldIntegration: true,
      hiddenInput: { part: "input", type: "range" },
      props: ["form", "name", "value"],
      runtimeBoundary:
        "Runtime owns form synchronization, range input value reflection, and submitted value updates.",
    });
    expect(spec.slider.namespace).toEqual({
      defaultExport: "Slider",
      defaultNamespace: true,
      memberParts: ["root", "control", "track", "indicator", "label", "thumb"],
      namedExports: [
        "Slider",
        "SliderControl",
        "SliderIndicator",
        "SliderLabel",
        "SliderRoot",
        "SliderThumb",
        "SliderTrack",
      ],
      namespace: "Slider",
      objectEntries: [
        { exportName: "SliderRoot", part: "root", property: "Root" },
        { exportName: "SliderControl", part: "control", property: "Control" },
        { exportName: "SliderTrack", part: "track", property: "Track" },
        { exportName: "SliderIndicator", part: "indicator", property: "Indicator" },
        { exportName: "SliderLabel", part: "label", property: "Label" },
        { exportName: "SliderThumb", part: "thumb", property: "Thumb" },
      ],
    });
    expect(spec.slider.runtimeBoundary).toEqual([
      "pointer value math and pointer capture",
      "keyboard value math",
      "multi-thumb value normalization and clamping",
      "thumb ARIA mutation",
      "range measurement",
      "native range input and form synchronization",
      "refresh-before-controlled-sync timing",
    ]);
  });

  it("rejects Slider specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      slider: {
        ...spec.slider,
        anatomy: [
          {
            ...spec.slider.anatomy[0],
            keyboardMath: {},
          },
          ...spec.slider.anatomy.slice(1),
        ],
        formBridge: {
          ...spec.slider.formBridge,
          formSynchronization: {},
        },
        formSynchronization: {},
        keyboardMath: {},
        measurement: {},
        pointerMath: {},
      },
    } as unknown as SliderSpecializedAdapterSpec;

    expect(validateSliderSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Slider specialized adapter spec must not declare slider.formSynchronization; keep Runtime-owned behavior in Runtime controllers.",
        "Slider specialized adapter spec must not declare slider.anatomy.0.keyboardMath; keep Runtime-owned behavior in Runtime controllers.",
        "Slider specialized adapter spec must not declare slider.formBridge.formSynchronization; keep Runtime-owned behavior in Runtime controllers.",
        "Slider specialized adapter spec must not declare slider.keyboardMath; keep Runtime-owned behavior in Runtime controllers.",
        "Slider specialized adapter spec must not declare slider.measurement; keep Runtime-owned behavior in Runtime controllers.",
        "Slider specialized adapter spec must not declare slider.pointerMath; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Slider specialized adapter spec source-fact drift without throwing", () => {
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);
    const withoutValueState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "value"),
    } as unknown as SliderSpecializedAdapterSpec;
    const withoutCommittedEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "valueCommitted"),
    } as unknown as SliderSpecializedAdapterSpec;
    const withoutStepOption = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "step"),
    } as unknown as SliderSpecializedAdapterSpec;
    const withThumbInputDrift = {
      ...spec,
      slider: {
        ...spec.slider,
        thumbInput: {
          ...spec.slider.thumbInput,
          hiddenRangeInput: {
            ...spec.slider.thumbInput.hiddenRangeInput,
            typeValue: "hidden",
          },
        },
      },
    } as unknown as SliderSpecializedAdapterSpec;
    const withFormBridgeDrift = {
      ...spec,
      slider: {
        ...spec.slider,
        formBridge: {
          ...spec.slider.formBridge,
          props: ["value"],
        },
      },
    } as unknown as SliderSpecializedAdapterSpec;
    const sliderInputFile = spec.renderPlan.files.find(
      (file) => file.kind === "part" && file.part === "input",
    );
    if (!sliderInputFile) {
      throw new Error("Test setup requires the Slider input generic-adapter-plan file.");
    }
    const withGeneratedInputFile = {
      ...spec,
      files: [...spec.files, sliderInputFile],
    } as SliderSpecializedAdapterSpec;
    const withoutGeneratedTrackFile = {
      ...spec,
      files: spec.files.filter((file) => file.kind !== "part" || file.part !== "track"),
    } as SliderSpecializedAdapterSpec;

    expect(() => validateSliderSpecializedAdapterSpec(withoutValueState)).not.toThrow();
    expect(() => validateSliderSpecializedAdapterSpec(withoutCommittedEvent)).not.toThrow();
    expect(() => validateSliderSpecializedAdapterSpec(withoutStepOption)).not.toThrow();
    expect(() => validateSliderSpecializedAdapterSpec(withThumbInputDrift)).not.toThrow();
    expect(() => validateSliderSpecializedAdapterSpec(withFormBridgeDrift)).not.toThrow();
    expect(() => validateSliderSpecializedAdapterSpec(withGeneratedInputFile)).not.toThrow();
    expect(() => validateSliderSpecializedAdapterSpec(withoutGeneratedTrackFile)).not.toThrow();
    expect(validateSliderSpecializedAdapterSpec(withoutValueState)).toContain(
      "Slider specialized adapter spec requires value state metadata.",
    );
    expect(validateSliderSpecializedAdapterSpec(withoutCommittedEvent)).toContain(
      "Slider specialized adapter spec requires valueCommitted event metadata.",
    );
    expect(validateSliderSpecializedAdapterSpec(withoutStepOption)).toContain(
      "Slider specialized adapter spec requires step option metadata.",
    );
    expect(validateSliderSpecializedAdapterSpec(withThumbInputDrift)).toContain(
      "Slider specialized adapter spec thumbInput metadata must match thumb/index/input bridge facts.",
    );
    expect(validateSliderSpecializedAdapterSpec(withFormBridgeDrift)).toContain(
      "Slider specialized adapter spec formBridge metadata must match hidden range input and form facts.",
    );
    expect(validateSliderSpecializedAdapterSpec(withGeneratedInputFile)).toContain(
      "Slider specialized adapter spec files must match exported Slider parts plus index; the input part stays nested inside SliderThumb.",
    );
    expect(validateSliderSpecializedAdapterSpec(withoutGeneratedTrackFile)).toContain(
      "Slider specialized adapter spec files must match exported Slider parts plus index; the input part stays nested inside SliderThumb.",
    );
  });

  it("builds and prints Slider through the Adapter Output Model", async () => {
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);
    const outputModel = buildSliderAdapterOutputModel(spec);
    const astroFiles = printAstroSliderAdapterOutputModel(spec);
    const reactFiles = printReactSliderAdapterOutputModel(spec);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(outputModel.files)).toBe(false);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "range-control", part: "root" }),
      expect.objectContaining({ kind: "range-control", part: "control" }),
      expect.objectContaining({ kind: "range-control", part: "track" }),
      expect.objectContaining({ kind: "range-control", part: "indicator" }),
      expect.objectContaining({ kind: "range-control", part: "label" }),
      expect.objectContaining({ kind: "range-control", part: "thumb" }),
    ]);

    const root = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "root",
    );
    const thumb = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "thumb",
    );
    if (!root || root.kind !== "component") {
      throw new Error("Slider output model is missing root component file.");
    }
    if (!thumb || thumb.kind !== "component") {
      throw new Error("Slider output model is missing thumb component file.");
    }
    expect(root).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          events: [
            expect.objectContaining({
              detailType: "SliderValueChangeDetails",
              handlerProp: "onValueChange",
            }),
            expect.objectContaining({
              detailType: "SliderValueCommitDetails",
              handlerProp: "onValueCommitted",
            }),
          ],
          lifecycle: expect.objectContaining({ factory: "createSlider" }),
          stateSync: [
            expect.objectContaining({
              setter: "setValue",
              state: "value",
              valueProp: "value",
            }),
          ],
        }),
      }),
    );
    expect(root.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          attrs: expect.objectContaining({
            defaultValue: "data-default-value",
            input: "data-sw-slider-input",
            root: "data-sw-slider",
            value: "data-value",
          }),
          serializer: expect.objectContaining({
            strategy: "number-or-json-array",
          }),
          thumbInput: expect.objectContaining({
            nesting: "input-inside-thumb",
          }),
        }),
      }),
    );
    expect(thumb.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          thumbInput: expect.objectContaining({
            hiddenRangeInput: expect.objectContaining({
              typeValue: "range",
            }),
          }),
        }),
      }),
    );

    for (const [targetPackage, files, extension] of [
      ["astro", astroFiles, ".astro"],
      ["react", reactFiles, ".tsx"],
    ] as const) {
      for (const file of spec.files) {
        const filePath = `${file.path}${file.kind === "index" ? ".ts" : extension}`;
        const printedFile = getPrintedFile(files, filePath);
        const packagePath = join(process.cwd(), "packages", targetPackage, "src", filePath);

        expect(await formatGeneratedOutput(printedFile, packagePath)).toBe(
          readGeneratedPackageBody(`packages/${targetPackage}/src`, filePath),
        );
      }
    }
  }, 20_000);

  it("routes Slider Astro production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildSliderAdapterOutputModel",
      buildSpec: "buildSliderSpecializedAdapterSpec",
      component: "slider",
    });
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);
    const outputRoot = join(
      "C:/tmp",
      "starwind-slider-astro-production-specialized-adapter-spec-writer",
    );

    rmSync(outputRoot, { force: true, recursive: true });
    await generateAstroPrimitiveSlider(outputRoot, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Slider Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-slider-astro-specialized-adapter-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroSliderSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Slider React production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildSliderAdapterOutputModel",
      buildSpec: "buildSliderSpecializedAdapterSpec",
      component: "slider",
    });
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);
    const outputRoot = join(
      "C:/tmp",
      "starwind-slider-react-production-specialized-adapter-spec-writer",
    );

    rmSync(outputRoot, { force: true, recursive: true });
    await generateReactPrimitiveSlider(outputRoot, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Slider React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildSliderSpecializedAdapterSpec(sliderRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-slider-react-specialized-adapter-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactSliderSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("describes Input OTP specialized adapter spec anatomy, value, native input, visual slots, framework, and namespace recipes", () => {
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);

    expect(validateInputOtpSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.sourcePrimitiveContract).toBe(inputOtpRuntimeAdapterContract);
    expect(spec.component).toBe("input-otp");
    expect(spec.category).toBe("form-value-control");
    expect(spec.inputOtp.adapterKind).toBe("hidden-input-visual-slot");
    expect(spec.files.map((file) => [file.kind, file.path, file.part])).toEqual([
      ["part", "input-otp/InputOtpRoot", "root"],
      ["part", "input-otp/InputOtpGroup", "group"],
      ["part", "input-otp/InputOtpSlot", "slot"],
      ["part", "input-otp/InputOtpSeparator", "separator"],
      ["index", "input-otp/index", undefined],
    ]);
    expect(spec.inputOtp.anatomy).toEqual([
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-input-otp",
        initialAttributes: [
          "data-default-value",
          "data-disabled",
          "data-form",
          "data-id",
          "data-max-length",
          "data-name",
          "data-pattern",
          "data-readonly",
          "data-required",
          "data-value",
          "aria-disabled",
          "tabindex",
          "tabIndex",
        ],
        part: "root",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "input",
        discoveryAttribute: "data-sw-input-otp-input",
        initialAttributes: [
          "autocomplete",
          "autoComplete",
          "class",
          "className",
          "disabled",
          "form",
          "id",
          "inputmode",
          "inputMode",
          "maxlength",
          "maxLength",
          "name",
          "readonly",
          "readOnly",
          "required",
          "tabindex",
          "tabIndex",
          "value",
        ],
        part: "input",
        publicRef: false,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-input-otp-group",
        initialAttributes: [],
        part: "group",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-input-otp-slot",
        initialAttributes: ["data-index"],
        part: "slot",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "span",
        discoveryAttribute: "data-sw-input-otp-char",
        initialAttributes: [],
        part: "slotChar",
        publicRef: false,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-input-otp-caret",
        initialAttributes: ["class", "className", "hidden"],
        part: "slotCaret",
        publicRef: false,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-input-otp-separator",
        initialAttributes: ["aria-hidden"],
        part: "separator",
        publicRef: true,
        role: "separator",
      },
    ]);
    expect(spec.inputOtp.valueControl).toEqual({
      callbackLifecycle: {
        callbackProp: "onValueChange",
        detailsType: "InputOtpValueChangeDetails",
        domEvent: "starwind:value-change",
        emitsFrom: "root",
        lifecycle: "constructor-callback-ref",
        valueProperty: "value",
        valueType: "string",
      },
      renderedAttribute: "data-value",
      runtimeBoundary: [
        "Runtime owns value normalization, maxLength enforcement, and native input reflection.",
        "Adapters only project initial value attributes, callback forwarding, and setValue controlled resync.",
      ],
      setterSync: {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      state: {
        controlledStateSync: "unsupported",
        controlledProp: "value",
        defaultProp: "defaultValue",
        getter: "getValue",
        initialAttribute: "data-value",
        name: "value",
        setter: "setValue",
        valueType: "string",
      },
    });
    expect(spec.inputOtp.options).toEqual([
      {
        attribute: "data-disabled",
        defaultValue: "false",
        lifecycle: "setter-backed",
        prop: "disabled",
        setter: "setDisabled",
        targetPart: "root",
        type: "boolean",
      },
      {
        attribute: "data-form",
        lifecycle: "setter-backed",
        prop: "form",
        setter: "setFormOptions",
        targetPart: "root",
        type: "string",
      },
      {
        attribute: "data-id",
        lifecycle: "setter-backed",
        prop: "id",
        setter: "setFormOptions",
        targetPart: "root",
        type: "string",
      },
      {
        attribute: "data-max-length",
        defaultValue: "6",
        lifecycle: "refresh-required",
        prop: "maxLength",
        targetPart: "root",
        type: "number",
      },
      {
        attribute: "data-name",
        lifecycle: "setter-backed",
        prop: "name",
        setter: "setFormOptions",
        targetPart: "root",
        type: "string",
      },
      {
        attribute: "data-pattern",
        lifecycle: "constructor-only",
        prop: "pattern",
        targetPart: "root",
        type: "RegExp | string",
      },
      {
        attribute: "data-readonly",
        defaultValue: "false",
        lifecycle: "constructor-only",
        prop: "readOnly",
        targetPart: "root",
        type: "boolean",
      },
      {
        attribute: "data-required",
        defaultValue: "false",
        lifecycle: "setter-backed",
        prop: "required",
        setter: "setFormOptions",
        targetPart: "root",
        type: "boolean",
      },
    ]);
    expect(spec.inputOtp.nativeInput).toEqual({
      autocomplete: {
        attribute: "autocomplete",
        value: "one-time-code",
      },
      formProps: ["form", "id", "name", "required", "value"],
      hiddenClass: {
        attribute: "class",
        value: "sr-only",
      },
      inputMode: {
        attribute: "inputmode",
        source: "pattern-derived",
      },
      maxLength: {
        attribute: "maxlength",
        prop: "maxLength",
      },
      nesting: "input-inside-root-before-visual-slots",
      part: "input",
      refs: {
        inputPublicRef: false,
        rootPublicRef: true,
      },
      runtimeBoundary:
        "Runtime owns native input value reflection, keyboard/paste/delete/focus handling, and form reset.",
      tabIndex: {
        attribute: "tabindex",
        value: "-1",
      },
    });
    expect(spec.inputOtp.visualSlots).toEqual({
      caretRendering: {
        outletName: "caret",
        unsupportedTargets: ["astro"],
      },
      groupPart: "group",
      separator: {
        ariaHiddenAttribute: "aria-hidden",
        ariaHiddenValue: "true",
        part: "separator",
        publicRef: true,
        role: "separator",
      },
      slotCaret: {
        classAttribute: {
          attribute: "class",
          value: "pointer-events-none absolute inset-0 hidden items-center justify-center",
        },
        hiddenAttribute: "hidden",
        part: "slotCaret",
        placement: "inside-slot",
      },
      slotChar: {
        part: "slotChar",
        placement: "inside-slot",
      },
      slotIndex: {
        attribute: "data-index",
        prop: "index",
        targetPart: "slot",
        type: "number",
      },
      slotPart: "slot",
      runtimeBoundary:
        "Runtime owns slot distribution, active state, character writing, and caret visibility.",
    });
    expect(spec.inputOtp.patternInputMode).toEqual({
      defaultPattern: "\\d",
      inputModeAttribute: "inputmode",
      inputModeValues: ["numeric", "text"],
      normalizedPatternAttribute: "data-pattern",
      numericPatternExamples: ["\\d", "[0-9]", "\\d+", "[0-9]+"],
      patternProp: "pattern",
      runtimeBoundary:
        "Adapters may derive initial inputMode from normalized pattern; Runtime owns value normalization and accepted-character behavior.",
    });
    expect(spec.inputOtp.formBridge).toEqual({
      fieldIntegration: true,
      hiddenInput: { part: "input", type: "text" },
      props: ["form", "id", "name", "required", "value"],
      runtimeBoundary:
        "Runtime owns form synchronization, native text input value reflection, and form reset.",
    });
    expect(spec.inputOtp.namespace).toEqual({
      defaultExport: "InputOtp",
      defaultNamespace: true,
      memberParts: ["root", "group", "separator", "slot"],
      namedExports: [
        "InputOtp",
        "InputOtpGroup",
        "InputOtpRoot",
        "InputOtpSeparator",
        "InputOtpSlot",
      ],
      namespace: "InputOtp",
      objectEntries: [
        { exportName: "InputOtpRoot", part: "root", property: "Root" },
        { exportName: "InputOtpGroup", part: "group", property: "Group" },
        { exportName: "InputOtpSeparator", part: "separator", property: "Separator" },
        { exportName: "InputOtpSlot", part: "slot", property: "Slot" },
      ],
    });
    expect(spec.inputOtp.runtimeBoundary).toEqual([
      "keyboard navigation and focus movement",
      "paste and delete handling",
      "value normalization and maxLength enforcement",
      "slot active state and character writing",
      "caret visibility mutation",
      "native input value reflection and form reset",
      "refresh-required slot reconciliation",
    ]);
  });

  it("rejects Input OTP specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      inputOtp: {
        ...spec.inputOtp,
        caretMutation: {},
        deleteHandling: {},
        focusMovement: {},
        nativeInput: {
          ...spec.inputOtp.nativeInput,
          focusMovement: {},
        },
        pasteHandling: {},
        slotDistribution: {},
        visualSlots: {
          ...spec.inputOtp.visualSlots,
          pasteHandling: {},
        },
      },
    } as unknown as InputOtpSpecializedAdapterSpec;

    expect(validateInputOtpSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Input OTP specialized adapter spec must not declare inputOtp.caretMutation; keep Runtime-owned behavior in Runtime controllers.",
        "Input OTP specialized adapter spec must not declare inputOtp.deleteHandling; keep Runtime-owned behavior in Runtime controllers.",
        "Input OTP specialized adapter spec must not declare inputOtp.focusMovement; keep Runtime-owned behavior in Runtime controllers.",
        "Input OTP specialized adapter spec must not declare inputOtp.nativeInput.focusMovement; keep Runtime-owned behavior in Runtime controllers.",
        "Input OTP specialized adapter spec must not declare inputOtp.pasteHandling; keep Runtime-owned behavior in Runtime controllers.",
        "Input OTP specialized adapter spec must not declare inputOtp.slotDistribution; keep Runtime-owned behavior in Runtime controllers.",
        "Input OTP specialized adapter spec must not declare inputOtp.visualSlots.pasteHandling; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Input OTP specialized adapter spec source-fact drift without throwing", () => {
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const withoutValueState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "value"),
    } as unknown as InputOtpSpecializedAdapterSpec;
    const withoutValueEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "valueChange"),
    } as unknown as InputOtpSpecializedAdapterSpec;
    const withoutIndexProp = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "index"),
    } as unknown as InputOtpSpecializedAdapterSpec;
    const withNativeInputDrift = {
      ...spec,
      inputOtp: {
        ...spec.inputOtp,
        nativeInput: {
          ...spec.inputOtp.nativeInput,
          nesting: "standalone-input",
        },
      },
    } as unknown as InputOtpSpecializedAdapterSpec;
    const withVisualSlotDrift = {
      ...spec,
      inputOtp: {
        ...spec.inputOtp,
        visualSlots: {
          ...spec.inputOtp.visualSlots,
          slotPart: "input",
        },
      },
    } as unknown as InputOtpSpecializedAdapterSpec;
    const withPatternInputModeDrift = {
      ...spec,
      inputOtp: {
        ...spec.inputOtp,
        patternInputMode: {
          ...spec.inputOtp.patternInputMode,
          inputModeValues: ["numeric"],
        },
      },
    } as unknown as InputOtpSpecializedAdapterSpec;
    const withSelfMutatedPropsAndRecipes = {
      ...spec,
      props: spec.props.map((prop) => {
        if (prop.name === "maxLength" || prop.name === "index") {
          return { ...prop, type: "string" };
        }

        return prop;
      }),
      inputOtp: {
        ...spec.inputOtp,
        options: spec.inputOtp.options.map((option) => {
          if (option.prop === "maxLength") {
            return { ...option, type: "string" };
          }

          return option;
        }),
        visualSlots: {
          ...spec.inputOtp.visualSlots,
          slotIndex: {
            ...spec.inputOtp.visualSlots.slotIndex,
            type: "string",
          },
        },
      },
    } as unknown as InputOtpSpecializedAdapterSpec;
    const inputOtpInputFile = spec.renderPlan.files.find(
      (file) => file.kind === "part" && file.part === "input",
    );
    if (!inputOtpInputFile) {
      throw new Error("Test setup requires the Input OTP input generic-adapter-plan file.");
    }
    const withGeneratedInputFile = {
      ...spec,
      files: [...spec.files, inputOtpInputFile],
    } as InputOtpSpecializedAdapterSpec;
    const withoutGeneratedSlotFile = {
      ...spec,
      files: spec.files.filter((file) => file.kind !== "part" || file.part !== "slot"),
    } as InputOtpSpecializedAdapterSpec;

    expect(() => validateInputOtpSpecializedAdapterSpec(withoutValueState)).not.toThrow();
    expect(() => validateInputOtpSpecializedAdapterSpec(withoutValueEvent)).not.toThrow();
    expect(() => validateInputOtpSpecializedAdapterSpec(withoutIndexProp)).not.toThrow();
    expect(() => validateInputOtpSpecializedAdapterSpec(withNativeInputDrift)).not.toThrow();
    expect(() => validateInputOtpSpecializedAdapterSpec(withVisualSlotDrift)).not.toThrow();
    expect(() => validateInputOtpSpecializedAdapterSpec(withPatternInputModeDrift)).not.toThrow();
    expect(() =>
      validateInputOtpSpecializedAdapterSpec(withSelfMutatedPropsAndRecipes),
    ).not.toThrow();
    expect(() => validateInputOtpSpecializedAdapterSpec(withGeneratedInputFile)).not.toThrow();
    expect(() => validateInputOtpSpecializedAdapterSpec(withoutGeneratedSlotFile)).not.toThrow();
    expect(validateInputOtpSpecializedAdapterSpec(withoutValueState)).toContain(
      "Input OTP specialized adapter spec requires value state metadata.",
    );
    expect(validateInputOtpSpecializedAdapterSpec(withoutValueEvent)).toContain(
      "Input OTP specialized adapter spec requires valueChange event metadata.",
    );
    expect(validateInputOtpSpecializedAdapterSpec(withoutIndexProp)).toContain(
      "Input OTP specialized adapter spec requires slot index prop metadata.",
    );
    expect(validateInputOtpSpecializedAdapterSpec(withNativeInputDrift)).toContain(
      "Input OTP specialized adapter spec nativeInput metadata must match native input placement, attributes, refs, and form facts.",
    );
    expect(validateInputOtpSpecializedAdapterSpec(withVisualSlotDrift)).toContain(
      "Input OTP specialized adapter spec visualSlots metadata must match group/slot/slotChar/slotCaret/separator facts.",
    );
    expect(validateInputOtpSpecializedAdapterSpec(withPatternInputModeDrift)).toContain(
      "Input OTP specialized adapter spec patternInputMode metadata must document pattern normalization and inputMode derivation boundaries.",
    );
    expect(validateInputOtpSpecializedAdapterSpec(withSelfMutatedPropsAndRecipes)).toEqual(
      expect.arrayContaining([
        "Input OTP specialized adapter spec props must match source contract facts for value, option, callback, and slot projection.",
        "Input OTP specialized adapter spec options metadata must match root option props, lifecycles, setter coverage, and attributes.",
        "Input OTP specialized adapter spec visualSlots metadata must match group/slot/slotChar/slotCaret/separator facts.",
      ]),
    );
    expect(validateInputOtpSpecializedAdapterSpec(withGeneratedInputFile)).toContain(
      "Input OTP specialized adapter spec files must match exported InputOtp parts plus index; input, slotChar, and slotCaret stay nested inside Root/Slot.",
    );
    expect(validateInputOtpSpecializedAdapterSpec(withoutGeneratedSlotFile)).toContain(
      "Input OTP specialized adapter spec files must match exported InputOtp parts plus index; input, slotChar, and slotCaret stay nested inside Root/Slot.",
    );
  });

  it("rejects Input OTP specialized adapter spec writer specs when adapter facts drift", async () => {
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const withValueControlDrift = {
      ...spec,
      inputOtp: {
        ...spec.inputOtp,
        valueControl: {
          ...spec.inputOtp.valueControl,
          setterSync: {
            ...spec.inputOtp.valueControl.setterSync,
            method: "setOtpValue",
          },
        },
      },
    } as unknown as InputOtpSpecializedAdapterSpec;
    const withNativeInputDrift = {
      ...spec,
      inputOtp: {
        ...spec.inputOtp,
        nativeInput: {
          ...spec.inputOtp.nativeInput,
          inputMode: {
            ...spec.inputOtp.nativeInput.inputMode,
            reactAttribute: "data-input-mode",
          },
        },
      },
    } as unknown as InputOtpSpecializedAdapterSpec;

    await expect(
      writeAstroInputOtpSpecializedAdapterSpec(
        "C:/tmp/starwind-input-otp-astro-spec-drift",
        withValueControlDrift,
        "---\n",
        "",
      ),
    ).rejects.toThrow(
      "Input OTP specialized adapter spec valueControl metadata must match value state, callback lifecycle, event, and setter facts.",
    );
    await expect(
      writeReactInputOtpSpecializedAdapterSpec(
        "C:/tmp/starwind-input-otp-react-spec-drift",
        withNativeInputDrift,
        "",
      ),
    ).rejects.toThrow(
      "Input OTP specialized adapter spec nativeInput metadata must match native input placement, attributes, refs, and form facts.",
    );
  });

  it("builds and prints Input OTP through the Adapter Output Model", async () => {
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const outputModel = buildInputOtpAdapterOutputModel(spec);
    const astroFiles = printAstroInputOtpAdapterOutputModel(spec);
    const reactFiles = printReactInputOtpAdapterOutputModel(spec);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(outputModel.files)).toBe(false);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "hidden-input-visual-slot", part: "root" }),
      expect.objectContaining({ kind: "hidden-input-visual-slot", part: "group" }),
      expect.objectContaining({ kind: "hidden-input-visual-slot", part: "slot" }),
      expect.objectContaining({ kind: "hidden-input-visual-slot", part: "separator" }),
    ]);

    const root = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "root",
    );
    const slot = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "slot",
    );
    if (!root || root.kind !== "component") {
      throw new Error("Input OTP output model is missing root component file.");
    }
    if (!slot || slot.kind !== "component") {
      throw new Error("Input OTP output model is missing slot component file.");
    }
    expect(root).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          events: [
            expect.objectContaining({
              detailType: "InputOtpValueChangeDetails",
              handlerProp: "onValueChange",
            }),
          ],
          lifecycle: expect.objectContaining({ factory: "createInputOtp" }),
          stateSync: [
            expect.objectContaining({
              setter: "setValue",
              state: "value",
              valueProp: "value",
            }),
          ],
        }),
      }),
    );
    expect(root.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          attrs: expect.objectContaining({
            input: "data-sw-input-otp-input",
            inputAutocomplete: "autocomplete",
            inputClass: "class",
            inputMaxLength: "maxlength",
            inputMode: "inputmode",
            inputReadOnly: "readonly",
            inputTabIndex: "tabindex",
            root: "data-sw-input-otp",
            rootTabIndex: "tabindex",
            slotCaret: "data-sw-input-otp-caret",
            slotCaretClass: "class",
            slotChar: "data-sw-input-otp-char",
            value: "data-value",
          }),
          nativeInput: expect.objectContaining({
            nesting: "input-inside-root-before-visual-slots",
          }),
          pattern: expect.objectContaining({
            defaultPattern: "\\d",
            numericPatternExamples: ["\\d", "[0-9]", "\\d+", "[0-9]+"],
          }),
        }),
      }),
    );
    expect(slot.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          visualSlots: expect.objectContaining({
            caretRendering: expect.objectContaining({
              outletName: "caret",
            }),
          }),
        }),
      }),
    );

    const mutatedOutputModel = structuredClone(outputModel) as AdapterOutputModel;
    for (const file of mutatedOutputModel.files) {
      if (file.kind !== "component" || file.component.family?.kind !== "hidden-input-visual-slot") {
        continue;
      }

      file.component.family.facts.parts.root.defaultElement = "section";
      file.component.family.facts.parts.slot.defaultElement = "label";
      if (
        file.component.render.kind === "element" &&
        (file.component.family.part === "root" || file.component.family.part === "slot")
      ) {
        file.component.render.defaultElement =
          file.component.family.part === "root" ? "section" : "label";
      }
    }

    const mutatedReactFiles = printAdapterOutput(reactFrameworkAdapter, mutatedOutputModel);
    const mutatedReactRoot = getPrintedFile(mutatedReactFiles, "input-otp/InputOtpRoot.tsx");
    const mutatedReactSlot = getPrintedFile(mutatedReactFiles, "input-otp/InputOtpSlot.tsx");
    expect(mutatedReactRoot).toContain("React.HTMLAttributes<HTMLElement>");
    expect(mutatedReactRoot).toContain("React.forwardRef<HTMLElement, InputOtpRootProps>");
    expect(mutatedReactRoot).toContain("React.useRef<HTMLElement>(null)");
    expect(mutatedReactRoot).toContain("(node: HTMLElement | null)");
    expect(mutatedReactRoot).toContain("<section");
    expect(mutatedReactRoot).toContain("</section>");
    expect(mutatedReactSlot).toContain("React.HTMLAttributes<HTMLLabelElement>");
    expect(mutatedReactSlot).toContain("React.forwardRef<HTMLLabelElement, InputOtpSlotProps>");
    expect(mutatedReactSlot).toContain("<label");
    expect(mutatedReactSlot).toContain("</label>");

    for (const [targetPackage, files, extension] of [
      ["astro", astroFiles, ".astro"],
      ["react", reactFiles, ".tsx"],
    ] as const) {
      for (const file of spec.files) {
        const filePath = `${file.path}${file.kind === "index" ? ".ts" : extension}`;
        const printedFile = getPrintedFile(files, filePath);
        const packagePath = join(process.cwd(), "packages", targetPackage, "src", filePath);

        expect(await formatGeneratedOutput(printedFile, packagePath)).toBe(
          readGeneratedPackageBody(`packages/${targetPackage}/src`, filePath),
        );
      }
    }
  }, 20_000);

  it("routes Input OTP Astro production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildInputOtpAdapterOutputModel",
      buildSpec: "buildInputOtpSpecializedAdapterSpec",
      component: "input-otp",
    });
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-input-otp-astro-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateAstroPrimitiveInputOtp(outputRoot, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Input OTP Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-input-otp-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroInputOtpSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Input OTP React production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildInputOtpAdapterOutputModel",
      buildSpec: "buildInputOtpSpecializedAdapterSpec",
      component: "input-otp",
    });
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-input-otp-react-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateReactPrimitiveInputOtp(outputRoot, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Input OTP React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildInputOtpSpecializedAdapterSpec(inputOtpRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-input-otp-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactInputOtpSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("builds and prints Dropzone through the Adapter Output Model", async () => {
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);
    const outputModel = buildDropzoneAdapterOutputModel(spec);
    const astroFiles = printAstroDropzoneAdapterOutputModel(spec);
    const reactFiles = printReactDropzoneAdapterOutputModel(spec);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(outputModel.files)).toBe(false);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "file-drop-control", part: "root" }),
      expect.objectContaining({ kind: "file-drop-control", part: "input" }),
      expect.objectContaining({ kind: "file-drop-control", part: "uploadIndicator" }),
      expect.objectContaining({ kind: "file-drop-control", part: "loadingIndicator" }),
      expect.objectContaining({ kind: "file-drop-control", part: "filesList" }),
    ]);

    const root = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "root",
    );
    const input = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "input",
    );
    const filesList = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "filesList",
    );
    if (!root || root.kind !== "component") {
      throw new Error("Dropzone output model is missing root component file.");
    }
    if (!input || input.kind !== "component") {
      throw new Error("Dropzone output model is missing input component file.");
    }
    if (!filesList || filesList.kind !== "component") {
      throw new Error("Dropzone output model is missing files list component file.");
    }

    expect(root).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          events: [
            expect.objectContaining({
              detailType: "DropzoneFilesChangeDetails",
              handlerProp: "onFilesChange",
            }),
          ],
          lifecycle: expect.objectContaining({ factory: "createDropzone" }),
          stateSync: expect.arrayContaining([
            expect.objectContaining({
              setter: "setUploading",
              state: "uploading",
              valueProp: "isUploading",
            }),
          ]),
        }),
      }),
    );
    expect(root.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          attrs: expect.objectContaining({
            ariaDisabled: "aria-disabled",
            disabled: "data-disabled",
            dragActive: "data-drag-active",
            filesList: "data-sw-dropzone-files-list",
            hasFiles: "data-has-files",
            input: "data-sw-dropzone-input",
            inputClass: "class",
            inputTabIndex: "tabindex",
            inputType: "type",
            isUploading: "data-is-uploading",
            root: "data-sw-dropzone",
          }),
          fileInput: expect.objectContaining({
            hiddenClassValue: "sr-only",
            tabIndexValue: "-1",
            typeValue: "file",
          }),
          runtime: expect.objectContaining({
            factory: "createDropzone",
            importSource: "@starwind-ui/runtime/dropzone",
          }),
        }),
      }),
    );
    expect(input.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          fileInput: expect.objectContaining({
            acceptsProps: ["accept", "multiple"],
            disabledForwardedAttribute: "disabled",
            formProps: ["accept", "multiple", "name", "required"],
          }),
        }),
      }),
    );
    expect(filesList.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          fileList: expect.objectContaining({
            renderingBoundary: "runtime-owned-dom-replacement",
            stateAttribute: "data-has-files",
          }),
        }),
      }),
    );

    const mutatedOutputModel = structuredClone(outputModel) as AdapterOutputModel;
    for (const file of mutatedOutputModel.files) {
      if (file.kind !== "component" || file.component.family?.kind !== "file-drop-control") {
        continue;
      }

      file.component.family.facts.parts.root.defaultElement = "section";
      file.component.family.facts.parts.filesList.defaultElement = "span";
      if (
        file.component.render.kind === "element" &&
        (file.component.family.part === "root" || file.component.family.part === "filesList")
      ) {
        file.component.render.defaultElement =
          file.component.family.part === "root" ? "section" : "span";
      }
    }

    const mutatedReactFiles = printAdapterOutput(reactFrameworkAdapter, mutatedOutputModel);
    const mutatedReactRoot = getPrintedFile(mutatedReactFiles, "dropzone/DropzoneRoot.tsx");
    const mutatedReactFilesList = getPrintedFile(
      mutatedReactFiles,
      "dropzone/DropzoneFilesList.tsx",
    );
    expect(mutatedReactRoot).toContain("React.HTMLAttributes<HTMLElement>");
    expect(mutatedReactRoot).toContain("React.forwardRef<HTMLElement, DropzoneRootProps>");
    expect(mutatedReactRoot).toContain("React.useRef<HTMLElement>(null)");
    expect(mutatedReactRoot).toContain("(node: HTMLElement | null)");
    expect(mutatedReactRoot).toContain("<section");
    expect(mutatedReactFilesList).toContain("React.HTMLAttributes<HTMLSpanElement>");
    expect(mutatedReactFilesList).toContain(
      "React.forwardRef<HTMLSpanElement, DropzoneFilesListProps>",
    );
    expect(mutatedReactFilesList).toContain("<span");

    const astroInput = getPrintedFile(astroFiles, "dropzone/DropzoneInput.astro");
    const reactInput = getPrintedFile(reactFiles, "dropzone/DropzoneInput.tsx");
    expect(astroInput).toContain(
      'type Props = Omit<HTMLAttributes<"input">, "children" | "type">;',
    );
    expect(astroInput).toContain(
      "const { disabled = false, class: className, ...rest } = Astro.props;",
    );
    expect(astroInput).toContain("{...rest}");
    expect(astroInput).toContain('type="file"');
    expect(astroInput).toContain("tabindex={-1}");
    expect(astroInput).toContain('class:list={["sr-only", className]}');
    expect(astroInput).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroInput).toContain("disabled={disabled}");
    expect(reactInput).toContain(
      'export type DropzoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;',
    );
    expect(reactInput).toContain("{ className, disabled = false, ...props }");
    expect(reactInput).toContain("{...props}");
    expect(reactInput).toContain('type="file"');
    expect(reactInput).toContain(
      'className={["sr-only", className].filter(Boolean).join(" ") || undefined}',
    );
    expect(reactInput).toContain('data-disabled={disabled ? "" : undefined}');
    expect(reactInput).toContain("disabled={disabled}");
    expect(reactInput).toContain("tabIndex={-1}");

    const astroRoot = getPrintedFile(astroFiles, "dropzone/DropzoneRoot.astro");
    const astroUploadIndicator = getPrintedFile(
      astroFiles,
      "dropzone/DropzoneUploadIndicator.astro",
    );
    const astroLoadingIndicator = getPrintedFile(
      astroFiles,
      "dropzone/DropzoneLoadingIndicator.astro",
    );
    const astroFilesList = getPrintedFile(astroFiles, "dropzone/DropzoneFilesList.astro");
    const astroIndex = getPrintedFile(astroFiles, "dropzone/index.ts");
    const reactRoot = getPrintedFile(reactFiles, "dropzone/DropzoneRoot.tsx");
    const reactUploadIndicator = getPrintedFile(reactFiles, "dropzone/DropzoneUploadIndicator.tsx");
    const reactLoadingIndicator = getPrintedFile(
      reactFiles,
      "dropzone/DropzoneLoadingIndicator.tsx",
    );
    const reactFilesList = getPrintedFile(reactFiles, "dropzone/DropzoneFilesList.tsx");
    const reactIndex = getPrintedFile(reactFiles, "dropzone/index.ts");

    expect(astroRoot).toContain('import { createDropzone } from "@starwind-ui/runtime/dropzone";');
    expect(astroRoot).toContain("data-sw-dropzone");
    expect(astroRoot).toContain('data-drag-active="false"');
    expect(astroRoot).toContain('data-has-files="false"');
    expect(astroRoot).toContain('data-is-uploading={isUploading ? "true" : "false"}');
    expect(astroRoot).toContain('aria-disabled={disabled ? "true" : "false"}');
    expect(astroRoot).toContain('role="button"');
    expect(astroRoot).toContain("tabindex={disabled ? -1 : 0}");
    expect(astroRoot).toContain(
      'getInitCandidates(event, "[data-sw-dropzone]").forEach((root) => createDropzone(root));',
    );
    expect(astroRoot).toContain('document.addEventListener("astro:after-swap", setupDropzones);');
    expect(astroRoot).toContain('document.addEventListener("starwind:init", setupDropzones);');
    expect(astroUploadIndicator).toContain("hidden={isUploading}");
    expect(astroLoadingIndicator).toContain("hidden={!isUploading}");
    expect(astroFilesList).toContain("data-sw-dropzone-files-list");
    expect(astroFilesList).toContain('data-has-files="false"');
    expect(astroIndex).toContain(
      'export type { DropzoneFilesChangeDetails } from "@starwind-ui/runtime";',
    );
    expect(astroIndex).toContain("FilesList: DropzoneFilesList");

    expect(reactRoot).toContain(
      'import { createDropzone, type DropzoneFilesChangeDetails } from "@starwind-ui/runtime/dropzone";',
    );
    expect(reactRoot).toContain("const onFilesChangeRef = React.useRef(onFilesChange);");
    expect(reactRoot).toContain("const disabledRef = React.useRef(disabled);");
    expect(reactRoot).toContain("const isUploadingRef = React.useRef(isUploading);");
    expect(reactRoot).toContain("disabled: disabledRef.current");
    expect(reactRoot).toContain("isUploading: isUploadingRef.current");
    expect(reactRoot).toContain("onFilesChangeRef.current?.(files, details);");
    expect(reactRoot).toContain("instanceRef.current?.setDisabled(disabled);");
    expect(reactRoot).toContain("instanceRef.current?.setUploading(isUploading);");
    expect(reactRoot).toContain("instance.destroy();");
    expect(reactRoot).toContain("data-sw-dropzone");
    expect(reactRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(reactRoot).toContain('data-drag-active="false"');
    expect(reactRoot).toContain('data-has-files="false"');
    expect(reactRoot).toContain('data-is-uploading={isUploading ? "true" : "false"}');
    expect(reactRoot).toContain('aria-disabled={disabled ? "true" : "false"}');
    expect(reactRoot).toContain('role="button"');
    expect(reactRoot).toContain("tabIndex={disabled ? -1 : 0}");
    expect(reactUploadIndicator).toContain(
      "{ isUploading = false, hidden = isUploading, ...props }",
    );
    expect(reactLoadingIndicator).toContain(
      "{ isUploading = false, hidden = !isUploading, ...props }",
    );
    expect(reactFilesList).toContain("data-sw-dropzone-files-list");
    expect(reactFilesList).toContain('data-has-files="false"');
    expect(reactIndex).toContain(
      'export type { DropzoneFilesChangeDetails } from "@starwind-ui/runtime";',
    );
    expect(reactIndex).toContain("FilesList: DropzoneFilesList");

    for (const [targetPackage, files, extension] of [
      ["astro", astroFiles, ".astro"],
      ["react", reactFiles, ".tsx"],
    ] as const) {
      for (const file of spec.files) {
        const filePath = `${file.path}${file.kind === "index" ? ".ts" : extension}`;
        const printedFile = getPrintedFile(files, filePath);
        const packagePath = join(process.cwd(), "packages", targetPackage, "src", filePath);

        expect(await formatGeneratedOutput(printedFile, packagePath)).toBe(
          readGeneratedPackageBody(`packages/${targetPackage}/src`, filePath),
        );
      }
    }
  }, 20_000);

  it("describes Dropzone specialized adapter spec anatomy, input, upload state, files callback, list, framework, and namespace recipes", () => {
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);

    expect(validateDropzoneSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("dropzone");
    expect(spec.category).toBe("form-value-control");
    expect(spec.root).toMatchObject({
      defaultElement: "label",
      discoveryAttribute: "data-sw-dropzone",
      part: "root",
      runtimeFactory: "createDropzone",
      runtimeImportSource: "@starwind-ui/runtime/dropzone",
    });
    expect(spec.files.map((file) => [file.kind, file.path, file.part])).toEqual([
      ["part", "dropzone/DropzoneRoot", "root"],
      ["part", "dropzone/DropzoneInput", "input"],
      ["part", "dropzone/DropzoneUploadIndicator", "uploadIndicator"],
      ["part", "dropzone/DropzoneLoadingIndicator", "loadingIndicator"],
      ["part", "dropzone/DropzoneFilesList", "filesList"],
      ["index", "dropzone/index", undefined],
    ]);
    expect(spec.dropzone.adapterKind).toBe("file-drop-control");
    expect(spec.dropzone.anatomy).toEqual([
      {
        defaultElement: "label",
        discoveryAttribute: "data-sw-dropzone",
        initialAttributes: [
          "data-disabled",
          "data-drag-active",
          "data-has-files",
          "data-is-uploading",
          "aria-disabled",
          "role",
          "tabindex",
        ],
        part: "root",
        publicRef: true,
        role: "button",
      },
      {
        defaultElement: "input",
        discoveryAttribute: "data-sw-dropzone-input",
        initialAttributes: ["type", "tabindex", "class", "data-disabled", "disabled"],
        part: "input",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-dropzone-upload-indicator",
        initialAttributes: ["data-is-uploading"],
        part: "uploadIndicator",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-dropzone-loading-indicator",
        initialAttributes: ["data-is-uploading", "hidden"],
        part: "loadingIndicator",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-dropzone-files-list",
        initialAttributes: ["data-has-files"],
        part: "filesList",
        publicRef: true,
        role: undefined,
      },
    ]);
    expect(spec.dropzone.disabledControl).toEqual({
      attribute: "data-disabled",
      defaultValue: "false",
      lifecycle: "setter-backed",
      prop: "disabled",
      setter: "setDisabled",
      targetParts: ["root", "input"],
      type: "boolean",
    });
    expect(spec.dropzone.fileInput).toEqual({
      acceptMultiple: [
        {
          forwardedAttribute: "accept",
          prop: "accept",
          targetPart: "input",
          type: "string",
        },
        {
          forwardedAttribute: "multiple",
          prop: "multiple",
          targetPart: "input",
          type: "boolean",
        },
      ],
      disabledProjection: {
        attribute: "data-disabled",
        forwardedAttribute: "disabled",
        prop: "disabled",
      },
      formProps: ["accept", "multiple", "name", "required"],
      hiddenClass: {
        attribute: "class",
        value: "sr-only",
      },
      part: "input",
      refs: {
        inputPublicRef: true,
        rootPublicRef: true,
      },
      runtimeBoundary:
        "Runtime owns file input id/htmlFor setup, click/keyboard activation, DataTransfer assignment, accepted-file filtering, selected-file tracking, and form reset.",
      tabIndex: {
        attribute: "tabindex",
        value: "-1",
      },
      type: {
        attribute: "type",
        value: "file",
      },
    });
    expect(spec.dropzone.uploadState).toEqual({
      indicators: [
        {
          hiddenAttribute: "hidden",
          hiddenWhen: "uploading",
          part: "uploadIndicator",
          stateAttribute: "data-is-uploading",
        },
        {
          hiddenAttribute: "hidden",
          hiddenWhen: "not-uploading",
          part: "loadingIndicator",
          stateAttribute: "data-is-uploading",
        },
      ],
      runtimeBoundary:
        "Runtime owns upload state coordination, root/indicator attributes, indicator hidden/class mutation, and attribute-observer sync.",
      setterSync: {
        method: "setUploading",
        prop: "isUploading",
      },
      state: {
        controlledStateSync: "custom-event",
        controlledProp: "isUploading",
        defaultValue: "false",
        getter: "getUploading",
        initialAttribute: "data-is-uploading",
        name: "uploading",
        setter: "setUploading",
        valueType: "boolean",
      },
    });
    expect(spec.dropzone.filesChange).toEqual({
      callbackProp: "onFilesChange",
      detailsType: "DropzoneFilesChangeDetails",
      domEvent: "starwind:files-change",
      emitsFrom: "root",
      lifecycle: "constructor-callback-ref",
      reasons: ["drop", "imperative-action", "input-change"],
      subscriberEvent: "filesChange",
      valueProperty: "files",
      valueType: "File[]",
    });
    expect(spec.dropzone.fileList).toEqual({
      emptyInitialState: "false",
      part: "filesList",
      renderingBoundary: "runtime-owned-dom-replacement",
      runtimeBoundary:
        "Runtime owns file-list child replacement, file item markup, visibility classes, and data-has-files sync.",
      stateAttribute: "data-has-files",
    });
    expect(spec.dropzone.formBridge).toEqual({
      fileInput: {
        part: "input",
        type: "file",
      },
      props: ["accept", "multiple", "name", "required"],
      runtimeBoundary:
        "Runtime owns native file input file reflection, accepted-file filtering, submitted files, and form reset clearing.",
    });
    expect(spec.dropzone.namespace).toEqual({
      defaultExport: "Dropzone",
      defaultNamespace: true,
      memberParts: ["root", "input", "uploadIndicator", "loadingIndicator", "filesList"],
      namedExports: [
        "Dropzone",
        "DropzoneFilesList",
        "DropzoneInput",
        "DropzoneLoadingIndicator",
        "DropzoneRoot",
        "DropzoneUploadIndicator",
      ],
      namespace: "Dropzone",
      objectEntries: [
        { exportName: "DropzoneRoot", part: "root", property: "Root" },
        { exportName: "DropzoneInput", part: "input", property: "Input" },
        {
          exportName: "DropzoneUploadIndicator",
          part: "uploadIndicator",
          property: "UploadIndicator",
        },
        {
          exportName: "DropzoneLoadingIndicator",
          part: "loadingIndicator",
          property: "LoadingIndicator",
        },
        { exportName: "DropzoneFilesList", part: "filesList", property: "FilesList" },
      ],
    });
    expect(spec.dropzone.runtimeBoundary).toEqual([
      "file input setup and label association",
      "keyboard activation and click forwarding",
      "drag/drop workflow and drag-active state",
      "DataTransfer assignment and selected-file tracking",
      "accept/multiple filtering for dropped files",
      "upload state coordination and indicator mutation",
      "file-list rendering and DOM replacement",
      "native input files reflection and form reset",
    ]);
  });

  it("rejects Dropzone specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      dropzone: {
        ...spec.dropzone,
        acceptedFileFiltering: {},
        dragDropWorkflow: {},
        fileAssignment: {},
        fileInput: {
          ...spec.dropzone.fileInput,
          dataTransferAssignment: {},
          fileInputSetup: {},
        },
        fileList: {
          ...spec.dropzone.fileList,
          fileListRendering: {},
          fileTracking: {},
        },
        formBridge: {
          ...spec.dropzone.formBridge,
          formReset: {},
        },
        keyboardActivation: {},
        selectedFileTracking: {},
        uploadState: {
          ...spec.dropzone.uploadState,
          uploadStateCoordination: {},
        },
      },
    } as unknown as DropzoneSpecializedAdapterSpec;

    expect(validateDropzoneSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Dropzone specialized adapter spec must not declare dropzone.acceptedFileFiltering; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.dragDropWorkflow; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.fileAssignment; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.fileInput.dataTransferAssignment; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.fileInput.fileInputSetup; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.fileList.fileListRendering; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.fileList.fileTracking; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.formBridge.formReset; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.keyboardActivation; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.selectedFileTracking; keep Runtime-owned behavior in Runtime controllers.",
        "Dropzone specialized adapter spec must not declare dropzone.uploadState.uploadStateCoordination; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Dropzone specialized adapter spec source-fact drift without throwing", () => {
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);
    const withoutAcceptProp = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "accept"),
    } as unknown as DropzoneSpecializedAdapterSpec;
    const withoutFilesChangeEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "filesChange"),
    } as unknown as DropzoneSpecializedAdapterSpec;
    const withoutUploadingState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "uploading"),
    } as unknown as DropzoneSpecializedAdapterSpec;
    const withoutInputPart = {
      ...spec,
      parts: spec.parts.filter((part) => part.name !== "input"),
    } as unknown as DropzoneSpecializedAdapterSpec;
    const withFileInputDrift = {
      ...spec,
      dropzone: {
        ...spec.dropzone,
        fileInput: {
          ...spec.dropzone.fileInput,
          type: {
            ...spec.dropzone.fileInput.type,
            value: "text",
          },
        },
      },
    } as unknown as DropzoneSpecializedAdapterSpec;
    const withUploadIndicatorHiddenDrift = {
      ...spec,
      dropzone: {
        ...spec.dropzone,
        uploadState: {
          ...spec.dropzone.uploadState,
          indicators: spec.dropzone.uploadState.indicators.map((indicator) =>
            indicator.part === "uploadIndicator"
              ? {
                  ...indicator,
                  hiddenWhen: "not-uploading",
                }
              : indicator,
          ),
        },
      },
    } as unknown as DropzoneSpecializedAdapterSpec;
    const withUploadStateDrift = {
      ...spec,
      dropzone: {
        ...spec.dropzone,
        uploadState: {
          ...spec.dropzone.uploadState,
          setterSync: {
            ...spec.dropzone.uploadState.setterSync,
            method: "setUploadState",
          },
        },
      },
    } as unknown as DropzoneSpecializedAdapterSpec;
    const withoutInputFile = {
      ...spec,
      files: spec.files.filter((file) => file.kind !== "part" || file.part !== "input"),
    } as DropzoneSpecializedAdapterSpec;

    expect(() => validateDropzoneSpecializedAdapterSpec(withoutAcceptProp)).not.toThrow();
    expect(() => validateDropzoneSpecializedAdapterSpec(withoutFilesChangeEvent)).not.toThrow();
    expect(() => validateDropzoneSpecializedAdapterSpec(withoutUploadingState)).not.toThrow();
    expect(() => validateDropzoneSpecializedAdapterSpec(withoutInputPart)).not.toThrow();
    expect(() => validateDropzoneSpecializedAdapterSpec(withFileInputDrift)).not.toThrow();
    expect(() =>
      validateDropzoneSpecializedAdapterSpec(withUploadIndicatorHiddenDrift),
    ).not.toThrow();
    expect(() => validateDropzoneSpecializedAdapterSpec(withUploadStateDrift)).not.toThrow();
    expect(() => validateDropzoneSpecializedAdapterSpec(withoutInputFile)).not.toThrow();
    expect(validateDropzoneSpecializedAdapterSpec(withoutAcceptProp)).toEqual(
      expect.arrayContaining([
        "Dropzone specialized adapter spec props must match source contract facts for disabled, upload, callback, and file input props.",
        "Dropzone specialized adapter spec requires accept input prop metadata.",
      ]),
    );
    expect(validateDropzoneSpecializedAdapterSpec(withoutFilesChangeEvent)).toContain(
      "Dropzone specialized adapter spec filesChange metadata must match callback, event, reasons, and subscriber facts.",
    );
    expect(validateDropzoneSpecializedAdapterSpec(withoutUploadingState)).toContain(
      "Dropzone specialized adapter spec requires uploading state metadata.",
    );
    expect(validateDropzoneSpecializedAdapterSpec(withoutInputPart)).toContain(
      "Dropzone specialized adapter spec requires input part.",
    );
    expect(validateDropzoneSpecializedAdapterSpec(withFileInputDrift)).toContain(
      "Dropzone specialized adapter spec fileInput metadata must match native file input, refs, constraints, disabled projection, and form facts.",
    );
    expect(validateDropzoneSpecializedAdapterSpec(withUploadIndicatorHiddenDrift)).toContain(
      "Dropzone specialized adapter spec uploadState metadata must match uploading state, setter, and indicator facts.",
    );
    expect(validateDropzoneSpecializedAdapterSpec(withUploadStateDrift)).toContain(
      "Dropzone specialized adapter spec uploadState metadata must match uploading state, setter, and indicator facts.",
    );
    expect(validateDropzoneSpecializedAdapterSpec(withoutInputFile)).toContain(
      "Dropzone specialized adapter spec files must match exported Dropzone parts plus index.",
    );
  });

  it("describes Field specialized adapter spec anatomy, control composition, messages, form timing, framework, and namespace recipes", () => {
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);

    expect(validateFieldSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("field");
    expect(spec.category).toBe("field-control-coordinator");
    expect(spec.root).toMatchObject({
      defaultElement: "div",
      discoveryAttribute: "data-sw-field",
      part: "root",
      runtimeFactory: "createField",
      runtimeImportSource: "@starwind-ui/runtime/field",
    });
    expect(spec.files.map((file) => [file.kind, file.path, file.part])).toEqual([
      ["part", "field/FieldRoot", "root"],
      ["part", "field/FieldLabel", "label"],
      ["part", "field/FieldControl", "control"],
      ["part", "field/FieldDescription", "description"],
      ["part", "field/FieldItem", "item"],
      ["part", "field/FieldError", "error"],
      ["part", "field/FieldValidity", "validity"],
      ["index", "field/index", undefined],
    ]);
    expect(spec.field.adapterKind).toBe("field-composition");
    expect(spec.field.anatomy).toEqual([
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-field",
        initialAttributes: [
          "data-dirty",
          "data-disabled",
          "data-invalid",
          "data-name",
          "data-touched",
        ],
        part: "root",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "label",
        discoveryAttribute: "data-sw-field-label",
        initialAttributes: [],
        part: "label",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "input",
        discoveryAttribute: "data-sw-field-control",
        initialAttributes: ["data-sw-input"],
        part: "control",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "p",
        discoveryAttribute: "data-sw-field-description",
        initialAttributes: [],
        part: "description",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-field-item",
        initialAttributes: [],
        part: "item",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-field-error",
        initialAttributes: ["data-match", "data-message-source", "hidden"],
        part: "error",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-field-validity",
        initialAttributes: ["data-match", "hidden"],
        part: "validity",
        publicRef: true,
        role: undefined,
      },
    ]);
    expect(spec.field.rootState).toEqual({
      controls: [
        {
          attribute: "data-dirty",
          defaultValue: "false",
          prop: "dirty",
          setter: "setDirty",
          stateModel: "dirty",
          type: "boolean",
        },
        {
          attribute: "data-disabled",
          defaultValue: "false",
          prop: "disabled",
          setter: "setDisabled",
          type: "boolean",
        },
        {
          attribute: "data-invalid",
          defaultValue: "false",
          prop: "invalid",
          setter: "setInvalid",
          type: "boolean",
        },
        {
          attribute: "data-name",
          prop: "name",
          setter: "setName",
          type: "string",
        },
        {
          attribute: "data-touched",
          defaultValue: "false",
          prop: "touched",
          setter: "setTouched",
          stateModel: "touched",
          type: "boolean",
        },
      ],
      runtimeBoundary:
        "Runtime owns field state observation, validation reads, ARIA linkage, and reflected data-state mutation.",
    });
    expect(spec.field.controlComposition).toEqual({
      composedControl: {
        composedPrimitive: "input",
        composedAttribute: "data-sw-input",
        defaultElement: "input",
        disabledProjection: {
          attribute: "data-disabled",
          forwardedAttribute: "disabled",
          prop: "disabled",
        },
        valueType: "string | number | string[]",
      },
      part: "control",
      runtimeBoundary:
        "Runtime owns control discovery and ARIA/error/description wiring; adapters only compose the public control element with the Input primitive surface.",
    });
    expect(spec.field.messageProjection).toEqual({
      error: {
        hiddenDefault: "true",
        matchAttribute: "data-match",
        matchDefault: "false",
        matchProp: "match",
        messageSource: {
          attribute: "data-message-source",
          prop: "messageSource",
          type: '"children" | "validation"',
        },
        part: "error",
        serialization: "boolean-to-string-or-validity-token",
      },
      matchType: "FieldErrorMatch",
      matchValues: [
        "badInput",
        "customError",
        "patternMismatch",
        "rangeOverflow",
        "rangeUnderflow",
        "stepMismatch",
        "tooLong",
        "tooShort",
        "typeMismatch",
        "valid",
        "valueMissing",
      ],
      runtimeBoundary:
        "Runtime owns validation reads, message visibility, validation-message text replacement, and hidden-state mutation.",
      validity: {
        hiddenDefault: "true",
        matchAttribute: "data-match",
        matchDefault: "true",
        matchProp: "match",
        part: "validity",
        serialization: "boolean-to-string-or-validity-token",
      },
    });
    expect(spec.field.formTiming).toEqual({
      passthroughs: [
        {
          attribute: "data-error-visibility",
          prop: "errorVisibility",
          type: "FormValidationTiming",
        },
        {
          attribute: "data-revalidation-timing",
          prop: "revalidationTiming",
          type: "FormValidationTiming",
        },
        {
          attribute: "data-validation-timing",
          prop: "validationTiming",
          type: "FormValidationTiming",
        },
      ],
      runtimeBoundary:
        "Form Runtime owns timing semantics and error visibility; Field adapters only project passthrough attributes.",
      typeImport: {
        importSource: "@starwind-ui/runtime/form",
        name: "FormValidationTiming",
      },
    });
    expect(spec.field.namespace).toEqual({
      defaultExport: "Field",
      defaultNamespace: true,
      memberParts: ["control", "description", "error", "item", "label", "root", "validity"],
      namedExports: [
        "Field",
        "FieldControl",
        "FieldDescription",
        "FieldError",
        "FieldItem",
        "FieldLabel",
        "FieldRoot",
        "FieldValidity",
      ],
      namespace: "Field",
      objectEntries: [
        { exportName: "FieldControl", part: "control", property: "Control" },
        { exportName: "FieldDescription", part: "description", property: "Description" },
        { exportName: "FieldError", part: "error", property: "Error" },
        { exportName: "FieldItem", part: "item", property: "Item" },
        { exportName: "FieldLabel", part: "label", property: "Label" },
        { exportName: "FieldRoot", part: "root", property: "Root" },
        { exportName: "FieldValidity", part: "validity", property: "Validity" },
      ],
    });
    expect(spec.field.runtimeBoundary).toEqual([
      "label/control/description/error/validity DOM discovery",
      "ARIA id wiring and describedby/errormessage mutation",
      "native and custom control validation reads",
      "Form timing and error visibility semantics",
      "message visibility and validation-message text replacement",
      "dirty/touched/invalid state observation and cleanup observers",
    ]);
  });

  it("builds and prints Field through the Adapter Output Model", async () => {
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);
    const outputModel = buildFieldAdapterOutputModel(spec);
    const astroFiles = printAstroFieldAdapterOutputModel(spec);
    const reactFiles = printReactFieldAdapterOutputModel(spec);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(outputModel.files)).toBe(false);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "field-composition", part: "root" }),
      expect.objectContaining({ kind: "field-composition", part: "label" }),
      expect.objectContaining({ kind: "field-composition", part: "control" }),
      expect.objectContaining({ kind: "field-composition", part: "description" }),
      expect.objectContaining({ kind: "field-composition", part: "item" }),
      expect.objectContaining({ kind: "field-composition", part: "error" }),
      expect.objectContaining({ kind: "field-composition", part: "validity" }),
    ]);

    const root = outputModel.files.find(
      (file) => file.kind === "component" && file.component.family?.part === "root",
    );
    if (!root || root.kind !== "component") {
      throw new Error("Field output model is missing root component file.");
    }
    expect(root).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          lifecycle: expect.objectContaining({ factory: "createField" }),
          stateSync: [
            expect.objectContaining({ setter: "setDirty", valueProp: "dirty" }),
            expect.objectContaining({ setter: "setDisabled", valueProp: "disabled" }),
            expect.objectContaining({ setter: "setInvalid", valueProp: "invalid" }),
            expect.objectContaining({ setter: "setName", valueProp: "name" }),
            expect.objectContaining({ setter: "setTouched", valueProp: "touched" }),
          ],
        }),
      }),
    );
    expect(root.component.family).toEqual(
      expect.objectContaining({
        facts: expect.objectContaining({
          control: expect.objectContaining({
            valueTypeName: "FieldControlValue",
          }),
          formTiming: expect.objectContaining({
            errorVisibility: expect.objectContaining({ attribute: "data-error-visibility" }),
            revalidationTiming: expect.objectContaining({
              attribute: "data-revalidation-timing",
            }),
            validationTiming: expect.objectContaining({ attribute: "data-validation-timing" }),
          }),
          message: expect.objectContaining({
            error: expect.objectContaining({ matchDefault: "false" }),
            validity: expect.objectContaining({ matchDefault: "true" }),
          }),
        }),
      }),
    );

    for (const [targetPackage, files, extension] of [
      ["astro", astroFiles, ".astro"],
      ["react", reactFiles, ".tsx"],
    ] as const) {
      for (const file of spec.files) {
        const filePath = `${file.path}${file.kind === "index" ? ".ts" : extension}`;
        const printedFile = getPrintedFile(files, filePath);
        const packagePath = join(process.cwd(), "packages", targetPackage, "src", filePath);

        expect(await formatGeneratedOutput(printedFile, packagePath)).toBe(
          readGeneratedPackageBody(`packages/${targetPackage}/src`, filePath),
        );
      }
    }
  }, 20_000);

  it("rejects Field specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      field: {
        ...spec.field,
        ariaWiringAlgorithm: {},
        controlComposition: {
          ...spec.field.controlComposition,
          labelControlDiscovery: {},
        },
        formTiming: {
          ...spec.field.formTiming,
          validationReads: {},
        },
        messageProjection: {
          ...spec.field.messageProjection,
          messageVisibility: {},
          observerCleanup: {},
        },
        rootState: {
          ...spec.field.rootState,
          validationReads: {},
        },
      },
    } as unknown as FieldSpecializedAdapterSpec;

    expect(validateFieldSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Field specialized adapter spec must not declare field.ariaWiringAlgorithm; keep Runtime-owned behavior in Runtime controllers.",
        "Field specialized adapter spec must not declare field.controlComposition.labelControlDiscovery; keep Runtime-owned behavior in Runtime controllers.",
        "Field specialized adapter spec must not declare field.formTiming.validationReads; keep Runtime-owned behavior in Runtime controllers.",
        "Field specialized adapter spec must not declare field.messageProjection.messageVisibility; keep Runtime-owned behavior in Runtime controllers.",
        "Field specialized adapter spec must not declare field.messageProjection.observerCleanup; keep Runtime-owned behavior in Runtime controllers.",
        "Field specialized adapter spec must not declare field.rootState.validationReads; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Field specialized adapter spec source-fact drift without throwing", () => {
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);
    const withoutControlPart = {
      ...spec,
      parts: spec.parts.filter((part) => part.name !== "control"),
    } as unknown as FieldSpecializedAdapterSpec;
    const withoutDirtySetter = {
      ...spec,
      setterSync: spec.setterSync.filter(
        (setter) => !("prop" in setter) || setter.prop !== "dirty",
      ),
    } as unknown as FieldSpecializedAdapterSpec;
    const withoutMessageSourceProp = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "messageSource"),
    } as unknown as FieldSpecializedAdapterSpec;
    const withControlCompositionDrift = {
      ...spec,
      field: {
        ...spec.field,
        controlComposition: {
          ...spec.field.controlComposition,
          composedControl: {
            ...spec.field.controlComposition.composedControl,
            composedPrimitive: "textarea",
          },
        },
      },
    } as unknown as FieldSpecializedAdapterSpec;
    const withMessageProjectionDrift = {
      ...spec,
      field: {
        ...spec.field,
        messageProjection: {
          ...spec.field.messageProjection,
          error: {
            ...spec.field.messageProjection.error,
            matchDefault: "true",
          },
        },
      },
    } as unknown as FieldSpecializedAdapterSpec;
    const withFormTimingDrift = {
      ...spec,
      field: {
        ...spec.field,
        formTiming: {
          ...spec.field.formTiming,
          passthroughs: spec.field.formTiming.passthroughs.slice(0, 2),
        },
      },
    } as unknown as FieldSpecializedAdapterSpec;

    expect(() => validateFieldSpecializedAdapterSpec(withoutControlPart)).not.toThrow();
    expect(() => validateFieldSpecializedAdapterSpec(withoutDirtySetter)).not.toThrow();
    expect(() => validateFieldSpecializedAdapterSpec(withoutMessageSourceProp)).not.toThrow();
    expect(() => validateFieldSpecializedAdapterSpec(withControlCompositionDrift)).not.toThrow();
    expect(() => validateFieldSpecializedAdapterSpec(withMessageProjectionDrift)).not.toThrow();
    expect(() => validateFieldSpecializedAdapterSpec(withFormTimingDrift)).not.toThrow();
    expect(validateFieldSpecializedAdapterSpec(withoutControlPart)).toContain(
      "Field specialized adapter spec requires control part.",
    );
    expect(validateFieldSpecializedAdapterSpec(withoutDirtySetter)).toContain(
      "Field specialized adapter spec requires dirty setter metadata.",
    );
    expect(validateFieldSpecializedAdapterSpec(withoutMessageSourceProp)).toContain(
      "Field specialized adapter spec props must match source contract facts for root state, message projection, and control composition.",
    );
    expect(validateFieldSpecializedAdapterSpec(withControlCompositionDrift)).toContain(
      "Field specialized adapter spec controlComposition metadata must match FieldControl composition facts.",
    );
    expect(validateFieldSpecializedAdapterSpec(withMessageProjectionDrift)).toContain(
      "Field specialized adapter spec messageProjection metadata must match FieldError and FieldValidity serialization facts.",
    );
    expect(validateFieldSpecializedAdapterSpec(withFormTimingDrift)).toContain(
      "Field specialized adapter spec formTiming metadata must document Form timing passthrough attributes.",
    );
  });

  it("routes Field Astro production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildFieldAdapterOutputModel",
      buildSpec: "buildFieldSpecializedAdapterSpec",
      component: "field",
    });
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-field-astro-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateAstroPrimitiveField(outputRoot, "---\n", "");

    const generatedRoot = readFileSync(join(outputRoot, "field/FieldRoot.astro"), "utf8");
    expect(generatedRoot).toContain("const getInitCandidates = (event: Event | undefined");
    expect(generatedRoot).toContain("event.detail?.root");
    expect(generatedRoot).toContain(
      "scopedRoot instanceof Element && scopedRoot.matches(selector)",
    );
    expect(generatedRoot).toContain('getInitCandidates(event, "[data-sw-field]")');

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Field Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-field-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroFieldSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Field React production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildFieldAdapterOutputModel",
      buildSpec: "buildFieldSpecializedAdapterSpec",
      component: "field",
    });
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-field-react-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateReactPrimitiveField(outputRoot, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Field React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildFieldSpecializedAdapterSpec(fieldRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-field-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactFieldSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("describes Carousel specialized adapter spec anatomy, options, controls, refs, framework, and namespace recipes", () => {
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);

    expect(validateCarouselSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("carousel");
    expect(spec.category).toBe("viewport-measurement");
    expect(spec.root).toMatchObject({
      defaultElement: "div",
      discoveryAttribute: "data-sw-carousel",
      part: "root",
      runtimeFactory: "createCarousel",
      runtimeImportSource: "@starwind-ui/runtime/carousel",
    });
    expect(spec.files.map((file) => [file.kind, file.path, file.part])).toEqual([
      ["part", "carousel/CarouselRoot", "root"],
      ["part", "carousel/CarouselViewport", "viewport"],
      ["part", "carousel/CarouselContainer", "container"],
      ["part", "carousel/CarouselItem", "item"],
      ["part", "carousel/CarouselPrevious", "previous"],
      ["part", "carousel/CarouselNext", "next"],
      ["index", "carousel/index", undefined],
    ]);
    expect(spec.carousel.adapterKind).toBe("engine-backed-carousel");
    expect(spec.carousel.engine).toEqual({
      name: "Embla",
      runtimeBoundary:
        "Runtime owns Embla creation, option forwarding, plugin setup, keyboard navigation, slide state, control disabled state, measurement, reinitialization, and cleanup.",
      runtimeFactory: "createCarousel",
      runtimeImportSource: "@starwind-ui/runtime/carousel",
    });
    expect(spec.carousel.anatomy).toEqual([
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-carousel",
        initialAttributes: [
          "role",
          "aria-roledescription",
          "data-axis",
          "data-opts",
          "data-auto-init",
        ],
        part: "root",
        publicRef: true,
        role: "region",
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-carousel-viewport",
        initialAttributes: [],
        part: "viewport",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-carousel-container",
        initialAttributes: [],
        part: "container",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-carousel-item",
        initialAttributes: ["role", "aria-roledescription"],
        part: "item",
        publicRef: true,
        role: "group",
      },
      {
        defaultElement: "button",
        discoveryAttribute: "data-sw-carousel-previous",
        initialAttributes: ["type", "aria-disabled", "data-disabled"],
        part: "previous",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "button",
        discoveryAttribute: "data-sw-carousel-next",
        initialAttributes: ["type", "aria-disabled", "data-disabled"],
        part: "next",
        publicRef: true,
        role: undefined,
      },
    ]);
    expect(spec.carousel.options).toEqual({
      autoInit: {
        attribute: "data-auto-init",
        defaultValue: "true",
        falseValue: "false",
        prop: "autoInit",
        type: "boolean",
        unsupportedTargets: ["react"],
      },
      opts: {
        attribute: "data-opts",
        defaultValue: "{}",
        lifecycle: "refresh-required",
        prop: "opts",
        serialization: "json",
        type: 'CarouselOptions["opts"]',
      },
      orientation: {
        attribute: "data-axis",
        axisMap: { horizontal: "x", vertical: "y" },
        defaultValue: '"horizontal"',
        lifecycle: "refresh-required",
        prop: "orientation",
        type: '"horizontal" | "vertical"',
      },
      plugins: {
        lifecycle: "refresh-required",
        prop: "plugins",
        type: 'CarouselOptions["plugins"]',
        unsupportedTargets: ["astro"],
      },
      setApi: {
        apiType: 'CarouselInstance["api"]',
        lifecycle: "constructor-only",
        prop: "setApi",
        refLifecycle: "latest-callback-ref",
        type: '(api: CarouselInstance["api"]) => void',
        unsupportedTargets: ["astro"],
      },
    });
    expect(spec.carousel.controls).toEqual({
      next: {
        disabledAttributes: ["aria-disabled", "data-disabled"],
        part: "next",
        typeAttribute: "type",
        typeValue: "button",
      },
      previous: {
        disabledAttributes: ["aria-disabled", "data-disabled"],
        part: "previous",
        typeAttribute: "type",
        typeValue: "button",
      },
      runtimeBoundary:
        "Runtime owns previous/next disabled state, click handling, keyboard navigation, and slide selection.",
    });
    expect(spec.carousel.namespace).toEqual({
      defaultExport: "Carousel",
      defaultNamespace: true,
      memberParts: ["root", "viewport", "container", "item", "previous", "next"],
      namedExports: [
        "Carousel",
        "CarouselContainer",
        "CarouselItem",
        "CarouselNext",
        "CarouselPrevious",
        "CarouselRoot",
        "CarouselViewport",
      ],
      namespace: "Carousel",
      objectEntries: [
        { exportName: "CarouselRoot", part: "root", property: "Root" },
        { exportName: "CarouselViewport", part: "viewport", property: "Viewport" },
        { exportName: "CarouselContainer", part: "container", property: "Container" },
        { exportName: "CarouselItem", part: "item", property: "Item" },
        { exportName: "CarouselPrevious", part: "previous", property: "Previous" },
        { exportName: "CarouselNext", part: "next", property: "Next" },
      ],
    });
    expect(spec.carousel.runtimeBoundary).toEqual([
      "Embla engine creation and destruction",
      "option forwarding and plugin setup/cleanup",
      "keyboard navigation and slide state",
      "previous/next disabled state",
      "measurement and resize/viewport reinitialization",
      "scroll physics and carousel API mutation",
    ]);
  });

  it("rejects Carousel specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      carousel: {
        ...spec.carousel,
        engine: {
          ...spec.carousel.engine,
          emblaLifecycle: {},
        },
        controls: {
          ...spec.carousel.controls,
          previous: {
            ...spec.carousel.controls.previous,
            disabledControlState: {},
          },
        },
        measurement: {},
        options: {
          ...spec.carousel.options,
          reinitialization: {},
        },
        physics: {},
        slideState: {},
      },
    } as unknown as CarouselSpecializedAdapterSpec;

    expect(validateCarouselSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Carousel specialized adapter spec must not declare carousel.engine.emblaLifecycle; keep Runtime-owned behavior in Runtime controllers.",
        "Carousel specialized adapter spec must not declare carousel.controls.previous.disabledControlState; keep Runtime-owned behavior in Runtime controllers.",
        "Carousel specialized adapter spec must not declare carousel.measurement; keep Runtime-owned behavior in Runtime controllers.",
        "Carousel specialized adapter spec must not declare carousel.options.reinitialization; keep Runtime-owned behavior in Runtime controllers.",
        "Carousel specialized adapter spec must not declare carousel.physics; keep Runtime-owned behavior in Runtime controllers.",
        "Carousel specialized adapter spec must not declare carousel.slideState; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("reports Carousel specialized adapter spec source-fact drift without throwing", () => {
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);
    const withoutViewportPart = {
      ...spec,
      parts: spec.parts.filter((part) => part.name !== "viewport"),
    } as unknown as CarouselSpecializedAdapterSpec;
    const withoutPluginsProp = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "plugins"),
    } as unknown as CarouselSpecializedAdapterSpec;
    const withoutSourceRuntimeOptionProp = {
      ...spec,
      sourcePrimitiveContract: {
        ...spec.sourcePrimitiveContract,
        runtime: {
          ...spec.sourcePrimitiveContract.runtime,
          optionProps: spec.sourcePrimitiveContract.runtime.optionProps?.filter(
            (prop) => prop !== "plugins",
          ),
        },
      },
    } as unknown as CarouselSpecializedAdapterSpec;
    const withoutRenderPlanRuntimeOptionProp = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        runtime: {
          ...spec.renderPlan.runtime,
          optionProps: spec.renderPlan.runtime.optionProps?.filter((prop) => prop !== "setApi"),
        },
      },
    } as unknown as CarouselSpecializedAdapterSpec;
    const withOrientationDrift = {
      ...spec,
      carousel: {
        ...spec.carousel,
        options: {
          ...spec.carousel.options,
          orientation: {
            ...spec.carousel.options.orientation,
            axisMap: { horizontal: "horizontal", vertical: "vertical" },
          },
        },
      },
    } as unknown as CarouselSpecializedAdapterSpec;
    const withAutoInitDrift = {
      ...spec,
      carousel: {
        ...spec.carousel,
        options: {
          ...spec.carousel.options,
          autoInit: {
            ...spec.carousel.options.autoInit,
            unsupportedTargets: [],
          },
        },
      },
    } as unknown as CarouselSpecializedAdapterSpec;
    const withControlDrift = {
      ...spec,
      carousel: {
        ...spec.carousel,
        controls: {
          ...spec.carousel.controls,
          next: {
            ...spec.carousel.controls.next,
            typeValue: "submit",
          },
        },
      },
    } as unknown as CarouselSpecializedAdapterSpec;
    const withNamedExportDrift = {
      ...spec,
      carousel: {
        ...spec.carousel,
        namespace: {
          ...spec.carousel.namespace,
          namedExports: [...spec.carousel.namespace.namedExports].reverse(),
        },
      },
    } as CarouselSpecializedAdapterSpec;
    const withUnexpectedFile = {
      ...spec,
      files: [
        ...spec.files,
        {
          exportName: "CarouselIndicator",
          kind: "part",
          part: "indicator",
          path: "carousel/CarouselIndicator",
        },
      ],
      renderPlan: {
        ...spec.renderPlan,
        files: [
          ...spec.renderPlan.files,
          {
            exportName: "CarouselIndicator",
            kind: "part",
            part: "indicator",
            path: "carousel/CarouselIndicator",
          },
        ],
      },
    } as unknown as CarouselSpecializedAdapterSpec;

    expect(() => validateCarouselSpecializedAdapterSpec(withoutViewportPart)).not.toThrow();
    expect(() => validateCarouselSpecializedAdapterSpec(withoutPluginsProp)).not.toThrow();
    expect(() =>
      validateCarouselSpecializedAdapterSpec(withoutSourceRuntimeOptionProp),
    ).not.toThrow();
    expect(() =>
      validateCarouselSpecializedAdapterSpec(withoutRenderPlanRuntimeOptionProp),
    ).not.toThrow();
    expect(() => validateCarouselSpecializedAdapterSpec(withOrientationDrift)).not.toThrow();
    expect(() => validateCarouselSpecializedAdapterSpec(withAutoInitDrift)).not.toThrow();
    expect(() => validateCarouselSpecializedAdapterSpec(withControlDrift)).not.toThrow();
    expect(() => validateCarouselSpecializedAdapterSpec(withNamedExportDrift)).not.toThrow();
    expect(() => validateCarouselSpecializedAdapterSpec(withUnexpectedFile)).not.toThrow();
    expect(validateCarouselSpecializedAdapterSpec(withoutViewportPart)).toContain(
      "Carousel specialized adapter spec requires viewport part.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withoutPluginsProp)).toContain(
      "Carousel specialized adapter spec options must match orientation, opts, plugins, setApi, and autoInit source contract facts.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withoutSourceRuntimeOptionProp)).toContain(
      "Carousel specialized adapter spec options must match orientation, opts, plugins, setApi, and autoInit source contract facts.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withoutRenderPlanRuntimeOptionProp)).toContain(
      "Carousel specialized adapter spec options must match orientation, opts, plugins, setApi, and autoInit source contract facts.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withOrientationDrift)).toContain(
      "Carousel specialized adapter spec options must match orientation, opts, plugins, setApi, and autoInit source contract facts.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withAutoInitDrift)).toContain(
      "Carousel specialized adapter spec options must match orientation, opts, plugins, setApi, and autoInit source contract facts.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withControlDrift)).toContain(
      "Carousel specialized adapter spec controls metadata must match previous/next button and disabled-state facts.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withNamedExportDrift)).toContain(
      "Carousel specialized adapter spec namespace namedExports must match generated export order.",
    );
    expect(validateCarouselSpecializedAdapterSpec(withUnexpectedFile)).toContain(
      "Carousel specialized adapter spec files must match root, viewport, container, item, previous, next, plus index.",
    );
  });

  it("routes Carousel Astro production generation through the Adapter Output Model", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildCarouselAdapterOutputModel",
      buildSpec: "buildCarouselSpecializedAdapterSpec",
      component: "carousel",
    });
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-carousel-astro-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateAstroPrimitiveCarousel(outputRoot, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }

    expectCarouselIndexNamespaceSurface(outputRoot, spec.carousel.namespace.namedExports);
  }, 20_000);

  it("writes Carousel Astro output from the Adapter Output Model without changing package bodies", async () => {
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-carousel-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroCarouselSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }

    expectCarouselIndexNamespaceSurface(outputRoot, spec.carousel.namespace.namedExports);
  }, 20_000);

  it("routes Carousel React production generation through the Adapter Output Model", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildCarouselAdapterOutputModel",
      buildSpec: "buildCarouselSpecializedAdapterSpec",
      component: "carousel",
    });
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-carousel-react-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateReactPrimitiveCarousel(outputRoot, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }

    expectCarouselIndexNamespaceSurface(outputRoot, spec.carousel.namespace.namedExports);
  }, 20_000);

  it("writes Carousel React output from the Adapter Output Model without changing package bodies", async () => {
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-carousel-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactCarouselSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }

    expectCarouselIndexNamespaceSurface(outputRoot, spec.carousel.namespace.namedExports);
  }, 20_000);

  it("builds and prints Carousel through the Adapter Output Model", async () => {
    const spec = buildCarouselSpecializedAdapterSpec(carouselRuntimeAdapterContract);
    const astroOutputModel = projectAstroSpecializedOutputModel(
      buildCarouselAdapterOutputModel(spec),
    );
    const reactOutputModel = projectReactSpecializedOutputModel(
      buildCarouselAdapterOutputModel(spec),
    );
    const astroFiles = printAstroCarouselAdapterOutputModel(spec);
    const reactFiles = printReactCarouselAdapterOutputModel(spec);

    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(astroOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(6);
    expect(reactOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(6);
    expect(astroOutputModel.files.at(-1)?.kind).toBe("index");
    expect(reactOutputModel.files.at(-1)?.kind).toBe("index");
    expect(astroFiles.map((file) => file.path)).toEqual(
      astroOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );
    expect(reactFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.tsx` : file.path,
      ),
    );
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "engine-viewport", part: "root" }),
        expect.objectContaining({ kind: "engine-viewport", part: "item" }),
        expect.objectContaining({ kind: "engine-viewport", part: "previous" }),
      ]),
    );

    for (const file of astroFiles) {
      const packagePath = join(process.cwd(), "packages/astro/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", file.path),
      );
    }

    for (const file of reactFiles) {
      const packagePath = join(process.cwd(), "packages/react/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", file.path),
      );
    }

    const astroRoot = astroFiles.find((file) => file.path === "carousel/CarouselRoot.astro");
    const astroItem = astroFiles.find((file) => file.path === "carousel/CarouselItem.astro");
    const astroPrevious = astroFiles.find(
      (file) => file.path === "carousel/CarouselPrevious.astro",
    );
    const astroNext = astroFiles.find((file) => file.path === "carousel/CarouselNext.astro");
    const astroIndex = astroFiles.find((file) => file.path === "carousel/index.ts");
    const reactRoot = reactFiles.find((file) => file.path === "carousel/CarouselRoot.tsx");
    const reactItem = reactFiles.find((file) => file.path === "carousel/CarouselItem.tsx");
    const reactPrevious = reactFiles.find((file) => file.path === "carousel/CarouselPrevious.tsx");
    const reactNext = reactFiles.find((file) => file.path === "carousel/CarouselNext.tsx");
    const reactIndex = reactFiles.find((file) => file.path === "carousel/index.ts");

    expect(astroRoot?.contents).toContain(
      'import { createCarousel } from "@starwind-ui/runtime/carousel";',
    );
    expect(astroRoot?.contents).toContain('data-auto-init={autoInit ? undefined : "false"}');
    expect(astroRoot?.contents).toContain('data-axis={orientation === "vertical" ? "y" : "x"}');
    expect(astroRoot?.contents).toContain("data-opts={JSON.stringify(opts)}");
    expect(astroRoot?.contents).toContain(
      'if (root.getAttribute("data-auto-init") === "false") return;',
    );
    expect(astroItem?.contents).toContain('role="group"');
    expect(astroItem?.contents).toContain('aria-roledescription="slide"');
    expect(astroPrevious?.contents).toContain('type="button"');
    expect(astroNext?.contents).toContain('type="button"');
    expect(astroIndex?.contents).toContain("export type { CarouselInstance, CarouselOptions }");
    expect(astroIndex?.contents).toContain(
      'export { createCarousel } from "@starwind-ui/runtime/carousel";',
    );

    expect(reactRoot?.contents).toContain("const instance = createCarousel(root, {");
    expect(reactRoot?.contents).toContain("orientation,");
    expect(reactRoot?.contents).toContain("opts: optsRef.current,");
    expect(reactRoot?.contents).toContain("plugins: pluginsRef.current,");
    expect(reactRoot?.contents).toContain("setApiRef.current?.(api);");
    expect(reactRoot?.contents).toContain(
      'instance.reInit({ axis: orientation === "vertical" ? "y" : "x", ...opts }, plugins);',
    );
    expect(reactRoot?.contents).toContain('data-auto-init="false"');
    expect(reactRoot?.contents).toContain('data-axis={orientation === "vertical" ? "y" : "x"}');
    expect(reactRoot?.contents).toContain("data-opts={JSON.stringify(opts)}");
    expect(reactRoot?.contents).toContain("instance.destroy();");
    expect(reactItem?.contents).toContain('role="group"');
    expect(reactItem?.contents).toContain('aria-roledescription="slide"');
    expect(reactPrevious?.contents).toContain('type="button"');
    expect(reactNext?.contents).toContain('type="button"');
    expect(reactIndex?.contents).toContain("export type { CarouselInstance, CarouselOptions }");
    expect(reactIndex?.contents).toContain(
      'export { createCarousel } from "@starwind-ui/runtime/carousel";',
    );

    const targetAdapterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/types.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/engine-viewport.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/engine-viewport.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));

    for (const adapterSource of targetAdapterSources) {
      expect(adapterSource).not.toContain("CarouselRoot");
      expect(adapterSource).not.toContain("createCarousel");
      expect(adapterSource).not.toContain("data-sw-carousel");
      expect(adapterSource).not.toMatch(/\bconst carousel\s*=/);
      expect(adapterSource).not.toMatch(/\bcarousel\.(?!js")/);
    }
  });

  it("describes Toast specialized adapter spec anatomy, manager, templates, API, framework, and namespace recipes", () => {
    const spec = buildToastSpecializedAdapterSpec(toastRuntimeAdapterContract);

    expect(validateToastSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("toast");
    expect(spec.category).toBe("notification-system");
    expect(spec.root).toMatchObject({
      defaultElement: "div",
      discoveryAttribute: "data-sw-toast-viewport",
      part: "viewport",
      runtimeFactory: "createToastManager",
      runtimeImportSource: "@starwind-ui/runtime/toast",
    });
    expect(spec.files.map((file) => [file.kind, file.path, file.part])).toEqual([
      ["part", "toast/ToastViewport", "viewport"],
      ["part", "toast/ToastTemplate", "template"],
      ["part", "toast/ToastRoot", "root"],
      ["part", "toast/ToastContent", "content"],
      ["part", "toast/ToastTitle", "title"],
      ["part", "toast/ToastTitleText", "titleText"],
      ["part", "toast/ToastDescription", "description"],
      ["part", "toast/ToastAction", "action"],
      ["part", "toast/ToastClose", "close"],
      ["index", "toast/index", undefined],
    ]);
    expect(spec.toast.adapterKind).toBe("notification-system");
    expect(spec.toast.anatomy).toEqual([
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-toast-viewport",
        forwardsRef: true,
        initialAttributes: [
          "data-position",
          "data-limit",
          "data-duration",
          "aria-live",
          "aria-atomic",
          "aria-relevant",
          "aria-label",
          "tabIndex",
        ],
        ownsRuntime: true,
        part: "viewport",
        publicRef: true,
        role: "region",
      },
      {
        defaultElement: "template",
        discoveryAttribute: "data-sw-toast-template",
        forwardsRef: true,
        initialAttributes: [],
        ownsRuntime: false,
        part: "template",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-toast-root",
        forwardsRef: true,
        initialAttributes: ["data-toast-id", "data-state", "data-variant"],
        ownsRuntime: false,
        part: "root",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-toast-content",
        forwardsRef: true,
        initialAttributes: [],
        ownsRuntime: false,
        part: "content",
        publicRef: false,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-toast-title",
        forwardsRef: true,
        initialAttributes: [],
        ownsRuntime: false,
        part: "title",
        publicRef: false,
        role: undefined,
      },
      {
        defaultElement: "span",
        discoveryAttribute: "data-sw-toast-title-text",
        forwardsRef: true,
        initialAttributes: [],
        ownsRuntime: false,
        part: "titleText",
        publicRef: false,
        role: undefined,
      },
      {
        defaultElement: "div",
        discoveryAttribute: "data-sw-toast-description",
        forwardsRef: true,
        initialAttributes: [],
        ownsRuntime: false,
        part: "description",
        publicRef: false,
        role: undefined,
      },
      {
        defaultElement: "button",
        discoveryAttribute: "data-sw-toast-action",
        forwardsRef: true,
        initialAttributes: ["type"],
        ownsRuntime: false,
        part: "action",
        publicRef: true,
        role: undefined,
      },
      {
        defaultElement: "button",
        discoveryAttribute: "data-sw-toast-close",
        forwardsRef: true,
        initialAttributes: ["type", "aria-label"],
        ownsRuntime: false,
        part: "close",
        publicRef: true,
        role: undefined,
      },
    ]);
    expect(spec.toast.viewportOptions).toEqual({
      duration: {
        attribute: "data-duration",
        defaultValue: "5000",
        prop: "duration",
        type: "number",
      },
      gap: {
        cssVariable: "--gap",
        defaultValue: '"0.5rem"',
        prop: "gap",
        type: "string",
      },
      limit: {
        attribute: "data-limit",
        defaultValue: "3",
        prop: "limit",
        type: "number",
      },
      peek: {
        cssVariable: "--peek",
        defaultValue: '"1rem"',
        prop: "peek",
        type: "string",
      },
      position: {
        attribute: "data-position",
        defaultValue: '"bottom-right"',
        prop: "position",
        type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
        values: [
          "top-left",
          "top-center",
          "top-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
      },
    });
    expect(spec.toast.template).toEqual({
      part: "template",
      rootPart: "root",
      runtimeBoundary:
        "Runtime owns template lookup, cloning, rerendering, managed content updates, and cloned DOM mutation.",
      variant: {
        defaultValue: '"default"',
        prop: "variant",
        rootAttribute: "data-variant",
        templateAttribute: "data-sw-toast-template",
        type: '"default" | "error" | "info" | "loading" | "success" | "warning"',
        values: ["default", "error", "info", "loading", "success", "warning"],
      },
    });
    expect(spec.toast.manager).toEqual({
      destroyMethod: "destroy",
      globalRegistration: "runtime-owned",
      lifecycle: "viewport-scoped-manager",
      options: {
        defaultDurationAttribute: "data-duration",
        limitAttribute: "data-limit",
      },
      part: "viewport",
      runtimeBoundary:
        "Runtime owns toast manager state, global registration, viewport setup, mutation observers, expansion/collapse, timers, stacking, swipe dismissal, and cleanup.",
      runtimeFactory: "createToastManager",
      runtimeImportSource: "@starwind-ui/runtime/toast",
    });
    expect(spec.toast.rootState).toEqual({
      ariaModal: {
        attribute: "aria-modal",
        value: "false",
      },
      idAttribute: "data-toast-id",
      role: "dialog",
      runtimeBoundary:
        "Runtime owns cloned toast ids, state transitions, aria-labelledby/aria-describedby mutation, and removal timing.",
      stateAttribute: "data-state",
      stateOpenValue: "open",
      variantAttribute: "data-variant",
    });
    expect(spec.toast.actions).toEqual({
      action: {
        part: "action",
        typeAttribute: "type",
        typeValue: "button",
      },
      close: {
        ariaLabelAttribute: "aria-label",
        ariaLabelValue: "Close notification",
        part: "close",
        typeAttribute: "type",
        typeValue: "button",
      },
      runtimeBoundary:
        "Runtime owns action callback invocation, close lifecycle, dismissal, and removal callbacks.",
    });
    expect(spec.toast.publicApi).toEqual({
      exportName: "toast",
      methods: [
        "call",
        "success",
        "error",
        "warning",
        "info",
        "loading",
        "update",
        "dismiss",
        "promise",
      ],
      runtimeBoundary:
        "Runtime owns global manager lookup, imperative routing, promise/update lifecycle, and warnings when no viewport manager is registered.",
      runtimeImportSource: "@starwind-ui/runtime/toast",
      typeImportSource: "@starwind-ui/runtime",
      typeExports: ["ToastApi", "ToastOptions", "ToastPromiseOptions"],
    });
    expect(spec.toast.namespace).toEqual({
      defaultExport: "Toast",
      defaultNamespace: true,
      memberParts: [
        "viewport",
        "template",
        "root",
        "content",
        "title",
        "titleText",
        "description",
        "action",
        "close",
      ],
      namedExports: [
        "Toast",
        "ToastAction",
        "ToastClose",
        "ToastContent",
        "ToastDescription",
        "ToastRoot",
        "ToastTemplate",
        "ToastTitle",
        "ToastTitleText",
        "ToastViewport",
      ],
      namespace: "Toast",
      objectEntries: [
        { exportName: "ToastViewport", part: "viewport", property: "Viewport" },
        { exportName: "ToastTemplate", part: "template", property: "Template" },
        { exportName: "ToastRoot", part: "root", property: "Root" },
        { exportName: "ToastContent", part: "content", property: "Content" },
        { exportName: "ToastTitle", part: "title", property: "Title" },
        { exportName: "ToastTitleText", part: "titleText", property: "TitleText" },
        { exportName: "ToastDescription", part: "description", property: "Description" },
        { exportName: "ToastAction", part: "action", property: "Action" },
        { exportName: "ToastClose", part: "close", property: "Close" },
      ],
    });
    expect(spec.toast.runtimeBoundary).toEqual([
      "global toast manager registration and lookup",
      "imperative toast API routing",
      "template lookup, cloning, rerendering, and managed content updates",
      "timer scheduling, pause/resume, update, promise, and removal lifecycle",
      "stacking, viewport expansion, height measurement, and limited toast state",
      "swipe gesture handling and dismissal thresholds",
      "action callbacks, close callbacks, and global cleanup",
    ]);
  });

  it("rejects Toast specialized adapter spec behavior-shaped fields at the adapter boundary", () => {
    const spec = buildToastSpecializedAdapterSpec(toastRuntimeAdapterContract);
    const withBehaviorFields = {
      ...spec,
      toast: {
        ...spec.toast,
        actionCallbacks: {},
        globalRegistration: {},
        manager: {
          ...spec.toast.manager,
          managerState: {},
        },
        promiseLifecycle: {},
        stacking: {},
        swipeDismissal: {},
        template: {
          ...spec.toast.template,
          templateCloning: {},
        },
        timers: {},
        updateLifecycle: {},
      },
    } as unknown as ToastSpecializedAdapterSpec;

    expect(validateToastSpecializedAdapterSpec(withBehaviorFields)).toEqual(
      expect.arrayContaining([
        "Toast specialized adapter spec must not declare toast.actionCallbacks; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.globalRegistration; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.manager.managerState; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.promiseLifecycle; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.stacking; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.swipeDismissal; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.template.templateCloning; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.timers; keep Runtime-owned behavior in Runtime controllers.",
        "Toast specialized adapter spec must not declare toast.updateLifecycle; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("routes Toast Astro production generation through the Adapter Output Model", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildToastAdapterOutputModel",
      buildSpec: "buildToastSpecializedAdapterSpec",
      component: "toast",
    });
    const spec = buildToastSpecializedAdapterSpec(toastRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-toast-astro-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateAstroPrimitiveToast(outputRoot, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }

    expectToastIndexNamespaceAndPublicApiSurface(outputRoot, spec);
  }, 20_000);

  it("writes Toast Astro output from the Adapter Output Model without changing package bodies", async () => {
    const spec = buildToastSpecializedAdapterSpec(toastRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-toast-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroToastSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }

    expectToastIndexNamespaceAndPublicApiSurface(outputRoot, spec);
  }, 20_000);

  it("routes Toast React production generation through the Adapter Output Model", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildToastAdapterOutputModel",
      buildSpec: "buildToastSpecializedAdapterSpec",
      component: "toast",
    });
    const spec = buildToastSpecializedAdapterSpec(toastRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-toast-react-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateReactPrimitiveToast(outputRoot, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }

    expectToastIndexNamespaceAndPublicApiSurface(outputRoot, spec);
  }, 20_000);

  it("writes Toast React output from the Adapter Output Model without changing package bodies", async () => {
    const spec = buildToastSpecializedAdapterSpec(toastRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-toast-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactToastSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }

    expectToastIndexNamespaceAndPublicApiSurface(outputRoot, spec);
  }, 20_000);

  it("builds and prints Toast through the Adapter Output Model", async () => {
    const spec = buildToastSpecializedAdapterSpec(toastRuntimeAdapterContract);
    const astroOutputModel = projectAstroSpecializedOutputModel(buildToastAdapterOutputModel(spec));
    const reactOutputModel = projectReactSpecializedOutputModel(buildToastAdapterOutputModel(spec));
    const astroFiles = printAstroToastAdapterOutputModel(spec);
    const reactFiles = printReactToastAdapterOutputModel(spec);

    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(astroOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(9);
    expect(reactOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(9);
    expect(astroOutputModel.files.at(-1)?.kind).toBe("index");
    expect(reactOutputModel.files.at(-1)?.kind).toBe("index");
    expect(astroFiles.map((file) => file.path)).toEqual(
      astroOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );
    expect(reactFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.tsx` : file.path,
      ),
    );
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "notification-system", part: "viewport" }),
        expect.objectContaining({ kind: "notification-system", part: "template" }),
        expect.objectContaining({ kind: "notification-system", part: "close" }),
      ]),
    );

    for (const file of astroFiles) {
      const packagePath = join(process.cwd(), "packages/astro/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", file.path),
      );
    }

    for (const file of reactFiles) {
      const packagePath = join(process.cwd(), "packages/react/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", file.path),
      );
    }

    const mutatedAstroOutputModel = structuredClone(astroOutputModel);
    const mutatedAstroViewport = mutatedAstroOutputModel.files.find(
      (file) =>
        file.kind === "component" &&
        file.component.family?.kind === "notification-system" &&
        file.component.family.part === "viewport",
    );
    if (mutatedAstroViewport?.kind !== "component") {
      throw new Error("Toast output model requires viewport component file.");
    }
    if (mutatedAstroViewport.component.family?.kind !== "notification-system") {
      throw new Error("Toast viewport output model requires notification-system family.");
    }
    mutatedAstroViewport.component.family.facts.viewportSemantics.tabIndexAttribute =
      "data-tab-index-test";
    const mutatedAstroViewportFile = printAdapterOutput(
      astroFrameworkAdapter,
      mutatedAstroOutputModel,
    ).find((file) => file.path === "toast/ToastViewport.astro");
    expect(mutatedAstroViewportFile?.contents).toContain('data-tab-index-test="-1"');

    const mutatedReactOutputModel = structuredClone(reactOutputModel);
    const mutatedReactFiles = mutatedReactOutputModel.files.filter(
      (file) =>
        file.kind === "component" &&
        file.component.family?.kind === "notification-system" &&
        (file.component.family.part === "viewport" || file.component.family.part === "root"),
    );
    expect(mutatedReactFiles).toHaveLength(2);
    for (const file of mutatedReactFiles) {
      if (file.kind !== "component" || file.component.family?.kind !== "notification-system") {
        throw new Error("Toast output model requires notification-system component files.");
      }
      file.component.family.facts.parts[file.component.family.part].defaultElement = "section";
    }
    const mutatedReactPrintedFiles = printAdapterOutput(
      reactFrameworkAdapter,
      mutatedReactOutputModel,
    );
    const mutatedReactViewportFile = mutatedReactPrintedFiles.find(
      (file) => file.path === "toast/ToastViewport.tsx",
    );
    const mutatedReactRootFile = mutatedReactPrintedFiles.find(
      (file) => file.path === "toast/ToastRoot.tsx",
    );
    expect(mutatedReactViewportFile?.contents).toContain("React.HTMLAttributes<HTMLElement>");
    expect(mutatedReactViewportFile?.contents).toContain("React.forwardRef<HTMLElement");
    expect(mutatedReactViewportFile?.contents).toContain("<section");
    expect(mutatedReactRootFile?.contents).toContain("React.HTMLAttributes<HTMLElement>");
    expect(mutatedReactRootFile?.contents).toContain("React.forwardRef<HTMLElement");
    expect(mutatedReactRootFile?.contents).toContain("<section");

    const targetAdapterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/types.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/notification-system.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/notification-system.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));

    for (const adapterSource of targetAdapterSources) {
      expect(adapterSource).not.toContain("ToastViewport");
      expect(adapterSource).not.toContain("ToastTemplate");
      expect(adapterSource).not.toContain("createToastManager");
      expect(adapterSource).not.toContain("data-sw-toast");
      expect(adapterSource).not.toMatch(/\btoast\.(?!js")/);
    }
  }, 20_000);

  it("routes Dropzone Astro production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildDropzoneAdapterOutputModel",
      buildSpec: "buildDropzoneSpecializedAdapterSpec",
      component: "dropzone",
    });
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-dropzone-astro-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateAstroPrimitiveDropzone(outputRoot, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Dropzone Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-dropzone-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroDropzoneSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Dropzone React production generation through the specialized adapter spec writer", async () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildDropzoneAdapterOutputModel",
      buildSpec: "buildDropzoneSpecializedAdapterSpec",
      component: "dropzone",
    });
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-dropzone-react-production-spec-writer");

    rmSync(outputRoot, { force: true, recursive: true });
    await generateReactPrimitiveDropzone(outputRoot, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Dropzone React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildDropzoneSpecializedAdapterSpec(dropzoneRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-dropzone-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactDropzoneSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("routes Tooltip Astro production generation through the specialized adapter spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildTooltipAdapterOutputModel",
      buildSpec: "buildTooltipSpecializedAdapterSpec",
      component: "tooltip",
    });
  });

  it("builds and prints Tooltip Astro through the Adapter Output Model", async () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);
    const outputModel = buildTooltipAdapterOutputModel(spec);
    const printedFiles = printAstroTooltipAdapterOutputModel(spec);

    expect(printedFiles.map((file) => file.path)).toEqual(
      outputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );

    const root = getPrintedFile(printedFiles, "tooltip/TooltipRoot.astro");
    const trigger = getPrintedFile(printedFiles, "tooltip/TooltipTrigger.astro");
    const positioner = getPrintedFile(printedFiles, "tooltip/TooltipPositioner.astro");
    const popup = getPrintedFile(printedFiles, "tooltip/TooltipPopup.astro");
    const arrow = getPrintedFile(printedFiles, "tooltip/TooltipArrow.astro");
    const index = getPrintedFile(printedFiles, "tooltip/index.ts");

    expect(root).toContain('import { createTooltip } from "@starwind-ui/runtime/tooltip";');
    expect(root).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(root).toContain('data-disabled={disabled ? "" : undefined}');
    expect(root).toContain('data-state={!disabled && defaultOpen ? "open" : "closed"}');
    expect(root).toContain('document.addEventListener("astro:after-swap", setupTooltips);');
    expect(root).toContain('document.addEventListener("starwind:init", setupTooltips);');
    expect(trigger).toContain("data-sw-tooltip-trigger");
    expect(trigger).toContain("data-as-child");
    expect(trigger).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(trigger).toContain("disabled={disabled ? true : undefined}");
    expect(positioner).toContain("data-sw-tooltip-positioner");
    expect(positioner).toContain("data-side-offset={sideOffset}");
    expect(popup).toContain("data-sw-tooltip-popup");
    expect(popup).toContain('role="tooltip"');
    expect(popup).toContain("hidden");
    expect(arrow).toContain("data-sw-tooltip-arrow");
    expect(index).toContain("TooltipTrigger");
    expect(index).toContain(
      'export type { TooltipOpenChangeDetails } from "@starwind-ui/runtime";',
    );

    const outputRoot = join("C:/tmp", "starwind-tooltip-astro-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroTooltipSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Tooltip Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-tooltip-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroTooltipSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Tooltip React production generation through the specialized adapter spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildTooltipAdapterOutputModel",
      buildSpec: "buildTooltipSpecializedAdapterSpec",
      component: "tooltip",
    });
  });

  it("builds and prints Tooltip React through the Adapter Output Model", async () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);
    const outputModel = buildTooltipAdapterOutputModel(spec);
    const printedFiles = printReactTooltipAdapterOutputModel(spec);

    expect(printedFiles.map((file) => file.path)).toEqual(
      outputModel.files.map((file) => (file.kind === "component" ? `${file.path}.tsx` : file.path)),
    );

    const root = getPrintedFile(printedFiles, "tooltip/TooltipRoot.tsx");
    const trigger = getPrintedFile(printedFiles, "tooltip/TooltipTrigger.tsx");
    const popup = getPrintedFile(printedFiles, "tooltip/TooltipPopup.tsx");
    const index = getPrintedFile(printedFiles, "tooltip/index.ts");

    expect(root).toContain(
      'import { createTooltip, type TooltipOpenChangeDetails } from "@starwind-ui/runtime/tooltip";',
    );
    expect(root).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(root).toContain("onOpenChangeRef.current?.(nextOpen, details);");
    expect(root).toContain("instance.setDisabled(disabled);");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain('data-default-open={defaultOpenRef.current ? "true" : undefined}');
    expect(root).toContain('data-disabled={disabled ? "" : undefined}');
    expect(root).toContain('data-state={renderedOpen ? "open" : "closed"}');
    expect(trigger).toContain("getAsChildElement(children)");
    expect(trigger).toContain("if (asChild && asChildElement)");
    expect(trigger).toContain("mergeAsChildProps({ ...triggerProps, className }, childProps");
    expect(trigger).toContain("data-sw-tooltip-trigger");
    expect(trigger).toContain('"aria-disabled": disabled ? "true" : undefined');
    expect(trigger).toContain("disabled={disabled}");
    expect(popup).toContain('"tabIndex" | "tabindex"');
    expect(popup).toContain("data-sw-tooltip-popup");
    expect(popup).toContain('role="tooltip"');
    expect(popup).toContain("hidden");
    expect(index).toContain("TooltipTrigger");
    expect(index).toContain(
      'export type { TooltipOpenChangeDetails } from "@starwind-ui/runtime";',
    );

    const outputRoot = join("C:/tmp", "starwind-tooltip-react-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactTooltipSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Tooltip React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildTooltipSpecializedAdapterSpec(tooltipRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-tooltip-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactTooltipSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("routes Preview Card Astro production generation through the specialized adapter spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildPreviewCardAdapterOutputModel",
      buildSpec: "buildPreviewCardSpecializedAdapterSpec",
      component: "preview-card",
    });
  });

  it("builds and prints Preview Card Astro through the Adapter Output Model", async () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const outputModel = buildPreviewCardAdapterOutputModel(spec);
    const printedFiles = printAstroPreviewCardAdapterOutputModel(spec);

    expect(printedFiles.map((file) => file.path)).toEqual(
      outputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );

    const root = getPrintedFile(printedFiles, "preview-card/PreviewCardRoot.astro");
    const trigger = getPrintedFile(printedFiles, "preview-card/PreviewCardTrigger.astro");
    const popup = getPrintedFile(printedFiles, "preview-card/PreviewCardPopup.astro");
    const backdrop = getPrintedFile(printedFiles, "preview-card/PreviewCardBackdrop.astro");
    const viewport = getPrintedFile(printedFiles, "preview-card/PreviewCardViewport.astro");
    const arrow = getPrintedFile(printedFiles, "preview-card/PreviewCardArrow.astro");
    const index = getPrintedFile(printedFiles, "preview-card/index.ts");

    expect(root).toContain(
      'import { createPreviewCard } from "@starwind-ui/runtime/preview-card";',
    );
    expect(root).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(root).toContain('data-content-hoverable={!disableHoverableContent ? "true" : "false"}');
    expect(root).toContain('data-state={defaultOpen ? "open" : "closed"}');
    expect(root).toContain('document.addEventListener("astro:after-swap", setupPreviewCards);');
    expect(root).toContain('document.addEventListener("starwind:init", setupPreviewCards);');
    expect(trigger).toContain("data-sw-preview-card-trigger");
    expect(trigger).toContain("data-as-child");
    expect(trigger).toContain("data-close-delay={closeDelay}");
    expect(trigger).toContain("data-open-delay={openDelay}");
    expect(trigger).toContain("href={disabled ? undefined : href}");
    expect(trigger).toContain("tabindex={disabled ? -1 : tabindex}");
    expect(popup).toContain("data-sw-preview-card-popup");
    expect(popup).toContain('role="tooltip"');
    expect(popup).toContain("hidden");
    expect(backdrop).toContain("data-sw-preview-card-backdrop");
    expect(backdrop).toContain('data-state="closed"');
    expect(backdrop).toContain("hidden");
    expect(viewport).toContain("data-sw-preview-card-viewport");
    expect(arrow).toContain("data-sw-preview-card-arrow");
    expect(index).toContain("PreviewCardBackdrop");
    expect(index).toContain("PreviewCardViewport");
    expect(index).toContain(
      'export type { PreviewCardOpenChangeDetails } from "@starwind-ui/runtime";',
    );

    const outputRoot = join("C:/tmp", "starwind-preview-card-astro-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroPreviewCardSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("writes Preview Card Astro output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-preview-card-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroPreviewCardSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Preview Card React production generation through the specialized adapter spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildPreviewCardAdapterOutputModel",
      buildSpec: "buildPreviewCardSpecializedAdapterSpec",
      component: "preview-card",
    });
  });

  it("builds and prints Preview Card React through the Adapter Output Model", async () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const outputModel = buildPreviewCardAdapterOutputModel(spec);
    const printedFiles = printReactPreviewCardAdapterOutputModel(spec);

    expect(printedFiles.map((file) => file.path)).toEqual(
      outputModel.files.map((file) => (file.kind === "component" ? `${file.path}.tsx` : file.path)),
    );

    const root = getPrintedFile(printedFiles, "preview-card/PreviewCardRoot.tsx");
    const trigger = getPrintedFile(printedFiles, "preview-card/PreviewCardTrigger.tsx");
    const backdrop = getPrintedFile(printedFiles, "preview-card/PreviewCardBackdrop.tsx");
    const viewport = getPrintedFile(printedFiles, "preview-card/PreviewCardViewport.tsx");
    const index = getPrintedFile(printedFiles, "preview-card/index.ts");

    expect(root).toContain("createPreviewCard");
    expect(root).toContain("type PreviewCardOpenChangeDetails");
    expect(root).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(root).toContain("onOpenChangeRef.current?.(nextOpen, details);");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain('data-default-open={defaultOpenRef.current ? "true" : undefined}');
    expect(root).toContain('data-state={renderedOpen ? "open" : "closed"}');
    expect(trigger).toContain("const handleClick = React.useCallback");
    expect(trigger).toContain('"data-sw-preview-card-trigger": ""');
    expect(trigger).toContain('"data-close-delay": closeDelay');
    expect(trigger).toContain('"data-open-delay": openDelay');
    expect(trigger).toContain("React.cloneElement(child");
    expect(trigger).toContain("href: disabled ? undefined : href");
    expect(trigger).toContain("tabIndex: disabled ? -1 : tabIndex");
    expect(backdrop).toContain("data-sw-preview-card-backdrop");
    expect(backdrop).toContain('data-state="closed"');
    expect(backdrop).toContain("hidden");
    expect(viewport).toContain("data-sw-preview-card-viewport");
    expect(index).toContain("PreviewCardBackdrop");
    expect(index).toContain("PreviewCardViewport");
    expect(index).toContain(
      'export type { PreviewCardOpenChangeDetails } from "@starwind-ui/runtime";',
    );

    const outputRoot = join("C:/tmp", "starwind-preview-card-react-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactPreviewCardSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("writes Preview Card React output from the specialized adapter spec without changing package bodies", async () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-preview-card-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactPreviewCardSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("rejects Preview Card output-model drift when popup floating attributes stop matching positioner attributes", () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const floatingDriftSpec = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        staticAttributes: spec.renderPlan.staticAttributes.map((attribute) =>
          attribute.part === spec.previewCard.floating.popupPart && attribute.name === "data-side"
            ? { ...attribute, source: "constant" as const, value: "bottom" }
            : attribute,
        ),
      },
    } as PreviewCardSpecializedAdapterSpec;

    expect(() => buildPreviewCardAdapterOutputModel(floatingDriftSpec)).toThrow(
      "Preview Card specialized adapter spec output model requires data-side floating attribute metadata to match on positioner and popup.",
    );
  });

  it("keeps Preview Card React asChild disabled projection tied to the trigger disabled recipe", () => {
    const spec = buildPreviewCardSpecializedAdapterSpec(previewCardRuntimeAdapterContract);
    const trigger = printReactPreviewCardAdapterOutputModel(spec).find((file) =>
      file.path.endsWith("PreviewCardTrigger.tsx"),
    );

    expect(trigger?.contents).toContain("event.preventDefault();");
    expect(trigger?.contents).toContain("event.stopPropagation();");
    expect(trigger?.contents).toContain('"data-disabled": disabled ? "" : undefined');
    expect(trigger?.contents).toContain('"aria-disabled": disabled ? "true" : undefined');
    expect(trigger?.contents).toContain("href: disabled ? undefined : href");
    expect(trigger?.contents).toContain("tabIndex: disabled ? -1 : tabIndex");
  });

  it("reports Combobox source-fact drift without throwing", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const withoutInputValueState = {
      ...spec,
      stateModels: spec.stateModels.filter((state) => state.name !== "inputValue"),
    } as ComboboxSpecializedAdapterSpec;
    const withoutInputValueEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "inputValueChange"),
    } as ComboboxSpecializedAdapterSpec;
    const withoutAriaControls = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        staticAttributes: spec.renderPlan.staticAttributes.filter(
          (attribute) => !(attribute.part === "input" && attribute.name === "aria-controls"),
        ),
      },
    } as ComboboxSpecializedAdapterSpec;

    expect(() => validateComboboxSpecializedAdapterSpec(withoutInputValueState)).not.toThrow();
    expect(() => validateComboboxSpecializedAdapterSpec(withoutInputValueEvent)).not.toThrow();
    expect(() => validateComboboxSpecializedAdapterSpec(withoutAriaControls)).not.toThrow();
    expect(validateComboboxSpecializedAdapterSpec(withoutInputValueState)).toEqual(
      expect.arrayContaining([
        "Combobox specialized adapter spec requires inputValue state metadata.",
      ]),
    );
    expect(validateComboboxSpecializedAdapterSpec(withoutInputValueEvent)).toEqual(
      expect.arrayContaining([
        "Combobox specialized adapter spec requires inputValueChange event metadata.",
      ]),
    );
    expect(validateComboboxSpecializedAdapterSpec(withoutAriaControls)).toEqual(
      expect.arrayContaining([
        "Combobox specialized adapter spec requires aria-controls metadata for input.",
      ]),
    );
  });

  it("routes Combobox Astro production generation through the Adapter Output Model", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildComboboxAdapterOutputModel",
      buildSpec: "buildComboboxSpecializedAdapterSpec",
      component: "combobox",
    });
  });

  it("writes Combobox Astro output from the Adapter Output Model without changing package bodies", async () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-combobox-astro-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroComboboxSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of printAstroComboboxAdapterOutputModel(spec)) {
      const filePath = file.path;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("routes Combobox React production generation through the Adapter Output Model", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildComboboxAdapterOutputModel",
      buildSpec: "buildComboboxSpecializedAdapterSpec",
      component: "combobox",
    });
  });

  it("keeps Combobox context helper target-scoped to the React projection", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const sharedOutputModel = buildComboboxAdapterOutputModel(spec);
    const astroOutputModel = projectAstroSpecializedOutputModel(sharedOutputModel);
    const reactOutputModel = projectReactSpecializedOutputModel(sharedOutputModel);
    const sharedPaths = sharedOutputModel.files.map((file) => file.path);
    const astroPaths = astroOutputModel.files.map((file) => file.path);
    const reactPaths = reactOutputModel.files.map((file) => file.path);

    expect(sharedOutputModel.files).toHaveLength(20);
    expect(
      sharedOutputModel.files.every((file) => file.kind === "component" || file.kind === "index"),
    ).toBe(true);
    expect(sharedPaths).not.toContain("combobox/ComboboxContext.tsx");
    expect(astroPaths).not.toContain("combobox/ComboboxContext.tsx");
    expect(reactPaths).toContain("combobox/ComboboxContext.tsx");
    expect(
      reactOutputModel.files.find((file) => file.path === "combobox/ComboboxContext.tsx"),
    ).toMatchObject({
      family: { kind: "editable-collection-overlay" },
      kind: "helper",
      name: "ComboboxContext",
    });
  });

  it("writes Combobox React output from the Adapter Output Model without changing package bodies", async () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-combobox-react-output-model");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactComboboxSpecializedAdapterSpec(outputRoot, spec, "");

    for (const file of printReactComboboxAdapterOutputModel(spec)) {
      const filePath = file.path;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("builds and prints Combobox through the Adapter Output Model", async () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const astroOutputModel = projectAstroSpecializedOutputModel(
      buildComboboxAdapterOutputModel(spec),
    );
    const reactOutputModel = projectReactSpecializedOutputModel(
      buildComboboxAdapterOutputModel(spec),
    );
    const astroFiles = printAstroComboboxAdapterOutputModel(spec);
    const reactFiles = printReactComboboxAdapterOutputModel(spec);

    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(astroOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(19);
    expect(reactOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(19);
    expect(astroOutputModel.files.at(-1)?.kind).toBe("index");
    expect(reactOutputModel.files.at(-1)?.kind).toBe("index");
    expect(astroFiles.map((file) => file.path)).toEqual(
      astroOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );
    expect(reactFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.tsx` : file.path,
      ),
    );
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "editable-collection-overlay", part: "root" }),
        expect.objectContaining({ kind: "editable-collection-overlay", part: "input" }),
        expect.objectContaining({ kind: "editable-collection-overlay", part: "item" }),
      ]),
    );

    const astroRoot = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxRoot.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxRoot.astro"),
    );
    const astroInput = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxInput.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxInput.astro"),
    );
    const astroTrigger = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxTrigger.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxTrigger.astro"),
    );
    const astroClear = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxClear.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxClear.astro"),
    );
    const astroItem = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxItem.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxItem.astro"),
    );
    const astroItemIndicator = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxItemIndicator.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxItemIndicator.astro"),
    );
    const astroPositioner = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxPositioner.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxPositioner.astro"),
    );
    const astroPopup = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/ComboboxPopup.astro"),
      join(process.cwd(), "packages/astro/src/combobox/ComboboxPopup.astro"),
    );
    const astroIndex = await formatGeneratedOutput(
      getPrintedFile(astroFiles, "combobox/index.ts"),
      join(process.cwd(), "packages/astro/src/combobox/index.ts"),
    );
    const reactRoot = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxRoot.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxRoot.tsx"),
    );
    const reactInput = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxInput.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxInput.tsx"),
    );
    const reactTrigger = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxTrigger.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxTrigger.tsx"),
    );
    const reactClear = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxClear.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxClear.tsx"),
    );
    const reactItem = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxItem.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxItem.tsx"),
    );
    const reactItemIndicator = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxItemIndicator.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxItemIndicator.tsx"),
    );
    const reactPositioner = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxPositioner.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxPositioner.tsx"),
    );
    const reactPopup = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/ComboboxPopup.tsx"),
      join(process.cwd(), "packages/react/src/combobox/ComboboxPopup.tsx"),
    );
    const reactIndex = await formatGeneratedOutput(
      getPrintedFile(reactFiles, "combobox/index.ts"),
      join(process.cwd(), "packages/react/src/combobox/index.ts"),
    );

    expect(astroRoot).toContain('import { createCombobox } from "@starwind-ui/runtime/combobox";');
    expect(astroRoot).toContain("data-sw-combobox");
    expect(astroRoot).toContain("data-default-input-value={defaultInputValue}");
    expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(astroRoot).toContain("data-default-value={defaultValue ?? undefined}");
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain("data-filter-mode={filterMode}");
    expect(astroRoot).toContain("data-form={form}");
    expect(astroRoot).toContain(
      'data-highlight-item-on-hover={highlightItemOnHover ? "true" : "false"}',
    );
    expect(astroRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(astroRoot).toContain("data-name={name}");
    expect(astroRoot).toContain('data-readonly={readOnly ? "" : undefined}');
    expect(astroRoot).toContain('data-required={required ? "" : undefined}');
    expect(astroRoot).toContain('data-state={defaultOpen ? "open" : "closed"}');
    expect(astroRoot).toContain("data-sw-combobox-hidden-input");
    expect(astroRoot).toContain('type="hidden"');
    expect(astroRoot).toContain('value={defaultValue ?? ""}');
    expect(astroRoot).toContain('aria-hidden="true"');
    expect(astroRoot).toContain('tabindex="-1"');
    expect(astroRoot).toContain("createCombobox(root)");
    expect(astroRoot).toContain("registerAstroControllerLifecycle");
    expect(astroInput).toContain("data-sw-combobox-input");
    expect(astroInput).toContain('role="combobox"');
    expect(astroInput).toContain('aria-autocomplete="list"');
    expect(astroInput).toContain('aria-expanded="false"');
    expect(astroInput).toContain('autocomplete="off"');
    expect(astroTrigger).toContain("data-sw-combobox-trigger");
    expect(astroTrigger).toContain("data-as-child");
    expect(astroTrigger).toContain('aria-haspopup="listbox"');
    expect(astroTrigger).toContain('data-state="closed"');
    expect(astroClear).toContain("data-sw-combobox-clear");
    expect(astroClear).toContain("data-as-child");
    expect(astroClear).toContain('type="button"');
    expect(astroItem).toContain("data-sw-combobox-item");
    expect(astroItem).toContain("data-value={value}");
    expect(astroItem).toContain('role="option"');
    expect(astroItem).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(astroItemIndicator).toContain("data-sw-combobox-item-indicator");
    expect(astroItemIndicator).toContain('data-state="unchecked"');
    expect(astroItemIndicator).toContain("data-hidden");
    expect(astroItemIndicator).toContain("hidden");
    expect(astroPositioner).toContain("data-sw-combobox-positioner");
    expect(astroPositioner).toContain("data-side={side}");
    expect(astroPositioner).toContain("data-avoid-collisions={avoidCollisions");
    expect(astroPopup).toContain("data-sw-combobox-popup");
    expect(astroPopup).toContain('role="listbox"');
    expect(astroPopup).toContain('tabindex="-1"');
    expect(astroPopup).toContain("hidden");
    expect(astroIndex).toContain("ComboboxInputValueChangeDetails");
    expect(astroIndex).toContain("ComboboxOpenChangeDetails");
    expect(astroIndex).toContain("ComboboxValueChangeDetails");

    expect(reactRoot).toContain("type ComboboxInputValueChangeDetails");
    expect(reactRoot).toContain("type ComboboxOpenChangeDetails");
    expect(reactRoot).toContain("type ComboboxValueChangeDetails");
    expect(reactRoot).toContain("createCombobox,");
    expect(reactRoot).toContain("const inputValueRef = React.useRef(inputValue);");
    expect(reactRoot).toContain("const onInputValueChangeRef = React.useRef(onInputValueChange);");
    expect(reactRoot).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(reactRoot).toContain("const onValueChangeRef = React.useRef(onValueChange);");
    expect(reactRoot).toContain("createCombobox(root, {");
    expect(reactRoot).toContain("const selectedInitialValue =");
    expect(reactRoot).toContain("defaultInputValue: defaultRuntimeInputValue,");
    expect(reactRoot).toContain("? { defaultFilterValue: defaultRuntimeFilterValue }");
    expect(reactRoot).toContain("? { defaultValueText: selectedInitialInputValue }");
    expect(reactRoot).toContain("defaultOpen: uncontrolledOpenRef.current,");
    expect(reactRoot).toContain("defaultValue: uncontrolledValueRef.current,");
    expect(reactRoot).toContain("onInputValueChangeRef.current?.(nextInputValue, details);");
    expect(reactRoot).toContain("onOpenChangeRef.current?.(nextOpen, details);");
    expect(reactRoot).toContain("onValueChangeRef.current?.(nextValue, details);");
    expect(reactRoot).toContain("instanceRef.current?.setFormOptions");
    expect(reactRoot).toContain(
      "instance.setInputValue(inputValue, { emit: false, filter: false });",
    );
    expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
    expect(reactRoot).toContain("instance.setValue(value, { emit: false });");
    expect(reactRoot).toContain("data-sw-combobox");
    expect(reactRoot).toContain("data-input-value={renderedInputValue}");
    expect(reactRoot).toContain("data-sw-combobox-hidden-input");
    expect(reactRoot).toContain("value={renderedValue}");
    expect(reactRoot).toContain("readOnly");
    expect(reactInput).toContain("data-sw-combobox-input");
    expect(reactInput).toContain('role="combobox"');
    expect(reactInput).toContain('aria-autocomplete="list"');
    expect(reactInput).toContain('aria-expanded={combobox.open ? "true" : "false"}');
    expect(reactInput).toContain('autoComplete="off"');
    expect(reactTrigger).toContain('"data-sw-combobox-trigger": ""');
    expect(reactTrigger).toContain('"aria-haspopup": "listbox"');
    expect(reactTrigger).toContain('"data-state": combobox.open ? "open" : "closed"');
    expect(reactTrigger).toContain("React.cloneElement(child, {");
    expect(reactClear).toContain('"data-sw-combobox-clear": ""');
    expect(reactClear).toContain("React.cloneElement(child, {");
    expect(reactItem).toContain("data-sw-combobox-item");
    expect(reactItem).toContain("data-value={value}");
    expect(reactItem).toContain('role="option"');
    expect(reactItem).toContain("aria-selected={selected}");
    expect(reactItem).toContain("aria-disabled={disabled || undefined}");
    expect(reactItemIndicator).toContain("data-sw-combobox-item-indicator");
    expect(reactItemIndicator).toContain('data-state={selected ? "checked" : "unchecked"}');
    expect(reactItemIndicator).toContain('data-hidden={selected ? undefined : ""}');
    expect(reactItemIndicator).toContain("hidden");
    expect(reactPositioner).toContain("data-sw-combobox-positioner");
    expect(reactPositioner).toContain("data-side={side}");
    expect(reactPositioner).toContain("data-avoid-collisions={avoidCollisions");
    expect(reactPopup).toContain("data-sw-combobox-popup");
    expect(reactPopup).toContain('role="listbox"');
    expect(reactPopup).toContain("tabIndex={-1}");
    expect(reactPopup).toContain("keepMounted?: boolean;");
    expect(reactPopup).toContain("keepMounted = false");
    expect(reactPopup).toContain(
      'import { useClosePresence } from "../internal/use-close-presence";',
    );
    expect(reactPopup).toContain("const closePresence = useClosePresence<HTMLDivElement>({");
    expect(reactPopup).toContain("open: combobox.open,");
    expect(reactPopup).toContain("hidden={closePresence.hidden}");
    expect(reactPopup).toContain("{closePresence.present ? props.children : null}");
    expect(reactPopup).not.toContain("const shouldRenderChildren = keepMounted || combobox.open");
    expect(reactIndex).toContain("ComboboxInputValueChangeDetails");
    expect(reactIndex).toContain("ComboboxOpenChangeDetails");
    expect(reactIndex).toContain("ComboboxValueChangeDetails");

    for (const file of astroFiles) {
      const packagePath = join(process.cwd(), "packages/astro/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", file.path),
      );
    }

    for (const file of reactFiles) {
      const packagePath = join(process.cwd(), "packages/react/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", file.path),
      );
    }

    const sharedFrameworkAdapterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/types.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/adapter.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));
    const targetFamilyPrinterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/astro/editable-collection-overlay.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/editable-collection-overlay.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));
    const comboboxExportedPartNames = [
      "ComboboxRoot",
      "ComboboxLabel",
      "ComboboxInputGroup",
      "ComboboxInput",
      "ComboboxTrigger",
      "ComboboxIcon",
      "ComboboxClear",
      "ComboboxValue",
      "ComboboxPortal",
      "ComboboxPositioner",
      "ComboboxPopup",
      "ComboboxEmpty",
      "ComboboxList",
      "ComboboxGroup",
      "ComboboxGroupLabel",
      "ComboboxItem",
      "ComboboxItemText",
      "ComboboxItemIndicator",
      "ComboboxSeparator",
    ];

    for (const adapterSource of [...sharedFrameworkAdapterSources, ...targetFamilyPrinterSources]) {
      expect(adapterSource).not.toContain("createCombobox");
      expect(adapterSource).not.toContain("data-sw-combobox");
    }

    // Target-family printers may interpolate concrete export names from facts; shared dispatchers stay generic.
    for (const adapterSource of sharedFrameworkAdapterSources) {
      for (const partName of comboboxExportedPartNames) {
        expect(adapterSource).not.toContain(partName);
      }
      expect(adapterSource).not.toMatch(/\bconst combobox\s*=/);
      expect(adapterSource).not.toMatch(/\bcombobox\./);
    }
  });

  it("rejects Navigation Menu Astro writer specs when shared viewport facts drift", async () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const withoutSharedViewportKind = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        adapterKind: "floating-menu",
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;

    await expect(
      writeAstroNavigationMenuSpecializedAdapterSpec(
        "C:/tmp/starwind-navigation-menu-spec-drift",
        withoutSharedViewportKind,
        "",
        "",
      ),
    ).rejects.toThrow(
      'Navigation Menu specialized adapter spec adapterKind must be "shared-viewport-navigation".',
    );
  });

  it("routes Navigation Menu Astro production generation through the shared viewport spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildNavigationMenuAdapterOutputModel",
      buildSpec: "buildNavigationMenuSpecializedAdapterSpec",
      component: "navigation-menu",
    });
  });

  it("writes Navigation Menu Astro output from the shared viewport spec without changing package bodies", async () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-navigation-menu-astro-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeAstroNavigationMenuSpecializedAdapterSpec(outputRoot, spec, "---\n", "");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".astro"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/astro/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", filePath),
      );
    }
  }, 20_000);

  it("rejects Navigation Menu React writer specs when shared viewport facts drift", async () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const withoutSharedViewportKind = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        adapterKind: "floating-menu",
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;

    await expect(
      writeReactNavigationMenuSpecializedAdapterSpec(
        "C:/tmp/starwind-navigation-menu-react-spec-drift",
        withoutSharedViewportKind,
        "",
      ),
    ).rejects.toThrow(
      'Navigation Menu specialized adapter spec adapterKind must be "shared-viewport-navigation".',
    );
  });

  it("routes Navigation Menu React production generation through the shared viewport spec writer", () => {
    expectSpecializedPrimitiveRegistrySource({
      buildOutputModel: "buildNavigationMenuAdapterOutputModel",
      buildSpec: "buildNavigationMenuSpecializedAdapterSpec",
      component: "navigation-menu",
    });
  });

  it("writes Navigation Menu React output from the shared viewport spec without changing package bodies", async () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const outputRoot = join("C:/tmp", "starwind-navigation-menu-react-spec-writer");
    rmSync(outputRoot, { force: true, recursive: true });

    await writeReactNavigationMenuSpecializedAdapterSpec(outputRoot, spec, "");

    const generatedRoot = readFileSync(
      join(outputRoot, "navigation-menu/NavigationMenuRoot.tsx"),
      "utf8",
    );
    expect(generatedRoot).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(generatedRoot).toContain("useIsomorphicLayoutEffect(() => {");

    for (const file of spec.files) {
      const filePath = `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`;
      const generatedPath = join(outputRoot, filePath);
      const packagePath = join(process.cwd(), "packages/react/src", filePath);

      expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", filePath),
      );
    }
  }, 20_000);

  it("builds and prints Navigation Menu through the Adapter Output Model", async () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const astroOutputModel = projectAstroSpecializedOutputModel(
      buildNavigationMenuAdapterOutputModel(spec),
    );
    const reactOutputModel = projectReactSpecializedOutputModel(
      buildNavigationMenuAdapterOutputModel(spec),
    );
    const astroFiles = printAstroNavigationMenuAdapterOutputModel(spec);
    const reactFiles = printReactNavigationMenuAdapterOutputModel(spec);

    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(astroOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(12);
    expect(reactOutputModel.files.filter((file) => file.kind === "component")).toHaveLength(12);
    expect(astroOutputModel.files.at(-1)?.kind).toBe("index");
    expect(reactOutputModel.files.at(-1)?.kind).toBe("index");
    expect(astroFiles.map((file) => file.path)).toEqual(
      astroOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );
    expect(reactFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.tsx` : file.path,
      ),
    );
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "shared-viewport-navigation", part: "root" }),
        expect.objectContaining({ kind: "shared-viewport-navigation", part: "trigger" }),
        expect.objectContaining({ kind: "shared-viewport-navigation", part: "viewport" }),
      ]),
    );

    const astroRoot = getPrintedFile(astroFiles, "navigation-menu/NavigationMenuRoot.astro");
    const astroTrigger = getPrintedFile(astroFiles, "navigation-menu/NavigationMenuTrigger.astro");
    const astroLink = getPrintedFile(astroFiles, "navigation-menu/NavigationMenuLink.astro");
    const astroPositioner = getPrintedFile(
      astroFiles,
      "navigation-menu/NavigationMenuPositioner.astro",
    );
    const astroIndex = getPrintedFile(astroFiles, "navigation-menu/index.ts");
    const reactRoot = getPrintedFile(reactFiles, "navigation-menu/NavigationMenuRoot.tsx");
    const reactTrigger = getPrintedFile(reactFiles, "navigation-menu/NavigationMenuTrigger.tsx");
    const reactLink = getPrintedFile(reactFiles, "navigation-menu/NavigationMenuLink.tsx");
    const reactPositioner = getPrintedFile(
      reactFiles,
      "navigation-menu/NavigationMenuPositioner.tsx",
    );
    const reactPopup = getPrintedFile(reactFiles, "navigation-menu/NavigationMenuPopup.tsx");
    const reactIndex = getPrintedFile(reactFiles, "navigation-menu/index.ts");

    expect(astroRoot).toContain(
      'import { createNavigationMenu } from "@starwind-ui/runtime/navigation-menu";',
    );
    expect(astroRoot).toContain("data-sw-nav-menu");
    expect(astroRoot).toContain("data-value={value ?? undefined}");
    expect(astroRoot).toContain('data-controlled-value={value === null ? "" : undefined}');
    expect(astroRoot).toContain(
      "data-default-value={value === undefined ? (defaultValue ?? undefined) : undefined}",
    );
    expect(astroRoot).toContain("data-open-delay={openDelay}");
    expect(astroRoot).toContain("data-close-delay={closeDelay}");
    expect(astroRoot).toContain('data-close-on-escape={closeOnEscape ? "true" : "false"}');
    expect(astroRoot).toContain(
      'data-close-on-outside-interact={closeOnOutsideInteract ? "true" : "false"}',
    );
    expect(astroRoot).toContain("data-orientation={orientation}");
    expect(astroRoot).toContain('data-state={initialValue !== null ? "open" : "closed"}');
    expect(astroRoot).toContain("navigationMenuInstances.add(createNavigationMenu(root))");
    expect(astroRoot).toContain(
      'document.addEventListener("astro:after-swap", setupNavigationMenus);',
    );
    expect(astroRoot).toContain(
      'document.addEventListener("astro:before-swap", destroyNavigationMenus);',
    );
    expect(astroRoot).toContain(
      'document.addEventListener("starwind:init", setupNavigationMenus);',
    );
    expect(astroTrigger).toContain("data-sw-nav-menu-trigger");
    expect(astroTrigger).toContain("data-as-child");
    expect(astroTrigger).toContain("data-open-delay={openDelay}");
    expect(astroTrigger).toContain("data-close-delay={closeDelay}");
    expect(astroTrigger).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroTrigger).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(astroTrigger).toContain('aria-expanded="false"');
    expect(astroTrigger).toContain('aria-haspopup="menu"');
    expect(astroTrigger).toContain("disabled={disabled}");
    expect(astroLink).toContain("data-sw-nav-menu-link");
    expect(astroLink).toContain('data-active={active ? "" : undefined}');
    expect(astroLink).toContain('aria-current={active ? "page" : undefined}');
    expect(astroLink).toContain('data-close-on-click={closeOnClick ? undefined : "false"}');
    expect(astroPositioner).toContain("data-sw-nav-menu-positioner");
    expect(astroPositioner).toContain("data-side={side}");
    expect(astroPositioner).toContain("data-align={align}");
    expect(astroPositioner).toContain("data-side-offset={sideOffset}");
    expect(astroPositioner).toContain("data-align-offset={alignOffset}");
    expect(astroPositioner).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(astroPositioner).toContain("data-collision-padding={collisionPadding}");
    expect(astroIndex).toContain("NavigationMenuViewport");
    expect(astroIndex).toContain("NavigationMenuArrow");
    expect(astroIndex).toContain("NavigationMenuValue");
    expect(astroIndex).toContain("NavigationMenuValueChangeDetails");

    expect(reactRoot).toContain(
      'import { createNavigationMenu, type NavigationMenuValueChangeDetails } from "@starwind-ui/runtime/navigation-menu";',
    );
    expect(reactRoot).toContain("const onValueChangeRef = React.useRef(onValueChange);");
    expect(reactRoot).toContain(
      "const pendingValueChangeDetailsRef = React.useRef<NavigationMenuValueChangeDetails | null>(",
    );
    expect(reactRoot).toContain("instanceRef.current?.setValue(");
    expect(reactRoot).toContain("reason: pendingDetails.reason,");
    expect(reactRoot).toContain("trigger: pendingDetails.trigger,");
    expect(reactRoot).toContain("createNavigationMenu(root, {");
    expect(reactRoot).toContain("defaultValue: defaultValueRef.current,");
    expect(reactRoot).toContain("onValueChangeRef.current?.(nextValue, details);");
    expect(reactRoot).toContain('instance.subscribe("valueChange"');
    expect(reactRoot).toContain("setUncontrolledValue(instance.getValue());");
    expect(reactRoot).toContain('data-sw-nav-menu=""');
    expect(reactRoot).toContain('data-state={initialValue !== null ? "open" : "closed"}');
    expect(reactRoot).toContain("instance.destroy();");
    expect(reactTrigger).toContain("React.cloneElement(child, {");
    expect(reactTrigger).toContain('"data-sw-nav-menu-trigger": ""');
    expect(reactTrigger).toContain('"aria-disabled": disabled ? "true" : undefined');
    expect(reactTrigger).toContain('"aria-expanded": "false"');
    expect(reactTrigger).toContain('"aria-haspopup": "menu"');
    expect(reactTrigger).toContain('"data-state": "closed"');
    expect(reactTrigger).toContain("disabled={disabled}");
    expect(reactLink).toContain('data-sw-nav-menu-link=""');
    expect(reactLink).toContain('data-active={active ? "" : undefined}');
    expect(reactLink).toContain('aria-current={active ? "page" : undefined}');
    expect(reactLink).toContain('data-close-on-click={closeOnClick ? undefined : "false"}');
    expect(reactPositioner).toContain('data-sw-nav-menu-positioner=""');
    expect(reactPositioner).toContain("data-side={side}");
    expect(reactPositioner).toContain("data-align={align}");
    expect(reactPositioner).toContain("data-side-offset={String(sideOffset)}");
    expect(reactPositioner).toContain("data-align-offset={String(alignOffset)}");
    expect(reactPositioner).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(reactPositioner).toContain("data-collision-padding={String(collisionPadding)}");
    expect(reactPopup).toContain('data-sw-nav-menu-popup=""');
    expect(reactPopup).toContain('data-state="closed"');
    expect(reactPopup).toContain("hidden");
    expect(reactIndex).toContain("NavigationMenuViewport");
    expect(reactIndex).toContain("NavigationMenuArrow");
    expect(reactIndex).toContain("NavigationMenuValue");
    expect(reactIndex).toContain("NavigationMenuValueChangeDetails");

    for (const file of astroFiles) {
      const packagePath = join(process.cwd(), "packages/astro/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", file.path),
      );
    }

    for (const file of reactFiles) {
      const packagePath = join(process.cwd(), "packages/react/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", file.path),
      );
    }

    const targetAdapterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/types.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/shared-viewport-navigation.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/shared-viewport-navigation.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));

    for (const adapterSource of targetAdapterSources) {
      expect(adapterSource).not.toContain("NavigationMenuRoot");
      expect(adapterSource).not.toContain("NavigationMenuTrigger");
      expect(adapterSource).not.toContain("createNavigationMenu");
      expect(adapterSource).not.toContain("data-sw-nav-menu");
      expect(adapterSource).not.toMatch(/\bconst navigationMenu\s*=/);
      expect(adapterSource).not.toMatch(/\bnavigationMenu\./);
    }
  });

  it("prints deterministic non-shipping Vue Select fixtures from the Select component spec", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const firstRun = printFutureSelectSpecializedAdapterSpecFixture("vue", spec);
    const secondRun = printFutureSelectSpecializedAdapterSpecFixture("vue", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/select/SelectRoot.vue",
      "__future-fixtures/vue/select/SelectTrigger.vue",
      "__future-fixtures/vue/select/SelectPortal.vue",
      "__future-fixtures/vue/select/SelectPopup.vue",
      "__future-fixtures/vue/select/SelectItem.vue",
      "__future-fixtures/vue/select/SelectItemIndicator.vue",
      "__future-fixtures/vue/select/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = firstRun.find((file) => file.path.endsWith("SelectRoot.vue"))?.contents;
    const trigger = firstRun.find((file) => file.path.endsWith("SelectTrigger.vue"))?.contents;
    const portal = firstRun.find((file) => file.path.endsWith("SelectPortal.vue"))?.contents;
    const popup = firstRun.find((file) => file.path.endsWith("SelectPopup.vue"))?.contents;
    const item = firstRun.find((file) => file.path.endsWith("SelectItem.vue"))?.contents;
    const indicator = firstRun.find((file) =>
      file.path.endsWith("SelectItemIndicator.vue"),
    )?.contents;

    expect(root).toContain('<script setup lang="ts">');
    expect(root).toContain(
      'import { createSelect, type SelectOpenChangeDetails, type SelectValueChangeDetails } from "@starwind-ui/runtime/select";',
    );
    expect(root).toContain(
      'import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";',
    );
    expect(root).toContain("const root = ref<HTMLDivElement | null>(null);");
    expect(root).toContain('provide("SelectContext"');
    expect(root).toContain("const initialized = ref(false);");
    expect(root).toContain("const portalReference = ref<HTMLElement | null>(null);");
    expect(root).toContain("initialized.value = true;");
    expect(root).toContain("createSelect(root.value, {");
    expect(root).toContain("portalReference: portalReference.value ?? undefined,");
    expect(root).toContain("watch(\n  () => props.open");
    expect(root).toContain("watch(\n  () => props.value");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain("instance.setValue(value, { emit: false });");
    expect(root).toContain("instance?.setFormOptions({");
    expect(root).toContain("instance?.setReadOnly(readOnly);");
    expect(root).toContain("data-sw-select-input");
    expect(root).toContain(':autocomplete="props.autoComplete"');
    expect(root).toContain(':form="props.form"');
    expect(root).toContain(':name="props.name"');
    expect(root).toContain(':required="props.required"');
    expect(root).toContain('ref="input"');
    expect(root).toContain("<slot />");

    expect(trigger).toContain('inject("SelectContext"');
    expect(trigger).toContain(":aria-expanded=\"select.open.value ? 'true' : 'false'\"");
    expect(trigger).toContain("<slot />");

    expect(portal).toContain(":to=\"props.container ?? 'body'\"");
    expect(portal).toContain(':disabled="props.disabled || !select.initialized.value"');
    expect(portal).toContain("select.portalReference.value = portal.value;");
    expect(portal).toContain("data-floating-root");
    expect(portal).not.toContain("data-sw-floating-root");
    expect(portal).toContain('ref="portal"');
    expect(portal).toContain("<slot />");

    expect(popup).toContain("\n    hidden\n");
    expect(popup).not.toContain(':hidden="');

    expect(item).toContain('provide("SelectItemContext"');
    expect(item).toContain(":aria-selected=\"selected ? 'true' : 'false'\"");
    expect(indicator).toContain('inject("SelectItemContext"');
    expect(indicator).toContain(":data-state=\"selected ? 'checked' : 'unchecked'\"");
  });

  it("prints deterministic non-shipping Solid Select fixtures from the Select component spec", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const firstRun = printFutureSelectSpecializedAdapterSpecFixture("solid", spec);
    const secondRun = printFutureSelectSpecializedAdapterSpecFixture("solid", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/solid/select/SelectRoot.tsx",
      "__future-fixtures/solid/select/SelectTrigger.tsx",
      "__future-fixtures/solid/select/SelectPortal.tsx",
      "__future-fixtures/solid/select/SelectPopup.tsx",
      "__future-fixtures/solid/select/SelectItem.tsx",
      "__future-fixtures/solid/select/SelectItemIndicator.tsx",
      "__future-fixtures/solid/select/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = firstRun.find((file) => file.path.endsWith("SelectRoot.tsx"))?.contents;
    const trigger = firstRun.find((file) => file.path.endsWith("SelectTrigger.tsx"))?.contents;
    const portal = firstRun.find((file) => file.path.endsWith("SelectPortal.tsx"))?.contents;
    const item = firstRun.find((file) => file.path.endsWith("SelectItem.tsx"))?.contents;
    const indicator = firstRun.find((file) =>
      file.path.endsWith("SelectItemIndicator.tsx"),
    )?.contents;

    expect(root).toContain(
      'import { createSelect, type SelectOpenChangeDetails, type SelectValueChangeDetails } from "@starwind-ui/runtime/select";',
    );
    expect(root).toContain(
      'import { createContext, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";',
    );
    expect(root).toContain("export const SelectContext = createContext");
    expect(root).toContain("open: () => boolean;");
    expect(root).toContain("value: () => string | null;");
    expect(root).toContain(
      "export const SelectContext = createContext<SelectContextValue>({ open: () => false, value: () => null });",
    );
    expect(root).toContain("let root!: HTMLDivElement;");
    expect(root).toContain("instance = createSelect(root, {");
    expect(root).toContain("createEffect(() => {");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain("instance.setValue(value, { emit: false });");
    expect(root).toContain("<SelectContext.Provider value={contextValue}");
    expect(root).toContain('data-state={contextValue.open() ? "open" : "closed"}');
    expect(root).toContain("{local.children}");

    expect(trigger).toContain("useSelectContext();");
    expect(trigger).toContain('aria-expanded={select.open() ? "true" : "false"}');

    expect(portal).toContain('import { Portal } from "solid-js/web";');
    expect(portal).toContain("<Portal>");

    expect(item).toContain("const selected = createMemo(() => select.value() === local.value);");
    expect(item).toContain("<SelectItemContext.Provider value={{ value: local.value }}>");
    expect(indicator).toContain("useSelectItemContext();");
    expect(indicator).toContain(
      "const selected = createMemo(() => select.value() === item.value);",
    );
    expect(indicator).toContain('data-state={selected() ? "checked" : "unchecked"}');
  });

  it("fails clearly when Select Vue or Solid fixture targets ask for unsupported adapter features", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const specWithoutTeleportPortal = {
      ...spec,
      select: {
        ...spec.select,
        floating: {
          ...spec.select.floating,
          portalPart: "floatingHost",
        },
      },
    } as unknown as SelectSpecializedAdapterSpec;

    expect(() =>
      printFutureSelectSpecializedAdapterSpecFixture("vue", specWithoutTeleportPortal),
    ).toThrow('Select Vue specialized adapter fixture only supports portalPart "portal".');
    expect(() =>
      printFutureSelectSpecializedAdapterSpecFixture("solid", specWithoutTeleportPortal),
    ).toThrow('Select Solid specialized adapter fixture only supports portalPart "portal".');
  });

  it("derives Select Vue and Solid fixture file wiring from the Select component spec", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const specWithRenamedRoot = {
      ...spec,
      files: spec.files.map((file) =>
        file.kind === "part" && file.part === "root"
          ? { ...file, exportName: "SelectControl" }
          : file,
      ),
    } as SelectSpecializedAdapterSpec;

    const vueFiles = printFutureSelectSpecializedAdapterSpecFixture("vue", specWithRenamedRoot);
    const solidFiles = printFutureSelectSpecializedAdapterSpecFixture("solid", specWithRenamedRoot);
    const vueIndex = vueFiles.find((file) => file.path.endsWith("index.ts"))?.contents;
    const solidIndex = solidFiles.find((file) => file.path.endsWith("index.ts"))?.contents;
    const solidTrigger = solidFiles.find((file) =>
      file.path.endsWith("SelectTrigger.tsx"),
    )?.contents;

    expect(vueFiles.map((file) => file.path)).toContain(
      "__future-fixtures/vue/select/SelectControl.vue",
    );
    expect(solidFiles.map((file) => file.path)).toContain(
      "__future-fixtures/solid/select/SelectControl.tsx",
    );
    expect(vueIndex).toContain('export { default as Root } from "./SelectControl.vue";');
    expect(solidIndex).toContain('export { default as Root } from "./SelectControl";');
    expect(solidIndex).toContain(
      'export { SelectContext, SelectItemContext, useSelectContext, useSelectItemContext } from "./SelectControl";',
    );
    expect(solidTrigger).toContain('import { useSelectContext } from "./SelectControl";');
  });

  it("fails clearly when Select Vue or Solid fixtures drift from supported runtime factory assumptions", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const specWithRenamedRuntimeFactory = {
      ...spec,
      root: {
        ...spec.root,
        runtimeFactory: "createRenamedSelect",
      },
    } as SelectSpecializedAdapterSpec;

    expect(() =>
      printFutureSelectSpecializedAdapterSpecFixture("vue", specWithRenamedRuntimeFactory),
    ).toThrow('Select Vue specialized adapter fixture expects root runtimeFactory "createSelect".');
    expect(() =>
      printFutureSelectSpecializedAdapterSpecFixture("solid", specWithRenamedRuntimeFactory),
    ).toThrow(
      'Select Solid specialized adapter fixture expects root runtimeFactory "createSelect".',
    );
  });

  it("builds a Menu specialized adapter spec shell with root overlay facts", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);

    expect(validateMenuSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("menu");
    expect(spec.category).toBe("composite-menu-overlay");
    expect(spec.root).toMatchObject({
      discoveryAttribute: "data-sw-menu",
      part: "root",
      runtimeFactory: "createMenu",
      runtimeImportSource: "@starwind-ui/runtime/menu",
    });
    expect(spec.menu.rootParts).toEqual({
      popup: "popup",
      portal: "portal",
      positioner: "positioner",
      root: "root",
      trigger: "trigger",
    });
    expect(spec.menu.openState).toEqual({
      controlledProp: "open",
      defaultProp: "defaultOpen",
      getter: "getOpen",
      name: "open",
      setter: "setOpen",
      valueType: "boolean",
    });
    expect(spec.menu.events).toEqual({
      closeComplete: {
        callbackProp: "onCloseComplete",
        detailsType: "MenuCloseCompleteDetails",
        domEvent: "starwind:close-complete",
        name: "closeComplete",
        valueProperty: "open",
      },
      openChange: {
        callbackProp: "onOpenChange",
        cancelable: true,
        detailsType: "MenuOpenChangeDetails",
        domEvent: "starwind:open-change",
        name: "openChange",
        valueProperty: "open",
      },
    });
    expect(spec.menu.floating).toEqual({
      anchorPart: "trigger",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });
    expect(spec.menu.asChildTrigger).toEqual({
      merges: ["aria", "className", "data", "ref"],
      part: "trigger",
    });
    expect(spec.menu.namespace).toMatchObject({
      defaultNamespace: true,
      memberParts: spec.exports.members.map((member) => member.part),
      namespace: "Menu",
    });
    expect(spec.menu.runtimeBoundary).toEqual([
      "roving focus",
      "typeahead",
      "highlighted item state",
      "submenu controllers",
      "hover close timers",
      "pointer and keyboard open reasons",
      "cancellable item activation",
      "checkbox and radio mutation",
      "portal movement",
      "floating placement",
      "dismissal",
      "animation-delayed hiding",
      "cleanup",
    ]);
  });

  it("builds and prints Menu through the Adapter Output Model", async () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const astroOutputModel = projectAstroSpecializedOutputModel(buildMenuAdapterOutputModel(spec));
    const reactOutputModel = projectReactSpecializedOutputModel(buildMenuAdapterOutputModel(spec));
    const astroFiles = printAstroMenuAdapterOutputModel(spec);
    const reactFiles = printReactMenuAdapterOutputModel(spec);

    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(astroOutputModel.files.at(-1)).toMatchObject({
      kind: "index",
      path: "menu/index.ts",
    });
    expect(reactOutputModel.files.at(-1)).toMatchObject({
      kind: "index",
      path: "menu/index.ts",
    });
    expect(astroFiles.map((file) => file.path)).toEqual(
      astroOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );
    expect(reactFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.tsx` : file.path,
      ),
    );
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "composite-menu-overlay", part: "root" }),
        expect.objectContaining({ kind: "composite-menu-overlay", part: "trigger" }),
        expect.objectContaining({ kind: "composite-menu-overlay", part: "checkboxItem" }),
        expect.objectContaining({ kind: "composite-menu-overlay", part: "radioGroup" }),
        expect.objectContaining({ kind: "composite-menu-overlay", part: "submenuTrigger" }),
      ]),
    );
    const rootFamily = astroOutputModel.files
      .filter((file) => file.kind === "component")
      .map((file) => file.component.family)
      .find((family) => family?.kind === "composite-menu-overlay" && family.part === "root");
    expect(rootFamily).toMatchObject({
      facts: {
        runtime: {
          rootExclusionAttributes: ["data-sw-context-menu"],
        },
      },
    });

    const astroRoot = getPrintedFile(astroFiles, "menu/MenuRoot.astro");
    const astroTrigger = getPrintedFile(astroFiles, "menu/MenuTrigger.astro");
    const astroItem = getPrintedFile(astroFiles, "menu/MenuItem.astro");
    const astroLinkItem = getPrintedFile(astroFiles, "menu/MenuLinkItem.astro");
    const astroCheckboxItem = getPrintedFile(astroFiles, "menu/MenuCheckboxItem.astro");
    const astroRadioGroup = getPrintedFile(astroFiles, "menu/MenuRadioGroup.astro");
    const astroRadioItem = getPrintedFile(astroFiles, "menu/MenuRadioItem.astro");
    const astroGroup = getPrintedFile(astroFiles, "menu/MenuGroup.astro");
    const astroLabel = getPrintedFile(astroFiles, "menu/MenuLabel.astro");
    const astroSeparator = getPrintedFile(astroFiles, "menu/MenuSeparator.astro");
    const astroShortcut = getPrintedFile(astroFiles, "menu/MenuShortcut.astro");
    const astroSubmenuRoot = getPrintedFile(astroFiles, "menu/MenuSubmenuRoot.astro");
    const astroSubmenuTrigger = getPrintedFile(astroFiles, "menu/MenuSubmenuTrigger.astro");
    const astroIndex = getPrintedFile(astroFiles, "menu/index.ts");
    const reactRoot = getPrintedFile(reactFiles, "menu/MenuRoot.tsx");
    const reactTrigger = getPrintedFile(reactFiles, "menu/MenuTrigger.tsx");
    const reactPopup = getPrintedFile(reactFiles, "menu/MenuPopup.tsx");
    const reactCheckboxItem = getPrintedFile(reactFiles, "menu/MenuCheckboxItem.tsx");
    const reactCheckboxIndicator = getPrintedFile(reactFiles, "menu/MenuCheckboxItemIndicator.tsx");
    const reactRadioContext = getPrintedFile(reactFiles, "menu/MenuRadioContext.tsx");
    const reactRadioGroup = getPrintedFile(reactFiles, "menu/MenuRadioGroup.tsx");
    const reactRadioItem = getPrintedFile(reactFiles, "menu/MenuRadioItem.tsx");
    const reactRadioIndicator = getPrintedFile(reactFiles, "menu/MenuRadioItemIndicator.tsx");
    const reactGroup = getPrintedFile(reactFiles, "menu/MenuGroup.tsx");
    const reactLabel = getPrintedFile(reactFiles, "menu/MenuLabel.tsx");
    const reactSeparator = getPrintedFile(reactFiles, "menu/MenuSeparator.tsx");
    const reactShortcut = getPrintedFile(reactFiles, "menu/MenuShortcut.tsx");
    const reactSubmenuRoot = getPrintedFile(reactFiles, "menu/MenuSubmenuRoot.tsx");
    const reactSubmenuTrigger = getPrintedFile(reactFiles, "menu/MenuSubmenuTrigger.tsx");
    const reactIndex = getPrintedFile(reactFiles, "menu/index.ts");

    expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(astroRoot).toContain('data-open-on-hover={openOnHover ? "true" : undefined}');
    expect(astroRoot).toContain("data-close-delay={closeDelay}");
    expect(astroRoot).toContain('if (root.hasAttribute("data-sw-context-menu")) return;');
    expect(astroRoot).toContain("menuInstances.add(createMenu(root));");
    expect(astroRoot).toContain('document.addEventListener("astro:after-swap", setupMenus);');
    expect(astroRoot).toContain('document.addEventListener("starwind:init", setupMenus);');
    expect(astroTrigger).toContain("data-sw-menu-trigger");
    expect(astroTrigger).toContain('aria-haspopup="menu"');
    expect(astroTrigger).toContain('aria-expanded="false"');
    expect(astroItem).toContain("data-sw-menu-item");
    expect(astroItem).toContain('role="menuitem"');
    expect(astroItem).toContain('data-close-on-click={closeOnClick ? undefined : "false"}');
    expect(astroLinkItem).toContain("data-sw-menu-link-item");
    expect(astroLinkItem).toContain('data-close-on-click={closeOnClick ? "true" : undefined}');
    expect(astroCheckboxItem).toContain("data-sw-menu-checkbox-item");
    expect(astroCheckboxItem).toContain('role="menuitemcheckbox"');
    expect(astroCheckboxItem).toContain("data-default-checked");
    expect(astroRadioGroup).toContain("data-sw-menu-radio-group");
    expect(astroRadioGroup).toContain('role="group"');
    expect(astroRadioItem).toContain("data-sw-menu-radio-item");
    expect(astroRadioItem).toContain('role="menuitemradio"');
    expect(astroRadioItem).toContain("data-value={value}");
    expect(astroGroup).toContain("data-sw-menu-group");
    expect(astroGroup).toContain('role="group"');
    expect(astroLabel).toContain("data-sw-menu-label");
    expect(astroSeparator).toContain("data-sw-menu-separator");
    expect(astroSeparator).toContain('role="separator"');
    expect(astroSeparator).toContain('aria-orientation="horizontal"');
    expect(astroShortcut).toContain("data-sw-menu-shortcut");
    expect(astroSubmenuRoot).toContain("data-sw-menu-submenu-root");
    expect(astroSubmenuRoot).toContain("data-close-delay={closeDelay}");
    expect(astroSubmenuTrigger).toContain("data-sw-menu-submenu-trigger");
    expect(astroSubmenuTrigger).toContain('aria-haspopup="menu"');
    expect(astroSubmenuTrigger).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(astroIndex).toContain("MenuSubmenuRoot");
    expect(astroIndex).toContain("MenuCheckedChangeDetails");

    expect(reactRoot).toContain(
      "createMenu(root, {\n      defaultOpen: uncontrolledOpenRef.current,",
    );
    expect(reactRoot).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(reactRoot).toContain("const onCloseCompleteRef = React.useRef(onCloseComplete);");
    expect(reactRoot).toContain("onOpenChangeRef.current?.(nextOpen, details);");
    expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
    expect(reactRoot).toContain("instance.destroy();");
    expect(reactRoot).toContain('data-default-open={defaultOpenRef.current ? "true" : undefined}');
    expect(reactRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(reactRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(reactRoot).toContain('data-open-on-hover={openOnHover ? "true" : undefined}');
    expect(reactRoot).toContain("data-close-delay={closeDelay}");
    expect(reactTrigger).toContain("React.cloneElement(child");
    expect(reactTrigger).toContain('"data-sw-menu-trigger": ""');
    expect(reactTrigger).toContain('"aria-haspopup": "menu"');
    expect(reactPopup).toContain("data-sw-menu-popup");
    expect(reactPopup).toContain('role="menu"');
    expect(reactPopup).toContain("data-side={side}");
    expect(reactPopup).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(reactCheckboxItem).toContain("onCheckedChangeRef.current?.(details.checked, details);");
    expect(reactCheckboxItem).toContain('item.addEventListener("starwind:checked-change"');
    expect(reactCheckboxItem).toContain("syncCheckboxItemState(item, controlledChecked);");
    expect(reactCheckboxIndicator).toContain("data-sw-menu-checkbox-item-indicator");
    expect(reactCheckboxIndicator).toContain('data-state="unchecked"');
    expect(reactRadioGroup).toContain("onValueChangeRef.current?.(details.value, details);");
    expect(reactRadioGroup).toContain('group.addEventListener("starwind:value-change"');
    expect(reactRadioGroup).toContain("syncRadioGroupState(group, controlledValue);");
    expect(reactRadioContext).toContain("export const MenuRadioGroupContext");
    expect(reactRadioContext).toContain("useMenuRadioGroupContext");
    expect(reactRadioContext).toContain("export const MenuRadioItemContext");
    expect(reactRadioGroup).toContain('from "./MenuRadioContext"');
    expect(reactRadioGroup).toContain("<MenuRadioGroupContext.Provider value={radioGroupContext}>");
    expect(reactRadioItem).toContain("value: string;");
    expect(reactRadioItem).toContain("data-value={value}");
    expect(reactRadioItem).toContain("const radioGroup = useMenuRadioGroupContext();");
    expect(reactRadioItem).toContain(
      "const renderedChecked = radioGroup?.value === undefined ? initialChecked : radioGroup.value === value;",
    );
    expect(reactRadioItem).toContain("<MenuRadioItemContext.Provider value={radioItemContext}>");
    expect(reactRadioItem).not.toContain("aria-checked={initialChecked}");
    expect(reactRadioIndicator).toContain("data-sw-menu-radio-item-indicator");
    expect(reactRadioIndicator).toContain("const radioItem = useMenuRadioItemContext();");
    expect(reactRadioIndicator).toContain('data-state={checked ? "checked" : "unchecked"}');
    expect(reactGroup).toContain("data-sw-menu-group");
    expect(reactGroup).toContain('role="group"');
    expect(reactLabel).toContain("data-sw-menu-label");
    expect(reactSeparator).toContain("data-sw-menu-separator");
    expect(reactSeparator).toContain('role="separator"');
    expect(reactShortcut).toContain("data-sw-menu-shortcut");
    expect(reactSubmenuRoot).toContain("data-sw-menu-submenu-root");
    expect(reactSubmenuRoot).toContain("data-close-delay={closeDelay}");
    expect(reactSubmenuTrigger).toContain("data-sw-menu-submenu-trigger");
    expect(reactSubmenuTrigger).toContain('aria-haspopup="menu"');
    expect(reactSubmenuTrigger).toContain("aria-disabled={disabled || undefined}");
    expect(reactIndex).toContain("MenuSubmenuRoot");
    expect(reactIndex).toContain("MenuCheckedChangeDetails");

    for (const file of astroFiles) {
      const packagePath = join(process.cwd(), "packages/astro/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", file.path),
      );
    }

    for (const file of reactFiles) {
      const packagePath = join(process.cwd(), "packages/react/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", file.path),
      );
    }

    const targetAdapterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/astro/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/composite-menu-overlay.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/composite-menu-overlay.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));

    for (const adapterSource of targetAdapterSources) {
      expect(adapterSource).not.toContain("MenuRoot");
      expect(adapterSource).not.toContain("MenuItem");
      expect(adapterSource).not.toContain("createMenu");
      expect(adapterSource).not.toContain("setupMenus");
      expect(adapterSource).not.toContain("data-sw-context-menu");
      expect(adapterSource).not.toMatch(/\bconst menu\s*=/);
      expect(adapterSource).not.toMatch(/\bmenu\./);
    }
  });

  it("rejects Menu component adapter shell drift with clear diagnostics", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const withoutPopup = {
      ...spec,
      parts: spec.parts.filter((part) => part.name !== "popup"),
    } as MenuSpecializedAdapterSpec;
    const withoutOpenSetter = {
      ...spec,
      setterSync: spec.setterSync.filter((setter) => setter.method !== "setOpen"),
    } as MenuSpecializedAdapterSpec;
    const withoutOpenChangeEvent = {
      ...spec,
      events: spec.events.filter((event) => event.name !== "openChange"),
    } as MenuSpecializedAdapterSpec;
    const withOpenChangeEventDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        events: {
          ...spec.menu.events,
          openChange: {
            ...spec.menu.events.openChange,
            cancelable: false,
            detailsType: "DriftedOpenChangeDetails",
            domEvent: "starwind:drifted-open-change",
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withCloseCompleteEventDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        events: {
          ...spec.menu.events,
          closeComplete: {
            ...spec.menu.events.closeComplete,
            domEvent: "starwind:drifted-close-complete",
          },
        },
      },
    } as MenuSpecializedAdapterSpec;
    const withoutFloating = {
      ...spec,
      menu: {
        ...spec.menu,
        floating: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withFloatingDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        floating: {
          ...spec.menu.floating,
          optionProps: ["side", "align", "avoidCollisions"],
          popupPart: "content",
        },
      },
    } as MenuSpecializedAdapterSpec;
    const withoutTriggerAsChild = {
      ...spec,
      menu: {
        ...spec.menu,
        asChildTrigger: {
          ...spec.menu.asChildTrigger,
          merges: ["aria"],
        },
      },
    } as MenuSpecializedAdapterSpec;
    const withRootPartDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        rootParts: {
          ...spec.menu.rootParts,
          popup: "content",
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withNamespaceDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        namespace: {
          defaultNamespace: false,
          memberParts: ["root"],
          namespace: "Menu",
        },
      },
    } as MenuSpecializedAdapterSpec;
    const withRuntimeBehavior = {
      ...spec,
      menu: {
        ...spec.menu,
        runtimeBehavior: ["typeahead"],
      },
    } as unknown as MenuSpecializedAdapterSpec;

    expect(validateMenuSpecializedAdapterSpec(withoutPopup)).toContain(
      "Menu specialized adapter spec requires popup part.",
    );
    expect(validateMenuSpecializedAdapterSpec(withoutOpenSetter)).toContain(
      "Menu specialized adapter spec requires setOpen setter sync.",
    );
    expect(validateMenuSpecializedAdapterSpec(withoutOpenChangeEvent)).toContain(
      "Menu specialized adapter spec requires openChange event.",
    );
    expect(validateMenuSpecializedAdapterSpec(withOpenChangeEventDrift)).toEqual(
      expect.arrayContaining([
        'Menu specialized adapter spec openChange detailsType "DriftedOpenChangeDetails" must match event detailsType "MenuOpenChangeDetails".',
        'Menu specialized adapter spec openChange domEvent "starwind:drifted-open-change" must match event domEvent "starwind:open-change".',
        "Menu specialized adapter spec openChange event must be cancelable.",
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withCloseCompleteEventDrift)).toContain(
      'Menu specialized adapter spec closeComplete domEvent "starwind:drifted-close-complete" must match event domEvent "starwind:close-complete".',
    );
    expect(validateMenuSpecializedAdapterSpec(withoutFloating)).toContain(
      "Menu specialized adapter spec requires floating metadata.",
    );
    expect(validateMenuSpecializedAdapterSpec(withFloatingDrift)).toEqual(
      expect.arrayContaining([
        'Menu specialized adapter spec floating popupPart "content" must be "popup".',
        "Menu specialized adapter spec floating optionProps must include side, align, sideOffset, avoidCollisions.",
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withoutTriggerAsChild)).toContain(
      "Menu specialized adapter spec trigger asChild merges must include aria, className, data, ref.",
    );
    expect(validateMenuSpecializedAdapterSpec(withRootPartDrift)).toContain(
      'Menu specialized adapter spec rootParts.popup "content" must be "popup".',
    );
    expect(validateMenuSpecializedAdapterSpec(withNamespaceDrift)).toEqual(
      expect.arrayContaining([
        "Menu specialized adapter spec namespace must keep defaultNamespace enabled.",
        "Menu specialized adapter spec namespace memberParts must match exported member parts.",
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withRuntimeBehavior)).toContain(
      "Menu specialized adapter spec must not declare menu.runtimeBehavior; keep Runtime-owned behavior in Runtime controllers.",
    );
  });

  it("describes static Menu item branches and derives namespace exports from spec data", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);

    expect(spec.menu.staticBranches).toEqual([
      {
        branchKind: "action-item",
        closeOnClick: {
          attribute: "data-close-on-click",
          defaultValue: "true",
          prop: "closeOnClick",
        },
        defaultElement: "div",
        disabled: {
          ariaAttribute: "aria-disabled",
          dataAttribute: "data-disabled",
          prop: "disabled",
        },
        part: "item",
        publicRef: true,
        role: "menuitem",
      },
      {
        branchKind: "link-item",
        closeOnClick: {
          attribute: "data-close-on-click",
          defaultValue: "false",
          prop: "closeOnClick",
        },
        defaultElement: "a",
        disabled: {
          ariaAttribute: "aria-disabled",
          dataAttribute: "data-disabled",
          prop: "disabled",
        },
        part: "linkItem",
        publicRef: true,
        role: "menuitem",
      },
      {
        branchKind: "group",
        defaultElement: "div",
        part: "group",
        publicRef: true,
        role: "group",
      },
      {
        branchKind: "label",
        defaultElement: "div",
        part: "label",
        publicRef: true,
      },
      {
        ariaAttributes: [{ name: "aria-orientation", value: "horizontal" }],
        branchKind: "separator",
        defaultElement: "div",
        part: "separator",
        publicRef: true,
        role: "separator",
      },
      {
        branchKind: "shortcut",
        defaultElement: "span",
        part: "shortcut",
        publicRef: true,
      },
    ]);
    expect(spec.menu.namespace.objectEntries.slice(0, 6)).toEqual([
      { exportName: "MenuRoot", part: "root", property: "Root" },
      { exportName: "MenuTrigger", part: "trigger", property: "Trigger" },
      { exportName: "MenuPortal", part: "portal", property: "Portal" },
      { exportName: "MenuPositioner", part: "positioner", property: "Positioner" },
      { exportName: "MenuPopup", part: "popup", property: "Popup" },
      { exportName: "MenuItem", part: "item", property: "Item" },
    ]);
    expect(spec.menu.namespace.namedExports.slice(0, 4)).toEqual([
      "Menu",
      "MenuRoot",
      "MenuTrigger",
      "MenuPortal",
    ]);

    expect(printMenuNamespaceExportBlock(spec)).toBe(`const Menu = {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Portal: MenuPortal,
  Positioner: MenuPositioner,
  Popup: MenuPopup,
  Item: MenuItem,
  LinkItem: MenuLinkItem,
  CheckboxItem: MenuCheckboxItem,
  CheckboxItemIndicator: MenuCheckboxItemIndicator,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  RadioItemIndicator: MenuRadioItemIndicator,
  Group: MenuGroup,
  Label: MenuLabel,
  Separator: MenuSeparator,
  Shortcut: MenuShortcut,
  SubmenuRoot: MenuSubmenuRoot,
  SubmenuTrigger: MenuSubmenuTrigger,
};

export {
  Menu,
  MenuRoot,
  MenuTrigger,
  MenuPortal,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuLinkItem,
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuShortcut,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
};

export default Menu;
`);
  });

  it("rejects static Menu branch and namespace export drift with clear diagnostics", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const withoutItemBranch = {
      ...spec,
      menu: {
        ...spec.menu,
        staticBranches: spec.menu.staticBranches.filter((branch) => branch.part !== "item"),
      },
    } as MenuSpecializedAdapterSpec;
    const withLinkItemDefaultDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        staticBranches: spec.menu.staticBranches.map((branch) =>
          branch.part === "linkItem"
            ? {
                ...branch,
                closeOnClick: {
                  ...branch.closeOnClick,
                  defaultValue: "true",
                },
              }
            : branch,
        ),
      },
    } as MenuSpecializedAdapterSpec;
    const withUnexpectedStatefulBranch = {
      ...spec,
      menu: {
        ...spec.menu,
        staticBranches: [
          ...spec.menu.staticBranches,
          {
            branchKind: "checkbox-item",
            defaultElement: "div",
            part: "checkboxItem",
            publicRef: true,
          },
        ],
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withSeparatorAriaDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        staticBranches: spec.menu.staticBranches.map((branch) =>
          branch.part === "separator"
            ? {
                ...branch,
                ariaAttributes: [{ name: "aria-orientation", value: "vertical" }],
              }
            : branch,
        ),
      },
    } as MenuSpecializedAdapterSpec;
    const withNamespaceOrderingDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        namespace: {
          ...spec.menu.namespace,
          objectEntries: [...spec.menu.namespace.objectEntries].reverse(),
          namedExports: [...spec.menu.namespace.namedExports].reverse(),
        },
      },
    } as MenuSpecializedAdapterSpec;

    expect(validateMenuSpecializedAdapterSpec(withoutItemBranch)).toContain(
      "Menu specialized adapter spec requires item static branch.",
    );
    expect(validateMenuSpecializedAdapterSpec(withLinkItemDefaultDrift)).toContain(
      'Menu specialized adapter spec linkItem closeOnClick defaultValue "true" must be "false".',
    );
    expect(validateMenuSpecializedAdapterSpec(withUnexpectedStatefulBranch)).toContain(
      "Menu specialized adapter spec staticBranches contains unexpected branch for checkboxItem.",
    );
    expect(validateMenuSpecializedAdapterSpec(withSeparatorAriaDrift)).toContain(
      "Menu specialized adapter spec separator ariaAttributes must match contract attributes.",
    );
    expect(validateMenuSpecializedAdapterSpec(withNamespaceOrderingDrift)).toEqual(
      expect.arrayContaining([
        "Menu specialized adapter spec namespace objectEntries must match exported member order.",
        "Menu specialized adapter spec namespace namedExports must match generated named export order.",
      ]),
    );
  });

  it("builds a Navigation Menu shared viewport spec shell from Navigation Menu contract facts", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);

    expect(validateNavigationMenuSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("navigation-menu");
    expect(spec.category).toBe("floating-value-control");
    expect(spec.navigationMenu.adapterKind).toBe("shared-viewport-navigation");
    expect(spec.root).toMatchObject({
      discoveryAttribute: "data-sw-nav-menu",
      part: "root",
      runtimeFactory: "createNavigationMenu",
      runtimeImportSource: "@starwind-ui/runtime/navigation-menu",
    });
    expect(spec.navigationMenu.rootParts).toEqual({
      arrow: "arrow",
      content: "content",
      item: "item",
      list: "list",
      popup: "popup",
      portal: "portal",
      positioner: "positioner",
      root: "root",
      trigger: "trigger",
      viewport: "viewport",
    });
    expect(spec.navigationMenu.valueState).toEqual({
      controlledProp: "value",
      defaultProp: "defaultValue",
      getter: "getValue",
      name: "value",
      setter: "setValue",
      valueType: "string | null",
    });
    expect(spec.navigationMenu.floating).toEqual({
      anchorPart: "trigger",
      optionProps: [
        "side",
        "align",
        "sideOffset",
        "alignOffset",
        "avoidCollisions",
        "collisionPadding",
      ],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });
    expect(spec.navigationMenu.runtimeBoundary).toEqual([
      "active content movement",
      "content placeholder management",
      "shared viewport measurement and sizing",
      "placement and arrow projection",
      "trigger/content/value coordination",
      "orientation-driven keyboard mapping",
      "focus movement and restoration",
      "hover open and close timers",
      "outside pointer and Escape dismissal",
      "portal movement",
      "Floating UI positioning and updates",
      "link activation close behavior",
      "nested root inertness",
      "animation-delayed hiding",
      "cleanup",
    ]);

    const firstFixtureRun = printNavigationMenuSharedViewportFixture(spec);
    const secondFixtureRun = printNavigationMenuSharedViewportFixture(spec);
    expect(secondFixtureRun).toEqual(firstFixtureRun);
    expect(firstFixtureRun).toEqual([
      {
        contents: expect.stringContaining("component: navigation-menu"),
        path: "__future-fixtures/shared-viewport-navigation/navigation-menu/NavigationMenuSharedViewport.fixture.ts",
      },
      {
        contents: expect.stringContaining("Non-shipping Navigation Menu shared viewport fixture"),
        path: "__future-fixtures/shared-viewport-navigation/navigation-menu/index.ts",
      },
    ]);
    expect(firstFixtureRun[0]?.contents).toContain("adapterKind: shared-viewport-navigation");
    expect(firstFixtureRun[0]?.contents).toContain(
      "rootParts: root, list, item, trigger, content, portal, positioner, popup, viewport, arrow",
    );
    expect(firstFixtureRun[0]?.contents).toContain(
      "runtimeBoundary: shared viewport measurement and sizing",
    );

    expect(() => buildNavigationMenuSpecializedAdapterSpec(menuRuntimeAdapterContract)).toThrow(
      "Menu cannot be rendered as the Navigation Menu shared viewport specialized adapter spec.",
    );

    for (const partName of [
      "root",
      "list",
      "item",
      "trigger",
      "content",
      "portal",
      "positioner",
      "popup",
      "viewport",
      "arrow",
    ]) {
      const withoutRequiredPart = {
        ...spec,
        parts: spec.parts.filter((part) => part.name !== partName),
      } as NavigationMenuSpecializedAdapterSpec;

      expect(validateNavigationMenuSpecializedAdapterSpec(withoutRequiredPart)).toContain(
        `Navigation Menu specialized adapter spec requires ${partName} part.`,
      );
    }

    const withValueStateDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        valueState: {
          ...spec.navigationMenu.valueState,
          setter: "syncValue",
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withMenuOnlyRecipes = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        checkboxItem: {},
        radioGroup: {},
        staticBranches: [],
        submenu: {},
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withRuntimeBehavior = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        floatingUpdates: ["autoUpdate"],
        focusManagement: ["roving"],
        timers: ["hover"],
        viewportMeasurement: ["resize"],
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;

    expect(validateNavigationMenuSpecializedAdapterSpec(withValueStateDrift)).toContain(
      'Navigation Menu specialized adapter spec valueState.setter "syncValue" must be "setValue".',
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withMenuOnlyRecipes)).toEqual(
      expect.arrayContaining([
        "Navigation Menu specialized adapter spec must not declare Menu-only checkboxItem recipes.",
        "Navigation Menu specialized adapter spec must not declare Menu-only radioGroup recipes.",
        "Navigation Menu specialized adapter spec must not declare Menu-only staticBranches recipes.",
        "Navigation Menu specialized adapter spec must not declare Menu-only submenu recipes.",
      ]),
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withRuntimeBehavior)).toEqual(
      expect.arrayContaining([
        "NavigationMenu specialized adapter spec must not declare navigationMenu.focusManagement; keep Runtime-owned behavior in Runtime controllers.",
        "NavigationMenu specialized adapter spec must not declare navigationMenu.viewportMeasurement; keep Runtime-owned behavior in Runtime controllers.",
        "NavigationMenu specialized adapter spec must not declare navigationMenu.timers; keep Runtime-owned behavior in Runtime controllers.",
        "NavigationMenu specialized adapter spec must not declare navigationMenu.floatingUpdates; keep Runtime-owned behavior in Runtime controllers.",
      ]),
    );
  });

  it("describes Navigation Menu anatomy, namespace, lifecycle, and nested-root policy", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);

    expect(spec.navigationMenu.anatomy.map((part) => [part.part, part.defaultElement])).toEqual([
      ["root", "nav"],
      ["list", "ul"],
      ["item", "li"],
      ["trigger", "button"],
      ["icon", "span"],
      ["content", "div"],
      ["link", "a"],
      ["portal", "div"],
      ["positioner", "div"],
      ["popup", "div"],
      ["viewport", "div"],
      ["arrow", "div"],
    ]);
    expect(
      Object.fromEntries(
        spec.navigationMenu.anatomy.map((part) => [
          part.part,
          {
            discoveryAttribute: part.discoveryAttribute,
            initialAttributes: part.initialAttributes,
            publicRef: part.publicRef,
          },
        ]),
      ),
    ).toEqual({
      arrow: {
        discoveryAttribute: "data-sw-nav-menu-arrow",
        initialAttributes: ["aria-hidden", "data-state"],
        publicRef: true,
      },
      content: {
        discoveryAttribute: "data-sw-nav-menu-content",
        initialAttributes: ["data-state", "hidden"],
        publicRef: true,
      },
      icon: {
        discoveryAttribute: "data-sw-nav-menu-icon",
        initialAttributes: ["aria-hidden", "data-state"],
        publicRef: true,
      },
      item: {
        discoveryAttribute: "data-sw-nav-menu-item",
        initialAttributes: ["data-value", "data-state"],
        publicRef: true,
      },
      link: {
        discoveryAttribute: "data-sw-nav-menu-link",
        initialAttributes: ["data-active", "aria-current", "data-close-on-click"],
        publicRef: true,
      },
      list: {
        discoveryAttribute: "data-sw-nav-menu-list",
        initialAttributes: [],
        publicRef: true,
      },
      popup: {
        discoveryAttribute: "data-sw-nav-menu-popup",
        initialAttributes: ["data-state", "data-side", "data-align", "hidden"],
        publicRef: true,
      },
      portal: {
        discoveryAttribute: "data-sw-nav-menu-portal",
        initialAttributes: [],
        publicRef: true,
      },
      positioner: {
        discoveryAttribute: "data-sw-nav-menu-positioner",
        initialAttributes: [
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-align-offset",
          "data-avoid-collisions",
          "data-collision-padding",
        ],
        publicRef: true,
      },
      root: {
        discoveryAttribute: "data-sw-nav-menu",
        initialAttributes: [
          "data-value",
          "data-controlled-value",
          "data-default-value",
          "data-open-delay",
          "data-close-delay",
          "data-close-on-escape",
          "data-close-on-outside-interact",
          "data-orientation",
          "data-state",
        ],
        publicRef: true,
      },
      trigger: {
        discoveryAttribute: "data-sw-nav-menu-trigger",
        initialAttributes: [
          "type",
          "data-as-child",
          "data-open-delay",
          "data-close-delay",
          "aria-haspopup",
          "aria-expanded",
          "data-disabled",
          "data-state",
        ],
        publicRef: true,
      },
      viewport: {
        discoveryAttribute: "data-sw-nav-menu-viewport",
        initialAttributes: ["data-state", "hidden"],
        publicRef: true,
      },
    });

    expect(spec.navigationMenu.namespace).toEqual({
      defaultExport: "NavigationMenu",
      defaultNamespace: true,
      memberParts: [
        "arrow",
        "content",
        "icon",
        "item",
        "link",
        "list",
        "popup",
        "portal",
        "positioner",
        "root",
        "trigger",
        "viewport",
      ],
      namedExports: [
        "NavigationMenu",
        "NavigationMenuArrow",
        "NavigationMenuContent",
        "NavigationMenuIcon",
        "NavigationMenuItem",
        "NavigationMenuLink",
        "NavigationMenuList",
        "NavigationMenuPopup",
        "NavigationMenuPortal",
        "NavigationMenuPositioner",
        "NavigationMenuRoot",
        "NavigationMenuTrigger",
        "NavigationMenuViewport",
      ],
      namespace: "NavigationMenu",
      objectEntries: [
        { exportName: "NavigationMenuArrow", part: "arrow", property: "Arrow" },
        { exportName: "NavigationMenuContent", part: "content", property: "Content" },
        { exportName: "NavigationMenuIcon", part: "icon", property: "Icon" },
        { exportName: "NavigationMenuItem", part: "item", property: "Item" },
        { exportName: "NavigationMenuLink", part: "link", property: "Link" },
        { exportName: "NavigationMenuList", part: "list", property: "List" },
        { exportName: "NavigationMenuPopup", part: "popup", property: "Popup" },
        { exportName: "NavigationMenuPortal", part: "portal", property: "Portal" },
        { exportName: "NavigationMenuPositioner", part: "positioner", property: "Positioner" },
        { exportName: "NavigationMenuRoot", part: "root", property: "Root" },
        { exportName: "NavigationMenuTrigger", part: "trigger", property: "Trigger" },
        { exportName: "NavigationMenuViewport", part: "viewport", property: "Viewport" },
      ],
    });
    expect(spec.navigationMenu.lifecycle).toEqual({
      cleanupEvent: "before-swap",
      destroyMethod: "destroy",
      factory: "createNavigationMenu",
      initEvents: ["initial-load", "after-swap", "starwind:init"],
      instanceStore: "Set<ReturnType<typeof createNavigationMenu>>",
      effectSync: {
        cleanup: "instance.destroy()",
        remountDependencies: ["openDelay", "closeDelay", "closeOnEscape", "closeOnOutsideInteract"],
        setterSync: "setValue(value, { emit: false })",
      },
    });
    expect(spec.navigationMenu.nestedRootPolicy).toEqual({
      boundaryPart: "content",
      contractOwnedFacts: [
        "nested roots inside Content are not auto-initialized",
        "parent controllers ignore descendant Navigation Menu parts",
      ],
      policy: "inert",
      runtimeBoundary: "nested root detection and inert controller policy",
    });

    for (const partName of ["icon", "link"]) {
      const withoutAnatomyPart = {
        ...spec,
        parts: spec.parts.filter((part) => part.name !== partName),
      } as NavigationMenuSpecializedAdapterSpec;

      expect(validateNavigationMenuSpecializedAdapterSpec(withoutAnatomyPart)).toContain(
        `Navigation Menu specialized adapter spec requires ${partName} anatomy part.`,
      );
    }

    const withNamespaceDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        namespace: {
          ...spec.navigationMenu.namespace,
          objectEntries: [...spec.navigationMenu.namespace.objectEntries].reverse(),
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withoutNamespaceExport = {
      ...spec,
      exports: {
        ...spec.exports,
        members: spec.exports.members.filter((member) => member.part !== "icon"),
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withNestedPolicyDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        nestedRootPolicy: {
          ...spec.navigationMenu.nestedRootPolicy,
          policy: "auto-initialize",
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;

    expect(validateNavigationMenuSpecializedAdapterSpec(withNamespaceDrift)).toContain(
      "Navigation Menu specialized adapter spec namespace objectEntries must match current package export order.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withoutNamespaceExport)).toContain(
      "Navigation Menu specialized adapter spec requires icon export metadata.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withNestedPolicyDrift)).toContain(
      "Navigation Menu specialized adapter spec nestedRootPolicy must keep nested roots inert.",
    );
  });

  it("describes Navigation Menu value-control event forwarding and controlled resync", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);

    expect(spec.navigationMenu.valueControl).toEqual({
      eventForwarding: {
        callbackProp: "onValueChange",
        callbackTiming: "before-state-commit",
        cancelable: true,
        detailsType: "NavigationMenuValueChangeDetails",
        domEvent: "starwind:value-change",
        emitsFrom: "root",
        name: "valueChange",
        valueProperty: "value",
        valueType: "string | null",
      },
      controlledResync: {
        detailsValueProperty: "value",
        preserveDetailFields: ["event", "reason", "trigger"],
        runtimeBoundary:
          "Runtime owns focus handoff; adapter preserves event/reason/trigger details.",
        setter: "setValue",
      },
      setterSync: {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      state: {
        controlledStateSync: "unsupported",
        controlledNullMarker: {
          attribute: "data-controlled-value",
          value: "",
        },
        controlledProp: "value",
        controlledValueAttribute: "data-value",
        defaultProp: "defaultValue",
        defaultValueAttribute: "data-default-value",
        getter: "getValue",
        name: "value",
        renderedStateAttribute: "data-state",
        setter: "setValue",
        valueType: "string | null",
      },
    });

    const withEventDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        valueControl: {
          ...spec.navigationMenu.valueControl,
          eventForwarding: {
            ...spec.navigationMenu.valueControl.eventForwarding,
            detailsType: "WrongDetails",
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withSetterDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        valueControl: {
          ...spec.navigationMenu.valueControl,
          setterSync: {
            ...spec.navigationMenu.valueControl.setterSync,
            options: { emit: true },
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withControlledResyncDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        valueControl: {
          ...spec.navigationMenu.valueControl,
          controlledResync: {
            ...spec.navigationMenu.valueControl.controlledResync,
            preserveDetailFields: ["event", "reason"],
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withAstroMarkerDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        valueControl: {
          ...spec.navigationMenu.valueControl,
          state: {
            ...spec.navigationMenu.valueControl.state,
            controlledNullMarker: {
              attribute: "data-value",
              value: "",
            },
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;

    expect(validateNavigationMenuSpecializedAdapterSpec(withEventDrift)).toContain(
      'Navigation Menu specialized adapter spec valueControl.eventForwarding.detailsType "WrongDetails" must match event detailsType "NavigationMenuValueChangeDetails".',
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withSetterDrift)).toContain(
      "Navigation Menu specialized adapter spec valueControl.setterSync must call setValue with emit suppressed.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withControlledResyncDrift)).toContain(
      "Navigation Menu specialized adapter spec controlled resync must preserve event, reason, and trigger details.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withAstroMarkerDrift)).toContain(
      "Navigation Menu specialized adapter spec static Astro controlled null marker must use data-controlled-value.",
    );
  });

  it("describes Navigation Menu trigger, item, content, link, list, and option recipes", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);

    expect(spec.navigationMenu.partRecipes).toEqual({
      content: {
        defaultElement: "div",
        hiddenAttribute: "hidden",
        initialState: "closed",
        part: "content",
        stateAttribute: "data-state",
      },
      item: {
        defaultElement: "li",
        fallbackValueExpectation: "adapter-renders-data-value-when-item-value-prop-is-provided",
        initialState: "closed",
        part: "item",
        stateAttribute: "data-state",
        value: {
          attribute: "data-value",
          prop: "value",
          required: false,
          type: "string",
        },
      },
      link: {
        active: {
          ariaCurrentAttribute: "aria-current",
          ariaCurrentValue: "page",
          attribute: "data-active",
          defaultValue: "false",
          prop: "active",
        },
        closeOnClick: {
          attribute: "data-close-on-click",
          defaultValue: "true",
          falseValue: "false",
          prop: "closeOnClick",
        },
        defaultElement: "a",
        part: "link",
      },
      list: {
        defaultElement: "ul",
        orientation: {
          attribute: "data-orientation",
          inheritedFrom: "root",
          prop: "orientation",
          values: ["horizontal", "vertical"],
        },
        part: "list",
      },
      options: {
        dismissal: {
          closeOnEscape: {
            attribute: "data-close-on-escape",
            defaultValue: "true",
            prop: "closeOnEscape",
          },
          closeOnOutsideInteract: {
            attribute: "data-close-on-outside-interact",
            defaultValue: "true",
            prop: "closeOnOutsideInteract",
          },
        },
        rootDelay: {
          closeDelay: {
            attribute: "data-close-delay",
            defaultValue: "50",
            prop: "closeDelay",
          },
          openDelay: {
            attribute: "data-open-delay",
            defaultValue: "50",
            prop: "openDelay",
          },
        },
        triggerDelay: {
          closeDelay: {
            attribute: "data-close-delay",
            defaultValue: "50",
            prop: "closeDelay",
          },
          openDelay: {
            attribute: "data-open-delay",
            defaultValue: "50",
            prop: "openDelay",
          },
        },
      },
      runtimeBoundary: [
        "orientation-driven keyboard mapping",
        "focus movement and restoration",
        "trigger/content/value coordination",
      ],
      trigger: {
        asChild: {
          attribute: "data-as-child",
          merges: ["aria", "className", "data", "ref", "style"],
          part: "trigger",
          prop: "asChild",
        },
        defaultElement: "button",
        disabled: {
          ariaAttribute: "aria-disabled",
          dataAttribute: "data-disabled",
          nativeAttribute: "disabled",
          prop: "disabled",
        },
        disclosure: {
          ariaExpanded: "aria-expanded",
          ariaHaspopup: {
            attribute: "aria-haspopup",
            value: "menu",
          },
          closedStateValue: "closed",
          stateAttribute: "data-state",
        },
        part: "trigger",
        publicRef: true,
        typeAttribute: {
          attribute: "type",
          value: "button",
        },
      },
    });

    const withAsChildDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        partRecipes: {
          ...spec.navigationMenu.partRecipes,
          trigger: {
            ...spec.navigationMenu.partRecipes.trigger,
            asChild: {
              ...spec.navigationMenu.partRecipes.trigger.asChild,
              merges: ["aria", "className", "data", "ref"],
            },
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withLinkDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        partRecipes: {
          ...spec.navigationMenu.partRecipes,
          link: {
            ...spec.navigationMenu.partRecipes.link,
            active: {
              ...spec.navigationMenu.partRecipes.link.active,
              ariaCurrentValue: "true",
            },
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withOptionsDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        partRecipes: {
          ...spec.navigationMenu.partRecipes,
          options: {
            ...spec.navigationMenu.partRecipes.options,
            rootDelay: {
              ...spec.navigationMenu.partRecipes.options.rootDelay,
              openDelay: {
                ...spec.navigationMenu.partRecipes.options.rootDelay.openDelay,
                defaultValue: "200",
              },
            },
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withKeyboardBehavior = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        partRecipes: {
          ...spec.navigationMenu.partRecipes,
          keyboardNavigation: ["ArrowRight"],
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withUnexpectedBehaviorRecipe = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        partRecipes: {
          ...spec.navigationMenu.partRecipes,
          focusMovement: ["restoreTrigger"],
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withoutTriggerDisabledProp = {
      ...spec,
      props: spec.props.filter(
        (prop) => !(prop.name === "disabled" && prop.targets?.includes("trigger")),
      ),
    } as unknown as NavigationMenuSpecializedAdapterSpec;

    expect(validateNavigationMenuSpecializedAdapterSpec(withAsChildDrift)).toContain(
      "Navigation Menu specialized adapter spec trigger asChild merges must include aria, className, data, ref, style.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withLinkDrift)).toContain(
      "Navigation Menu specialized adapter spec link active metadata must preserve aria-current page projection.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withOptionsDrift)).toContain(
      "Navigation Menu specialized adapter spec option recipes must match Runtime option attributes.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withKeyboardBehavior)).toContain(
      "NavigationMenu specialized adapter spec must not declare navigationMenu.partRecipes.keyboardNavigation; keep Runtime-owned behavior in Runtime controllers.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withUnexpectedBehaviorRecipe)).toContain(
      'Navigation Menu specialized adapter spec partRecipes must not declare unexpected field "focusMovement".',
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withoutTriggerDisabledProp)).toContain(
      "Navigation Menu specialized adapter spec requires disabled prop metadata for trigger.",
    );
  });

  it("describes Navigation Menu shared viewport projection recipes", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);

    expect(spec.navigationMenu.viewportProjection).toEqual({
      activationDirection: {
        attribute: "data-activation-direction",
        runtimeOwnership: "computed-from-active-item-order",
        targets: ["content", "positioner", "popup", "root", "viewport"],
        values: ["initial", "next", "previous", "current"],
      },
      activeContent: {
        fromPart: "content",
        placeholder: "navigation-menu-content-placeholder",
        runtimeOwnership: "moves-active-content-into-shared-viewport",
        toPart: "viewport",
      },
      cssVariables: {
        sizing: {
          runtimeMutated: true,
          targets: {
            content: ["--sw-nav-menu-viewport-width", "--sw-nav-menu-viewport-height"],
            popup: [
              "--sw-nav-menu-viewport-width",
              "--sw-nav-menu-viewport-height",
              "--sw-nav-menu-popup-width",
              "--sw-nav-menu-popup-height",
              "--popup-width",
              "--popup-height",
            ],
            positioner: [
              "--sw-nav-menu-viewport-width",
              "--sw-nav-menu-viewport-height",
              "--sw-nav-menu-positioner-width",
              "--sw-nav-menu-positioner-height",
              "--positioner-width",
              "--positioner-height",
            ],
            root: ["--sw-nav-menu-viewport-width", "--sw-nav-menu-viewport-height"],
            viewport: ["--sw-nav-menu-viewport-width", "--sw-nav-menu-viewport-height"],
          },
          variables: [
            "--sw-nav-menu-viewport-width",
            "--sw-nav-menu-viewport-height",
            "--sw-nav-menu-popup-width",
            "--sw-nav-menu-popup-height",
            "--sw-nav-menu-positioner-width",
            "--sw-nav-menu-positioner-height",
            "--popup-width",
            "--popup-height",
            "--positioner-width",
            "--positioner-height",
          ],
        },
        transformOrigin: {
          targets: ["arrow", "popup", "positioner", "viewport"],
          variable: "--transform-origin",
        },
      },
      floating: {
        adaptiveOrigin: true,
        fallbackFloatingPart: "popup",
        floatingPart: "positioner",
        optionProps: [
          "side",
          "align",
          "sideOffset",
          "alignOffset",
          "avoidCollisions",
          "collisionPadding",
        ],
        placementStateTargets: ["arrow", "popup", "viewport"],
        reference: "active-trigger",
      },
      floatingOptions: [
        {
          attribute: "data-side",
          defaultValue: '"bottom"',
          prop: "side",
          targets: ["positioner", "popup"],
        },
        {
          attribute: "data-align",
          defaultValue: '"start"',
          prop: "align",
          targets: ["positioner", "popup"],
        },
        {
          attribute: "data-side-offset",
          defaultValue: "4",
          prop: "sideOffset",
          targets: ["positioner"],
        },
        {
          attribute: "data-align-offset",
          defaultValue: "0",
          prop: "alignOffset",
          targets: ["positioner"],
        },
        {
          attribute: "data-avoid-collisions",
          defaultValue: "true",
          prop: "avoidCollisions",
          targets: ["positioner"],
        },
        {
          attribute: "data-collision-padding",
          defaultValue: "8",
          prop: "collisionPadding",
          targets: ["positioner"],
        },
      ],
      initialState: {
        closedParts: ["arrow", "content", "positioner", "popup", "viewport"],
        closedValue: "closed",
        hiddenAttribute: "hidden",
        hiddenParts: ["content", "popup", "viewport"],
        openValue: "open",
        stateAttribute: "data-state",
      },
      instantState: {
        attribute: "data-instant",
        positionOnlyTargets: ["positioner"],
        stateTargets: ["content", "positioner", "popup", "root", "viewport"],
        timing: "requestAnimationFrame-cleared",
      },
      placementAttributes: {
        align: "data-align",
        side: "data-side",
        stateTargets: ["arrow", "popup", "positioner", "viewport"],
      },
      projectionTargets: {
        arrow: "arrow",
        content: "content",
        popup: "popup",
        positioner: "positioner",
        viewport: "viewport",
      },
      runtimeBoundary: [
        "active content movement",
        "viewport measurement and size mutation",
        "floating placement and auto-update",
        "transient instant-state timing",
      ],
    });

    const withCssVariableDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        viewportProjection: {
          ...spec.navigationMenu.viewportProjection,
          cssVariables: {
            ...spec.navigationMenu.viewportProjection.cssVariables,
            sizing: {
              ...spec.navigationMenu.viewportProjection.cssVariables.sizing,
              targets: {
                ...spec.navigationMenu.viewportProjection.cssVariables.sizing.targets,
                popup: [
                  "--sw-nav-menu-viewport-width",
                  "--sw-nav-menu-viewport-height",
                  "--sw-nav-menu-popup-height",
                  "--popup-width",
                  "--popup-height",
                ],
              },
            },
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withPlacementTargetDrift = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        viewportProjection: {
          ...spec.navigationMenu.viewportProjection,
          floating: {
            ...spec.navigationMenu.viewportProjection.floating,
            placementStateTargets: ["popup", "viewport"],
          },
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withMeasurementBehavior = {
      ...spec,
      navigationMenu: {
        ...spec.navigationMenu,
        viewportProjection: {
          ...spec.navigationMenu.viewportProjection,
          measurement: "measure active content width and height",
        },
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;
    const withoutPresence = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        presence: undefined,
      },
    } as unknown as NavigationMenuSpecializedAdapterSpec;

    expect(validateNavigationMenuSpecializedAdapterSpec(withCssVariableDrift)).toContain(
      "Navigation Menu specialized adapter spec viewport projection CSS variables must match Runtime-mutated surface boundaries.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withPlacementTargetDrift)).toContain(
      "Navigation Menu specialized adapter spec viewport projection floating metadata must match Runtime floating boundary.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withMeasurementBehavior)).toContain(
      "NavigationMenu specialized adapter spec must not declare navigationMenu.viewportProjection.measurement; keep Runtime-owned behavior in Runtime controllers.",
    );
    expect(validateNavigationMenuSpecializedAdapterSpec(withoutPresence)).toContain(
      "Navigation Menu specialized adapter spec requires presence metadata.",
    );
  });

  it("describes Menu checkbox item event forwarding and indicator projection", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);

    expect(spec.menu.checkboxItem).toEqual({
      branchKind: "checkbox-item",
      checkedState: {
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        initialAttribute: "data-default-checked",
        name: "checked",
        valueType: "boolean",
      },
      closeOnClick: {
        attribute: "data-close-on-click",
        defaultValue: "false",
        prop: "closeOnClick",
      },
      defaultElement: "div",
      disabled: {
        ariaAttribute: "aria-disabled",
        dataAttribute: "data-disabled",
        prop: "disabled",
      },
      eventForwarding: {
        callbackProp: "onCheckedChange",
        callbackTiming: "before-state-commit",
        cancelable: true,
        controlledResync: "syncCheckboxItemState",
        detailsType: "MenuCheckedChangeDetails",
        domEvent: "starwind:checked-change",
        emitsFrom: "checkboxItem",
        name: "checkedChange",
        valueProperty: "checked",
        valueType: "boolean",
      },
      indicatorProjection: {
        ariaHidden: "true",
        checkedStateValue: "checked",
        hiddenAttribute: "data-hidden",
        indicatorPart: "checkboxItemIndicator",
        sourcePart: "checkboxItem",
        stateAttribute: "data-state",
        uncheckedStateValue: "unchecked",
        visibleAttribute: "data-visible",
      },
      part: "checkboxItem",
      publicRef: true,
      role: "menuitemcheckbox",
      stateAttributes: {
        ariaChecked: "aria-checked",
        checked: "data-checked",
        unchecked: "data-unchecked",
      },
    });
    expect(printMenuCheckboxItemRecipeBlock(spec)).toBe(`checkboxItem:
  part: checkboxItem
  event: starwind:checked-change -> onCheckedChange(checked, details)
  controlledResync: syncCheckboxItemState
  indicator: checkboxItemIndicator[data-state=checked|unchecked, data-visible, data-hidden]
`);
  });

  it("rejects Menu checkbox item event and indicator drift with clear diagnostics", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const withoutCheckboxRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        checkboxItem: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withEventDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        checkboxItem: {
          ...spec.menu.checkboxItem,
          eventForwarding: {
            ...spec.menu.checkboxItem.eventForwarding,
            callbackTiming: "after-state-commit",
            cancelable: false,
            domEvent: "starwind:drifted-checked-change",
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withIndicatorDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        checkboxItem: {
          ...spec.menu.checkboxItem,
          indicatorProjection: {
            ...spec.menu.checkboxItem.indicatorProjection,
            indicatorPart: "radioItemIndicator",
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withStateDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        checkboxItem: {
          ...spec.menu.checkboxItem,
          checkedState: {
            ...spec.menu.checkboxItem.checkedState,
            defaultProp: "defaultValue",
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;

    expect(validateMenuSpecializedAdapterSpec(withoutCheckboxRecipe)).toContain(
      "Menu specialized adapter spec requires checkboxItem recipe metadata.",
    );
    expect(validateMenuSpecializedAdapterSpec(withEventDrift)).toEqual(
      expect.arrayContaining([
        'Menu specialized adapter spec checkedChange callbackTiming "after-state-commit" must match event callbackTiming "before-state-commit".',
        'Menu specialized adapter spec checkedChange domEvent "starwind:drifted-checked-change" must match event domEvent "starwind:checked-change".',
        "Menu specialized adapter spec checkedChange event must be cancelable.",
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withIndicatorDrift)).toContain(
      'Menu specialized adapter spec checkboxItem indicatorPart "radioItemIndicator" must be "checkboxItemIndicator".',
    );
    expect(validateMenuSpecializedAdapterSpec(withStateDrift)).toContain(
      'Menu specialized adapter spec checkboxItem defaultProp "defaultValue" must be "defaultChecked".',
    );

    const contractWithoutCheckedAttribute = {
      ...menuRuntimeAdapterContract,
      parts: menuRuntimeAdapterContract.parts.map((part) =>
        part.name === "checkboxItem"
          ? {
              ...part,
              initialAttributes: part.initialAttributes?.filter(
                (attribute) => attribute.name !== "data-checked",
              ),
            }
          : part,
      ),
    };
    expect(() => buildMenuSpecializedAdapterSpec(contractWithoutCheckedAttribute)).toThrow(
      "Menu specialized adapter spec requires data-checked static attribute for checkboxItem.",
    );
  });

  it("describes Menu radio group context, event forwarding, and radio item projection", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);

    expect(spec.menu.radioGroup).toEqual({
      branchKind: "radio-group",
      context: {
        consumedValues: ["value"],
        consumerPart: "radioItem",
        name: "menu-radio-group",
        providedValues: ["value", "defaultValue", "onValueChange"],
        providerPart: "radioGroup",
        scope: "nearest-radio-group",
      },
      defaultElement: "div",
      eventForwarding: {
        callbackProp: "onValueChange",
        callbackTiming: "before-state-commit",
        cancelable: true,
        controlledResync: "syncRadioGroupState",
        detailsType: "MenuValueChangeDetails",
        domEvent: "starwind:value-change",
        emitsFrom: "radioGroup",
        name: "valueChange",
        valueProperty: "value",
        valueType: "string",
      },
      part: "radioGroup",
      publicRef: true,
      role: "group",
      valueState: {
        controlledProp: "value",
        defaultProp: "defaultValue",
        initialAttribute: "data-value",
        name: "radioValue",
        valueType: "string",
      },
    });
    expect(spec.menu.radioItem).toEqual({
      branchKind: "radio-item",
      checkedState: {
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        initialAttribute: "data-default-checked",
        name: "checked",
        valueType: "boolean",
      },
      closeOnClick: {
        attribute: "data-close-on-click",
        defaultValue: "false",
        prop: "closeOnClick",
      },
      contextConsumer: {
        contextName: "menu-radio-group",
        scope: "nearest-radio-group",
        values: ["value"],
      },
      defaultElement: "div",
      disabled: {
        ariaAttribute: "aria-disabled",
        dataAttribute: "data-disabled",
        prop: "disabled",
      },
      indicatorProjection: {
        ariaHidden: "true",
        checkedStateValue: "checked",
        hiddenAttribute: "data-hidden",
        indicatorPart: "radioItemIndicator",
        sourcePart: "radioItem",
        stateAttribute: "data-state",
        uncheckedStateValue: "unchecked",
        visibleAttribute: "data-visible",
      },
      part: "radioItem",
      publicRef: true,
      role: "menuitemradio",
      stateAttributes: {
        ariaChecked: "aria-checked",
        checked: "data-checked",
        unchecked: "data-unchecked",
      },
      valueProp: {
        attribute: "data-value",
        prop: "value",
        required: true,
        type: "string",
      },
    });
    expect(printMenuRadioRecipeBlock(spec)).toBe(`radioGroup:
  context: menu-radio-group provides value, defaultValue, onValueChange -> radioItem consumes value (nearest-radio-group)
  event: starwind:value-change -> onValueChange(value, details)
  controlledResync: syncRadioGroupState
radioItem:
  value: value -> data-value
  indicator: radioItemIndicator[data-state=checked|unchecked, data-visible, data-hidden]
`);
  });

  it("rejects Menu radio context, event, and indicator drift with clear diagnostics", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const withoutRadioGroupRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        radioGroup: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withContextDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        radioGroup: {
          ...spec.menu.radioGroup,
          context: {
            ...spec.menu.radioGroup.context,
            consumedValues: [],
            providedValues: ["value"],
            scope: "global",
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withContextConsumerDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        radioItem: {
          ...spec.menu.radioItem,
          contextConsumer: {
            ...spec.menu.radioItem.contextConsumer,
            values: [],
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withEventDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        radioGroup: {
          ...spec.menu.radioGroup,
          eventForwarding: {
            ...spec.menu.radioGroup.eventForwarding,
            callbackTiming: "after-state-commit",
            cancelable: false,
            controlledResync: "syncCheckboxItemState",
            domEvent: "starwind:drifted-value-change",
            valueProperty: "checked",
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withIndicatorDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        radioItem: {
          ...spec.menu.radioItem,
          indicatorProjection: {
            ...spec.menu.radioItem.indicatorProjection,
            indicatorPart: "checkboxItemIndicator",
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withValuePropDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        radioItem: {
          ...spec.menu.radioItem,
          valueProp: {
            ...spec.menu.radioItem.valueProp,
            required: false,
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;

    expect(validateMenuSpecializedAdapterSpec(withoutRadioGroupRecipe)).toContain(
      "Menu specialized adapter spec requires radioGroup recipe metadata.",
    );
    expect(validateMenuSpecializedAdapterSpec(withContextDrift)).toEqual(
      expect.arrayContaining([
        "Menu specialized adapter spec radioGroup context consumedValues must match contract values.",
        "Menu specialized adapter spec radioGroup context providedValues must match contract values.",
        'Menu specialized adapter spec radioGroup context scope "global" must be "nearest-radio-group".',
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withContextConsumerDrift)).toContain(
      "Menu specialized adapter spec radioItem contextConsumer must match radio group context.",
    );
    expect(validateMenuSpecializedAdapterSpec(withEventDrift)).toEqual(
      expect.arrayContaining([
        'Menu specialized adapter spec valueChange callbackTiming "after-state-commit" must match event callbackTiming "before-state-commit".',
        "Menu specialized adapter spec valueChange event must be cancelable.",
        'Menu specialized adapter spec valueChange controlledResync "syncCheckboxItemState" must be "syncRadioGroupState".',
        'Menu specialized adapter spec valueChange domEvent "starwind:drifted-value-change" must match event domEvent "starwind:value-change".',
        'Menu specialized adapter spec valueChange valueProperty "checked" must match event valueProperty "value".',
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withIndicatorDrift)).toContain(
      'Menu specialized adapter spec radioItem indicatorPart "checkboxItemIndicator" must be "radioItemIndicator".',
    );
    expect(validateMenuSpecializedAdapterSpec(withValuePropDrift)).toContain(
      "Menu specialized adapter spec radioItem value prop must be required.",
    );
  });

  it("describes Menu submenu ownership, refs, and trigger semantics", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);

    expect(spec.menu.submenu).toEqual({
      ownerTopology: {
        rootMenu: {
          boundaryParts: ["root", "trigger", "portal", "positioner", "popup"],
          childOwnerPart: "submenuRoot",
          floating: {
            anchorPart: "trigger",
            optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
            popupPart: "popup",
            portalPart: "portal",
            positionerPart: "positioner",
          },
          ownerKind: "root-menu",
          ownerPart: "root",
          queryScope: "own-root-menu-excluding-submenus",
          refs: {
            popup: "popup",
            portal: "portal",
            positioner: "positioner",
            root: "root",
            trigger: "trigger",
          },
        },
        submenu: {
          boundaryParts: ["submenuRoot", "submenuTrigger", "portal", "positioner", "popup"],
          floating: {
            anchorPart: "submenuTrigger",
            optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
            popupPart: "popup",
            portalPart: "portal",
            positionerPart: "positioner",
          },
          nestedOwnerPart: "submenuRoot",
          ownerKind: "submenu",
          ownerPart: "submenuRoot",
          parentOwnerKinds: ["root-menu", "submenu"],
          queryScope: "nearest-submenu-root",
          refs: {
            popup: "popup",
            portal: "portal",
            positioner: "positioner",
            root: "submenuRoot",
            trigger: "submenuTrigger",
          },
          triggerPart: "submenuTrigger",
        },
      },
      root: {
        branchKind: "submenu-root",
        closeDelay: {
          attribute: "data-close-delay",
          defaultValue: "200",
          prop: "closeDelay",
          type: "number",
        },
        defaultElement: "div",
        ownerBoundary: "submenu",
        part: "submenuRoot",
        publicRef: true,
        stateAttributes: {
          closedValue: "closed",
          openValue: "open",
          state: "data-state",
        },
      },
      trigger: {
        branchKind: "submenu-trigger",
        defaultElement: "div",
        disabled: {
          ariaAttribute: "aria-disabled",
          dataAttribute: "data-disabled",
          prop: "disabled",
        },
        disclosure: {
          ariaExpanded: "aria-expanded",
          ariaHaspopup: {
            attribute: "aria-haspopup",
            value: "menu",
          },
          closedStateValue: "closed",
          openStateValue: "open",
          stateAttribute: "data-state",
        },
        ownerBoundary: "submenu",
        part: "submenuTrigger",
        publicRef: true,
        role: "menuitem",
        tabIndex: {
          attribute: "tabindex",
          value: "0",
        },
      },
    });
    expect(printMenuSubmenuRecipeBlock(spec)).toBe(`submenuOwners:
  root-menu: root owns trigger, portal, positioner, popup refs; floating anchor trigger; excludes submenuRoot
  submenu: submenuRoot owns submenuTrigger, portal, positioner, popup refs; floating anchor submenuTrigger; scope nearest-submenu-root
submenuRoot:
  closeDelay: closeDelay -> data-close-delay (default 200)
  state: data-state=closed|open
submenuTrigger:
  semantics: role=menuitem aria-haspopup=menu aria-expanded
  disabled: disabled -> aria-disabled, data-disabled
`);
  });

  it("rejects Menu submenu topology, missing recipes, and runtime-owned behavior drift", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const withoutSubmenuRootRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        submenu: {
          ...spec.menu.submenu,
          root: undefined,
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withoutSubmenuTriggerRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        submenu: {
          ...spec.menu.submenu,
          trigger: undefined,
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withAmbiguousOwnerTopology = {
      ...spec,
      menu: {
        ...spec.menu,
        submenu: {
          ...spec.menu.submenu,
          ownerTopology: {
            ...spec.menu.submenu.ownerTopology,
            submenu: {
              ...spec.menu.submenu.ownerTopology.submenu,
              ownerPart: "root",
            },
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withRuntimeBehaviorModel = {
      ...spec,
      menu: {
        ...spec.menu,
        submenu: {
          ...spec.menu.submenu,
          ownerTopology: {
            ...spec.menu.submenu.ownerTopology,
            rovingFocus: {},
          },
          root: {
            ...spec.menu.submenu.root,
            typeahead: {},
          },
          trigger: {
            ...spec.menu.submenu.trigger,
            hoverTimers: {},
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withRootMetadataDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        submenu: {
          ...spec.menu.submenu,
          root: {
            ...spec.menu.submenu.root,
            defaultElement: "section",
            publicRef: false,
            stateAttributes: {
              ...spec.menu.submenu.root.stateAttributes,
              state: "data-open",
            },
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withTriggerMetadataDrift = {
      ...spec,
      menu: {
        ...spec.menu,
        submenu: {
          ...spec.menu.submenu,
          trigger: {
            ...spec.menu.submenu.trigger,
            disabled: {
              ...spec.menu.submenu.trigger.disabled,
              dataAttribute: "data-inert",
            },
            disclosure: {
              ...spec.menu.submenu.trigger.disclosure,
              ariaExpanded: "aria-open",
            },
            publicRef: false,
            role: "button",
            tabIndex: {
              ...spec.menu.submenu.trigger.tabIndex,
              value: "-1",
            },
          },
        },
      },
    } as unknown as MenuSpecializedAdapterSpec;

    expect(validateMenuSpecializedAdapterSpec(withoutSubmenuRootRecipe)).toContain(
      "Menu specialized adapter spec requires submenuRoot recipe metadata.",
    );
    expect(validateMenuSpecializedAdapterSpec(withoutSubmenuTriggerRecipe)).toContain(
      "Menu specialized adapter spec requires submenuTrigger recipe metadata.",
    );
    expect(validateMenuSpecializedAdapterSpec(withAmbiguousOwnerTopology)).toEqual(
      expect.arrayContaining([
        'Menu specialized adapter spec submenu ownerPart "root" must be "submenuRoot".',
        "Menu specialized adapter spec root menu and submenu owners must use distinct owner parts.",
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withRuntimeBehaviorModel)).toEqual(
      expect.arrayContaining([
        "Menu specialized adapter spec must keep hoverTimers in Runtime, not submenu adapter metadata.",
        "Menu specialized adapter spec must keep rovingFocus in Runtime, not submenu adapter metadata.",
        "Menu specialized adapter spec must keep typeahead in Runtime, not submenu adapter metadata.",
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withRootMetadataDrift)).toEqual(
      expect.arrayContaining([
        'Menu specialized adapter spec submenuRoot defaultElement "section" must be "div".',
        "Menu specialized adapter spec submenuRoot branch must expose a public ref.",
        "Menu specialized adapter spec submenuRoot stateAttributes must match contract attributes.",
      ]),
    );
    expect(validateMenuSpecializedAdapterSpec(withTriggerMetadataDrift)).toEqual(
      expect.arrayContaining([
        "Menu specialized adapter spec submenuTrigger branch must expose a public ref.",
        'Menu specialized adapter spec submenuTrigger role "button" must be "menuitem".',
        "Menu specialized adapter spec submenuTrigger must include disabled metadata.",
        "Menu specialized adapter spec submenuTrigger disclosure metadata must match contract attributes.",
        "Menu specialized adapter spec submenuTrigger tabIndex must match contract value.",
      ]),
    );

    const contractWithoutSubmenuCloseDelay = {
      ...menuRuntimeAdapterContract,
      parts: menuRuntimeAdapterContract.parts.map((part) =>
        part.name === "submenuRoot"
          ? {
              ...part,
              initialAttributes: part.initialAttributes?.filter(
                (attribute) => attribute.name !== "data-close-delay",
              ),
            }
          : part,
      ),
    };
    expect(() => buildMenuSpecializedAdapterSpec(contractWithoutSubmenuCloseDelay)).toThrow(
      "Menu specialized adapter spec requires data-close-delay static attribute for submenuRoot.",
    );
  });

  it("prints a deterministic non-shipping Menu composite overlay fixture from the spec", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const firstRun = printMenuCompositeOverlayFixture(spec);
    const secondRun = printMenuCompositeOverlayFixture(spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/composite-menu-overlay/menu/MenuCompositeOverlay.fixture.ts",
      "__future-fixtures/composite-menu-overlay/menu/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const fixture = firstRun.find((file) =>
      file.path.endsWith("MenuCompositeOverlay.fixture.ts"),
    )?.contents;
    const index = firstRun.find((file) => file.path.endsWith("index.ts"))?.contents;

    expect(fixture).toContain('"component: menu"');
    expect(fixture).toContain('"runtime: createMenu from @starwind-ui/runtime/menu"');
    expect(fixture).toContain('"openState: open/defaultOpen -> getOpen/setOpen"');
    expect(fixture).toContain('"rootParts: root, trigger, portal, positioner, popup"');
    expect(fixture).toContain(
      '"floating: trigger -> portal/positioner/popup options side, align, sideOffset, avoidCollisions"',
    );
    expect(fixture).toContain('"asChildTrigger: trigger merges aria, className, data, ref"');
    expect(fixture).toContain(
      '"staticBranch:item action-item element=div role=menuitem closeOnClick=data-close-on-click default=true disabled=aria-disabled/data-disabled ref=true"',
    );
    expect(fixture).toContain(
      '"staticBranch:linkItem link-item element=a role=menuitem closeOnClick=data-close-on-click default=false disabled=aria-disabled/data-disabled ref=true"',
    );
    expect(fixture).toContain('"staticBranch:group group element=div role=group ref=true"');
    expect(fixture).toContain('"staticBranch:label label element=div ref=true"');
    expect(fixture).toContain(
      '"staticBranch:separator separator element=div role=separator aria=aria-orientation:horizontal ref=true"',
    );
    expect(fixture).toContain('"staticBranch:shortcut shortcut element=span ref=true"');
    expect(fixture).toContain(
      '"checkboxItem: checked/defaultChecked -> data-default-checked; event starwind:checked-change -> onCheckedChange; indicator checkboxItemIndicator data-state checked|unchecked"',
    );
    expect(fixture).toContain(
      '"radioGroup: value/defaultValue -> data-value; context menu-radio-group provides value, defaultValue, onValueChange"',
    );
    expect(fixture).toContain(
      '"radioItem: value required -> data-value; consumes value from nearest-radio-group; indicator radioItemIndicator data-state checked|unchecked"',
    );
    expect(fixture).toContain(
      '"submenuOwner:root-menu root owns trigger, portal, positioner, popup via own-root-menu-excluding-submenus"',
    );
    expect(fixture).toContain(
      '"submenuOwner:submenu submenuRoot owns submenuTrigger, portal, positioner, popup via nearest-submenu-root"',
    );
    expect(fixture).toContain(
      '"submenuRoot: closeDelay -> data-close-delay default=200 state=data-state closed|open"',
    );
    expect(fixture).toContain(
      '"submenuTrigger: role=menuitem aria-haspopup=menu aria-expanded data-state disabled=aria-disabled/data-disabled tabindex=0"',
    );
    expect(fixture).toContain('"namespace.default: Menu"');
    expect(fixture).toContain('"namespace.member: SubmenuRoot=MenuSubmenuRoot"');
    expect(fixture).toContain('"namespace.named: Menu, MenuRoot, MenuTrigger');
    for (const boundary of [
      "roving focus",
      "typeahead",
      "highlighted item state",
      "submenu controllers",
      "hover close timers",
      "pointer and keyboard open reasons",
      "cancellable item activation",
      "checkbox and radio mutation",
      "portal movement",
      "floating placement",
      "dismissal",
      "animation-delayed hiding",
      "cleanup",
    ]) {
      expect(fixture).toContain(`"runtimeBoundary: ${boundary}"`);
    }
    expect(index).toBe(
      `// Non-shipping Menu composite overlay fixture. Do not publish, export, register, or copy into demo dependencies.\nexport { menuCompositeOverlayFixture } from "./MenuCompositeOverlay.fixture";\n`,
    );
  });

  it("fails clearly when the Menu composite overlay fixture is missing a recipe surface", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const withoutStaticBranches = {
      ...spec,
      menu: {
        ...spec.menu,
        staticBranches: [],
      },
    } as MenuSpecializedAdapterSpec;
    const withoutCheckboxRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        checkboxItem: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withoutRadioGroupRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        radioGroup: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withoutRadioItemRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        radioItem: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withoutSubmenuRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        submenu: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;
    const withoutNamespaceRecipe = {
      ...spec,
      menu: {
        ...spec.menu,
        namespace: undefined,
      },
    } as unknown as MenuSpecializedAdapterSpec;

    expect(() => printMenuCompositeOverlayFixture(withoutStaticBranches)).toThrow(
      "Menu composite overlay fixture requires staticBranches recipe for static item branches surface.",
    );
    expect(() => printMenuCompositeOverlayFixture(withoutCheckboxRecipe)).toThrow(
      "Menu composite overlay fixture requires checkboxItem recipe for checkbox item surface.",
    );
    expect(() => printMenuCompositeOverlayFixture(withoutRadioGroupRecipe)).toThrow(
      "Menu composite overlay fixture requires radioGroup recipe for radio group surface.",
    );
    expect(() => printMenuCompositeOverlayFixture(withoutRadioItemRecipe)).toThrow(
      "Menu composite overlay fixture requires radioItem recipe for radio item surface.",
    );
    expect(() => printMenuCompositeOverlayFixture(withoutSubmenuRecipe)).toThrow(
      "Menu composite overlay fixture requires submenu recipe for submenu owner surface.",
    );
    expect(() => printMenuCompositeOverlayFixture(withoutNamespaceRecipe)).toThrow(
      "Menu composite overlay fixture requires namespace recipe for namespace export surface.",
    );
  });

  it("builds a Context Menu composite overlay variant spec from Menu recipes", () => {
    const menuSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const spec = buildContextMenuSpecializedAdapterSpec(
      contextMenuRuntimeAdapterContract,
      menuSpec,
    );

    expect(validateContextMenuSpecializedAdapterSpec(spec)).toEqual([]);
    expect(spec.component).toBe("context-menu");
    expect(spec.category).toBe("composite-menu-overlay");
    expect(spec.root).toMatchObject({
      discoveryAttribute: "data-sw-context-menu",
      part: "root",
      runtimeFactory: "createContextMenu",
      runtimeImportSource: "@starwind-ui/runtime/context-menu",
    });
    expect(spec.contextMenu.variantOf).toBe("menu");
    expect(spec.contextMenu.root).toEqual({
      closeDelay: {
        attribute: "data-close-delay",
        defaultValue: "200",
        prop: "closeDelay",
        type: "number",
      },
      defaultElement: "div",
      disabled: {
        dataAttribute: "data-disabled",
        prop: "disabled",
      },
      discoveryAttribute: "data-sw-context-menu",
      menuDiscoveryAttribute: "data-sw-menu",
      part: "root",
      stateAttributes: {
        closedValue: "closed",
        openValue: "open",
        state: "data-state",
      },
    });
    expect(spec.contextMenu.trigger).toEqual({
      defaultElement: "div",
      disabled: {
        ariaAttribute: "aria-disabled",
        dataAttribute: "data-disabled",
        prop: "disabled",
      },
      discoveryAttribute: "data-sw-context-menu-trigger",
      disclosure: {
        ariaExpanded: "aria-expanded",
        ariaHaspopup: {
          attribute: "aria-haspopup",
          value: "menu",
        },
        closedStateValue: "closed",
        openStateValue: "open",
        stateAttribute: "data-state",
      },
      menuDiscoveryAttribute: "data-sw-menu-trigger",
      part: "trigger",
      tabIndex: {
        attribute: "tabindex",
        defaultValue: "0",
        prop: "tabIndex",
      },
      touchCalloutStyle: {
        property: "-webkit-touch-callout",
        value: "none",
      },
    });
    expect(spec.contextMenu.anchor).toEqual({
      creation: "runtime-created",
      defaultElement: "span",
      discoveryAttribute: "data-sw-context-menu-anchor",
      floatingReference: true,
      part: "anchor",
      publicRef: false,
      runtimeAttributes: ["data-sw-context-menu-anchor", "style"],
    });
    expect(spec.contextMenu.events).toEqual({
      closeComplete: {
        callbackProp: "onCloseComplete",
        detailsType: "ContextMenuCloseCompleteDetails",
        domEvent: "starwind:close-complete",
        name: "closeComplete",
        valueProperty: "open",
      },
      openChange: {
        callbackProp: "onOpenChange",
        cancelable: true,
        detailsType: "ContextMenuOpenChangeDetails",
        domEvent: "starwind:open-change",
        name: "openChange",
        valueProperty: "open",
      },
    });
    expect(spec.contextMenu.floating).toEqual({
      anchorPart: "anchor",
      menuOptionProps: menuSpec.menu.floating.optionProps,
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
      referenceSelection: "runtime-created-anchor",
    });
    expect(spec.contextMenu.reusedMenuRecipes.staticBranches).toEqual(menuSpec.menu.staticBranches);
    expect(spec.contextMenu.reusedMenuRecipes.checkboxItem).toEqual(menuSpec.menu.checkboxItem);
    expect(spec.contextMenu.reusedMenuRecipes.radioGroup).toEqual(menuSpec.menu.radioGroup);
    expect(spec.contextMenu.reusedMenuRecipes.radioItem).toEqual(menuSpec.menu.radioItem);
    expect(spec.contextMenu.reusedMenuRecipes.submenu).toEqual(menuSpec.menu.submenu);
    expect(spec.contextMenu.contextAlias).toEqual({
      consumerPart: "radioItem",
      contractContextName: "context-menu-radio-group",
      providerPart: "radioGroup",
      reusedContextName: "menu-radio-group",
      strategy: "menu-backed-part-alias",
    });
    expect(spec.contextMenu.namespace.menuBackedAliases.slice(0, 3)).toEqual([
      {
        contextExportName: "ContextMenuPortal",
        contextPart: "portal",
        menuExportName: "MenuPortal",
        menuPart: "portal",
        property: "Portal",
      },
      {
        contextExportName: "ContextMenuPositioner",
        contextPart: "positioner",
        menuExportName: "MenuPositioner",
        menuPart: "positioner",
        property: "Positioner",
      },
      {
        contextExportName: "ContextMenuPopup",
        contextPart: "popup",
        menuExportName: "MenuPopup",
        menuPart: "popup",
        property: "Popup",
      },
    ]);
    expect(spec.contextMenu.namespace.hiddenParts).toEqual(["anchor"]);
    expect(spec.contextMenu.namespace.namedExports).not.toContain("ContextMenuAnchor");
    expect(spec.contextMenu.lifecycle).toEqual({
      cleanupEvent: "before-swap",
      destroyMethod: "destroy",
      factory: "createContextMenu",
      initEvents: ["initial-load", "after-swap", "starwind:init"],
      instanceStore: "WeakMap<HTMLElement, ContextMenuInstance>",
      effectSync: {
        cleanup: "instance.destroy()",
        remountDependencies: ["disabled", "modal", "closeDelay"],
        setterSync: "setOpen(open, { emit: false })",
      },
    });
    expect(spec.contextMenu.runtimeBoundary).toEqual([
      "pointer anchoring",
      "keyboard anchoring",
      "long-press timing",
      "trigger event interception",
      "hidden anchor lifecycle",
      "Menu instance delegation",
      "portal reference selection",
      "floating updates",
      "dismissal",
      "open-change detail forwarding",
      "cleanup",
    ]);
  });

  it("builds and prints Context Menu through the Adapter Output Model", async () => {
    const spec = buildContextMenuSpecializedAdapterSpec(contextMenuRuntimeAdapterContract);
    const astroOutputModel = projectAstroSpecializedOutputModel(
      buildContextMenuAdapterOutputModel(spec),
    );
    const reactOutputModel = projectReactSpecializedOutputModel(
      buildContextMenuAdapterOutputModel(spec),
    );
    const astroFiles = printAstroContextMenuAdapterOutputModel(spec);
    const reactFiles = printReactContextMenuAdapterOutputModel(spec);

    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(reactOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(astroFiles.map((file) => file.path)).toEqual(
      astroOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.astro` : file.path,
      ),
    );
    expect(reactFiles.map((file) => file.path)).toEqual(
      reactOutputModel.files.map((file) =>
        file.kind === "component" ? `${file.path}.tsx` : file.path,
      ),
    );
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "anchored-menu-overlay", part: "root" }),
        expect.objectContaining({ kind: "anchored-menu-overlay", part: "trigger" }),
      ]),
    );

    const astroRoot = getPrintedFile(astroFiles, "context-menu/ContextMenuRoot.astro");
    const astroTrigger = getPrintedFile(astroFiles, "context-menu/ContextMenuTrigger.astro");
    const astroIndex = getPrintedFile(astroFiles, "context-menu/index.ts");
    const reactRoot = getPrintedFile(reactFiles, "context-menu/ContextMenuRoot.tsx");
    const reactTrigger = getPrintedFile(reactFiles, "context-menu/ContextMenuTrigger.tsx");
    const reactIndex = getPrintedFile(reactFiles, "context-menu/index.ts");

    expect(astroRoot).toContain(
      'import { createContextMenu } from "@starwind-ui/runtime/context-menu";',
    );
    expect(astroRoot).toContain("data-sw-context-menu");
    expect(astroRoot).toContain("data-sw-menu");
    expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(astroRoot).toContain("data-close-delay={closeDelay}");
    expect(astroRoot).toContain("contextMenuInstances.add(createContextMenu(root))");
    expect(astroRoot).toContain(
      'document.addEventListener("astro:after-swap", setupContextMenus);',
    );
    expect(astroRoot).toContain(
      'document.addEventListener("astro:before-swap", destroyContextMenus);',
    );
    expect(astroRoot).toContain('document.addEventListener("starwind:init", setupContextMenus);');
    expect(astroTrigger).toContain("data-sw-context-menu-trigger");
    expect(astroTrigger).toContain("data-sw-menu-trigger");
    expect(astroTrigger).toContain('aria-haspopup="menu"');
    expect(astroTrigger).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(astroTrigger).toContain("tabindex={disabled ? -1 : 0}");
    expect(astroTrigger).toContain('"-webkit-touch-callout: none"');
    expect(astroIndex).toContain("MenuPopup as ContextMenuPopup");
    expect(astroIndex).toContain("MenuCheckboxItem as ContextMenuCheckboxItem");
    expect(astroIndex).toContain("ContextMenuSubmenuTrigger");
    expect(astroIndex).toContain("MenuCheckedChangeDetails");

    expect(reactRoot).toContain('createContextMenu,\n} from "@starwind-ui/runtime/context-menu";');
    expect(reactRoot).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(reactRoot).toContain("const onCloseCompleteRef = React.useRef(onCloseComplete);");
    expect(reactRoot).toContain(
      "createContextMenu(root, {\n        defaultOpen: uncontrolledOpenRef.current,",
    );
    expect(reactRoot).toContain("onOpenChangeRef.current?.(nextOpen, details);");
    expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
    expect(reactRoot).toContain("instance.destroy();");
    expect(reactRoot).toContain("data-sw-context-menu");
    expect(reactRoot).toContain("data-sw-menu");
    expect(reactRoot).toContain('data-default-open={defaultOpenRef.current ? "true" : undefined}');
    expect(reactRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(reactRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(reactRoot).toContain("data-close-delay={closeDelay}");
    expect(reactTrigger).toContain("data-sw-context-menu-trigger");
    expect(reactTrigger).toContain("data-sw-menu-trigger");
    expect(reactTrigger).toContain('aria-haspopup="menu"');
    expect(reactTrigger).toContain("aria-disabled={disabled || undefined}");
    expect(reactTrigger).toContain("tabIndex={disabled ? -1 : (tabIndex ?? 0)}");
    expect(reactTrigger).toContain('style={{ WebkitTouchCallout: "none", ...style }}');
    expect(reactIndex).toContain('import ContextMenuPopup from "../menu/MenuPopup";');
    expect(reactIndex).toContain('import ContextMenuCheckboxItem from "../menu/MenuCheckboxItem";');
    expect(reactIndex).not.toContain('from "../menu";');
    expect(reactIndex).toContain("ContextMenuSubmenuTrigger");
    expect(reactIndex).toContain("MenuCheckedChangeDetails");

    for (const file of astroFiles) {
      const packagePath = join(process.cwd(), "packages/astro/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/astro/src", file.path),
      );
    }

    for (const file of reactFiles) {
      const packagePath = join(process.cwd(), "packages/react/src", file.path);

      expect(await formatGeneratedOutput(file.contents, packagePath)).toBe(
        readGeneratedPackageBody("packages/react/src", file.path),
      );
    }

    const targetAdapterSources = [
      "scripts/portable-runtime/renderers/framework-adapters/astro/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/astro/anchored-menu-overlay.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/adapter.ts",
      "scripts/portable-runtime/renderers/framework-adapters/react/anchored-menu-overlay.ts",
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"));

    for (const adapterSource of targetAdapterSources) {
      expect(adapterSource).not.toContain("ContextMenuRoot");
      expect(adapterSource).not.toContain("ContextMenuTrigger");
      expect(adapterSource).not.toContain("createContextMenu");
      expect(adapterSource).not.toContain("data-sw-context-menu");
      expect(adapterSource).not.toMatch(/\bconst contextMenu\s*=/);
      expect(adapterSource).not.toMatch(/\bcontextMenu\./);
    }
  });

  it("prints a deterministic non-shipping Context Menu composite overlay variant fixture", () => {
    const spec = buildContextMenuSpecializedAdapterSpec(contextMenuRuntimeAdapterContract);
    const firstRun = printContextMenuCompositeOverlayFixture(spec);
    const secondRun = printContextMenuCompositeOverlayFixture(spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/composite-menu-overlay/context-menu/ContextMenuCompositeOverlay.fixture.ts",
      "__future-fixtures/composite-menu-overlay/context-menu/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const fixture = getPrintedFile(
      firstRun,
      "__future-fixtures/composite-menu-overlay/context-menu/ContextMenuCompositeOverlay.fixture.ts",
    );
    const index = getPrintedFile(
      firstRun,
      "__future-fixtures/composite-menu-overlay/context-menu/index.ts",
    );

    expect(fixture).toContain('"component: context-menu"');
    expect(fixture).toContain('"variantOf: menu"');
    expect(fixture).toContain(
      '"runtime: createContextMenu from @starwind-ui/runtime/context-menu"',
    );
    expect(fixture).toContain(
      '"root: data-sw-context-menu + data-sw-menu closeDelay=data-close-delay default=200 disabled=data-disabled state=data-state closed|open"',
    );
    expect(fixture).toContain(
      '"trigger: data-sw-context-menu-trigger + data-sw-menu-trigger aria-haspopup=menu aria-expanded data-state disabled=aria-disabled/data-disabled tabindex=0 touchCallout=-webkit-touch-callout:none"',
    );
    expect(fixture).toContain(
      '"anchor: data-sw-context-menu-anchor runtime-created floatingReference attributes=data-sw-context-menu-anchor, style"',
    );
    expect(fixture).toContain(
      '"events: openChange ContextMenuOpenChangeDetails starwind:open-change cancelable; closeComplete ContextMenuCloseCompleteDetails starwind:close-complete"',
    );
    expect(fixture).toContain(
      '"floating: anchor -> portal/positioner/popup via runtime-created-anchor options side, align, sideOffset, avoidCollisions"',
    );
    expect(fixture).toContain('"reuse: staticBranches from Menu"');
    expect(fixture).toContain('"reuse: checkboxItem indicator checkboxItemIndicator"');
    expect(fixture).toContain('"reuse: radioGroup context menu-radio-group"');
    expect(fixture).toContain('"reuse: submenu owner topology root-menu/submenu"');
    expect(fixture).toContain(
      '"contextAlias: context-menu-radio-group -> menu-radio-group via Menu-backed radio parts"',
    );
    expect(fixture).toContain('"alias: ContextMenuPortal=MenuPortal part=portal property=Portal"');
    expect(fixture).toContain(
      '"alias: ContextMenuSubmenuTrigger=MenuSubmenuTrigger part=submenuTrigger property=SubmenuTrigger"',
    );
    expect(fixture).toContain(
      '"namespace.named: ContextMenu, ContextMenuRoot, ContextMenuTrigger, ContextMenuPortal',
    );
    expect(fixture).toContain(
      '"lifecycle: createContextMenu init=initial-load, after-swap, starwind:init cleanup=before-swap effectCleanup=instance.destroy() remount=disabled, modal, closeDelay"',
    );
    for (const boundary of [
      "pointer anchoring",
      "keyboard anchoring",
      "long-press timing",
      "hidden anchor lifecycle",
      "Menu instance delegation",
      "portal reference selection",
      "open-change detail forwarding",
    ]) {
      expect(fixture).toContain(`"runtimeBoundary: ${boundary}"`);
    }
    expect(index).toBe(
      `// Non-shipping Context Menu composite overlay fixture. Do not publish, export, register, or copy into demo dependencies.\nexport { contextMenuCompositeOverlayFixture } from "./ContextMenuCompositeOverlay.fixture";\n`,
    );
  });

  it("keeps Context Menu composite overlay fixtures out of shipping surfaces", () => {
    const spec = buildContextMenuSpecializedAdapterSpec(contextMenuRuntimeAdapterContract);
    const fixturePaths = printContextMenuCompositeOverlayFixture(spec).map((file) => file.path);

    expect(fixturePaths.every((path) => path.startsWith("__future-fixtures/"))).toBe(true);
    expect(existsSync(join(process.cwd(), "__future-fixtures"))).toBe(false);
    expect(
      readFileSync(join(process.cwd(), "packages/cli/src/registry/bundled-registry.json"), "utf8"),
    ).not.toContain("__future-fixtures");
    for (const publicSurface of [
      readFileSync(join(process.cwd(), "README.md"), "utf8"),
      readFileSync(join(process.cwd(), "packages/cli/registry/README.md"), "utf8"),
    ]) {
      expect(publicSurface).not.toContain("ContextMenuCompositeOverlay");
      expect(publicSurface).not.toContain("context-menu/ContextMenuCompositeOverlay.fixture");
    }
  });

  it("rejects Context Menu variant drift from Menu aliases, anchor reference, and events", () => {
    const spec = buildContextMenuSpecializedAdapterSpec(contextMenuRuntimeAdapterContract);
    const withoutPortalAlias = {
      ...spec,
      contextMenu: {
        ...spec.contextMenu,
        namespace: {
          ...spec.contextMenu.namespace,
          menuBackedAliases: spec.contextMenu.namespace.menuBackedAliases.filter(
            (alias) => alias.contextPart !== "portal",
          ),
        },
      },
    } as ContextMenuSpecializedAdapterSpec;
    const withAnchorReferenceDrift = {
      ...spec,
      contextMenu: {
        ...spec.contextMenu,
        floating: {
          ...spec.contextMenu.floating,
          anchorPart: "trigger",
        },
      },
    } as unknown as ContextMenuSpecializedAdapterSpec;
    const withOpenDetailsDrift = {
      ...spec,
      contextMenu: {
        ...spec.contextMenu,
        events: {
          ...spec.contextMenu.events,
          openChange: {
            ...spec.contextMenu.events.openChange,
            detailsType: "MenuOpenChangeDetails",
          },
        },
      },
    } as ContextMenuSpecializedAdapterSpec;
    const withRootDisabledDrift = {
      ...spec,
      contextMenu: {
        ...spec.contextMenu,
        root: {
          ...spec.contextMenu.root,
          disabled: {
            ...spec.contextMenu.root.disabled,
            dataAttribute: "data-root-disabled",
          },
        },
      },
    } as ContextMenuSpecializedAdapterSpec;
    const withContractAnchorDrift = {
      ...spec,
      renderPlan: {
        ...spec.renderPlan,
        floating: {
          ...spec.renderPlan.floating,
          anchorPart: "trigger",
        },
      },
    } as ContextMenuSpecializedAdapterSpec;
    const withRuntimeBehavior = {
      ...spec,
      contextMenu: {
        ...spec.contextMenu,
        runtimeBehavior: ["long-press timing"],
      },
    } as unknown as ContextMenuSpecializedAdapterSpec;

    expect(validateContextMenuSpecializedAdapterSpec(withoutPortalAlias)).toContain(
      "Context Menu specialized adapter spec aliases must include portal as ContextMenuPortal -> MenuPortal.",
    );
    expect(validateContextMenuSpecializedAdapterSpec(withAnchorReferenceDrift)).toContain(
      'Context Menu specialized adapter spec floating anchorPart "trigger" must be runtime-created anchor.',
    );
    expect(validateContextMenuSpecializedAdapterSpec(withContractAnchorDrift)).toContain(
      'Context Menu specialized adapter spec contract floating anchorPart "trigger" must be runtime-created anchor.',
    );
    expect(validateContextMenuSpecializedAdapterSpec(withOpenDetailsDrift)).toContain(
      'Context Menu specialized adapter spec openChange detailsType "MenuOpenChangeDetails" must match event detailsType "ContextMenuOpenChangeDetails".',
    );
    expect(validateContextMenuSpecializedAdapterSpec(withRootDisabledDrift)).toContain(
      "Context Menu specialized adapter spec root disabled dataAttribute must match root disabled attribute.",
    );
    expect(validateContextMenuSpecializedAdapterSpec(withRuntimeBehavior)).toContain(
      "ContextMenu specialized adapter spec must not declare contextMenu.runtimeBehavior; keep Runtime-owned behavior in Runtime controllers.",
    );
  });

  it("prints the Scroll Area tracer body through the component spec without changing package output bodies", () => {
    const spec = buildBaseSpecializedAdapterSpec(scrollAreaRuntimeAdapterContract);

    expect(validateSpecializedAdapterSpec(spec)).toEqual([]);
    expectPrintedBodiesToMatchGeneratedPackageBodies(
      "packages/astro/src",
      printAstroSpecializedAdapterSpec(spec),
    );
    expectPrintedBodiesToMatchGeneratedPackageBodies(
      "packages/react/src",
      printReactSpecializedAdapterSpec(spec),
    );
  });

  it("prints deterministic non-shipping Vue Scroll Area fixtures from the component spec", () => {
    const spec = buildBaseSpecializedAdapterSpec(scrollAreaRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("vue", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("vue", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/scroll-area/ScrollAreaRoot.vue",
      "__future-fixtures/vue/scroll-area/ScrollAreaViewport.vue",
      "__future-fixtures/vue/scroll-area/ScrollAreaContent.vue",
      "__future-fixtures/vue/scroll-area/ScrollAreaScrollbar.vue",
      "__future-fixtures/vue/scroll-area/ScrollAreaThumb.vue",
      "__future-fixtures/vue/scroll-area/ScrollAreaCorner.vue",
      "__future-fixtures/vue/scroll-area/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = firstRun.find((file) => file.path.endsWith("ScrollAreaRoot.vue"))?.contents;
    const scrollbar = firstRun.find((file) =>
      file.path.endsWith("ScrollAreaScrollbar.vue"),
    )?.contents;
    const index = firstRun.find((file) => file.path.endsWith("index.ts"))?.contents;

    expect(root).toContain('<script setup lang="ts">');
    expect(root).toContain('import { createScrollArea } from "@starwind-ui/runtime/scroll-area";');
    expect(root).toContain(
      'import { onBeforeUnmount, onMounted, provide, ref, watch } from "vue";',
    );
    expect(root).toContain("const root = ref<HTMLDivElement | null>(null);");
    expect(root).toContain('provide("starwind-scroll-area-root", root);');
    expect(root).toContain("createScrollArea(root.value);");
    expect(root).toContain("watch(\n  () => props.overflowEdgeThreshold");
    expect(root).toContain("data-sw-scroll-area");
    expect(root).toContain("<slot />");

    expect(scrollbar).toContain("withDefaults(");
    expect(scrollbar).toContain('orientation: "vertical"');
    expect(scrollbar).toContain(":data-keep-mounted=\"props.keepMounted ? '' : undefined\"");
    expect(scrollbar).toContain(':data-orientation="props.orientation"');

    expect(index).toContain('export { default as Root } from "./ScrollAreaRoot.vue";');
  });

  it("prints deterministic non-shipping Solid Scroll Area fixtures from the component spec", () => {
    const spec = buildBaseSpecializedAdapterSpec(scrollAreaRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("solid", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("solid", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/solid/scroll-area/ScrollAreaRoot.tsx",
      "__future-fixtures/solid/scroll-area/ScrollAreaViewport.tsx",
      "__future-fixtures/solid/scroll-area/ScrollAreaContent.tsx",
      "__future-fixtures/solid/scroll-area/ScrollAreaScrollbar.tsx",
      "__future-fixtures/solid/scroll-area/ScrollAreaThumb.tsx",
      "__future-fixtures/solid/scroll-area/ScrollAreaCorner.tsx",
      "__future-fixtures/solid/scroll-area/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = firstRun.find((file) => file.path.endsWith("ScrollAreaRoot.tsx"))?.contents;
    const scrollbar = firstRun.find((file) =>
      file.path.endsWith("ScrollAreaScrollbar.tsx"),
    )?.contents;
    const index = firstRun.find((file) => file.path.endsWith("index.ts"))?.contents;

    expect(root).toContain('import { createScrollArea } from "@starwind-ui/runtime/scroll-area";');
    expect(root).toContain(
      'import { createContext, createEffect, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";',
    );
    expect(root).toContain("export const ScrollAreaRootContext = createContext");
    expect(root).toContain("let root!: HTMLDivElement;");
    expect(root).toContain("instance = createScrollArea(root);");
    expect(root).toContain("createEffect(() => {");
    expect(root).toContain("<ScrollAreaRootContext.Provider value={root}");
    expect(root).toContain("data-sw-scroll-area");
    expect(root).toContain("{local.children}");

    expect(scrollbar).toContain(
      'mergeProps({ keepMounted: false, orientation: "vertical" as const }',
    );
    expect(scrollbar).toContain('data-keep-mounted={local.keepMounted ? "" : undefined}');
    expect(scrollbar).toContain("data-orientation={local.orientation}");
    expect(scrollbar).toContain("useContext(ScrollAreaRootContext);");

    expect(index).toContain('export { default as Root } from "./ScrollAreaRoot";');
  });

  it("prints deterministic non-shipping Vue Combobox fixtures from the component spec", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("vue", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("vue", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/combobox/ComboboxRoot.vue",
      "__future-fixtures/vue/combobox/ComboboxLabel.vue",
      "__future-fixtures/vue/combobox/ComboboxInputGroup.vue",
      "__future-fixtures/vue/combobox/ComboboxInput.vue",
      "__future-fixtures/vue/combobox/ComboboxTrigger.vue",
      "__future-fixtures/vue/combobox/ComboboxIcon.vue",
      "__future-fixtures/vue/combobox/ComboboxClear.vue",
      "__future-fixtures/vue/combobox/ComboboxValue.vue",
      "__future-fixtures/vue/combobox/ComboboxPortal.vue",
      "__future-fixtures/vue/combobox/ComboboxPositioner.vue",
      "__future-fixtures/vue/combobox/ComboboxPopup.vue",
      "__future-fixtures/vue/combobox/ComboboxEmpty.vue",
      "__future-fixtures/vue/combobox/ComboboxList.vue",
      "__future-fixtures/vue/combobox/ComboboxGroup.vue",
      "__future-fixtures/vue/combobox/ComboboxGroupLabel.vue",
      "__future-fixtures/vue/combobox/ComboboxItem.vue",
      "__future-fixtures/vue/combobox/ComboboxItemText.vue",
      "__future-fixtures/vue/combobox/ComboboxItemIndicator.vue",
      "__future-fixtures/vue/combobox/ComboboxSeparator.vue",
      "__future-fixtures/vue/combobox/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = getPrintedFile(firstRun, "__future-fixtures/vue/combobox/ComboboxRoot.vue");
    const input = getPrintedFile(firstRun, "__future-fixtures/vue/combobox/ComboboxInput.vue");
    const portal = getPrintedFile(firstRun, "__future-fixtures/vue/combobox/ComboboxPortal.vue");
    const positioner = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/combobox/ComboboxPositioner.vue",
    );
    const popup = getPrintedFile(firstRun, "__future-fixtures/vue/combobox/ComboboxPopup.vue");
    const item = getPrintedFile(firstRun, "__future-fixtures/vue/combobox/ComboboxItem.vue");
    const itemText = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/combobox/ComboboxItemText.vue",
    );
    const indicator = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/combobox/ComboboxItemIndicator.vue",
    );
    const allContents = firstRun.map((file) => file.contents).join("\n");

    expect(root).toContain(
      'import { createCombobox, type ComboboxInputValueChangeDetails, type ComboboxOpenChangeDetails, type ComboboxValueChangeDetails } from "@starwind-ui/runtime/combobox";',
    );
    expect(root).toContain(
      'import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";',
    );
    expect(root).toContain("const input = ref<HTMLInputElement | null>(null);");
    expect(root).toContain('provide("starwind-combobox-root", comboboxContext);');
    expect(root).toContain("instance = createCombobox(root.value, {");
    expect(root).toContain("watch(\n  () => props.inputValue");
    expect(root).toContain("instance.setInputValue(inputValue, { emit: false, filter: false });");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain("instance.setValue(value, { emit: false });");
    expect(root).toContain("instance?.destroy();");
    expect(root).toContain("data-sw-combobox-hidden-input");
    expect(root).toContain(
      ":data-highlight-item-on-hover=\"props.highlightItemOnHover ? 'true' : 'false'\"",
    );
    expect(root).toContain(':data-locale="props.locale"');
    expect(root).toContain('type="hidden"');
    expect(root).toContain('aria-hidden="true"');
    expect(root).toContain('tabindex="-1"');
    expect(root).not.toContain(':autocomplete="props.autoComplete"');

    expect(input).toContain('inject("starwind-combobox-root")');
    expect(input).toContain("combobox.input.value = input.value;");
    expect(input).toContain("onBeforeUnmount");
    expect(input).toContain('role="combobox"');
    expect(portal).toContain('<Teleport to="body">');
    expect(positioner).toContain(':data-side="props.side"');
    expect(popup).toContain('role="listbox"');
    expect(item).toContain('provide("starwind-combobox-item", comboboxItemContext);');
    expect(item).toContain(':data-value="props.value"');
    expect(item).toContain(":aria-selected=\"selected ? 'true' : 'false'\"");
    expect(itemText).toContain("data-sw-combobox-item-text");
    expect(indicator).toContain('inject("starwind-combobox-item")');
    expect(indicator).toContain(":data-state=\"selected ? 'checked' : 'unchecked'\"");
    expect(allContents).not.toMatch(/filterItems|keyboardNavigation|innerText|textContent/);
  });

  it("prints deterministic non-shipping Solid Combobox fixtures from the component spec", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("solid", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("solid", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/solid/combobox/ComboboxRoot.tsx",
      "__future-fixtures/solid/combobox/ComboboxLabel.tsx",
      "__future-fixtures/solid/combobox/ComboboxInputGroup.tsx",
      "__future-fixtures/solid/combobox/ComboboxInput.tsx",
      "__future-fixtures/solid/combobox/ComboboxTrigger.tsx",
      "__future-fixtures/solid/combobox/ComboboxIcon.tsx",
      "__future-fixtures/solid/combobox/ComboboxClear.tsx",
      "__future-fixtures/solid/combobox/ComboboxValue.tsx",
      "__future-fixtures/solid/combobox/ComboboxPortal.tsx",
      "__future-fixtures/solid/combobox/ComboboxPositioner.tsx",
      "__future-fixtures/solid/combobox/ComboboxPopup.tsx",
      "__future-fixtures/solid/combobox/ComboboxEmpty.tsx",
      "__future-fixtures/solid/combobox/ComboboxList.tsx",
      "__future-fixtures/solid/combobox/ComboboxGroup.tsx",
      "__future-fixtures/solid/combobox/ComboboxGroupLabel.tsx",
      "__future-fixtures/solid/combobox/ComboboxItem.tsx",
      "__future-fixtures/solid/combobox/ComboboxItemText.tsx",
      "__future-fixtures/solid/combobox/ComboboxItemIndicator.tsx",
      "__future-fixtures/solid/combobox/ComboboxSeparator.tsx",
      "__future-fixtures/solid/combobox/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = getPrintedFile(firstRun, "__future-fixtures/solid/combobox/ComboboxRoot.tsx");
    const input = getPrintedFile(firstRun, "__future-fixtures/solid/combobox/ComboboxInput.tsx");
    const portal = getPrintedFile(firstRun, "__future-fixtures/solid/combobox/ComboboxPortal.tsx");
    const positioner = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/combobox/ComboboxPositioner.tsx",
    );
    const popup = getPrintedFile(firstRun, "__future-fixtures/solid/combobox/ComboboxPopup.tsx");
    const item = getPrintedFile(firstRun, "__future-fixtures/solid/combobox/ComboboxItem.tsx");
    const itemText = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/combobox/ComboboxItemText.tsx",
    );
    const indicator = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/combobox/ComboboxItemIndicator.tsx",
    );
    const index = getPrintedFile(firstRun, "__future-fixtures/solid/combobox/index.ts");
    const allContents = firstRun.map((file) => file.contents).join("\n");

    expect(root).toContain(
      'import { createCombobox, type ComboboxInputValueChangeDetails, type ComboboxOpenChangeDetails, type ComboboxValueChangeDetails } from "@starwind-ui/runtime/combobox";',
    );
    expect(root).toContain("export const ComboboxRootContext = createContext");
    expect(root).toContain("input: { current: undefined as HTMLInputElement | undefined }");
    expect(root).toContain("instance = createCombobox(root, {");
    expect(root).toContain("instance.setInputValue(inputValue, { emit: false, filter: false });");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain("instance.setValue(value, { emit: false });");
    expect(root).toContain("onCleanup(() => {");
    expect(root).toContain("data-sw-combobox-hidden-input");
    expect(root).toContain(
      'data-highlight-item-on-hover={local.highlightItemOnHover ? "true" : "false"}',
    );
    expect(root).toContain("data-locale={local.locale}");
    expect(root).toContain('type="hidden"');
    expect(root).toContain('aria-hidden="true"');
    expect(root).toContain("tabIndex={-1}");
    expect(root).not.toContain("\n          autocomplete={local.autoComplete}");

    expect(input).toContain("useComboboxRootContext();");
    expect(input).toContain("combobox.input.current = input;");
    expect(input).toContain("onCleanup");
    expect(input).toContain('role="combobox"');
    expect(input).not.toContain("</input>");
    expect(portal).toContain('import { Portal } from "solid-js/web";');
    expect(positioner).toContain("data-side={local.side}");
    expect(popup).toContain('role="listbox"');
    expect(item).toContain("<ComboboxItemContext.Provider value={comboboxItemContext}");
    expect(item).toContain("data-value={local.value}");
    expect(item).toContain('aria-selected={selected() ? "true" : "false"}');
    expect(itemText).toContain("data-sw-combobox-item-text");
    expect(indicator).toContain("useComboboxItemContext();");
    expect(indicator).toContain('data-state={selected() ? "checked" : "unchecked"}');
    expect(index).toContain("useComboboxRootContext");
    expect(index).toContain("useComboboxItemContext");
    expect(allContents).not.toMatch(/filterItems|keyboardNavigation|innerText|textContent/);
  });

  it("prints deterministic non-shipping Vue Menu fixtures from the Menu component spec", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("vue", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("vue", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/menu/MenuRoot.vue",
      "__future-fixtures/vue/menu/MenuTrigger.vue",
      "__future-fixtures/vue/menu/MenuPortal.vue",
      "__future-fixtures/vue/menu/MenuPositioner.vue",
      "__future-fixtures/vue/menu/MenuPopup.vue",
      "__future-fixtures/vue/menu/MenuItem.vue",
      "__future-fixtures/vue/menu/MenuLinkItem.vue",
      "__future-fixtures/vue/menu/MenuCheckboxItem.vue",
      "__future-fixtures/vue/menu/MenuCheckboxItemIndicator.vue",
      "__future-fixtures/vue/menu/MenuRadioGroup.vue",
      "__future-fixtures/vue/menu/MenuRadioItem.vue",
      "__future-fixtures/vue/menu/MenuRadioItemIndicator.vue",
      "__future-fixtures/vue/menu/MenuGroup.vue",
      "__future-fixtures/vue/menu/MenuLabel.vue",
      "__future-fixtures/vue/menu/MenuSeparator.vue",
      "__future-fixtures/vue/menu/MenuShortcut.vue",
      "__future-fixtures/vue/menu/MenuSubmenuRoot.vue",
      "__future-fixtures/vue/menu/MenuSubmenuTrigger.vue",
      "__future-fixtures/vue/menu/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = getPrintedFile(firstRun, "__future-fixtures/vue/menu/MenuRoot.vue");
    const portal = getPrintedFile(firstRun, "__future-fixtures/vue/menu/MenuPortal.vue");
    const checkboxItem = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/menu/MenuCheckboxItem.vue",
    );
    const radioGroup = getPrintedFile(firstRun, "__future-fixtures/vue/menu/MenuRadioGroup.vue");
    const radioItem = getPrintedFile(firstRun, "__future-fixtures/vue/menu/MenuRadioItem.vue");
    const radioIndicator = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/menu/MenuRadioItemIndicator.vue",
    );
    const submenuRoot = getPrintedFile(firstRun, "__future-fixtures/vue/menu/MenuSubmenuRoot.vue");
    const index = getPrintedFile(firstRun, "__future-fixtures/vue/menu/index.ts");

    expect(root).toContain(
      'import { createMenu, type MenuCloseCompleteDetails, type MenuOpenChangeDetails } from "@starwind-ui/runtime/menu";',
    );
    expect(root).toContain(
      'import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";',
    );
    expect(root).toContain('provide("starwind-menu-root", menuRootContext);');
    expect(root).toContain("instance = createMenu(root.value");
    expect(root).toContain(":data-state=\"renderedOpen ? 'open' : 'closed'\"");
    expect(root).toContain("<slot />");

    expect(portal).toContain('<Teleport to="body">');
    expect(checkboxItem).toContain('addEventListener("starwind:checked-change"');
    expect(checkboxItem).toContain('provide("starwind-menu-checkbox-item", checkboxItemContext);');
    expect(checkboxItem).toContain(":data-checked=\"renderedChecked ? '' : undefined\"");
    expect(radioGroup).toContain('provide("starwind-menu-radio-group", radioGroupContext);');
    expect(radioGroup).toContain('addEventListener("starwind:value-change"');
    expect(radioItem).toContain('inject("starwind-menu-radio-group")');
    expect(radioItem).toContain('provide("starwind-menu-radio-item", radioItemContext);');
    expect(radioItem).toContain(
      "group.value.value === undefined ? props.defaultChecked : group.value.value === props.value",
    );
    expect(radioItem).not.toContain("group.value.value === props.value ?? props.defaultChecked");
    expect(radioIndicator).toContain(":data-state=\"checked ? 'checked' : 'unchecked'\"");
    expect(submenuRoot).toContain('provide("starwind-menu-submenu-root", submenuRootContext);');
    expect(index).toContain('export { default as Root } from "./MenuRoot.vue";');
    expect(index).toContain(
      'export { default as RadioItemIndicator } from "./MenuRadioItemIndicator.vue";',
    );
  });

  it("prints deterministic non-shipping Solid Menu fixtures from the Menu component spec", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("solid", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("solid", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/solid/menu/MenuRoot.tsx",
      "__future-fixtures/solid/menu/MenuTrigger.tsx",
      "__future-fixtures/solid/menu/MenuPortal.tsx",
      "__future-fixtures/solid/menu/MenuPositioner.tsx",
      "__future-fixtures/solid/menu/MenuPopup.tsx",
      "__future-fixtures/solid/menu/MenuItem.tsx",
      "__future-fixtures/solid/menu/MenuLinkItem.tsx",
      "__future-fixtures/solid/menu/MenuCheckboxItem.tsx",
      "__future-fixtures/solid/menu/MenuCheckboxItemIndicator.tsx",
      "__future-fixtures/solid/menu/MenuRadioGroup.tsx",
      "__future-fixtures/solid/menu/MenuRadioItem.tsx",
      "__future-fixtures/solid/menu/MenuRadioItemIndicator.tsx",
      "__future-fixtures/solid/menu/MenuGroup.tsx",
      "__future-fixtures/solid/menu/MenuLabel.tsx",
      "__future-fixtures/solid/menu/MenuSeparator.tsx",
      "__future-fixtures/solid/menu/MenuShortcut.tsx",
      "__future-fixtures/solid/menu/MenuSubmenuRoot.tsx",
      "__future-fixtures/solid/menu/MenuSubmenuTrigger.tsx",
      "__future-fixtures/solid/menu/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = getPrintedFile(firstRun, "__future-fixtures/solid/menu/MenuRoot.tsx");
    const portal = getPrintedFile(firstRun, "__future-fixtures/solid/menu/MenuPortal.tsx");
    const checkboxItem = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/menu/MenuCheckboxItem.tsx",
    );
    const radioGroup = getPrintedFile(firstRun, "__future-fixtures/solid/menu/MenuRadioGroup.tsx");
    const radioItem = getPrintedFile(firstRun, "__future-fixtures/solid/menu/MenuRadioItem.tsx");
    const radioIndicator = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/menu/MenuRadioItemIndicator.tsx",
    );
    const submenuRoot = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/menu/MenuSubmenuRoot.tsx",
    );
    const index = getPrintedFile(firstRun, "__future-fixtures/solid/menu/index.ts");

    expect(root).toContain(
      'import { createMenu, type MenuCloseCompleteDetails, type MenuOpenChangeDetails } from "@starwind-ui/runtime/menu";',
    );
    expect(root).toContain("export const MenuRootContext = createContext");
    expect(root).toContain("instance = createMenu(root");
    expect(root).toContain("<MenuRootContext.Provider value={menuRootContext}");
    expect(root).toContain('data-state={menuRootContext.open() ? "open" : "closed"}');
    expect(root).toContain("{local.children}");

    expect(portal).toContain('import { Portal } from "solid-js/web";');
    expect(checkboxItem).toContain('addEventListener("starwind:checked-change"');
    expect(checkboxItem).toContain("<MenuCheckboxItemContext.Provider value={checkboxItemContext}");
    expect(radioGroup).toContain("<MenuRadioGroupContext.Provider value={radioGroupContext}");
    expect(radioGroup).toContain('addEventListener("starwind:value-change"');
    expect(radioItem).toContain("useMenuRadioGroupContext()");
    expect(radioItem).toContain("<MenuRadioItemContext.Provider value={radioItemContext}");
    expect(radioItem).toContain(
      "group.value() === undefined ? local.defaultChecked : group.value() === local.value",
    );
    expect(radioItem).not.toContain("group.value() === local.value ?? local.defaultChecked");
    expect(radioIndicator).toContain('data-state={checked() ? "checked" : "unchecked"}');
    expect(submenuRoot).toContain("<MenuSubmenuRootContext.Provider value={submenuRootContext}");
    expect(index).toContain('export { default as Root } from "./MenuRoot";');
    expect(index).toContain(
      'export { default as RadioItemIndicator } from "./MenuRadioItemIndicator";',
    );
    expect(index).toContain("useMenuRadioGroupContext");
  });

  it("prints deterministic non-shipping Vue Navigation Menu fixtures from the shared viewport spec", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("vue", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("vue", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/navigation-menu/NavigationMenuRoot.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuList.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuItem.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuTrigger.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuIcon.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuContent.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuLink.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuPortal.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuPositioner.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuPopup.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuViewport.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuArrow.vue",
      "__future-fixtures/vue/navigation-menu/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuRoot.vue",
    );
    const list = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuList.vue",
    );
    const item = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuItem.vue",
    );
    const trigger = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuTrigger.vue",
    );
    const portal = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuPortal.vue",
    );
    const positioner = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuPositioner.vue",
    );
    const popup = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuPopup.vue",
    );
    const viewport = getPrintedFile(
      firstRun,
      "__future-fixtures/vue/navigation-menu/NavigationMenuViewport.vue",
    );
    const index = getPrintedFile(firstRun, "__future-fixtures/vue/navigation-menu/index.ts");

    expect(root).toContain(
      'import { createNavigationMenu, type NavigationMenuValueChangeDetails } from "@starwind-ui/runtime/navigation-menu";',
    );
    expect(root).toContain(
      'import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";',
    );
    expect(root).toContain("const root = ref<HTMLElement | null>(null);");
    expect(root).toContain('provide("starwind-navigation-menu-root", navigationMenuContext);');
    expect(root).toContain("instance = createNavigationMenu(root.value, {");
    expect(root).toContain("watch(\n  () => props.value");
    expect(root).toContain("instance.setValue(value, { emit: false });");
    expect(root).toContain(":data-controlled-value=\"props.value === null ? '' : undefined\"");
    expect(root).toContain(':data-orientation="props.orientation"');

    expect(list).toContain('inject("starwind-navigation-menu-root")');
    expect(list).toContain(':data-orientation="navigationMenu.orientation.value"');
    expect(item).toContain('provide("starwind-navigation-menu-item"');
    expect(item).toContain(':data-value="props.value"');
    expect(trigger).toContain('inject("starwind-navigation-menu-item")');
    expect(trigger).toContain(":aria-expanded=\"open ? 'true' : 'false'\"");
    expect(portal).toContain('<Teleport to="body">');
    expect(positioner).toContain(':data-collision-padding="props.collisionPadding"');
    expect(popup).toContain(':hidden="navigationMenu.value.value === null"');
    expect(viewport).toContain("data-sw-nav-menu-viewport");
    expect(viewport).toContain(':data-activation-direction="undefined"');
    expect(index).toContain('export { default as Root } from "./NavigationMenuRoot.vue";');
    expect(index).toContain('export { default as Viewport } from "./NavigationMenuViewport.vue";');
  });

  it("prints deterministic non-shipping Solid Navigation Menu fixtures from the shared viewport spec", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const firstRun = printFutureSpecializedAdapterSpecFixture("solid", spec);
    const secondRun = printFutureSpecializedAdapterSpecFixture("solid", spec);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/solid/navigation-menu/NavigationMenuRoot.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuList.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuItem.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuTrigger.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuIcon.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuContent.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuLink.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuPortal.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuPositioner.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuPopup.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuViewport.tsx",
      "__future-fixtures/solid/navigation-menu/NavigationMenuArrow.tsx",
      "__future-fixtures/solid/navigation-menu/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuRoot.tsx",
    );
    const list = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuList.tsx",
    );
    const item = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuItem.tsx",
    );
    const trigger = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuTrigger.tsx",
    );
    const portal = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuPortal.tsx",
    );
    const positioner = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuPositioner.tsx",
    );
    const popup = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuPopup.tsx",
    );
    const viewport = getPrintedFile(
      firstRun,
      "__future-fixtures/solid/navigation-menu/NavigationMenuViewport.tsx",
    );
    const index = getPrintedFile(firstRun, "__future-fixtures/solid/navigation-menu/index.ts");

    expect(root).toContain(
      'import { createNavigationMenu, type NavigationMenuValueChangeDetails } from "@starwind-ui/runtime/navigation-menu";',
    );
    expect(root).toContain(
      'import { createContext, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";',
    );
    expect(root).toContain("export const NavigationMenuRootContext = createContext");
    expect(root).toContain("let root!: HTMLElement;");
    expect(root).toContain("instance = createNavigationMenu(root, {");
    expect(root).toContain("const [mounted, setMounted] = createSignal(false);");
    expect(root).toContain("const optionSignature = createMemo(() =>");
    expect(root).toContain("optionSignature();\n    if (!mounted()) return;");
    expect(root).toContain("instance.setValue(value, { emit: false });");
    expect(root).toContain("<NavigationMenuRootContext.Provider value={navigationMenuContext}");
    expect(root).toContain('data-controlled-value={local.value === null ? "" : undefined}');
    expect(root).toContain("data-orientation={local.orientation}");

    expect(list).toContain("useNavigationMenuRootContext();");
    expect(list).toContain("data-orientation={navigationMenu.orientation()}");
    expect(item).toContain("<NavigationMenuItemContext.Provider value={itemContext}>");
    expect(trigger).toContain("useNavigationMenuItemContext();");
    expect(trigger).toContain('aria-expanded={open() ? "true" : "false"}');
    expect(portal).toContain('import { Portal } from "solid-js/web";');
    expect(positioner).toContain("data-collision-padding={String(local.collisionPadding)}");
    expect(popup).toContain("hidden={navigationMenu.value() === null}");
    expect(viewport).toContain("data-sw-nav-menu-viewport");
    expect(viewport).toContain("data-activation-direction={undefined}");
    expect(index).toContain('export { default as Root } from "./NavigationMenuRoot";');
    expect(index).toContain("useNavigationMenuRootContext");
  });

  it("keeps Navigation Menu future-framework fixtures out of shipping package and registry surfaces", () => {
    const spec = buildNavigationMenuSpecializedAdapterSpec(navigationMenuRuntimeAdapterContract);
    const fixturePaths = [
      ...printFutureSpecializedAdapterSpecFixture("vue", spec),
      ...printFutureSpecializedAdapterSpecFixture("solid", spec),
    ].map((file) => file.path);

    expect(fixturePaths.every((path) => path.startsWith("__future-fixtures/"))).toBe(true);
    expect(existsSync(join(process.cwd(), "packages/vue"))).toBe(false);
    expect(existsSync(join(process.cwd(), "packages/solid"))).toBe(false);
    expect(readFileSync(join(process.cwd(), "pnpm-workspace.yaml"), "utf8")).not.toContain(
      "packages/vue",
    );
    const appPackageJsonPaths = readdirSync(join(process.cwd(), "apps"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(process.cwd(), "apps", entry.name, "package.json"))
      .filter((path) => existsSync(path));
    expect(appPackageJsonPaths.length).toBeGreaterThan(0);
    for (const appPackageJsonPath of appPackageJsonPaths) {
      expect(readFileSync(appPackageJsonPath, "utf8")).not.toMatch(/"vue"|"solid-js"/);
    }
    expect(
      readFileSync(join(process.cwd(), "packages/cli/src/registry/bundled-registry.json"), "utf8"),
    ).not.toContain("__future-fixtures");
    for (const publicSurface of [
      readFileSync(join(process.cwd(), "README.md"), "utf8"),
      readFileSync(join(process.cwd(), "packages/cli/registry/README.md"), "utf8"),
    ]) {
      expect(publicSurface).not.toContain("__future-fixtures");
      expect(publicSurface).not.toContain("navigation-menu/vue");
      expect(publicSurface).not.toContain("navigation-menu/solid");
    }
  });

  it("keeps Menu future-framework fixtures out of shipping package and registry surfaces", () => {
    const spec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    const fixturePaths = [
      ...printFutureSpecializedAdapterSpecFixture("vue", spec),
      ...printFutureSpecializedAdapterSpecFixture("solid", spec),
    ].map((file) => file.path);

    expect(fixturePaths.every((path) => path.startsWith("__future-fixtures/"))).toBe(true);
    expect(existsSync(join(process.cwd(), "packages/vue"))).toBe(false);
    expect(existsSync(join(process.cwd(), "packages/solid"))).toBe(false);
    expect(readFileSync(join(process.cwd(), "pnpm-workspace.yaml"), "utf8")).not.toContain(
      "packages/vue",
    );
    expect(readFileSync(join(process.cwd(), "apps/demo/package.json"), "utf8")).not.toMatch(
      /"vue"|"solid-js"/,
    );
    expect(
      readFileSync(join(process.cwd(), "packages/cli/src/registry/bundled-registry.json"), "utf8"),
    ).not.toContain("__future-fixtures");
    for (const publicSurface of [
      readFileSync(join(process.cwd(), "README.md"), "utf8"),
      readFileSync(join(process.cwd(), "packages/cli/registry/README.md"), "utf8"),
    ]) {
      expect(publicSurface).not.toContain("__future-fixtures");
      expect(publicSurface).not.toContain("menu/vue");
      expect(publicSurface).not.toContain("menu/solid");
    }
  });

  it("keeps Combobox future-framework fixtures out of shipping package, registry, demo, and docs surfaces", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const fixturePaths = [
      ...printFutureSpecializedAdapterSpecFixture("vue", spec),
      ...printFutureSpecializedAdapterSpecFixture("solid", spec),
    ].map((file) => file.path);

    expect(fixturePaths.every((path) => path.startsWith("__future-fixtures/"))).toBe(true);
    expect(existsSync(join(process.cwd(), "packages/vue"))).toBe(false);
    expect(existsSync(join(process.cwd(), "packages/solid"))).toBe(false);
    expect(readFileSync(join(process.cwd(), "pnpm-workspace.yaml"), "utf8")).not.toContain(
      "packages/vue",
    );
    const appPackageJsonPaths = readdirSync(join(process.cwd(), "apps"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(process.cwd(), "apps", entry.name, "package.json"))
      .filter((path) => existsSync(path));
    expect(appPackageJsonPaths.length).toBeGreaterThan(0);
    for (const appPackageJsonPath of appPackageJsonPaths) {
      expect(readFileSync(appPackageJsonPath, "utf8")).not.toMatch(/"vue"|"solid-js"/);
    }
    expect(
      readFileSync(join(process.cwd(), "packages/cli/src/registry/bundled-registry.json"), "utf8"),
    ).not.toContain("__future-fixtures");
    for (const publicSurface of [
      readFileSync(join(process.cwd(), "README.md"), "utf8"),
      readFileSync(join(process.cwd(), "packages/cli/registry/README.md"), "utf8"),
    ]) {
      expect(publicSurface).not.toContain("__future-fixtures");
      expect(publicSurface).not.toContain("combobox/vue");
      expect(publicSurface).not.toContain("combobox/solid");
    }
  });

  it("fails clearly for specialized adapter specs outside the fixture scope", () => {
    const spec = buildBaseSpecializedAdapterSpec(dialogRuntimeAdapterContract);

    expect(() => printFutureSpecializedAdapterSpecFixture("vue", spec)).toThrow(
      "Dialog does not have a Vue specialized adapter fixture.",
    );
    expect(() => printFutureSpecializedAdapterSpecFixture("solid", spec)).toThrow(
      "Dialog does not have a Solid specialized adapter fixture.",
    );
  });

  it("fails clearly when Scroll Area fixture-required props drift from the component spec", () => {
    const spec = buildBaseSpecializedAdapterSpec(scrollAreaRuntimeAdapterContract);
    const specWithoutRootOption = {
      ...spec,
      props: spec.props.filter((prop) => prop.name !== "overflowEdgeThreshold"),
    };
    const specWithWrongTarget = {
      ...spec,
      props: spec.props.map((prop) =>
        prop.name === "orientation" ? { ...prop, targets: ["root"] } : prop,
      ),
    };

    expect(() => printFutureSpecializedAdapterSpecFixture("vue", specWithoutRootOption)).toThrow(
      "ScrollArea specialized adapter fixture is missing root overflowEdgeThreshold prop.",
    );
    expect(() => printFutureSpecializedAdapterSpecFixture("solid", specWithoutRootOption)).toThrow(
      "ScrollArea specialized adapter fixture is missing root overflowEdgeThreshold prop.",
    );
    expect(() => printFutureSpecializedAdapterSpecFixture("vue", specWithWrongTarget)).toThrow(
      "ScrollArea specialized adapter fixture is missing scrollbar orientation prop.",
    );
    expect(() => printFutureSpecializedAdapterSpecFixture("solid", specWithWrongTarget)).toThrow(
      "ScrollArea specialized adapter fixture is missing scrollbar orientation prop.",
    );
  });

  it("rejects root recipe drift from generic-adapter-plan Runtime facts", () => {
    const spec = buildBaseSpecializedAdapterSpec(scrollAreaRuntimeAdapterContract);

    expect(
      validateSpecializedAdapterSpec({
        ...spec,
        root: {
          ...spec.root,
          defaultElement: "section",
          discoveryAttribute: "data-sw-drifted-scroll-area",
          part: "viewport",
          runtimeFactory: "createDriftedScrollArea",
          runtimeImportSource: "@starwind-ui/runtime/drifted-scroll-area",
        },
      }),
    ).toEqual([
      'ScrollArea specialized adapter spec root part "viewport" must match generic adapter plan root part "root".',
      'ScrollArea specialized adapter spec root defaultElement "section" must match generic adapter plan root defaultElement "div".',
      'ScrollArea specialized adapter spec root discoveryAttribute "data-sw-drifted-scroll-area" must match generic adapter plan root discoveryAttribute "data-sw-scroll-area".',
      'ScrollArea specialized adapter spec root runtimeFactory "createDriftedScrollArea" must match generic adapter plan runtime factory "createScrollArea".',
      'ScrollArea specialized adapter spec root runtimeImportSource "@starwind-ui/runtime/drifted-scroll-area" must match generic adapter plan runtime import "@starwind-ui/runtime/scroll-area".',
    ]);
  });

  it("rejects adapter specs that try to model Runtime-owned behavior", () => {
    const spec = buildBaseSpecializedAdapterSpec(scrollAreaRuntimeAdapterContract);

    expect(
      validateSpecializedAdapterSpec({
        ...spec,
        runtimeBehavior: ["keyboard-navigation"],
      }),
    ).toEqual([
      "ScrollArea specialized adapter spec must not declare runtimeBehavior; keep Runtime-owned behavior in Runtime controllers.",
    ]);

    expect(
      validateSpecializedAdapterSpec({
        ...spec,
        parts: [
          ...spec.parts,
          {
            defaultElement: "div",
            discoveryAttribute: "data-sw-scroll-area-debug",
            keyboardNavigation: "arrow-keys",
            name: "debug",
          },
        ],
      }),
    ).toEqual([
      "ScrollArea specialized adapter spec must not declare parts.6.keyboardNavigation; keep Runtime-owned behavior in Runtime controllers.",
    ]);
  });

  it("leaves existing generic-adapter-plan family printing available for non-tracer primitives", () => {
    const plan = buildGenericAdapterPlan(dialogRuntimeAdapterContract);

    expectPrintedBodiesToMatchGeneratedPackageBodies(
      "packages/astro/src",
      printGenericAdapterOutputModel(astroFrameworkAdapter, buildGenericAdapterOutputModel(plan)),
    );
  });
});

function expectPrintedBodiesToMatchGeneratedPackageBodies(
  packageSourceDirectory: string,
  files: { contents: string; path: string }[],
): void {
  for (const file of files) {
    const contents = packageSourceDirectory.includes("/astro/")
      ? normalizeAstroPrimitiveOutput(file.path.split("/").at(-1)!, file.contents)
      : applyReactRefCleanup(file.contents);
    expect(normalizePrintedComparison(contents)).toBe(
      normalizePrintedComparison(readGeneratedPackageBody(packageSourceDirectory, file.path)),
    );
  }
}

function normalizePrintedComparison(contents: string): string {
  return contents
    .replace(/\s+/g, " ")
    .replace(/\s*([(){}\[\],;])\s*/g, "$1")
    .replace(/,([)\]}])/g, "$1");
}

function getPrintedFile(files: { contents: string; path: string }[], path: string): string {
  const file = files.find((candidate) => candidate.path === path);
  if (!file) {
    throw new Error(`Missing printed file "${path}".`);
  }

  return file.contents;
}

function getSidebarReactPackageFilePaths(
  spec: ReturnType<typeof buildSidebarSpecializedAdapterSpec>,
): string[] {
  return [
    `${spec.sidebar.context.file}.tsx`,
    ...spec.files.map((file) => `${file.path}${file.kind === "index" ? ".ts" : ".tsx"}`),
  ];
}

function getGeneratedAstroWrappersAstroHeader(): string {
  return `---
/**
 * Generated by scripts/portable-runtime/generate-astro-wrappers.ts.
 * Do not edit by hand; update the contract/template instead.
 */
`;
}

function expectCarouselIndexNamespaceSurface(outputRoot: string, namedExports: string[]): void {
  const index = readFileSync(join(outputRoot, "carousel/index.ts"), "utf8");
  const defaultImportNames = Array.from(
    index.matchAll(/^import\s+([A-Za-z0-9_]+)\s+from\s+"\.\/[^"]+";/gm),
  ).map((match) => match[1]);

  expect(defaultImportNames).toEqual(namedExports.slice(1));
  expect(readNamedExportBlock(index)).toEqual(namedExports);
}

function expectToastIndexNamespaceAndPublicApiSurface(
  outputRoot: string,
  spec: ToastSpecializedAdapterSpec,
): void {
  const index = readFileSync(join(outputRoot, "toast/index.ts"), "utf8");
  const defaultImportNames = Array.from(
    index.matchAll(/^import\s+([A-Za-z0-9_]+)\s+from\s+"\.\/[^"]+";/gm),
  ).map((match) => match[1]);

  expect(defaultImportNames).toEqual(spec.toast.namespace.namedExports.slice(1));
  expect(readNamedExportBlock(index)).toEqual(spec.toast.namespace.namedExports);
  expect(index).toContain(
    `export type { ${spec.toast.publicApi.typeExports.join(", ")} } from "${spec.toast.publicApi.typeImportSource}";`,
  );
  expect(index).toContain(
    `export { ${spec.toast.publicApi.exportName} } from "${spec.toast.publicApi.runtimeImportSource}";`,
  );
}

function hasPrebuiltFile(files: readonly { kind: string }[]): boolean {
  return files.some((file) => file.kind === "prebuilt");
}

function readNamedExportBlock(contents: string): string[] {
  const match = contents.match(/export \{\n([\s\S]*?)\n\};/);
  if (!match) {
    throw new Error("Expected generated index to contain a named export block.");
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(Boolean);
}

function readGeneratedPackageBody(packageSourceDirectory: string, path: string): string {
  return normalizeGeneratedPackageBody(
    readFileSync(join(process.cwd(), packageSourceDirectory, path), "utf8"),
  );
}

function normalizeGeneratedPackageBody(contents: string): string {
  return contents
    .replace(/\r\n/g, "\n")
    .replace(
      /^---\n\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n/,
      "---\n",
    )
    .replace(
      /\n\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n/g,
      "\n",
    )
    .replace(
      /^\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n\n/,
      "",
    )
    .replace(
      /^\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-react-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n\n/,
      "",
    )
    .replace(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n',
      "",
    )
    .replace(/\bReact\.useLayoutEffect\(/g, "React.useEffect(")
    .replace(/\buseIsomorphicLayoutEffect\(/g, "React.useEffect(");
}

const prettierConfigCache = new Map<string, Awaited<ReturnType<typeof resolveConfig>>>();

async function formatGeneratedOutput(contents: string, filepath: string): Promise<string> {
  if (filepath.endsWith(".astro")) {
    contents = normalizeAstroPrimitiveOutput(basename(filepath), contents);
  } else if (filepath.endsWith(".tsx")) {
    contents = applyReactRefCleanup(applyReactEffectTiming(contents));
  }
  const cacheKey = filepath.endsWith(".astro")
    ? "astro"
    : filepath.endsWith(".ts")
      ? "ts"
      : filepath;
  let config = prettierConfigCache.get(cacheKey);
  if (config === undefined) {
    config = await resolveConfig(filepath);
    prettierConfigCache.set(cacheKey, config);
  }

  return normalizeGeneratedPackageBody(await format(contents, { ...(config ?? {}), filepath }));
}
