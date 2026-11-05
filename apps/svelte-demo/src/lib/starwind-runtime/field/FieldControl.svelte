<script module lang="ts">
  import type { ComponentProps } from "svelte";
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
</script>

<FieldControl
  class={fieldControl({ "size": size, "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  onValueChange={onValueChange}
  ref={ref}
  {...rest}
  data-slot={"field-control"}
  bind:value={() => commandValue, (next) => { value = next; }}
/>
