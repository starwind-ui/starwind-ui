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
