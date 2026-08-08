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
