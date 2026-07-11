import type { StyledAdapterContract } from "../types.js";

export const dropzoneStyledContract: StyledAdapterContract = {
  component: "dropzone",
  publicExports: [
    "Dropzone",
    "DropzoneFilesList",
    "DropzoneLoadingIndicator",
    "DropzoneUploadIndicator",
  ],
  defaultExport: {
    Root: "Dropzone",
    FilesList: "DropzoneFilesList",
    LoadingIndicator: "DropzoneLoadingIndicator",
    UploadIndicator: "DropzoneUploadIndicator",
  },
  variantCollectionName: "DropzoneVariants",
  variants: {
    dropzone: {
      base: [
        "relative flex w-full flex-col items-center justify-center gap-1 rounded-lg px-6 py-12 shadow-xs",
        "bg-background dark:bg-input/30 text-muted-foreground border-input cursor-pointer border border-dashed text-center text-sm",
        "data-[is-uploading=false]:hover:bg-muted data-[drag-active=true]:bg-muted transition",
        "focus-visible:border-outline focus-visible:ring-outline/50 outline-none focus-visible:ring-3",
        "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
      ],
    },
    dropzoneFilesList: {
      base: [
        "mt-1 -mb-8 min-h-8",
        "bg-muted invisible flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-sm",
        "[&_div]:flex [&_div]:items-center [&_div]:gap-1 [&_svg]:size-3.5",
      ],
    },
    dropzoneLoadingIndicator: {
      base: "data-[is-uploading=false]:hidden",
    },
    dropzoneUploadIndicator: {
      base: "data-[is-uploading=true]:hidden",
    },
  },
  components: [
    {
      exportName: "Dropzone",
      primitiveAliases: { dropzone: "DropzonePrimitive" },
      props: {
        declaration: "type",
        extends: [{ type: "omitHtmlAttributes", element: "input", keys: ["disabled", "type"] }],
        fields: [
          { name: "disabled", optional: true, type: "boolean" },
          { name: "isUploading", optional: true, type: "boolean" },
          {
            name: "children",
            optional: true,
            type: "React.ReactNode",
            frameworks: ["react"],
          },
          {
            name: "onFilesChange",
            optional: true,
            type: '(files: File[], details: import("@starwind-ui/runtime").DropzoneFilesChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLLabelElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "id" },
          { name: "disabled", defaultValue: "false" },
          { name: "isUploading", defaultValue: "false" },
          { name: "onFilesChange", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "aria-invalid", alias: "ariaInvalid" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "dropzone",
          part: "Root",
          attrs: [
            { name: "id", value: { type: "variable", name: "id" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropzone",
                args: { class: "className" },
              },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "isUploading", value: { type: "variable", name: "isUploading" } },
            {
              name: "onFilesChange",
              value: { type: "variable", name: "onFilesChange" },
              frameworks: ["react"],
            },
            { name: "aria-invalid", value: { type: "variable", name: "ariaInvalid" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "dropzone" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "component",
                  component: "dropzone",
                  exportName: "DropzoneUploadIndicator",
                  attrs: [
                    { name: "isUploading", value: { type: "variable", name: "isUploading" } },
                  ],
                  selfClosing: true,
                },
                {
                  type: "component",
                  component: "dropzone",
                  exportName: "DropzoneLoadingIndicator",
                  attrs: [
                    { name: "isUploading", value: { type: "variable", name: "isUploading" } },
                  ],
                  selfClosing: true,
                },
                {
                  type: "component",
                  component: "dropzone",
                  exportName: "DropzoneFilesList",
                  selfClosing: true,
                },
              ],
            },
            {
              type: "primitive",
              component: "dropzone",
              part: "Input",
              selfClosing: true,
              attrs: [
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "aria-invalid", value: { type: "variable", name: "ariaInvalid" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "DropzoneUploadIndicator",
      primitiveAliases: { dropzone: "DropzonePrimitive" },
      imports: [
        {
          type: "default",
          importName: "CloudUpload",
          source: "@tabler/icons/outline/cloud-upload.svg",
        },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [{ name: "isUploading", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "isUploading", defaultValue: "false" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "dropzone",
          part: "UploadIndicator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropzoneUploadIndicator",
                args: { class: "className" },
              },
            },
            { name: "isUploading", value: { type: "variable", name: "isUploading" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropzone-upload-indicator" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "icon",
                  importName: "CloudUpload",
                  attrs: [
                    { name: "class", value: { type: "literal", value: "mx-auto size-10" } },
                    { name: "aria-hidden", value: { type: "literal", value: true } },
                  ],
                },
                {
                  type: "element",
                  tag: "p",
                  attrs: [{ name: "class", value: { type: "literal", value: "mt-1 text-sm" } }],
                  children: [{ type: "text", value: "Click to upload or drag and drop" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "DropzoneLoadingIndicator",
      primitiveAliases: { dropzone: "DropzonePrimitive" },
      imports: [
        { type: "default", importName: "Loader2", source: "@tabler/icons/outline/loader-2.svg" },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [{ name: "isUploading", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "isUploading", defaultValue: "false" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "dropzone",
          part: "LoadingIndicator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropzoneLoadingIndicator",
                args: { class: "className" },
              },
            },
            { name: "isUploading", value: { type: "variable", name: "isUploading" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "data-slot",
              value: { type: "literal", value: "dropzone-loading-indicator" },
            },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "icon",
                  importName: "Loader2",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "literal", value: "mx-auto size-10 animate-spin" },
                    },
                    { name: "aria-hidden", value: { type: "literal", value: true } },
                  ],
                },
                {
                  type: "element",
                  tag: "p",
                  attrs: [{ name: "class", value: { type: "literal", value: "mt-1 text-sm" } }],
                  children: [{ type: "text", value: "Uploading file(s)..." }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "DropzoneFilesList",
      primitiveAliases: { dropzone: "DropzonePrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "dropzone",
          part: "FilesList",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropzoneFilesList",
                args: { class: "className" },
              },
            },
            { name: "aria-live", value: { type: "literal", value: "polite" } },
            { name: "aria-label", value: { type: "literal", value: "Uploaded files" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropzone-files-list" } },
          ],
        },
      ],
    },
  ],
};
