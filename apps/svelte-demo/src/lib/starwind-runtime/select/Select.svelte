<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectRoot } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";

  export type SelectProps = Omit<ComponentProps<typeof SelectRoot>, "children"> & { children?: Snippet;  autoComplete?: string; defaultOpen?: boolean; defaultValue?: string | null; disabled?: boolean; form?: string; highlightItemOnHover?: boolean; modal?: boolean; name?: string; readOnly?: boolean; required?: boolean; };
</script>

<script lang="ts">
  let {
    autoComplete,
    defaultOpen = false,
    defaultValue,
    disabled = false,
    form,
    highlightItemOnHover = true,
    modal = true,
    name,
    readOnly = false,
    required = false,
    "class": className,
    open = $bindable(),
    value = $bindable(),
    onOpenChange,
    onValueChange,
    children,
    "open": commandOpen,
    "value": commandValue,
    ...rest
  }: SelectProps = $props();
</script>

<SelectRoot
  class={select({ "class": cx(className) })}
  autoComplete={autoComplete}
  defaultOpen={defaultOpen}
  defaultValue={defaultValue}
  disabled={disabled}
  form={form}
  highlightItemOnHover={highlightItemOnHover}
  modal={modal}
  name={name}
  readOnly={readOnly}
  required={required}
  onOpenChange={onOpenChange}
  onValueChange={onValueChange}
  {...rest}
  data-slot={"select"}
  bind:open={() => commandOpen, (next) => { open = next; }}
  bind:value={() => commandValue, (next) => { value = next; }}
>
  {@render children?.()}
</SelectRoot>
