import {
  colorPickerRuntimeAdapterContract,
  colorPickerRuntimeFacade,
} from "../../contracts/primitive/color-picker.js";
import type {
  PrimitiveEventContract,
  PrimitiveSetterContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterColorPickerEvent,
  AdapterColorPickerFacts,
  AdapterColorPickerPartName,
  AdapterColorPickerSetter,
  AdapterColorPickerState,
} from "../primitive-output-model/index.js";
import { COLOR_PICKER_PART_NAMES } from "../primitive-output-model/index.js";
import type { AdapterComponentFile, AdapterOutputModel } from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

const REQUIRED_PROPS = [
  "value",
  "defaultValue",
  "format",
  "alpha",
  "allowEmpty",
  "disabled",
  "readOnly",
  "name",
  "form",
  "required",
  "locale",
  "dir",
  "getAriaValueText",
  "getAreaRoleDescription",
  "getColorDescription",
  "onValueChange",
  "onValueCommitted",
  "onFormatChange",
  "xChannel",
  "yChannel",
  "axis",
  "channel",
  "orientation",
  "step",
  "swatchValue",
  "swatchDisabled",
] as const;

const REQUIRED_EVENTS = ["valueChange", "valueCommitted", "formatChange"] as const;
const REQUIRED_STATES = ["value", "format"] as const;
const REQUIRED_SETTERS = [
  "setValue",
  "setFormat",
  "setDisabled",
  "setReadOnly",
  "setName",
  "setOptions",
] as const;
const REQUIRED_CSS_VARIABLES = [
  "--sw-color-picker-color",
  "--sw-color-picker-hue",
  "--sw-color-picker-saturation",
  "--sw-color-picker-brightness",
  "--sw-color-picker-alpha",
  "--sw-color-picker-area-x",
  "--sw-color-picker-area-y",
  "--sw-color-picker-area-thumb-color",
  "--sw-color-picker-channel-position",
  "--sw-color-picker-channel-thumb-color",
  "--sw-color-picker-swatch-color",
  "--sw-color-picker-area-background",
  "--sw-color-picker-area-background-overlay",
  "--sw-color-picker-channel-gradient",
  "--sw-color-picker-transparency-grid-size",
] as const;

const COLOR_PICKER_RUNTIME_BOUNDARY = [
  "color parsing, conversion, precision, clamping, and serialization",
  "accepted color and format state, controlled request semantics, and draft editing",
  "pointer, keyboard, native input, and interaction commit sessions",
  "ARIA reflection, locale-aware descriptions, and direction-aware value projection",
  "form ownership, validation, reset, disabled submission, and Field integration",
  "EyeDropper capability detection and result handling",
] as const;

export type ColorPickerSpecializedAdapterSpec = SpecializedAdapterSpec & {
  colorPicker: AdapterColorPickerFacts;
  sourcePrimitiveContract: RuntimeAdapterContract;
};

export function buildColorPickerSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): ColorPickerSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "color-picker") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Color Picker specialized adapter spec.`,
    );
  }
  if (
    contract.runtime.factory !== "createColorPicker" ||
    contract.runtime.importSource !== "@starwind-ui/runtime/color-picker" ||
    contract.runtime.rootPart !== "root"
  ) {
    throw new Error(
      "Color Picker specialized adapter spec requires the createColorPicker Runtime root bridge.",
    );
  }
  if (!contract.initialStateProjection) {
    throw new Error(
      "Color Picker specialized adapter spec requires Runtime initial-state projection metadata.",
    );
  }

  assertExactNames(
    "parts",
    contract.parts.map((part) => part.name),
    COLOR_PICKER_PART_NAMES,
  );
  assertExactNames(
    "props",
    contract.props.map((prop) => prop.name),
    REQUIRED_PROPS,
  );
  assertExactNames("events", contract.events?.map((event) => event.name) ?? [], REQUIRED_EVENTS);
  assertExactNames(
    "state models",
    contract.stateModels?.map((state) => state.name) ?? [],
    REQUIRED_STATES,
  );
  assertExactNames(
    "setters",
    contract.setters?.map((setter) => setter.method) ?? [],
    REQUIRED_SETTERS,
  );
  assertExactNames(
    "CSS variables",
    contract.cssVariables?.map((variable) => variable.name) ?? [],
    REQUIRED_CSS_VARIABLES,
  );

  const escapeHatch = contract.escapeHatches?.find(
    (candidate) =>
      candidate.affectedFrameworks.includes("astro") &&
      candidate.affectedFrameworks.includes("react"),
  );
  if (!escapeHatch) {
    throw new Error("Color Picker specialized adapter spec requires the Astro/React escape hatch.");
  }
  if (
    !contract.form?.hiddenInput ||
    contract.form.hiddenInput.part !== "hiddenInput" ||
    contract.form.hiddenInput.type !== "text"
  ) {
    throw new Error(
      "Color Picker specialized adapter spec requires the hiddenInput text form bridge.",
    );
  }
  if (
    contract.form.fieldIntegration !== true ||
    !arraysEqual(contract.form.props, ["form", "name", "required", "value"])
  ) {
    throw new Error(
      "Color Picker specialized adapter spec requires Field integration and the canonical form prop bridge.",
    );
  }

  const parts = Object.fromEntries(
    COLOR_PICKER_PART_NAMES.map((partName) => {
      const part = contract.parts.find((candidate) => candidate.name === partName)!;
      const exportName = getPartExportName(partName);
      return [
        partName,
        {
          defaultElement: part.defaultElement,
          discoveryAttribute: part.discoveryAttribute,
          initialAttributes: (part.initialAttributes ?? []).map((attribute) => ({ ...attribute })),
          name: part.name,
          namespaceKey: exportName.replace(/^ColorPicker/, ""),
          publicRef: contract.refs?.some((ref) => ref.part === partName && ref.public) === true,
          ...(part.role ? { role: part.role } : {}),
        },
      ];
    }),
  ) as unknown as AdapterColorPickerFacts["parts"];

  const props = Object.fromEntries(
    contract.props.map((prop) => [
      prop.name,
      {
        ...(prop.defaultValue === undefined ? {} : { defaultValue: prop.defaultValue }),
        kind: prop.kind,
        name: prop.name,
        ...(prop.required === undefined ? {} : { required: prop.required }),
        targets: [...(prop.targets ?? ["root"])],
        type: prop.type,
      },
    ]),
  );

  const states = Object.fromEntries(
    REQUIRED_STATES.map((name) => {
      const state = requireNamed(contract.stateModels, name, "state model");
      return [name, { ...state, name } satisfies AdapterColorPickerState];
    }),
  ) as Record<(typeof REQUIRED_STATES)[number], AdapterColorPickerState>;

  const events = Object.fromEntries(
    REQUIRED_EVENTS.map((name) => [name, toEvent(requireNamed(contract.events, name, "event"))]),
  ) as Record<(typeof REQUIRED_EVENTS)[number], AdapterColorPickerEvent>;

  const optionLifecycles = contract.runtime.optionPropLifecycles;
  if (!optionLifecycles) {
    throw new Error(
      "Color Picker specialized adapter spec requires option prop lifecycle metadata.",
    );
  }
  for (const optionProp of contract.runtime.optionProps ?? []) {
    if (!optionLifecycles[optionProp]) {
      throw new Error(
        `Color Picker specialized adapter spec is missing ${optionProp} option lifecycle.`,
      );
    }
  }

  return {
    ...spec,
    colorPicker: {
      component: "color-picker",
      controlledness: {
        fixedAtCreation: true,
        refreshBeforeSync: true,
        states,
      },
      cssVariables: contract.cssVariables!.map((variable) => ({
        ...variable,
        parts: [...variable.parts] as [string, ...string[]],
      })),
      displayName: spec.displayName,
      escapeHatch: {
        ...escapeHatch,
        affectedFrameworks: [...escapeHatch.affectedFrameworks],
        contractOwnedFacts: [...escapeHatch.contractOwnedFacts],
        tests: [...escapeHatch.tests],
      },
      events,
      exports: {
        namespace: "ColorPicker",
        parts: Object.fromEntries(
          COLOR_PICKER_PART_NAMES.map((name) => [name, getPartExportName(name)]),
        ) as Record<AdapterColorPickerPartName, string>,
        runtimeFacades: {
          importSource: "@starwind-ui/runtime/color-picker",
          types: [...colorPickerRuntimeFacade.types],
          values: [...colorPickerRuntimeFacade.values],
        },
      },
      form: {
        fieldIntegration: true,
        hiddenInput: { part: "hiddenInput", type: "text" },
        props: [...contract.form.props],
        soleSubmissionPart: "hiddenInput",
      },
      initialMarkup: (contract.initialMarkup ?? []).map((entry) => ({
        ...entry,
        attributes: [...entry.attributes],
      })),
      initialStateProjection: {
        ...contract.initialStateProjection,
        rootStateProps: [...contract.initialStateProjection.rootStateProps],
        compositionDependencies: contract.initialStateProjection.compositionDependencies.map(
          (entry) => ({ part: entry.part, dependsOn: [...entry.dependsOn] }),
        ),
      },
      optionLifecycles: Object.fromEntries(
        (contract.runtime.optionProps ?? []).map((name) => [name, optionLifecycles[name]!]),
      ),
      parts,
      props,
      runtime: {
        destroys: true,
        factory: "createColorPicker",
        importSource: "@starwind-ui/runtime/color-picker",
        optionProps: [...(contract.runtime.optionProps ?? [])],
        rootPart: "root",
      },
      runtimeBoundary: [...COLOR_PICKER_RUNTIME_BOUNDARY],
      setters: contract.setters!.map(toSetter),
    },
    sourcePrimitiveContract: contract,
  };
}

export function validateColorPickerSpecializedAdapterSpec(
  spec: ColorPickerSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (spec.component !== "color-picker") {
    errors.push("Color Picker specialized adapter spec must target the color-picker primitive.");
  }
  if (!isRecord(spec.colorPicker)) {
    errors.push("Color Picker specialized adapter spec is missing colorPicker metadata.");
    return errors;
  }

  if (spec.sourceContract !== colorPickerRuntimeAdapterContract.component) {
    errors.push('Color Picker specialized adapter spec sourceContract must remain "color-picker".');
  }
  if (!sameFact(spec.sourcePrimitiveContract, colorPickerRuntimeAdapterContract)) {
    errors.push(
      "Color Picker specialized adapter spec sourcePrimitiveContract must match the authoritative Color Picker Runtime Adapter Contract.",
    );
  }

  const expected = buildColorPickerSpecializedAdapterSpec(
    colorPickerRuntimeAdapterContract,
  ).colorPicker;
  const actual = spec.colorPicker;

  validateExactFactNames("colorPicker", Object.keys(actual), Object.keys(expected), errors);
  if (actual.component !== expected.component) {
    errors.push(
      `Color Picker specialized adapter spec colorPicker.component must be "${expected.component}".`,
    );
  }
  if (actual.displayName !== expected.displayName) {
    errors.push(
      `Color Picker specialized adapter spec colorPicker.displayName must be "${expected.displayName}".`,
    );
  }

  validateNamedRecordFacts("parts", actual.parts, expected.parts, errors);
  validateNamedRecordFacts("props", actual.props, expected.props, errors);
  validateNamedRecordFacts("events", actual.events, expected.events, errors);
  validateNamedArrayFacts("setters", actual.setters, expected.setters, "method", errors);
  validateObjectFacts("form", actual.form, expected.form, errors);
  validateObjectFacts("runtime", actual.runtime, expected.runtime, errors);
  validateNamedRecordFacts(
    "optionLifecycles",
    actual.optionLifecycles,
    expected.optionLifecycles,
    errors,
  );

  if (!isRecord(actual.controlledness)) {
    errors.push("Color Picker specialized adapter spec controlledness must be an object.");
  } else {
    validateExactFactNames(
      "controlledness",
      Object.keys(actual.controlledness),
      Object.keys(expected.controlledness),
      errors,
    );
    validateObjectFacts(
      "controlledness",
      {
        fixedAtCreation: actual.controlledness.fixedAtCreation,
        refreshBeforeSync: actual.controlledness.refreshBeforeSync,
      },
      {
        fixedAtCreation: expected.controlledness.fixedAtCreation,
        refreshBeforeSync: expected.controlledness.refreshBeforeSync,
      },
      errors,
    );
    validateNamedRecordFacts(
      "controlledness.states",
      actual.controlledness.states,
      expected.controlledness.states,
      errors,
    );
  }

  if (!isRecord(actual.exports)) {
    errors.push("Color Picker specialized adapter spec exports must be an object.");
  } else {
    validateExactFactNames(
      "exports",
      Object.keys(actual.exports),
      Object.keys(expected.exports),
      errors,
    );
    if (actual.exports.namespace !== expected.exports.namespace) {
      errors.push(
        'Color Picker specialized adapter spec exports.namespace must remain "ColorPicker".',
      );
    }
    validateNamedRecordFacts("exports.parts", actual.exports.parts, expected.exports.parts, errors);
    validateRuntimeFacadeFacts(
      actual.exports.runtimeFacades,
      expected.exports.runtimeFacades,
      errors,
    );
  }

  validateNamedArrayFacts(
    "initialMarkup",
    actual.initialMarkup,
    expected.initialMarkup,
    "part",
    errors,
  );
  validateObjectFacts(
    "initialStateProjection",
    actual.initialStateProjection,
    expected.initialStateProjection,
    errors,
  );
  validateNamedArrayFacts(
    "cssVariables",
    actual.cssVariables,
    expected.cssVariables,
    "name",
    errors,
  );
  validateObjectFacts("escapeHatch", actual.escapeHatch, expected.escapeHatch, errors);
  validateStringArrayFacts(
    "runtimeBoundary",
    actual.runtimeBoundary,
    expected.runtimeBoundary,
    errors,
  );
  validateNestedOrderedFacts(actual, expected, errors);

  if (
    Array.isArray(actual.runtimeBoundary) &&
    actual.runtimeBoundary.some(
      (fact) =>
        typeof fact === "string" &&
        /(?:parse\w*\s*\(|rgb\s*=>|hsl\s*=>|hsb\s*=>|pointermove\s*=>)/i.test(fact),
    )
  ) {
    errors.push(
      "Color Picker specialized adapter spec must describe Runtime boundaries without implementing behavior.",
    );
  }
  return errors;
}

export function buildColorPickerAdapterOutputModel(
  spec: ColorPickerSpecializedAdapterSpec,
): AdapterOutputModel {
  const errors = validateColorPickerSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(`Invalid Color Picker specialized adapter spec:\n- ${errors.join("\n- ")}`);
  }

  const facts = spec.colorPicker;
  const files: AdapterOutputModel["files"] = COLOR_PICKER_PART_NAMES.map((partName) =>
    createComponentFile(spec, partName, facts),
  );
  files.push({
    exports: {
      kind: "namespace",
      members: COLOR_PICKER_PART_NAMES.map((partName) => ({
        from: `./${facts.exports.parts[partName]}`,
        name: facts.exports.parts[partName],
      })),
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "color-picker" },
    imports: [],
    kind: "index",
    path: "color-picker/index.ts",
    typeFacades: [],
  });
  return { files };
}

function createComponentFile(
  _spec: ColorPickerSpecializedAdapterSpec,
  partName: AdapterColorPickerPartName,
  facts: AdapterColorPickerFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports.parts[partName];
  const targetedProps = Object.values(facts.props).filter((prop) =>
    prop.targets.includes(partName),
  );
  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events:
        partName === "root"
          ? Object.values(facts.events).map((event) => ({
              detailType: event.detailsType,
              handlerProp: event.callbackProp,
              runtimeEvent: event.name,
              targetPart: event.emitsFrom,
            }))
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "color-picker", part: partName },
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
              options: facts.runtime.optionProps.map((name) => ({ name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: targetedProps.map((prop) => ({
        kind: prop.kind === "callback" ? "callback" : "unknown",
        name: prop.name,
        ...(prop.required === undefined ? {} : { required: prop.required }),
        type: prop.type,
      })),
      refs: part.publicRef ? [{ id: `${partName}Ref`, part: partName, public: true }] : [],
      render: {
        attrs: [
          { name: part.discoveryAttribute },
          ...part.initialAttributes.map((attribute) => ({ name: attribute.name })),
        ],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: partName,
        refs: part.publicRef ? [{ id: `${partName}Ref`, part: partName, public: true }] : [],
      },
      stateSync:
        partName === "root"
          ? Object.values(facts.controlledness.states).map((state) => ({
              setter: state.runtimeSetter!,
              state: state.name,
              valueProp: state.controlledProp!,
            }))
          : [],
      typeFacades: [],
    },
    kind: "component",
    path: `color-picker/${exportName}`,
  };
}

function toEvent(event: PrimitiveEventContract): AdapterColorPickerEvent {
  if (!event.detailsType || !event.domEvent || !event.valueProperty || !event.valueType) {
    throw new Error(`Color Picker specialized adapter spec event ${event.name} is incomplete.`);
  }
  return {
    callbackProp: event.callbackProp,
    ...(event.callbackTiming ? { callbackTiming: event.callbackTiming } : {}),
    cancelable: event.cancelable === true,
    detailsType: event.detailsType,
    domEvent: event.domEvent,
    emitsFrom: event.emitsFrom,
    name: event.name as AdapterColorPickerEvent["name"],
    valueProperty: event.valueProperty,
    valueType: event.valueType,
  };
}

function toSetter(setter: PrimitiveSetterContract): AdapterColorPickerSetter {
  return {
    method: setter.method,
    ...(setter.options ? { options: { ...setter.options } } : {}),
    ...(setter.prop ? { prop: setter.prop } : {}),
    ...(setter.props ? { props: [...setter.props] } : {}),
    ...(setter.stateModel ? { stateModel: setter.stateModel } : {}),
    suppressesEmit: setter.suppressesEmit === true,
  };
}

function requireNamed<T extends { name: string }>(
  values: readonly T[] | undefined,
  name: string,
  kind: string,
): T {
  const value = values?.find((candidate) => candidate.name === name);
  if (!value) throw new Error(`Color Picker specialized adapter spec is missing ${kind} ${name}.`);
  return value;
}

function assertExactNames(
  kind: string,
  actual: readonly string[],
  required: readonly string[],
): void {
  const missing = required.filter((name) => !actual.includes(name));
  const unexpected = actual.filter((name) => !required.includes(name));
  const duplicates = actual.filter((name, index) => actual.indexOf(name) !== index);
  if (missing.length > 0 || unexpected.length > 0 || duplicates.length > 0) {
    throw new Error(
      `Color Picker specialized adapter spec ${kind} mismatch; missing [${missing.join(", ")}], unexpected [${unexpected.join(", ")}], duplicates [${[...new Set(duplicates)].join(", ")}].`,
    );
  }
  if (!arraysEqual(actual, required)) {
    throw new Error(
      `Color Picker specialized adapter spec ${kind} must preserve canonical contract order: ${required.join(", ")}.`,
    );
  }
}

function getPartExportName(partName: AdapterColorPickerPartName): string {
  return `ColorPicker${partName[0].toUpperCase()}${partName.slice(1)}`;
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateNamedRecordFacts(
  category: string,
  actual: unknown,
  expected: Readonly<Record<string, unknown>>,
  errors: string[],
): void {
  validateObjectFacts(category, actual, expected, errors);
  if (!isRecord(actual)) return;
  validateCanonicalSequence(category, Object.keys(actual), Object.keys(expected), errors);
}

function validateNamedArrayFacts(
  category: string,
  actual: unknown,
  expected: readonly unknown[],
  identityField: string,
  errors: string[],
): void {
  if (!Array.isArray(actual)) {
    errors.push(`Color Picker specialized adapter spec ${category} must be an array.`);
    return;
  }

  const actualNames = actual.map((fact, index) => getFactIdentity(fact, identityField, index));
  const expectedNames = expected.map((fact, index) => getFactIdentity(fact, identityField, index));
  validateExactFactNames(category, actualNames, expectedNames, errors);
  validateCanonicalSequence(category, actualNames, expectedNames, errors);

  for (let index = 0; index < expected.length; index += 1) {
    const name = expectedNames[index]!;
    const actualFact = actual.find(
      (candidate, candidateIndex) =>
        getFactIdentity(candidate, identityField, candidateIndex) === name,
    );
    if (actualFact !== undefined && !sameFact(actualFact, expected[index])) {
      errors.push(
        `Color Picker specialized adapter spec ${category}.${name} must match its contract-owned fact.`,
      );
    }
  }
}

function validateObjectFacts(
  category: string,
  actual: unknown,
  expected: Readonly<Record<string, unknown>>,
  errors: string[],
): void {
  if (!isRecord(actual)) {
    errors.push(`Color Picker specialized adapter spec ${category} must be an object.`);
    return;
  }

  validateExactFactNames(category, Object.keys(actual), Object.keys(expected), errors);
  for (const [name, expectedFact] of Object.entries(expected)) {
    if (name in actual && !sameFact(actual[name], expectedFact)) {
      errors.push(
        `Color Picker specialized adapter spec ${category}.${name} must match its contract-owned fact.`,
      );
    }
  }
}

function validateRuntimeFacadeFacts(
  actual: unknown,
  expected: AdapterColorPickerFacts["exports"]["runtimeFacades"],
  errors: string[],
): void {
  if (!isRecord(actual)) {
    errors.push("Color Picker specialized adapter spec runtimeFacades must be an object.");
    return;
  }
  validateExactFactNames("runtimeFacades", Object.keys(actual), Object.keys(expected), errors);
  if (actual.importSource !== expected.importSource) {
    errors.push(
      `Color Picker specialized adapter spec runtimeFacades.importSource must be "${expected.importSource}".`,
    );
  }
  validateStringArrayFacts("runtimeFacades.types", actual.types, expected.types, errors);
  validateStringArrayFacts("runtimeFacades.values", actual.values, expected.values, errors);
}

function validateNestedOrderedFacts(
  actual: Record<string, unknown>,
  expected: AdapterColorPickerFacts,
  errors: string[],
): void {
  if (isRecord(actual.parts)) {
    for (const [name, expectedPart] of Object.entries(expected.parts)) {
      const actualPart = actual.parts[name];
      if (isRecord(actualPart)) {
        validateNamedArrayFacts(
          `parts.${name}.initialAttributes`,
          actualPart.initialAttributes,
          expectedPart.initialAttributes,
          "name",
          errors,
        );
      }
    }
  }

  if (isRecord(actual.props)) {
    for (const [name, expectedProp] of Object.entries(expected.props)) {
      const actualProp = actual.props[name];
      if (isRecord(actualProp)) {
        validateStringArrayFacts(
          `props.${name}.targets`,
          actualProp.targets,
          expectedProp.targets,
          errors,
        );
      }
    }
  }

  if (Array.isArray(actual.setters)) {
    for (const expectedSetter of expected.setters) {
      const actualSetter = actual.setters.find(
        (candidate) => isRecord(candidate) && candidate.method === expectedSetter.method,
      );
      if (isRecord(actualSetter) && expectedSetter.props !== undefined) {
        validateStringArrayFacts(
          `setters.${expectedSetter.method}.props`,
          actualSetter.props,
          expectedSetter.props,
          errors,
        );
      }
    }
  }

  validateNestedStringArray("form.props", actual.form, expected.form, "props", errors);
  validateNestedStringArray(
    "runtime.optionProps",
    actual.runtime,
    expected.runtime,
    "optionProps",
    errors,
  );

  if (Array.isArray(actual.initialMarkup)) {
    for (const expectedEntry of expected.initialMarkup) {
      const actualEntry = actual.initialMarkup.find(
        (candidate) => isRecord(candidate) && candidate.part === expectedEntry.part,
      );
      if (isRecord(actualEntry)) {
        validateStringArrayFacts(
          `initialMarkup.${expectedEntry.part}.attributes`,
          actualEntry.attributes,
          expectedEntry.attributes,
          errors,
        );
      }
    }
  }

  if (Array.isArray(actual.cssVariables)) {
    for (const expectedVariable of expected.cssVariables) {
      const actualVariable = actual.cssVariables.find(
        (candidate) => isRecord(candidate) && candidate.name === expectedVariable.name,
      );
      if (isRecord(actualVariable)) {
        validateStringArrayFacts(
          `cssVariables.${expectedVariable.name}.parts`,
          actualVariable.parts,
          expectedVariable.parts,
          errors,
        );
      }
    }
  }

  for (const field of ["affectedFrameworks", "contractOwnedFacts", "tests"] as const) {
    validateNestedStringArray(
      `escapeHatch.${field}`,
      actual.escapeHatch,
      expected.escapeHatch,
      field,
      errors,
    );
  }
}

function validateNestedStringArray(
  category: string,
  actualParent: unknown,
  expectedParent: Readonly<Record<string, unknown>>,
  field: string,
  errors: string[],
): void {
  const expected = expectedParent[field];
  if (!Array.isArray(expected) || expected.some((value) => typeof value !== "string")) return;
  validateStringArrayFacts(
    category,
    isRecord(actualParent) ? actualParent[field] : undefined,
    expected,
    errors,
  );
}

function validateStringArrayFacts(
  category: string,
  actual: unknown,
  expected: readonly string[],
  errors: string[],
): void {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== "string")) {
    errors.push(`Color Picker specialized adapter spec ${category} must be a string array.`);
    return;
  }
  validateExactFactNames(category, actual, expected, errors);
  validateCanonicalSequence(category, actual, expected, errors);
}

function validateCanonicalSequence(
  category: string,
  actual: readonly string[],
  expected: readonly string[],
  errors: string[],
): void {
  const hasSameUniqueFacts =
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    expected.every((name) => actual.includes(name));
  if (hasSameUniqueFacts && !arraysEqual(actual, expected)) {
    errors.push(
      `Color Picker specialized adapter spec ${category} must preserve canonical contract order: ${expected.join(", ")}.`,
    );
  }
}

function validateExactFactNames(
  category: string,
  actual: readonly string[],
  expected: readonly string[],
  errors: string[],
): void {
  const missing = expected.filter((name) => !actual.includes(name));
  const unexpected = actual.filter((name) => !expected.includes(name));
  const duplicates = actual.filter((name, index) => actual.indexOf(name) !== index);
  if (missing.length > 0) {
    errors.push(
      `Color Picker specialized adapter spec ${category} is missing: ${missing.join(", ")}.`,
    );
  }
  if (unexpected.length > 0) {
    errors.push(
      `Color Picker specialized adapter spec ${category} has unexpected facts: ${unexpected.join(", ")}.`,
    );
  }
  if (duplicates.length > 0) {
    errors.push(
      `Color Picker specialized adapter spec ${category} has duplicate facts: ${[...new Set(duplicates)].join(", ")}.`,
    );
  }
}

function getFactIdentity(fact: unknown, field: string, index: number): string {
  return isRecord(fact) && typeof fact[field] === "string"
    ? fact[field]
    : `<invalid-${field}-${index}>`;
}

function sameFact(left: unknown, right: unknown): boolean {
  return JSON.stringify(toCanonicalFact(left)) === JSON.stringify(toCanonicalFact(right));
}

function toCanonicalFact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toCanonicalFact);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, toCanonicalFact(value[key])]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
