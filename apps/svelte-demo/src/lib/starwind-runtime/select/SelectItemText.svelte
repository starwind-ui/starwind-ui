<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectItemText } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectItemTextProps = Omit<ComponentProps<typeof SelectItemText>, "children"> & { children?: Snippet;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SelectItemTextProps = $props();
</script>

<SelectItemText
  class={selectItemText({ "class": cx(className) })}
  {...rest}
  data-slot={"select-item-text"}
>
  {@render children?.()}
</SelectItemText>
