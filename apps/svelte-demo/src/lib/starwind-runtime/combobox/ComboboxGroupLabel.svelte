<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxGroupLabel } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxGroupLabelProps = Omit<ComponentProps<typeof ComboboxGroupLabel>, "children"> & { children?: Snippet;    };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ComboboxGroupLabelProps = $props();
</script>

<ComboboxGroupLabel
  class={comboboxGroupLabel({ "class": cx(className) })}
  {...rest}
  data-slot={"combobox-group-label"}
>
  {@render children?.()}
</ComboboxGroupLabel>
