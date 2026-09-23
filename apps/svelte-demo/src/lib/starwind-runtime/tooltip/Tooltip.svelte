<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { TooltipRoot } from "@starwind-ui/svelte/tooltip";
  import { cx } from "tailwind-variants";
  import { tooltip, tooltipPositioner, tooltipContent, tooltipCaret } from "./variants.js";

  export type TooltipProps = ComponentProps<typeof TooltipRoot>;
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen = false,
    "closeDelay": closeDelay = 200,
    "closeOnEscape": closeOnEscape = true,
    "closeOnOutsideInteract": closeOnOutsideInteract = true,
    "disabled": disabled = false,
    "disableHoverableContent": disableHoverableContent = false,
    "openDelay": openDelay = 200,
    "class": className,
    open = $bindable(),
    "onOpenChange": onOpenChange,
    "children": children,
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
  bind:open={open}
>

</TooltipRoot>
