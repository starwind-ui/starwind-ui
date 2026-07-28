<script setup lang="ts">
import * as SliderPrimitive from "@starwind-ui/vue/slider";
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  computed,
  type HTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { slider, sliderControl, sliderRange, sliderThumb, sliderTrack } from "./variants";

defineOptions({ inheritAttrs: false });

export type SliderProps = Omit<
  HTMLAttributes,
  | "class"
  | "defaultValue"
  | "disabled"
  | "form"
  | "largeStep"
  | "max"
  | "min"
  | "modelValue"
  | "name"
  | "onChange"
  | "orientation"
  | "step"
  | "value"
> &
  VariantProps<typeof sliderRange> &
  VariantProps<typeof sliderThumb> & {
    disabled?: boolean;
    form?: string;
    largeStep?: number;
    max?: number;
    min?: number;
    name?: string;
    orientation?: "horizontal" | "vertical";
    step?: number;
    defaultValue?: import("@starwind-ui/vue/slider").SliderValue;
    class?: ClassValue;
    modelValue?: import("@starwind-ui/vue/slider").SliderValue | undefined;
  };
type SliderDeclaredProps = {
  disabled?: boolean;
  form?: string;
  largeStep?: number;
  max?: number;
  min?: number;
  name?: string;
  orientation?: "horizontal" | "vertical";
  step?: number;
  defaultValue?: import("@starwind-ui/vue/slider").SliderValue;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/slider").SliderValue | undefined;
  variant?: SliderProps["variant"];
} & /* @vue-ignore */ SliderProps;
const {
  variant = "default",
  defaultValue = 0,
  disabled = false,
  form,
  largeStep = 10,
  max = 100,
  min = 0,
  name,
  orientation = "horizontal",
  step = 1,
  class: className,
  modelValue,
} = defineProps<SliderDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: import("@starwind-ui/vue/slider").SliderValue,
    detail: import("@starwind-ui/vue/slider").SliderValueChangeDetails,
  ];
  valueCommitted: [
    value: import("@starwind-ui/vue/slider").SliderValue,
    detail: import("@starwind-ui/vue/slider").SliderValueCommitDetails,
  ];
  "update:modelValue": [value: import("@starwind-ui/vue/slider").SliderValue | undefined];
}>();
const resolvedValue = computed(() => modelValue ?? defaultValue);
const values = computed(() =>
  Array.isArray(resolvedValue.value) ? resolvedValue.value : [resolvedValue.value],
);
const getPercentage = computed(
  () => (item: number) => (max === min ? 0 : ((item - min) / (max - min)) * 100),
);
const rangeStart = computed(() =>
  values.value.length > 1 ? getPercentage.value(Math.min(...values.value)) : 0,
);
const rangeEnd = computed(() =>
  values.value.length > 1
    ? getPercentage.value(Math.max(...values.value))
    : getPercentage.value(values.value[0] ?? min),
);
const rangeStyle = computed(() =>
  orientation === "horizontal"
    ? { left: `${rangeStart.value}%`, width: `${rangeEnd.value - rangeStart.value}%` }
    : { bottom: `${rangeStart.value}%`, height: `${rangeEnd.value - rangeStart.value}%` },
);
function handleValueChange(
  value: import("@starwind-ui/vue/slider").SliderValue,
  detail: import("@starwind-ui/vue/slider").SliderValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}

function handleValueCommitted(
  value: import("@starwind-ui/vue/slider").SliderValue,
  detail: import("@starwind-ui/vue/slider").SliderValueCommitDetails,
): void {
  emit("valueCommitted", value, detail);
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
  <SliderPrimitive.SliderRoot
    :ref="setElement"
    :class="slider({ class: className })"
    :default-value="defaultValue"
    :disabled="disabled"
    :form="form"
    :large-step="largeStep"
    :max="max"
    :min="min"
    :name="name"
    :orientation="orientation"
    :step="step"
    :model-value="modelValue"
    v-bind="attrs"
    data-slot="slider"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
    @value-committed="handleValueCommitted"
  >
    <SliderPrimitive.SliderControl
      :class="sliderControl()"
      :data-orientation="orientation"
      data-slot="slider-control"
    >
      <SliderPrimitive.SliderTrack
        :class="sliderTrack()"
        :data-orientation="orientation"
        data-slot="slider-track"
      >
        <SliderPrimitive.SliderIndicator
          :class="sliderRange({ variant })"
          :data-orientation="orientation"
          data-slot="slider-range"
          :style="rangeStyle"
        />
      </SliderPrimitive.SliderTrack>
      <template v-for="(_, index) in values" :key="index">
        <SliderPrimitive.SliderThumb
          :class="sliderThumb({ variant })"
          :index="index"
          :style="
            orientation === 'horizontal'
              ? { left: `${getPercentage(values[index] ?? min)}%` }
              : { bottom: `${getPercentage(values[index] ?? min)}%` }
          "
          :data-orientation="orientation"
          data-slot="slider-thumb"
        />
      </template>
    </SliderPrimitive.SliderControl>
  </SliderPrimitive.SliderRoot>
</template>
