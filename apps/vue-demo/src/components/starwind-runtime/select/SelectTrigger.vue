<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  ref,
  shallowRef,
  useAttrs,
  type VNode,
  watch,
} from "vue";
import { selectTrigger, selectValue } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectTriggerProps = Omit<
  ButtonHTMLAttributes,
  "asChild" | "class" | "iconClass" | "placeholder" | "showIcon" | "valueClass"
> &
  VariantProps<typeof selectTrigger> & {
    asChild?: boolean;
    iconClass?: string;
    placeholder?: string;
    showIcon?: boolean;
    valueClass?: string;
    class?: ClassValue;
  };
type SelectTriggerDeclaredProps = {
  asChild?: boolean;
  iconClass?: string;
  placeholder?: string;
  showIcon?: boolean;
  valueClass?: string;
  class?: ClassValue;
  size?: SelectTriggerProps["size"];
} & /* @vue-ignore */ SelectTriggerProps;
const {
  asChild = false,
  class: className,
  iconClass: iconClassName,
  placeholder,
  showIcon = true,
  size = "md",
  valueClass: valueClassName,
} = defineProps<SelectTriggerDeclaredProps>();
const slots = defineSlots<{ default?: () => VNode[]; icon?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
const triggerClass = computed(() => selectTrigger({ size, class: className }));
const pendingPrimitiveRef = shallowRef<
  ({ element?: HTMLElement | null } & ComponentPublicInstance) | null
>(null);

watch(
  () => {
    const owner = pendingPrimitiveRef.value;
    return [owner, owner?.element] as const;
  },
  ([owner, value]) => {
    if (pendingPrimitiveRef.value !== owner) return;
    element.value = value instanceof HTMLElement ? value : null;
  },
  { flush: "post" },
);

defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingPrimitiveRef.value = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef.value = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef.value !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () =>
      h(
        SelectPrimitive.SelectTrigger,
        mergeProps(attrs, {
          asChild: true,
          class: triggerClass.value,
          "data-slot": "select-trigger",
          ref: setElement,
        }),
        { default: slots.default },
      );
  },
});
</script>

<template>
  <AsChildTrigger v-if="asChild" />
  <SelectPrimitive.SelectTrigger
    v-else
    :ref="setElement"
    v-bind="attrs"
    :class="triggerClass"
    data-slot="select-trigger"
  >
    <slot>
      <SelectPrimitive.SelectValue
        :class="selectValue({ class: valueClassName })"
        :placeholder="placeholder"
        data-slot="select-value"
      />
    </slot>
    <SelectPrimitive.SelectIcon
      v-if="showIcon"
      :class="
        ['text-muted-foreground pointer-events-none size-4', iconClassName]
          .filter(Boolean)
          .join(' ')
      "
      data-slot="select-icon"
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
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </slot>
    </SelectPrimitive.SelectIcon>
  </SelectPrimitive.SelectTrigger>
</template>
