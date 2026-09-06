import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterFormControlCompositionComponentProjection,
  AdapterFormControlCompositionFacts,
  AdapterFormControlCompositionIndexProjection,
  AdapterFormControlCompositionPartName,
} from "../types.js";

export function printVueFieldCompositionComponent(
  family: AdapterFormControlCompositionComponentProjection,
): string {
  switch (family.part) {
    case "root":
      return printRoot(family.facts);
    case "control":
      return printControl(family.facts);
    case "error":
      return printError(family.facts);
    case "validity":
      return printValidity(family.facts);
    case "description":
    case "item":
    case "label":
      return printSimplePart(family.facts, family.part);
  }
}

export function printVueFieldCompositionIndex(
  family: AdapterFormControlCompositionIndexProjection,
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
    contents: `
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

function printRoot(facts: AdapterFormControlCompositionFacts): string {
  const root = facts.parts.root;
  const dirty = facts.rootState.dirty;
  const disabled = facts.rootState.disabled;
  const invalid = facts.rootState.invalid;
  const name = facts.rootState.name;
  const touched = facts.rootState.touched;
  const errorVisibility = facts.formTiming.errorVisibility;
  const revalidationTiming = facts.formTiming.revalidationTiming;
  const validationTiming = facts.formTiming.validationTiming;

  return `<script setup lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import type { ${facts.formTiming.typeImport.name} } from "${facts.formTiming.typeImport.importSource}";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    ${errorVisibility.dataPropName}?: ${errorVisibility.prop.type};
    ${revalidationTiming.dataPropName}?: ${revalidationTiming.prop.type};
    ${validationTiming.dataPropName}?: ${validationTiming.prop.type};
    ${dirty.prop.name}?: ${dirty.prop.type};
    ${disabled.prop.name}?: ${disabled.prop.type};
    ${errorVisibility.prop.name}?: ${errorVisibility.prop.type};
    ${invalid.prop.name}?: ${invalid.prop.type};
    ${name.prop.name}?: ${name.prop.type};
    ${revalidationTiming.prop.name}?: ${revalidationTiming.prop.type};
    ${touched.prop.name}?: ${touched.prop.type};
    ${validationTiming.prop.name}?: ${validationTiming.prop.type};
  }>(),
  {
    ${dirty.prop.name}: undefined,
    ${disabled.prop.name}: ${disabled.prop.defaultValue},
    ${invalid.prop.name}: undefined,
    ${touched.prop.name}: undefined,
  },
);
defineSlots<{ default?: () => unknown }>();
const rootRef = ref<HTMLDivElement | null>(null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
defineExpose({ element: rootRef });

function destroyOwnedInstance(): void {
  const ownedInstance = instance;
  if (!ownedInstance) return;
  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}

onMounted(() => {
  const element = rootRef.value;
  if (!element) throw new Error("${facts.exports.root} requires its root before Runtime setup.");
  instance = ${facts.runtime.factory}(element, {
    ${dirty.prop.name}: props.${dirty.prop.name},
    ${disabled.prop.name}: props.${disabled.prop.name},
    ${invalid.prop.name}: props.${invalid.prop.name},
    ${name.prop.name}: props.${name.prop.name},
    ${touched.prop.name}: props.${touched.prop.name},
  });
});

watch(
  () => props.${dirty.prop.name},
  (value) => instance?.${dirty.setter}(value),
  { flush: "post" },
);
watch(
  () => props.${disabled.prop.name},
  (value) => instance?.${disabled.setter}(value),
  { flush: "post" },
);
watch(
  () => props.${invalid.prop.name},
  (value) => instance?.${invalid.setter}(value),
  { flush: "post" },
);
watch(
  () => props.${name.prop.name},
  (value) => instance?.${name.setter}(value),
  { flush: "post" },
);
watch(
  () => props.${touched.prop.name},
  (value) => instance?.${touched.setter}(value),
  { flush: "post" },
);
onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <${root.defaultElement}
    ref="rootRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.root}
    data-sw-part="${root.name}"
    :${dirty.attribute}="props.${dirty.prop.name} ? '' : undefined"
    :${disabled.attribute}="props.${disabled.prop.name} ? '' : undefined"
    :${errorVisibility.attribute}="props.${errorVisibility.dataPropName} ?? props.${errorVisibility.prop.name}"
    :${invalid.attribute}="props.${invalid.prop.name} ? '' : undefined"
    :${name.attribute}="props.${name.prop.name}"
    :${revalidationTiming.attribute}="props.${revalidationTiming.dataPropName} ?? props.${revalidationTiming.prop.name}"
    :${touched.attribute}="props.${touched.prop.name} ? '' : undefined"
    :${validationTiming.attribute}="props.${validationTiming.dataPropName} ?? props.${validationTiming.prop.name}"
  >
    <slot />
  </${root.defaultElement}>
</template>
`;
}

function printControl(facts: AdapterFormControlCompositionFacts): string {
  return `<script setup lang="ts">
import type { InputValue, InputValueChangeDetails } from "@starwind-ui/runtime/input";
import { computed, ref, useAttrs } from "vue";
import InputRoot from "../input/InputRoot.vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    defaultValue?: InputValue;
    disabled?: boolean;
    modelValue?: InputValue;
  }>(),
  {
    disabled: false,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: InputValue | undefined];
  valueChange: [value: string, detail: InputValueChangeDetails];
}>();
const attrs = useAttrs();
const inputRef = ref<{ element: HTMLInputElement | null } | null>(null);
const element = computed(() => inputRef.value?.element ?? null);
defineExpose({ element });

function handleValueChange(value: string, detail: InputValueChangeDetails): void {
  emit("valueChange", value, detail);
}

function handleModelValueUpdate(value: InputValue | undefined): void {
  emit("update:modelValue", value);
}
</script>

<template>
  <InputRoot
    ref="inputRef"
    v-bind="attrs"
    ${facts.attrs.control}
    :default-value="props.defaultValue"
    :disabled="props.disabled"
    :model-value="props.modelValue"
    @update:model-value="handleModelValueUpdate"
    @value-change="handleValueChange"
  />
</template>
`;
}

function printError(facts: AdapterFormControlCompositionFacts): string {
  const part = facts.parts.error;
  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
export type ${facts.message.matchType} = ${printMatchType(facts)};
export type ${facts.message.error.messageSource.typeName} = ${facts.message.error.messageSource.prop.type};
const props = withDefaults(
  defineProps<{
    hidden?: boolean;
    ${facts.message.error.matchProp.name}?: ${facts.message.matchType};
    ${facts.message.error.messageSource.prop.name}?: ${facts.message.error.messageSource.typeName};
  }>(),
  {
    hidden: ${facts.message.error.hiddenDefault},
    ${facts.message.error.matchProp.name}: ${facts.message.error.matchDefault},
  },
);
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });

function serializeMatch(value: ${facts.message.matchType}): string {
  return typeof value === "boolean" ? String(value) : value;
}
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.error}
    data-sw-part="${part.name}"
    :${facts.message.error.matchAttribute}="serializeMatch(props.${facts.message.error.matchProp.name})"
    :${facts.message.error.messageSource.attribute}="props.${facts.message.error.messageSource.prop.name}"
    :hidden="props.hidden"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printValidity(facts: AdapterFormControlCompositionFacts): string {
  const part = facts.parts.validity;
  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
export type ${facts.message.matchType} = ${printMatchType(facts)};
const props = withDefaults(
  defineProps<{
    hidden?: boolean;
    ${facts.message.validity.matchProp.name}?: ${facts.message.matchType};
  }>(),
  {
    hidden: ${facts.message.validity.hiddenDefault},
    ${facts.message.validity.matchProp.name}: ${facts.message.validity.matchDefault},
  },
);
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });

function serializeMatch(value: ${facts.message.matchType}): string {
  return typeof value === "boolean" ? String(value) : value;
}
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.validity}
    data-sw-part="${part.name}"
    :${facts.message.validity.matchAttribute}="serializeMatch(props.${facts.message.validity.matchProp.name})"
    :hidden="props.hidden"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printSimplePart(
  facts: AdapterFormControlCompositionFacts,
  partName: "description" | "item" | "label",
): string {
  const part = facts.parts[partName];
  const elementType =
    partName === "label"
      ? "HTMLLabelElement"
      : partName === "description"
        ? "HTMLParagraphElement"
        : "HTMLDivElement";
  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const element = ref<${elementType} | null>(null);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs[partName]}
    data-sw-part="${part.name}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printMatchType(facts: AdapterFormControlCompositionFacts): string {
  return ["boolean", ...facts.message.matchValues.map((value) => JSON.stringify(value))].join(
    "\n  | ",
  );
}
