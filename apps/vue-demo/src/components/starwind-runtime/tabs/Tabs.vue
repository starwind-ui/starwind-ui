<script setup lang="ts">
import * as TabsPrimitive from "@starwind-ui/vue/tabs";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { tabs } from "./variants";

defineOptions({ inheritAttrs: false });

export type TabsProps = Omit<
  HTMLAttributes,
  "class" | "defaultValue" | "modelValue" | "onChange" | "orientation" | "syncKey" | "value"
> & {
  orientation?: "horizontal" | "vertical";
  syncKey?: string;
  defaultValue?: import("@starwind-ui/vue/tabs").TabsValue;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/tabs").TabsValue;
};
type TabsDeclaredProps = {
  orientation?: "horizontal" | "vertical";
  syncKey?: string;
  defaultValue?: import("@starwind-ui/vue/tabs").TabsValue;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/tabs").TabsValue;
  value?: unknown;
} & /* @vue-ignore */ TabsProps;
const {
  defaultValue,
  orientation = "horizontal",
  syncKey,
  value,
  class: className,
  modelValue,
} = defineProps<TabsDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: import("@starwind-ui/vue/tabs").TabsValue,
    detail: import("@starwind-ui/vue/tabs").TabsValueChangeDetails,
  ];
  "update:modelValue": [value: import("@starwind-ui/vue/tabs").TabsValue];
}>();
function handleValueChange(
  value: import("@starwind-ui/vue/tabs").TabsValue,
  detail: import("@starwind-ui/vue/tabs").TabsValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
const element = ref<HTMLElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}
</script>

<template>
  <TabsPrimitive.TabsRoot
    :ref="setElement"
    :class="tabs({ class: className })"
    :default-value="defaultValue"
    :orientation="orientation"
    :sync-key="syncKey"
    :model-value="modelValue"
    v-bind="attrs"
    data-slot="tabs"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
  </TabsPrimitive.TabsRoot>
</template>
