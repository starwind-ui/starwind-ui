<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectScrollDownArrow } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectScrollDownButtonProps = Omit<ComponentProps<typeof SelectScrollDownArrow>, "children"> & { children?: Snippet;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SelectScrollDownButtonProps = $props();
</script>

<SelectScrollDownArrow
  class={selectScrollButton({ "class": cx(className) })}
  {...rest}
  data-slot={"select-scroll-down-button"}
>
  {@render children?.()}
</SelectScrollDownArrow>
