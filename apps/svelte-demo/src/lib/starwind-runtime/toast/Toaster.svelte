<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { ToastViewport } from "@starwind-ui/svelte/toast";
  import { cx } from "tailwind-variants";
  import { toastAction, toastClose, toastContent, toastDescription, toastItem, toastTitle, toastViewport } from "./variants.js";
  import { ToastTemplate } from "@starwind-ui/svelte/toast";
  import { ToastRoot } from "@starwind-ui/svelte/toast";
  import { ToastContent } from "@starwind-ui/svelte/toast";
  import { ToastTitle } from "@starwind-ui/svelte/toast";
  import { ToastTitleText } from "@starwind-ui/svelte/toast";
  import { ToastDescription } from "@starwind-ui/svelte/toast";
  import { ToastAction } from "@starwind-ui/svelte/toast";
  import { ToastClose } from "@starwind-ui/svelte/toast";
  import "./styles.css";

  export type ToasterProps = ComponentProps<typeof ToastViewport>;
</script>

<script lang="ts">
  let {
    "class": className,
    "duration": duration = 5000,
    "gap": gap = "0.5rem",
    "limit": limit = 3,
    "peek": peek = "1rem",
    "position": position = "bottom-right",
    "style": style,
    "children": children,
    ...rest
  }: ToasterProps = $props();
</script>

<ToastViewport
  class={toastViewport({ "class": cx(className) })}
  duration={duration}
  limit={limit}
  position={position}
  style={style}
  {...rest}
  data-slot={"toast-viewport"}
  gap={gap}
  peek={peek}
>
  {#if children}{@render children()}{:else}<ToastTemplate
    variant={"default"}
  >
    <ToastRoot
      class={toastItem({ "variant": "default" })}
      variant={"default"}
      data-slot={"toast"}
    >
      <ToastContent
        class={toastContent({  })}
        data-slot={"toast-content"}
      >
        <ToastTitle
          class={toastTitle({ "variant": "default" })}
          data-slot={"toast-title"}
        >
          <ToastTitleText
            data-slot={"toast-title-text"}
          >
            Title
          </ToastTitleText>
        </ToastTitle>
        <ToastDescription
          class={toastDescription({  })}
          data-slot={"toast-description"}
        >
          Description
        </ToastDescription>
        <ToastAction
          class={toastAction({  })}
          data-slot={"toast-action"}
        >
          Action
        </ToastAction>
      </ToastContent>
      <ToastClose
        class={toastClose({  })}
        data-slot={"toast-close"}
      >
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          stroke-width={"2"}
          stroke-linecap={"round"}
          stroke-linejoin={"round"}
          aria-hidden={"true"}
          class={"size-4"}
        >
          <path
            stroke={"none"}
            d={"M0 0h24v24H0z"}
            fill={"none"}
          />
          <path
            d={"M18 6l-12 12"}
          />
          <path
            d={"M6 6l12 12"}
          />
        </svg>
      </ToastClose>
    </ToastRoot>
  </ToastTemplate>
  <ToastTemplate
    variant={"success"}
  >
    <ToastRoot
      class={toastItem({ "variant": "success" })}
      variant={"success"}
      data-slot={"toast"}
    >
      <ToastContent
        class={toastContent({  })}
        data-slot={"toast-content"}
      >
        <ToastTitle
          class={toastTitle({ "variant": "success" })}
          data-slot={"toast-title"}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            stroke-width={"2"}
            stroke-linecap={"round"}
            stroke-linejoin={"round"}
            aria-hidden={"true"}
          >
            <path
              stroke={"none"}
              d={"M0 0h24v24H0z"}
              fill={"none"}
            />
            <path
              d={"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"}
            />
            <path
              d={"M9 12l2 2l4 -4"}
            />
          </svg>
          <ToastTitleText
            data-slot={"toast-title-text"}
          >
            Title
          </ToastTitleText>
        </ToastTitle>
        <ToastDescription
          class={toastDescription({  })}
          data-slot={"toast-description"}
        >
          Description
        </ToastDescription>
        <ToastAction
          class={toastAction({  })}
          data-slot={"toast-action"}
        >
          Action
        </ToastAction>
      </ToastContent>
      <ToastClose
        class={toastClose({  })}
        data-slot={"toast-close"}
      >
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          stroke-width={"2"}
          stroke-linecap={"round"}
          stroke-linejoin={"round"}
          aria-hidden={"true"}
          class={"size-4"}
        >
          <path
            stroke={"none"}
            d={"M0 0h24v24H0z"}
            fill={"none"}
          />
          <path
            d={"M18 6l-12 12"}
          />
          <path
            d={"M6 6l12 12"}
          />
        </svg>
      </ToastClose>
    </ToastRoot>
  </ToastTemplate>
  <ToastTemplate
    variant={"error"}
  >
    <ToastRoot
      class={toastItem({ "variant": "error" })}
      variant={"error"}
      data-slot={"toast"}
    >
      <ToastContent
        class={toastContent({  })}
        data-slot={"toast-content"}
      >
        <ToastTitle
          class={toastTitle({ "variant": "error" })}
          data-slot={"toast-title"}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            stroke-width={"2"}
            stroke-linecap={"round"}
            stroke-linejoin={"round"}
            aria-hidden={"true"}
          >
            <path
              stroke={"none"}
              d={"M0 0h24v24H0z"}
              fill={"none"}
            />
            <path
              d={"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"}
            />
            <path
              d={"M10 10l4 4m0 -4l-4 4"}
            />
          </svg>
          <ToastTitleText
            data-slot={"toast-title-text"}
          >
            Title
          </ToastTitleText>
        </ToastTitle>
        <ToastDescription
          class={toastDescription({  })}
          data-slot={"toast-description"}
        >
          Description
        </ToastDescription>
        <ToastAction
          class={toastAction({  })}
          data-slot={"toast-action"}
        >
          Action
        </ToastAction>
      </ToastContent>
      <ToastClose
        class={toastClose({  })}
        data-slot={"toast-close"}
      >
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          stroke-width={"2"}
          stroke-linecap={"round"}
          stroke-linejoin={"round"}
          aria-hidden={"true"}
          class={"size-4"}
        >
          <path
            stroke={"none"}
            d={"M0 0h24v24H0z"}
            fill={"none"}
          />
          <path
            d={"M18 6l-12 12"}
          />
          <path
            d={"M6 6l12 12"}
          />
        </svg>
      </ToastClose>
    </ToastRoot>
  </ToastTemplate>
  <ToastTemplate
    variant={"warning"}
  >
    <ToastRoot
      class={toastItem({ "variant": "warning" })}
      variant={"warning"}
      data-slot={"toast"}
    >
      <ToastContent
        class={toastContent({  })}
        data-slot={"toast-content"}
      >
        <ToastTitle
          class={toastTitle({ "variant": "warning" })}
          data-slot={"toast-title"}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            stroke-width={"2"}
            stroke-linecap={"round"}
            stroke-linejoin={"round"}
            aria-hidden={"true"}
          >
            <path
              stroke={"none"}
              d={"M0 0h24v24H0z"}
              fill={"none"}
            />
            <path
              d={"M12 9v4"}
            />
            <path
              d={"M10.3 3.7l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7 -3l-8 -14a2 2 0 0 0 -3.4 0z"}
            />
            <path
              d={"M12 17h.01"}
            />
          </svg>
          <ToastTitleText
            data-slot={"toast-title-text"}
          >
            Title
          </ToastTitleText>
        </ToastTitle>
        <ToastDescription
          class={toastDescription({  })}
          data-slot={"toast-description"}
        >
          Description
        </ToastDescription>
        <ToastAction
          class={toastAction({  })}
          data-slot={"toast-action"}
        >
          Action
        </ToastAction>
      </ToastContent>
      <ToastClose
        class={toastClose({  })}
        data-slot={"toast-close"}
      >
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          stroke-width={"2"}
          stroke-linecap={"round"}
          stroke-linejoin={"round"}
          aria-hidden={"true"}
          class={"size-4"}
        >
          <path
            stroke={"none"}
            d={"M0 0h24v24H0z"}
            fill={"none"}
          />
          <path
            d={"M18 6l-12 12"}
          />
          <path
            d={"M6 6l12 12"}
          />
        </svg>
      </ToastClose>
    </ToastRoot>
  </ToastTemplate>
  <ToastTemplate
    variant={"info"}
  >
    <ToastRoot
      class={toastItem({ "variant": "info" })}
      variant={"info"}
      data-slot={"toast"}
    >
      <ToastContent
        class={toastContent({  })}
        data-slot={"toast-content"}
      >
        <ToastTitle
          class={toastTitle({ "variant": "info" })}
          data-slot={"toast-title"}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            stroke-width={"2"}
            stroke-linecap={"round"}
            stroke-linejoin={"round"}
            aria-hidden={"true"}
          >
            <path
              stroke={"none"}
              d={"M0 0h24v24H0z"}
              fill={"none"}
            />
            <path
              d={"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"}
            />
            <path
              d={"M12 8l.01 0"}
            />
            <path
              d={"M11 12l1 0l0 4l1 0"}
            />
          </svg>
          <ToastTitleText
            data-slot={"toast-title-text"}
          >
            Title
          </ToastTitleText>
        </ToastTitle>
        <ToastDescription
          class={toastDescription({  })}
          data-slot={"toast-description"}
        >
          Description
        </ToastDescription>
        <ToastAction
          class={toastAction({  })}
          data-slot={"toast-action"}
        >
          Action
        </ToastAction>
      </ToastContent>
      <ToastClose
        class={toastClose({  })}
        data-slot={"toast-close"}
      >
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          stroke-width={"2"}
          stroke-linecap={"round"}
          stroke-linejoin={"round"}
          aria-hidden={"true"}
          class={"size-4"}
        >
          <path
            stroke={"none"}
            d={"M0 0h24v24H0z"}
            fill={"none"}
          />
          <path
            d={"M18 6l-12 12"}
          />
          <path
            d={"M6 6l12 12"}
          />
        </svg>
      </ToastClose>
    </ToastRoot>
  </ToastTemplate>
  <ToastTemplate
    variant={"loading"}
  >
    <ToastRoot
      class={toastItem({ "variant": "default" })}
      variant={"default"}
      data-slot={"toast"}
    >
      <ToastContent
        class={toastContent({  })}
        data-slot={"toast-content"}
      >
        <ToastTitle
          class={toastTitle({ "variant": "loading" })}
          data-slot={"toast-title"}
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            stroke-width={"2"}
            stroke-linecap={"round"}
            stroke-linejoin={"round"}
            aria-hidden={"true"}
            class={"animate-spin"}
          >
            <path
              stroke={"none"}
              d={"M0 0h24v24H0z"}
              fill={"none"}
            />
            <path
              d={"M12 3a9 9 0 1 0 9 9"}
            />
          </svg>
          <ToastTitleText
            data-slot={"toast-title-text"}
          >
            Title
          </ToastTitleText>
        </ToastTitle>
        <ToastDescription
          class={toastDescription({  })}
          data-slot={"toast-description"}
        >
          Description
        </ToastDescription>
        <ToastAction
          class={toastAction({  })}
          data-slot={"toast-action"}
        >
          Action
        </ToastAction>
      </ToastContent>
      <ToastClose
        class={toastClose({  })}
        data-slot={"toast-close"}
      >
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          stroke-width={"2"}
          stroke-linecap={"round"}
          stroke-linejoin={"round"}
          aria-hidden={"true"}
          class={"size-4"}
        >
          <path
            stroke={"none"}
            d={"M0 0h24v24H0z"}
            fill={"none"}
          />
          <path
            d={"M18 6l-12 12"}
          />
          <path
            d={"M6 6l12 12"}
          />
        </svg>
      </ToastClose>
    </ToastRoot>
  </ToastTemplate>{/if}
</ToastViewport>
