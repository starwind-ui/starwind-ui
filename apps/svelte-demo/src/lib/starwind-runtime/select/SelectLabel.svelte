<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectGroupLabel } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectLabelProps = Omit<ComponentProps<typeof SelectGroupLabel>, "children"> & { children?: Snippet;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SelectLabelProps = $props();
</script>

<SelectGroupLabel
  class={selectLabel({ "class": cx(className) })}
  {...rest}
  data-slot={"select-label"}
>
  {@render children?.()}
</SelectGroupLabel>
