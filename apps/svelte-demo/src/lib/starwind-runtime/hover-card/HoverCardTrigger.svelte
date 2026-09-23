<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PreviewCardTrigger } from "@starwind-ui/svelte/preview-card";
  import { cx } from "tailwind-variants";
  import { hoverCard, hoverCardPositioner, hoverCardContent, hoverCardTrigger } from "./variants.js";

  export type { AnchorChildProps, AnchorChildPayload } from "@starwind-ui/svelte/preview-card";
  export type HoverCardTriggerProps = ComponentProps<typeof PreviewCardTrigger>;
</script>

<script lang="ts">
  let {
    "closeDelay": closeDelay,
    "disabled": disabled = false,
    "openDelay": openDelay,
    "class": className,
    "child": child,
    "children": children,
    ...rest
  }: HoverCardTriggerProps = $props();

  let triggerBaseClassName = $derived(hoverCardTrigger({ "class": cx(className) }));

  let triggerClassName = $derived(child ? className : triggerBaseClassName);
</script>

<PreviewCardTrigger
  class={triggerClassName}
  closeDelay={closeDelay}
  disabled={disabled}
  openDelay={openDelay}
  {...rest}
  data-slot={"hover-card-trigger"}
  child={child}
>
  {@render children?.()}
</PreviewCardTrigger>
