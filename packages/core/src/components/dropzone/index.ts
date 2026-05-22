import Dropzone from "./Dropzone.astro";
import DropzoneFilesList from "./DropzoneFilesList.astro";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.astro";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.astro";
import { dropzone, dropzoneFilesList } from "./variants";

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
