<script setup lang="ts">
import * as FieldPrimitive from "@starwind-ui/vue/field";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { fieldDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type FieldDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ FieldDescriptionProps;
const { class: className } = defineProps<FieldDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLParagraphElement | null>(null);
let pendingPrimitiveRef:
  | ({ element?: HTMLParagraphElement | null } & ComponentPublicInstance)
  | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLParagraphElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLParagraphElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLParagraphElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLParagraphElement ? exposed.element : null;
  });
}
</script>

<template>
  <FieldPrimitive.FieldDescription
    :ref="setElement"
    :class="fieldDescription({ class: className })"
    v-bind="attrs"
    data-slot="field-description"
  >
    <slot />
  </FieldPrimitive.FieldDescription>
</template>
