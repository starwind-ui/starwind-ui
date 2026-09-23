<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxSeparator } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxSeparatorProps = Omit<ComponentProps<typeof ComboboxSeparator>, "children"> & { children?: Snippet;    };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ComboboxSeparatorProps = $props();
</script>

<ComboboxSeparator
  class={comboboxSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"combobox-separator"}
>

</ComboboxSeparator>
