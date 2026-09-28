<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CollapsibleTrigger as PrimitivePart } from "@starwind-ui/svelte/collapsible";
  import type { ButtonChildProps, ButtonChildPayload } from "@starwind-ui/svelte/collapsible";
  import { cx } from "tailwind-variants";
  import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants.js";
  import { CollapsibleTrigger } from "@starwind-ui/svelte/collapsible";

  export type CollapsibleTriggerProps = ComponentProps<typeof PrimitivePart>;
  export type { ButtonChildProps, ButtonChildPayload };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "child": child,
    ...rest
  }: CollapsibleTriggerProps = $props();
</script>

<CollapsibleTrigger
  class={collapsibleTrigger({ "class": cx(className) })}
  child={child}
  {...rest}
  data-slot={"collapsible-trigger"}
>
  {@render children?.()}
</CollapsibleTrigger>
