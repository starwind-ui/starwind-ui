<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { FormRoot as PrimitivePart } from "@starwind-ui/svelte/form";
  import { cx } from "tailwind-variants";
  import { form, formErrorSummary } from "./variants.js";
  import { FormRoot } from "@starwind-ui/svelte/form";

  export type FormProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "options": options,
    "errors": errors,
    "errorOptions": errorOptions,
    "errorVisibility": errorVisibility,
    "revalidationTiming": revalidationTiming,
    "validationTiming": validationTiming,
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FormProps = $props();
</script>

<FormRoot
  options={options}
  errors={errors}
  errorOptions={errorOptions}
  class={form({ "class": cx(className) })}
  errorVisibility={errorVisibility}
  ref={ref}
  revalidationTiming={revalidationTiming}
  validationTiming={validationTiming}
  {...rest}
  data-slot={"form"}
>
  {@render children?.()}
</FormRoot>
