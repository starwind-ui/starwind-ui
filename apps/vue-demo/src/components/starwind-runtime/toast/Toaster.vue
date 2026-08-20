<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, computed, type HTMLAttributes, nextTick, ref } from "vue";
import "./styles.css";
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
} from "./variants";

defineOptions({ inheritAttrs: false });

export type ToasterProps = Omit<
  HTMLAttributes,
  "class" | "duration" | "gap" | "limit" | "peek" | "position"
> & {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  limit?: number;
  gap?: string;
  peek?: string;
  duration?: number;
  class?: ClassValue;
};
type ToasterDeclaredProps = {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  limit?: number;
  gap?: string;
  peek?: string;
  duration?: number;
  class?: ClassValue;
  style?: unknown;
} & /* @vue-ignore */ ToasterProps;
const {
  class: className,
  duration = 5000,
  gap = "0.5rem",
  limit = 3,
  peek = "1rem",
  position = "bottom-right",
  style,
} = defineProps<ToasterDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const viewportStyle = computed(() => [{ "--gap": gap, "--peek": peek }, style]);
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
  <ToastPrimitive.ToastViewport
    :ref="setElement"
    :class="toastViewport({ class: className })"
    :duration="duration"
    :limit="limit"
    :position="position"
    :style="viewportStyle"
    v-bind="$attrs"
    data-slot="toast-viewport"
  >
    <slot>
      <ToastPrimitive.ToastTemplate variant="default">
        <ToastPrimitive.ToastRoot
          :class="toastItem({ variant: 'default' })"
          :variant="'default'"
          data-slot="toast"
        >
          <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
            <ToastPrimitive.ToastTitle
              :class="toastTitle({ variant: 'default' })"
              data-slot="toast-title"
            >
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
      </ToastPrimitive.ToastTemplate>
      <ToastPrimitive.ToastTemplate variant="success">
        <ToastPrimitive.ToastRoot
          :class="toastItem({ variant: 'success' })"
          :variant="'success'"
          data-slot="toast"
        >
          <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
            <ToastPrimitive.ToastTitle
              :class="toastTitle({ variant: 'success' })"
              data-slot="toast-title"
            >
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
      </ToastPrimitive.ToastTemplate>
      <ToastPrimitive.ToastTemplate variant="error">
        <ToastPrimitive.ToastRoot
          :class="toastItem({ variant: 'error' })"
          :variant="'error'"
          data-slot="toast"
        >
          <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
            <ToastPrimitive.ToastTitle
              :class="toastTitle({ variant: 'error' })"
              data-slot="toast-title"
            >
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
      </ToastPrimitive.ToastTemplate>
      <ToastPrimitive.ToastTemplate variant="warning">
        <ToastPrimitive.ToastRoot
          :class="toastItem({ variant: 'warning' })"
          :variant="'warning'"
          data-slot="toast"
        >
          <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
            <ToastPrimitive.ToastTitle
              :class="toastTitle({ variant: 'warning' })"
              data-slot="toast-title"
            >
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
      </ToastPrimitive.ToastTemplate>
      <ToastPrimitive.ToastTemplate variant="info">
        <ToastPrimitive.ToastRoot
          :class="toastItem({ variant: 'info' })"
          :variant="'info'"
          data-slot="toast"
        >
          <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
            <ToastPrimitive.ToastTitle
              :class="toastTitle({ variant: 'info' })"
              data-slot="toast-title"
            >
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
      </ToastPrimitive.ToastTemplate>
      <ToastPrimitive.ToastTemplate variant="loading">
        <ToastPrimitive.ToastRoot
          :class="toastItem({ variant: 'default' })"
          :variant="'default'"
          data-slot="toast"
        >
          <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
            <ToastPrimitive.ToastTitle
              :class="toastTitle({ variant: 'loading' })"
              data-slot="toast-title"
            >
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
      </ToastPrimitive.ToastTemplate>
    </slot>
  </ToastPrimitive.ToastViewport>
</template>
