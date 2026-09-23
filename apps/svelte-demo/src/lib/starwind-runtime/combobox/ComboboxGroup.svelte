<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxGroup } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxGroupProps = Omit<ComponentProps<typeof ComboboxGroup>, "children"> & { children?: Snippet;    };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ComboboxGroupProps = $props();
</script>

<ComboboxGroup
  class={comboboxGroup({ "class": cx(className) })}
  {...rest}
  data-slot={"combobox-group"}
>
  {@render children?.()}
</ComboboxGroup>
