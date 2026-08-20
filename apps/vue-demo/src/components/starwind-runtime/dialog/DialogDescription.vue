<script setup lang="ts">
import * as DialogPrimitive from "@starwind-ui/vue/dialog";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { dialogDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type DialogDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DialogDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DialogDescriptionProps;
const { class: className } = defineProps<DialogDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
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
  <DialogPrimitive.DialogDescription
    :ref="setElement"
    :class="dialogDescription({ class: className })"
    v-bind="$attrs"
    data-slot="dialog-description"
  >
    <slot />
  </DialogPrimitive.DialogDescription>
</template>
