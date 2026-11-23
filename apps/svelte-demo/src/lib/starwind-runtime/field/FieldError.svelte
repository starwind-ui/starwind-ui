<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import { FieldError as PrimitivePart } from "@starwind-ui/svelte/field";
  import { FieldError } from "@starwind-ui/svelte/field";

  export type FieldErrorProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    match,
    messageSource,
    "class": className,
    children,
    ref,
    ...rest
  }: FieldErrorProps = $props();
</script>

<FieldError
  class={fieldError({ "class": cx(className) })}
  match={match}
  messageSource={messageSource}
  ref={ref}
  {...rest}
  data-slot={"field-error"}
>
  {@render children?.()}
</FieldError>
