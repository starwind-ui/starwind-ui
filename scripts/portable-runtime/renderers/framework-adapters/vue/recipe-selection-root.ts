import type { FrameworkOperations } from "../../shared-recipes/structured/operations.js";
import type { ConnectionRecipe } from "../../shared-recipes/structured/plan.js";
import type { SelectionRootProjection } from "../../shared-recipes/structured/root-frame.js";

const upper = (value: string) => value[0]!.toUpperCase() + value.slice(1);
const eventName = (callback: string) => callback[2]!.toLowerCase() + callback.slice(3);
export const vueSelectionRootProjection: SelectionRootProjection = {
  readProp: (name) => `props.${name}`,
  callbackType: (plan) => `(value: ${plan.model.type}, detail: ${plan.proposal.details}) => void`,
  destructureProp: (name, defaultValue) => `${name}${defaultValue ? ` = ${defaultValue}` : ""}`,
  marker: (name) => name,
  attribute: (name, value) => `:${name}="${value}"`,
  print(input) {
    const {
      frame,
      plan,
      fw,
      name,
      publicName,
      code,
      controller,
      accepted,
      renderedName,
      fields,
      attributes,
      callback,
      defaults,
      imports,
      initialBody,
      serializeDefault,
      helpers,
    } = input;
    return `<script setup lang="ts">
${imports}
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${fields} }>(), { ${defaults} });
const emit = defineEmits<{
  ${eventName(callback)}: [value: ${plan.model.type}, detail: ${plan.proposal.details}];
  "update:${publicName}": [value: ${plan.model.type}];
}>();
defineSlots<{ default?: (props: { ${name}: ${plan.model.type} }) => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
${initialBody}
${serializeDefault}
${accepted}
const ${renderedName} = computed(() => props.${publicName} !== undefined ? props.${publicName} : uncontrolled${upper(name)}.value);
${controller}
defineExpose({ element: rootRef });
${code}
${observeElementConnection(plan, fw)}
${helpers}
</script>
<template><${frame.element} ref="rootRef" v-bind="attrs" ${attributes}><slot :${name}="${renderedName}" /></${frame.element}></template>
`;
  },
};
function observeElementConnection(plan: ConnectionRecipe, fw: FrameworkOperations): string {
  return `function reconnectRuntime(): void { if (rootRef.value) connectRuntime(rootRef.value); }
onMounted(reconnectRuntime);
${fw.observeModel(plan.model.name, "reconnectRuntime")}
watch([${plan.constructorInputs.map((prop) => `() => props.${prop}`).join(", ")}], reconnectRuntime, { flush: "post" });
onBeforeUnmount(disconnectRuntime);`;
}
