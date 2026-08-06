<script setup lang="ts">
import * as TogglePrimitive from "@starwind-ui/vue/toggle";
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { toggle } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToggleProps = Omit<
  ButtonHTMLAttributes,
  | "aria-pressed"
  | "class"
  | "data-slot"
  | "defaultPressed"
  | "disabled"
  | "nativeButton"
  | "onChange"
  | "pressed"
  | "syncGroup"
  | "type"
  | "value"
> &
  VariantProps<typeof toggle> & {
    defaultPressed?: boolean;
    disabled?: boolean;
    nativeButton?: boolean;
    "data-slot"?: string;
    pressed?: boolean;
    syncGroup?: string;
    value?: string;
    class?: ClassValue;
  };
type ToggleDeclaredProps = {
  defaultPressed?: boolean;
  disabled?: boolean;
  nativeButton?: boolean;
  dataSlot?: string;
  pressed?: boolean;
  syncGroup?: string;
  value?: string;
  class?: ClassValue;
  variant?: ToggleProps["variant"];
  size?: ToggleProps["size"];
} & /* @vue-ignore */ Omit<ToggleProps, "data-slot">;
const {
  variant,
  size,
  defaultPressed,
  disabled = false,
  nativeButton,
  pressed = undefined,
  syncGroup,
  value,
  dataSlot = "toggle",
  class: className,
} = defineProps<ToggleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  pressedChange: [
    value: boolean,
    detail: import("@starwind-ui/vue/toggle").TogglePressedChangeDetails,
  ];
  "update:pressed": [value: boolean];
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
    :class="toggle({ variant, size, class: className })"
    :default-pressed="defaultPressed"
    :disabled="disabled"
    :native-button="nativeButton"
    :pressed="pressed"
    :sync-group="syncGroup"
    :value="value"
    v-bind="attrs"
    :data-slot="dataSlot ?? 'toggle'"
    @update:pressed="emit('update:pressed', $event)"
    @pressed-change="handlePressedChange"
  >
    <slot />
  </TogglePrimitive.ToggleRoot>
</template>
