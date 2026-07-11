import DropzonePrimitive from "@starwind-ui/react/dropzone";
import type * as React from "react";
import { dropzoneFilesList } from "./variants";

export type DropzoneFilesListProps = React.ComponentPropsWithoutRef<"div">;

function DropzoneFilesList(props: DropzoneFilesListProps) {
  const { className, ...rest } = props;

  return (
    <DropzonePrimitive.FilesList
      className={dropzoneFilesList({ class: className })}
      aria-live="polite"
      aria-label="Uploaded files"
      {...rest}
      data-slot="dropzone-files-list"
    />
  );
}

export default DropzoneFilesList;
