<script setup lang="ts">
import * as SheetPrimitive from "@starwind-ui/vue/drawer";
import type { ClassValue } from "tailwind-variants";
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

defineOptions({ inheritAttrs: false });

export type SheetTriggerProps = Omit<ButtonHTMLAttributes, "asChild" | "class" | "targetId"> & {
  asChild?: boolean;
  targetId?: string;
  class?: ClassValue;
};
type SheetTriggerDeclaredProps = {
  asChild?: boolean;
  targetId?: string;
  class?: ClassValue;
} & /* @vue-ignore */ SheetTriggerProps;
const { asChild = false, targetId, class: className } = defineProps<SheetTriggerDeclaredProps>();
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
const mergedClass = computed(() => className);
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
        SheetPrimitive.DrawerTrigger,
        mergeProps(attrs, {
          asChild: true,
          class: mergedClass.value,
          "data-slot": "sheet-trigger",
          ref: setElement,
          targetId,
        }),
        { default: slots.default },
      );
  },
});
</script>

<template>
  <AsChildTrigger v-if="asChild" />
  <SheetPrimitive.DrawerTrigger
    v-else
    :ref="setElement"
    :class="mergedClass as import('vue').ClassValue"
    :target-id="targetId"
    v-bind="attrs"
    data-slot="sheet-trigger"
  >
    <slot></slot>
  </SheetPrimitive.DrawerTrigger>
</template>
