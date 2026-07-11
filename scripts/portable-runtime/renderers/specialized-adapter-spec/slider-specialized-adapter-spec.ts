import type {
  PrimitivePropContract,
  PrimitiveSetterContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterOutputModel,
  AdapterRangeControlFacts,
  AdapterRangeControlPartName,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type SliderSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  slider: {
    adapterKind: "range-control";
    anatomy: SliderAnatomyRecipe[];
    formBridge: SliderFormBridgeRecipe;
    namespace: SliderNamespaceRecipe;
    options: SliderOptionRecipe[];
    runtimeBoundary: string[];
    thumbInput: SliderThumbInputRecipe;
    valueControl: SliderValueControlRecipe;
  };
};

type SliderAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type SliderEventRecipe = {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: "valueChange" | "valueCommitted";
  valueProperty: string;
  valueType: string;
};

type SliderFormBridgeRecipe = {
  fieldIntegration: boolean;
  hiddenInput: {
    part: "input";
    type: "range";
  };
  props: string[];
  runtimeBoundary: string;
};

type SliderHiddenRangeInputRecipe = {
  ariaHiddenAttribute: string;
  ariaHiddenValue: "true";
  styleBoundary: "adapter-owned-visually-hidden-placeholder-style";
  tabIndexAttribute: "tabIndex";
  tabIndexValue: "-1";
  typeAttribute: "type";
  typeValue: "range";
};

type SliderNamespaceRecipe = {
  defaultExport: "Slider";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Slider";
  objectEntries: SliderNamespaceObjectEntry[];
};

type SliderNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type SliderOptionRecipe = {
  attribute: string;
  defaultValue?: string;
  lifecycle: "setter-backed";
  prop: string;
  setter: string;
  targetPart: "root";
  type: string;
};

type SliderRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

type SliderRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledStateSync: "unsupported";
  controlledProp: string;
  defaultProp: string;
  initialAttribute: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type SliderThumbInputRecipe = {
  hiddenRangeInput: SliderHiddenRangeInputRecipe;
  indexProp: {
    attribute: string;
    prop: "index";
    targetPart: "thumb";
    type: "number";
  };
  inputPart: "input";
  inputRef: {
    prop: "inputRef";
    targetPart: "input";
  };
  nesting: "input-inside-thumb";
  refs: {
    inputPublicRef: boolean;
    thumbPublicRef: boolean;
  };
  runtimeBoundary: string;
  thumbPart: "thumb";
};

type SliderValueControlRecipe = {
  events: {
    valueChange: SliderEventRecipe;
    valueCommitted: SliderEventRecipe;
  };
  renderedAttribute: string;
  runtimeBoundary: string[];
  serialization: {
    arrayType: "number[]";
    defaultAttribute: string;
    scalarType: "number";
    strategy: "number-or-json-array";
    valueAttribute: string;
    valueType: "SliderValue";
  };
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
    defaultValue: string;
    getter: string;
    initialAttribute: string;
    name: "value";
    setter: string;
    valueType: string;
  };
};

const SLIDER_ANATOMY_PARTS = [
  "root",
  "control",
  "track",
  "indicator",
  "label",
  "thumb",
  "input",
] as const;
const SLIDER_EXPORTED_PARTS = ["root", "control", "track", "indicator", "label", "thumb"] as const;
const SLIDER_NAMESPACE_NAMED_EXPORT_PART_ORDER = [
  "control",
  "indicator",
  "label",
  "root",
  "thumb",
  "track",
] as const;
const SLIDER_OPTION_PROPS = [
  "disabled",
  "form",
  "largeStep",
  "max",
  "min",
  "minStepsBetweenValues",
  "name",
  "orientation",
  "step",
] as const;
const SLIDER_SET_OPTIONS_PROPS = [
  "form",
  "largeStep",
  "max",
  "min",
  "minStepsBetweenValues",
  "orientation",
  "step",
] as const;
const SLIDER_RUNTIME_BOUNDARY = [
  "pointer value math and pointer capture",
  "keyboard value math",
  "multi-thumb value normalization and clamping",
  "thumb ARIA mutation",
  "range measurement",
  "native range input and form synchronization",
  "refresh-before-controlled-sync timing",
] as const;
const SLIDER_VALUE_CONTROL_RUNTIME_BOUNDARY = [
  "Runtime owns value normalization, clamping, and multi-thumb ordering.",
  "Adapters only project value attributes, event forwarding, and setValue controlled resync.",
] as const;
const SLIDER_THUMB_INPUT_RUNTIME_BOUNDARY =
  "Runtime owns thumb ARIA, range input value/name/form reflection, measurement, pointer capture, and drag/keyboard interaction.";
const SLIDER_FORM_BRIDGE_RUNTIME_BOUNDARY =
  "Runtime owns form synchronization, range input value reflection, and submitted value updates.";

export function buildSliderSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): SliderSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "slider") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Slider specialized adapter spec.`,
    );
  }

  for (const part of SLIDER_ANATOMY_PARTS) {
    assertPart(spec, part);
  }

  return {
    ...spec,
    files: buildShippingFileRecipes(spec),
    sourcePrimitiveContract: contract,
    slider: {
      adapterKind: "range-control",
      anatomy: buildAnatomyRecipes(spec),
      formBridge: buildFormBridgeRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      options: buildOptionsRecipe(spec, contract),
      runtimeBoundary: [...SLIDER_RUNTIME_BOUNDARY],
      thumbInput: buildThumbInputRecipe(spec),
      valueControl: buildValueControlRecipe(spec),
    },
  };
}

export function validateSliderSpecializedAdapterSpec(spec: SliderSpecializedAdapterSpec): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "slider") {
    errors.push("Slider specialized adapter spec must target the slider primitive.");
    return errors;
  }

  const slider = isRecord(spec.slider) ? spec.slider : undefined;
  if (!slider) {
    errors.push("Slider specialized adapter spec is missing slider metadata.");
    return errors;
  }

  if (slider.adapterKind !== "range-control") {
    errors.push('Slider specialized adapter spec adapterKind must be "range-control".');
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "formBridge",
    "namespace",
    "options",
    "runtimeBoundary",
    "thumbInput",
    "valueControl",
  ]);
  const behaviorFields = new Set([
    "formSynchronization",
    "keyboardMath",
    "measurement",
    "pointerCapture",
    "pointerMath",
    "thumbAria",
    "valueNormalization",
  ]);
  collectSliderBehaviorFieldErrors(slider, ["slider"], behaviorFields, errors);

  for (const field of Object.keys(slider)) {
    if (behaviorFields.has(field)) {
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(`Slider specialized adapter spec must not declare unexpected field "${field}".`);
    }
  }

  for (const part of SLIDER_ANATOMY_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Slider specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, slider.anatomy));
  errors.push(...validateValueControl(spec, slider.valueControl));
  errors.push(...validateOptions(spec, slider.options));
  errors.push(...validateThumbInput(spec, slider.thumbInput));
  errors.push(...validateFormBridge(spec, slider.formBridge));
  errors.push(...validateNamespace(spec, slider.namespace));
  errors.push(...validateShippingFiles(spec));


  if (!arraysEqual(asArray(slider.runtimeBoundary), SLIDER_RUNTIME_BOUNDARY)) {
    errors.push(
      "Slider specialized adapter spec runtimeBoundary must match Runtime-owned range behavior.",
    );
  }

  return errors;
}

export function buildSliderAdapterOutputModel(
  spec: SliderSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidSliderAdapterOutputModelSpec(spec);

  const facts = getSliderRangeControlFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createSliderComponentFile(spec, "root", facts),
    createSliderComponentFile(spec, "control", facts),
    createSliderComponentFile(spec, "track", facts),
    createSliderComponentFile(spec, "indicator", facts),
    createSliderComponentFile(spec, "label", facts),
    createSliderComponentFile(spec, "thumb", facts),
    {
      exports: {
        kind: "namespace",
        members: facts.index.importMembers,
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "range-control" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createSliderComponentFile(
  spec: SliderSpecializedAdapterSpec,
  partName: AdapterRangeControlPartName,
  facts: AdapterRangeControlFacts,
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
                detailType: facts.events.valueChange.detailsType,
                handlerProp: facts.events.valueChange.callbackProp,
                runtimeEvent: facts.events.valueChange.name,
                targetPart: "root",
              },
              {
                detailType: facts.events.valueCommitted.detailsType,
                handlerProp: facts.events.valueCommitted.callbackProp,
                runtimeEvent: facts.events.valueCommitted.name,
                targetPart: "root",
              },
            ]
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "range-control", part: partName },
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
                facts.props.largeStep,
                facts.props.max,
                facts.props.min,
                facts.props.minStepsBetweenValues,
                facts.props.name,
                facts.props.orientation,
                facts.props.step,
                facts.props.value,
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getSliderComponentProps(partName, facts),
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

function getSliderComponentProps(
  partName: AdapterRangeControlPartName,
  facts: AdapterRangeControlFacts,
) {
  if (partName === "root") {
    return [
      facts.props.defaultValue,
      facts.props.disabled,
      facts.props.form,
      facts.props.largeStep,
      facts.props.max,
      facts.props.min,
      facts.props.minStepsBetweenValues,
      facts.props.name,
      facts.props.orientation,
      facts.props.step,
      facts.props.value,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "thumb") {
    return [facts.props.index].map((prop) => ({
      kind: "unknown" as const,
      name: prop.name,
      type: prop.type,
    }));
  }

  return [];
}

function getSliderRangeControlFacts(spec: SliderSpecializedAdapterSpec): AdapterRangeControlFacts {
  const anatomy = {
    control: getSliderAnatomyPart(spec, "control"),
    indicator: getSliderAnatomyPart(spec, "indicator"),
    input: getSliderAnatomyPart(spec, "input"),
    label: getSliderAnatomyPart(spec, "label"),
    root: getSliderAnatomyPart(spec, "root"),
    thumb: getSliderAnatomyPart(spec, "thumb"),
    track: getSliderAnatomyPart(spec, "track"),
  };
  for (const partName of spec.slider.namespace.memberParts) {
    getSliderSpecFileBasename(spec, partName);
  }
  if (spec.slider.formBridge.hiddenInput.part !== spec.slider.thumbInput.inputPart) {
    throw new Error(
      "Slider specialized adapter spec output model requires input form bridge metadata.",
    );
  }

  const valueControl = spec.slider.valueControl;
  const thumbInput = spec.slider.thumbInput;
  const entriesByPart = new Map(
    spec.slider.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );

  return {
    attrs: {
      control: anatomy.control.discoveryAttribute,
      defaultValue: valueControl.serialization.defaultAttribute,
      disabled: getSliderOption(spec, "disabled").attribute,
      form: getSliderOption(spec, "form").attribute,
      index: thumbInput.indexProp.attribute,
      indicator: anatomy.indicator.discoveryAttribute,
      input: anatomy.input.discoveryAttribute,
      inputAriaHidden: thumbInput.hiddenRangeInput.ariaHiddenAttribute,
      inputTabIndex: thumbInput.hiddenRangeInput.tabIndexAttribute,
      inputType: thumbInput.hiddenRangeInput.typeAttribute,
      label: anatomy.label.discoveryAttribute,
      largeStep: getSliderOption(spec, "largeStep").attribute,
      max: getSliderOption(spec, "max").attribute,
      min: getSliderOption(spec, "min").attribute,
      minStepsBetweenValues: getSliderOption(spec, "minStepsBetweenValues").attribute,
      name: getSliderOption(spec, "name").attribute,
      orientation: getSliderOption(spec, "orientation").attribute,
      root: anatomy.root.discoveryAttribute,
      step: getSliderOption(spec, "step").attribute,
      thumb: anatomy.thumb.discoveryAttribute,
      track: anatomy.track.discoveryAttribute,
      value: valueControl.serialization.valueAttribute,
    },
    displayName: spec.displayName,
    events: {
      valueChange: valueControl.events.valueChange,
      valueCommitted: valueControl.events.valueCommitted,
    },
    exports: {
      control: getSliderSpecFileBasename(spec, "control"),
      indicator: getSliderSpecFileBasename(spec, "indicator"),
      label: getSliderSpecFileBasename(spec, "label"),
      namespace: spec.slider.namespace.namespace,
      root: getSliderSpecFileBasename(spec, "root"),
      thumb: getSliderSpecFileBasename(spec, "thumb"),
      track: getSliderSpecFileBasename(spec, "track"),
    },
    index: {
      importMembers: spec.slider.namespace.namedExports
        .filter((exportName) => exportName !== spec.slider.namespace.defaultExport)
        .map((exportName) => {
          const entry = spec.slider.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Slider specialized adapter spec output model requires ${exportName} namespace entry.`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.slider.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [
        valueControl.state.valueType,
        valueControl.events.valueChange.detailsType,
        valueControl.events.valueCommitted.detailsType,
      ],
    },
    inputRefPropName: thumbInput.inputRef.prop,
    parts: {
      control: getSliderRangeControlPart(spec, entriesByPart, "control"),
      indicator: getSliderRangeControlPart(spec, entriesByPart, "indicator"),
      label: getSliderRangeControlPart(spec, entriesByPart, "label"),
      root: getSliderRangeControlPart(spec, entriesByPart, "root"),
      thumb: getSliderRangeControlPart(spec, entriesByPart, "thumb"),
      track: getSliderRangeControlPart(spec, entriesByPart, "track"),
    },
    props: {
      defaultValue: getAdapterFamilyProp(getProp(spec, valueControl.state.defaultProp)),
      disabled: getAdapterFamilyProp(getSliderOptionProp(spec, "disabled")),
      form: getAdapterFamilyProp(getSliderOptionProp(spec, "form")),
      index: getAdapterFamilyProp(
        getTargetProp(spec, thumbInput.indexProp.prop, thumbInput.thumbPart),
      ),
      largeStep: getAdapterFamilyProp(getSliderOptionProp(spec, "largeStep")),
      max: getAdapterFamilyProp(getSliderOptionProp(spec, "max")),
      min: getAdapterFamilyProp(getSliderOptionProp(spec, "min")),
      minStepsBetweenValues: getAdapterFamilyProp(
        getSliderOptionProp(spec, "minStepsBetweenValues"),
      ),
      name: getAdapterFamilyProp(getSliderOptionProp(spec, "name")),
      orientation: getAdapterFamilyProp(getSliderOptionProp(spec, "orientation")),
      step: getAdapterFamilyProp(getSliderOptionProp(spec, "step")),
      value: getAdapterFamilyProp(getProp(spec, valueControl.state.controlledProp)),
    },
    rootRole: getRequiredValue(anatomy.root.role, "root part role"),
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${pluralizeDisplayName(spec.displayName)}`,
      typeImportSource: "@starwind-ui/runtime",
    },
    serializer: {
      arrayType: valueControl.serialization.arrayType,
      scalarType: valueControl.serialization.scalarType,
      strategy: valueControl.serialization.strategy,
      valueType: valueControl.serialization.valueType,
    },
    setter: {
      method: valueControl.setterSync.method,
      options: getBooleanNumberStringOptions(valueControl.setterSync.options),
    },
    setters: {
      disabled: getSliderOption(spec, "disabled").setter,
      name: getSliderOption(spec, "name").setter,
      options: getSliderSetOptionsMethod(spec),
    },
    state: {
      getter: valueControl.state.getter,
      name: valueControl.state.name,
      type: valueControl.state.valueType,
    },
    thumbInput: {
      hiddenRangeInput: {
        ariaHiddenValue: thumbInput.hiddenRangeInput.ariaHiddenValue,
        tabIndexValue: thumbInput.hiddenRangeInput.tabIndexValue,
        typeValue: thumbInput.hiddenRangeInput.typeValue,
      },
      nesting: thumbInput.nesting,
    },
  };
}

function collectSliderBehaviorFieldErrors(
  value: unknown,
  path: string[],
  behaviorFields: ReadonlySet<string>,
  errors: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectSliderBehaviorFieldErrors(item, [...path, String(index)], behaviorFields, errors);
    });
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (behaviorFields.has(key)) {
      errors.push(
        `Slider specialized adapter spec must not declare ${nextPath.join(".")}; keep Runtime-owned behavior in Runtime controllers.`,
      );
    }

    collectSliderBehaviorFieldErrors(child, nextPath, behaviorFields, errors);
  }
}

function buildShippingFileRecipes(spec: SpecializedAdapterSpec): SpecializedAdapterSpec["files"] {
  return spec.files
    .filter((file) => file.kind !== "part" || file.part !== "input")
    .map((file) => ({ ...file }));
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): SliderAnatomyRecipe[] {
  return SLIDER_ANATOMY_PARTS.map((partName) => {
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

function buildFormBridgeRecipe(spec: SpecializedAdapterSpec): SliderFormBridgeRecipe {
  const form = getRequiredValue(spec.renderPlan.form, "form metadata");
  const hiddenInput = getRequiredValue(form.hiddenInput, "hidden input metadata");

  return {
    fieldIntegration: form.fieldIntegration === true,
    hiddenInput: {
      part: hiddenInput.part as "input",
      type: hiddenInput.type as "range",
    },
    props: [...form.props],
    runtimeBoundary: SLIDER_FORM_BRIDGE_RUNTIME_BOUNDARY,
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): SliderNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = SLIDER_EXPORTED_PARTS.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Slider specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Slider",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "Slider",
      ...SLIDER_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Slider specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "Slider",
    objectEntries,
  };
}

function buildOptionsRecipe(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
): SliderOptionRecipe[] {
  return SLIDER_OPTION_PROPS.map((propName) => {
    const prop = getProp(spec, propName);
    const setter = getOptionSetter(spec, propName);
    const recipe: SliderOptionRecipe = {
      attribute: getStaticAttributeName(spec, "root", getOptionAttributeName(propName)),
      lifecycle: getOptionLifecycle(contract, propName),
      prop: propName,
      setter: setter.method,
      targetPart: "root",
      type: prop.type,
    };

    if (prop.defaultValue !== undefined) {
      recipe.defaultValue = prop.defaultValue;
    }

    return recipe;
  });
}

function buildThumbInputRecipe(spec: SpecializedAdapterSpec): SliderThumbInputRecipe {
  const indexProp = getTargetProp(spec, "index", "thumb");

  return {
    hiddenRangeInput: {
      ariaHiddenAttribute: getStaticAttributeName(spec, "input", "aria-hidden"),
      ariaHiddenValue: "true",
      styleBoundary: "adapter-owned-visually-hidden-placeholder-style",
      tabIndexAttribute: getStaticAttributeName(spec, "input", "tabIndex") as "tabIndex",
      tabIndexValue: "-1",
      typeAttribute: getStaticAttributeName(spec, "input", "type") as "type",
      typeValue: "range",
    },
    indexProp: {
      attribute: getStaticAttributeName(spec, "thumb", "data-index"),
      prop: "index",
      targetPart: "thumb",
      type: indexProp.type as "number",
    },
    inputPart: "input",
    inputRef: {
      prop: "inputRef",
      targetPart: "input",
    },
    nesting: "input-inside-thumb",
    refs: {
      inputPublicRef: hasPublicRef(spec, "input"),
      thumbPublicRef: hasPublicRef(spec, "thumb"),
    },
    runtimeBoundary: SLIDER_THUMB_INPUT_RUNTIME_BOUNDARY,
    thumbPart: "thumb",
  };
}

function buildValueControlRecipe(spec: SpecializedAdapterSpec): SliderValueControlRecipe {
  const valueState = getRequiredState(spec, "value");
  const valueChangeEvent = getRequiredEvent(spec, "valueChange");
  const valueCommittedEvent = getRequiredEvent(spec, "valueCommitted");
  const valueSetter = getStateSetter(spec, "value");
  const defaultValueProp = getProp(spec, valueState.defaultProp);

  return {
    events: {
      valueChange: buildValueEventRecipe(valueChangeEvent, "valueChange"),
      valueCommitted: buildValueEventRecipe(valueCommittedEvent, "valueCommitted"),
    },
    renderedAttribute: getStaticAttributeName(spec, "root", "data-value"),
    runtimeBoundary: [...SLIDER_VALUE_CONTROL_RUNTIME_BOUNDARY],
    serialization: {
      arrayType: "number[]",
      defaultAttribute: getStaticAttributeName(spec, "root", "data-default-value"),
      scalarType: "number",
      strategy: "number-or-json-array",
      valueAttribute: getStaticAttributeName(spec, "root", "data-value"),
      valueType: valueState.valueType as "SliderValue",
    },
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
      defaultValue: getRequiredValue(defaultValueProp.defaultValue, "defaultValue default"),
      getter: valueState.runtimeGetter,
      initialAttribute: valueState.initialAttribute,
      name: "value",
      setter: valueState.runtimeSetter,
      valueType: valueState.valueType,
    },
  };
}

function buildValueEventRecipe(
  event: SliderRequiredEvent,
  name: "valueChange" | "valueCommitted",
): SliderEventRecipe {
  return {
    callbackProp: event.callbackProp,
    detailsType: event.detailsType,
    domEvent: event.domEvent,
    emitsFrom: event.emitsFrom,
    name,
    valueProperty: event.valueProperty,
    valueType: event.valueType,
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Slider specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      SLIDER_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Slider specialized adapter spec anatomy must match root, control, track, indicator, label, thumb, input.",
    );
  }

  for (const partName of SLIDER_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Slider specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = getPart(spec, partName);
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Slider specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Slider specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Slider specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Slider specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Slider specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateFormBridge(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Slider specialized adapter spec requires formBridge metadata."];
  }

  return recordsEqual(value, buildFormBridgeRecipe(spec))
    ? []
    : [
        "Slider specialized adapter spec formBridge metadata must match hidden range input and form facts.",
      ];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Slider specialized adapter spec requires namespace metadata."];
  }

  const expected = buildNamespaceRecipe(spec);
  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Slider specialized adapter spec namespace default export must be Slider.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Slider specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Slider specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Slider specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Slider specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateOptions(spec: SliderSpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Slider specialized adapter spec requires option metadata."];
  }

  const errors: string[] = [];
  for (const optionProp of SLIDER_OPTION_PROPS) {
    if (!findProp(spec, optionProp)) {
      errors.push(`Slider specialized adapter spec requires ${optionProp} option metadata.`);
    }
  }

  if (
    errors.length === 0 &&
    !recordsEqual(value, buildOptionsRecipe(spec, spec.sourcePrimitiveContract))
  ) {
    errors.push(
      "Slider specialized adapter spec options metadata must match root option props, setter lifecycles, and attributes.",
    );
  }

  return errors;
}

function validateShippingFiles(spec: SliderSpecializedAdapterSpec): string[] {
  const expected = buildShippingFileRecipes({
    ...spec,
    files: spec.renderPlan.files,
  });

  return recordsArrayEqual(spec.files, expected)
    ? []
    : [
        "Slider specialized adapter spec files must match exported Slider parts plus index; the input part stays nested inside SliderThumb.",
      ];
}

function validateThumbInput(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Slider specialized adapter spec requires thumbInput metadata."];
  }

  const errors: string[] = [];
  if (!findTargetProp(spec, "index", "thumb")) {
    errors.push("Slider specialized adapter spec requires thumb index prop metadata.");
  }

  if (errors.length === 0 && !recordsEqual(value, buildThumbInputRecipe(spec))) {
    errors.push(
      "Slider specialized adapter spec thumbInput metadata must match thumb/index/input bridge facts.",
    );
  }

  return errors;
}

function validateValueControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Slider specialized adapter spec requires valueControl metadata."];
  }

  const errors: string[] = [];
  const valueState = spec.stateModels.find((state) => state.name === "value");
  const valueChangeEvent = spec.events.find((event) => event.name === "valueChange");
  const valueCommittedEvent = spec.events.find((event) => event.name === "valueCommitted");
  const valueSetter = spec.setterSync.find(
    (setter) => "stateModel" in setter && setter.stateModel === "value",
  );
  if (!valueState) {
    errors.push("Slider specialized adapter spec requires value state metadata.");
  }
  if (!valueChangeEvent) {
    errors.push("Slider specialized adapter spec requires valueChange event metadata.");
  }
  if (!valueCommittedEvent) {
    errors.push("Slider specialized adapter spec requires valueCommitted event metadata.");
  }
  if (!valueSetter) {
    errors.push("Slider specialized adapter spec requires value setter metadata.");
  }

  if (
    errors.length === 0 &&
    valueState &&
    valueChangeEvent &&
    valueCommittedEvent &&
    valueSetter &&
    !recordsEqual(value, buildValueControlRecipe(spec))
  ) {
    errors.push(
      "Slider specialized adapter spec valueControl metadata must match value state, event, setter, and serialization facts.",
    );
  }

  return errors;
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Slider specialized adapter spec requires ${partName} part.`);
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

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getOptionAttributeName(propName: string): string {
  return `data-${propName.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)}`;
}

function getOptionLifecycle(contract: RuntimeAdapterContract, propName: string): "setter-backed" {
  const lifecycle = contract.runtime.optionPropLifecycles?.[propName];
  if (lifecycle !== "setter-backed") {
    throw new Error(
      `Slider specialized adapter spec requires setter-backed lifecycle for ${propName}.`,
    );
  }

  return lifecycle;
}

function getOptionSetter(spec: SpecializedAdapterSpec, propName: string): PrimitiveSetterContract {
  if (propName === "disabled" || propName === "name") {
    return getPropSetter(spec, propName);
  }

  const setter = spec.setterSync.find(
    (candidate) =>
      "props" in candidate &&
      SLIDER_SET_OPTIONS_PROPS.every((optionProp) => candidate.props?.includes(optionProp)),
  );
  if (!setter) {
    throw new Error(`Slider specialized adapter spec requires ${propName} option setter metadata.`);
  }

  return setter;
}

function getSliderAnatomyPart(spec: SliderSpecializedAdapterSpec, partName: string) {
  const part = spec.slider.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(`Slider specialized adapter spec output model requires ${partName} part.`);
  }

  return part;
}

function getSliderOption(spec: SliderSpecializedAdapterSpec, propName: string) {
  const option = spec.slider.options.find((candidate) => candidate.prop === propName);
  if (!option) {
    throw new Error(
      `Slider specialized adapter spec output model requires ${propName} option.`,
    );
  }

  return option;
}

function getSliderOptionProp(spec: SliderSpecializedAdapterSpec, propName: string) {
  const option = getSliderOption(spec, propName);
  const prop = getProp(spec, option.prop);
  if (prop.targets && !prop.targets.includes(option.targetPart)) {
    throw new Error(
      `Slider specialized adapter spec output model requires ${propName} prop metadata for ${option.targetPart}.`,
    );
  }

  return prop;
}

function getSliderRangeControlPart(
  spec: SliderSpecializedAdapterSpec,
  entriesByPart: Map<string, SliderNamespaceObjectEntry>,
  partName: AdapterRangeControlPartName,
) {
  const part = getSliderAnatomyPart(spec, partName);

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.part,
    namespaceKey: getRequiredNamespaceKey(entriesByPart, part.part),
    role: part.role,
  };
}

function getSliderSetOptionsMethod(spec: SliderSpecializedAdapterSpec): string {
  const setOptionsMethods = new Set(
    spec.slider.options
      .filter((option) => option.prop !== "disabled" && option.prop !== "name")
      .map((option) => option.setter),
  );
  if (setOptionsMethods.size !== 1) {
    throw new Error("Slider specialized adapter spec output model requires one setOptions method.");
  }

  return getRequiredValue([...setOptionsMethods][0], "setOptions method");
}

function getSliderSpecFileBasename(
  spec: SliderSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Slider specialized adapter spec output model requires ${partName} file.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Slider specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Slider specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getProp(spec: SpecializedAdapterSpec, propName: string): PrimitivePropContract {
  const prop = findProp(spec, propName);
  if (!prop) {
    throw new Error(`Slider specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getPropSetter(spec: SpecializedAdapterSpec, propName: string): PrimitiveSetterContract {
  const setter = spec.setterSync.find(
    (candidate) => "prop" in candidate && candidate.prop === propName,
  );
  if (!setter) {
    throw new Error(`Slider specialized adapter spec requires ${propName} setter metadata.`);
  }

  return setter;
}

function getRequiredEvent(spec: SpecializedAdapterSpec, eventName: string): SliderRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event?.detailsType || !event.domEvent || !event.valueProperty || !event.valueType) {
    throw new Error(`Slider specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event as SliderRequiredEvent;
}

function getRequiredState(spec: SpecializedAdapterSpec, stateName: string): SliderRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  if (
    !state?.controlledProp ||
    !state.defaultProp ||
    !state.initialAttribute ||
    !state.runtimeGetter ||
    !state.runtimeSetter ||
    state.controlledStateSync !== "unsupported"
  ) {
    throw new Error(`Slider specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state as SliderRequiredState;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Slider specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getStateSetter(spec: SpecializedAdapterSpec, stateModel: string): PrimitiveSetterContract {
  const setter = spec.setterSync.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter) {
    throw new Error(`Slider specialized adapter spec requires ${stateModel} setter metadata.`);
  }

  return setter;
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
    throw new Error(`Slider specialized adapter spec requires ${name} metadata for ${partName}.`);
  }

  return attribute.name;
}

function getTargetProp(
  spec: SpecializedAdapterSpec,
  propName: string,
  targetPart: string,
): PrimitivePropContract {
  const prop = findTargetProp(spec, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Slider specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
    );
  }

  return prop;
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
  entriesByPart: Map<string, SliderNamespaceObjectEntry>,
  partName: string,
): string {
  const entry = entriesByPart.get(partName);
  if (!entry) {
    throw new Error(`Slider specialized adapter spec output model requires ${partName} namespace.`);
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

function recordsArrayEqual(actual: unknown[], expected: unknown[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => recordsEqual(entry, expected[index]))
  );
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function assertValidSliderAdapterOutputModelSpec(spec: SliderSpecializedAdapterSpec): void {
  const errors = validateSliderSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Slider specialized adapter spec output model cannot build invalid Slider spec:\n${errors.join("\n")}`,
    );
  }
}

function pluralizeDisplayName(displayName: string): string {
  return `${displayName}s`;
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}
