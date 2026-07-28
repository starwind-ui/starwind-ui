import type {
  AdapterRangeControlComponentProjection,
  AdapterRangeControlFacts,
  AdapterRangeControlIndexProjection,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printVueRangeControlComponent(
  family: AdapterRangeControlComponentProjection,
): string {
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "thumb") return printThumb(family.facts);
  return printSimplePart(family.facts, family.part);
}

export function printVueRangeControlIndex(family: AdapterRangeControlIndexProjection): string {
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

function printRoot(facts: AdapterRangeControlFacts): string {
  const props = facts.props;
  const valueChange = facts.events.valueChange;
  const valueCommitted = facts.events.valueCommitted;

  if (valueChange.callbackTiming !== "before-state-commit" || !valueChange.cancelable) {
    throw new TypeError(
      "Vue range-control projection requires a cancelable before-state-commit valueChange event.",
    );
  }

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${props.orientation.type},
  type ${facts.serializer.valueType},
  type ${valueChange.detailsType},
  type ${valueCommitted.detailsType},
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
    ${props.defaultValue.name}?: ${facts.serializer.valueType};
    ${props.disabled.name}?: ${props.disabled.type};
    ${props.form.name}?: ${props.form.type};
    ${props.largeStep.name}?: ${props.largeStep.type};
    ${props.max.name}?: ${props.max.type};
    ${props.min.name}?: ${props.min.type};
    ${props.minStepsBetweenValues.name}?: ${props.minStepsBetweenValues.type};
    ${props.name.name}?: ${props.name.type};
    ${props.orientation.name}?: ${props.orientation.type};
    ${props.step.name}?: ${props.step.type};
  }>(),
  {
    ${props.defaultValue.name}: () => ${props.defaultValue.defaultValue},
    ${props.disabled.name}: ${props.disabled.defaultValue},
    ${props.largeStep.name}: ${props.largeStep.defaultValue},
    ${props.max.name}: ${props.max.defaultValue},
    ${props.min.name}: ${props.min.defaultValue},
    ${props.minStepsBetweenValues.name}: ${props.minStepsBetweenValues.defaultValue},
    ${props.orientation.name}: ${props.orientation.defaultValue},
    ${props.step.name}: ${props.step.defaultValue},
  },
);
const modelValue = defineModel<${facts.serializer.valueType}>();
const emit = defineEmits<{
  valueChange: [value: ${valueChange.valueType}, detail: ${valueChange.detailsType}];
  valueCommitted: [value: ${valueCommitted.valueType}, detail: ${valueCommitted.detailsType}];
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
const controlled = modelValue.value !== undefined;
const initialDefaultValue = props.${props.defaultValue.name};
const uncontrolledValue = ref<${facts.serializer.valueType}>(initialDefaultValue);
const renderedValue = computed(() =>
  controlled ? (modelValue.value ?? uncontrolledValue.value) : uncontrolledValue.value,
);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let unsubscribeChange: (() => void) | undefined;
let unsubscribeCommitted: (() => void) | undefined;
let refreshRevision = 0;

function valuesEqual(left: ${facts.serializer.valueType}, right: ${facts.serializer.valueType}): boolean {
  const leftValues = Array.isArray(left) ? left : [left];
  const rightValues = Array.isArray(right) ? right : [right];
  return (
    leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index])
  );
}

function serializeValue(value: ${facts.serializer.valueType}): string {
  return Array.isArray(value) ? JSON.stringify(value) : String(value);
}

async function refreshAfterVueFlush(): Promise<void> {
  const revision = ++refreshRevision;
  await nextTick();
  if (revision !== refreshRevision || !instance) return;

  instance.refresh();
  const value = modelValue.value;
  if (!controlled || value === undefined || valuesEqual(instance.${facts.state.getter}(), value)) {
    return;
  }
  instance.${facts.setter.method}(value, ${formatOptions(facts.setter.options)});
}

defineExpose({ element });

onMounted(() => {
  if (!element.value) return;
  instance = ${facts.runtime.factory}(element.value, {
    ${props.defaultValue.name}: initialDefaultValue,
    ${props.disabled.name}: props.${props.disabled.name},
    ${props.form.name}: props.${props.form.name},
    ${props.largeStep.name}: props.${props.largeStep.name},
    ${props.max.name}: props.${props.max.name},
    ${props.min.name}: props.${props.min.name},
    ${props.minStepsBetweenValues.name}: props.${props.minStepsBetweenValues.name},
    ${props.name.name}: props.${props.name.name},
    ${props.orientation.name}: props.${props.orientation.name},
    ${props.step.name}: props.${props.step.name},
    ...(controlled && modelValue.value !== undefined
      ? { ${props.value.name}: modelValue.value }
      : {}),
  });
  unsubscribeChange = instance.subscribe("${valueChange.name}", (detail) => {
    emit("valueChange", detail.${valueChange.valueProperty}, detail);
    if (detail.isCanceled) return;

    if (!controlled) uncontrolledValue.value = detail.${valueChange.valueProperty};
    modelValue.value = detail.${valueChange.valueProperty};
  });
  unsubscribeCommitted = instance.subscribe("${valueCommitted.name}", (detail) => {
    emit("valueCommitted", detail.${valueCommitted.valueProperty}, detail);
  });
});

onUpdated(() => {
  void refreshAfterVueFlush();
});

watch(
  () => modelValue.value,
  () => {
    if (controlled) void refreshAfterVueFlush();
  },
  { flush: "post" },
);

watch(
  () => props.${props.disabled.name},
  (value) => instance?.${facts.setters.disabled}(value),
);

watch(
  () => props.${props.name.name},
  (value) => instance?.${facts.setters.name}(value),
);

watch(
  () => [
    props.${props.form.name},
    props.${props.largeStep.name},
    props.${props.max.name},
    props.${props.min.name},
    props.${props.minStepsBetweenValues.name},
    props.${props.orientation.name},
    props.${props.step.name},
  ] as const,
  () => {
    if (!instance) return;
    instance.${facts.setters.options}({
      ${props.form.name}: props.${props.form.name},
      ${props.largeStep.name}: props.${props.largeStep.name},
      ${props.max.name}: props.${props.max.name},
      ${props.min.name}: props.${props.min.name},
      ${props.minStepsBetweenValues.name}: props.${props.minStepsBetweenValues.name},
      ${props.orientation.name}: props.${props.orientation.name},
      ${props.step.name}: props.${props.step.name},
    });
    if (!controlled) uncontrolledValue.value = instance.${facts.state.getter}();
  },
);

onBeforeUnmount(() => {
  refreshRevision += 1;
  unsubscribeChange?.();
  unsubscribeCommitted?.();
  unsubscribeChange = undefined;
  unsubscribeCommitted = undefined;
  instance?.destroy();
  instance = undefined;
});
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="element"
    ${facts.attrs.root}
    :${facts.attrs.defaultValue}="serializeValue(initialDefaultValue)"
    :${facts.attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    :${facts.attrs.form}="props.${props.form.name}"
    :${facts.attrs.largeStep}="props.${props.largeStep.name}"
    :${facts.attrs.max}="props.${props.max.name}"
    :${facts.attrs.min}="props.${props.min.name}"
    :${facts.attrs.minStepsBetweenValues}="props.${props.minStepsBetweenValues.name}"
    :${facts.attrs.name}="props.${props.name.name}"
    :${facts.attrs.orientation}="props.${props.orientation.name}"
    :${facts.attrs.step}="props.${props.step.name}"
    :${facts.attrs.value}="serializeValue(renderedValue)"
    role="${facts.rootRole}"
    v-bind="attrs"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printSimplePart(
  facts: AdapterRangeControlFacts,
  partName: Exclude<AdapterRangeControlComponentProjection["part"], "root" | "thumb">,
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = part.defaultElement === "span" ? "HTMLSpanElement" : "HTMLDivElement";

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const element = ref<${elementType} | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement} ref="element" ${facts.attrs[partName]} v-bind="attrs"><slot /></${part.defaultElement}>
</template>
`;
}

function printThumb(facts: AdapterRangeControlFacts): string {
  const props = facts.props;
  const part = facts.parts.thumb;

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  ${props.index.name}?: ${props.index.type};
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    ${facts.attrs.thumb}
    :${facts.attrs.index}="${props.index.name}"
    v-bind="attrs"
  >
    <slot />
    <input
      ${facts.attrs.input}
      ${facts.attrs.inputAriaHidden}="${facts.thumbInput.hiddenRangeInput.ariaHiddenValue}"
      :style="{
        border: 0,
        clipPath: 'inset(50%)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        position: 'absolute',
        whiteSpace: 'nowrap',
        width: '1px',
      }"
      :${facts.attrs.inputTabIndex === "tabIndex" ? "tabindex" : facts.attrs.inputTabIndex}="${facts.thumbInput.hiddenRangeInput.tabIndexValue}"
      ${facts.attrs.inputType}="${facts.thumbInput.hiddenRangeInput.typeValue}"
    />
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
