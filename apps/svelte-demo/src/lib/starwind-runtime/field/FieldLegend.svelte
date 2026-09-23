<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldsetLegend as PrimitivePart } from "@starwind-ui/svelte/fieldset";
  import { FieldsetLegend } from "@starwind-ui/svelte/fieldset";

  export type FieldLegendProps = Omit<ComponentProps<typeof PrimitivePart>, "size"> & VariantProps<typeof fieldLegend>;
</script>

<script lang="ts">
  let {
    "variant": variant,
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldLegendProps = $props();
</script>

<FieldsetLegend
  class={fieldLegend({ "variant": variant, "class": cx(className) })}
  ref={ref}
  {...rest}
  data-slot={"field-legend"}
>
  {@render children?.()}
</FieldsetLegend>
