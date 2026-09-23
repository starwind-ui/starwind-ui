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
    "autoComplete": autoComplete,
    "defaultOpen": defaultOpen = false,
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "form": form,
    "highlightItemOnHover": highlightItemOnHover = true,
    "modal": modal = true,
    "name": name,
    "readOnly": readOnly = false,
    "required": required = false,
    "class": className,
    open = $bindable(),
    value = $bindable(),
    "onOpenChange": onOpenChange,
    "onValueChange": onValueChange,
    "children": children,
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
  bind:open={open}
  bind:value={value}
>
  {@render children?.()}
</SelectRoot>
