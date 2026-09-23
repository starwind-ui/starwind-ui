import { sidebarRuntimeAdapterContract } from "../../../../contracts/primitive/components/sidebar.js";
import type { AdapterSidebarFacts } from "../../../framework-adapters/types.js";
import { buildSidebarSpecializedAdapterSpec } from "../../../specialized-adapter-spec/sidebar-specialized-adapter-spec.js";
export const sidebarProviderOptions = buildSidebarSpecializedAdapterSpec(
  sidebarRuntimeAdapterContract,
).sidebar.providerOptions;
export const sidebarRecipe = {
  models: ["open", "mobileOpen"],
  defaults: { open: "defaultOpen", mobileOpen: "defaultMobileOpen" },
  constructorInputs: [
    "keyboardShortcut",
    "mobileQuery",
    "persistOpen",
    "persistenceKey",
    "persistenceStorage",
    "persistenceMaxAge",
  ],
  connect: [
    "retire-previous",
    "create-runtime-seed",
    "subscribe-notifications",
    "restore-defined-or-retained",
    "read-context",
    "publish-runtime-binding",
  ],
  notify: ["read-context", "publish-notified-model"],
  cleanup: ["retain-readback", "unsubscribe", "clear-owner", "destroy"],
  publication: "immediate",
  persistence: {
    model: "open",
    enabledInput: "persistOpen",
  },
  media: { input: "mobileQuery", context: "isMobile", fallback: false },
  sheet: {
    bindingModel: "mobileOpen",
    setter: "setMobileOpen",
    // Runtime coordinates the nearest unbound Sheet through its native command/proposal events.
    bindings: [] as { name: string; expression: string }[],
  },
} as const;
export type SidebarRecipe = Omit<typeof sidebarRecipe, "publication"> & {
  publication: "immediate" | "microtask";
};
export type SidebarModel = (typeof sidebarRecipe.models)[number];
export type SidebarFacts = AdapterSidebarFacts;
