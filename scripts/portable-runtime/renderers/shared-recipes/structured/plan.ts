/** Generation-only plans. Operations name observable work, never arbitrary source. */
export type ConnectOperation =
  | "retire-previous"
  | "create-controller"
  | "subscribe-accepted"
  | "restore-state"
  | "render-accepted"
  | "publish-connected-model";
export type ConnectionRecipe = {
  component:
    | "Tooltip"
    | "PreviewCard"
    | "Collapsible"
    | "Popover"
    | "Accordion"
    | "Dialog"
    | "AlertDialog"
    | "Drawer";
  constructorInputs: readonly string[];
  initialInputs?: readonly string[];
  retainAcceptedTrigger?: boolean;
  model: {
    name: "open" | "value";
    default: "defaultOpen" | "defaultValue";
    getter: "getOpen" | "getValue";
    setter: "setOpen" | "setValue";
    event: "openChange" | "valueChange";
    type: "boolean" | "AccordionValue";
    codec: "boolean" | "selection";
    fallback: false | null;
  };
  proposal: {
    callback: "onOpenChange" | "onValueChange";
    details:
      | "TooltipOpenChangeDetails"
      | "PreviewCardOpenChangeDetails"
      | "CollapsibleOpenChangeDetails"
      | "PopoverOpenChangeDetails"
      | "AccordionValueChangeDetails"
      | "DialogOpenChangeDetails"
      | "AlertDialogOpenChangeDetails"
      | "DrawerOpenChangeDetails";
    arguments: "value-details" | "details";
  };
  completion?: {
    callback: "onCloseComplete";
    details:
      | "PopoverCloseCompleteDetails"
      | "DialogCloseCompleteDetails"
      | "AlertDialogCloseCompleteDetails"
      | "DrawerCloseCompleteDetails";
  };
  construction: "closed" | "initial-seed-then-closed" | "accepted-seed";
  restoration: "open-on-reconnect" | "if-different";
  connect: readonly { operation: ConnectOperation; after: readonly ConnectOperation[] }[];
  publication: "immediate" | "microtask";
  cleanup: readonly ("retain-state" | "unsubscribe" | "clear-owner" | "destroy")[];
};
export type PopoverPlan = ConnectionRecipe & {
  component: "Popover";
};
export const popoverPlan: PopoverPlan = {
  component: "Popover",
  constructorInputs: ["closeOnEscape", "closeOnOutsideInteract", "modal", "openOnHover"],
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
    details: "PopoverOpenChangeDetails",
    arguments: "value-details",
  },
  completion: { callback: "onCloseComplete", details: "PopoverCloseCompleteDetails" },
  construction: "initial-seed-then-closed",
  restoration: "open-on-reconnect",
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
