import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterControlledValuePresenceComponentProjection,
  AdapterControlledValuePresenceFacts,
  AdapterControlledValuePresencePartName,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type TabsSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  tabs: {
    adapterKind: "controlled-value-presence";
    anatomy: TabsAnatomyRecipe[];
    context: TabsContextRecipe;
    namespace: TabsNamespaceRecipe;
    options: TabsOptionsRecipe;
    panelVisibility: TabsPanelVisibilityRecipe;
    presence: TabsPresenceRecipe;
    runtimeBoundary: string[];
    valueControl: TabsValueControlRecipe;
  };
};

type TabsAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type TabsContextRecipe = {
  consumers: string[];
  name: "tabs";
  providerPart: "root";
  provides: string[];
};

type TabsEventRecipe = {
  callbackProp: string;
  callbackTiming: "before-state-commit";
  cancelable: boolean;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: "valueChange";
  valueProperty: string;
  valueType: string;
};

type TabsNamespaceRecipe = {
  defaultExport: "Tabs";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Tabs";
  objectEntries: TabsNamespaceObjectEntry[];
};

type TabsNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type TabsOptionAttributeRecipe<Prop extends string, Type extends string> = {
  attribute: string;
  defaultValue: string;
  prop: Prop;
  targetPart?: string;
  type: Type;
};

type TabsOptionsRecipe = {
  activateOnFocus: TabsOptionAttributeRecipe<"activateOnFocus", "boolean"> & {
    targetPart: "list";
  };
  orientation: TabsOptionAttributeRecipe<"orientation", "TabsOrientation"> & {
    ariaAttribute: string;
  };
  loopFocus: TabsOptionAttributeRecipe<"loopFocus", "boolean"> & {
    targetPart: "list";
  };
  syncKey: {
    attribute: string;
    prop: "syncKey";
    type: "string";
  };
};

type TabsPanelVisibilityRecipe = {
  activeAttributes: {
    dataActive: string;
    dataState: string;
    hidden: string;
  };
  keepMounted: TabsOptionAttributeRecipe<"keepMounted", "boolean"> & {
    targetPart: "panel";
  };
  panelPart: "panel";
  runtimeBoundary: string;
  tabPart: "tab";
  valueAttribute: string;
};

type TabsPresenceRecipe = NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]>;

type TabsRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  callbackTiming: "before-state-commit";
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

type TabsRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledProp: string;
  defaultProp: string;
  initialAttribute: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type TabsValueControlRecipe = {
  event: TabsEventRecipe;
  runtimeBoundary: string[];
  setterSync: {
    method: string;
    options?: Record<string, unknown>;
    stateModel: "value";
    suppressesEmit: boolean;
  };
  state: {
    controlledProp: string;
    defaultProp: string;
    getter: string;
    initialAttribute: string;
    name: "value";
    setter: string;
    valueType: string;
  };
};

const TABS_ANATOMY_PARTS = ["root", "list", "tab", "panel", "indicator"] as const;
const TABS_NAMESPACE_OBJECT_PART_ORDER = ["root", "list", "tab", "panel", "indicator"] as const;
const TABS_NAMESPACE_NAMED_EXPORT_PART_ORDER = [
  "indicator",
  "list",
  "panel",
  "root",
  "tab",
] as const;
const TABS_REQUIRED_PARTS = TABS_ANATOMY_PARTS;
const TABS_CONTEXT_CONSUMERS = ["list", "tab", "panel", "indicator"] as const;
const TABS_VALUE_CONTROL_RUNTIME_BOUNDARY = [
  "Runtime owns value coordination, sync storage, and cancellation timing.",
  "Adapters only project value state, event forwarding, and setValue controlled resync.",
] as const;
const TABS_PANEL_VISIBILITY_RUNTIME_BOUNDARY =
  "Runtime owns panel hidden cleanup, linked ids, nested refresh, and keep-mounted visibility timing.";
const TABS_RUNTIME_BOUNDARY = [
  "roving focus",
  "linked tab and panel ids",
  "indicator measurement",
  "nested tabs refresh",
  "structural child refresh",
  "panel hidden cleanup",
  "syncKey storage and cross-root event wiring",
] as const;

export function buildTabsSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): TabsSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "tabs") {
    throw new Error(`${spec.displayName} cannot be rendered as the Tabs specialized adapter spec.`);
  }

  for (const part of TABS_REQUIRED_PARTS) {
    assertPart(spec, part);
  }

  if (!spec.renderPlan.presence) {
    throw new Error("Tabs specialized adapter spec requires presence metadata.");
  }

  return {
    ...spec,
    sourcePrimitiveContract: contract,
    tabs: {
      adapterKind: "controlled-value-presence",
      anatomy: buildAnatomyRecipes(spec),
      context: buildContextRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      options: buildOptionsRecipe(spec),
      panelVisibility: buildPanelVisibilityRecipe(spec),
      presence: buildPresenceRecipe(spec),
      runtimeBoundary: [...TABS_RUNTIME_BOUNDARY],
      valueControl: buildValueControlRecipe(spec),
    },
  };
}

export function validateTabsSpecializedAdapterSpec(spec: TabsSpecializedAdapterSpec): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "tabs") {
    errors.push("Tabs specialized adapter spec must target the tabs primitive.");
    return errors;
  }

  const tabs = isRecord(spec.tabs) ? spec.tabs : undefined;
  if (!tabs) {
    errors.push("Tabs specialized adapter spec is missing tabs metadata.");
    return errors;
  }

  if (tabs.adapterKind !== "controlled-value-presence") {
    errors.push('Tabs specialized adapter spec adapterKind must be "controlled-value-presence".');
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "context",
    "namespace",
    "options",
    "panelVisibility",
    "presence",
    "runtimeBoundary",
    "valueControl",
  ]);
  const behaviorFields = new Set([
    "idLinking",
    "indicatorMeasurement",
    "nestedRefresh",
    "rovingFocus",
  ]);

  for (const field of Object.keys(tabs)) {
    if (behaviorFields.has(field)) {
      errors.push(
        `Tabs specialized adapter spec must not declare tabs.${field}; keep Runtime-owned behavior in Runtime controllers.`,
      );
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(`Tabs specialized adapter spec must not declare unexpected field "${field}".`);
    }
  }

  for (const part of TABS_REQUIRED_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Tabs specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, tabs.anatomy));
  errors.push(...validateValueControl(spec, tabs.valueControl));
  errors.push(...validateOptions(spec, tabs.options));
  errors.push(...validatePanelVisibility(spec, tabs.panelVisibility));
  errors.push(...validateContext(spec, tabs.context));
  errors.push(...validatePresence(spec, tabs.presence));
  errors.push(...validateNamespace(spec, tabs.namespace));


  if (!arraysEqual(asArray(tabs.runtimeBoundary), TABS_RUNTIME_BOUNDARY)) {
    errors.push("Tabs specialized adapter spec runtimeBoundary must match Runtime-owned behavior.");
  }

  return errors;
}

export function buildTabsAdapterOutputModel(
  spec: TabsSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidTabsAdapterOutputModelSpec(spec);

  const facts = getTabsControlledValuePresenceFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createTabsComponentFile(spec, "root", facts),
    createTabsComponentFile(spec, "list", facts),
    createTabsComponentFile(spec, "tab", facts),
    createTabsComponentFile(spec, "panel", facts),
    createTabsComponentFile(spec, "indicator", facts),
    {
      exports: {
        kind: "namespace",
        members: facts.index.importMembers,
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "controlled-value-presence" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createTabsComponentFile(
  spec: TabsSpecializedAdapterSpec,
  partName: AdapterControlledValuePresencePartName,
  facts: AdapterControlledValuePresenceFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context:
        partName === spec.tabs.context.providerPart
          ? [
              {
                name: spec.tabs.context.name,
                role: "provider",
                value: { code: spec.tabs.context.provides.join(", ") },
              },
            ]
          : spec.tabs.context.consumers.some((consumer) => consumer === partName)
            ? [
                {
                  name: spec.tabs.context.name,
                  role: "consumer",
                  value: { code: spec.tabs.context.provides.join(", ") },
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
      family: { facts, kind: "controlled-value-presence", part: partName },
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
                facts.props.orientation,
                facts.props.syncKey,
                facts.props.value,
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getTabsComponentProps(partName, facts),
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

function getTabsComponentProps(
  partName: AdapterControlledValuePresenceComponentProjection["part"],
  facts: AdapterControlledValuePresenceFacts,
) {
  if (partName === "root") {
    return [
      facts.props.defaultValue,
      facts.props.orientation,
      facts.props.syncKey,
      facts.props.value,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "list") {
    return [facts.props.activateOnFocus, facts.props.loopFocus].map((prop) => ({
      kind: "unknown" as const,
      name: prop.name,
      type: prop.type,
    }));
  }

  if (partName === "tab") {
    return [facts.props.disabled, facts.props.tabValue].map((prop) => ({
      kind: "unknown" as const,
      name: prop.name,
      type: prop.type,
    }));
  }

  if (partName === "panel") {
    return [facts.props.keepMounted, facts.props.panelValue].map((prop) => ({
      kind: "unknown" as const,
      name: prop.name,
      type: prop.type,
    }));
  }

  return [];
}

function getTabsControlledValuePresenceFacts(
  spec: TabsSpecializedAdapterSpec,
): AdapterControlledValuePresenceFacts {
  const anatomy = {
    indicator: getTabsAnatomyPart(spec, "indicator"),
    list: getTabsAnatomyPart(spec, "list"),
    panel: getTabsAnatomyPart(spec, "panel"),
    root: getTabsAnatomyPart(spec, "root"),
    tab: getTabsAnatomyPart(spec, "tab"),
  };
  for (const partName of spec.tabs.namespace.memberParts) {
    getTabsSpecFileBasename(spec, partName);
  }

  const valueControl = spec.tabs.valueControl;
  const options = spec.tabs.options;
  const panelVisibility = spec.tabs.panelVisibility;
  const entriesByPart = new Map(spec.tabs.namespace.objectEntries.map((entry) => [entry.part, entry]));
  const props = {
    activateOnFocus: getAdapterFamilyProp(
      getTargetProp(spec, options.activateOnFocus.prop, options.activateOnFocus.targetPart),
    ),
    defaultValue: getAdapterFamilyProp(getProp(spec, valueControl.state.defaultProp)),
    disabled: getAdapterFamilyProp(getTargetProp(spec, "disabled", anatomy.tab.part)),
    keepMounted: getAdapterFamilyProp(
      getTargetProp(spec, panelVisibility.keepMounted.prop, panelVisibility.keepMounted.targetPart),
    ),
    loopFocus: getAdapterFamilyProp(
      getTargetProp(spec, options.loopFocus.prop, options.loopFocus.targetPart),
    ),
    orientation: getAdapterFamilyProp(getProp(spec, options.orientation.prop)),
    panelValue: getAdapterFamilyProp(getTargetProp(spec, "value", panelVisibility.panelPart)),
    syncKey: getAdapterFamilyProp(getProp(spec, options.syncKey.prop)),
    tabValue: getAdapterFamilyProp(getTargetProp(spec, "value", panelVisibility.tabPart)),
    value: getAdapterFamilyProp(
      getTargetProp(spec, valueControl.state.controlledProp, anatomy.root.part),
    ),
  };
  const contextComponentName = `${spec.tabs.namespace.namespace}Context`;

  return {
    attrs: {
      activateOnFocus: options.activateOnFocus.attribute,
      ariaOrientation: options.orientation.ariaAttribute,
      defaultValue: valueControl.state.initialAttribute,
      disabled: getStaticAttributeName(spec, anatomy.tab.part, "data-disabled"),
      indicator: anatomy.indicator.discoveryAttribute,
      indicatorOrientation: getStaticAttributeName(spec, anatomy.indicator.part, "data-orientation"),
      keepMounted: panelVisibility.keepMounted.attribute,
      list: anatomy.list.discoveryAttribute,
      listOrientation: getStaticAttributeName(spec, anatomy.list.part, "data-orientation"),
      loopFocus: options.loopFocus.attribute,
      orientation: options.orientation.attribute,
      panel: anatomy.panel.discoveryAttribute,
      panelActive: panelVisibility.activeAttributes.dataActive,
      panelHidden: panelVisibility.activeAttributes.hidden,
      panelOrientation: getStaticAttributeName(spec, anatomy.panel.part, "data-orientation"),
      panelState: panelVisibility.activeAttributes.dataState,
      panelValue: panelVisibility.valueAttribute,
      root: anatomy.root.discoveryAttribute,
      syncKey: options.syncKey.attribute,
      tab: anatomy.tab.discoveryAttribute,
      tabActive: getStaticAttributeName(spec, anatomy.tab.part, "data-active"),
      tabAriaSelected: getStaticAttributeName(spec, anatomy.tab.part, "aria-selected"),
      tabOrientation: getStaticAttributeName(spec, anatomy.tab.part, "data-orientation"),
      tabState: getStaticAttributeName(spec, anatomy.tab.part, "data-state"),
      tabValue: getStaticAttributeName(spec, anatomy.tab.part, "data-value"),
      value: getStaticAttributeName(spec, anatomy.root.part, "data-value"),
    },
    context: {
      componentName: contextComponentName,
      consumers: [...spec.tabs.context.consumers],
      hookName: `use${contextComponentName}`,
      name: spec.tabs.context.name,
      providerPart: spec.tabs.context.providerPart,
      typeName: `${contextComponentName}Value`,
      values: [props.orientation, props.value],
    },
    displayName: spec.displayName,
    events: {
      valueChange: valueControl.event,
    },
    exports: {
      indicator: getTabsSpecFileBasename(spec, "indicator"),
      list: getTabsSpecFileBasename(spec, "list"),
      namespace: spec.tabs.namespace.namespace,
      panel: getTabsSpecFileBasename(spec, "panel"),
      root: getTabsSpecFileBasename(spec, "root"),
      tab: getTabsSpecFileBasename(spec, "tab"),
    },
    index: {
      helperExports: [
        { from: `./${contextComponentName}`, name: contextComponentName },
        { from: `./${contextComponentName}`, name: `use${contextComponentName}` },
      ],
      importMembers: spec.tabs.namespace.namedExports
        .filter((exportName) => exportName !== spec.tabs.namespace.defaultExport)
        .map((exportName) => {
          const entry = spec.tabs.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Tabs specialized adapter spec output model requires ${exportName} namespace entry.`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.tabs.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [
        spec.tabs.options.orientation.type,
        spec.tabs.valueControl.state.valueType,
        spec.tabs.valueControl.event.detailsType,
      ],
    },
    parts: {
      indicator: {
        ...getControlledValuePresencePart(spec, anatomy.indicator.part),
        namespaceKey: getRequiredNamespaceKey(entriesByPart, anatomy.indicator.part),
        role: getRequiredValue(anatomy.indicator.role, "indicator role"),
      },
      list: {
        ...getControlledValuePresencePart(spec, anatomy.list.part),
        namespaceKey: getRequiredNamespaceKey(entriesByPart, anatomy.list.part),
        role: getRequiredValue(anatomy.list.role, "list role"),
      },
      panel: {
        ...getControlledValuePresencePart(spec, anatomy.panel.part),
        namespaceKey: getRequiredNamespaceKey(entriesByPart, anatomy.panel.part),
        role: getRequiredValue(anatomy.panel.role, "panel role"),
      },
      root: {
        ...getControlledValuePresencePart(spec, anatomy.root.part),
        namespaceKey: getRequiredNamespaceKey(entriesByPart, anatomy.root.part),
      },
      tab: {
        ...getControlledValuePresencePart(spec, anatomy.tab.part),
        namespaceKey: getRequiredNamespaceKey(entriesByPart, anatomy.tab.part),
        role: getRequiredValue(anatomy.tab.role, "tab role"),
      },
    },
    props,
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${spec.displayName}`,
      typeImportSource: "@starwind-ui/runtime",
    },
    serializer: {
      functionName: `serialize${spec.displayName}Value`,
    },
    setter: {
      method: valueControl.setterSync.method,
      options: getBooleanNumberStringOptions(valueControl.setterSync.options),
    },
    state: {
      getter: valueControl.state.getter,
      name: valueControl.state.name,
      type: valueControl.state.valueType,
    },
  };
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): TabsAnatomyRecipe[] {
  return TABS_ANATOMY_PARTS.map((partName) => {
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

function buildContextRecipe(spec: SpecializedAdapterSpec): TabsContextRecipe {
  const context = getContext(spec, "tabs", "provides");

  return {
    consumers: [...TABS_CONTEXT_CONSUMERS],
    name: "tabs",
    providerPart: "root",
    provides: [...context.values],
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): TabsNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = TABS_NAMESPACE_OBJECT_PART_ORDER.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Tabs specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Tabs",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "Tabs",
      ...TABS_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Tabs specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "Tabs",
    objectEntries,
  };
}

function buildOptionsRecipe(spec: SpecializedAdapterSpec): TabsOptionsRecipe {
  const activateOnFocus = getTargetProp(spec, "activateOnFocus", "list");
  const loopFocus = getTargetProp(spec, "loopFocus", "list");
  const orientation = getProp(spec, "orientation");
  const syncKey = getProp(spec, "syncKey");

  return {
    activateOnFocus: {
      attribute: getStaticAttributeName(spec, "list", "data-activate-on-focus"),
      defaultValue: getRequiredValue(activateOnFocus.defaultValue, "activateOnFocus defaultValue"),
      prop: "activateOnFocus",
      targetPart: "list",
      type: activateOnFocus.type as "boolean",
    },
    orientation: {
      ariaAttribute: getStaticAttributeName(spec, "list", "aria-orientation"),
      attribute: getStaticAttributeName(spec, "root", "data-orientation"),
      defaultValue: getRequiredValue(orientation.defaultValue, "orientation defaultValue"),
      prop: "orientation",
      type: orientation.type as "TabsOrientation",
    },
    loopFocus: {
      attribute: getStaticAttributeName(spec, "list", "data-loop-focus"),
      defaultValue: getRequiredValue(loopFocus.defaultValue, "loopFocus defaultValue"),
      prop: "loopFocus",
      targetPart: "list",
      type: loopFocus.type as "boolean",
    },
    syncKey: {
      attribute: getStaticAttributeName(spec, "root", "data-sync-key"),
      prop: "syncKey",
      type: syncKey.type as "string",
    },
  };
}

function buildPanelVisibilityRecipe(spec: SpecializedAdapterSpec): TabsPanelVisibilityRecipe {
  const keepMounted = getTargetProp(spec, "keepMounted", "panel");

  return {
    activeAttributes: {
      dataActive: getStaticAttributeName(spec, "panel", "data-active"),
      dataState: getStaticAttributeName(spec, "panel", "data-state"),
      hidden: getStaticAttributeName(spec, "panel", "hidden"),
    },
    keepMounted: {
      attribute: getStaticAttributeName(spec, "panel", "data-keep-mounted"),
      defaultValue: getRequiredValue(keepMounted.defaultValue, "keepMounted defaultValue"),
      prop: "keepMounted",
      targetPart: "panel",
      type: keepMounted.type as "boolean",
    },
    panelPart: "panel",
    runtimeBoundary: TABS_PANEL_VISIBILITY_RUNTIME_BOUNDARY,
    tabPart: "tab",
    valueAttribute: getStaticAttributeName(spec, "panel", "data-value"),
  };
}

function buildPresenceRecipe(spec: SpecializedAdapterSpec): TabsPresenceRecipe {
  return {
    keepMountedProp: getRequiredValue(
      spec.renderPlan.presence?.keepMountedProp,
      "presence keepMountedProp",
    ),
    initialHiddenParts: [
      ...getRequiredValue(spec.renderPlan.presence?.initialHiddenParts, "presence"),
    ],
    unmountPolicy: getRequiredValue(spec.renderPlan.presence?.unmountPolicy, "presence policy"),
  };
}

function buildValueControlRecipe(spec: SpecializedAdapterSpec): TabsValueControlRecipe {
  const valueState = getRequiredState(spec, "value");
  const valueEvent = getRequiredEvent(spec, "valueChange");
  const valueSetter = getStateSetter(spec, "value");

  return {
    event: {
      callbackProp: valueEvent.callbackProp,
      callbackTiming: valueEvent.callbackTiming,
      cancelable: valueEvent.cancelable === true,
      detailsType: valueEvent.detailsType,
      domEvent: valueEvent.domEvent,
      emitsFrom: valueEvent.emitsFrom,
      name: "valueChange",
      valueProperty: valueEvent.valueProperty,
      valueType: valueEvent.valueType,
    },
    runtimeBoundary: [...TABS_VALUE_CONTROL_RUNTIME_BOUNDARY],
    setterSync: {
      method: valueSetter.method,
      options: {
        ...getRequiredValue(valueSetter.options, "value setter sync options"),
      },
      stateModel: "value",
      suppressesEmit: valueSetter.suppressesEmit === true,
    },
    state: {
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
    return ["Tabs specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      TABS_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Tabs specialized adapter spec anatomy must match root, list, tab, panel, indicator.",
    );
  }

  for (const partName of TABS_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Tabs specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = getPart(spec, partName);
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(`Tabs specialized adapter spec ${partName} defaultElement must match contract.`);
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Tabs specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Tabs specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Tabs specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Tabs specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateContext(spec: SpecializedAdapterSpec, value: unknown): string[] {
  const context = spec.context.find(
    (candidate) => candidate.name === "tabs" && candidate.direction === "provides",
  );
  if (!context) {
    return ["Tabs specialized adapter spec requires tabs context metadata."];
  }
  if (!isRecord(value)) {
    return ["Tabs specialized adapter spec requires context metadata."];
  }

  return recordsEqual(value, buildContextRecipe(spec))
    ? []
    : ["Tabs specialized adapter spec context metadata must match tabs provider facts."];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tabs specialized adapter spec requires namespace metadata."];
  }

  const expected = buildNamespaceRecipe(spec);
  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Tabs specialized adapter spec namespace default export must be Tabs.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Tabs specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Tabs specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Tabs specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Tabs specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateOptions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tabs specialized adapter spec requires option metadata."];
  }

  return recordsEqual(value, buildOptionsRecipe(spec))
    ? []
    : [
        "Tabs specialized adapter spec option metadata must match orientation, focus policy, and sync key facts.",
      ];
}

function validatePanelVisibility(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tabs specialized adapter spec requires panelVisibility metadata."];
  }

  return recordsEqual(value, buildPanelVisibilityRecipe(spec))
    ? []
    : [
        "Tabs specialized adapter spec panelVisibility metadata must match panel visibility and keep-mounted contract facts.",
      ];
}

function validatePresence(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tabs specialized adapter spec requires presence metadata."];
  }

  return recordsEqual(value, buildPresenceRecipe(spec))
    ? []
    : [
        "Tabs specialized adapter spec presence metadata must match Runtime-owned visibility facts.",
      ];
}

function validateValueControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tabs specialized adapter spec requires valueControl metadata."];
  }

  const errors: string[] = [];
  const valueState = spec.stateModels.find((state) => state.name === "value");
  const valueEvent = spec.events.find((event) => event.name === "valueChange");
  const valueSetter = spec.setterSync.find(
    (setter) => "stateModel" in setter && setter.stateModel === "value",
  );
  if (!valueState) {
    errors.push("Tabs specialized adapter spec requires value state metadata.");
  }
  if (!valueEvent) {
    errors.push("Tabs specialized adapter spec requires valueChange event metadata.");
  }
  if (!valueSetter) {
    errors.push("Tabs specialized adapter spec requires value setter metadata.");
  }

  if (
    valueState &&
    valueEvent &&
    valueSetter &&
    !recordsEqual(value, buildValueControlRecipe(spec))
  ) {
    errors.push(
      "Tabs specialized adapter spec valueControl metadata must match contract state/event/setter facts.",
    );
  }

  return errors;
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Tabs specialized adapter spec requires ${partName} part.`);
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

function getContext(
  spec: SpecializedAdapterSpec,
  contextName: string,
  direction: "provides" | "consumes",
) {
  const context = spec.context.find(
    (candidate) => candidate.name === contextName && candidate.direction === direction,
  );
  if (!context) {
    throw new Error(`Tabs specialized adapter spec requires ${contextName} context metadata.`);
  }

  return context;
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Tabs specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getTabsAnatomyPart(spec: TabsSpecializedAdapterSpec, partName: string) {
  const part = spec.tabs.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(`Tabs specialized adapter spec output model requires ${partName} part.`);
  }

  return part;
}

function getTabsSpecFileBasename(spec: TabsSpecializedAdapterSpec, partName: string): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Tabs specialized adapter spec output model requires ${partName} file.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Tabs specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function getControlledValuePresencePart(
  spec: TabsSpecializedAdapterSpec,
  partName: string,
) {
  const part = getTabsAnatomyPart(spec, partName);

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.part,
  };
}

function getRequiredNamespaceKey(
  entriesByPart: Map<string, TabsNamespaceObjectEntry>,
  partName: string,
): string {
  const entry = entriesByPart.get(partName);
  if (!entry) {
    throw new Error(`Tabs specialized adapter spec output model requires ${partName} namespace.`);
  }

  return entry.property;
}

function getAdapterFamilyProp(prop: ReturnType<typeof getProp>) {
  return {
    defaultValue: prop.defaultValue,
    name: prop.name,
    required: prop.required,
    type: prop.type,
  };
}

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Tabs specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getRequiredEvent(spec: SpecializedAdapterSpec, eventName: string): TabsRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (
    event?.callbackTiming !== "before-state-commit" ||
    !event.detailsType ||
    !event.domEvent ||
    !event.valueProperty ||
    !event.valueType
  ) {
    throw new Error(`Tabs specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event as TabsRequiredEvent;
}

function getRequiredState(spec: SpecializedAdapterSpec, stateName: string): TabsRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  if (
    !state?.controlledProp ||
    !state.defaultProp ||
    !state.initialAttribute ||
    !state.runtimeGetter ||
    !state.runtimeSetter
  ) {
    throw new Error(`Tabs specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state as TabsRequiredState;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Tabs specialized adapter spec requires ${context}.`);
  }

  return value;
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

function getStateSetter(spec: SpecializedAdapterSpec, stateModel: string) {
  const setter = spec.setterSync.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter || !("stateModel" in setter)) {
    throw new Error(`Tabs specialized adapter spec requires ${stateModel} setter metadata.`);
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
    throw new Error(`Tabs specialized adapter spec requires ${name} metadata for ${partName}.`);
  }

  return attribute.name;
}

function getTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  const prop = spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
  if (!prop) {
    throw new Error(
      `Tabs specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
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

function assertValidTabsAdapterOutputModelSpec(spec: TabsSpecializedAdapterSpec): void {
  const errors = validateTabsSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Tabs specialized adapter spec output model cannot build invalid Tabs spec:\n${errors.join("\n")}`,
    );
  }
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}
