<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { cx } from "tailwind-variants";
  import { buttonGroupSeparator } from "./variants.js";
  import { Separator } from "../separator/index.js";

  export type ButtonGroupSeparatorProps = ComponentProps<typeof Separator>;
</script>

<script lang="ts">
  let {
    "orientation": orientation = "vertical",
    "class": className,
    "ref": ref,
    ...rest
  }: ButtonGroupSeparatorProps = $props();

  let ownerRef = $derived(ref);
</script>

<Separator
  orientation={orientation}
  class={buttonGroupSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"button-group-separator"}
  ref={ownerRef}
/>
