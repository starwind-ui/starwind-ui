import Dropzone, { dropzone } from "./Dropzone.astro";
import DropzoneFilesList, { dropzoneFilesList } from "./DropzoneFilesList.astro";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.astro";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.astro";

const DropzoneVariants = {
  dropzone,
  dropzoneFilesList,
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
  UploadIndicator: DropzoneUploadIndicator,
  LoadingIndicator: DropzoneLoadingIndicator,
};
