<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { DropzoneLoadingIndicator as PrimitivePart } from "@starwind-ui/svelte/dropzone";
  import { dropzone, dropzoneFilesList, dropzoneLoadingIndicator, dropzoneUploadIndicator } from "./variants.js";
  import { DropzoneLoadingIndicator } from "@starwind-ui/svelte/dropzone";

  export type DropzoneLoadingIndicatorProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "isUploading": isUploading = false,
    "class": className,
    "children": children,
    ...rest
  }: DropzoneLoadingIndicatorProps = $props();
</script>

<DropzoneLoadingIndicator
  class={dropzoneLoadingIndicator({ "class": cx(className) })}
  isUploading={isUploading}
  {...rest}
  data-slot={"dropzone-loading-indicator"}
>
  {#if children}{@render children()}{:else}<svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
    class={"mx-auto size-10 animate-spin"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M12 3a9 9 0 1 0 9 9"}
    />
  </svg>
  <p
    class={"mt-1 text-sm"}
  >
    Uploading file(s)...
  </p>{/if}
</DropzoneLoadingIndicator>
