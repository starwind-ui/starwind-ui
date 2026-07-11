import DropzonePrimitive from "@starwind-ui/react/dropzone";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";
import type * as React from "react";
import { dropzoneLoadingIndicator } from "./variants";

export type DropzoneLoadingIndicatorProps = React.ComponentPropsWithoutRef<"div"> & {
  isUploading?: boolean;
};

function DropzoneLoadingIndicator(props: DropzoneLoadingIndicatorProps) {
  const { isUploading = false, className, children, ...rest } = props;

  return (
    <DropzonePrimitive.LoadingIndicator
      className={dropzoneLoadingIndicator({ class: className })}
      isUploading={isUploading}
      {...rest}
      data-slot="dropzone-loading-indicator"
    >
      {children ?? (
        <>
          <Loader2 className="mx-auto size-10 animate-spin" aria-hidden={true} />

          <p className="mt-1 text-sm">Uploading file(s)...</p>
        </>
      )}
    </DropzonePrimitive.LoadingIndicator>
  );
}

export default DropzoneLoadingIndicator;
