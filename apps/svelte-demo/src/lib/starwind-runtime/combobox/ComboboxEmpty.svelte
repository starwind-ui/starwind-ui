<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxEmpty } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxEmptyProps = Omit<ComponentProps<typeof ComboboxEmpty>, "children"> & { children?: Snippet;    };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ComboboxEmptyProps = $props();
</script>

<ComboboxEmpty
  class={comboboxEmpty({ "class": cx(className) })}
  {...rest}
  data-slot={"combobox-empty"}
>
  {@render children?.()}
</ComboboxEmpty>
