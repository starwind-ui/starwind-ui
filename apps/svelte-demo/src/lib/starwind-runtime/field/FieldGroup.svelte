<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";

  export type FieldGroupProps = Omit<Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void; "data-slot"?: string }, "size"> & VariantProps<typeof fieldGroup>;
</script>

<script lang="ts">
  let {
    "variant": variant = "default",
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldGroupProps = $props();

    let attachNativeCallback = $derived(ref);
    const attachNative: Attachment<HTMLDivElement> = (element) => {
      const callback = attachNativeCallback;
      untrack(() => callback?.(element));
      return () => untrack(() => callback?.(null));
    };
</script>

<div
  class={fieldGroup({ "variant": variant, "class": cx(className) })}
  data-variant={variant}
  {...rest}
  data-slot={"field-group"}
  {@attach attachNative}
>
  {@render children?.()}
</div>
