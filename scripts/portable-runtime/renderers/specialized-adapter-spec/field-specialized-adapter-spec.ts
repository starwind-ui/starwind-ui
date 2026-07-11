import type {
  PrimitivePropContract,
  PrimitiveSetterContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterFormControlCompositionFacts,
  AdapterFormControlCompositionPartName,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type FieldSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  field: {
    adapterKind: "field-composition";
    anatomy: FieldAnatomyRecipe[];
    controlComposition: FieldControlCompositionRecipe;
    formTiming: FieldFormTimingRecipe;
    messageProjection: FieldMessageProjectionRecipe;
    namespace: FieldNamespaceRecipe;
    rootState: FieldRootStateRecipe;
    runtimeBoundary: string[];
  };
};

type FieldAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type FieldControlCompositionRecipe = {
  composedControl: {
    composedPrimitive: "input";
    composedAttribute: "data-sw-input";
    defaultElement: "input";
    disabledProjection: {
      attribute: "data-disabled";
      forwardedAttribute: "disabled";
      prop: "disabled";
    };
    valueType: "string | number | string[]";
  };
  part: "control";
  runtimeBoundary: string;
};

type FieldFormTimingRecipe = {
  passthroughs: FieldFormTimingPassthroughRecipe[];
  runtimeBoundary: string;
  typeImport: {
    importSource: "@starwind-ui/runtime/form";
    name: "FormValidationTiming";
  };
};

type FieldFormTimingPassthroughRecipe = {
  attribute: "data-error-visibility" | "data-revalidation-timing" | "data-validation-timing";
  prop: "errorVisibility" | "revalidationTiming" | "validationTiming";
  type: "FormValidationTiming";
};

type FieldMessageProjectionRecipe = {
  error: FieldErrorProjectionRecipe;
  matchType: "FieldErrorMatch";
  matchValues: FieldValidityMatchToken[];
  runtimeBoundary: string;
  validity: FieldValidityProjectionRecipe;
};

type FieldErrorProjectionRecipe = {
  hiddenDefault: "true";
  matchAttribute: "data-match";
  matchDefault: "false";
  matchProp: "match";
  messageSource: {
    attribute: "data-message-source";
    prop: "messageSource";
    type: '"children" | "validation"';
  };
  part: "error";
  serialization: "boolean-to-string-or-validity-token";
};

type FieldValidityProjectionRecipe = {
  hiddenDefault: "true";
  matchAttribute: "data-match";
  matchDefault: "true";
  matchProp: "match";
  part: "validity";
  serialization: "boolean-to-string-or-validity-token";
};

type FieldNamespaceRecipe = {
  defaultExport: "Field";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Field";
  objectEntries: FieldNamespaceObjectEntry[];
};

type FieldNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type FieldRootStateRecipe = {
  controls: FieldRootStateControlRecipe[];
  runtimeBoundary: string;
};

type FieldRootStateControlRecipe = {
  attribute: string;
  defaultValue?: string;
  prop: "dirty" | "disabled" | "invalid" | "name" | "touched";
  setter: string;
  stateModel?: "dirty" | "touched";
  type: string;
};

type FieldValidityMatchToken =
  | "badInput"
  | "customError"
  | "patternMismatch"
  | "rangeOverflow"
  | "rangeUnderflow"
  | "stepMismatch"
  | "tooLong"
  | "tooShort"
  | "typeMismatch"
  | "valid"
  | "valueMissing";

const FIELD_ANATOMY_PARTS = [
  "root",
  "label",
  "control",
  "description",
  "item",
  "error",
  "validity",
] as const;
const FIELD_NAMESPACE_PARTS = [
  "control",
  "description",
  "error",
  "item",
  "label",
  "root",
  "validity",
] as const;
const FIELD_ROOT_STATE_PROPS = ["dirty", "disabled", "invalid", "name", "touched"] as const;
const FIELD_ROOT_STATE_DEFAULTS = {
  dirty: "false",
  disabled: "false",
  invalid: "false",
  touched: "false",
} as const;
const FIELD_PROJECTED_PROP_KEYS = [
  ["dirty"],
  ["disabled"],
  ["invalid"],
  ["name"],
  ["touched"],
  ["match", "error"],
  ["match", "validity"],
  ["messageSource", "error"],
] as const;
const FIELD_MATCH_VALUES = [
  "badInput",
  "customError",
  "patternMismatch",
  "rangeOverflow",
  "rangeUnderflow",
  "stepMismatch",
  "tooLong",
  "tooShort",
  "typeMismatch",
  "valid",
  "valueMissing",
] as const satisfies readonly FieldValidityMatchToken[];
const FIELD_RUNTIME_BOUNDARY = [
  "label/control/description/error/validity DOM discovery",
  "ARIA id wiring and describedby/errormessage mutation",
  "native and custom control validation reads",
  "Form timing and error visibility semantics",
  "message visibility and validation-message text replacement",
  "dirty/touched/invalid state observation and cleanup observers",
] as const;
const FIELD_ROOT_STATE_RUNTIME_BOUNDARY =
  "Runtime owns field state observation, validation reads, ARIA linkage, and reflected data-state mutation.";
const FIELD_CONTROL_COMPOSITION_RUNTIME_BOUNDARY =
  "Runtime owns control discovery and ARIA/error/description wiring; adapters only compose the public control element with the Input primitive surface.";
const FIELD_MESSAGE_RUNTIME_BOUNDARY =
  "Runtime owns validation reads, message visibility, validation-message text replacement, and hidden-state mutation.";
const FIELD_FORM_TIMING_RUNTIME_BOUNDARY =
  "Form Runtime owns timing semantics and error visibility; Field adapters only project passthrough attributes.";

export function buildFieldSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): FieldSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "field") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Field specialized adapter spec.`,
    );
  }

  for (const part of FIELD_ANATOMY_PARTS) {
    assertPart(spec, part);
  }

  return {
    ...spec,
    files: buildShippingFileRecipes(spec),
    sourcePrimitiveContract: contract,
    field: {
      adapterKind: "field-composition",
      anatomy: buildAnatomyRecipes(spec),
      controlComposition: buildControlCompositionRecipe(spec),
      formTiming: buildFormTimingRecipe(),
      messageProjection: buildMessageProjectionRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      rootState: buildRootStateRecipe(spec, contract),
      runtimeBoundary: [...FIELD_RUNTIME_BOUNDARY],
    },
  };
}

export function validateFieldSpecializedAdapterSpec(spec: FieldSpecializedAdapterSpec): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "field") {
    errors.push("Field specialized adapter spec must target the field primitive.");
    return errors;
  }

  const field = isRecord(spec.field) ? spec.field : undefined;
  if (!field) {
    errors.push("Field specialized adapter spec is missing field metadata.");
    return errors;
  }

  if (field.adapterKind !== "field-composition") {
    errors.push('Field specialized adapter spec adapterKind must be "field-composition".');
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "controlComposition",
    "formTiming",
    "messageProjection",
    "namespace",
    "rootState",
    "runtimeBoundary",
  ]);
  const behaviorFields = new Set([
    "ariaWiring",
    "ariaWiringAlgorithm",
    "cleanupObservers",
    "controlDiscovery",
    "descriptionDiscovery",
    "errorDiscovery",
    "labelControlDiscovery",
    "messageVisibility",
    "observerCleanup",
    "validationReads",
    "validityReads",
  ]);
  collectFieldBehaviorFieldErrors(field, ["field"], behaviorFields, errors);

  for (const key of Object.keys(field)) {
    if (behaviorFields.has(key)) continue;

    if (!expectedFields.has(key)) {
      errors.push(`Field specialized adapter spec must not declare unexpected field "${key}".`);
    }
  }

  for (const part of FIELD_ANATOMY_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Field specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, field.anatomy));
  errors.push(...validateProjectedProps(spec));
  errors.push(...validateRootState(spec, field.rootState));
  errors.push(...validateControlComposition(spec, field.controlComposition));
  errors.push(...validateMessageProjection(spec, field.messageProjection));
  errors.push(...validateFormTiming(field.formTiming));
  errors.push(...validateNamespace(spec, field.namespace));
  errors.push(...validateShippingFiles(spec));


  if (!arraysEqual(asArray(field.runtimeBoundary), FIELD_RUNTIME_BOUNDARY)) {
    errors.push(
      "Field specialized adapter spec runtimeBoundary must match Runtime-owned Field behavior.",
    );
  }

  return errors;
}

export function buildFieldAdapterOutputModel(
  spec: FieldSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidFieldAdapterOutputModelSpec(spec);

  const facts = getFieldCompositionFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createFieldComponentFile(spec, "root", facts),
    createFieldComponentFile(spec, "label", facts),
    createFieldComponentFile(spec, "control", facts),
    createFieldComponentFile(spec, "description", facts),
    createFieldComponentFile(spec, "item", facts),
    createFieldComponentFile(spec, "error", facts),
    createFieldComponentFile(spec, "validity", facts),
    {
      exports: {
        kind: "namespace",
        members: facts.index.importMembers,
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "field-composition" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createFieldComponentFile(
  spec: FieldSpecializedAdapterSpec,
  partName: AdapterFormControlCompositionPartName,
  facts: AdapterFormControlCompositionFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events: [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "field-composition", part: partName },
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
              options: Object.values(facts.rootState).map((state) => ({
                name: state.prop.name,
                source: "prop",
              })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getFieldComponentProps(partName, facts),
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
          ? Object.values(facts.rootState).map((state) => ({
              setter: state.setter,
              state: state.prop.name,
              valueProp: state.prop.name,
            }))
          : [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${exportName}`,
  };
}

function getFieldComponentProps(
  partName: AdapterFormControlCompositionPartName,
  facts: AdapterFormControlCompositionFacts,
) {
  if (partName === "root") {
    return [
      facts.rootState.dirty.prop,
      facts.rootState.disabled.prop,
      facts.rootState.invalid.prop,
      facts.rootState.name.prop,
      facts.rootState.touched.prop,
      facts.formTiming.errorVisibility.prop,
      facts.formTiming.revalidationTiming.prop,
      facts.formTiming.validationTiming.prop,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "control") {
    return [
      { name: "defaultValue", type: facts.control.valueTypeName },
      facts.control.disabledProp,
      { name: "value", type: facts.control.valueTypeName },
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "error") {
    return [
      facts.message.error.matchProp,
      facts.message.error.messageSource.prop,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "validity") {
    return [
      { kind: "unknown" as const, name: facts.message.validity.matchProp.name, type: facts.message.matchType },
    ];
  }

  return [];
}

function getFieldCompositionFacts(
  spec: FieldSpecializedAdapterSpec,
): AdapterFormControlCompositionFacts {
  const anatomy = {
    control: getFieldAnatomyPart(spec, "control"),
    description: getFieldAnatomyPart(spec, "description"),
    error: getFieldAnatomyPart(spec, "error"),
    item: getFieldAnatomyPart(spec, "item"),
    label: getFieldAnatomyPart(spec, "label"),
    root: getFieldAnatomyPart(spec, "root"),
    validity: getFieldAnatomyPart(spec, "validity"),
  };
  const entriesByPart = new Map(
    spec.field.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const rootState = {
    dirty: getFieldRootStateProjection(spec, "dirty"),
    disabled: getFieldRootStateProjection(spec, "disabled"),
    invalid: getFieldRootStateProjection(spec, "invalid"),
    name: getFieldRootStateProjection(spec, "name"),
    touched: getFieldRootStateProjection(spec, "touched"),
  };

  return {
    attrs: {
      control: anatomy.control.discoveryAttribute,
      dirty: rootState.dirty.attribute,
      disabled: rootState.disabled.attribute,
      description: anatomy.description.discoveryAttribute,
      error: anatomy.error.discoveryAttribute,
      input: spec.field.controlComposition.composedControl.composedAttribute,
      invalid: rootState.invalid.attribute,
      item: anatomy.item.discoveryAttribute,
      label: anatomy.label.discoveryAttribute,
      name: rootState.name.attribute,
      root: anatomy.root.discoveryAttribute,
      touched: rootState.touched.attribute,
      validity: anatomy.validity.discoveryAttribute,
    },
    control: {
      disabledAttribute: spec.field.controlComposition.composedControl.disabledProjection.attribute,
      disabledForwardedAttribute:
        spec.field.controlComposition.composedControl.disabledProjection.forwardedAttribute,
      disabledProp: rootState.disabled.prop,
      valueType: spec.field.controlComposition.composedControl.valueType,
      valueTypeName: `${spec.displayName}ControlValue`,
    },
    displayName: spec.displayName,
    exports: {
      control: getFieldSpecFileBasename(spec, "control"),
      description: getFieldSpecFileBasename(spec, "description"),
      error: getFieldSpecFileBasename(spec, "error"),
      item: getFieldSpecFileBasename(spec, "item"),
      label: getFieldSpecFileBasename(spec, "label"),
      namespace: spec.field.namespace.namespace,
      root: getFieldSpecFileBasename(spec, "root"),
      validity: getFieldSpecFileBasename(spec, "validity"),
    },
    formTiming: {
      errorVisibility: getFieldFormTimingProjection(spec, "errorVisibility"),
      revalidationTiming: getFieldFormTimingProjection(spec, "revalidationTiming"),
      typeImport: spec.field.formTiming.typeImport,
      validationTiming: getFieldFormTimingProjection(spec, "validationTiming"),
    },
    index: {
      importMembers: spec.field.namespace.namedExports
        .filter((exportName) => exportName !== spec.field.namespace.defaultExport)
        .map((exportName) => {
          const entry = spec.field.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Field specialized adapter spec output model requires ${exportName} namespace entry.`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.field.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: ["InputValue", "InputValueChangeDetails"],
    },
    message: {
      error: {
        hiddenDefault: spec.field.messageProjection.error.hiddenDefault,
        matchAttribute: spec.field.messageProjection.error.matchAttribute,
        matchDefault: spec.field.messageProjection.error.matchDefault,
        matchProp: getAdapterFamilyProp(getTargetProp(spec, "match", "error")),
        messageSource: {
          attribute: spec.field.messageProjection.error.messageSource.attribute,
          prop: getAdapterFamilyProp(getTargetProp(spec, "messageSource", "error")),
          typeName: `${spec.displayName}ErrorMessageSource`,
        },
      },
      matchType: spec.field.messageProjection.matchType,
      matchValues: [...spec.field.messageProjection.matchValues],
      validity: {
        hiddenDefault: spec.field.messageProjection.validity.hiddenDefault,
        matchAttribute: spec.field.messageProjection.validity.matchAttribute,
        matchDefault: spec.field.messageProjection.validity.matchDefault,
        matchProp: getAdapterFamilyProp(getTargetProp(spec, "match", "validity")),
      },
    },
    parts: {
      control: getFieldCompositionPart(spec, entriesByPart, anatomy.control.part),
      description: getFieldCompositionPart(spec, entriesByPart, anatomy.description.part),
      error: getFieldCompositionPart(spec, entriesByPart, anatomy.error.part),
      item: getFieldCompositionPart(spec, entriesByPart, anatomy.item.part),
      label: getFieldCompositionPart(spec, entriesByPart, anatomy.label.part),
      root: getFieldCompositionPart(spec, entriesByPart, anatomy.root.part),
      validity: getFieldCompositionPart(spec, entriesByPart, anatomy.validity.part),
    },
    rootState,
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${spec.displayName}s`,
      typeImportSource: "@starwind-ui/runtime",
    },
  };
}

function collectFieldBehaviorFieldErrors(
  value: unknown,
  path: string[],
  behaviorFields: ReadonlySet<string>,
  errors: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectFieldBehaviorFieldErrors(item, [...path, String(index)], behaviorFields, errors);
    });
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (behaviorFields.has(key)) {
      errors.push(
        `Field specialized adapter spec must not declare ${nextPath.join(".")}; keep Runtime-owned behavior in Runtime controllers.`,
      );
    }

    collectFieldBehaviorFieldErrors(child, nextPath, behaviorFields, errors);
  }
}

function buildShippingFileRecipes(spec: SpecializedAdapterSpec): SpecializedAdapterSpec["files"] {
  return spec.files.map((file) => ({ ...file }));
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): FieldAnatomyRecipe[] {
  return FIELD_ANATOMY_PARTS.map((partName) => {
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

function buildControlCompositionRecipe(
  spec: SpecializedAdapterSpec,
): FieldControlCompositionRecipe {
  getPart(spec, "control");
  getProp(spec, "disabled");

  return {
    composedControl: {
      composedPrimitive: "input",
      composedAttribute: getStaticAttributeName(
        spec,
        "control",
        "data-sw-input",
      ) as "data-sw-input",
      defaultElement: "input",
      disabledProjection: {
        attribute: getStaticAttributeName(spec, "root", "data-disabled") as "data-disabled",
        forwardedAttribute: "disabled",
        prop: "disabled",
      },
      valueType: "string | number | string[]",
    },
    part: "control",
    runtimeBoundary: FIELD_CONTROL_COMPOSITION_RUNTIME_BOUNDARY,
  };
}

function buildFormTimingRecipe(): FieldFormTimingRecipe {
  return {
    passthroughs: [
      {
        attribute: "data-error-visibility",
        prop: "errorVisibility",
        type: "FormValidationTiming",
      },
      {
        attribute: "data-revalidation-timing",
        prop: "revalidationTiming",
        type: "FormValidationTiming",
      },
      {
        attribute: "data-validation-timing",
        prop: "validationTiming",
        type: "FormValidationTiming",
      },
    ],
    runtimeBoundary: FIELD_FORM_TIMING_RUNTIME_BOUNDARY,
    typeImport: {
      importSource: "@starwind-ui/runtime/form",
      name: "FormValidationTiming",
    },
  };
}

function buildMessageProjectionRecipe(spec: SpecializedAdapterSpec): FieldMessageProjectionRecipe {
  const errorMatch = getTargetProp(spec, "match", "error");
  const validityMatch = getTargetProp(spec, "match", "validity");
  const messageSource = getTargetProp(spec, "messageSource", "error");

  return {
    error: {
      hiddenDefault: "true",
      matchAttribute: getStaticAttributeName(spec, "error", "data-match") as "data-match",
      matchDefault: getRequiredValue(errorMatch.defaultValue, "error match default") as "false",
      matchProp: "match",
      messageSource: {
        attribute: getStaticAttributeName(
          spec,
          "error",
          "data-message-source",
        ) as "data-message-source",
        prop: "messageSource",
        type: messageSource.type as '"children" | "validation"',
      },
      part: "error",
      serialization: "boolean-to-string-or-validity-token",
    },
    matchType: "FieldErrorMatch",
    matchValues: [...FIELD_MATCH_VALUES],
    runtimeBoundary: FIELD_MESSAGE_RUNTIME_BOUNDARY,
    validity: {
      hiddenDefault: "true",
      matchAttribute: getStaticAttributeName(spec, "validity", "data-match") as "data-match",
      matchDefault: getRequiredValue(
        validityMatch.defaultValue,
        "validity match default",
      ) as "true",
      matchProp: "match",
      part: "validity",
      serialization: "boolean-to-string-or-validity-token",
    },
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): FieldNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = FIELD_NAMESPACE_PARTS.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Field specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Field",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: ["Field", ...objectEntries.map((entry) => entry.exportName)],
    namespace: "Field",
    objectEntries,
  };
}

function buildRootStateRecipe(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
): FieldRootStateRecipe {
  return {
    controls: FIELD_ROOT_STATE_PROPS.map((propName) =>
      buildRootStateControlRecipe(spec, contract, propName),
    ),
    runtimeBoundary: FIELD_ROOT_STATE_RUNTIME_BOUNDARY,
  };
}

function buildRootStateControlRecipe(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
  propName: (typeof FIELD_ROOT_STATE_PROPS)[number],
): FieldRootStateControlRecipe {
  const prop = getSourceProp(contract, propName);
  const setter = getPropSetter(spec, propName);
  const state = spec.stateModels.find((candidate) => candidate.controlledProp === propName);
  const recipe: FieldRootStateControlRecipe = {
    attribute: getStaticAttributeName(spec, "root", getRootStateAttributeName(propName)),
    prop: propName,
    setter: setter.method,
    type: prop.type,
  };
  const defaultValue =
    prop.defaultValue ??
    FIELD_ROOT_STATE_DEFAULTS[propName as keyof typeof FIELD_ROOT_STATE_DEFAULTS];

  if (defaultValue !== undefined) {
    recipe.defaultValue = defaultValue;
  }
  if (state?.name === "dirty" || state?.name === "touched") {
    recipe.stateModel = state.name;
  }

  return recipe;
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Field specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      FIELD_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Field specialized adapter spec anatomy must match root, label, control, description, item, error, validity.",
    );
  }

  for (const partName of FIELD_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Field specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = spec.parts.find((candidate) => candidate.name === partName);
    if (!part) {
      errors.push(`Field specialized adapter spec requires ${partName} part.`);
      continue;
    }
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(`Field specialized adapter spec ${partName} defaultElement must match contract.`);
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Field specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Field specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Field specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Field specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateControlComposition(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Field specialized adapter spec requires controlComposition metadata."];
  }

  const errors: string[] = [];
  if (!hasPart(spec, "control")) {
    errors.push("Field specialized adapter spec requires control part.");
  }
  if (!findProp(spec, "disabled")) {
    errors.push("Field specialized adapter spec requires disabled prop metadata.");
  }

  if (errors.length === 0 && !recipeEquals(() => buildControlCompositionRecipe(spec), value)) {
    errors.push(
      "Field specialized adapter spec controlComposition metadata must match FieldControl composition facts.",
    );
  }

  return errors;
}

function validateFormTiming(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Field specialized adapter spec requires formTiming metadata."];
  }

  return recipeEquals(buildFormTimingRecipe, value)
    ? []
    : [
        "Field specialized adapter spec formTiming metadata must document Form timing passthrough attributes.",
      ];
}

function validateMessageProjection(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Field specialized adapter spec requires messageProjection metadata."];
  }

  const errors: string[] = [];
  if (!findTargetProp(spec, "match", "error")) {
    errors.push("Field specialized adapter spec requires error match prop metadata.");
  }
  if (!findTargetProp(spec, "match", "validity")) {
    errors.push("Field specialized adapter spec requires validity match prop metadata.");
  }
  if (!findTargetProp(spec, "messageSource", "error")) {
    errors.push("Field specialized adapter spec requires messageSource prop metadata.");
  }

  if (errors.length === 0 && !recipeEquals(() => buildMessageProjectionRecipe(spec), value)) {
    errors.push(
      "Field specialized adapter spec messageProjection metadata must match FieldError and FieldValidity serialization facts.",
    );
  }

  return errors;
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Field specialized adapter spec requires namespace metadata."];
  }

  let expected: FieldNamespaceRecipe;
  try {
    expected = buildNamespaceRecipe(spec);
  } catch {
    return ["Field specialized adapter spec namespace metadata is incomplete."];
  }

  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Field specialized adapter spec namespace default export must be Field.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Field specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Field specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Field specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Field specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateProjectedProps(spec: FieldSpecializedAdapterSpec): string[] {
  for (const [propName, targetPart] of FIELD_PROJECTED_PROP_KEYS) {
    const actual = findTargetAwareProp(spec.props, propName, targetPart);
    const expected = findTargetAwareProp(spec.sourcePrimitiveContract.props, propName, targetPart);
    if (
      !actual ||
      !expected ||
      !recordsEqual(toProjectedPropRecipe(actual), toProjectedPropRecipe(expected))
    ) {
      return [
        "Field specialized adapter spec props must match source contract facts for root state, message projection, and control composition.",
      ];
    }
  }

  return [];
}

function validateRootState(spec: FieldSpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Field specialized adapter spec requires rootState metadata."];
  }

  const errors: string[] = [];
  for (const propName of FIELD_ROOT_STATE_PROPS) {
    if (!findProp(spec, propName)) {
      errors.push(`Field specialized adapter spec requires ${propName} root prop metadata.`);
    }
    if (!spec.setterSync.some((setter) => "prop" in setter && setter.prop === propName)) {
      errors.push(`Field specialized adapter spec requires ${propName} setter metadata.`);
    }
  }

  if (
    errors.length === 0 &&
    !recipeEquals(() => buildRootStateRecipe(spec, spec.sourcePrimitiveContract), value)
  ) {
    errors.push(
      "Field specialized adapter spec rootState metadata must match root control props, setter sync, defaults, and attributes.",
    );
  }

  return errors;
}

function validateShippingFiles(spec: FieldSpecializedAdapterSpec): string[] {
  const expected = buildShippingFileRecipes({
    ...spec,
    files: spec.renderPlan.files,
  });

  return recordsArrayEqual(spec.files, expected)
    ? []
    : ["Field specialized adapter spec files must match exported Field parts plus index."];
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Field specialized adapter spec requires ${partName} part.`);
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

function findTargetAwareProp(
  props: readonly PrimitivePropContract[],
  propName: string,
  targetPart?: string,
) {
  return props.find((candidate) => {
    if (candidate.name !== propName) return false;
    if (!targetPart) return !candidate.targets?.length;

    return candidate.targets?.includes(targetPart);
  });
}

function findTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  return spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
}

function getFieldAnatomyPart(spec: FieldSpecializedAdapterSpec, partName: string) {
  const part = spec.field.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(`Field specialized adapter spec output model requires ${partName} part.`);
  }

  return part;
}

function getFieldSpecFileBasename(spec: FieldSpecializedAdapterSpec, partName: string): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Field specialized adapter spec output model requires ${partName} file.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Field specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function getFieldCompositionPart(
  spec: FieldSpecializedAdapterSpec,
  entriesByPart: Map<string, FieldNamespaceObjectEntry>,
  partName: string,
) {
  const part = getFieldAnatomyPart(spec, partName);

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.part,
    namespaceKey: getRequiredNamespaceKey(entriesByPart, part.part),
  };
}

function getFieldFormTimingProjection(
  spec: FieldSpecializedAdapterSpec,
  propName: "errorVisibility" | "revalidationTiming" | "validationTiming",
) {
  const passthrough = spec.field.formTiming.passthroughs.find(
    (candidate) => candidate.prop === propName,
  );
  if (!passthrough) {
    throw new Error(
      `Field specialized adapter spec output model requires ${propName} timing passthrough.`,
    );
  }

  return {
    attribute: passthrough.attribute,
    dataPropName: toAttributeVariableName(passthrough.attribute),
    prop: getAdapterFamilyProp({
      name: passthrough.prop,
      type: passthrough.type,
    }),
  };
}

function getFieldRootStateProjection(
  spec: FieldSpecializedAdapterSpec,
  propName: "dirty" | "disabled" | "invalid" | "name" | "touched",
) {
  const control = spec.field.rootState.controls.find((candidate) => candidate.prop === propName);
  if (!control) {
    throw new Error(
      `Field specialized adapter spec output model requires ${propName} root state control.`,
    );
  }

  return {
    attribute: control.attribute,
    prop: getAdapterFamilyProp({
      defaultValue: control.defaultValue,
      name: control.prop,
      type: control.type,
    }),
    setter: control.setter,
  };
}

function getRequiredNamespaceKey(
  entriesByPart: Map<string, FieldNamespaceObjectEntry>,
  partName: string,
): string {
  const entry = entriesByPart.get(partName);
  if (!entry) {
    throw new Error(`Field specialized adapter spec output model requires ${partName} namespace.`);
  }

  return entry.property;
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

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Field specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getProp(spec: SpecializedAdapterSpec, propName: string): PrimitivePropContract {
  const prop = findProp(spec, propName);
  if (!prop) {
    throw new Error(`Field specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getPropSetter(spec: SpecializedAdapterSpec, propName: string): PrimitiveSetterContract {
  const setter = spec.setterSync.find(
    (candidate) => "prop" in candidate && candidate.prop === propName,
  );
  if (!setter) {
    throw new Error(`Field specialized adapter spec requires ${propName} setter metadata.`);
  }

  return setter;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Field specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getRootStateAttributeName(propName: string): string {
  return `data-${propName}`;
}

function getSourceProp(contract: RuntimeAdapterContract, propName: string): PrimitivePropContract {
  const prop = contract.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Field specialized adapter spec requires ${propName} source prop metadata.`);
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
    throw new Error(`Field specialized adapter spec requires ${name} metadata for ${partName}.`);
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
      `Field specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
    );
  }

  return prop;
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

function assertValidFieldAdapterOutputModelSpec(spec: FieldSpecializedAdapterSpec): void {
  const errors = validateFieldSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Field specialized adapter spec output model cannot build invalid Field spec:\n${errors.join("\n")}`,
    );
  }
}

function toAttributeVariableName(attribute: string): string {
  return attribute
    .replace(/^data-/, "data-")
    .split("-")
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? segment : `${segment[0].toUpperCase()}${segment.slice(1)}`,
    )
    .join("");
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
