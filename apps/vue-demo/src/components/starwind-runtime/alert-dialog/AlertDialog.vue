<script setup lang="ts">
import * as AlertDialogPrimitive from "@starwind-ui/vue/alert-dialog";
import type { ClassValue } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  computed,
  type HTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";

defineOptions({ inheritAttrs: false });

export type AlertDialogProps = Omit<
  HTMLAttributes,
  "class" | "closeOnEscape" | "closeOnOutsideInteract" | "defaultOpen" | "modal" | "open"
> & {
  defaultOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  class?: ClassValue;
  open?: boolean;
};
type AlertDialogDeclaredProps = {
  defaultOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  class?: ClassValue;
  open?: boolean;
} & /* @vue-ignore */ AlertDialogProps;
const {
  defaultOpen = false,
  closeOnEscape = true,
  closeOnOutsideInteract = false,
  modal = true,
  class: className,
  open = undefined,
} = defineProps<AlertDialogDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  closeComplete: [detail: import("@starwind-ui/vue/alert-dialog").AlertDialogCloseCompleteDetails];
  openChange: [
    open: boolean,
    detail: import("@starwind-ui/vue/alert-dialog").AlertDialogOpenChangeDetails,
  ];
  "update:open": [value: boolean];
}>();
const rootClassName = computed(() => className);
function handleCloseComplete(
  detail: import("@starwind-ui/vue/alert-dialog").AlertDialogCloseCompleteDetails,
): void {
  emit("closeComplete", detail);
}

function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/alert-dialog").AlertDialogOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}
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
  <AlertDialogPrimitive.AlertDialogRoot
    :ref="setElement"
    :class="rootClassName"
    :default-open="defaultOpen"
    :close-on-escape="closeOnEscape"
    :close-on-outside-interact="closeOnOutsideInteract"
    :modal="modal"
    v-bind="attrs"
    data-slot="alert-dialog"
    :open="open"
    @update:open="emit('update:open', $event)"
    @close-complete="handleCloseComplete"
    @open-change="handleOpenChange"
  >
    <slot />
  </AlertDialogPrimitive.AlertDialogRoot>
</template>
