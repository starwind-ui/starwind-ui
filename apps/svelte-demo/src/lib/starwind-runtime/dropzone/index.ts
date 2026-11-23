import Dropzone from "./Dropzone.svelte";
import DropzoneFilesList from "./DropzoneFilesList.svelte";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.svelte";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.svelte";
import {
  dropzone,
  dropzoneFilesList,
  dropzoneLoadingIndicator,
  dropzoneUploadIndicator,
} from "./variants.js";

export type { DropzoneProps } from "./Dropzone.svelte";
export type { DropzoneFilesListProps } from "./DropzoneFilesList.svelte";
export type { DropzoneLoadingIndicatorProps } from "./DropzoneLoadingIndicator.svelte";
export type { DropzoneUploadIndicatorProps } from "./DropzoneUploadIndicator.svelte";

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
