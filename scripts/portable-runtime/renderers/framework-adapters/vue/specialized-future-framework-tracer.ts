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
  type SelectSpecializedAdapterSpec,
} from "../../specialized-adapter-spec/select-specialized-adapter-spec.js";
import type {
  SpecializedAdapterSpec,
  SpecializedAdapterSpecPrintedFile,
} from "../../specialized-adapter-spec/types.js";
import { vueFrameworkAdapterReadiness } from "./adapter.js";
import { projectVueDetailedEvent, projectVueModel } from "./public-contract.js";

const COMBOBOX_FIXTURE_COMMENT =
  "Non-shipping, unsupported, non-normative Vue Combobox specialized adapter tracer fixture. Do not publish, export, register, or copy into demo dependencies.";
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
  "Non-shipping, unsupported, non-normative Vue Menu specialized adapter tracer fixture. Do not publish, export, register, or copy into demo dependencies.";
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
  "Non-shipping, unsupported, non-normative Vue Navigation Menu specialized adapter tracer fixture. Do not publish, export, register, or copy into demo dependencies.";
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
    return printVueComboboxSpecializedAdapterSpecFixture(spec);
  }
  if (isMenuSpecializedAdapterSpec(spec)) {
    return printVueMenuSpecializedAdapterSpecFixture(spec);
  }
  if (isNavigationMenuSpecializedAdapterSpec(spec)) {
    return printVueNavigationMenuSpecializedAdapterSpecFixture(spec);
  }

  if (spec.component === "scroll-area") {
    throw new Error(
      "ScrollArea is supported by real Vue output and is not a future-framework tracer fixture.",
    );
  }
  throw new Error(`${spec.displayName} does not have a Vue specialized adapter fixture.`);
}

function printVueComboboxSpecializedAdapterSpecFixture(
  spec: ComboboxSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertComboboxFixtureTarget(spec, "Vue");
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return hardenComboboxFixtures([
    ...COMBOBOX_FIXTURE_PARTS.map((part) => ({
      contents: renderVueComboboxPart(spec, part),
      path: `__future-fixtures/vue/combobox/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderVueComboboxIndex(spec),
      path: "__future-fixtures/vue/combobox/index.ts",
    },
  ]);
}

function printVueMenuSpecializedAdapterSpecFixture(
  spec: MenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertMenuFixtureTarget(spec, "Vue");
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return hardenMenuFixtures([
    ...MENU_FIXTURE_PARTS.map((part) => ({
      contents: renderVueMenuPart(spec, part),
      path: `__future-fixtures/vue/menu/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderVueMenuIndex(spec, extension),
      path: "__future-fixtures/vue/menu/index.ts",
    },
  ]);
}

function printVueNavigationMenuSpecializedAdapterSpecFixture(
  spec: NavigationMenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertNavigationMenuFixtureTarget(spec, "Vue");
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return hardenNavigationMenuFixtures([
    ...NAVIGATION_MENU_FIXTURE_PARTS.map((part) => ({
      contents: renderVueNavigationMenuPart(spec, part),
      path: `__future-fixtures/vue/navigation-menu/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderVueNavigationMenuIndex(spec),
      path: "__future-fixtures/vue/navigation-menu/index.ts",
    },
  ]);
}

function hardenComboboxFixtures(
  files: SpecializedAdapterSpecPrintedFile[],
): SpecializedAdapterSpecPrintedFile[] {
  const inputValue = projectVueModel("inputValue");
  const open = projectVueModel("open");
  const value = projectVueModel("value");
  const inputValueDetailed = projectVueDetailedEvent("onInputValueChange");
  const openDetailed = projectVueDetailedEvent("onOpenChange");
  const valueDetailed = projectVueDetailedEvent("onValueChange");
  return [
    ...files.map((file) => ({
      ...file,
      contents: hardenContexts(
        file.path.endsWith("/ComboboxRoot.vue")
          ? file.contents
              .replace("    value?: string | null;", "    modelValue?: string | null;")
              .replaceAll("props.value", "props.modelValue")
              .replace(
                "const renderedValue = computed(() => props.modelValue ?? uncontrolledValue.value);",
                "const renderedValue = computed(() => props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value);",
              )
          : file.contents,
        "combobox",
      )
        .replace(
          "  valueChange: [value: string | null, details: ComboboxValueChangeDetails];\n}>();",
          `  valueChange: [value: string | null, details: ComboboxValueChangeDetails];\n  "${inputValue.updateEvent}": [inputValue: string];\n  "${open.updateEvent}": [open: boolean];\n  "${value.updateEvent}": [value: string | null];\n}>();`,
        )
        .replace(
          "      if (!details.isCanceled && props.inputValue === undefined) {\n        uncontrolledInputValue.value = inputValue;\n      }",
          `      if (details.isCanceled) return;\n      if (props.inputValue === undefined) {\n        uncontrolledInputValue.value = inputValue;\n      }\n      emit("${inputValue.updateEvent}", inputValue);`,
        )
        .replace(
          "      if (!details.isCanceled && props.open === undefined) {\n        uncontrolledOpen.value = open;\n      }",
          `      if (details.isCanceled) return;\n      if (props.open === undefined) {\n        uncontrolledOpen.value = open;\n      }\n      emit("${open.updateEvent}", open);`,
        )
        .replace(
          "      if (!details.isCanceled && props.modelValue === undefined) {\n        uncontrolledValue.value = value;\n      }",
          `      if (details.isCanceled) return;\n      if (props.modelValue === undefined) {\n        uncontrolledValue.value = value;\n      }\n      emit("${value.updateEvent}", value);`,
        )
        .replaceAll("  inputValueChange:", `  ${inputValueDetailed.emit}:`)
        .replaceAll("  openChange:", `  ${openDetailed.emit}:`)
        .replaceAll("  valueChange:", `  ${valueDetailed.emit}:`)
        .replaceAll('"inputValueChange"', `"${inputValueDetailed.emit}"`)
        .replaceAll('"openChange"', `"${openDetailed.emit}"`)
        .replaceAll('"valueChange"', `"${valueDetailed.emit}"`),
    })),
    {
      contents: renderComboboxContext(),
      path: "__future-fixtures/vue/combobox/ComboboxContext.ts",
    },
  ];
}

function hardenMenuFixtures(
  files: SpecializedAdapterSpecPrintedFile[],
): SpecializedAdapterSpecPrintedFile[] {
  const open = projectVueModel("open");
  const checked = projectVueModel("checked");
  const value = projectVueModel("value");
  const openDetailed = projectVueDetailedEvent("onOpenChange");
  const checkedDetailed = projectVueDetailedEvent("onCheckedChange");
  const valueDetailed = projectVueDetailedEvent("onValueChange");
  return [
    ...files.map((file) => ({
      ...file,
      contents: hardenContexts(
        file.path.endsWith("/MenuRadioGroup.vue")
          ? file.contents
              .replace("    value?: string;", "    modelValue?: string;")
              .replaceAll("props.value", "props.modelValue")
          : file.contents,
        "menu",
      )
        .replace(
          "  closeComplete: [details: MenuCloseCompleteDetails];\n}>();",
          `  closeComplete: [details: MenuCloseCompleteDetails];\n  "${open.updateEvent}": [open: boolean];\n}>();`,
        )
        .replace(
          "      if (!details.isCanceled && props.open === undefined) {\n        uncontrolledOpen.value = open;\n      }",
          `      if (details.isCanceled) return;\n      if (props.open === undefined) {\n        uncontrolledOpen.value = open;\n      }\n      emit("${open.updateEvent}", open);`,
        )
        .replace(
          "  checkedChange: [checked: boolean, details: MenuCheckedChangeDetails];\n}>();",
          `  checkedChange: [checked: boolean, details: MenuCheckedChangeDetails];\n  "${checked.updateEvent}": [checked: boolean];\n}>();`,
        )
        .replace(
          "  if (!details.isCanceled && props.checked === undefined) {\n    uncontrolledChecked.value = details.checked;\n  }",
          `  if (details.isCanceled) return;\n  if (props.checked === undefined) {\n    uncontrolledChecked.value = details.checked;\n  }\n  emit("${checked.updateEvent}", details.checked);`,
        )
        .replace(
          "  valueChange: [value: string, details: MenuValueChangeDetails];\n}>();",
          `  valueChange: [value: string, details: MenuValueChangeDetails];\n  "${value.updateEvent}": [value: string];\n}>();`,
        )
        .replace(
          "  if (!details.isCanceled && props.modelValue === undefined) {\n    uncontrolledValue.value = details.value;\n  }",
          `  if (details.isCanceled) return;\n  if (props.modelValue === undefined) {\n    uncontrolledValue.value = details.value;\n  }\n  emit("${value.updateEvent}", details.value);`,
        )
        .replaceAll("  openChange:", `  ${openDetailed.emit}:`)
        .replaceAll("  checkedChange:", `  ${checkedDetailed.emit}:`)
        .replaceAll("  valueChange:", `  ${valueDetailed.emit}:`)
        .replaceAll('"openChange"', `"${openDetailed.emit}"`)
        .replaceAll('"checkedChange"', `"${checkedDetailed.emit}"`)
        .replaceAll('"valueChange"', `"${valueDetailed.emit}"`),
    })),
    { contents: renderMenuContext(), path: "__future-fixtures/vue/menu/MenuContext.ts" },
  ];
}

function hardenNavigationMenuFixtures(
  files: SpecializedAdapterSpecPrintedFile[],
): SpecializedAdapterSpecPrintedFile[] {
  const value = projectVueModel("value");
  const valueDetailed = projectVueDetailedEvent("onValueChange");
  return [
    ...files.map((file) => ({
      ...file,
      contents: hardenContexts(
        file.path.endsWith("/NavigationMenuRoot.vue")
          ? file.contents
              .replace("    value?: string | null;", "    modelValue?: string | null;")
              .replaceAll("props.value", "props.modelValue")
              .replace(
                "const renderedValue = computed(() => props.modelValue ?? uncontrolledValue.value);",
                "const renderedValue = computed(() => props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value);",
              )
          : file.contents,
        "navigation-menu",
      )
        .replace(
          "  valueChange: [value: string | null, details: NavigationMenuValueChangeDetails];\n}>();",
          `  valueChange: [value: string | null, details: NavigationMenuValueChangeDetails];\n  "${value.updateEvent}": [value: string | null];\n}>();`,
        )
        .replace(
          "      if (!details.isCanceled && props.modelValue === undefined) {\n        uncontrolledValue.value = value;\n      }",
          `      if (details.isCanceled) return;\n      if (props.modelValue === undefined) {\n        uncontrolledValue.value = value;\n      }\n      emit("${value.updateEvent}", value);`,
        )
        .replaceAll("  valueChange:", `  ${valueDetailed.emit}:`)
        .replaceAll('"valueChange"', `"${valueDetailed.emit}"`),
    })),
    {
      contents: renderNavigationMenuContext(),
      path: "__future-fixtures/vue/navigation-menu/NavigationMenuContext.ts",
    },
  ];
}

function hardenContexts(source: string, family: "combobox" | "menu" | "navigation-menu"): string {
  const definitions = CONTEXT_DEFINITIONS.filter((entry) => entry.family === family);
  let hardened = source;
  const used = definitions.filter((entry) => hardened.includes(`"${entry.legacyKey}"`));
  if (used.length === 0) return hardened;

  const moduleName =
    family === "combobox"
      ? "ComboboxContext"
      : family === "menu"
        ? "MenuContext"
        : "NavigationMenuContext";
  hardened = hardened.replace(
    '<script setup lang="ts">',
    `<script setup lang="ts">\nimport { ${used.flatMap((entry) => [entry.key, entry.use]).join(", ")} } from "./${moduleName}";`,
  );
  for (const entry of used) {
    hardened = hardened.replaceAll(`provide("${entry.legacyKey}",`, `provide(${entry.key},`);
    hardened = hardened.replace(
      new RegExp(`inject\\("${entry.legacyKey}"(?:, undefined)?\\) as[\\s\\S]*?;`),
      `${entry.use}("${entry.part}")`,
    );
  }
  return hardened;
}

const CONTEXT_DEFINITIONS = [
  {
    family: "combobox",
    legacyKey: "starwind-combobox-root",
    key: "comboboxRootContextKey",
    use: "useComboboxRootContext",
    part: "Combobox child",
  },
  {
    family: "combobox",
    legacyKey: "starwind-combobox-item",
    key: "comboboxItemContextKey",
    use: "useComboboxItemContext",
    part: "Combobox.ItemIndicator",
  },
  {
    family: "menu",
    legacyKey: "starwind-menu-root",
    key: "menuRootContextKey",
    use: "useMenuRootContext",
    part: "Menu.Trigger",
  },
  {
    family: "menu",
    legacyKey: "starwind-menu-checkbox-item",
    key: "menuCheckboxItemContextKey",
    use: "useMenuCheckboxItemContext",
    part: "Menu.CheckboxItemIndicator",
  },
  {
    family: "menu",
    legacyKey: "starwind-menu-radio-group",
    key: "menuRadioGroupContextKey",
    use: "useMenuRadioGroupContext",
    part: "Menu.RadioItem",
  },
  {
    family: "menu",
    legacyKey: "starwind-menu-radio-item",
    key: "menuRadioItemContextKey",
    use: "useMenuRadioItemContext",
    part: "Menu.RadioItemIndicator",
  },
  {
    family: "menu",
    legacyKey: "starwind-menu-submenu-root",
    key: "menuSubmenuRootContextKey",
    use: "useMenuSubmenuRootContext",
    part: "Menu.SubmenuTrigger",
  },
  {
    family: "navigation-menu",
    legacyKey: "starwind-navigation-menu-root",
    key: "navigationMenuRootContextKey",
    use: "useNavigationMenuRootContext",
    part: "NavigationMenu child",
  },
  {
    family: "navigation-menu",
    legacyKey: "starwind-navigation-menu-item",
    key: "navigationMenuItemContextKey",
    use: "useNavigationMenuItemContext",
    part: "NavigationMenu item child",
  },
] as const;

function renderComboboxContext(): string {
  return `// Non-shipping, unsupported, non-normative Vue tracer context.
import { inject, type ComputedRef, type InjectionKey, type Ref } from "vue";
export type ComboboxRootContext = { input: Ref<HTMLInputElement | null>; inputValue: ComputedRef<string>; open: ComputedRef<boolean>; value: ComputedRef<string | null> };
export type ComboboxItemContext = { selected: ComputedRef<boolean>; value: string };
export const comboboxRootContextKey: InjectionKey<ComboboxRootContext> = Symbol("StarwindComboboxRoot");
export const comboboxItemContextKey: InjectionKey<ComboboxItemContext> = Symbol("StarwindComboboxItem");
export function useComboboxRootContext(part: string): ComboboxRootContext { const value = inject(comboboxRootContextKey); if (!value) throw new Error(\`${"${part}"} must be used within Combobox.Root.\`); return value; }
export function useComboboxItemContext(part: string): ComboboxItemContext { const value = inject(comboboxItemContextKey); if (!value) throw new Error(\`${"${part}"} must be used within Combobox.Item.\`); return value; }
`;
}

function renderMenuContext(): string {
  return `// Non-shipping, unsupported, non-normative Vue tracer context.
import { inject, type ComputedRef, type InjectionKey, type Ref } from "vue";
export type MenuRootContext = { open: ComputedRef<boolean>; root: Ref<HTMLDivElement | null> };
export type MenuCheckedContext = { checked: ComputedRef<boolean> };
export type MenuValueContext = { value: ComputedRef<string | undefined> };
export type MenuSubmenuContext = { open: ComputedRef<boolean>; root: Ref<HTMLDivElement | null> };
export const menuRootContextKey: InjectionKey<MenuRootContext> = Symbol("StarwindMenuRoot");
export const menuCheckboxItemContextKey: InjectionKey<MenuCheckedContext> = Symbol("StarwindMenuCheckboxItem");
export const menuRadioGroupContextKey: InjectionKey<MenuValueContext> = Symbol("StarwindMenuRadioGroup");
export const menuRadioItemContextKey: InjectionKey<MenuCheckedContext> = Symbol("StarwindMenuRadioItem");
export const menuSubmenuRootContextKey: InjectionKey<MenuSubmenuContext> = Symbol("StarwindMenuSubmenuRoot");
function required<T>(value: T | undefined, part: string, root: string): T { if (!value) throw new Error(\`${"${part}"} must be used within ${"${root}"}.\`); return value; }
export const useMenuRootContext = (part: string) => required(inject(menuRootContextKey), part, "Menu.Root");
export const useMenuCheckboxItemContext = (part: string) => required(inject(menuCheckboxItemContextKey), part, "Menu.CheckboxItem");
export const useMenuRadioGroupContext = (part: string) => required(inject(menuRadioGroupContextKey), part, "Menu.RadioGroup");
export const useMenuRadioItemContext = (part: string) => required(inject(menuRadioItemContextKey), part, "Menu.RadioItem");
export const useMenuSubmenuRootContext = (part: string) => required(inject(menuSubmenuRootContextKey), part, "Menu.SubmenuRoot");
`;
}

function renderNavigationMenuContext(): string {
  return `// Non-shipping, unsupported, non-normative Vue tracer context.
import { inject, type ComputedRef, type InjectionKey, type Ref } from "vue";
export type NavigationMenuRootContext = { orientation: ComputedRef<"horizontal" | "vertical">; root: Ref<HTMLElement | null>; value: ComputedRef<string | null> };
export type NavigationMenuItemContext = { open: ComputedRef<boolean>; value: string };
export const navigationMenuRootContextKey: InjectionKey<NavigationMenuRootContext> = Symbol("StarwindNavigationMenuRoot");
export const navigationMenuItemContextKey: InjectionKey<NavigationMenuItemContext> = Symbol("StarwindNavigationMenuItem");
function required<T>(value: T | undefined, part: string, root: string): T { if (!value) throw new Error(\`${"${part}"} must be used within ${"${root}"}.\`); return value; }
export const useNavigationMenuRootContext = (part: string) => required(inject(navigationMenuRootContextKey), part, "NavigationMenu.Root");
export const useNavigationMenuItemContext = (part: string) => required(inject(navigationMenuItemContextKey), part, "NavigationMenu.Item");
`;
}

function renderVueComboboxPart(
  spec: ComboboxSpecializedAdapterSpec,
  part: (typeof COMBOBOX_FIXTURE_PARTS)[number],
): string {
  switch (part) {
    case "root":
      return renderVueComboboxRoot(spec);
    case "input":
      return renderVueComboboxInput(spec);
    case "trigger":
      return renderVueComboboxTrigger(spec);
    case "clear":
      return renderVueComboboxClear(spec);
    case "portal":
      return renderVueComboboxPortal(spec);
    case "positioner":
      return renderVueComboboxPositioner(spec);
    case "popup":
      return renderVueComboboxPopup(spec);
    case "item":
      return renderVueComboboxItem(spec);
    case "itemText":
      return renderVueComboboxItemText(spec);
    case "itemIndicator":
      return renderVueComboboxItemIndicator(spec);
    case "label":
    case "inputGroup":
    case "icon":
    case "value":
    case "empty":
    case "list":
    case "group":
    case "groupLabel":
    case "separator":
      return renderVueComboboxStaticPart(spec, part);
  }
}

function renderVueComboboxRoot(spec: ComboboxSpecializedAdapterSpec): string {
  const root = getPart(spec, "root");
  const hiddenInput = getPart(spec, "hiddenInput");
  const inputValueEvent = getComboboxEvent(spec, "inputValueChange");
  const openEvent = getComboboxEvent(spec, "openChange");
  const valueEvent = getComboboxEvent(spec, "valueChange");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { ${spec.root.runtimeFactory}, type ${inputValueEvent.detailsType}, type ${openEvent.detailsType}, type ${valueEvent.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    autoComplete?: string;\n    defaultInputValue?: string;\n    defaultOpen?: boolean;\n    defaultValue?: string | null;\n    disabled?: boolean;\n    filterMode?: "contains" | "startsWith";\n    form?: string;\n    highlightItemOnHover?: boolean;\n    inputValue?: string;\n    locale?: string;\n    name?: string;\n    open?: boolean;\n    readOnly?: boolean;\n    required?: boolean;\n    value?: string | null;\n  }>(),\n  {\n    defaultInputValue: "",\n    defaultOpen: false,\n    defaultValue: null,\n    disabled: false,\n    filterMode: "contains",\n    highlightItemOnHover: true,\n    readOnly: false,\n  },\n);\n\nconst emit = defineEmits<{\n  inputValueChange: [inputValue: string, details: ${inputValueEvent.detailsType}];\n  openChange: [open: boolean, details: ${openEvent.detailsType}];\n  valueChange: [value: string | null, details: ${valueEvent.detailsType}];\n}>();\n\nconst root = ref<HTMLDivElement | null>(null);\nconst input = ref<HTMLInputElement | null>(null);\nconst uncontrolledInputValue = ref(props.defaultInputValue);\nconst uncontrolledOpen = ref(props.defaultOpen);\nconst uncontrolledValue = ref<string | null>(props.defaultValue);\nconst renderedInputValue = computed(() => props.inputValue ?? uncontrolledInputValue.value);\nconst renderedOpen = computed(() => props.open ?? uncontrolledOpen.value);\nconst renderedValue = computed(() => props.value ?? uncontrolledValue.value);\nlet instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\nconst comboboxContext = {\n  input,\n  inputValue: renderedInputValue,\n  open: renderedOpen,\n  value: renderedValue,\n};\n\nprovide("starwind-combobox-root", comboboxContext);\n\nfunction setup() {\n  instance?.destroy();\n  if (!root.value) {\n    instance = undefined;\n    return;\n  }\n\n  instance = ${spec.root.runtimeFactory}(root.value, {\n    autoComplete: props.autoComplete,\n    defaultInputValue: uncontrolledInputValue.value,\n    defaultOpen: uncontrolledOpen.value,\n    defaultValue: uncontrolledValue.value,\n    disabled: props.disabled,\n    filterMode: props.filterMode,\n    form: props.form,\n    highlightItemOnHover: props.highlightItemOnHover,\n    locale: props.locale,\n    name: props.name,\n    readOnly: props.readOnly,\n    required: props.required,\n    ...(props.inputValue !== undefined ? { inputValue: props.inputValue } : {}),\n    ...(props.open !== undefined ? { open: props.open } : {}),\n    ...(props.value !== undefined ? { value: props.value } : {}),\n    ${inputValueEvent.callbackProp}(inputValue, details) {\n      emit("inputValueChange", inputValue, details);\n      if (!details.isCanceled && props.inputValue === undefined) {\n        uncontrolledInputValue.value = inputValue;\n      }\n    },\n    ${openEvent.callbackProp}(open, details) {\n      emit("openChange", open, details);\n      if (!details.isCanceled && props.open === undefined) {\n        uncontrolledOpen.value = open;\n      }\n    },\n    ${valueEvent.callbackProp}(value, details) {\n      emit("valueChange", value, details);\n      if (!details.isCanceled && props.value === undefined) {\n        uncontrolledValue.value = value;\n      }\n    },\n  });\n}\n\nonMounted(() => {\n  setup();\n});\n\nwatch(\n  () => props.inputValue,\n  (inputValue) => {\n    if (inputValue === undefined || !instance || instance.getInputValue() === inputValue) return;\n\n    instance.setInputValue(inputValue, { emit: false, filter: false });\n  },\n);\n\nwatch(\n  () => props.open,\n  (open) => {\n    if (open === undefined || !instance || instance.getOpen() === open) return;\n\n    instance.setOpen(open, { emit: false });\n  },\n);\n\nwatch(\n  () => props.value,\n  (value) => {\n    if (value === undefined || !instance || instance.getValue() === value) return;\n\n    instance.setValue(value, { emit: false });\n  },\n);\n\nwatch(\n  () => [props.autoComplete, props.form, props.name, props.required] as const,\n  () => {\n    instance?.setFormOptions?.({\n      autoComplete: props.autoComplete,\n      form: props.form,\n      name: props.name,\n      required: props.required,\n    });\n  },\n);\n\nonBeforeUnmount(() => {\n  instance?.destroy();\n  instance = undefined;\n});\n</script>\n\n<template>\n  <div\n    ${root.discoveryAttribute}\n    :data-autocomplete="props.autoComplete"\n    :data-default-input-value="props.inputValue === undefined ? props.defaultInputValue : undefined"\n    :data-default-open="props.open === undefined && props.defaultOpen ? 'true' : undefined"\n    :data-default-value="props.value === undefined ? props.defaultValue : undefined"\n    :data-disabled="props.disabled ? '' : undefined"\n    :data-filter-mode="props.filterMode"\n    :data-form="props.form"\n    :data-highlight-item-on-hover="props.highlightItemOnHover ? 'true' : 'false'"\n    :data-input-value="renderedInputValue"\n    :data-locale="props.locale"\n    :data-name="props.name"\n    :data-readonly="props.readOnly ? '' : undefined"\n    :data-required="props.required ? '' : undefined"\n    :data-state="renderedOpen ? 'open' : 'closed'"\n    ref="root"\n    v-bind="$attrs"\n  >\n    <input\n      ${hiddenInput.discoveryAttribute}\n      type="hidden"\n      :form="props.form"\n      :name="props.name"\n      :value="renderedValue ?? ''"\n      aria-hidden="true"\n      tabindex="-1"\n    />\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueComboboxInput(spec: ComboboxSpecializedAdapterSpec): string {
  const input = getPart(spec, "input");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject, onBeforeUnmount, onMounted, ref } from "vue";\n\nconst combobox = inject("starwind-combobox-root") as {\n  input: { value: HTMLInputElement | null };\n  inputValue: { value: string };\n  open: { value: boolean };\n};\nconst input = ref<HTMLInputElement | null>(null);\n\nonMounted(() => {\n  combobox.input.value = input.value;\n});\n\nonBeforeUnmount(() => {\n  if (combobox.input.value === input.value) {\n    combobox.input.value = null;\n  }\n});\n</script>\n\n<template>\n  <input\n    ${input.discoveryAttribute}\n    role="${getRequiredRole(input)}"\n    aria-autocomplete="list"\n    :aria-expanded="combobox.open.value ? 'true' : 'false'"\n    autocomplete="off"\n    :value="combobox.inputValue.value"\n    ref="input"\n    v-bind="$attrs"\n  />\n</template>\n`;
}

function renderVueComboboxTrigger(spec: ComboboxSpecializedAdapterSpec): string {
  const trigger = getPart(spec, "trigger");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\nconst combobox = inject("starwind-combobox-root") as {\n  open: { value: boolean };\n};\n</script>\n\n<template>\n  <button\n    ${trigger.discoveryAttribute}\n    type="button"\n    aria-haspopup="listbox"\n    :aria-expanded="combobox.open.value ? 'true' : 'false'"\n    :data-state="combobox.open.value ? 'open' : 'closed'"\n    v-bind="$attrs"\n  >\n    <slot />\n  </button>\n</template>\n`;
}

function renderVueComboboxClear(spec: ComboboxSpecializedAdapterSpec): string {
  const clear = getPart(spec, "clear");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<template>\n  <button ${clear.discoveryAttribute} type="${spec.combobox.clearAction.typeAttribute.value}" v-bind="$attrs">\n    <slot />\n  </button>\n</template>\n`;
}

function renderVueComboboxPortal(spec: ComboboxSpecializedAdapterSpec): string {
  const portal = getPart(spec, "portal");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<template>\n  <Teleport to="body">\n    <div ${portal.discoveryAttribute} v-bind="$attrs">\n      <slot />\n    </div>\n  </Teleport>\n</template>\n`;
}

function renderVueComboboxPositioner(spec: ComboboxSpecializedAdapterSpec): string {
  const positioner = getPart(spec, "positioner");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    side?: "top" | "right" | "bottom" | "left";\n    align?: "start" | "center" | "end";\n    sideOffset?: number;\n    alignOffset?: number;\n    avoidCollisions?: boolean;\n  }>(),\n  {\n    side: "bottom",\n    align: "start",\n    sideOffset: 4,\n    alignOffset: 0,\n    avoidCollisions: true,\n  },\n);\n</script>\n\n<template>\n  <div\n    ${positioner.discoveryAttribute}\n    :data-side="props.side"\n    :data-align="props.align"\n    :data-side-offset="props.sideOffset"\n    :data-align-offset="props.alignOffset"\n    :data-avoid-collisions="props.avoidCollisions ? 'true' : 'false'"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueComboboxPopup(spec: ComboboxSpecializedAdapterSpec): string {
  const popup = getPart(spec, "popup");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\nconst combobox = inject("starwind-combobox-root") as {\n  open: { value: boolean };\n};\n</script>\n\n<template>\n  <div\n    ${popup.discoveryAttribute}\n    role="${getRequiredRole(popup)}"\n    tabindex="-1"\n    :data-state="combobox.open.value ? 'open' : 'closed'"\n    :hidden="!combobox.open.value"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueComboboxItem(spec: ComboboxSpecializedAdapterSpec): string {
  const item = getPart(spec, "item");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject, provide } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    disabled?: boolean;\n    value: string;\n  }>(),\n  {\n    disabled: false,\n  },\n);\nconst combobox = inject("starwind-combobox-root") as {\n  value: { value: string | null };\n};\nconst selected = computed(() => combobox.value.value === props.value);\nconst comboboxItemContext = { value: props.value, selected };\n\nprovide("starwind-combobox-item", comboboxItemContext);\n</script>\n\n<template>\n  <div\n    ${item.discoveryAttribute}\n    :data-value="props.value"\n    role="${getRequiredRole(item)}"\n    :aria-selected="selected ? 'true' : 'false'"\n    :aria-disabled="props.disabled ? 'true' : undefined"\n    :data-disabled="props.disabled ? '' : undefined"\n    :data-selected="selected ? '' : undefined"\n    tabindex="-1"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueComboboxItemText(spec: ComboboxSpecializedAdapterSpec): string {
  const itemText = getPart(spec, "itemText");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<template>\n  <span ${itemText.discoveryAttribute} v-bind="$attrs">\n    <slot />\n  </span>\n</template>\n`;
}

function renderVueComboboxItemIndicator(spec: ComboboxSpecializedAdapterSpec): string {
  const indicator = getPart(spec, "itemIndicator");

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst item = inject("starwind-combobox-item") as {\n  selected: { value: boolean };\n};\nconst selected = computed(() => item.selected.value);\n</script>\n\n<template>\n  <span\n    ${indicator.discoveryAttribute}\n    aria-hidden="true"\n    :data-state="selected ? 'checked' : 'unchecked'"\n    :data-hidden="selected ? undefined : ''"\n    :hidden="!selected"\n    v-bind="$attrs"\n  >\n    <slot />\n  </span>\n</template>\n`;
}

function renderVueComboboxStaticPart(
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
  const role = part.role ? `\n    role="${part.role}"` : "";
  const hidden = partName === "empty" ? "\n    hidden" : "";
  const ariaHidden = partName === "icon" ? '\n    aria-hidden="true"' : "";
  const ariaOrientation = partName === "separator" ? '\n    aria-orientation="horizontal"' : "";

  return `<!-- ${COMBOBOX_FIXTURE_COMMENT} -->\n<template>\n  <${tag}\n    ${part.discoveryAttribute}${role}${ariaHidden}${ariaOrientation}${hidden}\n    v-bind="$attrs"\n  >\n    <slot />\n  </${tag}>\n</template>\n`;
}

function renderVueComboboxIndex(spec: ComboboxSpecializedAdapterSpec): string {
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return `// ${COMBOBOX_FIXTURE_COMMENT}\n${getComboboxFixturePartExports(spec)
    .map(
      ({ alias, fileExportName }) =>
        `export { default as ${alias} } from "./${fileExportName}${extension}";`,
    )
    .join("\n")}\n`;
}

function renderVueNavigationMenuPart(
  spec: NavigationMenuSpecializedAdapterSpec,
  part: (typeof NAVIGATION_MENU_FIXTURE_PARTS)[number],
): string {
  switch (part) {
    case "root":
      return renderVueNavigationMenuRoot(spec);
    case "list":
      return renderVueNavigationMenuList(spec);
    case "item":
      return renderVueNavigationMenuItem(spec);
    case "trigger":
      return renderVueNavigationMenuTrigger(spec);
    case "icon":
      return renderVueNavigationMenuIcon(spec);
    case "content":
      return renderVueNavigationMenuContent(spec);
    case "link":
      return renderVueNavigationMenuLink(spec);
    case "portal":
      return renderVueNavigationMenuPortal(spec);
    case "positioner":
      return renderVueNavigationMenuPositioner(spec);
    case "popup":
      return renderVueNavigationMenuPopup(spec);
    case "viewport":
      return renderVueNavigationMenuViewport(spec);
    case "arrow":
      return renderVueNavigationMenuArrow(spec);
  }
}

function renderVueMenuPart(
  spec: MenuSpecializedAdapterSpec,
  part: (typeof MENU_FIXTURE_PARTS)[number],
): string {
  switch (part) {
    case "root":
      return renderVueMenuRoot(spec);
    case "trigger":
      return renderVueMenuTrigger(spec);
    case "portal":
      return renderVueMenuPortal(spec);
    case "positioner":
      return renderVueMenuFloatingPart(spec, "positioner");
    case "popup":
      return renderVueMenuFloatingPart(spec, "popup");
    case "item":
      return renderVueMenuActionItem(spec);
    case "linkItem":
      return renderVueMenuLinkItem(spec);
    case "checkboxItem":
      return renderVueMenuCheckboxItem(spec);
    case "checkboxItemIndicator":
      return renderVueMenuCheckboxItemIndicator(spec);
    case "radioGroup":
      return renderVueMenuRadioGroup(spec);
    case "radioItem":
      return renderVueMenuRadioItem(spec);
    case "radioItemIndicator":
      return renderVueMenuRadioItemIndicator(spec);
    case "group":
    case "label":
    case "separator":
    case "shortcut":
      return renderVueMenuStaticPart(spec, part);
    case "submenuRoot":
      return renderVueMenuSubmenuRoot(spec);
    case "submenuTrigger":
      return renderVueMenuSubmenuTrigger(spec);
  }
}

function renderVueMenuRoot(spec: MenuSpecializedAdapterSpec): string {
  const root = getPart(spec, "root");
  const openEvent = spec.menu.events.openChange;
  const closeEvent = spec.menu.events.closeComplete;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { ${spec.root.runtimeFactory}, type ${closeEvent.detailsType}, type ${openEvent.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    ${spec.menu.openState.defaultProp}?: boolean;\n    disabled?: boolean;\n    ${spec.menu.openState.controlledProp}?: boolean;\n    openOnHover?: boolean;\n    closeDelay?: number;\n  }>(),\n  {\n    ${spec.menu.openState.defaultProp}: false,\n    disabled: false,\n    openOnHover: false,\n    closeDelay: 200,\n  },\n);\n\nconst emit = defineEmits<{\n  ${openEvent.name}: [${openEvent.valueProperty}: boolean, details: ${openEvent.detailsType}];\n  ${closeEvent.name}: [details: ${closeEvent.detailsType}];\n}>();\n\nconst root = ref<HTMLDivElement | null>(null);\nconst uncontrolledOpen = ref(props.${spec.menu.openState.defaultProp});\nconst renderedOpen = computed(() => props.${spec.menu.openState.controlledProp} ?? uncontrolledOpen.value);\nlet instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\nconst menuRootContext = {\n  open: renderedOpen,\n  root,\n};\n\nprovide("starwind-menu-root", menuRootContext);\n\nfunction setup() {\n  instance?.destroy();\n  if (!root.value) {\n    instance = undefined;\n    return;\n  }\n\n  instance = ${spec.root.runtimeFactory}(root.value, {\n    ${spec.menu.openState.defaultProp}: uncontrolledOpen.value,\n    disabled: props.disabled,\n    openOnHover: props.openOnHover,\n    closeDelay: props.closeDelay,\n    ...(props.${spec.menu.openState.controlledProp} !== undefined ? { ${spec.menu.openState.controlledProp}: props.${spec.menu.openState.controlledProp} } : {}),\n    ${openEvent.callbackProp}(${openEvent.valueProperty}, details) {\n      emit("${openEvent.name}", ${openEvent.valueProperty}, details);\n      if (!details.isCanceled && props.${spec.menu.openState.controlledProp} === undefined) {\n        uncontrolledOpen.value = ${openEvent.valueProperty};\n      }\n    },\n    ${closeEvent.callbackProp}(details) {\n      emit("${closeEvent.name}", details);\n    },\n  });\n}\n\nonMounted(() => {\n  setup();\n});\n\nwatch(\n  () => props.${spec.menu.openState.controlledProp},\n  (${spec.menu.openState.controlledProp}) => {\n    if (${spec.menu.openState.controlledProp} === undefined || !instance || instance.${spec.menu.openState.getter}() === ${spec.menu.openState.controlledProp}) return;\n\n    instance.${spec.menu.openState.setter}(${spec.menu.openState.controlledProp}, { emit: false });\n  },\n);\n\nwatch(\n  () => [props.disabled, props.openOnHover, props.closeDelay] as const,\n  setup,\n);\n\nonBeforeUnmount(() => {\n  instance?.destroy();\n  instance = undefined;\n});\n</script>\n\n<template>\n  <div\n    ${root.discoveryAttribute}\n    :data-default-open="props.${spec.menu.openState.controlledProp} === undefined && props.${spec.menu.openState.defaultProp} ? 'true' : undefined"\n    :data-disabled="props.disabled ? '' : undefined"\n    :data-open-on-hover="props.openOnHover ? 'true' : undefined"\n    :data-close-delay="props.closeDelay"\n    :data-state="renderedOpen ? 'open' : 'closed'"\n    ref="root"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuTrigger(spec: MenuSpecializedAdapterSpec): string {
  const trigger = getPart(spec, "trigger");

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\nconst menu = inject("starwind-menu-root") as {\n  open: { value: boolean };\n};\n</script>\n\n<template>\n  <button\n    ${trigger.discoveryAttribute}\n    type="button"\n    aria-haspopup="menu"\n    :aria-expanded="menu.open.value ? 'true' : 'false'"\n    :data-state="menu.open.value ? 'open' : 'closed'"\n    v-bind="$attrs"\n  >\n    <slot />\n  </button>\n</template>\n`;
}

function renderVueMenuPortal(spec: MenuSpecializedAdapterSpec): string {
  const portal = getPart(spec, "portal");

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<template>\n  <Teleport to="body">\n    <div ${portal.discoveryAttribute} v-bind="$attrs">\n      <slot />\n    </div>\n  </Teleport>\n</template>\n`;
}

function renderVueMenuFloatingPart(
  spec: MenuSpecializedAdapterSpec,
  partName: "popup" | "positioner",
): string {
  const part = getPart(spec, partName);
  const role = part.role ? `\n    role="${part.role}"` : "";
  const tabindex = partName === "popup" ? '\n    tabindex="-1"' : "";
  const hidden = partName === "popup" ? "\n    hidden" : "";

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    side?: "top" | "right" | "bottom" | "left";\n    align?: "start" | "center" | "end";\n    sideOffset?: number;\n    avoidCollisions?: boolean;\n  }>(),\n  {\n    side: "bottom",\n    align: "start",\n    sideOffset: 4,\n    avoidCollisions: true,\n  },\n);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}${role}${tabindex}\n    data-state="closed"\n    :data-side="props.side"\n    :data-align="props.align"\n    :data-side-offset="props.sideOffset"\n    :data-avoid-collisions="props.avoidCollisions ? 'true' : 'false'"${hidden}\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuActionItem(spec: MenuSpecializedAdapterSpec): string {
  const item = getPart(spec, "item");
  const branch = getMenuStaticBranch(spec, "item");
  const closeOnClick = requireCloseOnClick(branch);
  const disabled = requireDisabled(branch);

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    ${disabled.prop}?: boolean;\n    ${closeOnClick.prop}?: boolean;\n  }>(),\n  {\n    ${disabled.prop}: false,\n    ${closeOnClick.prop}: ${closeOnClick.defaultValue},\n  },\n);\n</script>\n\n<template>\n  <div\n    ${item.discoveryAttribute}\n    role="${requireRole(branch)}"\n    tabindex="0"\n    :${closeOnClick.attribute}="props.${closeOnClick.prop} ? undefined : 'false'"\n    :${disabled.ariaAttribute}="props.${disabled.prop} ? 'true' : undefined"\n    :${disabled.dataAttribute}="props.${disabled.prop} ? '' : undefined"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuLinkItem(spec: MenuSpecializedAdapterSpec): string {
  const item = getPart(spec, "linkItem");
  const branch = getMenuStaticBranch(spec, "linkItem");
  const closeOnClick = requireCloseOnClick(branch);
  const disabled = requireDisabled(branch);

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    ${disabled.prop}?: boolean;\n    ${closeOnClick.prop}?: boolean;\n    href?: string;\n  }>(),\n  {\n    ${disabled.prop}: false,\n    ${closeOnClick.prop}: ${closeOnClick.defaultValue},\n  },\n);\n</script>\n\n<template>\n  <a\n    ${item.discoveryAttribute}\n    :href="props.${disabled.prop} ? undefined : props.href"\n    role="${requireRole(branch)}"\n    tabindex="0"\n    :${closeOnClick.attribute}="props.${closeOnClick.prop} ? 'true' : undefined"\n    :${disabled.ariaAttribute}="props.${disabled.prop} ? 'true' : undefined"\n    :${disabled.dataAttribute}="props.${disabled.prop} ? '' : undefined"\n    v-bind="$attrs"\n  >\n    <slot />\n  </a>\n</template>\n`;
}

function renderVueMenuCheckboxItem(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "checkboxItem");
  const recipe = spec.menu.checkboxItem;
  const event = recipe.eventForwarding;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport type { ${event.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    ${recipe.checkedState.controlledProp}?: boolean;\n    ${recipe.checkedState.defaultProp}?: boolean;\n    ${recipe.closeOnClick.prop}?: boolean;\n    ${recipe.disabled.prop}?: boolean;\n  }>(),\n  {\n    ${recipe.checkedState.defaultProp}: false,\n    ${recipe.closeOnClick.prop}: ${recipe.closeOnClick.defaultValue},\n    ${recipe.disabled.prop}: false,\n  },\n);\n\nconst emit = defineEmits<{\n  ${event.name}: [${event.valueProperty}: boolean, details: ${event.detailsType}];\n}>();\n\nconst item = ref<HTMLDivElement | null>(null);\nconst uncontrolledChecked = ref(props.${recipe.checkedState.defaultProp});\nconst renderedChecked = computed(() => props.${recipe.checkedState.controlledProp} ?? uncontrolledChecked.value);\nconst checkboxItemContext = { checked: renderedChecked };\n\nprovide("starwind-menu-checkbox-item", checkboxItemContext);\n\nfunction handleCheckedChange(event: Event) {\n  const details = (event as CustomEvent<${event.detailsType}>).detail;\n  emit("${event.name}", details.${event.valueProperty}, details);\n  if (!details.isCanceled && props.${recipe.checkedState.controlledProp} === undefined) {\n    uncontrolledChecked.value = details.${event.valueProperty};\n  }\n}\n\nonMounted(() => {\n  item.value?.addEventListener("${event.domEvent}", handleCheckedChange);\n});\n\nonBeforeUnmount(() => {\n  item.value?.removeEventListener("${event.domEvent}", handleCheckedChange);\n});\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    :${recipe.checkedState.initialAttribute}="props.${recipe.checkedState.defaultProp} ? 'true' : undefined"\n    :${recipe.closeOnClick.attribute}="props.${recipe.closeOnClick.prop} ? 'true' : undefined"\n    role="${recipe.role}"\n    :${recipe.stateAttributes.ariaChecked}="renderedChecked ? 'true' : 'false'"\n    :${recipe.disabled.ariaAttribute}="props.${recipe.disabled.prop} ? 'true' : undefined"\n    :${recipe.stateAttributes.checked}="renderedChecked ? '' : undefined"\n    :${recipe.disabled.dataAttribute}="props.${recipe.disabled.prop} ? '' : undefined"\n    :${recipe.stateAttributes.unchecked}="renderedChecked ? undefined : ''"\n    tabindex="0"\n    ref="item"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuCheckboxItemIndicator(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "checkboxItemIndicator");
  const projection = spec.menu.checkboxItem.indicatorProjection;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst item = inject("starwind-menu-checkbox-item") as {\n  checked: { value: boolean };\n};\nconst checked = computed(() => item.checked.value);\n</script>\n\n<template>\n  <span\n    ${part.discoveryAttribute}\n    aria-hidden="${projection.ariaHidden}"\n    :${projection.stateAttribute}="checked ? '${projection.checkedStateValue}' : '${projection.uncheckedStateValue}'"\n    :${projection.visibleAttribute}="checked ? '' : undefined"\n    :${projection.hiddenAttribute}="checked ? undefined : ''"\n    v-bind="$attrs"\n  >\n    <slot />\n  </span>\n</template>\n`;
}

function renderVueMenuRadioGroup(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "radioGroup");
  const recipe = spec.menu.radioGroup;
  const event = recipe.eventForwarding;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport type { ${event.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";\n\nconst props = defineProps<{\n  ${recipe.valueState.controlledProp}?: string;\n  ${recipe.valueState.defaultProp}?: string;\n}>();\n\nconst emit = defineEmits<{\n  ${event.name}: [${event.valueProperty}: string, details: ${event.detailsType}];\n}>();\n\nconst group = ref<HTMLDivElement | null>(null);\nconst uncontrolledValue = ref<string | undefined>(props.${recipe.valueState.defaultProp});\nconst renderedValue = computed(() => props.${recipe.valueState.controlledProp} ?? uncontrolledValue.value);\nconst radioGroupContext = { value: renderedValue };\n\nprovide("starwind-menu-radio-group", radioGroupContext);\n\nfunction handleValueChange(event: Event) {\n  const details = (event as CustomEvent<${event.detailsType}>).detail;\n  emit("${event.name}", details.${event.valueProperty}, details);\n  if (!details.isCanceled && props.${recipe.valueState.controlledProp} === undefined) {\n    uncontrolledValue.value = details.${event.valueProperty};\n  }\n}\n\nonMounted(() => {\n  group.value?.addEventListener("${event.domEvent}", handleValueChange);\n});\n\nonBeforeUnmount(() => {\n  group.value?.removeEventListener("${event.domEvent}", handleValueChange);\n});\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    role="${recipe.role}"\n    :${recipe.valueState.initialAttribute}="renderedValue"\n    ref="group"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuRadioItem(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "radioItem");
  const recipe = spec.menu.radioItem;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject, provide } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    ${recipe.valueProp.prop}: string;\n    ${recipe.checkedState.controlledProp}?: boolean;\n    ${recipe.checkedState.defaultProp}?: boolean;\n    ${recipe.closeOnClick.prop}?: boolean;\n    ${recipe.disabled.prop}?: boolean;\n  }>(),\n  {\n    ${recipe.checkedState.defaultProp}: false,\n    ${recipe.closeOnClick.prop}: ${recipe.closeOnClick.defaultValue},\n    ${recipe.disabled.prop}: false,\n  },\n);\n\nconst group = inject("starwind-menu-radio-group") as {\n  value: { value: string | undefined };\n};\nconst checked = computed(() => props.${recipe.checkedState.controlledProp} ?? (group.value.value === undefined ? props.${recipe.checkedState.defaultProp} : group.value.value === props.${recipe.valueProp.prop}));\nconst radioItemContext = { checked };\n\nprovide("starwind-menu-radio-item", radioItemContext);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    :${recipe.valueProp.attribute}="props.${recipe.valueProp.prop}"\n    :${recipe.checkedState.initialAttribute}="props.${recipe.checkedState.defaultProp} ? 'true' : undefined"\n    :${recipe.closeOnClick.attribute}="props.${recipe.closeOnClick.prop} ? 'true' : undefined"\n    role="${recipe.role}"\n    :${recipe.stateAttributes.ariaChecked}="checked ? 'true' : 'false'"\n    :${recipe.disabled.ariaAttribute}="props.${recipe.disabled.prop} ? 'true' : undefined"\n    :${recipe.stateAttributes.checked}="checked ? '' : undefined"\n    :${recipe.disabled.dataAttribute}="props.${recipe.disabled.prop} ? '' : undefined"\n    :${recipe.stateAttributes.unchecked}="checked ? undefined : ''"\n    tabindex="0"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuRadioItemIndicator(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "radioItemIndicator");
  const projection = spec.menu.radioItem.indicatorProjection;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst item = inject("starwind-menu-radio-item") as {\n  checked: { value: boolean };\n};\nconst checked = computed(() => item.checked.value);\n</script>\n\n<template>\n  <span\n    ${part.discoveryAttribute}\n    aria-hidden="${projection.ariaHidden}"\n    :${projection.stateAttribute}="checked ? '${projection.checkedStateValue}' : '${projection.uncheckedStateValue}'"\n    :${projection.visibleAttribute}="checked ? '' : undefined"\n    :${projection.hiddenAttribute}="checked ? undefined : ''"\n    v-bind="$attrs"\n  >\n    <slot />\n  </span>\n</template>\n`;
}

function renderVueMenuStaticPart(
  spec: MenuSpecializedAdapterSpec,
  partName: "group" | "label" | "separator" | "shortcut",
): string {
  const part = getPart(spec, partName);
  const branch = getMenuStaticBranch(spec, partName);
  const role = branch.role ? `\n    role="${branch.role}"` : "";
  const aria = (branch.ariaAttributes ?? [])
    .map((attribute) => `\n    ${attribute.name}="${attribute.value}"`)
    .join("");
  const tag = part.defaultElement;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<template>\n  <${tag}\n    ${part.discoveryAttribute}${role}${aria}\n    v-bind="$attrs"\n  >\n    <slot />\n  </${tag}>\n</template>\n`;
}

function renderVueMenuSubmenuRoot(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "submenuRoot");
  const recipe = spec.menu.submenu.root;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { provide, ref } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    ${recipe.closeDelay.prop}?: number;\n  }>(),\n  {\n    ${recipe.closeDelay.prop}: ${recipe.closeDelay.defaultValue},\n  },\n);\n\nconst submenuRoot = ref<HTMLDivElement | null>(null);\nconst submenuRootContext = { root: submenuRoot };\n\nprovide("starwind-menu-submenu-root", submenuRootContext);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    :${recipe.closeDelay.attribute}="props.${recipe.closeDelay.prop}"\n    ${recipe.stateAttributes.state}="${recipe.stateAttributes.closedValue}"\n    ref="submenuRoot"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuSubmenuTrigger(spec: MenuSpecializedAdapterSpec): string {
  const part = getPart(spec, "submenuTrigger");
  const recipe = spec.menu.submenu.trigger;

  return `<!-- ${MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    ${recipe.disabled.prop}?: boolean;\n  }>(),\n  {\n    ${recipe.disabled.prop}: false,\n  },\n);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    role="${recipe.role}"\n    ${recipe.disclosure.ariaHaspopup.attribute}="${recipe.disclosure.ariaHaspopup.value}"\n    ${recipe.disclosure.ariaExpanded}="false"\n    :${recipe.disabled.ariaAttribute}="props.${recipe.disabled.prop} ? 'true' : undefined"\n    :${recipe.disabled.dataAttribute}="props.${recipe.disabled.prop} ? '' : undefined"\n    ${recipe.disclosure.stateAttribute}="${recipe.disclosure.closedStateValue}"\n    tabindex="${recipe.tabIndex.value}"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueMenuIndex(
  spec: MenuSpecializedAdapterSpec,
  extension: typeof vueFrameworkAdapterReadiness.fileExtension,
): string {
  return `// ${MENU_FIXTURE_COMMENT}\n${spec.menu.namespace.objectEntries
    .map(
      (entry) =>
        `export { default as ${entry.property} } from "./${getFileExportName(spec, entry.part)}${extension}";`,
    )
    .join("\n")}\n`;
}

function renderVueNavigationMenuRoot(spec: NavigationMenuSpecializedAdapterSpec): string {
  const baseRoot = getPart(spec, "root");
  const valueEvent = spec.navigationMenu.valueControl.eventForwarding;
  const controlledNullMarker = spec.navigationMenu.valueControl.state.controlledNullMarker;
  const root = {
    ...baseRoot,
    discoveryAttribute: `${baseRoot.discoveryAttribute}\n    :${controlledNullMarker.attribute}="props.${spec.navigationMenu.valueState.controlledProp} === null ? '' : undefined"`,
  };

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { ${spec.root.runtimeFactory}, type ${valueEvent.detailsType} } from "${spec.root.runtimeImportSource}";\nimport { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";\n\ntype NavigationMenuOrientation = "horizontal" | "vertical";\n\nconst props = withDefaults(\n  defineProps<{\n    ${spec.navigationMenu.valueState.defaultProp}?: string | null;\n    ${spec.navigationMenu.valueState.controlledProp}?: string | null;\n    orientation?: NavigationMenuOrientation;\n    openDelay?: number;\n    closeDelay?: number;\n    closeOnEscape?: boolean;\n    closeOnOutsideInteract?: boolean;\n  }>(),\n  {\n    ${spec.navigationMenu.valueState.defaultProp}: null,\n    orientation: "horizontal",\n    openDelay: 50,\n    closeDelay: 50,\n    closeOnEscape: true,\n    closeOnOutsideInteract: true,\n  },\n);\n\nconst emit = defineEmits<{\n  ${valueEvent.name}: [${valueEvent.valueProperty}: string | null, details: ${valueEvent.detailsType}];\n}>();\n\nconst root = ref<HTMLElement | null>(null);\nconst uncontrolledValue = ref<string | null>(props.${spec.navigationMenu.valueState.defaultProp});\nconst renderedValue = computed(() => props.${spec.navigationMenu.valueState.controlledProp} ?? uncontrolledValue.value);\nconst renderedState = computed(() => (renderedValue.value === null ? "closed" : "open"));\nconst renderedOrientation = computed(() => props.orientation);\nlet instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\nconst navigationMenuContext = {\n  orientation: renderedOrientation,\n  root,\n  value: renderedValue,\n};\n\nprovide("starwind-navigation-menu-root", navigationMenuContext);\n\nfunction setup() {\n  instance?.destroy();\n  if (!root.value) {\n    instance = undefined;\n    return;\n  }\n\n  instance = ${spec.root.runtimeFactory}(root.value, {\n    ${spec.navigationMenu.valueState.defaultProp}: uncontrolledValue.value,\n    closeDelay: props.closeDelay,\n    closeOnEscape: props.closeOnEscape,\n    closeOnOutsideInteract: props.closeOnOutsideInteract,\n    openDelay: props.openDelay,\n    ...(props.${spec.navigationMenu.valueState.controlledProp} !== undefined ? { ${spec.navigationMenu.valueState.controlledProp}: props.${spec.navigationMenu.valueState.controlledProp} } : {}),\n    ${valueEvent.callbackProp}(${valueEvent.valueProperty}, details) {\n      emit("${valueEvent.name}", ${valueEvent.valueProperty}, details);\n      if (!details.isCanceled && props.${spec.navigationMenu.valueState.controlledProp} === undefined) {\n        uncontrolledValue.value = ${valueEvent.valueProperty};\n      }\n    },\n  });\n}\n\nonMounted(() => {\n  setup();\n});\n\nwatch(\n  () => props.${spec.navigationMenu.valueState.controlledProp},\n  (${spec.navigationMenu.valueState.controlledProp}) => {\n    if (${spec.navigationMenu.valueState.controlledProp} === undefined || !instance || instance.${spec.navigationMenu.valueState.getter}() === ${spec.navigationMenu.valueState.controlledProp}) return;\n\n    instance.${spec.navigationMenu.valueState.setter}(${spec.navigationMenu.valueState.controlledProp}, { emit: false });\n  },\n);\n\nwatch(\n  () => [props.openDelay, props.closeDelay, props.closeOnEscape, props.closeOnOutsideInteract] as const,\n  setup,\n);\n\nonBeforeUnmount(() => {\n  instance?.destroy();\n  instance = undefined;\n});\n</script>\n\n<template>\n  <nav\n    ${root.discoveryAttribute}\n    :data-value="props.${spec.navigationMenu.valueState.controlledProp} ?? undefined"\n    :data-default-value="props.${spec.navigationMenu.valueState.defaultProp} ?? undefined"\n    :data-open-delay="props.openDelay"\n    :data-close-delay="props.closeDelay"\n    :data-close-on-escape="props.closeOnEscape ? 'true' : 'false'"\n    :data-close-on-outside-interact="props.closeOnOutsideInteract ? 'true' : 'false'"\n    :data-orientation="props.orientation"\n    :data-state="renderedState"\n    ref="root"\n    v-bind="$attrs"\n  >\n    <slot />\n  </nav>\n</template>\n`;
}

function renderVueNavigationMenuList(spec: NavigationMenuSpecializedAdapterSpec): string {
  const list = getPart(spec, "list");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\nconst navigationMenu = inject("starwind-navigation-menu-root") as {\n  orientation: { value: "horizontal" | "vertical" };\n};\n</script>\n\n<template>\n  <ul\n    ${list.discoveryAttribute}\n    :data-orientation="navigationMenu.orientation.value"\n    v-bind="$attrs"\n  >\n    <slot />\n  </ul>\n</template>\n`;
}

function renderVueNavigationMenuItem(spec: NavigationMenuSpecializedAdapterSpec): string {
  const item = getPart(spec, "item");
  const value = spec.navigationMenu.partRecipes.item.value;

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject, provide } from "vue";\n\nconst props = defineProps<{\n  ${value.prop}: string;\n}>();\n\nconst navigationMenu = inject("starwind-navigation-menu-root") as {\n  value: { value: string | null };\n};\nconst open = computed(() => navigationMenu.value.value === props.${value.prop});\nconst itemContext = {\n  open,\n  value: props.${value.prop},\n};\n\nprovide("starwind-navigation-menu-item", itemContext);\n</script>\n\n<template>\n  <li\n    ${item.discoveryAttribute}\n    :${value.attribute}="props.${value.prop}"\n    :data-state="open ? 'open' : 'closed'"\n    v-bind="$attrs"\n  >\n    <slot />\n  </li>\n</template>\n`;
}

function renderVueNavigationMenuTrigger(spec: NavigationMenuSpecializedAdapterSpec): string {
  const trigger = getPart(spec, "trigger");
  const recipe = spec.navigationMenu.partRecipes.trigger;

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    ${recipe.disabled.prop}?: boolean;\n    openDelay?: number;\n    closeDelay?: number;\n  }>(),\n  {\n    ${recipe.disabled.prop}: false,\n  },\n);\n\nconst item = inject("starwind-navigation-menu-item") as {\n  open: { value: boolean };\n};\nconst open = computed(() => item.open.value);\n</script>\n\n<template>\n  <button\n    ${trigger.discoveryAttribute}\n    type="${recipe.typeAttribute.value}"\n    ${recipe.disclosure.ariaHaspopup.attribute}="${recipe.disclosure.ariaHaspopup.value}"\n    :${recipe.disclosure.ariaExpanded}="open ? 'true' : 'false'"\n    :${recipe.disabled.ariaAttribute}="props.${recipe.disabled.prop} ? 'true' : undefined"\n    :${recipe.disabled.dataAttribute}="props.${recipe.disabled.prop} ? '' : undefined"\n    :data-open-delay="props.openDelay"\n    :data-close-delay="props.closeDelay"\n    :${recipe.disclosure.stateAttribute}="open ? 'open' : 'closed'"\n    v-bind="$attrs"\n  >\n    <slot />\n  </button>\n</template>\n`;
}

function renderVueNavigationMenuIcon(spec: NavigationMenuSpecializedAdapterSpec): string {
  const icon = getPart(spec, "icon");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst item = inject("starwind-navigation-menu-item", undefined) as\n  | { open: { value: boolean } }\n  | undefined;\nconst open = computed(() => item?.open.value ?? false);\n</script>\n\n<template>\n  <span\n    ${icon.discoveryAttribute}\n    aria-hidden="true"\n    :data-state="open ? 'open' : 'closed'"\n    v-bind="$attrs"\n  >\n    <slot />\n  </span>\n</template>\n`;
}

function renderVueNavigationMenuContent(spec: NavigationMenuSpecializedAdapterSpec): string {
  const content = getPart(spec, "content");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst item = inject("starwind-navigation-menu-item") as {\n  open: { value: boolean };\n};\nconst open = computed(() => item.open.value);\n</script>\n\n<template>\n  <div\n    ${content.discoveryAttribute}\n    :data-state="open ? 'open' : 'closed'"\n    :data-activation-direction="undefined"\n    :data-instant="undefined"\n    :hidden="!open"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueNavigationMenuLink(spec: NavigationMenuSpecializedAdapterSpec): string {
  const link = getPart(spec, "link");
  const recipe = spec.navigationMenu.partRecipes.link;

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    href?: string;\n    ${recipe.active.prop}?: boolean;\n    ${recipe.closeOnClick.prop}?: boolean;\n  }>(),\n  {\n    ${recipe.active.prop}: false,\n    ${recipe.closeOnClick.prop}: ${recipe.closeOnClick.defaultValue},\n  },\n);\n</script>\n\n<template>\n  <a\n    ${link.discoveryAttribute}\n    :href="props.href"\n    :${recipe.active.attribute}="props.${recipe.active.prop} ? '' : undefined"\n    :${recipe.active.ariaCurrentAttribute}="props.${recipe.active.prop} ? '${recipe.active.ariaCurrentValue}' : undefined"\n    :${recipe.closeOnClick.attribute}="props.${recipe.closeOnClick.prop} ? undefined : '${recipe.closeOnClick.falseValue}'"\n    v-bind="$attrs"\n  >\n    <slot />\n  </a>\n</template>\n`;
}

function renderVueNavigationMenuPortal(spec: NavigationMenuSpecializedAdapterSpec): string {
  const portal = getPart(spec, "portal");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<template>\n  <Teleport to="body">\n    <div ${portal.discoveryAttribute} v-bind="$attrs">\n      <slot />\n    </div>\n  </Teleport>\n</template>\n`;
}

function renderVueNavigationMenuPositioner(spec: NavigationMenuSpecializedAdapterSpec): string {
  const positioner = getPart(spec, "positioner");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    side?: "top" | "right" | "bottom" | "left";\n    align?: "start" | "center" | "end";\n    sideOffset?: number;\n    alignOffset?: number;\n    avoidCollisions?: boolean;\n    collisionPadding?: number;\n  }>(),\n  {\n    side: "bottom",\n    align: "start",\n    sideOffset: 4,\n    alignOffset: 0,\n    avoidCollisions: true,\n    collisionPadding: 8,\n  },\n);\n</script>\n\n<template>\n  <div\n    ${positioner.discoveryAttribute}\n    data-state="closed"\n    :data-side="props.side"\n    :data-align="props.align"\n    :data-side-offset="props.sideOffset"\n    :data-align-offset="props.alignOffset"\n    :data-avoid-collisions="props.avoidCollisions ? 'true' : 'false'"\n    :data-collision-padding="props.collisionPadding"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueNavigationMenuPopup(spec: NavigationMenuSpecializedAdapterSpec): string {
  const popup = getPart(spec, "popup");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst navigationMenu = inject("starwind-navigation-menu-root") as {\n  value: { value: string | null };\n};\nconst open = computed(() => navigationMenu.value.value !== null);\n</script>\n\n<template>\n  <div\n    ${popup.discoveryAttribute}\n    :data-state="open ? 'open' : 'closed'"\n    :data-side="undefined"\n    :data-align="undefined"\n    :data-instant="undefined"\n    :hidden="navigationMenu.value.value === null"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueNavigationMenuViewport(spec: NavigationMenuSpecializedAdapterSpec): string {
  const viewport = getPart(spec, "viewport");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { computed, inject } from "vue";\n\nconst navigationMenu = inject("starwind-navigation-menu-root") as {\n  value: { value: string | null };\n};\nconst open = computed(() => navigationMenu.value.value !== null);\n</script>\n\n<template>\n  <div\n    ${viewport.discoveryAttribute}\n    :data-state="open ? 'open' : 'closed'"\n    :data-side="undefined"\n    :data-align="undefined"\n    :data-activation-direction="undefined"\n    :data-instant="undefined"\n    :hidden="!open"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueNavigationMenuArrow(spec: NavigationMenuSpecializedAdapterSpec): string {
  const arrow = getPart(spec, "arrow");

  return `<!-- ${NAVIGATION_MENU_FIXTURE_COMMENT} -->\n<template>\n  <div\n    ${arrow.discoveryAttribute}\n    aria-hidden="true"\n    data-state="closed"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueNavigationMenuIndex(spec: NavigationMenuSpecializedAdapterSpec): string {
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return `// ${NAVIGATION_MENU_FIXTURE_COMMENT}\n${getNavigationMenuFixturePartExports(spec)
    .map(
      ({ alias, fileExportName }) =>
        `export { default as ${alias} } from "./${fileExportName}${extension}";`,
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

function getRequiredRole(part: GenericAdapterPlanPart): string {
  if (!part.role) {
    throw new Error(`${part.name} specialized adapter fixture part is missing a required role.`);
  }

  return part.role;
}

export function printSelectFutureFrameworkTracerSpec(
  spec: SelectSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertSelectFixtureTarget(spec, "Vue");
  throw new Error(
    "Select is supported by real Vue output and is not a future-framework tracer fixture.",
  );
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
