import { getPrimitiveInventoryEntry } from "../../../primitive-inventory.js";
import {
  nativeSelectUsesBrowserValue,
  nativeValuePolicy,
} from "../../../shared-recipes/passive/native-values.js";
import { sidebarSheetBindings } from "../../../shared-recipes/structured/sidebar/sheet.js";
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
  StyledOutputValueExpression,
} from "../../../styled-output-model/index.js";
import { SVELTE_PRIMITIVE_COMPONENTS } from "../inventory.js";
import { specializeSvelteStyledAccordion } from "./accordion.js";
import { specializeSvelteStyledAlertDialog } from "./alert-dialog.js";
import { specializeSvelteStyledAvatar } from "./avatar.js";
import { specializeSvelteStyledBreadcrumb } from "./breadcrumb.js";
import { specializeSvelteStyledButton } from "./button.js";
import { specializeSvelteStyledCarousel } from "./carousel.js";
import { specializeSvelteStyledCheckbox } from "./checkbox.js";
import { specializeSvelteStyledCheckboxGroup } from "./checkbox-group.js";
import { specializeSvelteStyledCollapsible } from "./collapsible.js";
import { specializeSvelteStyledColorPicker } from "./color-picker.js";
import { specializeSvelteStyledCombobox } from "./combobox.js";
import { specializeSvelteStyledContextMenu } from "./context-menu.js";
import { specializeSvelteStyledDialog } from "./dialog.js";
import { specializeSvelteStyledDropdown } from "./dropdown.js";
import { specializeSvelteStyledDropzone } from "./dropzone.js";
import { specializeSvelteStyledField } from "./field.js";
import { specializeSvelteStyledForm } from "./form.js";
import { specializeSvelteStyledHoverCard } from "./hover-card.js";
import { sveltePrimitiveImport } from "./imports.js";
import { specializeSvelteStyledInput } from "./input.js";
import { specializeSvelteStyledInputGroup } from "./input-group.js";
import { specializeSvelteStyledInputOtp } from "./input-otp.js";
import { nativeStyledOwners, specializeSvelteStyledNative } from "./native.js";
import { specializeSvelteStyledNativeForm } from "./native-form.js";
import { specializeSvelteStyledNavigation } from "./navigation.js";
import { specializeSvelteStyledNavigationMenu } from "./navigation-menu.js";
import { specializeSvelteStyledPopover } from "./popover.js";
import { specializeSvelteStyledProgress } from "./progress.js";
import { specializeSvelteStyledRadioGroup } from "./radio-group.js";
import { supportsSvelteScope } from "./scope.js";
import { specializeSvelteStyledScrollArea } from "./scroll-area.js";
import { specializeSvelteStyledSelect } from "./select.js";
import { specializeSvelteStyledSheet } from "./sheet.js";
import { specializeSvelteStyledSidebar } from "./sidebar.js";
import { specializeSvelteStyledSlider } from "./slider.js";
import { specializeSvelteStyledSpinner } from "./spinner.js";
import { specializeSvelteStyledSwitch } from "./switch.js";
import { specializeSvelteStyledTabs } from "./tabs.js";
import { specializeSvelteStyledThemeToggle } from "./theme-toggle.js";
import { specializeSvelteStyledToast } from "./toast.js";
import { specializeSvelteStyledToggle } from "./toggle.js";
import { specializeSvelteStyledTooltip } from "./tooltip.js";
import type {
  SvelteStyledComponentProjection,
  SvelteStyledGroupProjection,
  SvelteStyledRenderNode,
  SvelteStyledRenderOptions,
  SvelteStyledVariantAlias,
} from "./types.js";
import { specializeSvelteStyledVideo } from "./video.js";

export function projectSvelteStyledGroup(
  source: StyledOutputComponentGroup,
  options: SvelteStyledRenderOptions,
): SvelteStyledGroupProjection {
  const group = structuredClone(source);
  const seen = new Set<string>();
  for (const component of group.components) {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(component.exportName) || seen.has(component.exportName)) {
      throw new TypeError(
        `Svelte Styled ${group.component}: invalid or duplicate export "${component.exportName}".`,
      );
    }
    if (component.sourceFileName) {
      throw new TypeError(
        `Svelte Styled ${group.component}/${component.exportName}.svelte: unsupported custom source file name.`,
      );
    }
    seen.add(component.exportName);
  }
  for (const name of [
    ...group.publicExports,
    ...group.defaultExport.members.map((member) => member.localName),
  ]) {
    if (!seen.has(name))
      throw new TypeError(`Svelte Styled ${group.component}: missing export owner "${name}".`);
  }
  if (new Set(group.publicExports).size !== group.publicExports.length) {
    throw new TypeError(`Svelte Styled ${group.component}: duplicate public export.`);
  }
  if (
    group.styles &&
    ![
      "checkbox",
      "dialog",
      "input-otp",
      "prose",
      "scroll-area",
      "toast",
      "color-picker",
      "sidebar",
    ].includes(group.component)
  ) {
    throw new TypeError(
      `Svelte Styled ${group.component}: unsupported style, facade, or variant alias output.`,
    );
  }
  if (
    group.component === "prose" &&
    (!group.styles ||
      group.styles.importFrom.length !== 1 ||
      group.styles.importFrom[0] !== "Prose")
  ) {
    throw new TypeError("Svelte Styled prose: requires the contract stylesheet on Prose.");
  }
  if (group.styles) {
    const fileName = group.styles.sourceFileName ?? "styles.css";
    if (
      !/^[a-zA-Z0-9_-]+\.css$/.test(fileName) ||
      group.styles.importFrom.some((name) => !seen.has(name))
    )
      throw new TypeError(
        `Svelte Styled ${group.component}: invalid stylesheet owner or file name.`,
      );
  }
  const variantAliases = projectVariantAliases(group);
  const primitiveFacade = projectPrimitiveFacade(group, options);
  return {
    group,
    variantAliases,
    ...(primitiveFacade ? { primitiveFacade } : {}),
    components: group.components.map((component) =>
      projectSvelteStyledComponent(group, component, options),
    ),
  };
}

export function projectSvelteStyledComponent(
  group: StyledOutputComponentGroup,
  source: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): SvelteStyledComponentProjection {
  const component = structuredClone(source);
  const context = `${group.component}/${component.exportName}.svelte`;
  const fail = (detail: string): never => {
    throw new TypeError(`Svelte Styled ${context}: ${detail}.`);
  };
  const isSidebar = group.component === "sidebar";
  const isColorPicker = group.component === "color-picker";
  const isToast = group.component === "toast";
  const isCarousel = group.component === "carousel";
  const isToggle = ["toggle", "toggle-group"].includes(group.component);
  const isRadioGroup = group.component === "radio-group";
  const isCheckboxGroup = group.component === "checkbox-group";
  const isSwitch = group.component === "switch";
  const isInputGroup = group.component === "input-group";
  const isField = group.component === "field";
  const isTabs = group.component === "tabs";
  const isSlider = group.component === "slider";
  const isAccordion = group.component === "accordion";
  const isDropzone = group.component === "dropzone";
  const isInputOtp = group.component === "input-otp";
  const isForm = group.component === "form";
  const isInput = group.component === "input";
  const isCollapsible = group.component === "collapsible";
  const isScrollArea = group.component === "scroll-area";
  const isProgress = group.component === "progress";
  const isAvatar = group.component === "avatar";
  const isVideo = group.component === "video";
  const valuePolicy = nativeValuePolicy(group.component, component.exportName);
  const isNativeForm = Boolean(nativeValuePolicy(group.component));
  const isSpinner = group.component === "spinner";
  const isNavigation = ["button-group", "pagination"].includes(group.component);
  const isBreadcrumb = group.component === "breadcrumb";
  const isNative = Boolean(nativeStyledOwners[group.component]);
  const isTheme = group.component === "theme-toggle" && component.exportName === "ThemeToggle";
  const isHoverCard = group.component === "hover-card";
  const isTooltip = group.component === "tooltip";
  const isDropdown = group.component === "dropdown";
  const isContextMenu = group.component === "context-menu";
  const isNavigationMenu = group.component === "navigation-menu";
  const isCombobox = group.component === "combobox";
  const isPopover = group.component === "popover";
  const isSheet = group.component === "sheet";
  const isAlertDialog = group.component === "alert-dialog";
  const isDialog = group.component === "dialog";
  const isSelect = group.component === "select";
  const isCheckbox = group.component === "checkbox" && component.exportName === "Checkbox";
  if (
    !isSidebar &&
    !isColorPicker &&
    !isToast &&
    !isCarousel &&
    !isToggle &&
    !isRadioGroup &&
    !isCheckboxGroup &&
    !isSwitch &&
    !isField &&
    !isTabs &&
    !isSlider &&
    !isAccordion &&
    !isDropzone &&
    !isInputOtp &&
    !isForm &&
    !isInput &&
    !isCollapsible &&
    !isScrollArea &&
    !isProgress &&
    !isAvatar &&
    !isVideo &&
    !isNative &&
    !isTheme &&
    !isCheckbox &&
    !isSelect &&
    !isDialog &&
    !isAlertDialog &&
    !isSheet &&
    !isHoverCard &&
    !isTooltip &&
    !isDropdown &&
    !isContextMenu &&
    !isNavigationMenu &&
    !isCombobox &&
    !isPopover &&
    (group.component !== "button" || component.exportName !== "Button")
  )
    fail("missing component projection owner");
  const specialization: Pick<
    SvelteStyledComponentProjection,
    | "imports"
    | "publicTypes"
    | "destructure"
    | "rest"
    | "setup"
    | "initialization"
    | "semanticNativeTag"
    | "semanticNativeSlot"
    | "typeExports"
  > = isCombobox
    ? specializeSvelteStyledCombobox(group, component, options)
    : isNavigationMenu
      ? specializeSvelteStyledNavigationMenu(group, component, options)
      : isContextMenu
        ? specializeSvelteStyledContextMenu(group, component, options)
        : isDropdown
          ? specializeSvelteStyledDropdown(group, component, options)
          : isHoverCard
            ? specializeSvelteStyledHoverCard(group, component, options)
            : isTooltip
              ? specializeSvelteStyledTooltip(group, component, options)
              : isPopover
                ? specializeSvelteStyledPopover(group, component, options)
                : isSheet
                  ? specializeSvelteStyledSheet(group, component, options)
                  : isAlertDialog
                    ? specializeSvelteStyledAlertDialog(group, component, options)
                    : isTabs
                      ? specializeSvelteStyledTabs(group, component, options)
                      : isSlider
                        ? specializeSvelteStyledSlider(group, component, options)
                        : isAccordion
                          ? specializeSvelteStyledAccordion(group, component, options)
                          : isDropzone
                            ? specializeSvelteStyledDropzone(group, component, options)
                            : isInputOtp
                              ? specializeSvelteStyledInputOtp(group, component, options)
                              : isField
                                ? specializeSvelteStyledField(group, component, options)
                                : isToggle
                                  ? specializeSvelteStyledToggle(group, component, options)
                                  : isRadioGroup
                                    ? specializeSvelteStyledRadioGroup(group, component, options)
                                    : isCheckboxGroup
                                      ? specializeSvelteStyledCheckboxGroup(
                                          group,
                                          component,
                                          options,
                                        )
                                      : isSwitch
                                        ? specializeSvelteStyledSwitch(group, component, options)
                                        : isInputGroup
                                          ? specializeSvelteStyledInputGroup(group, component)
                                          : isForm
                                            ? specializeSvelteStyledForm(group, component, options)
                                            : isInput
                                              ? specializeSvelteStyledInput(
                                                  group,
                                                  component,
                                                  options,
                                                )
                                              : isCollapsible
                                                ? specializeSvelteStyledCollapsible(
                                                    group,
                                                    component,
                                                    options,
                                                  )
                                                : isScrollArea
                                                  ? specializeSvelteStyledScrollArea(
                                                      group,
                                                      component,
                                                      options,
                                                    )
                                                  : isProgress
                                                    ? specializeSvelteStyledProgress(
                                                        group,
                                                        component,
                                                        options,
                                                      )
                                                    : isAvatar
                                                      ? specializeSvelteStyledAvatar(
                                                          group,
                                                          component,
                                                          options,
                                                        )
                                                      : isVideo
                                                        ? specializeSvelteStyledVideo(
                                                            group,
                                                            component,
                                                          )
                                                        : isNativeForm
                                                          ? specializeSvelteStyledNativeForm(
                                                              group,
                                                              component,
                                                            )
                                                          : isSpinner
                                                            ? specializeSvelteStyledSpinner(
                                                                group,
                                                                component,
                                                              )
                                                            : isNavigation
                                                              ? specializeSvelteStyledNavigation(
                                                                  group,
                                                                  component,
                                                                )
                                                              : isBreadcrumb
                                                                ? specializeSvelteStyledBreadcrumb(
                                                                    group,
                                                                    component,
                                                                  )
                                                                : isNative
                                                                  ? specializeSvelteStyledNative(
                                                                      group,
                                                                      component,
                                                                    )
                                                                  : isDialog
                                                                    ? specializeSvelteStyledDialog(
                                                                        group,
                                                                        component,
                                                                        options,
                                                                      )
                                                                    : isSelect
                                                                      ? specializeSvelteStyledSelect(
                                                                          group,
                                                                          component,
                                                                          options,
                                                                        )
                                                                      : isTheme
                                                                        ? specializeSvelteStyledThemeToggle(
                                                                            group,
                                                                            component,
                                                                            options,
                                                                          )
                                                                        : isCheckbox
                                                                          ? specializeSvelteStyledCheckbox(
                                                                              group,
                                                                              component,
                                                                              options,
                                                                            )
                                                                          : isCarousel
                                                                            ? specializeSvelteStyledCarousel(
                                                                                group,
                                                                                component,
                                                                                options,
                                                                              )
                                                                            : isToast
                                                                              ? specializeSvelteStyledToast(
                                                                                  group,
                                                                                  component,
                                                                                  options,
                                                                                )
                                                                              : isSidebar
                                                                                ? specializeSvelteStyledSidebar(
                                                                                    group,
                                                                                    component,
                                                                                    options,
                                                                                  )
                                                                                : isColorPicker
                                                                                  ? specializeSvelteStyledColorPicker(
                                                                                      group,
                                                                                      component,
                                                                                      options,
                                                                                    )
                                                                                  : specializeSvelteStyledButton(
                                                                                      group,
                                                                                      component,
                                                                                      options,
                                                                                    );
  if (component.client) fail("unsupported client behavior");
  if (component.imports.some((entry) => supportsSvelteScope(entry.targetScopes)))
    fail("unsupported custom import");
  if (component.forwardRef && supportsSvelteScope(component.forwardRef.targetScopes))
    fail("unsupported forward-ref intent");
  const imports = [...specialization.imports];
  const variants = new Set([
    ...group.variants.map((variant) => variant.name),
    ...projectVariantAliases(group).map((alias) => alias.name),
  ]);
  for (const inherited of component.props?.extends ?? []) {
    if (
      supportsSvelteScope(inherited.targetScopes) &&
      inherited.kind === "variant-props" &&
      !variants.has(inherited.variant)
    ) {
      fail(`unknown variant "${inherited.variant}" in prop inheritance`);
    }
  }

  function validateValue(value: StyledOutputValueExpression): void {
    switch (value.type) {
      case "literal":
      case "raw":
      case "variable":
        return;
      case "class-variant":
        if (!variants.has(value.variant)) fail(`unknown variant "${value.variant}"`);
        return;
      case "class-join":
        value.items.forEach(validateValue);
        return;
      case "object":
        Object.values(value.entries).forEach(validateValue);
        return;
      case "template":
        value.parts.forEach((part) => {
          if (typeof part !== "string") validateValue(part);
        });
        return;
      default:
        fail(`unsupported value expression "${(value as { type: string }).type}"`);
    }
  }
  function project(node: StyledOutputRenderNode): SvelteStyledRenderNode {
    switch (node.type) {
      case "condition":
        return { ...node, then: node.then.map(project), else: node.else.map(project) };
      case "fragment":
        return { ...node, children: node.children.map(project) };
      case "slot":
        if (
          node.name &&
          !(isScrollArea && component.exportName === "ScrollArea" && node.name === "scrollbar") &&
          !(isTheme && ["light-icon", "dark-icon"].includes(node.name)) &&
          !(isRadioGroup && node.name === "icon") &&
          !(isInputOtp && node.name === "icon") &&
          !(isAccordion && node.name === "icon") &&
          !(isSidebar && component.exportName === "SidebarTrigger" && node.name === "icon") &&
          !(isNavigationMenu && node.name === "icon") &&
          !(isToast && component.exportName === "ToastTitle" && node.name === "icon") &&
          !((isSelect || isCombobox) && ["icon", "indicator"].includes(node.name)) &&
          !((isDropdown || isContextMenu) && ["icon", "indicator"].includes(node.name)) &&
          !(isNativeForm && component.exportName === "NativeSelect" && node.name === "icon") &&
          !((isDialog || isSheet) && ["icon", "backdrop"].includes(node.name)) &&
          !(isAlertDialog && node.name === "backdrop") &&
          !(isTooltip && component.exportName === "TooltipContent" && node.name === "icon") &&
          !(
            isNavigation &&
            ["PaginationPrevious", "PaginationNext", "PaginationEllipsis"].includes(
              component.exportName,
            ) &&
            node.name === "icon"
          ) &&
          !(isBreadcrumb && component.exportName === "BreadcrumbEllipsis" && node.name === "icon")
        )
          fail(`unsupported named slot "${node.name}"`);
        return {
          type: "snippet",
          name:
            node.name === "light-icon"
              ? "lightIcon"
              : node.name === "dark-icon"
                ? "darkIcon"
                : isNavigationMenu && component.exportName === "NavigationMenu" && !node.name
                  ? "consumerChildren"
                  : (node.name ?? "children"),
          fallback: node.fallback.map(project),
          ...(isNavigationMenu && component.exportName === "NavigationMenu" && !node.name
            ? { args: ["acceptedValue"] }
            : {}),
        };
      case "text":
        return isSidebar && node.value === "{tooltip}"
          ? { type: "expression", value: "tooltip" }
          : isColorPicker && ["{label}", "{formatOption.toUpperCase()}"].includes(node.value)
            ? { type: "expression", value: node.value.slice(1, -1) }
            : isRadioGroup && node.value === "{legend}"
              ? { type: "expression", value: "legend" }
              : (isCheckbox || isSwitch) && node.value === "{label}"
                ? { type: "expression", value: "label" }
                : node;
      case "primitive":
      case "component":
      case "element": {
        const stockComboboxChild =
          isCombobox &&
          node.type === "primitive" &&
          ["Trigger", "Clear"].includes(node.part) &&
          node.attrs.some(
            (attr) =>
              attr.name === "asChild" &&
              attr.value?.type === "literal" &&
              attr.value.value === true,
          );
        const attrs = node.attrs.filter(
          (attr) =>
            supportsSvelteScope(attr.targetScopes) &&
            !(stockComboboxChild && attr.name === "asChild"),
        );
        for (const attr of attrs) {
          if (attr.value) validateValue(attr.value);
          if (/^(?:on:|bind:|@|v-)/.test(attr.name)) fail(`unsupported attribute "${attr.name}"`);
        }
        let name: string;
        if (node.type === "element") {
          if (node.tagBinding && !(isNative && node.tag === specialization.semanticNativeTag))
            fail(`unsupported dynamic element "${node.tag}"`);
          if (node.comments.some((comment) => supportsSvelteScope(comment.targetScopes)))
            fail("unsupported element comments");
          name = node.tagBinding ? "svelte:element" : node.tag;
          if (node.tagBinding)
            attrs.unshift({ name: "this", value: { type: "variable", name: node.tag } });
        } else if (node.type === "primitive") {
          const inventory = getPrimitiveInventoryEntry(node.component);
          if (
            !SVELTE_PRIMITIVE_COMPONENTS.includes(node.component as never) ||
            inventory?.kind !== "runtime-adapter-contract"
          ) {
            fail(`unsupported Primitive dependency "${node.component}"`);
          }
          if (
            inventory?.kind !== "runtime-adapter-contract" ||
            !inventory.contract.parts.some(
              (part) =>
                part.name
                  .split("-")
                  .map((word) => word[0]!.toUpperCase() + word.slice(1))
                  .join("") === node.part,
            )
          ) {
            fail(`unsupported Primitive part "${node.component}.${node.part}"`);
          }
          name = `${node.component
            .split("-")
            .map((word) => word[0]!.toUpperCase() + word.slice(1))
            .join("")}${node.part}`;
          if (node.component === "sidebar" && node.part === "Sidebar") name = "SidebarComponent";
          const from = sveltePrimitiveImport(node.component, options);
          if (!imports.some((entry) => entry.source === from && entry.names.includes(name))) {
            imports.push({ source: from, names: [name] });
          }
        } else {
          name = node.localName ?? node.exportName;
          const source =
            node.component === group.component
              ? `./${node.exportName}.svelte`
              : `../${node.component}/index.js`;
          const importedName =
            node.component === group.component
              ? `default as ${name}`
              : node.localName
                ? `${node.exportName} as ${node.localName}`
                : name;
          if (
            !imports.some((entry) => entry.source === source && entry.names.includes(importedName))
          )
            imports.push({ source, names: [importedName] });
        }
        const projected: SvelteStyledRenderNode = {
          type: node.type === "element" ? "element" : "component",
          name,
          attrs,
          children: node.children.map(project),
          selfClosing: node.selfClosing,
          ...(isSidebar &&
          component.exportName === "SidebarProvider" &&
          node.type === "primitive" &&
          node.part === "Provider"
            ? {
                bindings: [
                  { name: "open", expression: "open" },
                  { name: "mobileOpen", expression: "mobileOpen" },
                ],
              }
            : {}),
          ...(isSidebar &&
          component.exportName === "Sidebar" &&
          node.type === "component" &&
          node.exportName === "Sheet"
            ? {
                bindings: sidebarSheetBindings(),
              }
            : {}),
          ...(isSidebar &&
          component.exportName === "SidebarInput" &&
          node.type === "component" &&
          node.exportName === "Input"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isColorPicker &&
          component.exportName === "ColorPicker" &&
          node.type === "primitive" &&
          node.part === "Root"
            ? {
                bindings: [
                  { name: "value", expression: "value" },
                  { name: "format", expression: "format" },
                ],
              }
            : {}),
          ...(isColorPicker &&
          component.exportName === "ColorPicker" &&
          node.type === "component" &&
          node.exportName === "Popover"
            ? { bindings: [{ name: "open", expression: "open" }] }
            : {}),
          ...(isColorPicker &&
          component.exportName === "ColorPickerInput" &&
          node.type === "element" &&
          node.attrs.some(
            (attr) =>
              attr.name === "data-slot" &&
              attr.value?.type === "literal" &&
              attr.value.value === "color-picker-input",
          )
            ? { attachment: "attachRef" }
            : {}),
          ...((isDropdown || isContextMenu) &&
          node.type === "primitive" &&
          ["Root", "CheckboxItem", "RadioGroup"].includes(node.part)
            ? {
                bindings: [
                  {
                    name:
                      node.part === "Root"
                        ? "open"
                        : node.part === "CheckboxItem"
                          ? "checked"
                          : "value",
                    expression:
                      node.part === "Root"
                        ? "open"
                        : node.part === "CheckboxItem"
                          ? "checked"
                          : "value",
                  },
                ],
              }
            : {}),
          ...(isToggle && node.type === "primitive" && node.part === "Root"
            ? {
                bindings: [
                  {
                    name: node.component === "toggle-group" ? "value" : "pressed",
                    expression: node.component === "toggle-group" ? "value" : "pressed",
                  },
                ],
              }
            : {}),
          ...(isRadioGroup && node.type === "primitive" && node.part === "Root"
            ? {
                bindings: [
                  {
                    name: node.component === "radio-group" ? "value" : "checked",
                    expression: node.component === "radio-group" ? "value" : "checked",
                  },
                ],
              }
            : {}),
          ...(isCheckboxGroup && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isCombobox && node.type === "primitive" && node.part === "Root"
            ? {
                bindings: ["inputValue", "open", "value"].map((name) => ({
                  name,
                  expression: name,
                })),
              }
            : {}),
          ...(isCombobox &&
          component.exportName === "ComboboxInputGroup" &&
          node.type === "component" &&
          node.exportName === "InputGroup"
            ? { bindings: [{ name: "ref", expression: "ref" }] }
            : {}),
          ...(isNavigationMenu && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isTabs && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isSlider && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isAccordion && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isInputOtp && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isSwitch && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "checked", expression: "checked" }] }
            : {}),
          ...(isInputGroup &&
          node.type === "component" &&
          ["Input", "Textarea"].includes(node.exportName)
            ? {
                bindings: [
                  { name: "value", expression: "value" },
                  ...(component.exportName === "InputGroupTextarea"
                    ? [{ name: "ref", expression: "ref" }]
                    : []),
                ],
              }
            : {}),
          ...((isInput || (isField && component.exportName === "FieldControl")) &&
          node.type === "primitive"
            ? { bindings: [{ name: "value", expression: "value" }] }
            : {}),
          ...(isCollapsible &&
          component.exportName === "Collapsible" &&
          node.type === "primitive" &&
          node.part === "Root"
            ? { bindings: [{ name: "open", expression: "open" }] }
            : {}),
          ...(valuePolicy && node.type === "element" && node.tag === valuePolicy.tag
            ? { bindings: [{ name: valuePolicy.name, expression: valuePolicy.name }] }
            : {}),
          ...((isDialog || isAlertDialog || isSheet || isPopover || isTooltip || isHoverCard) &&
          ["Dialog", "AlertDialog", "Sheet", "Popover", "Tooltip", "HoverCard"].includes(
            component.exportName,
          ) &&
          node.type === "primitive" &&
          node.part === "Root"
            ? { bindings: [{ name: "open", expression: "open" }] }
            : {}),
          ...(isSelect &&
          component.exportName === "Select" &&
          node.type === "primitive" &&
          node.part === "Root"
            ? {
                bindings: [
                  { name: "open", expression: "open" },
                  { name: "value", expression: "value" },
                ],
              }
            : {}),
          ...(isCheckbox && node.type === "primitive" && node.part === "Root"
            ? { bindings: [{ name: "checked", expression: "checked" }] }
            : {}),
          ...(group.component === "button" && node.type === "element" && node.tag === "a"
            ? { attachment: "attachAnchor" }
            : {}),
          ...(isField &&
          node.type === "element" &&
          node.tag === specialization.semanticNativeTag &&
          (!specialization.semanticNativeSlot ||
            node.attrs.some(
              (attr) =>
                attr.name === "data-slot" &&
                attr.value?.type === "literal" &&
                attr.value.value === specialization.semanticNativeSlot,
            ))
            ? { attachment: "attachNative" }
            : {}),
          ...((isDialog || isAlertDialog || isSheet || isPopover) &&
          [
            "DialogHeader",
            "DialogFooter",
            "AlertDialogHeader",
            "AlertDialogFooter",
            "SheetHeader",
            "SheetFooter",
            "PopoverHeader",
          ].includes(component.exportName) &&
          node.type === "element"
            ? { attachment: "attachNative" }
            : {}),
          ...(isTheme && node.type === "element" && node.tag === "button"
            ? { attachment: "attachTheme" }
            : {}),
        };
        const bindNativeRef =
          (isSidebar &&
            node.type === "element" &&
            ((specialization.semanticNativeTag && node === component.render[0]) ||
              (component.exportName === "Sidebar" &&
                node.attrs.some((attr) => attr.name === "spread")))) ||
          (isNative &&
            node.type === "element" &&
            node.tag === specialization.semanticNativeTag &&
            (!specialization.semanticNativeSlot ||
              node.attrs.some(
                (attr) =>
                  attr.name === "data-slot" &&
                  attr.value?.type === "literal" &&
                  attr.value.value === specialization.semanticNativeSlot,
              ))) ||
          (isVideo && node.type === "element" && ["video", "iframe"].includes(node.tag));
        if (bindNativeRef) {
          projected.bindings = [...(projected.bindings ?? []), { name: "this", expression: "ref" }];
        }
        if (stockComboboxChild) {
          const child = projected.children[0];
          if (
            projected.children.length !== 1 ||
            child?.type !== "component" ||
            child.name !== "InputGroupButton"
          )
            return fail("Combobox button child requires its stock InputGroupButton");
          const classes = child.attrs.find((attr) => attr.name === "class");
          child.attrs = child.attrs.filter((attr) => attr.name !== "class");
          child.attrs.push(
            { name: "spread", value: { type: "variable", name: "buttonProps" } },
            {
              name: "class",
              value: {
                type: "class-join",
                items: [
                  ...(classes?.value ? [classes.value] : []),
                  { type: "variable", name: "buttonProps.class" },
                ],
              },
            },
          );
          projected.children = [
            {
              type: "snippet-definition",
              name: "child",
              parameters: ["{ props: buttonProps }"],
              children: [child],
            },
          ];
        }
        if (isNavigationMenu && node.type === "primitive" && node.part === "Root") {
          projected.children = [
            {
              type: "snippet-definition",
              name: "children",
              parameters: ["acceptedValue"],
              children: projected.children,
            },
          ];
        }
        // Svelte 5.29 requires an array for a multiple binding. An omitted value
        // keeps the select unbound so the browser owns selected options and reset.
        if (isNativeForm && node.type === "element" && node.tag === "select") {
          return {
            type: "condition",
            condition: nativeSelectUsesBrowserValue("nativeProps.multiple", valuePolicy!.name),
            then: [
              {
                ...projected,
                name: "svelte:element",
                attrs: [{ name: "this", value: { type: "literal", value: "select" } }, ...attrs],
                bindings: projected.bindings?.filter((binding) => binding.name === "this") ?? [],
              },
            ],
            else: [projected],
          };
        }
        // Svelte validates template children even when an optional snippet is absent.
        // Void native tags therefore need a branch with no child render function.
        return isNative && node.type === "element" && node.tagBinding
          ? {
              type: "condition",
              condition: "nativeIsVoid",
              then: [{ ...projected, children: [], selfClosing: true }],
              else: [projected],
            }
          : projected;
      }
      case "icon": {
        if (
          !isSidebar &&
          !isColorPicker &&
          !isToast &&
          !isCarousel &&
          !isTheme &&
          !isToggle &&
          !isRadioGroup &&
          !isTabs &&
          !isSlider &&
          !isAccordion &&
          !isDropzone &&
          !isInputOtp &&
          !isCheckbox &&
          !isSelect &&
          !isDialog &&
          !isSheet &&
          !isTooltip &&
          !isBreadcrumb &&
          !isNavigation &&
          !isSpinner &&
          !isNativeForm &&
          !isDropdown &&
          !isContextMenu &&
          !isNavigationMenu &&
          !isCombobox
        )
          return fail(`unsupported structured node "${node.type}"`);
        if (!node.asset) return fail(`missing projected SVG asset "${node.importName}"`);
        const attrs = node.attrs.filter((attr) => supportsSvelteScope(attr.targetScopes));
        attrs.forEach((attr) => {
          if (attr.value) validateValue(attr.value);
        });
        const literal = (attr: { name: string; value: string }) => ({
          name: attr.name,
          value: { type: "literal" as const, value: attr.value },
        });
        return {
          type: "element",
          name: "svg",
          selfClosing: false,
          ...(isSpinner ? { bindings: [{ name: "this", expression: "ref" }] } : {}),
          attrs: [
            ...node.asset.attributes.map(literal),
            ...attrs.filter((attr) => !node.asset!.omittedAttributes?.includes(attr.name)),
          ],
          children: node.asset.children.map((child) => ({
            type: "element",
            name: child.tag,
            selfClosing: true,
            attrs: child.attributes.map(literal),
            children: [],
          })),
        };
      }
      case "repeat":
        if (
          isColorPicker &&
          node.index &&
          ["normalizedFormats", "normalizedSwatches"].includes(node.each)
        )
          return {
            type: "each",
            each: node.each,
            item: node.item,
            index: node.index,
            key: node.index,
            children: node.children.map(project),
          };
        if (isSlider && component.exportName === "Slider") {
          const [thumb] = node.children;
          if (
            node.each !== "values" ||
            node.item !== "_" ||
            node.index !== "index" ||
            node.children.length !== 1 ||
            thumb?.type !== "primitive" ||
            thumb.component !== "slider" ||
            thumb.part !== "Thumb" ||
            !thumb.selfClosing ||
            thumb.children.length ||
            !thumb.attrs.some(
              (attr) =>
                attr.name === "index" &&
                attr.value?.type === "variable" &&
                attr.value.name === "index",
            )
          )
            return fail("unsupported Slider repeat shape");
          return {
            type: "each",
            each: node.each,
            item: node.item,
            index: node.index,
            key: node.index,
            children: node.children.map(project),
          };
        }
        return fail(`unsupported structured node "${node.type}"`);
      default:
        return fail(`unsupported structured node "${(node as { type: string }).type}"`);
    }
  }
  const variables = component.variables.filter((variable) =>
    supportsSvelteScope(variable.targetScopes),
  );
  variables.forEach((variable) => validateValue(variable.value));
  const render = component.render.map(project);
  return {
    ...specialization,
    imports,
    exportName: component.exportName,
    fileName: `${component.exportName}.svelte`,
    variables,
    render,
  };
}

/** Only sibling recipes from declared Styled dependencies can own an alias. */
function projectVariantAliases(group: StyledOutputComponentGroup): SvelteStyledVariantAlias[] {
  const names = new Set(group.variants.map((variant) => variant.name));
  const locals = new Set([
    "tv",
    ...names,
    ...(group.variantAliases ?? []).map((alias) => alias.name),
  ]);
  return (group.variantAliases ?? []).map((alias) => {
    const dependency = /^\.\.\/([a-z][a-z0-9-]*)\/variants$/.exec(alias.source)?.[1];
    const localName = alias.localName ?? alias.importName;
    if (
      !dependency ||
      !group.dependencies?.styledComponents.includes(dependency) ||
      ![alias.name, alias.importName, localName].every((name) =>
        /^[a-z][A-Za-z0-9]*$/.test(name),
      ) ||
      names.has(alias.name) ||
      locals.has(localName)
    ) {
      throw new TypeError(
        `Svelte Styled ${group.component}: unsupported variant alias "${alias.name}".`,
      );
    }
    names.add(alias.name);
    locals.add(localName);
    return { ...alias, localName, source: `${alias.source}.js` };
  });
}

/** Toast re-exports the service already declared by its private Primitive inventory. */
function projectPrimitiveFacade(
  group: StyledOutputComponentGroup,
  options: SvelteStyledRenderOptions,
): SvelteStyledGroupProjection["primitiveFacade"] {
  const facade = group.primitiveFacadeExports;
  if (!facade) return;
  const inventory = getPrimitiveInventoryEntry(facade.component);
  const validNames = (names: string[], allowed: readonly string[] | undefined) =>
    allowed !== undefined &&
    new Set(names).size === names.length &&
    names.length === allowed.length &&
    names.every((name) => allowed.includes(name));
  if (
    group.component !== "toast" ||
    facade.component !== group.component ||
    inventory?.kind !== "runtime-adapter-contract" ||
    !validNames(facade.types, inventory.runtimeFacades?.types) ||
    !validNames(facade.values, inventory.runtimeFacades?.values)
  ) {
    throw new TypeError(`Svelte Styled ${group.component}: unsupported Primitive facade output.`);
  }
  return {
    source: sveltePrimitiveImport(facade.component, options),
    types: [...facade.types],
    values: [...facade.values],
  };
}
