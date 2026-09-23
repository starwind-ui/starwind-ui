<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectValue } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectValueProps = Omit<ComponentProps<typeof SelectValue>, "children"> & { children?: ComponentProps<typeof SelectValue>["children"];  placeholder?: string; };
</script>

<script lang="ts">
  let {
    "class": className,
    "placeholder": placeholder,
    "children": children,
    ...rest
  }: SelectValueProps = $props();
</script>

<SelectValue
  class={selectValue({ "class": cx(className) })}
  placeholder={placeholder}
  {...rest}
  data-slot={"select-value"}
  children={children}
>

</SelectValue>
