<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PreviewCardRoot } from "@starwind-ui/svelte/preview-card";
  import { cx } from "tailwind-variants";
  import { hoverCard, hoverCardPositioner, hoverCardContent, hoverCardTrigger } from "./variants.js";

  export type HoverCardProps = ComponentProps<typeof PreviewCardRoot>;
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen = false,
    "closeDelay": closeDelay = 300,
    "closeOnEscape": closeOnEscape = true,
    "closeOnOutsideInteract": closeOnOutsideInteract = true,
    "disableHoverableContent": disableHoverableContent = false,
    "openDelay": openDelay = 600,
    "class": className,
    open = $bindable(),
    "onOpenChange": onOpenChange,
    "children": children,
    ...rest
  }: HoverCardProps = $props();
</script>

<PreviewCardRoot
  class={hoverCard({ "class": cx(className) })}
  defaultOpen={defaultOpen}
  closeDelay={closeDelay}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  disableHoverableContent={disableHoverableContent}
  onOpenChange={onOpenChange}
  openDelay={openDelay}
  {...rest}
  data-slot={"hover-card"}
  children={children}
  bind:open={open}
>

</PreviewCardRoot>
