<script setup lang="ts">
import { __useAlertDialogControl } from "@starwind-ui/vue/alert-dialog";
import type { ClassValue } from "tailwind-variants";
import { computed, defineComponent, mergeProps, useAttrs, type VNode } from "vue";
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
const mergedClass = computed(() =>
  alertDialogCancelAsChild({ variant: variant as never, size: size as never, class: className }),
);
const { element, render: renderAsChild, setElement } = __useAlertDialogControl("AlertDialogCancel");

defineExpose({ element });

const AsChildCancel = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const consumerProps = mergeProps(attrs, { class: mergedClass.value });
      const protectedProps = {
        "data-slot": "alert-dialog-cancel",
        "data-sw-alert-dialog-close": "",
        "data-sw-part": "close",
      };
      return renderAsChild({
        children,
        consumerProps,
        defaultNativeButtonType: "button",
        protectedProps,
      });
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
