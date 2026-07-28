<script setup lang="ts">
import * as DialogPrimitive from "@starwind-ui/vue/dialog";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { dialogTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type DialogTitleProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DialogTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DialogTitleProps;
const { class: className } = defineProps<DialogTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLHeadingElement | null>(null);
let pendingPrimitiveRef:
  | ({ element?: HTMLHeadingElement | null } & ComponentPublicInstance)
  | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLHeadingElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLHeadingElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLHeadingElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLHeadingElement ? exposed.element : null;
  });
}
</script>

<template>
  <DialogPrimitive.DialogTitle
    :ref="setElement"
    :class="dialogTitle({ class: className })"
    v-bind="attrs"
    data-slot="dialog-title"
  >
    <slot />
  </DialogPrimitive.DialogTitle>
</template>
