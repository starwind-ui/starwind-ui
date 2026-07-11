import type {
  PrimitivePropContract,
  PrimitiveRuntimeOptionLifecycle,
  PrimitiveSetterContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterHiddenInputVisualSlotFacts,
  AdapterHiddenInputVisualSlotPartName,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type InputOtpSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  inputOtp: {
    adapterKind: "hidden-input-visual-slot";
    anatomy: InputOtpAnatomyRecipe[];
    formBridge: InputOtpFormBridgeRecipe;
    namespace: InputOtpNamespaceRecipe;
    nativeInput: InputOtpNativeInputRecipe;
    options: InputOtpOptionRecipe[];
    patternInputMode: InputOtpPatternInputModeRecipe;
    runtimeBoundary: string[];
    valueControl: InputOtpValueControlRecipe;
    visualSlots: InputOtpVisualSlotsRecipe;
  };
};

type InputOtpAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type InputOtpCallbackLifecycleRecipe = {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  lifecycle: "constructor-callback-ref";
  valueProperty: string;
  valueType: string;
};

type InputOtpFormBridgeRecipe = {
  fieldIntegration: boolean;
  hiddenInput: {
    part: "input";
    type: "text";
  };
  props: string[];
  runtimeBoundary: string;
};

type InputOtpNamespaceRecipe = {
  defaultExport: "InputOtp";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "InputOtp";
  objectEntries: InputOtpNamespaceObjectEntry[];
};

type InputOtpNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type InputOtpNativeInputRecipe = {
  autocomplete: {
    attribute: "autocomplete";
    value: "one-time-code";
  };
  formProps: string[];
  hiddenClass: {
    attribute: "class";
    value: "sr-only";
  };
  inputMode: {
    attribute: "inputmode";
    source: "pattern-derived";
  };
  maxLength: {
    attribute: "maxlength";
    prop: "maxLength";
  };
  nesting: "input-inside-root-before-visual-slots";
  part: "input";
  refs: {
    inputPublicRef: boolean;
    rootPublicRef: boolean;
  };
  runtimeBoundary: string;
  tabIndex: {
    attribute: "tabindex";
    value: "-1";
  };
};

type InputOtpOptionRecipe = {
  attribute: string;
  defaultValue?: string;
  lifecycle: Extract<
    PrimitiveRuntimeOptionLifecycle,
    "constructor-only" | "refresh-required" | "setter-backed"
  >;
  prop: string;
  setter?: string;
  targetPart: "root";
  type: string;
};

type InputOtpPatternInputModeRecipe = {
  defaultPattern: "\\d";
  inputModeAttribute: "inputmode";
  inputModeValues: ["numeric", "text"];
  normalizedPatternAttribute: "data-pattern";
  numericPatternExamples: ["\\d", "[0-9]", "\\d+", "[0-9]+"];
  patternProp: "pattern";
  runtimeBoundary: string;
};

type InputOtpRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

type InputOtpRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledStateSync: "unsupported";
  controlledProp: string;
  defaultProp: string;
  initialAttribute: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type InputOtpValueControlRecipe = {
  callbackLifecycle: InputOtpCallbackLifecycleRecipe;
  renderedAttribute: string;
  runtimeBoundary: string[];
  setterSync: {
    method: string;
    options?: Record<string, unknown>;
    stateModel: "value";
    suppressesEmit: boolean;
  };
  state: {
    controlledStateSync: "unsupported";
    controlledProp: string;
    defaultProp: string;
    getter: string;
    initialAttribute: string;
    name: "value";
    setter: string;
    valueType: string;
  };
};

type InputOtpVisualSlotsRecipe = {
  caretRendering: {
    outletName: "caret";
    unsupportedTargets: string[];
  };
  groupPart: "group";
  separator: {
    ariaHiddenAttribute: "aria-hidden";
    ariaHiddenValue: "true";
    part: "separator";
    publicRef: boolean;
    role: "separator";
  };
  slotCaret: {
    classAttribute: {
      attribute: "class";
      value: "pointer-events-none absolute inset-0 hidden items-center justify-center";
    };
    hiddenAttribute: "hidden";
    part: "slotCaret";
    placement: "inside-slot";
  };
  slotChar: {
    part: "slotChar";
    placement: "inside-slot";
  };
  slotIndex: {
    attribute: "data-index";
    prop: "index";
    targetPart: "slot";
    type: "number";
  };
  slotPart: "slot";
  runtimeBoundary: string;
};

const INPUT_OTP_ANATOMY_PARTS = [
  "root",
  "input",
  "group",
  "slot",
  "slotChar",
  "slotCaret",
  "separator",
] as const;
const INPUT_OTP_EXPORTED_PARTS = ["root", "group", "separator", "slot"] as const;
const INPUT_OTP_INTERNAL_PARTS = new Set(["input", "slotChar", "slotCaret"]);
const INPUT_OTP_NAMESPACE_NAMED_EXPORT_PART_ORDER = ["group", "root", "separator", "slot"] as const;
const INPUT_OTP_OPTION_PROPS = [
  "disabled",
  "form",
  "id",
  "maxLength",
  "name",
  "pattern",
  "readOnly",
  "required",
] as const;
const INPUT_OTP_PROJECTED_PROP_NAMES = [
  "value",
  "defaultValue",
  "disabled",
  "form",
  "id",
  "maxLength",
  "name",
  "pattern",
  "readOnly",
  "required",
  "onValueChange",
  "index",
  "caret",
] as const;
const INPUT_OTP_FORM_OPTION_PROPS = ["form", "id", "name", "required"] as const;
const INPUT_OTP_RUNTIME_BOUNDARY = [
  "keyboard navigation and focus movement",
  "paste and delete handling",
  "value normalization and maxLength enforcement",
  "slot active state and character writing",
  "caret visibility mutation",
  "native input value reflection and form reset",
  "refresh-required slot reconciliation",
] as const;
const INPUT_OTP_VALUE_CONTROL_RUNTIME_BOUNDARY = [
  "Runtime owns value normalization, maxLength enforcement, and native input reflection.",
  "Adapters only project initial value attributes, callback forwarding, and setValue controlled resync.",
] as const;
const INPUT_OTP_NATIVE_INPUT_RUNTIME_BOUNDARY =
  "Runtime owns native input value reflection, keyboard/paste/delete/focus handling, and form reset.";
const INPUT_OTP_VISUAL_SLOT_RUNTIME_BOUNDARY =
  "Runtime owns slot distribution, active state, character writing, and caret visibility.";
const INPUT_OTP_FORM_BRIDGE_RUNTIME_BOUNDARY =
  "Runtime owns form synchronization, native text input value reflection, and form reset.";
const INPUT_OTP_PATTERN_INPUT_MODE_RUNTIME_BOUNDARY =
  "Adapters may derive initial inputMode from normalized pattern; Runtime owns value normalization and accepted-character behavior.";

export function buildInputOtpSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): InputOtpSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "input-otp") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Input OTP specialized adapter spec.`,
    );
  }

  for (const part of INPUT_OTP_ANATOMY_PARTS) {
    assertPart(spec, part);
  }

  return {
    ...spec,
    files: buildShippingFileRecipes(spec),
    sourcePrimitiveContract: contract,
    inputOtp: {
      adapterKind: "hidden-input-visual-slot",
      anatomy: buildAnatomyRecipes(spec),
      formBridge: buildFormBridgeRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      nativeInput: buildNativeInputRecipe(spec),
      options: buildOptionsRecipe(spec, contract),
      patternInputMode: buildPatternInputModeRecipe(spec),
      runtimeBoundary: [...INPUT_OTP_RUNTIME_BOUNDARY],
      valueControl: buildValueControlRecipe(spec),
      visualSlots: buildVisualSlotsRecipe(spec, contract),
    },
  };
}

export function validateInputOtpSpecializedAdapterSpec(
  spec: InputOtpSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "input-otp") {
    errors.push("Input OTP specialized adapter spec must target the input-otp primitive.");
    return errors;
  }

  const inputOtp = isRecord(spec.inputOtp) ? spec.inputOtp : undefined;
  if (!inputOtp) {
    errors.push("Input OTP specialized adapter spec is missing inputOtp metadata.");
    return errors;
  }

  if (inputOtp.adapterKind !== "hidden-input-visual-slot") {
    errors.push(
      'Input OTP specialized adapter spec adapterKind must be "hidden-input-visual-slot".',
    );
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "formBridge",
    "namespace",
    "nativeInput",
    "options",
    "patternInputMode",
    "runtimeBoundary",
    "valueControl",
    "visualSlots",
  ]);
  const behaviorFields = new Set([
    "caretMutation",
    "characterWriting",
    "deleteHandling",
    "focusMovement",
    "formReset",
    "keyboardHandling",
    "nativeInputReflection",
    "pasteHandling",
    "slotActiveState",
    "slotDistribution",
    "valueNormalization",
  ]);
  collectInputOtpBehaviorFieldErrors(inputOtp, ["inputOtp"], behaviorFields, errors);

  for (const field of Object.keys(inputOtp)) {
    if (behaviorFields.has(field)) {
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(
        `Input OTP specialized adapter spec must not declare unexpected field "${field}".`,
      );
    }
  }

  for (const part of INPUT_OTP_ANATOMY_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Input OTP specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, inputOtp.anatomy));
  errors.push(...validateProjectedProps(spec));
  errors.push(...validateValueControl(spec, inputOtp.valueControl));
  errors.push(...validateOptions(spec, inputOtp.options));
  errors.push(...validateNativeInput(spec, inputOtp.nativeInput));
  errors.push(...validateVisualSlots(spec, inputOtp.visualSlots));
  errors.push(...validatePatternInputMode(spec, inputOtp.patternInputMode));
  errors.push(...validateFormBridge(spec, inputOtp.formBridge));
  errors.push(...validateNamespace(spec, inputOtp.namespace));
  errors.push(...validateShippingFiles(spec));


  if (!arraysEqual(asArray(inputOtp.runtimeBoundary), INPUT_OTP_RUNTIME_BOUNDARY)) {
    errors.push(
      "Input OTP specialized adapter spec runtimeBoundary must match Runtime-owned OTP behavior.",
    );
  }

  return errors;
}

export function buildInputOtpAdapterOutputModel(
  spec: InputOtpSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidInputOtpAdapterOutputModelSpec(spec);

  const facts = getInputOtpHiddenInputVisualSlotFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createInputOtpComponentFile(spec, "root", facts),
    createInputOtpComponentFile(spec, "group", facts),
    createInputOtpComponentFile(spec, "slot", facts),
    createInputOtpComponentFile(spec, "separator", facts),
    {
      exports: {
        kind: "namespace",
        members: facts.index.importMembers,
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "hidden-input-visual-slot" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createInputOtpComponentFile(
  spec: InputOtpSpecializedAdapterSpec,
  partName: AdapterHiddenInputVisualSlotPartName,
  facts: AdapterHiddenInputVisualSlotFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events:
        partName === "root"
          ? [
              {
                detailType: facts.event.detailsType,
                handlerProp: facts.event.callbackProp,
                runtimeEvent: facts.event.name,
                targetPart: "root",
              },
            ]
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "hidden-input-visual-slot", part: partName },
      imports: [],
      lifecycle:
        partName === "root"
          ? {
              cleanup: { code: "instance.destroy();" },
              factory: facts.runtime.factory,
              factoryImport: {
                id: "runtime",
                kind: "value",
                members: [{ imported: facts.runtime.factory }],
                source: facts.runtime.importSource,
              },
              mount: { code: `${facts.runtime.factory}(root)` },
              options: [
                facts.props.defaultValue,
                facts.props.disabled,
                facts.props.form,
                facts.props.id,
                facts.props.maxLength,
                facts.props.name,
                facts.props.pattern,
                facts.props.readOnly,
                facts.props.required,
                facts.props.value,
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getInputOtpComponentProps(partName, facts),
      refs: [{ id: `${part.name}Ref`, part: part.name, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [{ id: `${part.name}Ref`, part: part.name, public: true }],
      },
      stateSync:
        partName === "root"
          ? [
              {
                setter: facts.setter.method,
                state: facts.state.name,
                valueProp: facts.props.value.name,
              },
            ]
          : [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${exportName}`,
  };
}

function getInputOtpComponentProps(
  partName: AdapterHiddenInputVisualSlotPartName,
  facts: AdapterHiddenInputVisualSlotFacts,
) {
  if (partName === "root") {
    return [
      facts.props.defaultValue,
      facts.props.disabled,
      facts.props.form,
      facts.props.id,
      facts.props.maxLength,
      facts.props.name,
      facts.props.pattern,
      facts.props.readOnly,
      facts.props.required,
      facts.props.value,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "slot") {
    return [facts.props.caret, facts.props.index].map((prop) => ({
      kind: "unknown" as const,
      name: prop.name,
      type: prop.type,
    }));
  }

  return [];
}

function getInputOtpHiddenInputVisualSlotFacts(
  spec: InputOtpSpecializedAdapterSpec,
): AdapterHiddenInputVisualSlotFacts {
  const anatomy = {
    group: getInputOtpAnatomyPart(spec, "group"),
    input: getInputOtpAnatomyPart(spec, "input"),
    root: getInputOtpAnatomyPart(spec, "root"),
    separator: getInputOtpAnatomyPart(spec, "separator"),
    slot: getInputOtpAnatomyPart(spec, "slot"),
    slotCaret: getInputOtpAnatomyPart(spec, "slotCaret"),
    slotChar: getInputOtpAnatomyPart(spec, "slotChar"),
  };
  for (const partName of spec.inputOtp.namespace.memberParts) {
    getInputOtpSpecFileBasename(spec, partName);
  }
  if (spec.inputOtp.formBridge.hiddenInput.part !== spec.inputOtp.nativeInput.part) {
    throw new Error(
      "Input OTP specialized adapter spec output model requires native input form bridge metadata.",
    );
  }

  const valueControl = spec.inputOtp.valueControl;
  const nativeInput = spec.inputOtp.nativeInput;
  const visualSlots = spec.inputOtp.visualSlots;
  const entriesByPart = new Map(
    spec.inputOtp.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );

  return {
    attrs: {
      ariaDisabled: getInputOtpAttribute(spec, anatomy.root.part, "aria-disabled"),
      defaultValue: getInputOtpAttribute(spec, anatomy.root.part, "data-default-value"),
      disabled: getInputOtpOption(spec, "disabled").attribute,
      form: getInputOtpOption(spec, "form").attribute,
      group: anatomy.group.discoveryAttribute,
      id: getInputOtpOption(spec, "id").attribute,
      input: anatomy.input.discoveryAttribute,
      inputAutocomplete: nativeInput.autocomplete.attribute,
      inputClass: nativeInput.hiddenClass.attribute,
      inputMaxLength: nativeInput.maxLength.attribute,
      inputMode: nativeInput.inputMode.attribute,
      inputReadOnly: getInputOtpAttribute(spec, anatomy.input.part, "readonly"),
      inputTabIndex: nativeInput.tabIndex.attribute,
      maxLength: getInputOtpOption(spec, "maxLength").attribute,
      name: getInputOtpOption(spec, "name").attribute,
      pattern: spec.inputOtp.patternInputMode.normalizedPatternAttribute,
      readOnly: getInputOtpOption(spec, "readOnly").attribute,
      required: getInputOtpOption(spec, "required").attribute,
      root: anatomy.root.discoveryAttribute,
      rootTabIndex: getInputOtpAttribute(spec, anatomy.root.part, "tabindex"),
      separator: anatomy.separator.discoveryAttribute,
      separatorAriaHidden: visualSlots.separator.ariaHiddenAttribute,
      slot: anatomy.slot.discoveryAttribute,
      slotCaret: anatomy.slotCaret.discoveryAttribute,
      slotCaretClass: visualSlots.slotCaret.classAttribute.attribute,
      slotCaretHidden: visualSlots.slotCaret.hiddenAttribute,
      slotChar: anatomy.slotChar.discoveryAttribute,
      slotIndex: visualSlots.slotIndex.attribute,
      value: valueControl.renderedAttribute,
    },
    displayName: spec.displayName,
    event: {
      callbackProp: valueControl.callbackLifecycle.callbackProp,
      detailsType: valueControl.callbackLifecycle.detailsType,
      name: valueControl.callbackLifecycle.domEvent,
      valueProperty: valueControl.callbackLifecycle.valueProperty,
      valueType: valueControl.callbackLifecycle.valueType,
    },
    exports: {
      group: getInputOtpSpecFileBasename(spec, "group"),
      namespace: spec.inputOtp.namespace.namespace,
      root: getInputOtpSpecFileBasename(spec, "root"),
      separator: getInputOtpSpecFileBasename(spec, "separator"),
      slot: getInputOtpSpecFileBasename(spec, "slot"),
    },
    index: {
      importMembers: spec.inputOtp.namespace.namedExports
        .filter((exportName) => exportName !== spec.inputOtp.namespace.defaultExport)
        .map((exportName) => {
          const entry = spec.inputOtp.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Input OTP specialized adapter spec output model requires ${exportName} namespace entry.`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.inputOtp.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [valueControl.callbackLifecycle.detailsType],
    },
    nativeInput: {
      autocompleteValue: nativeInput.autocomplete.value,
      hiddenClassValue: nativeInput.hiddenClass.value,
      nesting: nativeInput.nesting,
      tabIndexValue: nativeInput.tabIndex.value,
    },
    parts: {
      group: getInputOtpHiddenInputVisualSlotPart(spec, entriesByPart, "group"),
      input: {
        defaultElement: anatomy.input.defaultElement,
        discoveryAttribute: anatomy.input.discoveryAttribute,
        name: anatomy.input.part,
      },
      root: getInputOtpHiddenInputVisualSlotPart(spec, entriesByPart, "root"),
      separator: getInputOtpHiddenInputVisualSlotPart(spec, entriesByPart, "separator"),
      slot: getInputOtpHiddenInputVisualSlotPart(spec, entriesByPart, "slot"),
      slotCaret: {
        defaultElement: anatomy.slotCaret.defaultElement,
        discoveryAttribute: anatomy.slotCaret.discoveryAttribute,
        name: anatomy.slotCaret.part,
      },
      slotChar: {
        defaultElement: anatomy.slotChar.defaultElement,
        discoveryAttribute: anatomy.slotChar.discoveryAttribute,
        name: anatomy.slotChar.part,
      },
    },
    pattern: {
      defaultPattern: spec.inputOtp.patternInputMode.defaultPattern,
      numericPatternExamples: [...spec.inputOtp.patternInputMode.numericPatternExamples],
    },
    props: {
      caret: getAdapterFamilyProp(
        getTargetProp(
          spec,
          visualSlots.caretRendering.outletName,
          visualSlots.slotPart,
        ),
      ),
      defaultValue: getAdapterFamilyProp(getProp(spec, valueControl.state.defaultProp)),
      disabled: getAdapterFamilyProp(getInputOtpOptionProp(spec, "disabled")),
      form: getAdapterFamilyProp(getInputOtpOptionProp(spec, "form")),
      id: getAdapterFamilyProp(getInputOtpOptionProp(spec, "id")),
      index: getAdapterFamilyProp(
        getTargetProp(spec, visualSlots.slotIndex.prop, visualSlots.slotIndex.targetPart),
      ),
      maxLength: getAdapterFamilyProp(getInputOtpOptionProp(spec, "maxLength")),
      name: getAdapterFamilyProp(getInputOtpOptionProp(spec, "name")),
      pattern: getAdapterFamilyProp(getInputOtpOptionProp(spec, "pattern")),
      readOnly: getAdapterFamilyProp(getInputOtpOptionProp(spec, "readOnly")),
      required: getAdapterFamilyProp(getInputOtpOptionProp(spec, "required")),
      value: getAdapterFamilyProp(getProp(spec, valueControl.state.controlledProp)),
    },
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${pluralizeDisplayName(spec.displayName)}`,
      typeImportSource: "@starwind-ui/runtime",
    },
    setter: {
      method: valueControl.setterSync.method,
      options: getBooleanNumberStringOptions(valueControl.setterSync.options),
    },
    setters: {
      disabled: getRequiredValue(getInputOtpOption(spec, "disabled").setter, "disabled setter"),
      formOptions: getInputOtpFormOptionsSetter(spec),
    },
    state: {
      getter: valueControl.state.getter,
      name: valueControl.state.name,
      type: valueControl.state.valueType,
    },
    visualSlots: {
      caretRendering: {
        outletName: visualSlots.caretRendering.outletName,
      },
      separator: {
        ariaHiddenValue: visualSlots.separator.ariaHiddenValue,
        role: visualSlots.separator.role,
      },
      slotCaret: {
        classValue: visualSlots.slotCaret.classAttribute.value,
      },
    },
  };
}

function collectInputOtpBehaviorFieldErrors(
  value: unknown,
  path: string[],
  behaviorFields: ReadonlySet<string>,
  errors: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectInputOtpBehaviorFieldErrors(item, [...path, String(index)], behaviorFields, errors);
    });
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (behaviorFields.has(key)) {
      errors.push(
        `Input OTP specialized adapter spec must not declare ${nextPath.join(".")}; keep Runtime-owned behavior in Runtime controllers.`,
      );
    }

    collectInputOtpBehaviorFieldErrors(child, nextPath, behaviorFields, errors);
  }
}

function buildShippingFileRecipes(spec: SpecializedAdapterSpec): SpecializedAdapterSpec["files"] {
  return spec.files
    .filter((file) => file.kind !== "part" || !INPUT_OTP_INTERNAL_PARTS.has(file.part))
    .map((file) => ({ ...file }));
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): InputOtpAnatomyRecipe[] {
  return INPUT_OTP_ANATOMY_PARTS.map((partName) => {
    const part = getPart(spec, partName);

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      initialAttributes: getInitialAttributeNames(spec, partName),
      part: part.name,
      publicRef: hasPublicRef(spec, partName),
      role: part.role,
    };
  });
}

function buildFormBridgeRecipe(spec: SpecializedAdapterSpec): InputOtpFormBridgeRecipe {
  const form = getRequiredValue(spec.renderPlan.form, "form metadata");
  const hiddenInput = getRequiredValue(form.hiddenInput, "hidden input metadata");

  return {
    fieldIntegration: form.fieldIntegration === true,
    hiddenInput: {
      part: hiddenInput.part as "input",
      type: hiddenInput.type as "text",
    },
    props: [...form.props],
    runtimeBoundary: INPUT_OTP_FORM_BRIDGE_RUNTIME_BOUNDARY,
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): InputOtpNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = INPUT_OTP_EXPORTED_PARTS.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Input OTP specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "InputOtp",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "InputOtp",
      ...INPUT_OTP_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Input OTP specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "InputOtp",
    objectEntries,
  };
}

function buildNativeInputRecipe(spec: SpecializedAdapterSpec): InputOtpNativeInputRecipe {
  getProp(spec, "maxLength");

  return {
    autocomplete: {
      attribute: getStaticAttributeName(spec, "input", "autocomplete") as "autocomplete",
      value: getStaticAttributeValue(spec, "input", "autocomplete") as "one-time-code",
    },
    formProps: [...getRequiredValue(spec.renderPlan.form, "form metadata").props],
    hiddenClass: {
      attribute: getStaticAttributeName(spec, "input", "class") as "class",
      value: getStaticAttributeValue(spec, "input", "class") as "sr-only",
    },
    inputMode: {
      attribute: getStaticAttributeName(spec, "input", "inputmode") as "inputmode",
      source: "pattern-derived",
    },
    maxLength: {
      attribute: getStaticAttributeName(spec, "input", "maxlength") as "maxlength",
      prop: "maxLength",
    },
    nesting: "input-inside-root-before-visual-slots",
    part: "input",
    refs: {
      inputPublicRef: hasPublicRef(spec, "input"),
      rootPublicRef: hasPublicRef(spec, "root"),
    },
    runtimeBoundary: INPUT_OTP_NATIVE_INPUT_RUNTIME_BOUNDARY,
    tabIndex: {
      attribute: getStaticAttributeName(spec, "input", "tabindex") as "tabindex",
      value: getStaticAttributeValue(spec, "input", "tabindex") as "-1",
    },
  };
}

function buildOptionsRecipe(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
): InputOtpOptionRecipe[] {
  return INPUT_OTP_OPTION_PROPS.map((propName) => {
    const prop = getSourceProp(contract, propName);
    const lifecycle = getOptionLifecycle(contract, propName);
    const recipe: InputOtpOptionRecipe = {
      attribute: getStaticAttributeName(spec, "root", getOptionAttributeName(propName)),
      lifecycle,
      prop: propName,
      targetPart: "root",
      type: prop.type,
    };

    if (lifecycle === "setter-backed") {
      recipe.setter = getOptionSetter(spec, propName).method;
    }
    if (prop.defaultValue !== undefined) {
      recipe.defaultValue = prop.defaultValue;
    }

    return recipe;
  });
}

function buildPatternInputModeRecipe(spec: SpecializedAdapterSpec): InputOtpPatternInputModeRecipe {
  getProp(spec, "pattern");

  return {
    defaultPattern: "\\d",
    inputModeAttribute: getStaticAttributeName(spec, "input", "inputmode") as "inputmode",
    inputModeValues: ["numeric", "text"],
    normalizedPatternAttribute: getStaticAttributeName(
      spec,
      "root",
      "data-pattern",
    ) as "data-pattern",
    numericPatternExamples: ["\\d", "[0-9]", "\\d+", "[0-9]+"],
    patternProp: "pattern",
    runtimeBoundary: INPUT_OTP_PATTERN_INPUT_MODE_RUNTIME_BOUNDARY,
  };
}

function buildValueControlRecipe(spec: SpecializedAdapterSpec): InputOtpValueControlRecipe {
  const valueState = getRequiredState(spec, "value");
  const valueChangeEvent = getRequiredEvent(spec, "valueChange");
  const valueSetter = getStateSetter(spec, "value");

  return {
    callbackLifecycle: {
      callbackProp: valueChangeEvent.callbackProp,
      detailsType: valueChangeEvent.detailsType,
      domEvent: valueChangeEvent.domEvent,
      emitsFrom: valueChangeEvent.emitsFrom,
      lifecycle: "constructor-callback-ref",
      valueProperty: valueChangeEvent.valueProperty,
      valueType: valueChangeEvent.valueType,
    },
    renderedAttribute: getStaticAttributeName(spec, "root", "data-value"),
    runtimeBoundary: [...INPUT_OTP_VALUE_CONTROL_RUNTIME_BOUNDARY],
    setterSync: {
      method: valueSetter.method,
      options: {
        ...getRequiredValue(valueSetter.options, "value setter sync options"),
      },
      stateModel: "value",
      suppressesEmit: valueSetter.suppressesEmit === true,
    },
    state: {
      controlledStateSync: valueState.controlledStateSync,
      controlledProp: valueState.controlledProp,
      defaultProp: valueState.defaultProp,
      getter: valueState.runtimeGetter,
      initialAttribute: valueState.initialAttribute,
      name: "value",
      setter: valueState.runtimeSetter,
      valueType: valueState.valueType,
    },
  };
}

function buildVisualSlotsRecipe(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
): InputOtpVisualSlotsRecipe {
  const sourceIndexProp = getSourceTargetProp(contract, "index", "slot");
  const caretProp = getSourceTargetProp(contract, "caret", "slot");
  const separatorPart = getPart(spec, "separator");

  return {
    caretRendering: {
      outletName: "caret",
      unsupportedTargets: [...(caretProp.unsupportedTargets ?? [])],
    },
    groupPart: "group",
    separator: {
      ariaHiddenAttribute: getStaticAttributeName(
        spec,
        "separator",
        "aria-hidden",
      ) as "aria-hidden",
      ariaHiddenValue: getStaticAttributeValue(spec, "separator", "aria-hidden") as "true",
      part: "separator",
      publicRef: hasPublicRef(spec, "separator"),
      role: separatorPart.role as "separator",
    },
    slotCaret: {
      classAttribute: {
        attribute: getStaticAttributeName(spec, "slotCaret", "class") as "class",
        value: getStaticAttributeValue(
          spec,
          "slotCaret",
          "class",
        ) as "pointer-events-none absolute inset-0 hidden items-center justify-center",
      },
      hiddenAttribute: getStaticAttributeName(spec, "slotCaret", "hidden") as "hidden",
      part: "slotCaret",
      placement: "inside-slot",
    },
    slotChar: {
      part: "slotChar",
      placement: "inside-slot",
    },
    slotIndex: {
      attribute: getStaticAttributeName(spec, "slot", "data-index") as "data-index",
      prop: "index",
      targetPart: "slot",
      type: sourceIndexProp.type as "number",
    },
    slotPart: "slot",
    runtimeBoundary: INPUT_OTP_VISUAL_SLOT_RUNTIME_BOUNDARY,
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Input OTP specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      INPUT_OTP_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Input OTP specialized adapter spec anatomy must match root, input, group, slot, slotChar, slotCaret, separator.",
    );
  }

  for (const partName of INPUT_OTP_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Input OTP specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = getPart(spec, partName);
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Input OTP specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Input OTP specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Input OTP specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Input OTP specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Input OTP specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateFormBridge(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Input OTP specialized adapter spec requires formBridge metadata."];
  }

  return recipeEquals(() => buildFormBridgeRecipe(spec), value)
    ? []
    : [
        "Input OTP specialized adapter spec formBridge metadata must match hidden text input and form facts.",
      ];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Input OTP specialized adapter spec requires namespace metadata."];
  }

  let expected: InputOtpNamespaceRecipe;
  try {
    expected = buildNamespaceRecipe(spec);
  } catch {
    return ["Input OTP specialized adapter spec namespace metadata is incomplete."];
  }

  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Input OTP specialized adapter spec namespace default export must be InputOtp.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Input OTP specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Input OTP specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Input OTP specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Input OTP specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateNativeInput(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Input OTP specialized adapter spec requires nativeInput metadata."];
  }

  return recipeEquals(() => buildNativeInputRecipe(spec), value)
    ? []
    : [
        "Input OTP specialized adapter spec nativeInput metadata must match native input placement, attributes, refs, and form facts.",
      ];
}

function validateOptions(spec: InputOtpSpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Input OTP specialized adapter spec requires option metadata."];
  }

  const errors: string[] = [];
  for (const optionProp of INPUT_OTP_OPTION_PROPS) {
    if (!findProp(spec, optionProp)) {
      errors.push(`Input OTP specialized adapter spec requires ${optionProp} option metadata.`);
    }
  }

  if (
    errors.length === 0 &&
    !recipeEquals(() => buildOptionsRecipe(spec, spec.sourcePrimitiveContract), value)
  ) {
    errors.push(
      "Input OTP specialized adapter spec options metadata must match root option props, lifecycles, setter coverage, and attributes.",
    );
  }

  return errors;
}

function validateProjectedProps(spec: InputOtpSpecializedAdapterSpec): string[] {
  const propsByName = new Map(spec.props.map((prop) => [prop.name, prop]));

  for (const propName of INPUT_OTP_PROJECTED_PROP_NAMES) {
    const actual = propsByName.get(propName);
    const expected = spec.sourcePrimitiveContract.props.find((prop) => prop.name === propName);
    if (
      !actual ||
      !expected ||
      !recordsEqual(toProjectedPropRecipe(actual), toProjectedPropRecipe(expected))
    ) {
      return [
        "Input OTP specialized adapter spec props must match source contract facts for value, option, callback, and slot projection.",
      ];
    }
  }

  return [];
}

function validatePatternInputMode(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Input OTP specialized adapter spec requires patternInputMode metadata."];
  }

  return recipeEquals(() => buildPatternInputModeRecipe(spec), value)
    ? []
    : [
        "Input OTP specialized adapter spec patternInputMode metadata must document pattern normalization and inputMode derivation boundaries.",
      ];
}

function validateShippingFiles(spec: InputOtpSpecializedAdapterSpec): string[] {
  const expected = buildShippingFileRecipes({
    ...spec,
    files: spec.renderPlan.files,
  });

  return recordsArrayEqual(spec.files, expected)
    ? []
    : [
        "Input OTP specialized adapter spec files must match exported InputOtp parts plus index; input, slotChar, and slotCaret stay nested inside Root/Slot.",
      ];
}

function validateValueControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Input OTP specialized adapter spec requires valueControl metadata."];
  }

  const errors: string[] = [];
  const valueState = spec.stateModels.find((state) => state.name === "value");
  const valueChangeEvent = spec.events.find((event) => event.name === "valueChange");
  const valueSetter = spec.setterSync.find(
    (setter) => "stateModel" in setter && setter.stateModel === "value",
  );
  if (!valueState) {
    errors.push("Input OTP specialized adapter spec requires value state metadata.");
  }
  if (!valueChangeEvent) {
    errors.push("Input OTP specialized adapter spec requires valueChange event metadata.");
  }
  if (!valueSetter) {
    errors.push("Input OTP specialized adapter spec requires value setter metadata.");
  }

  if (errors.length === 0 && !recipeEquals(() => buildValueControlRecipe(spec), value)) {
    errors.push(
      "Input OTP specialized adapter spec valueControl metadata must match value state, callback lifecycle, event, and setter facts.",
    );
  }

  return errors;
}

function validateVisualSlots(spec: InputOtpSpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Input OTP specialized adapter spec requires visualSlots metadata."];
  }

  const errors: string[] = [];
  if (!findTargetProp(spec, "index", "slot")) {
    errors.push("Input OTP specialized adapter spec requires slot index prop metadata.");
  }
  if (!findTargetProp(spec, "caret", "slot")) {
    errors.push("Input OTP specialized adapter spec requires slot caret rendering metadata.");
  }

  if (
    errors.length === 0 &&
    !recipeEquals(() => buildVisualSlotsRecipe(spec, spec.sourcePrimitiveContract), value)
  ) {
    errors.push(
      "Input OTP specialized adapter spec visualSlots metadata must match group/slot/slotChar/slotCaret/separator facts.",
    );
  }

  return errors;
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Input OTP specialized adapter spec requires ${partName} part.`);
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function arraysEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function findProp(spec: SpecializedAdapterSpec, propName: string) {
  return spec.props.find((candidate) => candidate.name === propName);
}

function findTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  return spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
}

function getInputOtpAnatomyPart(
  spec: InputOtpSpecializedAdapterSpec,
  partName: string,
) {
  const part = spec.inputOtp.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${partName} part.`,
    );
  }

  return part;
}

function getInputOtpAttribute(
  spec: InputOtpSpecializedAdapterSpec,
  partName: string,
  attribute: string,
): string {
  const part = getInputOtpAnatomyPart(spec, partName);
  if (!part.initialAttributes.includes(attribute)) {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${attribute} attribute metadata for ${partName}.`,
    );
  }

  return attribute;
}

function getInputOtpFormOptionsSetter(spec: InputOtpSpecializedAdapterSpec): string {
  const setter = spec.setterSync.find(
    (candidate) =>
      "props" in candidate &&
      INPUT_OTP_FORM_OPTION_PROPS.every((optionProp) => candidate.props?.includes(optionProp)),
  );
  if (!setter) {
    throw new Error(
      "Input OTP specialized adapter spec output model requires shared form option setter metadata.",
    );
  }

  return setter.method;
}

function getInputOtpHiddenInputVisualSlotPart(
  spec: InputOtpSpecializedAdapterSpec,
  entriesByPart: Map<string, InputOtpNamespaceObjectEntry>,
  partName: AdapterHiddenInputVisualSlotPartName,
) {
  const part = getInputOtpAnatomyPart(spec, partName);

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.part,
    namespaceKey: getRequiredNamespaceKey(entriesByPart, part.part),
    role: part.role,
  };
}

function getInputOtpOption(spec: InputOtpSpecializedAdapterSpec, propName: string) {
  const option = spec.inputOtp.options.find((candidate) => candidate.prop === propName);
  if (!option) {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${propName} option.`,
    );
  }

  return option;
}

function getInputOtpOptionProp(
  spec: InputOtpSpecializedAdapterSpec,
  propName: string,
) {
  const option = getInputOtpOption(spec, propName);
  const prop = getProp(spec, option.prop);
  if (prop.targets && !prop.targets.includes(option.targetPart)) {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${propName} prop metadata for ${option.targetPart}.`,
    );
  }

  return prop;
}

function getTargetProp(
  spec: InputOtpSpecializedAdapterSpec,
  propName: string,
  targetPart: string,
): PrimitivePropContract {
  const prop = findTargetProp(spec, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${propName} prop metadata for ${targetPart}.`,
    );
  }

  return prop;
}

function getInputOtpSpecFileBasename(
  spec: InputOtpSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${partName} file.`,
    );
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getOptionAttributeName(propName: string): string {
  if (propName === "readOnly") {
    return "data-readonly";
  }

  return `data-${propName.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)}`;
}

function getOptionLifecycle(
  contract: RuntimeAdapterContract,
  propName: string,
): InputOtpOptionRecipe["lifecycle"] {
  const lifecycle = contract.runtime.optionPropLifecycles?.[propName];
  if (
    lifecycle !== "constructor-only" &&
    lifecycle !== "refresh-required" &&
    lifecycle !== "setter-backed"
  ) {
    throw new Error(
      `Input OTP specialized adapter spec requires supported lifecycle for ${propName}.`,
    );
  }

  return lifecycle;
}

function getOptionSetter(spec: SpecializedAdapterSpec, propName: string): PrimitiveSetterContract {
  if (propName === "disabled") {
    return getPropSetter(spec, propName);
  }

  const setter = spec.setterSync.find(
    (candidate) =>
      "props" in candidate &&
      INPUT_OTP_FORM_OPTION_PROPS.every((optionProp) => candidate.props?.includes(optionProp)),
  );
  if (!setter) {
    throw new Error(
      `Input OTP specialized adapter spec requires ${propName} option setter metadata.`,
    );
  }

  return setter;
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Input OTP specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getProp(spec: SpecializedAdapterSpec, propName: string): PrimitivePropContract {
  const prop = findProp(spec, propName);
  if (!prop) {
    throw new Error(`Input OTP specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getSourceProp(contract: RuntimeAdapterContract, propName: string): PrimitivePropContract {
  const prop = contract.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(
      `Input OTP specialized adapter spec requires ${propName} source prop metadata.`,
    );
  }

  return prop;
}

function getPropSetter(spec: SpecializedAdapterSpec, propName: string): PrimitiveSetterContract {
  const setter = spec.setterSync.find(
    (candidate) => "prop" in candidate && candidate.prop === propName,
  );
  if (!setter) {
    throw new Error(`Input OTP specialized adapter spec requires ${propName} setter metadata.`);
  }

  return setter;
}

function getRequiredEvent(spec: SpecializedAdapterSpec, eventName: string): InputOtpRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event?.detailsType || !event.domEvent || !event.valueProperty || !event.valueType) {
    throw new Error(`Input OTP specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event as InputOtpRequiredEvent;
}

function getRequiredState(spec: SpecializedAdapterSpec, stateName: string): InputOtpRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  if (
    !state?.controlledProp ||
    !state.defaultProp ||
    !state.initialAttribute ||
    !state.runtimeGetter ||
    !state.runtimeSetter ||
    state.controlledStateSync !== "unsupported"
  ) {
    throw new Error(`Input OTP specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state as InputOtpRequiredState;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Input OTP specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getStateSetter(spec: SpecializedAdapterSpec, stateModel: string): PrimitiveSetterContract {
  const setter = spec.setterSync.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter) {
    throw new Error(`Input OTP specialized adapter spec requires ${stateModel} setter metadata.`);
  }

  return setter;
}

function getSourceTargetProp(
  contract: RuntimeAdapterContract,
  propName: string,
  targetPart: string,
): PrimitivePropContract {
  const prop = contract.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
  if (!prop) {
    throw new Error(
      `Input OTP specialized adapter spec requires ${propName} source prop metadata for ${targetPart}.`,
    );
  }

  return prop;
}

function getStaticAttributeName(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute) {
    throw new Error(
      `Input OTP specialized adapter spec requires ${name} metadata for ${partName}.`,
    );
  }

  return attribute.name;
}

function getStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute?.value) {
    throw new Error(
      `Input OTP specialized adapter spec requires ${name} value metadata for ${partName}.`,
    );
  }

  return attribute.value;
}

function getAdapterFamilyProp(prop: {
  defaultValue?: string;
  name: string;
  required?: boolean;
  type: string;
}) {
  return {
    defaultValue: prop.defaultValue,
    name: prop.name,
    required: prop.required,
    type: prop.type,
  };
}

function getBooleanNumberStringOptions(
  options: Record<string, unknown> | undefined,
): Record<string, boolean | number | string> | undefined {
  if (!options) return undefined;

  return Object.fromEntries(
    Object.entries(options).filter(
      (entry): entry is [string, boolean | number | string] =>
        typeof entry[1] === "boolean" ||
        typeof entry[1] === "number" ||
        typeof entry[1] === "string",
    ),
  );
}

function getRequiredNamespaceKey(
  entriesByPart: Map<string, InputOtpNamespaceObjectEntry>,
  partName: string,
): string {
  const entry = entriesByPart.get(partName);
  if (!entry) {
    throw new Error(
      `Input OTP specialized adapter spec output model requires ${partName} namespace.`,
    );
  }

  return entry.property;
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function recipeEquals(buildExpected: () => unknown, actual: unknown): boolean {
  try {
    return recordsEqual(actual, buildExpected());
  } catch {
    return false;
  }
}

function recordsArrayEqual(actual: unknown[], expected: unknown[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => recordsEqual(entry, expected[index]))
  );
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function assertValidInputOtpAdapterOutputModelSpec(
  spec: InputOtpSpecializedAdapterSpec,
): void {
  const errors = validateInputOtpSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Input OTP specialized adapter spec output model cannot build invalid Input OTP spec:\n${errors.join("\n")}`,
    );
  }
}

function toProjectedPropRecipe(prop: PrimitivePropContract) {
  return {
    defaultValue: prop.defaultValue,
    kind: prop.kind,
    name: prop.name,
    required: prop.required,
    targets: prop.targets ? [...prop.targets] : undefined,
    type: prop.type,
  };
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}

function pluralizeDisplayName(displayName: string): string {
  return `${displayName}s`;
}
