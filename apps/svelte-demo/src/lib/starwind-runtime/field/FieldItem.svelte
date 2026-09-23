<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldItem as PrimitivePart } from "@starwind-ui/svelte/field";
  import { FieldItem } from "@starwind-ui/svelte/field";

  export type FieldItemProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldItemProps = $props();
</script>

<FieldItem
  class={fieldItem({ "class": cx(className) })}
  ref={ref}
  {...rest}
  data-slot={"field-item"}
>
  {@render children?.()}
</FieldItem>
