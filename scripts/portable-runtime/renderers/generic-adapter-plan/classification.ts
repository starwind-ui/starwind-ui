import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  GenericAdapterPlanClassification,
  GenericAdapterPlanClassificationStrategy,
} from "./types.js";

type GenericAdapterPlanCoverageManifest = {
  specializedAdapterSpec?: readonly string[];
  customIsland?: readonly string[];
  adapterFamilyPlan?: readonly string[];
  futureFrameworkTracer?: readonly string[];
};

const GENERIC_ADAPTER_PLAN_COVERAGE_MANIFEST = {
  adapterFamilyPlan: [
    "avatar",
    "button",
    "checkbox",
    "checkbox-group",
    "collapsible",
    "fieldset",
    "form",
    "input",
    "progress",
    "radio",
    "radio-group",
    "toggle",
    "toggle-group",
    "switch",
    "scroll-area",
    "popover",
    "dialog",
    "alert-dialog",
    "drawer",
  ],
  specializedAdapterSpec: [
    "tabs",
    "accordion",
    "select",
    "menu",
    "context-menu",
    "navigation-menu",
    "combobox",
    "color-picker",
    "tooltip",
    "preview-card",
    "sidebar",
    "slider",
    "input-otp",
    "dropzone",
    "field",
    "carousel",
    "toast",
  ],
  futureFrameworkTracer: [],
  customIsland: [],
} as const satisfies GenericAdapterPlanCoverageManifest;

const ADAPTER_FAMILY_PLAN_COMPONENTS: ReadonlySet<string> = new Set(
  GENERIC_ADAPTER_PLAN_COVERAGE_MANIFEST.adapterFamilyPlan,
);
const SPECIALIZED_ADAPTER_SPEC_COMPONENTS: ReadonlySet<string> = new Set(
  GENERIC_ADAPTER_PLAN_COVERAGE_MANIFEST.specializedAdapterSpec,
);
const FUTURE_FRAMEWORK_TRACER_COMPONENTS: ReadonlySet<string> = new Set();
const CUSTOM_ISLAND_COMPONENTS: ReadonlySet<string> = new Set(
  GENERIC_ADAPTER_PLAN_COVERAGE_MANIFEST.customIsland,
);

const STRATEGY_ORDER: GenericAdapterPlanClassificationStrategy[] = [
  "adapter-family-plan",
  "specialized-adapter-spec",
  "custom-island",
  "future-framework-tracer",
];

const STRATEGY_LABELS = {
  "custom-island": "Manual Island Escape Hatches",
  "specialized-adapter-spec": "Specialized Adapter Spec Components",
  "adapter-family-plan": "Adapter Family Plan Components",
  "future-framework-tracer": "Future Framework Tracer-Only Fixtures",
} as const satisfies Record<GenericAdapterPlanClassificationStrategy, string>;

const STRATEGY_SUMMARY_LABELS = {
  "custom-island": "Manual Island Escape Hatch (`custom-island`)",
  "specialized-adapter-spec": "Specialized Adapter Spec (`specialized-adapter-spec`)",
  "adapter-family-plan": "Adapter Family Plan (`adapter-family-plan`)",
  "future-framework-tracer": "Future Framework Tracer-Only (`future-framework-tracer`)",
} as const satisfies Record<GenericAdapterPlanClassificationStrategy, string>;

const ADAPTER_FAMILY_PLAN_REASON =
  "Generated through a typed Adapter Family Plan while preserving existing Astro and React output.";
const SPECIALIZED_ADAPTER_SPEC_REASON =
  "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.";
const FUTURE_FRAMEWORK_TRACER_REASON =
  "Non-shipping fixture used to test future framework printer shape without package or CLI integration.";
const CUSTOM_ISLAND_DETAIL_REASONS: Partial<Record<string, readonly string[]>> = {
  accordion: [
    "repeated disclosure item coordination",
    "AccordionValue serialization/equality",
    "root value normalization across single and multiple modes",
    "creation-only type/defaultValue/collapsible options",
    "runtime-owned trigger/panel id linking and native button keyboard behavior",
    "collapsible panel height measurement",
    "close-animation hidden cleanup",
    "structural child changes require controller recreation because the runtime exposes no refresh API",
  ],
  tabs: [
    "nullable TabsValue serialization",
    "framework context/provider wiring for child parts",
    "cancellation-aware controlled state and before-commit value changes",
    "creation-only syncKey storage/event wiring",
    "runtime-owned linked tab/panel ids, roving focus, nested refresh, and indicator measurement",
    "panel visibility and keep-mounted state require runtime refresh timing",
  ],
  field: [
    "FieldControl to InputRoot composition",
    "input value/change prop aliases",
    "Form validation timing and error visibility passthrough attributes",
    "FieldError and FieldValidity match serialization",
    "message-source metadata",
    "runtime-owned label/control/description/error/validity wiring",
  ],
  slider: [
    "SliderValue serialization",
    "multi-thumb/value metadata",
    "thumb/input nesting metadata",
    "hidden range input style boundary",
    "min/max/step/orientation lifecycle metadata",
    "runtime-owned pointer and keyboard value math, multi-thumb normalization, thumb ARIA, form synchronization, range measurement, and input value reflection",
    "refresh-before-controlled-sync timing",
  ],
  "input-otp": [
    "native input placement metadata",
    "group/slot/slotChar/slotCaret/separator metadata",
    "pattern/inputMode derivation boundary",
    "framework slot/caret rendering metadata",
    "controlled value callback ref lifecycle",
    "runtime-owned keyboard, paste, delete, focus, form reset, value normalization, slot active state, character writing, and caret visibility",
  ],
  "preview-card": [
    "hover/focus timing and optional overlay anatomy",
    "trigger delay and disabled attributes",
    "tooltip-role popup without close-complete callback",
    "backdrop, viewport, and arrow state variants",
    "runtime-owned hoverable-content and delayed hide coordination",
  ],
  select: [
    "collection item/itemText/itemIndicator metadata",
    "hidden input form metadata",
    "scroll-arrow and list/group/groupLabel anatomy metadata",
    "value text extraction boundary",
    "trigger asChild merge requirements",
    "runtime-owned collection registration, item text extraction, keyboard navigation, typeahead, value normalization, hidden input sync, scroll arrow state, portal/floating updates, and dismissal",
  ],
  combobox: [
    "inputGroup/input/clear/value/hiddenInput/list/item metadata",
    "editable input and inputValue state metadata",
    "client-side filtering boundary",
    "clear action metadata",
    "item text extraction boundary",
    "runtime-owned filtering, editable input control, clear action, collection registration, item text extraction, hidden input sync, keyboard navigation, portal/floating updates, and dismissal",
  ],
  "color-picker": [
    "compound color area, repeatable channel controls, swatches, and form bridge metadata",
    "value and format controlled-state synchronization with refresh-before-sync ordering",
    "immutable ColorPickerColor facade and parseColor value re-export",
    "Runtime-owned parsing, color state, drafts, pointer/keyboard interaction, accessibility reflection, form synchronization, and EyeDropper behavior",
  ],
  menu: [
    "missing Specialized Adapter Spec recipes for root menu versus submenu ownership",
    "item/link/checkbox/radio/group/label/separator/shortcut branches",
    "radio group provider/consumer wiring",
    "checked/value item event forwarding",
    "checkbox/radio indicator projection",
    "submenu refs",
    "floating options and namespace export rules",
    "runtime-owned roving focus, typeahead, highlighted state, submenu controllers, pointer and keyboard open reasons, cancellable open changes, item activation, checkbox/radio item state mutation, portal/floating updates, hover close timers, and animation-delayed hiding",
  ],
  "navigation-menu": [
    "shared viewport choreography",
    "content/popup/viewport/arrow relationship metadata",
    "nested root boundary",
    "trigger asChild and floating option metadata",
    "runtime-owned active content movement, value coordination, nested menu inertness, shared viewport sizing, floating updates, link/trigger semantics, and animation timing",
  ],
  tooltip: [
    "disabled setter and non-interactive hover semantics",
    "smaller portal/positioner/popup/arrow anatomy",
    "wrapper-style asChild rendering",
    "popup tabIndex omission",
    "runtime-owned aria-describedby and delayed hide coordination",
  ],
  dropzone: [
    "file input ref metadata",
    "root/input/indicator/list composition",
    "drag/drop event metadata",
    "file-list rendering boundary",
    "upload state metadata",
    "callback ref lifecycle",
    "runtime-owned file input setup, keyboard activation, drag/drop workflow, dropped-file assignment, selected-file tracking, upload state coordination, file-list rendering, and accept/multiple filtering",
  ],
  sidebar: [
    "desktop and mobile open state synchronization",
    "persistence storage injection and expiration options",
    "keyboard shortcut lifecycle",
    "responsive mobile query handling",
    "framework context for Sidebar, Trigger, Rail, and MenuButton state",
    "trigger and menuButton asChild merging",
    "styled-only app-layout and mobile Sheet composition boundary",
  ],
  toast: [
    "viewport/template/root/content/title/description/action/close anatomy",
    "public toast API export metadata",
    "global manager ownership",
    "template cloning boundary",
    "timer and promise/update lifecycle",
    "stacking and swipe dismissal",
    "imperative package ergonomics",
    "runtime-owned viewport live-region setup, notification state store, template cloning, content updates, action callbacks, close lifecycle, timers, stacking, swipe gestures, global manager registration, and public toast API routing",
  ],
  "scroll-area": [
    "viewport measurement and scrollbar geometry",
    "ResizeObserver and MutationObserver refresh policy",
    "thumb drag and wheel interaction",
    "RTL scroll math",
    "runtime-owned overflow state CSS variables and corner layout",
  ],
};

export function classifyGenericAdapterPlanInventory(
  contracts: readonly RuntimeAdapterContract[],
): GenericAdapterPlanClassification[] {
  assertInventoryHasCoverage(contracts, GENERIC_ADAPTER_PLAN_COVERAGE_MANIFEST);

  return contracts.map(classifyGenericAdapterPlanContract);
}

export function classifyGenericAdapterPlanContract(
  contract: RuntimeAdapterContract,
): GenericAdapterPlanClassification {
  const strategy = getCoverageClassificationStrategy(contract.component);
  if (!strategy) {
    throw new Error(
      `Generic adapter plan coverage is missing classifications for: ${contract.component}.`,
    );
  }

  if (strategy === "adapter-family-plan") {
    return {
      component: contract.component,
      reason: ADAPTER_FAMILY_PLAN_REASON,
      strategy: "adapter-family-plan",
    };
  }

  if (strategy === "specialized-adapter-spec") {
    return {
      component: contract.component,
      reason: SPECIALIZED_ADAPTER_SPEC_REASON,
      strategy: "specialized-adapter-spec",
    };
  }

  if (strategy === "future-framework-tracer") {
    return {
      component: contract.component,
      reason: FUTURE_FRAMEWORK_TRACER_REASON,
      strategy: "future-framework-tracer",
    };
  }

  return {
    component: contract.component,
    reason: `Requires custom renderer because it uses ${getCustomIslandReasons(contract).join(", ")}.`,
    strategy: "custom-island",
  };
}

export function renderGenericAdapterPlanCoverageReport(
  contracts: readonly RuntimeAdapterContract[],
  futureFrameworkTracers: readonly GenericAdapterPlanClassification[] = [],
): string {
  const classifications = classifyGenericAdapterPlanInventory(contracts);
  const reportEntries = [...classifications, ...futureFrameworkTracers];
  const lines = [
    "# Generic Adapter Plan Coverage",
    "",
    "This report is generated from `scripts/portable-runtime/renderers/generic-adapter-plan/classification.ts` plus non-shipping tracer entries from `scripts/portable-runtime/renderers/generic-adapter-plan/future-framework-tracer-printers.ts`, and pinned by `scripts/portable-runtime/tests/generic-adapter-plan.test.ts`.",
    "",
    "It tracks which Runtime adapter contracts are already generated through the Generic Adapter Plan path, which ones use a typed Adapter Family Plan, which ones use a component-specific Specialized Adapter Spec, which ones still require a manual island escape hatch, and which future-framework fixtures are non-shipping tracers.",
    "",
    "## Summary",
    "",
    renderSummaryTableLine("Classification", "Count"),
    renderSummaryTableLine("-".repeat(56), "----:"),
    ...STRATEGY_ORDER.map((strategy) =>
      renderSummaryTableLine(
        STRATEGY_SUMMARY_LABELS[strategy],
        String(countByStrategy(reportEntries, strategy)),
      ),
    ),
    renderSummaryTableLine("Total primitive contracts", String(contracts.length)),
    "",
    "## Notes",
    "",
    "- `toggle`, `switch`, `checkbox`, `radio`, `toggle-group`, `checkbox-group`, `radio-group`, `collapsible`, and `form` moved from later Adapter Family Plan candidates in the evaluation recommendation to implemented Adapter Family Plan entries.",
    "- `carousel` moved to Specialized Adapter Spec after the Carousel Specialized Adapter Spec migration preserved Astro and React output parity.",
    "- `toast` moved to Specialized Adapter Spec after the Toast Specialized Adapter Spec migration preserved Astro and React output parity, including the public `toast` API/type exports.",
    "- All manual island escape hatches from the former manual-island completion queue have migrated to Specialized Adapter Specs for Astro and React. Current overlay boundaries are enforced by contract-summary and generated-output tests.",
    "- Future framework tracer fixtures are intentionally non-shipping and must not imply package exports, CLI registry entries, or demo dependencies.",
    "- Svelte tracer fixtures remain deferred until its action/component setup model is decided.",
  ];

  for (const strategy of STRATEGY_ORDER) {
    lines.push("", `## ${STRATEGY_LABELS[strategy]}`, "");
    const entries = reportEntries.filter((entry) => entry.strategy === strategy);

    if (entries.length === 0) {
      lines.push("- None.");
      continue;
    }

    lines.push(...entries.map((entry) => `- \`${entry.component}\` - ${entry.reason}`));
  }

  return `${lines.join("\n")}\n`;
}

export function validateGenericAdapterPlanCoverageManifest(
  contracts: readonly RuntimeAdapterContract[],
  manifest: GenericAdapterPlanCoverageManifest = GENERIC_ADAPTER_PLAN_COVERAGE_MANIFEST,
): string[] {
  const contractComponents = new Set(contracts.map((contract) => contract.component));
  const shippingEntries = getShippingManifestEntries(manifest);
  const shippingComponents = shippingEntries.map((entry) => entry.component);
  const issues: string[] = [];
  const duplicateComponents = getDuplicateValues(shippingComponents);
  const staleComponents = shippingComponents.filter(
    (component) => !contractComponents.has(component),
  );
  const missingComponents = [...contractComponents].filter(
    (component) => !shippingComponents.includes(component),
  );

  if (duplicateComponents.length > 0) {
    issues.push(
      `Generic adapter plan coverage has duplicate classifications for: ${duplicateComponents.join(", ")}.`,
    );
  }

  if (staleComponents.length > 0) {
    issues.push(
      `Generic adapter plan coverage has stale classifications for: ${staleComponents.join(", ")}.`,
    );
  }

  if (missingComponents.length > 0) {
    issues.push(
      `Generic adapter plan coverage is missing classifications for: ${missingComponents.join(", ")}.`,
    );
  }

  return issues;
}

function renderSummaryTableLine(label: string, count: string): string {
  return `| ${label.padEnd(56)} | ${count.padStart(5)} |`;
}

function assertInventoryHasCoverage(
  contracts: readonly RuntimeAdapterContract[],
  manifest: GenericAdapterPlanCoverageManifest,
): void {
  const issues = validateGenericAdapterPlanCoverageManifest(contracts, manifest);
  if (issues.length > 0) {
    throw new Error(issues.join("\n"));
  }
}

function getCoverageClassificationStrategy(
  component: string,
): GenericAdapterPlanClassificationStrategy | undefined {
  if (ADAPTER_FAMILY_PLAN_COMPONENTS.has(component)) return "adapter-family-plan";
  if (SPECIALIZED_ADAPTER_SPEC_COMPONENTS.has(component)) return "specialized-adapter-spec";
  if (FUTURE_FRAMEWORK_TRACER_COMPONENTS.has(component)) return "future-framework-tracer";
  if (CUSTOM_ISLAND_COMPONENTS.has(component)) return "custom-island";

  return undefined;
}

function getShippingManifestEntries(manifest: GenericAdapterPlanCoverageManifest) {
  return [
    ...(manifest.adapterFamilyPlan ?? []).map((component) => ({
      component,
      strategy: "adapter-family-plan" as const,
    })),
    ...(manifest.specializedAdapterSpec ?? []).map((component) => ({
      component,
      strategy: "specialized-adapter-spec" as const,
    })),
    ...(manifest.customIsland ?? []).map((component) => ({
      component,
      strategy: "custom-island" as const,
    })),
  ];
}

function getDuplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
      continue;
    }

    seen.add(value);
  }

  return [...duplicates];
}

function countByStrategy(
  entries: readonly GenericAdapterPlanClassification[],
  strategy: GenericAdapterPlanClassificationStrategy,
): number {
  return entries.filter((entry) => entry.strategy === strategy).length;
}

function getCustomIslandReasons(contract: RuntimeAdapterContract): string[] {
  const reasons: string[] = [];

  if (contract.category !== "static-semantic") {
    reasons.push(`category "${contract.category}"`);
  }
  if (contract.parts.length !== 1) {
    reasons.push("multi-part anatomy");
  }
  if (contract.stateModels?.length) {
    reasons.push("state models");
  }
  if (contract.events?.length) {
    reasons.push("events");
  }
  if (contract.setters?.length) {
    reasons.push("setters");
  }
  if (contract.context?.length) {
    reasons.push("context");
  }
  if (contract.form) {
    reasons.push("form metadata");
  }
  if (contract.presence) {
    reasons.push("presence metadata");
  }
  if (contract.floating) {
    reasons.push("floating metadata");
  }
  if (contract.asChild?.length) {
    reasons.push("asChild rendering");
  }
  if (contract.escapeHatches?.length) {
    reasons.push("escape hatches");
  }
  reasons.push(...(CUSTOM_ISLAND_DETAIL_REASONS[contract.component] ?? []));

  return reasons.length ? reasons : ["unsupported adapter family shape"];
}
