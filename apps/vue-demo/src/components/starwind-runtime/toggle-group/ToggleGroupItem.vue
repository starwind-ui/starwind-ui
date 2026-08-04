<script setup lang="ts">
import * as TogglePrimitive from "@starwind-ui/vue/toggle";
import type { ClassValue } from "tailwind-variants";
import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { toggleGroupItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToggleGroupItemProps = Omit<
  ButtonHTMLAttributes,
  | "aria-pressed"
  | "class"
  | "defaultPressed"
  | "disabled"
  | "nativeButton"
  | "onChange"
  | "type"
  | "value"
  | "variant"
> & {
  disabled?: boolean;
  nativeButton?: boolean;
  value?: string;
  variant?: "default" | "outline";
  class?: ClassValue;
};
type ToggleGroupItemDeclaredProps = {
  disabled?: boolean;
  nativeButton?: boolean;
  value?: string;
  variant?: "default" | "outline";
  class?: ClassValue;
} & /* @vue-ignore */ ToggleGroupItemProps;
const {
  variant,
  disabled = false,
  nativeButton,
  value,
  class: className,
} = defineProps<ToggleGroupItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  pressedChange: [
    value: boolean,
    detail: import("@starwind-ui/vue/toggle").TogglePressedChangeDetails,
  ];
}>();
function handlePressedChange(
  value: boolean,
  detail: import("@starwind-ui/vue/toggle").TogglePressedChangeDetails,
): void {
  emit("pressedChange", value, detail);
}
const element = ref<HTMLButtonElement | HTMLSpanElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLButtonElement || value instanceof HTMLSpanElement) {
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
  <TogglePrimitive.ToggleRoot
    :ref="setElement"
    :class="toggleGroupItem({ variant, class: className })"
    :data-variant="variant"
    :disabled="disabled"
    :native-button="nativeButton"
    :value="value"
    v-bind="attrs"
    data-slot="toggle-group-item"
    @pressed-change="handlePressedChange"
  >
    <slot />
  </TogglePrimitive.ToggleRoot>
</template>
