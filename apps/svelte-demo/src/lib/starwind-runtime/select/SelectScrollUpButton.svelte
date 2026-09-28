<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectScrollUpArrow } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectScrollUpButtonProps = Omit<ComponentProps<typeof SelectScrollUpArrow>, "children"> & { children?: Snippet;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SelectScrollUpButtonProps = $props();
</script>

<SelectScrollUpArrow
  class={selectScrollButton({ "class": cx(className) })}
  {...rest}
  data-slot={"select-scroll-up-button"}
>
  {@render children?.()}
</SelectScrollUpArrow>
