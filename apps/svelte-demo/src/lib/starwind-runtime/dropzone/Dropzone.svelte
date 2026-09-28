<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { DropzoneRoot as PrimitivePart, DropzoneInput as NativeInput } from "@starwind-ui/svelte/dropzone";
  import { dropzone, dropzoneFilesList, dropzoneLoadingIndicator, dropzoneUploadIndicator } from "./variants.js";
  import { DropzoneRoot } from "@starwind-ui/svelte/dropzone";
  import { default as DropzoneUploadIndicator } from "./DropzoneUploadIndicator.svelte";
  import { default as DropzoneLoadingIndicator } from "./DropzoneLoadingIndicator.svelte";
  import { default as DropzoneFilesList } from "./DropzoneFilesList.svelte";
  import { DropzoneInput } from "@starwind-ui/svelte/dropzone";

  export type DropzoneProps = Omit<ComponentProps<typeof NativeInput>, "ref" | "id"> & Pick<ComponentProps<typeof PrimitivePart>, "disabled" | "isUploading" | "onFilesChange" | "ref"> & { children?: Snippet; id?: string };
</script>

<script lang="ts">
  let {
    "id": id,
    "disabled": disabled = false,
    "isUploading": isUploading = false,
    "aria-invalid": ariaInvalid,
    "class": className,
    "ref": ref,
    "onFilesChange": onFilesChange,
    "children": children,
    ...rest
  }: DropzoneProps = $props();
</script>

<DropzoneRoot
  id={id}
  class={dropzone({ "class": cx(className) })}
  disabled={disabled}
  isUploading={isUploading}
  onFilesChange={onFilesChange}
  aria-invalid={ariaInvalid}
  ref={ref}
  data-slot={"dropzone"}
>
  {#if children}{@render children()}{:else}<DropzoneUploadIndicator
    isUploading={isUploading}
  />
  <DropzoneLoadingIndicator
    isUploading={isUploading}
  />
  <DropzoneFilesList/>{/if}
  <DropzoneInput
    disabled={disabled}
    aria-invalid={ariaInvalid}
    {...rest}
  />
</DropzoneRoot>
