import { assertHTMLElement, readBooleanAttribute, setBooleanAttribute } from "../../internal/dom";
import { getFormValueRevision } from "../../internal/form-value-revision";
import {
  createField,
  type FieldFormRegistration,
  type FieldFormValidationState,
  type FieldInstance,
  type FieldValidationError,
  type FieldValidityKey,
} from "../field";

export type FormState = {
  fieldCount: number;
};

export type FormFieldRegistration = FieldFormRegistration;
export type FormValidationTiming = "blur" | "change" | "manual" | "submit";
export type FormValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;
export type FormValidationErrorInput =
  | string
  | {
      readonly key?: FieldValidityKey;
      readonly message: string;
      readonly source?: Extract<
        FieldValidationError["source"],
        "custom" | "external" | "schema" | "server"
      >;
    };
export type FormValidationResult =
  | FormValidationErrorInput
  | null
  | readonly FormValidationErrorInput[]
  | undefined;
export type FormSchemaIssuePath = string | number | readonly (string | number)[];
export type FormSchemaIssue = {
  readonly key?: FieldValidityKey;
  readonly message: string;
  readonly name?: string;
  readonly path?: FormSchemaIssuePath;
};
export type FormSchemaResult =
  | {
      readonly success: true;
    }
  | {
      readonly errors?: readonly FormSchemaIssue[];
      readonly fieldErrors?: Record<string, FormValidationResult>;
      readonly formErrors?: FormValidationResult;
      readonly issues?: readonly FormSchemaIssue[];
      readonly success: false;
    };
export type FormSchemaParser = (values: FormValues) => FormSchemaResult;
export type FormSchemaValidationOptions = {
  readonly formErrorName?: string;
  readonly key?: FieldValidityKey;
  readonly source?: Extract<FieldValidationError["source"], "external" | "schema" | "server">;
};
export type FormSchemaValidation = {
  readonly errors: FormExternalErrors;
  readonly valid: boolean;
  readonly validatorResult: Record<string, FormValidationResult> | null;
};
export type FormFieldValidatorContext = {
  readonly field: FormFieldRegistration;
  readonly fields: FormFieldRegistration[];
  readonly form: HTMLFormElement;
  readonly name: string;
  readonly values: FormValues;
};
export type FormFieldValidator = (
  value: FormFieldRegistration["value"],
  context: FormFieldValidatorContext,
) => FormValidationResult;
export type FormFieldValidators = Record<string, FormFieldValidator | undefined>;
export type FormValidationCause = FormValidationTiming;
export type FormAsyncFieldValidatorContext = FormFieldValidatorContext & {
  readonly cause: FormValidationCause;
  readonly signal: AbortSignal;
};
export type FormAsyncFieldValidator = (
  value: FormFieldRegistration["value"],
  context: FormAsyncFieldValidatorContext,
) => FormValidationResult | Promise<FormValidationResult>;
export type FormAsyncFieldValidators = Record<string, FormAsyncFieldValidator | undefined>;
export type FormValidatorContext = {
  readonly fields: FormFieldRegistration[];
  readonly form: HTMLFormElement;
  readonly values: FormValues;
};
export type FormValidator = (
  values: FormValues,
  context: FormValidatorContext,
) => Record<string, FormValidationResult> | null | undefined;
export type FormAsyncValidatorContext = FormValidatorContext & {
  readonly cause: FormValidationCause;
  readonly signal: AbortSignal;
};
export type FormAsyncValidator = (
  values: FormValues,
  context: FormAsyncValidatorContext,
) =>
  | Record<string, FormValidationResult>
  | null
  | undefined
  | Promise<Record<string, FormValidationResult> | null | undefined>;
export type FormSubmitDetails = {
  readonly event: SubmitEvent;
  readonly fields: FormFieldRegistration[];
  readonly form: HTMLFormElement;
  readonly submitter: HTMLElement | null;
  readonly values: FormValues;
};
export type FormSubmitHandler = (details: FormSubmitDetails) => void;
export type FormOptions = {
  readonly asyncFieldValidators?: FormAsyncFieldValidators;
  readonly asyncFormValidators?: FormAsyncValidator | readonly FormAsyncValidator[];
  readonly asyncValidationDebounceMs?: number;
  readonly externalErrorsOnReset?: "clear" | "preserve";
  readonly fieldValidators?: FormFieldValidators;
  readonly formValidators?: FormValidator | readonly FormValidator[];
  readonly onSubmit?: FormSubmitHandler;
};
export type FormExternalErrorSource = Extract<
  FieldValidationError["source"],
  "external" | "schema" | "server"
>;
export type FormExternalErrorInput =
  | string
  | {
      readonly key?: FieldValidityKey;
      readonly message: string;
      readonly source?: FormExternalErrorSource;
    };
export type FormExternalErrors = Record<
  string,
  FormExternalErrorInput | readonly FormExternalErrorInput[]
>;
export type FormExternalErrorOptions = {
  readonly clearOnChange?: boolean;
  readonly visibility?: "immediate" | "policy";
};
export type FormValidationError = FieldValidationError & {
  readonly control?: HTMLElement;
  readonly field: HTMLElement;
  readonly name?: string;
};
export type FormValidateOptions = {
  readonly focus?: boolean;
  readonly names?: readonly string[];
  readonly reveal?: boolean;
};
export type FormResetValidationOptions = {
  readonly externalErrors?: "clear" | "preserve";
  readonly names?: readonly string[];
};
export type FormValidationOutcome =
  | {
      readonly errors: readonly FormValidationError[];
      readonly status: "complete";
      readonly valid: boolean;
    }
  | {
      readonly errors: readonly [];
      readonly status: "aborted";
      readonly valid: null;
    };

export type FormInstance = {
  readonly root: HTMLFormElement;
  destroy(): void;
  clearExternalErrors(name?: string): void;
  getErrors(): FormValidationError[];
  getFields(): FormFieldRegistration[];
  getState(): FormState;
  refresh(): void;
  resetValidation(options?: FormResetValidationOptions): void;
  setErrorsVisible(visible: boolean, names?: readonly string[]): void;
  setExternalErrors(errors: FormExternalErrors, options?: FormExternalErrorOptions): void;
  setOptions(options: FormOptions): void;
  validate(options?: FormValidateOptions): Promise<FormValidationOutcome>;
};

const FORM_ROOT_ATTRIBUTE = "data-sw-form";
const FIELD_ROOT_ATTRIBUTE = "data-sw-field";
const NATIVE_VALIDATION_ATTRIBUTE = "data-sw-native-validation";
const VALIDATION_TIMING_ATTRIBUTE = "data-validation-timing";
const REVALIDATION_TIMING_ATTRIBUTE = "data-revalidation-timing";
const ERROR_VISIBILITY_ATTRIBUTE = "data-error-visibility";
const FIELD_CONTROL_ATTRIBUTE = "data-sw-field-control";
const FIELD_ERROR_ATTRIBUTE = "data-sw-field-error";
const FIELD_LABEL_ATTRIBUTE = "data-sw-field-label";
const FORM_ERROR_SUMMARY_ATTRIBUTE = "data-sw-form-error-summary";
const FORM_ERROR_SUMMARY_ENTRY_ATTRIBUTE = "data-sw-form-error-summary-entry";
const FORM_ERROR_SUMMARY_ITEM_ATTRIBUTE = "data-sw-form-error-summary-item";
const FORM_ERROR_SUMMARY_LIST_ATTRIBUTE = "data-sw-form-error-summary-list";
const SELECT_ROOT_ATTRIBUTE = "data-sw-select";
const COMBOBOX_ROOT_ATTRIBUTE = "data-sw-combobox";
const REQUIRED_ATTRIBUTE = "data-required";

const VALIDITY_KEYS: readonly FieldValidityKey[] = [
  "badInput",
  "customError",
  "patternMismatch",
  "rangeOverflow",
  "rangeUnderflow",
  "stepMismatch",
  "tooLong",
  "tooShort",
  "typeMismatch",
  "valueMissing",
];
const FORM_POLICY_ATTRIBUTES = new Set([
  FORM_ROOT_ATTRIBUTE,
  FIELD_ROOT_ATTRIBUTE,
  VALIDATION_TIMING_ATTRIBUTE,
  REVALIDATION_TIMING_ATTRIBUTE,
  ERROR_VISIBILITY_ATTRIBUTE,
]);
const FORM_VALIDATION_TIMINGS: readonly FormValidationTiming[] = [
  "blur",
  "change",
  "manual",
  "submit",
];

type FormFieldPolicy = {
  errorVisibility: FormValidationTiming;
  revalidationTiming: FormValidationTiming;
  validationTiming: FormValidationTiming;
};

type SynchronousValidationOperation = {
  readonly bookkeeping: "mark-validated" | "preserve";
  readonly focus: "first-invalid" | "none";
  readonly reveal: "all-invalid" | "preserve" | "submit-policy";
  readonly submission: "enter-post-submit" | "preserve";
  readonly targets: readonly HTMLElement[];
};

type AsyncValidationBatch = {
  abortReason?: "field-removal";
  readonly controller: AbortController;
  readonly generation: number;
  readonly onAbort?: () => void;
  readonly writeFieldRoots: readonly HTMLElement[];
};

type CollectedAsyncValidationErrors = {
  readonly field: Map<HTMLElement, FormValidationError[]>;
  readonly form: Map<HTMLElement, FormValidationError[]>;
};

type CollectedSynchronousValidationErrors = {
  readonly customField: Map<HTMLElement, FormValidationError[]>;
  readonly customForm: Map<HTMLElement, FormValidationError[]>;
  readonly native: Map<HTMLElement, FormValidationError[]>;
};

type StoredExternalValidationError = FieldValidationError & {
  readonly name: string;
};

type FormErrorSummaryEntry = {
  readonly error: FormValidationError;
  readonly fieldIndex: number;
  readonly label: string;
  readonly message: string;
};

type NativeInputRevision = {
  readonly revision: object;
  readonly value: string;
};

type PendingChangeRevision = {
  nativeNotificationSeen: boolean;
  readonly policy: FormFieldPolicy;
  readonly postSubmit: boolean;
  readonly semanticNotifications: Event[];
};

const instances = new WeakMap<HTMLFormElement, FormController>();

export function createForm(root: HTMLElement, options: FormOptions = {}): FormInstance {
  assertHTMLElement(root, "createForm root");

  if (!(root instanceof HTMLFormElement)) {
    throw new TypeError("createForm root must be an HTMLFormElement");
  }

  const existing = instances.get(root);
  if (existing) {
    existing.setOptions(options);
    return existing;
  }

  const instance = new FormController(root, options);
  instances.set(root, instance);
  return instance;
}

export function createFormSchemaValidator(
  parser: FormSchemaParser,
  options: FormSchemaValidationOptions = {},
): FormValidator {
  return (values) => validateFormSchema(values, parser, options).validatorResult;
}

export function validateFormSchema(
  values: FormValues,
  parser: FormSchemaParser,
  options: FormSchemaValidationOptions = {},
): FormSchemaValidation {
  const result = parser(values);
  const validatorResult = mapFormSchemaValidatorResult(result, options);
  const errors = mapFormSchemaExternalErrors(result, options);

  return {
    errors,
    valid: validatorResult === null,
    validatorResult,
  };
}

class FormController implements FormInstance {
  readonly root: HTMLFormElement;

  private readonly abortController = new AbortController();
  private readonly adoptedInitialErrorFieldRoots = new WeakSet<HTMLElement>();
  private readonly asyncFieldErrors = new Map<HTMLElement, FormValidationError[]>();
  private readonly asyncFormErrors = new Map<HTMLElement, FormValidationError[]>();
  private readonly asyncFieldValidators = new Map<string, FormAsyncFieldValidator>();
  private readonly customFieldErrors = new Map<HTMLElement, FormValidationError[]>();
  private readonly customFormErrors = new Map<HTMLElement, FormValidationError[]>();
  private readonly externalClearOnChangeNames = new Set<string>();
  private readonly externalErrorsByName = new Map<string, StoredExternalValidationError[]>();
  private readonly fieldErrors = new Map<HTMLElement, FormValidationError[]>();
  private readonly fieldInstances = new Map<HTMLElement, FieldInstance>();
  private readonly fieldValidators = new Map<string, FormFieldValidator>();
  private readonly validatingFieldRoots = new Set<HTMLElement>();
  private readonly validatedFieldRoots = new Set<HTMLElement>();
  private readonly revealedFieldRoots = new Set<HTMLElement>();
  private readonly activePendingChangeRevisions = new WeakMap<HTMLElement, WeakSet<object>>();
  private readonly nativeInputRevisions = new WeakMap<
    HTMLElement,
    WeakMap<HTMLElement, NativeInputRevision>
  >();
  private readonly pendingChangeRevisions = new WeakMap<
    object,
    WeakMap<HTMLElement, PendingChangeRevision>
  >();
  private readonly processedChangeRevisions = new WeakMap<HTMLElement, WeakSet<object>>();
  private readonly mutationObserver: MutationObserver;
  private readonly originalCheckValidity: HTMLFormElement["checkValidity"];
  private readonly originalReportValidity: HTMLFormElement["reportValidity"];
  private readonly rootHadOwnCheckValidity: boolean;
  private readonly rootHadOwnReportValidity: boolean;
  private destroyed = false;
  private focusTimer: number | undefined;
  private invalidEventResetTimer: number | undefined;
  private invalidEventValidationScheduled = false;
  private nativeValidityCheckDepth = 0;
  private pendingFocus: FormFieldRegistration | undefined;
  private validationGeneration = 0;
  private asyncFormValidators: FormAsyncValidator[] = [];
  private currentAsyncValidationBatch: AsyncValidationBatch | undefined;
  private asyncValidationDebounceMs = 0;
  private asyncValidationTimer: number | undefined;
  private externalErrorsOnReset: "clear" | "preserve" = "clear";
  private formValidators: FormValidator[] = [];
  private submitAttempted = false;
  private submitHandler: FormSubmitHandler | undefined;

  constructor(root: HTMLFormElement, options: FormOptions) {
    this.root = root;
    this.mutationObserver = new MutationObserver(this.handleMutations);
    this.originalCheckValidity = root.checkValidity;
    this.originalReportValidity = root.reportValidity;
    this.rootHadOwnCheckValidity = Object.hasOwn(root, "checkValidity");
    this.rootHadOwnReportValidity = Object.hasOwn(root, "reportValidity");

    this.refresh();
    this.setOptions(options);
    this.patchValidationMethods();
    this.bindEvents();
    this.mutationObserver.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  destroy(): void {
    if (this.destroyed) return;

    this.mutationObserver.disconnect();
    this.abortController.abort();
    this.cancelAsyncValidation();
    this.clearFocusTimer();
    this.clearInvalidEventResetTimer();
    this.restoreValidationMethods();
    this.destroyRegisteredFields();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getErrors(): FormValidationError[] {
    return Array.from(this.fieldInstances.keys()).flatMap((fieldRoot) =>
      this.getCombinedFieldErrors(fieldRoot),
    );
  }

  getFields(): FormFieldRegistration[] {
    return Array.from(this.fieldInstances.values()).map((field) => field.getFormRegistration());
  }

  getState(): FormState {
    return { fieldCount: this.fieldInstances.size };
  }

  validate(options: FormValidateOptions = {}): Promise<FormValidationOutcome> {
    if (this.destroyed) {
      return Promise.resolve({ errors: [], status: "aborted", valid: null });
    }
    if (options.names?.length === 0) {
      return Promise.resolve({ errors: [], status: "complete", valid: true });
    }

    const targetFieldRoots = this.resolveValidationTargets(options.names);
    this.cancelAsyncValidation();
    if (targetFieldRoots.length === 0) {
      return Promise.resolve({ errors: [], status: "complete", valid: true });
    }

    let synchronousErrors: CollectedSynchronousValidationErrors;
    try {
      synchronousErrors = this.collectSynchronousValidationErrors(
        targetFieldRoots,
        options.names === undefined,
      );
    } catch (error) {
      return Promise.reject(error);
    }

    const fullValidation = options.names === undefined;
    const asyncFieldRoots = targetFieldRoots.filter(
      (fieldRoot) =>
        this.isSynchronousFieldValid(fieldRoot, synchronousErrors) &&
        this.hasAsyncFieldValidator(fieldRoot),
    );
    const runAsyncFormValidators =
      fullValidation &&
      this.isFullSynchronousValidationValid(targetFieldRoots, synchronousErrors) &&
      this.asyncFormValidators.length > 0;
    const validatingFieldRoots = runAsyncFormValidators ? targetFieldRoots : asyncFieldRoots;

    if (validatingFieldRoots.length === 0) {
      return Promise.resolve(
        this.commitImperativeValidation(
          targetFieldRoots,
          synchronousErrors,
          { field: new Map(), form: new Map() },
          fullValidation,
          options,
        ),
      );
    }

    return new Promise<FormValidationOutcome>((resolve, reject) => {
      let settled = false;
      const settle = (outcome: FormValidationOutcome) => {
        if (settled) return;
        settled = true;
        resolve(outcome);
      };
      const batch = this.beginAsyncValidationBatch(validatingFieldRoots, {
        onAbort: () => settle({ errors: [], status: "aborted", valid: null }),
        writeFieldRoots: targetFieldRoots,
      });

      void this.collectAsyncValidationErrors(
        asyncFieldRoots,
        "manual",
        batch.controller.signal,
        runAsyncFormValidators,
        true,
      ).then(
        (asyncErrors) => {
          if (!this.isCurrentAsyncValidationBatch(batch)) {
            settle({ errors: [], status: "aborted", valid: null });
            return;
          }

          const outcome = this.commitImperativeValidation(
            targetFieldRoots,
            synchronousErrors,
            asyncErrors,
            fullValidation,
            options,
          );
          this.finishAsyncValidationBatch(batch);
          settle(outcome);
        },
        (error: unknown) => {
          this.finishAsyncValidationBatch(batch);
          if (!settled) {
            settled = true;
            reject(error);
          }
        },
      );
    });
  }

  resetValidation(options: FormResetValidationOptions = {}): void {
    if (this.destroyed || options.names?.length === 0) return;

    const targetFieldRoots = this.resolveValidationTargets(options.names);
    const fullReset = options.names === undefined;
    if (!fullReset && targetFieldRoots.length === 0) return;

    this.invalidatePendingValidationOwnership();
    this.resetValidationState(
      targetFieldRoots,
      fullReset,
      options.externalErrors ?? this.externalErrorsOnReset,
    );
  }

  setErrorsVisible(visible: boolean, names?: readonly string[]): void {
    if (this.destroyed || names?.length === 0) return;

    const targetFieldRoots = this.resolveValidationTargets(names);
    if (targetFieldRoots.length === 0) return;

    targetFieldRoots.forEach((fieldRoot) => {
      if (visible) {
        this.revealedFieldRoots.add(fieldRoot);
      } else {
        this.revealedFieldRoots.delete(fieldRoot);
      }
      this.syncFieldValidationState(fieldRoot);
    });
  }

  private resolveValidationTargets(names?: readonly string[]): HTMLElement[] {
    const fieldRoots = this.getRegisteredFieldRootsInDomOrder();
    if (names === undefined) return fieldRoots;

    const requestedNames = new Set(names);
    return fieldRoots.filter((fieldRoot) => {
      const name = this.fieldInstances.get(fieldRoot)?.getFormRegistration().name;
      return name !== undefined && requestedNames.has(name);
    });
  }

  private resetValidationState(
    targetFieldRoots: readonly HTMLElement[],
    fullReset: boolean,
    externalErrors: "clear" | "preserve",
  ): void {
    const targetSet = new Set(targetFieldRoots);
    const previouslyRevealed = new Set(
      targetFieldRoots.filter((fieldRoot) => this.revealedFieldRoots.has(fieldRoot)),
    );

    this.cancelAsyncValidationIfTargetsIntersect(targetSet);

    if (fullReset) {
      this.submitAttempted = false;
    }
    if (fullReset || (this.pendingFocus && targetSet.has(this.pendingFocus.root))) {
      this.pendingFocus = undefined;
      this.clearFocusTimer();
    }

    targetFieldRoots.forEach((fieldRoot) => {
      this.asyncFieldErrors.delete(fieldRoot);
      this.asyncFormErrors.delete(fieldRoot);
      this.customFieldErrors.delete(fieldRoot);
      this.customFormErrors.delete(fieldRoot);
      this.fieldErrors.delete(fieldRoot);
      this.validatingFieldRoots.delete(fieldRoot);
      this.validatedFieldRoots.delete(fieldRoot);
      this.revealedFieldRoots.delete(fieldRoot);
      this.clearChangeRevisionBookkeeping(fieldRoot);
    });

    if (externalErrors === "clear") {
      if (fullReset) {
        this.externalErrorsByName.clear();
        this.externalClearOnChangeNames.clear();
      } else {
        targetFieldRoots.forEach((fieldRoot) => {
          const name = this.fieldInstances.get(fieldRoot)?.getFormRegistration().name;
          if (!name) return;
          this.externalErrorsByName.delete(name);
          this.externalClearOnChangeNames.delete(name);
        });
      }
    } else {
      targetFieldRoots.forEach((fieldRoot) => {
        if (this.getExternalFieldErrors(fieldRoot).length === 0) return;

        this.validatedFieldRoots.add(fieldRoot);
        if (previouslyRevealed.has(fieldRoot)) {
          this.revealedFieldRoots.add(fieldRoot);
        }
      });
    }

    this.renderValidatingState();
    targetFieldRoots.forEach((fieldRoot) => this.syncFieldValidationState(fieldRoot));
    this.renderErrorSummaries();
  }

  private collectSynchronousValidationErrors(
    targetFieldRoots: readonly HTMLElement[],
    includeFormValidators: boolean,
  ): CollectedSynchronousValidationErrors {
    const values = readFormValues(this.root);
    const fields = this.getFields();
    const native = new Map<HTMLElement, FormValidationError[]>();
    targetFieldRoots.forEach((fieldRoot) => {
      const errors = this.collectNativeFieldErrors(fieldRoot);
      if (errors.length > 0) native.set(fieldRoot, errors);
    });

    return {
      customField: this.collectFieldCustomValidationErrors(targetFieldRoots, values, fields),
      customForm: includeFormValidators
        ? this.collectFormCustomValidationErrors(values, fields)
        : new Map(),
      native,
    };
  }

  private isSynchronousFieldValid(
    fieldRoot: HTMLElement,
    errors: CollectedSynchronousValidationErrors,
  ): boolean {
    return (
      (errors.native.get(fieldRoot)?.length ?? 0) === 0 &&
      (errors.customField.get(fieldRoot)?.length ?? 0) === 0
    );
  }

  private isFullSynchronousValidationValid(
    targetFieldRoots: readonly HTMLElement[],
    errors: CollectedSynchronousValidationErrors,
  ): boolean {
    return targetFieldRoots.every(
      (fieldRoot) =>
        this.isSynchronousFieldValid(fieldRoot, errors) &&
        (errors.customForm.get(fieldRoot)?.length ?? 0) === 0,
    );
  }

  private hasAsyncFieldValidator(fieldRoot: HTMLElement): boolean {
    const name = this.fieldInstances.get(fieldRoot)?.getFormRegistration().name;
    return name !== undefined && this.asyncFieldValidators.has(name);
  }

  private commitImperativeValidation(
    targetFieldRoots: readonly HTMLElement[],
    synchronousErrors: CollectedSynchronousValidationErrors,
    asyncErrors: CollectedAsyncValidationErrors,
    fullValidation: boolean,
    options: FormValidateOptions,
  ): FormValidationOutcome {
    targetFieldRoots.forEach((fieldRoot) => {
      replaceValidationErrors(this.fieldErrors, fieldRoot, synchronousErrors.native.get(fieldRoot));
      replaceValidationErrors(
        this.customFieldErrors,
        fieldRoot,
        synchronousErrors.customField.get(fieldRoot),
      );
      replaceValidationErrors(this.asyncFieldErrors, fieldRoot, asyncErrors.field.get(fieldRoot));
      this.validatedFieldRoots.add(fieldRoot);
    });

    if (fullValidation) {
      targetFieldRoots.forEach((fieldRoot) => {
        replaceValidationErrors(
          this.customFormErrors,
          fieldRoot,
          synchronousErrors.customForm.get(fieldRoot),
        );
        replaceValidationErrors(this.asyncFormErrors, fieldRoot, asyncErrors.form.get(fieldRoot));
      });
    }

    targetFieldRoots.forEach((fieldRoot) => {
      if (this.getCombinedFieldErrors(fieldRoot).length === 0) return;
      if (options.reveal === true) {
        this.revealedFieldRoots.add(fieldRoot);
      } else if (options.reveal === undefined) {
        this.updateErrorVisibility(fieldRoot, "manual");
      }
    });
    targetFieldRoots.forEach((fieldRoot) => this.syncFieldValidationState(fieldRoot));

    const errors = targetFieldRoots.flatMap((fieldRoot) => this.getCombinedFieldErrors(fieldRoot));
    if (options.focus === true && errors.length > 0) {
      this.findFirstInvalidFieldRegistration([...targetFieldRoots])?.focus();
    }

    return { errors, status: "complete", valid: errors.length === 0 };
  }

  setOptions(options: FormOptions): void {
    if (this.destroyed) return;

    let shouldClearCustomErrors = false;
    let shouldClearAsyncErrors = false;

    if (Object.hasOwn(options, "fieldValidators")) {
      this.fieldValidators.clear();
      Object.entries(options.fieldValidators ?? {}).forEach(([name, validator]) => {
        if (name.length > 0 && validator) {
          this.fieldValidators.set(name, validator);
        }
      });
      shouldClearCustomErrors = true;
    }

    if (Object.hasOwn(options, "formValidators")) {
      this.formValidators = normalizeFormValidators(options.formValidators);
      shouldClearCustomErrors = true;
    }

    if (Object.hasOwn(options, "asyncFieldValidators")) {
      this.asyncFieldValidators.clear();
      Object.entries(options.asyncFieldValidators ?? {}).forEach(([name, validator]) => {
        if (name.length > 0 && validator) {
          this.asyncFieldValidators.set(name, validator);
        }
      });
      shouldClearAsyncErrors = true;
    }

    if (Object.hasOwn(options, "asyncFormValidators")) {
      this.asyncFormValidators = normalizeAsyncFormValidators(options.asyncFormValidators);
      shouldClearAsyncErrors = true;
    }

    if (Object.hasOwn(options, "asyncValidationDebounceMs")) {
      this.asyncValidationDebounceMs = Math.max(0, options.asyncValidationDebounceMs ?? 0);
    }

    if (Object.hasOwn(options, "onSubmit")) {
      this.submitHandler = options.onSubmit;
    }

    if (Object.hasOwn(options, "externalErrorsOnReset")) {
      this.externalErrorsOnReset = options.externalErrorsOnReset ?? "clear";
    }

    if (shouldClearCustomErrors) {
      this.customFieldErrors.clear();
      this.customFormErrors.clear();
      this.fieldInstances.forEach((_field, fieldRoot) => this.syncFieldValidationState(fieldRoot));
    }

    if (shouldClearAsyncErrors) {
      this.cancelAsyncValidation();
      this.asyncFieldErrors.clear();
      this.asyncFormErrors.clear();
      this.fieldInstances.forEach((_field, fieldRoot) => this.syncFieldValidationState(fieldRoot));
    }
  }

  setExternalErrors(errors: FormExternalErrors, options: FormExternalErrorOptions = {}): void {
    if (this.destroyed) return;

    this.externalErrorsByName.clear();
    this.externalClearOnChangeNames.clear();

    Object.entries(errors).forEach(([name, input]) => {
      const normalized = normalizeExternalErrorInputs(name, input);
      if (normalized.length === 0) return;

      this.externalErrorsByName.set(name, normalized);
      if (options.clearOnChange) {
        this.externalClearOnChangeNames.add(name);
      }
    });

    this.fieldInstances.forEach((field, fieldRoot) => {
      const name = field.getFormRegistration().name;
      if (name && this.externalErrorsByName.has(name)) {
        this.validatedFieldRoots.add(fieldRoot);
        if ((options.visibility ?? "immediate") === "immediate") {
          this.revealedFieldRoots.add(fieldRoot);
        }
      }
      this.syncFieldValidationState(fieldRoot);
    });
  }

  clearExternalErrors(name?: string): void {
    if (this.destroyed) return;

    if (name === undefined) {
      this.externalErrorsByName.clear();
      this.externalClearOnChangeNames.clear();
    } else {
      this.externalErrorsByName.delete(name);
      this.externalClearOnChangeNames.delete(name);
    }

    this.fieldInstances.forEach((_field, fieldRoot) => this.syncFieldValidationState(fieldRoot));
  }

  refresh(): void {
    if (this.destroyed) return;

    if (!this.root.hasAttribute(FORM_ROOT_ATTRIBUTE)) {
      this.root.setAttribute(FORM_ROOT_ATTRIBUTE, "");
    }

    const fieldRoots = getOwnFieldRoots(this.root);
    const nextFieldRoots = new Set(fieldRoots);
    const removedFieldRoots = new Set(
      Array.from(this.fieldInstances.keys()).filter((fieldRoot) => !nextFieldRoots.has(fieldRoot)),
    );

    this.cancelAsyncValidationIfTargetsIntersect(removedFieldRoots, "field-removal");

    removedFieldRoots.forEach((fieldRoot) => {
      this.fieldInstances.get(fieldRoot)?.destroy();
      this.fieldInstances.delete(fieldRoot);
      this.asyncFieldErrors.delete(fieldRoot);
      this.asyncFormErrors.delete(fieldRoot);
      this.fieldErrors.delete(fieldRoot);
      this.validatingFieldRoots.delete(fieldRoot);
      this.validatedFieldRoots.delete(fieldRoot);
      this.revealedFieldRoots.delete(fieldRoot);
      this.clearChangeRevisionBookkeeping(fieldRoot);
      clearManagedFieldStateAttributes(fieldRoot);
    });

    fieldRoots.forEach((fieldRoot) => {
      if (!this.fieldInstances.has(fieldRoot)) {
        this.adoptInitialExternalErrors(fieldRoot);
        this.fieldInstances.set(fieldRoot, createField(fieldRoot));
      }
      this.syncFieldValidationState(fieldRoot);
    });

    this.renderErrorSummaries();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("invalid", this.handleInvalid, { capture: true, signal });
    this.root.addEventListener("input", this.handleControlMutationEvent, { signal });
    this.root.addEventListener("change", this.handleControlMutationEvent, { signal });
    this.root.addEventListener("click", this.handleSummaryClick, { signal });
    this.root.addEventListener("focusout", this.handleFieldBlur, { signal });
    this.root.addEventListener("starwind:value-change", this.handleControlMutationEvent, {
      signal,
    });
    this.root.addEventListener("starwind:checked-change", this.handleControlMutationEvent, {
      signal,
    });
    this.root.addEventListener("starwind:value-committed", this.handleControlMutationEvent, {
      signal,
    });
    this.root.addEventListener("submit", this.handleSubmit, { capture: true, signal });
    this.root.addEventListener("reset", this.handleReset, { signal });
  }

  private destroyRegisteredFields(): void {
    this.fieldInstances.forEach((field, fieldRoot) => {
      field.destroy();
      this.clearChangeRevisionBookkeeping(fieldRoot);
    });
    this.fieldInstances.clear();
    this.customFieldErrors.clear();
    this.customFormErrors.clear();
    this.asyncFieldErrors.clear();
    this.asyncFormErrors.clear();
    this.fieldErrors.clear();
    this.validatingFieldRoots.clear();
    this.validatedFieldRoots.clear();
    this.revealedFieldRoots.clear();
    this.renderValidatingState();
    this.renderErrorSummaries();
  }

  private readonly handleMutations = (mutations: MutationRecord[]): void => {
    if (this.destroyed) return;

    if (mutations.some((mutation) => this.shouldRefreshForMutation(mutation))) {
      this.clearRemovedFieldBookkeeping(mutations);
      this.refresh();
    }
  };

  private readonly handleInvalid = (event: Event): void => {
    if (this.destroyed || !(event.target instanceof HTMLElement)) return;
    if (this.allowsNativeValidation()) return;

    const fieldRoot = this.findFieldRootForControl(event.target);
    if (!fieldRoot) return;

    event.preventDefault();
    if (this.nativeValidityCheckDepth > 0) return;

    if (this.invalidEventValidationScheduled) return;

    this.invalidEventValidationScheduled = true;
    this.cancelAsyncValidation();
    this.runSynchronousValidation({
      bookkeeping: "mark-validated",
      focus: "first-invalid",
      reveal: "submit-policy",
      submission: "enter-post-submit",
      targets: this.getRegisteredFieldRootsInDomOrder(),
    });
    this.scheduleInvalidEventValidationReset();
  };

  private readonly handleControlMutationEvent = (event: Event): void => {
    if (this.destroyed || !(event.target instanceof HTMLElement)) return;

    const fieldRoot = this.findFieldRootForControl(event.target);
    if (!fieldRoot) return;

    const semantic = event.type.startsWith("starwind:");
    const revision = semantic
      ? (getFormValueRevision(event) ?? {})
      : this.resolveNativeChangeRevision(fieldRoot, event.target, event);
    this.queueChangeRevision(fieldRoot, revision, event, semantic);
  };

  private resolveNativeChangeRevision(
    fieldRoot: HTMLElement,
    control: HTMLElement,
    event: Event,
  ): object {
    const attachedRevision = getFormValueRevision(event);
    const value = readNativeRevisionValue(control);
    let revisionsByControl = this.nativeInputRevisions.get(fieldRoot);

    if (!revisionsByControl) {
      revisionsByControl = new WeakMap();
      this.nativeInputRevisions.set(fieldRoot, revisionsByControl);
    }

    if (event.type === "input") {
      const revision = attachedRevision ?? {};
      revisionsByControl.set(control, { revision, value });
      return revision;
    }

    const inputRevision = revisionsByControl.get(control);
    revisionsByControl.delete(control);
    if (attachedRevision) return attachedRevision;
    if (inputRevision?.value === value) return inputRevision.revision;
    return {};
  }

  private queueChangeRevision(
    fieldRoot: HTMLElement,
    revision: object,
    event: Event,
    semantic: boolean,
  ): void {
    if (this.processedChangeRevisions.get(fieldRoot)?.has(revision)) return;

    let fieldsForRevision = this.pendingChangeRevisions.get(revision);
    if (!fieldsForRevision) {
      fieldsForRevision = new WeakMap();
      this.pendingChangeRevisions.set(revision, fieldsForRevision);
    }

    let activeRevisions = this.activePendingChangeRevisions.get(fieldRoot);
    let pending = fieldsForRevision.get(fieldRoot);
    if (!pending || !activeRevisions?.has(revision)) {
      pending = {
        nativeNotificationSeen: false,
        policy: this.getFieldPolicy(fieldRoot),
        postSubmit: this.submitAttempted,
        semanticNotifications: [],
      };
      fieldsForRevision.set(fieldRoot, pending);
      if (!activeRevisions) {
        activeRevisions = new WeakSet();
        this.activePendingChangeRevisions.set(fieldRoot, activeRevisions);
      }
      activeRevisions.add(revision);
      window.setTimeout(() => this.flushChangeRevision(fieldRoot, revision, pending!), 0);
    }

    if (semantic) {
      pending.semanticNotifications.push(event);
    } else {
      pending.nativeNotificationSeen = true;
    }
  }

  private flushChangeRevision(
    fieldRoot: HTMLElement,
    revision: object,
    pending: PendingChangeRevision,
  ): void {
    const activeRevisions = this.activePendingChangeRevisions.get(fieldRoot);
    if (!activeRevisions?.has(revision)) return;
    activeRevisions.delete(revision);
    if (this.destroyed || !this.fieldInstances.has(fieldRoot)) return;
    if (this.processedChangeRevisions.get(fieldRoot)?.has(revision)) return;

    const accepted =
      pending.semanticNotifications.length > 0
        ? pending.semanticNotifications.some((event) => !isSemanticNotificationCanceled(event))
        : pending.nativeNotificationSeen;
    if (!accepted) return;

    let processed = this.processedChangeRevisions.get(fieldRoot);
    if (!processed) {
      processed = new WeakSet();
      this.processedChangeRevisions.set(fieldRoot, processed);
    }
    processed.add(revision);
    this.handlePolicyEvent(fieldRoot, "change", pending.policy, pending.postSubmit);
  }

  private clearChangeRevisionBookkeeping(fieldRoot: HTMLElement): void {
    this.activePendingChangeRevisions.delete(fieldRoot);
    this.nativeInputRevisions.delete(fieldRoot);
    this.processedChangeRevisions.delete(fieldRoot);
  }

  private readonly handleFieldBlur = (event: FocusEvent): void => {
    if (this.destroyed || !(event.target instanceof HTMLElement)) return;

    const fieldRoot = this.findFieldRootForControl(event.target);
    if (!fieldRoot) return;
    if (event.relatedTarget instanceof Node && fieldRoot.contains(event.relatedTarget)) return;

    this.handlePolicyEvent(fieldRoot, "blur");
  };

  private readonly handleSummaryClick = (event: MouseEvent): void => {
    if (this.destroyed || !(event.target instanceof Element)) return;

    const item = event.target.closest<HTMLElement>(`[${FORM_ERROR_SUMMARY_ITEM_ATTRIBUTE}]`);
    if (!item || item.closest(`[${FORM_ROOT_ATTRIBUTE}]`) !== this.root) return;

    const fieldIndex = Number(item.getAttribute("data-field-index"));
    if (!Number.isInteger(fieldIndex) || fieldIndex < 0) return;

    const fieldRoot = this.getRegisteredFieldRootsInDomOrder()[fieldIndex];
    const field = fieldRoot ? this.fieldInstances.get(fieldRoot) : undefined;
    if (!field) return;

    event.preventDefault();
    field.getFormRegistration().focus();
  };

  private readonly handleReset = (): void => {
    this.invalidatePendingValidationOwnership();
    this.pendingFocus = undefined;
    this.clearFocusTimer();
    this.cancelAsyncValidationIfTargetsIntersect(new Set(this.getRegisteredFieldRootsInDomOrder()));
    window.setTimeout(() => {
      if (this.destroyed) return;

      this.resetValidationState(
        this.getRegisteredFieldRootsInDomOrder(),
        true,
        this.externalErrorsOnReset,
      );
    }, 0);
  };

  private readonly handleSubmit = (event: SubmitEvent): void => {
    if (this.destroyed) return;

    if (this.submitHandler) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      void this.runValidationForManagedSubmit(event, submitter);
      return;
    }

    if (!this.runSynchronousSubmitValidation()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  private patchValidationMethods(): void {
    Object.defineProperty(this.root, "checkValidity", {
      configurable: true,
      value: () => this.checkValidity(),
    });
    Object.defineProperty(this.root, "reportValidity", {
      configurable: true,
      value: () => this.reportValidity(),
    });
  }

  private restoreValidationMethods(): void {
    if (this.rootHadOwnCheckValidity) {
      Object.defineProperty(this.root, "checkValidity", {
        configurable: true,
        value: this.originalCheckValidity,
      });
    } else {
      Reflect.deleteProperty(this.root, "checkValidity");
    }

    if (this.rootHadOwnReportValidity) {
      Object.defineProperty(this.root, "reportValidity", {
        configurable: true,
        value: this.originalReportValidity,
      });
    } else {
      Reflect.deleteProperty(this.root, "reportValidity");
    }
  }

  private checkValidity(): boolean {
    if (this.destroyed || this.allowsNativeValidation()) {
      return this.originalCheckValidity.call(this.root);
    }

    this.validationGeneration += 1;

    const nativeValid = this.runNativeValidityCheck(() =>
      this.originalCheckValidity.call(this.root),
    );
    const managedValid = this.runSynchronousValidation({
      bookkeeping: "mark-validated",
      focus: "none",
      reveal: "preserve",
      submission: "preserve",
      targets: this.getRegisteredFieldRootsInDomOrder(),
    });

    return nativeValid && managedValid;
  }

  private reportValidity(): boolean {
    if (this.destroyed || this.allowsNativeValidation()) {
      return this.originalReportValidity.call(this.root);
    }

    this.validationGeneration += 1;

    const nativeValid = this.runNativeValidityCheck(() =>
      this.originalReportValidity.call(this.root),
    );
    const managedValid = this.runSynchronousValidation({
      bookkeeping: "mark-validated",
      focus: "first-invalid",
      reveal: "all-invalid",
      submission: "preserve",
      targets: this.getRegisteredFieldRootsInDomOrder(),
    });

    return nativeValid && managedValid;
  }

  private allowsNativeValidation(): boolean {
    return this.root.hasAttribute(NATIVE_VALIDATION_ATTRIBUTE);
  }

  private runNativeValidityCheck(check: () => boolean): boolean {
    this.nativeValidityCheckDepth += 1;
    try {
      return check();
    } finally {
      this.nativeValidityCheckDepth -= 1;
    }
  }

  private runSynchronousValidation(operation: SynchronousValidationOperation): boolean {
    let valid = true;

    if (operation.submission === "enter-post-submit") {
      this.submitAttempted = true;
    }
    if (operation.focus === "first-invalid") {
      this.pendingFocus = undefined;
      this.clearFocusTimer();
    }

    this.validateCustomFields();

    operation.targets.forEach((fieldRoot) => {
      if (!this.fieldInstances.has(fieldRoot)) return;
      if (operation.bookkeeping === "mark-validated") {
        this.validatedFieldRoots.add(fieldRoot);
      }

      this.computeNativeFieldErrors(fieldRoot);
      const fieldValid = this.getCombinedFieldErrors(fieldRoot).length === 0;
      if (!fieldValid && operation.reveal === "all-invalid") {
        this.revealedFieldRoots.add(fieldRoot);
      } else if (operation.reveal === "submit-policy") {
        this.updateErrorVisibility(fieldRoot, "submit");
      }

      if (!fieldValid) {
        valid = false;
        if (operation.focus === "first-invalid") {
          this.pendingFocus ??= this.fieldInstances.get(fieldRoot)?.getFormRegistration();
        }
      }
    });

    this.fieldInstances.forEach((_field, fieldRoot) => this.syncFieldValidationState(fieldRoot));
    if (!valid && operation.focus === "first-invalid") {
      this.scheduleFirstInvalidFocus();
    }
    return valid;
  }

  private validateNativeField(fieldRoot: HTMLElement): boolean {
    return this.runSynchronousValidation({
      bookkeeping: "preserve",
      focus: "none",
      reveal: "preserve",
      submission: "preserve",
      targets: [fieldRoot],
    });
  }

  private computeNativeFieldErrors(fieldRoot: HTMLElement): void {
    const errors = this.collectNativeFieldErrors(fieldRoot);
    if (errors.length > 0) {
      this.fieldErrors.set(fieldRoot, errors);
    } else {
      this.fieldErrors.delete(fieldRoot);
    }
  }

  private collectNativeFieldErrors(fieldRoot: HTMLElement): FormValidationError[] {
    const field = this.fieldInstances.get(fieldRoot);
    if (!field) return [];

    const registration = field.getFormRegistration();
    const errors = [
      ...getOwnNativeControls(fieldRoot).flatMap((control) => readNativeValidationErrors(control)),
      ...readRuntimeValidationErrors(registration),
    ];
    return errors.map((error) => ({
      ...error,
      control: registration.control,
      field: fieldRoot,
      name: registration.name,
    }));
  }

  private validateCustomFields(): void {
    const values = readFormValues(this.root);
    const fields = this.getFields();
    this.customFieldErrors.clear();
    this.collectFieldCustomValidationErrors(
      this.getRegisteredFieldRootsInDomOrder(),
      values,
      fields,
    ).forEach((errors, fieldRoot) => this.customFieldErrors.set(fieldRoot, errors));
    this.customFormErrors.clear();
    this.collectFormCustomValidationErrors(values, fields).forEach((errors, fieldRoot) =>
      this.customFormErrors.set(fieldRoot, errors),
    );
  }

  private collectFieldCustomValidationErrors(
    targetFieldRoots: readonly HTMLElement[],
    values = readFormValues(this.root),
    fields = this.getFields(),
  ): Map<HTMLElement, FormValidationError[]> {
    const errorsByFieldRoot = new Map<HTMLElement, FormValidationError[]>();

    targetFieldRoots.forEach((fieldRoot) => {
      const field = this.fieldInstances.get(fieldRoot);
      if (!field) return;

      const registration = field.getFormRegistration();
      const name = registration.name;
      if (!name || registration.disabled) return;

      const validator = this.fieldValidators.get(name);
      if (!validator) return;

      const errors = normalizeCustomValidationResult(
        validator(registration.value, {
          field: registration,
          fields,
          form: this.root,
          name,
          values,
        }),
      );
      if (errors.length === 0) return;

      errorsByFieldRoot.set(
        fieldRoot,
        errors.map((error) => ({
          ...error,
          control: registration.control,
          field: fieldRoot,
          name,
        })),
      );
    });

    return errorsByFieldRoot;
  }

  private collectFormCustomValidationErrors(
    values = readFormValues(this.root),
    fields = this.getFields(),
  ): Map<HTMLElement, FormValidationError[]> {
    const formErrorsByName = new Map<string, FieldValidationError[]>();

    this.formValidators.forEach((validator) => {
      const result = validator(values, { fields, form: this.root, values });
      if (!result) return;

      Object.entries(result).forEach(([name, validationResult]) => {
        if (name.length === 0) return;

        const errors = normalizeCustomValidationResult(validationResult);
        if (errors.length === 0) return;

        formErrorsByName.set(name, [...(formErrorsByName.get(name) ?? []), ...errors]);
      });
    });

    const errorsByFieldRoot = new Map<HTMLElement, FormValidationError[]>();

    this.fieldInstances.forEach((field, fieldRoot) => {
      const registration = field.getFormRegistration();
      const name = registration.name;
      if (!name || registration.disabled) return;

      const errors = formErrorsByName.get(name) ?? [];
      if (errors.length === 0) return;

      errorsByFieldRoot.set(
        fieldRoot,
        errors.map((error) => ({
          ...error,
          control: registration.control,
          field: fieldRoot,
          name,
        })),
      );
    });

    return errorsByFieldRoot;
  }

  private syncFieldValidationState(fieldRoot: HTMLElement): void {
    const field = this.fieldInstances.get(fieldRoot);
    if (!field) return;

    const errors = this.getCombinedFieldErrors(fieldRoot);
    const state: FieldFormValidationState = {
      errors: errors.map((error) => ({
        key: error.key,
        message: error.message,
        source: error.source,
      })),
      submitted: this.submitAttempted,
      validated: this.validatedFieldRoots.has(fieldRoot),
      validating: this.validatingFieldRoots.has(fieldRoot),
      visible: this.revealedFieldRoots.has(fieldRoot),
    };

    field.setFormValidationState(state);
    this.renderErrorSummaries();
  }

  private renderErrorSummaries(): void {
    const summaries = getOwnFormErrorSummaryRoots(this.root);
    if (summaries.length === 0) return;

    const entries = this.getVisibleErrorSummaryEntries();
    summaries.forEach((summary) => renderFormErrorSummary(summary, entries));
  }

  private getVisibleErrorSummaryEntries(): FormErrorSummaryEntry[] {
    return this.getRegisteredFieldRootsInDomOrder().flatMap((fieldRoot, fieldIndex) => {
      if (!this.revealedFieldRoots.has(fieldRoot)) return [];

      return this.getCombinedFieldErrors(fieldRoot).map((error) => ({
        error,
        fieldIndex,
        label: readFieldSummaryLabel(fieldRoot, error.name),
        message: readFieldSummaryErrorMessage(fieldRoot, error),
      }));
    });
  }

  private getRegisteredFieldRootsInDomOrder(): HTMLElement[] {
    return getOwnFieldRoots(this.root).filter((fieldRoot) => this.fieldInstances.has(fieldRoot));
  }

  private shouldRefreshForMutation(mutation: MutationRecord): boolean {
    if (
      mutation.type === "attributes" &&
      mutation.attributeName !== null &&
      FORM_POLICY_ATTRIBUTES.has(mutation.attributeName)
    ) {
      return true;
    }

    if (mutation.type !== "childList") return false;

    return !isNodeWithinOwnFormErrorSummary(mutation.target, this.root);
  }

  private findFieldRootForControl(control: HTMLElement): HTMLElement | undefined {
    const fieldRoot = control.closest<HTMLElement>(`[${FIELD_ROOT_ATTRIBUTE}]`);

    if (!fieldRoot) return undefined;
    if (fieldRoot.closest(`[${FORM_ROOT_ATTRIBUTE}]`) !== this.root) return undefined;
    if (!this.fieldInstances.has(fieldRoot)) return undefined;

    return fieldRoot;
  }

  private scheduleFirstInvalidFocus(): void {
    if (this.focusTimer !== undefined) return;

    this.focusTimer = window.setTimeout(() => {
      this.focusTimer = undefined;
      const pendingFocus = this.pendingFocus;
      this.pendingFocus = undefined;
      pendingFocus?.focus();
    }, 0);
  }

  private clearFocusTimer(): void {
    if (this.focusTimer === undefined) return;

    window.clearTimeout(this.focusTimer);
    this.focusTimer = undefined;
  }

  private scheduleInvalidEventValidationReset(): void {
    if (this.invalidEventResetTimer !== undefined) return;

    this.invalidEventResetTimer = window.setTimeout(() => {
      this.invalidEventResetTimer = undefined;
      this.invalidEventValidationScheduled = false;
    }, 0);
  }

  private clearInvalidEventResetTimer(): void {
    if (this.invalidEventResetTimer === undefined) return;

    window.clearTimeout(this.invalidEventResetTimer);
    this.invalidEventResetTimer = undefined;
    this.invalidEventValidationScheduled = false;
  }

  private clearNativeValidationState(): void {
    this.pendingFocus = undefined;
    this.clearFocusTimer();
    this.cancelAsyncValidation();
    this.asyncFieldErrors.clear();
    this.asyncFormErrors.clear();
    this.customFieldErrors.clear();
    this.customFormErrors.clear();
    this.fieldErrors.clear();
    this.validatingFieldRoots.clear();
    this.validatedFieldRoots.clear();
    this.revealedFieldRoots.clear();
    this.fieldInstances.forEach((_field, fieldRoot) =>
      this.clearChangeRevisionBookkeeping(fieldRoot),
    );
    this.renderValidatingState();
    this.fieldInstances.forEach((_field, fieldRoot) => this.syncFieldValidationState(fieldRoot));
  }

  private clearRemovedFieldBookkeeping(mutations: MutationRecord[]): void {
    const removedFieldRoots = new Set<HTMLElement>();
    mutations.forEach((mutation) => {
      if (mutation.type !== "childList") return;

      mutation.removedNodes.forEach((node) => {
        getFieldRootsFromNode(node).forEach((fieldRoot) => removedFieldRoots.add(fieldRoot));
      });
    });

    this.cancelAsyncValidationIfTargetsIntersect(removedFieldRoots, "field-removal");

    mutations.forEach((mutation) => {
      if (mutation.type !== "childList") return;

      mutation.removedNodes.forEach((node) => {
        getFieldRootsFromNode(node).forEach((fieldRoot) => {
          this.asyncFieldErrors.delete(fieldRoot);
          this.asyncFormErrors.delete(fieldRoot);
          this.fieldErrors.delete(fieldRoot);
          this.customFieldErrors.delete(fieldRoot);
          this.customFormErrors.delete(fieldRoot);
          this.validatingFieldRoots.delete(fieldRoot);
          this.validatedFieldRoots.delete(fieldRoot);
          this.revealedFieldRoots.delete(fieldRoot);
          this.clearChangeRevisionBookkeeping(fieldRoot);
          clearManagedFieldStateAttributes(fieldRoot);
        });
      });
    });
    this.renderValidatingState();
    this.renderErrorSummaries();
  }

  private clearAsyncErrorsForField(fieldRoot: HTMLElement): void {
    const fieldErrorsChanged = this.asyncFieldErrors.delete(fieldRoot);
    const formErrorsChanged = this.asyncFormErrors.delete(fieldRoot);
    if (!fieldErrorsChanged && !formErrorsChanged) return;

    this.syncFieldValidationState(fieldRoot);
  }

  private scheduleAsyncValidation(fieldRoots: HTMLElement[], cause: FormValidationCause): void {
    if (!this.hasAsyncValidators()) return;

    const targetFieldRoots = this.getAsyncTargetFieldRoots(fieldRoots, true);
    if (targetFieldRoots.length === 0) return;

    const batch = this.beginAsyncValidationBatch(targetFieldRoots);

    const run = () => {
      this.asyncValidationTimer = undefined;
      void this.runAsyncValidationBatch(batch, fieldRoots, cause, true, false);
    };

    if (this.asyncValidationDebounceMs > 0) {
      this.asyncValidationTimer = window.setTimeout(run, this.asyncValidationDebounceMs);
      return;
    }

    run();
  }

  private async runAsyncValidationBatch(
    batch: AsyncValidationBatch,
    fieldValidatorRoots: readonly HTMLElement[],
    cause: FormValidationCause,
    includeFormValidators: boolean,
    throwValidatorErrors: boolean,
  ): Promise<boolean | "aborted"> {
    try {
      const errorsByFieldRoot = await this.collectAsyncValidationErrors(
        fieldValidatorRoots,
        cause,
        batch.controller.signal,
        includeFormValidators,
        throwValidatorErrors,
      );

      if (!this.isCurrentAsyncValidationBatch(batch)) {
        return "aborted";
      }

      fieldValidatorRoots.forEach((fieldRoot) => this.asyncFieldErrors.delete(fieldRoot));
      errorsByFieldRoot.field.forEach((errors, fieldRoot) => {
        if (errors.length > 0) {
          this.asyncFieldErrors.set(fieldRoot, errors);
        }
      });
      if (includeFormValidators) {
        this.getRegisteredFieldRootsInDomOrder().forEach((fieldRoot) =>
          this.asyncFormErrors.delete(fieldRoot),
        );
        errorsByFieldRoot.form.forEach((errors, fieldRoot) => {
          if (errors.length > 0) {
            this.asyncFormErrors.set(fieldRoot, errors);
          }
        });
      }
      return batch.writeFieldRoots.every(
        (fieldRoot) => this.getCombinedFieldErrors(fieldRoot).length === 0,
      );
    } finally {
      this.finishAsyncValidationBatch(batch);
    }
  }

  private runSynchronousSubmitValidation(): boolean {
    if (this.hasAsyncValidators()) {
      this.cancelAsyncValidation();
      this.asyncFieldErrors.clear();
      this.asyncFormErrors.clear();
    } else {
      this.validationGeneration += 1;
    }

    return this.runSynchronousValidation({
      bookkeeping: "mark-validated",
      focus: "first-invalid",
      reveal: "submit-policy",
      submission: "enter-post-submit",
      targets: this.getRegisteredFieldRootsInDomOrder(),
    });
  }

  private async runValidationForManagedSubmit(
    event: SubmitEvent,
    submitter: HTMLElement | null,
  ): Promise<void> {
    if (!this.runSynchronousSubmitValidation()) return;
    if (!this.hasAsyncValidators()) {
      this.callSubmitHandler(event, submitter);
      return;
    }

    const fieldRoots = this.getRegisteredFieldRootsInDomOrder();
    const targetFieldRoots = this.getAsyncTargetFieldRoots(fieldRoots, true);
    if (targetFieldRoots.length === 0) {
      this.callSubmitHandler(event, submitter);
      return;
    }

    const batch = this.beginAsyncValidationBatch(targetFieldRoots);
    const valid = await this.runAsyncValidationBatch(batch, fieldRoots, "submit", true, false);
    if (valid === "aborted") {
      if (
        batch.abortReason === "field-removal" &&
        batch.generation === this.validationGeneration &&
        !this.destroyed
      ) {
        await this.runValidationForManagedSubmit(event, submitter);
      }
      return;
    }
    if (this.destroyed) return;
    if (!valid) {
      this.pendingFocus = this.findFirstInvalidFieldRegistration(targetFieldRoots);
      if (this.pendingFocus) {
        this.scheduleFirstInvalidFocus();
      }
      return;
    }

    this.callSubmitHandler(event, submitter);
  }

  private async collectAsyncValidationErrors(
    targetFieldRoots: readonly HTMLElement[],
    cause: FormValidationCause,
    signal: AbortSignal,
    includeFormValidators: boolean,
    throwValidatorErrors: boolean,
  ): Promise<CollectedAsyncValidationErrors> {
    const values = readFormValues(this.root);
    const fields = this.getFields();
    const fieldErrorsByRoot = new Map<HTMLElement, FormValidationError[]>();
    const formErrorsByRoot = new Map<HTMLElement, FormValidationError[]>();
    const fieldValidationTasks: Array<{
      fieldRoot: HTMLElement;
      name: string;
      promise: Promise<FormValidationResult>;
      registration: FormFieldRegistration;
    }> = [];

    for (const fieldRoot of targetFieldRoots) {
      const field = this.fieldInstances.get(fieldRoot);
      if (!field) continue;

      const registration = field.getFormRegistration();
      const name = registration.name;
      if (!name || registration.disabled) continue;

      const validator = this.asyncFieldValidators.get(name);
      if (!validator) continue;

      fieldValidationTasks.push({
        fieldRoot,
        name,
        promise: runAsyncFieldValidatorSafely(
          () =>
            validator(registration.value, {
              cause,
              field: registration,
              fields,
              form: this.root,
              name,
              signal,
              values,
            }),
          throwValidatorErrors,
          signal,
        ),
        registration,
      });
    }

    const formValidationTasks = (includeFormValidators ? this.asyncFormValidators : []).map(
      (validator) =>
        runAsyncFormValidatorSafely(
          () =>
            validator(values, {
              cause,
              fields,
              form: this.root,
              signal,
              values,
            }),
          throwValidatorErrors,
          signal,
        ),
    );

    const [fieldResults, formResults] = await Promise.all([
      Promise.all(fieldValidationTasks.map((task) => task.promise)),
      Promise.all(formValidationTasks),
    ]);

    if (signal.aborted) return { field: fieldErrorsByRoot, form: formErrorsByRoot };

    for (const [index, task] of fieldValidationTasks.entries()) {
      if (!this.fieldInstances.has(task.fieldRoot)) continue;

      const errors = normalizeAsyncValidationResult(fieldResults[index]);
      if (errors.length === 0) continue;

      appendAsyncValidationErrors(
        fieldErrorsByRoot,
        task.fieldRoot,
        errors,
        task.registration,
        task.name,
      );
    }

    if (signal.aborted) return { field: fieldErrorsByRoot, form: formErrorsByRoot };

    for (const result of formResults) {
      if (!result) continue;

      Object.entries(result).forEach(([name, validationResult]) => {
        if (name.length === 0) return;

        const errors = normalizeAsyncValidationResult(validationResult);
        if (errors.length === 0) return;

        this.fieldInstances.forEach((field, fieldRoot) => {
          const registration = field.getFormRegistration();
          if (registration.name !== name || registration.disabled) return;

          appendAsyncValidationErrors(formErrorsByRoot, fieldRoot, errors, registration, name);
        });
      });
    }

    return { field: fieldErrorsByRoot, form: formErrorsByRoot };
  }

  private findFirstInvalidFieldRegistration(
    fieldRoots: HTMLElement[],
  ): FormFieldRegistration | undefined {
    const invalidFieldRoot = fieldRoots.find(
      (fieldRoot) => this.getCombinedFieldErrors(fieldRoot).length > 0,
    );

    return invalidFieldRoot
      ? this.fieldInstances.get(invalidFieldRoot)?.getFormRegistration()
      : undefined;
  }

  private callSubmitHandler(event: SubmitEvent, submitter: HTMLElement | null): void {
    this.submitHandler?.({
      event,
      fields: this.getFields(),
      form: this.root,
      submitter,
      values: readFormValues(this.root, submitter),
    });
  }

  private getAsyncTargetFieldRoots(
    fieldRoots: readonly HTMLElement[],
    includeFormValidators: boolean,
  ): HTMLElement[] {
    const targetFieldRoots = new Set<HTMLElement>();

    fieldRoots.forEach((fieldRoot) => {
      const registration = this.fieldInstances.get(fieldRoot)?.getFormRegistration();
      const name = registration?.name;
      if (!name || registration.disabled) return;
      if (this.asyncFieldValidators.has(name)) {
        targetFieldRoots.add(fieldRoot);
      }
    });

    if (includeFormValidators && this.asyncFormValidators.length > 0) {
      this.fieldInstances.forEach((field, fieldRoot) => {
        const registration = field.getFormRegistration();
        if (registration.name && !registration.disabled) {
          targetFieldRoots.add(fieldRoot);
        }
      });
    }

    return Array.from(targetFieldRoots);
  }

  private hasAsyncValidators(): boolean {
    return this.asyncFieldValidators.size > 0 || this.asyncFormValidators.length > 0;
  }

  private cancelAsyncValidation(reason?: AsyncValidationBatch["abortReason"]): void {
    if (reason !== "field-removal") {
      this.validationGeneration += 1;
    }
    this.clearAsyncValidationTimer();
    const batch = this.currentAsyncValidationBatch;
    this.currentAsyncValidationBatch = undefined;
    if (batch && reason) batch.abortReason = reason;
    batch?.controller.abort();
    batch?.onAbort?.();
    this.setValidatingFieldRoots([]);
  }

  private invalidatePendingValidationOwnership(): void {
    this.validationGeneration += 1;
  }

  private cancelAsyncValidationIfTargetsIntersect(
    targetFieldRoots: ReadonlySet<HTMLElement>,
    reason?: AsyncValidationBatch["abortReason"],
  ): void {
    const batch = this.currentAsyncValidationBatch;
    if (!batch) return;
    if (!batch.writeFieldRoots.some((fieldRoot) => targetFieldRoots.has(fieldRoot))) return;

    this.cancelAsyncValidation(reason);
  }

  private beginAsyncValidationBatch(
    validatingFieldRoots: readonly HTMLElement[],
    options: {
      readonly onAbort?: () => void;
      readonly writeFieldRoots?: readonly HTMLElement[];
    } = {},
  ): AsyncValidationBatch {
    this.cancelAsyncValidation();
    const batch: AsyncValidationBatch = {
      controller: new AbortController(),
      generation: this.validationGeneration,
      onAbort: options.onAbort,
      writeFieldRoots: [...(options.writeFieldRoots ?? validatingFieldRoots)],
    };
    this.currentAsyncValidationBatch = batch;
    this.setValidatingFieldRoots([...validatingFieldRoots]);
    return batch;
  }

  private isCurrentAsyncValidationBatch(batch: AsyncValidationBatch): boolean {
    return (
      !this.destroyed &&
      !batch.controller.signal.aborted &&
      this.currentAsyncValidationBatch === batch
    );
  }

  private finishAsyncValidationBatch(batch: AsyncValidationBatch): void {
    if (this.currentAsyncValidationBatch !== batch) return;

    this.currentAsyncValidationBatch = undefined;
    this.setValidatingFieldRoots([]);
  }

  private clearAsyncValidationTimer(): void {
    if (this.asyncValidationTimer === undefined) return;

    window.clearTimeout(this.asyncValidationTimer);
    this.asyncValidationTimer = undefined;
  }

  private setValidatingFieldRoots(fieldRoots: HTMLElement[]): void {
    const affectedFieldRoots = new Set([...this.validatingFieldRoots, ...fieldRoots]);

    this.validatingFieldRoots.clear();
    fieldRoots.forEach((fieldRoot) => {
      if (this.fieldInstances.has(fieldRoot)) {
        this.validatingFieldRoots.add(fieldRoot);
      }
    });

    this.renderValidatingState();
    affectedFieldRoots.forEach((fieldRoot) => this.syncFieldValidationState(fieldRoot));
  }

  private renderValidatingState(): void {
    setBooleanAttribute(this.root, "data-validating", this.validatingFieldRoots.size > 0);
  }

  private handlePolicyEvent(
    fieldRoot: HTMLElement,
    cause: FormValidationCause,
    policy = this.getFieldPolicy(fieldRoot),
    postSubmit = this.submitAttempted,
  ): void {
    const externalErrorsChanged = this.clearExternalErrorsOnChange(fieldRoot, cause);
    const shouldValidate = this.shouldValidateField(policy, cause, postSubmit);
    const visibilityChanged = this.updateErrorVisibility(fieldRoot, cause, policy);

    if (shouldValidate) {
      this.cancelAsyncValidation();
      this.validatedFieldRoots.add(fieldRoot);
      this.clearAsyncErrorsForField(fieldRoot);
      const fieldValid = this.validateNativeField(fieldRoot);
      if (fieldValid) {
        this.scheduleAsyncValidation([fieldRoot], cause);
      }
      return;
    }

    if (visibilityChanged || externalErrorsChanged) {
      this.syncFieldValidationState(fieldRoot);
    }
  }

  private clearExternalErrorsOnChange(fieldRoot: HTMLElement, cause: FormValidationCause): boolean {
    if (cause !== "change") return false;

    const name = this.fieldInstances.get(fieldRoot)?.getFormRegistration().name;
    const clearedNames = new Set<string>();

    if (name) {
      this.clearExternalErrorOnChangeName(name, clearedNames);
    }

    Array.from(this.externalClearOnChangeNames).forEach((errorName) => {
      if (errorName === name) return;
      if (!this.isFormLevelExternalErrorName(errorName)) return;
      this.clearExternalErrorOnChangeName(errorName, clearedNames);
    });

    if (clearedNames.size === 0) return false;

    this.fieldInstances.forEach((field, syncedFieldRoot) => {
      if (syncedFieldRoot === fieldRoot) return;

      const fieldName = field.getFormRegistration().name;
      if (fieldName && clearedNames.has(fieldName)) {
        this.syncFieldValidationState(syncedFieldRoot);
      }
    });

    return true;
  }

  private adoptInitialExternalErrors(fieldRoot: HTMLElement): void {
    if (this.adoptedInitialErrorFieldRoots.has(fieldRoot)) return;

    this.adoptedInitialErrorFieldRoots.add(fieldRoot);

    const name = readFieldNameFromMarkup(fieldRoot);
    if (!name) return;

    const errors = readInitialExternalValidationErrors(fieldRoot, name);
    if (errors.length === 0) return;

    this.externalErrorsByName.set(name, [
      ...(this.externalErrorsByName.get(name) ?? []),
      ...errors,
    ]);
    this.validatedFieldRoots.add(fieldRoot);
    this.revealedFieldRoots.add(fieldRoot);
  }

  private getCombinedFieldErrors(fieldRoot: HTMLElement): FormValidationError[] {
    const nativeErrors = this.fieldErrors.get(fieldRoot) ?? [];
    const customFieldErrors = this.customFieldErrors.get(fieldRoot) ?? [];
    const customFormErrors = this.customFormErrors.get(fieldRoot) ?? [];
    const asyncFieldErrors = this.asyncFieldErrors.get(fieldRoot) ?? [];
    const asyncFormErrors = this.asyncFormErrors.get(fieldRoot) ?? [];
    const validationErrors = [
      ...nativeErrors,
      ...customFieldErrors,
      ...customFormErrors,
      ...asyncFieldErrors,
      ...asyncFormErrors,
    ];
    return [...validationErrors, ...this.getExternalFieldErrors(fieldRoot)];
  }

  private getExternalFieldErrors(fieldRoot: HTMLElement): FormValidationError[] {
    const registration = this.fieldInstances.get(fieldRoot)?.getFormRegistration();
    const name = registration?.name;
    if (!registration || !name) return [];

    return (this.externalErrorsByName.get(name) ?? []).map((error) => ({
      ...error,
      control: registration.control,
      field: fieldRoot,
      name,
    }));
  }

  private clearExternalErrorOnChangeName(name: string, clearedNames: Set<string>): void {
    if (!this.externalClearOnChangeNames.has(name)) return;

    this.externalErrorsByName.delete(name);
    this.externalClearOnChangeNames.delete(name);
    clearedNames.add(name);
  }

  private isFormLevelExternalErrorName(name: string): boolean {
    let foundMatchingField = false;
    let foundMatchingControl = false;

    this.fieldInstances.forEach((field) => {
      const registration = field.getFormRegistration();
      if (registration.name !== name) return;

      foundMatchingField = true;
      if (registration.control) {
        foundMatchingControl = true;
      }
    });

    return !foundMatchingField || !foundMatchingControl;
  }

  private shouldValidateField(
    policy: FormFieldPolicy,
    cause: FormValidationCause,
    postSubmit = this.submitAttempted,
  ): boolean {
    const activeTiming = postSubmit ? policy.revalidationTiming : policy.validationTiming;
    return doesTimingMatch(activeTiming, cause);
  }

  private updateErrorVisibility(
    fieldRoot: HTMLElement,
    cause: FormValidationCause,
    policy = this.getFieldPolicy(fieldRoot),
  ): boolean {
    if (!doesTimingMatch(policy.errorVisibility, cause)) return false;
    if (this.revealedFieldRoots.has(fieldRoot)) return false;

    this.revealedFieldRoots.add(fieldRoot);
    return true;
  }

  private getFieldPolicy(fieldRoot: HTMLElement): FormFieldPolicy {
    const validationTiming = readTimingAttribute(
      fieldRoot,
      VALIDATION_TIMING_ATTRIBUTE,
      readTimingAttribute(this.root, VALIDATION_TIMING_ATTRIBUTE, "submit"),
    );
    const revalidationTiming = readTimingAttribute(
      fieldRoot,
      REVALIDATION_TIMING_ATTRIBUTE,
      readTimingAttribute(this.root, REVALIDATION_TIMING_ATTRIBUTE, "change"),
    );
    const errorVisibility = readTimingAttribute(
      fieldRoot,
      ERROR_VISIBILITY_ATTRIBUTE,
      readTimingAttribute(this.root, ERROR_VISIBILITY_ATTRIBUTE, "submit"),
    );

    return { errorVisibility, revalidationTiming, validationTiming };
  }
}

function getOwnFieldRoots(root: HTMLFormElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`[${FIELD_ROOT_ATTRIBUTE}]`)).filter(
    (fieldRoot) => fieldRoot.closest(`[${FORM_ROOT_ATTRIBUTE}]`) === root,
  );
}

function getOwnFormErrorSummaryRoots(root: HTMLFormElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`[${FORM_ERROR_SUMMARY_ATTRIBUTE}]`)).filter(
    (summaryRoot) => summaryRoot.closest(`[${FORM_ROOT_ATTRIBUTE}]`) === root,
  );
}

function renderFormErrorSummary(summaryRoot: HTMLElement, entries: FormErrorSummaryEntry[]): void {
  if (!summaryRoot.hasAttribute("role")) {
    summaryRoot.setAttribute("role", "status");
  }
  if (!summaryRoot.hasAttribute("aria-live")) {
    summaryRoot.setAttribute("aria-live", "polite");
  }
  if (!summaryRoot.hasAttribute("aria-atomic")) {
    summaryRoot.setAttribute("aria-atomic", "true");
  }

  const visible = entries.length > 0;
  summaryRoot.hidden = !visible;
  setBooleanAttribute(summaryRoot, "data-empty", !visible);
  setBooleanAttribute(summaryRoot, "data-visible", visible);

  const list = getOrCreateFormErrorSummaryList(summaryRoot);
  list.replaceChildren(...entries.map((entry) => renderFormErrorSummaryEntry(entry)));
}

function getOrCreateFormErrorSummaryList(summaryRoot: HTMLElement): HTMLElement {
  const existing = Array.from(
    summaryRoot.querySelectorAll<HTMLElement>(`[${FORM_ERROR_SUMMARY_LIST_ATTRIBUTE}]`),
  ).find((list) => list.closest(`[${FORM_ERROR_SUMMARY_ATTRIBUTE}]`) === summaryRoot);
  if (existing) return existing;

  const list = document.createElement("ul");
  list.setAttribute(FORM_ERROR_SUMMARY_LIST_ATTRIBUTE, "");
  summaryRoot.append(list);
  return list;
}

function renderFormErrorSummaryEntry(entry: FormErrorSummaryEntry): HTMLLIElement {
  const item = document.createElement("li");
  item.setAttribute(FORM_ERROR_SUMMARY_ENTRY_ATTRIBUTE, "");

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute(FORM_ERROR_SUMMARY_ITEM_ATTRIBUTE, "");
  button.setAttribute("data-field-index", String(entry.fieldIndex));
  button.setAttribute("data-validation-key", entry.error.key);
  button.setAttribute("data-validation-message", entry.message);
  button.setAttribute("data-validation-source", entry.error.source);
  if (entry.error.name) {
    button.setAttribute("data-field-name", entry.error.name);
  }
  button.textContent = formatFormErrorSummaryMessage(entry);

  item.append(button);
  return item;
}

function formatFormErrorSummaryMessage(entry: FormErrorSummaryEntry): string {
  return entry.label.length > 0 ? `${entry.label}: ${entry.message}` : entry.message;
}

function readFieldSummaryLabel(fieldRoot: HTMLElement, fallback?: string): string {
  const label = Array.from(
    fieldRoot.querySelectorAll<HTMLElement>(`[${FIELD_LABEL_ATTRIBUTE}]`),
  ).find((candidate) => candidate.closest(`[${FIELD_ROOT_ATTRIBUTE}]`) === fieldRoot);
  const labelText = normalizeSummaryText(label?.textContent);
  if (labelText.length > 0) return labelText;

  return normalizeSummaryText(fallback);
}

function readFieldSummaryErrorMessage(fieldRoot: HTMLElement, error: FormValidationError): string {
  if (error.source !== "native") return error.message;

  const renderedError = Array.from(
    fieldRoot.querySelectorAll<HTMLElement>(`[${FIELD_ERROR_ATTRIBUTE}]`),
  ).find(
    (candidate) =>
      candidate.closest(`[${FIELD_ROOT_ATTRIBUTE}]`) === fieldRoot &&
      !candidate.hidden &&
      candidate.getAttribute("data-validation-key") === error.key &&
      candidate.getAttribute("data-validation-source") === error.source,
  );
  const renderedText = normalizeSummaryText(renderedError?.textContent);

  return renderedText.length > 0 ? renderedText : error.message;
}

function normalizeSummaryText(text?: string): string {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

function isNodeWithinOwnFormErrorSummary(node: Node, root: HTMLFormElement): boolean {
  if (!(node instanceof Element)) return false;

  const summaryRoot = node.closest(`[${FORM_ERROR_SUMMARY_ATTRIBUTE}]`);
  return summaryRoot?.closest(`[${FORM_ROOT_ATTRIBUTE}]`) === root;
}

function getFieldRootsFromNode(node: Node): HTMLElement[] {
  if (!(node instanceof HTMLElement)) return [];

  const fieldRoots: HTMLElement[] = [];
  if (node.hasAttribute(FIELD_ROOT_ATTRIBUTE)) {
    fieldRoots.push(node);
  }

  node.querySelectorAll<HTMLElement>(`[${FIELD_ROOT_ATTRIBUTE}]`).forEach((fieldRoot) => {
    fieldRoots.push(fieldRoot);
  });

  return fieldRoots;
}

function clearManagedFieldStateAttributes(fieldRoot: HTMLElement): void {
  [
    fieldRoot,
    ...Array.from(
      fieldRoot.querySelectorAll<HTMLElement>(
        [
          "[data-sw-field-control]",
          "[data-sw-field-description]",
          "[data-sw-field-error]",
          "[data-sw-field-item]",
          "[data-sw-field-label]",
          "[data-sw-field-validity]",
        ].join(","),
      ),
    ),
  ].forEach((element) => {
    element.removeAttribute("data-error-visible");
    element.removeAttribute("data-invalid");
    element.removeAttribute("data-submitted");
    element.removeAttribute("data-valid");
    element.removeAttribute("data-validation-key");
    element.removeAttribute("data-validation-message");
    element.removeAttribute("data-validation-source");
    element.removeAttribute("data-validating");
  });
}

function normalizeFormValidators(
  validators: FormOptions["formValidators"] | undefined,
): FormValidator[] {
  if (!validators) return [];
  return typeof validators === "function" ? [validators] : [...validators];
}

function normalizeAsyncFormValidators(
  validators: FormOptions["asyncFormValidators"] | undefined,
): FormAsyncValidator[] {
  if (!validators) return [];
  return typeof validators === "function" ? [validators] : [...validators];
}

function normalizeCustomValidationResult(result: FormValidationResult): FieldValidationError[] {
  if (result === null || result === undefined) return [];

  const inputs = Array.isArray(result) ? result : [result];
  return inputs.flatMap((input) => {
    const message = typeof input === "string" ? input : input.message;
    if (message.length === 0) return [];

    return [
      {
        key: typeof input === "string" ? "customError" : normalizeValidityKey(input.key),
        message,
        source:
          typeof input === "string" ? "custom" : normalizeValidationResultSource(input.source),
      },
    ];
  });
}

function normalizeAsyncValidationResult(result: FormValidationResult): FieldValidationError[] {
  return normalizeCustomValidationResult(result).map((error) => ({
    ...error,
    source: "async",
  }));
}

function mapFormSchemaValidatorResult(
  result: FormSchemaResult,
  options: FormSchemaValidationOptions,
): Record<string, FormValidationResult> | null {
  if (result.success) return null;

  const formErrorName = options.formErrorName ?? "_form";
  const source = options.source ?? "schema";
  const key = options.key ?? "customError";
  const errors: Record<string, FormValidationErrorInput[]> = {};

  collectFormSchemaIssues(result, formErrorName, key).forEach(({ name, issue }) => {
    errors[name] = [
      ...(errors[name] ?? []),
      {
        key: issue.key ?? key,
        message: issue.message,
        source,
      },
    ];
  });

  return Object.keys(errors).length > 0 ? errors : null;
}

function mapFormSchemaExternalErrors(
  result: FormSchemaResult,
  options: FormSchemaValidationOptions,
): FormExternalErrors {
  if (result.success) return {};

  const formErrorName = options.formErrorName ?? "_form";
  const source = options.source ?? "schema";
  const key = options.key ?? "customError";
  const errors: FormExternalErrors = {};

  collectFormSchemaIssues(result, formErrorName, key).forEach(({ name, issue }) => {
    const entry = {
      key: issue.key ?? key,
      message: issue.message,
      source,
    };
    const previous = errors[name];
    if (previous === undefined) {
      errors[name] = entry;
      return;
    }

    errors[name] = Array.isArray(previous) ? [...previous, entry] : [previous, entry];
  });

  return errors;
}

function collectFormSchemaIssues(
  result: Extract<FormSchemaResult, { success: false }>,
  formErrorName: string,
  defaultKey: FieldValidityKey,
): Array<{ issue: FormSchemaIssue; name: string }> {
  const issues: Array<{ issue: FormSchemaIssue; name: string }> = [];

  [...(result.issues ?? []), ...(result.errors ?? [])].forEach((issue) => {
    const name = readFormSchemaIssueName(issue, formErrorName);
    if (!name) return;
    issues.push({ issue: { ...issue, key: issue.key ?? defaultKey }, name });
  });

  Object.entries(result.fieldErrors ?? {}).forEach(([name, validationResult]) => {
    normalizeSchemaMessages(validationResult).forEach((issue) => {
      issues.push({ issue: { ...issue, key: issue.key ?? defaultKey }, name });
    });
  });

  normalizeSchemaMessages(result.formErrors).forEach((issue) => {
    issues.push({ issue: { ...issue, key: issue.key ?? defaultKey }, name: formErrorName });
  });

  return issues;
}

function normalizeSchemaMessages(result: FormValidationResult): FormSchemaIssue[] {
  if (result === null || result === undefined) return [];

  const entries = Array.isArray(result) ? result : [result];
  return entries.flatMap((entry) => {
    if (typeof entry === "string") {
      return entry.length > 0 ? [{ message: entry }] : [];
    }

    return entry.message.length > 0
      ? [
          {
            key: entry.key,
            message: entry.message,
          },
        ]
      : [];
  });
}

function readFormSchemaIssueName(issue: FormSchemaIssue, formErrorName: string): string {
  if (issue.name && issue.name.length > 0) return issue.name;
  if (issue.path === undefined) return formErrorName;

  if (Array.isArray(issue.path)) {
    if (issue.path.length === 0) return formErrorName;

    const name = issue.path.map((part) => String(part)).join(".");
    return name.length > 0 ? name : formErrorName;
  }

  const name = String(issue.path);
  return name.length > 0 ? name : formErrorName;
}

async function runAsyncFieldValidatorSafely(
  validate: () => FormValidationResult | Promise<FormValidationResult>,
  throwValidatorErrors = false,
  signal?: AbortSignal,
): Promise<FormValidationResult> {
  try {
    return await validate();
  } catch (error) {
    if (isAbortError(error) && (!throwValidatorErrors || signal?.aborted)) return null;
    if (throwValidatorErrors) throw error;
    return error instanceof Error ? error.message : "Validation failed.";
  }
}

async function runAsyncFormValidatorSafely(
  validate: () =>
    | Record<string, FormValidationResult>
    | null
    | undefined
    | Promise<Record<string, FormValidationResult> | null | undefined>,
  throwValidatorErrors = false,
  signal?: AbortSignal,
): Promise<Record<string, FormValidationResult> | null | undefined> {
  try {
    return await validate();
  } catch (error) {
    if (isAbortError(error) && (!throwValidatorErrors || signal?.aborted)) return null;
    if (throwValidatorErrors) throw error;
    return null;
  }
}

function appendAsyncValidationErrors(
  errorsByFieldRoot: Map<HTMLElement, FormValidationError[]>,
  fieldRoot: HTMLElement,
  errors: FieldValidationError[],
  registration: FormFieldRegistration,
  name: string,
): void {
  errorsByFieldRoot.set(fieldRoot, [
    ...(errorsByFieldRoot.get(fieldRoot) ?? []),
    ...errors.map((error) => ({
      ...error,
      control: registration.control,
      field: fieldRoot,
      name,
    })),
  ]);
}

function replaceValidationErrors(
  target: Map<HTMLElement, FormValidationError[]>,
  fieldRoot: HTMLElement,
  errors: FormValidationError[] | undefined,
): void {
  if (errors && errors.length > 0) {
    target.set(fieldRoot, errors);
  } else {
    target.delete(fieldRoot);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

function readFormValues(root: HTMLFormElement, submitter?: HTMLElement | null): FormValues {
  const values: FormValues = {};
  const data = submitter ? new FormData(root, submitter) : new FormData(root);

  data.forEach((value, key) => {
    const currentValue = values[key];

    if (currentValue === undefined) {
      values[key] = value;
      return;
    }

    if (Array.isArray(currentValue)) {
      currentValue.push(value);
      return;
    }

    values[key] = [currentValue, value];
  });

  return values;
}

function normalizeExternalErrorInputs(
  name: string,
  input: FormExternalErrorInput | readonly FormExternalErrorInput[],
): StoredExternalValidationError[] {
  if (name.length === 0) return [];

  const inputs = Array.isArray(input) ? input : [input];
  return inputs.flatMap((entry) => {
    const message = typeof entry === "string" ? entry : entry.message;
    if (message.length === 0) return [];

    return [
      {
        key: typeof entry === "string" ? "customError" : normalizeValidityKey(entry.key),
        message,
        name,
        source: typeof entry === "string" ? "external" : normalizeExternalErrorSource(entry.source),
      },
    ];
  });
}

function readInitialExternalValidationErrors(
  fieldRoot: HTMLElement,
  name: string,
): StoredExternalValidationError[] {
  return Array.from(
    fieldRoot.querySelectorAll<HTMLElement>(`[${FIELD_ERROR_ATTRIBUTE}][data-validation-source]`),
  ).flatMap((element) => {
    if (element.closest(`[${FIELD_ROOT_ATTRIBUTE}]`) !== fieldRoot) return [];

    const source = readExternalErrorSource(element);
    if (!source) return [];

    const message =
      element.getAttribute("data-validation-message") ?? element.textContent?.trim() ?? "";
    if (message.length === 0) return [];

    return [
      {
        key: normalizeValidityKey(
          element.getAttribute("data-validation-key") ?? element.getAttribute("data-match"),
        ),
        message,
        name,
        source,
      },
    ];
  });
}

function readFieldNameFromMarkup(fieldRoot: HTMLElement): string | undefined {
  const rootName = readOptionalStringAttribute(fieldRoot, "data-name");
  if (rootName) return rootName;

  const fieldControl = fieldRoot.querySelector<HTMLElement>(`[${FIELD_CONTROL_ATTRIBUTE}]`);
  if (fieldControl?.closest(`[${FIELD_ROOT_ATTRIBUTE}]`) === fieldRoot) {
    const controlName = readControlName(fieldControl);
    if (controlName) return controlName;
  }

  return getOwnNativeControls(fieldRoot)
    .map((control) => control.name)
    .find((name) => name.length > 0);
}

function readControlName(control: HTMLElement): string | undefined {
  if (isNativeFormControl(control) && control.name.length > 0) {
    return control.name;
  }

  return readOptionalStringAttribute(control, "data-name");
}

function readOptionalStringAttribute(element: HTMLElement, name: string): string | undefined {
  const value = element.getAttribute(name);
  return value && value.length > 0 ? value : undefined;
}

function normalizeValidityKey(key?: string | null): FieldValidityKey {
  return VALIDITY_KEYS.includes(key as FieldValidityKey)
    ? (key as FieldValidityKey)
    : "customError";
}

function normalizeExternalErrorSource(
  source?: string | null,
): StoredExternalValidationError["source"] {
  if (source === "schema") return "schema";
  return source === "server" ? "server" : "external";
}

function normalizeValidationResultSource(source?: string | null): FieldValidationError["source"] {
  if (source === "external" || source === "schema" || source === "server") return source;
  return "custom";
}

function readExternalErrorSource(
  element: HTMLElement,
): StoredExternalValidationError["source"] | undefined {
  const source = element.getAttribute("data-validation-source");
  if (source === "external" || source === "schema" || source === "server") return source;
  return undefined;
}

function getOwnNativeControls(
  fieldRoot: HTMLElement,
): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  const controls: Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = [];

  if (isNativeFormControl(fieldRoot)) {
    controls.push(fieldRoot);
  }

  fieldRoot
    .querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea")
    .forEach((control) => {
      if (control.closest(`[${FIELD_ROOT_ATTRIBUTE}]`) !== fieldRoot) return;
      controls.push(control);
    });

  return controls;
}

function readNativeRevisionValue(control: HTMLElement): string {
  if (control instanceof HTMLInputElement) {
    if (control.type === "checkbox" || control.type === "radio") {
      return `${control.checked ? "checked" : "unchecked"}:${control.value}`;
    }
    return control.value;
  }

  if (control instanceof HTMLSelectElement) {
    if (control.multiple) {
      return JSON.stringify(Array.from(control.selectedOptions, (option) => option.value));
    }
    return control.value;
  }

  if (control instanceof HTMLTextAreaElement) return control.value;
  return control.getAttribute("data-value") ?? "";
}

function isSemanticNotificationCanceled(event: Event): boolean {
  if (event.defaultPrevented) return true;
  if (!(event instanceof CustomEvent)) return false;

  const detail = event.detail as { readonly isCanceled?: unknown } | null;
  return detail?.isCanceled === true;
}

function readNativeValidationErrors(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): FieldValidationError[] {
  if (control.disabled || !control.willValidate || control.validity.valid) return [];

  return VALIDITY_KEYS.filter((key) => control.validity[key]).map((key) => ({
    key,
    message: control.validationMessage,
    source: "native",
  }));
}

function readRuntimeValidationErrors(registration: FormFieldRegistration): FieldValidationError[] {
  const { control } = registration;
  if (!control || registration.disabled) return [];
  if (!isRequiredRuntimeValueControl(control)) return [];
  if (isFilledFormValue(registration.value)) return [];

  return [
    {
      key: "valueMissing",
      message: "Please fill out this field.",
      source: "native",
    },
  ];
}

function isRequiredRuntimeValueControl(control: HTMLElement): boolean {
  return (
    (control.hasAttribute(SELECT_ROOT_ATTRIBUTE) ||
      control.hasAttribute(COMBOBOX_ROOT_ATTRIBUTE)) &&
    readBooleanAttribute(control, REQUIRED_ATTRIBUTE)
  );
}

function isFilledFormValue(value: FormFieldRegistration["value"]): boolean {
  if (value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).length > 0;
}

function readTimingAttribute(
  element: HTMLElement,
  name: string,
  fallback: FormValidationTiming,
): FormValidationTiming {
  const value = element.getAttribute(name);
  if (FORM_VALIDATION_TIMINGS.includes(value as FormValidationTiming)) {
    return value as FormValidationTiming;
  }

  return fallback;
}

function doesTimingMatch(timing: FormValidationTiming, cause: FormValidationCause): boolean {
  return timing === cause;
}

function isNativeFormControl(
  element: HTMLElement,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}
