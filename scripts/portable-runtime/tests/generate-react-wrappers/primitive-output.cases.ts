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
      { source: sidebarTrigger, discovery: '"data-sw-sidebar-trigger": ""' },
      { source: sidebarMenuButton, discovery: '"data-sw-sidebar-menu-button": ""' },
      { source: tooltipTrigger, discovery: '"data-sw-tooltip-trigger": ""' },
    ];

    expect(composeRefs).toContain("export function getAsChildElement");
    expect(composeRefs).toContain("export function mergeAsChildProps");
    expect(composeRefs).toContain("function mergeAsChildStyle");
    expect(composeRefs).toContain("event.defaultPrevented");
    expect(composeRefs).toContain('eventOrder === "parent-first"');
    expect(composeRefs).toContain("export type RefCapableElementProps = AsChildProps &");
    expect(composeRefs).toContain("function getAsChildEventHandler");
    expect(closePresence).toContain("export function useClosePresence");
    expect(closePresence).toContain(
      'import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";',
    );
    expect(closePresence).toContain('const PRESENCE_ENDING_ATTRIBUTE = "data-ending-style"');
    expect(closePresence).toContain("const hasOpenedRef = React.useRef(open)");
    expect(closePresence).toContain("useIsomorphicLayoutEffect(() => {");
    expect(closePresence).toContain("clearScheduledClose();");
    expect(closePresence).toContain('element.setAttribute(PRESENCE_ENDING_ATTRIBUTE, "")');
    expect(closePresence).toContain("Promise.allSettled");
    expect(closePresence).toContain("window.clearTimeout(timeoutRef.current)");
    expect(closePresence).toContain("setPresent(keepMounted)");
    expect(closePresence).toContain("hidden: open ? false : hidden");
    expect(closePresence).toContain("present: open || keepMounted || present");
    reactAsChildParts.forEach(({ source, discovery }) => {
      expect(source).toMatch(
        /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
      );
      expect(source).toContain("const asChildElement = getAsChildElement(children)");
      expect(source).toContain("React.cloneElement(child, {");
      expect(source).toContain("mergeAsChildProps(");
      expect(source).toContain("ref: composedRef");
      expect(source).toContain(discovery);
      expect(source).not.toContain("function getAsChildElement");
    });
    expect(tooltipTrigger).not.toContain("<span");

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
    expect(themeIndex).toContain("export { getThemeInitScript, initThemeController }");
    expect(themeIndex).toContain("ThemeInitScriptOptions");
    expect(themeIndex).toContain('from "@starwind-ui/runtime/theme"');

    expect(buttonRoot).toContain('import { createButton } from "@starwind-ui/runtime/button";');
    expect(buttonRoot).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(buttonRoot).toContain("data-sw-button");
    expect(buttonRoot).toContain("focusableWhenDisabled = false");
    expect(buttonRoot).toContain('type={type ?? "button"}');
    expect(buttonRoot.indexOf("data-focusable-when-disabled")).toBeLessThan(
      buttonRoot.indexOf("{...props}"),
    );
    expect(buttonRoot.indexOf("{...props}")).toBeLessThan(buttonRoot.indexOf("data-sw-button"));
    expect(buttonRoot).toContain(
      "const instanceRef = React.useRef<ReturnType<typeof createButton> | null>(null);",
    );
    expect(buttonRoot).toContain("if (!focusableWhenDisabled)");
    expect(buttonRoot).toContain("instanceRef.current?.setDisabled(disabled)");
    expect(buttonRoot).toContain("useIsomorphicLayoutEffect(() =>");
    expect(buttonRoot).not.toContain("React.useEffect(() =>");
    expect(buttonRoot).toContain("data-focusable-when-disabled");
    expect(buttonRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(buttonRoot).toContain("React.forwardRef<HTMLButtonElement, ButtonRootProps>");
    expect(buttonRoot).toContain("const rootRef = React.useRef<HTMLButtonElement>(null)");
    expect(buttonRoot).toContain("[focusableWhenDisabled]");
    expect(buttonRoot).toContain("[disabled]");
    expect(buttonRoot).not.toContain("AnchorHTMLAttributes");
    expect(buttonRoot).not.toContain("href?: string");
    expect(buttonRoot).not.toContain("nativeButton");
    expect(buttonRoot).not.toContain(removedAttr("data-sw-button", "focusable-when-disabled"));
    expect(buttonRoot).not.toContain(removedAttr("data-sw-button", "native"));
    expect(buttonRoot).not.toContain("if (href)");
    expect(buttonRoot).not.toContain("<a");
    expect(buttonIndex).toContain("const Button =");
    expect(buttonIndex).toContain("Root: ButtonRoot");

    expect(accordionRoot).toContain("createAccordion");
    expect(accordionRoot).toContain('"@starwind-ui/runtime/accordion"');
    expect(accordionRoot).toContain("React.forwardRef");
    expect(accordionRoot).toContain("data-sw-accordion");
    expect(accordionRoot).toContain("data-type");
    expect(accordionRoot).toContain("data-default-value");
    expect(accordionRoot).toContain("data-collapsible");
    expect(accordionRoot).toContain("collapsible = true");
    expect(accordionRoot).toContain("data-collapsible={String(collapsible)}");
    expect(accordionRoot).not.toContain(removedAttr("data-sw-accordion", "type"));
    expect(accordionRoot).not.toContain(removedAttr("data-sw-accordion", "default-value"));
    expect(accordionRoot).not.toContain(removedAttr("data-sw-accordion", "collapsible"));
    expect(accordionRoot).toContain("const valueRef = React.useRef(value)");
    expect(accordionRoot).toContain(
      "...(valueRef.current !== undefined ? { value: valueRef.current } : {})",
    );
    expect(accordionRoot).toContain('instance.subscribe("valueChange"');
    expect(accordionRoot).toContain("onValueChangeRef.current?.(details)");
    expect(accordionRoot).toContain("unsubscribe()");
    expect(accordionRoot).toContain("instance.destroy()");
    expect(accordionRoot).toContain("instance.setValue(value, { emit: false })");
    expect(accordionRoot).toContain("const composedRef = React.useCallback");
    expect(accordionRoot).toContain(
      "const uncontrolledValueRef = React.useRef<AccordionValue | undefined>(",
    );
    expect(accordionRoot).not.toContain("setUncontrolledValueState");
    expect(accordionRoot).not.toContain("const setUncontrolledValue = React.useCallback");
    expect(accordionRoot).not.toContain("requestAnimationFrame");
    expect(accordionItem).toContain("data-value");
    expect(accordionItem).toContain("data-disabled");
    expect(accordionItem).not.toContain(removedAttr("data-sw-accordion", "value"));
    expect(accordionItem).not.toContain(removedAttr("data-sw-accordion", "disabled"));
    expectAttributeCount(accordionItem, "data-disabled", 1);
    expect(accordionPanel).toContain('style={{ animation: "none", ...style }}');
    expect(accordionIndex).toContain("const Accordion =");
    expect(accordionIndex).toContain("Root: AccordionRoot");
    expect(accordionIndex).toContain("Panel: AccordionPanel");

    expect(collapsibleRoot).toContain("createCollapsible");
    expect(collapsibleRoot).toContain('"@starwind-ui/runtime/collapsible"');
    expect(collapsibleRoot).toContain("React.forwardRef");
    expect(collapsibleRoot).toContain("data-sw-collapsible");
    expect(collapsibleRoot).toContain("data-default-open");
    expect(collapsibleRoot).not.toContain(removedAttr("data-sw-collapsible", "default-open"));
    expectAttributeCount(collapsibleRoot, "data-disabled", 1);
    expect(collapsibleRoot).toContain("const openRef = React.useRef(open)");
    expect(collapsibleRoot).toContain(
      "...(openRef.current !== undefined ? { open: openRef.current } : {})",
    );
    expect(collapsibleRoot).toContain('instance.subscribe("openChange"');
    expect(collapsibleRoot).toContain("onOpenChangeRef.current?.(details.open, details)");
    expect(collapsibleRoot).toContain("if (details.isCanceled) return;");
    expect(
      collapsibleRoot.indexOf("onOpenChangeRef.current?.(details.open, details)"),
    ).toBeLessThan(collapsibleRoot.indexOf("if (details.isCanceled) return;"));
    expect(collapsibleRoot.indexOf("if (details.isCanceled) return;")).toBeLessThan(
      collapsibleRoot.indexOf("setUncontrolledOpen(details.open)"),
    );
    expect(collapsibleRoot).toContain("const defaultOpenRef = React.useRef(defaultOpen)");
    expect(collapsibleRoot).toContain("const renderedOpen = open ?? uncontrolledOpen");
    expect(collapsibleRoot).toContain("instance.setOpen(open, { emit: false })");
    expect(collapsibleRoot).toContain("instance.destroy()");
    expect(collapsibleRoot).toContain("const composedRef = React.useCallback");
    expect(collapsibleRoot).toContain('data-state={renderedOpen ? "open" : "closed"}');
    expect(collapsibleTrigger).toContain("asChild?: boolean;");
    expect(collapsibleTrigger).toContain("getAsChildElement(children)");
    expect(collapsibleTrigger).toContain("React.cloneElement");
    expect(collapsibleTrigger).toContain("data-sw-collapsible-trigger");
    expect(collapsibleTrigger).toContain('"aria-expanded": "false"');
    expect(collapsibleTrigger).toContain(
      "mergeAsChildProps({ ...triggerProps, className }, childProps",
    );
    expect(collapsibleTrigger).toMatch(
      /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
    );
    expect(collapsibleTrigger).toContain("const composedRef = useComposedRefs(");
    expect(collapsibleTrigger).toContain("ref: composedRef");
    expect(collapsibleTrigger).not.toContain("function mergeRefs");
    expect(collapsiblePanel).toContain('data-state="closed"');
    expect(collapsiblePanel).toContain("hidden");
    expect(collapsiblePanel).toContain("hiddenUntilFound?: boolean");
    expect(collapsiblePanel).toContain(
      'data-hidden-until-found={hiddenUntilFound ? "" : undefined}',
    );
    expect(collapsiblePanel).toContain('node.setAttribute("hidden", "until-found")');
    expect(collapsiblePanel).toContain("ref={composedRef}");
    expect(collapsiblePanel).not.toContain("animation");
    expect(collapsibleIndex).toContain("const Collapsible =");
    expect(collapsibleIndex).toContain("Root: CollapsibleRoot");
    expect(collapsibleIndex).toContain("Panel: CollapsiblePanel");

    expect(contextMenuRoot).toContain('from "@starwind-ui/runtime/context-menu";');
    expect(contextMenuRoot).toContain("createContextMenu");
    expect(contextMenuRoot).toContain("type ContextMenuCloseCompleteDetails");
    expect(contextMenuRoot).toContain("type ContextMenuOpenChangeDetails");
    expect(contextMenuRoot).toContain("React.forwardRef<HTMLDivElement, ContextMenuRootProps>");
    expect(contextMenuRoot).toContain(
      "onCloseComplete?: (details: ContextMenuCloseCompleteDetails) => void;",
    );
    expect(contextMenuRoot).toContain("onCloseCompleteRef.current?.(details)");
    expect(contextMenuRoot).toContain("data-sw-context-menu");
    expect(contextMenuRoot).toContain("data-sw-menu");
    expect(contextMenuRoot).toContain("data-default-open");
    expect(contextMenuRoot).toContain("modal?: boolean;");
    expect(contextMenuRoot).toContain("modal = true");
    expect(contextMenuRoot).toContain("modal,");
    expect(contextMenuRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(contextMenuRoot).toContain("}, [disabled, modal, closeDelay]);");
    expect(contextMenuRoot).not.toContain("data-open-on-hover");
    expect(contextMenuTrigger).toContain("data-sw-context-menu-trigger");
    expect(contextMenuTrigger).toContain("data-sw-menu-trigger");
    expect(contextMenuTrigger).toContain('aria-haspopup="menu"');
    expect(contextMenuTrigger).toContain("tabIndex={disabled ? -1 : (tabIndex ?? 0)}");
    expect(contextMenuIndex).toContain("const ContextMenu =");
    expect(contextMenuIndex).toContain("Root: ContextMenuRoot");
    expect(contextMenuIndex).toContain("Portal: ContextMenuPortal");
    expect(contextMenuIndex).toContain("Item: ContextMenuItem");
    expect(contextMenuIndex).toContain(
      'import ContextMenuRadioGroup from "../menu/MenuRadioGroup";',
    );
    expect(contextMenuIndex).toContain(
      'import ContextMenuRadioItemIndicator from "../menu/MenuRadioItemIndicator";',
    );
    expect(contextMenuIndex).not.toContain('from "../menu";');
    expect(contextMenuIndex).not.toContain("MenuRadioContext");

    expect(dialogRoot).toContain("createDialog");
    expect(dialogRoot).toContain('"@starwind-ui/runtime/dialog"');
    expect(dialogRoot).toContain("type DialogCloseCompleteDetails");
    expect(dialogRoot).toContain(
      "onCloseComplete?: (details: DialogCloseCompleteDetails) => void;",
    );
    expect(dialogRoot).toContain("onCloseCompleteRef.current?.(details)");
    expect(dialogRoot).toContain("const openRef = React.useRef(open)");
    expect(dialogRoot).toContain(
      "...(openRef.current !== undefined ? { open: openRef.current } : {})",
    );
    expect(dialogRoot).toContain("const composedRef = React.useCallback");
    expect(dialogRoot).toContain("data-default-open");
    expect(dialogRoot).toContain("data-close-on-escape");
    expect(dialogRoot).toContain("data-close-on-outside-interact");
    expect(dialogRoot).toContain("data-modal");
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "default-open"));
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "close-on-escape"));
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "close-on-outside-interact"));
    expect(dialogRoot).not.toContain(removedAttr("data-sw-dialog", "modal"));
    expect(dialogRoot).not.toContain("requestAnimationFrame");
    expect(dialogPopup).toContain("<dialog");
    expect(dialogPopup).toContain("data-sw-dialog-content");
    expect(dialogTrigger).toContain("targetId?: string;");
    expect(dialogTrigger).toContain("function DialogTrigger({ targetId, ...props }, forwardedRef)");
    expect(dialogTrigger).toContain("data-sw-dialog-target-id={targetId}");
    expect(dialogTrigger).not.toContain("data-dialog-for");
    expect(dialogIndex).toContain("const Dialog =");
    expect(dialogIndex).toContain("Root: DialogRoot");
    expect(dialogIndex).toContain("Backdrop: DialogBackdrop");
    expect(dialogIndex).toContain("Popup: DialogPopup");
    expect(dialogIndex).not.toContain("DialogContent");

    expect(alertDialogRoot).toContain('from "@starwind-ui/runtime/alert-dialog";');
    expect(alertDialogRoot).toContain("type AlertDialogCloseCompleteDetails");
    expect(alertDialogRoot).toContain("type AlertDialogOpenChangeDetails");
    expect(alertDialogRoot).toContain("createAlertDialog");
    expect(alertDialogRoot).toContain("React.forwardRef<HTMLDivElement, AlertDialogRootProps>");
    expect(alertDialogRoot).toContain("closeOnOutsideInteract = false");
    expect(alertDialogRoot).toContain(
      "onCloseComplete?: (details: AlertDialogCloseCompleteDetails) => void;",
    );
    expect(alertDialogRoot).toContain("onCloseCompleteRef.current?.(details)");
    expect(alertDialogRoot).toContain("data-sw-alert-dialog");
    expect(alertDialogTrigger).toContain("data-sw-alert-dialog-trigger");
    expect(alertDialogTrigger).toContain("targetId?: string;");
    expect(alertDialogTrigger).toContain(
      "function AlertDialogTrigger({ targetId, ...props }, forwardedRef)",
    );
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
    expect(alertDialogIndex).toContain("AlertDialogCloseCompleteDetails");
    expect(alertDialogIndex).toContain("AlertDialogOpenChangeDetails");
    expect(alertDialogIndex).toContain('from "@starwind-ui/runtime";');
    expect(rootIndex).toContain("AlertDialogCloseCompleteDetails");

    expect(drawerRoot).toContain('from "@starwind-ui/runtime/drawer";');
    expect(drawerRoot).toContain("createDrawer");
    expect(drawerRoot).toContain("type DrawerCloseCompleteDetails");
    expect(drawerRoot).toContain("type DrawerOpenChangeDetails");
    expect(drawerRoot).toContain("React.forwardRef<HTMLDivElement, DrawerRootProps>");
    expect(drawerRoot).toContain("closeOnOutsideInteract = true");
    expect(drawerRoot).toContain(
      "onCloseComplete?: (details: DrawerCloseCompleteDetails) => void;",
    );
    expect(drawerRoot).toContain("onCloseCompleteRef.current?.(details)");
    expect(drawerRoot).toContain("onOpenChange: (nextOpen, details) =>");
    expect(drawerRoot).not.toContain('instance.subscribe("openChange"');
    expect(drawerRoot).toContain("data-sw-drawer");
    expect(drawerTrigger).toContain("data-sw-drawer-trigger");
    expect(drawerTrigger).toContain("targetId?: string;");
    expect(drawerTrigger).toContain("function DrawerTrigger({ targetId, ...props }, forwardedRef)");
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

    expect(dropzoneRoot).toContain("data-sw-dropzone");
    expect(dropzoneRoot).toContain('aria-disabled={disabled ? "true" : "false"}');
    expect(dropzoneRoot).toContain('data-disabled={disabled ? "" : undefined}');

    expect(fieldRoot).toContain('import { createField } from "@starwind-ui/runtime/field";');
    expect(fieldRoot).toContain("React.forwardRef<HTMLDivElement, FieldRootProps>");
    expect(fieldRoot).toContain("data-sw-field");
    expect(fieldRoot).toContain("data-name={name}");
    expect(fieldRoot).toContain("dirty,");
    expect(fieldRoot).toContain("touched,");
    expect(fieldRoot).not.toContain("dirty = false");
    expect(fieldRoot).not.toContain("touched = false");
    expect(fieldRoot).toContain("instanceRef.current?.setDirty(dirty)");
    expect(fieldRoot).toContain("instanceRef.current?.setDisabled(disabled)");
    expect(fieldRoot).toContain("instanceRef.current?.setInvalid(invalid)");
    expect(fieldRoot).toContain("instanceRef.current?.setName(name)");
    expect(fieldRoot).toContain("instanceRef.current?.setTouched(touched)");
    expect(fieldRoot).toContain('data-dirty={dirty ? "" : undefined}');
    expect(fieldRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(fieldRoot).toContain('data-invalid={invalid ? "" : undefined}');
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
    expect(fieldLabel).toContain("data-sw-field-label");
    expect(fieldControl).toContain('import InputRoot from "../input/InputRoot";');
    expect(fieldControl).toContain("data-sw-field-control");
    expect(fieldDescription).toContain("data-sw-field-description");
    expect(fieldError).toContain("data-sw-field-error");
    expect(fieldError).toContain(
      'export type FieldErrorMessageSource = "children" | "validation";',
    );
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

    expect(fieldsetRoot).toContain("createFieldset");
    expect(fieldsetRoot).toContain('"@starwind-ui/runtime/fieldset"');
    expect(fieldsetRoot).toContain("React.forwardRef<HTMLFieldSetElement, FieldsetRootProps>");
    expect(fieldsetRoot).toContain("createFieldset(root, { disabled })");
    expect(fieldsetRoot).toContain("instanceRef.current?.setDisabled(disabled)");
    expect(fieldsetRoot).toContain("data-sw-fieldset");
    expect(fieldsetRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(fieldsetLegend).toContain("data-sw-fieldset-legend");
    expect(fieldsetIndex).toContain("Root: FieldsetRoot");
    expect(fieldsetIndex).toContain("Legend: FieldsetLegend");

    expect(formRoot).toContain("createForm");
    expect(formRoot).toContain('"@starwind-ui/runtime/form"');
    expect(formRoot).toContain("type FormValidationTiming");
    expect(formRoot).toContain("React.forwardRef<HTMLFormElement, FormRootProps>");
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
    expect(formRoot).toContain("instance.destroy()");
    expect(formErrorSummary).toContain("React.forwardRef<HTMLDivElement, FormErrorSummaryProps>");
    expect(formErrorSummary).toContain("data-sw-form-error-summary");
    expect(formErrorSummary).toContain('data-slot="form-error-summary"');
    expect(formErrorSummary).toContain('role = "status"');
    expect(formErrorSummary).toContain('"aria-live": ariaLive = "polite"');
    expect(formErrorSummary).toContain('"aria-atomic": ariaAtomic = "true"');
    expect(formErrorSummary).toContain("hidden={hidden}");
    expect(formErrorSummary).toContain("{children}");
    expect(formIndex).toContain("Root: FormRoot");
    expect(formIndex).toContain("ErrorSummary: FormErrorSummary");
    expect(formIndex).toContain("FormErrorSummary");

    expect(popoverRoot).toContain('} from "@starwind-ui/runtime/popover";');
    expect(popoverRoot).toContain("createPopover,");
    expect(popoverRoot).toContain("type PopoverCloseCompleteDetails,");
    expect(popoverRoot).toContain("type PopoverOpenChangeDetails,");
    expect(popoverRoot).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(popoverRoot).toContain("React.forwardRef<HTMLDivElement, PopoverRootProps>");
    expect(popoverRoot).toContain("modal?: boolean;");
    expect(popoverRoot).toContain("modal = false");
    expect(popoverRoot).toContain("openOnHover = false");
    expect(popoverRoot).toContain(
      "onCloseComplete?: (details: PopoverCloseCompleteDetails) => void;",
    );
    expect(popoverRoot).toContain("onCloseCompleteRef.current?.(details)");
    expect(popoverRoot).toContain("onOpenChange: (nextOpen, details) =>");
    expect(popoverRoot).toContain("useIsomorphicLayoutEffect(() =>");
    expect(popoverRoot).not.toContain('instance.subscribe("openChange"');
    expect(popoverRoot).toContain("data-sw-popover");
    expect(popoverRoot).toContain("modal,");
    expect(popoverRoot).toContain("data-default-open");
    expect(popoverRoot).toContain("data-modal");
    expect(popoverRoot).toContain("data-open-on-hover");
    expect(popoverRoot).toMatch(
      /}, \[\s*closeOnEscape,\s*closeOnOutsideInteract,\s*modal,\s*openOnHover,?\s*\]\);/,
    );
    expect(popoverTrigger).toContain("asChild?: boolean;");
    expect(popoverTrigger).toContain("getAsChildElement(children)");
    expect(popoverTrigger).toContain("React.cloneElement");
    expect(popoverTrigger).toContain("data-sw-popover-trigger");
    expect(popoverTrigger).toContain('"aria-haspopup": "dialog"');
    expect(popoverTrigger).toMatch(
      /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
    );
    expect(popoverTrigger).toContain("const composedRef = useComposedRefs(");
    expect(popoverTrigger).toContain("ref: composedRef");
    expect(popoverTrigger).not.toContain("function mergeRefs");
    expect(popoverPositioner).toContain("data-sw-popover-positioner");
    expect(popoverPositioner).toContain("data-side={side}");
    expect(popoverPositioner).toContain("data-align={align}");
    expect(popoverPositioner).toContain("data-side-offset={sideOffset}");
    expect(popoverPositioner).toContain(
      'data-avoid-collisions={avoidCollisions ? "true" : "false"}',
    );
    expect(popoverPositioner).toContain("ref={forwardedRef}");
    expect(popoverPositioner).toContain("{...props}");
    expect(popoverPopup).toContain("data-sw-popover-popup");
    expect(popoverPopup).toContain("data-side={side}");
    expect(popoverPopup).toContain("data-align={align}");
    expect(popoverPopup).toContain("data-side-offset={sideOffset}");
    expect(popoverPopup).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(popoverPopup).toContain('role="dialog"');
    expect(popoverPopup).toContain("tabIndex={-1}");
    expect(popoverPopup).toContain("hidden");
    expect(popoverPopup).toContain("ref={forwardedRef}");
    expect(popoverPopup).toContain("{...props}");
    expect(popoverClose).toContain("data-sw-popover-close");
    expect(popoverIndex).toContain("const Popover =");
    expect(popoverIndex).toContain("Root: PopoverRoot");
    expect(popoverIndex).toContain("Positioner: PopoverPositioner");
    expect(popoverIndex).toContain("Popup: PopoverPopup");

    expect(avatarRoot).toContain("createAvatar");
    expect(avatarRoot).toContain('"@starwind-ui/runtime/avatar"');
    expect(avatarRoot).toContain("React.forwardRef");
    expect(avatarRoot).toContain("data-sw-avatar");
    expect(avatarRoot).toContain("data-image-loading-status");
    expect(avatarImage).toContain("alt: string;");
    expect(avatarImage).toContain("onLoadingStatusChange?:");
    expect(avatarImage).toContain("starwind:loading-status-change");
    expect(avatarImage).toContain("root.addEventListener");
    expect(avatarImage).toContain("root.removeEventListener");
    expect(avatarImage).toContain(
      "const onLoadingStatusChangeRef = React.useRef(onLoadingStatusChange)",
    );
    expect(avatarImage).toContain(
      "const hasLoadingStatusChangeCallback = onLoadingStatusChange !== undefined",
    );
    expect(avatarImage).toContain("onLoadingStatusChangeRef.current = onLoadingStatusChange");
    expect(avatarImage).toContain("onLoadingStatusChangeRef.current?.(details.status, details)");
    expect(avatarImage).toContain('root.getAttribute("data-image-loading-status")');
    expect(avatarImage).toContain('if (!status || status === "idle") return;');
    expect(avatarImage).toContain(
      'onLoadingStatusChangeRef.current?.(status, { previousStatus: "idle", status });',
    );
    expect(avatarImage).toContain("notifyCurrentLoadingStatus();");
    expect(avatarImage).toContain("}, [hasLoadingStatusChangeCallback]);");
    expect(avatarImage).not.toContain("}, [onLoadingStatusChange]);");
    expect(avatarImage).toContain("data-sw-avatar-image");
    expect(avatarImage).toContain("node.hidden = hidden ?? true");
    expect(avatarImage).not.toContain("hidden={hidden ?? true}");
    expect(avatarFallback).toContain("delay?: number");
    expect(avatarFallback).toContain("data-sw-avatar-fallback");
    expect(avatarFallback).toContain("data-delay");
    expect(avatarFallback).not.toContain(removedAttr("data-sw-avatar-fallback", "delay"));
    expect(avatarFallback).toContain("node.hidden = hidden ?? delay !== undefined");
    expect(avatarFallback).not.toContain("hidden={hidden ?? delay !== undefined}");
    expect(avatarIndex).toContain("Root: AvatarRoot");
    expect(avatarIndex).toContain("Image: AvatarImage");
    expect(avatarIndex).toContain("Fallback: AvatarFallback");

    expect(checkboxRoot).toContain("createCheckbox");
    expect(checkboxRoot).toContain('"@starwind-ui/runtime/checkbox"');
    expect(checkboxRoot).toContain("CheckboxCheckedChangeDetails");
    expect(checkboxRoot).toContain(
      'import { useCheckboxGroupContext } from "../checkbox-group/CheckboxGroupContext";',
    );
    expect(checkboxRoot).toContain("const checkedRef = React.useRef(checked)");
    expect(checkboxRoot).toContain("const checkboxGroup = useCheckboxGroupContext()");
    expect(checkboxRoot).toContain("const groupValue = value ?? name");
    expect(checkboxRoot).toContain("const groupChecked =");
    expect(checkboxRoot).toContain(
      "checkboxGroup && groupValue !== undefined\n        ? checkboxGroup.value.includes(groupValue)\n        : undefined",
    );
    expect(checkboxRoot).toContain("const effectiveDisabled =");
    expect(checkboxRoot).toContain(
      "const [uncontrolledChecked, setUncontrolledCheckedState] = React.useState(",
    );
    expect(checkboxRoot).toContain(
      "const uncontrolledCheckedRef = React.useRef(uncontrolledChecked)",
    );
    expect(checkboxRoot).toContain("defaultChecked: uncontrolledCheckedRef.current");
    expect(checkboxRoot).toContain(
      "const [renderedIndeterminate, setRenderedIndeterminate] = React.useState(indeterminate)",
    );
    expect(checkboxRoot).toContain(
      "const renderedChecked = checked ?? groupChecked ?? uncontrolledChecked",
    );
    expect(checkboxRoot).toContain("checkedRef.current !== undefined");
    expect(checkboxRoot).toContain("groupChecked !== undefined");
    expect(checkboxRoot).toContain("onCheckedChangeRef.current?.(details.checked, details)");
    expect(checkboxRoot).toContain("if (details.isCanceled) return");
    expect(checkboxRoot).toContain("const resetSyncTimerRef = React.useRef");
    expect(checkboxRoot).toContain("syncUncontrolledAfterFormReset");
    expect(checkboxRoot).toContain("setUncontrolledChecked(details.checked)");
    expect(checkboxRoot).toContain("const indeterminateRef = React.useRef(indeterminate)");
    expect(checkboxRoot).toContain("indeterminateRef.current = indeterminate");
    expect(checkboxRoot.match(/if \(!indeterminateRef\.current\) \{/g)).toHaveLength(2);
    expect(checkboxRoot).toContain("const nextControlledChecked = checked ?? groupChecked");
    expect(checkboxRoot).toContain(
      "if (nextControlledChecked !== undefined && instance.getChecked() !== nextControlledChecked)",
    );
    expect(checkboxRoot).toContain("instance.setChecked(nextControlledChecked, { emit: false })");
    expect(checkboxRoot).toContain("instance.setIndeterminate(indeterminate, { emit: false })");
    expect(checkboxRoot).toContain("}, [checked, groupChecked, indeterminate])");
    expect(checkboxRoot).not.toContain("instance.setChecked(checked, { emit: false })");
    expect(checkboxRoot).not.toContain("instance.setChecked(groupChecked, { emit: false })");
    expect(checkboxRoot).toContain("instance.setDisabled(effectiveDisabled)");
    expect(checkboxRoot).toContain("data-sw-checkbox");
    expect(checkboxRoot).toContain("data-sw-checkbox-input");
    expect(checkboxRoot).toContain('"data-default-checked"');
    expect(checkboxRoot).toContain('"data-form"');
    expect(checkboxRoot).toContain('"data-id"');
    expect(checkboxRoot).toContain('"data-name"');
    expect(checkboxRoot).toContain('"data-unchecked-value"');
    expect(checkboxRoot).toContain('"data-value"');
    expect(checkboxRoot).toContain('"data-disabled"');
    expect(checkboxRoot).toContain('"data-indeterminate"');
    expect(checkboxRoot).toContain('"data-readonly"');
    expect(checkboxRoot).toContain('"data-required"');
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
    expect(checkboxRoot).toContain("id={id}");
    expect(checkboxRoot).toContain("name={name}");
    expect(checkboxRoot).toContain("form={form}");
    expect(checkboxRoot).toContain("defaultChecked={defaultCheckedRef.current}");
    expect(checkboxRoot).not.toContain("defaultChecked={renderedChecked}");
    expect(checkboxRoot).toContain("defaultValue={value}");
    expect(checkboxRoot).toContain(
      "}, [form, id, name, nativeButton, readOnly, required, uncheckedValue, value]);",
    );
    expect(checkboxRoot).toContain("if (nativeButton) {");
    expect(checkboxRoot).toContain("<>");
    expect(checkboxRoot).toContain("</button>");
    expect(checkboxRoot).toContain("{input}");
    expect(checkboxRoot).not.toContain("{children}\n          {input}\n        </button>");
    expect(checkboxRoot).toContain(`<button
            {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            {...commonProps}`);
    expect(checkboxRoot).toContain(`<span
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
        {...commonProps}`);
    expect(checkboxIndicator).toContain("keepMounted?: boolean");
    expect(checkboxIndicator).toContain("data-sw-checkbox-indicator");
    expect(checkboxIndicator).toContain("node.hidden = hidden ?? !keepMounted");
    expect(checkboxIndicator).not.toContain("hidden={hidden ?? !keepMounted}");
    expect(checkboxIndex).toContain("Root: CheckboxRoot");
    expect(checkboxIndex).toContain("Indicator: CheckboxIndicator");

    expect(checkboxGroupRoot).toContain("createCheckboxGroup");
    expect(checkboxGroupRoot).toContain('"@starwind-ui/runtime/checkbox-group"');
    expect(checkboxGroupRoot).toContain("CheckboxGroupValueChangeDetails");
    expect(checkboxGroupRoot).toContain(
      'import { CheckboxGroupContext } from "./CheckboxGroupContext";',
    );
    expect(checkboxGroupRoot).toContain("const defaultValueRef = React.useRef(defaultValue)");
    expect(checkboxGroupRoot).toContain("const valueRef = React.useRef(value)");
    expect(checkboxGroupRoot).toContain(
      "const [uncontrolledValue, setUncontrolledValueState] = React.useState<CheckboxGroupValue>",
    );
    expect(checkboxGroupRoot).toContain(
      "const uncontrolledValueRef = React.useRef(uncontrolledValue)",
    );
    expect(checkboxGroupRoot).toContain(
      "const setUncontrolledValue = React.useCallback((nextValue: CheckboxGroupValue) => {",
    );
    expect(checkboxGroupRoot).toContain("const renderedValue = value ?? uncontrolledValue");
    expect(checkboxGroupRoot).toContain("const contextValue = React.useMemo");
    expect(checkboxGroupRoot).toContain("<CheckboxGroupContext.Provider value={contextValue}>");
    expect(checkboxGroupRoot).toContain(
      "...(valueRef.current !== undefined ? { value: valueRef.current } : {})",
    );
    expect(checkboxGroupRoot).toContain("setUncontrolledValue(details.value)");
    expect(checkboxGroupRoot).toContain("onValueChangeRef.current?.(details.value, details)");
    expect(checkboxGroupRoot).toContain(`onValueChangeRef.current?.(details.value, details);
        if (details.isCanceled) return;

        if (valueRef.current === undefined) {
          setUncontrolledValue(details.value);
        }`);
    expect(checkboxGroupRoot).toContain("const syncUncontrolledValue = () => {");
    expect(checkboxGroupRoot).toContain(
      'parseCheckboxGroupValueAttribute(root.getAttribute("data-value"))',
    );
    expect(checkboxGroupRoot).toContain("new MutationObserver(syncUncontrolledValue)");
    expect(checkboxGroupRoot).toContain('attributeFilter: ["data-value"]');
    expect(checkboxGroupRoot).toContain("function parseCheckboxGroupValueAttribute");
    expect(checkboxGroupRoot).toContain("instance.setDisabled(disabled)");
    expect(checkboxGroupRoot).toContain("instance.setValue(value, { emit: false })");
    expect(checkboxGroupRoot).toContain('instance.subscribe("valueChange"');
    expect(checkboxGroupRoot).toContain("unsubscribe()");
    expect(checkboxGroupRoot).toContain("instance.destroy()");
    expect(checkboxGroupRoot).not.toContain("[defaultValue, disabled]");
    expect(checkboxGroupRoot).toContain("data-sw-checkbox-group");
    expect(checkboxGroupRoot).toContain("data-default-value");
    expect(checkboxGroupRoot).toContain("data-value");
    expect(checkboxGroupRoot).toContain("<CheckboxGroupContext.Provider value={contextValue}>");
    expectAttributeCount(checkboxGroupRoot, "data-disabled", 1);
    expect(checkboxGroupRoot).not.toContain(removedAttr("data-sw-checkbox-group", "default-value"));
    expect(checkboxGroupRoot).not.toContain(removedAttr("data-sw-checkbox-group", "value"));
    expect(checkboxGroupContext).toContain("React.createContext");
    expect(checkboxGroupContext).toContain("useCheckboxGroupContext");
    expect(checkboxGroupContext).toContain("CheckboxGroupValue");
    expect(checkboxGroupIndex).toContain("CheckboxGroupContext");
    expect(checkboxGroupIndex).toContain("useCheckboxGroupContext");
    expect(checkboxGroupIndex).toContain("Root: CheckboxGroupRoot");
    expect(checkboxGroupIndex).toBe(
      await readFile(path.resolve("packages/react/src/checkbox-group/index.ts"), "utf8"),
    );

    expect(radioRoot).toContain("createRadio");
    expect(radioRoot).toContain("RadioCheckedChangeDetails");
    expect(radioRoot).toContain(
      'import { useRadioGroupContext } from "../radio-group/RadioGroupContext";',
    );
    expect(radioRoot).toContain("const radioGroup = useRadioGroupContext()");
    expect(radioRoot).toContain("const groupChecked =");
    expect(radioRoot).toContain("const effectiveDisabled =");
    expect(radioRoot).not.toContain("indeterminateRef");
    expect(radioRoot).not.toContain("setIndeterminate");
    expect(radioRoot).not.toContain("renderedIndeterminate");
    expect(radioRoot).not.toContain('"data-indeterminate"');
    expect(radioRoot).toContain("data-sw-radio");
    expect(radioRoot).toContain("data-sw-radio-input");
    expect(radioRoot).toContain('type="radio"');
    expect(radioRoot).not.toContain('"aria-readonly"');
    expect(radioRoot).not.toContain('"aria-required"');
    expect(radioRoot).toContain('"data-readonly": effectiveReadOnly ? "" : undefined');
    expect(radioRoot).toContain('"data-required": effectiveRequired ? "" : undefined');
    expect(radioRoot).toContain("id={nativeButton ? undefined : id}");
    expect(radioRoot).toContain("id={id}");
    expect(radioRoot).toContain("}, [effectiveForm, effectiveName, id, nativeButton, value]);");
    expect(radioRoot).toContain(`<button
            {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            {...commonProps}`);
    expect(radioRoot).toContain(`<span
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
        {...commonProps}`);
    expect(radioRoot).toContain("{input}");
    expect(radioIndicator).toContain("data-sw-radio-indicator");
    expect(radioIndicator).toContain("data-keep-mounted");
    expect(radioIndex).toContain("Root: RadioRoot");
    expect(radioIndex).toContain("Indicator: RadioIndicator");

    expect(radioGroupRoot).toContain("createRadioGroup");
    expect(radioGroupRoot).toContain("RadioGroupValueChangeDetails");
    expect(radioGroupRoot).toContain('import { RadioGroupContext } from "./RadioGroupContext";');
    expect(radioGroupRoot).toContain("const defaultValueRef = React.useRef(defaultValue)");
    expect(radioGroupRoot).toContain("const renderedValue = value ?? uncontrolledValue");
    expect(radioGroupRoot).toContain("<RadioGroupContext.Provider value={contextValue}>");
    expect(radioGroupRoot).toContain("instance.setValue(value, { emit: false })");
    expect(radioGroupRoot).toContain("instance.setDisabled(disabled)");
    expect(radioGroupRoot).toContain("instance.setFormOptions({");
    expect(radioGroupRoot).toContain("instance.setOrientation(orientation)");
    expect(radioGroupRoot).toContain("instance.setReadOnly(readOnly)");
    expect(radioGroupRoot).not.toContain("}, [form, orientation, required]);");
    expect(radioGroupRoot).toContain("data-sw-radio-group");
    expect(radioGroupRoot).toContain("data-orientation={orientation}");
    expect(radioGroupRoot).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(radioGroupRoot).toContain("aria-orientation={orientation}");
    expect(radioGroupRoot).toContain('aria-readonly={readOnly ? "true" : undefined}');
    expect(radioGroupRoot).toContain('aria-required={required ? "true" : undefined}');
    expect(radioGroupContext).toContain("React.createContext");
    expect(radioGroupContext).toContain("useRadioGroupContext");
    expect(radioGroupContext).toContain("value: RadioGroupValue");
    expect(radioGroupIndex).toContain("RadioGroupContext");
    expect(radioGroupIndex).toContain("Root: RadioGroupRoot");
    expect(radioGroupIndex).toBe(
      await readFile(path.resolve("packages/react/src/radio-group/index.ts"), "utf8"),
    );

    expect(inputRoot).toContain("createInput");
    expect(inputRoot).toContain("InputValueChangeDetails");
    expect(inputRoot).toContain("React.forwardRef<HTMLInputElement, InputRootProps>");
    expect(inputRoot).toContain("const valueRef = React.useRef(value)");
    expect(inputRoot).toContain("const defaultValueRef = React.useRef(defaultValue)");
    expect(inputRoot).toContain("const onValueChangeRef = React.useRef(onValueChange)");
    expect(inputRoot).toContain(
      "const valueChangeDetailsRef = React.useRef<InputValueChangeDetails | undefined>(undefined)",
    );
    expect(inputRoot).toContain("valueChangeDetailsRef.current = details");
    expect(inputRoot).toContain("onValueChangeRef.current?.(nextValue, details)");
    expect(inputRoot).toContain("window.setTimeout(() => {");
    expect(inputRoot.indexOf("const nextValue = event.currentTarget.value")).toBeLessThan(
      inputRoot.indexOf("onChange?.(event)"),
    );
    expect(inputRoot).toContain(
      "...(valueRef.current !== undefined ? { value: valueRef.current } : {})",
    );
    expect(inputRoot).toMatch(/createInput\(root, \{\s+defaultValue: defaultValueRef\.current,/);
    expect(inputRoot).not.toContain("}, [defaultValue");
    expect(inputRoot).toContain("const valueProps =");
    expect(inputRoot).toContain("value !== undefined");
    expect(inputRoot).toContain("? { value }");
    expect(inputRoot).toContain(": { defaultValue: defaultValueRef.current };");
    expect(inputRoot).toContain("{...valueProps}");
    expect(inputRoot).not.toContain("uncontrolledValue");
    expect(inputRoot).toContain("instance.setValue(value, { emit: false })");
    expect(inputRoot).toContain("instance.setDisabled(disabled)");
    expect(inputRoot).toContain("data-sw-input");
    expect(inputRoot).toContain("data-disabled");
    expect(inputIndex).toContain("Root: InputRoot");

    expect(inputOtpRoot).toContain(
      'import { createInputOtp, type InputOtpValueChangeDetails } from "@starwind-ui/runtime/input-otp";',
    );
    expect(inputOtpRoot).toContain("React.forwardRef<HTMLDivElement, InputOtpRootProps>");
    expect(inputOtpRoot).toContain("const defaultValueRef = React.useRef(defaultValue)");
    expect(inputOtpRoot).toContain("const uncontrolledValueRef = React.useRef(uncontrolledValue)");
    expect(inputOtpRoot).toMatch(
      /createInputOtp\(root, \{\s+defaultValue: uncontrolledValueRef\.current,/,
    );
    expect(inputOtpRoot).not.toContain("}, [defaultValue");
    expect(inputOtpRoot).toContain("pattern: patternText");
    expect(inputOtpRoot).toContain("}, [maxLength, patternText, readOnly]);");
    expect(inputOtpRoot).not.toContain(
      "}, [form, id, maxLength, name, pattern, readOnly, required]);",
    );
    expect(inputOtpRoot).toContain("const renderedValue = value ?? uncontrolledValue");
    expect(inputOtpRoot).toContain("data-sw-input-otp");
    expect(inputOtpRoot).toContain("data-sw-input-otp-input");
    expect(inputOtpRoot).toContain("data-default-value");
    expect(inputOtpRoot).toContain("data-max-length");
    expect(inputOtpRoot).toContain("data-pattern");
    expect(inputOtpRoot).toContain('autoComplete="one-time-code"');
    expect(inputOtpRoot).toContain(
      'inputMode={isNumericPattern(patternText) ? "numeric" : "text"}',
    );
    expect(inputOtpRoot).toContain("instance.setValue(value, { emit: false })");
    expect(inputOtpRoot).toContain("instance.setDisabled(disabled)");
    expect(inputOtpRoot).toContain("instance.setFormOptions({ form, id, name, required })");
    expect(inputOtpGroup).toContain("data-sw-input-otp-group");
    expect(inputOtpSlot).toContain("data-sw-input-otp-slot");
    expect(inputOtpSlot).toContain("data-sw-input-otp-char");
    expect(inputOtpSlot).toContain("data-sw-input-otp-caret");
    expect(inputOtpSlot).toContain("caret?: React.ReactNode");
    expect(inputOtpSeparator).toContain("data-sw-input-otp-separator");
    expect(inputOtpIndex).toContain("Root: InputOtpRoot");
    expect(inputOtpIndex).toContain("Slot: InputOtpSlot");

    expect(progressRoot).toContain("createProgress");
    expect(progressRoot).toContain("type ProgressValue");
    expect(progressRoot).toContain('from "@starwind-ui/runtime/progress"');
    expect(progressRoot).toContain(
      'export type ProgressRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, "value">',
    );
    expect(progressRoot).toContain("format?: Intl.NumberFormatOptions");
    expect(progressRoot).toContain(
      "getAriaValueText?: (formattedValue: string | null, value: ProgressValue) => string",
    );
    expect(progressRoot).toContain("locale?: Intl.LocalesArgument");
    expect(progressRoot).toContain("max = 100");
    expect(progressRoot).toContain("min = 0");
    expect(progressRoot).toContain("value = null");
    expect(progressRoot).toContain("createProgress(root, {");
    expect(progressRoot).toContain("ariaValueText: ariaValueTextRef.current");
    expect(progressRoot).toContain("instance.setFormatOptions({");
    expect(progressRoot).toContain("instance.setValue(value, { max, min })");
    expect(progressRoot).toContain("aria-valuetext={ariaValueText}");
    expect(progressRoot).toContain("data-sw-progress");
    expect(progressRoot).toContain("data-value={isIndeterminate ? undefined : value}");
    expect(progressRoot).toContain("data-min={min}");
    expect(progressRoot).toContain("data-max={max}");
    expect(progressRoot).toContain('data-indeterminate={isIndeterminate ? "" : undefined}');
    expect(progressRoot).toContain('role="progressbar"');
    expect(progressTrack).toContain("data-sw-progress-track");
    expect(progressIndicator).toContain("data-sw-progress-indicator");
    expect(progressValue).toContain("data-sw-progress-value");
    expect(progressValue).toContain('aria-hidden="true"');
    expect(progressValue).toContain('data-preserve-text={children == null ? undefined : ""}');
    expect(progressLabel).toContain("data-sw-progress-label");
    expect(progressLabel).toContain('role="presentation"');
    expect(progressIndex).toContain("Root: ProgressRoot");
    expect(progressIndex).toContain("Indicator: ProgressIndicator");
    expect(progressIndex).toContain("Value: ProgressValue");

    expect(menuRoot).toContain("createMenu(root");
    expect(menuRoot).toContain("type MenuCloseCompleteDetails");
    expect(menuRoot).toContain("onCloseComplete?: (details: MenuCloseCompleteDetails) => void;");
    expect(menuRoot).toContain("onCloseCompleteRef.current?.(details)");
    expect(menuRoot).toContain("modal?: boolean;");
    expect(menuRoot).toContain("modal = false");
    expect(menuRoot).toContain("modal,");
    expect(menuRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(menuTrigger).toContain("asChild?: boolean;");
    expect(menuTrigger).toContain("getAsChildElement(children)");
    expect(menuTrigger).toContain("React.cloneElement");
    expect(menuTrigger).toContain('"data-sw-menu-trigger": ""');
    expect(menuTrigger).toMatch(
      /import\s+\{\s*getAsChildElement,\s*getElementRef,\s*mergeAsChildProps,\s*useComposedRefs,?\s*\}\s+from\s+"..\/internal\/compose-refs";/,
    );
    expect(menuTrigger).toContain("const composedRef = useComposedRefs(");
    expect(menuTrigger).toContain("ref: composedRef");
    expect(menuTrigger).not.toContain("function mergeRefs");
    expect(menuItem).toContain("tabIndex={0}");
    expect(menuItem).toContain("closeOnClick?: boolean;");
    expect(menuItem).toContain("function MenuItem(");
    expect(menuItem).toContain("{ disabled = false, closeOnClick = true, ...props }");
    expect(menuItem).toContain('data-close-on-click={closeOnClick ? undefined : "false"}');
    expect(menuLinkItem).toContain("tabIndex={0}");
    expect(menuLinkItem).toContain("closeOnClick?: boolean;");
    expect(menuLinkItem).toContain("function MenuLinkItem(");
    expect(menuLinkItem).toContain("{ disabled = false, href, closeOnClick = false, ...props }");
    expect(menuLinkItem).toContain('data-close-on-click={closeOnClick ? "true" : undefined}');
    expect(menuCheckboxItem).toContain("tabIndex={0}");
    expect(menuCheckboxItem).toContain("MenuCheckedChangeDetails");
    expect(menuCheckboxItem).toContain(
      "onCheckedChange?: (checked: boolean, details: MenuCheckedChangeDetails) => void;",
    );
    expect(menuCheckboxItem).toContain("const checkedRef = React.useRef(checked)");
    expect(menuCheckboxItem).toContain("const defaultCheckedRef = React.useRef(defaultChecked)");
    expect(menuCheckboxItem).toContain("onCheckedChangeRef.current?.(details.checked, details)");
    expect(menuCheckboxItem).toContain("if (details.isCanceled) return;");
    expect(menuCheckboxItem).toContain("setUncontrolledChecked(details.checked)");
    expect(menuCheckboxItem).toContain("syncCheckboxItemState(item, controlledChecked)");
    expect(menuCheckboxItem).toContain("const renderedChecked = checked ?? uncontrolledChecked");
    expect(menuRadioGroup).toContain("MenuValueChangeDetails");
    expect(menuRadioGroup).toContain("onValueChange?:");
    expect(menuRadioGroup).toContain("if (details.isCanceled) return;");
    expect(menuRadioGroup).toContain("setUncontrolledValue(details.value)");
    expect(menuRadioGroup).toContain("syncRadioGroupState(group, controlledValue)");
    expect(menuRadioGroup).toContain('group.addEventListener("starwind:value-change"');
    expect(menuRadioGroup).toContain("const renderedValue = value ?? uncontrolledValue");
    expect(menuRadioContext).toContain("export const MenuRadioGroupContext");
    expect(menuRadioContext).toContain("useMenuRadioGroupContext");
    expect(menuRadioContext).toContain("export const MenuRadioItemContext");
    expect(menuRadioGroup).toContain('from "./MenuRadioContext"');
    expect(menuRadioGroup).toContain("<MenuRadioGroupContext.Provider value={radioGroupContext}>");
    expect(menuRadioItem).toContain('role="menuitemradio"');
    expect(menuRadioItem).toContain("const radioGroup = useMenuRadioGroupContext();");
    expect(menuRadioItem).toContain(
      "const renderedChecked = radioGroup?.value === undefined ? initialChecked : radioGroup.value === value;",
    );
    expect(menuRadioItem).toContain("<MenuRadioItemContext.Provider value={radioItemContext}>");
    expect(menuRadioItem).not.toContain("aria-checked={initialChecked}");
    expect(menuRadioItemIndicator).toContain("const radioItem = useMenuRadioItemContext();");
    expect(menuRadioItemIndicator).toContain('data-state={checked ? "checked" : "unchecked"}');
    expect(menuSubmenuTrigger).toContain("tabIndex={0}");
    expect(navigationMenuRoot).toContain("createNavigationMenu,");
    expect(navigationMenuRoot).toContain("type NavigationMenuValueChangeDetails");
    expect(navigationMenuRoot).toContain(
      'Omit<React.HTMLAttributes<HTMLElement>, "defaultValue" | "onChange">',
    );
    expect(navigationMenuRoot).toContain("value?: string | null");
    expect(navigationMenuRoot).toContain("openDelay?: number;");
    expect(navigationMenuRoot).toContain("closeDelay?: number;");
    expect(navigationMenuRoot).toContain("openDelay = 50");
    expect(navigationMenuRoot).toContain("closeDelay = 50");
    expect(navigationMenuRoot).toContain("onValueChange?:");
    expect(navigationMenuRoot).toContain("data-sw-nav-menu");
    expect(navigationMenuRoot).toContain("data-open-delay={String(openDelay)}");
    expect(navigationMenuRoot).toContain("data-close-delay={String(closeDelay)}");
    expect(navigationMenuRoot).toContain(
      "const initialValue = value !== undefined ? value : uncontrolledValue;",
    );
    expect(navigationMenuRoot).toContain('data-state={initialValue !== null ? "open" : "closed"}');
    expect(navigationMenuRoot).toContain(
      "data-default-value={value === undefined ? (defaultValueRef.current ?? undefined) : undefined}",
    );
    expect(navigationMenuRoot).toContain(
      "const pendingValueChangeDetailsRef = React.useRef<NavigationMenuValueChangeDetails | null>",
    );
    expect(navigationMenuRoot).toContain(
      "const pendingDetails = pendingValueChangeDetailsRef.current",
    );
    expect(navigationMenuRoot).toContain("event: pendingDetails.event");
    expect(navigationMenuRoot).toContain("reason: pendingDetails.reason");
    expect(navigationMenuRoot).toContain("trigger: pendingDetails.trigger");
    expect(navigationMenuRoot).toContain("pendingValueChangeDetailsRef.current = details");
    expect(navigationMenuTrigger).toContain("data-sw-nav-menu-trigger");
    expect(navigationMenuTrigger).toContain("openDelay?: number;");
    expect(navigationMenuTrigger).toContain("closeDelay?: number;");
    expect(navigationMenuTrigger).toContain(
      '"data-open-delay": openDelay !== undefined ? String(openDelay) : undefined',
    );
    expect(navigationMenuTrigger).toContain(
      '"data-close-delay": closeDelay !== undefined ? String(closeDelay) : undefined',
    );
    expect(navigationMenuTrigger).toContain('"aria-haspopup": "menu"');
    expect(navigationMenuTrigger).toContain("React.cloneElement");
    expect(navigationMenuLink).toContain("closeOnClick?: boolean;");
    expect(navigationMenuLink).toContain("closeOnClick = true");
    expect(navigationMenuLink).toContain(
      'data-close-on-click={closeOnClick ? undefined : "false"}',
    );
    expect(navigationMenuLink).toContain('aria-current={active ? "page" : undefined}');
    expect(navigationMenuPositioner).toContain("data-sw-nav-menu-positioner");
    expect(navigationMenuPositioner).toContain("data-side={side}");
    expect(navigationMenuPositioner).toContain("data-align={align}");
    expect(navigationMenuPositioner).toContain("data-side-offset={String(sideOffset)}");
    expect(navigationMenuPositioner).toContain("data-align-offset={String(alignOffset)}");
    expect(navigationMenuPositioner).toContain("data-avoid-collisions");
    expect(navigationMenuPopup).toContain("data-sw-nav-menu-popup");
    expect(navigationMenuPopup).toContain("hidden");
    expect(navigationMenuViewport).toContain("data-sw-nav-menu-viewport");
    expect(navigationMenuViewport).toContain("hidden");
    expect(navigationMenuIndex).toContain("Root: NavigationMenuRoot");
    expect(navigationMenuIndex).toContain("Trigger: NavigationMenuTrigger");
    expect(navigationMenuIndex).toContain("Viewport: NavigationMenuViewport");
    expect(navigationMenuIndex).toContain("Arrow: NavigationMenuArrow");

    expect(tooltipPopup).toContain("export type TooltipPopupProps = Omit<");
    expect(tooltipPopup).toContain("React.HTMLAttributes<HTMLDivElement>");
    expect(tooltipPopup).toContain('"tabIndex" | "tabindex"');
    expect(tooltipPositioner).toContain("data-sw-tooltip-positioner");
    expect(tooltipPositioner).toContain("data-side={side}");
    expect(tooltipPositioner).toContain("data-align={align}");
    expect(tooltipPositioner).toContain("data-side-offset={sideOffset}");
    expect(tooltipPositioner).toContain(
      'data-avoid-collisions={avoidCollisions ? "true" : "false"}',
    );
    expect(tooltipPositioner).toContain("ref={forwardedRef}");
    expect(tooltipPositioner).toContain("{...props}");
    expect(tooltipPopup).toContain('role="tooltip"');
    expect(tooltipPopup).toContain("data-side={side}");
    expect(tooltipPopup).toContain("data-align={align}");
    expect(tooltipPopup).toContain("data-side-offset={sideOffset}");
    expect(tooltipPopup).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(tooltipPopup).toContain("hidden");
    expect(tooltipPopup).toContain("ref={forwardedRef}");
    expect(tooltipPopup).toContain("{...props}");
    expect(tooltipPopup).not.toContain("tabIndex=");
    expect(tooltipRoot).toContain(
      'data-content-hoverable={!disableHoverableContent ? "true" : "false"}',
    );
    expect(tooltipRoot).toContain("openDelay = 200");
    expect(tooltipRoot).toContain("closeDelay = 200");
    expect(tooltipRoot).toContain("instance.setDisabled(disabled)");
    expect(tooltipRoot).toContain("if (disabled && openRef.current === undefined)");
    expect(tooltipRoot).toContain("const renderedOpen = !disabled && (open ?? uncontrolledOpen)");
    expect(tooltipRoot).toContain("}, [disabled, open]);");
    expect(tooltipTrigger).toContain("asChild?: boolean;");
    expect(tooltipTrigger).not.toContain("openDelay");
    expect(tooltipTrigger).not.toContain("closeDelay");
    expect(tooltipTrigger).not.toContain("data-open-delay");
    expect(tooltipTrigger).not.toContain("data-close-delay");

    expect(sliderRoot).toContain("createSlider");
    expect(sliderRoot).toContain('"@starwind-ui/runtime/slider"');
    expect(sliderRoot).toContain("SliderValueChangeDetails");
    expect(sliderRoot).toContain("SliderValueCommitDetails");
    expect(sliderRoot).toContain("React.forwardRef<HTMLDivElement, SliderRootProps>");
    expect(sliderRoot).toContain("const valueRef = React.useRef(value)");
    expect(sliderRoot).toContain("const uncontrolledValueRef = React.useRef(uncontrolledValue)");
    expect(sliderRoot).toContain(
      "...(valueRef.current !== undefined ? { value: valueRef.current } : {})",
    );
    expect(sliderRoot).toContain("uncontrolledValueRef.current = details.value");
    expect(sliderRoot).toContain("setUncontrolledValue(details.value)");
    expect(sliderRoot).toContain("instance.setValue(value, { emit: false })");
    expect(sliderRoot).toContain("instance.setDisabled(disabled)");
    expect(sliderRoot).toContain("instance.setOptions({");
    expect(sliderRoot).toContain("const nextUncontrolledValue = instance.getValue()");
    expect(sliderRoot).toContain(
      "if (!areSliderValuesEqual(uncontrolledValueRef.current, nextUncontrolledValue))",
    );
    expect(sliderRoot).toContain("setUncontrolledValue(nextUncontrolledValue)");
    expect(sliderRoot).toContain("minStepsBetweenValues");
    expect(sliderRoot).toContain("instance.setName(name)");
    expect(sliderRoot).toContain("instance.refresh()");
    expect(sliderRoot).toContain("data-sw-slider");
    expect(sliderRoot).toContain("data-default-value");
    expect(sliderRoot).toContain("data-form");
    expect(sliderRoot).toContain("data-value");

    expect(scrollAreaRoot).toContain(
      'import { createScrollArea } from "@starwind-ui/runtime/scroll-area";',
    );
    expect(scrollAreaRoot).toContain("React.forwardRef<HTMLDivElement, ScrollAreaRootProps>");
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
    expect(scrollAreaRoot).toContain('role="presentation"');
    expect(scrollAreaRoot).toContain("createScrollArea(root");
    expect(scrollAreaRoot).toContain(
      "const instanceRef = React.useRef<ReturnType<typeof createScrollArea> | undefined>(undefined)",
    );
    expect(scrollAreaRoot).toContain("instanceRef.current = instance");
    expect(scrollAreaRoot).toContain("instance.refresh()");
    expect(scrollAreaRoot).toContain("thresholdAttributes.shared");
    expect(scrollAreaRoot).not.toContain("data-overflow-edge-threshold={overflowEdgeThreshold}");
    expect(scrollAreaRoot).toContain("instance.destroy()");
    expect(scrollAreaViewport).toContain("React.forwardRef<HTMLDivElement");
    expect(scrollAreaViewport).toContain("data-sw-scroll-area-viewport");
    expect(scrollAreaViewport).toContain('role="presentation"');
    expect(scrollAreaViewport).toContain("tabIndex={tabIndex ?? -1}");
    expect(scrollAreaViewport).toContain('style={{ ...style, overflow: "scroll" }}');
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
    expect(selectRoot).toContain("createSelect,");
    expect(selectRoot).toContain("type SelectOpenChangeDetails");
    expect(selectRoot).toContain("autoComplete?: string");
    expect(selectRoot).toContain("form?: string");
    expect(selectRoot).toContain("highlightItemOnHover?: boolean");
    expect(selectRoot).toContain("modal?: boolean");
    expect(selectRoot).toContain("modal = true");
    expect(selectRoot).toContain("onValueChange?:");
    expect(selectRoot).toContain("open?: boolean");
    expect(selectRoot).toContain("readOnly?: boolean");
    expect(selectRoot).toContain("value?: string");
    expect(selectRoot).toContain("data-sw-select");
    expect(selectRoot).toContain("data-autocomplete");
    expect(selectRoot).toContain("data-form");
    expect(selectRoot).toContain("data-highlight-item-on-hover");
    expect(selectRoot).toContain("data-modal");
    expect(selectRoot).toContain("data-readonly");
    expect(selectRoot).toContain("data-sw-select-input");
    expect(selectRoot).toContain('type="hidden"');
    expect(selectRoot).toContain("autoComplete={autoComplete}");
    expect(selectRoot).toContain("form={form}");
    expect(selectRoot).toContain("const ensureInstance = React.useCallback");
    expect(selectRoot).toContain("const existing = instanceRef.current;");
    expect(selectRoot).toContain("if ((openRef.current ?? uncontrolledOpenRef.current) !== true)");
    expect(selectRoot).toContain("const [selectedLabel, setSelectedLabel] = React.useState");
    expect(selectRoot).toContain("window.setTimeout(() =>");
    expect(selectRoot).toContain("label: findSelectedOptionText(children, selectedValue)");
    expect(selectRoot).toContain("value: selectedValue");
    expect(selectRoot).toContain("const renderedSelectedLabel =");
    expect(selectRoot).toContain(
      "selectedLabel.value === selectedValue ? selectedLabel.label : null",
    );
    expect(selectRoot).toContain("const initializeFromTriggerEvent = React.useCallback");
    expect(selectRoot).toContain('target.closest("[data-sw-select-trigger]")');
    expect(selectRoot).toContain("const contextValue = React.useMemo");
    expect(selectRoot).toContain("disabled: disabled");
    expect(selectRoot).toContain("readOnly: readOnly");
    expect(selectRoot).toContain("required: required");
    expect(selectRoot).toContain("<SelectContext.Provider value={contextValue}>");
    expect(selectRoot).toContain("data-value={selectedValue ?? undefined}");
    expect(selectRoot).toContain('data-placeholder={selectedValue === null ? "" : undefined}');
    expect(selectRoot).toContain("data-selected-label={renderedSelectedLabel ?? undefined}");
    expect(selectRoot).toContain("disabled={disabled}");
    expect(selectRoot).toContain("required={required}");
    expect(selectRoot).toContain("onPointerDownCapture={(event) =>");
    expect(selectRoot).toContain("initializeFromTriggerEvent(event);");
    expect(selectRoot).toContain("function findSelectedOptionText");
    expect(selectRoot).toContain("selectedText = getSelectedOptionTextFromProps(childProps)");
    expect(selectRoot).toContain("function getSelectedOptionTextFromProps");
    expect(selectRoot).toContain("function getSelectItemTextFromReactNode");
    expect(selectRoot).toContain("function getStringPropText");
    expect(selectRoot).toContain("return childText.length > 0 ? childText : null");
    expect(selectRoot).toContain("function getTextFromReactNode");
    expect(selectRoot).toContain(
      "instanceRef.current?.setFormOptions({ autoComplete, form, name, required })",
    );
    expect(selectRoot).toContain("instanceRef.current?.setDisabled(disabled)");
    expect(selectRoot).toContain("instanceRef.current?.setReadOnly(readOnly)");
    expect(selectRoot).toContain("instanceRef.current?.setModal(modal)");
    expect(selectRoot).toContain(
      "instanceRef.current?.setHighlightItemOnHover(highlightItemOnHover)",
    );
    expect(selectRoot).toContain("}, [autoComplete, form, name, required]);");
    expect(selectRoot).toContain("}, [disabled]);");
    expect(selectRoot).toContain("}, [readOnly]);");
    expect(selectRoot).toContain("}, [modal]);");
    expect(selectRoot).toContain("}, [highlightItemOnHover]);");
    expect(selectRoot).toContain("}, []);");
    expect(selectRoot).toContain("}, [ensureInstance, open, uncontrolledOpen]);");
    expect(selectRoot).toContain("instance.setValue(value, { emit: false })");
    expect(selectContext).toContain("export const SelectContext");
    expect(selectContext).toContain("export const SelectItemContext");
    expect(selectContext).toContain("disabled: boolean;");
    expect(selectContext).toContain("readOnly: boolean;");
    expect(selectContext).toContain("required: boolean;");
    expect(selectContext).toContain("selectedLabel: string | null;");
    expect(selectContext).toContain("export function useSelectContext()");
    expect(selectTrigger).toContain("data-sw-select-trigger");
    expect(selectTrigger).toContain('"aria-haspopup": "listbox"');
    expect(selectTrigger).toContain("const select = useSelectContext();");
    expect(selectTrigger).toContain('"aria-expanded": select.open ? "true" : "false"');
    expect(selectTrigger).toContain('"aria-disabled": select.disabled ? "true" : undefined');
    expect(selectTrigger).toContain('"aria-required": select.required ? "true" : undefined');
    expect(selectTrigger).toContain('"aria-readonly": select.readOnly ? "true" : "false"');
    expect(selectTrigger).toContain('"data-disabled": select.disabled ? "" : undefined');
    expect(selectTrigger).toContain('"data-required": select.required ? "" : undefined');
    expect(selectTrigger).toContain('"data-readonly": select.readOnly ? "" : undefined');
    expect(selectTrigger).toContain('"data-state": select.open ? "open" : "closed"');
    expect(selectTrigger).toContain("disabled: select.disabled || undefined");
    expect(selectTrigger).toContain("disabled={select.disabled}");
    expect(selectTrigger).not.toContain('"aria-expanded": "false"');
    expect(selectTrigger).toContain("asChild");
    expect(selectTrigger).toContain("getAsChildElement(children)");
    expect(selectTrigger).toContain("protectedProps: protectedTriggerProps");
    expect(selectValue).toContain("data-sw-select-value");
    expect(selectValue).toContain("const select = useSelectContext();");
    expect(selectValue).toContain("const fallback =");
    expect(selectValue).toContain("select.value !== null && select.selectedLabel !== null");
    expect(selectValue).toContain("? select.selectedLabel");
    expect(selectValue).toContain(": placeholder;");
    expect(selectValue).toContain("{children ?? fallback}");
    expect(selectPositioner).toContain("alignItemWithTrigger?: boolean");
    expect(selectPositioner).toContain("alignItemWithTrigger = true");
    expect(selectPositioner).toContain(
      'data-align-item-with-trigger={alignItemWithTrigger ? "true" : "false"}',
    );
    expect(selectPositioner).not.toContain("alignItemsWithTrigger");
    expect(selectPositioner).not.toContain("data-align-items-with-trigger");
    expect(selectPopup).toContain("data-sw-select-popup");
    expect(selectPopup).toContain("keepMounted?: boolean");
    expect(selectPopup).toContain("keepMounted = false");
    expect(selectPopup).toContain('import { useComposedRefs } from "../internal/compose-refs";');
    expect(selectPopup).toContain(
      'import { useClosePresence } from "../internal/use-close-presence";',
    );
    expect(selectPopup).toContain("const closePresence = useClosePresence<HTMLDivElement>({");
    expect(selectPopup).toContain("keepMounted,");
    expect(selectPopup).toContain("open: select.open,");
    expect(selectPopup).toContain("const composedRef = useComposedRefs");
    expect(selectPopup).toContain('role="listbox"');
    expect(selectPopup).toContain('data-state={select.open ? "open" : "closed"}');
    expect(selectPopup).toContain("hidden={closePresence.hidden}");
    expect(selectPopup).toContain("ref={composedRef}");
    expect(selectPopup).toContain("{closePresence.present ? props.children : null}");
    expect(selectPopup).not.toContain("initialHiddenRef");
    expect(selectPopup).not.toContain("suppressHydrationWarning");
    expect(selectPopup).not.toContain('data-state="closed"');
    expect(selectPopup).not.toContain("const shouldRenderChildren = keepMounted || select.open;");
    expect(selectItem).toContain("data-sw-select-item");
    expect(selectItem).toContain('role="option"');
    expect(selectItem).toContain("data-value={value}");
    expect(selectItem).toContain("const selected = select.value === value;");
    expect(selectItem).toContain("aria-selected={selected}");
    expect(selectItem).not.toContain('aria-selected="false"');
    expect(selectItemIndicator).toContain("data-sw-select-item-indicator");
    expect(selectItemIndicator).toContain("const selected = select.value === item.value;");
    expect(selectItemIndicator).toContain('data-state={selected ? "checked" : "unchecked"}');
    expect(selectItemIndicator).toContain("hidden={!selected}");
    expect(selectIndex).toContain("Root: SelectRoot");
    expect(selectIndex).toContain("SelectContext");
    expect(selectIndex).toContain("Trigger: SelectTrigger");
    expect(selectIndex).toContain("ItemIndicator: SelectItemIndicator");
    expect(selectIndex).toContain(
      'export type { SelectOpenChangeDetails, SelectValueChangeDetails } from "@starwind-ui/runtime";',
    );
    expect(sidebarProvider).toContain("createSidebarController,");
    expect(sidebarProvider).toContain("type SidebarOpenChangeDetails");
    expect(sidebarProvider).toContain("defaultMobileOpen?: boolean");
    expect(sidebarProvider).toContain("mobileOpen?: boolean");
    expect(sidebarProvider).toContain("onMobileOpenChange?:");
    expect(sidebarProvider).toContain("persistOpen?: boolean");
    expect(sidebarProvider).toContain(
      "...(openRef.current !== undefined ? { open: openRef.current } : {})",
    );
    expect(sidebarProvider).toContain(
      "...(mobileOpenRef.current !== undefined ? { mobileOpen: mobileOpenRef.current } : {})",
    );
    expect(sidebarProvider).toContain("instance.setOpen(open, { emit: false })");
    expect(sidebarProvider).toContain("instance.setMobileOpen(mobileOpen, { emit: false })");
    expect(sidebarProvider).toContain("data-sw-sidebar-provider");
    expect(sidebarProvider).toContain('"data-default-open"');
    expect(sidebarProvider).toContain('"data-default-mobile-open"');
    expect(sidebarProvider).toContain('"data-persist-open"');
    expect(sidebarProvider).toContain('import { SidebarContext } from "./SidebarContext";');
    expect(sidebarProvider).toContain("const [isMobile, setIsMobile] = React.useState(false)");
    expect(sidebarProvider).toContain("expanded: isMobile ? renderedMobileOpen : renderedOpen");
    expect(sidebarProvider).toContain("<SidebarContext.Provider value={contextValue}>");
    expect(sidebarContext).toContain("export type SidebarContextValue");
    expect(sidebarContext).toContain("useSidebarContext");
    expect(sidebar).toContain("data-sw-sidebar");
    expect(sidebar).toContain('import { useSidebarContext } from "./SidebarContext";');
    expect(sidebar).toContain('const sidebarState = sidebarContext?.state ?? "expanded";');
    expect(sidebar).toContain("data-state={sidebarState}");
    expect(sidebar).toContain('data-collapsible={sidebarState === "collapsed" ? collapsible : ""}');
    expect(sidebar).toContain("data-collapsible-mode={collapsible}");
    expect(sidebar).not.toContain('data-state="expanded"');
    expect(sidebar).not.toContain('data-collapsible=""');
    expect(sidebarTrigger).toContain("data-sw-sidebar-trigger");
    expect(sidebarTrigger).toContain('import { useSidebarContext } from "./SidebarContext";');
    expect(sidebarTrigger).toContain('"aria-expanded": sidebarContext?.expanded ?? false');
    expect(sidebarTrigger).toContain('"data-state": sidebarContext?.state ?? "expanded"');
    expect(sidebarTrigger).not.toContain('"aria-expanded": "false"');
    expect(sidebarRail).toContain("data-sw-sidebar-rail");
    expect(sidebarRail).toContain('import { useSidebarContext } from "./SidebarContext";');
    expect(sidebarRail).toContain("aria-expanded={sidebarContext?.expanded ?? false}");
    expect(sidebarRail).toContain('data-state={sidebarContext?.state ?? "expanded"}');
    expect(sidebarRail).toContain("tabIndex={-1}");
    expect(sidebarMenuButton).toContain("data-sw-sidebar-menu-button");
    expect(sidebarMenuButton).toContain('import { useSidebarContext } from "./SidebarContext";');
    expect(sidebarMenuButton).toContain(
      '"data-sidebar-state": sidebarContext?.state ?? "expanded"',
    );
    expect(sidebarMenuButton).toContain(
      "mergeAsChildProps({ ...menuButtonProps, className }, childProps",
    );
    expect(sidebarMenuButton).toContain("protectedProps: protectedMenuButtonProps");
    expect(sidebarMenuButton).not.toContain("function mergeAsChildProps");
    expect(sidebarMenuButton).not.toContain('"data-sidebar-state": "expanded"');
    expect(sidebarIndex).toContain("Provider: SidebarProvider");
    expect(sidebarIndex).toContain("MenuButton: SidebarMenuButton");
    expect(sidebarIndex).toContain("SidebarContext");
    expect(sidebarIndex).toMatch(
      /export type \{\s+SidebarMobileOpenChangeDetails,\s+SidebarOpenChangeDetails,\s+SidebarPersistenceStorage,\s+\} from "@starwind-ui\/runtime";/,
    );
    expect(comboboxRoot).toContain("createCombobox,");
    expect(comboboxRoot).toContain("type ComboboxInputValueChangeDetails");
    expect(comboboxRoot).toContain("autoComplete?: string");
    expect(comboboxRoot).toContain('filterMode?: "contains" | "startsWith"');
    expect(comboboxRoot).toContain("form?: string");
    expect(comboboxRoot).toContain("highlightItemOnHover?: boolean");
    expect(comboboxRoot).toContain("inputValue?: string");
    expect(comboboxRoot).toContain("locale?: string");
    expect(comboboxRoot).toContain("modal?: boolean");
    expect(comboboxRoot).toContain("modal = false");
    expect(comboboxRoot).toContain("onInputValueChange?:");
    expect(comboboxRoot).toContain("readOnly?: boolean");
    expect(comboboxRoot).toContain("data-sw-combobox");
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
    expect(comboboxRoot).toContain('import { ComboboxContext } from "./ComboboxContext";');
    expect(comboboxRoot).toContain("const ensureInstance = React.useCallback");
    expect(comboboxRoot).toContain("const runtimeOptionsRef = React.useRef");
    expect(comboboxRoot).toContain("const nextRuntimeOptions = {");
    expect(comboboxRoot).toContain("instance.destroy();");
    expect(comboboxRoot).toContain("name,");
    expect(comboboxRoot).toContain("modal,");
    expect(comboboxRoot).toContain("required,");
    expect(comboboxRoot).toContain(
      "instanceRef.current?.setFormOptions({ autoComplete, form, name, required })",
    );
    expect(comboboxRoot).toContain("}, [autoComplete, form, name, required]);");
    expect(comboboxRoot).toContain("instanceRef.current?.setDisabled(disabled);");
    expect(comboboxRoot).toContain("}, [disabled]);");
    expect(comboboxRoot).not.toContain(
      "}, [autoComplete, disabled, filterMode, form, highlightItemOnHover, locale, readOnly]);",
    );
    expect(comboboxRoot).toMatch(
      /}, \[\s*children,\s*autoComplete,\s*disabled,\s*filterMode,\s*form,\s*highlightItemOnHover,\s*locale,\s*modal,\s*name,\s*readOnly,\s*required,\s*setUncontrolledInputValue,\s*setUncontrolledOpen,\s*setUncontrolledValue,\s*\]\);/,
    );
    expect(comboboxRoot).toContain("}, [ensureInstance, open, uncontrolledOpen]);");
    expect(comboboxRoot).toContain(
      "instance.setInputValue(inputValue, { emit: false, filter: false })",
    );
    expect(comboboxRoot).toContain("const previousValue = instance.getValue();");
    expect(comboboxRoot).toContain("if (previousValue !== value) {");
    expect(comboboxRoot).toContain("const nextInputValue = instance.getInputValue();");
    expect(comboboxRoot).toContain("if (uncontrolledInputValueRef.current !== nextInputValue) {");
    expect(comboboxRoot).toContain("setUncontrolledInputValue(nextInputValue);");
    expect(comboboxRoot).toContain("const selectedInitialValue =");
    expect(comboboxRoot).toContain(
      "const selectedInitialInputValue = findSelectedComboboxItemText(children, selectedInitialValue);",
    );
    expect(comboboxRoot).toContain('root.addEventListener("starwind:set-value"');
    expect(comboboxRoot).toContain("const instance = ensureInstance();");
    expect(comboboxRoot).toContain('const nextValue = detail.value === "" ? null : detail.value;');
    expect(comboboxRoot).toContain("event.stopImmediatePropagation();");
    expect(comboboxRoot).toContain("capture: true");
    expect(comboboxRoot).toContain("const nextRuntimeInputValue =");
    expect(comboboxRoot).toContain("findSelectedComboboxItemText(children, nextValue)");
    expect(comboboxRoot).toContain("instance.setInputValue(nextInputValue");
    expect(comboboxRoot).toContain("instanceRef.current?.setInputValue(nextInputValue");
    expect(comboboxRoot).toContain("data-value={selectedValue ?? undefined}");
    expect(comboboxRoot).toContain("const defaultRuntimeInputValue =");
    expect(comboboxRoot).toContain("const defaultRuntimeFilterValue =");
    expect(comboboxRoot).toContain("defaultInputValue: defaultRuntimeInputValue,");
    expect(comboboxRoot).toContain("? { defaultFilterValue: defaultRuntimeFilterValue }");
    expect(comboboxRoot).toContain("? { defaultValueText: selectedInitialInputValue }");
    expect(comboboxRoot).toContain("const selectedText =");
    expect(comboboxRoot).toContain("selectedText,");
    expect(comboboxInput).toContain("data-sw-combobox-input");
    expect(comboboxInput).toContain('role="combobox"');
    expect(comboboxInput).toContain('aria-autocomplete="list"');
    expect(comboboxInput).toContain(
      "const inputDisabled = combobox.disabled || props.disabled === true;",
    );
    expect(comboboxInput).toContain("disabled={inputDisabled}");
    expect(comboboxTrigger).toContain("data-sw-combobox-trigger");
    expect(comboboxTrigger).toContain("getAsChildElement(children)");
    expect(comboboxClear).toContain("data-sw-combobox-clear");
    expect(comboboxValue).toContain("placeholder?: string");
    expect(comboboxValue).toContain('import { useComboboxContext } from "./ComboboxContext";');
    expect(comboboxValue).toContain("const displayedChildren = children ??");
    expect(comboboxValue).toContain("data-sw-combobox-value");
    expect(comboboxValue).toContain("data-placeholder={placeholder}");
    expect(comboboxPopup).toContain("data-sw-combobox-popup");
    expect(comboboxPopup).toContain('role="listbox"');
    expect(comboboxPopup).toContain("keepMounted?: boolean");
    expect(comboboxPopup).toContain('import { useComposedRefs } from "../internal/compose-refs";');
    expect(comboboxPopup).toContain(
      'import { useClosePresence } from "../internal/use-close-presence";',
    );
    expect(comboboxPopup).toContain("const closePresence = useClosePresence<HTMLDivElement>({");
    expect(comboboxPopup).toContain("keepMounted,");
    expect(comboboxPopup).toContain("open: combobox.open,");
    expect(comboboxPopup).toContain("const composedRef = useComposedRefs");
    expect(comboboxPopup).toContain("hidden={closePresence.hidden}");
    expect(comboboxPopup).toContain("ref={composedRef}");
    expect(comboboxPopup).toContain("{closePresence.present ? props.children : null}");
    expect(comboboxPopup).not.toContain(
      "const shouldRenderChildren = keepMounted || combobox.open",
    );
    expect(comboboxItem).toContain("data-sw-combobox-item");
    expect(comboboxItem).toContain("data-value={value}");
    expect(comboboxIndex).toContain("Root: ComboboxRoot");
    expect(comboboxIndex).toContain("InputGroup: ComboboxInputGroup");
    expect(comboboxIndex).toContain("ItemIndicator: ComboboxItemIndicator");
    expect(comboboxIndex).toContain("useComboboxContext");
    expect(toastViewport).toContain("createToastManager");
    expect(toastViewport).toContain("data-sw-toast-viewport");
    expect(toastViewport).toContain("data-position={position}");
    expect(toastViewport).toContain("data-limit={limit}");
    expect(toastViewport).toContain("data-duration={duration}");
    expect(toastViewport).toContain('aria-live="polite"');
    expect(toastTemplate).toContain("<template data-sw-toast-template={variant}");
    expect(toastTemplate).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(toastTemplate).toContain("useIsomorphicLayoutEffect(() =>");
    expect(toastTemplate).not.toContain("React.useLayoutEffect");
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
    expect(sliderLabel).toContain("React.HTMLAttributes<HTMLSpanElement>");
    expect(sliderLabel).toContain('SliderLabel.displayName = "Slider.Label"');
    expect(sliderThumb).toContain("data-sw-slider-thumb");
    expect(sliderThumb).toContain("data-index");
    expect(sliderRoot).toContain(
      "Controlled value. Slider controlledness is fixed when the Runtime is created; do not switch between controlled and uncontrolled after mount.",
    );
    expect(sliderThumb).not.toContain("inputName?: string");
    expect(sliderThumb).not.toContain("name={inputName}");
    expect(sliderThumb).toContain("visuallyHiddenStyle");
    expect(sliderThumb).toContain("data-sw-slider-input");
    expect(sliderThumb).toContain('aria-hidden="true"');
    expect(sliderThumb).toContain("tabIndex={-1}");
    expect(sliderThumb).toContain('type="range"');
    expect(sliderIndex).toContain("Root: SliderRoot");
    expect(sliderIndex).toContain("Control: SliderControl");
    expect(sliderIndex).toContain("Track: SliderTrack");
    expect(sliderIndex).toContain("Indicator: SliderIndicator");
    expect(sliderIndex).toContain("Label: SliderLabel");
    expect(sliderIndex).toContain("Thumb: SliderThumb");

    expect(switchRoot).toContain("createSwitch");
    expect(switchRoot).toContain("SwitchCheckedChangeDetails");
    expect(switchRoot).toContain("React.forwardRef<HTMLSpanElement | HTMLButtonElement");
    expect(switchRoot).toContain("const checkedRef = React.useRef(checked)");
    expect(switchRoot).toContain("const defaultCheckedRef = React.useRef(defaultChecked)");
    expect(switchRoot).not.toContain("indeterminateRef");
    expect(switchRoot).not.toContain("setIndeterminate");
    expect(switchRoot).not.toContain("renderedIndeterminate");
    expect(switchRoot).not.toContain('"data-indeterminate"');
    expect(switchRoot).toContain(
      "const [uncontrolledChecked, setUncontrolledCheckedState] = React.useState(defaultCheckedRef.current)",
    );
    expect(switchRoot).toContain(
      "const uncontrolledCheckedRef = React.useRef(uncontrolledChecked)",
    );
    expect(switchRoot).toContain("defaultChecked: uncontrolledCheckedRef.current");
    expect(switchRoot).toContain("const resetSyncTimerRef = React.useRef");
    expect(switchRoot).toContain("syncUncontrolledAfterFormReset");
    expect(switchRoot).toContain("const syncUncontrolledChecked = () =>");
    expect(switchRoot).toContain("new MutationObserver(syncUncontrolledChecked)");
    expect(switchRoot).toContain('attributeFilter: ["aria-checked"]');
    expect(switchRoot).toContain('formElement?.addEventListener("reset"');
    expect(switchRoot).toContain("}, [id, nativeButton, readOnly]);");
    expect(switchRoot).not.toContain(
      "}, [form, id, name, nativeButton, readOnly, required, uncheckedValue, value]);",
    );
    expect(switchRoot).toContain("setUncontrolledChecked(details.checked)");
    expect(switchRoot).toContain("instance.setChecked(checked, { emit: false })");
    expect(switchRoot).toContain("instance.setDisabled(disabled)");
    expect(switchRoot).toContain("instance.setFormOptions({");
    expect(switchRoot).toContain("uncheckedValue,");
    expect(switchRoot).toContain("}, [form, name, required, uncheckedValue, value]);");
    expect(switchRoot).toContain("const renderedChecked = checked ?? uncontrolledChecked");
    expect(switchRoot).toContain("defaultValue={value}");
    expect(switchRoot).toContain("form={form}");
    expect(switchRoot).toContain("name={name}");
    expect(switchRoot).toContain("required={required}");
    expect(switchRoot).toContain('"aria-readonly": readOnly ? "true" : undefined');
    expect(switchRoot).toContain('"aria-required": required ? "true" : undefined');
    expect(switchRoot).toContain("id={getSwitchInputId(id, nativeButton)}");
    expect(switchRoot).toContain("return nativeButton ? `${id}-input` : id;");
    expect(switchRoot).toContain("defaultChecked={defaultCheckedRef.current}");
    expect(switchRoot).toContain("data-sw-switch");
    expect(switchRoot).toContain("data-sw-switch-input");
    expect(switchRoot).toContain('"data-default-checked"');
    expect(switchRoot).toContain('"data-unchecked-value"');
    expect(switchRoot).not.toContain(
      "id={id}\n          ref={composedRef as React.Ref<HTMLSpanElement>}",
    );
    expect(switchRoot).not.toContain(removedAttr("data-sw-switch", "default-checked"));
    expect(switchRoot).not.toContain(removedAttr("data-sw-switch", "unchecked-value"));
    expect(switchThumb).toContain("data-sw-switch-thumb");
    expect(switchThumb).not.toContain("data-unchecked");
    expect(switchThumb).toContain("React.forwardRef<HTMLSpanElement, SwitchThumbProps>");
    expect(switchIndex).toContain("Root: SwitchRoot");
    expect(switchIndex).toContain("Thumb: SwitchThumb");

    expect(tabsContext).toContain("React.createContext");
    expect(tabsContext).toContain("useTabsContext");
    expect(tabsRoot).toContain("createTabs");
    expect(tabsRoot).toContain('"@starwind-ui/runtime/tabs"');
    expect(tabsRoot).toContain("TabsValueChangeDetails");
    expect(tabsRoot).toContain("React.forwardRef<HTMLDivElement, TabsRootProps>");
    expect(tabsRoot).toContain("syncKey?: string");
    expect(tabsRoot).toContain("const syncKeyRef = React.useRef(syncKey)");
    expect(tabsRoot).toContain("syncKey: syncKeyRef.current");
    expect(tabsRoot).toContain("const valueRef = React.useRef(value)");
    expect(tabsRoot).toContain("orientationRef.current = orientation");
    expect(tabsRoot).toContain("onValueChange: (_nextValue, details) =>");
    expect(tabsRoot).toContain("onValueChangeRef.current?.(details.value, details)");
    expect(tabsRoot).toContain(
      "...(valueRef.current !== undefined ? { value: valueRef.current } : {})",
    );
    expect(tabsRoot).toContain("setUncontrolledValue(instance.getValue())");
    expect(tabsRoot).toContain("setUncontrolledValue(details.value)");
    expect(tabsRoot).toContain("if (details.isCanceled) return");
    expect(tabsRoot).toContain("instance.refresh()");
    expect(tabsRoot).toContain("instanceRef.current?.refresh()");
    expect(tabsRoot).toContain("}, [children])");
    expect(tabsRoot).toContain("instance.setValue(value, { emit: false, sync: true })");
    expect(tabsRoot).toContain("unsubscribe()");
    expect(tabsRoot).toContain("instance.destroy()");
    expect(tabsRoot).toContain(
      "const renderedValue = value !== undefined ? value : uncontrolledValue",
    );
    expect(tabsRoot).toContain("data-sw-tabs");
    expect(tabsRoot).toContain("data-default-value={serializeTabsValue(defaultValueRef.current)}");
    expect(tabsRoot).toContain("data-orientation={orientation}");
    expect(tabsRoot).toContain("data-sync-key={syncKey}");
    expect(tabsRoot).toContain("data-value={serializeTabsValue(renderedValue)}");
    expect(tabsRoot).toContain("{children}");
    expect(tabsRoot).not.toContain("instanceRef.current?.refresh();\n  });");
    expect(tabsList).toContain("activateOnFocus?: boolean");
    expect(tabsList).toContain("loopFocus?: boolean");
    expect(tabsList).toContain("data-sw-tabs-list");
    expect(tabsList).toContain("data-activate-on-focus");
    expect(tabsList).toContain("data-loop-focus");
    expect(tabsList).toContain('role="tablist"');
    expect(tabsTab).toContain("data-sw-tabs-tab");
    expect(tabsTab).toContain("aria-selected={active}");
    expect(tabsTab).toContain("tabIndex={active && !disabled ? 0 : -1}");
    expect(tabsPanel).toContain("data-sw-tabs-panel");
    expect(tabsPanel).toContain("hidden={!active}");
    expect(tabsPanel).toContain('role="tabpanel"');
    expect(tabsIndicator).toContain("data-sw-tabs-indicator");
    expect(tabsIndicator).not.toContain("hidden={value === null}");
    expect(tabsIndicator).toContain('role="presentation"');
    expect(tabsIndex).toContain("TabsContext");
    expect(tabsIndex).toContain("Root: TabsRoot");
    expect(tabsIndex).toContain("List: TabsList");
    expect(tabsIndex).toContain("Tab: TabsTab");
    expect(tabsIndex).toContain("Panel: TabsPanel");
    expect(tabsIndex).toContain("Indicator: TabsIndicator");

    expect(toggleRoot).toContain("createToggle");
    expect(toggleRoot).toContain("TogglePressedChangeDetails");
    expect(toggleRoot).toContain("React.forwardRef<HTMLButtonElement | HTMLSpanElement");
    expect(toggleRoot).not.toContain("indeterminateRef");
    expect(toggleRoot).not.toContain("setIndeterminate");
    expect(toggleRoot).not.toContain("renderedIndeterminate");
    expect(toggleRoot).not.toContain('"data-indeterminate"');
    expect(toggleRoot).toContain("const defaultPressedRef = React.useRef(defaultPressed)");
    expect(toggleRoot).toContain(
      '"data-default-pressed": pressed === undefined && defaultPressedRef.current',
    );
    expect(toggleRoot).toContain("const pressedRef = React.useRef(pressed)");
    expect(toggleRoot).toContain(
      "const [uncontrolledPressed, setUncontrolledPressedState] = React.useState(defaultPressedRef.current)",
    );
    expect(toggleRoot).toContain(
      "const uncontrolledPressedRef = React.useRef(uncontrolledPressed)",
    );
    expect(toggleRoot).toContain("defaultPressed: uncontrolledPressedRef.current");
    expect(toggleRoot).toContain("const syncUncontrolledPressed = () =>");
    expect(toggleRoot).toContain("new MutationObserver(syncUncontrolledPressed)");
    expect(toggleRoot).toContain('attributeFilter: ["aria-pressed"]');
    expect(toggleRoot).toContain("setUncontrolledPressed(details.pressed)");
    expect(toggleRoot).toContain("queueMicrotask(() =>");
    expect(toggleRoot).toContain("syncGroup?: string");
    expect(toggleRoot).toContain("syncGroup,");
    expect(toggleRoot).toContain("}, [nativeButton, syncGroup, value]);");
    expect(toggleRoot).toContain("instance.setPressed(pressed, { emit: false, sync: true })");
    expect(toggleRoot).toContain("instance.setDisabled(disabled)");
    expect(toggleRoot).toContain("const renderedPressed = pressed ?? uncontrolledPressed");
    expect(toggleRoot).toContain("data-sw-toggle");
    expect(toggleRoot).toContain('"data-default-pressed"');
    expect(toggleRoot).toContain('"data-native"');
    expect(toggleRoot).toContain('"data-sync-group": syncGroup');
    expect(toggleRoot).toContain('"data-value"');
    expect(toggleRoot).not.toContain(removedAttr("data-sw-toggle", "default-pressed"));
    expect(toggleRoot).not.toContain(removedAttr("data-sw-toggle", "native"));
    expect(toggleRoot).not.toContain(removedAttr("data-sw-toggle", "value"));
    expect(toggleIndex).toContain("Root: ToggleRoot");

    expect(toggleGroupRoot).toContain("createToggleGroup");
    expect(toggleGroupRoot).toContain("ToggleGroupValueChangeDetails");
    expect(toggleGroupRoot).toContain("React.forwardRef<HTMLDivElement, ToggleGroupRootProps>");
    expect(toggleGroupRoot).toContain("defaultValue?: ToggleGroupValue");
    expect(toggleGroupRoot).toContain("loopFocus?: boolean");
    expect(toggleGroupRoot).toContain("multiple?: boolean");
    expect(toggleGroupRoot).toContain('orientation?: "horizontal" | "vertical"');
    expect(toggleGroupRoot).toContain("onValueChange?:");
    expect(toggleGroupRoot).toContain("value?: ToggleGroupValue");
    expect(toggleGroupRoot).toContain("const valueRef = React.useRef(value)");
    expect(toggleGroupRoot).toContain("normalizeRenderedValue(defaultValueRef.current ?? []");
    expect(toggleGroupRoot).toContain(
      "...(valueRef.current !== undefined ? { value: valueRef.current } : {})",
    );
    expect(toggleGroupRoot.indexOf("onValueChangeRef.current?.")).toBeLessThan(
      toggleGroupRoot.indexOf("setUncontrolledValue(details.value)"),
    );
    expect(toggleGroupRoot).toContain("if (details.isCanceled) return;");
    expect(toggleGroupRoot).toContain('instance.subscribe("valueChange"');
    expect(toggleGroupRoot).toContain("onValueChangeRef.current?.(details.value, details)");
    expect(toggleGroupRoot).toContain("instance.setDisabled(disabled)");
    expect(toggleGroupRoot).toContain("instance.setLoopFocus(loopFocus)");
    expect(toggleGroupRoot).toContain("instance.setMultiple(multiple)");
    expect(toggleGroupRoot).toContain("setUncontrolledValue(instance.getValue())");
    expect(toggleGroupRoot).toContain("instance.setOrientation(orientation)");
    expect(toggleGroupRoot).toContain("instance.setValue(value, { emit: false })");
    expect(toggleGroupRoot).toContain("unsubscribe()");
    expect(toggleGroupRoot).toContain("instance.destroy()");
    expect(toggleGroupRoot).toContain("function normalizeRenderedValue");
    expect(toggleGroupRoot).toContain("data-sw-toggle-group");
    expect(toggleGroupRoot).toContain("data-default-value={");
    expect(toggleGroupRoot).toContain("data-loop-focus={");
    expect(toggleGroupRoot).toContain("data-multiple={");
    expect(toggleGroupRoot).toContain("data-orientation={orientation}");
    expect(toggleGroupRoot).toContain("data-value={JSON.stringify(renderedValue)}");
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "default-value"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "loop-focus"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "multiple"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "orientation"));
    expect(toggleGroupRoot).not.toContain(removedAttr("data-sw-toggle-group", "value"));
    expect(toggleGroupIndex).toContain("const ToggleGroup =");
    expect(toggleGroupIndex).toContain("Root: ToggleGroupRoot");
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
    expect(renamedRoot).toContain("data-sw-combobox-renamed");
    expect(renamedRoot).toContain("data-default-query");

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
    expect(formSetterRoot).toContain(
      "instanceRef.current?.setFormOptions({ required, name, form, autoComplete })",
    );
    expect(formSetterRoot).toContain("}, [required, name, form, autoComplete]);");

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
    expect(await readGeneratedFile(fileBasenameOutputRoot, "combobox/ComboboxBase.tsx")).toContain(
      "data-sw-combobox",
    );
    expect(await readGeneratedFile(fileBasenameOutputRoot, "combobox/index.ts")).toContain(
      'import ComboboxRoot from "./ComboboxBase";',
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

    const renamedOutputRoot = path.join(tempRoot, "renamed-spec/primitives/react");
    await writeReactMenuSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createTsHeader(generatedBy),
    );
    expect(await readGeneratedFile(renamedOutputRoot, "menu/MenuRoot.tsx")).toContain(
      "data-sw-menu-renamed",
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
    expect(branchRecipeItem).toContain('role="menuitem-test"');
    expect(branchRecipeItem).toContain("tabIndex={1}");
    expect(branchRecipeLinkItem).toContain("tabIndex={2}");

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

    const renamedOutputRoot = path.join(tempRoot, "renamed-context-spec/primitives/react");
    await writeReactContextMenuSpecializedAdapterSpec(
      renamedOutputRoot,
      renamedSpec,
      createTsHeader(generatedBy),
    );
    expect(
      await readGeneratedFile(renamedOutputRoot, "context-menu/ContextMenuRoot.tsx"),
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
