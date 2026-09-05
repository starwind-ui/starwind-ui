import {
  ZAG_VUE_COMPARATOR_VERSION,
  starwindZagVueOverlapMappings,
  validateZagVueResolvedVersions,
  zagVueExpectedResolvedVersions,
} from "../package-size-vue-plan.mjs";
import { scenarioRows } from "./model.mjs";

export const REKA_UI_COMPARATOR_VERSION = "2.10.3";
export const VUE_PERFORMANCE_REKA_AUDIT_SOURCE =
  ".scratch/vue-runtime-performance-comparison/evidence/reka-ui-fair-overlap-audit.md";

export const vuePerformanceProviderOrder = Object.freeze(["starwind-vue", "zag-vue", "reka-ui"]);

export const vuePerformanceExcludedScenarioKeys = Object.freeze(["combobox-filter-input"]);
export const vuePerformanceProposedScenarioKeys = Object.freeze(scenarioRows.map(({ key }) => key));
export const vuePerformanceScenarioKeys = Object.freeze(
  vuePerformanceProposedScenarioKeys.filter(
    (scenario) => !vuePerformanceExcludedScenarioKeys.includes(scenario),
  ),
);

const scenarioByKey = new Map(scenarioRows.map((scenario) => [scenario.key, scenario]));
const zagMachineByComponent = new Map(
  starwindZagVueOverlapMappings.map(({ starwind, zag }) => [starwind, zag]),
);

const highlightSweepAction = deepFreeze({
  currentItemAssertion: "data-highlighted",
  dispatch: "synchronous pointermove",
  finalEndpointAssertion: "the last item remains highlighted",
  forcedLayout: "after the current-item assertion",
  postSweepWait: "existing shared post-sweep wait",
  sharedVueNextTickCount: 1,
});
const radioSweepAction = deepFreeze({
  currentItemAssertion: "provider-public checked DOM state",
  dispatch: "synchronous click",
  finalEndpointAssertion: "the last radio remains checked",
  forcedLayout: "after the current-item assertion",
  postSweepWait: "existing shared post-sweep wait",
  sharedVueNextTickCount: 1,
});
const tabsActivationAction = deepFreeze({
  dispatch: "synchronous",
  events: [
    { button: 0, type: "mousedown" },
    { button: 0, type: "mouseup" },
    { button: 0, type: "click" },
  ],
  finalEndpointAssertion: "the last panel marker is visible",
  forcedLayout: "after the existing shared settle",
  settle: "existing shared settle",
  target: "final trigger",
});

const rekaLimitations = Object.freeze({
  "dialog-open": "Inline modal-dialog comparison; Reka focus and inerting work remains measured.",
  "select-open": "Uses popper positioning and the approved floating offsets.",
  "menu-open": "Individual modal action-menu comparison.",
  "tooltip-trigger-mount": "Measures closed trigger setup and requires one zero-delay provider.",
  "dialog-trigger-mount": "Inline forced closed content must stay identical across providers.",
  "popover-trigger-mount": "Plain headings and paragraphs replace unavailable title parts.",
  "preview-card-trigger-mount": "Reka Hover Card matches the closed Preview Card mount behavior.",
  "menu-item-highlight": "Measures non-virtualized action-item highlighting.",
  "combobox-open": "Uses rendered text items without a virtualizer.",
  "combobox-trigger-mount": "Measures closed Combobox setup without open item DOM.",
  "combobox-item-highlight": "Measures non-virtualized highlighting.",
  "menu-submenu-open": "Uses click activation so the default hover delay stays outside timing.",
  "menu-submenu-item-highlight": "Measures non-virtualized submenu highlighting.",
  "tabs-high-count-mount": "Forced panels require explicit inactive visibility handling.",
  "tabs-activation-click":
    "Uses manual activation and one common synthetic browser click sequence.",
  "accordion-high-count-mount": "The keep-mounted panel policy is part of the row.",
  "accordion-toggle-click": "Measures one expansion from the closed state.",
  "radio-group-high-count-mount": "Individual roving-focus Radio Group comparison.",
  "radio-group-change-sweep": "Measures click selection across all items.",
});

const dialogRekaExports = auditedExports([
  "DialogClose",
  "DialogContent",
  "DialogDescription",
  "DialogOverlay",
  "DialogRoot",
  "DialogTitle",
  "DialogTrigger",
]);
const selectRekaExports = auditedExports([
  "SelectContent",
  "SelectIcon",
  "SelectItem",
  "SelectItemIndicator",
  "SelectItemText",
  "SelectPortal",
  "SelectRoot",
  "SelectTrigger",
  "SelectValue",
  "SelectViewport",
]);
const menuRekaExports = auditedExports([
  "DropdownMenuContent",
  "DropdownMenuItem",
  "DropdownMenuPortal",
  "DropdownMenuRoot",
  "DropdownMenuTrigger",
]);
const nestedMenuRekaExports = auditedExports([
  ...menuRekaExports,
  "DropdownMenuSub",
  "DropdownMenuSubContent",
  "DropdownMenuSubTrigger",
]);
const tooltipRekaExports = auditedExports([
  "TooltipContent",
  "TooltipPortal",
  "TooltipProvider",
  "TooltipRoot",
  "TooltipTrigger",
]);
const popoverRekaExports = auditedExports([
  "PopoverClose",
  "PopoverContent",
  "PopoverPortal",
  "PopoverRoot",
  "PopoverTrigger",
]);
const previewCardRekaExports = auditedExports([
  "HoverCardContent",
  "HoverCardPortal",
  "HoverCardRoot",
  "HoverCardTrigger",
]);
const comboboxMountRekaExports = auditedExports([
  "ComboboxContent",
  "ComboboxInput",
  "ComboboxPortal",
  "ComboboxRoot",
]);
const comboboxRekaExports = auditedExports([
  ...comboboxMountRekaExports,
  "ComboboxItem",
  "ComboboxViewport",
]);
const tabsRekaExports = auditedExports(["TabsContent", "TabsList", "TabsRoot", "TabsTrigger"]);
const accordionRekaExports = auditedExports([
  "AccordionContent",
  "AccordionHeader",
  "AccordionItem",
  "AccordionRoot",
  "AccordionTrigger",
]);
const radioGroupRekaExports = auditedExports(["RadioGroupItem", "RadioGroupRoot"]);

export const rekaUiAuditedNamedExportsByScenario = Object.freeze({
  "dialog-open": dialogRekaExports,
  "select-open": selectRekaExports,
  "menu-open": menuRekaExports,
  "tooltip-trigger-mount": tooltipRekaExports,
  "dialog-trigger-mount": dialogRekaExports,
  "popover-trigger-mount": popoverRekaExports,
  "preview-card-trigger-mount": previewCardRekaExports,
  "menu-item-highlight": menuRekaExports,
  "combobox-open": comboboxRekaExports,
  "combobox-trigger-mount": comboboxMountRekaExports,
  "combobox-item-highlight": comboboxRekaExports,
  "menu-submenu-open": nestedMenuRekaExports,
  "menu-submenu-item-highlight": nestedMenuRekaExports,
  "tabs-high-count-mount": tabsRekaExports,
  "tabs-activation-click": tabsRekaExports,
  "accordion-high-count-mount": accordionRekaExports,
  "accordion-toggle-click": accordionRekaExports,
  "radio-group-high-count-mount": radioGroupRekaExports,
  "radio-group-change-sweep": radioGroupRekaExports,
});

export const vuePerformanceDomPartCountsByScenario = Object.freeze({
  "dialog-open": partCounts({
    closeControls: 1,
    contents: 1,
    descriptions: 1,
    outsideNodes: 10_000,
    overlays: 1,
    popups: 1,
    roots: 1,
    titles: 1,
    triggers: 1,
  }),
  "select-open": partCounts({
    contents: 1,
    items: 1_000,
    lists: 1,
    positioners: 1,
    popups: 1,
    roots: 1,
    triggers: 1,
    viewports: 1,
  }),
  "select-item-highlight": partCounts({
    contents: 1,
    items: 1_000,
    lists: 1,
    positioners: 1,
    popups: 1,
    roots: 1,
    triggers: 1,
    viewports: 1,
  }),
  "menu-open": partCounts({
    contents: 1,
    items: 1_000,
    positioners: 1,
    popups: 1,
    roots: 1,
    triggers: 1,
  }),
  "tooltip-trigger-mount": partCounts({
    contents: 1_000,
    positioners: 1_000,
    popups: 1_000,
    providers: 1,
    roots: 1_000,
    triggers: 1_000,
  }),
  "dialog-trigger-mount": partCounts({
    closeControls: 1_000,
    contents: 1_000,
    descriptions: 1_000,
    overlays: 1_000,
    popups: 1_000,
    roots: 1_000,
    titles: 1_000,
    triggers: 1_000,
  }),
  "popover-trigger-mount": partCounts({
    closeControls: 1_000,
    contents: 1_000,
    descriptions: 1_000,
    headings: 1_000,
    positioners: 1_000,
    popups: 1_000,
    roots: 1_000,
    triggers: 1_000,
  }),
  "preview-card-trigger-mount": partCounts({
    contents: 1_000,
    positioners: 1_000,
    popups: 1_000,
    roots: 1_000,
    triggers: 1_000,
  }),
  "select-trigger-mount": partCounts({
    contents: 1_000,
    items: 0,
    lists: 0,
    positioners: 1_000,
    popups: 1_000,
    roots: 1_000,
    triggers: 1_000,
    viewports: 0,
  }),
  "menu-item-highlight": partCounts({
    contents: 1,
    items: 1_000,
    positioners: 1,
    popups: 1,
    roots: 1,
    triggers: 1,
  }),
  "combobox-open": partCounts({
    contents: 1,
    inputs: 1,
    items: 1_000,
    lists: 1,
    positioners: 1,
    popups: 1,
    roots: 1,
    viewports: 1,
  }),
  "combobox-trigger-mount": partCounts({
    contents: 1_000,
    inputs: 1_000,
    items: 0,
    lists: 0,
    positioners: 1_000,
    popups: 1_000,
    roots: 1_000,
    viewports: 0,
  }),
  "combobox-item-highlight": partCounts({
    contents: 1,
    inputs: 1,
    items: 1_000,
    lists: 1,
    positioners: 1,
    popups: 1,
    roots: 1,
    viewports: 1,
  }),
  "menu-submenu-open": partCounts({
    parentContents: 1,
    parentItems: 1,
    parentPositioners: 1,
    parentPopups: 1,
    parentTriggers: 1,
    roots: 1,
    submenuContents: 1,
    submenuItems: 1_000,
    submenuPositioners: 1,
    submenuPopups: 1,
    submenuTriggers: 1,
  }),
  "menu-submenu-item-highlight": partCounts({
    parentContents: 1,
    parentItems: 1,
    parentPositioners: 1,
    parentPopups: 1,
    parentTriggers: 1,
    roots: 1,
    submenuContents: 1,
    submenuItems: 1_000,
    submenuPositioners: 1,
    submenuPopups: 1,
    submenuTriggers: 1,
  }),
  "navigation-menu-content-switch": partCounts({
    contents: 2,
    primaryContentItems: 500,
    positioners: 1,
    popups: 1,
    roots: 1,
    secondaryContentItems: 500,
    triggers: 2,
    viewports: 1,
  }),
  "tabs-high-count-mount": partCounts({
    lists: 1,
    panels: 1_000,
    roots: 1,
    triggers: 1_000,
  }),
  "tabs-activation-click": partCounts({
    lists: 1,
    panels: 1_000,
    roots: 1,
    triggers: 1_000,
  }),
  "accordion-high-count-mount": partCounts({
    headers: 1_000,
    items: 1_000,
    panels: 1_000,
    roots: 1,
    triggers: 1_000,
  }),
  "accordion-toggle-click": partCounts({
    headers: 1_000,
    items: 1_000,
    panels: 1_000,
    roots: 1,
    triggers: 1_000,
  }),
  "radio-group-high-count-mount": partCounts({ items: 1_000, roots: 1 }),
  "radio-group-change-sweep": partCounts({ items: 100, roots: 1 }),
});

export const vuePerformanceDomPhaseFactsByScenario = Object.freeze({
  "dialog-open": domPhases(
    {
      contents: 1,
      hiddenContents: 1,
      hiddenOverlays: 1,
      hiddenPopups: 1,
      itemNodes: 0,
      overlays: 1,
      popups: 1,
    },
    undefined,
    {
      contents: 1,
      hiddenContents: 0,
      hiddenOverlays: 0,
      hiddenPopups: 0,
      itemNodes: 0,
      overlays: 1,
      popups: 1,
      visibleContents: 1,
      visibleOverlays: 1,
    },
  ),
  "select-open": selectDeferredCollectionPhases(),
  "select-item-highlight": selectDeferredCollectionPhases(true),
  "menu-open": deferredCollectionPhases({ positioners: 1 }),
  "tooltip-trigger-mount": stableDomPhases({
    contents: 1_000,
    hiddenContents: 1_000,
    hiddenPopups: 1_000,
    hiddenPositioners: 1_000,
    itemNodes: 0,
    positioners: 1_000,
    popups: 1_000,
  }),
  "dialog-trigger-mount": stableDomPhases({
    contents: 1_000,
    hiddenContents: 1_000,
    hiddenOverlays: 1_000,
    hiddenPopups: 1_000,
    itemNodes: 0,
    overlays: 1_000,
    popups: 1_000,
  }),
  "popover-trigger-mount": stableDomPhases({
    contents: 1_000,
    hiddenContents: 1_000,
    hiddenPopups: 1_000,
    hiddenPositioners: 1_000,
    itemNodes: 0,
    positioners: 1_000,
    popups: 1_000,
  }),
  "preview-card-trigger-mount": stableDomPhases({
    contents: 1_000,
    hiddenContents: 1_000,
    hiddenPopups: 1_000,
    hiddenPositioners: 1_000,
    itemNodes: 0,
    positioners: 1_000,
    popups: 1_000,
  }),
  "select-trigger-mount": stableDomPhases({
    contents: 1_000,
    hiddenContents: 1_000,
    hiddenPopups: 1_000,
    hiddenLists: 0,
    hiddenPositioners: 1_000,
    hiddenViewports: 0,
    itemNodes: 0,
    lists: 0,
    positioners: 1_000,
    popups: 1_000,
    viewports: 0,
  }),
  "menu-item-highlight": deferredCollectionPhases({ positioners: 1 }, true),
  "combobox-open": comboboxDeferredCollectionPhases(),
  "combobox-trigger-mount": stableDomPhases({
    contents: 1_000,
    hiddenContents: 1_000,
    hiddenLists: 0,
    hiddenPopups: 1_000,
    hiddenPositioners: 1_000,
    hiddenViewports: 0,
    itemNodes: 0,
    lists: 0,
    positioners: 1_000,
    popups: 1_000,
    viewports: 0,
  }),
  "combobox-item-highlight": comboboxDeferredCollectionPhases(true),
  "menu-submenu-open": nestedMenuPhases(false),
  "menu-submenu-item-highlight": nestedMenuPhases(true),
  "navigation-menu-content-switch": domPhases(
    {
      contentLinks: 1_000,
      contents: 2,
      hiddenContents: 1,
      hiddenPopups: 0,
      hiddenPrimaryContents: 0,
      hiddenPositioners: 0,
      hiddenSecondaryContents: 1,
      hiddenViewports: 0,
      itemNodes: 1_000,
      positioners: 1,
      primaryContentLinks: 500,
      popups: 1,
      secondaryContentLinks: 500,
      viewports: 1,
      visibleContents: 1,
      visiblePopups: 1,
      visiblePrimaryContents: 1,
      visiblePositioners: 1,
      visibleSecondaryContents: 0,
      visibleViewports: 1,
    },
    undefined,
    {
      contentLinks: 1_000,
      contents: 2,
      hiddenContents: 1,
      hiddenPopups: 0,
      hiddenPrimaryContents: 1,
      hiddenPositioners: 0,
      hiddenSecondaryContents: 0,
      hiddenViewports: 0,
      itemNodes: 1_000,
      positioners: 1,
      primaryContentLinks: 500,
      popups: 1,
      secondaryContentLinks: 500,
      viewports: 1,
      visibleContents: 1,
      visiblePopups: 1,
      visiblePositioners: 1,
      visiblePrimaryContents: 0,
      visibleSecondaryContents: 1,
      visibleViewports: 1,
    },
  ),
  "tabs-high-count-mount": stableDomPhases({
    hiddenPanels: 999,
    itemNodes: 1_000,
    panels: 1_000,
    visiblePanels: 1,
  }),
  "tabs-activation-click": domPhases(
    { hiddenPanels: 999, itemNodes: 1_000, panels: 1_000, visiblePanels: 1 },
    undefined,
    {
      hiddenPanels: 999,
      itemNodes: 1_000,
      panels: 1_000,
      visiblePanels: 1,
      visibleTargetPanels: 1,
    },
  ),
  "accordion-high-count-mount": stableDomPhases({
    hiddenPanels: 1_000,
    itemNodes: 1_000,
    panels: 1_000,
  }),
  "accordion-toggle-click": domPhases(
    { hiddenPanels: 1_000, itemNodes: 1_000, panels: 1_000 },
    undefined,
    {
      hiddenPanels: 999,
      itemNodes: 1_000,
      panels: 1_000,
      visiblePanels: 1,
      visibleTargetPanels: 1,
    },
  ),
  "radio-group-high-count-mount": stableDomPhases({ checkedItems: 1, itemNodes: 1_000 }),
  "radio-group-change-sweep": domPhases({ checkedItems: 1, itemNodes: 100 }, undefined, {
    checkedItems: 1,
    itemNodes: 100,
    targetCheckedItems: 1,
  }),
});

export const rekaUiExpectedResolvedVersions = Object.freeze({
  "reka-ui": REKA_UI_COMPARATOR_VERSION,
});

const topologyFacts = [
  row("dialog-open", "dialog", {
    componentCount: 1,
    outsideNodeCount: 10_000,
    triggerCount: 1,
    mountedContentCount: 1,
    portalState: "inline",
    presenceState: "inline overlay and content shells mounted hidden before root initialization",
    setup:
      "Mount the hidden inline shell, initialize the root, locate the trigger, and clear timing entries.",
    measuredStart: "DOM click on the trigger.",
    visibleEndpoint: "The dialog marker is visible after layout.",
    teardown: "Close or unmount; the Vue root is empty.",
    metric: "event-to-visible",
  }),
  row("select-open", "select", {
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1,
    mountedContentCount: 1,
    portalState: "teleported",
    presenceState:
      "hidden content and positioner shells mounted; list, viewport, and items deferred until accepted open",
    setup:
      "Mount the hidden content and positioner shells without list, viewport, or items; initialize closed with the first value selected, focus the trigger, and clear timing entries.",
    measuredStart: "Enter keydown on the focused trigger.",
    visibleEndpoint:
      "The Select content marker is visible with one list, one viewport, and 1,000 inserted items after layout.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "event-to-visible",
  }),
  row("select-item-highlight", "select", {
    sweepAction: highlightSweepAction,
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1,
    mountedContentCount: 1,
    portalState: "teleported",
    presenceState:
      "hidden content and positioner shells mounted at initialization; accepted open materializes one list, one viewport, and 1,000 items",
    setup:
      "Open the Select; after the accepted event materializes exactly one list, one viewport, and 1,000 items, wait for its marker.",
    measuredStart: "The first scripted pointermove in the item sweep.",
    visibleEndpoint:
      "After every synchronous pointermove, await one shared Vue nextTick, assert the current item is highlighted, then force layout; after the shared post-sweep wait, the last item remains highlighted.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "pointermove-sweep",
  }),
  row("menu-open", "menu", {
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1,
    mountedContentCount: 1,
    portalState: "teleported",
    presenceState: "hidden content and positioner shells mounted; items deferred",
    setup:
      "Mount the hidden shells without items, initialize closed, focus the trigger, and clear timing entries.",
    measuredStart: "Enter keydown on the focused trigger.",
    visibleEndpoint: "The menu content marker is visible after layout.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "event-to-visible",
  }),
  mountRow("tooltip-trigger-mount", "tooltip", {
    componentCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "teleported",
    presenceState: "1,000 hidden popup and positioner shells mounted under one provider",
    setup:
      "Start with empty containers; mount one zero-delay provider, 1,000 triggers, and 1,000 hidden popup shells.",
    visibleEndpoint: "Layout has been forced for the 1,000 triggers and hidden popup shells.",
  }),
  mountRow("dialog-trigger-mount", "dialog", {
    componentCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "inline",
    presenceState: "closed content force-mounted and hidden",
    setup: "Start with an empty Vue root.",
    visibleEndpoint: "Layout has been forced for all closed Dialog roots and mounted content.",
    teardown: "Unmount; the Vue root is empty.",
  }),
  mountRow("popover-trigger-mount", "popover", {
    componentCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "teleported",
    presenceState: "closed content force-mounted and hidden",
    setup: "Start with an empty Vue root and Teleport target.",
    visibleEndpoint: "Layout has been forced for all closed Popover roots and mounted content.",
  }),
  mountRow("preview-card-trigger-mount", "preview-card", {
    componentCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "teleported",
    presenceState: "closed content force-mounted and hidden",
    setup: "Start with an empty Vue root and Teleport target; set open and close delays to zero.",
    visibleEndpoint:
      "Layout has been forced for all closed Preview Card roots and mounted content.",
  }),
  mountRow("select-trigger-mount", "select", {
    componentCount: 1_000,
    itemCount: 10_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "teleported",
    presenceState: "1,000 hidden content and positioner shells; zero list, viewport, and item DOM",
    setup:
      "Start with empty containers; select the first value in each root and mount 1,000 hidden content and positioner shells without list, viewport, or item DOM.",
    visibleEndpoint:
      "Layout has been forced for the 1,000 triggers and hidden content and positioner shells with zero list, viewport, and item DOM.",
  }),
  row("menu-item-highlight", "menu", {
    sweepAction: highlightSweepAction,
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1,
    mountedContentCount: 1,
    portalState: "teleported",
    presenceState: "hidden shells mounted at initialization; open content has 1,000 inserted items",
    setup:
      "Open the menu, insert exactly 1,000 items after the accepted event, and wait for its marker.",
    measuredStart: "The first scripted pointermove in the item sweep.",
    visibleEndpoint:
      "After every synchronous pointermove, await one shared Vue nextTick, assert the current item is highlighted, then force layout; after the shared post-sweep wait, the last item remains highlighted.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "pointermove-sweep",
  }),
  row("combobox-open", "combobox", {
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1,
    mountedContentCount: 1,
    portalState: "teleported",
    presenceState:
      "hidden content, positioner, and popup shells mounted; list, viewport, and items absent while closed",
    setup:
      "Mount the hidden content, positioner, and popup shells without list, viewport, or items; initialize closed, focus the input, and clear timing entries.",
    measuredStart: "ArrowDown keydown on the focused input.",
    visibleEndpoint:
      "The Combobox content marker, one list, one viewport, and 1,000 items are visible after layout.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "event-to-visible",
  }),
  mountRow("combobox-trigger-mount", "combobox", {
    componentCount: 1_000,
    itemCount: 10_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "teleported",
    presenceState:
      "1,000 hidden content, positioner, and popup shells; zero list, viewport, and item DOM",
    setup:
      "Start with empty containers and mount 1,000 inputs plus hidden content, positioner, and popup shells without list, viewport, or the declared items.",
    visibleEndpoint:
      "Layout has been forced for the 1,000 inputs and hidden shells with zero list, viewport, and item DOM.",
  }),
  row("combobox-item-highlight", "combobox", {
    sweepAction: highlightSweepAction,
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1,
    mountedContentCount: 1,
    portalState: "teleported",
    presenceState:
      "hidden content, positioner, and popup shells mounted at initialization; accepted open inserts one list, one viewport, and 1,000 items",
    setup:
      "Open with ArrowDown, insert exactly one list, one viewport, and 1,000 items after the accepted event, and wait for the Combobox marker.",
    measuredStart: "The first scripted pointermove in the item sweep.",
    visibleEndpoint:
      "After every synchronous pointermove, await one shared Vue nextTick, assert the current item is highlighted, then force layout; after the shared post-sweep wait, the last item remains highlighted.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "pointermove-sweep",
  }),
  row("menu-submenu-open", "menu", {
    componentCount: 2,
    itemCount: 1_000,
    triggerCount: 2,
    mountedContentCount: 2,
    portalState: "two teleported contents",
    presenceState: "parent and submenu shells mounted hidden; submenu items deferred",
    setup:
      "Mount both hidden shells, open the parent, retain a hidden empty submenu shell, and wait for the parent marker.",
    measuredStart: "DOM click on the submenu trigger.",
    visibleEndpoint: "The 1,000-item submenu marker is visible after layout.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "activation-to-visible",
  }),
  row("menu-submenu-item-highlight", "menu", {
    sweepAction: highlightSweepAction,
    componentCount: 2,
    itemCount: 1_000,
    triggerCount: 2,
    mountedContentCount: 2,
    portalState: "two teleported contents",
    presenceState: "both shells mounted at initialization; open submenu has 1,000 inserted items",
    setup:
      "Open the parent and submenu, insert exactly 1,000 submenu items after activation, then wait for both markers.",
    measuredStart: "The first scripted pointermove in the submenu item sweep.",
    visibleEndpoint:
      "After every synchronous pointermove, await one shared Vue nextTick, assert the current submenu item is highlighted, then force layout; after the shared post-sweep wait, the last submenu item remains highlighted.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "pointermove-sweep",
  }),
  row("navigation-menu-content-switch", "navigation-menu", {
    componentCount: 1,
    controlledness: "uncontrolled with defaultValue='primary'",
    itemCount: 1_000,
    triggerCount: 2,
    mountedContentCount: 2,
    portalState: "teleported viewport",
    presenceState:
      "defaultValue='primary' keeps the mounted primary 500-link content visible and the mounted secondary content hidden at root initialization and setup",
    setup:
      "Confirm the visible primary endpoint from defaultValue='primary', settle layout, and clear timing entries.",
    measuredStart: "DOM click on the secondary trigger.",
    visibleEndpoint:
      "The secondary 500-link content is visible in the teleported viewport after layout.",
    teardown: "Close or unmount; the Vue root and Teleport target are empty.",
    metric: "content-switch-visible",
  }),
  mountRow("tabs-high-count-mount", "tabs", {
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "none",
    presenceState: "all panels mounted; inactive panels hidden",
    setup: "Start with an empty Vue root and the first tab active in manual mode.",
    visibleEndpoint: "Layout has been forced for all triggers and mounted panels.",
    teardown: "Unmount; the Vue root is empty.",
  }),
  row("tabs-activation-click", "tabs", {
    activationAction: tabsActivationAction,
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "none",
    presenceState: "all panels mounted; inactive panels hidden",
    setup: "Render the first tab active in manual mode and focus the last trigger.",
    measuredStart:
      "Synchronously dispatch left-button mousedown, mouseup, and click on the last trigger.",
    visibleEndpoint:
      "After the existing shared settle and forced layout, the last panel marker is visible.",
    teardown: "Unmount; the Vue root is empty.",
    metric: "tab-click-to-panel",
  }),
  mountRow("accordion-high-count-mount", "accordion", {
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "none",
    presenceState: "all closed panels mounted and hidden",
    setup: "Start with an empty Vue root and no open item.",
    visibleEndpoint: "Layout has been forced for all closed items and mounted panels.",
    teardown: "Unmount; the Vue root is empty.",
  }),
  row("accordion-toggle-click", "accordion", {
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1_000,
    mountedContentCount: 1_000,
    portalState: "none",
    presenceState: "all panels mounted; closed panels hidden",
    setup: "Render all items closed and focus the last trigger.",
    measuredStart: "Click the last trigger.",
    visibleEndpoint: "The last panel marker is visible after layout.",
    teardown: "Unmount; the Vue root is empty.",
    metric: "toggle-click-to-panel",
  }),
  mountRow("radio-group-high-count-mount", "radio-group", {
    componentCount: 1,
    itemCount: 1_000,
    triggerCount: 1_000,
    portalState: "none",
    presenceState: "no conditional content",
    setup: "Start with an empty Vue root and the first radio selected.",
    visibleEndpoint: "Layout has been forced for the 1,000-item group.",
    teardown: "Unmount; the Vue root is empty.",
  }),
  row("radio-group-change-sweep", "radio-group", {
    sweepAction: radioSweepAction,
    componentCount: 1,
    itemCount: 100,
    triggerCount: 100,
    portalState: "none",
    presenceState: "no conditional content",
    setup: "Render with the first radio selected.",
    measuredStart: "The first scripted click in the radio sweep.",
    visibleEndpoint:
      "After each of 100 synchronous clicks, await one shared Vue nextTick, assert the current radio is checked, then force group layout; after the shared post-sweep wait, the last radio remains checked.",
    teardown: "Unmount; the Vue root is empty.",
    metric: "radio-click-sweep",
  }),
];

export const vuePerformanceTopology = freezeRecords(topologyFacts);

export const rekaUiScenarioDecisions = freezeRecords(
  vuePerformanceProposedScenarioKeys.map((scenario) =>
    scenario === "combobox-filter-input"
      ? {
          scenario,
          decision: "exclude",
          limitation:
            "Starwind, Zag, and Reka perform different filtering and item-DOM work; no common public-API measurement remains.",
          source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
        }
      : scenario === "navigation-menu-content-switch"
        ? {
            scenario,
            decision: "exclude",
            limitation:
              "Reka UI 2.10.3 has no Navigation Menu Portal; inline content or a consumer Teleport changes the approved portal ownership.",
            source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
          }
        : scenario === "select-item-highlight"
          ? {
              scenario,
              decision: "exclude",
              limitation:
                "Reka UI 2.10.3 SelectItem awaits nextTick before reading event.currentTarget, which is null after synchronous dispatch; trusted Playwright movement or a consumer pointer or focus shim would change the approved action and measured work, so no sample or result applies.",
              source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
            }
          : scenario === "select-trigger-mount"
            ? {
                scenario,
                decision: "exclude",
                limitation:
                  "At the approved 1,000-root scale, Reka UI 2.10.3 forced closed Select content shells did not complete production mount and phase verification after about 150 seconds, exceeding the fixed 15-second lifecycle policy; no sample or result applies.",
                source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
              }
            : {
                scenario,
                decision: "include",
                limitation: rekaLimitations[scenario],
                source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
              },
  ),
);

const rekaDecisionByScenario = new Map(
  rekaUiScenarioDecisions.map((decision) => [decision.scenario, decision]),
);

export const vuePerformanceProviderRows = freezeRecords(
  vuePerformanceTopology.flatMap((topology) =>
    vuePerformanceProviderOrder
      .filter(
        (provider) =>
          provider !== "reka-ui" ||
          rekaDecisionByScenario.get(topology.scenario).decision === "include",
      )
      .map((provider) => createProviderRow(topology, provider)),
  ),
);

export const vuePerformancePlan = Object.freeze({
  providers: vuePerformanceProviderOrder,
  rekaResolvedVersions: rekaUiExpectedResolvedVersions,
  rekaDecisions: rekaUiScenarioDecisions,
  rows: vuePerformanceProviderRows,
  topology: vuePerformanceTopology,
  zagResolvedVersions: zagVueExpectedResolvedVersions,
});

validateVuePerformancePlan(vuePerformancePlan);

export function selectVuePerformanceRows({ providers = [], scenarios = [] } = {}) {
  validateSelection("provider", providers, vuePerformanceProviderOrder);
  validateSelection("scenario", scenarios, vuePerformanceScenarioKeys);
  const providerSet = new Set(providers);
  const scenarioSet = new Set(scenarios);
  return Object.freeze(
    vuePerformanceProviderRows.filter(
      (row) =>
        (providerSet.size === 0 || providerSet.has(row.provider)) &&
        (scenarioSet.size === 0 || scenarioSet.has(row.scenario)),
    ),
  );
}

export function validateVuePerformanceComparatorVersions({ reka, zag }) {
  validateZagVueResolvedVersions(zag);
  validateRekaUiResolvedVersions(reka);
}

export function validateRekaUiResolvedVersions(resolvedVersions) {
  requireObject(resolvedVersions, "Reka UI resolved versions");
  requireExactKeys(resolvedVersions, ["reka-ui"]);
  if (resolvedVersions["reka-ui"] !== REKA_UI_COMPARATOR_VERSION) {
    throw new Error(
      `Reka UI comparator version validation failed: reka-ui: expected ${REKA_UI_COMPARATOR_VERSION}, received ${resolvedVersions["reka-ui"]}`,
    );
  }
}

export function validateVuePerformancePlan(plan) {
  requireObject(plan, "Vue performance plan");
  requireExactKeys(plan, [
    "providers",
    "rekaDecisions",
    "rekaResolvedVersions",
    "rows",
    "topology",
    "zagResolvedVersions",
  ]);
  expectExactOrder(plan.providers, vuePerformanceProviderOrder, "provider order");
  validateZagVueResolvedVersions(plan.zagResolvedVersions);
  validateRekaUiResolvedVersions(plan.rekaResolvedVersions);

  const topology = validateTopology(plan.topology);
  const decisions = validateRekaDecisions(plan.rekaDecisions);
  validateProviderRows(plan.rows, topology, decisions);
  return plan;
}

function row(scenario, component, overrides) {
  const source = scenarioByKey.get(scenario);
  if (!source) throw new Error(`Unknown shared runtime performance scenario: ${scenario}`);
  return {
    activationAction: null,
    scenario,
    component,
    type: source.type,
    cpuThrottle: source.cpuThrottle,
    componentCount: 0,
    itemCount: 0,
    implementationBoundary: "public APIs only; no library or Runtime implementation changes",
    outsideNodeCount: 0,
    triggerCount: 0,
    mountedContentCount: 0,
    controlledness: "uncontrolled",
    domPartCounts: vuePerformanceDomPartCountsByScenario[scenario],
    domPhases: vuePerformanceDomPhaseFactsByScenario[scenario],
    portalState: "none",
    presenceState: "no conditional content",
    setup: "Render the fixture in its initial state.",
    sweepAction: null,
    measuredStart: "Start the declared interaction.",
    visibleEndpoint: "The declared endpoint is visible after layout.",
    teardown: "Unmount; the Vue root and Teleport target are empty.",
    metric: "",
    warmupCount: 0,
    withinRunSampleCount: 5,
    ...overrides,
  };
}

function mountRow(scenario, component, overrides) {
  return row(scenario, component, {
    measuredStart: "Call app.mount() on the complete fixture.",
    metric: "render-layout",
    teardown: "Call app.unmount(); the Vue root and Teleport target are empty.",
    ...overrides,
  });
}

function createProviderRow(topology, provider) {
  const component = topology.component;
  const rekaDecision = rekaDecisionByScenario.get(topology.scenario);
  const providerFacts =
    provider === "starwind-vue"
      ? {
          packageName: "@starwind-ui/vue",
          packageVersion: "local",
          packageImports: [`@starwind-ui/runtime/${component}`, `@starwind-ui/vue/${component}`],
          provenance: "built-local-dist",
          auditedNamedExports: [],
          auditSource: null,
          limitation: null,
        }
      : provider === "zag-vue"
        ? {
            packageName: "@zag-js/vue",
            packageVersion: ZAG_VUE_COMPARATOR_VERSION,
            packageImports: [
              "@zag-js/core",
              "@zag-js/vue",
              zagMachineByComponent.get(component),
            ].sort(),
            provenance: "exact-zag-vue-policy",
            auditedNamedExports: [],
            auditSource: null,
            limitation: null,
          }
        : {
            packageName: "reka-ui",
            packageVersion: REKA_UI_COMPARATOR_VERSION,
            packageImports: ["reka-ui"],
            provenance: "reviewed-reka-audit",
            auditedNamedExports: rekaUiAuditedNamedExportsByScenario[topology.scenario],
            auditSource: rekaDecision.source,
            limitation: rekaDecision.limitation,
          };
  if (providerFacts.packageImports.includes(undefined)) {
    throw new Error(`Missing Zag Vue machine mapping for ${component}`);
  }
  return {
    id: `${topology.scenario}:${provider}`,
    ...topology,
    provider,
    ...providerFacts,
  };
}

function validateTopology(topology) {
  if (!Array.isArray(topology)) throw new Error("Vue performance topology must be an array");
  expectExactOrder(
    topology.map(({ scenario }) => scenario),
    vuePerformanceScenarioKeys,
    "topology",
  );
  const keys = [
    "activationAction",
    "component",
    "componentCount",
    "controlledness",
    "cpuThrottle",
    "domPartCounts",
    "domPhases",
    "itemCount",
    "implementationBoundary",
    "measuredStart",
    "metric",
    "mountedContentCount",
    "outsideNodeCount",
    "portalState",
    "presenceState",
    "scenario",
    "setup",
    "sweepAction",
    "teardown",
    "triggerCount",
    "type",
    "visibleEndpoint",
    "warmupCount",
    "withinRunSampleCount",
  ];
  for (const entry of topology) {
    requireObject(entry, `topology ${entry?.scenario ?? "row"}`);
    validateActivationAction(entry);
    requireExactKeys(entry, keys);
    for (const key of [
      "component",
      "controlledness",
      "implementationBoundary",
      "measuredStart",
      "metric",
      "portalState",
      "presenceState",
      "scenario",
      "setup",
      "teardown",
      "type",
      "visibleEndpoint",
    ]) {
      requireString(entry[key], `topology.${entry.scenario}.${key}`);
    }
    for (const key of [
      "componentCount",
      "itemCount",
      "mountedContentCount",
      "outsideNodeCount",
      "triggerCount",
      "warmupCount",
      "withinRunSampleCount",
    ]) {
      requireNonnegativeInteger(entry[key], `topology.${entry.scenario}.${key}`);
    }
    validateVueSamplingFacts(entry, `Topology ${entry.scenario}`);
    requirePartCounts(entry.domPartCounts, `topology.${entry.scenario}.domPartCounts`);
    requireDomPhases(entry.domPhases, `topology.${entry.scenario}.domPhases`);
    validateSweepAction(entry);
    if (entry.componentCount < 1 || entry.withinRunSampleCount < 1) {
      throw new Error(`Topology ${entry.scenario} must describe components and samples`);
    }
    if (!Number.isFinite(entry.cpuThrottle) || entry.cpuThrottle <= 0) {
      throw new Error(`Topology ${entry.scenario} must define a positive CPU throttle`);
    }
    const expectedControlledness =
      entry.scenario === "navigation-menu-content-switch"
        ? "uncontrolled with defaultValue='primary'"
        : "uncontrolled";
    if (entry.controlledness !== expectedControlledness) {
      throw new Error(`Topology ${entry.scenario} must use uncontrolled component state`);
    }
    const source = scenarioByKey.get(entry.scenario);
    if (entry.type !== source.type || entry.cpuThrottle !== source.cpuThrottle) {
      throw new Error(`Topology ${entry.scenario} differs from the shared scenario contract`);
    }
    const canonical = vuePerformanceTopology.find(({ scenario }) => scenario === entry.scenario);
    if (canonical && JSON.stringify(entry) !== JSON.stringify(canonical)) {
      throw new Error(`Topology ${entry.scenario} differs from the frozen Vue plan`);
    }
  }
  return topology;
}

function validateRekaDecisions(decisions) {
  if (!Array.isArray(decisions)) throw new Error("Reka decisions must be an array");
  expectExactOrder(
    decisions.map(({ scenario }) => scenario),
    vuePerformanceProposedScenarioKeys,
    "Reka audit",
  );
  for (const decision of decisions) {
    requireObject(decision, `Reka decision ${decision?.scenario ?? "row"}`);
    requireExactKeys(decision, ["decision", "limitation", "scenario", "source"]);
    if (!["include", "exclude"].includes(decision.decision)) {
      throw new Error(`Unknown Reka decision for ${decision.scenario}: ${decision.decision}`);
    }
    requireString(decision.limitation, `Reka decision ${decision.scenario}.limitation`);
    if (decision.source !== VUE_PERFORMANCE_REKA_AUDIT_SOURCE) {
      throw new Error(`Reka decision ${decision.scenario} has an unknown audit source`);
    }
    const canonical = rekaUiScenarioDecisions.find(
      ({ scenario }) => scenario === decision.scenario,
    );
    if (canonical && JSON.stringify(decision) !== JSON.stringify(canonical)) {
      throw new Error(`Reka decision ${decision.scenario} differs from the reviewed audit`);
    }
  }
  const excluded = decisions
    .filter(({ decision }) => decision === "exclude")
    .map(({ scenario }) => scenario);
  if (
    JSON.stringify(excluded) !==
    JSON.stringify([
      "select-item-highlight",
      "select-trigger-mount",
      "combobox-filter-input",
      "navigation-menu-content-switch",
    ])
  ) {
    throw new Error(`Reka exclusions differ from the reviewed audit: ${excluded.join(", ")}`);
  }
  return decisions;
}

function validateProviderRows(rows, topology, decisions) {
  if (!Array.isArray(rows)) throw new Error("Vue performance provider rows must be an array");
  const expectedIds = topology.flatMap(({ scenario }) =>
    vuePerformanceProviderOrder
      .filter(
        (provider) =>
          provider !== "reka-ui" ||
          decisions.find((entry) => entry.scenario === scenario).decision === "include",
      )
      .map((provider) => `${scenario}:${provider}`),
  );
  expectExactOrder(
    rows.map(({ id }) => id),
    expectedIds,
    "provider rows",
  );
  const topologyKeys = Object.keys(topology[0]);
  const keys = [
    "auditSource",
    "auditedNamedExports",
    "id",
    "limitation",
    "packageImports",
    "packageName",
    "packageVersion",
    "provenance",
    "provider",
    ...topologyKeys,
  ];
  for (const providerRow of rows) {
    requireObject(providerRow, `provider row ${providerRow?.id ?? "row"}`);
    const sourceTopology = topology.find(({ scenario }) => scenario === providerRow.scenario);
    if (
      providerRow.scenario === "tabs-activation-click" &&
      JSON.stringify(providerRow.activationAction) !==
        JSON.stringify(sourceTopology.activationAction)
    ) {
      throw new Error(`${providerRow.id} Tabs activation action differs from shared topology`);
    }
    requireExactKeys(providerRow, keys);
    validateVueSamplingFacts(providerRow, `Provider row ${providerRow.id}`);
    for (const key of topologyKeys) {
      if (JSON.stringify(providerRow[key]) !== JSON.stringify(sourceTopology[key])) {
        throw new Error(`Provider row ${providerRow.id} differs from topology field ${key}`);
      }
    }
    if (!vuePerformanceProviderOrder.includes(providerRow.provider)) {
      throw new Error(`Unknown Vue performance provider: ${providerRow.provider}`);
    }
    requireString(providerRow.packageName, `${providerRow.id}.packageName`);
    requireString(providerRow.packageVersion, `${providerRow.id}.packageVersion`);
    requireString(providerRow.provenance, `${providerRow.id}.provenance`);
    if (!Array.isArray(providerRow.packageImports) || providerRow.packageImports.length === 0) {
      throw new Error(`${providerRow.id}.packageImports must be a nonempty array`);
    }
    providerRow.packageImports.forEach((value) =>
      requireString(value, `${providerRow.id}.packageImports`),
    );
    if (!Array.isArray(providerRow.auditedNamedExports)) {
      throw new Error(`${providerRow.id}.auditedNamedExports must be an array`);
    }
    if (providerRow.provider === "zag-vue") {
      const expectedMachine = zagMachineByComponent.get(providerRow.component);
      const expectedImports = ["@zag-js/core", "@zag-js/vue", expectedMachine].sort();
      if (
        providerRow.packageVersion !== ZAG_VUE_COMPARATOR_VERSION ||
        JSON.stringify(providerRow.packageImports) !== JSON.stringify(expectedImports)
      ) {
        throw new Error(`Provider row ${providerRow.id} differs from the exact Zag Vue policy`);
      }
    }
    if (providerRow.provider === "reka-ui") {
      const expectedExports = rekaUiAuditedNamedExportsByScenario[providerRow.scenario];
      if (
        providerRow.packageVersion !== REKA_UI_COMPARATOR_VERSION ||
        providerRow.auditSource !== VUE_PERFORMANCE_REKA_AUDIT_SOURCE ||
        JSON.stringify(providerRow.auditedNamedExports) !== JSON.stringify(expectedExports)
      ) {
        throw new Error(`Provider row ${providerRow.id} differs from the reviewed Reka audit`);
      }
    }
    const expected = createProviderRow(sourceTopology, providerRow.provider);
    if (JSON.stringify(providerRow) !== JSON.stringify(expected)) {
      throw new Error(`Provider row ${providerRow.id} differs from the frozen provider plan`);
    }
  }
}

function validateVueSamplingFacts(entry, label) {
  if (entry.warmupCount !== 0) {
    throw new Error(`${label} must use zero Vue warmups`);
  }
  if (entry.withinRunSampleCount !== 5) {
    throw new Error(`${label} must use exactly five measured Vue samples`);
  }
}

function validateSelection(kind, selected, allowed) {
  if (!Array.isArray(selected)) throw new Error(`${kind} filters must be an array`);
  if (new Set(selected).size !== selected.length) throw new Error(`Duplicate ${kind} filter`);
  const unknown = selected.filter((value) => !allowed.includes(value));
  if (unknown.length > 0) throw new Error(`Unknown Vue performance ${kind}: ${unknown.join(", ")}`);
}

function expectExactOrder(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Vue performance ${label} membership or order differs`);
  }
}

function requireExactKeys(value, expectedKeys) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Fields differ: expected ${expected.join(", ")}`);
  }
}

function requireObject(value, label) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
}

function requireNonnegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
}

function requirePartCounts(value, label) {
  requireObject(value, label);
  const keys = Object.keys(value);
  if (keys.length === 0) throw new Error(`${label} must not be empty`);
  const sortedKeys = [...keys].sort((left, right) => left.localeCompare(right, "en"));
  if (JSON.stringify(keys) !== JSON.stringify(sortedKeys)) {
    throw new Error(`${label} keys must use deterministic order`);
  }
  for (const [part, count] of Object.entries(value)) {
    requireString(part, `${label} key`);
    requireNonnegativeInteger(count, `${label}.${part}`);
  }
}

function requireDomPhases(value, label) {
  requireObject(value, label);
  requireExactKeys(value, ["measuredEndpoint", "rootInitialized", "setupComplete"]);
  for (const phase of ["rootInitialized", "setupComplete", "measuredEndpoint"]) {
    requirePartCounts(value[phase], `${label}.${phase}`);
  }
}

function validateActivationAction(entry) {
  if (entry.scenario !== "tabs-activation-click") {
    if (entry.activationAction !== null && entry.activationAction !== undefined) {
      throw new Error(`Topology ${entry.scenario} must not define a Tabs activation action`);
    }
    return;
  }
  if (entry.activationAction === null || entry.activationAction === undefined) {
    throw new Error("Tabs activation action is required");
  }
  const action = entry.activationAction;
  requireObject(action, "Tabs activation action");
  requireExactKeys(action, [
    "dispatch",
    "events",
    "finalEndpointAssertion",
    "forcedLayout",
    "settle",
    "target",
  ]);
  for (const key of ["dispatch", "finalEndpointAssertion", "forcedLayout", "settle", "target"]) {
    requireString(action[key], `Tabs activation action.${key}`);
  }
  const expectedEventTypes = ["mousedown", "mouseup", "click"];
  if (
    !Array.isArray(action.events) ||
    action.events.length !== expectedEventTypes.length ||
    action.events.some((event, index) => event?.type !== expectedEventTypes[index])
  ) {
    throw new Error("Tabs activation action must dispatch mousedown, mouseup, and click in order");
  }
  for (const event of action.events) {
    requireObject(event, `Tabs activation action ${event?.type ?? "event"}`);
    if (!Object.hasOwn(event, "button") || event.button !== 0) {
      throw new Error("Tabs activation action events must declare the left button");
    }
    requireExactKeys(event, ["button", "type"]);
  }
  if (JSON.stringify(action) !== JSON.stringify(tabsActivationAction)) {
    throw new Error("Tabs activation action differs from the frozen Vue plan");
  }
}

function validateSweepAction(entry) {
  const expected =
    entry.metric === "pointermove-sweep"
      ? highlightSweepAction
      : entry.metric === "radio-click-sweep"
        ? radioSweepAction
        : null;
  if (expected === null) {
    if (entry.sweepAction !== null) {
      throw new Error(`Topology ${entry.scenario} must not define sweep action timing`);
    }
    return;
  }
  requireObject(entry.sweepAction, `topology.${entry.scenario}.sweepAction`);
  requireExactKeys(entry.sweepAction, [
    "currentItemAssertion",
    "dispatch",
    "finalEndpointAssertion",
    "forcedLayout",
    "postSweepWait",
    "sharedVueNextTickCount",
  ]);
  for (const key of [
    "currentItemAssertion",
    "dispatch",
    "finalEndpointAssertion",
    "forcedLayout",
    "postSweepWait",
  ]) {
    requireString(entry.sweepAction[key], `topology.${entry.scenario}.sweepAction.${key}`);
  }
  if (entry.sweepAction.sharedVueNextTickCount !== 1) {
    throw new Error(`Topology ${entry.scenario} must await exactly one shared Vue nextTick`);
  }
  if (JSON.stringify(entry.sweepAction) !== JSON.stringify(expected)) {
    throw new Error(`Topology ${entry.scenario} sweep action differs from the frozen Vue plan`);
  }
}

function freezeRecords(records) {
  return Object.freeze(
    records.map((record) =>
      Object.freeze(
        Object.fromEntries(Object.entries(record).map(([key, value]) => [key, deepFreeze(value)])),
      ),
    ),
  );
}

function auditedExports(exports) {
  return Object.freeze(
    [...new Set(exports)].sort((left, right) => left.localeCompare(right, "en")),
  );
}

function deferredCollectionPhases(shells, setupOpen = false) {
  const closed = {
    contents: 1,
    hiddenContents: 1,
    hiddenPopups: 1,
    itemNodes: 0,
    popups: 1,
    ...shellVisibility(shells, "hidden"),
    ...shells,
  };
  const open = {
    contents: 1,
    hiddenContents: 0,
    hiddenPopups: 0,
    itemNodes: 1_000,
    popups: 1,
    visibleContents: 1,
    visiblePopups: 1,
    ...shellVisibility(shells, "visible"),
    ...shells,
  };
  return domPhases(closed, setupOpen ? open : closed, open);
}

function selectDeferredCollectionPhases(setupOpen = false) {
  const closed = {
    contents: 1,
    hiddenContents: 1,
    hiddenLists: 0,
    hiddenPopups: 1,
    hiddenPositioners: 1,
    hiddenViewports: 0,
    itemNodes: 0,
    lists: 0,
    positioners: 1,
    popups: 1,
    viewports: 0,
  };
  const open = {
    contents: 1,
    hiddenContents: 0,
    hiddenLists: 0,
    hiddenPopups: 0,
    hiddenPositioners: 0,
    hiddenViewports: 0,
    itemNodes: 1_000,
    lists: 1,
    positioners: 1,
    popups: 1,
    viewports: 1,
    visibleContents: 1,
    visibleLists: 1,
    visiblePopups: 1,
    visiblePositioners: 1,
    visibleViewports: 1,
  };
  return domPhases(closed, setupOpen ? open : closed, open);
}

function comboboxDeferredCollectionPhases(setupOpen = false) {
  return selectDeferredCollectionPhases(setupOpen);
}

function nestedMenuPhases(setupSubmenuOpen) {
  const closed = {
    contents: 2,
    hiddenContents: 2,
    hiddenPopups: 2,
    hiddenPositioners: 2,
    itemNodes: 1,
    positioners: 2,
    popups: 2,
    submenuItemNodes: 0,
    visibleContents: 0,
  };
  const parentOpen = {
    contents: 2,
    hiddenContents: 1,
    hiddenPopups: 1,
    hiddenPositioners: 1,
    itemNodes: 1,
    positioners: 2,
    popups: 2,
    submenuItemNodes: 0,
    visibleContents: 1,
    visiblePopups: 1,
    visiblePositioners: 1,
  };
  const submenuOpen = {
    contents: 2,
    hiddenContents: 0,
    hiddenPopups: 0,
    hiddenPositioners: 0,
    itemNodes: 1_001,
    positioners: 2,
    popups: 2,
    submenuItemNodes: 1_000,
    visibleContents: 2,
    visiblePopups: 2,
    visiblePositioners: 2,
    visibleSubmenuContents: 1,
  };
  return domPhases(closed, setupSubmenuOpen ? submenuOpen : parentOpen, submenuOpen);
}

function stableDomPhases(counts) {
  return domPhases(counts, counts, counts);
}

function shellVisibility(shells, state) {
  return Object.fromEntries(
    Object.entries(shells).map(([part, count]) => [
      `${state}${part[0].toUpperCase()}${part.slice(1)}`,
      count,
    ]),
  );
}

function domPhases(
  rootInitialized,
  setupComplete = rootInitialized,
  measuredEndpoint = setupComplete,
) {
  return deepFreeze({
    measuredEndpoint: partCounts(measuredEndpoint),
    rootInitialized: partCounts(rootInitialized),
    setupComplete: partCounts(setupComplete),
  });
}

function partCounts(counts) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(counts).sort(([left], [right]) => left.localeCompare(right, "en")),
    ),
  );
}

function deepFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreeze));
  if (value != null && typeof value === "object") {
    return Object.freeze(
      Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepFreeze(item)])),
    );
  }
  return value;
}
