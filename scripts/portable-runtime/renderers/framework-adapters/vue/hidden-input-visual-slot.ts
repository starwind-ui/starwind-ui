import type {
  AdapterHiddenInputVisualSlotComponentProjection,
  AdapterHiddenInputVisualSlotFacts,
  AdapterHiddenInputVisualSlotIndexProjection,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printVueHiddenInputVisualSlotComponent(
  family: AdapterHiddenInputVisualSlotComponentProjection,
): string {
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "slot") return printSlot(family.facts);
  return printSimplePart(family.facts, family.part);
}

export function printVueHiddenInputVisualSlotIndex(
  family: AdapterHiddenInputVisualSlotIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exports = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";\n`;
}

function printRoot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const props = facts.props;
  const event = facts.event;
  if (event.callbackTiming !== "before-state-commit" || !event.cancelable) {
    throw new TypeError(
      "Vue hidden-input-visual-slot projection requires a cancelable before-state-commit valueChange event.",
    );
  }

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${event.detailsType},
} from "${facts.runtime.importSource}";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  watch,
} from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${props.defaultValue.name}?: ${props.defaultValue.type};
    ${props.disabled.name}?: ${props.disabled.type};
    ${props.form.name}?: ${props.form.type};
    ${props.id.name}?: ${props.id.type};
    ${props.maxLength.name}?: ${props.maxLength.type};
    ${props.name.name}?: ${props.name.type};
    ${props.pattern.name}?: ${props.pattern.type};
    ${props.readOnly.name}?: ${props.readOnly.type};
    ${props.required.name}?: ${props.required.type};
  }>(),
  {
    ${props.disabled.name}: ${props.disabled.defaultValue},
    ${props.maxLength.name}: ${props.maxLength.defaultValue},
    ${props.readOnly.name}: ${props.readOnly.defaultValue},
    ${props.required.name}: ${props.required.defaultValue},
  },
);
const modelValue = defineModel<${facts.state.type}>();
const emit = defineEmits<{
  valueChange: [value: ${event.valueType}, detail: ${event.detailsType}];
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
const controlled = modelValue.value !== undefined;
const initialDefaultValue = props.${props.defaultValue.name} ?? "";
const uncontrolledValue = ref(initialDefaultValue);
const renderedValue = computed(() =>
  controlled ? (modelValue.value ?? uncontrolledValue.value) : uncontrolledValue.value,
);
const patternText = computed(() => normalizePattern(props.${props.pattern.name}));
const inputMode = computed(() =>
  ${JSON.stringify(facts.pattern.numericPatternExamples)}.includes(patternText.value)
    ? "numeric"
    : "text",
);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let unsubscribeChange: (() => void) | undefined;
let lifecycleRevision = 0;
let refreshRevision = 0;
let slotElements: HTMLElement[] = [];

function normalizePattern(pattern: RegExp | string | undefined): string {
  const source = pattern instanceof RegExp ? pattern.source : pattern;
  return (source ?? ${JSON.stringify(facts.pattern.defaultPattern)}).replace(/^\\^|\\$$/g, "");
}

function destroyInstance(): void {
  unsubscribeChange?.();
  unsubscribeChange = undefined;
  instance?.destroy();
  instance = undefined;
}

function startInstance(value = renderedValue.value): void {
  if (!element.value) return;
  instance = ${facts.runtime.factory}(element.value, {
    ${props.defaultValue.name}: value,
    ${props.disabled.name}: props.${props.disabled.name},
    ${props.form.name}: props.${props.form.name},
    ${props.id.name}: props.${props.id.name},
    ${props.maxLength.name}: props.${props.maxLength.name},
    ${props.name.name}: props.${props.name.name},
    ${props.pattern.name}: patternText.value,
    ${props.readOnly.name}: props.${props.readOnly.name},
    ${props.required.name}: props.${props.required.name},
    ...(controlled && modelValue.value !== undefined
      ? { ${props.value.name}: modelValue.value }
      : {}),
  });
  slotElements = getOwnedSlotElements();
  unsubscribeChange = instance.subscribe("valueChange", (detail) => {
    emit("valueChange", detail.${event.valueProperty}, detail);
    if (detail.isCanceled) return;

    if (!controlled) uncontrolledValue.value = detail.${event.valueProperty};
    modelValue.value = detail.${event.valueProperty};
    if (controlled) void refreshAfterVueFlush();
  });
}

function getOwnedSlotElements(): HTMLElement[] {
  if (!element.value) return [];
  return [...element.value.querySelectorAll<HTMLElement>("[${facts.attrs.slot}]")].filter(
    (slot) => slot.closest("[${facts.attrs.root}]") === element.value,
  );
}

function visualSlotsChanged(): boolean {
  const nextSlots = getOwnedSlotElements();
  return (
    nextSlots.length !== slotElements.length ||
    nextSlots.some((slot, index) => slot !== slotElements[index])
  );
}

async function recreateAfterVueFlush(): Promise<void> {
  const revision = ++lifecycleRevision;
  const value = instance?.${facts.state.getter}() ?? renderedValue.value;
  destroyInstance();
  await nextTick();
  if (revision !== lifecycleRevision) return;
  startInstance(value);
}

async function refreshAfterVueFlush(): Promise<void> {
  const revision = ++refreshRevision;
  await nextTick();
  if (revision !== refreshRevision || !instance) return;

  instance.refresh();
  slotElements = getOwnedSlotElements();
  const value = modelValue.value;
  if (controlled && value !== undefined && instance.${facts.state.getter}() !== value) {
    instance.${facts.setter.method}(value, ${formatOptions(facts.setter.options)});
    return;
  }
  if (!controlled) uncontrolledValue.value = instance.${facts.state.getter}();
}

defineExpose({ element });

onMounted(() => startInstance());

onUpdated(() => {
  if (visualSlotsChanged()) void refreshAfterVueFlush();
});

watch(
  () => modelValue.value,
  (value) => {
    if (!controlled || value === undefined || !instance) return;
    if (instance.${facts.state.getter}() !== value) {
      instance.${facts.setter.method}(value, ${formatOptions(facts.setter.options)});
    }
  },
  { flush: "post" },
);

watch(
  () => props.${props.disabled.name},
  (value) => instance?.${facts.setters.disabled}(value),
);

watch(
  () => [
    props.${props.form.name},
    props.${props.id.name},
    props.${props.name.name},
    props.${props.required.name},
  ] as const,
  () =>
    instance?.${facts.setters.formOptions}({
      ${props.form.name}: props.${props.form.name},
      ${props.id.name}: props.${props.id.name},
      ${props.name.name}: props.${props.name.name},
      ${props.required.name}: props.${props.required.name},
    }),
);

watch(
  () => props.${props.maxLength.name},
  () => void refreshAfterVueFlush(),
  { flush: "post" },
);

watch(
  () => [props.${props.pattern.name}, props.${props.readOnly.name}] as const,
  () => void recreateAfterVueFlush(),
  { flush: "post" },
);

onBeforeUnmount(() => {
  lifecycleRevision += 1;
  refreshRevision += 1;
  destroyInstance();
});
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="element"
    ${facts.attrs.root}
    :${facts.attrs.defaultValue}="initialDefaultValue"
    :${facts.attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    :${facts.attrs.form}="props.${props.form.name}"
    :${facts.attrs.id}="props.${props.id.name}"
    :${facts.attrs.maxLength}="props.${props.maxLength.name}"
    :${facts.attrs.name}="props.${props.name.name}"
    :${facts.attrs.pattern}="patternText"
    :${facts.attrs.readOnly}="props.${props.readOnly.name} ? '' : undefined"
    :${facts.attrs.required}="props.${props.required.name} ? '' : undefined"
    :${facts.attrs.value}="renderedValue"
    :${facts.attrs.ariaDisabled}="props.${props.disabled.name} ? 'true' : 'false'"
    :${facts.attrs.rootTabIndex === "tabIndex" ? "tabindex" : facts.attrs.rootTabIndex}="props.${props.disabled.name} ? -1 : 0"
    v-bind="attrs"
  >
    <${facts.parts.input.defaultElement}
      v-once
      ${facts.attrs.input}
      ${facts.attrs.inputAutocomplete}="${facts.nativeInput.autocompleteValue}"
      ${facts.attrs.inputClass}="${facts.nativeInput.hiddenClassValue}"
      :disabled="props.${props.disabled.name}"
      :form="props.${props.form.name}"
      :id="props.${props.id.name}"
      :${facts.attrs.inputMode}="inputMode"
      :${facts.attrs.inputMaxLength}="props.${props.maxLength.name}"
      :name="props.${props.name.name}"
      :${facts.attrs.inputReadOnly}="props.${props.readOnly.name}"
      :required="props.${props.required.name}"
      :${facts.attrs.inputTabIndex === "tabIndex" ? "tabindex" : facts.attrs.inputTabIndex}="${facts.nativeInput.tabIndexValue}"
      :value="initialDefaultValue"
    />
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printSimplePart(
  facts: AdapterHiddenInputVisualSlotFacts,
  partName: "group" | "separator",
): string {
  const part = facts.parts[partName];
  const elementType = part.defaultElement === "span" ? "HTMLSpanElement" : "HTMLDivElement";
  const separatorAttrs =
    partName === "separator"
      ? ` ${facts.attrs.separatorAriaHidden}="${facts.visualSlots.separator.ariaHiddenValue}" role="${facts.visualSlots.separator.role}"`
      : "";

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const element = ref<${elementType} | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement} ref="element" ${part.discoveryAttribute}${separatorAttrs} v-bind="attrs"><slot /></${part.defaultElement}>
</template>
`;
}

function printSlot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const props = facts.props;
  const part = facts.parts.slot;

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  ${props.index.name}?: ${props.index.type};
}>();
defineSlots<{
  ${facts.visualSlots.caretRendering.outletName}?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    ${facts.attrs.slot}
    :${facts.attrs.slotIndex}="${props.index.name}"
    v-bind="attrs"
  >
    <${facts.parts.slotChar.defaultElement} ${facts.attrs.slotChar} />
    <${facts.parts.slotCaret.defaultElement}
      ${facts.attrs.slotCaret}
      ${facts.attrs.slotCaretClass}="${facts.visualSlots.slotCaret.classValue}"
      ${facts.attrs.slotCaretHidden}
    >
      <slot name="${facts.visualSlots.caretRendering.outletName}">
        <div class="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
      </slot>
    </${facts.parts.slotCaret.defaultElement}>
  </${part.defaultElement}>
</template>
`;
}

function formatOptions(options: Record<string, boolean | number | string> | undefined): string {
  if (!options) return "{}";
  return `{ ${Object.entries(options)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ")} }`;
}
