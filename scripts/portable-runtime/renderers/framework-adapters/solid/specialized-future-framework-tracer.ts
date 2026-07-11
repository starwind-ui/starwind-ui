import type { GenericAdapterPlanPart } from "../../generic-adapter-plan/index.js";
import {
  type ComboboxSpecializedAdapterSpec,
  validateComboboxSpecializedAdapterSpec,
} from "../../specialized-adapter-spec/combobox-specialized-adapter-spec.js";
import {
  type MenuSpecializedAdapterSpec,
  validateMenuSpecializedAdapterSpec,
} from "../../specialized-adapter-spec/menu-specialized-adapter-spec.js";
import {
  type NavigationMenuSpecializedAdapterSpec,
  validateNavigationMenuSpecializedAdapterSpec,
} from "../../specialized-adapter-spec/navigation-menu-specialized-adapter-spec.js";
import {
  assertSelectSpecializedAdapterSpec,
  createSelectAttributeMap,
  getSelectFileExportName,
  getSelectFixturePartExports,
  type SelectSpecializedAdapterSpec,
} from "../../specialized-adapter-spec/select-specialized-adapter-spec.js";
import type {
  SpecializedAdapterSpec,
  SpecializedAdapterSpecPrintedFile,
} from "../../specialized-adapter-spec/types.js";
import { solidFrameworkAdapterReadiness } from "./adapter.js";

const FIXTURE_COMMENT =
  "Non-shipping specialized adapter fixture. Do not publish, export, register, or copy into demo dependencies.";
const COMBOBOX_FIXTURE_COMMENT =
  "Non-shipping Combobox specialized adapter fixture. Do not publish, export, register, or copy into demo dependencies.";
const COMBOBOX_FIXTURE_PARTS = [
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
] as const;
const MENU_FIXTURE_COMMENT =
  "Non-shipping Menu specialized adapter fixture. Do not publish, export, register, or copy into demo dependencies.";
const MENU_FIXTURE_PARTS = [
  "root",
  "trigger",
  "portal",
  "positioner",
  "popup",
  "item",
  "linkItem",
  "checkboxItem",
  "checkboxItemIndicator",
  "radioGroup",
  "radioItem",
  "radioItemIndicator",
  "group",
  "label",
  "separator",
  "shortcut",
  "submenuRoot",
  "submenuTrigger",
] as const;
const NAVIGATION_MENU_FIXTURE_COMMENT =
  "Non-shipping Navigation Menu specialized adapter fixture. Do not publish, export, register, or copy into demo dependencies.";
const NAVIGATION_MENU_FIXTURE_PARTS = [
  "root",
  "list",
  "item",
  "trigger",
  "icon",
  "content",
  "link",
  "portal",
  "positioner",
  "popup",
  "viewport",
  "arrow",
] as const;

export function printSpecializedFutureFrameworkTracerSpec(
  spec: SpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  if (isComboboxSpecializedAdapterSpec(spec)) {
    return printSolidComboboxSpecializedAdapterSpecFixture(spec);
  }
  if (isMenuSpecializedAdapterSpec(spec)) {
    return printSolidMenuSpecializedAdapterSpecFixture(spec);
  }
  if (isNavigationMenuSpecializedAdapterSpec(spec)) {
    return printSolidNavigationMenuSpecializedAdapterSpecFixture(spec);
  }

  assertScrollAreaFixtureScope(spec, "Solid");

  const adapter = solidFrameworkAdapterReadiness;
  const extension = adapter.fileExtension;

  return [
    {
      contents: renderSolidScrollAreaRoot(spec, getPart(spec, "root")),
      path: `__future-fixtures/solid/${spec.component}/${getFileExportName(spec, "root")}${extension}`,
    },
    {
      contents: renderSolidScrollAreaViewport(getPart(spec, "viewport")),
      path: `__future-fixtures/solid/${spec.component}/${getFileExportName(spec, "viewport")}${extension}`,
    },
    {
      contents: renderSolidScrollAreaSimplePart(getPart(spec, "content")),
      path: `__future-fixtures/solid/${spec.component}/${getFileExportName(spec, "content")}${extension}`,
    },
    {
      contents: renderSolidScrollAreaScrollbar(spec, getPart(spec, "scrollbar")),
      path: `__future-fixtures/solid/${spec.component}/${getFileExportName(spec, "scrollbar")}${extension}`,
    },
    {
      contents: renderSolidScrollAreaSimplePart(getPart(spec, "thumb")),
      path: `__future-fixtures/solid/${spec.component}/${getFileExportName(spec, "thumb")}${extension}`,
    },
    {
      contents: renderSolidScrollAreaCorner(getPart(spec, "corner")),
      path: `__future-fixtures/solid/${spec.component}/${getFileExportName(spec, "corner")}${extension}`,
    },
    {
      contents: renderSolidIndex(spec),
      path: `__future-fixtures/solid/${spec.component}/index.ts`,
    },
  ];
}

function printSolidComboboxSpecializedAdapterSpecFixture(
  spec: ComboboxSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertComboboxFixtureTarget(spec, "Solid");
  const extension = solidFrameworkAdapterReadiness.fileExtension;

  return [
    ...COMBOBOX_FIXTURE_PARTS.map((part) => ({
      contents: renderSolidComboboxPart(spec, part),
      path: `__future-fixtures/solid/combobox/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderSolidComboboxIndex(spec),
      path: "__future-fixtures/solid/combobox/index.ts",
    },
  ];
}

function printSolidMenuSpecializedAdapterSpecFixture(
  spec: MenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertMenuFixtureTarget(spec, "Solid");
  const extension = solidFrameworkAdapterReadiness.fileExtension;

  return [
    ...MENU_FIXTURE_PARTS.map((part) => ({
      contents: renderSolidMenuPart(spec, part),
      path: `__future-fixtures/solid/menu/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderSolidMenuIndex(spec),
      path: "__future-fixtures/solid/menu/index.ts",
    },
  ];
}

function printSolidNavigationMenuSpecializedAdapterSpecFixture(
  spec: NavigationMenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertNavigationMenuFixtureTarget(spec, "Solid");
  const extension = solidFrameworkAdapterReadiness.fileExtension;

  return [
    ...NAVIGATION_MENU_FIXTURE_PARTS.map((part) => ({
      contents: renderSolidNavigationMenuPart(spec, part),
      path: `__future-fixtures/solid/navigation-menu/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderSolidNavigationMenuIndex(spec),
      path: "__future-fixtures/solid/navigation-menu/index.ts",
    },
  ];
}

function renderSolidComboboxPart(
  spec: ComboboxSpecializedAdapterSpec,
  part: (typeof COMBOBOX_FIXTURE_PARTS)[number],
): string {
  switch (part) {
    case "root":
      return renderSolidComboboxRoot(spec);
    case "input":
      return renderSolidComboboxInput(spec);
    case "trigger":
      return renderSolidComboboxTrigger(spec);
    case "clear":
      return renderSolidComboboxClear(spec);
    case "portal":
      return renderSolidComboboxPortal(spec);
    case "positioner":
      return renderSolidComboboxPositioner(spec);
    case "popup":
      return renderSolidComboboxPopup(spec);
    case "item":
      return renderSolidComboboxItem(spec);
    case "itemText":
      return renderSolidComboboxItemText(spec);
    case "itemIndicator":
      return renderSolidComboboxItemIndicator(spec);
    case "label":
    case "inputGroup":
    case "icon":
    case "value":
    case "empty":
    case "list":
    case "group":
    case "groupLabel":
    case "separator":
      return renderSolidComboboxStaticPart(spec, part);
  }
}

function renderSolidComboboxRoot(spec: ComboboxSpecializedAdapterSpec): string {
  const root = getPart(spec, "root");
  const hiddenInput = getPart(spec, "hiddenInput");
  const inputValueEvent = getComboboxEvent(spec, "inputValueChange");
  const openEvent = getComboboxEvent(spec, "openChange");
  const valueEvent = getComboboxEvent(spec, "valueChange");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { ${spec.root.runtimeFactory}, type ${inputValueEvent.detailsType}, type ${openEvent.detailsType}, type ${valueEvent.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { createContext, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ComboboxRootContextValue = {\n  input: { current: HTMLInputElement | undefined };\n  inputValue: () => string;\n  open: () => boolean;\n  value: () => string | null;\n};\n\nexport type ComboboxItemContextValue = {\n  selected: () => boolean;\n  value: string;\n};\n\nconst fallbackComboboxRootContext: ComboboxRootContextValue = {\n  input: { current: undefined as HTMLInputElement | undefined },\n  inputValue: () => "",\n  open: () => false,\n  value: () => null,\n};\n\nexport const ComboboxRootContext = createContext<ComboboxRootContextValue>(fallbackComboboxRootContext);\nexport const ComboboxItemContext = createContext<ComboboxItemContextValue>({ selected: () => false, value: "" });\n\nexport function useComboboxRootContext() {\n  return useContext(ComboboxRootContext);\n}\n\nexport function useComboboxItemContext() {\n  return useContext(ComboboxItemContext);\n}\n\nexport type ComboboxRootProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  autoComplete?: string;\n  defaultInputValue?: string;\n  defaultOpen?: boolean;\n  defaultValue?: string | null;\n  disabled?: boolean;\n  filterMode?: "contains" | "startsWith";\n  form?: string;\n  highlightItemOnHover?: boolean;\n  inputValue?: string;\n  locale?: string;\n  name?: string;\n  onInputValueChange?: (inputValue: string, details: ${inputValueEvent.detailsType}) => void;\n  onOpenChange?: (open: boolean, details: ${openEvent.detailsType}) => void;\n  onValueChange?: (value: string | null, details: ${valueEvent.detailsType}) => void;\n  open?: boolean;\n  readOnly?: boolean;\n  required?: boolean;\n  value?: string | null;\n};\n\nexport function ComboboxRoot(allProps: ComboboxRootProps) {\n  const props = mergeProps({ defaultInputValue: "", defaultOpen: false, defaultValue: null, disabled: false, filterMode: "contains" as const, highlightItemOnHover: true, readOnly: false }, allProps);\n  const [local, rest] = splitProps(props, [\n    "autoComplete",\n    "children",\n    "defaultInputValue",\n    "defaultOpen",\n    "defaultValue",\n    "disabled",\n    "filterMode",\n    "form",\n    "highlightItemOnHover",\n    "inputValue",\n    "locale",\n    "name",\n    "onInputValueChange",\n    "onOpenChange",\n    "onValueChange",\n    "open",\n    "readOnly",\n    "required",\n    "value",\n  ]);\n  const [uncontrolledInputValue, setUncontrolledInputValue] = createSignal(local.defaultInputValue);\n  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(local.defaultOpen);\n  const [uncontrolledValue, setUncontrolledValue] = createSignal<string | null>(local.defaultValue);\n  const comboboxContext: ComboboxRootContextValue = {\n    input: { current: undefined as HTMLInputElement | undefined },\n    inputValue: createMemo(() => local.inputValue ?? uncontrolledInputValue()),\n    open: createMemo(() => local.open ?? uncontrolledOpen()),\n    value: createMemo(() => local.value ?? uncontrolledValue()),\n  };\n  let root!: HTMLDivElement;\n  let instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\n  onMount(() => {\n    instance = ${spec.root.runtimeFactory}(root, {\n      autoComplete: local.autoComplete,\n      defaultInputValue: uncontrolledInputValue(),\n      defaultOpen: uncontrolledOpen(),\n      defaultValue: uncontrolledValue(),\n      disabled: local.disabled,\n      filterMode: local.filterMode,\n      form: local.form,\n      highlightItemOnHover: local.highlightItemOnHover,\n      locale: local.locale,\n      name: local.name,\n      readOnly: local.readOnly,\n      required: local.required,\n      ...(local.inputValue !== undefined ? { inputValue: local.inputValue } : {}),\n      ...(local.open !== undefined ? { open: local.open } : {}),\n      ...(local.value !== undefined ? { value: local.value } : {}),\n      ${inputValueEvent.callbackProp}(inputValue, details) {\n        local.onInputValueChange?.(inputValue, details);\n        if (!details.isCanceled && local.inputValue === undefined) {\n          setUncontrolledInputValue(inputValue);\n        }\n      },\n      ${openEvent.callbackProp}(open, details) {\n        local.onOpenChange?.(open, details);\n        if (!details.isCanceled && local.open === undefined) {\n          setUncontrolledOpen(open);\n        }\n      },\n      ${valueEvent.callbackProp}(value, details) {\n        local.onValueChange?.(value, details);\n        if (!details.isCanceled && local.value === undefined) {\n          setUncontrolledValue(value);\n        }\n      },\n    });\n\n    onCleanup(() => {\n      instance?.destroy();\n      instance = undefined;\n    });\n  });\n\n  createEffect(() => {\n    const inputValue = local.inputValue;\n    if (inputValue === undefined || !instance || instance.getInputValue() === inputValue) return;\n\n    instance.setInputValue(inputValue, { emit: false, filter: false });\n  });\n\n  createEffect(() => {\n    const open = local.open;\n    if (open === undefined || !instance || instance.getOpen() === open) return;\n\n    instance.setOpen(open, { emit: false });\n  });\n\n  createEffect(() => {\n    const value = local.value;\n    if (value === undefined || !instance || instance.getValue() === value) return;\n\n    instance.setValue(value, { emit: false });\n  });\n\n  createEffect(() => {\n    instance?.setFormOptions?.({\n      autoComplete: local.autoComplete,\n      form: local.form,\n      name: local.name,\n      required: local.required,\n    });\n  });\n\n  return (\n    <ComboboxRootContext.Provider value={comboboxContext}>\n      <div\n        ref={root}\n        ${root.discoveryAttribute}\n        data-autocomplete={local.autoComplete}\n        data-default-input-value={local.inputValue === undefined ? local.defaultInputValue : undefined}\n        data-default-open={local.open === undefined && local.defaultOpen ? "true" : undefined}\n        data-default-value={local.value === undefined ? local.defaultValue ?? undefined : undefined}\n        data-disabled={local.disabled ? "" : undefined}\n        data-filter-mode={local.filterMode}\n        data-form={local.form}\n        data-highlight-item-on-hover={local.highlightItemOnHover ? "true" : "false"}\n        data-input-value={comboboxContext.inputValue()}\n        data-locale={local.locale}\n        data-name={local.name}\n        data-readonly={local.readOnly ? "" : undefined}\n        data-required={local.required ? "" : undefined}\n        data-state={comboboxContext.open() ? "open" : "closed"}\n        {...rest}\n      >\n        <input\n          ${hiddenInput.discoveryAttribute}\n          type="hidden"\n          form={local.form}\n          name={local.name}\n          value={comboboxContext.value() ?? ""}\n          aria-hidden="true"\n          tabIndex={-1}\n          readOnly\n        />\n        {local.children}\n      </div>\n    </ComboboxRootContext.Provider>\n  );\n}\n\nexport default ComboboxRoot;\n`;
}

function renderSolidComboboxInput(spec: ComboboxSpecializedAdapterSpec): string {
  const input = getPart(spec, "input");
  const rootFileExportName = getFileExportName(spec, "root");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { onCleanup, onMount, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useComboboxRootContext } from "./${rootFileExportName}";\n\nexport type ComboboxInputProps = JSX.InputHTMLAttributes<HTMLInputElement>;\n\nexport function ComboboxInput(allProps: ComboboxInputProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const combobox = useComboboxRootContext();\n  let input!: HTMLInputElement;\n\n  onMount(() => {\n    combobox.input.current = input;\n  });\n\n  onCleanup(() => {\n    if (combobox.input.current === input) {\n      combobox.input.current = undefined;\n    }\n  });\n\n  return (\n    <input\n      ref={input}\n      ${input.discoveryAttribute}\n      role="${getRequiredRole(input)}"\n      aria-autocomplete="list"\n      aria-expanded={combobox.open() ? "true" : "false"}\n      autocomplete="off"\n      value={combobox.inputValue()}\n      {...rest}\n    />\n  );\n}\n\nexport default ComboboxInput;\n`;
}

function renderSolidComboboxTrigger(spec: ComboboxSpecializedAdapterSpec): string {
  const trigger = getPart(spec, "trigger");
  const rootFileExportName = getFileExportName(spec, "root");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useComboboxRootContext } from "./${rootFileExportName}";\n\nexport type ComboboxTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;\n\nexport function ComboboxTrigger(allProps: ComboboxTriggerProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const combobox = useComboboxRootContext();\n\n  return (\n    <button\n      ${trigger.discoveryAttribute}\n      type="button"\n      aria-haspopup="listbox"\n      aria-expanded={combobox.open() ? "true" : "false"}\n      data-state={combobox.open() ? "open" : "closed"}\n      {...rest}\n    >\n      {local.children}\n    </button>\n  );\n}\n\nexport default ComboboxTrigger;\n`;
}

function renderSolidComboboxClear(spec: ComboboxSpecializedAdapterSpec): string {
  const clear = getPart(spec, "clear");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ComboboxClearProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;\n\nexport function ComboboxClear(allProps: ComboboxClearProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return (\n    <button ${clear.discoveryAttribute} type="${spec.combobox.clearAction.typeAttribute.value}" {...rest}>\n      {local.children}\n    </button>\n  );\n}\n\nexport default ComboboxClear;\n`;
}

function renderSolidComboboxPortal(spec: ComboboxSpecializedAdapterSpec): string {
  const portal = getPart(spec, "portal");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { Portal } from "solid-js/web";\n\nexport type ComboboxPortalProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function ComboboxPortal(allProps: ComboboxPortalProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return (\n    <Portal>\n      <div ${portal.discoveryAttribute} {...rest}>\n        {local.children}\n      </div>\n    </Portal>\n  );\n}\n\nexport default ComboboxPortal;\n`;
}

function renderSolidComboboxPositioner(spec: ComboboxSpecializedAdapterSpec): string {
  const positioner = getPart(spec, "positioner");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ComboboxPositionerProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  align?: "start" | "center" | "end";\n  alignOffset?: number;\n  avoidCollisions?: boolean;\n  side?: "top" | "right" | "bottom" | "left";\n  sideOffset?: number;\n};\n\nexport function ComboboxPositioner(allProps: ComboboxPositionerProps) {\n  const props = mergeProps({ align: "start" as const, alignOffset: 0, avoidCollisions: true, side: "bottom" as const, sideOffset: 4 }, allProps);\n  const [local, rest] = splitProps(props, ["align", "alignOffset", "avoidCollisions", "children", "side", "sideOffset"]);\n\n  return (\n    <div\n      ${positioner.discoveryAttribute}\n      data-side={local.side}\n      data-align={local.align}\n      data-side-offset={local.sideOffset}\n      data-align-offset={local.alignOffset}\n      data-avoid-collisions={local.avoidCollisions ? "true" : "false"}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default ComboboxPositioner;\n`;
}

function renderSolidComboboxPopup(spec: ComboboxSpecializedAdapterSpec): string {
  const popup = getPart(spec, "popup");
  const rootFileExportName = getFileExportName(spec, "root");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useComboboxRootContext } from "./${rootFileExportName}";\n\nexport type ComboboxPopupProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function ComboboxPopup(allProps: ComboboxPopupProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const combobox = useComboboxRootContext();\n\n  return (\n    <div\n      ${popup.discoveryAttribute}\n      role="${getRequiredRole(popup)}"\n      tabIndex={-1}\n      data-state={combobox.open() ? "open" : "closed"}\n      hidden={!combobox.open()}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default ComboboxPopup;\n`;
}

function renderSolidComboboxItem(spec: ComboboxSpecializedAdapterSpec): string {
  const item = getPart(spec, "item");
  const rootFileExportName = getFileExportName(spec, "root");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { createMemo, mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { ComboboxItemContext, useComboboxRootContext } from "./${rootFileExportName}";\n\nexport type ComboboxItemProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "role"> & {\n  disabled?: boolean;\n  value: string;\n};\n\nexport function ComboboxItem(allProps: ComboboxItemProps) {\n  const props = mergeProps({ disabled: false }, allProps);\n  const [local, rest] = splitProps(props, ["children", "disabled", "value"]);\n  const combobox = useComboboxRootContext();\n  const selected = createMemo(() => combobox.value() === local.value);\n  const comboboxItemContext = { selected, value: local.value };\n\n  return (\n    <ComboboxItemContext.Provider value={comboboxItemContext}>\n      <div\n        ${item.discoveryAttribute}\n        data-value={local.value}\n        role="${getRequiredRole(item)}"\n        aria-selected={selected() ? "true" : "false"}\n        aria-disabled={local.disabled ? "true" : undefined}\n        data-disabled={local.disabled ? "" : undefined}\n        data-selected={selected() ? "" : undefined}\n        tabIndex={-1}\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </ComboboxItemContext.Provider>\n  );\n}\n\nexport default ComboboxItem;\n`;
}

function renderSolidComboboxItemText(spec: ComboboxSpecializedAdapterSpec): string {
  const itemText = getPart(spec, "itemText");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ComboboxItemTextProps = JSX.HTMLAttributes<HTMLSpanElement>;\n\nexport function ComboboxItemText(allProps: ComboboxItemTextProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return <span ${itemText.discoveryAttribute} {...rest}>{local.children}</span>;\n}\n\nexport default ComboboxItemText;\n`;
}

function renderSolidComboboxItemIndicator(spec: ComboboxSpecializedAdapterSpec): string {
  const indicator = getPart(spec, "itemIndicator");
  const rootFileExportName = getFileExportName(spec, "root");

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useComboboxItemContext } from "./${rootFileExportName}";\n\nexport type ComboboxItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement>;\n\nexport function ComboboxItemIndicator(allProps: ComboboxItemIndicatorProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const item = useComboboxItemContext();\n  const selected = item.selected;\n\n  return (\n    <span\n      ${indicator.discoveryAttribute}\n      aria-hidden="true"\n      data-state={selected() ? "checked" : "unchecked"}\n      data-hidden={selected() ? undefined : ""}\n      hidden={!selected()}\n      {...rest}\n    >\n      {local.children}\n    </span>\n  );\n}\n\nexport default ComboboxItemIndicator;\n`;
}

function renderSolidComboboxStaticPart(
  spec: ComboboxSpecializedAdapterSpec,
  partName: Exclude<
    (typeof COMBOBOX_FIXTURE_PARTS)[number],
    | "clear"
    | "input"
    | "item"
    | "itemIndicator"
    | "itemText"
    | "popup"
    | "portal"
    | "positioner"
    | "root"
    | "trigger"
  >,
): string {
  const part = getPart(spec, partName);
  const tag = part.defaultElement;
  const role = part.role ? `\n      role="${part.role}"` : "";
  const hidden = partName === "empty" ? "\n      hidden" : "";
  const ariaHidden = partName === "icon" ? '\n      aria-hidden="true"' : "";
  const ariaOrientation = partName === "separator" ? '\n      aria-orientation="horizontal"' : "";
  const attributesType =
    tag === "span" ? "JSX.HTMLAttributes<HTMLSpanElement>" : "JSX.HTMLAttributes<HTMLDivElement>";
  const componentName = getFileExportName(spec, partName);

  return `/* ${COMBOBOX_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ${componentName}Props = ${attributesType};\n\nexport function ${componentName}(allProps: ${componentName}Props) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return (\n    <${tag}\n      ${part.discoveryAttribute}${role}${ariaHidden}${ariaOrientation}${hidden}\n      {...rest}\n    >\n      {local.children}\n    </${tag}>\n  );\n}\n\nexport default ${componentName};\n`;
}

function renderSolidComboboxIndex(spec: ComboboxSpecializedAdapterSpec): string {
  const rootFileExportName = getFileExportName(spec, "root");

  return `// ${COMBOBOX_FIXTURE_COMMENT}\n${getComboboxFixturePartExports(spec)
    .map(
      ({ alias, fileExportName }) => `export { default as ${alias} } from "./${fileExportName}";`,
    )
    .join(
      "\n",
    )}\nexport { ComboboxItemContext, ComboboxRootContext, useComboboxItemContext, useComboboxRootContext } from "./${rootFileExportName}";\n`;
}

function renderSolidNavigationMenuPart(
  spec: NavigationMenuSpecializedAdapterSpec,
  part: (typeof NAVIGATION_MENU_FIXTURE_PARTS)[number],
): string {
  switch (part) {
    case "root":
      return renderSolidNavigationMenuRoot(spec);
    case "list":
      return renderSolidNavigationMenuList(spec);
    case "item":
      return renderSolidNavigationMenuItem(spec);
    case "trigger":
      return renderSolidNavigationMenuTrigger(spec);
    case "icon":
      return renderSolidNavigationMenuIcon(spec);
    case "content":
      return renderSolidNavigationMenuContent(spec);
    case "link":
      return renderSolidNavigationMenuLink(spec);
    case "portal":
      return renderSolidNavigationMenuPortal(spec);
    case "positioner":
      return renderSolidNavigationMenuPositioner(spec);
    case "popup":
      return renderSolidNavigationMenuPopup(spec);
    case "viewport":
      return renderSolidNavigationMenuViewport(spec);
    case "arrow":
      return renderSolidNavigationMenuArrow(spec);
  }
}

function renderSolidMenuPart(
  spec: MenuSpecializedAdapterSpec,
  part: (typeof MENU_FIXTURE_PARTS)[number],
): string {
  switch (part) {
    case "root":
      return renderSolidMenuRoot(spec);
    case "trigger":
      return renderSolidMenuTrigger(spec);
    case "portal":
      return renderSolidMenuPortal(spec);
    case "positioner":
      return renderSolidMenuFloatingPart(spec, "positioner");
    case "popup":
      return renderSolidMenuFloatingPart(spec, "popup");
    case "item":
      return renderSolidMenuActionItem(spec);
    case "linkItem":
      return renderSolidMenuLinkItem(spec);
    case "checkboxItem":
      return renderSolidMenuCheckboxItem(spec);
    case "checkboxItemIndicator":
      return renderSolidMenuCheckboxItemIndicator(spec);
    case "radioGroup":
      return renderSolidMenuRadioGroup(spec);
    case "radioItem":
      return renderSolidMenuRadioItem(spec);
    case "radioItemIndicator":
      return renderSolidMenuRadioItemIndicator(spec);
    case "group":
    case "label":
    case "separator":
    case "shortcut":
      return renderSolidMenuStaticPart(spec, part);
    case "submenuRoot":
      return renderSolidMenuSubmenuRoot(spec);
    case "submenuTrigger":
      return renderSolidMenuSubmenuTrigger(spec);
  }
}

function renderSolidMenuRoot(spec: MenuSpecializedAdapterSpec): string {
  const root = getPart(spec, "root");
  const openEvent = spec.menu.events.openChange;
  const closeEvent = spec.menu.events.closeComplete;

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { ${spec.root.runtimeFactory}, type ${closeEvent.detailsType}, type ${openEvent.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { createContext, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type MenuRootContextValue = {\n  open: () => boolean;\n  root: HTMLDivElement | undefined;\n};\n\nexport type MenuBooleanItemContextValue = {\n  checked: () => boolean;\n};\n\nexport type MenuRadioGroupContextValue = {\n  value: () => string | undefined;\n};\n\nexport const MenuRootContext = createContext<MenuRootContextValue>({ open: () => false, root: undefined });\nexport const MenuCheckboxItemContext = createContext<MenuBooleanItemContextValue>({ checked: () => false });\nexport const MenuRadioGroupContext = createContext<MenuRadioGroupContextValue>({ value: () => undefined });\nexport const MenuRadioItemContext = createContext<MenuBooleanItemContextValue>({ checked: () => false });\nexport const MenuSubmenuRootContext = createContext<{ root: HTMLDivElement | undefined }>({ root: undefined });\n\nexport function useMenuRootContext() {\n  return useContext(MenuRootContext);\n}\n\nexport function useMenuCheckboxItemContext() {\n  return useContext(MenuCheckboxItemContext);\n}\n\nexport function useMenuRadioGroupContext() {\n  return useContext(MenuRadioGroupContext);\n}\n\nexport function useMenuRadioItemContext() {\n  return useContext(MenuRadioItemContext);\n}\n\nexport type MenuRootProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  ${spec.menu.openState.defaultProp}?: boolean;\n  disabled?: boolean;\n  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: boolean, details: ${openEvent.detailsType}) => void;\n  ${closeEvent.callbackProp}?: (details: ${closeEvent.detailsType}) => void;\n  ${spec.menu.openState.controlledProp}?: boolean;\n  openOnHover?: boolean;\n  closeDelay?: number;\n};\n\nexport function MenuRoot(allProps: MenuRootProps) {\n  const props = mergeProps({ ${spec.menu.openState.defaultProp}: false, disabled: false, openOnHover: false, closeDelay: 200 }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${spec.menu.openState.defaultProp}", "disabled", "${openEvent.callbackProp}", "${closeEvent.callbackProp}", "${spec.menu.openState.controlledProp}", "openOnHover", "closeDelay"]);\n  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(local.${spec.menu.openState.defaultProp});\n  let root!: HTMLDivElement;\n  let instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n  const menuRootContext = {\n    open: createMemo(() => local.${spec.menu.openState.controlledProp} ?? uncontrolledOpen()),\n    get root() {\n      return root;\n    },\n  };\n\n  onMount(() => {\n    instance = ${spec.root.runtimeFactory}(root, {\n      ${spec.menu.openState.defaultProp}: uncontrolledOpen(),\n      disabled: local.disabled,\n      openOnHover: local.openOnHover,\n      closeDelay: local.closeDelay,\n      ...(local.${spec.menu.openState.controlledProp} !== undefined ? { ${spec.menu.openState.controlledProp}: local.${spec.menu.openState.controlledProp} } : {}),\n      ${openEvent.callbackProp}(${openEvent.valueProperty}, details) {\n        local.${openEvent.callbackProp}?.(${openEvent.valueProperty}, details);\n        if (!details.isCanceled && local.${spec.menu.openState.controlledProp} === undefined) {\n          setUncontrolledOpen(${openEvent.valueProperty});\n        }\n      },\n      ${closeEvent.callbackProp}(details) {\n        local.${closeEvent.callbackProp}?.(details);\n      },\n    });\n\n    onCleanup(() => {\n      instance?.destroy();\n      instance = undefined;\n    });\n  });\n\n  createEffect(() => {\n    const open = local.${spec.menu.openState.controlledProp};\n    if (open === undefined || !instance || instance.${spec.menu.openState.getter}() === open) return;\n\n    instance.${spec.menu.openState.setter}(open, { emit: false });\n  });\n\n  return (\n    <MenuRootContext.Provider value={menuRootContext}>\n      <div\n        ref={root}\n        ${root.discoveryAttribute}\n        data-default-open={local.${spec.menu.openState.controlledProp} === undefined && local.${spec.menu.openState.defaultProp} ? "true" : undefined}\n        data-disabled={local.disabled ? "" : undefined}\n        data-open-on-hover={local.openOnHover ? "true" : undefined}\n        data-close-delay={local.closeDelay}\n        data-state={menuRootContext.open() ? "open" : "closed"}\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </MenuRootContext.Provider>\n  );\n}\n\nexport default MenuRoot;\n`;
}

function renderSolidMenuTrigger(spec: MenuSpecializedAdapterSpec): string {
  const trigger = getPart(spec, "trigger");
  const rootFile = getFileExportName(spec, "root");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useMenuRootContext } from "./${rootFile}";\n\nexport type MenuTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;\n\nexport function MenuTrigger(allProps: MenuTriggerProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const menu = useMenuRootContext();\n\n  return (\n    <button\n      ${trigger.discoveryAttribute}\n      type="button"\n      aria-haspopup="menu"\n      aria-expanded={menu.open() ? "true" : "false"}\n      data-state={menu.open() ? "open" : "closed"}\n      {...rest}\n    >\n      {local.children}\n    </button>\n  );\n}\n\nexport default MenuTrigger;\n`;
}

function renderSolidMenuPortal(spec: MenuSpecializedAdapterSpec): string {
  const portal = getPart(spec, "portal");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { Portal } from "solid-js/web";\n\nexport type MenuPortalProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function MenuPortal(allProps: MenuPortalProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return (\n    <Portal>\n      <div ${portal.discoveryAttribute} {...rest}>\n        {local.children}\n      </div>\n    </Portal>\n  );\n}\n\nexport default MenuPortal;\n`;
}

function renderSolidMenuFloatingPart(
  spec: MenuSpecializedAdapterSpec,
  partName: "popup" | "positioner",
): string {
  const part = getPart(spec, partName);
  const exportName = getFileExportName(spec, partName);
  const role = part.role ? `\n      role="${part.role}"` : "";
  const tabIndex = partName === "popup" ? "\n      tabIndex={-1}" : "";
  const hidden = partName === "popup" ? "\n      hidden" : "";

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ${exportName}Props = JSX.HTMLAttributes<HTMLDivElement> & {\n  side?: "top" | "right" | "bottom" | "left";\n  align?: "start" | "center" | "end";\n  sideOffset?: number;\n  avoidCollisions?: boolean;\n};\n\nexport function ${exportName}(allProps: ${exportName}Props) {\n  const props = mergeProps({ side: "bottom" as const, align: "start" as const, sideOffset: 4, avoidCollisions: true }, allProps);\n  const [local, rest] = splitProps(props, ["children", "side", "align", "sideOffset", "avoidCollisions"]);\n\n  return (\n    <div\n      ${part.discoveryAttribute}${role}${tabIndex}\n      data-state="closed"\n      data-side={local.side}\n      data-align={local.align}\n      data-side-offset={local.sideOffset}\n      data-avoid-collisions={local.avoidCollisions ? "true" : "false"}${hidden}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default ${exportName};\n`;
}

function renderSolidMenuActionItem(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "item");
  const branch = getMenuStaticBranch(spec, "item");
  const closeOnClick = requireCloseOnClick(branch);
  const disabled = requireDisabled(branch);

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type MenuItemProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  ${disabled.prop}?: boolean;\n  ${closeOnClick.prop}?: boolean;\n};\n\nexport function MenuItem(allProps: MenuItemProps) {\n  const props = mergeProps({ ${disabled.prop}: false, ${closeOnClick.prop}: ${closeOnClick.defaultValue} }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${disabled.prop}", "${closeOnClick.prop}"]);\n\n  return (\n    <div\n      ${part.discoveryAttribute}\n      role="${requireRole(branch)}"\n      tabIndex={0}\n      ${closeOnClick.attribute}={local.${closeOnClick.prop} ? undefined : "false"}\n      ${disabled.ariaAttribute}={local.${disabled.prop} || undefined}\n      ${disabled.dataAttribute}={local.${disabled.prop} ? "" : undefined}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default MenuItem;\n`;
}

function renderSolidMenuLinkItem(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "linkItem");
  const branch = getMenuStaticBranch(spec, "linkItem");
  const closeOnClick = requireCloseOnClick(branch);
  const disabled = requireDisabled(branch);

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type MenuLinkItemProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {\n  ${disabled.prop}?: boolean;\n  ${closeOnClick.prop}?: boolean;\n};\n\nexport function MenuLinkItem(allProps: MenuLinkItemProps) {\n  const props = mergeProps({ ${disabled.prop}: false, ${closeOnClick.prop}: ${closeOnClick.defaultValue} }, allProps);\n  const [local, rest] = splitProps(props, ["children", "href", "${disabled.prop}", "${closeOnClick.prop}"]);\n\n  return (\n    <a\n      ${part.discoveryAttribute}\n      href={local.${disabled.prop} ? undefined : local.href}\n      role="${requireRole(branch)}"\n      tabIndex={0}\n      ${closeOnClick.attribute}={local.${closeOnClick.prop} ? "true" : undefined}\n      ${disabled.ariaAttribute}={local.${disabled.prop} || undefined}\n      ${disabled.dataAttribute}={local.${disabled.prop} ? "" : undefined}\n      {...rest}\n    >\n      {local.children}\n    </a>\n  );\n}\n\nexport default MenuLinkItem;\n`;
}

function renderSolidMenuCheckboxItem(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "checkboxItem");
  const recipe = spec.menu.checkboxItem;
  const event = recipe.eventForwarding;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport type { ${event.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { MenuCheckboxItemContext } from "./${rootFile}";\n\nexport type MenuCheckboxItemProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "${recipe.stateAttributes.ariaChecked}" | "role"> & {\n  ${recipe.checkedState.controlledProp}?: boolean;\n  ${recipe.checkedState.defaultProp}?: boolean;\n  ${event.callbackProp}?: (${event.valueProperty}: boolean, details: ${event.detailsType}) => void;\n  ${recipe.closeOnClick.prop}?: boolean;\n  ${recipe.disabled.prop}?: boolean;\n};\n\nexport function MenuCheckboxItem(allProps: MenuCheckboxItemProps) {\n  const props = mergeProps({ ${recipe.checkedState.defaultProp}: false, ${recipe.closeOnClick.prop}: ${recipe.closeOnClick.defaultValue}, ${recipe.disabled.prop}: false }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${recipe.checkedState.controlledProp}", "${recipe.checkedState.defaultProp}", "${event.callbackProp}", "${recipe.closeOnClick.prop}", "${recipe.disabled.prop}"]);\n  const [uncontrolledChecked, setUncontrolledChecked] = createSignal(local.${recipe.checkedState.defaultProp});\n  const checked = createMemo(() => local.${recipe.checkedState.controlledProp} ?? uncontrolledChecked());\n  const checkboxItemContext = { checked };\n  let item!: HTMLDivElement;\n\n  function handleCheckedChange(event: Event) {\n    const details = (event as CustomEvent<${event.detailsType}>).detail;\n    local.${event.callbackProp}?.(details.${event.valueProperty}, details);\n    if (!details.isCanceled && local.${recipe.checkedState.controlledProp} === undefined) {\n      setUncontrolledChecked(details.${event.valueProperty});\n    }\n  }\n\n  onMount(() => {\n    item.addEventListener("${event.domEvent}", handleCheckedChange);\n    onCleanup(() => item.removeEventListener("${event.domEvent}", handleCheckedChange));\n  });\n\n  return (\n    <MenuCheckboxItemContext.Provider value={checkboxItemContext}>\n      <div\n        ref={item}\n        ${part.discoveryAttribute}\n        ${recipe.checkedState.initialAttribute}={local.${recipe.checkedState.defaultProp} ? "true" : undefined}\n        ${recipe.closeOnClick.attribute}={local.${recipe.closeOnClick.prop} ? "true" : undefined}\n        role="${recipe.role}"\n        ${recipe.stateAttributes.ariaChecked}={checked()}\n        ${recipe.disabled.ariaAttribute}={local.${recipe.disabled.prop} || undefined}\n        ${recipe.stateAttributes.checked}={checked() ? "" : undefined}\n        ${recipe.disabled.dataAttribute}={local.${recipe.disabled.prop} ? "" : undefined}\n        ${recipe.stateAttributes.unchecked}={!checked() ? "" : undefined}\n        tabIndex={0}\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </MenuCheckboxItemContext.Provider>\n  );\n}\n\nexport default MenuCheckboxItem;\n`;
}

function renderSolidMenuCheckboxItemIndicator(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "checkboxItemIndicator");
  const projection = spec.menu.checkboxItem.indicatorProjection;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useMenuCheckboxItemContext } from "./${rootFile}";\n\nexport type MenuCheckboxItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement>;\n\nexport function MenuCheckboxItemIndicator(allProps: MenuCheckboxItemIndicatorProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const item = useMenuCheckboxItemContext();\n\n  return (\n    <span\n      ${part.discoveryAttribute}\n      aria-hidden="${projection.ariaHidden}"\n      ${projection.stateAttribute}={item.checked() ? "${projection.checkedStateValue}" : "${projection.uncheckedStateValue}"}\n      ${projection.visibleAttribute}={item.checked() ? "" : undefined}\n      ${projection.hiddenAttribute}={item.checked() ? undefined : ""}\n      {...rest}\n    >\n      {local.children}\n    </span>\n  );\n}\n\nexport default MenuCheckboxItemIndicator;\n`;
}

function renderSolidMenuRadioGroup(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "radioGroup");
  const recipe = spec.menu.radioGroup;
  const event = recipe.eventForwarding;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport type { ${event.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { createMemo, createSignal, onCleanup, onMount, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { MenuRadioGroupContext } from "./${rootFile}";\n\nexport type MenuRadioGroupProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "${recipe.valueState.defaultProp}" | "onChange"> & {\n  ${recipe.valueState.controlledProp}?: string;\n  ${recipe.valueState.defaultProp}?: string;\n  ${event.callbackProp}?: (${event.valueProperty}: string, details: ${event.detailsType}) => void;\n};\n\nexport function MenuRadioGroup(allProps: MenuRadioGroupProps) {\n  const [local, rest] = splitProps(allProps, ["children", "${recipe.valueState.controlledProp}", "${recipe.valueState.defaultProp}", "${event.callbackProp}"]);\n  const [uncontrolledValue, setUncontrolledValue] = createSignal<string | undefined>(local.${recipe.valueState.defaultProp});\n  const radioGroupContext = { value: createMemo(() => local.${recipe.valueState.controlledProp} ?? uncontrolledValue()) };\n  let group!: HTMLDivElement;\n\n  function handleValueChange(event: Event) {\n    const details = (event as CustomEvent<${event.detailsType}>).detail;\n    local.${event.callbackProp}?.(details.${event.valueProperty}, details);\n    if (!details.isCanceled && local.${recipe.valueState.controlledProp} === undefined) {\n      setUncontrolledValue(details.${event.valueProperty});\n    }\n  }\n\n  onMount(() => {\n    group.addEventListener("${event.domEvent}", handleValueChange);\n    onCleanup(() => group.removeEventListener("${event.domEvent}", handleValueChange));\n  });\n\n  return (\n    <MenuRadioGroupContext.Provider value={radioGroupContext}>\n      <div\n        ref={group}\n        ${part.discoveryAttribute}\n        role="${recipe.role}"\n        ${recipe.valueState.initialAttribute}={radioGroupContext.value()}\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </MenuRadioGroupContext.Provider>\n  );\n}\n\nexport default MenuRadioGroup;\n`;
}

function renderSolidMenuRadioItem(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "radioItem");
  const recipe = spec.menu.radioItem;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { createMemo, mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { MenuRadioItemContext, useMenuRadioGroupContext } from "./${rootFile}";\n\nexport type MenuRadioItemProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "${recipe.stateAttributes.ariaChecked}" | "role"> & {\n  ${recipe.valueProp.prop}: string;\n  ${recipe.checkedState.controlledProp}?: boolean;\n  ${recipe.checkedState.defaultProp}?: boolean;\n  ${recipe.closeOnClick.prop}?: boolean;\n  ${recipe.disabled.prop}?: boolean;\n};\n\nexport function MenuRadioItem(allProps: MenuRadioItemProps) {\n  const props = mergeProps({ ${recipe.checkedState.defaultProp}: false, ${recipe.closeOnClick.prop}: ${recipe.closeOnClick.defaultValue}, ${recipe.disabled.prop}: false }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${recipe.valueProp.prop}", "${recipe.checkedState.controlledProp}", "${recipe.checkedState.defaultProp}", "${recipe.closeOnClick.prop}", "${recipe.disabled.prop}"]);\n  const group = useMenuRadioGroupContext();\n  const checked = createMemo(() => local.${recipe.checkedState.controlledProp} ?? (group.value() === undefined ? local.${recipe.checkedState.defaultProp} : group.value() === local.${recipe.valueProp.prop}));\n  const radioItemContext = { checked };\n\n  return (\n    <MenuRadioItemContext.Provider value={radioItemContext}>\n      <div\n        ${part.discoveryAttribute}\n        ${recipe.valueProp.attribute}={local.${recipe.valueProp.prop}}\n        ${recipe.checkedState.initialAttribute}={local.${recipe.checkedState.defaultProp} ? "true" : undefined}\n        ${recipe.closeOnClick.attribute}={local.${recipe.closeOnClick.prop} ? "true" : undefined}\n        role="${recipe.role}"\n        ${recipe.stateAttributes.ariaChecked}={checked()}\n        ${recipe.disabled.ariaAttribute}={local.${recipe.disabled.prop} || undefined}\n        ${recipe.stateAttributes.checked}={checked() ? "" : undefined}\n        ${recipe.disabled.dataAttribute}={local.${recipe.disabled.prop} ? "" : undefined}\n        ${recipe.stateAttributes.unchecked}={!checked() ? "" : undefined}\n        tabIndex={0}\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </MenuRadioItemContext.Provider>\n  );\n}\n\nexport default MenuRadioItem;\n`;
}

function renderSolidMenuRadioItemIndicator(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "radioItemIndicator");
  const projection = spec.menu.radioItem.indicatorProjection;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useMenuRadioItemContext } from "./${rootFile}";\n\nexport type MenuRadioItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement>;\n\nexport function MenuRadioItemIndicator(allProps: MenuRadioItemIndicatorProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const item = useMenuRadioItemContext();\n  const checked = item.checked;\n\n  return (\n    <span\n      ${part.discoveryAttribute}\n      aria-hidden="${projection.ariaHidden}"\n      ${projection.stateAttribute}={checked() ? "${projection.checkedStateValue}" : "${projection.uncheckedStateValue}"}\n      ${projection.visibleAttribute}={checked() ? "" : undefined}\n      ${projection.hiddenAttribute}={checked() ? undefined : ""}\n      {...rest}\n    >\n      {local.children}\n    </span>\n  );\n}\n\nexport default MenuRadioItemIndicator;\n`;
}

function renderSolidMenuStaticPart(
  spec: MenuSpecializedAdapterSpec,
  partName: "group" | "label" | "separator" | "shortcut",
): string {
  const part = getPart(spec, partName);
  const branch = getMenuStaticBranch(spec, partName);
  const exportName = getFileExportName(spec, partName);
  const role = branch.role ? `\n      role="${branch.role}"` : "";
  const aria = (branch.ariaAttributes ?? [])
    .map((attribute) => `\n      ${attribute.name}="${attribute.value}"`)
    .join("");
  const tag = part.defaultElement;
  const jsxType =
    tag === "span" ? "JSX.HTMLAttributes<HTMLSpanElement>" : "JSX.HTMLAttributes<HTMLDivElement>";

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ${exportName}Props = ${jsxType};\n\nexport function ${exportName}(allProps: ${exportName}Props) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return (\n    <${tag}\n      ${part.discoveryAttribute}${role}${aria}\n      {...rest}\n    >\n      {local.children}\n    </${tag}>\n  );\n}\n\nexport default ${exportName};\n`;
}

function renderSolidMenuSubmenuRoot(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "submenuRoot");
  const recipe = spec.menu.submenu.root;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { MenuSubmenuRootContext } from "./${rootFile}";\n\nexport type MenuSubmenuRootProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  ${recipe.closeDelay.prop}?: number;\n};\n\nexport function MenuSubmenuRoot(allProps: MenuSubmenuRootProps) {\n  const props = mergeProps({ ${recipe.closeDelay.prop}: ${recipe.closeDelay.defaultValue} }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${recipe.closeDelay.prop}"]);\n  let root!: HTMLDivElement;\n  const submenuRootContext = {\n    get root() {\n      return root;\n    },\n  };\n\n  return (\n    <MenuSubmenuRootContext.Provider value={submenuRootContext}>\n      <div\n        ref={root}\n        ${part.discoveryAttribute}\n        ${recipe.closeDelay.attribute}={local.${recipe.closeDelay.prop}}\n        ${recipe.stateAttributes.state}="${recipe.stateAttributes.closedValue}"\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </MenuSubmenuRootContext.Provider>\n  );\n}\n\nexport default MenuSubmenuRoot;\n`;
}

function renderSolidMenuSubmenuTrigger(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "submenuTrigger");
  const recipe = spec.menu.submenu.trigger;

  return `/* ${MENU_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type MenuSubmenuTriggerProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  ${recipe.disabled.prop}?: boolean;\n};\n\nexport function MenuSubmenuTrigger(allProps: MenuSubmenuTriggerProps) {\n  const props = mergeProps({ ${recipe.disabled.prop}: false }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${recipe.disabled.prop}"]);\n\n  return (\n    <div\n      ${part.discoveryAttribute}\n      role="${recipe.role}"\n      ${recipe.disclosure.ariaHaspopup.attribute}="${recipe.disclosure.ariaHaspopup.value}"\n      ${recipe.disclosure.ariaExpanded}="false"\n      ${recipe.disabled.ariaAttribute}={local.${recipe.disabled.prop} || undefined}\n      ${recipe.disabled.dataAttribute}={local.${recipe.disabled.prop} ? "" : undefined}\n      ${recipe.disclosure.stateAttribute}="${recipe.disclosure.closedStateValue}"\n      tabIndex={${recipe.tabIndex.value}}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default MenuSubmenuTrigger;\n`;
}

function renderSolidMenuIndex(spec: MenuSpecializedAdapterSpec): string {
  const rootFile = getFileExportName(spec, "root");

  return `// ${MENU_FIXTURE_COMMENT}\n${spec.menu.namespace.objectEntries
    .map(
      (entry) =>
        `export { default as ${entry.property} } from "./${getFileExportName(spec, entry.part)}";`,
    )
    .join(
      "\n",
    )}\nexport {\n  MenuCheckboxItemContext,\n  MenuRadioGroupContext,\n  MenuRadioItemContext,\n  MenuRootContext,\n  MenuSubmenuRootContext,\n  useMenuCheckboxItemContext,\n  useMenuRadioGroupContext,\n  useMenuRadioItemContext,\n  useMenuRootContext,\n} from "./${rootFile}";\n`;
}

function renderSolidNavigationMenuRoot(spec: NavigationMenuSpecializedAdapterSpec): string {
  const baseRoot = getPart(spec, "root");
  const valueEvent = spec.navigationMenu.valueControl.eventForwarding;
  const controlledNullMarker = spec.navigationMenu.valueControl.state.controlledNullMarker;
  const root = {
    ...baseRoot,
    discoveryAttribute: `${baseRoot.discoveryAttribute}\n        ${controlledNullMarker.attribute}={local.${spec.navigationMenu.valueState.controlledProp} === null ? "" : undefined}`,
  };

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { ${spec.root.runtimeFactory}, type ${valueEvent.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { createContext, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";\nimport type { JSX } from "solid-js";\n\ntype NavigationMenuOrientation = "horizontal" | "vertical";\n\nexport type NavigationMenuRootContextValue = {\n  orientation: () => NavigationMenuOrientation;\n  value: () => string | null;\n};\n\nexport type NavigationMenuItemContextValue = {\n  open: () => boolean;\n  value: string;\n};\n\nexport const NavigationMenuRootContext = createContext<NavigationMenuRootContextValue>({ orientation: () => "horizontal", value: () => null });\nexport const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue>({ open: () => false, value: "" });\n\nexport function useNavigationMenuRootContext() {\n  return useContext(NavigationMenuRootContext);\n}\n\nexport function useNavigationMenuItemContext() {\n  return useContext(NavigationMenuItemContext);\n}\n\nexport type NavigationMenuRootProps = JSX.HTMLAttributes<HTMLElement> & {\n  ${spec.navigationMenu.valueState.defaultProp}?: string | null;\n  ${spec.navigationMenu.valueState.controlledProp}?: string | null;\n  orientation?: NavigationMenuOrientation;\n  openDelay?: number;\n  closeDelay?: number;\n  closeOnEscape?: boolean;\n  closeOnOutsideInteract?: boolean;\n  ${valueEvent.callbackProp}?: (${valueEvent.valueProperty}: string | null, details: ${valueEvent.detailsType}) => void;\n};\n\nexport function NavigationMenuRoot(allProps: NavigationMenuRootProps) {\n  const props = mergeProps({ ${spec.navigationMenu.valueState.defaultProp}: null, orientation: "horizontal" as const, openDelay: 50, closeDelay: 50, closeOnEscape: true, closeOnOutsideInteract: true }, allProps);\n  const [local, rest] = splitProps(props, [\n    "children",\n    "${spec.navigationMenu.valueState.defaultProp}",\n    "${spec.navigationMenu.valueState.controlledProp}",\n    "orientation",\n    "openDelay",\n    "closeDelay",\n    "closeOnEscape",\n    "closeOnOutsideInteract",\n    "${valueEvent.callbackProp}",\n  ]);\n  const [uncontrolledValue, setUncontrolledValue] = createSignal<string | null>(local.${spec.navigationMenu.valueState.defaultProp});\n  const navigationMenuContext = {\n    orientation: createMemo(() => local.orientation),\n    value: createMemo(() => local.${spec.navigationMenu.valueState.controlledProp} ?? uncontrolledValue()),\n  };\n  const [mounted, setMounted] = createSignal(false);\n  const optionSignature = createMemo(() =>\n    [\n      local.openDelay,\n      local.closeDelay,\n      local.closeOnEscape,\n      local.closeOnOutsideInteract,\n    ].join("|"),\n  );\n  let root!: HTMLElement;\n  let instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\n  function setup() {\n    instance?.destroy();\n    instance = ${spec.root.runtimeFactory}(root, {\n      ${spec.navigationMenu.valueState.defaultProp}: uncontrolledValue(),\n      closeDelay: local.closeDelay,\n      closeOnEscape: local.closeOnEscape,\n      closeOnOutsideInteract: local.closeOnOutsideInteract,\n      openDelay: local.openDelay,\n      ...(local.${spec.navigationMenu.valueState.controlledProp} !== undefined ? { ${spec.navigationMenu.valueState.controlledProp}: local.${spec.navigationMenu.valueState.controlledProp} } : {}),\n      ${valueEvent.callbackProp}(${valueEvent.valueProperty}, details) {\n        local.${valueEvent.callbackProp}?.(${valueEvent.valueProperty}, details);\n        if (!details.isCanceled && local.${spec.navigationMenu.valueState.controlledProp} === undefined) {\n          setUncontrolledValue(${valueEvent.valueProperty});\n        }\n      },\n    });\n  }\n\n  onMount(() => {\n    setMounted(true);\n  });\n\n  createEffect(() => {\n    optionSignature();\n    if (!mounted()) return;\n\n    setup();\n  });\n\n  onCleanup(() => {\n    instance?.destroy();\n    instance = undefined;\n  });\n\n  createEffect(() => {\n    const value = local.${spec.navigationMenu.valueState.controlledProp};\n    if (value === undefined || !instance || instance.${spec.navigationMenu.valueState.getter}() === value) return;\n\n    instance.${spec.navigationMenu.valueState.setter}(value, { emit: false });\n  });\n\n  return (\n    <NavigationMenuRootContext.Provider value={navigationMenuContext}>\n      <nav\n        ref={root}\n        ${root.discoveryAttribute}\n        data-value={local.${spec.navigationMenu.valueState.controlledProp} ?? undefined}\n        data-default-value={local.${spec.navigationMenu.valueState.defaultProp} ?? undefined}\n        data-open-delay={String(local.openDelay)}\n        data-close-delay={String(local.closeDelay)}\n        data-close-on-escape={local.closeOnEscape ? "true" : "false"}\n        data-close-on-outside-interact={local.closeOnOutsideInteract ? "true" : "false"}\n        data-orientation={local.orientation}\n        data-state={navigationMenuContext.value() === null ? "closed" : "open"}\n        {...rest}\n      >\n        {local.children}\n      </nav>\n    </NavigationMenuRootContext.Provider>\n  );\n}\n\nexport default NavigationMenuRoot;\n`;
}

function renderSolidNavigationMenuList(spec: NavigationMenuSpecializedAdapterSpec): string {
  const list = getPart(spec, "list");
  const rootFile = getFileExportName(spec, "root");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useNavigationMenuRootContext } from "./${rootFile}";\n\nexport type NavigationMenuListProps = JSX.HTMLAttributes<HTMLUListElement>;\n\nexport function NavigationMenuList(allProps: NavigationMenuListProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const navigationMenu = useNavigationMenuRootContext();\n\n  return (\n    <ul\n      ${list.discoveryAttribute}\n      data-orientation={navigationMenu.orientation()}\n      {...rest}\n    >\n      {local.children}\n    </ul>\n  );\n}\n\nexport default NavigationMenuList;\n`;
}

function renderSolidNavigationMenuItem(spec: NavigationMenuSpecializedAdapterSpec): string {
  const item = getPart(spec, "item");
  const value = spec.navigationMenu.partRecipes.item.value;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { createMemo, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { NavigationMenuItemContext, useNavigationMenuRootContext } from "./${rootFile}";\n\nexport type NavigationMenuItemProps = JSX.LiHTMLAttributes<HTMLLIElement> & {\n  ${value.prop}: string;\n};\n\nexport function NavigationMenuItem(allProps: NavigationMenuItemProps) {\n  const [local, rest] = splitProps(allProps, ["children", "${value.prop}"]);\n  const navigationMenu = useNavigationMenuRootContext();\n  const open = createMemo(() => navigationMenu.value() === local.${value.prop});\n  const itemContext = { open, value: local.${value.prop} };\n\n  return (\n    <NavigationMenuItemContext.Provider value={itemContext}>\n      <li\n        ${item.discoveryAttribute}\n        ${value.attribute}={local.${value.prop}}\n        data-state={open() ? "open" : "closed"}\n        {...rest}\n      >\n        {local.children}\n      </li>\n    </NavigationMenuItemContext.Provider>\n  );\n}\n\nexport default NavigationMenuItem;\n`;
}

function renderSolidNavigationMenuTrigger(spec: NavigationMenuSpecializedAdapterSpec): string {
  const trigger = getPart(spec, "trigger");
  const recipe = spec.navigationMenu.partRecipes.trigger;
  const rootFile = getFileExportName(spec, "root");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { createMemo, mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useNavigationMenuItemContext } from "./${rootFile}";\n\nexport type NavigationMenuTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${recipe.disabled.prop}?: boolean;\n  openDelay?: number;\n  closeDelay?: number;\n};\n\nexport function NavigationMenuTrigger(allProps: NavigationMenuTriggerProps) {\n  const props = mergeProps({ ${recipe.disabled.prop}: false }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${recipe.disabled.prop}", "openDelay", "closeDelay"]);\n  const item = useNavigationMenuItemContext();\n  const open = createMemo(() => item.open());\n\n  return (\n    <button\n      ${trigger.discoveryAttribute}\n      type="${recipe.typeAttribute.value}"\n      ${recipe.disclosure.ariaHaspopup.attribute}="${recipe.disclosure.ariaHaspopup.value}"\n      ${recipe.disclosure.ariaExpanded}={open() ? "true" : "false"}\n      ${recipe.disabled.ariaAttribute}={local.${recipe.disabled.prop} ? "true" : undefined}\n      ${recipe.disabled.dataAttribute}={local.${recipe.disabled.prop} ? "" : undefined}\n      data-open-delay={local.openDelay === undefined ? undefined : String(local.openDelay)}\n      data-close-delay={local.closeDelay === undefined ? undefined : String(local.closeDelay)}\n      ${recipe.disclosure.stateAttribute}={open() ? "open" : "closed"}\n      {...rest}\n    >\n      {local.children}\n    </button>\n  );\n}\n\nexport default NavigationMenuTrigger;\n`;
}

function renderSolidNavigationMenuIcon(spec: NavigationMenuSpecializedAdapterSpec): string {
  const icon = getPart(spec, "icon");
  const rootFile = getFileExportName(spec, "root");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useNavigationMenuItemContext } from "./${rootFile}";\n\nexport type NavigationMenuIconProps = JSX.HTMLAttributes<HTMLSpanElement>;\n\nexport function NavigationMenuIcon(allProps: NavigationMenuIconProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const item = useNavigationMenuItemContext();\n\n  return (\n    <span\n      ${icon.discoveryAttribute}\n      aria-hidden="true"\n      data-state={item.open() ? "open" : "closed"}\n      {...rest}\n    >\n      {local.children}\n    </span>\n  );\n}\n\nexport default NavigationMenuIcon;\n`;
}

function renderSolidNavigationMenuContent(spec: NavigationMenuSpecializedAdapterSpec): string {
  const content = getPart(spec, "content");
  const rootFile = getFileExportName(spec, "root");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useNavigationMenuItemContext } from "./${rootFile}";\n\nexport type NavigationMenuContentProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function NavigationMenuContent(allProps: NavigationMenuContentProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const item = useNavigationMenuItemContext();\n\n  return (\n    <div\n      ${content.discoveryAttribute}\n      data-state={item.open() ? "open" : "closed"}\n      data-activation-direction={undefined}\n      data-instant={undefined}\n      hidden={!item.open()}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default NavigationMenuContent;\n`;
}

function renderSolidNavigationMenuLink(spec: NavigationMenuSpecializedAdapterSpec): string {
  const link = getPart(spec, "link");
  const recipe = spec.navigationMenu.partRecipes.link;

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type NavigationMenuLinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {\n  ${recipe.active.prop}?: boolean;\n  ${recipe.closeOnClick.prop}?: boolean;\n};\n\nexport function NavigationMenuLink(allProps: NavigationMenuLinkProps) {\n  const props = mergeProps({ ${recipe.active.prop}: false, ${recipe.closeOnClick.prop}: ${recipe.closeOnClick.defaultValue} }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${recipe.active.prop}", "${recipe.closeOnClick.prop}"]);\n\n  return (\n    <a\n      ${link.discoveryAttribute}\n      ${recipe.active.attribute}={local.${recipe.active.prop} ? "" : undefined}\n      ${recipe.active.ariaCurrentAttribute}={local.${recipe.active.prop} ? "${recipe.active.ariaCurrentValue}" : undefined}\n      ${recipe.closeOnClick.attribute}={local.${recipe.closeOnClick.prop} ? undefined : "${recipe.closeOnClick.falseValue}"}\n      {...rest}\n    >\n      {local.children}\n    </a>\n  );\n}\n\nexport default NavigationMenuLink;\n`;
}

function renderSolidNavigationMenuPortal(spec: NavigationMenuSpecializedAdapterSpec): string {
  const portal = getPart(spec, "portal");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { Portal } from "solid-js/web";\n\nexport type NavigationMenuPortalProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function NavigationMenuPortal(allProps: NavigationMenuPortalProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return (\n    <Portal>\n      <div ${portal.discoveryAttribute} {...rest}>\n        {local.children}\n      </div>\n    </Portal>\n  );\n}\n\nexport default NavigationMenuPortal;\n`;
}

function renderSolidNavigationMenuPositioner(spec: NavigationMenuSpecializedAdapterSpec): string {
  const positioner = getPart(spec, "positioner");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type NavigationMenuPositionerProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  side?: "top" | "right" | "bottom" | "left";\n  align?: "start" | "center" | "end";\n  sideOffset?: number;\n  alignOffset?: number;\n  avoidCollisions?: boolean;\n  collisionPadding?: number;\n};\n\nexport function NavigationMenuPositioner(allProps: NavigationMenuPositionerProps) {\n  const props = mergeProps({ side: "bottom" as const, align: "start" as const, sideOffset: 4, alignOffset: 0, avoidCollisions: true, collisionPadding: 8 }, allProps);\n  const [local, rest] = splitProps(props, ["children", "side", "align", "sideOffset", "alignOffset", "avoidCollisions", "collisionPadding"]);\n\n  return (\n    <div\n      ${positioner.discoveryAttribute}\n      data-state="closed"\n      data-side={local.side}\n      data-align={local.align}\n      data-side-offset={String(local.sideOffset)}\n      data-align-offset={String(local.alignOffset)}\n      data-avoid-collisions={local.avoidCollisions ? "true" : "false"}\n      data-collision-padding={String(local.collisionPadding)}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default NavigationMenuPositioner;\n`;
}

function renderSolidNavigationMenuPopup(spec: NavigationMenuSpecializedAdapterSpec): string {
  const popup = getPart(spec, "popup");
  const rootFile = getFileExportName(spec, "root");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useNavigationMenuRootContext } from "./${rootFile}";\n\nexport type NavigationMenuPopupProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function NavigationMenuPopup(allProps: NavigationMenuPopupProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const navigationMenu = useNavigationMenuRootContext();\n\n  return (\n    <div\n      ${popup.discoveryAttribute}\n      data-state={navigationMenu.value() === null ? "closed" : "open"}\n      data-side={undefined}\n      data-align={undefined}\n      data-instant={undefined}\n      hidden={navigationMenu.value() === null}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default NavigationMenuPopup;\n`;
}

function renderSolidNavigationMenuViewport(spec: NavigationMenuSpecializedAdapterSpec): string {
  const viewport = getPart(spec, "viewport");
  const rootFile = getFileExportName(spec, "root");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useNavigationMenuRootContext } from "./${rootFile}";\n\nexport type NavigationMenuViewportProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function NavigationMenuViewport(allProps: NavigationMenuViewportProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  const navigationMenu = useNavigationMenuRootContext();\n\n  return (\n    <div\n      ${viewport.discoveryAttribute}\n      data-state={navigationMenu.value() === null ? "closed" : "open"}\n      data-side={undefined}\n      data-align={undefined}\n      data-activation-direction={undefined}\n      data-instant={undefined}\n      hidden={navigationMenu.value() === null}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default NavigationMenuViewport;\n`;
}

function renderSolidNavigationMenuArrow(spec: NavigationMenuSpecializedAdapterSpec): string {
  const arrow = getPart(spec, "arrow");

  return `/* ${NAVIGATION_MENU_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type NavigationMenuArrowProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function NavigationMenuArrow(allProps: NavigationMenuArrowProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n\n  return (\n    <div\n      ${arrow.discoveryAttribute}\n      aria-hidden="true"\n      data-state="closed"\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default NavigationMenuArrow;\n`;
}

function renderSolidNavigationMenuIndex(spec: NavigationMenuSpecializedAdapterSpec): string {
  const rootFile = getFileExportName(spec, "root");

  return `// ${NAVIGATION_MENU_FIXTURE_COMMENT}\n${getNavigationMenuFixturePartExports(spec)
    .map(
      ({ alias, fileExportName }) => `export { default as ${alias} } from "./${fileExportName}";`,
    )
    .join(
      "\n",
    )}\nexport {\n  NavigationMenuItemContext,\n  NavigationMenuRootContext,\n  useNavigationMenuItemContext,\n  useNavigationMenuRootContext,\n} from "./${rootFile}";\n`;
}

function renderSolidScrollAreaRoot(
  spec: SpecializedAdapterSpec,
  part: GenericAdapterPlanPart,
): string {
  const overflowEdgeThreshold = getPropForPart(spec, "overflowEdgeThreshold", "root");
  const thresholdValue = `local.${overflowEdgeThreshold.name}`;

  return `/* ${FIXTURE_COMMENT} */\nimport { ${spec.root.runtimeFactory} } from "${spec.root.runtimeImportSource}";\nimport { createContext, createEffect, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";\nimport type { JSX } from "solid-js";\n\n${renderScrollAreaOverflowEdgeThresholdType("export type")}\n\ntype ScrollAreaOverflowEdgeThresholdAttributes = {\n  shared?: number;\n  xEnd?: number;\n  xStart?: number;\n  yEnd?: number;\n  yStart?: number;\n};\n\nexport type ScrollAreaRootProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  ${overflowEdgeThreshold.name}?: ScrollAreaOverflowEdgeThreshold;\n};\n\nexport const ScrollAreaRootContext = createContext<HTMLDivElement | undefined>();\n\nexport function useScrollAreaRootContext() {\n  return useContext(ScrollAreaRootContext);\n}\n\nexport function ScrollAreaRoot(allProps: ScrollAreaRootProps) {\n  const props = mergeProps({}, allProps);\n  const [local, rest] = splitProps(props, ["children", "${overflowEdgeThreshold.name}"]);\n  let root!: HTMLDivElement;\n  let instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\n  onMount(() => {\n    instance = ${spec.root.runtimeFactory}(root);\n\n    onCleanup(() => {\n      instance?.destroy();\n      instance = undefined;\n    });\n  });\n\n  createEffect(() => {\n    const thresholdAttributes = getOverflowEdgeThresholdAttributes(${thresholdValue});\n    thresholdAttributes.shared;\n    thresholdAttributes.xEnd;\n    thresholdAttributes.xStart;\n    thresholdAttributes.yEnd;\n    thresholdAttributes.yStart;\n    instance?.refresh();\n  });\n\n  return (\n    <ScrollAreaRootContext.Provider value={root}>\n      <div\n        ref={root}\n        ${part.discoveryAttribute}\n        data-overflow-edge-threshold={getOverflowEdgeThresholdAttributes(${thresholdValue}).shared}\n        data-overflow-edge-threshold-x-end={getOverflowEdgeThresholdAttributes(${thresholdValue}).xEnd}\n        data-overflow-edge-threshold-x-start={getOverflowEdgeThresholdAttributes(${thresholdValue}).xStart}\n        data-overflow-edge-threshold-y-end={getOverflowEdgeThresholdAttributes(${thresholdValue}).yEnd}\n        data-overflow-edge-threshold-y-start={getOverflowEdgeThresholdAttributes(${thresholdValue}).yStart}\n        role="${getRequiredRole(part)}"\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </ScrollAreaRootContext.Provider>\n  );\n}\n\nexport default ScrollAreaRoot;\n\nfunction getOverflowEdgeThresholdAttributes(\n  threshold: ScrollAreaOverflowEdgeThreshold | undefined,\n): ScrollAreaOverflowEdgeThresholdAttributes {\n  if (typeof threshold === "number") {\n    const shared = normalizeOverflowEdgeThresholdValue(threshold);\n    return shared === undefined ? {} : { shared };\n  }\n\n  if (!threshold) return {};\n\n  return {\n    xEnd: "xEnd" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.xEnd) : undefined,\n    xStart: "xStart" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.xStart) : undefined,\n    yEnd: "yEnd" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.yEnd) : undefined,\n    yStart: "yStart" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.yStart) : undefined,\n  };\n}\n\nfunction normalizeOverflowEdgeThresholdValue(value: number | undefined): number | undefined {\n  if (value === undefined || !Number.isFinite(value)) return undefined;\n\n  return Math.max(value, 0);\n}\n`;
}

function renderSolidScrollAreaViewport(part: GenericAdapterPlanPart): string {
  return `/* ${FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useScrollAreaRootContext } from "./ScrollAreaRoot";\n\nexport type ScrollAreaViewportProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function ScrollAreaViewport(allProps: ScrollAreaViewportProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  useScrollAreaRootContext();\n\n  return (\n    <div\n      ${part.discoveryAttribute}\n      role="${getRequiredRole(part)}"\n      tabIndex={-1}\n      style={{ overflow: "scroll" }}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default ScrollAreaViewport;\n`;
}

function renderSolidScrollAreaSimplePart(part: GenericAdapterPlanPart): string {
  return `/* ${FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useScrollAreaRootContext } from "./ScrollAreaRoot";\n\nexport type ${toExportName(part.name)}Props = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function ${toExportName(part.name)}(allProps: ${toExportName(part.name)}Props) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  useScrollAreaRootContext();\n\n  return (\n    <div\n      ${part.discoveryAttribute}${part.role ? `\n      role="${part.role}"` : ""}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default ${toExportName(part.name)};\n`;
}

function renderSolidScrollAreaScrollbar(
  spec: SpecializedAdapterSpec,
  part: GenericAdapterPlanPart,
): string {
  const keepMounted = getPropForPart(spec, "keepMounted", "scrollbar");
  const orientation = getPropForPart(spec, "orientation", "scrollbar");
  const keepMountedValue = `local.${keepMounted.name}`;
  const orientationValue = `local.${orientation.name}`;

  return `/* ${FIXTURE_COMMENT} */\nimport { mergeProps, splitProps, useContext } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { ScrollAreaRootContext } from "./ScrollAreaRoot";\n\nexport type ScrollAreaOrientation = ${orientation.type};\n\nexport type ScrollAreaScrollbarProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  ${keepMounted.name}?: ${keepMounted.type};\n  ${orientation.name}?: ScrollAreaOrientation;\n};\n\nexport function ScrollAreaScrollbar(allProps: ScrollAreaScrollbarProps) {\n  const props = mergeProps({ ${keepMounted.name}: ${keepMounted.defaultValue}, ${orientation.name}: ${orientation.defaultValue} as const }, allProps);\n  const [local, rest] = splitProps(props, ["children", "${keepMounted.name}", "${orientation.name}"]);\n  useContext(ScrollAreaRootContext);\n\n  return (\n    <div\n      ${part.discoveryAttribute}\n      data-keep-mounted={${keepMountedValue} ? "" : undefined}\n      data-orientation={${orientationValue}}\n      aria-hidden="true"\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default ScrollAreaScrollbar;\n`;
}

function renderSolidScrollAreaCorner(part: GenericAdapterPlanPart): string {
  return `/* ${FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useScrollAreaRootContext } from "./ScrollAreaRoot";\n\nexport type ScrollAreaCornerProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function ScrollAreaCorner(allProps: ScrollAreaCornerProps) {\n  const [local, rest] = splitProps(allProps, ["children"]);\n  useScrollAreaRootContext();\n\n  return (\n    <div\n      ${part.discoveryAttribute}\n      aria-hidden="true"\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default ScrollAreaCorner;\n`;
}

function renderSolidIndex(spec: SpecializedAdapterSpec): string {
  return `// ${FIXTURE_COMMENT}\n${spec.exports.members
    .map(
      (member) =>
        `export { default as ${toPartAlias(member.part)} } from "./${toFileBasename(member.file)}";`,
    )
    .join("\n")}\n`;
}

function isComboboxSpecializedAdapterSpec(
  spec: SpecializedAdapterSpec,
): spec is ComboboxSpecializedAdapterSpec {
  return spec.component === "combobox" && "combobox" in spec;
}

function isMenuSpecializedAdapterSpec(
  spec: SpecializedAdapterSpec,
): spec is MenuSpecializedAdapterSpec {
  return spec.component === "menu" && "menu" in spec;
}

function isNavigationMenuSpecializedAdapterSpec(
  spec: SpecializedAdapterSpec,
): spec is NavigationMenuSpecializedAdapterSpec {
  return spec.component === "navigation-menu" && "navigationMenu" in spec;
}

function assertNavigationMenuFixtureTarget(
  spec: NavigationMenuSpecializedAdapterSpec,
  target: string,
): void {
  const errors = validateNavigationMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture cannot print invalid Navigation Menu spec:\n${errors.join("\n")}`,
    );
  }

  if (spec.root.runtimeFactory !== "createNavigationMenu") {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture expects the Navigation Menu runtime factory.`,
    );
  }

  if (spec.navigationMenu.adapterKind !== "shared-viewport-navigation") {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture only supports shared viewport Navigation Menu specs.`,
    );
  }
}

function assertComboboxFixtureTarget(spec: ComboboxSpecializedAdapterSpec, target: string): void {
  const errors = validateComboboxSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture cannot print invalid Combobox spec:\n${errors.join("\n")}`,
    );
  }

  if (spec.root.runtimeFactory !== "createCombobox") {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture expects the Combobox runtime factory.`,
    );
  }

  if (spec.combobox.adapterKind !== "floating-editable-collection") {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture only supports floating editable collection Combobox specs.`,
    );
  }

  if (spec.combobox.floating.portalPart !== "portal") {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture only supports portalPart "portal".`,
    );
  }
}

function assertMenuFixtureTarget(spec: MenuSpecializedAdapterSpec, target: string): void {
  const errors = validateMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture cannot print invalid Menu spec:\n${errors.join("\n")}`,
    );
  }

  if (spec.root.runtimeFactory !== "createMenu") {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture expects the Menu runtime factory.`,
    );
  }
}

function getComboboxEvent(
  spec: ComboboxSpecializedAdapterSpec,
  name: "inputValueChange" | "openChange" | "valueChange",
): ComboboxSpecializedAdapterSpec["combobox"]["stateControl"]["events"][number] {
  const event = spec.combobox.stateControl.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`${spec.displayName} specialized adapter fixture is missing ${name} event.`);
  }

  return event;
}

function getComboboxFixturePartExports(spec: ComboboxSpecializedAdapterSpec): Array<{
  alias: string;
  fileExportName: string;
}> {
  return COMBOBOX_FIXTURE_PARTS.map((part) => {
    const entry = spec.combobox.namespace.objectEntries.find(
      (candidate) => candidate.part === part,
    );
    if (!entry) {
      throw new Error(
        `${spec.displayName} specialized adapter fixture is missing ${part} namespace entry.`,
      );
    }

    return {
      alias: entry.property,
      fileExportName: getFileExportName(spec, part),
    };
  });
}

function getMenuStaticBranch(
  spec: MenuSpecializedAdapterSpec,
  part: "group" | "item" | "label" | "linkItem" | "separator" | "shortcut",
): MenuSpecializedAdapterSpec["menu"]["staticBranches"][number] {
  const branch = spec.menu.staticBranches.find((candidate) => candidate.part === part);
  if (!branch) {
    throw new Error(`${spec.displayName} specialized adapter fixture is missing ${part} branch.`);
  }

  return branch;
}

function requireRole(branch: MenuSpecializedAdapterSpec["menu"]["staticBranches"][number]): string {
  if (!branch.role) {
    throw new Error(`Menu specialized adapter fixture is missing ${branch.part} role.`);
  }

  return branch.role;
}

function requireDisabled(
  branch: MenuSpecializedAdapterSpec["menu"]["staticBranches"][number],
): NonNullable<MenuSpecializedAdapterSpec["menu"]["staticBranches"][number]["disabled"]> {
  if (!branch.disabled) {
    throw new Error(`Menu specialized adapter fixture is missing ${branch.part} disabled recipe.`);
  }

  return branch.disabled;
}

function requireCloseOnClick(
  branch: MenuSpecializedAdapterSpec["menu"]["staticBranches"][number],
): NonNullable<MenuSpecializedAdapterSpec["menu"]["staticBranches"][number]["closeOnClick"]> {
  if (!branch.closeOnClick) {
    throw new Error(
      `Menu specialized adapter fixture is missing ${branch.part} closeOnClick recipe.`,
    );
  }

  return branch.closeOnClick;
}

function getNavigationMenuFixturePartExports(spec: NavigationMenuSpecializedAdapterSpec): Array<{
  alias: string;
  fileExportName: string;
}> {
  return NAVIGATION_MENU_FIXTURE_PARTS.map((part) => {
    const entry = spec.navigationMenu.namespace.objectEntries.find(
      (candidate) => candidate.part === part,
    );
    if (!entry) {
      throw new Error(
        `${spec.displayName} specialized adapter fixture is missing ${part} namespace entry.`,
      );
    }

    return {
      alias: entry.property,
      fileExportName: getFileExportName(spec, part),
    };
  });
}

function assertScrollAreaFixtureScope(spec: SpecializedAdapterSpec, target: string): void {
  if (spec.component !== "scroll-area") {
    throw new Error(`${spec.displayName} does not have a ${target} specialized adapter fixture.`);
  }

  if (spec.root.runtimeFactory !== "createScrollArea") {
    throw new Error(
      `${spec.displayName} ${target} specialized adapter fixture expects the Scroll Area runtime factory.`,
    );
  }
}

function getPart(spec: SpecializedAdapterSpec, name: string): GenericAdapterPlanPart {
  const part = spec.parts.find((candidate) => candidate.name === name);
  if (!part) {
    throw new Error(`${spec.displayName} specialized adapter fixture is missing ${name} part.`);
  }

  return part;
}

function getFileExportName(spec: SpecializedAdapterSpec, part: string): string {
  const file = spec.files.find((candidate) => candidate.kind === "part" && candidate.part === part);
  if (!file || file.kind !== "part") {
    throw new Error(`${spec.displayName} specialized adapter fixture is missing ${part} file.`);
  }

  return file.exportName;
}

function getPropForPart(spec: SpecializedAdapterSpec, name: string, part: string) {
  const prop = spec.props.find((candidate) => candidate.name === name);
  if (!prop) {
    throw new Error(
      `${spec.displayName} specialized adapter fixture is missing ${part} ${name} prop.`,
    );
  }

  if (!prop.targets?.includes(part)) {
    throw new Error(
      `${spec.displayName} specialized adapter fixture is missing ${part} ${name} prop.`,
    );
  }

  return prop;
}

function getRequiredRole(part: GenericAdapterPlanPart): string {
  if (!part.role) {
    throw new Error(`${part.name} specialized adapter fixture part is missing a required role.`);
  }

  return part.role;
}

function renderScrollAreaOverflowEdgeThresholdType(exportPrefix: "export type" | "type"): string {
  return `${exportPrefix} ScrollAreaOverflowEdgeThreshold =\n  | number\n  | Partial<{\n      xStart: number;\n      xEnd: number;\n      yStart: number;\n      yEnd: number;\n    }>;`;
}

function toExportName(partName: string): string {
  return `ScrollArea${partName.charAt(0).toUpperCase()}${partName.slice(1)}`;
}

function toFileBasename(file: string): string {
  return file.split("/").at(-1) ?? file;
}

function toPartAlias(partName: string): string {
  return `${partName.charAt(0).toUpperCase()}${partName.slice(1)}`;
}

const SELECT_FIXTURE_COMMENT =
  "Non-shipping Select specialized adapter fixture. Do not publish, export, register, or copy into demo dependencies.";

export function printSelectFutureFrameworkTracerSpec(
  spec: SelectSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertSelectFixtureTarget(spec, "Solid");
  const extension = solidFrameworkAdapterReadiness.fileExtension;

  return [
    {
      contents: renderSolidSelectRoot(spec),
      path: `__future-fixtures/solid/select/${getSelectFileExportName(spec, "root")}${extension}`,
    },
    {
      contents: renderSolidSelectTrigger(spec),
      path: `__future-fixtures/solid/select/${getSelectFileExportName(spec, "trigger")}${extension}`,
    },
    {
      contents: renderSolidSelectPortal(spec),
      path: `__future-fixtures/solid/select/${getSelectFileExportName(spec, "portal")}${extension}`,
    },
    {
      contents: renderSolidSelectPopup(spec),
      path: `__future-fixtures/solid/select/${getSelectFileExportName(spec, "popup")}${extension}`,
    },
    {
      contents: renderSolidSelectItem(spec),
      path: `__future-fixtures/solid/select/${getSelectFileExportName(spec, "item")}${extension}`,
    },
    {
      contents: renderSolidSelectItemIndicator(spec),
      path: `__future-fixtures/solid/select/${getSelectFileExportName(spec, "itemIndicator")}${extension}`,
    },
    {
      contents: renderSolidSelectIndex(spec),
      path: "__future-fixtures/solid/select/index.ts",
    },
  ];
}

function renderSolidSelectRoot(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `/* ${SELECT_FIXTURE_COMMENT} */\nimport { ${spec.root.runtimeFactory}, type SelectOpenChangeDetails, type SelectValueChangeDetails } from "${spec.root.runtimeImportSource}";\nimport { createContext, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps, useContext } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type SelectContextValue = {\n  open: () => boolean;\n  value: () => string | null;\n};\n\nexport type SelectItemContextValue = {\n  value: string;\n};\n\nexport const SelectContext = createContext<SelectContextValue>({ open: () => false, value: () => null });\nexport const SelectItemContext = createContext<SelectItemContextValue>({ value: \"\" });\n\nexport function useSelectContext() {\n  return useContext(SelectContext);\n}\n\nexport function useSelectItemContext() {\n  return useContext(SelectItemContext);\n}\n\nexport type SelectRootProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  defaultOpen?: boolean;\n  defaultValue?: string | null;\n  disabled?: boolean;\n  onOpenChange?: (open: boolean, details: SelectOpenChangeDetails) => void;\n  onValueChange?: (value: string | null, details: SelectValueChangeDetails) => void;\n  open?: boolean;\n  value?: string | null;\n};\n\nexport function SelectRoot(allProps: SelectRootProps) {\n  const props = mergeProps({ defaultOpen: false, defaultValue: null, disabled: false }, allProps);\n  const [local, rest] = splitProps(props, [\n    \"children\",\n    \"defaultOpen\",\n    \"defaultValue\",\n    \"disabled\",\n    \"onOpenChange\",\n    \"onValueChange\",\n    \"open\",\n    \"value\",\n  ]);\n  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(local.defaultOpen);\n  const [uncontrolledValue, setUncontrolledValue] = createSignal<string | null>(local.defaultValue);\n  const contextValue = {\n    open: createMemo(() => local.open ?? uncontrolledOpen()),\n    value: createMemo(() => local.value ?? uncontrolledValue()),\n  };\n  let root!: HTMLDivElement;\n  let instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\n  onMount(() => {\n    instance = ${spec.root.runtimeFactory}(root, {\n      defaultOpen: uncontrolledOpen(),\n      defaultValue: uncontrolledValue(),\n      disabled: local.disabled,\n      ...(local.open !== undefined ? { open: local.open } : {}),\n      ...(local.value !== undefined ? { value: local.value } : {}),\n      onOpenChange(open, details) {\n        local.onOpenChange?.(open, details);\n        if (!details.isCanceled && local.open === undefined) {\n          setUncontrolledOpen(open);\n        }\n      },\n      onValueChange(value, details) {\n        local.onValueChange?.(value, details);\n        if (!details.isCanceled && local.value === undefined) {\n          setUncontrolledValue(value);\n        }\n      },\n    });\n\n    onCleanup(() => {\n      instance?.destroy();\n      instance = undefined;\n    });\n  });\n\n  createEffect(() => {\n    const open = local.open;\n    if (open === undefined || !instance || instance.getOpen() === open) return;\n\n    instance.setOpen(open, { emit: false });\n  });\n\n  createEffect(() => {\n    const value = local.value;\n    if (value === undefined || !instance || instance.getValue() === value) return;\n\n    instance.setValue(value, { emit: false });\n  });\n\n  createEffect(() => {\n    instance?.setDisabled(local.disabled);\n  });\n\n  return (\n    <SelectContext.Provider value={contextValue}>\n      <div\n        ref={root}\n        ${attrs.root}\n        data-disabled={local.disabled ? \"\" : undefined}\n        data-state={contextValue.open() ? \"open\" : \"closed\"}\n        {...rest}\n      >\n        <input\n          ${attrs.input}\n          type=\"hidden\"\n          value={contextValue.value() ?? \"\"}\n          aria-hidden=\"true\"\n          tabIndex={-1}\n          readOnly\n        />\n        {local.children}\n      </div>\n    </SelectContext.Provider>\n  );\n}\n\nexport default SelectRoot;\n`;
}

function renderSolidSelectTrigger(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);
  const rootFileExportName = getSelectFileExportName(spec, "root");

  return `/* ${SELECT_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useSelectContext } from "./${rootFileExportName}";\n\nexport type SelectTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;\n\nexport function SelectTrigger(allProps: SelectTriggerProps) {\n  const [local, rest] = splitProps(allProps, [\"children\"]);\n  const select = useSelectContext();\n\n  return (\n    <button\n      ${attrs.trigger}\n      aria-haspopup=\"listbox\"\n      aria-expanded={select.open() ? \"true\" : \"false\"}\n      data-state={select.open() ? \"open\" : \"closed\"}\n      role=\"combobox\"\n      type=\"button\"\n      {...rest}\n    >\n      {local.children}\n    </button>\n  );\n}\n\nexport default SelectTrigger;\n`;
}

function renderSolidSelectPortal(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `/* ${SELECT_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { Portal } from "solid-js/web";\n\nexport type SelectPortalProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function SelectPortal(allProps: SelectPortalProps) {\n  const [local, rest] = splitProps(allProps, [\"children\"]);\n\n  return (\n    <Portal>\n      <div ${attrs.portal} {...rest}>\n        {local.children}\n      </div>\n    </Portal>\n  );\n}\n\nexport default SelectPortal;\n`;
}

function renderSolidSelectPopup(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);
  const rootFileExportName = getSelectFileExportName(spec, "root");

  return `/* ${SELECT_FIXTURE_COMMENT} */\nimport { splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useSelectContext } from "./${rootFileExportName}";\n\nexport type SelectPopupProps = JSX.HTMLAttributes<HTMLDivElement>;\n\nexport function SelectPopup(allProps: SelectPopupProps) {\n  const [local, rest] = splitProps(allProps, [\"children\"]);\n  const select = useSelectContext();\n\n  return (\n    <div\n      ${attrs.popup}\n      role=\"listbox\"\n      tabIndex={-1}\n      data-state={select.open() ? \"open\" : \"closed\"}\n      hidden={!select.open()}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default SelectPopup;\n`;
}

function renderSolidSelectItem(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);
  const rootFileExportName = getSelectFileExportName(spec, "root");

  return `/* ${SELECT_FIXTURE_COMMENT} */\nimport { createMemo, mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { SelectItemContext, useSelectContext } from "./${rootFileExportName}";\n\nexport type SelectItemProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, \"role\"> & {\n  disabled?: boolean;\n  value: string;\n};\n\nexport function SelectItem(allProps: SelectItemProps) {\n  const props = mergeProps({ disabled: false }, allProps);\n  const [local, rest] = splitProps(props, [\"children\", \"disabled\", \"value\"]);\n  const select = useSelectContext();\n  const selected = createMemo(() => select.value() === local.value);\n\n  return (\n    <SelectItemContext.Provider value={{ value: local.value }}>\n      <div\n        ${attrs.item}\n        ${attrs.valueData}={local.value}\n        role=\"option\"\n        aria-selected={selected()}\n        aria-disabled={local.disabled || undefined}\n        data-disabled={local.disabled ? \"\" : undefined}\n        data-selected={selected() ? \"\" : undefined}\n        tabIndex={-1}\n        {...rest}\n      >\n        {local.children}\n      </div>\n    </SelectItemContext.Provider>\n  );\n}\n\nexport default SelectItem;\n`;
}

function renderSolidSelectItemIndicator(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);
  const rootFileExportName = getSelectFileExportName(spec, "root");

  return `/* ${SELECT_FIXTURE_COMMENT} */\nimport { createMemo, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { useSelectContext, useSelectItemContext } from "./${rootFileExportName}";\n\nexport type SelectItemIndicatorProps = JSX.HTMLAttributes<HTMLSpanElement>;\n\nexport function SelectItemIndicator(allProps: SelectItemIndicatorProps) {\n  const [local, rest] = splitProps(allProps, [\"children\"]);\n  const select = useSelectContext();\n  const item = useSelectItemContext();\n  const selected = createMemo(() => select.value() === item.value);\n\n  return (\n    <span\n      ${attrs.itemIndicator}\n      aria-hidden=\"true\"\n      data-state={selected() ? \"checked\" : \"unchecked\"}\n      data-visible={selected() ? \"\" : undefined}\n      data-hidden={selected() ? undefined : \"\"}\n      hidden={!selected()}\n      {...rest}\n    >\n      {local.children}\n    </span>\n  );\n}\n\nexport default SelectItemIndicator;\n`;
}

function renderSolidSelectIndex(spec: SelectSpecializedAdapterSpec): string {
  const rootFileExportName = getSelectFileExportName(spec, "root");

  return `// ${SELECT_FIXTURE_COMMENT}\n${getSelectFixturePartExports(spec)
    .map(
      ({ alias, fileExportName }) => `export { default as ${alias} } from "./${fileExportName}";`,
    )
    .join(
      "\n",
    )}\nexport { SelectContext, SelectItemContext, useSelectContext, useSelectItemContext } from "./${rootFileExportName}";\n`;
}

function assertSelectFixtureTarget(spec: SelectSpecializedAdapterSpec, target: string): void {
  assertSelectSpecializedAdapterSpec(spec);

  if (spec.root.runtimeFactory !== "createSelect") {
    throw new Error(
      `Select ${target} specialized adapter fixture expects root runtimeFactory "createSelect".`,
    );
  }

  if (spec.select.floating.portalPart !== "portal") {
    throw new Error(
      `Select ${target} specialized adapter fixture only supports portalPart "portal".`,
    );
  }
}
