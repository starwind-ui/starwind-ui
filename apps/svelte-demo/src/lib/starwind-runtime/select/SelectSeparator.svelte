<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectSeparator } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectSeparatorProps = Omit<ComponentProps<typeof SelectSeparator>, "children"> & { children?: Snippet;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SelectSeparatorProps = $props();
</script>

<SelectSeparator
  class={selectSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"select-separator"}
>

</SelectSeparator>
