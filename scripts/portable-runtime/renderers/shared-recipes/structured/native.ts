import { alertDialogRuntimeAdapterContract } from "../../../contracts/primitive/components/alert-dialog.js";
import { dialogRuntimeAdapterContract } from "../../../contracts/primitive/components/dialog.js";
import { drawerRuntimeAdapterContract } from "../../../contracts/primitive/components/drawer.js";
import { printNativeFrame } from "./native-frame.js";
import type { Target } from "./operations.js";
import { type ConnectionRecipe, popoverPlan } from "./plan.js";
export const nativeContracts = {
  Dialog: dialogRuntimeAdapterContract,
  AlertDialog: alertDialogRuntimeAdapterContract,
  Drawer: drawerRuntimeAdapterContract,
};
export type NativeComponent = keyof typeof nativeContracts;
export type NativeSurfaceOperation = "activate-placement" | "connect-controller";
export type NativeRecipe = ConnectionRecipe & {
  component: NativeComponent;
  controlComposition: { trigger: "native-or-component-root" };
  controlRefresh: { method: "refresh"; schedule: "microtask" };
  surface: {
    connection: readonly NativeSurfaceOperation[];
    portal: boolean;
    requiredPart: "popup";
    captures: readonly string[];
  };
};
/** These controllers use Dialog's native-open transaction on first connection. Later connections restore accepted state silently. */
export function nativeRecipe(component: NativeComponent): NativeRecipe {
  const contract = nativeContracts[component];
  return {
    component,
    constructorInputs: ["closeOnEscape", "closeOnOutsideInteract", "modal"],
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
      details: `${component}OpenChangeDetails`,
      arguments: "value-details",
    },
    completion: { callback: "onCloseComplete", details: `${component}CloseCompleteDetails` },
    construction: "initial-seed-then-closed",
    restoration: "open-on-reconnect",
    connect: popoverPlan.connect.filter((step) => step.operation !== "publish-connected-model"),
    publication: "immediate",
    cleanup: ["retain-state", "unsubscribe", "clear-owner", "destroy"],
    controlComposition: { trigger: "native-or-component-root" },
    controlRefresh: { method: "refresh", schedule: "microtask" },
    surface: {
      connection: contract.parts.some((part) => part.name === "portal")
        ? ["activate-placement", "connect-controller"]
        : ["connect-controller"],
      portal: contract.parts.some((part) => part.name === "portal"),
      requiredPart: "popup",
      captures: contract.parts
        .filter((part) =>
          ["backdrop", "description", "popup", "portal", "title", "viewport"].includes(part.name),
        )
        .map((part) => part.discoveryAttribute),
    },
  };
}
export function renderNativeRoot(
  target: Target,
  component: string,
  plan = nativeRecipe(component as NativeComponent),
): string {
  if (!(component in nativeContracts))
    throw new TypeError(`Unsupported native recipe ${component}`);
  return printNativeFrame(target, nativeContracts[component as NativeComponent], plan);
}

export function nativeTriggerComposition(component: string) {
  return nativeRecipe(component as NativeComponent).controlComposition.trigger;
}
