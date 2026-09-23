<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxRoot } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxProps = Omit<ComponentProps<typeof ComboboxRoot>, "children"> & { children?: Snippet;   autoComplete?: string; defaultInputValue?: string; defaultOpen?: boolean; defaultValue?: string | null; disabled?: boolean; filterMode?: "contains" | "startsWith"; form?: string; highlightItemOnHover?: boolean; locale?: string; modal?: boolean; name?: string; readOnly?: boolean; required?: boolean; };
</script>

<script lang="ts">
  let {
    "autoComplete": autoComplete,
    "defaultInputValue": defaultInputValue,
    "defaultOpen": defaultOpen = false,
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "filterMode": filterMode = "contains",
    "form": form,
    "highlightItemOnHover": highlightItemOnHover = true,
    "locale": locale,
    "modal": modal = false,
    "name": name,
    "readOnly": readOnly = false,
    "required": required = false,
    "class": className,
    inputValue = $bindable(),
    open = $bindable(),
    value = $bindable(),
    "onInputValueChange": onInputValueChange,
    "onOpenChange": onOpenChange,
    "onValueChange": onValueChange,
    "children": children,
    ...rest
  }: ComboboxProps = $props();
</script>

<ComboboxRoot
  class={combobox({ "class": cx(className) })}
  autoComplete={autoComplete}
  defaultInputValue={defaultInputValue}
  defaultOpen={defaultOpen}
  defaultValue={defaultValue}
  disabled={disabled}
  filterMode={filterMode}
  form={form}
  highlightItemOnHover={highlightItemOnHover}
  locale={locale}
  modal={modal}
  name={name}
  readOnly={readOnly}
  required={required}
  {...rest}
  data-slot={"combobox"}
  onInputValueChange={onInputValueChange}
  onOpenChange={onOpenChange}
  onValueChange={onValueChange}
  bind:inputValue={inputValue}
  bind:open={open}
  bind:value={value}
>
  {@render children?.()}
</ComboboxRoot>
