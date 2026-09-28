<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { DropzoneUploadIndicator as PrimitivePart } from "@starwind-ui/svelte/dropzone";
  import { dropzone, dropzoneFilesList, dropzoneLoadingIndicator, dropzoneUploadIndicator } from "./variants.js";
  import { DropzoneUploadIndicator } from "@starwind-ui/svelte/dropzone";

  export type DropzoneUploadIndicatorProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "isUploading": isUploading = false,
    "class": className,
    "children": children,
    ...rest
  }: DropzoneUploadIndicatorProps = $props();
</script>

<DropzoneUploadIndicator
  class={dropzoneUploadIndicator({ "class": cx(className) })}
  isUploading={isUploading}
  {...rest}
  data-slot={"dropzone-upload-indicator"}
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
    class={"mx-auto size-10"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M7 18a4.6 4.4 0 0 1 0 -9c.26 -3.008 2.42 -4.508 5 -4.508c2.58 0 4.74 1.5 5 4.508h.5a3.5 3.5 0 0 1 0 7h-.5"}
    />
    <path
      d={"M9 15l3 -3l3 3"}
    />
    <path
      d={"M12 12l0 9"}
    />
  </svg>
  <p
    class={"mt-1 text-sm"}
  >
    Click to upload or drag and drop
  </p>{/if}
</DropzoneUploadIndicator>
