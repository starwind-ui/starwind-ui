import {
  zagVueComparatorInstallSpecifiers,
  zagVueExpectedResolvedVersions,
} from "../package-size-vue-plan.mjs";
import {
  REKA_UI_COMPARATOR_VERSION,
  rekaUiExpectedResolvedVersions,
  rekaUiScenarioDecisions,
  validateVuePerformanceComparatorVersions,
  vuePerformanceProviderRows,
} from "./vue-plan.mjs";

const COMPARATOR_PROVIDERS = Object.freeze(["zag-vue", "reka-ui"]);
const SHARED_VUE_IMPORT = "vue";
const SHARED_STYLE_IMPORT = "./styles.css";

export const vueComparatorInstallSpecifiers = Object.freeze({
  "zag-vue": zagVueComparatorInstallSpecifiers,
  "reka-ui": Object.freeze([`reka-ui@${REKA_UI_COMPARATOR_VERSION}`]),
});

const comparatorRows = vuePerformanceProviderRows.filter(({ provider }) =>
  COMPARATOR_PROVIDERS.includes(provider),
);

export const vueComparatorFixtureRows = Object.freeze(
  comparatorRows.map((row) => buildVueComparatorFixture(row)),
);

export function buildVueComparatorFixtures() {
  return vueComparatorFixtureRows;
}

export function buildVueComparatorFixture(rowOrId) {
  const row = resolveComparatorRow(rowOrId);
  const providerSource = row.provider === "zag-vue" ? buildZagSource(row) : buildRekaSource(row);
  const fixture = Object.freeze({
    id: row.id,
    provider: row.provider,
    scenario: row.scenario,
    packageImports: Object.freeze([SHARED_VUE_IMPORT, ...row.packageImports]),
    installSpecifiers: vueComparatorInstallSpecifiers[row.provider],
    contract: deepFreeze(buildFixtureContract(row)),
    provenance: deepFreeze(buildFixtureProvenance(row)),
    source: buildModuleSource(row, providerSource),
  });
  validateVueComparatorFixture(fixture, row);
  return fixture;
}

export function validateVueComparatorInstall({ resolved, requested }) {
  requireExactObjectKeys(resolved, COMPARATOR_PROVIDERS, "resolved comparator providers");
  requireExactObjectKeys(requested, COMPARATOR_PROVIDERS, "requested comparator providers");
  for (const provider of COMPARATOR_PROVIDERS) {
    expectExactArray(
      requested[provider],
      vueComparatorInstallSpecifiers[provider],
      `${provider} install specifiers`,
    );
  }
  validateVuePerformanceComparatorVersions({
    zag: resolved["zag-vue"],
    reka: resolved["reka-ui"],
  });
  return true;
}

export function validateVueComparatorFixture(fixture, expectedRow) {
  const row = expectedRow ?? resolveComparatorRow(fixture?.id);
  if (fixture == null || typeof fixture !== "object") {
    throw new Error("Vue comparator fixture must be an object");
  }
  requireExactObjectKeys(
    fixture,
    [
      "contract",
      "id",
      "installSpecifiers",
      "packageImports",
      "provenance",
      "provider",
      "scenario",
      "source",
    ],
    `fixture ${row.id}`,
  );
  if (
    fixture.id !== row.id ||
    fixture.provider !== row.provider ||
    fixture.scenario !== row.scenario
  ) {
    throw new Error(`Fixture identity differs from the frozen provider row: ${row.id}`);
  }
  expectExactArray(
    fixture.packageImports,
    [SHARED_VUE_IMPORT, ...row.packageImports],
    `${row.id} package imports`,
  );
  expectExactArray(
    fixture.installSpecifiers,
    vueComparatorInstallSpecifiers[row.provider],
    `${row.id} install specifiers`,
  );
  validateFixtureActivationAction(fixture.contract, row);
  if (JSON.stringify(fixture.contract) !== JSON.stringify(buildFixtureContract(row))) {
    throw new Error(`Fixture contract differs from the frozen topology: ${row.id}`);
  }
  if (JSON.stringify(fixture.provenance) !== JSON.stringify(buildFixtureProvenance(row))) {
    throw new Error(`Fixture provenance differs from the frozen provider row: ${row.id}`);
  }
  validateSourceImports(fixture.source, fixture.packageImports, row);
  for (const requiredText of [
    "createApp",
    "app.mount(root)",
    "app.unmount()",
    "await nextTick()",
    "assertEmpty(root",
    "assertEmpty(portalTarget",
    "assertEndpoint",
    row.scenario,
    row.provider,
    JSON.stringify(fixture.contract.endpointSelector),
  ]) {
    if (!fixture.source.includes(requiredText)) {
      throw new Error(`Fixture ${row.id} lacks required source contract: ${requiredText}`);
    }
  }
  if (!fixture.source.includes(JSON.stringify(buildFixtureContract(row), null, 2))) {
    throw new Error(`Fixture ${row.id} source differs from the frozen fixture contract`);
  }
  if (row.provider === "reka-ui") {
    const importedExports = parseNamedImports(fixture.source, "reka-ui");
    expectExactArray(importedExports, row.auditedNamedExports, `${row.id} audited Reka exports`);
  }
  if (row.provider === "zag-vue") {
    if (!fixture.source.includes("useMachine") || !fixture.source.includes("normalizeProps")) {
      throw new Error(`Fixture ${row.id} must use the Zag Vue adapter`);
    }
    const machineImport = row.packageImports.find(
      (name) => name.startsWith("@zag-js/") && !["@zag-js/core", "@zag-js/vue"].includes(name),
    );
    if (!fixture.source.includes(`from \"${machineImport}\"`)) {
      throw new Error(`Fixture ${row.id} lacks its exact Zag machine import`);
    }
  }
  validatePhaseSource(fixture.source, row);
  return fixture;
}

function validatePhaseSource(source, row) {
  const scenario = row.scenario;
  if (scenario === "radio-group-high-count-mount" && !source.includes("const ITEM_COUNT = 1000;")) {
    throw new Error(`Fixture ${row.id} must preserve the 1,000-item Radio Group mount scale`);
  }
  if (scenario === "radio-group-change-sweep" && !source.includes("const ITEM_COUNT = 100;")) {
    throw new Error(`Fixture ${row.id} must preserve the 100-action Radio Group sweep scale`);
  }
  const popupShellScenario = [
    "dialog-open",
    "select-open",
    "select-item-highlight",
    "menu-open",
    "menu-item-highlight",
    "combobox-open",
    "combobox-item-highlight",
    "menu-submenu-open",
    "menu-submenu-item-highlight",
  ].includes(scenario);
  if (popupShellScenario && !source.includes("hidden:")) {
    throw new Error(`Fixture ${row.id} must preserve its hidden popup shell`);
  }
  const deferredItems = [
    "select-open",
    "select-item-highlight",
    "menu-open",
    "menu-item-highlight",
    "combobox-open",
    "combobox-item-highlight",
  ].includes(scenario);
  if (deferredItems && !source.includes("itemsMounted")) {
    throw new Error(`Fixture ${row.id} must defer its heavy item DOM`);
  }
  if (deferredItems && row.provider === "zag-vue" && !source.includes("onOpenChange")) {
    throw new Error(`Fixture ${row.id} must observe the Zag open event`);
  }
  if (deferredItems && row.provider === "reka-ui" && !source.includes('"onUpdate:open"')) {
    throw new Error(`Fixture ${row.id} must observe the Reka open event`);
  }
  if (
    row.provider === "reka-ui" &&
    [
      "select-open",
      "select-item-highlight",
      "select-trigger-mount",
      "menu-open",
      "menu-item-highlight",
      "menu-submenu-open",
      "menu-submenu-item-highlight",
      "tooltip-trigger-mount",
      "popover-trigger-mount",
      "preview-card-trigger-mount",
      "combobox-open",
      "combobox-trigger-mount",
      "combobox-item-highlight",
    ].includes(scenario) &&
    !source.includes("forceMount: true")
  ) {
    throw new Error(`Fixture ${row.id} must use the audited Reka forceMount control`);
  }
  if (
    row.provider === "reka-ui" &&
    scenario.startsWith("dialog-") &&
    !source.includes("unmountOnHide: false")
  ) {
    throw new Error(`Fixture ${row.id} must use the audited Reka unmountOnHide control`);
  }
  if (
    row.provider === "reka-ui" &&
    scenario.startsWith("combobox-") &&
    source.includes("ComboboxTrigger")
  ) {
    throw new Error(`Fixture ${row.id} must not add a Combobox trigger`);
  }
  if (
    row.provider === "zag-vue" &&
    scenario === "navigation-menu-content-switch" &&
    !source.includes('defaultValue: "primary"')
  ) {
    throw new Error(`Fixture ${row.id} must start from the default primary Navigation Menu value`);
  }
}

function resolveComparatorRow(rowOrId) {
  const id = typeof rowOrId === "string" ? rowOrId : rowOrId?.id;
  const row = comparatorRows.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`Unknown or excluded Vue comparator fixture row: ${String(id)}`);
  if (rowOrId != null && typeof rowOrId === "object" && rowOrId !== row) {
    if (JSON.stringify(rowOrId) !== JSON.stringify(row)) {
      throw new Error(`Comparator row differs from the frozen Vue plan: ${id}`);
    }
  }
  return row;
}

function buildFixtureContract(row) {
  return {
    activationAction: row.activationAction,
    endpointSelector: endpointSelector(row.scenario),
    domPhases: row.domPhases,
    expectedVisibleItemCount: null,
    inputSelector: row.scenario.startsWith("combobox-") ? "[data-benchmark-input]" : null,
    itemSelector: itemSelector(row.scenario),
    measuredStart: row.measuredStart,
    portalState: row.portalState,
    presenceState: row.presenceState,
    setup: row.setup,
    sweepAction: row.sweepAction ?? null,
    teardown: row.teardown,
    topology: {
      componentCount: row.componentCount,
      domPartCounts: row.domPartCounts,
      itemCount: row.itemCount,
      mountedContentCount: row.mountedContentCount,
      outsideNodeCount: row.outsideNodeCount,
      triggerCount: row.triggerCount,
    },
    triggerSelector: triggerSelector(row.scenario),
    visibleEndpoint: row.visibleEndpoint,
  };
}

function validateFixtureActivationAction(contract, row) {
  if (!Object.hasOwn(contract, "activationAction")) {
    throw new Error(`Fixture ${row.id} must copy the frozen activation action`);
  }
  if (JSON.stringify(contract.activationAction) !== JSON.stringify(row.activationAction)) {
    throw new Error(`Fixture ${row.id} activation action differs from the frozen topology`);
  }
}

function buildFixtureProvenance(row) {
  return {
    auditSource: row.auditSource,
    auditedNamedExports: row.auditedNamedExports,
    limitation: row.limitation,
    packageName: row.packageName,
    packageVersion: row.packageVersion,
    policy: row.provenance,
  };
}

function endpointSelector(scenario) {
  if (scenario === "navigation-menu-content-switch") {
    return '[data-benchmark-navigation-content="secondary"]:not([hidden])';
  }
  if (scenario === "tabs-activation-click") {
    return '[data-benchmark-panel="target"]:not([hidden])';
  }
  if (scenario === "accordion-toggle-click") {
    return '[data-benchmark-panel="target"]:not([hidden])';
  }
  if (scenario === "radio-group-change-sweep") {
    return '[data-benchmark-radio-item="target"][data-state="checked"]';
  }
  if (scenario.endsWith("-mount")) return "[data-benchmark-mount-root]";
  if (scenario.includes("item-highlight")) {
    return '[data-benchmark-item="target"][data-highlighted]';
  }
  if (scenario.startsWith("menu-submenu-")) {
    return '[data-benchmark-popup="submenu"]:not([hidden])';
  }
  return "[data-benchmark-popup]:not([hidden])";
}

function triggerSelector(scenario) {
  if (scenario.startsWith("combobox-")) return "[data-benchmark-input]";
  if (scenario === "navigation-menu-content-switch") {
    return '[data-benchmark-nav-trigger="secondary"]';
  }
  if (scenario === "tabs-activation-click") return '[data-benchmark-tab-trigger="target"]';
  if (scenario === "accordion-toggle-click") {
    return '[data-benchmark-accordion-trigger="target"]';
  }
  if (scenario === "radio-group-change-sweep") return '[data-benchmark-radio-item="target"]';
  if (scenario.startsWith("menu-submenu-")) return "[data-benchmark-submenu-trigger]";
  return "[data-benchmark-trigger]";
}

function itemSelector(scenario) {
  if (scenario.includes("item-highlight")) return "[data-benchmark-item]";
  if (scenario === "radio-group-change-sweep") return "[data-benchmark-radio-item]";
  return null;
}

function buildModuleSource(row, providerSource) {
  const contract = JSON.stringify(buildFixtureContract(row), null, 2);
  return `${providerSource.imports}
import { computed, createApp, Fragment, h, nextTick, ref, Teleport } from "vue";
import "${SHARED_STYLE_IMPORT}";

export const fixtureContract = Object.freeze(${contract});
export const fixtureIdentity = Object.freeze(${JSON.stringify({
    auditSource: row.auditSource,
    id: row.id,
    packageName: row.packageName,
    packageVersion: row.packageVersion,
    provider: row.provider,
    provenance: row.provenance,
    scenario: row.scenario,
  })});

const ITEM_COUNT = ${row.itemCount};
const COMPONENT_COUNT = ${row.componentCount};
const OUTSIDE_NODE_COUNT = ${row.outsideNodeCount};
const items = createRows(ITEM_COUNT, "Item");
const instances = createRows(COMPONENT_COUNT, "Control");

${sharedSourceHelpers()}

${providerSource.body}

export function assertEndpoint({ root, portalTarget }) {
  const selector = fixtureContract.endpointSelector;
  const endpoint = [root, portalTarget].find((element) => element.matches(selector))
    ?? root.querySelector(selector)
    ?? portalTarget.querySelector(selector);
  if (!endpoint) throw new Error("Vue comparator endpoint is not visible: " + selector);
  return endpoint;
}

export function mountFixture({ root, portalTarget }) {
  if (!(root instanceof HTMLElement) || !(portalTarget instanceof HTMLElement)) {
    throw new TypeError("mountFixture requires root and portalTarget HTMLElements");
  }
  assertEmpty(root, "Vue root before mount");
  assertEmpty(portalTarget, "Teleport target before mount");
  const app = createApp(Fixture, { portalTarget });
  app.mount(root);
  let disposed = false;
  return Object.freeze({
    app,
    async teardown() {
      if (disposed) throw new Error("Vue comparator fixture teardown called more than once");
      disposed = true;
      app.unmount();
      await nextTick();
      assertEmpty(root, "Vue root after unmount");
      assertEmpty(portalTarget, "Teleport target after unmount");
    },
  });
}
`;
}

function sharedSourceHelpers() {
  return `function createRows(count, labelPrefix) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    label: labelPrefix + " " + index,
    value: "value-" + index,
  }));
}

function assertEmpty(element, label) {
  if (element.childNodes.length !== 0) {
    throw new Error(label + " must be empty");
  }
}

function teleport(portalTarget, children) {
  return h(Teleport, { to: portalTarget }, children);
}

function shell(children) {
  const outside = Array.from({ length: OUTSIDE_NODE_COUNT }, (_, index) =>
    h("span", { class: "outside-node", key: "outside-" + index, "aria-hidden": "true" }),
  );
  return h("main", { class: "bench-shell", "data-benchmark-mount-root": "true" }, [
    outside.length ? h("div", { class: "outside-grid", "aria-hidden": "true" }, outside) : null,
    ...children,
  ]);
}`;
}

function buildZagSource(row) {
  const machineImport = row.packageImports.find(
    (name) => name.startsWith("@zag-js/") && !["@zag-js/core", "@zag-js/vue"].includes(name),
  );
  return {
    imports: `import * as zagCore from "@zag-js/core";
import { normalizeProps, useMachine } from "@zag-js/vue";
import * as machine from "${machineImport}";
void zagCore;`,
    body: zagBody(row),
  };
}

function zagBody(row) {
  const scenario = row.scenario;
  if (scenario.startsWith("dialog-")) return zagDialogBody(scenario);
  if (scenario.startsWith("select-")) return zagSelectBody(scenario);
  if (scenario === "menu-open" || scenario === "menu-item-highlight") return zagMenuBody();
  if (scenario.startsWith("menu-submenu-")) return zagNestedMenuBody();
  if (scenario.startsWith("combobox-")) return zagComboboxBody(scenario);
  if (scenario.startsWith("navigation-menu-")) return zagNavigationMenuBody();
  if (scenario.startsWith("tabs-")) return zagTabsBody();
  if (scenario.startsWith("accordion-")) return zagAccordionBody();
  if (scenario.startsWith("radio-group-")) return zagRadioBody();
  if (scenario === "tooltip-trigger-mount") return zagFloatingMountBody("tooltip");
  if (scenario === "popover-trigger-mount") return zagFloatingMountBody("popover");
  if (scenario === "preview-card-trigger-mount") return zagFloatingMountBody("preview-card");
  throw new Error(`Missing Zag Vue fixture builder for ${scenario}`);
}

function zagApiSetup(options) {
  return `const service = useMachine(machine.machine, ${options});
    const api = computed(() => machine.connect(service, normalizeProps));`;
}

function zagDialogBody(scenario) {
  const forceMounted = scenario === "dialog-trigger-mount";
  if (forceMounted) {
    return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    const apis = instances.map((row) => {
      const service = useMachine(machine.machine, { id: "dialog-" + row.id });
      return computed(() => machine.connect(service, normalizeProps));
    });
    return () => shell(apis.map((apiRef, index) => {
      const api = apiRef.value;
      return h(Fragment, { key: instances[index].id }, [
        h("button", { ...api.getTriggerProps(), class: "bench-trigger" }, "Dialog " + index),
        h("div", { ...api.getBackdropProps(), class: "bench-backdrop", hidden: !api.open, "data-benchmark-overlay": "true" }),
        h("div", {
          ...api.getContentProps(), class: "bench-popup", hidden: !api.open, "data-benchmark-content": "true", "data-benchmark-popup": "true",
        }, [
          h("h2", api.getTitleProps(), "Dialog " + index),
          h("p", api.getDescriptionProps(), "Closed dialog content " + index),
          h("button", { ...api.getCloseTriggerProps(), class: "bench-trigger" }, "Close"),
        ]),
      ]);
    }));
  },
};`;
  }
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    ${zagApiSetup('{ id: "dialog-open" }')}
    return () => {
      const value = api.value;
      return shell([h(Fragment, [
        h("button", { ...value.getTriggerProps(), class: "bench-trigger", "data-benchmark-trigger": "true" }, "Open dialog"),
        h("div", { ...value.getBackdropProps(), class: "bench-backdrop", hidden: !value.open, "data-benchmark-overlay": "true" }),
        h("div", {
          ...value.getContentProps(), class: "bench-popup", hidden: !value.open, "data-benchmark-content": "true", "data-benchmark-popup": "true",
        }, [h("h2", value.getTitleProps(), "Benchmark dialog"), h("p", value.getDescriptionProps(), "Dialog content"), h("button", { type: "button" }, "Focusable field"), h("button", value.getCloseTriggerProps(), "Close")])
      ])]);
    };
  },
};`;
}

function zagSelectBody(scenario) {
  const mount = scenario === "select-trigger-mount";
  const itemSource = mount ? 'createRows(10, "Option")' : "items";
  const instanceSource = mount ? "instances" : '[{ id: "open" }]';
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const localItems = ${itemSource};
    const apis = ${instanceSource}.map((row) => {
      const itemsMounted = ref(false);
      const collection = machine.collection({ items: localItems });
      const service = useMachine(machine.machine, { collection, defaultValue: [localItems[0].value], id: "select-" + row.id, positioning: { placement: "bottom-start", gutter: 8 }, onOpenChange({ open }) { if (open) itemsMounted.value = true; } });
      return { api: computed(() => machine.connect(service, normalizeProps)), itemsMounted };
    });
    return () => shell(apis.map(({ api: apiRef, itemsMounted }, rootIndex) => {
      const api = apiRef.value;
      const content = teleport(props.portalTarget, [h("div", { ...api.getPositionerProps(), hidden: !api.open, "data-benchmark-positioner": "true" }, h("div", {
        ...api.getContentProps(), class: "bench-popup", hidden: !api.open, "data-benchmark-content": "true", "data-benchmark-popup": "true",
      }, api.open && itemsMounted.value ? [h("ul", { class: "bench-list-popup", "data-benchmark-list": "true", "data-benchmark-viewport": "true" }, localItems.map((item, index) => h("li", {
        ...api.getItemProps({ item }), class: "bench-item", "data-benchmark-item": index === localItems.length - 1 ? "target" : "true", key: item.id,
      }, [h("span", api.getItemTextProps({ item }), item.label), h("span", api.getItemIndicatorProps({ item }), "*")])))] : []))]);
      return h("div", { ...api.getRootProps(), key: "select-" + rootIndex }, [
        h("button", { ...api.getTriggerProps(), class: "bench-trigger", "data-benchmark-trigger": "true" }, [api.valueAsString || "Choose item", h("span", api.getIndicatorProps(), "v")]),
        content,
      ]);
    }));
  },
};`;
}

function zagMenuBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const itemsMounted = ref(false);
    ${zagApiSetup('{ id: "menu-open", onOpenChange({ open }) { if (open) itemsMounted.value = true; } }')}
    return () => {
      const value = api.value;
      return shell([h(Fragment, [
        h("button", { ...value.getTriggerProps(), class: "bench-trigger", "data-benchmark-trigger": "true" }, "Open menu"),
        teleport(props.portalTarget, [h("div", { ...value.getPositionerProps(), hidden: !value.open, "data-benchmark-positioner": "true" }, h("ul", {
          ...value.getContentProps(), class: "bench-popup bench-list-popup", hidden: !value.open, "data-benchmark-content": "true", "data-benchmark-popup": "true",
        }, [...(itemsMounted.value ? items.map((item, index) => h("li", {
          ...value.getItemProps({ value: item.value }), class: "bench-item", "data-benchmark-item": index === items.length - 1 ? "target" : "true", key: item.id,
        }, item.label)) : [])]))]),
      ])]);
    };
  },
};`;
}

function zagNestedMenuBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const submenuItemsMounted = ref(false);
    const parentService = useMachine(machine.machine, { id: "menu-parent", positioning: { placement: "bottom-start", gutter: 8 } });
    const childService = useMachine(machine.machine, { id: "menu-child", positioning: { placement: "right-start", gutter: 8 }, onOpenChange({ open }) { if (open) submenuItemsMounted.value = true; } });
    const parent = computed(() => machine.connect(parentService, normalizeProps));
    const child = computed(() => machine.connect(childService, normalizeProps));
    parentService.send({ type: "CHILD.SET", value: childService });
    childService.send({ type: "PARENT.SET", value: parentService });
    return () => {
      const parentApi = parent.value;
      const childApi = child.value;
      return shell([h(Fragment, [
        h("button", { ...parentApi.getTriggerProps(), class: "bench-trigger", "data-benchmark-trigger": "true" }, "Open menu"),
        teleport(props.portalTarget, [h("div", { ...parentApi.getPositionerProps(), hidden: !parentApi.open, "data-benchmark-positioner": "parent" }, h("ul", { ...parentApi.getContentProps(), class: "bench-popup", hidden: !parentApi.open, "data-benchmark-content": "parent", "data-benchmark-popup": "parent" }, [h("li", { ...parentApi.getTriggerItemProps(childApi), class: "bench-item", "data-benchmark-submenu-trigger": "true" }, "More items")]))]),
        teleport(props.portalTarget, [h("div", { ...childApi.getPositionerProps(), hidden: !childApi.open, "data-benchmark-positioner": "submenu" }, h("ul", { ...childApi.getContentProps(), class: "bench-popup bench-list-popup", hidden: !childApi.open, "data-benchmark-content": "submenu", "data-benchmark-popup": "submenu" }, [...(submenuItemsMounted.value ? items.map((item, index) => h("li", { ...childApi.getItemProps({ value: item.value }), class: "bench-item", "data-benchmark-item": index === items.length - 1 ? "target" : "true", "data-benchmark-submenu-item": "true", key: item.id }, item.label)) : [])]))]),
      ])]);
    };
  },
};`;
}

function zagComboboxBody(scenario) {
  const mount = scenario === "combobox-trigger-mount";
  const itemSource = mount ? 'createRows(10, "Choice")' : "items";
  const instanceSource = mount ? "instances" : '[{ id: "open" }]';
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const originalItems = ${itemSource};
    const apis = ${instanceSource}.map((row) => {
      const visibleItems = ref(originalItems);
      const itemsMounted = ref(false);
      const machineProps = computed(() => ({
        id: "combobox-" + row.id,
        collection: machine.collection({ items: visibleItems.value }),
        openOnKeyPress: true,
        onInputValueChange({ inputValue }) {
          visibleItems.value = originalItems.filter((item) =>
            item.label.toLowerCase().includes(inputValue.toLowerCase()),
          );
        },
        onOpenChange({ open }) {
          visibleItems.value = originalItems;
          if (open) itemsMounted.value = true;
        },
      }));
      const service = useMachine(machine.machine, machineProps);
      const api = computed(() => machine.connect(service, normalizeProps));
      return { api, itemsMounted, visibleItems };
    });
    function renderItem(api, item, index, visibleItems) {
      return h("li", {
        ...api.getItemProps({ item }),
        class: "bench-item",
        "data-benchmark-item": index === visibleItems.length - 1 ? "target" : "true",
        key: item.id,
      }, h("span", api.getItemTextProps({ item }), item.label));
    }
    return () => shell(apis.map(({ api: apiRef, itemsMounted, visibleItems }, rootIndex) => {
      const api = apiRef.value;
      const currentItems = visibleItems.value;
      const content = teleport(props.portalTarget, [
        h("div", { ...api.getPositionerProps(), hidden: !api.open, "data-benchmark-positioner": "true" }, h("div", {
          ...api.getContentProps(),
          class: "bench-popup",
          hidden: !api.open,
          "data-benchmark-content": "true",
          "data-benchmark-popup": "true",
        }, api.open && itemsMounted.value ? [h("ul", {
          class: "bench-list-popup",
          "data-benchmark-list": "true",
          "data-benchmark-viewport": "true",
        }, currentItems.map((item, index) => renderItem(api, item, index, currentItems)))] : [])),
      ]);
      return h("div", { ...api.getRootProps(), key: "combobox-" + rootIndex }, [
        h("div", api.getControlProps(), [
          h("input", { ...api.getInputProps(), class: "bench-trigger", "data-benchmark-input": "true" }),
        ]),
        content,
      ]);
    }));
  },
};`;
}

function zagNavigationMenuBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    ${zagApiSetup('{ id: "navigation-menu", closeDelay: 0, defaultValue: "primary", disableHoverTrigger: true, openDelay: 0 }')}
    const groups = [createRows(500, "Product link"), createRows(500, "Resource link")];
    return () => {
      const value = api.value;
      const names = ["primary", "secondary"];
      const contents = names.map((name, index) => h("div", { ...value.getContentProps({ value: name }), class: "bench-nav-content", hidden: value.value !== name, "data-benchmark-content": name, "data-benchmark-navigation-content": name }, [...groups[index].map((item) => h("a", { "data-benchmark-item": "true", "data-benchmark-navigation-link": name, href: "#" + name + "-" + item.id, key: item.id }, item.label))]));
      return shell([h("nav", { ...value.getRootProps(), "aria-label": "Benchmark navigation" }, [h("div", value.getListProps(), names.map((name) => h("div", value.getItemProps({ value: name }), [h("button", { ...value.getTriggerProps({ value: name }), class: "bench-trigger", "data-benchmark-nav-trigger": name }, name), h("span", value.getTriggerProxyProps({ value: name })), h("span", value.getViewportProxyProps({ value: name }))]))), teleport(props.portalTarget, [h("div", { ...value.getViewportPositionerProps(), "data-benchmark-positioner": "true" }, h("div", { ...value.getViewportProps(), class: "bench-popup bench-nav-popup", "data-benchmark-popup": "true", "data-benchmark-viewport": "true" }, contents))])])]);
    };
  },
};`;
}

function zagTabsBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    ${zagApiSetup('{ activationMode: "manual", defaultValue: items[0].value, id: "tabs" }')}
    return () => { const value = api.value; return shell([h("div", value.getRootProps(), [h("div", { ...value.getListProps(), class: "bench-collection-list" }, items.map((item, index) => h("button", { ...value.getTriggerProps({ value: item.value }), class: "bench-item", "data-benchmark-tab-trigger": index === items.length - 1 ? "target" : "true", key: item.id }, item.label))), ...items.map((item, index) => h("div", { ...value.getContentProps({ value: item.value }), class: "bench-collection-panel", hidden: value.value !== item.value, "data-benchmark-panel": index === items.length - 1 ? "target" : "true", key: item.id }, "Panel " + item.id))])]); };
  },
};`;
}

function zagAccordionBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    ${zagApiSetup('{ collapsible: true, defaultValue: [], id: "accordion" }')}
    return () => { const value = api.value; return shell([h("div", value.getRootProps(), items.map((item, index) => h("div", { ...value.getItemProps({ value: item.value }), class: "bench-collection-item", key: item.id }, [h("h3", h("button", { ...value.getItemTriggerProps({ value: item.value }), class: "bench-item", "data-benchmark-accordion-trigger": index === items.length - 1 ? "target" : "true" }, item.label)), h("div", { ...value.getItemContentProps({ value: item.value }), class: "bench-collection-panel", hidden: !value.value.includes(item.value), "data-benchmark-panel": index === items.length - 1 ? "target" : "true" }, "Panel " + item.id)])))]); };
  },
};`;
}

function zagRadioBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    ${zagApiSetup('{ defaultValue: items[0].value, id: "radio-group", name: "zag-radio-benchmark" }')}
    return () => { const value = api.value; return shell([h("div", value.getRootProps(), items.map((item, index) => h("label", { ...value.getItemProps({ value: item.value }), class: "bench-radio-item", "data-benchmark-radio-item": index === items.length - 1 ? "target" : "true", key: item.id }, [h("span", value.getItemControlProps({ value: item.value })), h("span", value.getItemTextProps({ value: item.value }), item.label), h("input", value.getItemHiddenInputProps({ value: item.value }))])))]); };
  },
};`;
}

function zagFloatingMountBody(kind) {
  const options =
    kind === "tooltip" || kind === "preview-card"
      ? '{ id: "' + kind + '-" + row.id, closeDelay: 0, openDelay: 0 }'
      : '{ id: "popover-" + row.id }';
  const content =
    kind === "popover"
      ? '[h("h2", api.getTitleProps(), "Popover " + index), h("p", api.getDescriptionProps(), "Closed popover content " + index), h("button", api.getCloseTriggerProps(), "Close")]'
      : `"${kind} " + index`;
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const apis = instances.map((row) => { const service = useMachine(machine.machine, ${options}); return computed(() => machine.connect(service, normalizeProps)); });
    return () => shell(apis.map((apiRef, index) => { const api = apiRef.value; return h(Fragment, { key: "${kind}-" + index }, [h("button", { ...api.getTriggerProps(), class: "bench-trigger" }, "${kind} " + index), teleport(props.portalTarget, [h("div", { ...api.getPositionerProps(), hidden: !api.open, "data-benchmark-positioner": "true" }, h("div", { ...api.getContentProps(), class: "bench-popup", hidden: !api.open, "data-benchmark-content": "true", "data-benchmark-popup": "true" }, ${content}))])]); }));
  },
};`;
}

function buildRekaSource(row) {
  return {
    imports: `import { ${row.auditedNamedExports.join(", ")} } from "reka-ui";`,
    body: rekaBody(row),
  };
}

function rekaBody(row) {
  const scenario = row.scenario;
  if (scenario.startsWith("dialog-")) return rekaDialogBody(scenario);
  if (scenario.startsWith("select-")) return rekaSelectBody(scenario);
  if (scenario === "menu-open" || scenario === "menu-item-highlight") return rekaMenuBody();
  if (scenario.startsWith("menu-submenu-")) return rekaNestedMenuBody();
  if (scenario.startsWith("combobox-")) return rekaComboboxBody(scenario);
  if (scenario.startsWith("tabs-")) return rekaTabsBody();
  if (scenario.startsWith("accordion-")) return rekaAccordionBody();
  if (scenario.startsWith("radio-group-")) return rekaRadioBody();
  if (scenario === "tooltip-trigger-mount") return rekaTooltipBody();
  if (scenario === "popover-trigger-mount") return rekaPopoverBody();
  if (scenario === "preview-card-trigger-mount") return rekaPreviewCardBody();
  throw new Error(`Missing audited Reka fixture builder for ${scenario}`);
}

function rekaDialogBody(scenario) {
  const mount = scenario === "dialog-trigger-mount";
  const source = mount ? "instances" : '[{ id: "open" }]';
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    return () => shell(${source}.map((row) => h(DialogRoot, { key: row.id, unmountOnHide: false }, { default: ({ open }) => [h(DialogTrigger, { class: "bench-trigger", "data-benchmark-trigger": "true" }, { default: () => "Open dialog" }), h(DialogOverlay, { class: "bench-backdrop", hidden: !open, "data-benchmark-overlay": "true" }), h(DialogContent, { class: "bench-popup", hidden: !open, "data-benchmark-content": "true", "data-benchmark-popup": "true" }, { default: () => [h(DialogTitle, {}, { default: () => "Benchmark dialog" }), h(DialogDescription, {}, { default: () => "Dialog content" }), h("button", { type: "button" }, "Focusable field"), h(DialogClose, {}, { default: () => "Close" })] })] })));
  },
};`;
}

function rekaSelectBody(scenario) {
  const mount = scenario === "select-trigger-mount";
  const localItems = mount ? 'createRows(10, "Option")' : "items";
  const roots = mount ? "instances" : '[{ id: "open" }]';
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const selectItems = ${localItems};
    const roots = ${roots}.map((row) => ({ itemsMounted: ref(false), row }));
    function renderItem(item, index) {
      return h(SelectItem, {
        class: "bench-item",
        value: item.value,
        "data-benchmark-item": index === selectItems.length - 1 ? "target" : "true",
        key: item.id,
      }, {
        default: () => [
          h(SelectItemIndicator, {}, { default: () => "*" }),
          h(SelectItemText, {}, { default: () => item.label }),
        ],
      });
    }
    function renderRoot({ itemsMounted, row }) {
      return h(SelectRoot, { defaultValue: selectItems[0].value, key: row.id, "onUpdate:open": (open) => { if (open) itemsMounted.value = true; } }, {
        default: ({ open }) => [
          h(SelectTrigger, { class: "bench-trigger", "data-benchmark-trigger": "true" }, {
            default: () => [
              h(SelectValue, { placeholder: "Choose item" }),
              h(SelectIcon, {}, { default: () => "v" }),
            ],
          }),
          h(SelectPortal, { to: props.portalTarget }, {
            default: () => h(SelectContent, {
              class: "bench-popup",
              forceMount: true,
              hidden: !open,
              position: "popper",
              sideOffset: 8,
              "data-benchmark-content": "true",
              "data-benchmark-positioner": "true",
              "data-benchmark-popup": "true",
            }, {
              default: () => open && itemsMounted.value
                ? [h(SelectViewport, { class: "bench-list-popup", "data-benchmark-list": "true", "data-benchmark-viewport": "true" }, { default: () => selectItems.map(renderItem) })]
                : [],
            }),
          }),
        ],
      });
    }
    return () => shell(roots.map(renderRoot));
  },
};`;
}

function rekaMenuBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const itemsMounted = ref(false);
    return () => shell([h(DropdownMenuRoot, { "onUpdate:open": (open) => { if (open) itemsMounted.value = true; } }, { default: ({ open }) => [h(DropdownMenuTrigger, { class: "bench-trigger", "data-benchmark-trigger": "true" }, { default: () => "Open menu" }), h(DropdownMenuPortal, { to: props.portalTarget }, { default: () => h(DropdownMenuContent, { class: "bench-popup bench-list-popup", forceMount: true, hidden: !open, "data-benchmark-content": "true", "data-benchmark-positioner": "true", "data-benchmark-popup": "true" }, { default: () => itemsMounted.value ? items.map((item, index) => h(DropdownMenuItem, { class: "bench-item", "data-benchmark-item": index === items.length - 1 ? "target" : "true", key: item.id }, { default: () => item.label })) : [] }) })] })]);
  },
};`;
}

function rekaNestedMenuBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const submenuItemsMounted = ref(false);
    const renderItems = () => submenuItemsMounted.value
      ? items.map((item, index) => h(DropdownMenuItem, {
          class: "bench-item",
          "data-benchmark-item": index === items.length - 1 ? "target" : "true",
          "data-benchmark-submenu-item": "true",
          key: item.id,
        }, { default: () => item.label }))
      : [];
    const renderSubmenu = ({ open: submenuOpen }) => [
      h(DropdownMenuSubTrigger, {
        class: "bench-item",
        "data-benchmark-submenu-trigger": "true",
      }, { default: () => "More items" }),
      h(DropdownMenuPortal, { to: props.portalTarget }, {
        default: () => h(DropdownMenuSubContent, {
          class: "bench-popup bench-list-popup",
          forceMount: true,
          hidden: !submenuOpen,
          "data-benchmark-content": "submenu",
          "data-benchmark-positioner": "submenu",
          "data-benchmark-popup": "submenu",
        }, { default: renderItems }),
      }),
    ];
    const renderParent = ({ open: parentOpen }) => [
      h(DropdownMenuTrigger, {
        class: "bench-trigger",
        "data-benchmark-trigger": "true",
      }, { default: () => "Open menu" }),
      h(DropdownMenuPortal, { to: props.portalTarget }, {
        default: () => h(DropdownMenuContent, {
          class: "bench-popup",
          forceMount: true,
          hidden: !parentOpen,
          "data-benchmark-content": "parent",
          "data-benchmark-positioner": "parent",
          "data-benchmark-popup": "parent",
        }, {
          default: () => h(DropdownMenuSub, {
            "onUpdate:open": (open) => { if (open) submenuItemsMounted.value = true; },
          }, { default: renderSubmenu }),
        }),
      }),
    ];
    return () => shell([h(DropdownMenuRoot, {}, { default: renderParent })]);
  },
};`;
}

function rekaComboboxBody(scenario) {
  const mount = scenario === "combobox-trigger-mount";
  if (mount) {
    return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    return () => shell(instances.map((row) => h(ComboboxRoot, { key: row.id }, { default: ({ open }) => [
      h(ComboboxInput, { class: "bench-trigger", "data-benchmark-input": "true" }),
      h(ComboboxPortal, { to: props.portalTarget }, { default: () => h(ComboboxContent, {
        class: "bench-popup",
        forceMount: true,
        hidden: !open,
        "data-benchmark-content": "true",
        "data-benchmark-positioner": "true",
        "data-benchmark-popup": "true",
      }, { default: () => [] }) }),
    ] })));
  },
};`;
  }
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    const itemsMounted = ref(false);
    return () => shell([h(ComboboxRoot, { "onUpdate:open": (open) => { if (open) itemsMounted.value = true; } }, { default: ({ open }) => [
      h(ComboboxInput, { class: "bench-trigger", "data-benchmark-input": "true" }),
      h(ComboboxPortal, { to: props.portalTarget }, { default: () => h(ComboboxContent, {
        class: "bench-popup",
        forceMount: true,
        hidden: !open,
        "data-benchmark-content": "true",
        "data-benchmark-positioner": "true",
        "data-benchmark-popup": "true",
      }, { default: () => open && itemsMounted.value ? [h(ComboboxViewport, {
        class: "bench-list-popup",
        "data-benchmark-list": "true",
        "data-benchmark-viewport": "true",
      }, { default: () => items.map((item, index) => h(ComboboxItem, {
        class: "bench-item",
        value: item.value,
        "data-benchmark-item": index === items.length - 1 ? "target" : "true",
        key: item.id,
      }, { default: () => item.label })) })] : [] }) }),
    ] })]);
  },
};`;
}

function rekaTabsBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    return () => shell([h(TabsRoot, { activationMode: "manual", defaultValue: items[0].value, unmountOnHide: false }, { default: ({ modelValue }) => [h(TabsList, { class: "bench-collection-list" }, { default: () => items.map((item, index) => h(TabsTrigger, { class: "bench-item", value: item.value, "data-benchmark-tab-trigger": index === items.length - 1 ? "target" : "true", key: item.id }, { default: () => item.label })) }), ...items.map((item, index) => h(TabsContent, { class: "bench-collection-panel", value: item.value, forceMount: true, hidden: modelValue !== item.value, "data-benchmark-panel": index === items.length - 1 ? "target" : "true", key: item.id }, { default: () => "Panel " + item.id }))] })]);
  },
};`;
}

function rekaAccordionBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    return () => shell([h(AccordionRoot, { type: "single", collapsible: true, unmountOnHide: false }, { default: ({ modelValue }) => items.map((item, index) => h(AccordionItem, { class: "bench-collection-item", value: item.value, key: item.id }, { default: () => [h(AccordionHeader, {}, { default: () => h(AccordionTrigger, { class: "bench-item", "data-benchmark-accordion-trigger": index === items.length - 1 ? "target" : "true" }, { default: () => item.label }) }), h(AccordionContent, { class: "bench-collection-panel", hidden: modelValue !== item.value, "data-benchmark-panel": index === items.length - 1 ? "target" : "true" }, { default: () => "Panel " + item.id })] })) })]);
  },
};`;
}

function rekaRadioBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup() {
    return () => shell([h(RadioGroupRoot, { defaultValue: items[0].value, class: "bench-collection-list" }, { default: () => items.map((item, index) => h(RadioGroupItem, { class: "bench-radio-item", value: item.value, "data-benchmark-radio-item": index === items.length - 1 ? "target" : "true", key: item.id }, { default: () => item.label })) })]);
  },
};`;
}

function rekaTooltipBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    return () => shell([h(TooltipProvider, { delayDuration: 0 }, { default: () => instances.map((row) => h(TooltipRoot, { key: row.id }, { default: ({ open }) => [h(TooltipTrigger, { class: "bench-trigger" }, { default: () => "Tooltip " + row.id }), h(TooltipPortal, { to: props.portalTarget }, { default: () => h(TooltipContent, { class: "bench-popup", forceMount: true, hidden: !open, "data-benchmark-content": "true", "data-benchmark-positioner": "true", "data-benchmark-popup": "true" }, { default: () => "Tooltip " + row.id }) })] })) })]);
  },
};`;
}

function rekaPopoverBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    return () => shell(instances.map((row) => h(PopoverRoot, { key: row.id }, { default: ({ open }) => [h(PopoverTrigger, { class: "bench-trigger" }, { default: () => "Popover " + row.id }), h(PopoverPortal, { to: props.portalTarget }, { default: () => h(PopoverContent, { class: "bench-popup", forceMount: true, hidden: !open, "data-benchmark-content": "true", "data-benchmark-positioner": "true", "data-benchmark-popup": "true" }, { default: () => [h("h2", "Popover " + row.id), h("p", "Closed popover content " + row.id), h(PopoverClose, {}, { default: () => "Close" })] }) })] })));
  },
};`;
}

function rekaPreviewCardBody() {
  return `const Fixture = {
  props: { portalTarget: { required: true } },
  setup(props) {
    return () => shell(instances.map((row) => h(HoverCardRoot, { closeDelay: 0, openDelay: 0, key: row.id }, { default: ({ open }) => [h(HoverCardTrigger, { class: "bench-trigger" }, { default: () => "Preview " + row.id }), h(HoverCardPortal, { to: props.portalTarget }, { default: () => h(HoverCardContent, { class: "bench-popup", forceMount: true, hidden: !open, "data-benchmark-content": "true", "data-benchmark-positioner": "true", "data-benchmark-popup": "true" }, { default: () => "Preview card content " + row.id }) })] })));
  },
};`;
}

function validateSourceImports(source, expectedPackageImports, row) {
  if (typeof source !== "string" || source.length === 0) {
    throw new Error(`Fixture ${row.id} source must be a nonempty string`);
  }
  const actualImports = parseModuleSpecifiers(source).filter(
    (specifier) => specifier !== SHARED_STYLE_IMPORT,
  );
  expectExactArray(
    [...actualImports].sort((left, right) => left.localeCompare(right, "en")),
    [...expectedPackageImports].sort((left, right) => left.localeCompare(right, "en")),
    `${row.id} source imports`,
  );
  if (actualImports.filter((specifier) => specifier === SHARED_VUE_IMPORT).length !== 1) {
    throw new Error(`Fixture ${row.id} must import one shared Vue runtime`);
  }
  if (
    actualImports.some(
      (specifier) => specifier.startsWith("vue/") || specifier.includes("vue/dist"),
    )
  ) {
    throw new Error(`Fixture ${row.id} imports another Vue runtime entry`);
  }
}

function parseModuleSpecifiers(source) {
  return [...source.matchAll(/\bimport\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["'];?/g)].map(
    (match) => match[1],
  );
}

function parseNamedImports(source, packageName) {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*["']${escaped}["']`));
  if (!match) return [];
  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function requireExactObjectKeys(value, expectedKeys, label) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  expectExactArray(Object.keys(value).sort(), [...expectedKeys].sort(), `${label} keys`);
}

function expectExactArray(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} differ from the frozen comparator contract`);
  }
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

export const vueComparatorExpectedResolvedVersions = Object.freeze({
  "zag-vue": zagVueExpectedResolvedVersions,
  "reka-ui": rekaUiExpectedResolvedVersions,
});

export const vueComparatorExcludedRows = Object.freeze(
  rekaUiScenarioDecisions
    .filter(({ decision }) => decision === "exclude")
    .map(({ scenario, limitation, source }) =>
      Object.freeze({ id: `${scenario}:reka-ui`, limitation, scenario, source }),
    ),
);
