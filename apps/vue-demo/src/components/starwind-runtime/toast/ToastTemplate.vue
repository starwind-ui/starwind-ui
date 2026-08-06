<script setup lang="ts">
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import { type HTMLAttributes, useAttrs } from "vue";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
} from "./variants";

defineOptions({ inheritAttrs: false });

export type ToastTemplateProps = Omit<HTMLAttributes, "variant"> & {
  variant?: "default" | "error" | "info" | "loading" | "success" | "warning";
};
type ToastTemplateDeclaredProps = {
  variant?: "default" | "error" | "info" | "loading" | "success" | "warning";
} & /* @vue-ignore */ ToastTemplateProps;
const { variant = "default" } = defineProps<ToastTemplateDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ToastPrimitive.ToastTemplate :variant="variant" v-bind="attrs">
    <slot>
      <ToastPrimitive.ToastRoot
        :class="toastItem({ variant: variant === 'loading' ? 'default' : variant })"
        :variant="variant === 'loading' ? 'default' : variant"
        data-slot="toast"
      >
        <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
          <ToastPrimitive.ToastTitle :class="toastTitle({ variant })" data-slot="toast-title">
            <template v-if="variant === 'success'">
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
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 12l2 2l4 -4" />
              </svg>
            </template>
            <template v-if="variant === 'error'">
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
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M10 10l4 4m0 -4l-4 4" />
              </svg>
            </template>
            <template v-if="variant === 'warning'">
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
                <path d="M12 9v4" />
                <path
                  d="M10.3 3.7l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7 -3l-8 -14a2 2 0 0 0 -3.4 0z"
                />
                <path d="M12 17h.01" />
              </svg>
            </template>
            <template v-if="variant === 'info'">
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
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M12 8l.01 0" />
                <path d="M11 12l1 0l0 4l1 0" />
              </svg>
            </template>
            <template v-if="variant === 'loading'">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="animate-spin"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </template>
            <ToastPrimitive.ToastTitleText data-slot="toast-title-text">
              Title
            </ToastPrimitive.ToastTitleText>
          </ToastPrimitive.ToastTitle>
          <ToastPrimitive.ToastDescription
            :class="toastDescription()"
            data-slot="toast-description"
          >
            Description
          </ToastPrimitive.ToastDescription>
          <ToastPrimitive.ToastAction :class="toastAction()" data-slot="toast-action">
            Action
          </ToastPrimitive.ToastAction>
        </ToastPrimitive.ToastContent>
        <ToastPrimitive.ToastClose :class="toastClose()" data-slot="toast-close">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="size-4"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
        </ToastPrimitive.ToastClose>
      </ToastPrimitive.ToastRoot>
    </slot>
  </ToastPrimitive.ToastTemplate>
</template>
