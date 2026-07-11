import type * as React from "react";
import "./styles.css";
import ToastPrimitive from "@starwind-ui/react/toast";
import {
  IconAlertTriangle as AlertTriangle,
  IconCircleCheck as CircleCheck,
  IconCircleX as CircleX,
  IconInfoCircle as InfoCircle,
  IconLoader2 as Loader2,
  IconX as X,
} from "@tabler/icons-react";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
} from "./variants";

export type ToasterProps = React.ComponentPropsWithoutRef<"div"> & {
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
};

function Toaster(props: ToasterProps) {
  const {
    className,
    duration = 5000,
    gap = "0.5rem",
    limit = 3,
    peek = "1rem",
    position = "bottom-right",
    style,
    children,
    ...rest
  } = props;

  const viewportStyle = { "--gap": gap, "--peek": peek, ...(style ?? {}) } as React.CSSProperties &
    Record<"--gap" | "--peek", string>;

  return (
    <ToastPrimitive.Viewport
      className={toastViewport({ class: className })}
      duration={duration}
      limit={limit}
      position={position}
      style={viewportStyle}
      {...rest}
      data-slot="toast-viewport"
    >
      {children ?? (
        <>
          <ToastPrimitive.Template variant="default">
            <ToastPrimitive.Root
              className={toastItem({ variant: "default" })}
              variant={"default"}
              data-slot="toast"
            >
              <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
                <ToastPrimitive.Title
                  className={toastTitle({ variant: "default" })}
                  data-slot="toast-title"
                >
                  <ToastPrimitive.TitleText data-slot="toast-title-text">
                    Title
                  </ToastPrimitive.TitleText>
                </ToastPrimitive.Title>

                <ToastPrimitive.Description
                  className={toastDescription()}
                  data-slot="toast-description"
                >
                  Description
                </ToastPrimitive.Description>

                <ToastPrimitive.Action className={toastAction()} data-slot="toast-action">
                  Action
                </ToastPrimitive.Action>
              </ToastPrimitive.Content>

              <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          </ToastPrimitive.Template>

          <ToastPrimitive.Template variant="success">
            <ToastPrimitive.Root
              className={toastItem({ variant: "success" })}
              variant={"success"}
              data-slot="toast"
            >
              <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
                <ToastPrimitive.Title
                  className={toastTitle({ variant: "success" })}
                  data-slot="toast-title"
                >
                  <CircleCheck />

                  <ToastPrimitive.TitleText data-slot="toast-title-text">
                    Title
                  </ToastPrimitive.TitleText>
                </ToastPrimitive.Title>

                <ToastPrimitive.Description
                  className={toastDescription()}
                  data-slot="toast-description"
                >
                  Description
                </ToastPrimitive.Description>

                <ToastPrimitive.Action className={toastAction()} data-slot="toast-action">
                  Action
                </ToastPrimitive.Action>
              </ToastPrimitive.Content>

              <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          </ToastPrimitive.Template>

          <ToastPrimitive.Template variant="error">
            <ToastPrimitive.Root
              className={toastItem({ variant: "error" })}
              variant={"error"}
              data-slot="toast"
            >
              <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
                <ToastPrimitive.Title
                  className={toastTitle({ variant: "error" })}
                  data-slot="toast-title"
                >
                  <CircleX />

                  <ToastPrimitive.TitleText data-slot="toast-title-text">
                    Title
                  </ToastPrimitive.TitleText>
                </ToastPrimitive.Title>

                <ToastPrimitive.Description
                  className={toastDescription()}
                  data-slot="toast-description"
                >
                  Description
                </ToastPrimitive.Description>

                <ToastPrimitive.Action className={toastAction()} data-slot="toast-action">
                  Action
                </ToastPrimitive.Action>
              </ToastPrimitive.Content>

              <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          </ToastPrimitive.Template>

          <ToastPrimitive.Template variant="warning">
            <ToastPrimitive.Root
              className={toastItem({ variant: "warning" })}
              variant={"warning"}
              data-slot="toast"
            >
              <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
                <ToastPrimitive.Title
                  className={toastTitle({ variant: "warning" })}
                  data-slot="toast-title"
                >
                  <AlertTriangle />

                  <ToastPrimitive.TitleText data-slot="toast-title-text">
                    Title
                  </ToastPrimitive.TitleText>
                </ToastPrimitive.Title>

                <ToastPrimitive.Description
                  className={toastDescription()}
                  data-slot="toast-description"
                >
                  Description
                </ToastPrimitive.Description>

                <ToastPrimitive.Action className={toastAction()} data-slot="toast-action">
                  Action
                </ToastPrimitive.Action>
              </ToastPrimitive.Content>

              <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          </ToastPrimitive.Template>

          <ToastPrimitive.Template variant="info">
            <ToastPrimitive.Root
              className={toastItem({ variant: "info" })}
              variant={"info"}
              data-slot="toast"
            >
              <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
                <ToastPrimitive.Title
                  className={toastTitle({ variant: "info" })}
                  data-slot="toast-title"
                >
                  <InfoCircle />

                  <ToastPrimitive.TitleText data-slot="toast-title-text">
                    Title
                  </ToastPrimitive.TitleText>
                </ToastPrimitive.Title>

                <ToastPrimitive.Description
                  className={toastDescription()}
                  data-slot="toast-description"
                >
                  Description
                </ToastPrimitive.Description>

                <ToastPrimitive.Action className={toastAction()} data-slot="toast-action">
                  Action
                </ToastPrimitive.Action>
              </ToastPrimitive.Content>

              <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          </ToastPrimitive.Template>

          <ToastPrimitive.Template variant="loading">
            <ToastPrimitive.Root
              className={toastItem({ variant: "default" })}
              variant={"default"}
              data-slot="toast"
            >
              <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
                <ToastPrimitive.Title
                  className={toastTitle({ variant: "loading" })}
                  data-slot="toast-title"
                >
                  <Loader2 className="animate-spin" />

                  <ToastPrimitive.TitleText data-slot="toast-title-text">
                    Title
                  </ToastPrimitive.TitleText>
                </ToastPrimitive.Title>

                <ToastPrimitive.Description
                  className={toastDescription()}
                  data-slot="toast-description"
                >
                  Description
                </ToastPrimitive.Description>

                <ToastPrimitive.Action className={toastAction()} data-slot="toast-action">
                  Action
                </ToastPrimitive.Action>
              </ToastPrimitive.Content>

              <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          </ToastPrimitive.Template>
        </>
      )}
    </ToastPrimitive.Viewport>
  );
}

export default Toaster;
