import { createApp, createSSRApp, h, nextTick, ref, type ComponentPublicInstance } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DropzoneFilesChangeDetails } from "@starwind-ui/runtime/dropzone";
import {
  DropzoneFilesList,
  DropzoneInput,
  DropzoneLoadingIndicator,
  DropzoneRoot,
  DropzoneUploadIndicator,
} from "@starwind-ui/vue/dropzone";
import { Dropzone as StyledDropzone } from "../../../../apps/vue-demo/src/components/starwind-runtime/dropzone";

type ElementExpose<T extends HTMLElement> = ComponentPublicInstance & { element: T | null };
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Dropzone public behavior", () => {
  it("activates through public keyboard events without chooser automation", async () => {
    const host = mountDropzone({});
    const root = getRoot(host);
    const input = getInput(host);
    const click = vi.spyOn(input, "click").mockImplementation(() => undefined);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(click).toHaveBeenCalledTimes(2);
  });

  it("delegates drag state, acceptance, multiple constraints, and rejected-only silence", async () => {
    const changes: Array<{ detail: DropzoneFilesChangeDetails; files: File[] }> = [];
    const host = mountDropzone({
      accept: "image/*,.txt",
      multiple: true,
      onFilesChange: (files: File[], detail: DropzoneFilesChangeDetails) =>
        changes.push({ detail, files }),
    });
    const root = getRoot(host);

    root.dispatchEvent(createDragEvent("dragenter"));
    expect(root).toHaveAttribute("data-drag-active", "true");
    root.dispatchEvent(createDragEvent("dragleave"));
    expect(root).toHaveAttribute("data-drag-active", "false");

    const image = new File(["image"], "photo.png", { type: "image/png" });
    const text = new File(["text"], "notes.txt", { type: "text/plain" });
    const rejected = new File(["zip"], "archive.zip", { type: "application/zip" });
    root.dispatchEvent(createDragEvent("drop", [image, rejected, text]));
    await settle();

    expect(changes).toHaveLength(1);
    expect(changes[0]!.files).toEqual([image, text]);
    expect(changes[0]!.detail).toEqual(
      expect.objectContaining({ files: [image, text], previousFiles: [], reason: "drop" }),
    );
    expect(getInput(host).files).toHaveLength(2);
    expect(root).toHaveAttribute("data-has-files", "true");
    expect(host.querySelector("[data-sw-dropzone-files-list]")?.textContent).toContain("photo.png");

    root.dispatchEvent(createDragEvent("drop", [rejected]));
    await settle();
    expect(changes).toHaveLength(1);

    const singleHost = mountDropzone({ accept: "image/*", multiple: false });
    getRoot(singleHost).dispatchEvent(createDragEvent("drop", [image, text]));
    await settle();
    expect(getInput(singleHost).files).toHaveLength(1);
    expect(getInput(singleHost).files?.[0]).toBe(image);
  });

  it("keeps native input change, disabled state, form reset, and uploading Runtime-owned", async () => {
    const disabled = ref(false);
    const uploading = ref(false);
    const changes: DropzoneFilesChangeDetails[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("form", null, [
          dropzoneTree({
            disabled: disabled.value,
            isUploading: uploading.value,
            name: "documents",
            onFilesChange: (_files: File[], detail: DropzoneFilesChangeDetails) =>
              changes.push(detail),
          }),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const form = host.querySelector("form")!;
    const root = getRoot(host);
    const input = getInput(host);
    const selected = new File(["pdf"], "report.pdf", { type: "application/pdf" });
    assignInputFiles(input, [selected]);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(changes.at(-1)).toEqual(expect.objectContaining({ reason: "input-change" }));
    expect(new FormData(form).get("documents")).toBe(selected);

    disabled.value = true;
    uploading.value = true;
    await settle();
    expect(root).toHaveAttribute("aria-disabled", "true");
    expect(input.disabled).toBe(true);
    expect(root).toHaveAttribute("data-is-uploading", "true");
    expect(host.querySelector("[data-sw-dropzone-upload-indicator]")).toHaveAttribute("hidden");
    expect(host.querySelector("[data-sw-dropzone-loading-indicator]")).not.toHaveAttribute(
      "hidden",
    );

    root.dispatchEvent(createDragEvent("drop", [selected]));
    await settle();
    expect(changes).toHaveLength(1);

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await settle();
    expect(input.files).toHaveLength(0);
    expect(root).toHaveAttribute("data-has-files", "false");
    expect(changes).toHaveLength(1);
  });

  it("isolates instances, forwards refs/attrs, remounts, and releases Runtime resources", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const showSecond = ref(true);
    const rootRef = ref<ElementExpose<HTMLLabelElement> | null>(null);
    const inputRef = ref<ElementExpose<HTMLInputElement> | null>(null);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("main", null, [
          dropzoneTree({
            class: "consumer-dropzone",
            ref: rootRef,
            inputRef,
          }),
          showSecond.value ? dropzoneTree({}) : null,
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    expect(host.querySelectorAll("[data-sw-dropzone]")).toHaveLength(2);
    expect(host.querySelectorAll("[data-sw-dropzone-input]")).toHaveLength(2);
    expect(rootRef.value?.element).toBe(host.querySelector("[data-sw-dropzone]"));
    expect(inputRef.value?.element).toBe(host.querySelector("[data-sw-dropzone-input]"));
    expect(rootRef.value?.element).toHaveClass("consumer-dropzone");

    showSecond.value = false;
    await settle();
    expect(host.querySelectorAll("[data-sw-dropzone]")).toHaveLength(1);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("hydrates Styled Dropzone without duplicate inputs, globals, network, or object URLs", async () => {
    const fetchSpy = vi.spyOn(window, "fetch");
    const objectUrl = vi.spyOn(URL, "createObjectURL");
    const rootRef = ref<ElementExpose<HTMLLabelElement> | null>(null);
    const render = () =>
      h(StyledDropzone, {
        accept: ".png",
        class: "styled-consumer",
        multiple: true,
        name: "images",
        ref: rootRef,
      });
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp({ render }));
    const warnings: string[] = [];
    const app = createSSRApp({ render });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-sw-dropzone-input]")).toHaveLength(1);
    expect(rootRef.value?.element).toBe(host.querySelector("[data-slot=dropzone]"));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(objectUrl).not.toHaveBeenCalled();
  });
});

function dropzoneTree(props: Record<string, unknown>) {
  const { accept, inputRef, multiple, name, required, ...rootProps } = props;
  return h(DropzoneRoot, rootProps, () => [
    h(DropzoneUploadIndicator, { isUploading: rootProps.isUploading }),
    h(DropzoneLoadingIndicator, { isUploading: rootProps.isUploading }),
    h(DropzoneFilesList),
    h(DropzoneInput, {
      accept,
      disabled: rootProps.disabled,
      multiple,
      name,
      ref: inputRef,
      required,
    }),
  ]);
}

function mountDropzone(props: Record<string, unknown>): HTMLDivElement {
  const host = appendHost();
  const app = createApp({ render: () => dropzoneTree(props) });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return host;
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

function getRoot(host: ParentNode): HTMLLabelElement {
  return host.querySelector<HTMLLabelElement>("[data-sw-dropzone]")!;
}

function getInput(host: ParentNode): HTMLInputElement {
  return host.querySelector<HTMLInputElement>("[data-sw-dropzone-input]")!;
}

function createDragEvent(type: string, files: File[] = []): DragEvent {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });
}

function assignInputFiles(input: HTMLInputElement, files: File[]): void {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
}
