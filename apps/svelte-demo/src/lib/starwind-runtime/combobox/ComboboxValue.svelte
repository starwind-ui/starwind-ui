<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxValue } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxValueProps = Omit<ComponentProps<typeof ComboboxValue>, "children"> & { children?: Snippet;   placeholder?: string; };
</script>

<script lang="ts">
  let {
    "class": className,
    "placeholder": placeholder,
    "children": children,
    ...rest
  }: ComboboxValueProps = $props();
</script>

<ComboboxValue
  class={comboboxValue({ "class": cx(className) })}
  placeholder={placeholder}
  {...rest}
  data-slot={"combobox-value"}
  children={children}
>

</ComboboxValue>
