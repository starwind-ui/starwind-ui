<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldValidity as PrimitivePart } from "@starwind-ui/svelte/field";
  import { FieldValidity } from "@starwind-ui/svelte/field";

  export type FieldValidityProps = Omit<ComponentProps<typeof PrimitivePart>, "size"> & VariantProps<typeof fieldValidity>;
</script>

<script lang="ts">
  let {
    "match": match,
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldValidityProps = $props();
</script>

<FieldValidity
  class={fieldValidity({ "class": cx(className) })}
  match={match}
  ref={ref}
  {...rest}
  data-slot={"field-validity"}
>
  {@render children?.()}
</FieldValidity>
