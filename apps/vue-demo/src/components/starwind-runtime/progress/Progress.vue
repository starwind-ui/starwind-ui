<script setup lang="ts">
import * as ProgressPrimitive from "@starwind-ui/vue/progress";
import type { ClassValue } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  computed,
  type HTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { progress, progressIndicator, progressTrack } from "./variants";

defineOptions({ inheritAttrs: false });

export type ProgressProps = Omit<
  HTMLAttributes,
  "class" | "label" | "max" | "min" | "value" | "variant"
> & {
  label?: string;
  max?: number;
  min?: number;
  value?: number | null;
  variant?: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error";
  class?: ClassValue;
};
type ProgressDeclaredProps = {
  label?: string;
  max?: number;
  min?: number;
  value?: number | null;
  variant?: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error";
  class?: ClassValue;
} & /* @vue-ignore */ ProgressProps;
const {
  label,
  value = null,
  max = 100,
  min = 0,
  variant = "default",
  class: className,
} = defineProps<ProgressDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const ariaLabel = computed(() => attrs["aria-label"] ?? label);
const boundedMin = computed(() => (Number.isFinite(min) ? min : 0));
const boundedMax = computed(() => (Number.isFinite(max) ? max : 100));
const normalizedMin = computed(() => Math.min(boundedMin.value, boundedMax.value));
const normalizedMax = computed(() => Math.max(boundedMin.value, boundedMax.value));
const progressValue = computed(() =>
  value == null || !Number.isFinite(Number(value))
    ? null
    : Math.min(Math.max(Number(value), normalizedMin.value), normalizedMax.value),
);
const isIndeterminate = computed(() => progressValue.value === null);
const progressPercent = computed(() =>
  isIndeterminate.value
    ? 0
    : normalizedMax.value === normalizedMin.value
      ? progressValue.value! >= normalizedMax.value
        ? 100
        : 0
      : Math.round(
          Math.min(
            Math.max(
              ((progressValue.value! - normalizedMin.value) /
                (normalizedMax.value - normalizedMin.value)) *
                100,
              0,
            ),
            100,
          ),
        ),
);
const indicatorStyle = computed(() =>
  isIndeterminate.value ? undefined : { transform: `translateX(-${100 - progressPercent.value}%)` },
);
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
  <ProgressPrimitive.ProgressRoot
    :ref="setElement"
    :class="progress({ variant: isIndeterminate ? 'indeterminate' : undefined, class: className })"
    :max="normalizedMax"
    :min="normalizedMin"
    :value="progressValue"
    v-bind="{ ...attrs, 'aria-label': ariaLabel }"
    data-slot="progress"
  >
    <ProgressPrimitive.ProgressTrack :class="progressTrack()" data-slot="progress-track">
      <ProgressPrimitive.ProgressIndicator
        :class="
          progressIndicator({
            variant: isIndeterminate ? 'indeterminate' : undefined,
            color: variant,
          })
        "
        :style="indicatorStyle"
        data-slot="progress-indicator"
      />
    </ProgressPrimitive.ProgressTrack>
  </ProgressPrimitive.ProgressRoot>
</template>
