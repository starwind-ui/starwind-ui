<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectItemIndicator } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectItemIndicatorProps = Omit<ComponentProps<typeof SelectItemIndicator>, "children"> & { children?: Snippet;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SelectItemIndicatorProps = $props();
</script>

<SelectItemIndicator
  class={selectItemIndicator({ "class": cx(className) })}
  {...rest}
  data-slot={"select-item-indicator"}
>
  {@render children?.()}
</SelectItemIndicator>
