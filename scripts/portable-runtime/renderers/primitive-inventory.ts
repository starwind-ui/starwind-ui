import { runtimeAdapterContracts } from "../contracts/primitive/representatives.js";
import { colorPickerRuntimeFacade } from "../contracts/primitive/color-picker.js";
import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import type { PrimitiveGeneratorSource } from "./primitive-generator-types.js";

export type PrimitiveAdapterOutputStrategy = "generic-adapter-plan" | "specialized-adapter-spec";

export type PrimitiveRuntimeFacadeInventory = {
  types?: readonly string[];
  values?: readonly string[];
};

export type PrimitiveRuntimeAdapterInventoryEntry = {
  cliVendoring: true;
  component: string;
  contract: RuntimeAdapterContract;
  generation: {
    source: Exclude<PrimitiveGeneratorSource, "manual">;
    strategy: PrimitiveAdapterOutputStrategy;
  };
  kind: "runtime-adapter-contract";
  packageExport: true;
  runtimeFacades?: PrimitiveRuntimeFacadeInventory;
};

export type PrimitiveManualHelperFacadeInventoryEntry = {
  cliVendoring: false;
  component: string;
  generation: {
    reason: string;
    source: Extract<PrimitiveGeneratorSource, "manual">;
  };
  kind: "manual-helper-facade";
  packageExport: true;
  runtimeFacades?: PrimitiveRuntimeFacadeInventory;
};

export type PrimitiveInventoryEntry =
  | PrimitiveManualHelperFacadeInventoryEntry
  | PrimitiveRuntimeAdapterInventoryEntry;

type PrimitiveRuntimeAdapterInventoryFact = {
  component: string;
  generation: PrimitiveRuntimeAdapterInventoryEntry["generation"];
  runtimeFacades?: PrimitiveRuntimeFacadeInventory;
};

const primitiveRuntimeAdapterFacts = [
  {
    component: "accordion",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["AccordionValue", "AccordionValueChangeDetails"] },
  },
  {
    component: "alert-dialog",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: {
      types: ["AlertDialogCloseCompleteDetails", "AlertDialogOpenChangeDetails"],
    },
  },
  {
    component: "avatar",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: {
      types: ["AvatarImageLoadingStatus", "AvatarLoadingStatusChangeDetails"],
    },
  },
  {
    component: "button",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
  },
  {
    component: "carousel",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: ["CarouselInstance", "CarouselOptions"],
      values: ["createCarousel"],
    },
  },
  {
    component: "checkbox",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["CheckboxCheckedChangeDetails"] },
  },
  {
    component: "checkbox-group",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["CheckboxGroupValue", "CheckboxGroupValueChangeDetails"] },
  },
  {
    component: "collapsible",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["CollapsibleOpenChangeDetails"] },
  },
  {
    component: "combobox",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: [
        "ComboboxInputValueChangeDetails",
        "ComboboxOpenChangeDetails",
        "ComboboxValueChangeDetails",
      ],
    },
  },
  {
    component: "color-picker",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: colorPickerRuntimeFacade.types,
      values: colorPickerRuntimeFacade.values,
    },
  },
  {
    component: "context-menu",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: [
        "ContextMenuCloseCompleteDetails",
        "ContextMenuOpenChangeDetails",
        "MenuCheckedChangeDetails",
        "MenuValueChangeDetails",
      ],
    },
  },
  {
    component: "dialog",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["DialogCloseCompleteDetails", "DialogOpenChangeDetails"] },
  },
  {
    component: "drawer",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["DrawerCloseCompleteDetails", "DrawerOpenChangeDetails"] },
  },
  {
    component: "dropzone",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["DropzoneFilesChangeDetails"] },
  },
  {
    component: "field",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["InputValue", "InputValueChangeDetails"] },
  },
  {
    component: "fieldset",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
  },
  {
    component: "form",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: {
      types: ["FormExternalErrors", "FormSchemaResult", "FormValidationTiming", "FormValues"],
      values: ["createForm", "createFormSchemaValidator", "validateFormSchema"],
    },
  },
  {
    component: "input",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["InputValue", "InputValueChangeDetails"] },
  },
  {
    component: "input-otp",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["InputOtpValueChangeDetails"] },
  },
  {
    component: "menu",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: [
        "MenuCheckedChangeDetails",
        "MenuCloseCompleteDetails",
        "MenuOpenChangeDetails",
        "MenuValueChangeDetails",
      ],
    },
  },
  {
    component: "navigation-menu",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["NavigationMenuValue", "NavigationMenuValueChangeDetails"] },
  },
  {
    component: "popover",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["PopoverCloseCompleteDetails", "PopoverOpenChangeDetails"] },
  },
  {
    component: "preview-card",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["PreviewCardOpenChangeDetails"] },
  },
  {
    component: "progress",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
  },
  {
    component: "radio",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["RadioCheckedChangeDetails"] },
  },
  {
    component: "radio-group",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["RadioGroupValue", "RadioGroupValueChangeDetails"] },
  },
  {
    component: "scroll-area",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
  },
  {
    component: "select",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["SelectOpenChangeDetails", "SelectValueChangeDetails"] },
  },
  {
    component: "sidebar",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: [
        "SidebarMobileOpenChangeDetails",
        "SidebarOpenChangeDetails",
        "SidebarPersistenceStorage",
      ],
    },
  },
  {
    component: "slider",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: ["SliderValue", "SliderValueChangeDetails", "SliderValueCommitDetails"],
    },
  },
  {
    component: "switch",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["SwitchCheckedChangeDetails"] },
  },
  {
    component: "tabs",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["TabsOrientation", "TabsValue", "TabsValueChangeDetails"] },
  },
  {
    component: "toast",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: {
      types: ["ToastApi", "ToastOptions", "ToastPromiseOptions"],
      values: ["toast"],
    },
  },
  {
    component: "toggle",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["TogglePressedChangeDetails"] },
  },
  {
    component: "toggle-group",
    generation: { source: "adapter-family-plan", strategy: "generic-adapter-plan" },
    runtimeFacades: { types: ["ToggleGroupValue", "ToggleGroupValueChangeDetails"] },
  },
  {
    component: "tooltip",
    generation: { source: "specialized-adapter-spec", strategy: "specialized-adapter-spec" },
    runtimeFacades: { types: ["TooltipOpenChangeDetails"] },
  },
] satisfies readonly PrimitiveRuntimeAdapterInventoryFact[];

const primitiveManualHelperFacadeFacts = [
  {
    component: "theme",
    generation: {
      reason:
        "theme primitive output is a manual helper facade, not an Adapter Output Model component yet.",
      source: "manual",
    },
    runtimeFacades: {
      types: ["ThemeInitScriptOptions"],
      values: ["getThemeInitScript", "initThemeController"],
    },
  },
] as const;

const primitiveVendoringComponentOrder: readonly string[] = [
  "button",
  "carousel",
  "toggle",
  "field",
  "fieldset",
  "form",
  "input",
  "switch",
  "checkbox",
  "radio",
  "slider",
  "collapsible",
  "toggle-group",
  "radio-group",
  "checkbox-group",
  "tabs",
  "accordion",
  "avatar",
  "progress",
  "scroll-area",
  "input-otp",
  "tooltip",
  "popover",
  "preview-card",
  "dialog",
  "alert-dialog",
  "drawer",
  "dropzone",
  "menu",
  "navigation-menu",
  "context-menu",
  "select",
  "sidebar",
  "combobox",
  "color-picker",
  "toast",
] as const;

const runtimeAdapterContractByComponent = new Map<string, RuntimeAdapterContract>(
  runtimeAdapterContracts.map((contract) => [contract.component, contract]),
);

const runtimeAdapterInventoryEntries = primitiveRuntimeAdapterFacts.map(
  (fact): PrimitiveRuntimeAdapterInventoryEntry => ({
    ...fact,
    cliVendoring: true,
    contract: getRuntimeAdapterContractForInventory(fact.component),
    kind: "runtime-adapter-contract",
    packageExport: true,
  }),
);

const manualHelperFacadeInventoryEntries = primitiveManualHelperFacadeFacts.map(
  (fact): PrimitiveManualHelperFacadeInventoryEntry => ({
    ...fact,
    cliVendoring: false,
    kind: "manual-helper-facade",
    packageExport: true,
  }),
);

export const primitiveInventory = [
  ...runtimeAdapterInventoryEntries,
  ...manualHelperFacadeInventoryEntries,
] satisfies readonly PrimitiveInventoryEntry[];

validatePrimitiveInventory();

export function getPrimitiveInventoryEntries(): readonly PrimitiveInventoryEntry[] {
  return primitiveInventory;
}

export function getRuntimeAdapterPrimitiveInventoryEntries(): readonly PrimitiveRuntimeAdapterInventoryEntry[] {
  return runtimeAdapterInventoryEntries;
}

export function getManualHelperPrimitiveInventoryEntries(): readonly PrimitiveManualHelperFacadeInventoryEntry[] {
  return manualHelperFacadeInventoryEntries;
}

export function getPrimitiveInventoryEntry(component: string): PrimitiveInventoryEntry | undefined {
  return primitiveInventory.find((entry) => entry.component === component);
}

export function getPrimitiveRuntimeComponentNames(): string[] {
  return runtimeAdapterInventoryEntries.map((entry) => entry.component);
}

export function getPrimitiveHelperExportNames(): string[] {
  return manualHelperFacadeInventoryEntries.map((entry) => entry.component);
}

export function getPrimitivePackageExportNames(): string[] {
  return primitiveInventory.filter((entry) => entry.packageExport).map((entry) => entry.component);
}

export function getPrimitiveRuntimeFacadeTypeNames(component: string): string[] {
  return [...(getPrimitiveInventoryEntry(component)?.runtimeFacades?.types ?? [])];
}

export function getPrimitiveRuntimeFacadeValueNames(component: string): string[] {
  return [...(getPrimitiveInventoryEntry(component)?.runtimeFacades?.values ?? [])];
}

export function getPrimitiveVendoringContracts(): readonly RuntimeAdapterContract[] {
  return primitiveVendoringComponentOrder.map((component) => {
    const entry = runtimeAdapterInventoryEntries.find(
      (candidate) => candidate.component === component && candidate.cliVendoring,
    );

    if (!entry) {
      throw new Error(`Primitive vendoring order references unknown primitive "${component}".`);
    }

    return entry.contract;
  });
}

function getRuntimeAdapterContractForInventory(component: string): RuntimeAdapterContract {
  const contract = runtimeAdapterContractByComponent.get(component);

  if (!contract) {
    throw new Error(
      `Primitive inventory entry "${component}" is missing a Runtime Adapter Contract.`,
    );
  }

  return contract;
}

function validatePrimitiveInventory(): void {
  const duplicateComponents = getDuplicateValues(
    primitiveInventory.map((entry) => entry.component),
  );

  if (duplicateComponents.length > 0) {
    throw new Error(
      `Primitive inventory has duplicate entries for: ${duplicateComponents.join(", ")}`,
    );
  }

  const missingInventoryEntries = runtimeAdapterContracts
    .map((contract) => contract.component)
    .filter(
      (component) => !runtimeAdapterInventoryEntries.some((entry) => entry.component === component),
    );

  if (missingInventoryEntries.length > 0) {
    throw new Error(
      `Primitive inventory is missing Runtime Adapter Contract entries for: ${missingInventoryEntries.join(", ")}`,
    );
  }

  const inconsistentGenerationEntries = runtimeAdapterInventoryEntries
    .filter(
      (entry) =>
        (entry.generation.source === "specialized-adapter-spec") !==
        (entry.generation.strategy === "specialized-adapter-spec"),
    )
    .map((entry) => entry.component);

  if (inconsistentGenerationEntries.length > 0) {
    throw new Error(
      `Primitive inventory has inconsistent generation source and strategy for: ${inconsistentGenerationEntries.join(", ")}`,
    );
  }

  const duplicateVendoringEntries = getDuplicateValues(primitiveVendoringComponentOrder);

  if (duplicateVendoringEntries.length > 0) {
    throw new Error(
      `Primitive inventory has duplicate vendoring order entries for: ${duplicateVendoringEntries.join(", ")}`,
    );
  }

  const vendoringComponentSet = new Set(primitiveVendoringComponentOrder);
  const missingVendoringEntries = runtimeAdapterInventoryEntries
    .filter((entry) => entry.cliVendoring && !vendoringComponentSet.has(entry.component))
    .map((entry) => entry.component);

  if (missingVendoringEntries.length > 0) {
    throw new Error(
      `Primitive inventory vendoring order is missing entries for: ${missingVendoringEntries.join(", ")}`,
    );
  }

  const invalidVendoringEntries = primitiveVendoringComponentOrder.filter(
    (component) =>
      !runtimeAdapterInventoryEntries.some(
        (entry) => entry.component === component && entry.cliVendoring,
      ),
  );

  if (invalidVendoringEntries.length > 0) {
    throw new Error(
      `Primitive inventory has invalid vendoring order entries for: ${invalidVendoringEntries.join(", ")}`,
    );
  }

  const manualVendoringEntries = manualHelperFacadeInventoryEntries
    .filter((entry) => vendoringComponentSet.has(entry.component))
    .map((entry) => entry.component);

  if (manualVendoringEntries.length > 0) {
    throw new Error(
      `Primitive inventory manual helper facades cannot be vendored as Runtime primitives: ${manualVendoringEntries.join(", ")}`,
    );
  }
}

function getDuplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates].sort();
}
