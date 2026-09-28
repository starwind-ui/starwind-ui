import type { AdapterTimedFloatingOverlayFacts } from "../../../framework-adapters/types.js";
import type { ConnectionRecipe } from "../plan.js";
import { popoverPlan } from "../plan.js";
import { popoverSurfacePolicy } from "../popover-surface.js";
export type TimedRecipe = ConnectionRecipe & {
  component: "Tooltip" | "PreviewCard";
  disabledSetter?: "setDisabled";
  surface: {
    // Timed targets connect through their existing portal lifecycle; no Popover part gate.
    requiredParts: readonly string[];
    requirePortal: boolean;
    connect: readonly (typeof popoverSurfacePolicy.connect)[number][];
  };
};
const connection = {
  constructorInputs: [
    "closeDelay",
    "closeOnEscape",
    "closeOnOutsideInteract",
    "disableHoverableContent",
    "openDelay",
  ],
  model: {
    name: "open",
    default: "defaultOpen",
    getter: "getOpen",
    setter: "setOpen",
    event: "openChange",
    type: "boolean",
    codec: "boolean",
    fallback: false,
  },
  construction: "closed",
  restoration: "if-different",
  retainAcceptedTrigger: true,
  connect: popoverPlan.connect,
  publication: "immediate",
  cleanup: ["retain-state", "unsubscribe", "clear-owner", "destroy"],
  surface: { requiredParts: [], requirePortal: false, connect: popoverSurfacePolicy.connect },
} as const;
export const tooltipRecipe: TimedRecipe = {
  ...connection,
  surface: { ...connection.surface, requirePortal: true },
  component: "Tooltip",
  initialInputs: ["disabled"],
  disabledSetter: "setDisabled",
  proposal: {
    callback: "onOpenChange",
    details: "TooltipOpenChangeDetails",
    arguments: "value-details",
  },
};
export const previewCardRecipe: TimedRecipe = {
  ...connection,
  component: "PreviewCard",
  proposal: {
    callback: "onOpenChange",
    details: "PreviewCardOpenChangeDetails",
    arguments: "value-details",
  },
};
export function timedRecipe(facts: AdapterTimedFloatingOverlayFacts): TimedRecipe {
  if (facts.displayName === "Tooltip") return tooltipRecipe;
  if (facts.displayName === "PreviewCard") return previewCardRecipe;
  throw new TypeError(`Unsupported timed recipe ${facts.displayName}`);
}
export function timedPlacementInputs(facts: AdapterTimedFloatingOverlayFacts): [string, string][] {
  return (["side", "align", "sideOffset", "avoidCollisions"] as const).map((name) => [
    facts.attrs[name],
    facts.props[name].name,
  ]);
}

export function timedPartPolicy(
  f: AdapterTimedFloatingOverlayFacts,
  part: "positioner" | "popup" | "arrow" | "backdrop" | "viewport",
): import("../part-policy.js").PartPolicy {
  const attributes: import("../part-policy.js").PartPolicy["attributes"] = [
    { name: f.parts[part]!.discoveryAttribute, value: "" },
    { name: "data-sw-part", value: part },
    { name: "data-state", value: "closed" },
  ];
  if (part === "popup" || part === "positioner")
    for (const [name, input] of timedPlacementInputs(f))
      attributes.push({
        name,
        input,
        ...(input === f.props.avoidCollisions.name ? { boolean: true as const } : {}),
      });
  if (part === "popup")
    attributes.push(
      { name: "role", value: f.popupRole },
      { name: f.attrs.popupHidden, value: true },
    );
  if (part === "backdrop") attributes.push({ name: f.attrs.backdropHidden!, value: true });
  return { attributes, composition: "native" };
}

/** Anchor child composition must run its disabled guard before the child click callback. */
export const timedTriggerPolicy = { state: "closed", guardedClickOrder: "parent-first" } as const;
