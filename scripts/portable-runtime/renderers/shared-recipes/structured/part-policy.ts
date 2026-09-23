import type {
  AdapterPresenceFloatingOverlayFacts,
  AdapterRepeatedDisclosureFacts,
} from "../../framework-adapters/types.js";
import type { Target } from "./operations.js";

type Attribute =
  | { name: string; value: string | number | boolean }
  | { name: string; input: string; boolean?: true; presence?: true };
export type PartPolicy = {
  attributes: Attribute[];
  composition: "native" | "control-child";
  initialAnimation?: string;
};
export type PopoverPart =
  | "trigger"
  | "portal"
  | "positioner"
  | "popup"
  | "arrow"
  | "backdrop"
  | "title"
  | "description"
  | "close"
  | "viewport";

/** Parts own initial markup; Runtime owns subsequent state, accessibility, and visibility. */
export function popoverPartPolicy(
  f: AdapterPresenceFloatingOverlayFacts,
  part: PopoverPart,
): PartPolicy {
  const attributes: Attribute[] = [{ name: f.attrs[part], value: "" }];
  if (part === "trigger")
    attributes.push(
      { name: f.attrs.triggerType, value: "button" },
      { name: f.attrs.triggerAriaHaspopup, value: "dialog" },
      { name: f.attrs.triggerAriaExpanded, value: "false" },
      { name: f.attrs.triggerState, value: "closed" },
    );
  if (part === "close") attributes.push({ name: f.attrs.closeType, value: "button" });
  if (part === "backdrop")
    attributes.push(
      { name: f.attrs.backdropState, value: "closed" },
      { name: f.attrs.backdropHidden, value: true },
    );
  if (part === "popup" || part === "positioner") {
    attributes.push({ name: f.attrs[`${part}State`], value: "closed" });
    for (const [name, input] of floatingInputs(f))
      attributes.push({
        name,
        input,
        ...(input === f.props.avoidCollisions.name ? { boolean: true as const } : {}),
      });
  }
  if (part === "popup")
    attributes.push(
      { name: f.attrs.popupRole, value: f.parts.popup.role },
      { name: f.attrs.popupTabIndex, value: -1 },
      { name: f.attrs.popupHidden, value: true },
    );
  return { attributes, composition: part === "trigger" ? "control-child" : "native" };
}

export function floatingInputs(f: AdapterPresenceFloatingOverlayFacts): [string, string][] {
  return [
    [f.attrs.floatingSide, f.props.side.name],
    [f.attrs.floatingAlign, f.props.align.name],
    [f.attrs.floatingSideOffset, f.props.sideOffset.name],
    [f.attrs.floatingAvoidCollisions, f.props.avoidCollisions.name],
    [f.attrs.floatingCollisionStrategy, f.props.collisionStrategy.name],
  ];
}

export const accordionPartSemantics = {
  collection: "runtime-observer",
  itemContext: ["disabled"],
  contextConsumers: ["trigger"],
  initialAnimation: "none",
  initialStyleOwner: "runtime",
} as const;

export function accordionPartPolicy(
  f: AdapterRepeatedDisclosureFacts,
  part: "item" | "header" | "trigger" | "panel",
): PartPolicy {
  // Item's existing element printer owns its marker; these are its input/state projections.
  const attributes: Attribute[] =
    part === "item"
      ? [
          { name: f.attrs.itemValue, input: f.props.itemValue.name },
          { name: f.attrs.disabled, input: f.props.disabled.name, presence: true },
          { name: f.attrs.itemState, value: "closed" },
        ]
      : [{ name: f.attrs[part], value: "" }];
  if (part === "trigger")
    attributes.push(
      { name: f.attrs.triggerType, value: "button" },
      { name: f.attrs.triggerExpanded, value: "false" },
      { name: f.attrs.triggerState, value: "closed" },
    );
  if (part === "panel")
    attributes.push(
      { name: f.panelVisibility.stateAttribute, value: "closed" },
      { name: f.panelVisibility.hiddenAttribute, value: true },
    );
  return {
    attributes,
    composition: "native",
    ...(part === "panel" ? { initialAnimation: accordionPartSemantics.initialAnimation } : {}),
  };
}

/** Target syntax operation; the part recipe supplies attribute ownership and values. */
export function partAttributes(target: Target, policy: PartPolicy): string {
  return policy.attributes
    .map((attribute) => {
      const name = target === "react" ? attribute.name : attribute.name.toLowerCase();
      if ("input" in attribute) {
        let input = `${target === "vue" ? "props." : ""}${attribute.input}`;
        if (attribute.boolean) input = `String(${input})`;
        if (attribute.presence) input = `${input} ? ${target === "vue" ? "''" : '""'} : undefined`;
        return target === "vue" ? `:${name}="${input}"` : `${name}={${input}}`;
      }
      if (attribute.value === true) return name;
      if (typeof attribute.value === "number")
        return target === "vue" ? `:${name}="${attribute.value}"` : `${name}={${attribute.value}}`;
      return `${name}=${JSON.stringify(attribute.value)}`;
    })
    .join("\n");
}

export function controlAttributes(policy: PartPolicy, includeType = false): string {
  return policy.attributes
    .filter((attribute) => includeType || attribute.name !== "type")
    .map((attribute) => {
      if (!("value" in attribute)) throw new TypeError("Control attributes must be static.");
      return `${JSON.stringify(attribute.name)}: ${JSON.stringify(attribute.value)},`;
    })
    .join("\n");
}

/** Declared inputs must clear Runtime's last mirrored disabled property on re-enable. */
export function accordionDisabled(item: string, own: string, aria: string): string {
  return `${item} || Boolean(${own}) || ${aria} === true || ${aria} === "true"`;
}
