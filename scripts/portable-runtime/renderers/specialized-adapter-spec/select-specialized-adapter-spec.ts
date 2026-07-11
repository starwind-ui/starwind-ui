import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOptionCollectionOverlayFacts,
  AdapterOptionCollectionOverlayPartName,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import { createPrimitiveAttributeMap } from "../primitives/contract-helpers.js";
import { buildBaseSpecializedAdapterSpec } from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type SelectSpecializedAdapterSpec = SpecializedAdapterSpec & {
  select: {
    asChildTrigger: { merges: string[]; part: "trigger" };
    contextProjection: {
      filePath: "select/SelectContext";
      itemContext: "SelectItemContext";
      rootContext: "SelectContext";
      values: ["open", "value"];
    };
    floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>;
    hiddenInput: {
      part: "input";
      props: string[];
      type: "hidden";
    };
    itemContext: { part: "item"; valueProp: "value" };
    itemIndicator: {
      hiddenPart: "itemIndicator";
      selectedStateAttribute: "data-state";
    };
    runtimeBoundary: string[];
    scrollArrows: ["scrollUpArrow", "scrollDownArrow"];
  };
  sourcePrimitiveContract: RuntimeAdapterContract;
};

export function buildSelectSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): SelectSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "select") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Select specialized adapter spec.`,
    );
  }

  const openState = getStateModel(spec, "open");
  const valueState = getStateModel(spec, "value");
  const openEvent = getEvent(spec, "openChange");
  const valueEvent = getEvent(spec, "valueChange");
  const hiddenInput = spec.renderPlan.form?.hiddenInput;
  const floating = spec.renderPlan.floating;
  const asChildTrigger = spec.asChild.find((entry) => entry.part === "trigger");

  if (!hiddenInput || hiddenInput.part !== "input" || hiddenInput.type !== "hidden") {
    throw new Error("Select specialized adapter spec requires an input hidden-input recipe.");
  }
  if (!floating) {
    throw new Error("Select specialized adapter spec requires floating part metadata.");
  }
  if (!asChildTrigger) {
    throw new Error("Select specialized adapter spec requires trigger asChild merge metadata.");
  }

  assertPart(spec, "root");
  assertPart(spec, "trigger");
  assertPart(spec, "input");
  assertPart(spec, "portal");
  assertPart(spec, "positioner");
  assertPart(spec, "popup");
  assertPart(spec, "item");
  assertPart(spec, "itemIndicator");
  assertPart(spec, "scrollUpArrow");
  assertPart(spec, "scrollDownArrow");
  assertSetter(spec, openState.runtimeSetter ?? "setOpen");
  assertSetter(spec, valueState.runtimeSetter ?? "setValue");
  assertDetails(openEvent.detailsType, "SelectOpenChangeDetails");
  assertDetails(valueEvent.detailsType, "SelectValueChangeDetails");

  return {
    ...spec,
    select: {
      asChildTrigger: { merges: [...asChildTrigger.merges], part: "trigger" },
      contextProjection: {
        filePath: "select/SelectContext",
        itemContext: "SelectItemContext",
        rootContext: "SelectContext",
        values: ["open", "value"],
      },
      floating,
      hiddenInput: {
        part: hiddenInput.part,
        props: spec.renderPlan.form?.props ? [...spec.renderPlan.form.props] : [],
        type: hiddenInput.type,
      },
      itemContext: { part: "item", valueProp: "value" },
      itemIndicator: {
        hiddenPart: "itemIndicator",
        selectedStateAttribute: "data-state",
      },
      runtimeBoundary: [
        "collection registration",
        "item text extraction",
        "keyboard navigation",
        "typeahead",
        "value normalization",
        "hidden input sync",
        "form reset",
        "floating placement",
        "scroll arrow behavior",
        "dismissal",
        "cleanup",
      ],
      scrollArrows: ["scrollUpArrow", "scrollDownArrow"],
    },
    sourcePrimitiveContract: contract,
  };
}


const SELECT_OUTPUT_MODEL_PARTS = [
  "root",
  "label",
  "trigger",
  "value",
  "icon",
  "portal",
  "positioner",
  "popup",
  "list",
  "group",
  "groupLabel",
  "item",
  "itemText",
  "itemIndicator",
  "separator",
  "scrollUpArrow",
  "scrollDownArrow",
] as const satisfies readonly AdapterOptionCollectionOverlayPartName[];

const SELECT_INDEX_IMPORT_PART_ORDER = [
  "group",
  "groupLabel",
  "icon",
  "item",
  "itemIndicator",
  "itemText",
  "label",
  "list",
  "popup",
  "portal",
  "positioner",
  "root",
  "scrollDownArrow",
  "scrollUpArrow",
  "separator",
  "trigger",
  "value",
] as const satisfies readonly AdapterOptionCollectionOverlayPartName[];

const SELECT_NAMESPACE_PART_ORDER = [
  "root",
  "label",
  "trigger",
  "value",
  "icon",
  "portal",
  "positioner",
  "popup",
  "list",
  "group",
  "groupLabel",
  "item",
  "itemText",
  "itemIndicator",
  "separator",
  "scrollUpArrow",
  "scrollDownArrow",
] as const satisfies readonly AdapterOptionCollectionOverlayPartName[];

export function buildSelectAdapterOutputModel(spec: SelectSpecializedAdapterSpec): AdapterOutputModel {
  const facts = getSelectOptionCollectionOverlayFacts(spec);

  return {
    files: [
    ...SELECT_OUTPUT_MODEL_PARTS.map((partName) =>
      createSelectComponentFile(spec, partName, facts),
    ),
    createSelectIndexFile(spec, facts),
    ],
  };
}

function createSelectComponentFile(
  spec: SelectSpecializedAdapterSpec,
  partName: AdapterOptionCollectionOverlayPartName,
  facts: AdapterOptionCollectionOverlayFacts,
): AdapterComponentFile {
  const exportName = facts.exports[partName];
  const part = facts.parts[partName];

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
      family: { facts, kind: "option-collection-overlay", part: partName },
      imports: [],
      name: exportName,
      portals: [],
      props: [],
      refs: [],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${exportName}`,
  };
}

function createSelectIndexFile(
  spec: SelectSpecializedAdapterSpec,
  facts: AdapterOptionCollectionOverlayFacts,
): AdapterIndexFile {
  return {
    exports: {
      kind: "namespace",
      members: facts.index.importMembers,
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "option-collection-overlay" },
    imports: [],
    kind: "index",
    path: `${spec.component}/index.ts`,
    typeFacades: [],
  };
}

function getSelectOptionCollectionOverlayFacts(
  spec: SelectSpecializedAdapterSpec,
): AdapterOptionCollectionOverlayFacts {
  assertSelectSpecializedAdapterSpec(spec);

  const attrs = createSelectAttributeMap(spec);
  const openState = getStateModel(spec, "open");
  const valueState = getStateModel(spec, "value");
  const openEvent = getEvent(spec, "openChange");
  const valueEvent = getEvent(spec, "valueChange");
  const exportsByPart = Object.fromEntries(
    SELECT_OUTPUT_MODEL_PARTS.map((partName) => [partName, getSelectFileExportName(spec, partName)]),
  ) as Record<AdapterOptionCollectionOverlayPartName, string>;

  return {
    attrs: {
      align: attrs.align,
      alignItemWithTrigger: attrs.alignItemWithTrigger,
      alignOffset: attrs.alignOffset,
      autoComplete: attrs.autoComplete,
      avoidCollisions: attrs.avoidCollisions,
      defaultOpen: attrs.defaultOpen,
      defaultValue: attrs.defaultValue,
      disabled: attrs.disabled,
      form: attrs.form,
      group: getPartDiscoveryAttribute(spec, "group"),
      groupLabel: getPartDiscoveryAttribute(spec, "groupLabel"),
      highlightItemOnHover: attrs.highlightItemOnHover,
      icon: getPartDiscoveryAttribute(spec, "icon"),
      input: getPartDiscoveryAttribute(spec, "input"),
      item: getPartDiscoveryAttribute(spec, "item"),
      itemIndicator: getPartDiscoveryAttribute(spec, "itemIndicator"),
      itemText: getPartDiscoveryAttribute(spec, "itemText"),
      label: getPartDiscoveryAttribute(spec, "label"),
      list: getPartDiscoveryAttribute(spec, "list"),
      modal: attrs.modal,
      name: attrs.name,
      popup: getPartDiscoveryAttribute(spec, "popup"),
      portal: getPartDiscoveryAttribute(spec, "portal"),
      positioner: getPartDiscoveryAttribute(spec, "positioner"),
      readOnly: attrs.readOnly,
      required: attrs.required,
      root: getPartDiscoveryAttribute(spec, "root"),
      scrollDownArrow: getPartDiscoveryAttribute(spec, "scrollDownArrow"),
      scrollUpArrow: getPartDiscoveryAttribute(spec, "scrollUpArrow"),
      separator: getPartDiscoveryAttribute(spec, "separator"),
      side: attrs.side,
      sideOffset: attrs.sideOffset,
      trigger: getPartDiscoveryAttribute(spec, "trigger"),
      value: getPartDiscoveryAttribute(spec, "value"),
      valueData: attrs.valueData,
    },
    context: {
      fileExportMembers: [
        { from: `./${spec.select.contextProjection.rootContext}`, name: spec.select.contextProjection.rootContext },
        { from: `./${spec.select.contextProjection.rootContext}`, name: spec.select.contextProjection.itemContext },
        { from: `./${spec.select.contextProjection.rootContext}`, name: "useSelectContext" },
        { from: `./${spec.select.contextProjection.rootContext}`, name: "useSelectItemContext" },
      ],
      itemContext: spec.select.contextProjection.itemContext,
      itemContextValueType: `${spec.displayName}ItemContextValue`,
      rootContext: spec.select.contextProjection.rootContext,
      rootContextValueType: `${spec.displayName}ContextValue`,
      useItemContext: `use${spec.displayName}ItemContext`,
      useRootContext: `use${spec.displayName}Context`,
    },
    displayName: spec.displayName,
    events: {
      openChange: {
        callbackProp: getRequiredValue(openEvent.callbackProp, "open callback prop"),
        detailsType: getRequiredValue(openEvent.detailsType, "open details type"),
        name: openEvent.name,
        valueProperty: getRequiredValue(openEvent.valueProperty, "open value property"),
        valueType: openState.valueType,
      },
      valueChange: {
        callbackProp: getRequiredValue(valueEvent.callbackProp, "value callback prop"),
        detailsType: getRequiredValue(valueEvent.detailsType, "value details type"),
        name: valueEvent.name,
        valueProperty: getRequiredValue(valueEvent.valueProperty, "value value property"),
        valueType: valueState.valueType,
      },
    },
    exports: {
      ...exportsByPart,
      namespace: spec.displayName,
    },
    floating: {
      alignDefault: getDefaultValue(spec, "align"),
      alignItemWithTriggerDefault: getDefaultValue(spec, "alignItemWithTrigger"),
      alignOffsetDefault: getDefaultValue(spec, "alignOffset"),
      avoidCollisionsDefault: getDefaultValue(spec, "avoidCollisions"),
      sideDefault: getDefaultValue(spec, "side"),
      sideOffsetDefault: getDefaultValue(spec, "sideOffset"),
    },
    index: {
      importMembers: SELECT_INDEX_IMPORT_PART_ORDER.map((partName) => ({
        from: `./${exportsByPart[partName]}`,
        name: exportsByPart[partName],
      })),
      namespaceMembers: SELECT_NAMESPACE_PART_ORDER.map((partName) => ({
        key: getNamespaceKey(partName),
        name: exportsByPart[partName],
      })),
      typeExports: [
        getRequiredValue(openEvent.detailsType, "open details type"),
        getRequiredValue(valueEvent.detailsType, "value details type"),
      ],
    },
    parts: {
      group: getSelectAdapterPart(spec, "group"),
      groupLabel: getSelectAdapterPart(spec, "groupLabel"),
      icon: getSelectAdapterPart(spec, "icon"),
      input: getBasePart(spec, "input"),
      item: getSelectAdapterPart(spec, "item"),
      itemIndicator: getSelectAdapterPart(spec, "itemIndicator"),
      itemText: getSelectAdapterPart(spec, "itemText"),
      label: getSelectAdapterPart(spec, "label"),
      list: getSelectAdapterPart(spec, "list"),
      popup: getSelectAdapterPart(spec, "popup"),
      portal: getSelectAdapterPart(spec, "portal"),
      positioner: getSelectAdapterPart(spec, "positioner"),
      root: getSelectAdapterPart(spec, "root"),
      scrollDownArrow: getSelectAdapterPart(spec, "scrollDownArrow"),
      scrollUpArrow: getSelectAdapterPart(spec, "scrollUpArrow"),
      separator: getSelectAdapterPart(spec, "separator"),
      trigger: getSelectAdapterPart(spec, "trigger"),
      value: getSelectAdapterPart(spec, "value"),
    },
    props: {
      align: getAdapterFamilyProp(spec, "align"),
      alignItemWithTrigger: getAdapterFamilyProp(spec, "alignItemWithTrigger"),
      alignOffset: getAdapterFamilyProp(spec, "alignOffset"),
      asChild: getAdapterFamilyProp(spec, "asChild"),
      autoComplete: getAdapterFamilyProp(spec, "autoComplete"),
      avoidCollisions: getAdapterFamilyProp(spec, "avoidCollisions"),
      defaultOpen: getAdapterFamilyProp(spec, "defaultOpen"),
      defaultValue: getAdapterFamilyProp(spec, "defaultValue"),
      disabled: getAdapterFamilyProp(spec, "disabled"),
      form: getAdapterFamilyProp(spec, "form"),
      highlightItemOnHover: getAdapterFamilyProp(spec, "highlightItemOnHover"),
      modal: getAdapterFamilyProp(spec, "modal"),
      name: getAdapterFamilyProp(spec, "name"),
      open: getAdapterFamilyProp(spec, "open"),
      readOnly: getAdapterFamilyProp(spec, "readOnly"),
      required: getAdapterFamilyProp(spec, "required"),
      side: getAdapterFamilyProp(spec, "side"),
      sideOffset: getAdapterFamilyProp(spec, "sideOffset"),
      value: getAdapterFamilyProp(spec, "value"),
    },
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${spec.displayName}s`,
      typeImportSource: "@starwind-ui/runtime",
    },
    state: {
      open: {
        defaultValue: "false",
        getter: getRequiredValue(openState.runtimeGetter, "open getter"),
        setter: getRequiredValue(openState.runtimeSetter, "open setter"),
      },
      value: {
        getter: getRequiredValue(valueState.runtimeGetter, "value getter"),
        setter: getRequiredValue(valueState.runtimeSetter, "value setter"),
      },
    },
  };
}

export function createSelectAttributeMap(spec: SelectSpecializedAdapterSpec) {
  assertSelectSpecializedAdapterSpec(spec);

  return createPrimitiveAttributeMap(spec.sourcePrimitiveContract, {
    align: { part: "positioner", attribute: "data-align" },
    alignItemWithTrigger: {
      part: "positioner",
      attribute: "data-align-item-with-trigger",
    },
    alignOffset: { part: "positioner", attribute: "data-align-offset" },
    autoComplete: { part: "root", attribute: "data-autocomplete" },
    avoidCollisions: { part: "positioner", attribute: "data-avoid-collisions" },
    defaultOpen: { part: "root", attribute: "data-default-open" },
    defaultValue: { part: "root", attribute: "data-default-value" },
    disabled: { part: "root", attribute: "data-disabled" },
    form: { part: "root", attribute: "data-form" },
    highlightItemOnHover: { part: "root", attribute: "data-highlight-item-on-hover" },
    modal: { part: "root", attribute: "data-modal" },
    name: { part: "root", attribute: "data-name" },
    readOnly: { part: "root", attribute: "data-readonly" },
    required: { part: "root", attribute: "data-required" },
    side: { part: "positioner", attribute: "data-side" },
    sideOffset: { part: "positioner", attribute: "data-side-offset" },
    valueData: { part: "item", attribute: "data-value" },
  });
}

export function assertSelectSpecializedAdapterSpec(spec: SelectSpecializedAdapterSpec): void {
  if (spec.component !== "select") {
    throw new Error(`${spec.displayName} is not a Select specialized adapter spec.`);
  }

  if (spec.select.hiddenInput.part !== "input" || spec.select.hiddenInput.type !== "hidden") {
    throw new Error("Select specialized adapter spec hidden input must target the input part.");
  }

  assertRequiredValues(
    spec.select.hiddenInput.props,
    ["autoComplete", "form", "name", "required", "value"],
    "Select specialized adapter spec hidden input props",
  );
  assertRequiredValues(
    spec.select.floating.optionProps,
    ["side", "align", "sideOffset", "alignOffset", "avoidCollisions", "alignItemWithTrigger"],
    "Select specialized adapter spec floating option props",
  );
  assertRequiredValues(
    spec.select.asChildTrigger.merges,
    ["aria", "className", "data", "ref"],
    "Select specialized adapter spec trigger asChild merges",
  );

  if (
    spec.select.contextProjection.rootContext !== "SelectContext" ||
    spec.select.contextProjection.itemContext !== "SelectItemContext" ||
    spec.select.contextProjection.filePath !== "select/SelectContext"
  ) {
    throw new Error("Select specialized adapter spec context projection must match SelectContext.");
  }

  if (
    spec.select.itemContext.part !== "item" ||
    spec.select.itemContext.valueProp !== "value" ||
    spec.select.itemIndicator.hiddenPart !== "itemIndicator" ||
    spec.select.itemIndicator.selectedStateAttribute !== "data-state"
  ) {
    throw new Error(
      "Select specialized adapter spec item context and indicator facts are invalid.",
    );
  }

  if (
    spec.select.scrollArrows[0] !== "scrollUpArrow" ||
    spec.select.scrollArrows[1] !== "scrollDownArrow"
  ) {
    throw new Error("Select specialized adapter spec scroll arrows are invalid.");
  }
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!spec.parts.some((part) => part.name === partName)) {
    throw new Error(`Select specialized adapter spec is missing ${partName} part.`);
  }
}

function getAdapterFamilyProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = getProp(spec, propName);

  return {
    defaultValue: prop.defaultValue,
    name: prop.name,
    required: prop.required,
    type: prop.type,
  };
}

function getBasePart(spec: SpecializedAdapterSpec, partName: string) {
  const part = getPart(spec, partName);

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
  };
}

function getDefaultValue(spec: SpecializedAdapterSpec, propName: string): string {
  return getRequiredValue(getProp(spec, propName).defaultValue, `${propName} default value`);
}

function getNamespaceKey(partName: AdapterOptionCollectionOverlayPartName): string {
  return partName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Select specialized adapter spec is missing ${partName} part.`);
  }

  return part;
}

function getPartDiscoveryAttribute(spec: SpecializedAdapterSpec, partName: string): string {
  return getPart(spec, partName).discoveryAttribute;
}

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Select specialized adapter spec is missing ${propName} prop.`);
  }

  return prop;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Select specialized adapter spec is missing ${context}.`);
  }

  return value;
}

function getSelectAdapterPart(
  spec: SelectSpecializedAdapterSpec,
  partName: AdapterOptionCollectionOverlayPartName,
) {
  const part = getPart(spec, partName);

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
    namespaceKey: getNamespaceKey(partName),
    role: part.role,
  };
}

function getStateModel(spec: SpecializedAdapterSpec, name: string) {
  const state = spec.stateModels.find((candidate) => candidate.name === name);
  if (!state) {
    throw new Error(`Select specialized adapter spec is missing ${name} state model.`);
  }

  return state;
}

function getEvent(spec: SpecializedAdapterSpec, name: string) {
  const event = spec.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`Select specialized adapter spec is missing ${name} event.`);
  }

  return event;
}

function assertSetter(spec: SpecializedAdapterSpec, method: string): void {
  if (!spec.setterSync.some((setter) => setter.method === method)) {
    throw new Error(`Select specialized adapter spec is missing ${method} setter.`);
  }
}

function assertDetails(actual: string | undefined, expected: string): void {
  if (actual !== expected) {
    throw new Error(`Select specialized adapter spec expected ${expected} details.`);
  }
}

function assertRequiredValues(
  actual: readonly string[],
  required: readonly string[],
  label: string,
): void {
  const missing = required.filter((value) => !actual.includes(value));
  if (missing.length > 0) {
    throw new Error(`${label} must include ${required.join(", ")}.`);
  }
}


export function getSelectFixturePartExports(spec: SelectSpecializedAdapterSpec): Array<{
  alias: string;
  fileExportName: string;
}> {
  return [
    { alias: "Root", fileExportName: getSelectFileExportName(spec, "root") },
    { alias: "Trigger", fileExportName: getSelectFileExportName(spec, "trigger") },
    { alias: "Portal", fileExportName: getSelectFileExportName(spec, "portal") },
    { alias: "Popup", fileExportName: getSelectFileExportName(spec, "popup") },
    { alias: "Item", fileExportName: getSelectFileExportName(spec, "item") },
    {
      alias: "ItemIndicator",
      fileExportName: getSelectFileExportName(spec, "itemIndicator"),
    },
  ];
}

export function getSelectFileExportName(spec: SelectSpecializedAdapterSpec, part: string): string {
  const file = spec.files.find((candidate) => candidate.kind === "part" && candidate.part === part);
  if (!file || file.kind !== "part") {
    throw new Error(`Select specialized adapter fixture is missing ${part} file.`);
  }

  return file.exportName;
}
