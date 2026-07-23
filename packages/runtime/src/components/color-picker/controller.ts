import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { attachFormValueRevision } from "../../internal/form-value-revision";
import {
  COLOR_PICKER_FORMATS,
  parseColor,
  type ColorPickerColor,
  type ColorPickerFormat,
} from "./color-picker";
import {
  COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE,
  createColorPickerInitialState,
  normalizeColorPickerCapabilityValue,
  normalizeColorPickerValue,
  projectColorPickerChannel,
  projectColorPickerInitialPart,
  serializeColorPickerValue,
  snapColorPickerChannelValue,
  stepColorPickerHue,
  type ColorPickerInitialPartProjection,
  type ColorPickerInitialState,
} from "./initial-state";

export type ColorPickerValue = string | ColorPickerColor | null;
export type ColorPickerDirection = "ltr" | "rtl";
export type ColorPickerChannel =
  | "hue"
  | "saturation"
  | "brightness"
  | "lightness"
  | "red"
  | "green"
  | "blue"
  | "alpha";
export type ColorPickerValueChangeReason =
  | "area-drag"
  | "channel-drag"
  | "channel-input"
  | "value-input"
  | "swatch-press"
  | "eye-dropper"
  | "clear-press"
  | "keyboard"
  | "imperative-action";

export type ColorPickerValueChangeDetails = {
  readonly value: ColorPickerColor | null;
  readonly valueAsString: string;
  readonly previousValue: ColorPickerColor | null;
  readonly previousValueAsString: string;
  readonly format: ColorPickerFormat;
  readonly reason: ColorPickerValueChangeReason;
  readonly trigger?: Element;
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  cancel(): void;
  allowPropagation(): void;
};
export type ColorPickerValueCommitDetails = Omit<
  ColorPickerValueChangeDetails,
  "cancel" | "allowPropagation" | "isCanceled" | "isPropagationAllowed"
>;
export type ColorPickerFormatChangeDetails = {
  readonly previousFormat: ColorPickerFormat;
  readonly format: ColorPickerFormat;
  readonly reason: "imperative-action";
  readonly trigger?: Element;
  readonly event?: Event;
};

export type ColorPickerOptions = {
  value?: ColorPickerValue;
  defaultValue?: ColorPickerValue;
  format?: ColorPickerFormat;
  alpha?: boolean;
  allowEmpty?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  required?: boolean;
  locale?: string;
  dir?: ColorPickerDirection;
  getAriaValueText?: (
    channel: ColorPickerChannel,
    value: number,
    color: ColorPickerColor,
  ) => string;
  getAreaRoleDescription?: (locale?: string) => string;
  getColorDescription?: (color: ColorPickerColor | null) => string;
  onValueChange?: (value: ColorPickerColor | null, details: ColorPickerValueChangeDetails) => void;
  onValueCommitted?: (
    value: ColorPickerColor | null,
    details: ColorPickerValueCommitDetails,
  ) => void;
  onFormatChange?: (format: ColorPickerFormat, details: ColorPickerFormatChangeDetails) => void;
};
export type ColorPickerSetValueOptions = {
  emit?: boolean;
  commit?: boolean;
  event?: Event;
  trigger?: Element;
  reason?: ColorPickerValueChangeReason;
};
export type ColorPickerSetOptions = Omit<
  Partial<
    Pick<
      ColorPickerOptions,
      | "alpha"
      | "allowEmpty"
      | "dir"
      | "getAreaRoleDescription"
      | "getAriaValueText"
      | "getColorDescription"
      | "locale"
      | "form"
      | "required"
    >
  >,
  "dir" | "form" | "locale"
> & {
  dir?: ColorPickerDirection | null;
  form?: string | null;
  locale?: string | null;
};
export type ColorPickerInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  refresh(options?: { preserveState?: boolean }): void;
  getValue(): ColorPickerColor | null;
  getValueAsString(): string;
  getFormat(): ColorPickerFormat;
  setValue(value: ColorPickerValue, options?: ColorPickerSetValueOptions): void;
  setFormat(
    format: ColorPickerFormat,
    options?: { emit?: boolean; event?: Event; trigger?: Element },
  ): void;
  setDisabled(disabled: boolean): void;
  setReadOnly(readOnly: boolean): void;
  setName(name?: string | null): void;
  setOptions(options: ColorPickerSetOptions): void;
  subscribe(
    event: "valueChange",
    callback: (details: ColorPickerValueChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "valueCommitted",
    callback: (details: ColorPickerValueCommitDetails) => void,
  ): () => void;
  subscribe(
    event: "formatChange",
    callback: (details: ColorPickerFormatChangeDetails) => void,
  ): () => void;
};

type Channel = ColorPickerChannel;
type InteractionSession = {
  start: ColorPickerColor | null;
  editingStart: ColorPickerColor;
  proposed: ColorPickerColor | null;
  pending: ColorPickerColor | null | undefined;
  changed: boolean;
  generation: number;
  revisionSource?: object;
};
type PointerSession = InteractionSession & {
  pointerId: number;
  reason: ColorPickerValueChangeReason;
  trigger: HTMLElement;
  configuration: string;
  event?: Event;
  abort: AbortController;
};
type NativeSession = InteractionSession & {
  input: HTMLInputElement;
  configuration: string;
};
type ProposalOutcome =
  | { status: "unchanged"; value: ColorPickerColor | null }
  | { status: "canceled" }
  | { status: "superseded" }
  | {
      status: "accepted";
      value: ColorPickerColor | null;
      previous: ColorPickerColor | null;
      revisionSource: object;
    };
type ValidityAttributeSnapshot = Readonly<{
  ariaInvalid: string | null;
  dataInvalid: string | null;
}>;
const instances = new WeakMap<HTMLElement, ColorPickerController>();

export function createColorPicker(
  root: HTMLElement,
  options: ColorPickerOptions = {},
): ColorPickerInstance {
  assertHTMLElement(root, "createColorPicker root");
  const existing = instances.get(root);
  if (existing) return existing;
  const controller = new ColorPickerController(root, options);
  instances.set(root, controller);
  return controller;
}

class ColorPickerController implements ColorPickerInstance {
  readonly root: HTMLElement;
  private abort = new AbortController();
  private controlled: boolean;
  private value: ColorPickerColor | null;
  private editingValue: ColorPickerColor;
  private format: ColorPickerFormat;
  private disabled: boolean;
  private readOnly: boolean;
  private name?: string;
  private form?: string;
  private required: boolean;
  private alpha: boolean;
  private allowEmpty: boolean;
  private locale?: string;
  private dir: ColorPickerDirection;
  private reflectedDir?: ColorPickerDirection;
  private options: ColorPickerOptions;
  private ambientRevision = 0;
  private proposalSequence = 0;
  private destroyed = false;
  private pointer?: PointerSession;
  private nativeSession?: NativeSession;
  private drafts = new Map<HTMLInputElement, string>();
  private draftValiditySnapshots = new Map<HTMLInputElement, ValidityAttributeSnapshot>();
  private draftConfigurations = new WeakMap<HTMLInputElement, string>();
  private interactionElementIds = new WeakMap<Element, number>();
  private nextInteractionElementId = 1;
  private resetForm: HTMLFormElement | null = null;
  private resetTimer: number | undefined;
  private formProxyValiditySnapshots = new Map<HTMLElement, ValidityAttributeSnapshot>();
  private initialValidityOwnership = new WeakMap<HTMLElement, ValidityAttributeSnapshot>();
  private eyeDropperGeneration = 0;
  private authoredSwatchDisabled = new WeakMap<HTMLButtonElement, boolean>();
  private runtimeSwatchDisabled = new WeakMap<HTMLButtonElement, boolean>();
  private readonly initialValue: ColorPickerColor | null;
  private readonly initialFormat: ColorPickerFormat;
  private authoredAreaRoleDescriptions = new Set<HTMLInputElement>();
  private runtimeAreaRoleDescriptions = new Map<HTMLInputElement, string>();
  private initialProjectionOwnership = new WeakMap<HTMLElement, Set<string>>();
  private subscribers = {
    valueChange: new Set<(d: ColorPickerValueChangeDetails) => void>(),
    valueCommitted: new Set<(d: ColorPickerValueCommitDetails) => void>(),
    formatChange: new Set<(d: ColorPickerFormatChangeDetails) => void>(),
  };

  constructor(root: HTMLElement, options: ColorPickerOptions) {
    this.root = root;
    this.options = { ...options };
    this.captureInitialProjectionOwnership();
    this.controlled = Object.hasOwn(options, "value");
    this.alpha =
      options.alpha ??
      (this.hasInitialProjectionOwnership(root, "a:data-alpha")
        ? root.hasAttribute("data-alpha")
        : readBooleanAttribute(root, "data-alpha", true));
    this.allowEmpty = options.allowEmpty ?? readBooleanAttribute(root, "data-allow-empty");
    this.disabled = options.disabled ?? readBooleanAttribute(root, "data-disabled");
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, "data-readonly");
    this.name = options.name ?? root.getAttribute("data-name") ?? undefined;
    this.form = options.form ?? root.getAttribute("data-form") ?? undefined;
    this.required = options.required ?? readBooleanAttribute(root, "data-required");
    this.locale = options.locale ?? root.getAttribute("data-locale") ?? undefined;
    this.dir = options.dir ?? readDirectionAttribute(root) ?? inheritedDirection(root);
    this.reflectedDir = this.dir;
    this.format = validFormat(options.format ?? root.getAttribute("data-format")) ?? "hex";
    const initialValue = Object.hasOwn(options, "value")
      ? options.value
      : Object.hasOwn(options, "defaultValue")
        ? options.defaultValue
        : root.hasAttribute("data-value")
          ? root.getAttribute("data-value")
          : "#000000";
    const parsedInitialValue = this.parse(initialValue);
    this.value =
      parsedInitialValue === undefined
        ? this.normalizeForCapability(parseColor("#000000")!)
        : parsedInitialValue;
    this.editingValue = this.value ?? this.normalizeForCapability(parseColor("#000000")!)!;
    this.initialValue = this.value;
    this.initialFormat = this.format;
    this.bind();
    this.render();
  }
  destroy() {
    if (this.destroyed) return;
    this.cancelInteractions();
    this.invalidateEyeDropper();
    this.clearResetTimer();
    this.abort.abort();
    this.cleanupAreaRoleDescriptions();
    this.detachFormReset();
    this.clearDrafts();
    Object.values(this.subscribers).forEach((set) => set.clear());
    instances.delete(this.root);
    this.destroyed = true;
  }
  refresh(options: { preserveState?: boolean } = {}) {
    if (this.destroyed) return;
    if (options.preserveState) {
      this.reconcilePreservedStructureState();
    } else {
      this.cancelInteractions();
      this.invalidateEyeDropper();
      this.clearResetTimer();
      this.clearDrafts();
    }
    this.abort.abort();
    this.abort = new AbortController();
    this.captureInitialProjectionOwnership();
    this.bind();
    this.render();
  }
  getValue() {
    return this.value;
  }
  getValueAsString() {
    return this.stringify(this.value);
  }
  getFormat() {
    return this.format;
  }
  setValue(value: ColorPickerValue, options: ColorPickerSetValueOptions = {}) {
    if (this.destroyed) return;
    this.invalidateEyeDropper();
    const parsed = this.parse(value);
    if (parsed === undefined) return;
    if (options.emit === false) {
      this.replaceAmbient(parsed);
      this.render();
      return;
    }
    if (this.pointer || this.nativeSession) this.cancelInteractions();
    this.propose(parsed, {
      reason: options.reason ?? "imperative-action",
      trigger: options.trigger,
      event: options.event,
      commit: options.commit ?? true,
    });
  }
  setFormat(
    format: ColorPickerFormat,
    options: { emit?: boolean; event?: Event; trigger?: Element } = {},
  ) {
    if (this.destroyed) return;
    if (!validFormat(format)) return;
    if (format === this.format) return;
    this.invalidateEyeDropper();
    this.cancelInteractions();
    this.clearDrafts();
    const previousFormat = this.format;
    this.format = format;
    this.render();
    if (options.emit === false) return;
    const details = {
      previousFormat,
      format,
      reason: "imperative-action" as const,
      trigger: options.trigger,
      event: options.event,
    };
    dispatchCustomEvent(this.root, "starwind:format-change", details);
    this.options.onFormatChange?.(format, details);
    this.subscribers.formatChange.forEach((fn) => fn(details));
  }
  setDisabled(value: boolean) {
    if (this.destroyed) return;
    if (value) {
      this.cancelInteractions();
      this.invalidateEyeDropper();
    }
    this.disabled = value;
    this.render();
  }
  setReadOnly(value: boolean) {
    if (this.destroyed) return;
    if (value) {
      this.cancelInteractions();
      this.invalidateEyeDropper();
    }
    this.readOnly = value;
    this.render();
  }
  setName(value?: string | null) {
    if (this.destroyed) return;
    this.name =
      value === null ? undefined : (value ?? this.root.getAttribute("data-name") ?? undefined);
    this.render();
  }
  setOptions(options: ColorPickerSetOptions) {
    if (this.destroyed) return;
    if (options.alpha !== undefined && options.alpha !== this.alpha) {
      this.invalidateEyeDropper();
      this.alpha = options.alpha;
      this.clearDrafts();
      this.editingValue = this.normalizeForCapability(this.editingValue)!;
      this.replaceAmbient(this.value);
    }
    if (options.allowEmpty !== undefined && options.allowEmpty !== this.allowEmpty) {
      this.allowEmpty = options.allowEmpty;
      if (!this.allowEmpty && this.value === null) {
        this.cancelInteractions();
        this.clearDrafts();
        this.replaceAmbient(
          normalizeColorPickerCapabilityValue(null, {
            alpha: this.alpha,
            allowEmpty: this.allowEmpty,
          }),
        );
      }
    }
    if (Object.hasOwn(options, "locale") && options.locale !== undefined)
      this.locale = options.locale ?? undefined;
    if (Object.hasOwn(options, "form") && options.form !== undefined)
      this.form = options.form ?? undefined;
    if (options.required !== undefined) this.required = options.required;
    if (Object.hasOwn(options, "dir") && options.dir !== undefined) {
      if (options.dir === null) {
        this.reflectedDir = undefined;
        this.root.removeAttribute("dir");
        this.dir = inheritedDirection(this.root);
      } else {
        this.reflectedDir = options.dir;
        this.dir = options.dir;
      }
    }
    if (Object.hasOwn(options, "getAriaValueText"))
      this.options.getAriaValueText = options.getAriaValueText;
    if (Object.hasOwn(options, "getAreaRoleDescription"))
      this.options.getAreaRoleDescription = options.getAreaRoleDescription;
    if (Object.hasOwn(options, "getColorDescription"))
      this.options.getColorDescription = options.getColorDescription;
    this.render();
  }
  subscribe(event: keyof typeof this.subscribers, callback: (details: never) => void) {
    if (this.destroyed) return () => {};
    const set = this.subscribers[event] as Set<(details: never) => void>;
    set.add(callback);
    return () => set.delete(callback);
  }

  private owns(element: Element | null): element is Element {
    return element?.closest<HTMLElement>("[data-sw-color-picker]") === this.root;
  }
  private closestOwned<T extends Element>(element: Element, selector: string): T | null {
    const candidate = element.closest<T>(selector);
    return candidate && this.owns(candidate) ? candidate : null;
  }
  private queryOwnedAll<T extends Element>(selector: string, scope: ParentNode = this.root): T[] {
    return [...scope.querySelectorAll<T>(selector)].filter((element) => this.owns(element));
  }
  private queryOwned<T extends Element>(selector: string, scope: ParentNode = this.root): T | null {
    return this.queryOwnedAll<T>(selector, scope)[0] ?? null;
  }

  private queryOwnedFormatSelectRoots(): HTMLElement[] {
    const roots = new Set<HTMLElement>();
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-format-control]").forEach((control) => {
      const candidates = [
        ...(control.matches("[data-sw-select]") ? [control] : []),
        ...control.querySelectorAll<HTMLElement>("[data-sw-select]"),
      ];
      candidates.forEach((candidate) => {
        if (
          this.owns(candidate) &&
          candidate.closest<HTMLElement>("[data-sw-color-picker-format-control]") === control
        ) {
          roots.add(candidate);
        }
      });
    });
    return [...roots];
  }

  private compositeFormatChange(event: Event, selectRoot: HTMLElement) {
    event.stopPropagation();
    if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== "object") {
      return;
    }
    const detail = event.detail as {
      event?: Event;
      isCanceled?: boolean;
      item?: HTMLElement;
      value?: unknown;
    };
    const format = validFormat(detail.value);
    if (!format) return;

    this.root.ownerDocument.defaultView?.queueMicrotask(() => {
      if (event.defaultPrevented || detail.isCanceled || this.disabled || this.readOnly) {
        this.render();
        return;
      }
      this.setFormat(format, {
        event: detail.event ?? event,
        trigger: detail.item ?? selectRoot,
      });
    });
  }

  private dispatchSelectCommand(
    selectRoot: HTMLElement,
    type: string,
    detail: Record<string, unknown>,
  ) {
    const CustomEventConstructor = this.root.ownerDocument.defaultView?.CustomEvent;
    if (!CustomEventConstructor) return;
    selectRoot.dispatchEvent(new CustomEventConstructor(type, { detail }));
  }

  private bind() {
    const signal = this.abort.signal;
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-area]").forEach((area) => {
      area.addEventListener("pointerdown", (e) => this.pointerDown(e, area, "area-drag"), {
        signal,
      });
    });
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-channel-slider]").forEach((slider) =>
      slider.addEventListener("pointerdown", (e) => this.pointerDown(e, slider, "channel-drag"), {
        signal,
      }),
    );
    this.queryOwnedAll<HTMLInputElement>(
      "[data-sw-color-picker-area-input], [data-sw-color-picker-channel-input]",
    ).forEach((input) => {
      if (input.hasAttribute("data-sw-color-picker-area-input"))
        this.classifyAreaRoleDescription(input);
      input.addEventListener("keydown", (e) => this.keydown(e, input), { signal });
      input.addEventListener("input", (e) => this.nativeInput(e, input), { signal });
      input.addEventListener("change", (e) => this.nativeCommit(e, input), { signal });
      input.addEventListener("focus", () => this.render(), { signal });
      input.addEventListener("blur", () => this.render(), { signal });
    });
    this.queryOwnedAll<HTMLInputElement>(
      "[data-sw-color-picker-value-input], [data-sw-color-picker-channel-field]",
    ).forEach((input) => {
      input.addEventListener("input", (event) => this.editDraft(event, input), { signal });
      input.addEventListener("change", (event) => this.commitDraft(event, input), { signal });
      input.addEventListener("blur", (event) => this.commitDraft(event, input), { signal });
      input.addEventListener("keydown", (event) => this.draftKeydown(event, input), { signal });
    });
    this.queryOwnedAll<HTMLSelectElement>("[data-sw-color-picker-format-select]").forEach(
      (select) =>
        select.addEventListener(
          "change",
          (event) => {
            if (this.disabled || this.readOnly) return this.render();
            this.setFormat(select.value as ColorPickerFormat, { event, trigger: select });
          },
          { signal },
        ),
    );
    this.queryOwnedFormatSelectRoots().forEach((selectRoot) => {
      selectRoot.addEventListener(
        "starwind:value-change",
        (event) => this.compositeFormatChange(event, selectRoot),
        { signal },
      );
    });
    this.queryOwnedAll<HTMLButtonElement>("[data-sw-color-picker-swatch]").forEach((swatch) =>
      swatch.addEventListener("click", (event) => this.activateSwatch(event, swatch), { signal }),
    );
    this.queryOwnedAll<HTMLButtonElement>("[data-sw-color-picker-clear]").forEach((button) =>
      button.addEventListener("click", (event) => this.clear(event, button), { signal }),
    );
    this.queryOwnedAll<HTMLButtonElement>("[data-sw-color-picker-eye-dropper]").forEach((button) =>
      button.addEventListener("click", (event) => void this.openEyeDropper(event, button), {
        signal,
      }),
    );
  }

  private editDraft(event: Event, input: HTMLInputElement) {
    if (this.disabled || this.readOnly) return this.render();
    if (!this.draftValiditySnapshots.has(input)) {
      this.draftValiditySnapshots.set(
        input,
        this.formProxyValiditySnapshots.get(input) ?? {
          ariaInvalid: input.getAttribute("aria-invalid"),
          dataInvalid: input.getAttribute("data-invalid"),
        },
      );
    }
    this.drafts.set(input, input.value);
    this.draftConfigurations.set(input, this.draftConfiguration(input));
    const parsed = this.parseDraft(input);
    setBooleanAttribute(input, "data-invalid", parsed === undefined);
    input.setAttribute("aria-invalid", parsed === undefined ? "true" : "false");
    void event;
  }
  private commitDraft(event: Event, input: HTMLInputElement) {
    if (!this.drafts.has(input)) return;
    if (this.disabled || this.readOnly) return this.restoreDraft(input);
    const parsed = this.parseDraft(input);
    if (parsed === undefined) return this.restoreDraft(input);
    this.clearDraft(input);
    this.propose(parsed, {
      reason: input.hasAttribute("data-sw-color-picker-value-input")
        ? "value-input"
        : "channel-input",
      trigger: input,
      event,
      commit: true,
    });
  }
  private draftKeydown(event: KeyboardEvent, input: HTMLInputElement) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.restoreDraft(input);
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.commitDraft(event, input);
    }
  }
  private parseDraft(input: HTMLInputElement): ColorPickerColor | undefined {
    if (input.hasAttribute("data-sw-color-picker-value-input"))
      return this.normalizeForCapability(parseColor(input.value)) ?? undefined;
    const editingValue = this.value ?? this.editingValue;
    const channel = readChannel(input);
    if (channel === "alpha" && !this.alpha) return undefined;
    const normalized = input.value.trim().replace(",", ".");
    if (normalized === "") return undefined;
    const value = Number(normalized);
    if (!Number.isFinite(value)) return undefined;
    return updateChannel(editingValue, channel, value);
  }
  private restoreDraft(input: HTMLInputElement) {
    this.clearDraft(input);
    this.render();
  }
  private restoreDraftValidity(input: HTMLInputElement) {
    const snapshot = this.draftValiditySnapshots.get(input);
    if (!snapshot) return;
    restoreAttribute(input, "data-invalid", snapshot.dataInvalid);
    restoreAttribute(input, "aria-invalid", snapshot.ariaInvalid);
    this.draftValiditySnapshots.delete(input);
  }
  private clearDraft(input: HTMLInputElement, options: { restore?: boolean } = {}) {
    if (options.restore ?? true) this.restoreDraftValidity(input);
    else this.draftValiditySnapshots.delete(input);
    this.drafts.delete(input);
    this.draftConfigurations.delete(input);
  }
  private clearDrafts(options: { restore?: boolean } = {}) {
    for (const input of this.draftValiditySnapshots.keys())
      this.clearDraft(input, {
        restore: (options.restore ?? true) && this.isConnectedOwned(input),
      });
    this.drafts.clear();
  }
  private activateSwatch(event: Event, swatch: HTMLButtonElement) {
    if (this.disabled || this.readOnly || swatch.disabled) return;
    const value = swatch.getAttribute("data-value") ?? swatch.value;
    const parsed = this.parse(value);
    if (parsed !== undefined)
      this.propose(parsed, { reason: "swatch-press", trigger: swatch, event, commit: true });
  }
  private clear(event: Event, button: HTMLButtonElement) {
    if (this.disabled || this.readOnly || !this.allowEmpty) return;
    this.propose(null, { reason: "clear-press", trigger: button, event, commit: true });
  }
  private async openEyeDropper(event: Event, button: HTMLButtonElement) {
    if (this.disabled || this.readOnly) return;
    const ownerWindow = this.root.ownerDocument.defaultView as
      | (Window & { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } })
      | null;
    if (!ownerWindow?.isSecureContext || !ownerWindow.EyeDropper) return;
    const generation = ++this.eyeDropperGeneration;
    try {
      const result = await new ownerWindow.EyeDropper().open();
      if (
        generation !== this.eyeDropperGeneration ||
        this.destroyed ||
        this.disabled ||
        this.readOnly
      )
        return;
      const sampled = parseColor(result.sRGBHex);
      if (!sampled) return;
      const value = this.alpha
        ? this.value
          ? sampled.withChannels("rgb", { alpha: this.value.alpha })
          : sampled
        : this.normalizeForCapability(sampled);
      this.propose(value, { reason: "eye-dropper", trigger: button, event, commit: true });
    } catch {}
  }
  private invalidateEyeDropper() {
    this.eyeDropperGeneration += 1;
  }
  private pointerDown(
    event: PointerEvent,
    target: HTMLElement,
    reason: ColorPickerValueChangeReason,
  ) {
    if (!this.owns(event.target instanceof Element ? event.target : null)) return;
    if (this.disabled || event.button !== 0) return;
    const configuration = this.pointerConfiguration(target, reason);
    if (configuration === undefined) return;
    const focusTarget = this.pointerFocusTarget(target, reason);
    focusTarget?.focus({ preventScroll: true });
    this.render();
    event.preventDefault();
    if (this.readOnly) return;
    this.endPointer(false);
    this.cancelNativeSession();
    const editingValue = this.value ?? this.editingValue;
    const pointerAbort = new AbortController();
    this.pointer = {
      pointerId: event.pointerId,
      start: this.value,
      editingStart: editingValue,
      proposed: editingValue,
      pending: undefined,
      changed: false,
      generation: 0,
      reason,
      trigger: target,
      configuration,
      event,
      abort: pointerAbort,
    };
    try {
      target.setPointerCapture?.(event.pointerId);
    } catch {}
    setBooleanAttribute(this.root, "data-dragging", true);
    setBooleanAttribute(target, "data-dragging", true);
    const move = (e: PointerEvent) => {
      if (e.pointerId !== this.pointer?.pointerId) return;
      if (e.buttons === 0 && e.type === "pointermove") {
        this.endPointer(true, e);
        return;
      }
      this.pointerValue(e, target, reason);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === this.pointer?.pointerId) this.endPointer(true, e);
    };
    const cancel = (e: PointerEvent) => {
      if (e.pointerId === this.pointer?.pointerId) this.endPointer(false, e);
    };
    const ownerDocument = this.root.ownerDocument;
    ownerDocument.addEventListener("pointermove", move, { signal: pointerAbort.signal });
    ownerDocument.addEventListener("pointerup", up, { signal: pointerAbort.signal });
    ownerDocument.addEventListener("pointercancel", cancel, { signal: pointerAbort.signal });
    this.pointerValue(event, target, reason);
  }
  private pointerFocusTarget(target: HTMLElement, reason: ColorPickerValueChangeReason) {
    if (reason === "channel-drag")
      return this.queryOwned<HTMLInputElement>("[data-sw-color-picker-channel-input]", target);
    const inputs = this.queryOwnedAll<HTMLInputElement>(
      "[data-sw-color-picker-area-input]",
      target,
    );
    const active = this.root.ownerDocument.activeElement;
    return (
      inputs.find((input) => input === active) ?? inputs.find((input) => input.dataset.axis === "x")
    );
  }
  private pointerValue(
    event: PointerEvent,
    target: HTMLElement,
    reason: ColorPickerValueChangeReason,
  ) {
    if (!this.pointer) return;
    const editingValue = this.value ?? this.editingValue;
    const rect = target.getBoundingClientRect();
    let x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
    if (this.dir === "rtl") x = 1 - x;
    let next: ColorPickerColor;
    if (reason === "area-drag") {
      const [xChannel, yChannel] = areaChannels(target);
      const xInput = this.queryOwned<HTMLInputElement>(
        '[data-sw-color-picker-area-input][data-axis="x"]',
        target,
      );
      const yInput = this.queryOwned<HTMLInputElement>(
        '[data-sw-color-picker-area-input][data-axis="y"]',
        target,
      );
      const { min: xMin, max: xMax } = projectChannel(editingValue, xChannel, xInput);
      const { min: yMin, max: yMax } = projectChannel(editingValue, yChannel, yInput);
      next = updateChannel(
        updateChannel(
          editingValue,
          xChannel,
          snapColorPickerChannelValue(
            xMin + x * (xMax - xMin),
            xChannel,
            readStep(xInput, xChannel),
          ),
        ),
        yChannel,
        snapColorPickerChannelValue(
          yMin + (1 - y) * (yMax - yMin),
          yChannel,
          readStep(yInput, yChannel),
        ),
      );
    } else {
      const channel = readChannel(target);
      const orientation = target.getAttribute("data-orientation") === "vertical";
      const ratio = orientation ? 1 - y : x;
      const channelInput = this.queryOwned<HTMLInputElement>(
        "[data-sw-color-picker-channel-input]",
        target,
      );
      const { min, max } = projectChannel(editingValue, channel, channelInput);
      next = updateChannel(
        editingValue,
        channel,
        snapColorPickerChannelValue(
          min + ratio * (max - min),
          channel,
          readStep(channelInput, channel),
        ),
      );
    }
    const session = this.pointer;
    session.pending = next;
    const generation = session.generation;
    const outcome = this.propose(next, { reason, trigger: target, event, commit: false });
    if (this.pointer !== session || session.generation !== generation) return;
    this.finalizeSessionProposal(session, outcome);
  }
  private endPointer(completed: boolean, event?: Event) {
    const session = this.pointer;
    if (!session) return;
    this.pointer = undefined;
    session.abort.abort();
    setBooleanAttribute(this.root, "data-dragging", false);
    setBooleanAttribute(session.trigger, "data-dragging", false);
    try {
      session.trigger.releasePointerCapture?.(session.pointerId);
    } catch {}
    const shouldCommit = completed && session.changed;
    if (!completed && !this.controlled) {
      this.replaceAmbient(session.start);
      this.editingValue = session.editingStart;
    }
    this.render();
    if (shouldCommit)
      this.commit(
        this.controlled ? session.proposed : this.value,
        session.start,
        session.reason,
        session.trigger,
        event ?? session.event,
        session.revisionSource,
      );
  }
  private cancelInteractions() {
    this.endPointer(false);
    this.cancelNativeSession();
  }
  private cancelNativeSession() {
    const session = this.nativeSession;
    if (!session) return;
    this.nativeSession = undefined;
    if (!this.controlled) {
      this.replaceAmbient(session.start);
      this.editingValue = session.editingStart;
      this.render();
    }
  }
  private reconcileActiveSession(value: ColorPickerColor | null) {
    if (this.pointer) this.reconcileSession(this.pointer, value);
    if (this.nativeSession) this.reconcileSession(this.nativeSession, value);
  }
  private reconcileSession(session: InteractionSession, value: ColorPickerColor | null) {
    const hasPending = session.pending !== undefined;
    const confirmsPending = hasPending && equal(session.pending!, value);
    const confirmsProposed = !hasPending && equal(session.proposed, value);
    if (confirmsPending || confirmsProposed) {
      session.proposed = value;
      session.changed = !equal(session.start, value);
    } else {
      session.start = value;
      session.proposed = value;
      session.changed = false;
    }
    session.pending = undefined;
    session.generation += 1;
  }
  private finalizeSessionProposal(session: InteractionSession, outcome: ProposalOutcome) {
    session.pending = undefined;
    if (outcome.status === "canceled" || outcome.status === "superseded") return;
    if (outcome.status === "unchanged") {
      session.proposed = outcome.value;
      session.changed = !equal(session.start, outcome.value);
      return;
    }
    session.proposed = outcome.value;
    session.changed = !equal(session.start, outcome.value);
    session.revisionSource = outcome.revisionSource;
  }
  private keydown(event: KeyboardEvent, input: HTMLInputElement) {
    if (this.disabled || this.readOnly) return;
    const editingValue = this.value ?? this.editingValue;
    const channel = this.inputChannel(input);
    if (channel === "alpha" && !this.alpha) return;
    const projection = projectChannel(editingValue, channel, input);
    const { min, max, step } = projection;
    let current = projection.displayed,
      next: number;
    const horizontal =
      input.getAttribute("data-axis") !== "y" &&
      this.closestOwned(input, "[data-orientation=vertical]") === null;
    const rtlSign = horizontal && this.dir === "rtl" ? -1 : 1;
    let stepDelta: number | undefined;
    if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    else {
      const arrowSteps = event.shiftKey ? 10 : 1;
      if (event.key === "PageUp") stepDelta = 10;
      else if (event.key === "PageDown") stepDelta = -10;
      else if (event.key === "ArrowRight") stepDelta = arrowSteps * rtlSign;
      else if (event.key === "ArrowLeft") stepDelta = -arrowSteps * rtlSign;
      else if (event.key === "ArrowUp") stepDelta = arrowSteps;
      else if (event.key === "ArrowDown") stepDelta = -arrowSteps;
      else return;
      next =
        channel === "hue"
          ? stepColorPickerHue(current, stepDelta, step)
          : snapColorPickerChannelValue(current + stepDelta * step, channel, step);
    }
    event.preventDefault();
    const candidate = updateChannel(editingValue, channel, next);
    this.propose(candidate, { reason: "keyboard", trigger: input, event, commit: true });
  }
  private nativeInput(event: Event, input: HTMLInputElement) {
    if (this.disabled || this.readOnly) {
      this.render();
      return;
    }
    const inputValue = Number(input.value);
    this.endPointer(false);
    if (this.nativeSession && this.nativeSession.input !== input) this.cancelNativeSession();
    const channel = this.inputChannel(input);
    if (channel === "alpha" && !this.alpha) return this.render();
    const editingValue = this.value ?? this.editingValue;
    const session =
      this.nativeSession ??
      (this.nativeSession = {
        input,
        configuration: this.nativeConfiguration(input),
        start: this.value,
        editingStart: editingValue,
        proposed: editingValue,
        pending: undefined,
        changed: false,
        generation: 0,
      });
    const proposed = updateChannel(
      editingValue,
      channel,
      snapColorPickerChannelValue(inputValue, channel, readStep(input, channel)),
    );
    session.pending = proposed;
    const generation = session.generation;
    const outcome = this.propose(proposed, {
      reason: "channel-input",
      trigger: input,
      event,
      commit: false,
    });
    if (this.nativeSession !== session || session.generation !== generation) return;
    this.finalizeSessionProposal(session, outcome);
  }
  private nativeCommit(event: Event, input: HTMLInputElement) {
    const session = this.nativeSession;
    if (!session || session.input !== input) {
      this.render();
      return;
    }
    this.nativeSession = undefined;
    if (session.changed)
      this.commit(
        session.proposed,
        session.start,
        "channel-input",
        input,
        event,
        session.revisionSource,
      );
  }
  private propose(
    next: ColorPickerColor | null,
    request: {
      reason: ColorPickerValueChangeReason;
      trigger?: Element;
      event?: Event;
      commit: boolean;
    },
  ): ProposalOutcome {
    next = this.normalizeForCapability(next);
    const proposalId = ++this.proposalSequence;
    const previous = this.value;
    const previousEditingValue = this.editingValue;
    if (equal(previous, next)) {
      this.render();
      return { status: "unchanged", value: next };
    }
    const proposalAmbientRevision = this.ambientRevision;
    let canceled = false,
      propagate = false;
    const details: ColorPickerValueChangeDetails = {
      value: next,
      valueAsString: this.stringify(next),
      previousValue: previous,
      previousValueAsString: this.stringify(previous),
      format: this.format,
      reason: request.reason,
      trigger: request.trigger,
      event: request.event,
      get isCanceled() {
        return canceled;
      },
      get isPropagationAllowed() {
        return propagate;
      },
      cancel() {
        canceled = true;
      },
      allowPropagation() {
        propagate = true;
      },
    };
    attachFormValueRevision(details, request.event);
    const domEvent = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (domEvent.defaultPrevented) canceled = true;
    this.options.onValueChange?.(next, details);
    this.subscribers.valueChange.forEach((fn) => fn(details));
    if (proposalId !== this.proposalSequence) {
      this.render();
      return { status: "superseded" };
    }
    if (canceled) {
      if (this.ambientRevision !== proposalAmbientRevision && equal(this.value, next)) {
        this.replaceAmbient(previous);
        if (!previous) this.editingValue = previousEditingValue;
      }
      this.render();
      return { status: "canceled" };
    }
    if (this.ambientRevision !== proposalAmbientRevision) {
      if (!equal(this.value, next)) {
        this.render();
        return { status: "superseded" };
      }
    } else if (!this.controlled) {
      this.replaceAmbient(next);
    }
    this.render();
    const outcome: ProposalOutcome = {
      status: "accepted",
      value: next,
      previous,
      revisionSource: details,
    };
    if (request.commit)
      this.commit(
        outcome.value,
        outcome.previous,
        request.reason,
        request.trigger,
        request.event,
        details,
      );
    return outcome;
  }
  private replaceAmbient(value: ColorPickerColor | null) {
    value = this.normalizeForCapability(value);
    this.value = value;
    if (value) this.editingValue = value;
    this.ambientRevision += 1;
    this.reconcileActiveSession(value);
  }
  private commit(
    value: ColorPickerColor | null,
    previous: ColorPickerColor | null,
    reason: ColorPickerValueChangeReason,
    trigger?: Element,
    event?: Event,
    revisionSource?: object,
  ) {
    const details: ColorPickerValueCommitDetails = {
      value,
      valueAsString: this.stringify(value),
      previousValue: previous,
      previousValueAsString: this.stringify(previous),
      format: this.format,
      reason,
      trigger,
      event,
    };
    attachFormValueRevision(details, revisionSource ?? event);
    dispatchCustomEvent(this.root, "starwind:value-committed", details);
    this.options.onValueCommitted?.(value, details);
    this.subscribers.valueCommitted.forEach((fn) => fn(details));
  }
  private parse(input: ColorPickerValue | undefined): ColorPickerColor | null | undefined {
    if (input === undefined) return undefined;
    if (input === null) return this.allowEmpty ? null : undefined;
    const parsed = typeof input === "string" ? (parseColor(input) ?? undefined) : input;
    return parsed === undefined ? undefined : this.normalizeForCapability(parsed);
  }
  private normalizeForCapability(value: ColorPickerColor | null) {
    return normalizeColorPickerValue(value, this.alpha);
  }
  private stringify(value: ColorPickerColor | null) {
    return serializeColorPickerValue(value, this.format, this.alpha);
  }
  private projectionState(value: ColorPickerColor | null = this.value): ColorPickerInitialState {
    return createColorPickerInitialState({
      value,
      format: this.format,
      alpha: this.alpha,
      allowEmpty: this.allowEmpty,
      disabled: this.disabled,
      readOnly: this.readOnly,
      required: this.required,
      name: this.name,
      form: this.form,
      locale: this.locale,
      dir: this.reflectedDir,
      getAriaValueText: this.options.getAriaValueText,
      getAreaRoleDescription: this.options.getAreaRoleDescription,
      getColorDescription: this.options.getColorDescription,
    });
  }
  private render() {
    const state = this.projectionState();
    const editingState = this.projectionState(this.editingValue);
    const formProxyStateTarget = this.getFormProxyStateTarget();
    this.captureInitialValidityOwnership(this.root);
    if (formProxyStateTarget) this.captureInitialValidityOwnership(formProxyStateTarget);
    this.syncFormProxyValidity(state.invalid, formProxyStateTarget);
    // Field and external validation own data-invalid after enhancement. Every other Root
    // projection fact is safe for Runtime to converge and keep setter-backed state current.
    applyProjection(this.root, projectColorPickerInitialPart(state, { part: "root" }), {
      excludedAttributes: new Set(["data-invalid"]),
    });
    this.queryOwnedAll<HTMLInputElement>(
      "[data-sw-color-picker-area-input], [data-sw-color-picker-channel-input]",
    ).forEach((input) => this.renderInput(input, editingState));
    this.queryOwnedAll<HTMLInputElement>("[data-sw-color-picker-value-input]").forEach((input) =>
      this.renderDraftInput(input, state),
    );
    this.queryOwnedAll<HTMLInputElement>("[data-sw-color-picker-channel-field]").forEach((input) =>
      this.renderDraftInput(input, editingState),
    );
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-value-swatch]").forEach((swatch) =>
      applyProjection(swatch, projectColorPickerInitialPart(state, { part: "valueSwatch" })),
    );
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-value-text]").forEach((textElement) =>
      applyProjection(textElement, projectColorPickerInitialPart(state, { part: "valueText" })),
    );
    this.queryOwnedAll<HTMLSelectElement>("[data-sw-color-picker-format-select]").forEach(
      (select) => {
        select.removeAttribute("name");
        applyProjection(select, projectColorPickerInitialPart(state, { part: "formatSelect" }));
      },
    );
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-format-control]").forEach((control) =>
      applyProjection(control, projectColorPickerInitialPart(state, { part: "formatControl" })),
    );
    this.queryOwnedFormatSelectRoots().forEach((selectRoot) => {
      selectRoot.setAttribute("data-value", state.format);
      selectRoot.setAttribute("data-default-value", this.initialFormat);
      setBooleanAttribute(selectRoot, "data-disabled", state.disabled);
      setBooleanAttribute(selectRoot, "data-readonly", state.readOnly);
      selectRoot.removeAttribute("data-name");
      selectRoot.removeAttribute("data-form");
      selectRoot.removeAttribute("data-required");
      selectRoot.querySelectorAll<HTMLInputElement>("[data-sw-select-input]").forEach((input) => {
        if (input.closest<HTMLElement>("[data-sw-select]") !== selectRoot) return;
        input.removeAttribute("name");
        input.removeAttribute("form");
        input.required = false;
      });
      selectRoot.querySelectorAll<HTMLElement>("[data-sw-select-trigger]").forEach((trigger) => {
        if (trigger.closest<HTMLElement>("[data-sw-select]") === selectRoot) {
          trigger.setAttribute("aria-required", "false");
        }
      });
      this.dispatchSelectCommand(selectRoot, "starwind:set-value", {
        value: state.format,
        emit: false,
      });
      this.dispatchSelectCommand(selectRoot, "starwind:set-disabled", {
        disabled: state.disabled,
      });
      this.dispatchSelectCommand(selectRoot, "starwind:set-readonly", {
        readOnly: state.readOnly,
      });
    });
    this.queryOwnedAll<HTMLButtonElement>("[data-sw-color-picker-swatch]").forEach((swatch) => {
      const lastRuntime = this.runtimeSwatchDisabled.get(swatch);
      if (this.consumeInitialProjectionOwnership(swatch, "p:disabled")) {
        this.authoredSwatchDisabled.set(swatch, false);
      } else if (lastRuntime === undefined || swatch.disabled !== lastRuntime) {
        this.authoredSwatchDisabled.set(swatch, swatch.disabled);
      }
      const dataDisabled = readBooleanAttribute(swatch, "data-disabled");
      const authoredDisabled = this.authoredSwatchDisabled.get(swatch) === true;
      applyProjection(
        swatch,
        projectColorPickerInitialPart(state, {
          part: "swatch",
          value: swatch.getAttribute("data-value") ?? swatch.value,
          disabled: dataDisabled,
        }),
      );
      swatch.disabled = swatch.disabled || authoredDisabled;
      this.runtimeSwatchDisabled.set(swatch, swatch.disabled);
    });
    this.queryOwnedAll<HTMLButtonElement>("[data-sw-color-picker-clear]").forEach((button) => {
      applyProjection(button, projectColorPickerInitialPart(state, { part: "clear" }));
    });
    const ownerWindow = this.root.ownerDocument.defaultView as
      | (Window & { EyeDropper?: unknown })
      | null;
    const EyeDropperCtor = ownerWindow?.EyeDropper;
    this.queryOwnedAll<HTMLButtonElement>("[data-sw-color-picker-eye-dropper]").forEach(
      (button) => {
        applyProjection(
          button,
          projectColorPickerInitialPart(state, { part: "eyeDropperTrigger" }),
        );
        const supported =
          ownerWindow?.isSecureContext === true && typeof EyeDropperCtor === "function";
        button.hidden = !supported;
        setBooleanAttribute(button, "data-unsupported", !supported);
      },
    );
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-area]").forEach((area) => {
      const [xChannel, yChannel] = areaChannels(area);
      const xInput = this.queryOwned<HTMLInputElement>(
        '[data-sw-color-picker-area-input][data-axis="x"]',
        area,
      );
      const yInput = this.queryOwned<HTMLInputElement>(
        '[data-sw-color-picker-area-input][data-axis="y"]',
        area,
      );
      applyProjection(
        area,
        projectColorPickerInitialPart(editingState, {
          part: "area",
          xChannel,
          yChannel,
          xStep: readStep(xInput, xChannel),
          yStep: readStep(yInput, yChannel),
        }),
      );
      this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-area-thumb]", area).forEach(
        (thumb) => {
          applyProjection(
            thumb,
            projectColorPickerInitialPart(editingState, {
              part: "areaThumb",
              xChannel,
              yChannel,
              xStep: readStep(xInput, xChannel),
              yStep: readStep(yInput, yChannel),
            }),
          );
        },
      );
      this.renderSurfaceState(area, "[data-sw-color-picker-area-thumb]");
    });
    this.queryOwnedAll<HTMLElement>("[data-sw-color-picker-channel-slider]").forEach((slider) => {
      const channel = readChannel(slider),
        input = this.queryOwned<HTMLInputElement>("[data-sw-color-picker-channel-input]", slider),
        orientation =
          slider.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal";
      applyProjection(
        slider,
        projectColorPickerInitialPart(editingState, {
          part: "channelSlider",
          channel,
          orientation,
          step: readStep(input, channel),
        }),
      );
      this.queryOwnedAll<HTMLElement>(
        "[data-sw-color-picker-channel-slider-thumb]",
        slider,
      ).forEach((thumb) =>
        applyProjection(
          thumb,
          projectColorPickerInitialPart(editingState, {
            part: "channelSliderThumb",
            channel,
            orientation,
            step: readStep(input, channel),
          }),
        ),
      );
      this.renderSurfaceState(slider, "[data-sw-color-picker-channel-slider-thumb]");
    });
    const hiddenInputs = [
      ...this.queryOwnedAll<HTMLInputElement>("[data-sw-color-picker-hidden-input]"),
    ];
    if (hiddenInputs.length === 0) {
      const input = this.root.ownerDocument.createElement("input");
      input.setAttribute("data-sw-color-picker-hidden-input", "");
      this.root.append(input);
      hiddenInputs.push(input);
    }
    hiddenInputs.slice(1).forEach((input) => input.remove());
    const hidden = hiddenInputs[0];
    if (hidden) {
      const hiddenProjection = projectColorPickerInitialPart(state, { part: "hiddenInput" });
      applyProjection(hidden, hiddenProjection);
      hidden.defaultValue = this.stringify(this.normalizeForCapability(this.initialValue));
      hidden.addEventListener("invalid", this.handleFormProxyInvalid, {
        signal: this.abort.signal,
      });
      this.syncFormReset(hidden.form);
    } else {
      this.syncFormReset(null);
    }
  }
  private renderDraftInput(input: HTMLInputElement, state: ColorPickerInitialState) {
    input.removeAttribute("name");
    const draft = this.drafts.get(input);
    if (input.hasAttribute("data-sw-color-picker-value-input")) {
      const preserveValidity =
        state.invalid ||
        draft !== undefined ||
        input.hasAttribute("aria-invalid") ||
        input.hasAttribute("data-invalid");
      applyProjection(
        input,
        projectColorPickerInitialPart(state, { part: "valueInput" }),
        preserveValidity
          ? { excludedAttributes: new Set(["aria-invalid", "data-invalid"]) }
          : undefined,
      );
    } else {
      applyProjection(
        input,
        projectColorPickerInitialPart(state, { part: "channelInput", channel: readChannel(input) }),
      );
    }
    if (draft !== undefined) input.value = draft;
    if (draft !== undefined) {
      const invalid = this.parseDraft(input) === undefined;
      setBooleanAttribute(input, "data-invalid", invalid);
      input.setAttribute("aria-invalid", invalid ? "true" : "false");
    }
    if (draft === undefined && !input.hasAttribute("data-sw-color-picker-value-input")) {
      input.removeAttribute("data-invalid");
      input.setAttribute("aria-invalid", "false");
    }
  }
  private readonly handleFormProxyInvalid = (event: Event) => {
    if (!(event.currentTarget instanceof HTMLInputElement) || !this.owns(event.currentTarget))
      return;
    this.syncFormProxyValidity(true, this.getFormProxyStateTarget());
    const target = this.getFormProxyFocusTarget();
    if (!target) return;
    event.preventDefault();
    target.focus();
  };
  private syncFormProxyValidity(invalid: boolean, target: HTMLElement | undefined) {
    if (invalid) {
      for (const previous of this.formProxyValiditySnapshots.keys()) {
        if (previous !== this.root && previous !== target) this.restoreFormProxyValidity(previous);
      }
      this.applyFormProxyInvalid(this.root);
      if (target) this.applyFormProxyInvalid(target);
      return;
    }
    for (const element of [...this.formProxyValiditySnapshots.keys()])
      this.restoreFormProxyValidity(element);
    if (target instanceof HTMLInputElement && this.isInvalidDraft(target)) {
      setBooleanAttribute(target, "data-invalid", true);
      target.setAttribute("aria-invalid", "true");
    }
  }
  private applyFormProxyInvalid(element: HTMLElement) {
    if (!this.formProxyValiditySnapshots.has(element)) {
      const initial = this.initialValidityOwnership.get(element);
      const draft =
        element instanceof HTMLInputElement && this.isInvalidDraft(element)
          ? this.draftValiditySnapshots.get(element)
          : undefined;
      this.formProxyValiditySnapshots.set(element, {
        ariaInvalid: draft
          ? draft.ariaInvalid
          : initial?.ariaInvalid === element.getAttribute("aria-invalid")
            ? null
            : element.getAttribute("aria-invalid"),
        dataInvalid: draft
          ? draft.dataInvalid
          : initial?.dataInvalid === element.getAttribute("data-invalid")
            ? null
            : element.getAttribute("data-invalid"),
      });
      this.initialValidityOwnership.delete(element);
    }
    setBooleanAttribute(element, "data-invalid", true);
    element.setAttribute("aria-invalid", "true");
  }
  private restoreFormProxyValidity(element: HTMLElement) {
    const snapshot = this.formProxyValiditySnapshots.get(element);
    if (!snapshot) return;
    restoreAttribute(element, "data-invalid", snapshot.dataInvalid);
    restoreAttribute(element, "aria-invalid", snapshot.ariaInvalid);
    this.formProxyValiditySnapshots.delete(element);
  }
  private captureInitialValidityOwnership(element: HTMLElement) {
    const ariaOwned = this.consumeInitialProjectionOwnership(element, "a:aria-invalid");
    const dataOwned = this.consumeInitialProjectionOwnership(element, "a:data-invalid");
    if (!ariaOwned && !dataOwned) return;
    this.initialValidityOwnership.set(element, {
      ariaInvalid: ariaOwned ? element.getAttribute("aria-invalid") : null,
      dataInvalid: dataOwned ? element.getAttribute("data-invalid") : null,
    });
  }
  private isInvalidDraft(input: HTMLInputElement) {
    return this.drafts.has(input) && this.parseDraft(input) === undefined;
  }
  private getFormProxyStateTarget(): HTMLElement | undefined {
    return (
      this.queryOwned<HTMLElement>(
        "[data-sw-color-picker-value-input], [data-sw-color-picker-trigger], [data-sw-color-picker-control]",
      ) ?? undefined
    );
  }
  private getFormProxyFocusTarget(): HTMLElement | undefined {
    const selectors = [
      "[data-sw-color-picker-value-input]",
      "[data-sw-color-picker-trigger]",
      "[data-sw-color-picker-control]",
      "[data-sw-color-picker-area-input]",
      "[data-sw-color-picker-channel-input]",
      "[data-sw-color-picker-channel-field]",
      "[data-sw-color-picker-format-select]",
      "[data-sw-color-picker-swatch]",
      "[data-sw-color-picker-clear]",
    ];
    return selectors
      .flatMap((selector) => this.queryOwnedAll<HTMLElement>(selector))
      .find(isAvailableFormProxyFocusTarget);
  }
  private syncFormReset(form: HTMLFormElement | null) {
    if (this.resetForm === form) return;
    this.detachFormReset();
    this.resetForm = form;
    form?.addEventListener("reset", this.handleFormReset);
  }
  private detachFormReset() {
    this.resetForm?.removeEventListener("reset", this.handleFormReset);
    this.resetForm = null;
  }
  private readonly handleFormReset = () => {
    this.cancelInteractions();
    this.invalidateEyeDropper();
    this.clearDrafts();
    this.format = this.initialFormat;
    this.replaceAmbient(
      normalizeColorPickerCapabilityValue(this.initialValue, {
        alpha: this.alpha,
        allowEmpty: this.allowEmpty,
      }),
    );
    this.clearResetTimer();
    const ownerWindow = this.root.ownerDocument.defaultView;
    if (!ownerWindow) return;
    this.resetTimer = ownerWindow.setTimeout(() => {
      this.resetTimer = undefined;
      if (!this.destroyed) this.render();
    }, 0);
  };
  private clearResetTimer() {
    if (this.resetTimer === undefined) return;
    this.root.ownerDocument.defaultView?.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }
  private renderSurfaceState(surface: HTMLElement, thumbSelector: string) {
    const activeElement = this.root.ownerDocument.activeElement;
    const focused =
      activeElement instanceof Element &&
      this.owns(activeElement) &&
      surface.contains(activeElement);
    const dragging = this.pointer?.trigger === surface;
    [surface, ...this.queryOwnedAll<HTMLElement>(thumbSelector, surface)].forEach((element) => {
      setBooleanAttribute(element, "data-focused", focused);
      setBooleanAttribute(element, "data-dragging", dragging);
      setBooleanAttribute(element, "data-disabled", this.disabled);
      setBooleanAttribute(element, "data-readonly", this.readOnly);
    });
  }

  private reconcilePreservedStructureState() {
    const pointer = this.pointer;
    if (
      pointer &&
      (!this.isConnectedOwned(pointer.trigger) ||
        this.pointerConfiguration(pointer.trigger, pointer.reason) !== pointer.configuration)
    ) {
      this.endPointer(false);
    }

    const nativeSession = this.nativeSession;
    if (
      nativeSession &&
      (!this.isConnectedOwned(nativeSession.input) ||
        this.nativeConfiguration(nativeSession.input) !== nativeSession.configuration)
    ) {
      this.cancelNativeSession();
    }

    for (const input of this.drafts.keys()) {
      if (
        !this.isConnectedOwned(input) ||
        this.draftConfigurations.get(input) !== this.draftConfiguration(input)
      ) {
        this.clearDraft(input, { restore: this.isConnectedOwned(input) });
      }
    }
  }

  private isConnectedOwned(element: Element): boolean {
    return element.isConnected && this.owns(element);
  }

  private pointerConfiguration(
    target: HTMLElement,
    reason: ColorPickerValueChangeReason,
  ): string | undefined {
    if (!this.isConnectedOwned(target)) return undefined;
    if (reason === "area-drag") {
      const [xChannel, yChannel] = areaChannels(target);
      const xInput = this.queryOwned<HTMLInputElement>(
        '[data-sw-color-picker-area-input][data-axis="x"]',
        target,
      );
      const yInput = this.queryOwned<HTMLInputElement>(
        '[data-sw-color-picker-area-input][data-axis="y"]',
        target,
      );
      return [
        "area",
        this.interactionElementIdentity(target),
        xChannel,
        yChannel,
        this.inputConfiguration(xInput, xChannel),
        this.inputConfiguration(yInput, yChannel),
      ].join("|");
    }
    if (reason !== "channel-drag") return undefined;
    const channel = readChannel(target);
    const input = this.queryOwned<HTMLInputElement>("[data-sw-color-picker-channel-input]", target);
    return [
      "slider",
      this.interactionElementIdentity(target),
      channel,
      target.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal",
      this.inputConfiguration(input, channel),
    ].join("|");
  }

  private nativeConfiguration(input: HTMLInputElement): string {
    if (input.hasAttribute("data-sw-color-picker-area-input")) {
      const area = this.closestOwned<HTMLElement>(input, "[data-sw-color-picker-area]");
      return [
        "native-area",
        input.getAttribute("data-axis") === "y" ? "y" : "x",
        area ? this.pointerConfiguration(area, "area-drag") : "missing-area",
      ].join("|");
    }
    const slider = this.closestOwned<HTMLElement>(input, "[data-sw-color-picker-channel-slider]");
    return [
      "native-slider",
      slider ? this.pointerConfiguration(slider, "channel-drag") : "missing-slider",
      this.interactionElementIdentity(input),
    ].join("|");
  }

  private draftConfiguration(input: HTMLInputElement): string {
    if (input.hasAttribute("data-sw-color-picker-value-input")) return "value-input";
    return `channel-field|${readChannel(input)}|${input.getAttribute("data-channel") ?? ""}`;
  }

  private inputConfiguration(input: HTMLInputElement | null, channel: Channel): string {
    if (!input) return "missing-input";
    return [
      this.interactionElementIdentity(input),
      input.getAttribute("data-axis") ?? "",
      input.getAttribute("data-step") ?? "",
      input.getAttribute("step") ?? "",
      readStep(input, channel),
    ].join(":");
  }

  private interactionElementIdentity(element: Element): number {
    let identity = this.interactionElementIds.get(element);
    if (identity !== undefined) return identity;
    identity = this.nextInteractionElementId;
    this.nextInteractionElementId += 1;
    this.interactionElementIds.set(element, identity);
    return identity;
  }
  private classifyAreaRoleDescription(input: HTMLInputElement) {
    const current = input.getAttribute("aria-roledescription");
    if (this.consumeInitialProjectionOwnership(input, "a:aria-roledescription")) {
      this.authoredAreaRoleDescriptions.delete(input);
      if (current === null) this.runtimeAreaRoleDescriptions.delete(input);
      else this.runtimeAreaRoleDescriptions.set(input, current);
      return;
    }
    const runtimeValue = this.runtimeAreaRoleDescriptions.get(input);
    if (current === null) {
      this.authoredAreaRoleDescriptions.delete(input);
      this.runtimeAreaRoleDescriptions.delete(input);
    } else if (current !== runtimeValue) {
      this.authoredAreaRoleDescriptions.add(input);
      this.runtimeAreaRoleDescriptions.delete(input);
    }
  }
  private cleanupAreaRoleDescriptions() {
    this.runtimeAreaRoleDescriptions.forEach((runtimeValue, input) => {
      if (input.getAttribute("aria-roledescription") === runtimeValue)
        input.removeAttribute("aria-roledescription");
    });
    this.runtimeAreaRoleDescriptions.clear();
    this.authoredAreaRoleDescriptions.clear();
  }
  private renderInput(input: HTMLInputElement, state: ColorPickerInitialState) {
    input.removeAttribute("name");
    const area = input.hasAttribute("data-sw-color-picker-area-input"),
      channel = this.inputChannel(input),
      displayed = projectChannel(this.value, channel, input).displayed;
    let partProjection: ColorPickerInitialPartProjection;
    if (area) {
      this.classifyAreaRoleDescription(input);
      const labelledBy = this.sharedAreaLabel(input);
      const parent = this.closestOwned<HTMLElement>(input, "[data-sw-color-picker-area]");
      const [xChannel, yChannel] = areaChannels(parent);
      partProjection = projectColorPickerInitialPart(state, {
        part: "areaInput",
        axis: input.getAttribute("data-axis") === "y" ? "y" : "x",
        xChannel,
        yChannel,
        xStep: readStep(
          parent
            ? this.queryOwned<HTMLInputElement>(
                '[data-sw-color-picker-area-input][data-axis="x"]',
                parent,
              )
            : null,
          xChannel,
        ),
        yStep: readStep(
          parent
            ? this.queryOwned<HTMLInputElement>(
                '[data-sw-color-picker-area-input][data-axis="y"]',
                parent,
              )
            : null,
          yChannel,
        ),
        ariaLabel: input.getAttribute("aria-label") ?? undefined,
        ariaLabelledBy: input.getAttribute("aria-labelledby") ?? labelledBy,
        ariaRoleDescription: this.authoredAreaRoleDescriptions.has(input)
          ? (input.getAttribute("aria-roledescription") ?? undefined)
          : undefined,
      });
    } else {
      const slider = this.closestOwned<HTMLElement>(input, "[data-sw-color-picker-channel-slider]");
      partProjection = projectColorPickerInitialPart(state, {
        part: "channelSliderInput",
        channel,
        orientation:
          slider?.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal",
        step: readStep(input, channel),
        ariaLabel: input.getAttribute("aria-label") ?? undefined,
      });
    }
    applyProjection(input, partProjection);
    if (area && !this.authoredAreaRoleDescriptions.has(input)) {
      const roleDescription = input.getAttribute("aria-roledescription")!;
      this.runtimeAreaRoleDescriptions.set(input, roleDescription);
    }
  }

  private inputChannel(input: HTMLInputElement): Channel {
    if (!input.hasAttribute("data-sw-color-picker-area-input")) {
      return readChannel(
        this.closestOwned<HTMLElement>(input, "[data-sw-color-picker-channel-slider]") ?? input,
      );
    }
    const area = this.closestOwned<HTMLElement>(input, "[data-sw-color-picker-area]");
    const [xChannel, yChannel] = areaChannels(area);
    return input.getAttribute("data-axis") === "y" ? yChannel : xChannel;
  }

  private sharedAreaLabel(input: HTMLInputElement): string | undefined {
    const area = this.closestOwned<HTMLElement>(input, "[data-sw-color-picker-area]");
    const existing =
      area?.getAttribute("aria-labelledby") ?? this.root.getAttribute("aria-labelledby");
    if (existing) return existing;
    const labelElement = this.queryOwned<HTMLElement>("[data-sw-color-picker-label]");
    return labelElement ? ensureId(labelElement, "sw-color-picker-label") : undefined;
  }

  private captureInitialProjectionOwnership() {
    const elements = [
      ...(this.root.hasAttribute(COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE) ? [this.root] : []),
      ...this.queryOwnedAll<HTMLElement>(`[${COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE}]`),
    ];
    for (const element of elements) {
      const encoded = element.getAttribute(COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE) ?? "";
      this.initialProjectionOwnership.set(
        element,
        new Set(encoded.split(",").filter((entry) => /^(?:a|p):.+/.test(entry))),
      );
      element.removeAttribute(COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE);
    }
  }

  private consumeInitialProjectionOwnership(element: HTMLElement, token: string) {
    const owned = this.initialProjectionOwnership.get(element);
    if (!owned?.delete(token)) return false;
    if (owned.size === 0) this.initialProjectionOwnership.delete(element);
    return true;
  }

  private hasInitialProjectionOwnership(element: HTMLElement, token: string) {
    return this.initialProjectionOwnership.get(element)?.has(token) === true;
  }
}

function validFormat(value: unknown): ColorPickerFormat | undefined {
  return COLOR_PICKER_FORMATS.includes(value as ColorPickerFormat)
    ? (value as ColorPickerFormat)
    : undefined;
}
function readDirectionAttribute(element: HTMLElement): ColorPickerDirection | undefined {
  const value = element.getAttribute("dir");
  return value === "ltr" || value === "rtl" ? value : undefined;
}
function inheritedDirection(element: HTMLElement): ColorPickerDirection {
  const inherited = element.parentElement?.closest<HTMLElement>("[dir]");
  const documentDirection = element.ownerDocument.documentElement.getAttribute("dir");
  return (inherited?.getAttribute("dir") ?? documentDirection) === "rtl" ? "rtl" : "ltr";
}
function equal(a: ColorPickerColor | null, b: ColorPickerColor | null) {
  return a === b || (!!a && !!b && a.equals(b));
}
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
function readChannel(element: Element): Channel {
  const value = element.getAttribute("data-channel");
  return (
    ["hue", "saturation", "brightness", "lightness", "red", "green", "blue", "alpha"] as string[]
  ).includes(value ?? "")
    ? (value as Channel)
    : "hue";
}
function channelValue(color: ColorPickerColor, channel: Channel) {
  if (channel === "alpha") return color.alpha * 100;
  if (channel in color.hsb) return color.hsb[channel as keyof typeof color.hsb];
  if (channel in color.hsl) return color.hsl[channel as keyof typeof color.hsl];
  return color.rgb[channel as keyof typeof color.rgb];
}
function updateChannel(color: ColorPickerColor, channel: Channel, value: number): ColorPickerColor {
  if (channel === "alpha") return color.withChannels("hsb", { alpha: value / 100 });
  if (channel === "red" || channel === "green" || channel === "blue")
    return color.withChannels("rgb", { [channel]: value });
  if (channel === "lightness") return color.withChannels("hsl", { lightness: value });
  return color.withChannels("hsb", { [channel]: value });
}
function areaChannels(area: Element | null): [x: Channel, y: Channel] {
  return [
    readOptionalChannel(area?.getAttribute("data-x-channel")) ?? "saturation",
    readOptionalChannel(area?.getAttribute("data-y-channel")) ?? "brightness",
  ];
}
function readOptionalChannel(value: string | null | undefined): Channel | undefined {
  return (
    ["hue", "saturation", "brightness", "lightness", "red", "green", "blue", "alpha"] as string[]
  ).includes(value ?? "")
    ? (value as Channel)
    : undefined;
}
function readStep(input: HTMLInputElement | null | undefined, channel: Channel): number {
  const value = Number(input?.getAttribute("data-step") ?? input?.getAttribute("step"));
  return Number.isFinite(value) && value > 0 && (channel !== "hue" || value <= 360) ? value : 1;
}
function projectChannel(
  color: ColorPickerColor | null,
  channel: Channel,
  input?: HTMLInputElement | null,
) {
  return projectColorPickerChannel(color, channel, readStep(input, channel));
}
function applyProjection(
  element: HTMLElement,
  projection: ColorPickerInitialPartProjection,
  options: { excludedAttributes?: ReadonlySet<string> } = {},
) {
  const attributeNames = new Set([
    ...Object.keys(projection.attributes),
    ...projection.ownership.attributes,
  ]);
  for (const name of attributeNames) {
    if (name === COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE || options.excludedAttributes?.has(name))
      continue;
    const value = projection.attributes[name];
    if (value === undefined || value === false) {
      if (element.hasAttribute(name)) element.removeAttribute(name);
    } else {
      const nextValue = value === true ? "" : String(value);
      if (element.getAttribute(name) !== nextValue) element.setAttribute(name, nextValue);
    }
  }
  for (const [name, value] of Object.entries(projection.styles)) {
    if (value === undefined) element.style.removeProperty(name);
    else element.style.setProperty(name, value);
  }
  const properties = projection.properties;
  if (properties.value !== undefined && "value" in element)
    (element as HTMLInputElement | HTMLSelectElement).value = String(properties.value);
  if (properties.defaultValue !== undefined && "defaultValue" in element)
    (element as HTMLInputElement).defaultValue = properties.defaultValue;
  if (properties.disabled !== undefined && "disabled" in element)
    (element as HTMLInputElement | HTMLButtonElement | HTMLSelectElement).disabled =
      properties.disabled;
  if (properties.readOnly !== undefined && "readOnly" in element)
    (element as HTMLInputElement).readOnly = properties.readOnly;
  if (properties.hidden !== undefined) element.hidden = properties.hidden;
  if (projection.text !== undefined) element.textContent = projection.text;
}

function isAvailableFormProxyFocusTarget(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  if (
    "disabled" in element &&
    (element as HTMLInputElement | HTMLButtonElement | HTMLSelectElement).disabled
  )
    return false;
  return element.tabIndex >= 0;
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}
