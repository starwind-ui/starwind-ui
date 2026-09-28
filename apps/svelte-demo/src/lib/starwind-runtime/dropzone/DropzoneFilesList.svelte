<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { DropzoneFilesList as PrimitivePart } from "@starwind-ui/svelte/dropzone";
  import { dropzone, dropzoneFilesList, dropzoneLoadingIndicator, dropzoneUploadIndicator } from "./variants.js";
  import { DropzoneFilesList } from "@starwind-ui/svelte/dropzone";

  export type DropzoneFilesListProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    ...rest
  }: DropzoneFilesListProps = $props();
</script>

<DropzoneFilesList
  class={dropzoneFilesList({ "class": cx(className) })}
  aria-live={"polite"}
  aria-label={"Uploaded files"}
  {...rest}
  data-slot={"dropzone-files-list"}
>

</DropzoneFilesList>
