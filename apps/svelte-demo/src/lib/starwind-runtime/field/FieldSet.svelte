<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldsetRoot as PrimitivePart } from "@starwind-ui/svelte/fieldset";
  import { FieldsetRoot } from "@starwind-ui/svelte/fieldset";

  export type FieldSetProps = Omit<ComponentProps<typeof PrimitivePart>, "size"> & VariantProps<typeof fieldSet>;
</script>

<script lang="ts">
  let {
    "disabled": disabled = false,
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldSetProps = $props();
</script>

<FieldsetRoot
  class={fieldSet({ "class": cx(className) })}
  disabled={disabled}
  ref={ref}
  {...rest}
  data-slot={"field-set"}
>
  {@render children?.()}
</FieldsetRoot>
