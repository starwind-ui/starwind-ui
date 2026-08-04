<script setup lang="ts">
import * as ToggleGroupPrimitive from "@starwind-ui/vue/toggle-group";
import type { ClassValue } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  computed,
  type HTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { toggleGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToggleGroupProps = Omit<
  HTMLAttributes,
  | "class"
  | "defaultValue"
  | "disabled"
  | "loopFocus"
  | "modelValue"
  | "multiple"
  | "onChange"
  | "orientation"
  | "size"
  | "spacing"
  | "variant"
> & {
  defaultValue?: string[];
  disabled?: boolean;
  loopFocus?: boolean;
  multiple?: boolean;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  spacing?: number;
  variant?: "default" | "outline";
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/toggle-group").ToggleGroupValue;
};
type ToggleGroupDeclaredProps = {
  defaultValue?: string[];
  disabled?: boolean;
  loopFocus?: boolean;
  multiple?: boolean;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  spacing?: number;
  variant?: "default" | "outline";
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/toggle-group").ToggleGroupValue;
  style?: unknown;
} & /* @vue-ignore */ ToggleGroupProps;
const {
  variant = "default",
  size = "md",
  spacing = 2,
  defaultValue,
  disabled = false,
  loopFocus,
  multiple = false,
  orientation = "horizontal",
  style,
  class: className,
  modelValue,
} = defineProps<ToggleGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: import("@starwind-ui/vue/toggle-group").ToggleGroupValue,
    detail: import("@starwind-ui/vue/toggle-group").ToggleGroupValueChangeDetails,
  ];
  "update:modelValue": [value: import("@starwind-ui/vue/toggle-group").ToggleGroupValue];
}>();
const toggleGroupStyle = computed(() =>
  typeof style === "string"
    ? `--gap: ${spacing}; ${style}`
    : { "--gap": spacing, ...(style ?? {}) },
);
function handleValueChange(
  value: import("@starwind-ui/vue/toggle-group").ToggleGroupValue,
  detail: import("@starwind-ui/vue/toggle-group").ToggleGroupValueChangeDetails,
): void {
  emit("valueChange", value, detail);
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
  <ToggleGroupPrimitive.ToggleGroupRoot
    :ref="setElement"
    :class="toggleGroup({ class: className })"
    :data-variant="variant"
    :data-spacing="spacing"
    :data-horizontal="orientation === 'horizontal' ? '' : undefined"
    :data-vertical="orientation === 'vertical' ? '' : undefined"
    :default-value="defaultValue"
    :disabled="disabled"
    :loop-focus="loopFocus"
    :multiple="multiple"
    :orientation="orientation"
    :style="toggleGroupStyle"
    v-bind="attrs"
    :data-size="size"
    data-slot="toggle-group"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
  </ToggleGroupPrimitive.ToggleGroupRoot>
</template>
