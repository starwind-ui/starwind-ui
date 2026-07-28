<script setup lang="ts">
import * as SheetPrimitive from "@starwind-ui/vue/drawer";
import type { ClassValue } from "tailwind-variants";
import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  mergeProps,
  nextTick,
  ref,
  useAttrs,
  type VNode,
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
let pendingPrimitiveRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;

defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
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

const AsChildClose = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isVNode(child) || typeof child.type !== "string") {
        throw new TypeError("SheetClose asChild requires exactly one native element VNode.");
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined ? { type: "button" } : {};
      const consumerProps = mergeProps(attrs, { class: mergedClass.value });
      const protectedProps = {
        "data-slot": "sheet-close",
        "data-sw-drawer-close": "",
        "data-sw-part": "close",
        ref: setElement,
      };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
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
