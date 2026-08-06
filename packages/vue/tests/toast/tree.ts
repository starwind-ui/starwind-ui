import { h, type VNode } from "vue";

import {
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastRoot,
  ToastTemplate,
  ToastTitle,
  ToastTitleText,
  ToastViewport,
} from "@starwind-ui/vue/toast";
import type { ToastVariant } from "@starwind-ui/runtime";

const variants: ToastVariant[] = ["default", "error", "info", "loading", "success", "warning"];

export function toastProvider(props: Record<string, unknown> = {}): VNode {
  const { closeAriaLabel, ...viewportProps } = props;
  return h(
    ToastViewport,
    { duration: 5000, gap: "8px", limit: 3, peek: "12px", ...viewportProps },
    { default: () => variants.map((variant) => toastTemplate(variant, closeAriaLabel)) },
  );
}

function toastTemplate(variant: ToastVariant, closeAriaLabel: unknown): VNode {
  return h(
    ToastTemplate,
    { variant },
    {
      default: () =>
        h(
          ToastRoot,
          { class: `toast-${variant}` },
          {
            default: () =>
              h(ToastContent, null, {
                default: () => [
                  h(ToastTitle, null, { default: () => h(ToastTitleText) }),
                  h(ToastDescription),
                  h(ToastAction),
                  h(
                    ToastClose,
                    closeAriaLabel === undefined ? null : { "aria-label": closeAriaLabel },
                    { default: () => "Close" },
                  ),
                ],
              }),
          },
        ),
    },
  );
}
