import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterOutputModel,
  AdapterRepeatedDisclosureComponentProjection,
  AdapterRepeatedDisclosureFacts,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type AccordionSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  accordion: {
    adapterKind: "repeated-disclosure";
    anatomy: AccordionAnatomyRecipe[];
    itemContext: AccordionItemContextRecipe;
    namespace: AccordionNamespaceRecipe;
    panelVisibility: AccordionPanelVisibilityRecipe;
    presence: AccordionPresenceRecipe;
    repetition: AccordionRepetitionRecipe;
    rootOptions: AccordionRootOptionsRecipe;
    runtimeBoundary: string[];
    trigger: AccordionTriggerRecipe;
    valueControl: AccordionValueControlRecipe;
  };
};

type AccordionAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type AccordionEventRecipe = {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: "valueChange";
  valueProperty: string;
  valueType: string;
};

type AccordionItemContextRecipe = {
  consumers: ["trigger", "panel"];
  name: "accordionItem";
  providerPart: "item";
  provides: ["value", "disabled"];
};

type AccordionNamespaceRecipe = {
  defaultExport: "Accordion";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Accordion";
  objectEntries: AccordionNamespaceObjectEntry[];
};

type AccordionNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type AccordionOptionRecipe<Prop extends string, Type extends string> = {
  attribute: string;
  defaultValue?: string;
  lifecycle: "constructor-only";
  prop: Prop;
  type: Type;
};

type AccordionPanelVisibilityRecipe = {
  activeAttributes: {
    dataState: string;
    hidden: string;
  };
  panelPart: "panel";
  presencePolicy: "runtime-owned-visibility";
  runtimeBoundary: string;
};

type AccordionPresenceRecipe = NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]>;

type AccordionRepetitionRecipe = {
  disabled: {
    attribute: string;
    defaultValue: string;
    prop: "disabled";
    targetPart: "item";
    type: "boolean";
  };
  headerPart: "header";
  itemPart: "item";
  itemValue: {
    attribute: string;
    prop: "value";
    targetPart: "item";
    type: "string";
  };
  panelPart: "panel";
  triggerPart: "trigger";
};

type AccordionRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

type AccordionRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledStateSync: "unsupported";
  controlledProp: string;
  defaultProp: string;
  initialAttribute: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type AccordionRootOptionsRecipe = {
  collapsible: AccordionOptionRecipe<"collapsible", "boolean">;
  defaultValue: Omit<AccordionOptionRecipe<"defaultValue", "AccordionValue">, "defaultValue">;
  type: AccordionOptionRecipe<"type", '"single" | "multiple"'>;
};

type AccordionTriggerRecipe = {
  buttonTypeAttribute: string;
  expandedAttribute: string;
  part: "trigger";
  stateAttribute: string;
};

type AccordionValueControlRecipe = {
  event: AccordionEventRecipe;
  initialRuntimeOption: {
    prop: "value";
    runtimeOption: "value";
    source: "controlledProp";
    targetPart: "root";
  };
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

const ACCORDION_ANATOMY_PARTS = ["root", "item", "header", "trigger", "panel"] as const;
const ACCORDION_NAMESPACE_OBJECT_PART_ORDER = [
  "root",
  "item",
  "header",
  "trigger",
  "panel",
] as const;
const ACCORDION_NAMESPACE_NAMED_EXPORT_PART_ORDER = [
  "header",
  "item",
  "panel",
  "root",
  "trigger",
] as const;
const ACCORDION_REQUIRED_PARTS = ACCORDION_ANATOMY_PARTS;
const ACCORDION_VALUE_CONTROL_RUNTIME_BOUNDARY = [
  "Runtime owns single/multiple value normalization and item toggle rules.",
  "Adapters only project value state, event forwarding, and setValue controlled resync.",
] as const;
const ACCORDION_PANEL_VISIBILITY_RUNTIME_BOUNDARY =
  "Runtime owns linked trigger/panel ids, panel height measurement, and close-animation hidden cleanup.";
const ACCORDION_RUNTIME_BOUNDARY = [
  "value normalization for single and multiple modes",
  "item discovery and structural child changes",
  "trigger button keyboarding",
  "trigger and panel id linking",
  "panel height measurement",
  "close-animation hidden cleanup",
  "controller recreation for creation-only root options",
] as const;

export function buildAccordionSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): AccordionSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "accordion") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Accordion specialized adapter spec.`,
    );
  }

  for (const part of ACCORDION_REQUIRED_PARTS) {
    assertPart(spec, part);
  }

  if (!spec.renderPlan.presence) {
    throw new Error("Accordion specialized adapter spec requires presence metadata.");
  }

  return {
    ...spec,
    sourcePrimitiveContract: contract,
    accordion: {
      adapterKind: "repeated-disclosure",
      anatomy: buildAnatomyRecipes(spec),
      itemContext: buildItemContextRecipe(),
      namespace: buildNamespaceRecipe(spec),
      panelVisibility: buildPanelVisibilityRecipe(spec),
      presence: buildPresenceRecipe(spec),
      repetition: buildRepetitionRecipe(spec),
      rootOptions: buildRootOptionsRecipe(spec),
      runtimeBoundary: [...ACCORDION_RUNTIME_BOUNDARY],
      trigger: buildTriggerRecipe(spec),
      valueControl: buildValueControlRecipe(spec),
    },
  };
}

export function validateAccordionSpecializedAdapterSpec(
  spec: AccordionSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "accordion") {
    errors.push("Accordion specialized adapter spec must target the accordion primitive.");
    return errors;
  }

  const accordion = isRecord(spec.accordion) ? spec.accordion : undefined;
  if (!accordion) {
    errors.push("Accordion specialized adapter spec is missing accordion metadata.");
    return errors;
  }

  if (accordion.adapterKind !== "repeated-disclosure") {
    errors.push('Accordion specialized adapter spec adapterKind must be "repeated-disclosure".');
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "itemContext",
    "namespace",
    "panelVisibility",
    "presence",
    "repetition",
    "rootOptions",
    "runtimeBoundary",
    "trigger",
    "valueControl",
  ]);
  const behaviorFields = new Set([
    "buttonKeyboarding",
    "cleanup",
    "idLinking",
    "panelMeasurement",
    "valueNormalization",
  ]);

  for (const field of Object.keys(accordion)) {
    if (behaviorFields.has(field)) {
      errors.push(
        `Accordion specialized adapter spec must not declare accordion.${field}; keep Runtime-owned behavior in Runtime controllers.`,
      );
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(
        `Accordion specialized adapter spec must not declare unexpected field "${field}".`,
      );
    }
  }

  for (const part of ACCORDION_REQUIRED_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Accordion specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, accordion.anatomy));
  errors.push(...validateRootOptions(spec, accordion.rootOptions));
  errors.push(...validateValueControl(spec, accordion.valueControl));
  errors.push(...validateRepetition(spec, accordion.repetition));
  errors.push(...validateItemContext(accordion.itemContext));
  errors.push(...validateTrigger(spec, accordion.trigger));
  errors.push(...validatePanelVisibility(spec, accordion.panelVisibility));
  errors.push(...validatePresence(spec, accordion.presence));
  errors.push(...validateNamespace(spec, accordion.namespace));


  if (!arraysEqual(asArray(accordion.runtimeBoundary), ACCORDION_RUNTIME_BOUNDARY)) {
    errors.push(
      "Accordion specialized adapter spec runtimeBoundary must match Runtime-owned repeated disclosure behavior.",
    );
  }

  return errors;
}

export function buildAccordionAdapterOutputModel(
  spec: AccordionSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidAccordionAdapterOutputModelSpec(spec);

  const facts = getAccordionRepeatedDisclosureFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createAccordionComponentFile(spec, "root", facts),
    createAccordionComponentFile(spec, "item", facts),
    createAccordionComponentFile(spec, "header", facts),
    createAccordionComponentFile(spec, "trigger", facts),
    createAccordionComponentFile(spec, "panel", facts),
    {
      exports: {
        kind: "namespace",
        members: facts.index.importMembers,
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "repeated-disclosure" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createAccordionComponentFile(
  spec: AccordionSpecializedAdapterSpec,
  partName: AdapterRepeatedDisclosureComponentProjection["part"],
  facts: AdapterRepeatedDisclosureFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context:
        partName === spec.accordion.itemContext.providerPart
          ? [
              {
                name: spec.accordion.itemContext.name,
                role: "provider",
                value: { code: spec.accordion.itemContext.provides.join(", ") },
              },
            ]
          : isAccordionItemContextConsumer(partName, spec)
            ? [
                {
                  name: spec.accordion.itemContext.name,
                  role: "consumer",
                  value: { code: spec.accordion.itemContext.provides.join(", ") },
                },
              ]
            : [],
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
            ]
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "repeated-disclosure", part: partName },
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
                facts.props.type,
                facts.props.defaultValue,
                facts.props.collapsible,
                facts.props.value,
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getAccordionComponentProps(partName, facts),
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

function isAccordionItemContextConsumer(
  partName: AdapterRepeatedDisclosureComponentProjection["part"],
  spec: AccordionSpecializedAdapterSpec,
): boolean {
  return spec.accordion.itemContext.consumers.some((consumer) => consumer === partName);
}

function getAccordionComponentProps(
  partName: AdapterRepeatedDisclosureComponentProjection["part"],
  facts: AdapterRepeatedDisclosureFacts,
) {
  if (partName === "root") {
    return [
      facts.props.type,
      facts.props.defaultValue,
      facts.props.value,
      facts.props.collapsible,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "item") {
    return [facts.props.itemValue, facts.props.disabled].map((prop) => ({
      kind: "unknown" as const,
      name: prop.name,
      type: prop.type,
    }));
  }

  return [];
}

function getAccordionRepeatedDisclosureFacts(
  spec: AccordionSpecializedAdapterSpec,
): AdapterRepeatedDisclosureFacts {
  const anatomy = {
    header: getAccordionAnatomyPart(spec, "header"),
    item: getAccordionAnatomyPart(spec, "item"),
    panel: getAccordionAnatomyPart(spec, "panel"),
    root: getAccordionAnatomyPart(spec, "root"),
    trigger: getAccordionAnatomyPart(spec, "trigger"),
  };
  for (const partName of spec.accordion.namespace.memberParts) {
    getAccordionSpecFileBasename(spec, partName);
  }

  const rootOptions = spec.accordion.rootOptions;
  const repetition = spec.accordion.repetition;
  const trigger = spec.accordion.trigger;
  const panelVisibility = spec.accordion.panelVisibility;
  const valueControl = spec.accordion.valueControl;
  const entriesByPart = new Map(
    spec.accordion.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const parts = {
    header: getRepeatedDisclosurePart(spec, anatomy.header.part),
    item: getRepeatedDisclosurePart(spec, anatomy.item.part),
    panel: getRepeatedDisclosurePart(spec, anatomy.panel.part),
    root: getRepeatedDisclosurePart(spec, anatomy.root.part),
    trigger: getRepeatedDisclosurePart(spec, anatomy.trigger.part),
  };
  const props = {
    collapsible: getAdapterFamilyProp(getProp(spec, rootOptions.collapsible.prop)),
    defaultValue: {
      ...getAdapterFamilyProp(getProp(spec, rootOptions.defaultValue.prop)),
      staticMarkupType: "string | string[]",
    },
    disabled: getAdapterFamilyProp(
      getTargetProp(spec, repetition.disabled.prop, repetition.disabled.targetPart),
    ),
    itemValue: getAdapterFamilyProp(
      getTargetProp(spec, repetition.itemValue.prop, repetition.itemValue.targetPart),
    ),
    type: getAdapterFamilyProp(getProp(spec, rootOptions.type.prop)),
    value: getAdapterFamilyProp(
      getTargetProp(
        spec,
        valueControl.initialRuntimeOption.prop,
        valueControl.initialRuntimeOption.targetPart,
      ),
    ),
  };

  return {
    attrs: {
      collapsible: rootOptions.collapsible.attribute,
      defaultValue: rootOptions.defaultValue.attribute,
      disabled: repetition.disabled.attribute,
      header: anatomy.header.discoveryAttribute,
      item: anatomy.item.discoveryAttribute,
      itemState: getStaticAttributeName(spec, anatomy.item.part, "data-state"),
      itemValue: repetition.itemValue.attribute,
      panel: anatomy.panel.discoveryAttribute,
      panelHidden: panelVisibility.activeAttributes.hidden,
      panelState: panelVisibility.activeAttributes.dataState,
      root: anatomy.root.discoveryAttribute,
      rootState: getStaticAttributeName(spec, anatomy.root.part, "data-state"),
      trigger: anatomy.trigger.discoveryAttribute,
      triggerExpanded: trigger.expandedAttribute,
      triggerState: trigger.stateAttribute,
      triggerType: trigger.buttonTypeAttribute,
      type: rootOptions.type.attribute,
    },
    displayName: spec.displayName,
    events: {
      valueChange: valueControl.event,
    },
    exports: {
      header: getAccordionSpecFileBasename(spec, "header"),
      item: getAccordionSpecFileBasename(spec, "item"),
      namespace: spec.accordion.namespace.namespace,
      panel: getAccordionSpecFileBasename(spec, "panel"),
      root: getAccordionSpecFileBasename(spec, "root"),
      trigger: getAccordionSpecFileBasename(spec, "trigger"),
    },
    index: {
      importMembers: spec.accordion.namespace.namedExports
        .filter((exportName) => exportName !== spec.accordion.namespace.defaultExport)
        .map((exportName) => {
          const entry = spec.accordion.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Accordion specialized adapter spec output model requires ${exportName} namespace entry.`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.accordion.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [valueControl.state.valueType, valueControl.event.detailsType],
    },
    itemContext: spec.accordion.itemContext,
    panelVisibility: {
      hiddenAttribute: panelVisibility.activeAttributes.hidden,
      stateAttribute: panelVisibility.activeAttributes.dataState,
    },
    parts,
    props,
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${pluralizeDisplayName(spec.displayName)}`,
      typeImportSource: "@starwind-ui/runtime",
    },
    state: {
      getter: valueControl.state.getter,
      name: valueControl.state.name,
      type: valueControl.state.valueType,
    },
    setter: {
      method: valueControl.setterSync.method,
      options: getBooleanNumberStringOptions(valueControl.setterSync.options),
    },
    valueEqualityHelper: `is${spec.displayName}ValueEqual`,
  };

  function getRepeatedDisclosurePart(
    currentSpec: AccordionSpecializedAdapterSpec,
    partName: string,
  ) {
    const part = getPart(currentSpec, partName);
    const namespaceEntry = entriesByPart.get(partName);
    if (!namespaceEntry) {
      throw new Error(
        `Accordion specialized adapter spec output model requires ${partName} namespace entry.`,
      );
    }

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      name: part.name,
      namespaceKey: namespaceEntry.property,
    };
  }
}

function assertValidAccordionAdapterOutputModelSpec(spec: AccordionSpecializedAdapterSpec): void {
  const errors = validateAccordionSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Accordion Adapter Output Model cannot build from invalid Accordion spec:\n${errors.join("\n")}`,
    );
  }
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): AccordionAnatomyRecipe[] {
  return ACCORDION_ANATOMY_PARTS.map((partName) => {
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

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): AccordionNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = ACCORDION_NAMESPACE_OBJECT_PART_ORDER.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Accordion specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Accordion",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "Accordion",
      ...ACCORDION_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Accordion specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "Accordion",
    objectEntries,
  };
}

function buildItemContextRecipe(): AccordionItemContextRecipe {
  return {
    consumers: ["trigger", "panel"],
    name: "accordionItem",
    providerPart: "item",
    provides: ["value", "disabled"],
  };
}

function buildPanelVisibilityRecipe(spec: SpecializedAdapterSpec): AccordionPanelVisibilityRecipe {
  const presencePolicy = getRequiredValue(
    spec.renderPlan.presence?.unmountPolicy,
    "presence policy",
  );
  if (presencePolicy !== "runtime-owned-visibility") {
    throw new Error(
      "Accordion specialized adapter spec requires runtime-owned-visibility presence policy.",
    );
  }

  return {
    activeAttributes: {
      dataState: getStaticAttributeName(spec, "panel", "data-state"),
      hidden: getStaticAttributeName(spec, "panel", "hidden"),
    },
    panelPart: "panel",
    presencePolicy,
    runtimeBoundary: ACCORDION_PANEL_VISIBILITY_RUNTIME_BOUNDARY,
  };
}

function buildPresenceRecipe(spec: SpecializedAdapterSpec): AccordionPresenceRecipe {
  return {
    initialHiddenParts: [
      ...getRequiredValue(spec.renderPlan.presence?.initialHiddenParts, "presence"),
    ],
    unmountPolicy: getRequiredValue(spec.renderPlan.presence?.unmountPolicy, "presence policy"),
  };
}

function buildRepetitionRecipe(spec: SpecializedAdapterSpec): AccordionRepetitionRecipe {
  const itemValue = getTargetProp(spec, "value", "item");
  const disabled = getTargetProp(spec, "disabled", "item");

  return {
    disabled: {
      attribute: getStaticAttributeName(spec, "item", "data-disabled"),
      defaultValue: getRequiredValue(disabled.defaultValue, "disabled defaultValue"),
      prop: "disabled",
      targetPart: "item",
      type: disabled.type as "boolean",
    },
    headerPart: "header",
    itemPart: "item",
    itemValue: {
      attribute: getStaticAttributeName(spec, "item", "data-value"),
      prop: "value",
      targetPart: "item",
      type: itemValue.type as "string",
    },
    panelPart: "panel",
    triggerPart: "trigger",
  };
}

function buildRootOptionsRecipe(spec: SpecializedAdapterSpec): AccordionRootOptionsRecipe {
  const collapsible = getProp(spec, "collapsible");
  const defaultValue = getProp(spec, "defaultValue");
  const type = getProp(spec, "type");

  return {
    collapsible: {
      attribute: getStaticAttributeName(spec, "root", "data-collapsible"),
      defaultValue: getRequiredValue(collapsible.defaultValue, "collapsible defaultValue"),
      lifecycle: "constructor-only",
      prop: "collapsible",
      type: collapsible.type as "boolean",
    },
    defaultValue: {
      attribute: getStaticAttributeName(spec, "root", "data-default-value"),
      lifecycle: "constructor-only",
      prop: "defaultValue",
      type: defaultValue.type as "AccordionValue",
    },
    type: {
      attribute: getStaticAttributeName(spec, "root", "data-type"),
      defaultValue: getRequiredValue(type.defaultValue, "type defaultValue"),
      lifecycle: "constructor-only",
      prop: "type",
      type: type.type as '"single" | "multiple"',
    },
  };
}

function buildTriggerRecipe(spec: SpecializedAdapterSpec): AccordionTriggerRecipe {
  return {
    buttonTypeAttribute: getStaticAttributeName(spec, "trigger", "type"),
    expandedAttribute: getStaticAttributeName(spec, "trigger", "aria-expanded"),
    part: "trigger",
    stateAttribute: getStaticAttributeName(spec, "trigger", "data-state"),
  };
}

function buildValueControlRecipe(spec: SpecializedAdapterSpec): AccordionValueControlRecipe {
  const valueState = getRequiredState(spec, "value");
  const valueEvent = getRequiredEvent(spec, "valueChange");
  const valueSetter = getStateSetter(spec, "value");
  const valueProp = getTargetProp(spec, valueState.controlledProp, "root");
  if (!spec.renderPlan.runtime.optionProps?.includes(valueProp.name)) {
    throw new Error(
      "Accordion specialized adapter spec requires controlled value runtime option metadata.",
    );
  }

  return {
    event: {
      callbackProp: valueEvent.callbackProp,
      detailsType: valueEvent.detailsType,
      domEvent: valueEvent.domEvent,
      emitsFrom: valueEvent.emitsFrom,
      name: "valueChange",
      valueProperty: valueEvent.valueProperty,
      valueType: valueEvent.valueType,
    },
    initialRuntimeOption: {
      prop: "value",
      runtimeOption: valueProp.name as "value",
      source: "controlledProp",
      targetPart: "root",
    },
    runtimeBoundary: [...ACCORDION_VALUE_CONTROL_RUNTIME_BOUNDARY],
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

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Accordion specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      ACCORDION_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Accordion specialized adapter spec anatomy must match root, item, header, trigger, panel.",
    );
  }

  for (const partName of ACCORDION_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Accordion specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = getPart(spec, partName);
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Accordion specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Accordion specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Accordion specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Accordion specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Accordion specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires namespace metadata."];
  }

  const expected = buildNamespaceRecipe(spec);
  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Accordion specialized adapter spec namespace default export must be Accordion.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Accordion specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Accordion specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Accordion specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Accordion specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateItemContext(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires item context metadata."];
  }

  return recordsEqual(value, buildItemContextRecipe())
    ? []
    : [
        "Accordion specialized adapter spec item context metadata must match item value/disabled projection facts.",
      ];
}

function validatePanelVisibility(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires panel visibility metadata."];
  }

  return recordsEqual(value, buildPanelVisibilityRecipe(spec))
    ? []
    : [
        "Accordion specialized adapter spec panel visibility metadata must match Runtime-owned panel visibility facts.",
      ];
}

function validatePresence(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires presence metadata."];
  }

  return recordsEqual(value, buildPresenceRecipe(spec))
    ? []
    : [
        "Accordion specialized adapter spec presence metadata must match Runtime-owned panel visibility facts.",
      ];
}

function validateRepetition(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires repetition metadata."];
  }

  const errors: string[] = [];
  const itemValue = findTargetProp(spec, "value", "item");
  const disabled = findTargetProp(spec, "disabled", "item");
  if (!itemValue) {
    errors.push("Accordion specialized adapter spec requires item value prop metadata.");
  }
  if (!disabled) {
    errors.push("Accordion specialized adapter spec requires item disabled prop metadata.");
  }

  if (itemValue && disabled && !recordsEqual(value, buildRepetitionRecipe(spec))) {
    errors.push(
      "Accordion specialized adapter spec repetition metadata must match item value/disabled and trigger/panel part facts.",
    );
  }

  return errors;
}

function validateRootOptions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires root option metadata."];
  }

  return recordsEqual(value, buildRootOptionsRecipe(spec))
    ? []
    : [
        "Accordion specialized adapter spec root options must match type, defaultValue, and collapsible facts.",
      ];
}

function validateTrigger(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires trigger metadata."];
  }

  return recordsEqual(value, buildTriggerRecipe(spec))
    ? []
    : [
        "Accordion specialized adapter spec trigger metadata must match button type, expanded, and state facts.",
      ];
}

function validateValueControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Accordion specialized adapter spec requires valueControl metadata."];
  }

  const errors: string[] = [];
  const valueState = spec.stateModels.find((state) => state.name === "value");
  const valueEvent = spec.events.find((event) => event.name === "valueChange");
  const valueSetter = spec.setterSync.find(
    (setter) => "stateModel" in setter && setter.stateModel === "value",
  );
  if (!valueState) {
    errors.push("Accordion specialized adapter spec requires value state metadata.");
  }
  if (!valueEvent) {
    errors.push("Accordion specialized adapter spec requires valueChange event metadata.");
  }
  if (!valueSetter) {
    errors.push("Accordion specialized adapter spec requires value setter metadata.");
  }

  if (
    valueState &&
    valueEvent &&
    valueSetter &&
    !recordsEqual(value, buildValueControlRecipe(spec))
  ) {
    errors.push(
      "Accordion specialized adapter spec valueControl metadata must match contract state/event/setter facts.",
    );
  }

  return errors;
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Accordion specialized adapter spec requires ${partName} part.`);
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

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Accordion specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getAccordionAnatomyPart(spec: AccordionSpecializedAdapterSpec, partName: string) {
  const part = spec.accordion.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(`Accordion specialized adapter spec output model requires ${partName} part.`);
  }

  return part;
}

function getAccordionSpecFileBasename(
  spec: AccordionSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Accordion specialized adapter spec output model requires ${partName} file.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Accordion specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function getAdapterFamilyProp(prop: ReturnType<typeof getProp>) {
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

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Accordion specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getRequiredEvent(spec: SpecializedAdapterSpec, eventName: string): AccordionRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event?.detailsType || !event.domEvent || !event.valueProperty || !event.valueType) {
    throw new Error(`Accordion specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event as AccordionRequiredEvent;
}

function getRequiredState(spec: SpecializedAdapterSpec, stateName: string): AccordionRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  if (
    !state?.controlledProp ||
    !state.defaultProp ||
    !state.initialAttribute ||
    !state.runtimeGetter ||
    !state.runtimeSetter ||
    state.controlledStateSync !== "unsupported"
  ) {
    throw new Error(`Accordion specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state as AccordionRequiredState;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Accordion specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getStateSetter(spec: SpecializedAdapterSpec, stateModel: string) {
  const setter = spec.setterSync.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter || !("stateModel" in setter)) {
    throw new Error(`Accordion specialized adapter spec requires ${stateModel} setter metadata.`);
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
    throw new Error(
      `Accordion specialized adapter spec requires ${name} metadata for ${partName}.`,
    );
  }

  return attribute.name;
}

function findTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  return spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
}

function getTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  const prop = findTargetProp(spec, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Accordion specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
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

function recordsArrayEqual(actual: unknown[], expected: unknown[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => recordsEqual(entry, expected[index]))
  );
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
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
