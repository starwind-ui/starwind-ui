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

export type SheetCloseProps = Omit<ButtonHTMLAttributes, "asChild" | "class"> & {
  asChild?: boolean;
  class?: ClassValue;
};
type SheetCloseDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ SheetCloseProps;
const { asChild = false, class: className } = defineProps<SheetCloseDeclaredProps>();
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

const AsChildClose = defineComponent({
  inheritAttrs: false,
  setup() {
    return () =>
      h(
        SheetPrimitive.DrawerClose,
        mergeProps(attrs, {
          asChild: true,
          class: mergedClass.value,
          "data-slot": "sheet-close",
          ref: setElement,
        }),
        { default: slots.default },
      );
  },
});
</script>

<template>
  <AsChildClose v-if="asChild" />
  <SheetPrimitive.DrawerClose
    v-else
    :ref="setElement"
    :class="mergedClass as import('vue').ClassValue"
    v-bind="attrs"
    data-slot="sheet-close"
  >
    <slot> Close </slot>
  </SheetPrimitive.DrawerClose>
</template>
