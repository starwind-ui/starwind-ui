import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createDropzone } from "../../../src/components/dropzone/dropzone";

describe("createDropzone", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes the root, hidden file input, indicators, and empty files list", () => {
    const root = renderDropzone();

    const dropzone = createDropzone(root);

    expect(dropzone.root).toBe(root);
    expect(dropzone.input).toBe(getInput());
    expect(root.getAttribute("role")).toBe("button");
    expect(root.tabIndex).toBe(0);
    expect(root.getAttribute("data-drag-active")).toBe("false");
    expect(root.getAttribute("data-has-files")).toBe("false");
    expect(root.getAttribute("data-is-uploading")).toBe("false");
    expect(getInput().type).toBe("file");
    expect(getInput().tabIndex).toBe(-1);
    expect(getInput().id).toBe("resume-dropzone-input");
    expect((root as HTMLLabelElement).htmlFor).toBe("resume-dropzone-input");
    expect(getUploadIndicator().hidden).toBe(false);
    expect(getLoadingIndicator().hidden).toBe(true);
    expect(getFilesList().classList.contains("invisible")).toBe(true);
  });

  it("tracks drag state and syncs dropped files into the native input", () => {
    const root = renderDropzone({ multiple: true });
    const listener = vi.fn();
    root.addEventListener("starwind:files-change", listener);

    const dropzone = createDropzone(root);
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    root.dispatchEvent(
      new DragEvent("dragover", { bubbles: true, dataTransfer: new DataTransfer() }),
    );
    expect(root.getAttribute("data-drag-active")).toBe("true");

    const dropTransfer = new DataTransfer();
    dropTransfer.items.add(file);
    root.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dropTransfer }));

    expect(root.getAttribute("data-drag-active")).toBe("false");
    expect(root.getAttribute("data-has-files")).toBe("true");
    expect(dropzone.getFiles()).toEqual([file]);
    expect(Array.from(getInput().files ?? [])).toEqual([file]);
    expect(getFilesList().classList.contains("invisible")).toBe(false);
    expect(getFilesList().textContent).toContain("hello.txt");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ files: [file], reason: "drop" }),
      }),
    );
  });

  it("keeps drag-active state while moving between children inside the dropzone", () => {
    const root = renderDropzone();
    createDropzone(root);

    root.dispatchEvent(
      new DragEvent("dragover", { bubbles: true, dataTransfer: new DataTransfer() }),
    );
    expect(root.getAttribute("data-drag-active")).toBe("true");

    const childLeave = new DragEvent("dragleave", { bubbles: true });
    Object.defineProperty(childLeave, "relatedTarget", { value: getLoadingIndicator() });
    getUploadIndicator().dispatchEvent(childLeave);

    expect(root.getAttribute("data-drag-active")).toBe("true");

    root.dispatchEvent(new DragEvent("dragleave", { bubbles: true }));

    expect(root.getAttribute("data-drag-active")).toBe("false");
  });

  it("filters dropped files through accept and multiple input constraints", () => {
    const root = renderDropzone({ accept: "image/png,.txt", multiple: false });
    const dropzone = createDropzone(root);
    const jpegFile = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const pngFile = new File(["avatar"], "avatar.png", { type: "image/png" });
    const textFile = new File(["notes"], "notes.txt", { type: "text/plain" });
    const transfer = new DataTransfer();
    transfer.items.add(jpegFile);
    transfer.items.add(pngFile);
    transfer.items.add(textFile);

    root.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));

    expect(dropzone.getFiles()).toEqual([pngFile]);
    expect(Array.from(getInput().files ?? [])).toEqual([pngFile]);
    expect(getFilesList().textContent).toContain("avatar.png");
    expect(getFilesList().textContent).not.toContain("notes.txt");
    expect(getFilesList().textContent).not.toContain("photo.jpg");
  });

  it("keeps multiple dropped files when multiple is enabled and accept matches", () => {
    const root = renderDropzone({ accept: ".txt,image/png", multiple: true });
    const dropzone = createDropzone(root);
    const pngFile = new File(["avatar"], "avatar.png", { type: "image/png" });
    const textFile = new File(["notes"], "notes.TXT", { type: "text/plain" });
    const pdfFile = new File(["paper"], "paper.pdf", { type: "application/pdf" });
    const transfer = new DataTransfer();
    transfer.items.add(pngFile);
    transfer.items.add(textFile);
    transfer.items.add(pdfFile);

    root.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));

    expect(dropzone.getFiles()).toEqual([pngFile, textFile]);
    expect(Array.from(getInput().files ?? [])).toEqual([pngFile, textFile]);
    expect(getFilesList().textContent).toContain("avatar.png");
    expect(getFilesList().textContent).toContain("notes.TXT");
    expect(getFilesList().textContent).not.toContain("paper.pdf");
  });

  it("updates files from native input changes", () => {
    const root = renderDropzone();
    const onFilesChange = vi.fn();
    const dropzone = createDropzone(root, { onFilesChange });
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const transfer = new DataTransfer();
    transfer.items.add(file);

    getInput().files = transfer.files;
    getInput().dispatchEvent(new Event("change", { bubbles: true }));

    expect(dropzone.getFiles()).toEqual([file]);
    expect(root.getAttribute("data-has-files")).toBe("true");
    expect(onFilesChange).toHaveBeenCalledWith(
      [file],
      expect.objectContaining({ files: [file], reason: "input-change" }),
    );
  });

  it("emits detailed imperative file changes and supports silent updates", () => {
    const root = renderDropzone({ multiple: true });
    const onFilesChange = vi.fn();
    const eventListener = vi.fn();
    root.addEventListener("starwind:files-change", eventListener);
    const dropzone = createDropzone(root, { onFilesChange });
    const subscriber = vi.fn();
    const unsubscribe = dropzone.subscribe("filesChange", subscriber);
    const resumeFile = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    const avatarFile = new File(["avatar"], "avatar.png", { type: "image/png" });

    dropzone.setFiles([resumeFile]);

    expect(dropzone.getFiles()).toEqual([resumeFile]);
    expect(Array.from(getInput().files ?? [])).toEqual([resumeFile]);
    expect(getFilesList().textContent).toContain("resume.pdf");
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(eventListener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          event: undefined,
          files: [resumeFile],
          previousFiles: [],
          reason: "imperative-action",
          trigger: root,
        }),
      }),
    );
    expect(onFilesChange).toHaveBeenCalledWith(
      [resumeFile],
      expect.objectContaining({
        files: [resumeFile],
        previousFiles: [],
        reason: "imperative-action",
        trigger: root,
      }),
    );
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [resumeFile],
        previousFiles: [],
        reason: "imperative-action",
        trigger: root,
      }),
    );

    dropzone.setFiles([resumeFile]);
    dropzone.setFiles([avatarFile], { emit: false });

    expect(dropzone.getFiles()).toEqual([avatarFile]);
    expect(Array.from(getInput().files ?? [])).toEqual([avatarFile]);
    expect(getFilesList().textContent).not.toContain("resume.pdf");
    expect(getFilesList().textContent).toContain("avatar.png");
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(onFilesChange).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsubscribe();
    dropzone.setFiles([resumeFile, avatarFile]);

    expect(eventListener).toHaveBeenCalledTimes(2);
    expect(onFilesChange).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(onFilesChange).toHaveBeenLastCalledWith(
      [resumeFile, avatarFile],
      expect.objectContaining({
        files: [resumeFile, avatarFile],
        previousFiles: [avatarFile],
        reason: "imperative-action",
      }),
    );
  });

  it("filters wildcard accept values and clears drag state when a drop has no files", () => {
    const root = renderDropzone({ accept: "image/*", multiple: true });
    const dropzone = createDropzone(root);
    const eventListener = vi.fn();
    root.addEventListener("starwind:files-change", eventListener);
    const textFile = new File(["notes"], "notes.txt", { type: "text/plain" });
    const imageFile = new File(["avatar"], "avatar.svg", { type: "image/svg+xml" });
    const rejectedTransfer = new DataTransfer();
    rejectedTransfer.items.add(textFile);

    root.dispatchEvent(
      new DragEvent("dragover", { bubbles: true, dataTransfer: new DataTransfer() }),
    );
    root.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: rejectedTransfer }));

    expect(root.getAttribute("data-drag-active")).toBe("false");
    expect(root.getAttribute("data-has-files")).toBe("false");
    expect(dropzone.getFiles()).toEqual([]);
    expect(Array.from(getInput().files ?? [])).toEqual([]);
    expect(getFilesList().classList.contains("invisible")).toBe(true);
    expect(eventListener).not.toHaveBeenCalled();

    const acceptedTransfer = new DataTransfer();
    acceptedTransfer.items.add(imageFile);
    root.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: acceptedTransfer }));

    expect(dropzone.getFiles()).toEqual([imageFile]);
    expect(getFilesList().textContent).toContain("avatar.svg");
    expect(eventListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ files: [imageFile], reason: "drop" }),
      }),
    );
  });

  it("clears rendered and internal file state when the owning form resets", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = renderDropzone({ multiple: true });
    form.append(root);
    const onFilesChange = vi.fn();
    const customEventListener = vi.fn();
    root.addEventListener("starwind:files-change", customEventListener);
    const dropzone = createDropzone(root, { onFilesChange });
    const subscriber = vi.fn();
    dropzone.subscribe("filesChange", subscriber);
    const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    const transfer = new DataTransfer();
    transfer.items.add(file);

    root.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));

    expect(dropzone.getFiles()).toEqual([file]);
    expect(Array.from(getInput().files ?? [])).toEqual([file]);
    expect(root.getAttribute("data-has-files")).toBe("true");
    expect(getFilesList().textContent).toContain("resume.pdf");
    expect(onFilesChange).toHaveBeenCalledTimes(1);
    expect(customEventListener).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledTimes(1);

    onFilesChange.mockClear();
    customEventListener.mockClear();
    subscriber.mockClear();

    form.reset();
    await waitForMacrotask();

    expect(dropzone.getFiles()).toEqual([]);
    expect(Array.from(getInput().files ?? [])).toEqual([]);
    expect(root.getAttribute("data-has-files")).toBe("false");
    expect(getFilesList().classList.contains("invisible")).toBe(true);
    expect(getFilesList().textContent).toBe("");
    expect(onFilesChange).not.toHaveBeenCalled();
    expect(customEventListener).not.toHaveBeenCalled();
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("discovers child input and parts when initialized from an unmarked root", () => {
    const root = renderDropzone({ rootAttribute: false });
    const existingInput = getInput();
    const dropzone = createDropzone(root);
    const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });

    dropzone.setFiles([file]);

    expect(dropzone.input).toBe(existingInput);
    expect(root.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(getFilesList().textContent).toContain("resume.pdf");
    expect(root.getAttribute("data-sw-dropzone")).toBe("");
  });

  it("creates an owned hidden input when only nested dropzones have inputs", () => {
    const root = renderDropzone({
      includeInput: false,
      includeNestedDropzone: true,
      rootTag: "div",
    });
    const nestedInput = root.querySelector<HTMLInputElement>(
      "#nested-dropzone [data-sw-dropzone-input]",
    )!;
    const nestedFilesList = root.querySelector<HTMLElement>(
      "#nested-dropzone [data-sw-dropzone-files-list]",
    )!;
    const dropzone = createDropzone(root);
    const file = new File(["outer"], "outer.txt", { type: "text/plain" });

    expect(dropzone.input).not.toBe(nestedInput);
    expect(dropzone.input.parentElement).toBe(root);
    expect(dropzone.input.type).toBe("file");
    expect(dropzone.input.tabIndex).toBe(-1);
    expect(dropzone.input.getAttribute("aria-hidden")).toBe("true");

    dropzone.setFiles([file]);

    expect(getFilesList().textContent).toContain("outer.txt");
    expect(nestedFilesList.textContent).toBe("");
  });

  it("clicks the input from keyboard activation without submitting a form", () => {
    const root = renderDropzone();
    createDropzone(root);
    const click = vi.spyOn(getInput(), "click").mockImplementation(() => undefined);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(click).toHaveBeenCalledTimes(2);
  });

  it("syncs upload state from setters and data attributes", async () => {
    const root = renderDropzone({ isUploading: true });
    const dropzone = createDropzone(root);

    expect(dropzone.getUploading()).toBe(true);
    expect(getUploadIndicator().hidden).toBe(true);
    expect(getLoadingIndicator().hidden).toBe(false);

    dropzone.setUploading(false);
    expect(root.getAttribute("data-is-uploading")).toBe("false");
    expect(getUploadIndicator().hidden).toBe(false);
    expect(getLoadingIndicator().hidden).toBe(true);

    root.setAttribute("data-is-uploading", "true");
    await waitForMutationObserver();

    expect(dropzone.getUploading()).toBe(true);
    expect(getUploadIndicator().hidden).toBe(true);
    expect(getLoadingIndicator().hidden).toBe(false);
  });

  it("syncs disabled state from setters and data attributes without replacing explicit tabindex", async () => {
    const root = renderDropzone({ tabindex: "5" });
    const dropzone = createDropzone(root);

    expect(root.tabIndex).toBe(5);

    dropzone.setDisabled(true);

    expect(root.getAttribute("aria-disabled")).toBe("true");
    expect(root.getAttribute("data-disabled")).toBe("");
    expect(root.tabIndex).toBe(5);
    expect(getInput().disabled).toBe(true);

    dropzone.setDisabled(false);

    expect(root.getAttribute("aria-disabled")).toBe("false");
    expect(root.hasAttribute("data-disabled")).toBe(false);
    expect(root.tabIndex).toBe(5);
    expect(getInput().disabled).toBe(false);

    root.setAttribute("data-disabled", "");
    await waitForMutationObserver();

    expect(root.getAttribute("aria-disabled")).toBe("true");
    expect(getInput().disabled).toBe(true);

    root.removeAttribute("data-disabled");
    await waitForMutationObserver();

    expect(root.getAttribute("aria-disabled")).toBe("false");
    expect(getInput().disabled).toBe(false);
  });

  it("prevents interaction while disabled", () => {
    const root = renderDropzone({ disabled: true });
    const dropzone = createDropzone(root);
    const click = vi.spyOn(getInput(), "click").mockImplementation(() => undefined);
    const file = new File(["ignored"], "ignored.txt");
    const transfer = new DataTransfer();
    transfer.items.add(file);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    root.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));

    expect(click).not.toHaveBeenCalled();
    expect(dropzone.getFiles()).toEqual([]);
    expect(root.getAttribute("data-disabled")).toBe("");
    expect(getInput().disabled).toBe(true);
  });

  it("forwards clicks from non-label roots and removes listeners on destroy", () => {
    const root = renderDropzone({ rootTag: "div" });
    const dropzone = createDropzone(root);
    const click = vi.spyOn(getInput(), "click").mockImplementation(() => undefined);
    const beforeDestroyClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    const afterDestroyClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    const afterDestroyKeydown = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });

    root.dispatchEvent(beforeDestroyClick);

    expect(beforeDestroyClick.defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);

    dropzone.destroy();
    root.dispatchEvent(afterDestroyClick);
    root.dispatchEvent(afterDestroyKeydown);

    expect(afterDestroyClick.defaultPrevented).toBe(false);
    expect(afterDestroyKeydown.defaultPrevented).toBe(false);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("initializes raw HTML dropzones through initStarwind", () => {
    const root = renderDropzone();
    const cleanup = initStarwind(document);
    const click = vi.spyOn(getInput(), "click").mockImplementation(() => undefined);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(root.getAttribute("role")).toBe("button");
    expect(getInput().id).toBe("resume-dropzone-input");
    expect(click).toHaveBeenCalledTimes(1);

    cleanup.destroy();

    root.setAttribute("data-is-uploading", "true");

    expect(getUploadIndicator().hidden).toBe(false);
    expect(getLoadingIndicator().hidden).toBe(true);
  });
});

function renderDropzone(
  options: {
    accept?: string;
    disabled?: boolean;
    includeInput?: boolean;
    includeNestedDropzone?: boolean;
    isUploading?: boolean;
    multiple?: boolean;
    rootAttribute?: boolean;
    rootTag?: "div" | "label";
    tabindex?: string;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  const rootTag = options.rootTag ?? "label";
  const inputMarkup =
    options.includeInput === false
      ? ""
      : `
      <input
        data-sw-dropzone-input
        type="file"
        ${options.accept ? `accept="${options.accept}"` : ""}
        ${options.multiple ? "multiple" : ""}
      />
    `;
  const nestedDropzoneMarkup = options.includeNestedDropzone
    ? `
      <div id="nested-dropzone" data-sw-dropzone>
        <div data-sw-dropzone-files-list class="invisible"></div>
        <input data-sw-dropzone-input type="file" />
      </div>
    `
    : "";
  wrapper.innerHTML = `
    <${rootTag}
      id="resume-dropzone"
      ${options.rootAttribute === false ? "" : "data-sw-dropzone"}
      data-is-uploading="${options.isUploading ? "true" : "false"}"
      ${options.disabled ? "data-disabled" : ""}
      ${options.tabindex ? `tabindex="${options.tabindex}"` : ""}
    >
      <div data-sw-dropzone-upload-indicator>Upload files</div>
      <div data-sw-dropzone-loading-indicator>Uploading</div>
      <div data-sw-dropzone-files-list class="invisible"></div>
      ${inputMarkup}
      ${nestedDropzoneMarkup}
    </${rootTag}>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function getInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-dropzone-input]")!;
}

function getUploadIndicator(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-dropzone-upload-indicator]")!;
}

function getLoadingIndicator(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-dropzone-loading-indicator]")!;
}

function getFilesList(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-dropzone-files-list]")!;
}

async function waitForMutationObserver(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
