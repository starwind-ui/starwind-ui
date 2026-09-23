import { compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateReactPrimitiveWrappers,
  generateStarwindReactWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
} from "./shared.js";

export function defineReactDropzoneOutputTests(getTempRoot: GetTempRoot): void {
  it("generates React dropzone primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const root = await readGeneratedFile(outputRoot, "dropzone/DropzoneRoot.tsx");
    const input = await readGeneratedFile(outputRoot, "dropzone/DropzoneInput.tsx");
    const uploadIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneUploadIndicator.tsx",
    );
    const loadingIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneLoadingIndicator.tsx",
    );
    const filesList = await readGeneratedFile(outputRoot, "dropzone/DropzoneFilesList.tsx");
    const index = await readGeneratedFile(outputRoot, "dropzone/index.ts");

    expect(generatedPrimitiveEntries).toContain("dropzone");
    expect(compactCode(root)).toContain(
      compactCode(
        'import { createDropzone, type DropzoneFilesChangeDetails } from "@starwind-ui/runtime/dropzone";',
      ),
    );
    expect(compactCode(root)).toContain(compactCode("onFilesChange?:"));
    expect(compactCode(root)).toContain(compactCode("instance.setDisabled(next.disabled)"));
    expect(compactCode(root)).toContain(compactCode("instance.setUploading(next.isUploading)"));
    expect(compactCode(root)).toContain(compactCode("data-sw-dropzone"));
    expect(compactCode(root)).toContain(compactCode("data-drag-active"));
    expect(compactCode(root)).toContain(compactCode("data-has-files"));
    expect(compactCode(root)).toContain(compactCode("data-is-uploading"));
    expect(compactCode(input)).toContain(compactCode("data-sw-dropzone-input"));
    expect(compactCode(input)).toContain(compactCode('type="file"'));
    expect(compactCode(input)).toContain(compactCode('"sr-only"'));
    expect(compactCode(uploadIndicator)).toContain(
      compactCode("data-sw-dropzone-upload-indicator"),
    );
    expect(compactCode(uploadIndicator)).toContain(compactCode("isUploading = false"));
    expect(compactCode(uploadIndicator)).toContain(
      compactCode('data-is-uploading={isUploading ? "true" : "false"}'),
    );
    expect(compactCode(uploadIndicator)).toContain(compactCode("hidden = isUploading"));
    expect(compactCode(uploadIndicator)).toContain(compactCode("hidden={hidden}"));
    expect(compactCode(loadingIndicator)).toContain(
      compactCode("data-sw-dropzone-loading-indicator"),
    );
    expect(compactCode(loadingIndicator)).toContain(compactCode("isUploading = false"));
    expect(compactCode(loadingIndicator)).toContain(compactCode("hidden = !isUploading"));
    expect(compactCode(loadingIndicator)).toContain(compactCode("hidden={hidden}"));
    expect(compactCode(filesList)).toContain(compactCode("data-sw-dropzone-files-list"));
    expect(compactCode(index)).toContain(compactCode("Root: DropzoneRoot"));
    expect(compactCode(index)).toContain(compactCode("Input: DropzoneInput"));
    expect(compactCode(index)).toContain(compactCode("FilesList: DropzoneFilesList"));
    expect(compactCode(index)).toContain(
      compactCode('export type { DropzoneFilesChangeDetails } from "@starwind-ui/runtime"'),
    );
  });

  it("generates React dropzone styled wrappers from dropzone primitives", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const root = await readGeneratedFile(outputRoot, "dropzone/Dropzone.tsx");
    const uploadIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneUploadIndicator.tsx",
    );
    const loadingIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneLoadingIndicator.tsx",
    );
    const filesList = await readGeneratedFile(outputRoot, "dropzone/DropzoneFilesList.tsx");
    const variants = await readGeneratedFile(outputRoot, "dropzone/variants.ts");
    const index = await readGeneratedFile(outputRoot, "dropzone/index.ts");

    expect(compactCode(root)).toContain(
      compactCode('DropzonePrimitive from "../primitives/react/dropzone"'),
    );
    expect(compactCode(root)).toContain(compactCode("<DropzonePrimitive.Root"));
    expect(compactCode(root)).toContain(compactCode("isUploading={isUploading}"));
    expect(compactCode(root)).toContain(compactCode("<DropzoneLoadingIndicator"));
    expect(compactCode(root)).toContain(compactCode("<DropzoneFilesList />"));
    expect(compactCode(root)).toContain(compactCode("<DropzonePrimitive.Input"));
    expect(compactCode(root)).toContain(compactCode('data-slot="dropzone"'));
    expect(compactCode(uploadIndicator)).toContain(compactCode("IconCloudUpload as CloudUpload"));
    expect(compactCode(uploadIndicator)).toContain(compactCode("Click to upload or drag and drop"));
    expect(compactCode(loadingIndicator)).toContain(compactCode("IconLoader2 as Loader2"));
    expect(compactCode(loadingIndicator)).toContain(compactCode("Uploading file(s)..."));
    expect(compactCode(filesList)).toContain(compactCode('aria-live="polite"'));
    expect(compactCode(filesList)).toContain(compactCode('aria-label="Uploaded files"'));
    expect(compactCode(variants)).not.toContain(compactCode("starwind-dropzone"));
    expect(compactCode(variants)).not.toContain(compactCode("starwind-files-list"));
    expect(compactCode(variants)).not.toContain(compactCode("starwind-loading-indicator"));
    expect(compactCode(variants)).not.toContain(compactCode("starwind-upload-indicator"));
    expect(compactCode(variants)).toContain(compactCode("relative flex w-full flex-col"));
    expect(compactCode(variants)).toContain(compactCode("mt-1 -mb-8 min-h-8"));
    expect(compactCode(index)).toContain(compactCode("Root: Dropzone"));
    expect(compactCode(index)).toContain(compactCode("FilesList: DropzoneFilesList"));
  });
}
