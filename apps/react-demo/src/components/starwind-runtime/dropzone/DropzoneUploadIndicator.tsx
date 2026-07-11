import DropzonePrimitive from "@starwind-ui/react/dropzone";
import { IconCloudUpload as CloudUpload } from "@tabler/icons-react";
import type * as React from "react";
import { dropzoneUploadIndicator } from "./variants";

export type DropzoneUploadIndicatorProps = React.ComponentPropsWithoutRef<"div"> & {
  isUploading?: boolean;
};

function DropzoneUploadIndicator(props: DropzoneUploadIndicatorProps) {
  const { isUploading = false, className, children, ...rest } = props;

  return (
    <DropzonePrimitive.UploadIndicator
      className={dropzoneUploadIndicator({ class: className })}
      isUploading={isUploading}
      {...rest}
      data-slot="dropzone-upload-indicator"
    >
      {children ?? (
        <>
          <CloudUpload className="mx-auto size-10" aria-hidden={true} />

          <p className="mt-1 text-sm">Click to upload or drag and drop</p>
        </>
      )}
    </DropzonePrimitive.UploadIndicator>
  );
}

export default DropzoneUploadIndicator;
