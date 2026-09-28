<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";

  export type FieldTitleProps = Omit<Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void; "data-slot"?: string }, "size"> & VariantProps<typeof fieldTitle>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldTitleProps = $props();

    let attachNativeCallback = $derived(ref);
    const attachNative: Attachment<HTMLDivElement> = (element) => {
      const callback = attachNativeCallback;
      untrack(() => callback?.(element));
      return () => untrack(() => callback?.(null));
    };
</script>

<div
  class={fieldTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"field-title"}
  {@attach attachNative}
>
  {@render children?.()}
</div>
