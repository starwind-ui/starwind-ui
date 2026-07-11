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
import { vueFrameworkAdapterReadiness } from "./adapter.js";

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
    return printVueComboboxSpecializedAdapterSpecFixture(spec);
  }
  if (isMenuSpecializedAdapterSpec(spec)) {
    return printVueMenuSpecializedAdapterSpecFixture(spec);
  }
  if (isNavigationMenuSpecializedAdapterSpec(spec)) {
    return printVueNavigationMenuSpecializedAdapterSpecFixture(spec);
  }

  assertScrollAreaFixtureScope(spec, "Vue");

  const adapter = vueFrameworkAdapterReadiness;
  const extension = adapter.fileExtension;

  return [
    {
      contents: renderVueScrollAreaRoot(spec, getPart(spec, "root")),
      path: `__future-fixtures/vue/${spec.component}/${getFileExportName(spec, "root")}${extension}`,
    },
    {
      contents: renderVueScrollAreaViewport(getPart(spec, "viewport")),
      path: `__future-fixtures/vue/${spec.component}/${getFileExportName(spec, "viewport")}${extension}`,
    },
    {
      contents: renderVueScrollAreaSimplePart(getPart(spec, "content")),
      path: `__future-fixtures/vue/${spec.component}/${getFileExportName(spec, "content")}${extension}`,
    },
    {
      contents: renderVueScrollAreaScrollbar(spec, getPart(spec, "scrollbar")),
      path: `__future-fixtures/vue/${spec.component}/${getFileExportName(spec, "scrollbar")}${extension}`,
    },
    {
      contents: renderVueScrollAreaSimplePart(getPart(spec, "thumb")),
      path: `__future-fixtures/vue/${spec.component}/${getFileExportName(spec, "thumb")}${extension}`,
    },
    {
      contents: renderVueScrollAreaCorner(getPart(spec, "corner")),
      path: `__future-fixtures/vue/${spec.component}/${getFileExportName(spec, "corner")}${extension}`,
    },
    {
      contents: renderVueIndex(spec),
      path: `__future-fixtures/vue/${spec.component}/index.ts`,
    },
  ];
}

function printVueComboboxSpecializedAdapterSpecFixture(
  spec: ComboboxSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertComboboxFixtureTarget(spec, "Vue");
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return [
    ...COMBOBOX_FIXTURE_PARTS.map((part) => ({
      contents: renderVueComboboxPart(spec, part),
      path: `__future-fixtures/vue/combobox/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderVueComboboxIndex(spec),
      path: "__future-fixtures/vue/combobox/index.ts",
    },
  ];
}

function printVueMenuSpecializedAdapterSpecFixture(
  spec: MenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertMenuFixtureTarget(spec, "Vue");
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return [
    ...MENU_FIXTURE_PARTS.map((part) => ({
      contents: renderVueMenuPart(spec, part),
      path: `__future-fixtures/vue/menu/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderVueMenuIndex(spec, extension),
      path: "__future-fixtures/vue/menu/index.ts",
    },
  ];
}

function printVueNavigationMenuSpecializedAdapterSpecFixture(
  spec: NavigationMenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertNavigationMenuFixtureTarget(spec, "Vue");
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return [
    ...NAVIGATION_MENU_FIXTURE_PARTS.map((part) => ({
      contents: renderVueNavigationMenuPart(spec, part),
      path: `__future-fixtures/vue/navigation-menu/${getFileExportName(spec, part)}${extension}`,
    })),
    {
      contents: renderVueNavigationMenuIndex(spec),
      path: "__future-fixtures/vue/navigation-menu/index.ts",
    },
  ];
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

function renderVueScrollAreaRoot(
  spec: SpecializedAdapterSpec,
  part: GenericAdapterPlanPart,
): string {
  const overflowEdgeThreshold = getPropForPart(spec, "overflowEdgeThreshold", "root");
  const thresholdValue = `props.${overflowEdgeThreshold.name}`;

  return `<!-- ${FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { ${spec.root.runtimeFactory} } from "${spec.root.runtimeImportSource}";\nimport { onBeforeUnmount, onMounted, provide, ref, watch } from "vue";\n\n${renderScrollAreaOverflowEdgeThresholdType("type")}\n\ntype ScrollAreaOverflowEdgeThresholdAttributes = {\n  shared?: number;\n  xEnd?: number;\n  xStart?: number;\n  yEnd?: number;\n  yStart?: number;\n};\n\nconst props = defineProps<{\n  ${overflowEdgeThreshold.name}?: ScrollAreaOverflowEdgeThreshold;\n}>();\n\nconst root = ref<HTMLDivElement | null>(null);\nlet instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;\n\nprovide("starwind-scroll-area-root", root);\n\nfunction setup() {\n  instance?.destroy();\n  if (!root.value) {\n    instance = undefined;\n    return;\n  }\n\n  instance = ${spec.root.runtimeFactory}(root.value);\n}\n\nonMounted(() => {\n  setup();\n});\n\nwatch(\n  () => ${thresholdValue},\n  () => {\n    instance?.refresh();\n  },\n  { deep: true },\n);\n\nonBeforeUnmount(() => {\n  instance?.destroy();\n  instance = undefined;\n});\n\nfunction getOverflowEdgeThresholdAttributes(\n  threshold: ScrollAreaOverflowEdgeThreshold | undefined,\n): ScrollAreaOverflowEdgeThresholdAttributes {\n  if (typeof threshold === "number") {\n    const shared = normalizeOverflowEdgeThresholdValue(threshold);\n    return shared === undefined ? {} : { shared };\n  }\n\n  if (!threshold) return {};\n\n  return {\n    xEnd: "xEnd" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.xEnd) : undefined,\n    xStart: "xStart" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.xStart) : undefined,\n    yEnd: "yEnd" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.yEnd) : undefined,\n    yStart: "yStart" in threshold ? normalizeOverflowEdgeThresholdValue(threshold.yStart) : undefined,\n  };\n}\n\nfunction normalizeOverflowEdgeThresholdValue(value: number | undefined): number | undefined {\n  if (value === undefined || !Number.isFinite(value)) return undefined;\n\n  return Math.max(value, 0);\n}\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    :data-overflow-edge-threshold="getOverflowEdgeThresholdAttributes(${thresholdValue}).shared"\n    :data-overflow-edge-threshold-x-end="getOverflowEdgeThresholdAttributes(${thresholdValue}).xEnd"\n    :data-overflow-edge-threshold-x-start="getOverflowEdgeThresholdAttributes(${thresholdValue}).xStart"\n    :data-overflow-edge-threshold-y-end="getOverflowEdgeThresholdAttributes(${thresholdValue}).yEnd"\n    :data-overflow-edge-threshold-y-start="getOverflowEdgeThresholdAttributes(${thresholdValue}).yStart"\n    ref="root"\n    role="${getRequiredRole(part)}"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueScrollAreaViewport(part: GenericAdapterPlanPart): string {
  return `<!-- ${FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\ninject("starwind-scroll-area-root", undefined);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    role="${getRequiredRole(part)}"\n    tabindex="-1"\n    style="overflow: scroll;"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueScrollAreaSimplePart(part: GenericAdapterPlanPart): string {
  return `<!-- ${FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\ninject("starwind-scroll-area-root", undefined);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}${part.role ? `\n    role="${part.role}"` : ""}\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueScrollAreaScrollbar(
  spec: SpecializedAdapterSpec,
  part: GenericAdapterPlanPart,
): string {
  const keepMounted = getPropForPart(spec, "keepMounted", "scrollbar");
  const orientation = getPropForPart(spec, "orientation", "scrollbar");
  const keepMountedValue = `props.${keepMounted.name}`;
  const orientationValue = `props.${orientation.name}`;

  return `<!-- ${FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\ntype ScrollAreaOrientation = ${orientation.type};\n\nconst props = withDefaults(\n  defineProps<{\n    ${keepMounted.name}?: ${keepMounted.type};\n    ${orientation.name}?: ScrollAreaOrientation;\n  }>(),\n  {\n    ${keepMounted.name}: ${keepMounted.defaultValue},\n    ${orientation.name}: ${orientation.defaultValue},\n  },\n);\n\ninject("starwind-scroll-area-root", undefined);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    :data-keep-mounted="${keepMountedValue} ? '' : undefined"\n    :data-orientation="${orientationValue}"\n    aria-hidden="true"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueScrollAreaCorner(part: GenericAdapterPlanPart): string {
  return `<!-- ${FIXTURE_COMMENT} -->\n<script setup lang="ts">\nimport { inject } from "vue";\n\ninject("starwind-scroll-area-root", undefined);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    aria-hidden="true"\n    v-bind="$attrs"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueIndex(spec: SpecializedAdapterSpec): string {
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return `// ${FIXTURE_COMMENT}\n${spec.exports.members
    .map(
      (member) =>
        `export { default as ${toPartAlias(member.part)} } from "./${toFileBasename(
          member.file,
        )}${extension}";`,
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
  assertSelectFixtureTarget(spec, "Vue");
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return [
    {
      contents: renderVueSelectVerticalSliceRoot(spec),
      path: `__future-fixtures/vue/select/${getSelectFileExportName(spec, "root")}${extension}`,
    },
    {
      contents: renderVueSelectVerticalSliceTrigger(spec),
      path: `__future-fixtures/vue/select/${getSelectFileExportName(spec, "trigger")}${extension}`,
    },
    {
      contents: renderVueSelectVerticalSlicePortal(spec),
      path: `__future-fixtures/vue/select/${getSelectFileExportName(spec, "portal")}${extension}`,
    },
    {
      contents: renderVueSelectVerticalSlicePopup(spec),
      path: `__future-fixtures/vue/select/${getSelectFileExportName(spec, "popup")}${extension}`,
    },
    {
      contents: renderVueSelectVerticalSliceItem(spec),
      path: `__future-fixtures/vue/select/${getSelectFileExportName(spec, "item")}${extension}`,
    },
    {
      contents: renderVueSelectVerticalSliceItemIndicator(spec),
      path: `__future-fixtures/vue/select/${getSelectFileExportName(spec, "itemIndicator")}${extension}`,
    },
    {
      contents: renderVueSelectIndex(spec),
      path: "__future-fixtures/vue/select/index.ts",
    },
  ];
}

function renderVueSelectIndex(spec: SelectSpecializedAdapterSpec): string {
  const extension = vueFrameworkAdapterReadiness.fileExtension;

  return `// ${SELECT_FIXTURE_COMMENT}\n${getSelectFixturePartExports(spec)
    .map(
      ({ alias, fileExportName }) =>
        `export { default as ${alias} } from "./${fileExportName}${extension}";`,
    )
    .join("\n")}\n`;
}

function renderVueSelectVerticalSliceRoot(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `<!-- ${SELECT_FIXTURE_COMMENT} -->
<script setup lang="ts">
import { ${spec.root.runtimeFactory}, type SelectOpenChangeDetails, type SelectValueChangeDetails } from "${spec.root.runtimeImportSource}";
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    autoComplete?: string;
    defaultOpen?: boolean;
    defaultValue?: string | null;
    disabled?: boolean;
    form?: string;
    name?: string;
    open?: boolean;
    readOnly?: boolean;
    required?: boolean;
    value?: string | null;
  }>(),
  {
    defaultOpen: false,
    defaultValue: null,
    disabled: false,
    readOnly: false,
    required: false,
  },
);

const emit = defineEmits<{
  openChange: [open: boolean, details: SelectOpenChangeDetails];
  valueChange: [value: string | null, details: SelectValueChangeDetails];
}>();

const root = ref<HTMLDivElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const initialized = ref(false);
const portalReference = ref<HTMLElement | null>(null);
const uncontrolledOpen = ref(props.defaultOpen);
const uncontrolledValue = ref<string | null>(props.defaultValue);
const renderedOpen = computed(() => props.open ?? uncontrolledOpen.value);
const renderedValue = computed(() => props.value ?? uncontrolledValue.value);
let instance: ReturnType<typeof ${spec.root.runtimeFactory}> | undefined;

const selectContext = {
  initialized,
  open: renderedOpen,
  portalReference,
  value: renderedValue,
};

provide("${spec.select.contextProjection.rootContext}", selectContext);

function setup() {
  initialized.value = false;
  instance?.destroy();
  if (!root.value) {
    instance = undefined;
    return;
  }

  instance = ${spec.root.runtimeFactory}(root.value, {
    autoComplete: props.autoComplete,
    defaultOpen: uncontrolledOpen.value,
    defaultValue: uncontrolledValue.value,
    disabled: props.disabled,
    form: props.form,
    name: props.name,
    portalReference: portalReference.value ?? undefined,
    readOnly: props.readOnly,
    required: props.required,
    ...(props.open !== undefined ? { open: props.open } : {}),
    ...(props.value !== undefined ? { value: props.value } : {}),
    onOpenChange(open, details) {
      emit("openChange", open, details);
      if (!details.isCanceled && props.open === undefined) {
        uncontrolledOpen.value = open;
      }
    },
    onValueChange(value, details) {
      emit("valueChange", value, details);
      if (!details.isCanceled && props.value === undefined) {
        uncontrolledValue.value = value;
      }
    },
  });
  initialized.value = true;
}

onMounted(setup);

watch(
  () => props.open,
  (open) => {
    if (open === undefined || !instance || instance.getOpen() === open) return;
    instance.setOpen(open, { emit: false });
  },
);

watch(
  () => props.value,
  (value) => {
    if (value === undefined || !instance || instance.getValue() === value) return;
    instance.setValue(value, { emit: false });
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    instance?.setDisabled(disabled);
  },
);

watch(
  () => [props.autoComplete, props.form, props.name, props.required] as const,
  ([autoComplete, form, name, required]) => {
    instance?.setFormOptions({ autoComplete, form, name, required });
  },
);

watch(
  () => props.readOnly,
  (readOnly) => {
    instance?.setReadOnly(readOnly);
  },
);

onBeforeUnmount(() => {
  initialized.value = false;
  instance?.destroy();
  instance = undefined;
});
</script>

<template>
  <div
    ${attrs.root}
    :${attrs.autoComplete}="props.autoComplete"
    :${attrs.disabled}="props.disabled ? '' : undefined"
    :${attrs.form}="props.form"
    :${attrs.name}="props.name"
    :${attrs.readOnly}="props.readOnly ? '' : undefined"
    :${attrs.required}="props.required ? '' : undefined"
    :data-state="renderedOpen ? 'open' : 'closed'"
    ref="root"
    v-bind="$attrs"
  >
    <input
      ref="input"
      ${attrs.input}
      :autocomplete="props.autoComplete"
      :disabled="props.disabled"
      :form="props.form"
      :name="props.name"
      :required="props.required"
      type="${spec.select.hiddenInput.type}"
      :value="renderedValue ?? ''"
      aria-hidden="true"
      tabindex="-1"
    />
    <slot />
  </div>
</template>
`;
}

function renderVueSelectVerticalSliceTrigger(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `<!-- ${SELECT_FIXTURE_COMMENT} -->
<script setup lang="ts">
import { inject, ref } from "vue";

const trigger = ref<HTMLButtonElement | null>(null);
const select = inject("${spec.select.contextProjection.rootContext}") as {
  open: { value: boolean };
  value: { value: string | null };
};
</script>

<template>
  <button
    ref="trigger"
    ${attrs.trigger}
    aria-haspopup="listbox"
    :aria-expanded="select.open.value ? 'true' : 'false'"
    :data-state="select.open.value ? 'open' : 'closed'"
    role="combobox"
    type="button"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
`;
}

function renderVueSelectVerticalSlicePortal(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `<!-- ${SELECT_FIXTURE_COMMENT} -->
<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    container?: string | HTMLElement;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);
const portal = ref<HTMLDivElement | null>(null);
const select = inject("${spec.select.contextProjection.rootContext}") as {
  initialized: { value: boolean };
  portalReference: { value: HTMLElement | null };
};

onMounted(() => {
  select.portalReference.value = portal.value;
});

onBeforeUnmount(() => {
  if (select.portalReference.value === portal.value) {
    select.portalReference.value = null;
  }
});
</script>

<template>
  <Teleport
    :to="props.container ?? 'body'"
    :disabled="props.disabled || !select.initialized.value"
  >
    <div ref="portal" data-floating-root ${attrs.portal} v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>
`;
}

function renderVueSelectVerticalSlicePopup(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `<!-- ${SELECT_FIXTURE_COMMENT} -->
<script setup lang="ts">
import { inject, ref } from "vue";

const popup = ref<HTMLDivElement | null>(null);
const select = inject("${spec.select.contextProjection.rootContext}") as {
  open: { value: boolean };
};
</script>

<template>
  <div
    ref="popup"
    ${attrs.popup}
    role="listbox"
    tabindex="-1"
    :data-state="select.open.value ? 'open' : 'closed'"
    hidden
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
`;
}

function renderVueSelectVerticalSliceItem(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `<!-- ${SELECT_FIXTURE_COMMENT} -->
<script setup lang="ts">
import { computed, inject, provide, ref } from "vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    value: string;
  }>(),
  {
    disabled: false,
  },
);
const item = ref<HTMLDivElement | null>(null);
const select = inject("${spec.select.contextProjection.rootContext}") as {
  value: { value: string | null };
};
const selected = computed(() => select.value.value === props.value);

provide("${spec.select.contextProjection.itemContext}", { value: props.value });
</script>

<template>
  <div
    ref="item"
    ${attrs.item}
    :${attrs.valueData}="props.value"
    role="option"
    :aria-selected="selected ? 'true' : 'false'"
    :aria-disabled="props.disabled ? 'true' : undefined"
    :data-disabled="props.disabled ? '' : undefined"
    :data-selected="selected ? '' : undefined"
    tabindex="-1"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
`;
}

function renderVueSelectVerticalSliceItemIndicator(spec: SelectSpecializedAdapterSpec): string {
  const attrs = createSelectAttributeMap(spec);

  return `<!-- ${SELECT_FIXTURE_COMMENT} -->
<script setup lang="ts">
import { computed, inject, ref } from "vue";

const indicator = ref<HTMLSpanElement | null>(null);
const select = inject("${spec.select.contextProjection.rootContext}") as {
  value: { value: string | null };
};
const item = inject("${spec.select.contextProjection.itemContext}") as {
  value: string;
};
const selected = computed(() => select.value.value === item.value);
</script>

<template>
  <span
    ref="indicator"
    ${attrs.itemIndicator}
    aria-hidden="true"
    :data-state="selected ? 'checked' : 'unchecked'"
    :data-visible="selected ? '' : undefined"
    :data-hidden="selected ? undefined : ''"
    :hidden="!selected"
    v-bind="$attrs"
  >
    <slot />
  </span>
</template>
`;
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
