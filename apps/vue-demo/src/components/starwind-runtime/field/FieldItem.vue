<script setup lang="ts">
import * as FieldPrimitive from "@starwind-ui/vue/field";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { fieldItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldItemProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type FieldItemDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ FieldItemProps;
const { class: className } = defineProps<FieldItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDivElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDivElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDivElement ? exposed.element : null;
  });
}
</script>

<template>
  <FieldPrimitive.FieldItem
    :ref="setElement"
    :class="fieldItem({ class: className })"
    v-bind="attrs"
    data-slot="field-item"
  >
    <slot />
  </FieldPrimitive.FieldItem>
</template>
