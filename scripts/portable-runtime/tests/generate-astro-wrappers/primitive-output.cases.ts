import {
  comboboxRuntimeAdapterContract,
  contextMenuRuntimeAdapterContract,
  menuRuntimeAdapterContract,
} from "../../contracts/primitive/representatives.js";
import { createAstroHeader } from "../../renderers/framework-adapters/astro/headers.js";
import { writeAstroAdapterOutput } from "../../renderers/framework-adapters/astro/primitive-output-writer.js";
import { astroFrameworkAdapterTarget } from "../../renderers/framework-adapters/index.js";
import { createTsHeader } from "../../renderers/shared.js";
import {
  buildComboboxAdapterOutputModel,
  buildComboboxSpecializedAdapterSpec,
  buildContextMenuAdapterOutputModel,
  buildContextMenuSpecializedAdapterSpec,
  buildMenuAdapterOutputModel,
  buildMenuSpecializedAdapterSpec,
  type ComboboxSpecializedAdapterSpec,
  type ContextMenuSpecializedAdapterSpec,
  type MenuSpecializedAdapterSpec,
} from "../../renderers/specialized-adapter-spec/index.js";
import type { GetTempRoot } from "./shared.js";
import {
  buttonRuntimeAdapterContract,
  expect,
  expectAttributeCount,
  generateAstroPrimitiveWrappers,
  it,
  mkdir,
  path,
  readdir,
  readFormattedGeneratedTree,
  readGeneratedFile,
  readGeneratedTree,
  removedAttr,
  writeFile,
} from "./shared.js";

async function writeAstroComboboxSpecializedAdapterSpec(
  outputRoot: string,
  spec: ComboboxSpecializedAdapterSpec,
  astroHeader: string,
  tsHeader: string,
): Promise<void> {
  const outputModel = astroFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(
    buildComboboxAdapterOutputModel(spec),
  );

  await writeAstroAdapterOutput({
    astroHeader,
    componentName: "Combobox",
    outputModel,
    outputRoot,
    tsHeader,
  });
}

async function writeAstroMenuSpecializedAdapterSpec(
  outputRoot: string,
  spec: MenuSpecializedAdapterSpec,
  astroHeader: string,
  tsHeader: string,
): Promise<void> {
  const outputModel = astroFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(
    buildMenuAdapterOutputModel(spec),
  );

  await writeAstroAdapterOutput({
    astroHeader,
    componentName: "Menu",
    outputModel,
    outputRoot,
    tsHeader,
  });
}

async function writeAstroContextMenuSpecializedAdapterSpec(
  outputRoot: string,
  spec: ContextMenuSpecializedAdapterSpec,
  astroHeader: string,
  tsHeader: string,
): Promise<void> {
  const outputModel = astroFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(
    buildContextMenuAdapterOutputModel(spec),
  );

  await writeAstroAdapterOutput({
    astroHeader,
    componentName: "Context Menu",
    outputModel,
    outputRoot,
    tsHeader,
  });
}

export function defineAstroPrimitiveOutputTests(getTempRoot: GetTempRoot): void {
  it("generates unstyled Astro primitive wrappers for framework-level runtime parts", async () => {
    const tempRoot = getTempRoot();
    const staleBadgeDir = path.join(tempRoot, "generated/primitives/astro/badge");
    await mkdir(staleBadgeDir, { recursive: true });
    await writeFile(path.join(staleBadgeDir, "BadgeRoot.astro"), "stale primitive");

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const rootIndex = await readGeneratedFile(outputRoot, "index.ts");
    const themeInitScript = await readGeneratedFile(outputRoot, "theme/ThemeInitScript.astro");
    const themeIndex = await readGeneratedFile(outputRoot, "theme/index.ts");
    const buttonRoot = await readGeneratedFile(outputRoot, "button/ButtonRoot.astro");
    const accordionRoot = await readGeneratedFile(outputRoot, "accordion/AccordionRoot.astro");
    const accordionItem = await readGeneratedFile(outputRoot, "accordion/AccordionItem.astro");
    const accordionHeader = await readGeneratedFile(outputRoot, "accordion/AccordionHeader.astro");
    const accordionPanel = await readGeneratedFile(outputRoot, "accordion/AccordionPanel.astro");
    const accordionIndex = await readGeneratedFile(outputRoot, "accordion/index.ts");
    const collapsibleRoot = await readGeneratedFile(
      outputRoot,
      "collapsible/CollapsibleRoot.astro",
    );
    const collapsibleTrigger = await readGeneratedFile(
      outputRoot,
      "collapsible/CollapsibleTrigger.astro",
    );
    const collapsiblePanel = await readGeneratedFile(
      outputRoot,
      "collapsible/CollapsiblePanel.astro",
    );
    const collapsibleIndex = await readGeneratedFile(outputRoot, "collapsible/index.ts");
    const contextMenuRoot = await readGeneratedFile(
      outputRoot,
      "context-menu/ContextMenuRoot.astro",
    );
    const contextMenuTrigger = await readGeneratedFile(
      outputRoot,
      "context-menu/ContextMenuTrigger.astro",
    );
    const contextMenuIndex = await readGeneratedFile(outputRoot, "context-menu/index.ts");
    const dialogBackdrop = await readGeneratedFile(outputRoot, "dialog/DialogBackdrop.astro");
    const dialogRoot = await readGeneratedFile(outputRoot, "dialog/DialogRoot.astro");
    const dialogTrigger = await readGeneratedFile(outputRoot, "dialog/DialogTrigger.astro");
    const dialogPopup = await readGeneratedFile(outputRoot, "dialog/DialogPopup.astro");
    const dialogTitle = await readGeneratedFile(outputRoot, "dialog/DialogTitle.astro");
    const dialogIndex = await readGeneratedFile(outputRoot, "dialog/index.ts");
    const drawerRoot = await readGeneratedFile(outputRoot, "drawer/DrawerRoot.astro");
    const drawerTrigger = await readGeneratedFile(outputRoot, "drawer/DrawerTrigger.astro");
    const drawerPopup = await readGeneratedFile(outputRoot, "drawer/DrawerPopup.astro");
    const drawerClose = await readGeneratedFile(outputRoot, "drawer/DrawerClose.astro");
    const drawerIndex = await readGeneratedFile(outputRoot, "drawer/index.ts");
    const dropzoneRoot = await readGeneratedFile(outputRoot, "dropzone/DropzoneRoot.astro");
    const fieldRoot = await readGeneratedFile(outputRoot, "field/FieldRoot.astro");
    const fieldLabel = await readGeneratedFile(outputRoot, "field/FieldLabel.astro");
    const fieldControl = await readGeneratedFile(outputRoot, "field/FieldControl.astro");
    const fieldDescription = await readGeneratedFile(outputRoot, "field/FieldDescription.astro");
    const fieldError = await readGeneratedFile(outputRoot, "field/FieldError.astro");
    const fieldItem = await readGeneratedFile(outputRoot, "field/FieldItem.astro");
    const fieldValidity = await readGeneratedFile(outputRoot, "field/FieldValidity.astro");
    const fieldIndex = await readGeneratedFile(outputRoot, "field/index.ts");
    const fieldsetRoot = await readGeneratedFile(outputRoot, "fieldset/FieldsetRoot.astro");
    const fieldsetLegend = await readGeneratedFile(outputRoot, "fieldset/FieldsetLegend.astro");
    const fieldsetIndex = await readGeneratedFile(outputRoot, "fieldset/index.ts");
    const formRoot = await readGeneratedFile(outputRoot, "form/FormRoot.astro");
    const formErrorSummary = await readGeneratedFile(outputRoot, "form/FormErrorSummary.astro");
    const formIndex = await readGeneratedFile(outputRoot, "form/index.ts");
    const popoverRoot = await readGeneratedFile(outputRoot, "popover/PopoverRoot.astro");
    const popoverTrigger = await readGeneratedFile(outputRoot, "popover/PopoverTrigger.astro");
    const popoverPositioner = await readGeneratedFile(
      outputRoot,
      "popover/PopoverPositioner.astro",
    );
    const popoverPopup = await readGeneratedFile(outputRoot, "popover/PopoverPopup.astro");
    const popoverClose = await readGeneratedFile(outputRoot, "popover/PopoverClose.astro");
    const popoverPortal = await readGeneratedFile(outputRoot, "popover/PopoverPortal.astro");
    const popoverIndex = await readGeneratedFile(outputRoot, "popover/index.ts");
    const previewCardTrigger = await readGeneratedFile(
      outputRoot,
      "preview-card/PreviewCardTrigger.astro",
    );
    const alertDialogRoot = await readGeneratedFile(
      outputRoot,
      "alert-dialog/AlertDialogRoot.astro",
    );
    const alertDialogTrigger = await readGeneratedFile(
      outputRoot,
      "alert-dialog/AlertDialogTrigger.astro",
    );
    const alertDialogPopup = await readGeneratedFile(
      outputRoot,
      "alert-dialog/AlertDialogPopup.astro",
    );
    const alertDialogClose = await readGeneratedFile(
      outputRoot,
      "alert-dialog/AlertDialogClose.astro",
    );
    const alertDialogIndex = await readGeneratedFile(outputRoot, "alert-dialog/index.ts");
    const avatarRoot = await readGeneratedFile(outputRoot, "avatar/AvatarRoot.astro");
    const avatarImage = await readGeneratedFile(outputRoot, "avatar/AvatarImage.astro");
    const avatarFallback = await readGeneratedFile(outputRoot, "avatar/AvatarFallback.astro");
    const avatarIndex = await readGeneratedFile(outputRoot, "avatar/index.ts");
    const checkboxRoot = await readGeneratedFile(outputRoot, "checkbox/CheckboxRoot.astro");
    const checkboxIndicator = await readGeneratedFile(
      outputRoot,
      "checkbox/CheckboxIndicator.astro",
    );
    const checkboxIndex = await readGeneratedFile(outputRoot, "checkbox/index.ts");
    const checkboxGroupRoot = await readGeneratedFile(
      outputRoot,
      "checkbox-group/CheckboxGroupRoot.astro",
    );
    const checkboxGroupIndex = await readGeneratedFile(outputRoot, "checkbox-group/index.ts");
    const radioRoot = await readGeneratedFile(outputRoot, "radio/RadioRoot.astro");
    const radioIndicator = await readGeneratedFile(outputRoot, "radio/RadioIndicator.astro");
    const radioIndex = await readGeneratedFile(outputRoot, "radio/index.ts");
    const radioGroupRoot = await readGeneratedFile(outputRoot, "radio-group/RadioGroupRoot.astro");
    const radioGroupIndex = await readGeneratedFile(outputRoot, "radio-group/index.ts");
    const inputRoot = await readGeneratedFile(outputRoot, "input/InputRoot.astro");
    const inputIndex = await readGeneratedFile(outputRoot, "input/index.ts");
    const inputOtpRoot = await readGeneratedFile(outputRoot, "input-otp/InputOtpRoot.astro");
    const inputOtpGroup = await readGeneratedFile(outputRoot, "input-otp/InputOtpGroup.astro");
    const inputOtpSlot = await readGeneratedFile(outputRoot, "input-otp/InputOtpSlot.astro");
    const inputOtpSeparator = await readGeneratedFile(
      outputRoot,
      "input-otp/InputOtpSeparator.astro",
    );
    const inputOtpIndex = await readGeneratedFile(outputRoot, "input-otp/index.ts");
    const progressRoot = await readGeneratedFile(outputRoot, "progress/ProgressRoot.astro");
    const progressTrack = await readGeneratedFile(outputRoot, "progress/ProgressTrack.astro");
    const progressIndicator = await readGeneratedFile(
      outputRoot,
      "progress/ProgressIndicator.astro",
    );
    const progressValue = await readGeneratedFile(outputRoot, "progress/ProgressValue.astro");
    const progressLabel = await readGeneratedFile(outputRoot, "progress/ProgressLabel.astro");
    const progressIndex = await readGeneratedFile(outputRoot, "progress/index.ts");
    const menuRoot = await readGeneratedFile(outputRoot, "menu/MenuRoot.astro");
    const menuTrigger = await readGeneratedFile(outputRoot, "menu/MenuTrigger.astro");
    const menuItem = await readGeneratedFile(outputRoot, "menu/MenuItem.astro");
    const menuLinkItem = await readGeneratedFile(outputRoot, "menu/MenuLinkItem.astro");
    const menuCheckboxItem = await readGeneratedFile(outputRoot, "menu/MenuCheckboxItem.astro");
    const menuSubmenuTrigger = await readGeneratedFile(outputRoot, "menu/MenuSubmenuTrigger.astro");
    const navigationMenuRoot = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuRoot.astro",
    );
    const navigationMenuTrigger = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuTrigger.astro",
    );
    const navigationMenuLink = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuLink.astro",
    );
    const navigationMenuPositioner = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuPositioner.astro",
    );
    const navigationMenuPopup = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuPopup.astro",
    );
    const navigationMenuViewport = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuViewport.astro",
    );
    const navigationMenuIndex = await readGeneratedFile(outputRoot, "navigation-menu/index.ts");
    const tooltipRoot = await readGeneratedFile(outputRoot, "tooltip/TooltipRoot.astro");
    const tooltipTrigger = await readGeneratedFile(outputRoot, "tooltip/TooltipTrigger.astro");
    const tooltipPopup = await readGeneratedFile(outputRoot, "tooltip/TooltipPopup.astro");
    const sliderRoot = await readGeneratedFile(outputRoot, "slider/SliderRoot.astro");
    const sliderControl = await readGeneratedFile(outputRoot, "slider/SliderControl.astro");
    const sliderTrack = await readGeneratedFile(outputRoot, "slider/SliderTrack.astro");
    const sliderIndicator = await readGeneratedFile(outputRoot, "slider/SliderIndicator.astro");
    const sliderLabel = await readGeneratedFile(outputRoot, "slider/SliderLabel.astro");
    const sliderThumb = await readGeneratedFile(outputRoot, "slider/SliderThumb.astro");
    const sliderIndex = await readGeneratedFile(outputRoot, "slider/index.ts");
    const scrollAreaRoot = await readGeneratedFile(outputRoot, "scroll-area/ScrollAreaRoot.astro");
    const scrollAreaViewport = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaViewport.astro",
    );
    const scrollAreaContent = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaContent.astro",
    );
    const scrollAreaScrollbar = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaScrollbar.astro",
    );
    const scrollAreaThumb = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaThumb.astro",
    );
    const scrollAreaCorner = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaCorner.astro",
    );
    const scrollAreaIndex = await readGeneratedFile(outputRoot, "scroll-area/index.ts");
    const selectRoot = await readGeneratedFile(outputRoot, "select/SelectRoot.astro");
    const selectTrigger = await readGeneratedFile(outputRoot, "select/SelectTrigger.astro");
    const selectValue = await readGeneratedFile(outputRoot, "select/SelectValue.astro");
    const selectPositioner = await readGeneratedFile(outputRoot, "select/SelectPositioner.astro");
    const selectPopup = await readGeneratedFile(outputRoot, "select/SelectPopup.astro");
    const selectItem = await readGeneratedFile(outputRoot, "select/SelectItem.astro");
    const selectItemIndicator = await readGeneratedFile(
      outputRoot,
      "select/SelectItemIndicator.astro",
    );
    const selectIndex = await readGeneratedFile(outputRoot, "select/index.ts");
    const sidebarProvider = await readGeneratedFile(outputRoot, "sidebar/SidebarProvider.astro");
    const sidebar = await readGeneratedFile(outputRoot, "sidebar/Sidebar.astro");
    const sidebarTrigger = await readGeneratedFile(outputRoot, "sidebar/SidebarTrigger.astro");
    const sidebarRail = await readGeneratedFile(outputRoot, "sidebar/SidebarRail.astro");
    const sidebarMenuButton = await readGeneratedFile(
      outputRoot,
      "sidebar/SidebarMenuButton.astro",
    );
    const sidebarIndex = await readGeneratedFile(outputRoot, "sidebar/index.ts");
    const comboboxRoot = await readGeneratedFile(outputRoot, "combobox/ComboboxRoot.astro");
    const comboboxInput = await readGeneratedFile(outputRoot, "combobox/ComboboxInput.astro");
    const comboboxTrigger = await readGeneratedFile(outputRoot, "combobox/ComboboxTrigger.astro");
    const comboboxClear = await readGeneratedFile(outputRoot, "combobox/ComboboxClear.astro");
    const comboboxValue = await readGeneratedFile(outputRoot, "combobox/ComboboxValue.astro");
    const comboboxPopup = await readGeneratedFile(outputRoot, "combobox/ComboboxPopup.astro");
    const comboboxItem = await readGeneratedFile(outputRoot, "combobox/ComboboxItem.astro");
    const comboboxIndex = await readGeneratedFile(outputRoot, "combobox/index.ts");
    const toastViewport = await readGeneratedFile(outputRoot, "toast/ToastViewport.astro");
    const toastTemplate = await readGeneratedFile(outputRoot, "toast/ToastTemplate.astro");
    const toastRoot = await readGeneratedFile(outputRoot, "toast/ToastRoot.astro");
    const toastAction = await readGeneratedFile(outputRoot, "toast/ToastAction.astro");
    const toastClose = await readGeneratedFile(outputRoot, "toast/ToastClose.astro");
    const switchRoot = await readGeneratedFile(outputRoot, "switch/SwitchRoot.astro");
    const switchThumb = await readGeneratedFile(outputRoot, "switch/SwitchThumb.astro");
    const switchIndex = await readGeneratedFile(outputRoot, "switch/index.ts");
    const tabsRoot = await readGeneratedFile(outputRoot, "tabs/TabsRoot.astro");
    const tabsList = await readGeneratedFile(outputRoot, "tabs/TabsList.astro");
    const tabsTab = await readGeneratedFile(outputRoot, "tabs/TabsTab.astro");
    const tabsPanel = await readGeneratedFile(outputRoot, "tabs/TabsPanel.astro");
    const tabsIndicator = await readGeneratedFile(outputRoot, "tabs/TabsIndicator.astro");
    const tabsIndex = await readGeneratedFile(outputRoot, "tabs/index.ts");
    const toggleRoot = await readGeneratedFile(outputRoot, "toggle/ToggleRoot.astro");
    const toggleIndex = await readGeneratedFile(outputRoot, "toggle/index.ts");
    const toggleGroupRoot = await readGeneratedFile(
      outputRoot,
      "toggle-group/ToggleGroupRoot.astro",
    );
    const toggleGroupIndex = await readGeneratedFile(outputRoot, "toggle-group/index.ts");
    const astroAsChildParts = [
      collapsibleTrigger,
      popoverTrigger,
      menuTrigger,
      selectTrigger,
      comboboxTrigger,
      comboboxClear,
      navigationMenuTrigger,
      previewCardTrigger,
      sidebarTrigger,
      sidebarMenuButton,
      tooltipTrigger,
    ];
    const simpleSlottedRestPropsParts = [
      ["accordion header", accordionHeader, "data-sw-accordion-header"],
      ["dialog title", dialogTitle, "data-sw-dialog-title"],
      ["popover portal", popoverPortal, "data-sw-popover-portal"],
      ["slider track", sliderTrack, "data-sw-slider-track"],
      ["switch thumb", switchThumb, "data-sw-switch-thumb"],
    ] as const;

    astroAsChildParts.forEach((source) => {
      expect(source).toContain("asChild?: boolean;");
      expect(source).toContain("asChild ? (");
      expect(source).toContain("data-as-child");
      expect(source).not.toContain("React.cloneElement");
    });

    simpleSlottedRestPropsParts.forEach(([label, source, discoveryAttribute]) => {
      expect(source, label).toContain('import type { HTMLAttributes } from "astro/types";');
      expect(source, label).toContain("const { ...rest } = Astro.props;");
      expect(source, label).toContain(discoveryAttribute);
      expect(source, label).toContain("{...rest}");
      expect(source, label).toContain("<slot />");
    });

    expect(generatedPrimitiveEntries).toEqual([
      "accordion",
      "alert-dialog",
      "avatar",
      "button",
      "carousel",
      "checkbox",
      "checkbox-group",
      "collapsible",
      "color-picker",
      "combobox",
      "context-menu",
      "dialog",
      "drawer",
      "dropzone",
      "field",
      "fieldset",
      "form",
      "index.ts",
      "input",
      "input-otp",
      "internal",
      "menu",
      "navigation-menu",
      "popover",
      "preview-card",
      "progress",
      "radio",
      "radio-group",
      "scroll-area",
      "select",
      "sidebar",
      "slider",
      "switch",
      "tabs",
      "theme",
      "toast",
      "toggle",
      "toggle-group",
      "tooltip",
    ]);

    expect(rootIndex).toContain('export * from "./accordion";');
    expect(rootIndex).toContain('export * from "./carousel";');
    expect(rootIndex).toContain('export * from "./color-picker";');
    expect(rootIndex).toContain('export * from "./select";');
    expect(rootIndex).toContain('export * from "./sidebar";');
    expect(rootIndex).toContain('export * from "./tooltip";');
    expect(rootIndex).toContain('export * from "./preview-card";');
    expect(rootIndex).toContain('export * from "./dropzone";');
    expect(rootIndex).toContain('export * from "./fieldset";');
    expect(rootIndex).toContain('export * from "./form";');
    expect(rootIndex).toContain('export * from "./navigation-menu";');
    expect(rootIndex).toContain('export * from "./theme";');
    expect(rootIndex).toContain("SelectOpenChangeDetails");
    expect(themeInitScript).toContain("import { getThemeInitScript");
    expect(themeInitScript).toContain("data-starwind-theme-init");
    expect(themeIndex).toContain("export { ThemeInitScript };");
    expect(themeIndex).toContain('from "@starwind-ui/runtime/theme"');

    expect(buttonRuntimeAdapterContract.runtime.factory).toBe("createButton");
    expect(buttonRuntimeAdapterContract.runtime.importSource).toBe("@starwind-ui/runtime/button");
    expect(buttonRoot).toContain('import { createButton } from "@starwind-ui/runtime/button"');
    expect(buttonRoot).toContain("data-sw-button");
    expect(buttonRoot).toContain('type = "button"');
    expect(buttonRoot).toContain("focusableWhenDisabled = false");
    expect(buttonRoot).toContain("data-focusable-when-disabled");
    const buttonOpeningTag = buttonRoot.slice(
      buttonRoot.indexOf("<button"),
      buttonRoot.indexOf(">\n  <slot", buttonRoot.indexOf("<button")),
    );
    expect(buttonRoot.indexOf("data-focusable-when-disabled")).toBeLessThan(
      buttonRoot.indexOf("{...rest}"),
    );
    expect(buttonOpeningTag).toContain("data-sw-button");
    expect(buttonOpeningTag.indexOf("{...rest}")).toBeLessThan(
      buttonOpeningTag.indexOf("data-sw-button"),
    );
    expect(buttonRoot).toContain('interface Props extends HTMLAttributes<"button">');
    expect(buttonRoot).toContain(
      'aria-disabled={disabled && focusableWhenDisabled ? "true" : undefined}',
    );
    expect(buttonRoot).toContain("disabled={disabled && !focusableWhenDisabled}");
    expect(buttonRoot).not.toContain('Omit<HTMLAttributes<"a">');
    expect(buttonRoot).not.toContain("href");
    expect(buttonRoot).not.toContain("nativeButton");
    expect(buttonRoot).not.toContain(removedAttr("data-sw-button", "focusable-when-disabled"));
    expect(buttonRoot).not.toContain(removedAttr("data-sw-button", "native"));
    expect(buttonRoot).not.toContain("const Tag");
    expect(buttonRoot).toContain("createButton(button)");
    expect(buttonRoot).not.toContain("tailwind-variants");

    expect(accordionRoot).toContain(
      'import { createAccordion } from "@starwind-ui/runtime/accordion"',
    );
    expect(accordionRoot).toContain("data-sw-accordion");
    expect(accordionRoot).toContain("data-type");
    expect(accordionRoot).toContain("data-default-value");
    expect(accordionRoot).toContain("data-collapsible");
    expect(accordionRoot).toContain("collapsible = true");
    expect(accordionRoot).toContain("data-collapsible={String(collapsible)}");
    expect(accordionRoot).not.toContain(removedAttr("data-sw-accordion", "type"));
    expect(accordionRoot).not.toContain(removedAttr("data-sw-accordion", "default-value"));
    expect(accordionRoot).not.toContain(removedAttr("data-sw-accordion", "collapsible"));
    expect(accordionRoot).toContain(
      'registerAstroControllerLifecycle("AccordionRoot", setupAccordions)',
    );
    expect(accordionRoot).toContain("starwind:init");
    expect(accordionItem).toContain("data-value");
    expect(accordionItem).toContain("data-disabled");
    expect(accordionItem).not.toContain(removedAttr("data-sw-accordion", "value"));
    expect(accordionItem).not.toContain(removedAttr("data-sw-accordion", "disabled"));
    expectAttributeCount(accordionItem, "data-disabled", 1);
    expect(accordionHeader).toContain("data-sw-accordion-header");
    expect(accordionPanel).toContain("data-sw-accordion-content");
    expect(accordionPanel).toContain('const panelStyle = ["animation: none", style]');
    expect(accordionPanel).toContain("style={panelStyle}");
    expect(accordionIndex).toContain("const Accordion =");
    expect(accordionIndex).toContain("Root: AccordionRoot");
    expect(accordionIndex).toContain("Panel: AccordionPanel");

    expect(collapsibleRoot).toContain(
      'import { createCollapsible } from "@starwind-ui/runtime/collapsible"',
    );
    expect(collapsibleRoot).toContain("data-sw-collapsible");
    expect(collapsibleRoot).toContain("data-default-open");
    expect(collapsibleRoot).not.toContain(removedAttr("data-sw-collapsible", "default-open"));
    expectAttributeCount(collapsibleRoot, "data-disabled", 1);
    expect(collapsibleRoot).toContain('data-state={defaultOpen ? "open" : "closed"}');
    expect(collapsibleTrigger).toContain("asChild?: boolean;");
    expect(collapsibleTrigger).toContain("asChild ? (");
    expect(collapsibleTrigger).toContain("data-as-child");
    expect(collapsibleTrigger).toContain("data-sw-collapsible-trigger");
    expect(collapsibleTrigger).toContain('aria-expanded="false"');
    expect(collapsiblePanel).toContain("data-sw-collapsible-panel");
    expect(collapsiblePanel).toContain('data-state="closed"');
    expect(collapsiblePanel).toContain("hidden");
    expect(collapsiblePanel).toContain("hiddenUntilFound?: boolean");
    expect(collapsiblePanel).toContain(
      'data-hidden-until-found={hiddenUntilFound ? "" : undefined}',
    );
    expect(collapsiblePanel).toContain('hidden={hiddenUntilFound ? "until-found" : true}');
    expect(collapsiblePanel).not.toContain("animation: none");
    expect(collapsiblePanel).not.toContain("panelStyle");
    expect(collapsibleIndex).toContain("const Collapsible =");
    expect(collapsibleIndex).toContain("Root: CollapsibleRoot");
    expect(collapsibleIndex).toContain("Panel: CollapsiblePanel");

    expect(contextMenuRoot).toContain(
      'import { createContextMenu } from "@starwind-ui/runtime/context-menu"',
    );
    expect(contextMenuRoot).toContain("data-sw-context-menu");
    expect(contextMenuRoot).toContain("data-sw-menu");
    expect(contextMenuRoot).toContain("data-default-open");
    expect(contextMenuRoot).toContain("modal?: boolean;");
    expect(contextMenuRoot).toContain("modal = true");
    expect(contextMenuRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(contextMenuRoot).not.toContain("data-open-on-hover");
    expect(contextMenuRoot).toContain(
      'registerAstroControllerLifecycle("ContextMenuRoot", setupContextMenus, destroyContextMenus)',
    );
    expect(contextMenuTrigger).toContain("data-sw-context-menu-trigger");
    expect(contextMenuTrigger).toContain("data-sw-menu-trigger");
    expect(contextMenuTrigger).toContain('aria-haspopup="menu"');
    expect(contextMenuTrigger).toContain("tabindex={disabled ? -1 : 0}");
    expect(contextMenuIndex).toContain("const ContextMenu =");
    expect(contextMenuIndex).toContain("Root: ContextMenuRoot");
    expect(contextMenuIndex).toContain("Portal: ContextMenuPortal");
    expect(contextMenuIndex).toContain("Item: ContextMenuItem");

    expect(dialogBackdrop).toContain("data-sw-dialog-overlay");
    expect(dialogRoot).toContain("data-default-open");
    expect(dialogRoot).toContain("data-close-on-escape");
    expect(dialogRoot).toContain("data-close-on-outside-interact");
    expect(dialogRoot).toContain("data-modal");
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "default-open"));
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "close-on-escape"));
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "close-on-outside-interact"));
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "modal"));
    expect(dialogPopup).toContain("<dialog");
    expect(dialogPopup).toContain("data-sw-dialog-content");
    expect(dialogTrigger).toContain('HTMLAttributes<"button"> & {');
    expect(dialogTrigger).toContain("targetId?: string;");
    expect(dialogTrigger).toContain("const { targetId, ...rest } = Astro.props;");
    expect(dialogTrigger).toContain("data-sw-dialog-target-id={targetId}");
    expect(dialogTrigger).not.toContain("data-dialog-for");
    expect(dialogIndex).toContain("const Dialog =");
    expect(dialogIndex).toContain("Root: DialogRoot");
    expect(dialogIndex).toContain("Backdrop: DialogBackdrop");
    expect(dialogIndex).toContain("Popup: DialogPopup");

    expect(alertDialogRoot).toContain(
      'import { createAlertDialog } from "@starwind-ui/runtime/alert-dialog"',
    );
    expect(alertDialogRoot).toContain("data-sw-alert-dialog");
    expect(alertDialogRoot).toContain("closeOnOutsideInteract = false");
    expect(alertDialogTrigger).toContain("data-sw-alert-dialog-trigger");
    expect(alertDialogTrigger).toContain("targetId?: string;");
    expect(alertDialogTrigger).toContain("const { targetId, ...rest } = Astro.props;");
    expect(alertDialogTrigger).toContain("data-sw-alert-dialog-target-id={targetId}");
    expect(alertDialogTrigger).not.toContain("data-dialog-for");
    expect(alertDialogTrigger).not.toContain("data-sw-dialog-trigger");
    expect(alertDialogPopup).toContain("<dialog");
    expect(alertDialogPopup).toContain("data-sw-alert-dialog-popup");
    expect(alertDialogPopup).not.toContain("data-sw-dialog-content");
    expect(alertDialogPopup).toContain('role="alertdialog"');
    expect(alertDialogClose).toContain("data-sw-alert-dialog-close");
    expect(alertDialogClose).not.toContain("data-sw-dialog-close");
    expect(alertDialogIndex).toContain("const AlertDialog =");
    expect(alertDialogIndex).toContain("Root: AlertDialogRoot");
    expect(alertDialogIndex).toContain("Popup: AlertDialogPopup");

    expect(drawerRoot).toContain('import { createDrawer } from "@starwind-ui/runtime/drawer"');
    expect(drawerRoot).toContain("data-sw-drawer");
    expect(drawerRoot).toContain("closeOnOutsideInteract = true");
    expect(drawerTrigger).toContain("data-sw-drawer-trigger");
    expect(drawerTrigger).toContain("targetId?: string;");
    expect(drawerTrigger).toContain("const { targetId, ...rest } = Astro.props;");
    expect(drawerTrigger).toContain("data-sw-drawer-target-id={targetId}");
    expect(drawerTrigger).not.toContain("data-dialog-for");
    expect(drawerTrigger).not.toContain("data-sw-dialog-trigger");
    expect(drawerPopup).toContain("<dialog");
    expect(drawerPopup).toContain("data-sw-drawer-popup");
    expect(drawerPopup).not.toContain("data-sw-dialog-content");
    expect(drawerPopup).not.toContain('role="dialog"');
    expect(drawerClose).toContain("data-sw-drawer-close");
    expect(drawerClose).not.toContain("data-sw-dialog-close");
    expect(drawerIndex).toContain("const Drawer =");
    expect(drawerIndex).toContain("Root: DrawerRoot");
    expect(drawerIndex).toContain("Popup: DrawerPopup");
    expect(dialogIndex).not.toContain("DialogContent");

    expect(dropzoneRoot).toContain("data-sw-dropzone");
    expect(dropzoneRoot).toContain('aria-disabled={disabled ? "true" : "false"}');
    expect(dropzoneRoot).toContain('data-disabled={disabled ? "" : undefined}');

    expect(fieldRoot).toContain('import { createField } from "@starwind-ui/runtime/field"');
    expect(fieldRoot).toContain("data-sw-field");
    expect(fieldRoot).toContain('data-dirty={dirty ? "" : undefined}');
    expect(fieldRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(fieldRoot).toContain('data-invalid={invalid ? "" : undefined}');
    expect(fieldRoot).toContain("data-name={name}");
    expect(fieldRoot).toContain('data-touched={touched ? "" : undefined}');
    expect(fieldRoot).toContain("validationTiming?: FormValidationTiming;");
    expect(fieldRoot).toContain("revalidationTiming?: FormValidationTiming;");
    expect(fieldRoot).toContain("errorVisibility?: FormValidationTiming;");
    expect(fieldRoot).toContain('"data-validation-timing": dataValidationTiming');
    expect(fieldRoot).toContain(
      "data-validation-timing={dataValidationTiming ?? validationTiming}",
    );
    expect(fieldRoot).toContain(
      "data-revalidation-timing={dataRevalidationTiming ?? revalidationTiming}",
    );
    expect(fieldRoot).toContain("data-error-visibility={dataErrorVisibility ?? errorVisibility}");
    expect(fieldRoot).toContain("createField(field)");
    expect(fieldLabel).toContain("data-sw-field-label");
    expect(fieldLabel).toContain("for={htmlFor}");
    expect(fieldControl).toContain("data-sw-field-control");
    expect(fieldControl).toContain("data-sw-input");
    expect(fieldDescription).toContain("data-sw-field-description");
    expect(fieldError).toContain("data-sw-field-error");
    expect(fieldError).toContain('type FieldErrorMessageSource = "children" | "validation";');
    expect(fieldError).toContain("messageSource?: FieldErrorMessageSource;");
    expect(fieldError).toContain("match = false");
    expect(fieldError).toContain("data-match={serializedMatch}");
    expect(fieldError).toContain("data-message-source={messageSource}");
    expect(fieldError).toContain("hidden={hidden}");
    expect(fieldItem).toContain("data-sw-field-item");
    expect(fieldValidity).toContain("data-sw-field-validity");
    expect(fieldValidity).toContain("match = true");
    expect(fieldValidity).toContain("data-match={serializedMatch}");
    expect(fieldValidity).toContain("hidden={hidden}");
    expect(fieldIndex).toContain("Root: FieldRoot");
    expect(fieldIndex).toContain("Error: FieldError");
    expect(fieldIndex).toContain("Validity: FieldValidity");

    expect(fieldsetRoot).toContain(
      'import { createFieldset } from "@starwind-ui/runtime/fieldset"',
    );
    expect(fieldsetRoot).toContain("data-sw-fieldset");
    expect(fieldsetRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(fieldsetRoot).toContain("createFieldset(root)");
    expect(fieldsetLegend).toContain("data-sw-fieldset-legend");
    expect(fieldsetIndex).toContain("Root: FieldsetRoot");
    expect(fieldsetIndex).toContain("Legend: FieldsetLegend");

    expect(formRoot).toContain('import { createForm } from "@starwind-ui/runtime/form"');
    expect(formRoot).toContain(
      'type FormValidationTiming = import("@starwind-ui/runtime/form").FormValidationTiming;',
    );
    expect(formRoot).toContain('interface Props extends HTMLAttributes<"form">');
    expect(formRoot).toContain("validationTiming?: FormValidationTiming;");
    expect(formRoot).toContain("revalidationTiming?: FormValidationTiming;");
    expect(formRoot).toContain("errorVisibility?: FormValidationTiming;");
    expect(formRoot).toContain('"data-validation-timing": dataValidationTiming');
    expect(formRoot).toContain("data-validation-timing={dataValidationTiming ?? validationTiming}");
    expect(formRoot).toContain(
      "data-revalidation-timing={dataRevalidationTiming ?? revalidationTiming}",
    );
    expect(formRoot).toContain("data-error-visibility={dataErrorVisibility ?? errorVisibility}");
    expect(formRoot).toContain("data-sw-form");
    expect(formRoot).toContain('data-slot="form"');
    expect(formRoot).not.toContain("novalidate");
    expect(formRoot).not.toContain("noValidate");
    expect(formRoot).toContain('getInitCandidates(event, "[data-sw-form]")');
    expect(formRoot).toContain("createForm(form)");
    expect(formRoot).toContain("registerAstroControllerLifecycle");
    expect(formRoot).toContain("starwind:init");
    expect(formErrorSummary).toContain('interface Props extends HTMLAttributes<"div">');
    expect(formErrorSummary).toContain("data-sw-form-error-summary");
    expect(formErrorSummary).toContain('data-slot="form-error-summary"');
    expect(formErrorSummary).toContain('role = "status"');
    expect(formErrorSummary).toContain('"aria-live": ariaLive = "polite"');
    expect(formErrorSummary).toContain('"aria-atomic": ariaAtomic = "true"');
    expect(formErrorSummary).toContain("hidden={hidden}");
    expect(formErrorSummary).toContain("<slot />");
    expect(formIndex).toContain("Root: FormRoot");
    expect(formIndex).toContain("ErrorSummary: FormErrorSummary");
    expect(formIndex).toContain("FormErrorSummary");

    expect(popoverRoot).toContain('import { createPopover } from "@starwind-ui/runtime/popover"');
    expect(popoverRoot).toContain("data-sw-popover");
    expect(popoverRoot).toContain("modal?: boolean");
    expect(popoverRoot).toContain("modal = false");
    expect(popoverRoot).toContain("data-default-open");
    expect(popoverRoot).toContain("data-modal");
    expect(popoverRoot).toContain("data-open-on-hover");
    expect(popoverRoot).toContain("data-close-on-escape");
    expect(popoverRoot).toContain("data-close-on-outside-interact");
    expect(popoverTrigger).toContain("asChild?: boolean;");
    expect(popoverTrigger).toContain("asChild ? (");
    expect(popoverTrigger).toContain("data-as-child");
    expect(popoverTrigger).toContain("data-sw-popover-trigger");
    expect(popoverTrigger).toContain('aria-haspopup="dialog"');
    expect(popoverPositioner).toContain("data-sw-popover-positioner");
    expect(popoverPositioner).toContain("data-side={side}");
    expect(popoverPopup).toContain("data-sw-popover-popup");
    expect(popoverPopup).toContain("data-side={side}");
    expect(popoverPopup).toContain("data-align={align}");
    expect(popoverPopup).toContain("data-side-offset={sideOffset}");
    expect(popoverPopup).toContain('role="dialog"');
    expect(popoverClose).toContain("data-sw-popover-close");
    expect(popoverIndex).toContain("const Popover =");
    expect(popoverIndex).toContain("Root: PopoverRoot");
    expect(popoverIndex).toContain("Positioner: PopoverPositioner");
    expect(popoverIndex).toContain("Popup: PopoverPopup");

    expect(avatarRoot).toContain('import { createAvatar } from "@starwind-ui/runtime/avatar"');
    expect(avatarRoot).toContain("<span");
    expect(avatarRoot).toContain("data-sw-avatar");
    expect(avatarRoot).toContain("data-image-loading-status");
    expect(avatarRoot).toContain("createAvatar(root)");
    expect(avatarRoot).toContain("registerAstroControllerLifecycle");
    expect(avatarRoot).toContain("starwind:init");
    expect(avatarImage).toContain('import { Image } from "astro:assets"');
    expect(avatarImage).toContain('type Props = HTMLAttributes<"img"> & {');
    expect(avatarImage).toContain("alt: string;");
    expect(avatarImage).toContain("image?: ImageMetadata;");
    expect(avatarImage).toContain("src?: string;");
    expect(avatarImage).toContain(
      "const { src, image, alt, width, height, ...rest } = Astro.props;",
    );
    expect(avatarImage).toContain("data-sw-avatar-image");
    expect(avatarImage).toContain("hidden");
    expect(avatarFallback).toContain("delay?: number");
    expect(avatarFallback).toContain("data-sw-avatar-fallback");
    expect(avatarFallback).toContain("data-delay");
    expect(avatarFallback).not.toContain(removedAttr("data-sw-avatar-fallback", "delay"));
    expect(avatarIndex).toContain("Root: AvatarRoot");
    expect(avatarIndex).toContain("Image: AvatarImage");
    expect(avatarIndex).toContain("Fallback: AvatarFallback");

    expect(checkboxRoot).toContain(
      'import { createCheckbox } from "@starwind-ui/runtime/checkbox"',
    );
    expect(checkboxRoot).toContain(
      'interface Props extends Omit<HTMLAttributes<"span">, "aria-checked">',
    );
    expect(checkboxRoot).toContain("data-sw-checkbox");
    expect(checkboxRoot).toContain(`<Tag
  {...rest}
  data-sw-checkbox`);
    expect(checkboxRoot).toContain("data-default-checked");
    expect(checkboxRoot).toContain("data-form");
    expect(checkboxRoot).toContain("data-id");
    expect(checkboxRoot).toContain("data-name");
    expect(checkboxRoot).toContain("data-unchecked-value");
    expect(checkboxRoot).toContain("data-value");
    expect(checkboxRoot).toContain("data-disabled");
    expect(checkboxRoot).toContain("data-indeterminate");
    expect(checkboxRoot).toContain("data-readonly");
    expect(checkboxRoot).toContain("data-required");
    expectAttributeCount(checkboxRoot, "data-disabled", 1);
    expectAttributeCount(checkboxRoot, "data-indeterminate", 1);
    expectAttributeCount(checkboxRoot, "data-readonly", 1);
    expectAttributeCount(checkboxRoot, "data-required", 1);
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "default-checked"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "form"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "id"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "name"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "unchecked-value"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "value"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "disabled"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "indeterminate"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "readonly"));
    expect(checkboxRoot).not.toContain(removedAttr("data-sw-checkbox", "required"));
    expect(checkboxRoot).toContain("data-sw-checkbox-input");
    expect(checkboxRoot).toContain("<input data-sw-checkbox-input hidden />");
    expect(checkboxRoot).toContain("createCheckbox(root)");
    expect(checkboxRoot).toContain("aria-checked");
    expect(checkboxRoot).toContain(
      'const ariaChecked = indeterminate ? "mixed" : initialChecked ? "true" : "false";',
    );
    expect(checkboxIndicator).toContain("keepMounted?: boolean");
    expect(checkboxIndicator).toContain("data-sw-checkbox-indicator");
    expect(checkboxIndicator).toContain("data-keep-mounted");
    expect(checkboxIndicator).not.toContain(
      removedAttr("data-sw-checkbox-indicator", "keep-mounted"),
    );
    expect(checkboxIndex).toContain("Root: CheckboxRoot");
    expect(checkboxIndex).toContain("Indicator: CheckboxIndicator");

    expect(checkboxGroupRoot).toContain(
      'import { createCheckboxGroup } from "@starwind-ui/runtime/checkbox-group"',
    );
    expect(checkboxGroupRoot).toContain("defaultValue?: string[]");
    expect(checkboxGroupRoot).toContain("data-sw-checkbox-group");
    expect(checkboxGroupRoot).toContain("data-default-value");
    expect(checkboxGroupRoot).toContain("data-disabled");
    expect(checkboxGroupRoot).toContain("data-value");
    expectAttributeCount(checkboxGroupRoot, "data-disabled", 1);
    expect(checkboxGroupRoot).not.toContain(removedAttr("data-sw-checkbox-group", "default-value"));
    expect(checkboxGroupRoot).not.toContain(removedAttr("data-sw-checkbox-group", "disabled"));
    expect(checkboxGroupRoot).not.toContain(removedAttr("data-sw-checkbox-group", "value"));
    expect(checkboxGroupRoot).toContain("JSON.stringify(defaultValue)");
    expect(checkboxGroupRoot).toContain("createCheckboxGroup(root)");
    expect(checkboxGroupRoot).toContain('role="group"');
    expect(checkboxGroupRoot).toContain("registerAstroControllerLifecycle");
    expect(checkboxGroupRoot).toContain("starwind:init");
    expect(checkboxGroupIndex).toContain("Root: CheckboxGroupRoot");

    expect(radioRoot).toContain('import { createRadio } from "@starwind-ui/runtime/radio"');
    expect(radioRoot).toContain('interface Props extends Omit<HTMLAttributes<"span">');
    expect(radioRoot).toContain("data-sw-radio");
    expect(radioRoot).toContain(`<button
        {...rest}
        data-sw-radio`);
    expect(radioRoot).toContain(`<span
      {...rest}
      data-sw-radio`);
    expect(radioRoot).toContain("data-sw-radio-input");
    expect(radioRoot).toContain("<input data-sw-radio-input hidden />");
    expect(radioRoot).toContain("data-default-checked");
    expect(radioRoot).toContain('role="radio"');
    expect(radioRoot).not.toContain("aria-readonly");
    expect(radioRoot).not.toContain("aria-required");
    expect(radioRoot).toContain("data-readonly");
    expect(radioRoot).toContain("data-required");
    expect(radioRoot).toContain("id={id}");
    expect(radioRoot).toContain("<input data-sw-radio-input id={id} hidden />");
    expect(radioRoot).toContain("createRadio(root)");
    expect(radioIndicator).toContain("data-sw-radio-indicator");
    expect(radioIndicator).toContain("data-keep-mounted");
    expect(radioIndex).toContain("Root: RadioRoot");
    expect(radioIndex).toContain("Indicator: RadioIndicator");

    expect(radioGroupRoot).toContain(
      'import { createRadioGroup } from "@starwind-ui/runtime/radio-group"',
    );
    expect(radioGroupRoot).toContain("defaultValue?: string");
    expect(radioGroupRoot).toContain("data-sw-radio-group");
    expect(radioGroupRoot).toContain("data-default-value");
    expect(radioGroupRoot).toContain("data-orientation");
    expect(radioGroupRoot).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(radioGroupRoot).toContain("aria-orientation={orientation}");
    expect(radioGroupRoot).toContain('aria-readonly={readOnly ? "true" : undefined}');
    expect(radioGroupRoot).toContain('aria-required={required ? "true" : undefined}');
    expect(radioGroupRoot).toContain("data-form");
    expect(radioGroupRoot).toContain("data-name");
    expect(radioGroupRoot).toContain("data-readonly");
    expect(radioGroupRoot).toContain("data-required");
    expect(radioGroupRoot).toContain('role="radiogroup"');
    expect(radioGroupRoot).toContain("createRadioGroup(root)");
    expect(radioGroupRoot).toContain("registerAstroControllerLifecycle");
    expect(radioGroupRoot).toContain("starwind:init");
    expect(radioGroupIndex).toContain("Root: RadioGroupRoot");

    expect(inputRoot).toContain('import { createInput } from "@starwind-ui/runtime/input"');
    expect(inputRoot).toContain('import type { InputValue } from "@starwind-ui/runtime/input";');
    expect(inputRoot).toContain("data-sw-input");
    expect(inputRoot).toContain("value={value ?? defaultValue}");
    expect(inputRoot).toContain("disabled={disabled}");
    expect(inputRoot).toContain("createInput(input)");
    expect(inputIndex).toContain("const Input =");
    expect(inputIndex).toContain("Root: InputRoot");

    expect(inputOtpRoot).toContain(
      'import { createInputOtp } from "@starwind-ui/runtime/input-otp"',
    );
    expect(inputOtpRoot).toContain("data-sw-input-otp");
    expect(inputOtpRoot).toContain("data-sw-input-otp-input");
    expect(inputOtpRoot).toContain("data-default-value");
    expect(inputOtpRoot).toContain("data-max-length");
    expect(inputOtpRoot).toContain("data-pattern");
    expect(inputOtpRoot).toContain('autocomplete="one-time-code"');
    expect(inputOtpRoot).toContain("inputmode={inputMode}");
    expect(inputOtpRoot).toContain("createInputOtp(root)");
    expect(inputOtpRoot).toContain("registerAstroControllerLifecycle");
    expect(inputOtpRoot).toContain("starwind:init");
    expect(inputOtpGroup).toContain("data-sw-input-otp-group");
    expect(inputOtpSlot).toContain("data-sw-input-otp-slot");
    expect(inputOtpSlot).toContain("data-sw-input-otp-char");
    expect(inputOtpSlot).toContain("data-sw-input-otp-caret");
    expect(inputOtpSlot).toContain('slot name="caret"');
    expect(inputOtpSeparator).toContain("data-sw-input-otp-separator");
    expect(inputOtpIndex).toContain("Root: InputOtpRoot");
    expect(inputOtpIndex).toContain("Slot: InputOtpSlot");

    expect(progressRoot).toContain(
      'import { createProgress } from "@starwind-ui/runtime/progress"',
    );
    expect(progressRoot).toContain('type Props = Omit<HTMLAttributes<"div">, "value"> & {');
    expect(progressRoot).toContain("max?: number;");
    expect(progressRoot).toContain("min?: number;");
    expect(progressRoot).toContain("value?: number | null;");
    expect(progressRoot).toContain("data-sw-progress");
    expect(progressRoot).toContain("data-value={isIndeterminate ? undefined : value}");
    expect(progressRoot).toContain("data-min={min}");
    expect(progressRoot).toContain("data-max={max}");
    expect(progressRoot).toContain('data-indeterminate={isIndeterminate ? "" : undefined}');
    expect(progressRoot).toContain('role="progressbar"');
    expect(progressRoot).toContain("createProgress(root)");
    expect(progressRoot).toContain("registerAstroControllerLifecycle");
    expect(progressRoot).toContain("starwind:init");
    expect(progressTrack).toContain("data-sw-progress-track");
    expect(progressIndicator).toContain("data-sw-progress-indicator");
    expect(progressValue).toContain("data-sw-progress-value");
    expect(progressValue).toContain('aria-hidden="true"');
    expect(progressValue).toContain("data-preserve-text");
    expect(progressLabel).toContain("data-sw-progress-label");
    expect(progressLabel).toContain('role="presentation"');
    expect(progressIndex).toContain("Root: ProgressRoot");
    expect(progressIndex).toContain("Indicator: ProgressIndicator");
    expect(progressIndex).toContain("Value: ProgressValue");

    expect(menuRoot).toContain('if (root.hasAttribute("data-sw-context-menu")) return;');
    expect(menuRoot).toContain("modal?: boolean;");
    expect(menuRoot).toContain("modal = false");
    expect(menuRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(menuRoot).toContain("const menuInstances = new Set<ReturnType<typeof createMenu>>();");
    expect(menuRoot).toContain("createMenu(root)");
    expect(menuRoot).toContain(
      'registerAstroControllerLifecycle("MenuRoot", setupMenus, destroyMenus)',
    );
    expect(menuTrigger).toContain("asChild?: boolean;");
    expect(menuTrigger).toContain("asChild ? (");
    expect(menuTrigger).toContain("data-as-child");
    expect(menuTrigger).toContain("data-sw-menu-trigger");
    expect(menuItem).toContain('tabindex="0"');
    expect(menuItem).toContain("closeOnClick?: boolean;");
    expect(menuItem).toContain("closeOnClick = true");
    expect(menuItem).toContain('data-close-on-click={closeOnClick ? undefined : "false"}');
    expect(menuLinkItem).toContain('tabindex="0"');
    expect(menuLinkItem).toContain("closeOnClick?: boolean;");
    expect(menuLinkItem).toContain("closeOnClick = false");
    expect(menuLinkItem).toContain('data-close-on-click={closeOnClick ? "true" : undefined}');
    expect(menuCheckboxItem).toContain('tabindex="0"');
    expect(menuSubmenuTrigger).toContain('tabindex="0"');
    expect(navigationMenuRoot).toContain(
      'import { createNavigationMenu } from "@starwind-ui/runtime/navigation-menu"',
    );
    expect(navigationMenuRoot).toContain("data-sw-nav-menu");
    expect(navigationMenuRoot).toContain("value?: string | null;");
    expect(navigationMenuRoot).toContain("data-value={value ?? undefined}");
    expect(navigationMenuRoot).toContain('data-controlled-value={value === null ? "" : undefined}');
    expect(navigationMenuRoot).toContain("data-default-value");
    expect(navigationMenuRoot).toContain(
      "data-default-value={value === undefined ? (defaultValue ?? undefined) : undefined}",
    );
    expect(navigationMenuRoot).toContain(
      "const initialValue = value === undefined ? defaultValue : value",
    );
    expect(navigationMenuRoot).toContain("openDelay = 50");
    expect(navigationMenuRoot).toContain("closeDelay = 50");
    expect(navigationMenuRoot).toContain("data-open-delay={openDelay}");
    expect(navigationMenuRoot).toContain("data-close-delay={closeDelay}");
    expect(navigationMenuRoot).toContain("data-close-on-escape");
    expect(navigationMenuRoot).toContain("data-close-on-outside-interact");
    expect(navigationMenuRoot).toContain(
      "const navigationMenuInstances = new Set<ReturnType<typeof createNavigationMenu>>();",
    );
    expect(navigationMenuRoot).toContain("registerAstroControllerLifecycle(");
    expect(navigationMenuRoot).toContain('"NavigationMenuRoot"');
    expect(navigationMenuRoot).toContain("destroyNavigationMenus");
    expect(navigationMenuTrigger).toContain("asChild?: boolean;");
    expect(navigationMenuTrigger).toContain("openDelay?: number;");
    expect(navigationMenuTrigger).toContain("closeDelay?: number;");
    expect(navigationMenuTrigger).toContain("data-as-child");
    expect(navigationMenuTrigger).toContain("data-open-delay={openDelay}");
    expect(navigationMenuTrigger).toContain("data-close-delay={closeDelay}");
    expect(navigationMenuTrigger).toContain("data-sw-nav-menu-trigger");
    expect(navigationMenuTrigger).toContain('aria-haspopup="menu"');
    expect(navigationMenuLink).toContain("closeOnClick?: boolean;");
    expect(navigationMenuLink).toContain("closeOnClick = true");
    expect(navigationMenuLink).toContain(
      'data-close-on-click={closeOnClick ? undefined : "false"}',
    );
    expect(navigationMenuLink).toContain('aria-current={active ? "page" : undefined}');
    expect(navigationMenuPositioner).toContain("data-sw-nav-menu-positioner");
    expect(navigationMenuPositioner).toContain("data-side={side}");
    expect(navigationMenuPositioner).toContain("data-align={align}");
    expect(navigationMenuPositioner).toContain("data-side-offset={sideOffset}");
    expect(navigationMenuPositioner).toContain("data-align-offset={alignOffset}");
    expect(navigationMenuPositioner).toContain("data-avoid-collisions");
    expect(navigationMenuPopup).toContain("data-sw-nav-menu-popup");
    expect(navigationMenuPopup).toContain("hidden");
    expect(navigationMenuViewport).toContain("data-sw-nav-menu-viewport");
    expect(navigationMenuViewport).toContain("hidden");
    expect(navigationMenuIndex).toContain("Root: NavigationMenuRoot");
    expect(navigationMenuIndex).toContain("Trigger: NavigationMenuTrigger");
    expect(navigationMenuIndex).toContain("Viewport: NavigationMenuViewport");
    expect(navigationMenuIndex).toContain("Arrow: NavigationMenuArrow");

    expect(tooltipPopup).toContain('Omit<HTMLAttributes<"div">, "tabindex" | "tabIndex">');
    expect(tooltipPopup).toContain('role="tooltip"');
    expect(tooltipPopup).not.toContain("tabindex=");
    expect(tooltipRoot).toContain(
      'data-content-hoverable={!disableHoverableContent ? "true" : "false"}',
    );
    expect(tooltipRoot).toContain("openDelay = 200");
    expect(tooltipRoot).toContain("closeDelay = 200");
    expect(tooltipRoot).toContain('data-state={!disabled && defaultOpen ? "open" : "closed"}');
    expect(tooltipTrigger).toContain("asChild?: boolean;");
    expect(tooltipTrigger).not.toContain("openDelay");
    expect(tooltipTrigger).not.toContain("closeDelay");
    expect(tooltipTrigger).not.toContain("data-open-delay");
    expect(tooltipTrigger).not.toContain("data-close-delay");

    expect(sliderRoot).toContain('import { createSlider } from "@starwind-ui/runtime/slider"');
    expect(sliderRoot).toContain("type SliderValue = number | number[]");
    expect(sliderRoot).toContain("data-sw-slider");
    expect(sliderRoot).toContain("data-default-value");
    expect(sliderRoot).toContain("data-form");
    expect(sliderRoot).toContain("data-min");
    expect(sliderRoot).toContain("data-min-steps-between-values");
    expect(sliderRoot).toContain("data-max");
    expect(sliderRoot).toContain("data-step");
    expect(sliderRoot).toContain("data-large-step");
    expect(sliderRoot).toContain("data-orientation");
    expect(sliderRoot).toContain("data-value");
    expect(sliderRoot).toContain("createSlider(root)");

    expect(scrollAreaRoot).toContain(
      'import { createScrollArea } from "@starwind-ui/runtime/scroll-area"',
    );
    expect(scrollAreaRoot).toContain("data-sw-scroll-area");
    expect(scrollAreaRoot).toContain("type ScrollAreaOverflowEdgeThreshold =");
    expect(scrollAreaRoot).toContain("Partial<{");
    expect(scrollAreaRoot).toContain("xStart: number");
    expect(scrollAreaRoot).toContain(
      "const thresholdAttributes = getOverflowEdgeThresholdAttributes",
    );
    expect(scrollAreaRoot).toContain("data-overflow-edge-threshold={thresholdAttributes.shared}");
    expect(scrollAreaRoot).toContain(
      "data-overflow-edge-threshold-x-start={thresholdAttributes.xStart}",
    );
    expect(scrollAreaRoot).toContain(
      "data-overflow-edge-threshold-y-end={thresholdAttributes.yEnd}",
    );
    expect(scrollAreaRoot).toContain('"xStart" in threshold');
    expect(scrollAreaRoot).not.toContain("data-overflow-edge-threshold={overflowEdgeThreshold}");
    expect(scrollAreaRoot).toContain('role="presentation"');
    expect(scrollAreaRoot).toContain("createScrollArea(root)");
    expect(scrollAreaRoot).toContain("registerAstroControllerLifecycle");
    expect(scrollAreaRoot).toContain("starwind:init");
    expect(scrollAreaViewport).toContain("data-sw-scroll-area-viewport");
    expect(scrollAreaViewport).toContain('role="presentation"');
    expect(scrollAreaViewport).toContain('tabindex="-1"');
    expect(scrollAreaViewport).toContain("const { style, ...rest } = Astro.props;");
    expect(scrollAreaViewport).toContain(
      'const viewportStyle = [style, "overflow: scroll"].filter(Boolean).join("; ");',
    );
    expect(scrollAreaViewport).toContain("style={viewportStyle}");
    expect(scrollAreaContent).toContain("data-sw-scroll-area-content");
    expect(scrollAreaScrollbar).toContain("data-sw-scroll-area-scrollbar");
    expect(scrollAreaScrollbar).toContain('orientation = "vertical"');
    expect(scrollAreaScrollbar).toContain("data-orientation={orientation}");
    expect(scrollAreaScrollbar).toContain("data-keep-mounted");
    expect(scrollAreaThumb).toContain("data-sw-scroll-area-thumb");
    expect(scrollAreaCorner).toContain("data-sw-scroll-area-corner");
    expect(scrollAreaIndex).toContain("Root: ScrollAreaRoot");
    expect(scrollAreaIndex).toContain("Viewport: ScrollAreaViewport");
    expect(scrollAreaIndex).toContain("Content: ScrollAreaContent");
    expect(scrollAreaIndex).toContain("Scrollbar: ScrollAreaScrollbar");
    expect(scrollAreaIndex).toContain("Thumb: ScrollAreaThumb");
    expect(scrollAreaIndex).toContain("Corner: ScrollAreaCorner");
    expect(selectRoot).toContain('import { createSelect } from "@starwind-ui/runtime/select"');
    expect(selectRoot).toContain("data-sw-select");
    expect(selectRoot).toContain("autoComplete?: string");
    expect(selectRoot).toContain("form?: string");
    expect(selectRoot).toContain("highlightItemOnHover?: boolean");
    expect(selectRoot).toContain("modal?: boolean");
    expect(selectRoot).toContain("modal = true");
    expect(selectRoot).toContain("readOnly?: boolean");
    expect(selectRoot).toContain("data-autocomplete");
    expect(selectRoot).toContain("data-default-value");
    expect(selectRoot).toContain("data-form");
    expect(selectRoot).toContain("data-highlight-item-on-hover");
    expect(selectRoot).toContain("data-modal");
    expect(selectRoot).toContain("data-readonly");
    expect(selectRoot).toContain("data-sw-select-input");
    expect(selectRoot).toContain('type="hidden"');
    expect(selectRoot).toContain("autocomplete={autoComplete}");
    expect(selectRoot).toContain("form={form}");
    expect(selectTrigger).toContain("data-sw-select-trigger");
    expect(selectTrigger).toContain('role="combobox"');
    expect(selectTrigger).toContain("aria-controls={ariaControls}");
    expect(selectTrigger).toContain("asChild");
    expect(selectValue).toContain("data-sw-select-value");
    expect(selectValue).toContain("data-placeholder={placeholder}");
    expect(selectPositioner).toContain("alignItemWithTrigger?: boolean");
    expect(selectPositioner).toContain("alignItemWithTrigger = true");
    expect(selectPositioner).toContain(
      'data-align-item-with-trigger={alignItemWithTrigger ? "true" : "false"}',
    );
    expect(selectPositioner).not.toContain("alignItemsWithTrigger");
    expect(selectPositioner).not.toContain("data-align-items-with-trigger");
    expect(selectPopup).toContain("data-sw-select-popup");
    expect(selectPopup).toContain('role="listbox"');
    expect(selectPopup).toContain("hidden");
    expect(selectItem).toContain("data-sw-select-item");
    expect(selectItem).toContain('role="option"');
    expect(selectItem).toContain("data-value={value}");
    expect(selectItemIndicator).toContain("data-sw-select-item-indicator");
    expect(selectIndex).toContain("Root: SelectRoot");
    expect(selectIndex).toContain("Trigger: SelectTrigger");
    expect(selectIndex).toContain("ItemIndicator: SelectItemIndicator");
    expect(selectIndex).toContain(
      'export type { SelectOpenChangeDetails, SelectValueChangeDetails } from "@starwind-ui/runtime";',
    );
    expect(sidebarProvider).toContain(
      'import { createSidebarController } from "@starwind-ui/runtime/sidebar"',
    );
    expect(sidebarProvider).toContain("data-sw-sidebar-provider");
    expect(sidebarProvider).toContain("defaultMobileOpen?: boolean");
    expect(sidebarProvider).toContain("persistOpen?: boolean");
    expect(sidebarProvider).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(sidebarProvider).toContain("data-default-mobile-open");
    expect(sidebarProvider).toContain("data-persist-open");
    expect(sidebarProvider).toContain("data-persistence-storage");
    expect(sidebarProvider).toContain("createSidebarController(provider)");
    expect(sidebar).toContain("data-sw-sidebar");
    expect(sidebar).toContain("data-collapsible-mode={collapsible}");
    expect(sidebarTrigger).toContain("data-sw-sidebar-trigger");
    expect(sidebarTrigger).toContain('aria-expanded="false"');
    expect(sidebarRail).toContain("data-sw-sidebar-rail");
    expect(sidebarRail).toContain('tabindex="-1"');
    expect(sidebarMenuButton).toContain("data-sw-sidebar-menu-button");
    expect(sidebarMenuButton).toContain("data-sidebar-state");
    expect(sidebarIndex).toContain("Provider: SidebarProvider");
    expect(sidebarIndex).toContain("MenuButton: SidebarMenuButton");
    expect(sidebarIndex).toMatch(
      /export type \{\s+SidebarMobileOpenChangeDetails,\s+SidebarOpenChangeDetails,\s+SidebarPersistenceStorage,\s+\} from "@starwind-ui\/runtime";/,
    );
    expect(comboboxRoot).toContain(
      'import { createCombobox } from "@starwind-ui/runtime/combobox"',
    );
    expect(comboboxRoot).toContain("data-sw-combobox");
    expect(comboboxRoot).toContain("autoComplete?: string");
    expect(comboboxRoot).toContain('filterMode?: "contains" | "startsWith"');
    expect(comboboxRoot).toContain("form?: string");
    expect(comboboxRoot).toContain("highlightItemOnHover?: boolean");
    expect(comboboxRoot).toContain("locale?: string");
    expect(comboboxRoot).toContain("modal?: boolean");
    expect(comboboxRoot).toContain("modal = false");
    expect(comboboxRoot).toContain("readOnly?: boolean");
    expect(comboboxRoot).toContain("data-autocomplete");
    expect(comboboxRoot).toContain("data-default-input-value");
    expect(comboboxRoot).toContain("data-filter-mode");
    expect(comboboxRoot).toContain("data-form");
    expect(comboboxRoot).toContain("data-highlight-item-on-hover");
    expect(comboboxRoot).toContain("data-locale");
    expect(comboboxRoot).toContain("data-modal");
    expect(comboboxRoot).toContain("data-readonly");
    expect(comboboxRoot).toContain("data-sw-combobox-hidden-input");
    expect(comboboxRoot).toContain("form={form}");
    expect(comboboxInput).toContain("data-sw-combobox-input");
    expect(comboboxInput).toContain('role="combobox"');
    expect(comboboxInput).toContain("aria-controls={ariaControls}");
    expect(comboboxInput).toContain('aria-autocomplete="list"');
    expect(comboboxTrigger).toContain("data-sw-combobox-trigger");
    expect(comboboxTrigger).toContain("data-as-child");
    expect(comboboxClear).toContain("data-sw-combobox-clear");
    expect(comboboxValue).toContain("placeholder?: string");
    expect(comboboxValue).toContain("data-sw-combobox-value");
    expect(comboboxValue).toContain("data-placeholder={placeholder}");
    expect(comboboxPopup).toContain("data-sw-combobox-popup");
    expect(comboboxPopup).toContain('role="listbox"');
    expect(comboboxItem).toContain("data-sw-combobox-item");
    expect(comboboxItem).toContain("data-value={value}");
    expect(comboboxIndex).toContain("Root: ComboboxRoot");
    expect(comboboxIndex).toContain("InputGroup: ComboboxInputGroup");
    expect(comboboxIndex).toContain("ItemIndicator: ComboboxItemIndicator");
    expect(toastViewport).toContain(
      'import { createToastManager } from "@starwind-ui/runtime/toast"',
    );
    expect(toastViewport).toContain("data-sw-toast-viewport");
    expect(toastViewport).toContain("data-position={position}");
    expect(toastViewport).toContain("data-limit={limit}");
    expect(toastViewport).toContain("data-duration={duration}");
    expect(toastViewport).toContain('aria-live="polite"');
    expect(toastTemplate).toContain("<template data-sw-toast-template={variant}>");
    expect(toastRoot).toContain("data-sw-toast-root");
    expect(toastRoot).toContain(
      'type Variant = "default" | "error" | "info" | "loading" | "success" | "warning";',
    );
    expect(toastRoot).toContain('data-state="open"');
    expect(toastRoot).toContain("data-variant={variant}");
    expect(toastAction).toContain('<button type="button" data-sw-toast-action');
    expect(toastClose).toContain("data-sw-toast-close");
    expect(toastClose).toContain('aria-label="Close notification"');
    expect(sliderControl).toContain("data-sw-slider-control");
    expect(sliderTrack).toContain("data-sw-slider-track");
    expect(sliderIndicator).toContain("data-sw-slider-indicator");
    expect(sliderLabel).toContain("data-sw-slider-label");
    expect(sliderLabel).toContain('HTMLAttributes<"span">');
    expect(sliderThumb).toContain("data-sw-slider-thumb");
    expect(sliderThumb).toContain("data-index");
    expect(sliderThumb).not.toContain("inputName?: string");
    expect(sliderThumb).not.toContain("name={inputName}");
    expect(sliderThumb).toContain("visuallyHiddenStyle");
    expect(sliderThumb).toContain("style={visuallyHiddenStyle}");
    expect(sliderThumb).toContain("data-sw-slider-input");
    expect(sliderThumb).toContain('aria-hidden="true"');
    expect(sliderThumb).toContain("tabindex={-1}");
    expect(sliderThumb).toContain('type="range"');
    expect(sliderIndex).toContain("Root: SliderRoot");
    expect(sliderIndex).toContain("Control: SliderControl");
    expect(sliderIndex).toContain("Track: SliderTrack");
    expect(sliderIndex).toContain("Indicator: SliderIndicator");
    expect(sliderIndex).toContain("Label: SliderLabel");
    expect(sliderIndex).toContain("Thumb: SliderThumb");

    expect(switchRoot).toContain('import { createSwitch } from "@starwind-ui/runtime/switch"');
    expect(switchRoot).toContain(
      'interface Props extends Omit<HTMLAttributes<"span">, "aria-checked" | "onChange">',
    );
    expect(switchRoot).toContain("data-sw-switch");
    expect(switchRoot).toContain("data-default-checked");
    expect(switchRoot).toContain("data-form");
    expect(switchRoot).toContain("data-id");
    expect(switchRoot).toContain("data-name");
    expect(switchRoot).toContain("data-unchecked-value");
    expect(switchRoot).toContain("data-value");
    expect(switchRoot).toContain("data-disabled");
    expect(switchRoot).toContain("data-readonly");
    expect(switchRoot).toContain("data-required");
    expect(switchRoot).toContain("data-sw-switch-input");
    expect(switchRoot).toContain("const inputId =");
    expect(switchRoot).toContain("const rootId = nativeButton ? id : undefined");
    expect(switchRoot).toContain('aria-readonly={readOnly ? "true" : undefined}');
    expect(switchRoot).toContain('aria-required={required ? "true" : undefined}');
    expect(switchRoot).toContain("<input data-sw-switch-input id={inputId} hidden />");
    expect(switchRoot).toContain("createSwitch(root)");
    expect(switchRoot).toContain('role="switch"');
    expect(switchRoot).not.toContain(removedAttr("data-sw-switch", "default-checked"));
    expect(switchRoot).not.toContain(removedAttr("data-sw-switch", "unchecked-value"));
    expect(switchThumb).toContain('type Props = HTMLAttributes<"span">');
    expect(switchThumb).toContain("data-sw-switch-thumb");
    expect(switchThumb).not.toContain("data-unchecked");
    expect(switchIndex).toContain("const Switch =");
    expect(switchIndex).toContain("Root: SwitchRoot");
    expect(switchIndex).toContain("Thumb: SwitchThumb");

    expect(tabsRoot).toContain('import { createTabs } from "@starwind-ui/runtime/tabs"');
    expect(tabsRoot).toContain("type TabsValue = string | null");
    expect(tabsRoot).toContain("syncKey?: string");
    expect(tabsRoot).toContain("data-sw-tabs");
    expect(tabsRoot).toContain("data-default-value");
    expect(tabsRoot).toContain("data-orientation");
    expect(tabsRoot).toContain("data-sync-key={syncKey}");
    expect(tabsRoot).toContain("data-value");
    expect(tabsRoot).toContain(
      'trackAstroController("TabsRoot", root, createTabs(root)).refresh()',
    );
    expect(tabsRoot).toContain("registerAstroControllerLifecycle");
    expect(tabsRoot).toContain("starwind:init");
    expect(tabsList).toContain("activateOnFocus?: boolean");
    expect(tabsList).toContain("loopFocus?: boolean");
    expect(tabsList).toContain("data-sw-tabs-list");
    expect(tabsList).toContain("data-activate-on-focus");
    expect(tabsList).toContain("data-loop-focus");
    expect(tabsTab).toContain("data-sw-tabs-tab");
    expect(tabsTab).toContain("data-disabled");
    expect(tabsTab).toContain("data-value");
    expect(tabsPanel).toContain("data-sw-tabs-panel");
    expect(tabsPanel).toContain("data-keep-mounted");
    expect(tabsIndicator).toContain("data-sw-tabs-indicator");
    expect(tabsIndex).toContain("Root: TabsRoot");
    expect(tabsIndex).toContain("List: TabsList");
    expect(tabsIndex).toContain("Tab: TabsTab");
    expect(tabsIndex).toContain("Panel: TabsPanel");
    expect(tabsIndex).toContain("Indicator: TabsIndicator");

    expect(toggleRoot).toContain('import { createToggle } from "@starwind-ui/runtime/toggle"');
    expect(toggleRoot).toContain(
      '"aria-pressed" | "defaultPressed" | "disabled" | "onChange" | "type" | "value"',
    );
    expect(toggleRoot).toContain("data-sw-toggle");
    expect(toggleRoot).toContain(
      'const defaultPressedAttribute = pressed === undefined && defaultPressed ? "true" : undefined;',
    );
    expect(toggleRoot).toContain("data-default-pressed={defaultPressedAttribute}");
    expect(toggleRoot).toContain("data-default-pressed");
    expect(toggleRoot).toContain("data-native");
    expect(toggleRoot).toContain("data-sync-group={syncGroup}");
    expect(toggleRoot).toContain("data-value");
    expect(toggleRoot).toContain("data-pressed");
    expect(toggleRoot).toContain("data-state");
    expect(toggleRoot).toContain(
      "const toggleInstances = new Set<ReturnType<typeof createToggle>>()",
    );
    expect(toggleRoot).toContain('if (root.hasAttribute("data-sw-theme-toggle")) return;');
    expect(toggleRoot).toContain("toggleInstances.add(createToggle(root));");
    expect(toggleRoot).toContain("const destroyToggles = () =>");
    expect(toggleRoot).toContain(
      'registerAstroControllerLifecycle("ToggleRoot", setupToggles, destroyToggles)',
    );
    expect(toggleRoot).not.toContain(removedAttr("data-sw-toggle", "default-pressed"));
    expect(toggleRoot).not.toContain(removedAttr("data-sw-toggle", "native"));
    expect(toggleRoot).not.toContain(removedAttr("data-sw-toggle", "value"));
    expect(toggleIndex).toContain("const Toggle =");
    expect(toggleIndex).toContain("Root: ToggleRoot");

    expect(toggleGroupRoot).toContain(
      'import { createToggleGroup } from "@starwind-ui/runtime/toggle-group"',
    );
    expect(toggleGroupRoot).toContain("defaultValue?: string[]");
    expect(toggleGroupRoot).toContain("loopFocus?: boolean");
    expect(toggleGroupRoot).toContain("multiple?: boolean");
    expect(toggleGroupRoot).toContain('orientation?: "horizontal" | "vertical"');
    expect(toggleGroupRoot).toContain("data-sw-toggle-group");
    expect(toggleGroupRoot).toContain("data-default-value");
    expect(toggleGroupRoot).toContain("data-loop-focus");
    expect(toggleGroupRoot).toContain("data-multiple");
    expect(toggleGroupRoot).toContain("data-orientation");
    expect(toggleGroupRoot).toContain("data-value");
    expect(toggleGroupRoot).toContain('role="group"');
    expect(toggleGroupRoot).toContain("const defaultValueAttribute =");
    expect(toggleGroupRoot).toContain("const valueAttribute = JSON.stringify(defaultValue ?? [])");
    expect(toggleGroupRoot).toContain("createToggleGroup(root)");
    expect(toggleGroupRoot).toContain("registerAstroControllerLifecycle");
    expect(toggleGroupRoot).toContain("starwind:init");
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "default-value"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "loop-focus"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "multiple"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "orientation"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "value"));
    expect(toggleGroupIndex).toContain("const ToggleGroup =");
    expect(toggleGroupIndex).toContain("Root: ToggleGroupRoot");
  });

  it("generates Combobox Astro primitives through the Combobox specialized adapter spec without output drift", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputRoot = path.join(tempRoot, "generated/primitives/astro");
    const generatedBy = "scripts/portable-runtime/generate-astro-wrappers.ts";
    const formattedCheckedInComboboxTree = await readFormattedGeneratedTree(
      path.join(process.cwd(), "packages/astro/src/combobox"),
    );

    const specOutputRoot = path.join(tempRoot, "spec-backed/primitives/astro");
    await writeAstroComboboxSpecializedAdapterSpec(
      specOutputRoot,
      buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract),
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(
      withoutComboboxRuntimeTypeFacade(
        await readFormattedGeneratedTree(path.join(specOutputRoot, "combobox")),
      ),
    ).toEqual(withoutComboboxRuntimeTypeFacade(formattedCheckedInComboboxTree));

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });
    const generatedComboboxDir = path.join(generatedOutputRoot, "combobox");
    const generatedComboboxTree = await readGeneratedTree(generatedComboboxDir);
    expect(
      withoutComboboxRuntimeTypeFacade(await readFormattedGeneratedTree(generatedComboboxDir)),
    ).toEqual(withoutComboboxRuntimeTypeFacade(formattedCheckedInComboboxTree));
    expect(generatedComboboxTree["index.ts"]).toContain("ComboboxInputValueChangeDetails");
    expect(generatedComboboxTree["index.ts"]).toContain("ComboboxOpenChangeDetails");
    expect(generatedComboboxTree["index.ts"]).toContain("ComboboxValueChangeDetails");
    expect(generatedComboboxTree["index.ts"]).toContain('from "@starwind-ui/runtime";');

    const renamedSpec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    renamedSpec.root = {
      ...renamedSpec.root,
      discoveryAttribute: "data-sw-combobox-renamed",
    };
    renamedSpec.parts = renamedSpec.parts.map((part) =>
      part.name === "root" ? { ...part, discoveryAttribute: "data-sw-combobox-renamed" } : part,
    );
    renamedSpec.renderPlan = {
      ...renamedSpec.renderPlan,
      parts: renamedSpec.renderPlan.parts.map((part) =>
        part.name === "root" ? { ...part, discoveryAttribute: "data-sw-combobox-renamed" } : part,
      ),
    };
    renamedSpec.combobox.anatomy = renamedSpec.combobox.anatomy.map((part) =>
      part.part === "root" ? { ...part, discoveryAttribute: "data-sw-combobox-renamed" } : part,
    );

    const renamedOutputRoot = path.join(tempRoot, "renamed-combobox-spec/primitives/astro");
    await writeAstroComboboxSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(await readGeneratedFile(renamedOutputRoot, "combobox/ComboboxRoot.astro")).toContain(
      "data-sw-combobox-renamed",
    );

    const fileBasenameSpec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    fileBasenameSpec.files = fileBasenameSpec.files.map((file) =>
      file.kind === "part" && file.part === "root"
        ? { ...file, exportName: "ComboboxBase", path: "combobox/ComboboxBase" }
        : file,
    );
    fileBasenameSpec.exports = {
      ...fileBasenameSpec.exports,
      members: fileBasenameSpec.exports.members.map((member) =>
        member.part === "root" ? { ...member, file: "combobox/ComboboxBase" } : member,
      ),
    };
    const fileBasenameOutputRoot = path.join(tempRoot, "renamed-combobox-file/primitives/astro");
    await writeAstroComboboxSpecializedAdapterSpec(
      fileBasenameOutputRoot,
      fileBasenameSpec,
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(
      await readGeneratedFile(fileBasenameOutputRoot, "combobox/ComboboxBase.astro"),
    ).toContain("data-sw-combobox");
    expect(await readGeneratedFile(fileBasenameOutputRoot, "combobox/index.ts")).toContain(
      'import ComboboxRoot from "./ComboboxBase.astro";',
    );

    const fileTopologyDriftSpec = buildComboboxSpecializedAdapterSpec(
      comboboxRuntimeAdapterContract,
    );
    fileTopologyDriftSpec.files = fileTopologyDriftSpec.files.map((file) =>
      file.kind === "part" && file.part === "root"
        ? { ...file, path: "combobox/nested/ComboboxRoot" }
        : file,
    );
    fileTopologyDriftSpec.exports = {
      ...fileTopologyDriftSpec.exports,
      members: fileTopologyDriftSpec.exports.members.map((member) =>
        member.part === "root" ? { ...member, file: "combobox/nested/ComboboxRoot" } : member,
      ),
    };
    await expect(
      writeAstroComboboxSpecializedAdapterSpec(
        path.join(tempRoot, "file-topology-drift/primitives/astro"),
        fileTopologyDriftSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("requires root file path combobox/ComboboxRoot.");

    const popupFloatingDriftSpec = buildComboboxSpecializedAdapterSpec(
      comboboxRuntimeAdapterContract,
    );
    popupFloatingDriftSpec.renderPlan = {
      ...popupFloatingDriftSpec.renderPlan,
      staticAttributes: popupFloatingDriftSpec.renderPlan.staticAttributes.filter(
        (attribute) => !(attribute.part === "popup" && attribute.name === "data-side"),
      ),
    };
    popupFloatingDriftSpec.combobox.anatomy = popupFloatingDriftSpec.combobox.anatomy.map((part) =>
      part.part === "popup"
        ? {
            ...part,
            initialAttributes: part.initialAttributes.filter(
              (attribute) => attribute !== "data-side",
            ),
          }
        : part,
    );
    await expect(
      writeAstroComboboxSpecializedAdapterSpec(
        path.join(tempRoot, "popup-floating-drift/primitives/astro"),
        popupFloatingDriftSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("requires popup data-side metadata.");

    const invalidSpec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    invalidSpec.combobox.collection = undefined as never;
    await expect(
      writeAstroComboboxSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-combobox-spec/primitives/astro"),
        invalidSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("cannot print invalid Combobox spec");
  });

  it("generates Menu Astro primitives through the Menu specialized adapter spec without output drift", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputRoot = path.join(tempRoot, "generated/primitives/astro");
    const generatedBy = "scripts/portable-runtime/generate-astro-wrappers.ts";
    const checkedInMenuTree = await readGeneratedTree(
      path.join(process.cwd(), "packages/astro/src/menu"),
    );

    const specOutputRoot = path.join(tempRoot, "spec-backed/primitives/astro");
    await writeAstroMenuSpecializedAdapterSpec(
      specOutputRoot,
      buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract),
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(
      withoutMenuRuntimeTypeFacade(await readGeneratedTree(path.join(specOutputRoot, "menu"))),
    ).toEqual(withoutMenuRuntimeTypeFacade(checkedInMenuTree));

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });
    const generatedMenuDir = path.join(generatedOutputRoot, "menu");
    const generatedMenuTree = await readGeneratedTree(generatedMenuDir);
    expect(withoutMenuRuntimeTypeFacade(generatedMenuTree)).toEqual(
      withoutMenuRuntimeTypeFacade(checkedInMenuTree),
    );
    expect(generatedMenuTree["index.ts"]).toContain("MenuCloseCompleteDetails");
    expect(generatedMenuTree["index.ts"]).toContain("MenuOpenChangeDetails");
    expect(generatedMenuTree["index.ts"]).toContain("MenuValueChangeDetails");
    expect(generatedMenuTree["index.ts"]).toContain('from "@starwind-ui/runtime";');

    const renamedSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    renamedSpec.root = {
      ...renamedSpec.root,
      discoveryAttribute: "data-sw-menu-renamed",
    };
    renamedSpec.parts = renamedSpec.parts.map((part) =>
      part.name === "root" ? { ...part, discoveryAttribute: "data-sw-menu-renamed" } : part,
    );
    renamedSpec.renderPlan = {
      ...renamedSpec.renderPlan,
      parts: renamedSpec.renderPlan.parts.map((part) =>
        part.name === "root" ? { ...part, discoveryAttribute: "data-sw-menu-renamed" } : part,
      ),
    };

    const renamedOutputRoot = path.join(tempRoot, "renamed-spec/primitives/astro");
    await writeAstroMenuSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(await readGeneratedFile(renamedOutputRoot, "menu/MenuRoot.astro")).toContain(
      "data-sw-menu-renamed",
    );

    const branchTabIndexSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    branchTabIndexSpec.renderPlan = {
      ...branchTabIndexSpec.renderPlan,
      staticAttributes: branchTabIndexSpec.renderPlan.staticAttributes.map((attribute) =>
        attribute.part === "item" && attribute.name === "tabindex"
          ? { ...attribute, value: "1" }
          : attribute.part === "linkItem" && attribute.name === "tabindex"
            ? { ...attribute, value: "2" }
            : attribute,
      ),
    };

    const branchTabIndexOutputRoot = path.join(tempRoot, "branch-tabindex-spec/primitives/astro");
    await writeAstroMenuSpecializedAdapterSpec(
      branchTabIndexOutputRoot,
      branchTabIndexSpec,
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(await readGeneratedFile(branchTabIndexOutputRoot, "menu/MenuItem.astro")).toContain(
      'tabindex="1"',
    );
    expect(await readGeneratedFile(branchTabIndexOutputRoot, "menu/MenuLinkItem.astro")).toContain(
      'tabindex="2"',
    );

    const missingTabIndexSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    missingTabIndexSpec.renderPlan = {
      ...missingTabIndexSpec.renderPlan,
      staticAttributes: missingTabIndexSpec.renderPlan.staticAttributes.filter(
        (attribute) =>
          !(
            (attribute.part === "item" || attribute.part === "linkItem") &&
            attribute.name === "tabindex"
          ),
      ),
    };
    await expect(
      writeAstroMenuSpecializedAdapterSpec(
        path.join(tempRoot, "missing-tabindex-spec/primitives/astro"),
        missingTabIndexSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("requires item tabindex metadata");

    const fileTopologyDriftSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    fileTopologyDriftSpec.files = fileTopologyDriftSpec.files.map((file) =>
      file.kind === "part" && file.part === "root"
        ? { ...file, path: "menu/nested/MenuRoot" }
        : file,
    );
    fileTopologyDriftSpec.exports = {
      ...fileTopologyDriftSpec.exports,
      members: fileTopologyDriftSpec.exports.members.map((member) =>
        member.part === "root" ? { ...member, file: "menu/nested/MenuRoot" } : member,
      ),
    };
    await expect(
      writeAstroMenuSpecializedAdapterSpec(
        path.join(tempRoot, "file-topology-drift/primitives/astro"),
        fileTopologyDriftSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("requires root file path menu/MenuRoot.");

    const invalidSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    invalidSpec.menu.submenu = undefined as never;
    await expect(
      writeAstroMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-spec/primitives/astro"),
        invalidSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("cannot print invalid Menu spec");
  });

  it("generates Context Menu Astro primitives through the Context Menu specialized adapter spec without output drift", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputRoot = path.join(tempRoot, "generated/primitives/astro");
    const generatedBy = "scripts/portable-runtime/generate-astro-wrappers.ts";
    const checkedInContextMenuTree = await readGeneratedTree(
      path.join(process.cwd(), "packages/astro/src/context-menu"),
    );

    const specOutputRoot = path.join(tempRoot, "spec-backed/primitives/astro");
    await writeAstroContextMenuSpecializedAdapterSpec(
      specOutputRoot,
      buildContextMenuSpecializedAdapterSpec(contextMenuRuntimeAdapterContract),
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(
      withoutContextMenuRuntimeTypeFacade(
        await readGeneratedTree(path.join(specOutputRoot, "context-menu")),
      ),
    ).toEqual(withoutContextMenuRuntimeTypeFacade(checkedInContextMenuTree));

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });
    const generatedContextMenuDir = path.join(generatedOutputRoot, "context-menu");
    const generatedContextMenuTree = await readGeneratedTree(generatedContextMenuDir);
    expect(withoutContextMenuRuntimeTypeFacade(generatedContextMenuTree)).toEqual(
      withoutContextMenuRuntimeTypeFacade(checkedInContextMenuTree),
    );
    expect(generatedContextMenuTree["index.ts"]).toContain("ContextMenuCloseCompleteDetails");
    expect(generatedContextMenuTree["index.ts"]).toContain("ContextMenuOpenChangeDetails");
    expect(generatedContextMenuTree["index.ts"]).toContain("MenuValueChangeDetails");
    expect(generatedContextMenuTree["index.ts"]).toContain('from "@starwind-ui/runtime";');

    const renamedSpec = buildContextMenuSpecializedAdapterSpec(contextMenuRuntimeAdapterContract);
    renamedSpec.root = {
      ...renamedSpec.root,
      discoveryAttribute: "data-sw-context-menu-renamed",
    };
    renamedSpec.parts = renamedSpec.parts.map((part) =>
      part.name === "root" ? { ...part, discoveryAttribute: "data-sw-context-menu-renamed" } : part,
    );
    renamedSpec.renderPlan = {
      ...renamedSpec.renderPlan,
      parts: renamedSpec.renderPlan.parts.map((part) =>
        part.name === "root"
          ? { ...part, discoveryAttribute: "data-sw-context-menu-renamed" }
          : part,
      ),
    };
    renamedSpec.contextMenu.root = {
      ...renamedSpec.contextMenu.root,
      discoveryAttribute: "data-sw-context-menu-renamed",
    };

    const renamedOutputRoot = path.join(tempRoot, "renamed-context-spec/primitives/astro");
    await writeAstroContextMenuSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createAstroHeader(generatedBy),
      createTsHeader(generatedBy),
    );
    expect(
      await readGeneratedFile(renamedOutputRoot, "context-menu/ContextMenuRoot.astro"),
    ).toContain("data-sw-context-menu-renamed");

    const invalidRootDisabledSpec = buildContextMenuSpecializedAdapterSpec(
      contextMenuRuntimeAdapterContract,
    );
    invalidRootDisabledSpec.contextMenu.root = {
      ...invalidRootDisabledSpec.contextMenu.root,
      disabled: {
        ...invalidRootDisabledSpec.contextMenu.root.disabled,
        dataAttribute: "data-root-disabled",
      },
    };
    await expect(
      writeAstroContextMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-context-root-disabled/primitives/astro"),
        invalidRootDisabledSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("cannot print invalid Context Menu spec");

    const invalidAliasSpec = buildContextMenuSpecializedAdapterSpec(
      contextMenuRuntimeAdapterContract,
    );
    invalidAliasSpec.contextMenu.namespace.menuBackedAliases =
      invalidAliasSpec.contextMenu.namespace.menuBackedAliases.filter(
        (alias) => alias.contextPart !== "portal",
      );
    await expect(
      writeAstroContextMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-context-alias/primitives/astro"),
        invalidAliasSpec,
        createAstroHeader(generatedBy),
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("cannot print invalid Context Menu spec");
  });
}

function withoutMenuRuntimeTypeFacade(tree: Record<string, string>): Record<string, string> {
  return {
    ...tree,
    "index.ts": tree["index.ts"].replace(
      /\n\nexport type \{\s*MenuCloseCompleteDetails,\s*MenuOpenChangeDetails,\s*MenuValueChangeDetails,?\s*\} from "@starwind-ui\/runtime";\s*$/,
      "\n",
    ),
  };
}

function withoutComboboxRuntimeTypeFacade(tree: Record<string, string>): Record<string, string> {
  return {
    ...tree,
    "index.ts": tree["index.ts"].replace(
      /\n\nexport type \{\s*ComboboxInputValueChangeDetails,\s*ComboboxOpenChangeDetails,\s*ComboboxValueChangeDetails,?\s*\} from "@starwind-ui\/runtime";\s*$/,
      "\n",
    ),
  };
}

function withoutContextMenuRuntimeTypeFacade(tree: Record<string, string>): Record<string, string> {
  return {
    ...tree,
    "index.ts": tree["index.ts"].replace(
      /\n\nexport type \{\s*ContextMenuCloseCompleteDetails,\s*ContextMenuOpenChangeDetails,\s*MenuValueChangeDetails,?\s*\} from "@starwind-ui\/runtime";\s*$/,
      "\n",
    ),
  };
}
