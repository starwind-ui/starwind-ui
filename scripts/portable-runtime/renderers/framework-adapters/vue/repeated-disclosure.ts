import type {
  AdapterRepeatedDisclosureComponentProjection,
  AdapterRepeatedDisclosureFacts,
  AdapterRepeatedDisclosureIndexProjection,
} from "../types.js";
import { projectVueDetailedEvent, projectVueModel } from "./public-contract.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printVueRepeatedDisclosureComponent(
  family: AdapterRepeatedDisclosureComponentProjection,
): string {
  switch (family.part) {
    case "root":
      return printRoot(family.facts);
    case "item":
      return printItem(family.facts);
    case "header":
      return printHeader(family.facts);
    case "trigger":
      return printTrigger(family.facts);
    case "panel":
      return printPanel(family.facts);
  }
}

export function printVueRepeatedDisclosureIndex(family: AdapterRepeatedDisclosureIndexProjection): {
  contents: string;
  path: string;
} {
  const { facts } = family;
  const imports = facts.index.importMembers
    .map(({ from, name }) => `import ${name} from "${from}.vue";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map(({ key, name }) => `  ${key}: ${name},`)
    .join("\n");
  const exports = facts.index.importMembers.map(({ name }) => name).join(",\n  ");
  return {
    contents: `// ${NON_SHIPPING_COMMENT}

${imports}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${exports},
};

export default ${facts.exports.namespace};

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: `${facts.exports.namespace.toLowerCase()}/index.ts`,
  };
}

export function printVueRepeatedDisclosureContext(facts: AdapterRepeatedDisclosureFacts): string {
  const context = getContextNames(facts);
  return `import { inject, type InjectionKey } from "vue";

export type ${context.type} = Readonly<{
  value: string | undefined;
  disabled: boolean;
}>;

export const ${context.key}: InjectionKey<${context.type}> = Symbol(
  "Starwind${facts.displayName}Item",
);

export function ${context.hook}(componentName: string): ${context.type} {
  const context = inject(${context.key});
  if (!context) {
    throw new Error(\`\${componentName} must be used within ${facts.exports.item}.\`);
  }
  return context;
}
`;
}

function printRoot(facts: AdapterRepeatedDisclosureFacts): string {
  const model = projectVueModel(facts.state.name);
  const event = projectVueDetailedEvent(facts.events.valueChange.callbackProp);
  const part = facts.parts.root;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import {
  type ${facts.state.type},
  type ${facts.events.valueChange.detailsType},
  ${facts.runtime.factory},
} from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    type?: ${facts.props.type.type};
    defaultValue?: ${facts.state.type};
    ${model.modelProp}?: ${facts.state.type};
    collapsible?: boolean;
  }>(),
  {
    type: ${facts.props.type.defaultValue},
    defaultValue: undefined,
    ${model.modelProp}: undefined,
    collapsible: ${facts.props.collapsible.defaultValue},
  },
);
const emit = defineEmits<{
  ${event.emit}: [value: ${facts.state.type}, detail: ${facts.events.valueChange.detailsType}];
  "${model.updateEvent}": [value: ${facts.state.type}];
}>();
defineSlots<{ default?: (props: { value: ${facts.state.type} }) => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const initialDefaultValue = props.defaultValue;
const uncontrolledValue = ref<${facts.state.type}>(initialDefaultValue ?? null);
const renderedValue = computed(() =>
  props.${model.modelProp} !== undefined ? props.${model.modelProp} : uncontrolledValue.value,
);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
defineExpose({ element: rootRef });

function handleValueChange(detail: ${facts.events.valueChange.detailsType}): void {
  const nextValue = detail.${facts.events.valueChange.valueProperty};
  const eventWasControlled = props.${model.modelProp} !== undefined;
  emit("${event.emit}", nextValue, detail);
  if (detail.isCanceled) return;
  if (!eventWasControlled) uncontrolledValue.value = nextValue;
  emit("${model.updateEvent}", nextValue);
}

function destroyOwnedInstance(): void {
  const ownedInstance = instance;
  if (!ownedInstance) return;
  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;
  instance = ${facts.runtime.factory}(element, {
    type: props.type,
    defaultValue: uncontrolledValue.value,
    collapsible: props.collapsible,
    ...(props.${model.modelProp} === undefined ? {} : { value: props.${model.modelProp} }),
    ${facts.events.valueChange.callbackProp}: handleValueChange,
  });
}

onMounted(setupRuntime);
watch(
  () => props.${model.modelProp},
  (nextValue, previousValue) => {
    const controllednessChanged = (nextValue === undefined) !== (previousValue === undefined);
    if (controllednessChanged) {
      if (nextValue === undefined && instance) uncontrolledValue.value = instance.${facts.state.getter}();
      setupRuntime();
      return;
    }
    if (nextValue === undefined || !instance || ${facts.valueEqualityHelper}(instance.${facts.state.getter}(), nextValue)) return;
    instance.${facts.setter.method}(nextValue, ${facts.setter.options?.emit === false ? "{ emit: false }" : "{}"});
  },
  { flush: "post" },
);
watch([() => props.type, () => props.collapsible], setupRuntime, { flush: "post" });
onBeforeUnmount(destroyOwnedInstance);

function ${facts.valueEqualityHelper}(left: ${facts.state.type}, right: ${facts.state.type}): boolean {
  if (Array.isArray(left) || Array.isArray(right)) return JSON.stringify(left) === JSON.stringify(right);
  return left === right;
}

const defaultValueAttribute = Array.isArray(initialDefaultValue)
  ? JSON.stringify(initialDefaultValue)
  : initialDefaultValue;
</script>

<template>
  <${part.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${part.name}"
    :${facts.attrs.type}="props.type"
    :${facts.attrs.defaultValue}="defaultValueAttribute"
    :${facts.attrs.collapsible}="String(props.collapsible)"
    ${facts.attrs.rootState}="closed"
  >
    <slot :value="renderedValue" />
  </${part.defaultElement}>
</template>
`;
}

function printItem(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.item;
  const context = getContextNames(facts);
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { provide, ref, useAttrs } from "vue";
import { ${context.key}, type ${context.type} } from "./${context.file}";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ value?: string; disabled?: boolean }>(), {
  value: undefined,
  disabled: false,
});
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
const itemContext: ${context.type} = {
  get value() { return props.value; },
  get disabled() { return props.disabled; },
};
provide(${context.key}, itemContext);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="attrs"
    ${facts.attrs.item}
    data-sw-part="${part.name}"
    :${facts.attrs.itemValue}="props.value"
    :${facts.attrs.disabled}="props.disabled ? '' : undefined"
    ${facts.attrs.itemState}="closed"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printHeader(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.header;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.header} data-sw-part="${part.name}">
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printTrigger(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.trigger;
  const context = getContextNames(facts);
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";
import { ${context.hook} } from "./${context.file}";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLButtonElement | null>(null);
${context.hook}("${facts.exports.trigger}");
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="attrs"
    ${facts.attrs.trigger}
    data-sw-part="${part.name}"
    ${facts.attrs.triggerType}="button"
    ${facts.attrs.triggerExpanded}="false"
    ${facts.attrs.triggerState}="closed"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printPanel(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.panel;
  const context = getContextNames(facts);
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";
import { ${context.hook} } from "./${context.file}";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
${context.hook}("${facts.exports.panel}");
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="attrs"
    ${facts.attrs.panel}
    data-sw-part="${part.name}"
    ${facts.panelVisibility.stateAttribute}="closed"
    ${facts.panelVisibility.hiddenAttribute}
    style="animation: none"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function getContextNames(facts: AdapterRepeatedDisclosureFacts) {
  const base = `${facts.displayName}ItemContext`;
  return {
    file: base,
    hook: `use${base}`,
    key: `${facts.displayName.charAt(0).toLowerCase()}${facts.displayName.slice(1)}ItemContextKey`,
    type: `${base}Value`,
  };
}
