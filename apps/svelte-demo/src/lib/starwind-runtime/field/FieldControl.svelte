<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { untrack } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { FieldControl as PrimitivePart } from "@starwind-ui/svelte/field";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldControl } from "@starwind-ui/svelte/field";

  export type FieldControlProps = Omit<ComponentProps<typeof PrimitivePart>, "size"> & VariantProps<typeof fieldControl>;
</script>

<script lang="ts">
  let {
    "size": size,
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "class": className,
    value = $bindable(),
    "value": commandValue,
    "onValueChange": onValueChange,
    "ref": ref,
    ...rest
  }: FieldControlProps = $props();

  // Keep incoming commands observable after the bindable model publishes locally.
  const copyCommand = (next: FieldControlProps["value"]) => Array.isArray(next) ? [...next] : next;
  let observedCommand = untrack(() => copyCommand(commandValue));
  $effect(() => {
    const next = copyCommand(commandValue);
    untrack(() => {
      const previous = observedCommand;
      if (Array.isArray(next) && Array.isArray(previous) ? next.length === previous.length && next.every((entry, index) => entry === previous[index]) : Object.is(next, previous)) return;
      observedCommand = next;
      const current = value;
      if (Array.isArray(next) && Array.isArray(current) ? next.length === current.length && next.every((entry, index) => entry === current[index]) : Object.is(next, current)) return;
      value = next;
    });
  });
</script>

<FieldControl
  class={fieldControl({ "size": size, "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  onValueChange={onValueChange}
  ref={ref}
  {...rest}
  data-slot={"field-control"}
  bind:value={value}
/>
