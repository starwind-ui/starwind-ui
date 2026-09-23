<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { field, fieldContent, fieldControl, fieldDescription, fieldError, fieldGroup, fieldItem, fieldLabel, fieldLegend, fieldSeparator, fieldSeparatorContent, fieldSet, fieldTitle, fieldValidity } from "./variants.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { Separator } from "../separator/index.js";

  export type FieldSeparatorProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void; "data-slot"?: string };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "ref": ref,
    ...rest
  }: FieldSeparatorProps = $props();

    let attachNativeCallback = $derived(ref);
    const attachNative: Attachment<HTMLDivElement> = (element) => {
      const callback = attachNativeCallback;
      untrack(() => callback?.(element));
      return () => untrack(() => callback?.(null));
    };

  let hasContent = $derived(Boolean(children));
</script>

<div
  class={fieldSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"field-separator"}
  data-content={hasContent ? "true" : "false"}
  {@attach attachNative}
>
  <Separator
    class={"absolute inset-0 top-1/2"}
  />
  {#if hasContent}
    <span
      class={fieldSeparatorContent({  })}
      data-slot={"field-separator-content"}
    >
      {@render children?.()}
    </span>
  {/if}
</div>
