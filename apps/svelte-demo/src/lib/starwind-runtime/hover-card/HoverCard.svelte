<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PreviewCardRoot } from "@starwind-ui/svelte/preview-card";
  import { cx } from "tailwind-variants";
  import { hoverCard, hoverCardPositioner, hoverCardContent, hoverCardTrigger } from "./variants.js";

  export type HoverCardProps = ComponentProps<typeof PreviewCardRoot>;
</script>

<script lang="ts">
  let {
    defaultOpen = false,
    closeDelay = 300,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    disableHoverableContent = false,
    openDelay = 600,
    "class": className,
    open = $bindable(),
    onOpenChange,
    children,
    "open": commandOpen,
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
  bind:open={() => commandOpen, (next) => { open = next; }}
>

</PreviewCardRoot>
