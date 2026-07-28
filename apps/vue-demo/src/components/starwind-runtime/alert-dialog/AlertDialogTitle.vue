<script setup lang="ts">
import * as AlertDialogPrimitive from "@starwind-ui/vue/alert-dialog";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { alertDialogTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDialogTitleProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AlertDialogTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AlertDialogTitleProps;
const { class: className } = defineProps<AlertDialogTitleDeclaredProps>();
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
  <AlertDialogPrimitive.AlertDialogTitle
    :ref="setElement"
    :class="alertDialogTitle({ class: className })"
    v-bind="attrs"
    data-slot="alert-dialog-title"
  >
    <slot />
  </AlertDialogPrimitive.AlertDialogTitle>
</template>
