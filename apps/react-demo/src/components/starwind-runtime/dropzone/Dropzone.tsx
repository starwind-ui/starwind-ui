import DropzonePrimitive from "@starwind-ui/react/dropzone";
import type * as React from "react";
import DropzoneFilesList from "./DropzoneFilesList";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator";
import { dropzone } from "./variants";

export type DropzoneProps = Omit<React.ComponentPropsWithoutRef<"input">, "disabled" | "type"> & {
  disabled?: boolean;
  isUploading?: boolean;
  children?: React.ReactNode;
  onFilesChange?: (
    files: File[],
    details: import("@starwind-ui/react/dropzone").DropzoneFilesChangeDetails,
  ) => void;
  ref?: React.Ref<HTMLLabelElement>;
};

function Dropzone(props: DropzoneProps) {
  const {
    id,
    disabled = false,
    isUploading = false,
    onFilesChange,
    ref,
    "aria-invalid": ariaInvalid,
    className,
    children,
    ...rest
  } = props;

  return (
    <DropzonePrimitive.Root
      id={id}
      className={dropzone({ class: className })}
      disabled={disabled}
      isUploading={isUploading}
      onFilesChange={onFilesChange}
      aria-invalid={ariaInvalid}
      ref={ref}
      data-slot="dropzone"
    >
      {children ?? (
        <>
          <DropzoneUploadIndicator isUploading={isUploading} />

          <DropzoneLoadingIndicator isUploading={isUploading} />

          <DropzoneFilesList />
        </>
      )}

      <DropzonePrimitive.Input disabled={disabled} aria-invalid={ariaInvalid} {...rest} />
    </DropzonePrimitive.Root>
  );
}

export default Dropzone;
