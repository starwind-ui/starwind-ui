import type { DisclosureRootProjection } from "../../shared-recipes/structured/disclosure/frame.js";
export const vueDisclosureRoot: DisclosureRootProjection = {
  attribute: (name, expression) => (expression === undefined ? name : `:${name}="${expression}"`),
  initialCell: (expression) => expression,
  readInput: (name) => `props.${name}`,
  print: ({
    plan,
    fields,
    initial,
    accepted,
    controller,
    lifecycle,
    modelObserver,
    attributes,
  }) => `<script lang="ts">
import type { InjectionKey } from "vue";
export const DisclosureDisabledContext: InjectionKey<{ readonly disabled: boolean }> = Symbol("Collapsible");
</script>
<script setup lang="ts">
import { create${plan.component}, type ${plan.proposal.details} } from "@starwind-ui/runtime/collapsible";
import { computed, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { useVueAsChildRuntimeOwner } from "../_internal/as-child";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${fields} }>(), { open: undefined, defaultOpen: false, disabled: false });
const emit = defineEmits<{ openChange: [open: boolean, detail: ${plan.proposal.details}]; 'update:open': [open: boolean] }>();
defineSlots<{ default?: () => unknown }>();
provide(DisclosureDisabledContext, { get disabled() { return props.disabled; } });
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
${initial}
${accepted}
${controller}
const renderedOpen = computed(() => props.open ?? uncontrolledOpen.value);
defineExpose({ element: rootRef });
${lifecycle}
function reconnectRuntime(): void { if (rootRef.value) connectRuntime(rootRef.value); }
useVueAsChildRuntimeOwner(rootRef, reconnectRuntime);
onMounted(reconnectRuntime);
${modelObserver}
watch([${plan.constructorInputs.map((prop) => `() => props.${prop}`).join(", ")}], reconnectRuntime, { flush: "post" });
onBeforeUnmount(disconnectRuntime);
</script>
<template><div ref="rootRef" v-bind="attrs" ${attributes}><slot /></div></template>
`,
};
