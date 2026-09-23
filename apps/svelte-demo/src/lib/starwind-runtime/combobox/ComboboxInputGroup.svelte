<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxInputGroup } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";
  import { InputGroup } from "../input-group/index.js";

  export type ComboboxInputGroupProps = Omit<ComponentProps<typeof ComboboxInputGroup>, "children" | "ref"> & VariantProps<typeof comboboxInputGroup> & { children?: Snippet; ref?: HTMLDivElement;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "size": size = "md",
    ref = $bindable(),
    "children": children,
    ...rest
  }: ComboboxInputGroupProps = $props();
</script>

<InputGroup
  class={comboboxInputGroup({ "size": size, "class": cx(className) })}
  {...rest}
  data-size={size}
  data-sw-combobox-input-group={""}
  data-slot={"combobox-input-group"}
  bind:ref={ref}
>
  {@render children?.()}
</InputGroup>
