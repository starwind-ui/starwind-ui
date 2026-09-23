import Dropzone from "./Dropzone.svelte";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.svelte";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.svelte";
import DropzoneFilesList from "./DropzoneFilesList.svelte";
import {
  dropzone,
  dropzoneFilesList,
  dropzoneLoadingIndicator,
  dropzoneUploadIndicator,
} from "./variants.js";
export type { DropzoneProps } from "./Dropzone.svelte";
export type { DropzoneUploadIndicatorProps } from "./DropzoneUploadIndicator.svelte";
export type { DropzoneLoadingIndicatorProps } from "./DropzoneLoadingIndicator.svelte";
export type { DropzoneFilesListProps } from "./DropzoneFilesList.svelte";
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
