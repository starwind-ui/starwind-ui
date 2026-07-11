import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateAstroPrimitiveWrappers,
  generateStarwindAstroWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
} from "./shared.js";

export function defineAstroDropzoneOutputTests(getTempRoot: GetTempRoot): void {
  it("generates Astro dropzone primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const root = await readGeneratedFile(outputRoot, "dropzone/DropzoneRoot.astro");
    const input = await readGeneratedFile(outputRoot, "dropzone/DropzoneInput.astro");
    const uploadIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneUploadIndicator.astro",
    );
    const loadingIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneLoadingIndicator.astro",
    );
    const filesList = await readGeneratedFile(outputRoot, "dropzone/DropzoneFilesList.astro");
    const index = await readGeneratedFile(outputRoot, "dropzone/index.ts");

    expect(generatedPrimitiveEntries).toContain("dropzone");
    expect(root).toContain('import { createDropzone } from "@starwind-ui/runtime/dropzone"');
    expect(root).toContain("data-sw-dropzone");
    expect(root).toContain("data-drag-active");
    expect(root).toContain("data-has-files");
    expect(root).toContain("data-is-uploading");
    expect(root).toContain('role="button"');
    expect(root).toContain('registerAstroControllerLifecycle("DropzoneRoot", setupDropzones)');
    expect(input).toContain("data-sw-dropzone-input");
    expect(input).toContain('type="file"');
    expect(input).toContain("class: className");
    expect(input).toContain('class:list={["sr-only", className]}');
    expect(input.indexOf("{...rest}")).toBeLessThan(input.indexOf("class:list"));
    expect(uploadIndicator).toContain("data-sw-dropzone-upload-indicator");
    expect(uploadIndicator).toContain("isUploading = false");
    expect(uploadIndicator).toContain('data-is-uploading={isUploading ? "true" : "false"}');
    expect(uploadIndicator).toContain("hidden={isUploading}");
    expect(loadingIndicator).toContain("data-sw-dropzone-loading-indicator");
    expect(loadingIndicator).toContain("isUploading = false");
    expect(loadingIndicator).toContain('data-is-uploading={isUploading ? "true" : "false"}');
    expect(loadingIndicator).toContain("hidden={!isUploading}");
    expect(filesList).toContain("data-sw-dropzone-files-list");
    expect(index).toContain("Root: DropzoneRoot");
    expect(index).toContain("Input: DropzoneInput");
    expect(index).toContain("FilesList: DropzoneFilesList");
    expect(index).toContain(
      'export type { DropzoneFilesChangeDetails } from "@starwind-ui/runtime"',
    );
  });

  it("generates Astro dropzone styled wrappers from dropzone primitives", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const root = await readGeneratedFile(outputRoot, "dropzone/Dropzone.astro");
    const uploadIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneUploadIndicator.astro",
    );
    const loadingIndicator = await readGeneratedFile(
      outputRoot,
      "dropzone/DropzoneLoadingIndicator.astro",
    );
    const filesList = await readGeneratedFile(outputRoot, "dropzone/DropzoneFilesList.astro");
    const variants = await readGeneratedFile(outputRoot, "dropzone/variants.ts");
    const index = await readGeneratedFile(outputRoot, "dropzone/index.ts");

    expect(root).toContain('DropzonePrimitive from "../primitives/astro/dropzone"');
    expect(root).toContain("<DropzonePrimitive.Root");
    expect(root).toContain("<DropzoneUploadIndicator isUploading={isUploading} />");
    expect(root).toContain("<DropzoneLoadingIndicator isUploading={isUploading} />");
    expect(root).toContain("<DropzoneFilesList />");
    expect(root).toContain("<DropzonePrimitive.Input");
    expect(root).toContain('data-slot="dropzone"');
    expect(uploadIndicator).toContain("CloudUpload");
    expect(uploadIndicator).toContain("Click to upload or drag and drop");
    expect(loadingIndicator).toContain("Loader2");
    expect(loadingIndicator).toContain("Uploading file(s)...");
    expect(filesList).toContain('aria-live="polite"');
    expect(filesList).toContain('aria-label="Uploaded files"');
    expect(variants).not.toContain("starwind-dropzone");
    expect(variants).not.toContain("starwind-files-list");
    expect(variants).not.toContain("starwind-loading-indicator");
    expect(variants).not.toContain("starwind-upload-indicator");
    expect(variants).toContain("relative flex w-full flex-col");
    expect(variants).toContain("mt-1 -mb-8 min-h-8");
    expect(index).toContain("Root: Dropzone");
    expect(index).toContain("FilesList: DropzoneFilesList");
  });
}
