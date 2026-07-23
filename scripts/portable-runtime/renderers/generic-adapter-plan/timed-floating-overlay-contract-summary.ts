import {
  popoverRuntimeAdapterContract,
  previewCardRuntimeAdapterContract,
  tooltipRuntimeAdapterContract,
} from "../../contracts/primitive/representatives.js";
import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";

export type TimedFloatingOverlayComponentSummary = {
  adapterBoundary: string;
  asChildMerges: string[];
  category: string;
  component: string;
  eventNames: string[];
  invariantChecks: Record<string, boolean>;
  floating?: {
    anchorPart: string;
    optionProps: string[];
    popupPart: string;
    portalPart?: string;
    positionerPart: string;
  };
  optionProps: string[];
  optionalOverlayParts: string[];
  parts: string[];
  popupRole?: string;
  presence?: {
    initialHiddenParts: string[];
    unmountPolicy: string;
  };
  setters: string[];
  state: {
    controlledProp?: string;
    defaultProp?: string;
    runtimeGetter?: string;
    runtimeSetter?: string;
    valueType?: string;
  };
  staticAttributesByPart: Record<string, string[]>;
};

export const timedFloatingOverlayContractSummary = {
  components: [
    summarizeTimedOverlayContract(popoverRuntimeAdapterContract, {
      adapterBoundary: "baseline dialog-like floating overlay",
      optionalOverlayParts: ["arrow", "backdrop", "title", "description", "close", "viewport"],
    }),
    summarizeTimedOverlayContract(tooltipRuntimeAdapterContract, {
      adapterBoundary: "timed descriptive floating overlay",
      optionalOverlayParts: ["arrow"],
    }),
    summarizeTimedOverlayContract(previewCardRuntimeAdapterContract, {
      adapterBoundary: "timed rich preview floating overlay",
      optionalOverlayParts: ["backdrop", "viewport", "arrow"],
    }),
  ],
  runtimeOwnedBehavior: [
    "hover/focus timing",
    "non-interactive tooltip popup rules",
    "aria-describedby wiring",
    "hoverable-content coordination",
    "delayed hide and presence cleanup",
    "portal movement",
    "Floating UI auto-update",
    "controller destroy cleanup",
  ],
  sharedAdapterFacts: [
    "presence-floating-overlay category",
    "open/defaultOpen state with getOpen and setOpen",
    "cancelable openChange event emitted from root",
    "trigger/portal/positioner/popup floating anatomy",
    "side/align/sideOffset/avoidCollisions floating options",
    "runtime-owned hidden popup presence",
  ],
};

function summarizeTimedOverlayContract(
  contract: RuntimeAdapterContract,
  options: {
    adapterBoundary: string;
    optionalOverlayParts: string[];
  },
): TimedFloatingOverlayComponentSummary {
  const openState = contract.stateModels?.find((stateModel) => stateModel.name === "open");
  const openEvent = contract.events?.find((event) => event.name === "openChange");
  const popup = contract.parts.find((part) => part.name === "popup");
  const floating = contract.floating;
  const presence = contract.presence;
  const asChildMerges = contract.asChild?.find((entry) => entry.part === "trigger")?.merges ?? [];
  const staticAttributesByPart = Object.fromEntries(
    contract.parts.map((part) => [
      part.name,
      part.initialAttributes?.map((attribute) => attribute.name) ?? [],
    ]),
  );
  const expectedFloatingOptions = [
    "side",
    "align",
    "sideOffset",
    "avoidCollisions",
    ...(contract.component === "popover" ? ["collisionStrategy"] : []),
  ];
  const expectedFloatingAttributes = [
    "data-state",
    "data-side",
    "data-align",
    "data-side-offset",
    "data-avoid-collisions",
    ...(contract.component === "popover" ? ["data-collision-strategy"] : []),
  ];

  return {
    adapterBoundary: options.adapterBoundary,
    asChildMerges,
    category: contract.category,
    component: contract.component,
    eventNames: contract.events?.map((event) => event.name) ?? [],
    floating: floating
      ? {
          anchorPart: floating.anchorPart,
          optionProps: [...floating.optionProps],
          popupPart: floating.popupPart,
          portalPart: floating.portalPart,
          positionerPart: floating.positionerPart,
        }
      : undefined,
    invariantChecks: {
      "cancelable root openChange":
        openEvent?.cancelable === true && openEvent.emitsFrom === "root",
      "floating anatomy": Boolean(
        floating?.anchorPart === "trigger" &&
        floating.portalPart === "portal" &&
        floating.positionerPart === "positioner" &&
        floating.popupPart === "popup",
      ),
      "floating options": hasExactValues(floating?.optionProps ?? [], expectedFloatingOptions),
      "open state bridge": Boolean(
        openState?.controlledProp === "open" &&
        openState.defaultProp === "defaultOpen" &&
        openState.runtimeGetter === "getOpen" &&
        openState.runtimeSetter === "setOpen" &&
        openState.valueType === "boolean",
      ),
      "presence hidden popup": Boolean(
        presence?.unmountPolicy === "runtime-owned" &&
        presence.initialHiddenParts.includes("popup"),
      ),
      "static floating attrs": ["positioner", "popup"].every((part) =>
        expectedFloatingAttributes.every((attribute) =>
          staticAttributesByPart[part]?.includes(attribute),
        ),
      ),
      "trigger asChild ref": asChildMerges.includes("ref"),
    },
    optionProps: contract.props.filter((prop) => prop.kind === "option").map((prop) => prop.name),
    optionalOverlayParts: options.optionalOverlayParts,
    parts: contract.parts.map((part) => part.name),
    popupRole: popup?.role,
    presence: presence
      ? {
          initialHiddenParts: [...presence.initialHiddenParts],
          unmountPolicy: presence.unmountPolicy,
        }
      : undefined,
    setters: contract.setters?.map((setter) => setter.method) ?? [],
    state: {
      controlledProp: openState?.controlledProp,
      defaultProp: openState?.defaultProp,
      runtimeGetter: openState?.runtimeGetter,
      runtimeSetter: openState?.runtimeSetter,
      valueType: openState?.valueType,
    },
    staticAttributesByPart,
  };
}

function hasExactValues(actual: readonly string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}
