<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { TooltipPopup } from "@starwind-ui/svelte/tooltip";
  import { cx } from "tailwind-variants";
  import { tooltip, tooltipPositioner, tooltipContent, tooltipCaret } from "./variants.js";
  import { TooltipPortal } from "@starwind-ui/svelte/tooltip";
  import { TooltipPositioner } from "@starwind-ui/svelte/tooltip";
  import { TooltipArrow } from "@starwind-ui/svelte/tooltip";

  export type TooltipContentProps = ComponentProps<typeof TooltipPopup> & { positionerClass?: string; portalContainer?: string; disablePortal?: boolean; icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "side": side = "top",
    "align": align = "center",
    "sideOffset": sideOffset = 8,
    "avoidCollisions": avoidCollisions = true,
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "positionerClass": positionerClass,
    "icon": icon,
    "children": children,
    ...rest
  }: TooltipContentProps = $props();
</script>

<TooltipPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"tooltip-portal"}
>
  <TooltipPositioner
    side={side}
    align={align}
    sideOffset={sideOffset}
    avoidCollisions={avoidCollisions}
    class={tooltipPositioner({ "class": cx(positionerClass) })}
    data-slot={"tooltip-positioner"}
  >
    <TooltipPopup
      class={tooltipContent({ "class": cx(className) })}
      side={side}
      align={align}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      {...rest}
      data-slot={"tooltip-content"}
    >
      {#if children}{@render children()}{:else}My tooltip!{/if}
      <TooltipArrow
        class={tooltipCaret({  })}
        data-slot={"tooltip-arrow"}
      >
        {#if icon}{@render icon()}{:else}<svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"currentColor"}
          aria-hidden={"true"}
        >
          <path
            d={"M11.293 7.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 -.707 1.707h-12a1 1 0 0 1 -.707 -1.707z"}
            stroke={"none"}
          />
        </svg>{/if}
      </TooltipArrow>
    </TooltipPopup>
  </TooltipPositioner>
</TooltipPortal>
