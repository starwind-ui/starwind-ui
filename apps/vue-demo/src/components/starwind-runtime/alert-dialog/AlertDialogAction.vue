<script setup lang="ts">
import { __useAlertDialogControl } from "@starwind-ui/vue/alert-dialog";
import type { ClassValue } from "tailwind-variants";
import { computed, defineComponent, mergeProps, useAttrs, type VNode } from "vue";
import { Button } from "../button";
import { alertDialogAction, alertDialogActionAsChild } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDialogActionProps = InstanceType<typeof Button>["$props"] & {
  asChild?: boolean;
  class?: ClassValue;
};
type AlertDialogActionDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
  variant?: unknown;
  size?: unknown;
} & /* @vue-ignore */ AlertDialogActionProps;
const {
  asChild = false,
  variant = "default",
  size = "md",
  class: className,
} = defineProps<AlertDialogActionDeclaredProps>();
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => ({ ...attrs, class: undefined }));
const mergedClass = computed(() =>
  alertDialogActionAsChild({ variant: variant as never, size: size as never, class: className }),
);
const { element, render: renderAsChild, setElement } = __useAlertDialogControl("AlertDialogAction");

defineExpose({ element });

const AsChildAction = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const consumerProps = mergeProps(attrs, { class: mergedClass.value });
      const protectedProps = {
        "data-slot": "alert-dialog-action",
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
  <AsChildAction v-if="asChild" />
  <Button
    v-else
    :ref="setElement"
    :variant="variant"
    :size="size"
    :class="alertDialogAction({ class: className }) as never"
    v-bind="forwardedAttrs"
    data-slot="alert-dialog-action"
    data-sw-alert-dialog-close
  >
    <slot />
  </Button>
</template>
