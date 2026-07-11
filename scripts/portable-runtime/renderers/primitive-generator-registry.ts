import { manualPrimitiveGeneratorEntries } from "./manual-primitive-generators.js";
import type { PrimitiveRuntimeAdapterInventoryEntry } from "./primitive-inventory.js";
import { getRuntimeAdapterPrimitiveInventoryEntries } from "./primitive-inventory.js";
import {
  createGenericAdapterPlanPrimitiveGeneratorEntry,
  createSpecializedAdapterSpecPrimitiveGeneratorEntry,
} from "./primitive-route-free-generator.js";

export type {
  PrimitiveGeneratorRegistryEntry,
  PrimitiveGeneratorSource,
  PrimitiveGeneratorTargetArgs,
  PrimitiveTargetGenerator,
} from "./primitive-generator-types.js";

import type { PrimitiveGeneratorRegistryEntry } from "./primitive-generator-types.js";
import {
  buildAccordionAdapterOutputModel,
  buildAccordionSpecializedAdapterSpec,
  buildCarouselAdapterOutputModel,
  buildCarouselSpecializedAdapterSpec,
  buildComboboxAdapterOutputModel,
  buildComboboxSpecializedAdapterSpec,
  buildContextMenuAdapterOutputModel,
  buildContextMenuSpecializedAdapterSpec,
  buildDropzoneAdapterOutputModel,
  buildDropzoneSpecializedAdapterSpec,
  buildFieldAdapterOutputModel,
  buildFieldSpecializedAdapterSpec,
  buildInputOtpAdapterOutputModel,
  buildInputOtpSpecializedAdapterSpec,
  buildMenuAdapterOutputModel,
  buildMenuSpecializedAdapterSpec,
  buildNavigationMenuAdapterOutputModel,
  buildNavigationMenuSpecializedAdapterSpec,
  buildPreviewCardAdapterOutputModel,
  buildPreviewCardSpecializedAdapterSpec,
  buildSelectAdapterOutputModel,
  buildSelectSpecializedAdapterSpec,
  buildSidebarAdapterOutputModel,
  buildSidebarSpecializedAdapterSpec,
  buildSliderAdapterOutputModel,
  buildSliderSpecializedAdapterSpec,
  buildTabsAdapterOutputModel,
  buildTabsSpecializedAdapterSpec,
  buildToastAdapterOutputModel,
  buildToastSpecializedAdapterSpec,
  buildTooltipAdapterOutputModel,
  buildTooltipSpecializedAdapterSpec,
} from "./specialized-adapter-spec/index.js";

type SpecializedPrimitiveGeneratorFactory = {
  createEntry(entry: PrimitiveRuntimeAdapterInventoryEntry): PrimitiveGeneratorRegistryEntry;
};

const specializedPrimitiveGeneratorFactories: Record<string, SpecializedPrimitiveGeneratorFactory> = {
  accordion: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildAccordionAdapterOutputModel,
        buildSpec: buildAccordionSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  carousel: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildCarouselAdapterOutputModel,
        buildSpec: buildCarouselSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  combobox: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildComboboxAdapterOutputModel,
        buildSpec: buildComboboxSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  "context-menu": {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildContextMenuAdapterOutputModel,
        buildSpec: buildContextMenuSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  dropzone: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildDropzoneAdapterOutputModel,
        buildSpec: buildDropzoneSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  field: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildFieldAdapterOutputModel,
        buildSpec: buildFieldSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  "input-otp": {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildInputOtpAdapterOutputModel,
        buildSpec: buildInputOtpSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  menu: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildMenuAdapterOutputModel,
        buildSpec: buildMenuSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  "navigation-menu": {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildNavigationMenuAdapterOutputModel,
        buildSpec: buildNavigationMenuSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  "preview-card": {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildPreviewCardAdapterOutputModel,
        buildSpec: buildPreviewCardSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  select: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildSelectAdapterOutputModel,
        buildSpec: buildSelectSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  sidebar: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildSidebarAdapterOutputModel,
        buildSpec: buildSidebarSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  slider: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildSliderAdapterOutputModel,
        buildSpec: buildSliderSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  tabs: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildTabsAdapterOutputModel,
        buildSpec: buildTabsSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  toast: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildToastAdapterOutputModel,
        buildSpec: buildToastSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
  tooltip: {
    createEntry: (entry) =>
      createSpecializedAdapterSpecPrimitiveGeneratorEntry({
        buildOutputModel: buildTooltipAdapterOutputModel,
        buildSpec: buildTooltipSpecializedAdapterSpec,
        component: entry.component,
        contract: entry.contract,
      }),
  },
};

export const primitiveGeneratorRegistry: readonly PrimitiveGeneratorRegistryEntry[] = [
  ...getRuntimeAdapterPrimitiveInventoryEntries().map(createRuntimeAdapterPrimitiveGeneratorEntry),
  ...manualPrimitiveGeneratorEntries,
];

export function getPrimitiveGeneratorEntries(): readonly PrimitiveGeneratorRegistryEntry[] {
  return primitiveGeneratorRegistry;
}

function createRuntimeAdapterPrimitiveGeneratorEntry(
  entry: PrimitiveRuntimeAdapterInventoryEntry,
): PrimitiveGeneratorRegistryEntry {
  if (entry.generation.strategy === "specialized-adapter-spec") {
    return getSpecializedPrimitiveGeneratorFactory(entry).createEntry(entry);
  }

  if (entry.generation.source === "specialized-adapter-spec") {
    throw new Error(
      `Primitive inventory entry "${entry.component}" has a specialized source with generic generation strategy.`,
    );
  }

  return createGenericAdapterPlanPrimitiveGeneratorEntry({
    component: entry.component,
    contract: entry.contract,
    source: entry.generation.source,
  });
}

function getSpecializedPrimitiveGeneratorFactory(
  entry: PrimitiveRuntimeAdapterInventoryEntry,
): SpecializedPrimitiveGeneratorFactory {
  const factory = specializedPrimitiveGeneratorFactories[entry.component];

  if (!factory) {
    throw new Error(
      `Primitive inventory entry "${entry.component}" is marked specialized-adapter-spec but has no specialized generator factory.`,
    );
  }

  return factory;
}
