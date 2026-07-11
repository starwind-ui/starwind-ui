import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterCompositeMenuOverlayFacts,
  AdapterCompositeMenuOverlayPartName,
  AdapterIndexFile,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import { createPrimitiveAttributeMap } from "../primitives/contract-helpers.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec, SpecializedAdapterSpecPrintedFile } from "./types.js";

export type MenuSpecializedAdapterSpec = SpecializedAdapterSpec & {
  menu: {
    asChildTrigger: { merges: string[]; part: "trigger" };
    checkboxItem: MenuCheckboxItemRecipe;
    events: {
      closeComplete: MenuSpecializedAdapterSpecEventRecipe;
      openChange: MenuSpecializedAdapterSpecEventRecipe & { cancelable: true };
    };
    floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>;
    namespace: {
      defaultNamespace: boolean;
      defaultExport: "Menu";
      memberParts: string[];
      namedExports: string[];
      namespace: "Menu";
      objectEntries: MenuNamespaceObjectEntry[];
    };
    openState: {
      controlledProp: "open";
      defaultProp: "defaultOpen";
      getter: "getOpen";
      name: "open";
      setter: "setOpen";
      valueType: "boolean";
    };
    radioGroup: MenuRadioGroupRecipe;
    radioItem: MenuRadioItemRecipe;
    rootParts: {
      popup: "popup";
      portal: "portal";
      positioner: "positioner";
      root: "root";
      trigger: "trigger";
    };
    runtimeBoundary: string[];
    staticBranches: MenuStaticBranchRecipe[];
    submenu: MenuSubmenuRecipe;
  };
  sourcePrimitiveContract: RuntimeAdapterContract;
};

type MenuNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type MenuStaticBranchRecipe = {
  ariaAttributes?: { name: string; value: string }[];
  branchKind: "action-item" | "group" | "label" | "link-item" | "separator" | "shortcut";
  closeOnClick?: {
    attribute: "data-close-on-click";
    defaultValue: string;
    prop: "closeOnClick";
  };
  defaultElement: string;
  disabled?: {
    ariaAttribute: "aria-disabled";
    dataAttribute: "data-disabled";
    prop: "disabled";
  };
  part: "group" | "item" | "label" | "linkItem" | "separator" | "shortcut";
  publicRef: boolean;
  role?: string;
};

type MenuSpecializedAdapterSpecEventRecipe = {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  name: string;
  valueProperty: string;
};

type MenuCheckboxItemRecipe = {
  branchKind: "checkbox-item";
  checkedState: {
    controlledProp: "checked";
    defaultProp: "defaultChecked";
    initialAttribute: "data-default-checked";
    name: "checked";
    valueType: "boolean";
  };
  closeOnClick: {
    attribute: "data-close-on-click";
    defaultValue: "false";
    prop: "closeOnClick";
  };
  defaultElement: "div";
  disabled: NonNullable<MenuStaticBranchRecipe["disabled"]>;
  eventForwarding: {
    callbackProp: "onCheckedChange";
    callbackTiming: "before-state-commit";
    cancelable: true;
    controlledResync: "syncCheckboxItemState";
    detailsType: "MenuCheckedChangeDetails";
    domEvent: "starwind:checked-change";
    emitsFrom: "checkboxItem";
    name: "checkedChange";
    valueProperty: "checked";
    valueType: "boolean";
  };
  indicatorProjection: {
    ariaHidden: "true";
    checkedStateValue: "checked";
    hiddenAttribute: "data-hidden";
    indicatorPart: "checkboxItemIndicator";
    sourcePart: "checkboxItem";
    stateAttribute: "data-state";
    uncheckedStateValue: "unchecked";
    visibleAttribute: "data-visible";
  };
  part: "checkboxItem";
  publicRef: true;
  role: "menuitemcheckbox";
  stateAttributes: {
    ariaChecked: "aria-checked";
    checked: "data-checked";
    unchecked: "data-unchecked";
  };
};

type MenuRadioGroupRecipe = {
  branchKind: "radio-group";
  context: MenuRadioContextRecipe;
  defaultElement: "div";
  eventForwarding: {
    callbackProp: "onValueChange";
    callbackTiming: "before-state-commit";
    cancelable: true;
    controlledResync: "syncRadioGroupState";
    detailsType: "MenuValueChangeDetails";
    domEvent: "starwind:value-change";
    emitsFrom: "radioGroup";
    name: "valueChange";
    valueProperty: "value";
    valueType: "string";
  };
  part: "radioGroup";
  publicRef: true;
  role: "group";
  valueState: {
    controlledProp: "value";
    defaultProp: "defaultValue";
    initialAttribute: "data-value";
    name: "radioValue";
    valueType: "string";
  };
};

type MenuRadioItemRecipe = {
  branchKind: "radio-item";
  checkedState: MenuCheckboxItemRecipe["checkedState"];
  closeOnClick: MenuCheckboxItemRecipe["closeOnClick"];
  contextConsumer: {
    contextName: "menu-radio-group";
    scope: "nearest-radio-group";
    values: ["value"];
  };
  defaultElement: "div";
  disabled: NonNullable<MenuStaticBranchRecipe["disabled"]>;
  indicatorProjection: {
    ariaHidden: "true";
    checkedStateValue: "checked";
    hiddenAttribute: "data-hidden";
    indicatorPart: "radioItemIndicator";
    sourcePart: "radioItem";
    stateAttribute: "data-state";
    uncheckedStateValue: "unchecked";
    visibleAttribute: "data-visible";
  };
  part: "radioItem";
  publicRef: true;
  role: "menuitemradio";
  stateAttributes: MenuCheckboxItemRecipe["stateAttributes"];
  valueProp: {
    attribute: "data-value";
    prop: "value";
    required: true;
    type: "string";
  };
};

type MenuRadioContextRecipe = {
  consumedValues: string[];
  consumerPart: "radioItem";
  name: "menu-radio-group";
  providedValues: string[];
  providerPart: "radioGroup";
  scope: "nearest-radio-group";
};

type MenuSubmenuRecipe = {
  ownerTopology: MenuSubmenuOwnerTopologyRecipe;
  root: MenuSubmenuRootRecipe;
  trigger: MenuSubmenuTriggerRecipe;
};

type MenuSubmenuOwnerTopologyRecipe = {
  rootMenu: {
    boundaryParts: ["root", "trigger", "portal", "positioner", "popup"];
    childOwnerPart: "submenuRoot";
    floating: MenuOwnerFloatingRecipe<"trigger">;
    ownerKind: "root-menu";
    ownerPart: "root";
    queryScope: "own-root-menu-excluding-submenus";
    refs: MenuOwnerRefs<"root", "trigger">;
  };
  submenu: {
    boundaryParts: ["submenuRoot", "submenuTrigger", "portal", "positioner", "popup"];
    floating: MenuOwnerFloatingRecipe<"submenuTrigger">;
    nestedOwnerPart: "submenuRoot";
    ownerKind: "submenu";
    ownerPart: "submenuRoot";
    parentOwnerKinds: ["root-menu", "submenu"];
    queryScope: "nearest-submenu-root";
    refs: MenuOwnerRefs<"submenuRoot", "submenuTrigger">;
    triggerPart: "submenuTrigger";
  };
};

type MenuOwnerFloatingRecipe<TAnchor extends "submenuTrigger" | "trigger"> = {
  anchorPart: TAnchor;
  optionProps: string[];
  popupPart: "popup";
  portalPart: "portal";
  positionerPart: "positioner";
};

type MenuOwnerRefs<
  TRoot extends "root" | "submenuRoot",
  TTrigger extends "submenuTrigger" | "trigger",
> = {
  popup: "popup";
  portal: "portal";
  positioner: "positioner";
  root: TRoot;
  trigger: TTrigger;
};

type MenuSubmenuRootRecipe = {
  branchKind: "submenu-root";
  closeDelay: {
    attribute: "data-close-delay";
    defaultValue: "200";
    prop: "closeDelay";
    type: "number";
  };
  defaultElement: "div";
  ownerBoundary: "submenu";
  part: "submenuRoot";
  publicRef: true;
  stateAttributes: {
    closedValue: "closed";
    openValue: "open";
    state: "data-state";
  };
};

type MenuSubmenuTriggerRecipe = {
  branchKind: "submenu-trigger";
  defaultElement: "div";
  disabled: NonNullable<MenuStaticBranchRecipe["disabled"]>;
  disclosure: {
    ariaExpanded: "aria-expanded";
    ariaHaspopup: {
      attribute: "aria-haspopup";
      value: "menu";
    };
    closedStateValue: "closed";
    openStateValue: "open";
    stateAttribute: "data-state";
  };
  ownerBoundary: "submenu";
  part: "submenuTrigger";
  publicRef: true;
  role: "menuitem";
  tabIndex: {
    attribute: "tabindex";
    value: "0";
  };
};

type MenuRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  valueProperty: string;
};

const MENU_REQUIRED_ROOT_PARTS = ["root", "trigger", "portal", "positioner", "popup"] as const;
const MENU_STATIC_BRANCH_EXPECTATIONS = [
  {
    branchKind: "action-item",
    closeOnClickDefault: "true",
    disabled: true,
    part: "item",
  },
  {
    branchKind: "link-item",
    closeOnClickDefault: "false",
    disabled: true,
    part: "linkItem",
  },
  { branchKind: "group", part: "group" },
  { branchKind: "label", part: "label" },
  {
    ariaAttributes: [{ name: "aria-orientation", value: "horizontal" }],
    branchKind: "separator",
    part: "separator",
  },
  { branchKind: "shortcut", part: "shortcut" },
] as const;
const MENU_TRIGGER_AS_CHILD_MERGES = ["aria", "className", "data", "ref"] as const;
const MENU_FLOATING_OPTION_PROPS = ["side", "align", "sideOffset", "avoidCollisions"] as const;
const MENU_FORBIDDEN_SUBMENU_MODEL_KEYS = ["hoverTimers", "rovingFocus", "typeahead"] as const;
const MENU_COMPOSITE_OVERLAY_FIXTURE_COMMENT =
  "Non-shipping Menu composite overlay fixture. Do not publish, export, register, or copy into demo dependencies.";
const MENU_RUNTIME_BOUNDARY = [
  "roving focus",
  "typeahead",
  "highlighted item state",
  "submenu controllers",
  "hover close timers",
  "pointer and keyboard open reasons",
  "cancellable item activation",
  "checkbox and radio mutation",
  "portal movement",
  "floating placement",
  "dismissal",
  "animation-delayed hiding",
  "cleanup",
] as const;

export function buildMenuSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): MenuSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "menu") {
    throw new Error(`${spec.displayName} cannot be rendered as the Menu specialized adapter spec.`);
  }

  const openState = getStateModel(spec, "open");
  const openEvent = getEvent(spec, "openChange");
  const closeCompleteEvent = getEvent(spec, "closeComplete");
  const openSetter = getSetter(spec, openState.runtimeSetter ?? "setOpen");
  const floating = spec.renderPlan.floating;
  const asChildTrigger = spec.asChild.find((entry) => entry.part === "trigger");
  const checkboxItem = buildCheckboxItemRecipe(spec);
  const namespace = buildNamespaceRecipe(spec);
  const radioGroup = buildRadioGroupRecipe(spec);
  const radioItem = buildRadioItemRecipe(spec);
  const staticBranches = buildStaticBranches(spec);

  for (const part of MENU_REQUIRED_ROOT_PARTS) {
    assertPart(spec, part);
  }
  if (!floating) {
    throw new Error("Menu specialized adapter spec requires floating metadata.");
  }
  const submenu = buildSubmenuRecipe(spec, floating);
  if (!asChildTrigger) {
    throw new Error("Menu specialized adapter spec requires trigger asChild merge metadata.");
  }
  if (
    openState.controlledProp !== "open" ||
    openState.defaultProp !== "defaultOpen" ||
    openState.runtimeGetter !== "getOpen" ||
    openState.runtimeSetter !== "setOpen" ||
    openState.valueType !== "boolean"
  ) {
    throw new Error("Menu specialized adapter spec requires the root open state model.");
  }
  if (openSetter.method !== "setOpen") {
    throw new Error("Menu specialized adapter spec requires setOpen setter sync.");
  }

  return {
    ...spec,
    menu: {
      asChildTrigger: { merges: [...asChildTrigger.merges], part: "trigger" },
      checkboxItem,
      events: {
        closeComplete: {
          callbackProp: closeCompleteEvent.callbackProp,
          detailsType: closeCompleteEvent.detailsType,
          domEvent: closeCompleteEvent.domEvent,
          name: closeCompleteEvent.name,
          valueProperty: closeCompleteEvent.valueProperty,
        },
        openChange: {
          callbackProp: openEvent.callbackProp,
          cancelable: true,
          detailsType: openEvent.detailsType,
          domEvent: openEvent.domEvent,
          name: openEvent.name,
          valueProperty: openEvent.valueProperty,
        },
      },
      floating,
      namespace: {
        ...namespace,
        memberParts: spec.exports.members.map((member) => member.part),
      },
      openState: {
        controlledProp: "open",
        defaultProp: "defaultOpen",
        getter: "getOpen",
        name: "open",
        setter: "setOpen",
        valueType: "boolean",
      },
      radioGroup,
      radioItem,
      rootParts: {
        popup: "popup",
        portal: "portal",
        positioner: "positioner",
        root: "root",
        trigger: "trigger",
      },
      runtimeBoundary: [...MENU_RUNTIME_BOUNDARY],
      staticBranches,
      submenu,
    },
    sourcePrimitiveContract: contract,
  };
}

const MENU_OUTPUT_MODEL_PARTS = [
  "root",
  "trigger",
  "portal",
  "positioner",
  "popup",
  "item",
  "linkItem",
  "checkboxItem",
  "checkboxItemIndicator",
  "radioGroup",
  "radioItem",
  "radioItemIndicator",
  "group",
  "label",
  "separator",
  "shortcut",
  "submenuRoot",
  "submenuTrigger",
] as const satisfies readonly AdapterCompositeMenuOverlayPartName[];

const MENU_INDEX_IMPORT_PART_ORDER = [
  "checkboxItem",
  "checkboxItemIndicator",
  "group",
  "item",
  "label",
  "linkItem",
  "popup",
  "portal",
  "positioner",
  "radioGroup",
  "radioItem",
  "radioItemIndicator",
  "root",
  "separator",
  "shortcut",
  "submenuRoot",
  "submenuTrigger",
  "trigger",
] as const satisfies readonly AdapterCompositeMenuOverlayPartName[];

export function buildMenuAdapterOutputModel(spec: MenuSpecializedAdapterSpec): AdapterOutputModel {
  const facts = getMenuCompositeOverlayFacts(spec);
  const files: AdapterOutputModel["files"] = [
    ...MENU_OUTPUT_MODEL_PARTS.map((partName) => createMenuComponentFile(spec, partName, facts)),
    createMenuIndexFile(spec, facts),
  ];

  return { files };
}

function createMenuComponentFile(
  spec: MenuSpecializedAdapterSpec,
  partName: AdapterCompositeMenuOverlayPartName,
  facts: AdapterCompositeMenuOverlayFacts,
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
      family: { facts, kind: "composite-menu-overlay", part: partName },
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

function createMenuIndexFile(
  spec: MenuSpecializedAdapterSpec,
  facts: AdapterCompositeMenuOverlayFacts,
): AdapterIndexFile {
  return {
    exports: {
      kind: "namespace",
      members: facts.index.importMembers,
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "composite-menu-overlay" },
    imports: [],
    kind: "index",
    path: `${spec.component}/index.ts`,
    typeFacades: [],
  };
}

function getMenuCompositeOverlayFacts(
  spec: MenuSpecializedAdapterSpec,
): AdapterCompositeMenuOverlayFacts {
  const errors = validateMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(`Menu output model cannot print invalid Menu spec:\n${errors.join("\n")}`);
  }

  const attrs = createMenuAttributeMap(spec);
  const openSetter = getSetter(spec, spec.menu.openState.setter);
  const exportsByPart = Object.fromEntries(
    MENU_OUTPUT_MODEL_PARTS.map((partName) => [partName, getMenuFileExportName(spec, partName)]),
  ) as Record<AdapterCompositeMenuOverlayPartName, string>;
  const parts = Object.fromEntries(
    MENU_OUTPUT_MODEL_PARTS.map((partName) => [partName, getMenuAdapterPart(spec, partName)]),
  ) as AdapterCompositeMenuOverlayFacts["parts"];
  const indexImportMembers = MENU_INDEX_IMPORT_PART_ORDER.map((partName) => ({
    from: `./${exportsByPart[partName]}`,
    name: exportsByPart[partName],
  }));

  return {
    attrs: {
      align: attrs.align,
      avoidCollisions: attrs.avoidCollisions,
      checkboxCloseOnClick: attrs.checkboxCloseOnClick,
      checkboxDefaultChecked: attrs.checkboxDefaultChecked,
      checkboxItem: getPartRecipe(spec, "checkboxItem").discoveryAttribute,
      checkboxItemIndicator: getPartRecipe(spec, "checkboxItemIndicator").discoveryAttribute,
      closeDelay: attrs.closeDelay,
      defaultOpen: attrs.defaultOpen,
      disabled: attrs.disabled,
      group: getPartRecipe(spec, "group").discoveryAttribute,
      item: getPartRecipe(spec, "item").discoveryAttribute,
      itemCloseOnClick: attrs.itemCloseOnClick,
      label: getPartRecipe(spec, "label").discoveryAttribute,
      linkItem: getPartRecipe(spec, "linkItem").discoveryAttribute,
      linkItemCloseOnClick: attrs.linkItemCloseOnClick,
      modal: attrs.modal,
      openOnHover: attrs.openOnHover,
      popup: getPartRecipe(spec, "popup").discoveryAttribute,
      portal: getPartRecipe(spec, "portal").discoveryAttribute,
      positioner: getPartRecipe(spec, "positioner").discoveryAttribute,
      radioGroup: getPartRecipe(spec, "radioGroup").discoveryAttribute,
      radioGroupValue: attrs.radioGroupValue,
      radioItem: getPartRecipe(spec, "radioItem").discoveryAttribute,
      radioItemCloseOnClick: attrs.radioItemCloseOnClick,
      radioItemDefaultChecked: attrs.radioItemDefaultChecked,
      radioItemIndicator: getPartRecipe(spec, "radioItemIndicator").discoveryAttribute,
      radioItemValue: attrs.radioItemValue,
      root: getPartRecipe(spec, "root").discoveryAttribute,
      separator: getPartRecipe(spec, "separator").discoveryAttribute,
      shortcut: getPartRecipe(spec, "shortcut").discoveryAttribute,
      side: attrs.side,
      sideOffset: attrs.sideOffset,
      submenuRoot: getPartRecipe(spec, "submenuRoot").discoveryAttribute,
      submenuTrigger: getPartRecipe(spec, "submenuTrigger").discoveryAttribute,
      trigger: getPartRecipe(spec, "trigger").discoveryAttribute,
    },
    checkboxItem: {
      checkedState: {
        controlledProp: getAdapterFamilyPropForTarget(spec, "checked", "checkboxItem"),
        defaultProp: getAdapterFamilyPropForTarget(spec, "defaultChecked", "checkboxItem"),
        initialAttribute: spec.menu.checkboxItem.checkedState.initialAttribute,
        valueType: spec.menu.checkboxItem.checkedState.valueType,
      },
      closeOnClick: {
        attribute: spec.menu.checkboxItem.closeOnClick.attribute,
        defaultValue: spec.menu.checkboxItem.closeOnClick.defaultValue,
        prop: getAdapterFamilyPropForTarget(spec, "closeOnClick", "checkboxItem"),
      },
      disabled: {
        ariaAttribute: spec.menu.checkboxItem.disabled.ariaAttribute,
        dataAttribute: spec.menu.checkboxItem.disabled.dataAttribute,
        prop: getAdapterFamilyPropForTarget(spec, "disabled", "checkboxItem"),
      },
      event: {
        callbackProp: spec.menu.checkboxItem.eventForwarding.callbackProp,
        detailsType: spec.menu.checkboxItem.eventForwarding.detailsType,
        domEvent: spec.menu.checkboxItem.eventForwarding.domEvent,
        name: spec.menu.checkboxItem.eventForwarding.name,
        valueProperty: spec.menu.checkboxItem.eventForwarding.valueProperty,
        valueType: spec.menu.checkboxItem.eventForwarding.valueType,
      },
      indicator: spec.menu.checkboxItem.indicatorProjection,
      role: spec.menu.checkboxItem.role,
      stateAttributes: spec.menu.checkboxItem.stateAttributes,
    },
    displayName: spec.displayName,
    events: {
      closeComplete: {
        callbackProp: spec.menu.events.closeComplete.callbackProp,
        detailsType: spec.menu.events.closeComplete.detailsType,
        name: spec.menu.events.closeComplete.name,
      },
      openChange: {
        callbackProp: spec.menu.events.openChange.callbackProp,
        detailsType: spec.menu.events.openChange.detailsType,
        domEvent: spec.menu.events.openChange.domEvent,
        name: spec.menu.events.openChange.name,
        valueProperty: spec.menu.events.openChange.valueProperty,
        valueType: spec.menu.openState.valueType,
      },
    },
    exports: {
      ...exportsByPart,
      namespace: spec.menu.namespace.namespace,
    },
    floating: {
      alignDefault: getPropDefaultForTarget(spec, "align", "positioner"),
      avoidCollisionsDefault: getPropDefaultForTarget(spec, "avoidCollisions", "positioner"),
      sideDefault: getPropDefaultForTarget(spec, "side", "positioner"),
      sideOffsetDefault: getPropDefaultForTarget(spec, "sideOffset", "positioner"),
    },
    index: {
      importMembers: indexImportMembers,
      namespaceMembers: spec.menu.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [
        "MenuCheckedChangeDetails",
        "MenuCloseCompleteDetails",
        "MenuOpenChangeDetails",
        "MenuValueChangeDetails",
      ],
    },
    parts,
    props: {
      align: getAdapterFamilyPropForTarget(spec, "align", "positioner"),
      asChild: getAdapterFamilyPropForTarget(spec, "asChild", "trigger"),
      avoidCollisions: getAdapterFamilyPropForTarget(spec, "avoidCollisions", "positioner"),
      closeDelay: getAdapterFamilyPropForTarget(spec, "closeDelay", "root"),
      defaultOpen: getAdapterFamilyPropForTarget(spec, "defaultOpen", "root"),
      disabled: getAdapterFamilyPropForTarget(spec, "disabled", "root"),
      modal: getAdapterFamilyPropForTarget(spec, "modal", "root"),
      open: getAdapterFamilyPropForTarget(spec, "open", "root"),
      openOnHover: getAdapterFamilyPropForTarget(spec, "openOnHover", "root"),
      side: getAdapterFamilyPropForTarget(spec, "side", "positioner"),
      sideOffset: getAdapterFamilyPropForTarget(spec, "sideOffset", "positioner"),
    },
    radioGroup: {
      event: {
        callbackProp: spec.menu.radioGroup.eventForwarding.callbackProp,
        detailsType: spec.menu.radioGroup.eventForwarding.detailsType,
        domEvent: spec.menu.radioGroup.eventForwarding.domEvent,
        name: spec.menu.radioGroup.eventForwarding.name,
        valueProperty: spec.menu.radioGroup.eventForwarding.valueProperty,
        valueType: spec.menu.radioGroup.eventForwarding.valueType,
      },
      role: spec.menu.radioGroup.role,
      valueState: {
        controlledProp: getAdapterFamilyPropForTarget(spec, "value", "radioGroup"),
        defaultProp: getAdapterFamilyPropForTarget(spec, "defaultValue", "radioGroup"),
        initialAttribute: spec.menu.radioGroup.valueState.initialAttribute,
        valueType: spec.menu.radioGroup.valueState.valueType,
      },
    },
    radioItem: {
      checkedState: {
        controlledProp: getAdapterFamilyPropForTarget(spec, "checked", "radioItem"),
        defaultProp: getAdapterFamilyPropForTarget(spec, "defaultChecked", "radioItem"),
        initialAttribute: spec.menu.radioItem.checkedState.initialAttribute,
        valueType: spec.menu.radioItem.checkedState.valueType,
      },
      closeOnClick: {
        attribute: spec.menu.radioItem.closeOnClick.attribute,
        defaultValue: spec.menu.radioItem.closeOnClick.defaultValue,
        prop: getAdapterFamilyPropForTarget(spec, "closeOnClick", "radioItem"),
      },
      disabled: {
        ariaAttribute: spec.menu.radioItem.disabled.ariaAttribute,
        dataAttribute: spec.menu.radioItem.disabled.dataAttribute,
        prop: getAdapterFamilyPropForTarget(spec, "disabled", "radioItem"),
      },
      indicator: spec.menu.radioItem.indicatorProjection,
      role: spec.menu.radioItem.role,
      stateAttributes: spec.menu.radioItem.stateAttributes,
      valueProp: {
        ...getAdapterFamilyPropForTarget(spec, "value", "radioItem"),
        attribute: spec.menu.radioItem.valueProp.attribute,
        required: true,
      },
    },
    runtime: {
      destroyFunction: `destroy${spec.displayName}s`,
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      instancesName: `${spec.component}Instances`,
      rootExclusionAttributes: ["data-sw-context-menu"],
      setupFunction: `setup${spec.displayName}s`,
      typeImportSource: "@starwind-ui/runtime",
    },
    setters: {
      open: {
        method: openSetter.method,
        options: "options" in openSetter ? openSetter.options : undefined,
      },
    },
    state: {
      open: {
        defaultValue: getPropDefaultForTarget(spec, "defaultOpen", "root"),
        getter: spec.menu.openState.getter,
        setter: spec.menu.openState.setter,
      },
    },
    staticBranches: {
      group: getMenuStaticBranchFacts(spec, "group"),
      item: getMenuStaticBranchFacts(
        spec,
        "item",
      ) as AdapterCompositeMenuOverlayFacts["staticBranches"]["item"],
      label: getMenuStaticBranchFacts(spec, "label"),
      linkItem: getMenuStaticBranchFacts(
        spec,
        "linkItem",
      ) as AdapterCompositeMenuOverlayFacts["staticBranches"]["linkItem"],
      separator: getMenuStaticBranchFacts(
        spec,
        "separator",
      ) as AdapterCompositeMenuOverlayFacts["staticBranches"]["separator"],
      shortcut: getMenuStaticBranchFacts(spec, "shortcut"),
    },
    submenu: {
      root: {
        closeDelay: {
          ...getAdapterFamilyPropForTarget(spec, "closeDelay", "submenuRoot"),
          attribute: spec.menu.submenu.root.closeDelay.attribute,
        },
        stateAttributes: spec.menu.submenu.root.stateAttributes,
      },
      trigger: {
        disabled: {
          ariaAttribute: spec.menu.submenu.trigger.disabled.ariaAttribute,
          dataAttribute: spec.menu.submenu.trigger.disabled.dataAttribute,
          prop: getAdapterFamilyPropForTarget(spec, "disabled", "submenuTrigger"),
        },
        disclosure: spec.menu.submenu.trigger.disclosure,
        role: spec.menu.submenu.trigger.role,
        tabIndex: spec.menu.submenu.trigger.tabIndex,
      },
    },
  };
}

export function validateMenuSpecializedAdapterSpec(spec: MenuSpecializedAdapterSpec): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "menu") {
    errors.push("Menu specialized adapter spec must target the menu primitive.");
    return errors;
  }

  const menu = isRecord(spec.menu) ? spec.menu : undefined;
  if (!menu) {
    errors.push("Menu specialized adapter spec is missing menu recipe metadata.");
    return errors;
  }

  for (const part of MENU_REQUIRED_ROOT_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Menu specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateRootParts(menu.rootParts));

  if (!hasEvent(spec, "openChange")) {
    errors.push("Menu specialized adapter spec requires openChange event.");
  } else {
    errors.push(...validateEventRecipe(spec, "openChange", menu.events?.openChange, true));
  }
  if (!hasEvent(spec, "closeComplete")) {
    errors.push("Menu specialized adapter spec requires closeComplete event.");
  } else {
    errors.push(...validateEventRecipe(spec, "closeComplete", menu.events?.closeComplete, false));
  }
  if (!hasSetter(spec, "setOpen")) {
    errors.push("Menu specialized adapter spec requires setOpen setter sync.");
  }
  errors.push(...validateFloating(menu.floating));

  const asChildTrigger = isRecord(menu.asChildTrigger) ? menu.asChildTrigger : undefined;
  if (!asChildTrigger) {
    errors.push("Menu specialized adapter spec requires trigger asChild merge metadata.");
  } else {
    const merges = Array.isArray(asChildTrigger.merges) ? asChildTrigger.merges : [];
    const missingMerges = MENU_TRIGGER_AS_CHILD_MERGES.filter((merge) => !merges.includes(merge));
    if (asChildTrigger.part !== "trigger" || missingMerges.length > 0) {
      errors.push(
        "Menu specialized adapter spec trigger asChild merges must include aria, className, data, ref.",
      );
    }
  }

  const openState = isRecord(menu.openState) ? menu.openState : undefined;
  if (
    !openState ||
    openState.name !== "open" ||
    openState.controlledProp !== "open" ||
    openState.defaultProp !== "defaultOpen" ||
    openState.getter !== "getOpen" ||
    openState.setter !== "setOpen" ||
    openState.valueType !== "boolean"
  ) {
    errors.push("Menu specialized adapter spec requires the root open state model.");
  }

  errors.push(...validateNamespace(spec, menu.namespace));
  errors.push(...validateCheckboxItem(spec, menu.checkboxItem));
  errors.push(...validateRadioGroup(spec, menu.radioGroup));
  errors.push(...validateRadioItem(spec, menu.radioItem));
  errors.push(...validateStaticBranches(spec, menu.staticBranches));
  errors.push(...validateSubmenu(spec, menu.submenu));

  return errors;
}

export function printMenuCheckboxItemRecipeBlock(spec: MenuSpecializedAdapterSpec): string {
  const errors = validateMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const checkbox = spec.menu.checkboxItem;
  return `checkboxItem:\n  part: ${checkbox.part}\n  event: ${checkbox.eventForwarding.domEvent} -> ${checkbox.eventForwarding.callbackProp}(${checkbox.eventForwarding.valueProperty}, details)\n  controlledResync: ${checkbox.eventForwarding.controlledResync}\n  indicator: ${checkbox.indicatorProjection.indicatorPart}[${checkbox.indicatorProjection.stateAttribute}=${checkbox.indicatorProjection.checkedStateValue}|${checkbox.indicatorProjection.uncheckedStateValue}, ${checkbox.indicatorProjection.visibleAttribute}, ${checkbox.indicatorProjection.hiddenAttribute}]\n`;
}

export function printMenuNamespaceExportBlock(spec: MenuSpecializedAdapterSpec): string {
  const errors = validateMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const namespace = spec.menu.namespace;
  const objectEntries = namespace.objectEntries
    .map((entry) => `  ${entry.property}: ${entry.exportName},`)
    .join("\n");
  const namedExports = namespace.namedExports.map((exportName) => `  ${exportName},`).join("\n");

  return `const ${namespace.defaultExport} = {\n${objectEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${namespace.defaultExport};\n`;
}

export function printMenuRadioRecipeBlock(spec: MenuSpecializedAdapterSpec): string {
  const errors = validateMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const group = spec.menu.radioGroup;
  const item = spec.menu.radioItem;
  return `radioGroup:\n  context: ${group.context.name} provides ${group.context.providedValues.join(", ")} -> ${group.context.consumerPart} consumes ${group.context.consumedValues.join(", ")} (${group.context.scope})\n  event: ${group.eventForwarding.domEvent} -> ${group.eventForwarding.callbackProp}(${group.eventForwarding.valueProperty}, details)\n  controlledResync: ${group.eventForwarding.controlledResync}\nradioItem:\n  value: ${item.valueProp.prop} -> ${item.valueProp.attribute}\n  indicator: ${item.indicatorProjection.indicatorPart}[${item.indicatorProjection.stateAttribute}=${item.indicatorProjection.checkedStateValue}|${item.indicatorProjection.uncheckedStateValue}, ${item.indicatorProjection.visibleAttribute}, ${item.indicatorProjection.hiddenAttribute}]\n`;
}

export function printMenuSubmenuRecipeBlock(spec: MenuSpecializedAdapterSpec): string {
  const errors = validateMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const submenu = spec.menu.submenu;
  return `submenuOwners:\n  root-menu: ${submenu.ownerTopology.rootMenu.refs.root} owns ${submenu.ownerTopology.rootMenu.refs.trigger}, ${submenu.ownerTopology.rootMenu.refs.portal}, ${submenu.ownerTopology.rootMenu.refs.positioner}, ${submenu.ownerTopology.rootMenu.refs.popup} refs; floating anchor ${submenu.ownerTopology.rootMenu.floating.anchorPart}; excludes ${submenu.ownerTopology.rootMenu.childOwnerPart}\n  submenu: ${submenu.ownerTopology.submenu.refs.root} owns ${submenu.ownerTopology.submenu.refs.trigger}, ${submenu.ownerTopology.submenu.refs.portal}, ${submenu.ownerTopology.submenu.refs.positioner}, ${submenu.ownerTopology.submenu.refs.popup} refs; floating anchor ${submenu.ownerTopology.submenu.floating.anchorPart}; scope ${submenu.ownerTopology.submenu.queryScope}\nsubmenuRoot:\n  closeDelay: ${submenu.root.closeDelay.prop} -> ${submenu.root.closeDelay.attribute} (default ${submenu.root.closeDelay.defaultValue})\n  state: ${submenu.root.stateAttributes.state}=${submenu.root.stateAttributes.closedValue}|${submenu.root.stateAttributes.openValue}\nsubmenuTrigger:\n  semantics: role=${submenu.trigger.role} ${submenu.trigger.disclosure.ariaHaspopup.attribute}=${submenu.trigger.disclosure.ariaHaspopup.value} ${submenu.trigger.disclosure.ariaExpanded}\n  disabled: ${submenu.trigger.disabled.prop} -> ${submenu.trigger.disabled.ariaAttribute}, ${submenu.trigger.disabled.dataAttribute}\n`;
}

export function printMenuCompositeOverlayFixture(
  spec: MenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertMenuCompositeOverlayFixtureSpec(spec);

  return [
    {
      contents: renderMenuCompositeOverlayFixture(spec),
      path: "__future-fixtures/composite-menu-overlay/menu/MenuCompositeOverlay.fixture.ts",
    },
    {
      contents: `// ${MENU_COMPOSITE_OVERLAY_FIXTURE_COMMENT}\nexport { menuCompositeOverlayFixture } from "./MenuCompositeOverlay.fixture";\n`,
      path: "__future-fixtures/composite-menu-overlay/menu/index.ts",
    },
  ];
}

function renderMenuCompositeOverlayFixture(spec: MenuSpecializedAdapterSpec): string {
  const menu = spec.menu;
  const lines = [
    `component: ${spec.component}`,
    `runtime: ${spec.root.runtimeFactory} from ${spec.root.runtimeImportSource}`,
    `openState: ${menu.openState.controlledProp}/${menu.openState.defaultProp} -> ${menu.openState.getter}/${menu.openState.setter}`,
    `events: ${menu.events.openChange.name} ${menu.events.openChange.domEvent} cancelable; ${menu.events.closeComplete.name} ${menu.events.closeComplete.domEvent}`,
    `rootParts: ${MENU_REQUIRED_ROOT_PARTS.join(", ")}`,
    `floating: ${menu.floating.anchorPart} -> ${menu.floating.portalPart}/${menu.floating.positionerPart}/${menu.floating.popupPart} options ${menu.floating.optionProps.join(", ")}`,
    `asChildTrigger: ${menu.asChildTrigger.part} merges ${menu.asChildTrigger.merges.join(", ")}`,
    ...menu.staticBranches.map(formatMenuFixtureStaticBranch),
    `checkboxItem: ${menu.checkboxItem.checkedState.controlledProp}/${menu.checkboxItem.checkedState.defaultProp} -> ${menu.checkboxItem.checkedState.initialAttribute}; event ${menu.checkboxItem.eventForwarding.domEvent} -> ${menu.checkboxItem.eventForwarding.callbackProp}; indicator ${menu.checkboxItem.indicatorProjection.indicatorPart} ${menu.checkboxItem.indicatorProjection.stateAttribute} ${menu.checkboxItem.indicatorProjection.checkedStateValue}|${menu.checkboxItem.indicatorProjection.uncheckedStateValue}`,
    `radioGroup: ${menu.radioGroup.valueState.controlledProp}/${menu.radioGroup.valueState.defaultProp} -> ${menu.radioGroup.valueState.initialAttribute}; context ${menu.radioGroup.context.name} provides ${menu.radioGroup.context.providedValues.join(", ")}`,
    `radioItem: ${menu.radioItem.valueProp.prop} required -> ${menu.radioItem.valueProp.attribute}; consumes ${menu.radioItem.contextConsumer.values.join(", ")} from ${menu.radioItem.contextConsumer.scope}; indicator ${menu.radioItem.indicatorProjection.indicatorPart} ${menu.radioItem.indicatorProjection.stateAttribute} ${menu.radioItem.indicatorProjection.checkedStateValue}|${menu.radioItem.indicatorProjection.uncheckedStateValue}`,
    `submenuOwner:${menu.submenu.ownerTopology.rootMenu.ownerKind} ${menu.submenu.ownerTopology.rootMenu.refs.root} owns ${menu.submenu.ownerTopology.rootMenu.refs.trigger}, ${menu.submenu.ownerTopology.rootMenu.refs.portal}, ${menu.submenu.ownerTopology.rootMenu.refs.positioner}, ${menu.submenu.ownerTopology.rootMenu.refs.popup} via ${menu.submenu.ownerTopology.rootMenu.queryScope}`,
    `submenuOwner:${menu.submenu.ownerTopology.submenu.ownerKind} ${menu.submenu.ownerTopology.submenu.refs.root} owns ${menu.submenu.ownerTopology.submenu.refs.trigger}, ${menu.submenu.ownerTopology.submenu.refs.portal}, ${menu.submenu.ownerTopology.submenu.refs.positioner}, ${menu.submenu.ownerTopology.submenu.refs.popup} via ${menu.submenu.ownerTopology.submenu.queryScope}`,
    `submenuRoot: ${menu.submenu.root.closeDelay.prop} -> ${menu.submenu.root.closeDelay.attribute} default=${menu.submenu.root.closeDelay.defaultValue} state=${menu.submenu.root.stateAttributes.state} ${menu.submenu.root.stateAttributes.closedValue}|${menu.submenu.root.stateAttributes.openValue}`,
    `submenuTrigger: role=${menu.submenu.trigger.role} ${menu.submenu.trigger.disclosure.ariaHaspopup.attribute}=${menu.submenu.trigger.disclosure.ariaHaspopup.value} ${menu.submenu.trigger.disclosure.ariaExpanded} ${menu.submenu.trigger.disclosure.stateAttribute} disabled=${menu.submenu.trigger.disabled.ariaAttribute}/${menu.submenu.trigger.disabled.dataAttribute} ${menu.submenu.trigger.tabIndex.attribute}=${menu.submenu.trigger.tabIndex.value}`,
    `namespace.default: ${menu.namespace.defaultExport}`,
    ...menu.namespace.objectEntries.map(
      (entry) => `namespace.member: ${entry.property}=${entry.exportName}`,
    ),
    `namespace.named: ${menu.namespace.namedExports.join(", ")}`,
    ...menu.runtimeBoundary.map((boundary) => `runtimeBoundary: ${boundary}`),
  ];

  return `// ${MENU_COMPOSITE_OVERLAY_FIXTURE_COMMENT}\nexport const menuCompositeOverlayFixture = [\n${lines
    .map((line) => `  ${JSON.stringify(line)},`)
    .join("\n")}\n] as const;\n`;
}

function assertMenuCompositeOverlayFixtureSpec(spec: MenuSpecializedAdapterSpec): void {
  const menu = isRecord(spec.menu) ? spec.menu : undefined;
  if (!menu) {
    throw new Error(
      "Menu composite overlay fixture requires menu recipe for composite menu overlay surface.",
    );
  }

  assertFixtureRecipe(Array.isArray(menu.staticBranches) && menu.staticBranches.length > 0, {
    recipe: "staticBranches",
    surface: "static item branches",
  });
  assertFixtureRecipe(isRecord(menu.checkboxItem), {
    recipe: "checkboxItem",
    surface: "checkbox item",
  });
  assertFixtureRecipe(isRecord(menu.radioGroup), {
    recipe: "radioGroup",
    surface: "radio group",
  });
  assertFixtureRecipe(isRecord(menu.radioItem), {
    recipe: "radioItem",
    surface: "radio item",
  });
  assertFixtureRecipe(isRecord(menu.submenu), {
    recipe: "submenu",
    surface: "submenu owner",
  });
  assertFixtureRecipe(isRecord(menu.namespace), {
    recipe: "namespace",
    surface: "namespace export",
  });

  const errors = validateMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Menu composite overlay fixture cannot print invalid Menu spec:\n${errors.join("\n")}`,
    );
  }
}

function assertFixtureRecipe(
  condition: boolean,
  { recipe, surface }: { recipe: string; surface: string },
): void {
  if (!condition) {
    throw new Error(
      `Menu composite overlay fixture requires ${recipe} recipe for ${surface} surface.`,
    );
  }
}

function formatMenuFixtureStaticBranch(branch: MenuStaticBranchRecipe): string {
  const role = branch.role ? ` role=${branch.role}` : "";
  const closeOnClick = branch.closeOnClick
    ? ` closeOnClick=${branch.closeOnClick.attribute} default=${branch.closeOnClick.defaultValue}`
    : "";
  const disabled = branch.disabled
    ? ` disabled=${branch.disabled.ariaAttribute}/${branch.disabled.dataAttribute}`
    : "";
  const ariaAttributes = branch.ariaAttributes?.length
    ? ` aria=${branch.ariaAttributes.map((attribute) => `${attribute.name}:${attribute.value}`).join(",")}`
    : "";

  return `staticBranch:${branch.part} ${branch.branchKind} element=${branch.defaultElement}${role}${closeOnClick}${disabled}${ariaAttributes} ref=${branch.publicRef}`;
}

function createMenuAttributeMap(spec: MenuSpecializedAdapterSpec) {
  return createPrimitiveAttributeMap(spec.sourcePrimitiveContract, {
    align: { part: "positioner", attribute: "data-align" },
    avoidCollisions: { part: "positioner", attribute: "data-avoid-collisions" },
    checkboxCloseOnClick: { part: "checkboxItem", attribute: "data-close-on-click" },
    checkboxDefaultChecked: { part: "checkboxItem", attribute: "data-default-checked" },
    closeDelay: { part: "root", attribute: "data-close-delay" },
    defaultOpen: { part: "root", attribute: "data-default-open" },
    disabled: { part: "root", attribute: "data-disabled" },
    itemCloseOnClick: { part: "item", attribute: "data-close-on-click" },
    linkItemCloseOnClick: { part: "linkItem", attribute: "data-close-on-click" },
    modal: { part: "root", attribute: "data-modal" },
    openOnHover: { part: "root", attribute: "data-open-on-hover" },
    radioGroupValue: { part: "radioGroup", attribute: "data-value" },
    radioItemCloseOnClick: { part: "radioItem", attribute: "data-close-on-click" },
    radioItemDefaultChecked: { part: "radioItem", attribute: "data-default-checked" },
    radioItemValue: { part: "radioItem", attribute: "data-value" },
    side: { part: "positioner", attribute: "data-side" },
    sideOffset: { part: "positioner", attribute: "data-side-offset" },
  });
}

function getMenuFileExportName(
  spec: SpecializedAdapterSpec,
  partName: AdapterCompositeMenuOverlayPartName,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Menu output model requires ${partName} part file.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(`Menu output model requires ${partName} file path ${expectedPath}.`);
  }

  return file.exportName;
}

function getMenuAdapterPart(
  spec: MenuSpecializedAdapterSpec,
  partName: AdapterCompositeMenuOverlayPartName,
): AdapterCompositeMenuOverlayFacts["parts"][AdapterCompositeMenuOverlayPartName] {
  const part = getPartRecipe(spec, partName);
  const namespaceEntry = spec.menu.namespace.objectEntries.find((entry) => entry.part === partName);
  if (!namespaceEntry) {
    throw new Error(`Menu output model requires ${partName} namespace entry.`);
  }

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
    namespaceKey: namespaceEntry.property,
    ...(part.role ? { role: part.role } : {}),
  };
}

function getAdapterFamilyPropForTarget(
  spec: SpecializedAdapterSpec,
  propName: string,
  target: string,
) {
  const prop = getPropForTarget(spec, propName, target);

  return {
    ...(prop.defaultValue ? { defaultValue: prop.defaultValue } : {}),
    name: prop.name,
    ...(prop.required ? { required: prop.required } : {}),
    type: prop.type,
  };
}

function getMenuStaticBranchFacts(
  spec: MenuSpecializedAdapterSpec,
  partName: MenuStaticBranchRecipe["part"],
) {
  const branch = spec.menu.staticBranches.find((candidate) => candidate.part === partName);
  if (!branch) {
    throw new Error(`Menu output model requires ${partName} static branch.`);
  }

  const tabIndex = getOptionalStaticAttributeValue(spec, partName, "tabindex");
  if ((partName === "item" || partName === "linkItem") && !tabIndex) {
    throw new Error(`Menu output model requires ${partName} tabindex metadata.`);
  }

  return {
    defaultElement: branch.defaultElement,
    part: branch.part,
    ...(branch.role ? { role: branch.role } : {}),
    ...(tabIndex ? { tabIndex } : {}),
    ...(branch.ariaAttributes ? { ariaAttributes: branch.ariaAttributes } : {}),
    ...(branch.closeOnClick
      ? {
          closeOnClick: {
            attribute: branch.closeOnClick.attribute,
            defaultValue: branch.closeOnClick.defaultValue,
            prop: getAdapterFamilyPropForTarget(spec, "closeOnClick", partName),
          },
        }
      : {}),
    ...(branch.disabled
      ? {
          disabled: {
            ariaAttribute: branch.disabled.ariaAttribute,
            dataAttribute: branch.disabled.dataAttribute,
            prop: getAdapterFamilyPropForTarget(spec, "disabled", partName),
          },
        }
      : {}),
  };
}

function getOptionalStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): { attribute: string; value: string } | undefined {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (!attribute?.value) return undefined;

  return { attribute: attribute.name, value: attribute.value };
}

function buildStaticBranches(spec: SpecializedAdapterSpec): MenuStaticBranchRecipe[] {
  return MENU_STATIC_BRANCH_EXPECTATIONS.map((expectation) => {
    const part = getPartRecipe(spec, expectation.part);
    const branch: MenuStaticBranchRecipe = {
      branchKind: expectation.branchKind,
      defaultElement: part.defaultElement,
      part: expectation.part,
      publicRef: hasPublicRef(spec, expectation.part),
      ...(part.role ? { role: part.role } : {}),
    };

    if ("disabled" in expectation && expectation.disabled) {
      branch.disabled = buildDisabledRecipe(spec, expectation.part);
    }

    if ("closeOnClickDefault" in expectation) {
      branch.closeOnClick = {
        attribute: getStaticAttributeName(spec, expectation.part, "data-close-on-click"),
        defaultValue: getPropDefaultForTarget(spec, "closeOnClick", expectation.part),
        prop: "closeOnClick",
      };
    }

    if ("ariaAttributes" in expectation) {
      branch.ariaAttributes = getConstantAttributes(spec, expectation.part, ["aria-orientation"]);
    }

    return branch;
  });
}

function buildNamespaceRecipe(
  spec: SpecializedAdapterSpec,
): Omit<MenuSpecializedAdapterSpec["menu"]["namespace"], "memberParts"> {
  const objectEntries = spec.exports.members.map((member) => ({
    exportName: member.name,
    part: member.part,
    property: member.name.replace(/^Menu/, ""),
  }));

  return {
    defaultExport: "Menu",
    defaultNamespace: spec.exports.defaultNamespace,
    namedExports: ["Menu", ...spec.exports.members.map((member) => member.name)],
    namespace: "Menu",
    objectEntries,
  };
}

function buildCheckboxItemRecipe(spec: SpecializedAdapterSpec): MenuCheckboxItemRecipe {
  const part = getPartRecipe(spec, "checkboxItem");
  const state = getStateModel(spec, "checked");
  const event = getEvent(spec, "checkedChange");
  assertPart(spec, "checkboxItemIndicator");

  if (
    state.controlledProp !== "checked" ||
    state.defaultProp !== "defaultChecked" ||
    state.initialAttribute !== "data-default-checked" ||
    state.valueType !== "boolean"
  ) {
    throw new Error("Menu specialized adapter spec requires the checkbox checked state model.");
  }
  if (
    event.callbackProp !== "onCheckedChange" ||
    event.callbackTiming !== "before-state-commit" ||
    event.detailsType !== "MenuCheckedChangeDetails" ||
    event.domEvent !== "starwind:checked-change" ||
    event.emitsFrom !== "checkboxItem" ||
    event.valueProperty !== "checked" ||
    event.valueType !== "boolean" ||
    event.cancelable !== true
  ) {
    throw new Error("Menu specialized adapter spec requires checkedChange event metadata.");
  }
  if (part.defaultElement !== "div" || part.role !== "menuitemcheckbox") {
    throw new Error(
      "Menu specialized adapter spec requires checkboxItem menuitemcheckbox anatomy.",
    );
  }

  return {
    branchKind: "checkbox-item",
    checkedState: {
      controlledProp: "checked",
      defaultProp: "defaultChecked",
      initialAttribute: "data-default-checked",
      name: "checked",
      valueType: "boolean",
    },
    closeOnClick: {
      attribute: getStaticAttributeName(spec, "checkboxItem", "data-close-on-click"),
      defaultValue: getPropDefaultForTarget(spec, "closeOnClick", "checkboxItem") as "false",
      prop: "closeOnClick",
    },
    defaultElement: "div",
    disabled: buildDisabledRecipe(spec, "checkboxItem"),
    eventForwarding: {
      callbackProp: "onCheckedChange",
      callbackTiming: "before-state-commit",
      cancelable: true,
      controlledResync: "syncCheckboxItemState",
      detailsType: "MenuCheckedChangeDetails",
      domEvent: "starwind:checked-change",
      emitsFrom: "checkboxItem",
      name: "checkedChange",
      valueProperty: "checked",
      valueType: "boolean",
    },
    indicatorProjection: {
      ariaHidden: getStaticAttributeValue(spec, "checkboxItemIndicator", "aria-hidden") as "true",
      checkedStateValue: "checked",
      hiddenAttribute: "data-hidden",
      indicatorPart: "checkboxItemIndicator",
      sourcePart: "checkboxItem",
      stateAttribute: getStaticAttributeName(spec, "checkboxItemIndicator", "data-state"),
      uncheckedStateValue: "unchecked",
      visibleAttribute: "data-visible",
    },
    part: "checkboxItem",
    publicRef: requirePublicRef(spec, "checkboxItem"),
    role: "menuitemcheckbox",
    stateAttributes: buildCheckboxStateAttributes(spec),
  };
}

function buildRadioGroupRecipe(spec: SpecializedAdapterSpec): MenuRadioGroupRecipe {
  const part = getPartRecipe(spec, "radioGroup");
  const state = getStateModel(spec, "radioValue");
  const event = getEvent(spec, "valueChange");
  if (
    state.controlledProp !== "value" ||
    state.defaultProp !== "defaultValue" ||
    state.initialAttribute !== "data-value" ||
    state.valueType !== "string"
  ) {
    throw new Error("Menu specialized adapter spec requires the radio group value state model.");
  }
  if (
    event.callbackProp !== "onValueChange" ||
    event.callbackTiming !== "before-state-commit" ||
    event.detailsType !== "MenuValueChangeDetails" ||
    event.domEvent !== "starwind:value-change" ||
    event.emitsFrom !== "radioGroup" ||
    event.valueProperty !== "value" ||
    event.valueType !== "string" ||
    event.cancelable !== true
  ) {
    throw new Error("Menu specialized adapter spec requires valueChange event metadata.");
  }
  if (part.defaultElement !== "div" || part.role !== "group") {
    throw new Error("Menu specialized adapter spec requires radioGroup group anatomy.");
  }

  return {
    branchKind: "radio-group",
    context: buildRadioContextRecipe(spec),
    defaultElement: "div",
    eventForwarding: {
      callbackProp: "onValueChange",
      callbackTiming: "before-state-commit",
      cancelable: true,
      controlledResync: "syncRadioGroupState",
      detailsType: "MenuValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "radioGroup",
      name: "valueChange",
      valueProperty: "value",
      valueType: "string",
    },
    part: "radioGroup",
    publicRef: requirePublicRef(spec, "radioGroup"),
    role: "group",
    valueState: {
      controlledProp: "value",
      defaultProp: "defaultValue",
      initialAttribute: "data-value",
      name: "radioValue",
      valueType: "string",
    },
  };
}

function buildRadioItemRecipe(spec: SpecializedAdapterSpec): MenuRadioItemRecipe {
  const part = getPartRecipe(spec, "radioItem");
  const state = getStateModel(spec, "checked");
  assertPart(spec, "radioItemIndicator");
  const valueProp = getPropForTarget(spec, "value", "radioItem");
  if (
    state.controlledProp !== "checked" ||
    state.defaultProp !== "defaultChecked" ||
    state.initialAttribute !== "data-default-checked" ||
    state.valueType !== "boolean"
  ) {
    throw new Error("Menu specialized adapter spec requires the radio item checked state model.");
  }
  if (part.defaultElement !== "div" || part.role !== "menuitemradio") {
    throw new Error("Menu specialized adapter spec requires radioItem menuitemradio anatomy.");
  }
  if (valueProp.required !== true || valueProp.type !== "string") {
    throw new Error("Menu specialized adapter spec requires radioItem required value prop.");
  }

  return {
    branchKind: "radio-item",
    checkedState: {
      controlledProp: "checked",
      defaultProp: "defaultChecked",
      initialAttribute: "data-default-checked",
      name: "checked",
      valueType: "boolean",
    },
    closeOnClick: {
      attribute: getStaticAttributeName(spec, "radioItem", "data-close-on-click"),
      defaultValue: getPropDefaultForTarget(spec, "closeOnClick", "radioItem") as "false",
      prop: "closeOnClick",
    },
    contextConsumer: {
      contextName: "menu-radio-group",
      scope: "nearest-radio-group",
      values: ["value"],
    },
    defaultElement: "div",
    disabled: buildDisabledRecipe(spec, "radioItem"),
    indicatorProjection: {
      ariaHidden: getStaticAttributeValue(spec, "radioItemIndicator", "aria-hidden") as "true",
      checkedStateValue: "checked",
      hiddenAttribute: "data-hidden",
      indicatorPart: "radioItemIndicator",
      sourcePart: "radioItem",
      stateAttribute: getStaticAttributeName(spec, "radioItemIndicator", "data-state"),
      uncheckedStateValue: "unchecked",
      visibleAttribute: "data-visible",
    },
    part: "radioItem",
    publicRef: requirePublicRef(spec, "radioItem"),
    role: "menuitemradio",
    stateAttributes: buildRadioItemStateAttributes(spec),
    valueProp: {
      attribute: getStaticAttributeName(spec, "radioItem", "data-value"),
      prop: "value",
      required: true,
      type: "string",
    },
  };
}

function buildRadioContextRecipe(spec: SpecializedAdapterSpec): MenuRadioContextRecipe {
  const provider = getContextRecipe(spec, "menu-radio-group", "provides");
  const consumer = getContextRecipe(spec, "menu-radio-group", "consumes");

  return {
    consumedValues: [...consumer.values],
    consumerPart: "radioItem",
    name: "menu-radio-group",
    providedValues: [...provider.values],
    providerPart: "radioGroup",
    scope: "nearest-radio-group",
  };
}

function buildSubmenuRecipe(
  spec: SpecializedAdapterSpec,
  floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>,
): MenuSubmenuRecipe {
  return {
    ownerTopology: buildSubmenuOwnerTopologyRecipe(floating),
    root: buildSubmenuRootRecipe(spec),
    trigger: buildSubmenuTriggerRecipe(spec),
  };
}

function buildSubmenuOwnerTopologyRecipe(
  floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>,
): MenuSubmenuOwnerTopologyRecipe {
  const floatingBase = {
    optionProps: [...floating.optionProps],
    popupPart: "popup" as const,
    portalPart: "portal" as const,
    positionerPart: "positioner" as const,
  };

  return {
    rootMenu: {
      boundaryParts: ["root", "trigger", "portal", "positioner", "popup"],
      childOwnerPart: "submenuRoot",
      floating: {
        ...floatingBase,
        anchorPart: "trigger",
      },
      ownerKind: "root-menu",
      ownerPart: "root",
      queryScope: "own-root-menu-excluding-submenus",
      refs: {
        popup: "popup",
        portal: "portal",
        positioner: "positioner",
        root: "root",
        trigger: "trigger",
      },
    },
    submenu: {
      boundaryParts: ["submenuRoot", "submenuTrigger", "portal", "positioner", "popup"],
      floating: {
        ...floatingBase,
        anchorPart: "submenuTrigger",
      },
      nestedOwnerPart: "submenuRoot",
      ownerKind: "submenu",
      ownerPart: "submenuRoot",
      parentOwnerKinds: ["root-menu", "submenu"],
      queryScope: "nearest-submenu-root",
      refs: {
        popup: "popup",
        portal: "portal",
        positioner: "positioner",
        root: "submenuRoot",
        trigger: "submenuTrigger",
      },
      triggerPart: "submenuTrigger",
    },
  };
}

function buildSubmenuRootRecipe(spec: SpecializedAdapterSpec): MenuSubmenuRootRecipe {
  const part = getPartRecipe(spec, "submenuRoot");
  const closeDelay = getPropForTarget(spec, "closeDelay", "submenuRoot");
  if (part.defaultElement !== "div") {
    throw new Error("Menu specialized adapter spec requires submenuRoot div anatomy.");
  }
  if (closeDelay.defaultValue !== "200" || closeDelay.type !== "number") {
    throw new Error("Menu specialized adapter spec requires submenuRoot closeDelay prop metadata.");
  }

  return {
    branchKind: "submenu-root",
    closeDelay: {
      attribute: getStaticAttributeName(spec, "submenuRoot", "data-close-delay"),
      defaultValue: "200",
      prop: "closeDelay",
      type: "number",
    },
    defaultElement: "div",
    ownerBoundary: "submenu",
    part: "submenuRoot",
    publicRef: requirePublicRef(spec, "submenuRoot"),
    stateAttributes: {
      closedValue: "closed",
      openValue: "open",
      state: getStaticAttributeName(spec, "submenuRoot", "data-state"),
    },
  };
}

function buildSubmenuTriggerRecipe(spec: SpecializedAdapterSpec): MenuSubmenuTriggerRecipe {
  const part = getPartRecipe(spec, "submenuTrigger");
  if (part.defaultElement !== "div" || part.role !== "menuitem") {
    throw new Error("Menu specialized adapter spec requires submenuTrigger menuitem anatomy.");
  }

  return {
    branchKind: "submenu-trigger",
    defaultElement: "div",
    disabled: buildDisabledRecipe(spec, "submenuTrigger"),
    disclosure: {
      ariaExpanded: getStaticAttributeName(spec, "submenuTrigger", "aria-expanded"),
      ariaHaspopup: {
        attribute: getStaticAttributeName(spec, "submenuTrigger", "aria-haspopup"),
        value: getStaticAttributeValue(spec, "submenuTrigger", "aria-haspopup") as "menu",
      },
      closedStateValue: "closed",
      openStateValue: "open",
      stateAttribute: getStaticAttributeName(spec, "submenuTrigger", "data-state"),
    },
    ownerBoundary: "submenu",
    part: "submenuTrigger",
    publicRef: requirePublicRef(spec, "submenuTrigger"),
    role: "menuitem",
    tabIndex: {
      attribute: getStaticAttributeName(spec, "submenuTrigger", "tabindex"),
      value: getStaticAttributeValue(spec, "submenuTrigger", "tabindex") as "0",
    },
  };
}

function validateRootParts(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires rootParts metadata."];
  }

  const errors: string[] = [];
  for (const part of MENU_REQUIRED_ROOT_PARTS) {
    if (value[part] !== part) {
      errors.push(
        `Menu specialized adapter spec rootParts.${part} "${String(value[part])}" must be "${part}".`,
      );
    }
  }

  return errors;
}

function validateEventRecipe(
  spec: SpecializedAdapterSpec,
  eventName: "checkedChange" | "closeComplete" | "openChange" | "valueChange",
  value: unknown,
  mustBeCancelable: boolean,
): string[] {
  if (!isRecord(value)) {
    return [`Menu specialized adapter spec requires ${eventName} recipe metadata.`];
  }

  const errors: string[] = [];
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event) return errors;

  errors.push(
    ...validateEventField(eventName, "callbackProp", value.callbackProp, event.callbackProp),
  );
  errors.push(
    ...validateEventField(eventName, "detailsType", value.detailsType, event.detailsType),
  );
  errors.push(...validateEventField(eventName, "domEvent", value.domEvent, event.domEvent));
  errors.push(
    ...validateEventField(eventName, "valueProperty", value.valueProperty, event.valueProperty),
  );
  if (mustBeCancelable && value.cancelable !== true) {
    errors.push(`Menu specialized adapter spec ${eventName} event must be cancelable.`);
  }

  return errors;
}

function validateEventField(
  eventName: string,
  fieldName: string,
  actual: unknown,
  expected: unknown,
): string[] {
  if (actual === expected) return [];

  return [
    `Menu specialized adapter spec ${eventName} ${fieldName} "${String(actual)}" must match event ${fieldName} "${String(expected)}".`,
  ];
}

function validateFloating(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires floating metadata."];
  }

  const errors: string[] = [];
  const expectedParts = {
    anchorPart: "trigger",
    popupPart: "popup",
    portalPart: "portal",
    positionerPart: "positioner",
  } as const;
  for (const [fieldName, expected] of Object.entries(expectedParts)) {
    if (value[fieldName] !== expected) {
      errors.push(
        `Menu specialized adapter spec floating ${fieldName} "${String(value[fieldName])}" must be "${expected}".`,
      );
    }
  }

  const optionProps = Array.isArray(value.optionProps) ? value.optionProps : [];
  const missing = MENU_FLOATING_OPTION_PROPS.filter((prop) => !optionProps.includes(prop));
  if (missing.length > 0) {
    errors.push(
      `Menu specialized adapter spec floating optionProps must include ${MENU_FLOATING_OPTION_PROPS.join(", ")}.`,
    );
  }

  return errors;
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires namespace metadata."];
  }

  const errors: string[] = [];
  const expectedNamespace = buildNamespaceRecipe(spec);
  if (value.namespace !== "Menu") {
    errors.push(
      `Menu specialized adapter spec namespace "${String(value.namespace)}" must be "Menu".`,
    );
  }
  if (value.defaultExport !== "Menu") {
    errors.push(
      `Menu specialized adapter spec namespace defaultExport "${String(value.defaultExport)}" must be "Menu".`,
    );
  }
  if (value.defaultNamespace !== true) {
    errors.push("Menu specialized adapter spec namespace must keep defaultNamespace enabled.");
  }

  const memberParts = Array.isArray(value.memberParts) ? value.memberParts : [];
  const expectedMemberParts = spec.exports.members.map((member) => member.part);
  if (!arraysEqual(memberParts, expectedMemberParts)) {
    errors.push(
      "Menu specialized adapter spec namespace memberParts must match exported member parts.",
    );
  }
  if (!recordsEqual(value.objectEntries, expectedNamespace.objectEntries)) {
    errors.push(
      "Menu specialized adapter spec namespace objectEntries must match exported member order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expectedNamespace.namedExports)) {
    errors.push(
      "Menu specialized adapter spec namespace namedExports must match generated named export order.",
    );
  }

  return errors;
}

function validateCheckboxItem(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires checkboxItem recipe metadata."];
  }

  const errors: string[] = [];
  const expected = buildCheckboxItemRecipe(spec);
  if (value.branchKind !== "checkbox-item") {
    errors.push(
      `Menu specialized adapter spec checkboxItem branchKind "${String(value.branchKind)}" must be "checkbox-item".`,
    );
  }
  if (value.part !== "checkboxItem") {
    errors.push(
      `Menu specialized adapter spec checkboxItem part "${String(value.part)}" must be "checkboxItem".`,
    );
  }
  if (value.defaultElement !== "div") {
    errors.push(
      `Menu specialized adapter spec checkboxItem defaultElement "${String(value.defaultElement)}" must be "div".`,
    );
  }
  if (value.role !== "menuitemcheckbox") {
    errors.push(
      `Menu specialized adapter spec checkboxItem role "${String(value.role)}" must be "menuitemcheckbox".`,
    );
  }
  if (value.publicRef !== true) {
    errors.push("Menu specialized adapter spec checkboxItem branch must expose a public ref.");
  }
  if (!recordsEqual(value.checkedState, expected.checkedState)) {
    const actualDefaultProp = isRecord(value.checkedState)
      ? String(value.checkedState.defaultProp)
      : "undefined";
    errors.push(
      `Menu specialized adapter spec checkboxItem defaultProp "${actualDefaultProp}" must be "defaultChecked".`,
    );
  }
  if (!recordsEqual(value.closeOnClick, expected.closeOnClick)) {
    errors.push(
      `Menu specialized adapter spec checkboxItem closeOnClick metadata must match contract defaults.`,
    );
  }
  if (!recordsEqual(value.disabled, expected.disabled)) {
    errors.push(
      "Menu specialized adapter spec checkboxItem branch must include disabled metadata.",
    );
  }

  errors.push(...validateEventForwarding(spec, "checkedChange", value.eventForwarding, true));
  errors.push(...validateCheckboxIndicatorProjection(value.indicatorProjection));
  if (!recordsEqual(value.stateAttributes, expected.stateAttributes)) {
    errors.push(
      "Menu specialized adapter spec checkboxItem stateAttributes must match contract attributes.",
    );
  }

  return errors;
}

function validateEventForwarding(
  spec: SpecializedAdapterSpec,
  eventName: "checkedChange" | "valueChange",
  value: unknown,
  mustBeCancelable: boolean,
): string[] {
  if (!isRecord(value)) {
    return [`Menu specialized adapter spec requires ${eventName} event forwarding metadata.`];
  }

  const errors = validateEventRecipe(spec, eventName, value, mustBeCancelable);
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event) {
    errors.push(`Menu specialized adapter spec requires ${eventName} event.`);
    return errors;
  }
  errors.push(...validateEventField(eventName, "emitsFrom", value.emitsFrom, event.emitsFrom));
  errors.push(
    ...validateEventField(eventName, "callbackTiming", value.callbackTiming, event.callbackTiming),
  );
  errors.push(...validateEventField(eventName, "valueType", value.valueType, event.valueType));
  const expectedResync =
    eventName === "checkedChange" ? "syncCheckboxItemState" : "syncRadioGroupState";
  if (value.controlledResync !== expectedResync) {
    errors.push(
      `Menu specialized adapter spec ${eventName} controlledResync "${String(value.controlledResync)}" must be "${expectedResync}".`,
    );
  }

  return errors;
}

function validateCheckboxIndicatorProjection(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires checkboxItem indicatorProjection metadata."];
  }

  const expected = {
    ariaHidden: "true",
    checkedStateValue: "checked",
    hiddenAttribute: "data-hidden",
    indicatorPart: "checkboxItemIndicator",
    sourcePart: "checkboxItem",
    stateAttribute: "data-state",
    uncheckedStateValue: "unchecked",
    visibleAttribute: "data-visible",
  };
  const errors: string[] = [];
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) {
      errors.push(
        `Menu specialized adapter spec checkboxItem ${field} "${String(value[field])}" must be "${expectedValue}".`,
      );
    }
  }

  return errors;
}

function validateRadioGroup(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires radioGroup recipe metadata."];
  }

  const errors: string[] = [];
  const expected = buildRadioGroupRecipe(spec);
  if (value.branchKind !== "radio-group") {
    errors.push(
      `Menu specialized adapter spec radioGroup branchKind "${String(value.branchKind)}" must be "radio-group".`,
    );
  }
  if (value.part !== "radioGroup") {
    errors.push(
      `Menu specialized adapter spec radioGroup part "${String(value.part)}" must be "radioGroup".`,
    );
  }
  if (value.defaultElement !== "div") {
    errors.push(
      `Menu specialized adapter spec radioGroup defaultElement "${String(value.defaultElement)}" must be "div".`,
    );
  }
  if (value.role !== "group") {
    errors.push(
      `Menu specialized adapter spec radioGroup role "${String(value.role)}" must be "group".`,
    );
  }
  if (value.publicRef !== true) {
    errors.push("Menu specialized adapter spec radioGroup branch must expose a public ref.");
  }
  errors.push(...validateRadioContext(value.context, expected.context));
  if (!recordsEqual(value.valueState, expected.valueState)) {
    errors.push(
      "Menu specialized adapter spec radioGroup valueState must match contract state model.",
    );
  }
  errors.push(...validateEventForwarding(spec, "valueChange", value.eventForwarding, true));

  return errors;
}

function validateRadioContext(value: unknown, expected: MenuRadioContextRecipe): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires radioGroup context metadata."];
  }

  const errors: string[] = [];
  for (const [field, expectedValue] of Object.entries(expected)) {
    const actual = value[field];
    if (Array.isArray(expectedValue)) {
      if (!arraysEqual(asArray(actual), expectedValue)) {
        errors.push(
          `Menu specialized adapter spec radioGroup context ${field} must match contract values.`,
        );
      }
      continue;
    }
    if (actual !== expectedValue) {
      errors.push(
        `Menu specialized adapter spec radioGroup context ${field} "${String(actual)}" must be "${expectedValue}".`,
      );
    }
  }

  return errors;
}

function validateRadioItem(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires radioItem recipe metadata."];
  }

  const errors: string[] = [];
  const expected = buildRadioItemRecipe(spec);
  if (value.branchKind !== "radio-item") {
    errors.push(
      `Menu specialized adapter spec radioItem branchKind "${String(value.branchKind)}" must be "radio-item".`,
    );
  }
  if (value.part !== "radioItem") {
    errors.push(
      `Menu specialized adapter spec radioItem part "${String(value.part)}" must be "radioItem".`,
    );
  }
  if (value.defaultElement !== "div") {
    errors.push(
      `Menu specialized adapter spec radioItem defaultElement "${String(value.defaultElement)}" must be "div".`,
    );
  }
  if (value.role !== "menuitemradio") {
    errors.push(
      `Menu specialized adapter spec radioItem role "${String(value.role)}" must be "menuitemradio".`,
    );
  }
  if (value.publicRef !== true) {
    errors.push("Menu specialized adapter spec radioItem branch must expose a public ref.");
  }
  if (!recordsEqual(value.checkedState, expected.checkedState)) {
    errors.push(
      "Menu specialized adapter spec radioItem checkedState must match contract state model.",
    );
  }
  if (!recordsEqual(value.closeOnClick, expected.closeOnClick)) {
    errors.push(
      "Menu specialized adapter spec radioItem closeOnClick metadata must match contract defaults.",
    );
  }
  if (!recordsEqual(value.disabled, expected.disabled)) {
    errors.push("Menu specialized adapter spec radioItem branch must include disabled metadata.");
  }
  if (!recordsEqual(value.contextConsumer, expected.contextConsumer)) {
    errors.push(
      "Menu specialized adapter spec radioItem contextConsumer must match radio group context.",
    );
  }
  if (!recordsEqual(value.stateAttributes, expected.stateAttributes)) {
    errors.push(
      "Menu specialized adapter spec radioItem stateAttributes must match contract attributes.",
    );
  }
  errors.push(...validateRadioValueProp(value.valueProp, expected.valueProp));
  errors.push(...validateRadioIndicatorProjection(value.indicatorProjection));

  return errors;
}

function validateRadioValueProp(
  value: unknown,
  expected: MenuRadioItemRecipe["valueProp"],
): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires radioItem value prop metadata."];
  }

  const errors: string[] = [];
  if (value.required !== true) {
    errors.push("Menu specialized adapter spec radioItem value prop must be required.");
  }
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) {
      errors.push(
        `Menu specialized adapter spec radioItem valueProp.${field} "${String(value[field])}" must be "${String(expectedValue)}".`,
      );
    }
  }

  return errors;
}

function validateRadioIndicatorProjection(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires radioItem indicatorProjection metadata."];
  }

  const expected = {
    ariaHidden: "true",
    checkedStateValue: "checked",
    hiddenAttribute: "data-hidden",
    indicatorPart: "radioItemIndicator",
    sourcePart: "radioItem",
    stateAttribute: "data-state",
    uncheckedStateValue: "unchecked",
    visibleAttribute: "data-visible",
  };
  const errors: string[] = [];
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) {
      errors.push(
        `Menu specialized adapter spec radioItem ${field} "${String(value[field])}" must be "${expectedValue}".`,
      );
    }
  }

  return errors;
}

function validateSubmenu(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires submenu recipe metadata."];
  }

  const errors: string[] = [];
  errors.push(...validateForbiddenSubmenuModels(value));
  errors.push(...validateSubmenuOwnerTopology(spec, value.ownerTopology));
  errors.push(...validateSubmenuRoot(spec, value.root));
  errors.push(...validateSubmenuTrigger(spec, value.trigger));

  return errors;
}

function validateSubmenuOwnerTopology(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires submenu owner topology metadata."];
  }

  const floating = spec.renderPlan.floating;
  if (!floating) {
    return ["Menu specialized adapter spec requires floating metadata for submenu owner topology."];
  }

  const errors: string[] = [];
  const expected = buildSubmenuOwnerTopologyRecipe(floating);
  const rootMenu = isRecord(value.rootMenu) ? value.rootMenu : undefined;
  const submenu = isRecord(value.submenu) ? value.submenu : undefined;

  if (!rootMenu) {
    errors.push("Menu specialized adapter spec requires root menu owner topology metadata.");
  } else {
    if (rootMenu.ownerPart !== "root") {
      errors.push(
        `Menu specialized adapter spec rootMenu ownerPart "${String(rootMenu.ownerPart)}" must be "root".`,
      );
    }
    if (!recordsEqual(rootMenu, expected.rootMenu)) {
      errors.push(
        "Menu specialized adapter spec rootMenu owner topology must match root menu owner facts.",
      );
    }
  }

  if (!submenu) {
    errors.push("Menu specialized adapter spec requires submenu owner topology metadata.");
  } else {
    if (submenu.ownerPart !== "submenuRoot") {
      errors.push(
        `Menu specialized adapter spec submenu ownerPart "${String(submenu.ownerPart)}" must be "submenuRoot".`,
      );
    }
    if (!recordsEqual(submenu, expected.submenu)) {
      errors.push("Menu specialized adapter spec submenu owner topology must match submenu facts.");
    }
  }

  if (rootMenu?.ownerPart === submenu?.ownerPart) {
    errors.push(
      "Menu specialized adapter spec root menu and submenu owners must use distinct owner parts.",
    );
  }

  return errors;
}

function validateSubmenuRoot(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires submenuRoot recipe metadata."];
  }

  const errors: string[] = [];
  const expected = buildSubmenuRootRecipe(spec);
  if (value.branchKind !== "submenu-root") {
    errors.push(
      `Menu specialized adapter spec submenuRoot branchKind "${String(value.branchKind)}" must be "submenu-root".`,
    );
  }
  if (value.part !== "submenuRoot") {
    errors.push(
      `Menu specialized adapter spec submenuRoot part "${String(value.part)}" must be "submenuRoot".`,
    );
  }
  if (value.defaultElement !== "div") {
    errors.push(
      `Menu specialized adapter spec submenuRoot defaultElement "${String(value.defaultElement)}" must be "div".`,
    );
  }
  if (value.ownerBoundary !== "submenu") {
    errors.push(
      `Menu specialized adapter spec submenuRoot ownerBoundary "${String(value.ownerBoundary)}" must be "submenu".`,
    );
  }
  if (value.publicRef !== true) {
    errors.push("Menu specialized adapter spec submenuRoot branch must expose a public ref.");
  }
  if (!recordsEqual(value.closeDelay, expected.closeDelay)) {
    errors.push(
      "Menu specialized adapter spec submenuRoot closeDelay metadata must match contract defaults.",
    );
  }
  if (!recordsEqual(value.stateAttributes, expected.stateAttributes)) {
    errors.push(
      "Menu specialized adapter spec submenuRoot stateAttributes must match contract attributes.",
    );
  }

  return errors;
}

function validateSubmenuTrigger(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Menu specialized adapter spec requires submenuTrigger recipe metadata."];
  }

  const errors: string[] = [];
  const expected = buildSubmenuTriggerRecipe(spec);
  if (value.branchKind !== "submenu-trigger") {
    errors.push(
      `Menu specialized adapter spec submenuTrigger branchKind "${String(value.branchKind)}" must be "submenu-trigger".`,
    );
  }
  if (value.part !== "submenuTrigger") {
    errors.push(
      `Menu specialized adapter spec submenuTrigger part "${String(value.part)}" must be "submenuTrigger".`,
    );
  }
  if (value.defaultElement !== "div") {
    errors.push(
      `Menu specialized adapter spec submenuTrigger defaultElement "${String(value.defaultElement)}" must be "div".`,
    );
  }
  if (value.ownerBoundary !== "submenu") {
    errors.push(
      `Menu specialized adapter spec submenuTrigger ownerBoundary "${String(value.ownerBoundary)}" must be "submenu".`,
    );
  }
  if (value.publicRef !== true) {
    errors.push("Menu specialized adapter spec submenuTrigger branch must expose a public ref.");
  }
  if (value.role !== "menuitem") {
    errors.push(
      `Menu specialized adapter spec submenuTrigger role "${String(value.role)}" must be "menuitem".`,
    );
  }
  if (!recordsEqual(value.disabled, expected.disabled)) {
    errors.push("Menu specialized adapter spec submenuTrigger must include disabled metadata.");
  }
  if (!recordsEqual(value.disclosure, expected.disclosure)) {
    errors.push(
      "Menu specialized adapter spec submenuTrigger disclosure metadata must match contract attributes.",
    );
  }
  if (!recordsEqual(value.tabIndex, expected.tabIndex)) {
    errors.push("Menu specialized adapter spec submenuTrigger tabIndex must match contract value.");
  }

  return errors;
}

function validateForbiddenSubmenuModels(value: unknown): string[] {
  const found = new Set<string>();

  function visit(candidate: unknown): void {
    if (!isRecord(candidate)) return;
    for (const [key, nestedValue] of Object.entries(candidate)) {
      if (MENU_FORBIDDEN_SUBMENU_MODEL_KEYS.includes(key as never)) {
        found.add(key);
      }
      visit(nestedValue);
    }
  }

  visit(value);

  return MENU_FORBIDDEN_SUBMENU_MODEL_KEYS.filter((key) => found.has(key)).map(
    (key) =>
      `Menu specialized adapter spec must keep ${key} in Runtime, not submenu adapter metadata.`,
  );
}

function validateStaticBranches(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Menu specialized adapter spec requires staticBranches metadata."];
  }

  const expectedParts = MENU_STATIC_BRANCH_EXPECTATIONS.map((expectation) => expectation.part);
  const unexpectedErrors = value.flatMap((candidate) => {
    if (!isRecord(candidate))
      return ["Menu specialized adapter spec staticBranches must contain objects."];
    if (!expectedParts.includes(candidate.part as (typeof expectedParts)[number])) {
      return [
        `Menu specialized adapter spec staticBranches contains unexpected branch for ${String(candidate.part)}.`,
      ];
    }

    return [];
  });

  return [
    ...unexpectedErrors,
    ...MENU_STATIC_BRANCH_EXPECTATIONS.flatMap((expectation) => {
      const branch = value.find(
        (candidate): candidate is Record<string, unknown> =>
          isRecord(candidate) && candidate.part === expectation.part,
      );
      if (!branch) {
        return [`Menu specialized adapter spec requires ${expectation.part} static branch.`];
      }

      return validateStaticBranch(spec, branch, expectation);
    }),
  ];
}

function validateStaticBranch(
  spec: SpecializedAdapterSpec,
  branch: Record<string, unknown>,
  expectation: (typeof MENU_STATIC_BRANCH_EXPECTATIONS)[number],
): string[] {
  const errors: string[] = [];
  const part = getPartRecipe(spec, expectation.part);
  if (branch.branchKind !== expectation.branchKind) {
    errors.push(
      `Menu specialized adapter spec ${expectation.part} branchKind "${String(branch.branchKind)}" must be "${expectation.branchKind}".`,
    );
  }
  if (branch.defaultElement !== part.defaultElement) {
    errors.push(
      `Menu specialized adapter spec ${expectation.part} defaultElement "${String(branch.defaultElement)}" must be "${part.defaultElement}".`,
    );
  }
  if (branch.publicRef !== true) {
    errors.push(
      `Menu specialized adapter spec ${expectation.part} branch must expose a public ref.`,
    );
  }
  if (part.role && branch.role !== part.role) {
    errors.push(
      `Menu specialized adapter spec ${expectation.part} role "${String(branch.role)}" must be "${part.role}".`,
    );
  }

  if ("disabled" in expectation && expectation.disabled) {
    if (!recordsEqual(branch.disabled, buildDisabledRecipe(spec, expectation.part))) {
      errors.push(
        `Menu specialized adapter spec ${expectation.part} branch must include disabled metadata.`,
      );
    }
  }

  if ("closeOnClickDefault" in expectation) {
    const closeOnClick = isRecord(branch.closeOnClick) ? branch.closeOnClick : undefined;
    if (!closeOnClick) {
      errors.push(
        `Menu specialized adapter spec ${expectation.part} branch must include closeOnClick metadata.`,
      );
    } else if (closeOnClick.defaultValue !== expectation.closeOnClickDefault) {
      errors.push(
        `Menu specialized adapter spec ${expectation.part} closeOnClick defaultValue "${String(closeOnClick.defaultValue)}" must be "${expectation.closeOnClickDefault}".`,
      );
    }
  }

  if (
    "ariaAttributes" in expectation &&
    !recordsEqual(
      branch.ariaAttributes,
      getConstantAttributes(spec, expectation.part, ["aria-orientation"]),
    )
  ) {
    errors.push(
      `Menu specialized adapter spec ${expectation.part} ariaAttributes must match contract attributes.`,
    );
  }

  return errors;
}

function getPartRecipe(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Menu specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
}

function requirePublicRef(spec: SpecializedAdapterSpec, partName: string): true {
  if (!hasPublicRef(spec, partName)) {
    throw new Error(`Menu specialized adapter spec requires ${partName} public ref metadata.`);
  }

  return true;
}

function getPropDefaultForTarget(
  spec: SpecializedAdapterSpec,
  propName: string,
  target: string,
): string {
  const prop = spec.props.find((candidate) => {
    return candidate.name === propName && candidate.targets?.includes(target);
  });
  if (!prop?.defaultValue) {
    throw new Error(
      `Menu specialized adapter spec requires ${propName} default for ${target} branch.`,
    );
  }

  return prop.defaultValue;
}

function getPropForTarget(spec: SpecializedAdapterSpec, propName: string, target: string) {
  const prop = spec.props.find((candidate) => {
    return candidate.name === propName && candidate.targets?.includes(target);
  });
  if (!prop) {
    throw new Error(`Menu specialized adapter spec requires ${propName} prop for ${target}.`);
  }

  return prop;
}

function getContextRecipe(
  spec: SpecializedAdapterSpec,
  name: string,
  direction: "consumes" | "provides",
) {
  const context = spec.context.find(
    (candidate) => candidate.name === name && candidate.direction === direction,
  );
  if (!context) {
    throw new Error(
      `Menu specialized adapter spec requires ${name} ${direction} context metadata.`,
    );
  }

  return context;
}

function getStaticAttributeName<T extends string>(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: T,
): T {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (!attribute) {
    throw new Error(
      `Menu specialized adapter spec requires ${attributeName} static attribute for ${partName}.`,
    );
  }

  return attributeName;
}

function requireStaticAttribute(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): void {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (!attribute) {
    throw new Error(
      `Menu specialized adapter spec requires ${attributeName} static attribute for ${partName}.`,
    );
  }
}

function buildCheckboxStateAttributes(
  spec: SpecializedAdapterSpec,
): MenuCheckboxItemRecipe["stateAttributes"] {
  requireStaticAttribute(spec, "checkboxItem", "aria-checked");
  requireStaticAttribute(spec, "checkboxItem", "data-checked");
  requireStaticAttribute(spec, "checkboxItem", "data-unchecked");

  return {
    ariaChecked: "aria-checked",
    checked: "data-checked",
    unchecked: "data-unchecked",
  };
}

function buildRadioItemStateAttributes(
  spec: SpecializedAdapterSpec,
): MenuRadioItemRecipe["stateAttributes"] {
  requireStaticAttribute(spec, "radioItem", "aria-checked");
  requireStaticAttribute(spec, "radioItem", "data-checked");
  requireStaticAttribute(spec, "radioItem", "data-unchecked");

  return {
    ariaChecked: "aria-checked",
    checked: "data-checked",
    unchecked: "data-unchecked",
  };
}

function getStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (!attribute?.value) {
    throw new Error(
      `Menu specialized adapter spec requires ${attributeName} static attribute value for ${partName}.`,
    );
  }

  return attribute.value;
}

function getConstantAttributes(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeNames: readonly string[],
): { name: string; value: string }[] {
  return attributeNames.map((attributeName) => {
    const attribute = spec.renderPlan.staticAttributes.find(
      (candidate) =>
        candidate.part === partName &&
        candidate.name === attributeName &&
        candidate.source === "constant" &&
        typeof candidate.value === "string",
    );
    if (!attribute || typeof attribute.value !== "string") {
      throw new Error(
        `Menu specialized adapter spec requires ${attributeName} constant attribute for ${partName}.`,
      );
    }

    return { name: attribute.name, value: attribute.value };
  });
}

function buildDisabledRecipe(
  spec: SpecializedAdapterSpec,
  partName: string,
): NonNullable<MenuStaticBranchRecipe["disabled"]> {
  for (const attributeName of ["aria-disabled", "data-disabled"]) {
    const attribute = spec.renderPlan.staticAttributes.find(
      (candidate) => candidate.part === partName && candidate.name === attributeName,
    );
    if (!attribute) {
      throw new Error(
        `Menu specialized adapter spec requires ${attributeName} static attribute for ${partName}.`,
      );
    }
  }

  return {
    ariaAttribute: "aria-disabled",
    dataAttribute: "data-disabled",
    prop: "disabled",
  };
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Menu specialized adapter spec requires ${partName} part.`);
  }
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function getStateModel(spec: SpecializedAdapterSpec, name: string) {
  const state = spec.stateModels.find((candidate) => candidate.name === name);
  if (!state) {
    throw new Error(`Menu specialized adapter spec is missing ${name} state model.`);
  }

  return state;
}

function getEvent(spec: SpecializedAdapterSpec, name: string): MenuRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`Menu specialized adapter spec requires ${name} event.`);
  }
  if (!event.callbackProp || !event.detailsType || !event.domEvent || !event.valueProperty) {
    throw new Error(`Menu specialized adapter spec requires complete ${name} event metadata.`);
  }

  return event as MenuRequiredEvent;
}

function hasEvent(spec: SpecializedAdapterSpec, name: string): boolean {
  return spec.events.some((event) => event.name === name);
}

function getSetter(spec: SpecializedAdapterSpec, method: string) {
  const setter = spec.setterSync.find((candidate) => candidate.method === method);
  if (!setter) {
    throw new Error(`Menu specialized adapter spec requires ${method} setter sync.`);
  }

  return setter;
}

function hasSetter(spec: SpecializedAdapterSpec, method: string): boolean {
  return spec.setterSync.some((setter) => setter.method === method);
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
