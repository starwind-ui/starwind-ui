<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { FormErrorSummary as PrimitivePart } from "@starwind-ui/svelte/form";
  import { cx } from "tailwind-variants";
  import { form, formErrorSummary } from "./variants.js";
  import { FormErrorSummary } from "@starwind-ui/svelte/form";

  export type FormErrorSummaryProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FormErrorSummaryProps = $props();
</script>

<FormErrorSummary
  class={formErrorSummary({ "class": cx(className) })}
  ref={ref}
  {...rest}
  data-slot={"form-error-summary"}
>
  {@render children?.()}
</FormErrorSummary>
