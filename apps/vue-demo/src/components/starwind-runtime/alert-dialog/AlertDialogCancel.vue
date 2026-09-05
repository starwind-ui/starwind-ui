<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import {
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
import { Button } from "../button";
import { alertDialogCancel, alertDialogCancelAsChild } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDialogCancelProps = InstanceType<typeof Button>["$props"] & {
  asChild?: boolean;
  class?: ClassValue;
};
type AlertDialogCancelDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
  variant?: unknown;
  size?: unknown;
} & /* @vue-ignore */ AlertDialogCancelProps;
const {
  asChild = false,
  variant = "outline",
  size = "md",
  class: className,
} = defineProps<AlertDialogCancelDeclaredProps>();
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => ({ ...attrs, class: undefined }));
const element = ref<HTMLElement | null>(null);
const mergedClass = computed(() =>
  alertDialogCancelAsChild({ variant: variant as never, size: size as never, class: className }),
);
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

const AsChildCancel = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isVNode(child) || typeof child.type !== "string") {
        throw new TypeError("AlertDialogCancel asChild requires exactly one native element VNode.");
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined ? { type: "button" } : {};
      const consumerProps = mergeProps(attrs, { class: mergedClass.value });
      const protectedProps = {
        "data-slot": "alert-dialog-cancel",
        "data-sw-alert-dialog-close": "",
        "data-sw-part": "close",
        ref: setElement,
      };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
  },
});
</script>

<template>
  <AsChildCancel v-if="asChild" />
  <Button
    v-else
    :ref="setElement"
    :variant="variant"
    :size="size"
    :class="alertDialogCancel({ class: className }) as never"
    v-bind="forwardedAttrs"
    data-slot="alert-dialog-cancel"
    data-sw-alert-dialog-close
  >
    <slot />
  </Button>
</template>
