<script setup lang="ts">
import * as AlertDialogPrimitive from "@starwind-ui/vue/alert-dialog";
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

export type AlertDialogTriggerProps = Omit<
  ButtonHTMLAttributes,
  "asChild" | "class" | "targetId"
> & {
  asChild?: boolean;
  targetId?: string;
  class?: ClassValue;
};
type AlertDialogTriggerDeclaredProps = {
  asChild?: boolean;
  targetId?: string;
  class?: ClassValue;
} & /* @vue-ignore */ AlertDialogTriggerProps;
const {
  asChild = false,
  targetId,
  class: className,
} = defineProps<AlertDialogTriggerDeclaredProps>();
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => ({ ...attrs, class: undefined }));
const element = ref<HTMLElement | null>(null);
const mergedClass = computed(() => className);
let pendingComponentRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;

defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingComponentRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingComponentRef = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingComponentRef !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isVNode(child) || typeof child.type !== "string") {
        throw new TypeError(
          "AlertDialogTrigger asChild requires exactly one native element VNode.",
        );
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined ? { type: "button" } : {};
      const consumerProps = mergeProps(attrs, { class: mergedClass.value });
      const protectedProps = {
        "data-slot": "alert-dialog-trigger",
        "data-sw-alert-dialog-target-id": targetId,
        "data-sw-alert-dialog-trigger": "",
        "data-sw-part": "trigger",
        ref: setElement,
      };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
  },
});
</script>

<template>
  <AsChildTrigger v-if="asChild" />
  <AlertDialogPrimitive.AlertDialogTrigger
    v-else
    :ref="setElement"
    :class="mergedClass as import('vue').ClassValue"
    :target-id="targetId"
    v-bind="forwardedAttrs"
    data-slot="alert-dialog-trigger"
  >
    <slot />
  </AlertDialogPrimitive.AlertDialogTrigger>
</template>
