<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { TooltipRoot } from "@starwind-ui/svelte/tooltip";
  import { cx } from "tailwind-variants";
  import { tooltip, tooltipPositioner, tooltipContent, tooltipCaret } from "./variants.js";

  export type TooltipProps = ComponentProps<typeof TooltipRoot>;
</script>

<script lang="ts">
  let {
    defaultOpen = false,
    closeDelay = 200,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    disabled = false,
    disableHoverableContent = false,
    openDelay = 200,
    "class": className,
    open = $bindable(),
    onOpenChange,
    children,
    "open": commandOpen,
    ...rest
  }: TooltipProps = $props();
</script>

<TooltipRoot
  class={tooltip({ "class": cx(className) })}
  defaultOpen={defaultOpen}
  closeDelay={closeDelay}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  disabled={disabled}
  disableHoverableContent={disableHoverableContent}
  onOpenChange={onOpenChange}
  openDelay={openDelay}
  {...rest}
  data-slot={"tooltip"}
  children={children}
  bind:open={() => commandOpen, (next) => { open = next; }}
>

</TooltipRoot>
