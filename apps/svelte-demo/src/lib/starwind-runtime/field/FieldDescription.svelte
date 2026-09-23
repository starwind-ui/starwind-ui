<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldDescription as PrimitivePart } from "@starwind-ui/svelte/field";
  import { FieldDescription } from "@starwind-ui/svelte/field";

  export type FieldDescriptionProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldDescriptionProps = $props();
</script>

<FieldDescription
  class={fieldDescription({ "class": cx(className) })}
  ref={ref}
  {...rest}
  data-slot={"field-description"}
>
  {@render children?.()}
</FieldDescription>
