<script module lang="ts">
  import type { SeparatorProps } from "../separator/index.js";
  import { cx } from "tailwind-variants";
  import { itemSeparator } from "./variants.js";
  import { Separator } from "../separator/index.js";

  export type ItemSeparatorProps = SeparatorProps;
</script>

<script lang="ts">
  let {
    "orientation": orientation = "horizontal",
    "class": className,
    ...rest
  }: ItemSeparatorProps = $props();
</script>

<Separator
  orientation={orientation}
  class={itemSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"item-separator"}
/>
