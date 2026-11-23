<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PopoverPopup } from "@starwind-ui/svelte/popover";
  import { cx } from "tailwind-variants";
  import type { VariantProps } from "tailwind-variants";
  import { popover, popoverContent, popoverDescription, popoverHeader, popoverTitle, popoverTrigger } from "./variants.js";
  import { PopoverPortal } from "@starwind-ui/svelte/popover";

  export type PopoverContentProps = ComponentProps<typeof PopoverPopup> & VariantProps<typeof popoverContent> & { portalContainer?: string; disablePortal?: boolean; };
</script>

<script lang="ts">
  let {
    "class": className,
    side = "bottom",
    align = "center",
    sideOffset = 4,
    avoidCollisions = true,
    collisionStrategy = "initial-placement",
    exitMotion = "popover",
    portalContainer,
    disablePortal = false,
    children,
    ...rest
  }: PopoverContentProps = $props();
</script>

<PopoverPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"popover-portal"}
>
  <PopoverPopup
    class={popoverContent({ "exitMotion": exitMotion, "class": cx(className) })}
    side={side}
    align={align}
    sideOffset={sideOffset}
    avoidCollisions={avoidCollisions}
    collisionStrategy={collisionStrategy}
    data-slot={"popover-content"}
    {...rest}
  >
    {@render children?.()}
  </PopoverPopup>
</PopoverPortal>
