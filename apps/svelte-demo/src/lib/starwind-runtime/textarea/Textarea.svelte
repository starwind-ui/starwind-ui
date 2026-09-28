<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { textarea } from "./variants.js";

  export type TextareaProps = Omit<SvelteHTMLElements["textarea"], "children" | "value" | "defaultValue" | "defaultvalue"> & VariantProps<typeof textarea> & { value?: string | null; defaultValue?: string | null; defaultvalue?: string | null; } & { ref?: HTMLTextAreaElement;  };
</script>

<script lang="ts">
  let {
    "size": size,
    "data-slot": dataSlot = "textarea",
    "class": className,
    value = $bindable(),
    ref = $bindable(),
    ...rest
  }: TextareaProps = $props();

  let nativeProps = $derived.by(() => {
    const props = { ...rest };
    for (const key of ["children","value"]) delete (props as Record<string, unknown>)[key];
    return props;
  });
</script>

<textarea
  data-sw-textarea
  class={textarea({ "size": size, "class": cx(className) })}
  data-slot={dataSlot}
  {...nativeProps}
  bind:value={value}
  bind:this={ref}
></textarea>
