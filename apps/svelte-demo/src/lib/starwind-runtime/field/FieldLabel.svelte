<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldLabel as PrimitivePart } from "@starwind-ui/svelte/field";
  import { FieldLabel } from "@starwind-ui/svelte/field";

  export type FieldLabelProps = Omit<ComponentProps<typeof PrimitivePart>, "size"> & VariantProps<typeof fieldLabel>;
</script>

<script lang="ts">
  let {
    "size": size,
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldLabelProps = $props();
</script>

<FieldLabel
  class={fieldLabel({ "size": size, "class": cx(className) })}
  ref={ref}
  {...rest}
  data-slot={"field-label"}
>
  {@render children?.()}
</FieldLabel>
