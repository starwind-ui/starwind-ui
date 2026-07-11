import { useState } from "react";
import {
  Dropzone,
  DropzoneFilesList,
  DropzoneLoadingIndicator,
  DropzoneUploadIndicator,
} from "../kit";

export function DropzoneDemo() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <section className="space-y-4" id="react-runtime-dropzone-demo">
      <h2 className="font-heading text-xl font-semibold">Dropzone</h2>
      <div className="grid gap-6">
        <form
          className="grid gap-6"
          data-runtime-dropzone-form
          onSubmit={(event) => event.preventDefault()}
        >
          <Dropzone id="react-runtime-dropzone-default" name="react-runtime-dropzone-default" />

          <Dropzone
            id="react-runtime-dropzone-multiple"
            name="react-runtime-dropzone-multiple"
            multiple
            onFilesChange={(files) => {
              setSelectedFiles(files.map((file) => file.name));
            }}
          >
            <DropzoneUploadIndicator>
              <span className="my-6 text-lg">Upload product media</span>
            </DropzoneUploadIndicator>
            <DropzoneLoadingIndicator />
            <DropzoneFilesList />
          </Dropzone>
        </form>

        <p className="text-muted-foreground text-sm" data-runtime-dropzone-files>
          Selected files: {selectedFiles.length > 0 ? selectedFiles.join(", ") : "None"}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <Dropzone
            id="react-runtime-dropzone-uploading"
            name="react-runtime-dropzone-uploading"
            isUploading
          />
          <Dropzone
            id="react-runtime-dropzone-disabled"
            name="react-runtime-dropzone-disabled"
            disabled
          />
        </div>
      </div>
    </section>
  );
}
