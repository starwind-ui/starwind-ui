<script setup lang="ts">
import * as TabsPrimitive from "@starwind-ui/vue/tabs";
import type { ClassValue } from "tailwind-variants";
import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { tabsTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type TabsTriggerProps = Omit<
  ButtonHTMLAttributes,
  "class" | "disabled" | "type" | "value"
> & {
  disabled?: boolean;
  value: string;
  class?: ClassValue;
};
type TabsTriggerDeclaredProps = {
  disabled?: boolean;
  value: string;
  class?: ClassValue;
} & /* @vue-ignore */ TabsTriggerProps;
const { disabled = false, value, class: className } = defineProps<TabsTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLButtonElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLButtonElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLButtonElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLButtonElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLButtonElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLButtonElement ? exposed.element : null;
  });
}
</script>

<template>
  <TabsPrimitive.TabsTab
    :ref="setElement"
    :class="tabsTrigger({ class: className })"
    :disabled="disabled"
    :value="value"
    v-bind="attrs"
    data-slot="tabs-trigger"
  >
    <slot />
  </TabsPrimitive.TabsTab>
</template>
