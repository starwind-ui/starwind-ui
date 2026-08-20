import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterControlledValuePresenceComponentProjection,
  AdapterControlledValuePresenceFacts,
  AdapterControlledValuePresenceIndexProjection,
} from "../types.js";
import { projectVueDetailedEvent, projectVueModel } from "./public-contract.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printVueControlledValuePresenceComponent(
  family: AdapterControlledValuePresenceComponentProjection,
): string {
  switch (family.part) {
    case "root":
      return printRoot(family.facts);
    case "list":
      return printList(family.facts);
    case "tab":
      return printTab(family.facts);
    case "panel":
      return printPanel(family.facts);
    case "indicator":
      return printIndicator(family.facts);
  }
}

export function printVueControlledValuePresenceIndex(
  family: AdapterControlledValuePresenceIndexProjection,
): { contents: string; path: string } {
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

export { ${facts.context.componentName}, ${facts.context.hookName} } from "./${facts.context.componentName}";

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

export function printVueControlledValuePresenceContext(
  facts: AdapterControlledValuePresenceFacts,
): string {
  const orientation = facts.props.orientation;
  const value = facts.props.value;
  return `import {
  inject,
  type InjectionKey,
  type Ref,
} from "vue";
import type { ${orientation.type}, ${facts.state.type} } from "${facts.runtime.importSource}";

export type ${facts.context.typeName} = Readonly<{
  ${orientation.name}: Readonly<Ref<${orientation.type}>>;
  ${value.name}: Readonly<Ref<${facts.state.type}>>;
}>;

export const ${facts.context.componentName}: InjectionKey<${facts.context.typeName}> = Symbol(
  "Starwind${facts.displayName}",
);

export function ${facts.context.hookName}(componentName: string): ${facts.context.typeName} {
  const context = inject(${facts.context.componentName});
  if (!context) {
    throw new Error(\`\${componentName} must be used within ${facts.exports.root}.\`);
  }
  return context;
}
`;
}

function printRoot(facts: AdapterControlledValuePresenceFacts): string {
  const model = projectVueModel(facts.state.name);
  const event = projectVueDetailedEvent(facts.events.valueChange.callbackProp);
  const part = facts.parts.root;
  const setterOptions = formatOptions(facts.setter.options);
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import {
  type ${facts.props.orientation.type},
  type ${facts.state.type},
  type ${facts.events.valueChange.detailsType},
  ${facts.runtime.factory},
} from "${facts.runtime.importSource}";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  ref,
  toRef,
  useAttrs,
  watch,
} from "vue";
import { ${facts.context.componentName} } from "./${facts.context.componentName}";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    defaultValue?: ${facts.state.type};
    ${model.modelProp}?: ${facts.state.type};
    orientation?: ${facts.props.orientation.type};
    syncKey?: string;
  }>(),
  {
    defaultValue: undefined,
    ${model.modelProp}: undefined,
    orientation: ${facts.props.orientation.defaultValue},
    syncKey: undefined,
  },
);
const emit = defineEmits<{
  ${event.emit}: [value: ${facts.state.type}, detail: ${facts.events.valueChange.detailsType}];
  "${model.updateEvent}": [value: ${facts.state.type}];
}>();
defineSlots<{ default?: (props: { value: ${facts.state.type}; orientation: ${facts.props.orientation.type} }) => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const initialDefaultValue = props.defaultValue;
const uncontrolledValue = ref<${facts.state.type}>(initialDefaultValue ?? null);
const renderedValue = computed(() =>
  props.${model.modelProp} !== undefined ? props.${model.modelProp} : uncontrolledValue.value,
);
const orientation = toRef(props, "orientation");
provide(${facts.context.componentName}, { orientation, value: renderedValue });
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
defineExpose({ element: rootRef });

function handleValueChange(_value: ${facts.state.type}, detail: ${facts.events.valueChange.detailsType}): void {
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
    defaultValue: uncontrolledValue.value,
    orientation: props.orientation,
    syncKey: props.syncKey,
    ...(props.${model.modelProp} === undefined ? {} : { value: props.${model.modelProp} }),
    ${facts.events.valueChange.callbackProp}: handleValueChange,
  });
  if (props.${model.modelProp} === undefined) uncontrolledValue.value = instance.${facts.state.getter}();
}

onMounted(setupRuntime);
onUpdated(() => instance?.refresh());
watch(
  () => props.${model.modelProp},
  (nextValue, previousValue) => {
    const controllednessChanged = (nextValue === undefined) !== (previousValue === undefined);
    if (controllednessChanged) {
      if (nextValue === undefined && instance) uncontrolledValue.value = instance.${facts.state.getter}();
      setupRuntime();
      return;
    }
    if (nextValue === undefined || !instance || Object.is(instance.${facts.state.getter}(), nextValue)) return;
    instance.${facts.setter.method}(nextValue, ${setterOptions});
  },
  { flush: "post" },
);
watch(
  () => props.syncKey,
  (nextValue, previousValue) => {
    if (nextValue !== previousValue) setupRuntime();
  },
  { flush: "post" },
);
onBeforeUnmount(destroyOwnedInstance);

function ${facts.serializer.functionName}(value: ${facts.state.type} | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value === null ? "null" : value;
}
</script>

<template>
  <${part.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${part.name}"
    :${facts.attrs.defaultValue}="${facts.serializer.functionName}(initialDefaultValue)"
    :${facts.attrs.orientation}="props.orientation"
    :${facts.attrs.syncKey}="props.syncKey"
    :${facts.attrs.value}="${facts.serializer.functionName}(renderedValue)"
  >
    <slot :value="renderedValue" :orientation="props.orientation" />
  </${part.defaultElement}>
</template>
`;
}

function printList(facts: AdapterControlledValuePresenceFacts): string {
  const part = facts.parts.list;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref } from "vue";
import { ${facts.context.hookName} } from "./${facts.context.componentName}";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ activateOnFocus?: boolean; loopFocus?: boolean }>(), {
  activateOnFocus: ${facts.props.activateOnFocus.defaultValue},
  loopFocus: ${facts.props.loopFocus.defaultValue},
});
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);
const { orientation } = ${facts.context.hookName}("${facts.exports.list}");
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.list}
    data-sw-part="${part.name}"
    :${facts.attrs.activateOnFocus}="props.activateOnFocus ? '' : undefined"
    :${facts.attrs.loopFocus}="props.loopFocus ? undefined : 'false'"
    :${facts.attrs.listOrientation}="orientation"
    :${facts.attrs.ariaOrientation}="orientation === 'vertical' ? 'vertical' : undefined"
    role="${part.role}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printTab(facts: AdapterControlledValuePresenceFacts): string {
  const part = facts.parts.tab;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { ${facts.context.hookName} } from "./${facts.context.componentName}";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ disabled?: boolean; value: string }>(), {
  disabled: ${facts.props.disabled.defaultValue},
});
defineSlots<{ default?: (props: { active: boolean }) => unknown }>();
const element = ref<HTMLButtonElement | null>(null);
const { orientation, value: selectedValue } = ${facts.context.hookName}("${facts.exports.tab}");
const active = computed(() => props.value === selectedValue.value);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.tab}
    data-sw-part="${part.name}"
    :${facts.attrs.disabled}="props.disabled ? '' : undefined"
    :${facts.attrs.tabOrientation}="orientation"
    :${facts.attrs.tabValue}="props.value"
    :${facts.attrs.tabAriaSelected}="active"
    :${facts.attrs.tabActive}="active ? '' : undefined"
    :${facts.attrs.tabState}="active ? 'active' : 'inactive'"
    :disabled="props.disabled"
    :tabindex="active && !props.disabled ? 0 : -1"
    role="${part.role}"
    type="button"
  >
    <slot :active="active" />
  </${part.defaultElement}>
</template>
`;
}

function printPanel(facts: AdapterControlledValuePresenceFacts): string {
  const part = facts.parts.panel;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { ${facts.context.hookName} } from "./${facts.context.componentName}";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ keepMounted?: boolean; value: string }>(), {
  keepMounted: ${facts.props.keepMounted.defaultValue},
});
defineSlots<{ default?: (props: { active: boolean }) => unknown }>();
const element = ref<HTMLDivElement | null>(null);
const { orientation, value: selectedValue } = ${facts.context.hookName}("${facts.exports.panel}");
const active = computed(() => props.value === selectedValue.value);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.panel}
    data-sw-part="${part.name}"
    :${facts.attrs.keepMounted}="props.keepMounted ? '' : undefined"
    :${facts.attrs.panelOrientation}="orientation"
    :${facts.attrs.panelValue}="props.value"
    :${facts.attrs.panelActive}="active ? '' : undefined"
    :${facts.attrs.panelState}="active ? 'active' : 'inactive'"
    :${facts.attrs.panelHidden}="!active"
    :tabindex="active ? 0 : -1"
    role="${part.role}"
  >
    <slot :active="active" />
  </${part.defaultElement}>
</template>
`;
}

function printIndicator(facts: AdapterControlledValuePresenceFacts): string {
  const part = facts.parts.indicator;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref } from "vue";
import { ${facts.context.hookName} } from "./${facts.context.componentName}";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLSpanElement | null>(null);
const { orientation } = ${facts.context.hookName}("${facts.exports.indicator}");
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.indicator}
    data-sw-part="${part.name}"
    :${facts.attrs.indicatorOrientation}="orientation"
    role="${part.role}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function formatOptions(options: Record<string, boolean | number | string> | undefined): string {
  if (!options) return "{}";
  const entries = Object.entries(options).map(
    ([name, value]) => `${name}: ${JSON.stringify(value)}`,
  );
  return `{ ${entries.join(", ")} }`;
}
