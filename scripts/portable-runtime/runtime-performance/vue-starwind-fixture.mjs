import path from "node:path";

import { vuePerformanceProviderRows } from "./vue-plan.mjs";

const starwindRows = vuePerformanceProviderRows.filter(
  ({ provider }) => provider === "starwind-vue",
);
const rowByScenario = new Map(starwindRows.map((row) => [row.scenario, row]));

export const starwindVueFixtureScenarioKeys = Object.freeze(
  starwindRows.map(({ scenario }) => scenario),
);

export const starwindVueFixtureImports = Object.freeze({
  accordion: Object.freeze([
    "AccordionHeader",
    "AccordionItem",
    "AccordionPanel",
    "AccordionRoot",
    "AccordionTrigger",
  ]),
  combobox: Object.freeze([
    "ComboboxInput",
    "ComboboxInputGroup",
    "ComboboxItem",
    "ComboboxItemText",
    "ComboboxList",
    "ComboboxPopup",
    "ComboboxPortal",
    "ComboboxPositioner",
    "ComboboxRoot",
  ]),
  dialog: Object.freeze([
    "DialogBackdrop",
    "DialogClose",
    "DialogDescription",
    "DialogPopup",
    "DialogRoot",
    "DialogTitle",
    "DialogTrigger",
  ]),
  menu: Object.freeze([
    "MenuItem",
    "MenuPopup",
    "MenuPortal",
    "MenuPositioner",
    "MenuRoot",
    "MenuSubmenuRoot",
    "MenuSubmenuTrigger",
    "MenuTrigger",
  ]),
  "navigation-menu": Object.freeze([
    "NavigationMenuContent",
    "NavigationMenuItem",
    "NavigationMenuList",
    "NavigationMenuPopup",
    "NavigationMenuPortal",
    "NavigationMenuPositioner",
    "NavigationMenuRoot",
    "NavigationMenuTrigger",
    "NavigationMenuViewport",
  ]),
  popover: Object.freeze([
    "PopoverClose",
    "PopoverDescription",
    "PopoverPopup",
    "PopoverPortal",
    "PopoverPositioner",
    "PopoverRoot",
    "PopoverTitle",
    "PopoverTrigger",
  ]),
  "preview-card": Object.freeze([
    "PreviewCardPopup",
    "PreviewCardPortal",
    "PreviewCardPositioner",
    "PreviewCardRoot",
    "PreviewCardTrigger",
  ]),
  "radio-group": Object.freeze(["RadioGroupRoot"]),
  select: Object.freeze([
    "SelectItem",
    "SelectItemIndicator",
    "SelectItemText",
    "SelectList",
    "SelectPopup",
    "SelectPortal",
    "SelectPositioner",
    "SelectRoot",
    "SelectTrigger",
    "SelectValue",
  ]),
  tabs: Object.freeze(["TabsList", "TabsPanel", "TabsRoot", "TabsTab"]),
  tooltip: Object.freeze([
    "TooltipPopup",
    "TooltipPortal",
    "TooltipPositioner",
    "TooltipRoot",
    "TooltipTrigger",
  ]),
});

export function buildStarwindVuePerformanceAliases({ repoRoot, vueEntry }) {
  requireNonemptyString(repoRoot, "repoRoot");
  requireNonemptyString(vueEntry, "vueEntry");
  const vueDist = path.join(path.resolve(repoRoot), "packages/vue/dist");
  const runtimeDist = path.join(path.resolve(repoRoot), "packages/runtime/dist");
  return Object.freeze({
    alias: Object.freeze([
      Object.freeze({
        find: /^@starwind-ui\/vue\/(.+)$/,
        replacement: slash(path.join(vueDist, "$1/index.js")),
      }),
      Object.freeze({
        find: /^@starwind-ui\/runtime\/(.+)$/,
        replacement: slash(path.join(runtimeDist, "$1.js")),
      }),
      Object.freeze({ find: /^vue$/, replacement: slash(path.resolve(vueEntry)) }),
    ]),
    dedupe: Object.freeze(["vue"]),
  });
}

export function buildStarwindVueFixture(scenario) {
  const plan = rowByScenario.get(scenario);
  if (!plan) {
    throw new Error(`Unknown Starwind Vue performance scenario: ${scenario}`);
  }
  const source = buildFixtureSource(plan);
  return Object.freeze({
    html: fixtureHtml(),
    plan,
    scenario,
    source,
    styles: fixtureStyles(),
  });
}

export function buildAllStarwindVueFixtures() {
  return Object.freeze(starwindVueFixtureScenarioKeys.map(buildStarwindVueFixture));
}

function buildFixtureSource(plan) {
  const imports = starwindVueFixtureImports[plan.component];
  if (!imports) throw new Error(`Missing Starwind Vue fixture imports for ${plan.component}`);
  const extraImports =
    plan.component === "radio-group" ? '\nimport { RadioRoot } from "@starwind-ui/vue/radio";' : "";
  const renderBody = renderScenario(plan);
  const behavior = scenarioBehavior(plan);
  return `import { createApp, defineComponent, h, nextTick, ref } from "vue";
import { ${imports.join(", ")} } from "@starwind-ui/vue/${plan.component}";${extraImports}

const SCENARIO = ${JSON.stringify(plan.scenario)};
const DOM_PHASES = ${JSON.stringify(plan.domPhases)};
const ACTIVATION_ACTION = ${JSON.stringify(plan.activationAction)};
const OVERLAY_SELECTOR = "#runtime-perf-overlays";
const host = document.querySelector("#app");
const overlay = document.querySelector(OVERLAY_SELECTOR);
if (!(host instanceof HTMLElement) || !(overlay instanceof HTMLElement)) {
  throw new Error("Runtime performance fixture hosts are missing.");
}

const makeRows = (count, prefix = "item") =>
  Array.from({ length: count }, (_, index) => ({
    id: prefix + "-" + index,
    label: prefix + " " + index,
    value: String(index),
  }));
const slot = (value) => ({ default: () => value });
const forceLayout = (element) => element.getBoundingClientRect();
const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const collectionOpen = ref(false);
const DeferredCollection = defineComponent({
  name: "DeferredBenchmarkCollection",
  setup(_, { slots }) {
    return () => (collectionOpen.value ? slots.default?.() : []);
  },
});
const Fixture = defineComponent({
  name: "StarwindRuntimePerformanceFixture",
  setup() {
    return () => renderFixture({ collectionOpen });
  },
});

function renderFixture(state) {
${indent(renderBody, 2)}
}

let app;
function mount() {
  if (app) throw new Error("Fixture is already mounted.");
  assertContainersEmpty();
  app = createApp(Fixture);
  app.config.errorHandler = (error) => {
    queueMicrotask(() => { throw error; });
  };
  app.mount(host);
}

function unmount() {
  app?.unmount();
  app = undefined;
  collectionOpen.value = false;
}

async function settle() {
  await nextTick();
  await frame();
  await nextTick();
}

function required(selector, root = document) {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error("Missing fixture element: " + selector);
  return element;
}

async function setup() {
${indent(behavior.setup, 2)}
}

async function measure() {
${indent(behavior.measure, 2)}
}

function assertVisibleEndpoint() {
${indent(behavior.assertEndpoint, 2)}
}

function assertContainersEmpty() {
  if (host.childElementCount !== 0 || overlay.childElementCount !== 0) {
    throw new Error(
      "Fixture teardown left DOM behind: root=" + host.childElementCount +
        ", overlay=" + overlay.childElementCount,
    );
  }
}

function all(selector, root = document) {
  return [...root.querySelectorAll(selector)].filter((element) => element instanceof HTMLElement);
}

function isVisible(element) {
  if (element.closest("[hidden]")) return false;
  return getComputedStyle(element).display !== "none";
}

function isVisiblePart(element, fact) {
  if (fact.endsWith("Positioners")) {
    const popup = element.querySelector('[data-benchmark-part-popup]');
    if (popup instanceof HTMLElement) return isVisible(popup);
  }
  return isVisible(element);
}

const FACT_SELECTORS = Object.freeze({
    Contents: "[data-benchmark-part-content]",
    Overlays: "[data-benchmark-part-overlay]",
    Panels: "[data-benchmark-part-panel]",
    Popups: "[data-benchmark-part-popup]",
    Positioners: "[data-benchmark-part-positioner]",
    PrimaryContents: '[data-benchmark-part-content="primary"]',
    SecondaryContents: '[data-benchmark-part-content="secondary"]',
    SubmenuContents: '[data-benchmark-part-submenu-content]',
    Viewports: "[data-benchmark-part-viewport]",
    Lists: "[data-benchmark-part-list]",
});

function countFact(fact) {
    if (fact === "itemNodes") return all("[data-benchmark-item-node]").length;
    if (fact === "submenuItemNodes") return all("[data-benchmark-submenu-item-node]").length;
    if (fact === "contentLinks") return all("[data-benchmark-content-link]").length;
    if (fact === "primaryContentLinks") return all('[data-benchmark-content-link="primary"]').length;
    if (fact === "secondaryContentLinks") return all('[data-benchmark-content-link="secondary"]').length;
    if (fact === "checkedItems") return all("[data-benchmark-item-node][data-checked]").length;
    if (fact === "targetCheckedItems") return all("[data-benchmark-target][data-checked]").length;
    if (fact === "visibleTargetPanels") {
      return all("[data-benchmark-target][data-benchmark-part-panel]").filter((element) => isVisible(element)).length;
    }
    const match = /^(hidden|visible)(.+)$/.exec(fact);
    if (match) {
      const [, visibility, part] = match;
      const selector = FACT_SELECTORS[part];
      if (!selector) throw new Error("Unknown visibility phase fact: " + fact);
      return all(selector).filter((element) => isVisiblePart(element, fact) === (visibility === "visible")).length;
    }
    const selector = FACT_SELECTORS[fact[0].toUpperCase() + fact.slice(1)];
    if (!selector) throw new Error("Unknown DOM phase fact: " + fact);
    return all(selector).length;
}

function assertDomPhase(phase) {
    const expected = DOM_PHASES[phase];
    for (const [fact, count] of Object.entries(expected)) {
      const actual = countFact(fact);
      if (actual !== count) {
        throw new Error(
          "DOM phase differs for " + SCENARIO + " " + phase + " " + fact +
            ": expected " + count + ", received " + actual,
        );
      }
    }
}

async function acceptSubmenuOpen() {
    const submenu = required("[data-sw-menu-submenu-root]");
    if (submenu.getAttribute("data-state") !== "open") {
      throw new Error("The uncontrolled submenu did not accept the open action.");
    }
    collectionOpen.value = true;
    await settle();
}

async function teardown() {
  unmount();
  await nextTick();
  assertContainersEmpty();
}

window.__runtimePerf = Object.freeze({
  assertVisibleEndpoint,
  measure,
  mount,
  ready: true,
  scenario: SCENARIO,
  setup,
  teardown,
  unmount,
});
`;
}

function renderScenario(plan) {
  const marker = JSON.stringify(plan.scenario);
  if (plan.scenario === "radio-group-high-count-mount" && plan.itemCount !== 1_000) {
    throw new Error("Starwind Radio Group mount scale must remain 1,000 items");
  }
  if (plan.scenario === "radio-group-change-sweep" && plan.itemCount !== 100) {
    throw new Error("Starwind Radio Group sweep scale must remain 100 items");
  }
  const itemCount = plan.scenario.startsWith("menu-submenu")
    ? plan.itemCount
    : plan.componentCount > 1
      ? plan.itemCount / plan.componentCount
      : plan.itemCount;
  const wrap = (expression) =>
    `return h("div", { "data-benchmark-fixture": SCENARIO, "data-benchmark-marker": ${marker} }, [${expression}]);`;

  if (plan.component === "dialog") {
    const dialog = `h(DialogRoot, null, slot([
      h(DialogTrigger, { "data-benchmark-trigger": "", type: "button" }, slot("Open dialog")),
      h(DialogBackdrop, { "data-benchmark-part-overlay": "" }),
      h(DialogPopup, { "data-benchmark-endpoint": "", "data-benchmark-part-content": "", "data-benchmark-part-popup": "" }, slot([
        h(DialogTitle, null, slot("Dialog title")),
        h(DialogDescription, null, slot("Dialog description")),
        h(DialogClose, { type: "button" }, slot("Close")),
      ])),
    ]))`;
    return wrap(
      plan.type === "mount"
        ? `makeRows(${plan.componentCount}, "dialog").map((row) => h("div", { key: row.id }, [${dialog}]))`
        : `[...makeRows(${plan.outsideNodeCount}, "outside").map((row) => h("div", { key: row.id })), ${dialog}]`,
    );
  }

  if (plan.component === "select") {
    return wrap(
      `makeRows(${plan.componentCount}, "select").map((rootRow) => {
        return h(SelectRoot, { defaultValue: "0", key: rootRow.id, "onUpdate:open": (open) => { state.collectionOpen.value = open; } }, slot([
          h(SelectTrigger, { "data-benchmark-trigger": "", type: "button" }, slot([
            h(SelectValue),
          ])),
          h(SelectPortal, { container: OVERLAY_SELECTOR }, slot(
            h(SelectPositioner, { "data-benchmark-part-positioner": "" }, slot(
              h(SelectPopup, { "data-benchmark-endpoint": "", "data-benchmark-part-content": "", "data-benchmark-part-popup": "" }, slot(
                h(DeferredCollection, null, { default: () =>
                  h(SelectList, { "data-benchmark-part-list": "" }, slot(
                    h("div", { "data-benchmark-part-viewport": "" }, [
                      ...makeRows(${itemCount}, rootRow.id + "-item").map((item) =>
                      h(SelectItem, { "data-benchmark-item": "", "data-benchmark-item-node": "", key: item.id, value: item.value }, slot([
                        h(SelectItemText, null, slot(item.label)), h(SelectItemIndicator),
                      ]))),
                    ]),
                  )),
                }),
              )),
            )),
          )),
        ]));
      })`,
    );
  }

  if (plan.component === "menu") {
    const nested = plan.scenario.startsWith("menu-submenu");
    const items = `h(DeferredCollection, null, { default: () => makeRows(${itemCount}, "menu-item").map((item) =>
      h(MenuItem, { "data-benchmark-item": "", "data-benchmark-item-node": "", ${nested ? '"data-benchmark-submenu-item-node": "",' : ""} key: item.id }, slot(item.label)),
    ) })`;
    const content = nested
      ? `[
          h(MenuSubmenuRoot, null, slot([
            h(MenuSubmenuTrigger, { "data-benchmark-item-node": "", "data-benchmark-submenu-trigger": "" }, slot("More")),
            h(MenuPortal, { container: OVERLAY_SELECTOR }, slot(
              h(MenuPositioner, { "data-benchmark-part-positioner": "", side: "right" }, slot(
                h(MenuPopup, { "data-benchmark-endpoint": "submenu", "data-benchmark-part-content": "", "data-benchmark-part-popup": "", "data-benchmark-part-submenu-content": "" }, slot(${items})),
              )),
            )),
          ])),
        ]`
      : items;
    return wrap(`h(MenuRoot, { modal: true, ${nested ? "" : '"onUpdate:open": (open) => { state.collectionOpen.value = open; }'} }, slot([
      h(MenuTrigger, { "data-benchmark-trigger": "", type: "button" }, slot("Open menu")),
      h(MenuPortal, { container: OVERLAY_SELECTOR }, slot(
        h(MenuPositioner, { "data-benchmark-part-positioner": "" }, slot(
          h(MenuPopup, { "data-benchmark-endpoint": "menu", "data-benchmark-part-content": "", "data-benchmark-part-popup": "" }, slot(${content})),
        )),
      )),
    ]))`);
  }

  if (plan.component === "tooltip") {
    return wrap(`h("div", { "data-benchmark-part-provider": "" }, makeRows(${plan.componentCount}, "tooltip").map((row) =>
      h(TooltipRoot, { closeDelay: 0, key: row.id, openDelay: 0 }, slot([
        h(TooltipTrigger, { "data-benchmark-trigger": "", type: "button" }, slot(row.label)),
        h(TooltipPortal, { container: OVERLAY_SELECTOR }, slot(
          h(TooltipPositioner, { "data-benchmark-part-positioner": "" }, slot(
            h(TooltipPopup, { "data-benchmark-endpoint": "", "data-benchmark-part-content": "", "data-benchmark-part-popup": "" }, slot("Tooltip")),
          )),
        )),
      ])),
    ))`);
  }

  if (plan.component === "popover") {
    return wrap(`makeRows(${plan.componentCount}, "popover").map((row) =>
      h(PopoverRoot, { key: row.id }, slot([
        h(PopoverTrigger, { "data-benchmark-trigger": "", type: "button" }, slot(row.label)),
        h(PopoverPortal, { container: OVERLAY_SELECTOR }, slot(
          h(PopoverPositioner, { "data-benchmark-part-positioner": "" }, slot(
            h(PopoverPopup, { "data-benchmark-endpoint": "", "data-benchmark-part-content": "", "data-benchmark-part-popup": "" }, slot([
              h(PopoverTitle, null, slot("Heading")),
              h(PopoverDescription, null, slot("Description")),
              h(PopoverClose, { type: "button" }, slot("Close")),
            ])),
          )),
        )),
      ])),
    )`);
  }

  if (plan.component === "preview-card") {
    return wrap(`makeRows(${plan.componentCount}, "preview").map((row) =>
      h(PreviewCardRoot, { closeDelay: 0, key: row.id, openDelay: 0 }, slot([
        h(PreviewCardTrigger, { href: "#" + row.id, "data-benchmark-trigger": "" }, slot(row.label)),
        h(PreviewCardPortal, { container: OVERLAY_SELECTOR }, slot(
          h(PreviewCardPositioner, { "data-benchmark-part-positioner": "" }, slot(
            h(PreviewCardPopup, { "data-benchmark-endpoint": "", "data-benchmark-part-content": "", "data-benchmark-part-popup": "" }, slot("Preview")),
          )),
        )),
      ])),
    )`);
  }

  if (plan.component === "combobox") {
    return wrap(`makeRows(${plan.componentCount}, "combobox").map((rootRow) => {
      return h(ComboboxRoot, { defaultValue: "0", key: rootRow.id, "onUpdate:open": (open) => { state.collectionOpen.value = open; } }, slot([
        h(ComboboxInputGroup, null, slot(
          h(ComboboxInput, {
            "data-benchmark-input": "",
            ${plan.type === "mount" ? "" : "onVnodeMounted: (vnode) => { if (vnode.el instanceof HTMLElement) vnode.el.focus(); },"}
          }),
        )),
        h(ComboboxPortal, { container: OVERLAY_SELECTOR }, slot(
          h(ComboboxPositioner, { "data-benchmark-part-positioner": "" }, slot(
            h(ComboboxPopup, { "data-benchmark-endpoint": "", "data-benchmark-part-content": "", "data-benchmark-part-popup": "" }, slot(
              h(DeferredCollection, null, { default: () =>
                h(ComboboxList, { "data-benchmark-part-list": "" }, slot(
                  h("div", { "data-benchmark-part-viewport": "" }, [
                    ...makeRows(${itemCount}, rootRow.id + "-item").map((item) =>
                    h(ComboboxItem, { "data-benchmark-item": "", "data-benchmark-item-node": "", key: item.id, value: item.value }, slot(
                      h(ComboboxItemText, null, slot(item.label)),
                    ))),
                  ]),
                )),
              }),
            )),
          )),
        )),
      ]));
    })`);
  }

  if (plan.component === "navigation-menu") {
    return wrap(`h(NavigationMenuRoot, { defaultValue: "primary", openDelay: 0 }, slot([
      h(NavigationMenuList, null, slot(["primary", "secondary"].map((value, index) =>
        h(NavigationMenuItem, { key: value, value }, slot([
          h(NavigationMenuTrigger, { "data-benchmark-nav-trigger": value }, slot(value)),
          h(NavigationMenuContent, { "data-benchmark-nav-content": value, "data-benchmark-part-content": value }, slot(
            makeRows(500, value).map((item) => h("a", { "data-benchmark-content-link": value, "data-benchmark-item-node": "", href: "#" + item.id, key: item.id }, item.label)),
          )),
        ])),
      ))),
      h(NavigationMenuPortal, { container: OVERLAY_SELECTOR }, slot(
        h(NavigationMenuPositioner, { "data-benchmark-part-positioner": "" }, slot(
          h(NavigationMenuPopup, { "data-benchmark-endpoint": "", "data-benchmark-part-popup": "" }, slot(h(NavigationMenuViewport, { "data-benchmark-part-viewport": "" }))),
        )),
      )),
    ]))`);
  }

  if (plan.component === "tabs") {
    return wrap(`h(TabsRoot, { defaultValue: "0" }, slot([
      h(TabsList, null, slot(makeRows(${itemCount}, "tab").map((item) =>
        h(TabsTab, { "data-benchmark-item": "", "data-benchmark-item-node": "", key: item.id, value: item.value }, slot(item.label)),
      ))),
      ...makeRows(${itemCount}, "panel").map((item) =>
        h(TabsPanel, { "data-benchmark-endpoint": item.value, "data-benchmark-part-panel": "", "data-benchmark-target": item.value === "999" ? "" : undefined, keepMounted: true, key: item.id, value: item.value }, slot(item.label)),
      ),
    ]))`);
  }

  if (plan.component === "accordion") {
    return wrap(`h(AccordionRoot, { collapsible: true, type: "single" }, slot(
      makeRows(${itemCount}, "accordion").map((item) =>
        h(AccordionItem, { key: item.id, value: item.value }, slot([
          h(AccordionHeader, null, slot(
            h(AccordionTrigger, { "data-benchmark-item": "", "data-benchmark-item-node": "", type: "button" }, slot(item.label)),
          )),
          h(AccordionPanel, { "data-benchmark-endpoint": item.value, "data-benchmark-part-panel": "", "data-benchmark-target": item.value === "999" ? "" : undefined }, slot("Panel " + item.label)),
        ])),
      ),
    ))`);
  }

  if (plan.component === "radio-group") {
    return wrap(`h(RadioGroupRoot, { defaultValue: "0" }, slot(
      makeRows(${itemCount}, "radio").map((item) =>
        h(RadioRoot, { "data-benchmark-item": "", "data-benchmark-item-node": "", "data-benchmark-target": item.value === ${JSON.stringify(String(itemCount - 1))} ? "" : undefined, key: item.id, value: item.value }, slot(item.label)),
      ),
    ))`);
  }

  throw new Error(`Unsupported Starwind Vue fixture component: ${plan.component}`);
}

function scenarioBehavior(plan) {
  const mountSetup = `assertContainersEmpty();`;
  const baseSetup = `mount();\nawait settle();\nassertDomPhase("rootInitialized");`;
  const endpointSelector =
    plan.scenario === "menu-submenu-open"
      ? '[data-benchmark-endpoint="submenu"]'
      : "[data-benchmark-endpoint]";
  const endpoint = `const endpoint = required(${JSON.stringify(endpointSelector)});
if (endpoint.hidden || getComputedStyle(endpoint).display === "none") {
  throw new Error("The declared endpoint is not visible for " + SCENARIO);
}
return endpoint;`;

  if (plan.type === "mount") {
    return {
      setup: mountSetup,
      measure: `mount();
await settle();
assertDomPhase("rootInitialized");
assertDomPhase("setupComplete");
const endpoint = required("[data-benchmark-marker]");
forceLayout(endpoint);
assertDomPhase("measuredEndpoint");
return endpoint;`,
      assertEndpoint: `return required("[data-benchmark-marker]");`,
    };
  }

  if (plan.type === "open") {
    const target =
      plan.scenario === "combobox-open" ? "[data-benchmark-input]" : "[data-benchmark-trigger]";
    const key = plan.scenario === "combobox-open" ? "ArrowDown" : "Enter";
    return {
      setup: `${baseSetup}\nrequired(${JSON.stringify(target)}).focus();\nassertDomPhase("setupComplete");`,
      measure:
        plan.scenario === "dialog-open"
          ? `required("[data-benchmark-trigger]").click();
await settle();
const endpoint = assertVisibleEndpoint();
assertDomPhase("measuredEndpoint");
return endpoint;`
          : `const target = required(${JSON.stringify(target)});
target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: ${JSON.stringify(key)} }));
await settle();
const endpoint = assertVisibleEndpoint();
assertDomPhase("measuredEndpoint");
return endpoint;`,
      assertEndpoint: endpoint,
    };
  }

  if (plan.type === "hover" || plan.type === "submenu-hover") {
    const open =
      plan.type === "submenu-hover"
        ? `required("[data-benchmark-trigger]").click();\nawait settle();\nrequired("[data-benchmark-submenu-trigger]").click();\nawait acceptSubmenuOpen();`
        : plan.component === "combobox"
          ? `const input = required("[data-benchmark-input]");\ninput.focus();\ninput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));`
          : `required("[data-benchmark-trigger]").click();`;
    return {
      setup: `${baseSetup}\n${open}\nawait settle();\nassertDomPhase("setupComplete");`,
      measure: `const items = [...document.querySelectorAll("[data-benchmark-item]")];
if (items.length !== 1000) throw new Error("Highlight item count differs: " + items.length);
for (const item of items) {
  item.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
  await nextTick();
  if (!(item instanceof HTMLElement) || !item.hasAttribute("data-highlighted")) {
    throw new Error("The current highlight item is not data-highlighted.");
  }
  forceLayout(item);
}
await settle();
const item = items.at(-1);
if (!(item instanceof HTMLElement) || !item.hasAttribute("data-highlighted")) {
  throw new Error("The final highlight item is not data-highlighted.");
}
assertDomPhase("measuredEndpoint");
return item;`,
      assertEndpoint: `const items = [...document.querySelectorAll("[data-benchmark-item]")];
const item = items.at(-1);
if (!(item instanceof HTMLElement)) throw new Error("Missing final highlight item.");
if (!item.hasAttribute("data-highlighted")) throw new Error("The final highlight item is not data-highlighted.");
return item;`,
    };
  }

  if (plan.type === "submenu-open") {
    return {
      setup: `${baseSetup}\nrequired("[data-benchmark-trigger]").click();\nawait settle();\nassertDomPhase("setupComplete");`,
      measure: `required("[data-benchmark-submenu-trigger]").click();
await acceptSubmenuOpen();
const endpoint = assertVisibleEndpoint();
if (document.querySelectorAll("[data-benchmark-submenu-item-node]").length !== 1000) {
  throw new Error("Submenu item count differs from 1000.");
}
assertDomPhase("measuredEndpoint");
return endpoint;`,
      assertEndpoint: endpoint,
    };
  }

  if (plan.type === "navigation-switch") {
    return {
      setup: `${baseSetup}
const primary = required('[data-benchmark-nav-content="primary"]');
if (!isVisible(primary)) throw new Error("Primary navigation content is not visible from defaultValue.");
assertDomPhase("setupComplete");`,
      measure: `required('[data-benchmark-nav-trigger="secondary"]').click();
await settle();
const content = assertVisibleEndpoint();
assertDomPhase("measuredEndpoint");
return content;`,
      assertEndpoint: `const content = required('[data-benchmark-nav-content="secondary"]');
const viewport = required("[data-benchmark-part-viewport]");
if (!isVisible(content)) throw new Error("Secondary navigation content is hidden.");
if (!isVisible(viewport) || !viewport.contains(content)) {
  throw new Error("Secondary navigation content is outside the visible teleported viewport.");
}
return content;`,
    };
  }

  if (plan.type === "tabs-activation") {
    return {
      setup: `${baseSetup}
const items = [...document.querySelectorAll("[data-benchmark-item]")];
const target = items.at(-1);
if (!(target instanceof HTMLElement)) throw new Error("Missing collection activation target.");
target.focus();
if (document.activeElement !== target) {
  throw new Error("The final Tabs trigger is not focused before measurement.");
}
assertDomPhase("setupComplete");`,
      measure: `const items = [...document.querySelectorAll("[data-benchmark-item]")];
const target = items.at(-1);
if (!(target instanceof HTMLElement)) throw new Error("Missing collection activation target.");
for (const event of ACTIVATION_ACTION.events) {
  target.dispatchEvent(new MouseEvent(event.type, {
    bubbles: true,
    button: event.button,
    cancelable: true,
    composed: true,
  }));
}
await settle();
const endpoint = required('[data-benchmark-endpoint="999"]');
forceLayout(endpoint);
assertVisibleEndpoint();
assertDomPhase("measuredEndpoint");
return endpoint;`,
      assertEndpoint: `const endpoint = required('[data-benchmark-endpoint="999"]');
if (endpoint.hidden) throw new Error("Last tab panel is hidden.");
return endpoint;`,
    };
  }

  if (plan.type === "accordion-toggle") {
    return {
      setup: `${baseSetup}\nassertDomPhase("setupComplete");`,
      measure: `const items = [...document.querySelectorAll("[data-benchmark-item]")];
const target = items.at(-1);
if (!(target instanceof HTMLElement)) throw new Error("Missing collection activation target.");
target.click();
await settle();
const endpoint = assertVisibleEndpoint();
assertDomPhase("measuredEndpoint");
return endpoint;`,
      assertEndpoint: `const endpoint = required('[data-benchmark-endpoint="999"]');
if (endpoint.hidden) throw new Error("Last accordion panel is hidden.");
return endpoint;`,
    };
  }

  if (plan.type === "radio-sweep") {
    return {
      setup: `${baseSetup}\nassertDomPhase("setupComplete");`,
      measure: `const items = [...document.querySelectorAll("[data-benchmark-item]")];
for (const item of items) {
  item.click();
  await nextTick();
  if (!(item instanceof HTMLElement) || !item.hasAttribute("data-checked")) {
    throw new Error("The current radio item is not data-checked.");
  }
  forceLayout(item);
}
await settle();
assertDomPhase("measuredEndpoint");
return items.at(-1);`,
      assertEndpoint: `const items = [...document.querySelectorAll("[data-benchmark-item]")];
const item = items.at(-1);
if (!(item instanceof HTMLElement)) throw new Error("Missing final radio item.");
if (!item.hasAttribute("data-checked")) throw new Error("Last radio is not checked.");
return item;`,
    };
  }

  throw new Error(`Missing Starwind Vue behavior for ${plan.scenario}`);
}

function fixtureHtml() {
  return `<!doctype html>
<html>
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
  <body><div id="app"></div><div id="runtime-perf-overlays"></div><script type="module" src="/src/main.mjs"></script></body>
</html>`;
}

function fixtureStyles() {
  return `* { box-sizing: border-box; }
body { font-family: sans-serif; margin: 0; }
[hidden] { display: none !important; }
#runtime-perf-overlays { position: relative; }
button, input, a { font: inherit; }`;
}

function indent(value, spaces) {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function slash(value) {
  return value.replaceAll("\\", "/");
}

function requireNonemptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
}
