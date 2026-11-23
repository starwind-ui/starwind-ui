<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldRoot as PrimitivePart } from "@starwind-ui/svelte/field";
  import { FieldRoot } from "@starwind-ui/svelte/field";

  export type FieldProps = Omit<ComponentProps<typeof PrimitivePart>, "size"> & VariantProps<typeof field>;
</script>

<script lang="ts">
  let {
    dirty,
    disabled = false,
    errorVisibility,
    invalid,
    name,
    orientation,
    revalidationTiming,
    touched,
    validationTiming,
    "class": className,
    children,
    ref,
    ...rest
  }: FieldProps = $props();
</script>

<FieldRoot
  class={field({ "orientation": orientation, "class": cx(className) })}
  dirty={dirty}
  disabled={disabled}
  errorVisibility={errorVisibility}
  invalid={invalid}
  name={name}
  revalidationTiming={revalidationTiming}
  touched={touched}
  validationTiming={validationTiming}
  ref={ref}
  {...rest}
  data-slot={"field"}
>
  {@render children?.()}
</FieldRoot>
