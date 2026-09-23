import type { NativeRootProjection } from "../../shared-recipes/structured/native-frame-types.js";

/** Native overlay vue projection. Portal transport is a named target exception. */
export const vueNativeRootProjection: NativeRootProjection = {
  surfaceOperations: {
    "activate-placement": "mounted.value = true;",
    "connect-controller": "if (rootRef.value) connectRuntime(rootRef.value);",
  },
  readProp: (name) => `props.${name}`,
  initialCell: (expression) => expression,
  attribute: (name, value) => (value === undefined ? name : `:${name}="${value}"`),
  destructure: (props) =>
    props
      .map(
        (prop) =>
          `${prop.name}${prop.defaultValue && prop.name !== "defaultOpen" ? ` = ${prop.defaultValue}` : ""}`,
      )
      .join(", "),
  runtimeImports: (component, portal) => "",
  printRoot({
    component,
    plan,
    portal,
    popup,
    props,
    fields,
    destructure,
    callbacks,
    imports,
    initial,
    accepted,
    controller,
    refresh,
    lifecycle,
    attributes,
    modelObserver,
    surfaceConnection,
  }) {
    return `<script lang="ts">
import type { InjectionKey, Ref } from "vue";
export type ${component}ContextValue = { requestRefresh(): void; ${portal ? "element: Readonly<Ref<HTMLElement | null>>; mounted: Readonly<Ref<boolean>>; registerPortal(owner: symbol, element: HTMLElement | null): void;" : ""} };
export const ${component}Context: InjectionKey<${component}ContextValue> = Symbol("${component}Context");
</script>
<script setup lang="ts">
${imports}
import { computed, ${portal ? "nextTick, " : ""}onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${fields} }>(), { ${props.map((prop) => `${prop.name}: ${prop.name === "defaultOpen" || prop.name === "open" ? "undefined" : "defaultValue" in prop ? prop.defaultValue : "undefined"}`).join(", ")} });
const emit = defineEmits<{ openChange: [open: boolean, detail: ${plan.proposal.details}]; closeComplete: [detail: ${plan.completion!.details}]; "update:open": [open: boolean] }>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
${initial}
${accepted}
const renderedOpen = computed(() => props.open ?? uncontrolledOpen.value);
${controller}
${refresh}
${portal ? "const mounted = ref(false);\nlet runtimeGeneration = 0;" : ""}
provide(${component}Context, { requestRefresh: refreshControls, ${portal ? "element: rootRef, mounted, registerPortal() {}," : ""} });
defineExpose({ element: rootRef });
${lifecycle}
${
  portal
    ? `async function reconnectRuntime(): Promise<void> {
const generation = ++runtimeGeneration;
disconnectRuntime();
mounted.value = false;
await nextTick();
if (generation !== runtimeGeneration || !rootRef.value) return;
${surfaceConnection}
}
onMounted(() => { ${surfaceConnection} });`
    : "function reconnectRuntime(): void { if (rootRef.value) connectRuntime(rootRef.value); }\nonMounted(reconnectRuntime);"
}
${modelObserver}
watch([${plan.constructorInputs.map((name) => `() => props.${name}`).join(", ")}], reconnectRuntime, { flush: "post" });
onBeforeUnmount(() => { ${portal ? "runtimeGeneration += 1; mounted.value = false;" : ""} disconnectRuntime(); });
</script>
<template><div ref="rootRef" v-bind="attrs" ${attributes}><slot /></div></template>
`;
  },
};
