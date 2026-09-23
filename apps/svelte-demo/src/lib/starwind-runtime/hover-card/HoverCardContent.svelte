<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PreviewCardPopup } from "@starwind-ui/svelte/preview-card";
  import { cx } from "tailwind-variants";
  import { hoverCard, hoverCardPositioner, hoverCardContent, hoverCardTrigger } from "./variants.js";
  import { PreviewCardPortal } from "@starwind-ui/svelte/preview-card";
  import { PreviewCardPositioner } from "@starwind-ui/svelte/preview-card";

  export type HoverCardContentProps = ComponentProps<typeof PreviewCardPopup> & { positionerClass?: string; portalContainer?: string; disablePortal?: boolean; };
</script>

<script lang="ts">
  let {
    "class": className,
    "side": side = "bottom",
    "align": align = "center",
    "sideOffset": sideOffset = 4,
    "avoidCollisions": avoidCollisions = true,
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "positionerClass": positionerClass,
    "children": children,
    ...rest
  }: HoverCardContentProps = $props();
</script>

<PreviewCardPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"hover-card-portal"}
>
  <PreviewCardPositioner
    side={side}
    align={align}
    sideOffset={sideOffset}
    avoidCollisions={avoidCollisions}
    class={hoverCardPositioner({ "class": cx(positionerClass) })}
    data-slot={"hover-card-positioner"}
  >
    <PreviewCardPopup
      class={hoverCardContent({ "class": cx(className) })}
      side={side}
      align={align}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      {...rest}
      data-slot={"hover-card-content"}
    >
      {@render children?.()}
    </PreviewCardPopup>
  </PreviewCardPositioner>
</PreviewCardPortal>
