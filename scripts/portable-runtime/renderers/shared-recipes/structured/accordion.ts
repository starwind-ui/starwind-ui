import { accordionRuntimeAdapterContract } from "../../../contracts/primitive/components/accordion.js";
import type { ConnectionRecipe } from "./plan.js";
import type { RootFrame } from "./root-frame.js";

/** Accordion owns selection semantics without inheriting Popover's closed restoration. */
export type AccordionPlan = ConnectionRecipe & { component: "Accordion" };
export const accordionPlan: AccordionPlan = {
  component: "Accordion",
  constructorInputs: ["type", "collapsible"],
  model: {
    name: "value",
    default: "defaultValue",
    getter: "getValue",
    setter: "setValue",
    event: "valueChange",
    type: "AccordionValue",
    codec: "selection",
    fallback: null,
  },
  proposal: {
    callback: "onValueChange",
    details: "AccordionValueChangeDetails",
    arguments: "details",
  },
  construction: "accepted-seed",
  restoration: "if-different",
  connect: [
    { operation: "retire-previous", after: [] },
    { operation: "create-controller", after: ["retire-previous"] },
    { operation: "subscribe-accepted", after: ["create-controller"] },
    { operation: "restore-state", after: ["subscribe-accepted"] },
    { operation: "render-accepted", after: ["restore-state"] },
    { operation: "publish-connected-model", after: ["render-accepted"] },
  ],
  publication: "immediate",
  cleanup: ["retain-state", "unsubscribe", "clear-owner", "destroy"],
};
const contract = accordionRuntimeAdapterContract;
/** Public shape comes from existing facts; the shared recipe adds explicit render intent. */
export const accordionFrame: RootFrame = {
  component: contract.displayName,
  factory: contract.runtime.factory,
  importSource: contract.runtime.importSource,
  element: contract.parts[0].defaultElement,
  props: contract.props.filter((prop) =>
    prop.name === "value"
      ? "targets" in prop && prop.targets[0] === "root"
      : ["type", "defaultValue", "collapsible"].includes(prop.name),
  ),
  modelAliases: { react: "value", vue: "modelValue", svelte: "value" },
  modelRendering: ["vue", "svelte"],
  attributes: [
    { name: contract.parts[0].discoveryAttribute, source: "marker" },
    { name: "data-sw-part", source: "constant", value: "root" },
    { name: "data-type", source: "input", prop: "type", stringify: false },
    { name: "data-default-value", source: "initial-model" },
    { name: "data-collapsible", source: "input", prop: "collapsible", stringify: true },
    { name: "data-state", source: "constant", value: "closed" },
  ],
};
