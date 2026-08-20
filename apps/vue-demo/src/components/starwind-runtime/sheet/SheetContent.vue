<script setup lang="ts">
import * as SheetPrimitive from "@starwind-ui/vue/drawer";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { Button } from "../button";
import { sheetBackdrop, sheetCloseButton, sheetContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type SheetContentProps = Omit<HTMLAttributes, "class" | "side"> & {
  side?: "top" | "right" | "bottom" | "left";
  class?: ClassValue;
};
type SheetContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  class?: ClassValue;
} & /* @vue-ignore */ SheetContentProps;
const { class: className, side = "right" } = defineProps<SheetContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  backdrop?: () => unknown;
  icon?: () => unknown;
}>();
const element = ref<HTMLDialogElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDialogElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDialogElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLDialogElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDialogElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDialogElement ? exposed.element : null;
  });
}
</script>

<template>
  <slot name="backdrop">
    <SheetPrimitive.DrawerBackdrop
      :class="sheetBackdrop()"
      data-state="closed"
      hidden
      data-slot="sheet-backdrop"
    />
  </slot>
  <SheetPrimitive.DrawerPopup
    :ref="setElement"
    :class="sheetContent({ side, class: className })"
    data-state="closed"
    :side="side"
    v-bind="$attrs"
    data-slot="sheet-content"
  >
    <slot />
    <Button
      variant="ghost"
      size="icon-sm"
      :class="sheetCloseButton()"
      data-slot="sheet-close"
      data-sw-drawer-close
    >
      <slot name="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="size-5 transition-opacity"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </slot>
      <span class="sr-only"> Close sheet </span>
    </Button>
    <div class="pointer-events-none fixed inset-0" data-floating-root data-slot="floating-root" />
  </SheetPrimitive.DrawerPopup>
</template>
