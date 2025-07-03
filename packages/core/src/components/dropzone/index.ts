import Dropzone from "./Dropzone.astro";
import DropzoneFilesList from "./DropzoneFilesList.astro";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.astro";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.astro";

export { Dropzone, DropzoneFilesList, DropzoneLoadingIndicator, DropzoneUploadIndicator };

export default {
  Root: Dropzone,
  FilesList: DropzoneFilesList,
  UploadIndicator: DropzoneUploadIndicator,
  LoadingIndicator: DropzoneLoadingIndicator,
};
