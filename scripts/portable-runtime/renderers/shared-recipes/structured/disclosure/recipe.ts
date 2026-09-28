import { collapsibleRuntimeAdapterContract as contract } from "../../../../contracts/primitive/components/collapsible.js";
import type { ConnectionRecipe } from "../plan.js";
import { popoverPlan } from "../plan.js";
export const collapsibleRecipe = {
  component: "Collapsible",
  constructorInputs: ["disabled"],
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
  proposal: {
    callback: "onOpenChange",
    details: "CollapsibleOpenChangeDetails",
    arguments: "value-details",
  },
  construction: "accepted-seed",
  restoration: "if-different",
  connect: popoverPlan.connect,
  publication: "immediate",
  cleanup: ["retain-state", "unsubscribe", "clear-owner", "destroy"],
} as const satisfies ConnectionRecipe;
/** Runtime owns post-connection visibility, disabled and accessibility. Targets project initial facts and refs. */
export const collapsibleParts = {
  trigger: {
    state: "closed",
    expanded: false,
    composition: "native-or-component-root",
    disabledInputs: ["root", "own", "child"],
  },
  panel: {
    state: "closed",
    hidden: true,
    hiddenUntilFound: "until-found",
    visibility: contract.presence.unmountPolicy,
  },
} as const;
export { contract };

/** Restore authored control state through render before a root-disabled reconstruction. */
export function disclosureDisabled(root: string, own: string, child?: string): string {
  const inputs = { root, own: `Boolean(${own})`, child: child ? `Boolean(${child})` : undefined };
  return collapsibleParts.trigger.disabledInputs
    .map((name) => inputs[name])
    .filter(Boolean)
    .join(" || ");
}
