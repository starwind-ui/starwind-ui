import Dropzone from "./Dropzone.astro";
import DropzoneFilesList from "./DropzoneFilesList.astro";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.astro";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.astro";
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
