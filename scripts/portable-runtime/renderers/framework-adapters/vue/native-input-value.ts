import { nativeInputConnection } from "../../shared-recipes/structured/document-controls/input-recipe.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueNativeInputValueIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "native-input-value");
}

export function printVueNativeInputValueComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "native-input-value") {
    throw new TypeError(
      "Vue native-input-value projection requires a native-input-value component model.",
    );
  }

  const { facts } = family;

  const defaultValue = facts.props.defaultValue.name;
  const disabled = facts.props.disabled.name;
  const event = facts.events.valueChange;
  const value = facts.props.value.name;

  const connection = nativeInputConnection(facts, {
    model: "modelValue.value",
    defaultValue: "initialDefaultValue",
    disabled: `props.${disabled}`,
    authority: "parent",
    transport: "runtime-notification",
    notify: (next, detail) => `emit("valueChange", ${next}, ${detail});`,
    publish: (next) => `modelValue.value = ${next};`,
    untrack: (body) => body,
  });

  return {
    contents: `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${facts.props.value.type},
  type ${event.detailsType},
} from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { observeFormDiscovery } from "../_internal/form-discovery";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${defaultValue}?: ${facts.props.defaultValue.type};
    ${disabled}?: ${facts.props.disabled.type};
  }>(),
  {
    ${disabled}: ${getPropDefault(facts.props.disabled.defaultValue, facts.displayName, disabled)},
  },
);
const modelValue = defineModel<${facts.props.value.type}>();
const emit = defineEmits<{
  valueChange: [value: ${event.valueType}, detail: ${event.detailsType}];
}>();
const attrs = useAttrs();
const isControlled = modelValue.value !== undefined;
const rootRef = ref<HTMLInputElement | null>(null);
const initialDefaultValue = props.${defaultValue};
const initialRenderedValue = modelValue.value ?? initialDefaultValue;
let connection: ReturnType<typeof connectInput> | undefined;
defineExpose({ element: rootRef });
${connection}
onMounted(() => {
  const element = rootRef.value;
  if (!element) throw new Error("${facts.displayName} requires its native input before Runtime setup.");
  connection = connectInput(element);
});

watch(
  modelValue,
  (nextValue) => {
    if (isControlled) connection?.synchronize(nextValue);
  },
  { flush: "post" },
);
watch(
  () => props.${disabled},
  (nextDisabled) => {
    connection?.instance.${facts.runtime.disabledSetter.method}(nextDisabled);
  },
);

onBeforeUnmount(() => {
  const owned = connection;
  connection = undefined;
  owned?.destroy();
});
</script>

<template>
  <input
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${facts.attrs.stateDisabled}="props.${disabled} ? '' : undefined"
    :${facts.attrs.disabled}="props.${disabled}"
    :${facts.attrs.value}.attr="initialRenderedValue"
  />
</template>
`,
    path: `${file.path}.vue`,
  };
}

function getPropDefault(
  defaultValue: string | undefined,
  displayName: string,
  propName: string,
): string {
  if (defaultValue === undefined) {
    throw new Error(`${displayName} ${propName} prop is missing a default value.`);
  }
  return defaultValue;
}
