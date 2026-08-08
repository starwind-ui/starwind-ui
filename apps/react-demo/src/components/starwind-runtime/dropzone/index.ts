"use client";

import Dropzone from "./Dropzone";
import DropzoneFilesList from "./DropzoneFilesList";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator";
import {
  dropzone,
  dropzoneFilesList,
  dropzoneLoadingIndicator,
  dropzoneUploadIndicator,
} from "./variants";

const DropzoneVariants = {
  dropzone,
  dropzoneFilesList,
  dropzoneLoadingIndicator,
  dropzoneUploadIndicator,
};

const DropzoneParts = {
  Root: Dropzone,
  FilesList: DropzoneFilesList,
  LoadingIndicator: DropzoneLoadingIndicator,
  UploadIndicator: DropzoneUploadIndicator,
};

export {
  Dropzone,
  DropzoneFilesList,
  DropzoneLoadingIndicator,
  DropzoneUploadIndicator,
  DropzoneVariants,
};

export default DropzoneParts;
