<script lang="ts">
  import Dropzone from "$lib/starwind-runtime/dropzone";
  import Field from "$lib/starwind-runtime/field";
  import Form from "$lib/starwind-runtime/form";
  import { Button } from "$lib/starwind-runtime/button";
  let selected = $state<string[]>([]);
</script>

<div class="grid min-w-0 gap-6">
  <Form.Root onsubmit={(event) => event.preventDefault()}>
    <Field.Root name="documents">
      <Field.Label>Documents</Field.Label>
      <Dropzone.Root
        id="document-upload"
        accept=".txt"
        multiple
        required
        onFilesChange={(files) => (selected = files.map((file) => file.name))}
      />
      <Field.Description>Choose text files for this form.</Field.Description>
      <Field.Error match="valueMissing" messageSource="children">Choose a document.</Field.Error>
    </Field.Root>
    <p class="mt-3 text-sm" data-dropzone-status>Last selection: {selected.join(", ") || "None"}</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <Button type="submit">Submit files</Button><Button type="reset" variant="outline"
        >Reset files</Button
      >
    </div>
  </Form.Root>
  <div class="grid gap-2">
    <p class="text-sm">Custom content, uploading state</p>
    <Dropzone.Root id="uploading-example" isUploading aria-label="Uploading documents">
      <Dropzone.UploadIndicator>Choose documents</Dropzone.UploadIndicator>
      <Dropzone.LoadingIndicator />
      <Dropzone.FilesList />
    </Dropzone.Root>
  </div>
  <div class="grid gap-2">
    <p class="text-sm">Disabled</p>
    <Dropzone.Root id="disabled-upload" disabled aria-label="Disabled upload" />
  </div>
</div>
