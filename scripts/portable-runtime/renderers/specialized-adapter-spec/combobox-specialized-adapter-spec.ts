import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterEditableCollectionOverlayFacts,
  AdapterEditableCollectionOverlayPartName,
  AdapterIndexFile,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type ComboboxSpecializedAdapterSpec = SpecializedAdapterSpec & {
  combobox: {
    adapterKind: "floating-editable-collection";
    anatomy: ComboboxAnatomyRecipe[];
    clearAction: ComboboxClearActionRecipe;
    collection: ComboboxCollectionRecipe;
    controlledStates: ComboboxControlledStateRecipe[];
    editableInput: ComboboxEditableInputRecipe;
    floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>;
    formControl: ComboboxFormControlRecipe;
    namespace: ComboboxNamespaceRecipe;
    presence: NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]>;
    reusedSelectMetadata: ComboboxReusableSelectMetadataRecipe;
    runtimeBoundary: string[];
    stateControl: ComboboxStateControlRecipe;
  };
  sourcePrimitiveContract: RuntimeAdapterContract;
};

type ComboboxAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
};

type ComboboxClearActionRecipe = {
  asChild: {
    attribute: "data-as-child";
    merges: string[];
    part: "clear";
    prop: "asChild";
  };
  defaultElement: "button";
  part: "clear";
  runtimeBoundary: string[];
  typeAttribute: {
    attribute: "type";
    value: "button";
  };
};

type ComboboxCollectionRecipe = {
  empty: {
    hiddenAttribute: "hidden";
    part: "empty";
    runtimeProjection: "filtered-empty-state";
  };
  group: {
    part: "group";
    role: "group";
  };
  groupLabel: {
    part: "groupLabel";
  };
  item: {
    defaultElement: "div";
    disabled: {
      ariaAttribute: "aria-disabled";
      dataAttribute: "data-disabled";
      defaultValue: "false";
      prop: "disabled";
      type: "boolean";
    };
    initialProjection: {
      ariaSelected: "false";
      tabIndex: -1;
    };
    part: "item";
    role: "option";
    runtimeProjection: {
      activeDescendant: {
        attribute: "aria-activedescendant";
        targetPart: "input";
      };
      filtered: {
        attribute: "data-filtered";
      };
      highlighted: {
        attribute: "data-highlighted";
      };
      selected: {
        ariaAttribute: "aria-selected";
        dataAttribute: "data-selected";
        indicatorPart: "itemIndicator";
      };
    };
    value: {
      attribute: "data-value";
      prop: "value";
      required: true;
      type: "string";
    };
  };
  itemIndicator: {
    dataHiddenAttribute: "data-hidden";
    hiddenAttribute: "hidden";
    initialState: "unchecked";
    part: "itemIndicator";
    selectedStateAttribute: "data-state";
  };
  itemText: {
    discoveryAttribute: string;
    part: "itemText";
    textExtraction: "runtime-owned";
  };
  list: {
    part: "list";
  };
  runtimeBoundary: string[];
  separator: {
    ariaOrientation: "horizontal";
    part: "separator";
    role: "separator";
  };
};

type ComboboxControlledStateRecipe = {
  controlledProp: string;
  defaultProp: string;
  getter: string;
  name: string;
  setter: string;
  valueType: string;
};

type ComboboxEditableInputRecipe = {
  clearPart: "clear";
  inputGroupPart: "inputGroup";
  inputPart: "input";
  inputSemantics: {
    ariaAutocomplete: "list";
    ariaControlsAttribute: "aria-controls";
    ariaExpandedAttribute: "aria-expanded";
    autocomplete: "off";
    role: "combobox";
  };
  inputValueEvent: ComboboxEventRecipe;
  inputValueSetterSync: ComboboxSetterRecipe;
  inputValueState: ComboboxControlledStateRecipe;
  valuePreviewPart: "value";
};

type ComboboxFormControlRecipe = {
  hiddenInput: {
    constantAttributes: {
      ariaHidden: "true";
      tabIndex: "-1";
      type: "hidden";
    };
    contractProps: string[];
    fieldIntegration: true;
    part: "hiddenInput";
    publicExport: false;
    renderedAttributes: string[];
    renderedInsidePart: "root";
    type: "hidden";
    valueState: "value";
  };
  rootAttributes: {
    autoComplete: "data-autocomplete";
    form: "data-form";
    name: "data-name";
    required: "data-required";
  };
  runtimeBoundary: string[];
  setFormOptions: {
    method: "setFormOptions";
    props: string[];
    effectDependencies: string[];
    runtimeBoundary: "Runtime owns hidden input sync and form participation updates.";
  };
};

type ComboboxEventRecipe = {
  callbackProp: string;
  cancelable: boolean;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: string;
  valueProperty: string;
  valueType: string;
};

type ComboboxSetterRecipe = {
  method: string;
  options?: Record<string, unknown>;
  stateModel: string;
  suppressesEmit: boolean;
};

type ComboboxNamespaceRecipe = {
  defaultExport: "Combobox";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Combobox";
  objectEntries: ComboboxNamespaceObjectEntry[];
};

type ComboboxNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type ComboboxReusableSelectMetadataRecipe = {
  floating: {
    optionProps: string[];
    portalPart: "portal";
    popupPart: "popup";
    positionerPart: "positioner";
  };
  form: {
    fieldIntegration: true;
    hiddenInputPart: "hiddenInput";
    props: string[];
    type: "hidden";
  };
  itemContext: {
    part: "item";
    valueProp: "value";
  };
  itemIndicator: {
    hiddenPart: "itemIndicator";
    selectedStateAttribute: "data-state";
  };
  popupRole: "listbox";
};

type ComboboxStateControlRecipe = {
  events: ComboboxEventRecipe[];
  runtimeBoundary: string[];
  setterSync: ComboboxSetterRecipe[];
  states: ComboboxControlledStateRecipe[];
};

type ComboboxRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledProp: string;
  defaultProp: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type ComboboxRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

const COMBOBOX_ANATOMY_PARTS = [
  "root",
  "label",
  "inputGroup",
  "input",
  "trigger",
  "icon",
  "clear",
  "value",
  "hiddenInput",
  "portal",
  "positioner",
  "popup",
  "empty",
  "list",
  "group",
  "groupLabel",
  "item",
  "itemText",
  "itemIndicator",
  "separator",
] as const;
const COMBOBOX_NAMESPACE_OBJECT_PART_ORDER = [
  "root",
  "label",
  "inputGroup",
  "input",
  "trigger",
  "icon",
  "clear",
  "value",
  "portal",
  "positioner",
  "popup",
  "empty",
  "list",
  "group",
  "groupLabel",
  "item",
  "itemText",
  "itemIndicator",
  "separator",
] as const;
const COMBOBOX_NAMESPACE_NAMED_EXPORT_PART_ORDER = [
  "clear",
  "empty",
  "group",
  "groupLabel",
  "icon",
  "input",
  "inputGroup",
  "item",
  "itemIndicator",
  "itemText",
  "label",
  "list",
  "popup",
  "portal",
  "positioner",
  "root",
  "separator",
  "trigger",
  "value",
] as const;
const COMBOBOX_REQUIRED_PARTS = [
  "root",
  "inputGroup",
  "input",
  "trigger",
  "clear",
  "value",
  "hiddenInput",
  "portal",
  "positioner",
  "popup",
  "empty",
  "list",
  "item",
  "itemText",
  "itemIndicator",
] as const;
const COMBOBOX_CONTROLLED_STATE_ORDER = ["inputValue", "open", "value"] as const;
const COMBOBOX_STATE_EVENT_ORDER = ["inputValueChange", "openChange", "valueChange"] as const;
const COMBOBOX_STATE_SETTER_ORDER = ["setInputValue", "setOpen", "setValue"] as const;
const COMBOBOX_STATE_CONTROL_RUNTIME_BOUNDARY = [
  "Runtime owns client-side filtering; adapters only suppress filtering during controlled inputValue resync.",
  "Runtime owns item resolution; adapters only project state, events, and setter sync facts.",
] as const;
const COMBOBOX_COLLECTION_RUNTIME_BOUNDARY = [
  "collection registration",
  "item text extraction",
  "client-side filtering",
  "selected item projection",
  "highlighted item projection",
  "active descendant projection",
  "filtered item projection",
] as const;
const COMBOBOX_FORM_CONTROL_RUNTIME_BOUNDARY = [
  "hidden input sync",
  "form reset",
  "field integration",
] as const;
const COMBOBOX_CLEAR_ACTION_RUNTIME_BOUNDARY = [
  "clear action behavior",
  "value reset",
  "inputValue reset",
  "filter reset",
] as const;
const COMBOBOX_RUNTIME_BOUNDARY = [
  "editable input control",
  "client-side filtering",
  "clear action behavior",
  "collection registration",
  "item text extraction",
  "highlighted item and active descendant state",
  "keyboard navigation",
  "typeahead",
  "value normalization",
  "hidden input sync",
  "form reset",
  "floating placement and updates",
  "dismissal",
  "cleanup",
] as const;

export function buildComboboxSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): ComboboxSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "combobox") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Combobox specialized adapter spec.`,
    );
  }

  for (const part of COMBOBOX_REQUIRED_PARTS) {
    assertPart(spec, part);
  }

  if (!spec.renderPlan.floating) {
    throw new Error("Combobox specialized adapter spec requires floating metadata.");
  }
  if (!spec.renderPlan.form?.hiddenInput) {
    throw new Error("Combobox specialized adapter spec requires hidden input form metadata.");
  }
  if (!spec.renderPlan.presence) {
    throw new Error("Combobox specialized adapter spec requires presence metadata.");
  }

  return {
    ...spec,
    combobox: {
      adapterKind: "floating-editable-collection",
      anatomy: buildAnatomyRecipes(spec),
      clearAction: buildClearActionRecipe(spec),
      collection: buildCollectionRecipe(spec),
      controlledStates: buildControlledStateRecipes(spec),
      editableInput: buildEditableInputRecipe(spec),
      floating: buildFloatingRecipe(spec),
      formControl: buildFormControlRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      presence: buildPresenceRecipe(spec),
      reusedSelectMetadata: buildReusableSelectMetadataRecipe(spec),
      runtimeBoundary: [...COMBOBOX_RUNTIME_BOUNDARY],
      stateControl: buildStateControlRecipe(spec),
    },
    sourcePrimitiveContract: contract,
  };
}

const COMBOBOX_OUTPUT_MODEL_PARTS = [
  "clear",
  "empty",
  "group",
  "groupLabel",
  "icon",
  "input",
  "inputGroup",
  "item",
  "itemIndicator",
  "itemText",
  "label",
  "list",
  "popup",
  "portal",
  "positioner",
  "root",
  "separator",
  "trigger",
  "value",
] as const satisfies readonly AdapterEditableCollectionOverlayPartName[];

export function buildComboboxAdapterOutputModel(
  spec: ComboboxSpecializedAdapterSpec,
): AdapterOutputModel {
  const facts = getComboboxEditableCollectionOverlayFacts(spec);
  const files: AdapterOutputModel["files"] = [
    ...COMBOBOX_OUTPUT_MODEL_PARTS.map((partName) =>
      createComboboxComponentFile(spec, partName, facts),
    ),
    createComboboxIndexFile(spec, facts),
  ];

  return { files };
}

function createComboboxComponentFile(
  spec: ComboboxSpecializedAdapterSpec,
  partName: AdapterEditableCollectionOverlayPartName,
  facts: AdapterEditableCollectionOverlayFacts,
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
      family: { facts, kind: "editable-collection-overlay", part: partName },
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

function createComboboxIndexFile(
  spec: ComboboxSpecializedAdapterSpec,
  facts: AdapterEditableCollectionOverlayFacts,
): AdapterIndexFile {
  return {
    exports: {
      kind: "namespace",
      members: facts.index.importMembers,
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "editable-collection-overlay" },
    imports: [],
    kind: "index",
    path: `${spec.component}/index.ts`,
    typeFacades: [],
  };
}

function getComboboxEditableCollectionOverlayFacts(
  spec: ComboboxSpecializedAdapterSpec,
): AdapterEditableCollectionOverlayFacts {
  const errors = validateComboboxSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Combobox output model cannot print invalid Combobox spec:\n${errors.join("\n")}`,
    );
  }

  const inputValueStateModel = getStateModel(spec, "inputValue");
  const openStateModel = getStateModel(spec, "open");
  const valueStateModel = getStateModel(spec, "value");
  const namespace = spec.combobox.namespace;
  const exportsByPart = Object.fromEntries(
    COMBOBOX_OUTPUT_MODEL_PARTS.map((partName) => [
      partName,
      getComboboxFileExportName(spec, partName),
    ]),
  ) as Record<AdapterEditableCollectionOverlayPartName, string>;

  return {
    attrs: {
      align: getFloatingAttribute(spec, "align", "data-align"),
      alignOffset: getFloatingAttribute(spec, "alignOffset", "data-align-offset"),
      autoComplete: spec.combobox.formControl.rootAttributes.autoComplete,
      avoidCollisions: getFloatingAttribute(spec, "avoidCollisions", "data-avoid-collisions"),
      clear: getPartRecipe(spec, "clear").discoveryAttribute,
      defaultInputValue: getRequiredInitialAttribute(inputValueStateModel, "inputValue"),
      defaultOpen: getRequiredInitialAttribute(openStateModel, "open"),
      defaultValue: getRequiredInitialAttribute(valueStateModel, "value"),
      disabled: getStaticAttribute(
        spec,
        "root",
        spec.combobox.collection.item.disabled.dataAttribute,
      ),
      empty: getPartRecipe(spec, "empty").discoveryAttribute,
      filterMode: getStaticAttribute(spec, "root", "data-filter-mode"),
      form: spec.combobox.formControl.rootAttributes.form,
      group: getPartRecipe(spec, "group").discoveryAttribute,
      groupLabel: getPartRecipe(spec, "groupLabel").discoveryAttribute,
      hiddenInput: getPartRecipe(spec, "hiddenInput").discoveryAttribute,
      highlightItemOnHover: getStaticAttribute(spec, "root", "data-highlight-item-on-hover"),
      icon: getPartRecipe(spec, "icon").discoveryAttribute,
      input: getPartRecipe(spec, "input").discoveryAttribute,
      inputGroup: getPartRecipe(spec, "inputGroup").discoveryAttribute,
      inputValue: getStaticAttribute(spec, "root", "data-input-value"),
      item: getPartRecipe(spec, "item").discoveryAttribute,
      itemIndicator: getPartRecipe(spec, "itemIndicator").discoveryAttribute,
      itemText: getPartRecipe(spec, "itemText").discoveryAttribute,
      label: getPartRecipe(spec, "label").discoveryAttribute,
      list: getPartRecipe(spec, "list").discoveryAttribute,
      locale: getStaticAttribute(spec, "root", "data-locale"),
      modal: getStaticAttribute(spec, "root", "data-modal"),
      name: spec.combobox.formControl.rootAttributes.name,
      popup: getPartRecipe(spec, "popup").discoveryAttribute,
      portal: getPartRecipe(spec, "portal").discoveryAttribute,
      positioner: getPartRecipe(spec, "positioner").discoveryAttribute,
      readOnly: getStaticAttribute(spec, "root", "data-readonly"),
      required: spec.combobox.formControl.rootAttributes.required,
      root: getPartRecipe(spec, "root").discoveryAttribute,
      separator: getPartRecipe(spec, "separator").discoveryAttribute,
      side: getFloatingAttribute(spec, "side", "data-side"),
      sideOffset: getFloatingAttribute(spec, "sideOffset", "data-side-offset"),
      trigger: getPartRecipe(spec, "trigger").discoveryAttribute,
      value: getPartRecipe(spec, "value").discoveryAttribute,
      valueData: spec.combobox.collection.item.value.attribute,
    },
    clearAction: {
      typeAttribute: spec.combobox.clearAction.typeAttribute,
    },
    collection: {
      empty: {
        hiddenAttribute: spec.combobox.collection.empty.hiddenAttribute,
      },
      group: {
        role: spec.combobox.collection.group.role,
      },
      item: {
        disabled: {
          ariaAttribute: spec.combobox.collection.item.disabled.ariaAttribute,
          dataAttribute: spec.combobox.collection.item.disabled.dataAttribute,
        },
        initialProjection: spec.combobox.collection.item.initialProjection,
        role: spec.combobox.collection.item.role,
      },
      itemIndicator: spec.combobox.collection.itemIndicator,
      separator: spec.combobox.collection.separator,
    },
    context: {
      fileExportMembers: [
        { from: "./ComboboxContext", name: "ComboboxContext" },
        { from: "./ComboboxContext", name: "ComboboxItemContext" },
        { from: "./ComboboxContext", name: "useComboboxContext" },
        { from: "./ComboboxContext", name: "useComboboxItemContext" },
      ],
      itemContext: "ComboboxItemContext",
      itemContextValueType: `${spec.displayName}ItemContextValue`,
      rootContext: "ComboboxContext",
      rootContextValueType: `${spec.displayName}ContextValue`,
      useItemContext: `use${spec.displayName}ItemContext`,
      useRootContext: `use${spec.displayName}Context`,
    },
    displayName: spec.displayName,
    events: {
      inputValueChange: getEditableCollectionEvent(spec, "inputValueChange"),
      openChange: getEditableCollectionEvent(spec, "openChange"),
      valueChange: getEditableCollectionEvent(spec, "valueChange"),
    },
    exports: {
      ...exportsByPart,
      namespace: namespace.namespace,
    },
    floating: {
      alignDefault: getDefaultValue(spec, "align"),
      alignOffsetDefault: getDefaultValue(spec, "alignOffset"),
      avoidCollisionsDefault: getDefaultValue(spec, "avoidCollisions"),
      sideDefault: getDefaultValue(spec, "side"),
      sideOffsetDefault: "6",
    },
    formSetter: {
      dependencies: [...spec.combobox.formControl.setFormOptions.effectDependencies],
      method: spec.combobox.formControl.setFormOptions.method,
      props: [...spec.combobox.formControl.setFormOptions.props],
    },
    hiddenInput: {
      constantAttributes: spec.combobox.formControl.hiddenInput.constantAttributes,
    },
    index: {
      importMembers: namespace.namedExports
        .filter((exportName) => exportName !== namespace.defaultExport)
        .map((exportName) => {
          const entry = namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(`Combobox output model requires ${exportName} namespace entry.`);
          }

          return {
            from: `./${getComboboxFileExportName(spec, entry.part)}`,
            name: entry.exportName,
          };
        }),
      namespaceMembers: namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExportSource: "@starwind-ui/runtime",
      typeExports: [
        spec.combobox.stateControl.events.find((event) => event.name === "inputValueChange")
          ?.detailsType,
        spec.combobox.stateControl.events.find((event) => event.name === "openChange")?.detailsType,
        spec.combobox.stateControl.events.find((event) => event.name === "valueChange")
          ?.detailsType,
      ].map((typeName) => {
        if (!typeName) {
          throw new Error("Combobox output model requires event detail type exports.");
        }

        return typeName;
      }),
    },
    inputSemantics: spec.combobox.editableInput.inputSemantics,
    parts: Object.fromEntries(
      COMBOBOX_OUTPUT_MODEL_PARTS.map((partName) => [
        partName,
        getEditableCollectionPart(spec, partName),
      ]),
    ) as AdapterEditableCollectionOverlayFacts["parts"],
    popupRole: spec.combobox.reusedSelectMetadata.popupRole,
    props: {
      align: getAdapterFamilyProp(spec, "align"),
      alignOffset: getAdapterFamilyProp(spec, "alignOffset"),
      asChild: getAdapterFamilyProp(spec, "asChild"),
      autoComplete: getAdapterFamilyProp(spec, "autoComplete"),
      avoidCollisions: getAdapterFamilyProp(spec, "avoidCollisions"),
      defaultInputValue: getAdapterFamilyProp(spec, "defaultInputValue"),
      defaultOpen: getAdapterFamilyProp(spec, "defaultOpen"),
      defaultValue: getAdapterFamilyProp(spec, "defaultValue"),
      disabled: getAdapterFamilyProp(spec, "disabled"),
      filterMode: getAdapterFamilyProp(spec, "filterMode"),
      form: getAdapterFamilyProp(spec, "form"),
      highlightItemOnHover: getAdapterFamilyProp(spec, "highlightItemOnHover"),
      inputDefaultValue: {
        name: "defaultValue",
        type: "string",
      },
      inputValue: getAdapterFamilyProp(spec, "inputValue"),
      itemDisabled: {
        defaultValue: spec.combobox.collection.item.disabled.defaultValue,
        name: spec.combobox.collection.item.disabled.prop,
        type: spec.combobox.collection.item.disabled.type,
      },
      itemValue: {
        name: spec.combobox.collection.item.value.prop,
        required: spec.combobox.collection.item.value.required,
        type: spec.combobox.collection.item.value.type,
      },
      locale: getAdapterFamilyProp(spec, "locale"),
      modal: getAdapterFamilyProp(spec, "modal"),
      name: getAdapterFamilyProp(spec, "name"),
      open: getAdapterFamilyProp(spec, "open"),
      placeholder: { name: "placeholder", type: "string" },
      readOnly: getAdapterFamilyProp(spec, "readOnly"),
      required: getAdapterFamilyProp(spec, "required"),
      side: getAdapterFamilyProp(spec, "side"),
      sideOffset: getAdapterFamilyProp(spec, "sideOffset"),
      value: getAdapterFamilyProp(spec, "value"),
    },
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: "setupComboboxes",
    },
    setters: {
      disabled: getEditableCollectionPropSetter(spec, "disabled"),
      inputValue: getEditableCollectionSetter(spec, "inputValue"),
      open: getEditableCollectionSetter(spec, "open"),
      value: getEditableCollectionSetter(spec, "value"),
    },
    states: {
      inputValue: getEditableCollectionState(spec, "inputValue"),
      open: getEditableCollectionState(spec, "open"),
      value: getEditableCollectionState(spec, "value"),
    },
  };
}

export function validateComboboxSpecializedAdapterSpec(
  spec: ComboboxSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "combobox") {
    errors.push("Combobox specialized adapter spec must target the combobox primitive.");
    return errors;
  }

  const combobox = isRecord(spec.combobox) ? spec.combobox : undefined;
  if (!combobox) {
    errors.push(
      "Combobox specialized adapter spec is missing floating editable collection metadata.",
    );
    return errors;
  }

  if (combobox.adapterKind !== "floating-editable-collection") {
    errors.push(
      'Combobox specialized adapter spec adapterKind must be "floating-editable-collection".',
    );
  }

  for (const part of COMBOBOX_REQUIRED_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Combobox specialized adapter spec requires ${part} part.`);
    }
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "clearAction",
    "collection",
    "controlledStates",
    "editableInput",
    "floating",
    "formControl",
    "namespace",
    "presence",
    "reusedSelectMetadata",
    "runtimeBoundary",
    "stateControl",
  ]);
  for (const field of Object.keys(combobox)) {
    if (!expectedFields.has(field)) {
      errors.push(
        `Combobox specialized adapter spec must not declare unexpected field "${field}".`,
      );
    }
  }

  errors.push(...validateAnatomy(spec, combobox.anatomy));
  errors.push(...validateClearAction(spec, combobox.clearAction));
  errors.push(...validateCollection(spec, combobox.collection));
  errors.push(...validateControlledStates(spec, combobox.controlledStates));
  errors.push(...validateEditableInput(spec, combobox.editableInput));
  errors.push(...validateFloating(spec, combobox.floating));
  errors.push(...validateFormControl(spec, combobox.formControl));
  errors.push(...validateNamespace(spec, combobox.namespace));
  errors.push(...validatePresence(spec, combobox.presence));
  errors.push(...validateReusableSelectMetadata(spec, combobox.reusedSelectMetadata));
  errors.push(...validateStateControl(spec, combobox.stateControl));

  if (!arraysEqual(asArray(combobox.runtimeBoundary), COMBOBOX_RUNTIME_BOUNDARY)) {
    errors.push(
      "Combobox specialized adapter spec runtimeBoundary must match Runtime-owned behavior.",
    );
  }

  return errors;
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): ComboboxAnatomyRecipe[] {
  return COMBOBOX_ANATOMY_PARTS.map((partName) => {
    const part = getPartRecipe(spec, partName);

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      initialAttributes: spec.renderPlan.staticAttributes
        .filter((attribute) => attribute.part === partName)
        .map((attribute) => attribute.name),
      part: part.name,
      publicRef: hasPublicRef(spec, partName),
    };
  });
}

function buildClearActionRecipe(spec: SpecializedAdapterSpec): ComboboxClearActionRecipe {
  const part = getPartRecipe(spec, "clear");
  const asChild = getAsChildRecipe(spec, "clear");
  assertStaticAttributeValue(spec, "clear", "type", "button");

  if (part.defaultElement !== "button") {
    throw new Error("Combobox specialized adapter spec clear action must default to button.");
  }

  return {
    asChild: {
      attribute: "data-as-child",
      merges: [...asChild.merges],
      part: "clear",
      prop: "asChild",
    },
    defaultElement: "button",
    part: "clear",
    runtimeBoundary: [...COMBOBOX_CLEAR_ACTION_RUNTIME_BOUNDARY],
    typeAttribute: {
      attribute: "type",
      value: "button",
    },
  };
}

function buildCollectionRecipe(spec: SpecializedAdapterSpec): ComboboxCollectionRecipe {
  const item = getPartRecipe(spec, "item");
  const itemText = getPartRecipe(spec, "itemText");
  assertStaticAttribute(spec, "empty", "hidden");
  assertStaticAttribute(spec, "item", "data-value");
  assertStaticAttribute(spec, "item", "aria-selected");
  assertStaticAttribute(spec, "item", "aria-disabled");
  assertStaticAttribute(spec, "item", "data-disabled");
  assertStaticAttribute(spec, "itemIndicator", "data-state");
  assertStaticAttribute(spec, "itemIndicator", "data-hidden");
  assertStaticAttribute(spec, "itemIndicator", "hidden");
  assertStaticAttributeValue(spec, "separator", "aria-orientation", "horizontal");
  if (item.defaultElement !== "div") {
    throw new Error("Combobox specialized adapter spec item must default to div.");
  }

  return {
    empty: {
      hiddenAttribute: "hidden",
      part: "empty",
      runtimeProjection: "filtered-empty-state",
    },
    group: {
      part: "group",
      role: getPartRole(spec, "group", "group"),
    },
    groupLabel: {
      part: "groupLabel",
    },
    item: {
      defaultElement: "div",
      disabled: {
        ariaAttribute: "aria-disabled",
        dataAttribute: "data-disabled",
        defaultValue: "false",
        prop: "disabled",
        type: "boolean",
      },
      initialProjection: {
        ariaSelected: "false",
        tabIndex: -1,
      },
      part: "item",
      role: getPartRole(spec, "item", "option"),
      runtimeProjection: {
        activeDescendant: {
          attribute: "aria-activedescendant",
          targetPart: "input",
        },
        filtered: {
          attribute: "data-filtered",
        },
        highlighted: {
          attribute: "data-highlighted",
        },
        selected: {
          ariaAttribute: "aria-selected",
          dataAttribute: "data-selected",
          indicatorPart: "itemIndicator",
        },
      },
      value: {
        attribute: "data-value",
        prop: "value",
        required: true,
        type: "string",
      },
    },
    itemIndicator: {
      dataHiddenAttribute: "data-hidden",
      hiddenAttribute: "hidden",
      initialState: "unchecked",
      part: "itemIndicator",
      selectedStateAttribute: "data-state",
    },
    itemText: {
      discoveryAttribute: itemText.discoveryAttribute,
      part: "itemText",
      textExtraction: "runtime-owned",
    },
    list: {
      part: "list",
    },
    runtimeBoundary: [...COMBOBOX_COLLECTION_RUNTIME_BOUNDARY],
    separator: {
      ariaOrientation: "horizontal",
      part: "separator",
      role: getPartRole(spec, "separator", "separator"),
    },
  };
}

function buildControlledStateRecipes(
  spec: SpecializedAdapterSpec,
): ComboboxControlledStateRecipe[] {
  return COMBOBOX_CONTROLLED_STATE_ORDER.map((stateName) => {
    const state = getStateModel(spec, stateName);
    return {
      controlledProp: state.controlledProp,
      defaultProp: state.defaultProp,
      getter: state.runtimeGetter,
      name: state.name,
      setter: state.runtimeSetter,
      valueType: state.valueType,
    };
  });
}

function buildEditableInputRecipe(spec: SpecializedAdapterSpec): ComboboxEditableInputRecipe {
  assertStaticAttributeValue(spec, "input", "aria-autocomplete", "list");
  assertStaticAttributeValue(spec, "input", "autocomplete", "off");
  assertStaticAttribute(spec, "input", "aria-controls");
  assertStaticAttribute(spec, "input", "aria-expanded");

  return {
    clearPart: "clear",
    inputGroupPart: "inputGroup",
    inputPart: "input",
    inputSemantics: {
      ariaAutocomplete: "list",
      ariaControlsAttribute: "aria-controls",
      ariaExpandedAttribute: "aria-expanded",
      autocomplete: "off",
      role: getPartRole(spec, "input", "combobox"),
    },
    inputValueEvent: buildEventRecipe(spec, "inputValueChange"),
    inputValueSetterSync: buildSetterRecipe(spec, "setInputValue"),
    inputValueState: buildControlledStateRecipes(spec)[0]!,
    valuePreviewPart: "value",
  };
}

function buildFloatingRecipe(
  spec: SpecializedAdapterSpec,
): NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]> {
  const floating = spec.renderPlan.floating;
  if (!floating) {
    throw new Error("Combobox specialized adapter spec requires floating metadata.");
  }

  return {
    ...floating,
    optionProps: [...floating.optionProps],
  };
}

function buildFormControlRecipe(spec: SpecializedAdapterSpec): ComboboxFormControlRecipe {
  const form = spec.renderPlan.form;
  if (
    !form?.hiddenInput ||
    form.hiddenInput.part !== "hiddenInput" ||
    form.hiddenInput.type !== "hidden"
  ) {
    throw new Error(
      "Combobox specialized adapter spec requires hiddenInput hidden-input metadata.",
    );
  }
  if (form.fieldIntegration !== true) {
    throw new Error("Combobox specialized adapter spec requires field integration metadata.");
  }
  for (const attribute of ["type", "form", "name", "value", "aria-hidden", "tabIndex"]) {
    assertStaticAttribute(spec, "hiddenInput", attribute);
  }
  assertStaticAttributeValue(spec, "hiddenInput", "type", "hidden");
  assertStaticAttributeValue(spec, "hiddenInput", "aria-hidden", "true");
  assertStaticAttributeValue(spec, "hiddenInput", "tabIndex", "-1");
  assertStaticAttribute(spec, "root", "data-autocomplete");
  assertStaticAttribute(spec, "root", "data-form");
  assertStaticAttribute(spec, "root", "data-name");
  assertStaticAttribute(spec, "root", "data-required");

  return {
    hiddenInput: {
      constantAttributes: {
        ariaHidden: "true",
        tabIndex: "-1",
        type: "hidden",
      },
      contractProps: [...form.props],
      fieldIntegration: true,
      part: "hiddenInput",
      publicExport: false,
      renderedAttributes: spec.renderPlan.staticAttributes
        .filter((attribute) => attribute.part === "hiddenInput")
        .map((attribute) => attribute.name),
      renderedInsidePart: "root",
      type: "hidden",
      valueState: "value",
    },
    rootAttributes: {
      autoComplete: "data-autocomplete",
      form: "data-form",
      name: "data-name",
      required: "data-required",
    },
    runtimeBoundary: [...COMBOBOX_FORM_CONTROL_RUNTIME_BOUNDARY],
    setFormOptions: {
      method: "setFormOptions",
      props: form.props.filter((prop) => prop !== "value"),
      effectDependencies: form.props.filter((prop) => prop !== "value"),
      runtimeBoundary: "Runtime owns hidden input sync and form participation updates.",
    },
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): ComboboxNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = COMBOBOX_NAMESPACE_OBJECT_PART_ORDER.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Combobox specialized adapter spec requires ${part} export metadata.`);
    }

    return {
      exportName: member.name,
      part,
      property: member.name.replace(/^Combobox/, ""),
    };
  });
  const namedExports = COMBOBOX_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Combobox specialized adapter spec requires ${part} export metadata.`);
    }

    return member.name;
  });

  return {
    defaultExport: "Combobox",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: [...COMBOBOX_NAMESPACE_OBJECT_PART_ORDER],
    namedExports: ["Combobox", ...namedExports],
    namespace: "Combobox",
    objectEntries,
  };
}

function buildPresenceRecipe(
  spec: SpecializedAdapterSpec,
): NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]> {
  const presence = spec.renderPlan.presence;
  if (!presence) {
    throw new Error("Combobox specialized adapter spec requires presence metadata.");
  }

  return {
    ...presence,
    initialHiddenParts: [...presence.initialHiddenParts],
  };
}

function buildReusableSelectMetadataRecipe(
  spec: SpecializedAdapterSpec,
): ComboboxReusableSelectMetadataRecipe {
  const floating = spec.renderPlan.floating;
  const form = spec.renderPlan.form;
  if (!floating) {
    throw new Error("Combobox specialized adapter spec requires floating metadata.");
  }
  if (
    !form?.hiddenInput ||
    form.hiddenInput.part !== "hiddenInput" ||
    form.hiddenInput.type !== "hidden"
  ) {
    throw new Error(
      "Combobox specialized adapter spec requires hiddenInput hidden-input metadata.",
    );
  }

  assertStaticAttribute(spec, "itemIndicator", "data-state");

  return {
    floating: {
      optionProps: [...floating.optionProps],
      portalPart: "portal",
      popupPart: "popup",
      positionerPart: "positioner",
    },
    form: {
      fieldIntegration: true,
      hiddenInputPart: "hiddenInput",
      props: [...(form.props ?? [])],
      type: "hidden",
    },
    itemContext: { part: "item", valueProp: "value" },
    itemIndicator: {
      hiddenPart: "itemIndicator",
      selectedStateAttribute: "data-state",
    },
    popupRole: getPartRole(spec, "popup", "listbox"),
  };
}

function buildStateControlRecipe(spec: SpecializedAdapterSpec): ComboboxStateControlRecipe {
  return {
    events: COMBOBOX_STATE_EVENT_ORDER.map((event) => buildEventRecipe(spec, event)),
    runtimeBoundary: [...COMBOBOX_STATE_CONTROL_RUNTIME_BOUNDARY],
    setterSync: COMBOBOX_STATE_SETTER_ORDER.map((setter) => buildSetterRecipe(spec, setter)),
    states: buildControlledStateRecipes(spec),
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Combobox specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  const missingParts = COMBOBOX_ANATOMY_PARTS.filter((part) => !hasPart(spec, part));
  for (const part of missingParts) {
    errors.push(`Combobox specialized adapter spec requires ${part} anatomy part.`);
  }
  if (missingParts.length > 0) {
    return errors;
  }

  const expected = buildAnatomyRecipes(spec);
  for (const expectedPart of expected) {
    const actualPart = value.find(
      (candidate) => isRecord(candidate) && candidate.part === expectedPart.part,
    );
    if (!recordsEqual(actualPart, expectedPart)) {
      errors.push(
        `Combobox specialized adapter spec anatomy for ${expectedPart.part} must match contract metadata.`,
      );
    }
  }

  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      expected.map((part) => part.part),
    )
  ) {
    errors.push("Combobox specialized adapter spec anatomy order must match contract order.");
  }

  return errors;
}

function validateClearAction(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires clear action metadata."];
  }

  let expected: ComboboxClearActionRecipe;
  try {
    expected = buildClearActionRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Combobox specialized adapter spec clearAction must match clear asChild and reset metadata.",
      ];
}

function validateCollection(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires collection metadata."];
  }

  let expected: ComboboxCollectionRecipe;
  try {
    expected = buildCollectionRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const errors: string[] = [];
  const itemText = isRecord(value.itemText) ? value.itemText : {};
  if ("extractText" in itemText) {
    errors.push(
      "Combobox specialized adapter spec collection itemText must keep item text extraction Runtime-owned.",
    );
  } else if (!recordsEqual(value.itemText, expected.itemText)) {
    errors.push(
      "Combobox specialized adapter spec collection itemText must match marker metadata.",
    );
  }

  for (const field of [
    "empty",
    "group",
    "groupLabel",
    "item",
    "itemIndicator",
    "list",
    "runtimeBoundary",
    "separator",
  ] as const) {
    if (!recordsEqual(value[field], expected[field])) {
      errors.push(
        `Combobox specialized adapter spec collection ${field} must match adapter facts and Runtime boundaries.`,
      );
    }
  }

  return errors;
}

function validateControlledStates(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Combobox specialized adapter spec requires controlled state metadata."];
  }

  let expected: ComboboxControlledStateRecipe[];
  try {
    expected = buildControlledStateRecipes(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Combobox specialized adapter spec controlledStates must match inputValue, open, and value state metadata.",
      ];
}

function validateEditableInput(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires editable input metadata."];
  }

  let expected: ComboboxEditableInputRecipe;
  try {
    expected = buildEditableInputRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  return recordsEqual(value, expected)
    ? []
    : ["Combobox specialized adapter spec editableInput must match Combobox-only input metadata."];
}

function validateFloating(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires floating metadata."];
  }

  let expected: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>;
  try {
    expected = buildFloatingRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Combobox specialized adapter spec floating metadata must reuse generic-adapter-plan floating vocabulary.",
      ];
}

function validateFormControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires form control metadata."];
  }

  let expected: ComboboxFormControlRecipe;
  try {
    expected = buildFormControlRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  return recordsEqual(value, expected)
    ? []
    : ["Combobox specialized adapter spec formControl must match hidden input and form metadata."];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires namespace metadata."];
  }

  let expected: ComboboxNamespaceRecipe;
  try {
    expected = buildNamespaceRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const errors: string[] = [];
  if (value.defaultNamespace !== true) {
    errors.push("Combobox specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Combobox specialized adapter spec namespace name must be Combobox.");
  }
  if (!recordsEqual(value.memberParts, expected.memberParts)) {
    errors.push(
      "Combobox specialized adapter spec namespace memberParts must match current package export order.",
    );
  }
  if (!recordsEqual(value.namedExports, expected.namedExports)) {
    errors.push(
      "Combobox specialized adapter spec namespace namedExports must match current package export order.",
    );
  }
  if (!recordsEqual(value.objectEntries, expected.objectEntries)) {
    errors.push(
      "Combobox specialized adapter spec namespace objectEntries must match current package export order.",
    );
  }

  return errors;
}

function validatePresence(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires presence metadata."];
  }

  let expected: NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]>;
  try {
    expected = buildPresenceRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Combobox specialized adapter spec presence metadata must reuse generic-adapter-plan presence vocabulary.",
      ];
}

function validateReusableSelectMetadata(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires reusable Select metadata."];
  }

  let expected: ComboboxReusableSelectMetadataRecipe;
  try {
    expected = buildReusableSelectMetadataRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Combobox specialized adapter spec reusedSelectMetadata must match shared Select-style metadata.",
      ];
}

function validateStateControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Combobox specialized adapter spec requires state control metadata."];
  }

  let expected: ComboboxStateControlRecipe;
  try {
    expected = buildStateControlRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const errors: string[] = [];
  if (!recordsEqual(value.states, expected.states)) {
    errors.push(
      "Combobox specialized adapter spec stateControl states must match inputValue, open, and value metadata.",
    );
  }
  if (!recordsEqual(value.events, expected.events)) {
    errors.push(
      "Combobox specialized adapter spec stateControl events must match inputValueChange, openChange, and valueChange metadata.",
    );
  }
  if (!recordsEqual(value.setterSync, expected.setterSync)) {
    errors.push(
      "Combobox specialized adapter spec stateControl setterSync must suppress controlled resync emissions without owning filtering or item resolution.",
    );
  }
  if (!arraysEqual(asArray(value.runtimeBoundary), COMBOBOX_STATE_CONTROL_RUNTIME_BOUNDARY)) {
    errors.push(
      "Combobox specialized adapter spec stateControl runtimeBoundary must keep filtering and item resolution Runtime-owned.",
    );
  }

  return errors;
}

function getComboboxFileExportName(spec: ComboboxSpecializedAdapterSpec, partName: string): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Combobox output model requires ${partName} part file metadata.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(`Combobox output model requires ${partName} file path ${expectedPath}.`);
  }

  return file.exportName;
}

function getEditableCollectionPart(
  spec: ComboboxSpecializedAdapterSpec,
  partName: AdapterEditableCollectionOverlayPartName,
): AdapterEditableCollectionOverlayFacts["parts"][AdapterEditableCollectionOverlayPartName] {
  const part = getPartRecipe(spec, partName);
  const namespaceEntry = spec.combobox.namespace.objectEntries.find(
    (entry) => entry.part === partName,
  );
  if (!namespaceEntry) {
    throw new Error(`Combobox output model requires ${partName} namespace metadata.`);
  }

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
    namespaceKey: namespaceEntry.property,
    ...(part.role ? { role: part.role } : {}),
  };
}

function getEditableCollectionState(
  spec: ComboboxSpecializedAdapterSpec,
  stateName: "inputValue" | "open" | "value",
): AdapterEditableCollectionOverlayFacts["states"][typeof stateName] {
  const state = spec.combobox.stateControl.states.find((candidate) => candidate.name === stateName);
  if (!state) {
    throw new Error(`Combobox output model requires ${stateName} state metadata.`);
  }

  return {
    getter: state.getter,
    name: state.name,
    setter: state.setter,
    valueType: state.valueType,
  };
}

function getEditableCollectionEvent(
  spec: ComboboxSpecializedAdapterSpec,
  eventName: "inputValueChange" | "openChange" | "valueChange",
): AdapterEditableCollectionOverlayFacts["events"][typeof eventName] {
  const event = spec.combobox.stateControl.events.find((candidate) => candidate.name === eventName);
  if (!event) {
    throw new Error(`Combobox output model requires ${eventName} event metadata.`);
  }

  return {
    callbackProp: event.callbackProp,
    detailsType: event.detailsType,
    name: event.name,
    valueProperty: event.valueProperty,
    valueType: event.valueType,
  };
}

function getEditableCollectionSetter(
  spec: ComboboxSpecializedAdapterSpec,
  stateName: "inputValue" | "open" | "value",
): AdapterEditableCollectionOverlayFacts["setters"][typeof stateName] {
  const setter = spec.combobox.stateControl.setterSync.find(
    (candidate) => candidate.stateModel === stateName,
  );
  if (!setter) {
    throw new Error(`Combobox output model requires ${stateName} setter metadata.`);
  }

  return {
    method: setter.method,
    ...(setter.options ? { options: coerceSetterOptions(setter.options) } : {}),
  };
}

function getEditableCollectionPropSetter(
  spec: ComboboxSpecializedAdapterSpec,
  propName: "disabled",
): AdapterEditableCollectionOverlayFacts["setters"][typeof propName] {
  const setter = spec.setterSync.find((candidate) => candidate.prop === propName);
  if (!setter) {
    throw new Error(`Combobox output model requires ${propName} setter metadata.`);
  }

  return {
    method: setter.method,
    ...(setter.options ? { options: coerceSetterOptions(setter.options) } : {}),
  };
}

function coerceSetterOptions(
  options: Record<string, unknown>,
): Record<string, boolean | number | string> {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => {
      if (typeof value !== "boolean" && typeof value !== "number" && typeof value !== "string") {
        throw new Error(`Combobox output model cannot print non-scalar setter option ${key}.`);
      }

      return [key, value];
    }),
  );
}

function getAdapterFamilyProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = getProp(spec, propName);

  return {
    ...(prop.defaultValue ? { defaultValue: prop.defaultValue } : {}),
    name: prop.name,
    ...(prop.required ? { required: prop.required } : {}),
    type: prop.type,
  };
}

function getDefaultValue(spec: SpecializedAdapterSpec, propName: string): string {
  const prop = getProp(spec, propName);
  if (prop.defaultValue === undefined) {
    throw new Error(`Combobox output model requires ${propName} default value.`);
  }

  return prop.defaultValue;
}

function getFloatingAttribute(
  spec: ComboboxSpecializedAdapterSpec,
  propName: string,
  attributeName: string,
): string {
  if (!spec.combobox.floating.optionProps.includes(propName)) {
    throw new Error(`Combobox output model requires ${propName} floating option metadata.`);
  }

  const positionerAttribute = getStaticAttribute(
    spec,
    spec.combobox.floating.positionerPart,
    attributeName,
  );
  getStaticAttribute(spec, spec.combobox.floating.popupPart, attributeName);

  return positionerAttribute;
}

function getRequiredInitialAttribute(state: ComboboxRequiredState, stateName: string): string {
  if (!state.initialAttribute) {
    throw new Error(`Combobox output model requires ${stateName} initial attribute.`);
  }

  return state.initialAttribute;
}

function getStaticAttribute(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (!attribute) {
    throw new Error(`Combobox output model requires ${partName} ${attributeName} metadata.`);
  }

  return attribute.name;
}

function getStateModel(spec: SpecializedAdapterSpec, name: string): ComboboxRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === name);
  if (!state) {
    throw new Error(`Combobox specialized adapter spec requires ${name} state metadata.`);
  }
  if (!state.controlledProp || !state.defaultProp || !state.runtimeGetter || !state.runtimeSetter) {
    throw new Error(`Combobox specialized adapter spec requires complete ${name} state metadata.`);
  }

  return state as ComboboxRequiredState;
}

function buildEventRecipe(spec: SpecializedAdapterSpec, name: string): ComboboxEventRecipe {
  const event = getEvent(spec, name);
  return {
    callbackProp: event.callbackProp,
    cancelable: event.cancelable === true,
    detailsType: event.detailsType,
    domEvent: event.domEvent,
    emitsFrom: event.emitsFrom,
    name: event.name,
    valueProperty: event.valueProperty,
    valueType: event.valueType,
  };
}

function buildSetterRecipe(spec: SpecializedAdapterSpec, method: string): ComboboxSetterRecipe {
  const setter = spec.setterSync.find((candidate) => candidate.method === method);
  if (!setter) {
    throw new Error(`Combobox specialized adapter spec requires ${method} setter sync.`);
  }
  if (!setter.stateModel || setter.suppressesEmit !== true) {
    throw new Error(`Combobox specialized adapter spec requires complete ${method} setter sync.`);
  }
  if (method === "setInputValue" && !recordsEqual(setter.options, { emit: false, filter: false })) {
    throw new Error(
      "Combobox specialized adapter spec requires setInputValue setter sync to suppress emit and filtering.",
    );
  }

  const recipe: ComboboxSetterRecipe = {
    method: setter.method,
    stateModel: setter.stateModel,
    suppressesEmit: setter.suppressesEmit,
  };
  if (setter.options) {
    recipe.options = { ...setter.options };
  }

  return recipe;
}

function getEvent(spec: SpecializedAdapterSpec, name: string): ComboboxRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`Combobox specialized adapter spec requires ${name} event metadata.`);
  }
  if (
    !event.callbackProp ||
    !event.detailsType ||
    !event.domEvent ||
    !event.emitsFrom ||
    !event.valueProperty ||
    !event.valueType
  ) {
    throw new Error(`Combobox specialized adapter spec requires complete ${name} event metadata.`);
  }

  return event as ComboboxRequiredEvent;
}

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Combobox specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getPartRecipe(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Combobox specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
}

function getAsChildRecipe(spec: SpecializedAdapterSpec, partName: string) {
  const asChild = spec.asChild.find((candidate) => candidate.part === partName);
  if (!asChild) {
    throw new Error(`Combobox specialized adapter spec requires ${partName} asChild metadata.`);
  }

  return asChild;
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Combobox specialized adapter spec requires ${partName} part.`);
  }
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function getPartRole<T extends "combobox" | "group" | "listbox" | "option" | "separator">(
  spec: SpecializedAdapterSpec,
  partName: string,
  expectedRole: T,
): T {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (part?.role !== expectedRole) {
    throw new Error(`Combobox specialized adapter spec requires ${partName} role ${expectedRole}.`);
  }

  return expectedRole;
}

function assertStaticAttribute(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): void {
  if (
    !spec.renderPlan.staticAttributes.some(
      (candidate) => candidate.part === partName && candidate.name === attributeName,
    )
  ) {
    throw new Error(
      `Combobox specialized adapter spec requires ${attributeName} metadata for ${partName}.`,
    );
  }
}

function assertStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
  value: string,
): void {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (attribute?.value !== value) {
    throw new Error(
      `Combobox specialized adapter spec requires ${attributeName}="${value}" metadata for ${partName}.`,
    );
  }
}

function arraysEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
