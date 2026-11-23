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
    autoComplete,
    defaultInputValue,
    defaultOpen = false,
    defaultValue,
    disabled = false,
    filterMode = "contains",
    form,
    highlightItemOnHover = true,
    locale,
    modal = false,
    name,
    readOnly = false,
    required = false,
    "class": className,
    inputValue = $bindable(),
    open = $bindable(),
    value = $bindable(),
    onInputValueChange,
    onOpenChange,
    onValueChange,
    children,
    "inputValue": commandInputValue,
    "open": commandOpen,
    "value": commandValue,
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
  bind:inputValue={() => commandInputValue, (next) => { inputValue = next; }}
  bind:open={() => commandOpen, (next) => { open = next; }}
  bind:value={() => commandValue, (next) => { value = next; }}
>
  {@render children?.()}
</ComboboxRoot>
