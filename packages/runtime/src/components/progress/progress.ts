import { assertHTMLElement, ensureId, readBooleanAttribute } from "../../internal/dom";

export type ProgressValue = number | null;
export type ProgressStatus = "complete" | "indeterminate" | "progressing";

export type ProgressOptions = {
  ariaValueText?: string;
  format?: Intl.NumberFormatOptions;
  getAriaValueText?: (formattedValue: string | null, value: ProgressValue) => string;
  locale?: Intl.LocalesArgument;
  max?: number;
  min?: number;
  value?: ProgressValue;
};

export type ProgressSetValueOptions = {
  max?: number;
  min?: number;
};

export type ProgressSetFormatOptions = Pick<
  ProgressOptions,
  "ariaValueText" | "format" | "getAriaValueText" | "locale"
>;

export type ProgressInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getFormattedValue(): string | null;
  getPercent(): number | null;
  getStatus(): ProgressStatus;
  getValue(): ProgressValue;
  refresh(): void;
  setFormatOptions(options: ProgressSetFormatOptions): void;
  setMax(max: number): void;
  setMin(min: number): void;
  setValue(value: ProgressValue, options?: ProgressSetValueOptions): void;
};

type ProgressElements = {
  indicators: HTMLElement[];
  labels: HTMLElement[];
  tracks: HTMLElement[];
  values: HTMLElement[];
};

const PROGRESS_ROOT_ATTRIBUTE = "data-sw-progress";
const PROGRESS_TRACK_ATTRIBUTE = "data-sw-progress-track";
const PROGRESS_INDICATOR_ATTRIBUTE = "data-sw-progress-indicator";
const PROGRESS_VALUE_PART_ATTRIBUTE = "data-sw-progress-value";
const PROGRESS_LABEL_ATTRIBUTE = "data-sw-progress-label";
const PROGRESS_VALUE_ATTRIBUTE = "data-value";
const PROGRESS_MIN_ATTRIBUTE = "data-min";
const PROGRESS_MAX_ATTRIBUTE = "data-max";
const PROGRESS_INDETERMINATE_ATTRIBUTE = "data-indeterminate";
const PROGRESS_COMPLETE_ATTRIBUTE = "data-complete";
const PROGRESS_PROGRESSING_ATTRIBUTE = "data-progressing";
const PROGRESS_STATUS_ATTRIBUTE = "data-status";
const PROGRESS_INSTANT_ATTRIBUTE = "data-instant";
const PROGRESS_GENERATED_VALUE_TEXT_ATTRIBUTE = "data-sw-progress-generated-value-text";

const OBSERVED_ATTRIBUTES = new Set([
  "aria-valuetext",
  PROGRESS_INDETERMINATE_ATTRIBUTE,
  PROGRESS_MAX_ATTRIBUTE,
  PROGRESS_MIN_ATTRIBUTE,
  PROGRESS_VALUE_ATTRIBUTE,
]);

const instances = new WeakMap<HTMLElement, ProgressController>();

export function createProgress(root: HTMLElement, options: ProgressOptions = {}): ProgressInstance {
  assertHTMLElement(root, "createProgress root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ProgressController(root, options);
  instances.set(root, instance);
  return instance;
}

class ProgressController implements ProgressInstance {
  readonly root: HTMLElement;

  private readonly elements: ProgressElements;
  private ariaValueText?: string;
  private format?: Intl.NumberFormatOptions;
  private getAriaValueText?: (formattedValue: string | null, value: ProgressValue) => string;
  private locale?: Intl.LocalesArgument;
  private readonly mutationObserver: MutationObserver;
  private instantFrame: number | undefined;
  private destroyed = false;
  private max: number;
  private min: number;
  private value: ProgressValue;

  constructor(root: HTMLElement, options: ProgressOptions) {
    this.root = root;
    this.elements = getProgressElements(root);
    this.ariaValueText =
      options.ariaValueText ??
      (!root.hasAttribute(PROGRESS_GENERATED_VALUE_TEXT_ATTRIBUTE)
        ? (root.getAttribute("aria-valuetext") ?? undefined)
        : undefined);
    this.format = options.format;
    this.getAriaValueText = options.getAriaValueText;
    this.locale = options.locale;
    this.min = sanitizeMinMax(
      options.min ?? readNumberAttribute(root, PROGRESS_MIN_ATTRIBUTE, 0),
      0,
    );
    this.max = sanitizeMinMax(
      options.max ?? readNumberAttribute(root, PROGRESS_MAX_ATTRIBUTE, 100),
      100,
    );
    this.value =
      "value" in options ? normalizeProgressValue(options.value) : readProgressValue(root);
    this.mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => OBSERVED_ATTRIBUTES.has(mutation.attributeName ?? ""))) {
        this.refresh();
      }
    });

    this.mutationObserver.observe(root, { attributes: true });
    this.render();
  }

  destroy(): void {
    if (this.destroyed) return;

    if (this.instantFrame !== undefined) {
      cancelAnimationFrame(this.instantFrame);
      this.instantFrame = undefined;
    }
    this.elements.indicators.forEach((indicator) => {
      indicator.removeAttribute(PROGRESS_INSTANT_ATTRIBUTE);
    });
    this.mutationObserver.disconnect();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getFormattedValue(): string | null {
    const min = Math.min(this.min, this.max);
    const max = Math.max(this.min, this.max);
    const value = this.value === null ? null : clamp(this.value, min, max);

    return formatProgressValue(value, this.locale, this.format);
  }

  getPercent(): number | null {
    return getProgressPercent(this.value, this.min, this.max);
  }

  getStatus(): ProgressStatus {
    return getProgressStatus(this.value, this.min, this.max);
  }

  getValue(): ProgressValue {
    return this.value;
  }

  refresh(): void {
    if (!this.root.hasAttribute(PROGRESS_GENERATED_VALUE_TEXT_ATTRIBUTE)) {
      this.ariaValueText = this.root.getAttribute("aria-valuetext") ?? undefined;
    }
    this.min = sanitizeMinMax(
      readNumberAttribute(this.root, PROGRESS_MIN_ATTRIBUTE, this.min),
      this.min,
    );
    this.max = sanitizeMinMax(
      readNumberAttribute(this.root, PROGRESS_MAX_ATTRIBUTE, this.max),
      this.max,
    );
    this.value = readProgressValue(this.root);
    this.render();
  }

  setFormatOptions(options: ProgressSetFormatOptions): void {
    if (Object.hasOwn(options, "ariaValueText")) {
      this.ariaValueText = options.ariaValueText;
    }
    if (Object.hasOwn(options, "format")) {
      this.format = options.format;
    }
    if (Object.hasOwn(options, "getAriaValueText")) {
      this.getAriaValueText = options.getAriaValueText;
    }
    if (Object.hasOwn(options, "locale")) {
      this.locale = options.locale;
    }

    this.render();
  }

  setMax(max: number): void {
    this.max = sanitizeMinMax(max, this.max);
    this.render();
  }

  setMin(min: number): void {
    this.min = sanitizeMinMax(min, this.min);
    this.render();
  }

  setValue(value: ProgressValue, options: ProgressSetValueOptions = {}): void {
    if (options.min !== undefined) {
      this.min = sanitizeMinMax(options.min, this.min);
    }
    if (options.max !== undefined) {
      this.max = sanitizeMinMax(options.max, this.max);
    }

    this.value = normalizeProgressValue(value);
    this.render();
  }

  private render(): void {
    const previousStatus = this.root.getAttribute(PROGRESS_STATUS_ATTRIBUTE);
    const min = Math.min(this.min, this.max);
    const max = Math.max(this.min, this.max);
    const value = this.value === null ? null : clamp(this.value, min, max);
    const percent = getProgressPercent(value, min, max);
    const formattedValue = formatProgressValue(value, this.locale, this.format);
    const status = getProgressStatus(value, min, max);
    const isIndeterminate = status === "indeterminate";
    const isComplete = status === "complete";
    const isProgressing = status === "progressing";
    const modeChanged =
      previousStatus !== null &&
      (previousStatus === "indeterminate") !== (status === "indeterminate");
    const stateElements = [
      this.root,
      ...this.elements.tracks,
      ...this.elements.indicators,
      ...this.elements.values,
      ...this.elements.labels,
    ];

    this.root.setAttribute(PROGRESS_ROOT_ATTRIBUTE, "");
    setAttributeIfChanged(this.root, PROGRESS_MIN_ATTRIBUTE, String(min));
    setAttributeIfChanged(this.root, PROGRESS_MAX_ATTRIBUTE, String(max));
    setAttributeIfChanged(this.root, PROGRESS_STATUS_ATTRIBUTE, status);
    if (value === null) {
      this.root.removeAttribute(PROGRESS_VALUE_ATTRIBUTE);
    } else {
      setAttributeIfChanged(this.root, PROGRESS_VALUE_ATTRIBUTE, String(value));
    }
    if (!this.root.hasAttribute("role")) {
      this.root.setAttribute("role", "progressbar");
    }
    setAttributeIfChanged(this.root, "aria-valuemin", String(min));
    setAttributeIfChanged(this.root, "aria-valuemax", String(max));

    if (value === null) {
      this.root.removeAttribute("aria-valuenow");
    } else {
      setAttributeIfChanged(this.root, "aria-valuenow", String(value));
    }
    setAttributeIfChanged(
      this.root,
      "aria-valuetext",
      this.getAriaValueTextValue(formattedValue, value),
    );
    setBooleanAttributeIfChanged(
      this.root,
      PROGRESS_GENERATED_VALUE_TEXT_ATTRIBUTE,
      this.ariaValueText === undefined,
    );

    this.linkLabel();

    stateElements.forEach((element) => {
      setBooleanAttributeIfChanged(element, PROGRESS_COMPLETE_ATTRIBUTE, isComplete);
      setBooleanAttributeIfChanged(element, PROGRESS_INDETERMINATE_ATTRIBUTE, isIndeterminate);
      setBooleanAttributeIfChanged(element, PROGRESS_PROGRESSING_ATTRIBUTE, isProgressing);
      setAttributeIfChanged(element, PROGRESS_STATUS_ATTRIBUTE, status);
    });

    if (modeChanged) {
      this.markModeChangeInstant();
    }

    this.elements.indicators.forEach((indicator) => {
      if (percent === null) {
        indicator.style.removeProperty("transform");
        return;
      }

      indicator.style.transform = `translateX(-${100 - percent}%)`;
    });

    this.elements.values.forEach((valueElement) => {
      setAttributeIfChanged(valueElement, "aria-hidden", "true");
      if (readBooleanAttribute(valueElement, "data-preserve-text", false)) return;

      valueElement.textContent = formattedValue ?? "";
    });

    this.elements.labels.forEach((label) => {
      setAttributeIfChanged(label, "role", "presentation");
    });
  }

  private markModeChangeInstant(): void {
    this.elements.indicators.forEach((indicator) => {
      indicator.setAttribute(PROGRESS_INSTANT_ATTRIBUTE, "");
    });

    if (this.instantFrame !== undefined) {
      cancelAnimationFrame(this.instantFrame);
    }
    this.instantFrame = requestAnimationFrame(() => {
      this.instantFrame = requestAnimationFrame(() => {
        this.instantFrame = undefined;
        this.elements.indicators.forEach((indicator) => {
          indicator.removeAttribute(PROGRESS_INSTANT_ATTRIBUTE);
        });
      });
    });
  }

  private linkLabel(): void {
    if (this.root.hasAttribute("aria-label") || this.root.hasAttribute("aria-labelledby")) {
      return;
    }

    const [label] = this.elements.labels;
    if (!label) return;

    this.root.setAttribute("aria-labelledby", ensureId(label, "sw-progress-label"));
  }

  private getAriaValueTextValue(formattedValue: string | null, value: ProgressValue): string {
    if (this.ariaValueText !== undefined) return this.ariaValueText;

    if (this.getAriaValueText) {
      return this.getAriaValueText(formattedValue, value);
    }

    if (value === null) return "indeterminate progress";

    return formattedValue ?? String(value);
  }
}

function getProgressElements(root: HTMLElement): ProgressElements {
  return {
    indicators: queryOwnElements(root, `[${PROGRESS_INDICATOR_ATTRIBUTE}]`),
    labels: queryOwnElements(root, `[${PROGRESS_LABEL_ATTRIBUTE}]`),
    tracks: queryOwnElements(root, `[${PROGRESS_TRACK_ATTRIBUTE}]`),
    values: queryOwnElements(root, `[${PROGRESS_VALUE_PART_ATTRIBUTE}]`),
  };
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => element.closest(`[${PROGRESS_ROOT_ATTRIBUTE}]`) === root,
  );
}

function readProgressValue(root: HTMLElement): ProgressValue {
  if (readBooleanAttribute(root, PROGRESS_INDETERMINATE_ATTRIBUTE, false)) return null;
  if (!root.hasAttribute(PROGRESS_VALUE_ATTRIBUTE)) return null;

  return normalizeProgressValue(readNumberAttribute(root, PROGRESS_VALUE_ATTRIBUTE, Number.NaN));
}

function normalizeProgressValue(value: number | null | undefined): ProgressValue {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  return Number.isFinite(value) ? value : null;
}

function getProgressPercent(value: ProgressValue, min: number, max: number): number | null {
  if (value === null) return null;
  if (max === min) return value >= max ? 100 : 0;

  return Math.round(clamp(((value - min) / (max - min)) * 100, 0, 100));
}

function getProgressStatus(value: ProgressValue, min: number, max: number): ProgressStatus {
  if (value === null) return "indeterminate";

  return value >= Math.max(min, max) ? "complete" : "progressing";
}

function formatProgressValue(
  value: ProgressValue,
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
): string | null {
  if (value === null) return null;

  if (options !== undefined) {
    return new Intl.NumberFormat(locale, options).format(value);
  }

  return new Intl.NumberFormat(locale, { style: "percent" }).format(value / 100);
}

function sanitizeMinMax(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNumberAttribute(element: HTMLElement, name: string, fallback: number): number {
  const value = element.getAttribute(name);
  if (value === null || value.trim() === "") return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function setAttributeIfChanged(element: HTMLElement, name: string, value: string): void {
  if (element.getAttribute(name) === value) return;

  element.setAttribute(name, value);
}

function setBooleanAttributeIfChanged(element: HTMLElement, name: string, value: boolean): void {
  if (value) {
    if (!element.hasAttribute(name)) {
      element.setAttribute(name, "");
    }
    return;
  }

  if (element.hasAttribute(name)) {
    element.removeAttribute(name);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
