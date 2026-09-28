<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxItemIndicator } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxItemIndicatorProps = Omit<ComponentProps<typeof ComboboxItemIndicator>, "children"> & { children?: Snippet;    };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ComboboxItemIndicatorProps = $props();
</script>

<ComboboxItemIndicator
  class={comboboxItemIndicator({ "class": cx(className) })}
  {...rest}
  data-slot={"combobox-item-indicator"}
>
  {@render children?.()}
</ComboboxItemIndicator>
