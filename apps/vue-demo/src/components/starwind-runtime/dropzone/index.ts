import Dropzone from "./Dropzone.vue";
import DropzoneFilesList from "./DropzoneFilesList.vue";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.vue";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.vue";
import {
  dropzone,
  dropzoneFilesList,
  dropzoneLoadingIndicator,
  dropzoneUploadIndicator,
} from "./variants";

export type { DropzoneProps } from "./Dropzone.vue";
export type { DropzoneFilesListProps } from "./DropzoneFilesList.vue";
export type { DropzoneLoadingIndicatorProps } from "./DropzoneLoadingIndicator.vue";
export type { DropzoneUploadIndicatorProps } from "./DropzoneUploadIndicator.vue";

const DropzoneVariants = {
  dropzone,
  dropzoneFilesList,
  dropzoneLoadingIndicator,
  dropzoneUploadIndicator,
};

export {
  Dropzone,
  DropzoneFilesList,
  DropzoneLoadingIndicator,
  DropzoneUploadIndicator,
  DropzoneVariants,
};

export default {
  Root: Dropzone,
  FilesList: DropzoneFilesList,
  LoadingIndicator: DropzoneLoadingIndicator,
  UploadIndicator: DropzoneUploadIndicator,
};
