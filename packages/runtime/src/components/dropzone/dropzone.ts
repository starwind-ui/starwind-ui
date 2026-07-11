import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { registerFieldControlBridge } from "../field/field-control-bridge";

export type DropzoneFilesChangeReason = "drop" | "imperative-action" | "input-change";

export type DropzoneFilesChangeDetails = {
  event?: Event;
  files: File[];
  previousFiles: File[];
  reason: DropzoneFilesChangeReason;
  trigger?: Element;
};

export type DropzoneOptions = {
  disabled?: boolean;
  isUploading?: boolean;
  onFilesChange?: (files: File[], details: DropzoneFilesChangeDetails) => void;
};

export type DropzoneSetFilesOptions = {
  emit?: boolean;
};

export type DropzoneInstance = {
  readonly input: HTMLInputElement;
  readonly root: HTMLElement;
  clearFiles(options?: DropzoneSetFilesOptions): void;
  destroy(): void;
  getFiles(): File[];
  getUploading(): boolean;
  setDisabled(disabled: boolean): void;
  setFiles(files: File[] | FileList, options?: DropzoneSetFilesOptions): void;
  setUploading(isUploading: boolean): void;
  subscribe(
    event: "filesChange",
    callback: (details: DropzoneFilesChangeDetails) => void,
  ): () => void;
};

type DropzoneElements = {
  filesList: HTMLElement | null;
  input: HTMLInputElement;
  loadingIndicator: HTMLElement | null;
  uploadIndicator: HTMLElement | null;
};

type FilesRequest = {
  event?: Event;
  files: File[];
  reason: DropzoneFilesChangeReason;
  trigger?: Element;
};

const DROPZONE_ROOT_ATTRIBUTE = "data-sw-dropzone";
const DROPZONE_INPUT_ATTRIBUTE = "data-sw-dropzone-input";
const DROPZONE_UPLOAD_INDICATOR_ATTRIBUTE = "data-sw-dropzone-upload-indicator";
const DROPZONE_LOADING_INDICATOR_ATTRIBUTE = "data-sw-dropzone-loading-indicator";
const DROPZONE_FILES_LIST_ATTRIBUTE = "data-sw-dropzone-files-list";
const DROPZONE_DISABLED_ATTRIBUTE = "data-disabled";
const DROPZONE_DRAG_ACTIVE_ATTRIBUTE = "data-drag-active";
const DROPZONE_HAS_FILES_ATTRIBUTE = "data-has-files";
const DROPZONE_IS_UPLOADING_ATTRIBUTE = "data-is-uploading";

const FILE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>`;

const instances = new WeakMap<HTMLElement, DropzoneController>();

registerFieldControlBridge({
  kind: "dropzone",
  connect(control, { disabled, name, shouldSyncName }) {
    const dropzone = createDropzone(control, { disabled });
    dropzone.setDisabled(disabled);
    if (shouldSyncName) {
      dropzone.input.name = name ?? "";
    }
  },
});

export function createDropzone(root: HTMLElement, options: DropzoneOptions = {}): DropzoneInstance {
  assertHTMLElement(root, "createDropzone root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new DropzoneController(root, options);
  instances.set(root, instance);
  return instance;
}

class DropzoneController implements DropzoneInstance {
  readonly input: HTMLInputElement;
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly elements: DropzoneElements;
  private readonly managesTabIndex: boolean;
  private readonly onFilesChange?: (files: File[], details: DropzoneFilesChangeDetails) => void;
  private readonly subscribers = new Set<(details: DropzoneFilesChangeDetails) => void>();
  private disabled: boolean;
  private dragActive = false;
  private files: File[] = [];
  private isUploading: boolean;
  private mutationObserver: MutationObserver | null = null;
  private suppressNextInputChange = false;
  private destroyed = false;

  constructor(root: HTMLElement, options: DropzoneOptions) {
    this.root = root;
    this.root.setAttribute(DROPZONE_ROOT_ATTRIBUTE, "");
    this.elements = getDropzoneElements(root);
    this.input = this.elements.input;
    this.disabled = options.disabled ?? readBooleanAttribute(root, DROPZONE_DISABLED_ATTRIBUTE);
    this.isUploading =
      options.isUploading ?? readBooleanAttribute(root, DROPZONE_IS_UPLOADING_ATTRIBUTE, false);
    this.managesTabIndex = !root.hasAttribute("tabindex");
    this.onFilesChange = options.onFilesChange;
    this.files = Array.from(this.input.files ?? []);

    this.setupInput();
    this.bindEvents();
    this.observeAttributes();
    this.render();
  }

  clearFiles(options: DropzoneSetFilesOptions = {}): void {
    this.setFiles([], options);
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.mutationObserver?.disconnect();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getFiles(): File[] {
    return [...this.files];
  }

  getUploading(): boolean {
    return this.isUploading;
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setFiles(files: File[] | FileList, options: DropzoneSetFilesOptions = {}): void {
    this.requestFiles(
      {
        files: normalizeFiles(files),
        reason: "imperative-action",
        trigger: this.root,
      },
      options,
    );
  }

  setUploading(isUploading: boolean): void {
    if (this.isUploading === isUploading) {
      this.render();
      return;
    }

    this.isUploading = isUploading;
    this.render();
  }

  subscribe(
    event: "filesChange",
    callback: (details: DropzoneFilesChangeDetails) => void,
  ): () => void {
    if (event !== "filesChange") {
      throw new Error(`Unsupported Dropzone event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private setupInput(): void {
    this.input.type = "file";
    this.input.tabIndex = -1;
    this.input.setAttribute(DROPZONE_INPUT_ATTRIBUTE, "");
    this.input.setAttribute("aria-hidden", "true");
    applyVisuallyHiddenStyles(this.input);

    const inputId =
      this.root.id && this.root instanceof HTMLLabelElement
        ? `${this.root.id}-input`
        : ensureId(this.input, "sw-dropzone-input");
    this.input.id = inputId;

    if (this.root instanceof HTMLLabelElement) {
      this.root.htmlFor = inputId;
    }
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleRootClick, { signal });
    this.root.addEventListener("dragenter", this.handleDragEnter, { signal });
    this.root.addEventListener("dragover", this.handleDragOver, { signal });
    this.root.addEventListener("dragleave", this.handleDragLeave, { signal });
    this.root.addEventListener("drop", this.handleDrop, { signal });
    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.input.addEventListener("change", this.handleInputChange, { signal });

    const form = this.input.form ?? this.root.closest("form");
    form?.addEventListener("reset", this.handleFormReset, { signal });
  }

  private observeAttributes(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== "attributes") return;

        if (mutation.attributeName === DROPZONE_IS_UPLOADING_ATTRIBUTE) {
          const isUploading = readBooleanAttribute(
            this.root,
            DROPZONE_IS_UPLOADING_ATTRIBUTE,
            false,
          );
          if (isUploading !== this.isUploading) {
            this.isUploading = isUploading;
            this.render();
          }
        }

        if (mutation.attributeName === DROPZONE_DISABLED_ATTRIBUTE) {
          const disabled = readBooleanAttribute(this.root, DROPZONE_DISABLED_ATTRIBUTE);
          if (disabled !== this.disabled) {
            this.disabled = disabled;
            this.render();
          }
        }
      });
    });

    this.mutationObserver.observe(this.root, {
      attributeFilter: [DROPZONE_DISABLED_ATTRIBUTE, DROPZONE_IS_UPLOADING_ATTRIBUTE],
      attributes: true,
    });
  }

  private requestFiles(request: FilesRequest, options: DropzoneSetFilesOptions = {}): void {
    if (this.disabled && request.reason !== "imperative-action") return;

    const previousFiles = this.files;
    this.files = request.files;
    this.writeInputFiles(request.files);
    this.render();

    if (options.emit === false || sameFiles(previousFiles, request.files)) return;

    const details: DropzoneFilesChangeDetails = {
      event: request.event,
      files: [...request.files],
      previousFiles,
      reason: request.reason,
      trigger: request.trigger,
    };

    dispatchCustomEvent(this.root, "starwind:files-change", details);
    this.onFilesChange?.(details.files, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }

  private render(): void {
    const hasFiles = this.files.length > 0;

    this.root.setAttribute(DROPZONE_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "button");
    this.root.setAttribute("aria-disabled", this.disabled ? "true" : "false");
    this.root.setAttribute(DROPZONE_DRAG_ACTIVE_ATTRIBUTE, String(this.dragActive));
    this.root.setAttribute(DROPZONE_HAS_FILES_ATTRIBUTE, String(hasFiles));
    this.root.setAttribute(DROPZONE_IS_UPLOADING_ATTRIBUTE, String(this.isUploading));

    if (this.managesTabIndex) {
      this.root.tabIndex = this.disabled ? -1 : 0;
    }

    setBooleanAttribute(this.root, DROPZONE_DISABLED_ATTRIBUTE, this.disabled);

    this.input.disabled = this.disabled;
    this.input.setAttribute(DROPZONE_INPUT_ATTRIBUTE, "");

    this.renderIndicators();
    this.renderFilesList();
  }

  private renderIndicators(): void {
    if (this.elements.uploadIndicator) {
      setBooleanAttribute(this.elements.uploadIndicator, "hidden", this.isUploading);
      this.elements.uploadIndicator.classList.toggle("hidden", this.isUploading);
    }

    if (this.elements.loadingIndicator) {
      setBooleanAttribute(this.elements.loadingIndicator, "hidden", !this.isUploading);
      this.elements.loadingIndicator.classList.toggle("hidden", !this.isUploading);
    }

    [this.elements.uploadIndicator, this.elements.loadingIndicator].forEach((element) => {
      element?.setAttribute(DROPZONE_IS_UPLOADING_ATTRIBUTE, String(this.isUploading));
    });
  }

  private renderFilesList(): void {
    const { filesList } = this.elements;
    if (!filesList) return;

    const hasFiles = this.files.length > 0;
    filesList.setAttribute(DROPZONE_HAS_FILES_ATTRIBUTE, String(hasFiles));
    filesList.classList.toggle("invisible", !hasFiles);
    filesList.replaceChildren();

    this.files.forEach((file) => {
      const fileItem = document.createElement("div");
      fileItem.innerHTML = FILE_ICON_SVG;

      const fileText = document.createElement("span");
      fileText.textContent = file.name;

      fileItem.append(fileText);
      filesList.append(fileItem);
    });
  }

  private writeInputFiles(files: File[]): void {
    try {
      const transfer = new DataTransfer();
      files.forEach((file) => transfer.items.add(file));
      this.input.files = transfer.files;
    } catch {
      if (files.length === 0) {
        this.input.value = "";
      }
    }
  }

  private readonly handleRootClick = (event: MouseEvent): void => {
    if (event.target === this.input) return;

    if (this.disabled) {
      event.preventDefault();
      return;
    }

    if (this.root instanceof HTMLLabelElement) return;

    event.preventDefault();
    this.input.click();
  };

  private readonly handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    if (this.disabled) return;

    this.dragActive = true;
    this.render();
  };

  private readonly handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (this.disabled) return;

    this.dragActive = true;
    this.render();
  };

  private readonly handleDragLeave = (event: DragEvent): void => {
    if (this.disabled) return;

    if (event.relatedTarget instanceof Node && this.root.contains(event.relatedTarget)) return;

    this.dragActive = false;
    this.render();
  };

  private readonly handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    this.dragActive = false;

    if (this.disabled) {
      this.render();
      return;
    }

    const files = constrainFilesForInput(
      normalizeFiles(event.dataTransfer?.files ?? []),
      this.input,
    );
    if (files.length === 0) {
      this.render();
      return;
    }

    this.suppressNextInputChange = true;
    this.requestFiles({
      event,
      files,
      reason: "drop",
      trigger: this.root,
    });
    this.input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  private readonly handleInputChange = (event: Event): void => {
    if (this.suppressNextInputChange) {
      this.suppressNextInputChange = false;
      return;
    }

    this.requestFiles({
      event,
      files: normalizeFiles(this.input.files ?? []),
      reason: "input-change",
      trigger: this.input,
    });
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this.root) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    if (this.disabled) return;

    this.input.click();
  };

  private readonly handleFormReset = (): void => {
    setTimeout(() => {
      if (this.destroyed) return;
      this.clearFiles({ emit: false });
    }, 0);
  };
}

function getDropzoneElements(root: HTMLElement): DropzoneElements {
  return {
    filesList: queryOwnedElement(root, `[${DROPZONE_FILES_LIST_ATTRIBUTE}]`),
    input: getOrCreateInput(root),
    loadingIndicator: queryOwnedElement(root, `[${DROPZONE_LOADING_INDICATOR_ATTRIBUTE}]`),
    uploadIndicator: queryOwnedElement(root, `[${DROPZONE_UPLOAD_INDICATOR_ATTRIBUTE}]`),
  };
}

function getOrCreateInput(root: HTMLElement): HTMLInputElement {
  const existing = queryOwnedElement(root, `[${DROPZONE_INPUT_ATTRIBUTE}]`);
  if (existing instanceof HTMLInputElement) return existing;

  const fallback = root.querySelector<HTMLInputElement>('input[type="file"]');
  if (fallback && isOwnedByRoot(fallback, root)) {
    fallback.setAttribute(DROPZONE_INPUT_ATTRIBUTE, "");
    return fallback;
  }

  const input = document.createElement("input");
  input.setAttribute(DROPZONE_INPUT_ATTRIBUTE, "");
  root.append(input);
  return input;
}

function queryOwnedElement(root: HTMLElement, selector: string): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find((element) =>
      isOwnedByRoot(element, root),
    ) ?? null
  );
}

function isOwnedByRoot(element: Element, root: HTMLElement): boolean {
  return element.closest(`[${DROPZONE_ROOT_ATTRIBUTE}]`) === root;
}

function normalizeFiles(files: File[] | FileList | readonly File[]): File[] {
  return Array.from(files);
}

function constrainFilesForInput(files: File[], input: HTMLInputElement): File[] {
  const acceptedFiles = filterAcceptedFiles(files, input.accept);

  return input.multiple ? acceptedFiles : acceptedFiles.slice(0, 1);
}

function filterAcceptedFiles(files: File[], accept: string): File[] {
  const matchers = parseAcceptMatchers(accept);
  if (matchers.length === 0) return files;

  return files.filter((file) => matchers.some((matcher) => matcher(file)));
}

function parseAcceptMatchers(accept: string): Array<(file: File) => boolean> {
  return accept
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((token) => {
      if (token.startsWith(".")) {
        return (file: File) => file.name.toLowerCase().endsWith(token);
      }

      if (token.endsWith("/*")) {
        const mimePrefix = token.slice(0, -1);

        return (file: File) => file.type.toLowerCase().startsWith(mimePrefix);
      }

      return (file: File) => file.type.toLowerCase() === token;
    });
}

function sameFiles(left: File[], right: File[]): boolean {
  if (left.length !== right.length) return false;

  return left.every((file, index) => file === right[index]);
}

function applyVisuallyHiddenStyles(input: HTMLInputElement): void {
  input.style.position = "absolute";
  input.style.width = "1px";
  input.style.height = "1px";
  input.style.margin = "-1px";
  input.style.overflow = "hidden";
  input.style.clip = "rect(0 0 0 0)";
  input.style.whiteSpace = "nowrap";
  input.style.border = "0";
}
