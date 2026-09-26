import {
  comboboxRuntimeAdapterContract,
  contextMenuRuntimeAdapterContract,
  menuRuntimeAdapterContract,
} from "../../contracts/primitive/representatives.js";
import { reactFrameworkAdapterTarget } from "../../renderers/framework-adapters/index.js";
import { writeReactAdapterOutput } from "../../renderers/framework-adapters/react/primitive-output-writer.js";
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
import { assertTypeScriptModule, compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  expectAttributeCount,
  formatGeneratedOutput,
  generateReactPrimitiveWrappers,
  it,
  mkdir,
  path,
  readdir,
  readFile,
  readFormattedGeneratedTree,
  readGeneratedFile,
  removedAttr,
  writeFile,
} from "./shared.js";

async function writeReactComboboxSpecializedAdapterSpec(
  outputRoot: string,
  spec: ComboboxSpecializedAdapterSpec,
  tsHeader: string,
): Promise<void> {
  const outputModel = reactFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(
    buildComboboxAdapterOutputModel(spec),
  );

  await writeReactAdapterOutput({
    componentName: "Combobox",
    outputModel,
    outputRoot,
    tsHeader,
  });
}

async function writeReactMenuSpecializedAdapterSpec(
  outputRoot: string,
  spec: MenuSpecializedAdapterSpec,
  tsHeader: string,
): Promise<void> {
  const outputModel = reactFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(
    buildMenuAdapterOutputModel(spec),
  );

  await writeReactAdapterOutput({
    componentName: "Menu",
    outputModel,
    outputRoot,
    tsHeader,
  });
}

async function writeReactContextMenuSpecializedAdapterSpec(
  outputRoot: string,
  spec: ContextMenuSpecializedAdapterSpec,
  tsHeader: string,
): Promise<void> {
  const outputModel = reactFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(
    buildContextMenuAdapterOutputModel(spec),
  );

  await writeReactAdapterOutput({
    componentName: "Context Menu",
    outputModel,
    outputRoot,
    tsHeader,
  });
}

export function defineReactPrimitiveOutputTests(getTempRoot: GetTempRoot): void {
  it("generates unstyled React primitive wrappers for framework-level runtime parts", async () => {
    const tempRoot = getTempRoot();
    const staleBadgeDir = path.join(tempRoot, "generated/primitives/react/badge");
    await mkdir(staleBadgeDir, { recursive: true });
    await writeFile(path.join(staleBadgeDir, "BadgeRoot.tsx"), "stale primitive");

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const rootIndex = await readGeneratedFile(outputRoot, "index.ts");
    const themeIndex = await readGeneratedFile(outputRoot, "theme/index.ts");
    const composeRefs = await readGeneratedFile(outputRoot, "internal/compose-refs.ts");
    const nativeOverlayControl = await readGeneratedFile(
      outputRoot,
      "internal/native-overlay-control.ts",
    );
    const closePresence = await readGeneratedFile(outputRoot, "internal/use-close-presence.ts");
    const buttonRoot = await readGeneratedFile(outputRoot, "button/ButtonRoot.tsx");
    const buttonIndex = await readGeneratedFile(outputRoot, "button/index.ts");
    const accordionRoot = await readGeneratedFile(outputRoot, "accordion/AccordionRoot.tsx");
    const accordionItem = await readGeneratedFile(outputRoot, "accordion/AccordionItem.tsx");
    const accordionPanel = await readGeneratedFile(outputRoot, "accordion/AccordionPanel.tsx");
    const accordionIndex = await readGeneratedFile(outputRoot, "accordion/index.ts");
    const collapsibleRoot = await readGeneratedFile(outputRoot, "collapsible/CollapsibleRoot.tsx");
    const collapsibleTrigger = await readGeneratedFile(
      outputRoot,
      "collapsible/CollapsibleTrigger.tsx",
    );
    const collapsiblePanel = await readGeneratedFile(
      outputRoot,
      "collapsible/CollapsiblePanel.tsx",
    );
    const collapsibleIndex = await readGeneratedFile(outputRoot, "collapsible/index.ts");
    const contextMenuRoot = await readGeneratedFile(outputRoot, "context-menu/ContextMenuRoot.tsx");
    const contextMenuTrigger = await readGeneratedFile(
      outputRoot,
      "context-menu/ContextMenuTrigger.tsx",
    );
    const contextMenuIndex = await readGeneratedFile(outputRoot, "context-menu/index.ts");
    const dialogPopup = await readGeneratedFile(outputRoot, "dialog/DialogPopup.tsx");
    const dialogRoot = await readGeneratedFile(outputRoot, "dialog/DialogRoot.tsx");
    const dialogTrigger = await readGeneratedFile(outputRoot, "dialog/DialogTrigger.tsx");
    const dialogClose = await readGeneratedFile(outputRoot, "dialog/DialogClose.tsx");
    const dialogIndex = await readGeneratedFile(outputRoot, "dialog/index.ts");
    const drawerRoot = await readGeneratedFile(outputRoot, "drawer/DrawerRoot.tsx");
    const drawerTrigger = await readGeneratedFile(outputRoot, "drawer/DrawerTrigger.tsx");
    const drawerPopup = await readGeneratedFile(outputRoot, "drawer/DrawerPopup.tsx");
    const drawerClose = await readGeneratedFile(outputRoot, "drawer/DrawerClose.tsx");
    const drawerIndex = await readGeneratedFile(outputRoot, "drawer/index.ts");
    const dropzoneRoot = await readGeneratedFile(outputRoot, "dropzone/DropzoneRoot.tsx");
    const fieldRoot = await readGeneratedFile(outputRoot, "field/FieldRoot.tsx");
    const fieldLabel = await readGeneratedFile(outputRoot, "field/FieldLabel.tsx");
    const fieldControl = await readGeneratedFile(outputRoot, "field/FieldControl.tsx");
    const fieldDescription = await readGeneratedFile(outputRoot, "field/FieldDescription.tsx");
    const fieldError = await readGeneratedFile(outputRoot, "field/FieldError.tsx");
    const fieldItem = await readGeneratedFile(outputRoot, "field/FieldItem.tsx");
    const fieldValidity = await readGeneratedFile(outputRoot, "field/FieldValidity.tsx");
    const fieldIndex = await readGeneratedFile(outputRoot, "field/index.ts");
    const fieldsetRoot = await readGeneratedFile(outputRoot, "fieldset/FieldsetRoot.tsx");
    const fieldsetLegend = await readGeneratedFile(outputRoot, "fieldset/FieldsetLegend.tsx");
    const fieldsetIndex = await readGeneratedFile(outputRoot, "fieldset/index.ts");
    const formRoot = await readGeneratedFile(outputRoot, "form/FormRoot.tsx");
    const formErrorSummary = await readGeneratedFile(outputRoot, "form/FormErrorSummary.tsx");
    const formIndex = await readGeneratedFile(outputRoot, "form/index.ts");
    const popoverRoot = await readGeneratedFile(outputRoot, "popover/PopoverRoot.tsx");
    const popoverTrigger = await readGeneratedFile(outputRoot, "popover/PopoverTrigger.tsx");
    const popoverPositioner = await readGeneratedFile(outputRoot, "popover/PopoverPositioner.tsx");
    const popoverPopup = await readGeneratedFile(outputRoot, "popover/PopoverPopup.tsx");
    const popoverClose = await readGeneratedFile(outputRoot, "popover/PopoverClose.tsx");
    const popoverIndex = await readGeneratedFile(outputRoot, "popover/index.ts");
    const previewCardTrigger = await readGeneratedFile(
      outputRoot,
      "preview-card/PreviewCardTrigger.tsx",
    );
    const alertDialogRoot = await readGeneratedFile(outputRoot, "alert-dialog/AlertDialogRoot.tsx");
    const alertDialogTrigger = await readGeneratedFile(
      outputRoot,
      "alert-dialog/AlertDialogTrigger.tsx",
    );
    const alertDialogPopup = await readGeneratedFile(
      outputRoot,
      "alert-dialog/AlertDialogPopup.tsx",
    );
    const alertDialogClose = await readGeneratedFile(
      outputRoot,
      "alert-dialog/AlertDialogClose.tsx",
    );
    const alertDialogIndex = await readGeneratedFile(outputRoot, "alert-dialog/index.ts");
    const avatarRoot = await readGeneratedFile(outputRoot, "avatar/AvatarRoot.tsx");
    const avatarImage = await readGeneratedFile(outputRoot, "avatar/AvatarImage.tsx");
    const avatarFallback = await readGeneratedFile(outputRoot, "avatar/AvatarFallback.tsx");
    const avatarIndex = await readGeneratedFile(outputRoot, "avatar/index.ts");
    const checkboxRoot = await readGeneratedFile(outputRoot, "checkbox/CheckboxRoot.tsx");
    const checkboxIndicator = await readGeneratedFile(outputRoot, "checkbox/CheckboxIndicator.tsx");
    const checkboxIndex = await readGeneratedFile(outputRoot, "checkbox/index.ts");
    const checkboxGroupRoot = await readGeneratedFile(
      outputRoot,
      "checkbox-group/CheckboxGroupRoot.tsx",
    );
    const checkboxGroupContext = await readGeneratedFile(
      outputRoot,
      "checkbox-group/CheckboxGroupContext.tsx",
    );
    const checkboxGroupIndex = await readGeneratedFile(outputRoot, "checkbox-group/index.ts");
    const radioRoot = await readGeneratedFile(outputRoot, "radio/RadioRoot.tsx");
    const radioIndicator = await readGeneratedFile(outputRoot, "radio/RadioIndicator.tsx");
    const radioIndex = await readGeneratedFile(outputRoot, "radio/index.ts");
    const radioGroupRoot = await readGeneratedFile(outputRoot, "radio-group/RadioGroupRoot.tsx");
    const radioGroupContext = await readGeneratedFile(
      outputRoot,
      "radio-group/RadioGroupContext.tsx",
    );
    const radioGroupIndex = await readGeneratedFile(outputRoot, "radio-group/index.ts");
    const inputRoot = await readGeneratedFile(outputRoot, "input/InputRoot.tsx");
    const inputIndex = await readGeneratedFile(outputRoot, "input/index.ts");
    const inputOtpRoot = await readGeneratedFile(outputRoot, "input-otp/InputOtpRoot.tsx");
    const inputOtpGroup = await readGeneratedFile(outputRoot, "input-otp/InputOtpGroup.tsx");
    const inputOtpSlot = await readGeneratedFile(outputRoot, "input-otp/InputOtpSlot.tsx");
    const inputOtpSeparator = await readGeneratedFile(
      outputRoot,
      "input-otp/InputOtpSeparator.tsx",
    );
    const inputOtpIndex = await readGeneratedFile(outputRoot, "input-otp/index.ts");
    const progressRoot = await readGeneratedFile(outputRoot, "progress/ProgressRoot.tsx");
    const progressTrack = await readGeneratedFile(outputRoot, "progress/ProgressTrack.tsx");
    const progressIndicator = await readGeneratedFile(outputRoot, "progress/ProgressIndicator.tsx");
    const progressValue = await readGeneratedFile(outputRoot, "progress/ProgressValue.tsx");
    const progressLabel = await readGeneratedFile(outputRoot, "progress/ProgressLabel.tsx");
    const progressIndex = await readGeneratedFile(outputRoot, "progress/index.ts");
    const menuRoot = await readGeneratedFile(outputRoot, "menu/MenuRoot.tsx");
    const menuTrigger = await readGeneratedFile(outputRoot, "menu/MenuTrigger.tsx");
    const menuItem = await readGeneratedFile(outputRoot, "menu/MenuItem.tsx");
    const menuLinkItem = await readGeneratedFile(outputRoot, "menu/MenuLinkItem.tsx");
    const menuCheckboxItem = await readGeneratedFile(outputRoot, "menu/MenuCheckboxItem.tsx");
    const menuRadioContext = await readGeneratedFile(outputRoot, "menu/MenuRadioContext.tsx");
    const menuRadioGroup = await readGeneratedFile(outputRoot, "menu/MenuRadioGroup.tsx");
    const menuRadioItem = await readGeneratedFile(outputRoot, "menu/MenuRadioItem.tsx");
    const menuRadioItemIndicator = await readGeneratedFile(
      outputRoot,
      "menu/MenuRadioItemIndicator.tsx",
    );
    const menuSubmenuTrigger = await readGeneratedFile(outputRoot, "menu/MenuSubmenuTrigger.tsx");
    const navigationMenuRoot = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuRoot.tsx",
    );
    const navigationMenuContent = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuContent.tsx",
    );
    const navigationMenuTrigger = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuTrigger.tsx",
    );
    const navigationMenuLink = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuLink.tsx",
    );
    const navigationMenuPositioner = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuPositioner.tsx",
    );
    const navigationMenuPopup = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuPopup.tsx",
    );
    const navigationMenuViewport = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenuViewport.tsx",
    );
    const navigationMenuIndex = await readGeneratedFile(outputRoot, "navigation-menu/index.ts");
    const tooltipRoot = await readGeneratedFile(outputRoot, "tooltip/TooltipRoot.tsx");
    const tooltipTrigger = await readGeneratedFile(outputRoot, "tooltip/TooltipTrigger.tsx");
    const tooltipPositioner = await readGeneratedFile(outputRoot, "tooltip/TooltipPositioner.tsx");
    const tooltipPopup = await readGeneratedFile(outputRoot, "tooltip/TooltipPopup.tsx");
    const sliderRoot = await readGeneratedFile(outputRoot, "slider/SliderRoot.tsx");
    const sliderControl = await readGeneratedFile(outputRoot, "slider/SliderControl.tsx");
    const sliderTrack = await readGeneratedFile(outputRoot, "slider/SliderTrack.tsx");
    const sliderIndicator = await readGeneratedFile(outputRoot, "slider/SliderIndicator.tsx");
    const sliderLabel = await readGeneratedFile(outputRoot, "slider/SliderLabel.tsx");
    const sliderThumb = await readGeneratedFile(outputRoot, "slider/SliderThumb.tsx");
    const sliderIndex = await readGeneratedFile(outputRoot, "slider/index.ts");
    const scrollAreaRoot = await readGeneratedFile(outputRoot, "scroll-area/ScrollAreaRoot.tsx");
    const scrollAreaViewport = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaViewport.tsx",
    );
    const scrollAreaContent = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaContent.tsx",
    );
    const scrollAreaScrollbar = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaScrollbar.tsx",
    );
    const scrollAreaThumb = await readGeneratedFile(outputRoot, "scroll-area/ScrollAreaThumb.tsx");
    const scrollAreaCorner = await readGeneratedFile(
      outputRoot,
      "scroll-area/ScrollAreaCorner.tsx",
    );
    const scrollAreaIndex = await readGeneratedFile(outputRoot, "scroll-area/index.ts");
    const selectContext = await readGeneratedFile(outputRoot, "select/SelectContext.tsx");
    const selectRoot = await readGeneratedFile(outputRoot, "select/SelectRoot.tsx");
    const selectTrigger = await readGeneratedFile(outputRoot, "select/SelectTrigger.tsx");
    const selectValue = await readGeneratedFile(outputRoot, "select/SelectValue.tsx");
    const selectPositioner = await readGeneratedFile(outputRoot, "select/SelectPositioner.tsx");
    const selectPopup = await readGeneratedFile(outputRoot, "select/SelectPopup.tsx");
    const selectItem = await readGeneratedFile(outputRoot, "select/SelectItem.tsx");
    const selectItemIndicator = await readGeneratedFile(
      outputRoot,
      "select/SelectItemIndicator.tsx",
    );
    const selectIndex = await readGeneratedFile(outputRoot, "select/index.ts");
    const sidebarContext = await readGeneratedFile(outputRoot, "sidebar/SidebarContext.tsx");
    const sidebarProvider = await readGeneratedFile(outputRoot, "sidebar/SidebarProvider.tsx");
    const sidebar = await readGeneratedFile(outputRoot, "sidebar/Sidebar.tsx");
    const sidebarTrigger = await readGeneratedFile(outputRoot, "sidebar/SidebarTrigger.tsx");
    const sidebarRail = await readGeneratedFile(outputRoot, "sidebar/SidebarRail.tsx");
    const sidebarMenuButton = await readGeneratedFile(outputRoot, "sidebar/SidebarMenuButton.tsx");
    const sidebarIndex = await readGeneratedFile(outputRoot, "sidebar/index.ts");
    const comboboxRoot = await readGeneratedFile(outputRoot, "combobox/ComboboxRoot.tsx");
    const comboboxInput = await readGeneratedFile(outputRoot, "combobox/ComboboxInput.tsx");
    const comboboxTrigger = await readGeneratedFile(outputRoot, "combobox/ComboboxTrigger.tsx");
    const comboboxClear = await readGeneratedFile(outputRoot, "combobox/ComboboxClear.tsx");
    const comboboxValue = await readGeneratedFile(outputRoot, "combobox/ComboboxValue.tsx");
    const comboboxPopup = await readGeneratedFile(outputRoot, "combobox/ComboboxPopup.tsx");
    const comboboxItem = await readGeneratedFile(outputRoot, "combobox/ComboboxItem.tsx");
    const comboboxIndex = await readGeneratedFile(outputRoot, "combobox/index.ts");
    const toastViewport = await readGeneratedFile(outputRoot, "toast/ToastViewport.tsx");
    const toastTemplate = await readGeneratedFile(outputRoot, "toast/ToastTemplate.tsx");
    const toastRoot = await readGeneratedFile(outputRoot, "toast/ToastRoot.tsx");
    const toastAction = await readGeneratedFile(outputRoot, "toast/ToastAction.tsx");
    const toastClose = await readGeneratedFile(outputRoot, "toast/ToastClose.tsx");
    const switchRoot = await readGeneratedFile(outputRoot, "switch/SwitchRoot.tsx");
    const switchThumb = await readGeneratedFile(outputRoot, "switch/SwitchThumb.tsx");
    const switchIndex = await readGeneratedFile(outputRoot, "switch/index.ts");
    const tabsContext = await readGeneratedFile(outputRoot, "tabs/TabsContext.tsx");
    const tabsRoot = await readGeneratedFile(outputRoot, "tabs/TabsRoot.tsx");
    const tabsList = await readGeneratedFile(outputRoot, "tabs/TabsList.tsx");
    const tabsTab = await readGeneratedFile(outputRoot, "tabs/TabsTab.tsx");
    const tabsPanel = await readGeneratedFile(outputRoot, "tabs/TabsPanel.tsx");
    const tabsIndicator = await readGeneratedFile(outputRoot, "tabs/TabsIndicator.tsx");
    const tabsIndex = await readGeneratedFile(outputRoot, "tabs/index.ts");
    const toggleRoot = await readGeneratedFile(outputRoot, "toggle/ToggleRoot.tsx");
    const toggleIndex = await readGeneratedFile(outputRoot, "toggle/index.ts");
    const toggleGroupContext = await readGeneratedFile(
      outputRoot,
      "toggle-group/ToggleGroupContext.tsx",
    );
    const toggleGroupRoot = await readGeneratedFile(outputRoot, "toggle-group/ToggleGroupRoot.tsx");
    const toggleGroupIndex = await readGeneratedFile(outputRoot, "toggle-group/index.ts");
    const reactAsChildParts = [
      { source: collapsibleTrigger, discovery: '"data-sw-collapsible-trigger": ""' },
      { source: popoverTrigger, discovery: '"data-sw-popover-trigger": ""' },
      { source: menuTrigger, discovery: '"data-sw-menu-trigger": ""' },
      { source: selectTrigger, discovery: '"data-sw-select-trigger": ""' },
      { source: comboboxTrigger, discovery: '"data-sw-combobox-trigger": ""' },
      { source: comboboxClear, discovery: '"data-sw-combobox-clear": ""' },
      { source: navigationMenuTrigger, discovery: '"data-sw-nav-menu-trigger": ""' },
      { source: previewCardTrigger, discovery: '"data-sw-preview-card-trigger": ""' },
      { source: sidebarTrigger, discovery: "data-sw-sidebar-trigger" },
      { source: sidebarMenuButton, discovery: '"data-sw-sidebar-menu-button": ""' },
      { source: tooltipTrigger, discovery: '"data-sw-tooltip-trigger": ""' },
    ];

    expect(compactCode(composeRefs)).toContain(compactCode("export function getAsChildElement"));
    expect(compactCode(composeRefs)).toContain(compactCode("export function mergeAsChildProps"));
    expect(compactCode(composeRefs)).toContain(compactCode("function mergeAsChildStyle"));
    expect(compactCode(composeRefs)).toContain(compactCode("event.defaultPrevented"));
    expect(compactCode(composeRefs)).toContain(compactCode('eventOrder === "parent-first"'));
    expect(compactCode(composeRefs)).toContain(
      compactCode("export type RefCapableElementProps = AsChildProps &"),
    );
    expect(compactCode(composeRefs)).toContain(compactCode("function getAsChildEventHandler"));
    expect(compactCode(closePresence)).toContain(compactCode("export function useClosePresence"));
    expect(compactCode(closePresence)).toContain(
      compactCode('import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";'),
    );
    expect(compactCode(closePresence)).toContain(
      compactCode('const PRESENCE_ENDING_ATTRIBUTE = "data-ending-style"'),
    );
    expect(compactCode(closePresence)).toContain(
      compactCode("const hasOpenedRef = React.useRef(open)"),
    );
    expect(compactCode(closePresence)).toContain(compactCode("useIsomorphicLayoutEffect(() => {"));
    expect(compactCode(closePresence)).toContain(compactCode("clearScheduledClose();"));
    expect(compactCode(closePresence)).toContain(
      compactCode('element.setAttribute(PRESENCE_ENDING_ATTRIBUTE, "")'),
    );
    expect(compactCode(closePresence)).toContain(compactCode("Promise.allSettled"));
    expect(compactCode(closePresence)).toContain(
      compactCode("window.clearTimeout(timeoutRef.current)"),
    );
    expect(compactCode(closePresence)).toContain(compactCode("setPresent(keepMounted)"));
    expect(compactCode(closePresence)).toContain(compactCode("hidden: open ? false : hidden"));
    expect(compactCode(closePresence)).toContain(
      compactCode("present: open || keepMounted || present"),
    );
    reactAsChildParts.forEach(({ source, discovery }) => {
      expect(source).toMatch(
        /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
      );
      expect(compactCode(source)).toContain(
        compactCode("const asChildElement = getAsChildElement(children)"),
      );
      expect(compactCode(source)).toContain(compactCode("React.cloneElement(child, {"));
      expect(compactCode(source)).toContain(compactCode("mergeAsChildProps("));
      expect(compactCode(source)).toContain(compactCode("ref: composedRef"));
      expect(source).toContain(discovery.split('"')[1] ?? discovery);
      expect(compactCode(source)).not.toContain(compactCode("function getAsChildElement"));
    });
    expect(compactCode(tooltipTrigger)).not.toContain(compactCode("<span"));

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

    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./accordion";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./carousel";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./select";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./sidebar";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./tooltip";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./preview-card";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./dropzone";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./fieldset";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./form";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./navigation-menu";'));
    expect(compactCode(rootIndex)).toContain(compactCode('export * from "./theme";'));
    expect(compactCode(rootIndex)).toContain(compactCode("SelectOpenChangeDetails"));
    expect(compactCode(themeIndex)).toContain(
      compactCode("export { getThemeInitScript, initThemeController }"),
    );
    expect(compactCode(themeIndex)).toContain(compactCode("ThemeInitScriptOptions"));
    expect(compactCode(themeIndex)).toContain(compactCode("export function ThemeInitScript("));
    expect(compactCode(themeIndex)).toContain(compactCode("data-starwind-theme-init"));
    expect(compactCode(themeIndex)).toContain(compactCode('from "@starwind-ui/runtime/theme"'));

    for (const source of [
      buttonRoot,
      accordionRoot,
      collapsibleRoot,
      contextMenuRoot,
      dialogRoot,
      alertDialogRoot,
      drawerRoot,
      dropzoneRoot,
      fieldRoot,
      fieldsetRoot,
      formRoot,
      popoverRoot,
      avatarRoot,
      checkboxRoot,
      checkboxGroupRoot,
      radioRoot,
      radioGroupRoot,
      inputRoot,
      inputOtpRoot,
      progressRoot,
      menuRoot,
      navigationMenuRoot,
      tooltipRoot,
      sliderRoot,
      scrollAreaRoot,
      selectRoot,
      comboboxRoot,
      toastRoot,
      switchRoot,
      tabsRoot,
      toggleRoot,
      toggleGroupRoot,
    ]) {
      expect(source).toMatch(/^\/\*\*[\s\S]*?\*\/\s*"use client";/);
    }
    expect(compactCode(buttonRoot)).toContain(
      compactCode('import { createButton } from "@starwind-ui/runtime/button";'),
    );
    expect(compactCode(buttonRoot)).toContain(compactCode("data-sw-button"));
    expect(compactCode(buttonRoot)).not.toContain(compactCode("href?: string"));
    expect(compactCode(accordionRoot)).toContain(compactCode('"@starwind-ui/runtime/accordion"'));
    expect(compactCode(accordionRoot)).toContain(compactCode("data-sw-accordion"));
    expect(compactCode(collapsibleRoot)).toContain(
      compactCode('"@starwind-ui/runtime/collapsible"'),
    );
    expect(compactCode(collapsibleRoot)).toContain(compactCode("data-sw-collapsible"));
    expect(compactCode(contextMenuRoot)).toContain(
      compactCode('from "@starwind-ui/runtime/context-menu";'),
    );
    expect(compactCode(contextMenuRoot)).toContain(
      compactCode("onCloseComplete?: (details: ContextMenuCloseCompleteDetails) => void;"),
    );
    expect(compactCode(contextMenuRoot)).toContain(compactCode("data-sw-context-menu"));
    expect(compactCode(contextMenuRoot)).toContain(compactCode("data-sw-menu"));
    expect(compactCode(contextMenuRoot)).toContain(compactCode("modal?: boolean;"));
    expect(compactCode(dialogRoot)).toContain(compactCode('"@starwind-ui/runtime/dialog"'));
    expect(compactCode(dialogRoot)).toContain(
      compactCode("onCloseComplete?: (detail: DialogCloseCompleteDetails) => void;"),
    );
    expect(compactCode(alertDialogRoot)).toContain(
      compactCode('from "@starwind-ui/runtime/alert-dialog";'),
    );
    expect(compactCode(alertDialogRoot)).toContain(
      compactCode("onCloseComplete?: (detail: AlertDialogCloseCompleteDetails) => void;"),
    );
    expect(compactCode(alertDialogRoot)).toContain(compactCode("data-sw-alert-dialog"));
    expect(compactCode(drawerRoot)).toContain(compactCode('from "@starwind-ui/runtime/drawer";'));
    expect(compactCode(drawerRoot)).toContain(
      compactCode("onCloseComplete?: (detail: DrawerCloseCompleteDetails) => void;"),
    );
    expect(compactCode(drawerRoot)).toContain(compactCode("data-sw-drawer"));
    expect(compactCode(dropzoneRoot)).toContain(compactCode("data-sw-dropzone"));
    expect(compactCode(fieldRoot)).toContain(
      compactCode('import { createField } from "@starwind-ui/runtime/field";'),
    );
    expect(compactCode(fieldRoot)).toContain(compactCode("data-sw-field"));
    expect(compactCode(fieldRoot)).toContain(
      compactCode("validationTiming?: FormValidationTiming;"),
    );
    expect(compactCode(fieldRoot)).toContain(
      compactCode("revalidationTiming?: FormValidationTiming;"),
    );
    expect(compactCode(fieldRoot)).toContain(
      compactCode("errorVisibility?: FormValidationTiming;"),
    );
    expect(compactCode(fieldsetRoot)).toContain(compactCode('"@starwind-ui/runtime/fieldset"'));
    expect(compactCode(fieldsetRoot)).toContain(compactCode("data-sw-fieldset"));
    expect(compactCode(formRoot)).toContain(compactCode('"@starwind-ui/runtime/form"'));
    expect(compactCode(formRoot)).toContain(
      compactCode("validationTiming?: FormValidationTiming;"),
    );
    expect(compactCode(formRoot)).toContain(
      compactCode("revalidationTiming?: FormValidationTiming;"),
    );
    expect(compactCode(formRoot)).toContain(compactCode("errorVisibility?: FormValidationTiming;"));
    expect(compactCode(formRoot)).toContain(compactCode("data-sw-form"));
    expect(compactCode(popoverRoot)).toContain(
      compactCode('} from "@starwind-ui/runtime/popover";'),
    );
    expect(compactCode(popoverRoot)).toContain(compactCode("modal?: boolean;"));
    expect(compactCode(popoverRoot)).toContain(
      compactCode("onCloseComplete?: (details: PopoverCloseCompleteDetails) => void;"),
    );
    expect(compactCode(popoverRoot)).toContain(compactCode("data-sw-popover"));
    expect(compactCode(avatarRoot)).toContain(compactCode('"@starwind-ui/runtime/avatar"'));
    expect(compactCode(avatarRoot)).toContain(compactCode("data-sw-avatar"));
    expect(compactCode(checkboxRoot)).toContain(compactCode('"@starwind-ui/runtime/checkbox"'));
    expect(compactCode(checkboxRoot)).toContain(compactCode("data-sw-checkbox"));
    expect(compactCode(checkboxRoot)).toContain(compactCode("data-sw-checkbox-input"));
    expect(compactCode(checkboxGroupRoot)).toContain(
      compactCode('"@starwind-ui/runtime/checkbox-group"'),
    );
    expect(compactCode(checkboxGroupRoot)).toContain(compactCode("data-sw-checkbox-group"));
    expect(compactCode(radioRoot)).toContain(compactCode("data-sw-radio"));
    expect(compactCode(radioRoot)).toContain(compactCode("data-sw-radio-input"));
    expect(compactCode(radioGroupRoot)).toContain(compactCode("data-sw-radio-group"));
    expect(compactCode(inputRoot)).toContain(compactCode("const valueProps ="));
    expect(compactCode(inputRoot)).toContain(compactCode("data-sw-input"));
    expect(compactCode(inputOtpRoot)).toContain(
      compactCode(
        'import { createInputOtp, type InputOtpValueChangeDetails } from "@starwind-ui/runtime/input-otp";',
      ),
    );
    expect(compactCode(inputOtpRoot)).toContain(compactCode("data-sw-input-otp"));
    expect(compactCode(inputOtpRoot)).toContain(compactCode("data-sw-input-otp-input"));
    expect(compactCode(progressRoot)).toContain(
      compactCode('from "@starwind-ui/runtime/progress"'),
    );
    expect(compactCode(progressRoot)).toContain(
      compactCode('export type ProgressRootProps = Omit<React.ComponentPropsWithoutRef<"div">,'),
    );
    expect(compactCode(progressRoot)).toContain(compactCode("format?: Intl.NumberFormatOptions"));
    expect(compactCode(progressRoot)).toContain(
      compactCode(
        "getAriaValueText?: (formattedValue: string | null, value: ProgressValue) => string",
      ),
    );
    expect(compactCode(progressRoot)).toContain(compactCode("locale?: Intl.LocalesArgument"));
    expect(compactCode(progressRoot)).toContain(compactCode("data-sw-progress"));
    expect(compactCode(menuRoot)).toContain(
      compactCode("onCloseComplete?: (details: MenuCloseCompleteDetails) => void;"),
    );
    expect(compactCode(menuRoot)).toContain(compactCode("modal?: boolean;"));
    expect(compactCode(navigationMenuRoot)).toContain(compactCode("value?: string | null"));
    expect(compactCode(navigationMenuRoot)).toContain(compactCode("openDelay?: number;"));
    expect(compactCode(navigationMenuRoot)).toContain(compactCode("closeDelay?: number;"));
    expect(compactCode(navigationMenuRoot)).toContain(compactCode("onValueChange?:"));
    expect(compactCode(navigationMenuRoot)).toContain(compactCode("data-sw-nav-menu"));
    expect(compactCode(sliderRoot)).toContain(compactCode('"@starwind-ui/runtime/slider"'));
    expect(compactCode(sliderRoot)).toContain(compactCode("data-sw-slider"));
    expect(compactCode(scrollAreaRoot)).toContain(
      compactCode('import { createScrollArea } from "@starwind-ui/runtime/scroll-area";'),
    );
    expect(compactCode(scrollAreaRoot)).toContain(compactCode("data-sw-scroll-area"));
    expect(compactCode(selectRoot)).toContain(compactCode("autoComplete?: string"));
    expect(compactCode(selectRoot)).toContain(compactCode("form?: string"));
    expect(compactCode(selectRoot)).toContain(compactCode("highlightItemOnHover?: boolean"));
    expect(compactCode(selectRoot)).toContain(compactCode("modal?: boolean"));
    expect(compactCode(selectRoot)).toContain(compactCode("onValueChange?:"));
    expect(compactCode(selectRoot)).toContain(compactCode("open?: boolean"));
    expect(compactCode(selectRoot)).toContain(compactCode("readOnly?: boolean"));
    expect(compactCode(selectRoot)).toContain(compactCode("value?: string"));
    expect(compactCode(selectRoot)).toContain(compactCode("data-sw-select"));
    expect(compactCode(selectRoot)).toContain(compactCode("data-sw-select-input"));
    expect(compactCode(selectRoot)).toContain(
      compactCode('target.closest("[data-sw-select-trigger]")'),
    );
    expect(compactCode(comboboxRoot)).toContain(compactCode("autoComplete?: string"));
    expect(compactCode(comboboxRoot)).toContain(
      compactCode('filterMode?: "contains" | "startsWith"'),
    );
    expect(compactCode(comboboxRoot)).toContain(compactCode("form?: string"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("highlightItemOnHover?: boolean"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("inputValue?: string"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("locale?: string"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("modal?: boolean"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("onInputValueChange?:"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("readOnly?: boolean"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("data-sw-combobox"));
    expect(compactCode(comboboxRoot)).toContain(compactCode("data-sw-combobox-hidden-input"));
    expect(compactCode(toastRoot)).toContain(compactCode("data-sw-toast-root"));
    expect(compactCode(switchRoot)).toContain(compactCode("data-sw-switch"));
    expect(compactCode(switchRoot)).toContain(compactCode("data-sw-switch-input"));
    expect(compactCode(tabsRoot)).toContain(compactCode('"@starwind-ui/runtime/tabs"'));
    expect(compactCode(tabsRoot)).toContain(compactCode("syncKey?: string"));
    expect(compactCode(tabsRoot)).toContain(compactCode("data-sw-tabs"));
    expect(compactCode(toggleRoot)).toContain(compactCode("syncGroup?: string"));
    expect(compactCode(toggleRoot)).toContain(compactCode("data-sw-toggle"));
    expect(compactCode(toggleGroupRoot)).toContain(compactCode("defaultValue?: ToggleGroupValue"));
    expect(compactCode(toggleGroupRoot)).toContain(compactCode("loopFocus?: boolean"));
    expect(compactCode(toggleGroupRoot)).toContain(compactCode("multiple?: boolean"));
    expect(compactCode(toggleGroupRoot)).toContain(
      compactCode('orientation?: "horizontal" | "vertical"'),
    );
    expect(compactCode(toggleGroupRoot)).toContain(compactCode("onValueChange?:"));
    expect(compactCode(toggleGroupRoot)).toContain(compactCode("value?: ToggleGroupValue"));
    expect(compactCode(toggleGroupRoot)).toContain(compactCode("data-sw-toggle-group"));
    assertTypeScriptModule(buttonRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(buttonIndex)).toContain(compactCode("const Button ="));
    expect(compactCode(buttonIndex)).toContain(compactCode("Root: ButtonRoot"));

    assertTypeScriptModule(accordionRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(accordionItem)).toContain(compactCode("data-value"));
    expect(compactCode(accordionItem)).toContain(compactCode("data-disabled"));
    expect(accordionItem).not.toContain(removedAttr("data-sw-accordion", "value"));
    expect(accordionItem).not.toContain(removedAttr("data-sw-accordion", "disabled"));
    expectAttributeCount(accordionItem, "data-disabled", 1);
    expect(compactCode(accordionPanel)).toContain(
      compactCode('style={{ ...style, animation: "none" }}'),
    );
    expect(compactCode(accordionIndex)).toContain(compactCode("const Accordion ="));
    expect(compactCode(accordionIndex)).toContain(compactCode("Root: AccordionRoot"));
    expect(compactCode(accordionIndex)).toContain(compactCode("Panel: AccordionPanel"));

    assertTypeScriptModule(collapsibleRoot); // Ordinary behavior is covered by the component browser suite.

    expectAttributeCount(collapsibleRoot, "data-disabled", 1);

    expect(compactCode(collapsibleTrigger)).toContain(compactCode("asChild?: boolean;"));
    expect(compactCode(collapsibleTrigger)).toContain(compactCode("getAsChildElement(children)"));
    expect(compactCode(collapsibleTrigger)).toContain(compactCode("React.cloneElement"));
    expect(compactCode(collapsibleTrigger)).toContain(compactCode("data-sw-collapsible-trigger"));
    expect(compactCode(collapsibleTrigger)).toContain(compactCode('"aria-expanded": "false"'));
    expect(compactCode(collapsibleTrigger)).toContain(
      compactCode("mergeAsChildProps({ ...triggerProps, className }, childProps"),
    );
    expect(collapsibleTrigger).toMatch(
      /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
    );
    expect(compactCode(collapsibleTrigger)).toContain(
      compactCode("const composedRef = useComposedRefs("),
    );
    expect(compactCode(collapsibleTrigger)).toContain(compactCode("ref: composedRef"));
    expect(compactCode(collapsibleTrigger)).not.toContain(compactCode("function mergeRefs"));
    expect(compactCode(collapsiblePanel)).toContain(compactCode('data-state="closed"'));
    expect(compactCode(collapsiblePanel)).toContain(compactCode("hidden"));
    expect(compactCode(collapsiblePanel)).toContain(compactCode("hiddenUntilFound?: boolean"));
    expect(compactCode(collapsiblePanel)).toContain(
      compactCode('data-hidden-until-found={hiddenUntilFound ? "" : undefined}'),
    );
    expect(compactCode(collapsiblePanel)).toContain(
      compactCode('node.setAttribute("hidden", "until-found")'),
    );
    expect(compactCode(collapsiblePanel)).toContain(compactCode("ref={composedRef}"));
    expect(compactCode(collapsiblePanel)).not.toContain(compactCode("animation"));
    expect(compactCode(collapsibleIndex)).toContain(compactCode("const Collapsible ="));
    expect(compactCode(collapsibleIndex)).toContain(compactCode("Root: CollapsibleRoot"));
    expect(compactCode(collapsibleIndex)).toContain(compactCode("Panel: CollapsiblePanel"));

    assertTypeScriptModule(contextMenuRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(contextMenuTrigger)).toContain(compactCode("data-sw-context-menu-trigger"));
    expect(compactCode(contextMenuTrigger)).toContain(compactCode("data-sw-menu-trigger"));
    expect(compactCode(contextMenuTrigger)).toContain(compactCode('aria-haspopup="menu"'));
    expect(compactCode(contextMenuTrigger)).toContain(
      compactCode("tabIndex={disabled ? -1 : (tabIndex ?? 0)}"),
    );
    expect(compactCode(contextMenuIndex)).toContain(compactCode("const ContextMenu ="));
    expect(compactCode(contextMenuIndex)).toContain(compactCode("Root: ContextMenuRoot"));
    expect(compactCode(contextMenuIndex)).toContain(compactCode("Portal: ContextMenuPortal"));
    expect(compactCode(contextMenuIndex)).toContain(compactCode("Item: ContextMenuItem"));
    expect(compactCode(contextMenuIndex)).toContain(
      compactCode('import ContextMenuRadioGroup from "../menu/MenuRadioGroup";'),
    );
    expect(compactCode(contextMenuIndex)).toContain(
      compactCode('import ContextMenuRadioItemIndicator from "../menu/MenuRadioItemIndicator";'),
    );
    expect(compactCode(contextMenuIndex)).not.toContain(compactCode('from "../menu";'));
    expect(compactCode(contextMenuIndex)).not.toContain(compactCode("MenuRadioContext"));

    for (const root of [dialogRoot, alertDialogRoot, drawerRoot]) {
      expect(compactCode(root)).toContain(compactCode("NativeOverlayControlContext.Provider"));
      expect(compactCode(root)).toContain(compactCode("owned.refresh()"));
      expect(compactCode(root)).toContain(compactCode("connection.instance === owned"));
    }
    for (const control of [
      dialogTrigger,
      dialogClose,
      drawerTrigger,
      drawerClose,
      alertDialogTrigger,
      alertDialogClose,
    ]) {
      expect(compactCode(control)).toContain(
        compactCode("React.useContext(NativeOverlayControlContext)"),
      );
      expect(compactCode(control)).toContain(compactCode("asChild?: boolean;"));
      expect(compactCode(control)).toContain(compactCode("asChild = false"));
      expect(compactCode(control)).toContain(compactCode("useNativeOverlayControl"));
      expect(compactCode(control)).toContain(compactCode("key={controlKey}"));
      expect(compactCode(control)).toContain(compactCode("data-as-child"));
      expect(compactCode(control)).toContain(compactCode("ref={setControlElement}"));
      expect(compactCode(control)).toContain(compactCode("React.forwardRef<HTMLButtonElement"));
    }
    expect(compactCode(nativeOverlayControl)).toContain(compactCode("requestRefresh?.()"));
    expect(compactCode(nativeOverlayControl)).toContain(
      compactCode('typeof children.type === "string"'),
    );
    expect(compactCode(nativeOverlayControl)).toContain(
      compactCode("control !== observedControls.current[index]"),
    );
    expect(compactCode(nativeOverlayControl)).not.toContain(compactCode("children.key !== null"));
    expect(compactCode(nativeOverlayControl)).toContain(compactCode("cleanup?.()"));
    expect(compactCode(nativeOverlayControl)).not.toContain(compactCode("querySelectorAll"));
    expect(compactCode(nativeOverlayControl)).not.toContain(compactCode("MutationObserver"));
    assertTypeScriptModule(dialogRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(dialogPopup)).toContain(compactCode("<dialog"));
    expect(compactCode(dialogPopup)).toContain(compactCode("data-sw-dialog-content"));
    expect(compactCode(dialogTrigger)).toContain(compactCode("targetId?: string;"));
    expect(compactCode(dialogTrigger)).toContain(compactCode("function DialogTrigger("));
    expect(compactCode(dialogTrigger)).toContain(
      compactCode("{ asChild = false, children, className, targetId, ...props }"),
    );
    expect(compactCode(dialogTrigger)).toContain(
      compactCode("data-sw-dialog-target-id={targetId}"),
    );
    expect(compactCode(dialogTrigger)).not.toContain(compactCode("data-dialog-for"));
    expect(compactCode(dialogIndex)).toContain(compactCode("const Dialog ="));
    expect(compactCode(dialogIndex)).toContain(compactCode("Root: DialogRoot"));
    expect(compactCode(dialogIndex)).toContain(compactCode("Backdrop: DialogBackdrop"));
    expect(compactCode(dialogIndex)).toContain(compactCode("Popup: DialogPopup"));
    expect(compactCode(dialogIndex)).not.toContain(compactCode("DialogContent"));

    assertTypeScriptModule(alertDialogRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(alertDialogTrigger)).toContain(compactCode("data-sw-alert-dialog-trigger"));
    expect(compactCode(alertDialogTrigger)).toContain(compactCode("targetId?: string;"));
    expect(compactCode(alertDialogTrigger)).toContain(compactCode("function AlertDialogTrigger("));
    expect(compactCode(alertDialogTrigger)).toContain(
      compactCode("{ asChild = false, children, className, targetId, ...props }"),
    );
    expect(compactCode(alertDialogTrigger)).toContain(
      compactCode("data-sw-alert-dialog-target-id={targetId}"),
    );
    expect(compactCode(alertDialogTrigger)).not.toContain(compactCode("data-dialog-for"));
    expect(compactCode(alertDialogTrigger)).not.toContain(compactCode("data-sw-dialog-trigger"));
    expect(compactCode(alertDialogPopup)).toContain(compactCode("<dialog"));
    expect(compactCode(alertDialogPopup)).toContain(compactCode("data-sw-alert-dialog-popup"));
    expect(compactCode(alertDialogPopup)).not.toContain(compactCode("data-sw-dialog-content"));
    expect(compactCode(alertDialogPopup)).toContain(compactCode('role="alertdialog"'));
    expect(compactCode(alertDialogClose)).toContain(compactCode("data-sw-alert-dialog-close"));
    expect(compactCode(alertDialogClose)).not.toContain(compactCode("data-sw-dialog-close"));
    expect(compactCode(alertDialogClose)).toContain(
      compactCode("export function __useAlertDialogControl"),
    );
    expect(compactCode(alertDialogClose)).toContain(compactCode("useNativeOverlayControl"));
    expect(compactCode(alertDialogIndex)).toContain(compactCode("const AlertDialog ="));
    expect(compactCode(alertDialogIndex)).toContain(compactCode("Root: AlertDialogRoot"));
    expect(compactCode(alertDialogIndex)).toContain(compactCode("Popup: AlertDialogPopup"));
    expect(compactCode(alertDialogIndex)).toContain(compactCode("AlertDialogCloseCompleteDetails"));
    expect(compactCode(alertDialogIndex)).toContain(compactCode("AlertDialogOpenChangeDetails"));
    expect(compactCode(alertDialogIndex)).toContain(
      compactCode('export { __useAlertDialogControl } from "./AlertDialogClose";'),
    );
    expect(alertDialogIndex.match(/const AlertDialog = \{[\s\S]*?\};/)?.[0]).not.toContain(
      "__useAlertDialogControl",
    );
    expect(compactCode(dialogIndex)).not.toContain(compactCode("__useAlertDialogControl"));
    expect(compactCode(drawerIndex)).not.toContain(compactCode("__useAlertDialogControl"));
    expect(compactCode(alertDialogIndex)).toContain(compactCode('from "@starwind-ui/runtime";'));
    expect(compactCode(rootIndex)).toContain(compactCode("AlertDialogCloseCompleteDetails"));

    assertTypeScriptModule(drawerRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(drawerTrigger)).toContain(compactCode("data-sw-drawer-trigger"));
    expect(compactCode(drawerTrigger)).toContain(compactCode("targetId?: string;"));
    expect(compactCode(drawerTrigger)).toContain(compactCode("function DrawerTrigger("));
    expect(compactCode(drawerTrigger)).toContain(
      compactCode("{ asChild = false, children, className, targetId, ...props }"),
    );
    expect(compactCode(drawerTrigger)).toContain(
      compactCode("data-sw-drawer-target-id={targetId}"),
    );
    expect(compactCode(drawerTrigger)).not.toContain(compactCode("data-dialog-for"));
    expect(compactCode(drawerTrigger)).not.toContain(compactCode("data-sw-dialog-trigger"));
    expect(compactCode(drawerPopup)).toContain(compactCode("<dialog"));
    expect(compactCode(drawerPopup)).toContain(compactCode("data-sw-drawer-popup"));
    expect(compactCode(drawerPopup)).not.toContain(compactCode("data-sw-dialog-content"));
    expect(compactCode(drawerPopup)).not.toContain(compactCode('role="dialog"'));
    expect(compactCode(drawerClose)).toContain(compactCode("data-sw-drawer-close"));
    expect(compactCode(drawerClose)).not.toContain(compactCode("data-sw-dialog-close"));
    expect(compactCode(drawerIndex)).toContain(compactCode("const Drawer ="));
    expect(compactCode(drawerIndex)).toContain(compactCode("Root: DrawerRoot"));
    expect(compactCode(drawerIndex)).toContain(compactCode("Popup: DrawerPopup"));

    assertTypeScriptModule(dropzoneRoot); // Ordinary behavior is covered by the component browser suite.

    assertTypeScriptModule(fieldRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(fieldLabel)).toContain(compactCode("data-sw-field-label"));
    expect(compactCode(fieldControl)).toContain(
      compactCode('import InputRoot from "../input/InputRoot";'),
    );
    expect(compactCode(fieldControl)).toContain(compactCode("data-sw-field-control"));
    expect(compactCode(fieldDescription)).toContain(compactCode("data-sw-field-description"));
    expect(compactCode(fieldError)).toContain(compactCode("data-sw-field-error"));
    expect(compactCode(fieldError)).toContain(
      compactCode('export type FieldErrorMessageSource = "children" | "validation";'),
    );
    expect(compactCode(fieldError)).toContain(
      compactCode("messageSource?: FieldErrorMessageSource;"),
    );
    expect(compactCode(fieldError)).toContain(compactCode("match = false"));
    expect(compactCode(fieldError)).toContain(compactCode("data-match={serializedMatch}"));
    expect(compactCode(fieldError)).toContain(compactCode("data-message-source={messageSource}"));
    expect(compactCode(fieldError)).toContain(compactCode("hidden={hidden}"));
    expect(compactCode(fieldItem)).toContain(compactCode("data-sw-field-item"));
    expect(compactCode(fieldValidity)).toContain(compactCode("data-sw-field-validity"));
    expect(compactCode(fieldValidity)).toContain(compactCode("match = true"));
    expect(compactCode(fieldValidity)).toContain(compactCode("data-match={serializedMatch}"));
    expect(compactCode(fieldValidity)).toContain(compactCode("hidden={hidden}"));
    expect(compactCode(fieldIndex)).toContain(compactCode("Root: FieldRoot"));
    expect(compactCode(fieldIndex)).toContain(compactCode("Error: FieldError"));
    expect(compactCode(fieldIndex)).toContain(compactCode("Validity: FieldValidity"));

    assertTypeScriptModule(fieldsetRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(fieldsetLegend)).toContain(compactCode("data-sw-fieldset-legend"));
    expect(compactCode(fieldsetIndex)).toContain(compactCode("Root: FieldsetRoot"));
    expect(compactCode(fieldsetIndex)).toContain(compactCode("Legend: FieldsetLegend"));

    assertTypeScriptModule(formRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(formErrorSummary)).toContain(
      compactCode("React.forwardRef<HTMLDivElement, FormErrorSummaryProps>"),
    );
    expect(compactCode(formErrorSummary)).toContain(compactCode("data-sw-form-error-summary"));
    expect(compactCode(formErrorSummary)).toContain(compactCode('data-slot="form-error-summary"'));
    expect(compactCode(formErrorSummary)).toContain(compactCode('role = "status"'));
    expect(compactCode(formErrorSummary)).toContain(
      compactCode('"aria-live": ariaLive = "polite"'),
    );
    expect(compactCode(formErrorSummary)).toContain(
      compactCode('"aria-atomic": ariaAtomic = "true"'),
    );
    expect(compactCode(formErrorSummary)).toContain(compactCode("hidden={hidden}"));
    expect(compactCode(formErrorSummary)).toContain(compactCode("{children}"));
    expect(compactCode(formIndex)).toContain(compactCode("Root: FormRoot"));
    expect(compactCode(formIndex)).toContain(compactCode("ErrorSummary: FormErrorSummary"));
    expect(compactCode(formIndex)).toContain(compactCode("FormErrorSummary"));

    assertTypeScriptModule(popoverRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(popoverTrigger)).toContain(compactCode("asChild?: boolean;"));
    expect(compactCode(popoverTrigger)).toContain(compactCode("getAsChildElement(children)"));
    expect(compactCode(popoverTrigger)).toContain(compactCode("React.cloneElement"));
    expect(compactCode(popoverTrigger)).toContain(compactCode("data-sw-popover-trigger"));
    expect(compactCode(popoverTrigger)).toContain(compactCode('"aria-haspopup": "dialog"'));
    expect(popoverTrigger).toMatch(
      /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
    );
    expect(compactCode(popoverTrigger)).toContain(
      compactCode("const composedRef = useComposedRefs("),
    );
    expect(compactCode(popoverTrigger)).toContain(compactCode("ref: composedRef"));
    expect(compactCode(popoverTrigger)).not.toContain(compactCode("function mergeRefs"));
    expect(compactCode(popoverPositioner)).toContain(compactCode("data-sw-popover-positioner"));
    expect(compactCode(popoverPositioner)).toContain(compactCode("data-side={side}"));
    expect(compactCode(popoverPositioner)).toContain(compactCode("data-align={align}"));
    expect(compactCode(popoverPositioner)).toContain(compactCode("data-side-offset={sideOffset}"));
    expect(compactCode(popoverPositioner)).toContain(
      compactCode("data-avoid-collisions={String(avoidCollisions)}"),
    );
    expect(compactCode(popoverPositioner)).toContain(compactCode("ref={composedRef}"));
    expect(compactCode(popoverPositioner)).toContain(compactCode("{...props}"));
    expect(compactCode(popoverPopup)).toContain(compactCode("data-sw-popover-popup"));
    expect(compactCode(popoverPopup)).toContain(compactCode("data-side={side}"));
    expect(compactCode(popoverPopup)).toContain(compactCode("data-align={align}"));
    expect(compactCode(popoverPopup)).toContain(compactCode("data-side-offset={sideOffset}"));
    expect(compactCode(popoverPopup)).toContain(
      compactCode("data-avoid-collisions={String(avoidCollisions)}"),
    );
    expect(compactCode(popoverPopup)).toContain(compactCode('role="dialog"'));
    expect(compactCode(popoverPopup)).toContain(compactCode("tabIndex={-1}"));
    expect(compactCode(popoverPopup)).toContain(compactCode("hidden"));
    expect(compactCode(popoverPopup)).toContain(compactCode("ref={composedRef}"));
    expect(compactCode(popoverPopup)).toContain(compactCode("{...props}"));
    expect(compactCode(popoverClose)).toContain(compactCode("data-sw-popover-close"));
    expect(compactCode(popoverIndex)).toContain(compactCode("const Popover ="));
    expect(compactCode(popoverIndex)).toContain(compactCode("Root: PopoverRoot"));
    expect(compactCode(popoverIndex)).toContain(compactCode("Positioner: PopoverPositioner"));
    expect(compactCode(popoverIndex)).toContain(compactCode("Popup: PopoverPopup"));

    assertTypeScriptModule(avatarRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(avatarImage)).toContain(compactCode("alt: string;"));
    expect(compactCode(avatarImage)).toContain(compactCode("onLoadingStatusChange?:"));
    expect(compactCode(avatarImage)).toContain(compactCode("starwind:loading-status-change"));
    expect(compactCode(avatarImage)).toContain(compactCode("root.addEventListener"));
    expect(compactCode(avatarImage)).toContain(compactCode("root.removeEventListener"));
    expect(compactCode(avatarImage)).toContain(
      compactCode("const onLoadingStatusChangeRef = React.useRef(onLoadingStatusChange)"),
    );
    expect(compactCode(avatarImage)).toContain(
      compactCode("const hasLoadingStatusChangeCallback = onLoadingStatusChange !== undefined"),
    );
    expect(compactCode(avatarImage)).toContain(
      compactCode("onLoadingStatusChangeRef.current = onLoadingStatusChange"),
    );
    expect(compactCode(avatarImage)).toContain(
      compactCode("onLoadingStatusChangeRef.current?.(details.status, details)"),
    );
    expect(compactCode(avatarImage)).toContain(
      compactCode('root.getAttribute("data-image-loading-status")'),
    );

    expect(compactCode(avatarImage)).toContain(
      compactCode(
        'onLoadingStatusChangeRef.current?.(status, { previousStatus: "idle", status });',
      ),
    );

    expect(compactCode(avatarImage)).toContain(
      compactCode("}, [hasLoadingStatusChangeCallback]);"),
    );
    expect(compactCode(avatarImage)).not.toContain(compactCode("}, [onLoadingStatusChange]);"));
    expect(compactCode(avatarImage)).toContain(compactCode("data-sw-avatar-image"));
    expect(compactCode(avatarImage)).toContain(
      compactCode('style={{ ...style, visibility: "hidden" }}'),
    );
    expect(compactCode(avatarImage)).toContain(compactCode("hidden={false}"));
    expect(compactCode(avatarImage)).not.toContain(compactCode("node.hidden"));
    expect(compactCode(avatarFallback)).toContain(compactCode("delay?: number"));
    expect(compactCode(avatarFallback)).toContain(compactCode("data-sw-avatar-fallback"));
    expect(compactCode(avatarFallback)).toContain(compactCode("data-delay"));
    expect(avatarFallback).not.toContain(removedAttr("data-sw-avatar-fallback", "delay"));

    expect(compactCode(avatarFallback)).not.toContain(
      compactCode("hidden={hidden ?? delay !== undefined}"),
    );
    expect(compactCode(avatarIndex)).toContain(compactCode("Root: AvatarRoot"));
    expect(compactCode(avatarIndex)).toContain(compactCode("Image: AvatarImage"));
    expect(compactCode(avatarIndex)).toContain(compactCode("Fallback: AvatarFallback"));

    assertTypeScriptModule(checkboxRoot); // Ordinary behavior is covered by the component browser suite.

    expectAttributeCount(checkboxRoot, "data-disabled", 1);
    expectAttributeCount(checkboxRoot, "data-indeterminate", 1);
    expectAttributeCount(checkboxRoot, "data-readonly", 1);
    expectAttributeCount(checkboxRoot, "data-required", 1);

    expect(compactCode(checkboxIndicator)).toContain(compactCode("keepMounted?: boolean"));
    expect(compactCode(checkboxIndicator)).toContain(compactCode("data-sw-checkbox-indicator"));
    expect(compactCode(checkboxIndicator)).toContain(
      compactCode("React.useContext(CheckboxIndicatorContext)"),
    );
    expect(compactCode(checkboxIndicator)).toContain(
      compactCode("if (!keepMounted && !active) return null"),
    );
    expect(compactCode(checkboxIndicator)).toContain(compactCode("node.hidden = hidden ?? false"));
    expect(compactCode(checkboxIndicator)).toContain(compactCode("hidden={hidden ?? false}"));
    expect(compactCode(checkboxIndicator)).toContain(
      compactCode("data-disabled={indicatorState.disabled"),
    );
    expect(compactCode(checkboxIndicator)).toContain(
      compactCode("data-readonly={indicatorState.readOnly"),
    );
    expect(compactCode(checkboxIndicator)).toContain(
      compactCode("data-required={indicatorState.required"),
    );
    expect(compactCode(checkboxIndicator)).not.toContain(compactCode("React.useEffect"));
    expect(compactCode(checkboxIndex)).toContain(compactCode("Root: CheckboxRoot"));
    expect(compactCode(checkboxIndex)).toContain(compactCode("Indicator: CheckboxIndicator"));

    assertTypeScriptModule(checkboxGroupRoot); // Ordinary behavior is covered by the component browser suite.

    expectAttributeCount(checkboxGroupRoot, "data-disabled", 1);

    expect(compactCode(checkboxGroupContext)).toContain(compactCode("React.createContext"));
    expect(compactCode(checkboxGroupContext)).toContain(compactCode("useCheckboxGroupContext"));
    expect(compactCode(checkboxGroupContext)).toContain(compactCode("CheckboxGroupValue"));
    expect(compactCode(checkboxGroupIndex)).toContain(compactCode("CheckboxGroupContext"));
    expect(compactCode(checkboxGroupIndex)).toContain(compactCode("useCheckboxGroupContext"));
    expect(compactCode(checkboxGroupIndex)).toContain(compactCode("Root: CheckboxGroupRoot"));
    expect(checkboxGroupIndex).toBe(
      await readFile(path.resolve("packages/react/src/checkbox-group/index.ts"), "utf8"),
    );

    assertTypeScriptModule(radioRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(radioIndicator)).toContain(compactCode("data-sw-radio-indicator"));
    expect(compactCode(radioIndicator)).toContain(compactCode("data-keep-mounted"));
    expect(compactCode(radioIndex)).toContain(compactCode("Root: RadioRoot"));
    expect(compactCode(radioIndex)).toContain(compactCode("Indicator: RadioIndicator"));

    assertTypeScriptModule(radioGroupRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(radioGroupContext)).toContain(compactCode("React.createContext"));
    expect(compactCode(radioGroupContext)).toContain(compactCode("useRadioGroupContext"));
    expect(compactCode(radioGroupContext)).toContain(compactCode("value: RadioGroupValue"));
    expect(compactCode(radioGroupIndex)).toContain(compactCode("RadioGroupContext"));
    expect(compactCode(radioGroupIndex)).toContain(compactCode("Root: RadioGroupRoot"));
    expect(radioGroupIndex).toBe(
      await readFile(path.resolve("packages/react/src/radio-group/index.ts"), "utf8"),
    );

    assertTypeScriptModule(inputRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(inputIndex)).toContain(compactCode("Root: InputRoot"));

    assertTypeScriptModule(inputOtpRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(inputOtpGroup)).toContain(compactCode("data-sw-input-otp-group"));
    expect(compactCode(inputOtpSlot)).toContain(compactCode("data-sw-input-otp-slot"));
    expect(compactCode(inputOtpSlot)).toContain(compactCode("data-sw-input-otp-char"));
    expect(compactCode(inputOtpSlot)).toContain(compactCode("data-sw-input-otp-caret"));
    expect(compactCode(inputOtpSlot)).toContain(compactCode("caret?: React.ReactNode"));
    expect(compactCode(inputOtpSeparator)).toContain(compactCode("data-sw-input-otp-separator"));
    expect(compactCode(inputOtpIndex)).toContain(compactCode("Root: InputOtpRoot"));
    expect(compactCode(inputOtpIndex)).toContain(compactCode("Slot: InputOtpSlot"));

    assertTypeScriptModule(progressRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(progressTrack)).toContain(compactCode("data-sw-progress-track"));
    expect(compactCode(progressIndicator)).toContain(compactCode("data-sw-progress-indicator"));
    expect(compactCode(progressValue)).toContain(compactCode("data-sw-progress-value"));
    expect(compactCode(progressValue)).toContain(compactCode('aria-hidden="true"'));
    expect(compactCode(progressValue)).toContain(
      compactCode('data-preserve-text={children == null ? undefined : ""}'),
    );
    expect(compactCode(progressLabel)).toContain(compactCode("data-sw-progress-label"));
    expect(compactCode(progressLabel)).toContain(compactCode('role={"presentation"}'));
    expect(compactCode(progressIndex)).toContain(compactCode("Root: ProgressRoot"));
    expect(compactCode(progressIndex)).toContain(compactCode("Indicator: ProgressIndicator"));
    expect(compactCode(progressIndex)).toContain(compactCode("Value: ProgressValue"));

    assertTypeScriptModule(menuRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(menuTrigger)).toContain(compactCode("asChild?: boolean;"));
    expect(compactCode(menuTrigger)).toContain(compactCode("getAsChildElement(children)"));
    expect(compactCode(menuTrigger)).toContain(compactCode("React.cloneElement"));
    expect(compactCode(menuTrigger)).toContain(compactCode('"data-sw-menu-trigger": ""'));
    expect(menuTrigger).toMatch(
      /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
    );
    expect(compactCode(menuTrigger)).toContain(compactCode("const composedRef = useComposedRefs("));
    expect(compactCode(menuTrigger)).toContain(compactCode("ref: composedRef"));
    expect(compactCode(menuTrigger)).not.toContain(compactCode("function mergeRefs"));
    expect(compactCode(menuItem)).toContain(compactCode("tabIndex={0}"));
    expect(compactCode(menuItem)).toContain(compactCode("closeOnClick?: boolean;"));
    expect(compactCode(menuItem)).toContain(compactCode("function MenuItem("));
    expect(compactCode(menuItem)).toContain(
      compactCode("{ disabled = false, closeOnClick = true, ...props }"),
    );
    expect(compactCode(menuItem)).toContain(
      compactCode('data-close-on-click={closeOnClick ? undefined : "false"}'),
    );
    expect(compactCode(menuLinkItem)).toContain(compactCode("tabIndex={0}"));
    expect(compactCode(menuLinkItem)).toContain(compactCode("closeOnClick?: boolean;"));
    expect(compactCode(menuLinkItem)).toContain(compactCode("function MenuLinkItem("));
    expect(compactCode(menuLinkItem)).toContain(
      compactCode("{ disabled = false, href, closeOnClick = false, ...props }"),
    );
    expect(compactCode(menuLinkItem)).toContain(
      compactCode('data-close-on-click={closeOnClick ? "true" : undefined}'),
    );
    expect(compactCode(menuCheckboxItem)).toContain(compactCode("tabIndex={0}"));
    expect(compactCode(menuCheckboxItem)).toContain(compactCode("MenuCheckedChangeDetails"));
    expect(compactCode(menuCheckboxItem)).toContain(
      compactCode(
        "onCheckedChange?: (checked: boolean, details: MenuCheckedChangeDetails) => void;",
      ),
    );
    expect(compactCode(menuCheckboxItem)).toContain(
      compactCode("const checkedRef = React.useRef(checked)"),
    );
    expect(compactCode(menuCheckboxItem)).toContain(
      compactCode("const defaultCheckedRef = React.useRef(defaultChecked)"),
    );
    expect(compactCode(menuCheckboxItem)).toContain(
      compactCode("onCheckedChangeRef.current?.(details.checked, details)"),
    );

    expect(compactCode(menuCheckboxItem)).toContain(
      compactCode("setUncontrolledChecked(details.checked)"),
    );

    expect(compactCode(menuCheckboxItem)).toContain(
      compactCode("const renderedChecked = checked ?? uncontrolledChecked"),
    );
    expect(compactCode(menuRadioGroup)).toContain(compactCode("MenuValueChangeDetails"));
    expect(compactCode(menuRadioGroup)).toContain(compactCode("onValueChange?:"));

    expect(compactCode(menuRadioGroup)).toContain(
      compactCode("setUncontrolledValue(details.value)"),
    );

    expect(compactCode(menuRadioGroup)).toContain(
      compactCode('group.addEventListener("starwind:value-change"'),
    );
    expect(compactCode(menuRadioGroup)).toContain(
      compactCode("const renderedValue = value ?? uncontrolledValue"),
    );
    expect(compactCode(menuRadioContext)).toContain(
      compactCode("export const MenuRadioGroupContext"),
    );
    expect(compactCode(menuRadioContext)).toContain(compactCode("useMenuRadioGroupContext"));
    expect(compactCode(menuRadioContext)).toContain(
      compactCode("export const MenuRadioItemContext"),
    );
    expect(compactCode(menuRadioGroup)).toContain(compactCode('from "./MenuRadioContext"'));
    expect(compactCode(menuRadioGroup)).toContain(
      compactCode("<MenuRadioGroupContext.Provider value={radioGroupContext}>"),
    );
    expect(compactCode(menuRadioItem)).toContain(compactCode('role="menuitemradio"'));
    expect(compactCode(menuRadioItem)).toContain(
      compactCode("const radioGroup = useMenuRadioGroupContext();"),
    );

    expect(compactCode(menuRadioItem)).toContain(
      compactCode("<MenuRadioItemContext.Provider value={radioItemContext}>"),
    );
    expect(compactCode(menuRadioItem)).not.toContain(compactCode("aria-checked={initialChecked}"));
    expect(compactCode(menuRadioItemIndicator)).toContain(
      compactCode("const radioItem = useMenuRadioItemContext();"),
    );
    expect(compactCode(menuRadioItemIndicator)).toContain(
      compactCode('data-state={checked ? "checked" : "unchecked"}'),
    );
    expect(compactCode(menuSubmenuTrigger)).toContain(compactCode("tabIndex={0}"));
    assertTypeScriptModule(navigationMenuRoot); // Ordinary behavior is covered by the component browser suite.
    expect(compactCode(navigationMenuContent)).toContain(
      compactCode('style={{ display: "contents" }} ref={registerCarrier}'),
    );
    expect(compactCode(navigationMenuContent)).toContain(
      compactCode("previous.carrier.append(previous.content)"),
    );
    expect(compactCode(navigationMenuContent)).toContain(
      compactCode("carrier: HTMLDivElement | null"),
    );
    expect(navigationMenuContent).toMatch(/hidden\s+ref=\{forwardedRef\}/);
    expect(compactCode(navigationMenuContent)).not.toContain(compactCode("return () =>"));

    expect(compactCode(navigationMenuTrigger)).toContain(compactCode("data-sw-nav-menu-trigger"));
    expect(compactCode(navigationMenuTrigger)).toContain(compactCode("openDelay?: number;"));
    expect(compactCode(navigationMenuTrigger)).toContain(compactCode("closeDelay?: number;"));
    expect(compactCode(navigationMenuTrigger)).toContain(
      compactCode('"data-open-delay": openDelay !== undefined ? String(openDelay) : undefined'),
    );
    expect(compactCode(navigationMenuTrigger)).toContain(
      compactCode('"data-close-delay": closeDelay !== undefined ? String(closeDelay) : undefined'),
    );
    expect(compactCode(navigationMenuTrigger)).toContain(compactCode('"aria-haspopup": "menu"'));
    expect(compactCode(navigationMenuTrigger)).toContain(compactCode("React.cloneElement"));
    expect(compactCode(navigationMenuLink)).toContain(compactCode("closeOnClick?: boolean;"));
    expect(compactCode(navigationMenuLink)).toContain(compactCode("closeOnClick = true"));
    expect(compactCode(navigationMenuLink)).toContain(
      compactCode('data-close-on-click={closeOnClick ? undefined : "false"}'),
    );
    expect(compactCode(navigationMenuLink)).toContain(
      compactCode('aria-current={active ? "page" : undefined}'),
    );
    expect(compactCode(navigationMenuPositioner)).toContain(
      compactCode("data-sw-nav-menu-positioner"),
    );
    expect(compactCode(navigationMenuPositioner)).toContain(compactCode("data-side={side}"));
    expect(compactCode(navigationMenuPositioner)).toContain(compactCode("data-align={align}"));
    expect(compactCode(navigationMenuPositioner)).toContain(
      compactCode("data-side-offset={String(sideOffset)}"),
    );
    expect(compactCode(navigationMenuPositioner)).toContain(
      compactCode("data-align-offset={String(alignOffset)}"),
    );
    expect(compactCode(navigationMenuPositioner)).toContain(compactCode("data-avoid-collisions"));
    expect(compactCode(navigationMenuPopup)).toContain(compactCode("data-sw-nav-menu-popup"));
    expect(compactCode(navigationMenuPopup)).toContain(compactCode("hidden"));
    expect(compactCode(navigationMenuViewport)).toContain(compactCode("data-sw-nav-menu-viewport"));
    expect(compactCode(navigationMenuViewport)).toContain(compactCode("hidden"));
    expect(compactCode(navigationMenuIndex)).toContain(compactCode("Root: NavigationMenuRoot"));
    expect(compactCode(navigationMenuIndex)).toContain(
      compactCode("Trigger: NavigationMenuTrigger"),
    );
    expect(compactCode(navigationMenuIndex)).toContain(
      compactCode("Viewport: NavigationMenuViewport"),
    );
    expect(compactCode(navigationMenuIndex)).toContain(compactCode("Arrow: NavigationMenuArrow"));

    expect(compactCode(tooltipPopup)).toContain(
      compactCode("export type TooltipPopupProps = Omit<"),
    );
    expect(compactCode(tooltipPopup)).toContain(
      compactCode("React.HTMLAttributes<HTMLDivElement>"),
    );
    expect(compactCode(tooltipPopup)).toContain(compactCode('"tabIndex" | "tabindex"'));
    expect(compactCode(tooltipPositioner)).toContain(compactCode("data-sw-tooltip-positioner"));
    expect(compactCode(tooltipPositioner)).toContain(compactCode("data-side={side}"));
    expect(compactCode(tooltipPositioner)).toContain(compactCode("data-align={align}"));
    expect(compactCode(tooltipPositioner)).toContain(compactCode("data-side-offset={sideOffset}"));
    expect(compactCode(tooltipPositioner)).toContain(
      compactCode("data-avoid-collisions={String(avoidCollisions)}"),
    );
    expect(compactCode(tooltipPositioner)).toContain(compactCode("ref={composedRef}"));
    expect(compactCode(tooltipPositioner)).toContain(compactCode("{...props}"));
    expect(compactCode(tooltipPopup)).toContain(compactCode('role="tooltip"'));
    expect(compactCode(tooltipPopup)).toContain(compactCode("data-side={side}"));
    expect(compactCode(tooltipPopup)).toContain(compactCode("data-align={align}"));
    expect(compactCode(tooltipPopup)).toContain(compactCode("data-side-offset={sideOffset}"));
    expect(compactCode(tooltipPopup)).toContain(
      compactCode("data-avoid-collisions={String(avoidCollisions)}"),
    );
    expect(compactCode(tooltipPopup)).toContain(compactCode("hidden"));
    expect(compactCode(tooltipPopup)).toContain(compactCode("ref={composedRef}"));
    expect(compactCode(tooltipPopup)).toContain(compactCode("{...props}"));
    expect(compactCode(tooltipPopup)).not.toContain(compactCode("tabIndex="));
    assertTypeScriptModule(tooltipRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(tooltipTrigger)).toContain(compactCode("asChild?: boolean;"));
    expect(compactCode(tooltipTrigger)).not.toContain(compactCode("openDelay"));
    expect(compactCode(tooltipTrigger)).not.toContain(compactCode("closeDelay"));
    expect(compactCode(tooltipTrigger)).not.toContain(compactCode("data-open-delay"));
    expect(compactCode(tooltipTrigger)).not.toContain(compactCode("data-close-delay"));

    assertTypeScriptModule(sliderRoot); // Ordinary behavior is covered by the component browser suite.

    assertTypeScriptModule(scrollAreaRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(scrollAreaViewport)).toContain(
      compactCode("React.forwardRef<HTMLDivElement"),
    );
    expect(compactCode(scrollAreaViewport)).toContain(compactCode("data-sw-scroll-area-viewport"));
    expect(compactCode(scrollAreaViewport)).toContain(compactCode('role={"presentation"}'));
    expect(compactCode(scrollAreaViewport)).toContain(compactCode("tabIndex={tabIndex ?? -1}"));
    expect(compactCode(scrollAreaViewport)).toContain(
      compactCode('style={{ ...style, overflow: "scroll" }}'),
    );
    expect(compactCode(scrollAreaContent)).toContain(compactCode("data-sw-scroll-area-content"));
    expect(compactCode(scrollAreaScrollbar)).toContain(
      compactCode("data-sw-scroll-area-scrollbar"),
    );
    expect(compactCode(scrollAreaScrollbar)).toContain(compactCode('orientation = "vertical"'));
    expect(compactCode(scrollAreaScrollbar)).toContain(
      compactCode("data-orientation={orientation}"),
    );
    expect(compactCode(scrollAreaScrollbar)).toContain(compactCode("data-keep-mounted"));
    expect(compactCode(scrollAreaThumb)).toContain(compactCode("data-sw-scroll-area-thumb"));
    expect(compactCode(scrollAreaCorner)).toContain(compactCode("data-sw-scroll-area-corner"));
    expect(compactCode(scrollAreaIndex)).toContain(compactCode("Root: ScrollAreaRoot"));
    expect(compactCode(scrollAreaIndex)).toContain(compactCode("Viewport: ScrollAreaViewport"));
    expect(compactCode(scrollAreaIndex)).toContain(compactCode("Content: ScrollAreaContent"));
    expect(compactCode(scrollAreaIndex)).toContain(compactCode("Scrollbar: ScrollAreaScrollbar"));
    expect(compactCode(scrollAreaIndex)).toContain(compactCode("Thumb: ScrollAreaThumb"));
    expect(compactCode(scrollAreaIndex)).toContain(compactCode("Corner: ScrollAreaCorner"));
    assertTypeScriptModule(selectRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(selectContext)).toContain(compactCode("export const SelectContext"));
    expect(compactCode(selectContext)).toContain(compactCode("export const SelectItemContext"));
    expect(compactCode(selectContext)).toContain(compactCode("disabled: boolean;"));
    expect(compactCode(selectContext)).toContain(compactCode("readOnly: boolean;"));
    expect(compactCode(selectContext)).toContain(compactCode("required: boolean;"));
    expect(compactCode(selectContext)).toContain(compactCode("selectedLabel: string | null;"));
    expect(compactCode(selectContext)).toContain(compactCode("export function useSelectContext()"));
    expect(compactCode(selectTrigger)).toContain(compactCode("data-sw-select-trigger"));
    expect(compactCode(selectTrigger)).toContain(compactCode('"aria-haspopup": "listbox"'));
    expect(compactCode(selectTrigger)).toContain(compactCode("const select = useSelectContext();"));
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"aria-expanded": select.open ? "true" : "false"'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"aria-disabled": select.disabled ? "true" : undefined'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"aria-required": select.required ? "true" : undefined'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"aria-readonly": select.readOnly ? "true" : "false"'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"data-disabled": select.disabled ? "" : undefined'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"data-required": select.required ? "" : undefined'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"data-readonly": select.readOnly ? "" : undefined'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode('"data-state": select.open ? "open" : "closed"'),
    );
    expect(compactCode(selectTrigger)).toContain(
      compactCode("disabled: select.disabled || undefined"),
    );
    expect(compactCode(selectTrigger)).toContain(compactCode("disabled={select.disabled}"));
    expect(compactCode(selectTrigger)).not.toContain(compactCode('"aria-expanded": "false"'));
    expect(compactCode(selectTrigger)).toContain(compactCode("asChild"));
    expect(compactCode(selectTrigger)).toContain(compactCode("getAsChildElement(children)"));
    expect(compactCode(selectTrigger)).toContain(
      compactCode("protectedProps: protectedTriggerProps"),
    );
    expect(compactCode(selectValue)).toContain(compactCode("data-sw-select-value"));
    expect(compactCode(selectValue)).toContain(compactCode("const select = useSelectContext();"));
    expect(compactCode(selectValue)).toContain(compactCode("const fallback ="));

    expect(compactCode(selectValue)).toContain(compactCode("{children ?? fallback}"));
    expect(compactCode(selectPositioner)).toContain(compactCode("alignItemWithTrigger?: boolean"));
    expect(compactCode(selectPositioner)).toContain(compactCode("alignItemWithTrigger = true"));
    expect(compactCode(selectPositioner)).toContain(
      compactCode('data-align-item-with-trigger={alignItemWithTrigger ? "true" : "false"}'),
    );
    expect(compactCode(selectPositioner)).not.toContain(compactCode("alignItemsWithTrigger"));
    expect(compactCode(selectPositioner)).not.toContain(
      compactCode("data-align-items-with-trigger"),
    );
    expect(compactCode(selectPopup)).toContain(compactCode("data-sw-select-popup"));
    expect(compactCode(selectPopup)).toContain(compactCode("keepMounted?: boolean"));
    expect(compactCode(selectPopup)).toContain(compactCode("keepMounted = false"));
    expect(compactCode(selectPopup)).toContain(
      compactCode('import { useComposedRefs } from "../internal/compose-refs";'),
    );
    expect(compactCode(selectPopup)).toContain(
      compactCode('import { useClosePresence } from "../internal/use-close-presence";'),
    );
    expect(compactCode(selectPopup)).toContain(
      compactCode("const closePresence = useClosePresence<HTMLDivElement>({"),
    );
    expect(compactCode(selectPopup)).toContain(compactCode("keepMounted,"));
    expect(compactCode(selectPopup)).toContain(compactCode("open: select.open,"));
    expect(compactCode(selectPopup)).toContain(compactCode("const composedRef = useComposedRefs"));
    expect(compactCode(selectPopup)).toContain(compactCode('role="listbox"'));
    expect(compactCode(selectPopup)).toContain(
      compactCode('data-state={select.open ? "open" : "closed"}'),
    );
    expect(compactCode(selectPopup)).toContain(compactCode("hidden={closePresence.hidden}"));
    expect(compactCode(selectPopup)).toContain(compactCode("ref={composedRef}"));
    expect(compactCode(selectPopup)).toContain(
      compactCode("{closePresence.present ? props.children : null}"),
    );
    expect(compactCode(selectPopup)).not.toContain(compactCode("initialHiddenRef"));
    expect(compactCode(selectPopup)).not.toContain(compactCode("suppressHydrationWarning"));
    expect(compactCode(selectPopup)).not.toContain(compactCode('data-state="closed"'));
    expect(compactCode(selectPopup)).not.toContain(
      compactCode("const shouldRenderChildren = keepMounted || select.open;"),
    );
    expect(compactCode(selectItem)).toContain(compactCode("data-sw-select-item"));
    expect(compactCode(selectItem)).toContain(compactCode('role="option"'));
    expect(compactCode(selectItem)).toContain(compactCode("data-value={value}"));
    expect(compactCode(selectItem)).toContain(
      compactCode("const selected = select.value === value;"),
    );
    expect(compactCode(selectItem)).toContain(compactCode("aria-selected={selected}"));
    expect(compactCode(selectItem)).not.toContain(compactCode('aria-selected="false"'));
    expect(compactCode(selectItemIndicator)).toContain(
      compactCode("data-sw-select-item-indicator"),
    );
    expect(compactCode(selectItemIndicator)).toContain(
      compactCode("const selected = select.value === item.value;"),
    );
    expect(compactCode(selectItemIndicator)).toContain(
      compactCode('data-state={selected ? "checked" : "unchecked"}'),
    );
    expect(compactCode(selectItemIndicator)).toContain(compactCode("hidden={!selected}"));
    expect(compactCode(selectIndex)).toContain(compactCode("Root: SelectRoot"));
    expect(compactCode(selectIndex)).toContain(compactCode("SelectContext"));
    expect(compactCode(selectIndex)).toContain(compactCode("Trigger: SelectTrigger"));
    expect(compactCode(selectIndex)).toContain(compactCode("ItemIndicator: SelectItemIndicator"));
    expect(compactCode(selectIndex)).toContain(
      compactCode(
        'export type { SelectOpenChangeDetails, SelectValueChangeDetails } from "@starwind-ui/runtime";',
      ),
    );
    expect(compactCode(sidebarProvider)).toContain(compactCode("createSidebarController,"));
    expect(compactCode(sidebarProvider)).toContain(compactCode("type SidebarOpenChangeDetails"));
    expect(compactCode(sidebarProvider)).toContain(compactCode("defaultMobileOpen?: boolean"));
    expect(compactCode(sidebarProvider)).toContain(compactCode("mobileOpen?: boolean"));
    expect(compactCode(sidebarProvider)).toContain(compactCode("onMobileOpenChange?:"));
    expect(compactCode(sidebarProvider)).toContain(compactCode("persistOpen?: boolean"));

    expect(compactCode(sidebarProvider)).toContain(compactCode("data-sw-sidebar-provider"));
    expect(sidebarProvider).toContain("data-default-open");
    expect(sidebarProvider).toContain("data-default-mobile-open");
    expect(sidebarProvider).toContain("data-persist-open");

    expect(compactCode(sidebarContext)).toContain(compactCode("export type SidebarContextValue"));
    expect(compactCode(sidebarContext)).toContain(compactCode("useSidebarContext"));
    expect(compactCode(sidebar)).toContain(compactCode("data-sw-sidebar"));
    expect(compactCode(sidebar)).toContain(
      compactCode('import { useSidebarContext } from "./SidebarContext";'),
    );

    expect(sidebar).toContain("data-state");
    expect(sidebar).toContain("data-collapsible");
    expect(compactCode(sidebar)).toContain(compactCode("data-collapsible-mode={collapsible}"));
    expect(compactCode(sidebar)).not.toContain(compactCode('data-state="expanded"'));
    expect(compactCode(sidebar)).not.toContain(compactCode('data-collapsible=""'));
    expect(compactCode(sidebarTrigger)).toContain(compactCode("data-sw-sidebar-trigger"));
    expect(compactCode(sidebarTrigger)).toContain(
      compactCode('import { useSidebarContext } from "./SidebarContext";'),
    );
    expect(sidebarTrigger).toContain("aria-expanded");
    expect(sidebarTrigger).toContain("data-state");
    expect(compactCode(sidebarTrigger)).not.toContain(compactCode('"aria-expanded": "false"'));
    expect(compactCode(sidebarRail)).toContain(compactCode("data-sw-sidebar-rail"));
    expect(compactCode(sidebarRail)).toContain(
      compactCode('import { useSidebarContext } from "./SidebarContext";'),
    );
    expect(sidebarRail).toContain("aria-expanded");
    expect(sidebarRail).toContain("data-state");
    expect(compactCode(sidebarRail)).toContain(compactCode("tabIndex={-1}"));
    expect(compactCode(sidebarMenuButton)).toContain(compactCode("data-sw-sidebar-menu-button"));
    expect(compactCode(sidebarMenuButton)).toContain(
      compactCode('import { useSidebarContext } from "./SidebarContext";'),
    );
    expect(sidebarMenuButton).toContain("data-sidebar-state");
    expect(compactCode(sidebarMenuButton)).toContain(
      compactCode("mergeAsChildProps({ ...menuButtonProps, className }, childProps"),
    );
    expect(compactCode(sidebarMenuButton)).toContain(
      compactCode("protectedProps: protectedMenuButtonProps"),
    );
    expect(compactCode(sidebarMenuButton)).not.toContain(compactCode("function mergeAsChildProps"));
    expect(compactCode(sidebarMenuButton)).not.toContain(
      compactCode('"data-sidebar-state": "expanded"'),
    );
    expect(compactCode(sidebarIndex)).toContain(compactCode("Provider: SidebarProvider"));
    expect(compactCode(sidebarIndex)).toContain(compactCode("MenuButton: SidebarMenuButton"));
    expect(compactCode(sidebarIndex)).toContain(compactCode("SidebarContext"));
    expect(sidebarIndex).toMatch(
      /export type \{\s+SidebarMobileOpenChangeDetails,\s+SidebarOpenChangeDetails,\s+SidebarPersistenceStorage,\s+\} from "@starwind-ui\/runtime";/,
    );
    assertTypeScriptModule(comboboxRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(comboboxInput)).toContain(compactCode("data-sw-combobox-input"));
    expect(compactCode(comboboxInput)).toContain(compactCode('role="combobox"'));
    expect(compactCode(comboboxInput)).toContain(compactCode('aria-autocomplete="list"'));
    expect(compactCode(comboboxInput)).toContain(
      compactCode("const inputDisabled = combobox.disabled || props.disabled === true;"),
    );
    expect(compactCode(comboboxInput)).toContain(compactCode("disabled={inputDisabled}"));
    expect(compactCode(comboboxTrigger)).toContain(compactCode("data-sw-combobox-trigger"));
    expect(compactCode(comboboxTrigger)).toContain(compactCode("getAsChildElement(children)"));
    expect(compactCode(comboboxClear)).toContain(compactCode("data-sw-combobox-clear"));
    expect(compactCode(comboboxValue)).toContain(compactCode("placeholder?: string"));
    expect(compactCode(comboboxValue)).toContain(
      compactCode('import { useComboboxContext } from "./ComboboxContext";'),
    );
    expect(compactCode(comboboxValue)).toContain(
      compactCode("const displayedChildren = children ??"),
    );
    expect(compactCode(comboboxValue)).toContain(compactCode("data-sw-combobox-value"));
    expect(compactCode(comboboxValue)).toContain(compactCode("data-placeholder={placeholder}"));
    expect(compactCode(comboboxPopup)).toContain(compactCode("data-sw-combobox-popup"));
    expect(compactCode(comboboxPopup)).toContain(compactCode('role="listbox"'));
    expect(compactCode(comboboxPopup)).toContain(compactCode("keepMounted?: boolean"));
    expect(compactCode(comboboxPopup)).toContain(
      compactCode('import { useComposedRefs } from "../internal/compose-refs";'),
    );
    expect(compactCode(comboboxPopup)).toContain(
      compactCode('import { useClosePresence } from "../internal/use-close-presence";'),
    );
    expect(compactCode(comboboxPopup)).toContain(
      compactCode("const closePresence = useClosePresence<HTMLDivElement>({"),
    );
    expect(compactCode(comboboxPopup)).toContain(compactCode("keepMounted,"));
    expect(compactCode(comboboxPopup)).toContain(compactCode("open: combobox.open,"));
    expect(compactCode(comboboxPopup)).toContain(
      compactCode("const composedRef = useComposedRefs"),
    );
    expect(compactCode(comboboxPopup)).toContain(compactCode("hidden={closePresence.hidden}"));
    expect(compactCode(comboboxPopup)).toContain(compactCode("ref={composedRef}"));
    expect(compactCode(comboboxPopup)).toContain(
      compactCode("{closePresence.present ? props.children : null}"),
    );
    expect(compactCode(comboboxPopup)).not.toContain(
      compactCode("const shouldRenderChildren = keepMounted || combobox.open"),
    );
    expect(compactCode(comboboxItem)).toContain(compactCode("data-sw-combobox-item"));
    expect(compactCode(comboboxItem)).toContain(compactCode("data-value={value}"));
    expect(compactCode(comboboxIndex)).toContain(compactCode("Root: ComboboxRoot"));
    expect(compactCode(comboboxIndex)).toContain(compactCode("InputGroup: ComboboxInputGroup"));
    expect(compactCode(comboboxIndex)).toContain(
      compactCode("ItemIndicator: ComboboxItemIndicator"),
    );
    expect(compactCode(comboboxIndex)).toContain(compactCode("useComboboxContext"));
    expect(compactCode(toastViewport)).toContain(compactCode("createToastManager"));
    expect(compactCode(toastViewport)).toContain(compactCode("data-sw-toast-viewport"));
    expect(compactCode(toastViewport)).toContain(compactCode("data-position={position}"));
    expect(compactCode(toastViewport)).toContain(compactCode("data-limit={limit}"));
    expect(compactCode(toastViewport)).toContain(compactCode("data-duration={duration}"));
    expect(compactCode(toastViewport)).toContain(compactCode('aria-live="polite"'));
    expect(compactCode(toastTemplate)).toContain(
      compactCode("<template data-sw-toast-template={variant}"),
    );
    expect(compactCode(toastTemplate)).toContain(
      compactCode(
        'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
      ),
    );
    expect(compactCode(toastTemplate)).toContain(compactCode("useIsomorphicLayoutEffect(() =>"));
    expect(compactCode(toastTemplate)).not.toContain(compactCode("React.useLayoutEffect"));
    assertTypeScriptModule(toastRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(toastAction)).toContain(
      compactCode('<button type="button" data-sw-toast-action'),
    );
    expect(compactCode(toastClose)).toContain(compactCode("data-sw-toast-close"));
    expect(compactCode(toastClose)).toContain(compactCode('aria-label="Close notification"'));
    expect(compactCode(sliderControl)).toContain(compactCode("data-sw-slider-control"));
    expect(compactCode(sliderTrack)).toContain(compactCode("data-sw-slider-track"));
    expect(compactCode(sliderIndicator)).toContain(compactCode("data-sw-slider-indicator"));
    expect(compactCode(sliderLabel)).toContain(compactCode("data-sw-slider-label"));
    expect(compactCode(sliderLabel)).toContain(
      compactCode("React.HTMLAttributes<HTMLSpanElement>"),
    );
    expect(compactCode(sliderLabel)).toContain(
      compactCode('SliderLabel.displayName = "Slider.Label"'),
    );
    expect(compactCode(sliderThumb)).toContain(compactCode("data-sw-slider-thumb"));
    expect(compactCode(sliderThumb)).toContain(compactCode("data-index"));

    expect(compactCode(sliderThumb)).not.toContain(compactCode("inputName?: string"));
    expect(compactCode(sliderThumb)).not.toContain(compactCode("name={inputName}"));
    expect(compactCode(sliderThumb)).toContain(compactCode("visuallyHiddenStyle"));
    expect(compactCode(sliderThumb)).toContain(compactCode("data-sw-slider-input"));
    expect(compactCode(sliderThumb)).toContain(compactCode('aria-hidden="true"'));
    expect(compactCode(sliderThumb)).toContain(compactCode("tabIndex={-1}"));
    expect(compactCode(sliderThumb)).toContain(compactCode('type="range"'));
    expect(compactCode(sliderIndex)).toContain(compactCode("Root: SliderRoot"));
    expect(compactCode(sliderIndex)).toContain(compactCode("Control: SliderControl"));
    expect(compactCode(sliderIndex)).toContain(compactCode("Track: SliderTrack"));
    expect(compactCode(sliderIndex)).toContain(compactCode("Indicator: SliderIndicator"));
    expect(compactCode(sliderIndex)).toContain(compactCode("Label: SliderLabel"));
    expect(compactCode(sliderIndex)).toContain(compactCode("Thumb: SliderThumb"));

    assertTypeScriptModule(switchRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(switchThumb)).toContain(compactCode("data-sw-switch-thumb"));
    expect(compactCode(switchThumb)).not.toContain(compactCode("data-unchecked"));
    expect(compactCode(switchThumb)).toContain(
      compactCode("React.forwardRef<HTMLSpanElement, SwitchThumbProps>"),
    );
    expect(compactCode(switchIndex)).toContain(compactCode("Root: SwitchRoot"));
    expect(compactCode(switchIndex)).toContain(compactCode("Thumb: SwitchThumb"));

    expect(compactCode(tabsContext)).toContain(compactCode("React.createContext"));
    expect(compactCode(tabsContext)).toContain(compactCode("useTabsContext"));
    assertTypeScriptModule(tabsRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(tabsList)).toContain(compactCode("activateOnFocus?: boolean"));
    expect(compactCode(tabsList)).toContain(compactCode("loopFocus?: boolean"));
    expect(compactCode(tabsList)).toContain(compactCode("data-sw-tabs-list"));
    expect(compactCode(tabsList)).toContain(compactCode("data-activate-on-focus"));
    expect(compactCode(tabsList)).toContain(compactCode("data-loop-focus"));
    expect(compactCode(tabsList)).toContain(compactCode('role={"tablist"}'));
    expect(compactCode(tabsTab)).toContain(compactCode("data-sw-tabs-tab"));
    expect(compactCode(tabsTab)).toContain(compactCode("aria-selected={active}"));
    expect(compactCode(tabsTab)).toContain(compactCode("tabIndex={initialTabIndex}"));
    expect(compactCode(tabsPanel)).toContain(compactCode("data-sw-tabs-panel"));
    expect(compactCode(tabsPanel)).toContain(compactCode("hidden={initialHidden}"));
    expect(compactCode(tabsPanel)).toContain(compactCode('role={"tabpanel"}'));
    expect(compactCode(tabsIndicator)).toContain(compactCode("data-sw-tabs-indicator"));
    expect(compactCode(tabsIndicator)).not.toContain(compactCode("hidden={value === null}"));
    expect(compactCode(tabsIndicator)).toContain(compactCode('role={"presentation"}'));
    expect(compactCode(tabsIndex)).toContain(compactCode("TabsContext"));
    expect(compactCode(tabsIndex)).toContain(compactCode("Root: TabsRoot"));
    expect(compactCode(tabsIndex)).toContain(compactCode("List: TabsList"));
    expect(compactCode(tabsIndex)).toContain(compactCode("Tab: TabsTab"));
    expect(compactCode(tabsIndex)).toContain(compactCode("Panel: TabsPanel"));
    expect(compactCode(tabsIndex)).toContain(compactCode("Indicator: TabsIndicator"));

    assertTypeScriptModule(toggleRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(toggleIndex)).toContain(compactCode("Root: ToggleRoot"));

    assertTypeScriptModule(toggleGroupRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(toggleGroupContext)).toContain(
      compactCode("export type ToggleGroupContextValue = {"),
    );
    expect(compactCode(toggleGroupContext)).toContain(
      compactCode(
        "const ToggleGroupContext = React.createContext<ToggleGroupContextValue | undefined>(undefined);",
      ),
    );
    expect(compactCode(toggleGroupContext)).toContain(
      compactCode("function useToggleGroupContext(): ToggleGroupContextValue | undefined"),
    );
    expect(compactCode(toggleGroupIndex)).toContain(compactCode("const ToggleGroup ="));
    expect(compactCode(toggleGroupIndex)).toContain(compactCode("Root: ToggleGroupRoot"));
    expect(compactCode(toggleGroupIndex)).toContain(compactCode("ToggleGroupContext,"));
    expect(compactCode(toggleGroupIndex)).toContain(compactCode("type ToggleGroupContextValue,"));
    expect(compactCode(toggleGroupIndex)).toContain(compactCode("useToggleGroupContext,"));
  });

  it("generates Combobox React primitives through the Combobox specialized adapter spec without output drift", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputRoot = path.join(tempRoot, "generated/primitives/react");
    const generatedBy = "scripts/portable-runtime/generate-react-wrappers.ts";
    const checkedInComboboxTree = await readFormattedGeneratedTree(
      path.join(process.cwd(), "packages/react/src/combobox"),
    );

    const specOutputRoot = path.join(tempRoot, "spec-backed/primitives/react");
    await writeReactComboboxSpecializedAdapterSpec(
      specOutputRoot,
      buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract),
      createTsHeader(generatedBy),
    );
    const specComboboxDir = path.join(specOutputRoot, "combobox");
    await formatGeneratedOutput([specComboboxDir]);
    expect(
      withoutComboboxRuntimeTypeFacade(await readFormattedGeneratedTree(specComboboxDir)),
    ).toEqual(withoutComboboxRuntimeTypeFacade(checkedInComboboxTree));

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });
    const generatedComboboxDir = path.join(generatedOutputRoot, "combobox");
    await formatGeneratedOutput([generatedComboboxDir]);
    const generatedComboboxTree = await readFormattedGeneratedTree(generatedComboboxDir);
    expect(withoutComboboxRuntimeTypeFacade(generatedComboboxTree)).toEqual(
      withoutComboboxRuntimeTypeFacade(checkedInComboboxTree),
    );
    expect(compactCode(generatedComboboxTree["index.ts"])).toContain(
      compactCode("ComboboxInputValueChangeDetails"),
    );
    expect(compactCode(generatedComboboxTree["index.ts"])).toContain(
      compactCode("ComboboxOpenChangeDetails"),
    );
    expect(compactCode(generatedComboboxTree["index.ts"])).toContain(
      compactCode("ComboboxValueChangeDetails"),
    );
    expect(compactCode(generatedComboboxTree["index.ts"])).toContain(
      compactCode('from "@starwind-ui/runtime";'),
    );

    const renamedSpec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    renamedSpec.root = {
      ...renamedSpec.root,
      discoveryAttribute: "data-sw-combobox-renamed",
    };
    renamedSpec.parts = renamedSpec.parts.map((part) =>
      part.name === "root" ? { ...part, discoveryAttribute: "data-sw-combobox-renamed" } : part,
    );
    renamedSpec.stateModels = renamedSpec.stateModels.map((stateModel) =>
      stateModel.name === "inputValue"
        ? { ...stateModel, initialAttribute: "data-default-query" }
        : stateModel,
    );
    renamedSpec.renderPlan = {
      ...renamedSpec.renderPlan,
      parts: renamedSpec.renderPlan.parts.map((part) =>
        part.name === "root" ? { ...part, discoveryAttribute: "data-sw-combobox-renamed" } : part,
      ),
      stateModels: renamedSpec.renderPlan.stateModels.map((stateModel) =>
        stateModel.name === "inputValue"
          ? { ...stateModel, initialAttribute: "data-default-query" }
          : stateModel,
      ),
      staticAttributes: renamedSpec.renderPlan.staticAttributes.map((attribute) =>
        attribute.part === "root" && attribute.name === "data-default-input-value"
          ? { ...attribute, name: "data-default-query" }
          : attribute,
      ),
    };
    renamedSpec.combobox.anatomy = renamedSpec.combobox.anatomy.map((part) =>
      part.part === "root"
        ? {
            ...part,
            discoveryAttribute: "data-sw-combobox-renamed",
            initialAttributes: part.initialAttributes.map((attribute) =>
              attribute === "data-default-input-value" ? "data-default-query" : attribute,
            ),
          }
        : part,
    );

    const renamedOutputRoot = path.join(tempRoot, "renamed-combobox-spec/primitives/react");
    await writeReactComboboxSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createTsHeader(generatedBy),
    );
    const renamedRoot = await readGeneratedFile(renamedOutputRoot, "combobox/ComboboxRoot.tsx");
    expect(compactCode(renamedRoot)).toContain(compactCode("data-sw-combobox-renamed"));
    expect(compactCode(renamedRoot)).toContain(compactCode("data-default-query"));

    const formSetterSpec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const formSetterRenderPlan = formSetterSpec.renderPlan.form;
    if (!formSetterRenderPlan) {
      throw new Error("Expected Combobox generic adapter plan form metadata.");
    }
    const reorderedFormProps = ["required", "name", "form", "autoComplete", "value"];
    const reorderedSetterProps = ["required", "name", "form", "autoComplete"];
    formSetterSpec.renderPlan = {
      ...formSetterSpec.renderPlan,
      form: {
        ...formSetterRenderPlan,
        props: reorderedFormProps,
      },
    };
    formSetterSpec.combobox.formControl = {
      ...formSetterSpec.combobox.formControl,
      hiddenInput: {
        ...formSetterSpec.combobox.formControl.hiddenInput,
        contractProps: reorderedFormProps,
      },
      setFormOptions: {
        ...formSetterSpec.combobox.formControl.setFormOptions,
        effectDependencies: reorderedSetterProps,
        props: reorderedSetterProps,
      },
    };
    formSetterSpec.combobox.reusedSelectMetadata = {
      ...formSetterSpec.combobox.reusedSelectMetadata,
      form: {
        ...formSetterSpec.combobox.reusedSelectMetadata.form,
        props: reorderedFormProps,
      },
    };
    const formSetterOutputRoot = path.join(tempRoot, "form-setter-combobox-spec/primitives/react");
    await writeReactComboboxSpecializedAdapterSpec(
      formSetterOutputRoot,
      formSetterSpec,
      createTsHeader(generatedBy),
    );
    const formSetterRoot = await readGeneratedFile(
      formSetterOutputRoot,
      "combobox/ComboboxRoot.tsx",
    );
    expect(compactCode(formSetterRoot)).toContain(compactCode("owned.setFormOptions({"));
    expect(compactCode(formSetterRoot)).toContain(
      compactCode("[autoComplete, form, name, required]"),
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
    const fileBasenameOutputRoot = path.join(tempRoot, "renamed-combobox-file/primitives/react");
    await writeReactComboboxSpecializedAdapterSpec(
      fileBasenameOutputRoot,
      fileBasenameSpec,
      createTsHeader(generatedBy),
    );
    expect(
      compactCode(await readGeneratedFile(fileBasenameOutputRoot, "combobox/ComboboxBase.tsx")),
    ).toContain(compactCode("data-sw-combobox"));
    expect(
      compactCode(await readGeneratedFile(fileBasenameOutputRoot, "combobox/index.ts")),
    ).toContain(compactCode('import ComboboxRoot from "./ComboboxBase";'));

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
      writeReactComboboxSpecializedAdapterSpec(
        path.join(tempRoot, "file-topology-drift/primitives/react"),
        fileTopologyDriftSpec,
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
      writeReactComboboxSpecializedAdapterSpec(
        path.join(tempRoot, "popup-floating-drift/primitives/react"),
        popupFloatingDriftSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("requires popup data-side metadata.");

    const invalidSpec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    invalidSpec.combobox.stateControl = undefined as never;
    await expect(
      writeReactComboboxSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-combobox-spec/primitives/react"),
        invalidSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("cannot print invalid Combobox spec");
  }, 120_000);

  it("generates Menu React primitives through the Menu specialized adapter spec without output drift", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputRoot = path.join(tempRoot, "generated/primitives/react");
    const generatedBy = "scripts/portable-runtime/generate-react-wrappers.ts";
    const checkedInMenuTree = await readFormattedGeneratedTree(
      path.join(process.cwd(), "packages/react/src/menu"),
    );

    const specOutputRoot = path.join(tempRoot, "spec-backed/primitives/react");
    await writeReactMenuSpecializedAdapterSpec(
      specOutputRoot,
      buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract),
      createTsHeader(generatedBy),
    );
    const specMenuDir = path.join(specOutputRoot, "menu");
    await formatGeneratedOutput([specMenuDir]);
    expect(withoutMenuRuntimeTypeFacade(await readFormattedGeneratedTree(specMenuDir))).toEqual(
      withoutMenuRuntimeTypeFacade(checkedInMenuTree),
    );

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });
    const generatedMenuDir = path.join(generatedOutputRoot, "menu");
    await formatGeneratedOutput([generatedMenuDir]);
    const generatedMenuTree = await readFormattedGeneratedTree(generatedMenuDir);
    expect(withoutMenuRuntimeTypeFacade(generatedMenuTree)).toEqual(
      withoutMenuRuntimeTypeFacade(checkedInMenuTree),
    );
    expect(compactCode(generatedMenuTree["index.ts"])).toContain(
      compactCode("MenuCloseCompleteDetails"),
    );
    expect(compactCode(generatedMenuTree["index.ts"])).toContain(
      compactCode("MenuOpenChangeDetails"),
    );
    expect(compactCode(generatedMenuTree["index.ts"])).toContain(
      compactCode("MenuValueChangeDetails"),
    );
    expect(compactCode(generatedMenuTree["index.ts"])).toContain(
      compactCode('from "@starwind-ui/runtime";'),
    );

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

    const renamedOutputRoot = path.join(tempRoot, "renamed-spec/primitives/react");
    await writeReactMenuSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createTsHeader(generatedBy),
    );
    expect(compactCode(await readGeneratedFile(renamedOutputRoot, "menu/MenuRoot.tsx"))).toContain(
      compactCode("data-sw-menu-renamed"),
    );

    const branchRecipeSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    branchRecipeSpec.parts = branchRecipeSpec.parts.map((part) =>
      part.name === "item" ? { ...part, role: "menuitem-test" } : part,
    );
    branchRecipeSpec.renderPlan = {
      ...branchRecipeSpec.renderPlan,
      parts: branchRecipeSpec.renderPlan.parts.map((part) =>
        part.name === "item" ? { ...part, role: "menuitem-test" } : part,
      ),
      staticAttributes: branchRecipeSpec.renderPlan.staticAttributes.map((attribute) =>
        attribute.part === "item" && attribute.name === "tabindex"
          ? { ...attribute, value: "1" }
          : attribute.part === "linkItem" && attribute.name === "tabindex"
            ? { ...attribute, value: "2" }
            : attribute,
      ),
    };
    branchRecipeSpec.menu.staticBranches = branchRecipeSpec.menu.staticBranches.map((branch) =>
      branch.part === "item" ? { ...branch, role: "menuitem-test" } : branch,
    );

    const branchRecipeOutputRoot = path.join(tempRoot, "branch-recipe/primitives/react");
    await writeReactMenuSpecializedAdapterSpec(
      branchRecipeOutputRoot,
      branchRecipeSpec,
      createTsHeader(generatedBy),
    );
    const branchRecipeItem = await readGeneratedFile(branchRecipeOutputRoot, "menu/MenuItem.tsx");
    const branchRecipeLinkItem = await readGeneratedFile(
      branchRecipeOutputRoot,
      "menu/MenuLinkItem.tsx",
    );
    expect(compactCode(branchRecipeItem)).toContain(compactCode('role="menuitem-test"'));
    expect(compactCode(branchRecipeItem)).toContain(compactCode("tabIndex={1}"));
    expect(compactCode(branchRecipeLinkItem)).toContain(compactCode("tabIndex={2}"));

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
      writeReactMenuSpecializedAdapterSpec(
        path.join(tempRoot, "missing-tabindex-spec/primitives/react"),
        missingTabIndexSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("requires item tabindex metadata");

    const invalidStaticBranchSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    invalidStaticBranchSpec.menu.staticBranches = invalidStaticBranchSpec.menu.staticBranches.map(
      (branch) =>
        branch.part === "item" && branch.closeOnClick
          ? {
              ...branch,
              closeOnClick: { ...branch.closeOnClick, defaultValue: "false" },
            }
          : branch,
    );
    await expect(
      writeReactMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-static-branch/primitives/react"),
        invalidStaticBranchSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("closeOnClick defaultValue");

    const invalidCheckboxSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    invalidCheckboxSpec.menu.checkboxItem = {
      ...invalidCheckboxSpec.menu.checkboxItem,
      role: "menuitem" as never,
    };
    await expect(
      writeReactMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-checkbox/primitives/react"),
        invalidCheckboxSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("checkboxItem role");

    const invalidRadioSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    invalidRadioSpec.menu.radioItem = {
      ...invalidRadioSpec.menu.radioItem,
      valueProp: {
        ...invalidRadioSpec.menu.radioItem.valueProp,
        attribute: "data-radio-value" as never,
      },
    };
    await expect(
      writeReactMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-radio/primitives/react"),
        invalidRadioSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("radioItem valueProp.attribute");

    const invalidSubmenuTopologySpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    invalidSubmenuTopologySpec.menu.submenu = {
      ...invalidSubmenuTopologySpec.menu.submenu,
      ownerTopology: {
        ...invalidSubmenuTopologySpec.menu.submenu.ownerTopology,
        submenu: {
          ...invalidSubmenuTopologySpec.menu.submenu.ownerTopology.submenu,
          refs: {
            ...invalidSubmenuTopologySpec.menu.submenu.ownerTopology.submenu.refs,
            trigger: "trigger" as never,
          },
        },
      },
    };
    await expect(
      writeReactMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-submenu-topology/primitives/react"),
        invalidSubmenuTopologySpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("owner topology must match submenu facts");

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
      writeReactMenuSpecializedAdapterSpec(
        path.join(tempRoot, "file-topology-drift/primitives/react"),
        fileTopologyDriftSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("requires root file path menu/MenuRoot.");

    const invalidSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
    invalidSpec.menu.submenu = undefined as never;
    await expect(
      writeReactMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-spec/primitives/react"),
        invalidSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("cannot print invalid Menu spec");
  }, 120_000);

  it("generates Context Menu React primitives through the Context Menu specialized adapter spec without output drift", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputRoot = path.join(tempRoot, "generated/primitives/react");
    const generatedBy = "scripts/portable-runtime/generate-react-wrappers.ts";
    const checkedInContextMenuTree = await readFormattedGeneratedTree(
      path.join(process.cwd(), "packages/react/src/context-menu"),
    );

    const specOutputRoot = path.join(tempRoot, "spec-backed/primitives/react");
    await writeReactContextMenuSpecializedAdapterSpec(
      specOutputRoot,
      buildContextMenuSpecializedAdapterSpec(contextMenuRuntimeAdapterContract),
      createTsHeader(generatedBy),
    );
    const specContextMenuDir = path.join(specOutputRoot, "context-menu");
    await formatGeneratedOutput([specContextMenuDir]);
    expect(
      withoutContextMenuRuntimeTypeFacade(await readFormattedGeneratedTree(specContextMenuDir)),
    ).toEqual(withoutContextMenuRuntimeTypeFacade(checkedInContextMenuTree));

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });
    const generatedContextMenuDir = path.join(generatedOutputRoot, "context-menu");
    await formatGeneratedOutput([generatedContextMenuDir]);
    const generatedContextMenuTree = await readFormattedGeneratedTree(generatedContextMenuDir);
    expect(withoutContextMenuRuntimeTypeFacade(generatedContextMenuTree)).toEqual(
      withoutContextMenuRuntimeTypeFacade(checkedInContextMenuTree),
    );
    expect(compactCode(generatedContextMenuTree["index.ts"])).toContain(
      compactCode("ContextMenuCloseCompleteDetails"),
    );
    expect(compactCode(generatedContextMenuTree["index.ts"])).toContain(
      compactCode("ContextMenuOpenChangeDetails"),
    );
    expect(compactCode(generatedContextMenuTree["index.ts"])).toContain(
      compactCode("MenuValueChangeDetails"),
    );
    expect(compactCode(generatedContextMenuTree["index.ts"])).toContain(
      compactCode('from "@starwind-ui/runtime";'),
    );

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

    const renamedOutputRoot = path.join(tempRoot, "renamed-context-spec/primitives/react");
    await writeReactContextMenuSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createTsHeader(generatedBy),
    );
    expect(
      compactCode(await readGeneratedFile(renamedOutputRoot, "context-menu/ContextMenuRoot.tsx")),
    ).toContain(compactCode("data-sw-context-menu-renamed"));

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
      writeReactContextMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-context-root-disabled/primitives/react"),
        invalidRootDisabledSpec,
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
      writeReactContextMenuSpecializedAdapterSpec(
        path.join(tempRoot, "invalid-context-alias/primitives/react"),
        invalidAliasSpec,
        createTsHeader(generatedBy),
      ),
    ).rejects.toThrow("cannot print invalid Context Menu spec");
  }, 30_000);
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
