import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const createStyledDropzoneConsumer = (root: string) =>
  createStyledNativeConsumer(root, ["dropzone", "field", "separator", "form"]);

export const dropzoneImports = `import Dropzone, { Dropzone as StyledRoot, DropzoneFilesList, DropzoneLoadingIndicator, DropzoneUploadIndicator, DropzoneVariants, type DropzoneProps } from "./dropzone/index.js";
import Primitive, { Dropzone as Namespace, DropzoneRoot, DropzoneInput, DropzoneFilesList as FilesList, DropzoneLoadingIndicator as LoadingIndicator, DropzoneUploadIndicator as UploadIndicator, type DropzoneFilesChangeDetails } from "@starwind-ui/svelte/dropzone";
import { createDropzone, type DropzoneInstance, type DropzoneOptions, type DropzoneSetFilesOptions } from "@starwind-ui/runtime/dropzone";`;

export const dropzonePositive = `<script lang="ts">
${dropzoneImports}
import { createAttachmentKey } from "svelte/attachments";
const options: DropzoneOptions = { disabled: false, isUploading: false };
const filesOptions: DropzoneSetFilesOptions = { emit: false };
const props: DropzoneProps = { id: "upload", name: "files", form: "upload-form", accept: ".txt", multiple: true, required: true, isUploading: false,
 onFilesChange(files, detail) { const values: File[] = files; const notification: DropzoneFilesChangeDetails = detail; void [values, notification.reason]; },
 onchange(event) { const input: HTMLInputElement = event.currentTarget; void input.files; },
 ref(node) { const owner: HTMLLabelElement | null = node; if(owner) { const instance: DropzoneInstance = createDropzone(owner); instance.setFiles(instance.getFiles(), filesOptions); instance.setUploading(instance.getUploading()); instance.clearFiles(filesOptions); } },
};
const attached = { [createAttachmentKey()]: (node: HTMLInputElement) => { void node.files; return () => {}; } };
void [options, Namespace, DropzoneVariants.dropzone(), DropzoneVariants.dropzoneFilesList()];
</script>
<Dropzone.Root {...props} {...attached}/>
<StyledRoot name="custom"><DropzoneUploadIndicator>Choose files</DropzoneUploadIndicator><DropzoneLoadingIndicator>Uploading</DropzoneLoadingIndicator><DropzoneFilesList /></StyledRoot>
<Primitive.Root onFilesChange={(files,detail)=>{const selected: File[]=files;void [selected,detail.previousFiles];}} ref={(node: HTMLLabelElement|null)=>{}}>
 <Primitive.Input name="files" form="upload-form" accept="image/*" multiple required {...attached} ref={(node: HTMLInputElement|null)=>{}} />
 <Primitive.UploadIndicator>Choose</Primitive.UploadIndicator><Primitive.LoadingIndicator isUploading>Wait</Primitive.LoadingIndicator><Primitive.FilesList ref={(node: HTMLDivElement|null)=>{}}/>
</Primitive.Root>
<DropzoneRoot><DropzoneInput/><FilesList/><LoadingIndicator/><UploadIndicator/></DropzoneRoot>`;
