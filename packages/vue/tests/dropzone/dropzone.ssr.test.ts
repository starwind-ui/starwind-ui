import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import {
  DropzoneFilesList,
  DropzoneInput,
  DropzoneLoadingIndicator,
  DropzoneRoot,
  DropzoneUploadIndicator,
} from "@starwind-ui/vue/dropzone";
import {
  Dropzone as StyledDropzone,
  DropzoneFilesList as StyledDropzoneFilesList,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/dropzone";

describe("Vue Dropzone SSR", () => {
  it("renders deterministic native form markup without browser globals", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(DropzoneRoot, { disabled: false, isUploading: false }, () => [
              h(DropzoneUploadIndicator, { isUploading: false }),
              h(DropzoneLoadingIndicator, { isUploading: false }),
              h(DropzoneFilesList),
              h(DropzoneInput, {
                accept: "image/*",
                multiple: true,
                name: "assets",
                required: true,
              }),
            ]),
        }),
      );

    const html = await render();
    expect(await render()).toBe(html);
    expect(html.match(/data-sw-dropzone-input/g)).toHaveLength(1);
    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('name="assets"');
    expect(html).toContain("multiple");
    expect(html).toContain("required");
  });

  it("renders Styled composition and canonical slots with one native input", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledDropzone, {
            accept: ".png",
            "aria-describedby": "images-help",
            ariaInvalid: "true",
            id: "images-dropzone",
            isUploading: true,
            multiple: true,
            name: "images",
          }),
      }),
    );

    expect(html.match(/data-sw-dropzone-input/g)).toHaveLength(1);
    expect(html).toContain('data-slot="dropzone"');
    expect(html).toContain('data-slot="dropzone-upload-indicator"');
    expect(html).toContain('data-slot="dropzone-loading-indicator"');
    expect(html).toContain('data-slot="dropzone-files-list"');
    expect(html).not.toMatch(/blob:|createObjectURL/);

    const root = html.match(/<label\b[^>]*data-sw-dropzone[^>]*>/)?.[0];
    const input = html.match(/<input\b[^>]*data-sw-dropzone-input[^>]*>/)?.[0];
    expect(root).toContain('id="images-dropzone"');
    expect(root).toContain('aria-invalid="true"');
    expect(root).not.toContain("accept=");
    expect(root).not.toContain("aria-describedby=");
    expect(root).not.toContain("multiple");
    expect(root).not.toContain("name=");
    expect(input).toContain('accept=".png"');
    expect(input).toContain('aria-describedby="images-help"');
    expect(input).toContain('aria-invalid="true"');
    expect(input).toContain("multiple");
    expect(input).toContain('name="images"');
    expect(input).not.toContain('id="images-dropzone"');
  });

  it("lets consumer FilesList ARIA attributes override canonical defaults", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledDropzoneFilesList, {
            "aria-label": "Selected assets",
            "aria-live": "assertive",
          }),
      }),
    );

    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain('aria-label="Selected assets"');
    expect(html).not.toContain('aria-live="polite"');
    expect(html).not.toContain('aria-label="Uploaded files"');
  });
});
