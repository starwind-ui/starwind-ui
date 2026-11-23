import type { DirectionCase } from "../../inventory.js";

type RawDefinition = {
  family: string;
  importPath: string;
  factory: string;
  rootSelector: string;
  markup: string;
  setup?: string;
};

const definitions: RawDefinition[] = [
  {
    family: "radio",
    importPath: "radio",
    factory: "createRadio",
    rootSelector: "[data-sw-radio]",
    markup: `<button type="button" data-sw-radio data-value="alpha" data-name="raw-radio" data-raw-trigger>Alpha<span data-sw-radio-indicator></span><input data-sw-radio-input /></button>`,
  },
  {
    family: "radio-group",
    importPath: "radio-group",
    factory: "createRadioGroup",
    rootSelector: "[data-sw-radio-group]",
    markup: `<div data-sw-radio-group data-orientation="horizontal" data-default-value="alpha" data-name="raw-choice"><button type="button" data-sw-radio data-value="alpha">Alpha<span data-sw-radio-indicator></span><input data-sw-radio-input /></button><button type="button" data-sw-radio data-value="gamma" data-disabled>Gamma<span data-sw-radio-indicator></span><input data-sw-radio-input disabled /></button><button type="button" data-sw-radio data-value="beta" data-raw-trigger>Beta<span data-sw-radio-indicator></span><input data-sw-radio-input /></button></div>`,
  },
  {
    family: "scroll-area",
    importPath: "scroll-area",
    factory: "createScrollArea",
    rootSelector: "[data-sw-scroll-area]",
    markup: `<div data-sw-scroll-area style="position:relative;width:160px;height:96px"><div data-sw-scroll-area-viewport style="width:160px;height:96px;overflow:scroll"><div data-sw-scroll-area-content style="width:480px;height:240px">مرحبا بالعالم · עברית · Raw R42</div></div><div data-sw-scroll-area-scrollbar data-orientation="vertical" style="position:absolute;inset-block:0;inset-inline-end:0;width:10px"><div data-sw-scroll-area-thumb></div></div><div data-sw-scroll-area-scrollbar data-orientation="horizontal" style="position:absolute;inset-inline:0;inset-block-end:0;height:10px"><div data-sw-scroll-area-thumb></div></div><div data-sw-scroll-area-corner></div></div>`,
  },
  {
    family: "select",
    importPath: "select",
    factory: "createSelect",
    rootSelector: "[data-sw-select]",
    markup: `<div data-sw-select data-default-value="alpha"><button data-sw-select-trigger data-raw-trigger><span data-sw-select-value data-placeholder="Choose a project"></span></button><input data-sw-select-input type="hidden" /><div data-sw-select-positioner data-side="bottom" data-align="start"><div data-sw-select-popup hidden><div data-sw-select-list><div data-sw-select-item data-value="alpha"><span data-sw-select-item-text>Alpha</span><span data-sw-select-item-indicator hidden>✓</span></div><div data-sw-select-item data-value="beta"><span data-sw-select-item-text>مشروع Beta 42</span><span data-sw-select-item-indicator hidden>✓</span></div></div></div></div></div>`,
  },
  {
    family: "drawer",
    importPath: "drawer",
    factory: "createDrawer",
    rootSelector: "[data-sw-drawer]",
    markup: `<div data-sw-drawer><button data-sw-drawer-trigger data-raw-trigger>Open drawer</button><div data-sw-drawer-backdrop hidden></div><dialog data-sw-drawer-popup data-side="left"><h2 data-sw-drawer-title>Project panel</h2><p data-sw-drawer-description>Details for R42</p><button data-sw-drawer-close>Close drawer</button></dialog></div>`,
  },
  {
    family: "sidebar",
    importPath: "sidebar",
    factory: "createSidebarController",
    rootSelector: "[data-sw-sidebar-provider]",
    markup: `<div data-sw-sidebar-provider data-default-open="true" data-state="expanded" data-mobile-open="false"><div data-sw-sidebar data-state="expanded" data-side="right" data-collapsible="" data-collapsible-mode="icon"><button data-sw-sidebar-trigger data-raw-trigger>Toggle sidebar</button><button data-sw-sidebar-rail>Rail</button><a data-sw-sidebar-menu-button href="#">Projects</a></div></div>`,
  },
  {
    family: "slider",
    importPath: "slider",
    factory: "createSlider",
    rootSelector: "[data-sw-slider]",
    markup: `<div data-sw-slider data-default-value="50" data-min="0" data-max="100" data-step="1" data-orientation="horizontal"><div data-sw-slider-control><div data-sw-slider-track><div data-sw-slider-indicator></div></div><div data-sw-slider-thumb data-index="0"><input data-sw-slider-input /></div></div></div>`,
  },
  {
    family: "switch",
    importPath: "switch",
    factory: "createSwitch",
    rootSelector: "[data-sw-switch]",
    markup: `<form><button type="button" data-sw-switch data-name="raw-updates" data-value="on">Enable updates<span data-sw-switch-thumb></span></button><input data-sw-switch-input /></form>`,
  },
  {
    family: "tabs",
    importPath: "tabs",
    factory: "createTabs",
    rootSelector: "[data-sw-tabs]",
    markup: `<div data-sw-tabs data-default-value="overview" data-orientation="horizontal"><div data-sw-tabs-list><button data-sw-tabs-tab data-value="overview">Overview</button><button data-sw-tabs-tab data-value="activity" data-raw-trigger>Activity</button><button data-sw-tabs-tab data-value="settings">Settings</button><div data-sw-tabs-indicator></div></div><div data-sw-tabs-panel data-value="overview">ملخص R42</div><div data-sw-tabs-panel data-value="activity">Latest activity</div><div data-sw-tabs-panel data-value="settings">Settings</div></div>`,
  },
  {
    family: "toast",
    importPath: "toast",
    factory: "createToastManager",
    rootSelector: "[data-sw-toast-viewport]",
    markup: `<div data-sw-toast-viewport data-position="bottom-right" data-duration="0"><template data-sw-toast-template="default"><div data-sw-toast-root data-state="open" data-variant="default" role="dialog" aria-modal="false"><div data-sw-toast-content><div data-sw-toast-title><span data-sw-toast-title-text>Title</span></div><div data-sw-toast-description>Description</div><button data-sw-toast-action type="button">Action</button></div><button data-sw-toast-close type="button">Close</button></div></template></div>`,
    setup: `const factoryManager = createToastManager(document.querySelector('[data-raw-instance="factory"] [data-sw-toast-viewport]')!); factoryManager.add({ title: "Factory toast", duration: 0 }); initStarwind(document.querySelector('[data-raw-instance="automatic"]')!); toast("Automatic toast", { duration: 0 });`,
  },
  {
    family: "toggle",
    importPath: "toggle",
    factory: "createToggle",
    rootSelector: "[data-sw-toggle]",
    markup: `<button data-sw-toggle data-raw-trigger>Pin project</button>`,
  },
  {
    family: "toggle-group",
    importPath: "toggle-group",
    factory: "createToggleGroup",
    rootSelector: "[data-sw-toggle-group]",
    markup: `<div data-sw-toggle-group data-orientation="horizontal" data-default-value='["center"]'><button data-sw-toggle data-value="start">Start</button><button data-sw-toggle data-value="center" data-raw-trigger>Center</button><button data-sw-toggle data-value="end">End</button></div>`,
  },
  {
    family: "tooltip",
    importPath: "tooltip",
    factory: "createTooltip",
    rootSelector: "[data-sw-tooltip]",
    markup: `<div data-sw-tooltip data-open-delay="0" data-close-delay="0"><button data-sw-tooltip-trigger data-raw-trigger>Project details</button><div data-sw-tooltip-popup data-side="right" data-align="start" hidden>تفاصيل · Project R42<div data-sw-tooltip-arrow></div></div></div>`,
  },
];

function source(definition: RawDefinition): string {
  const instance = (mode: "factory" | "automatic") => {
    const placement =
      definition.family === "tooltip"
        ? ` style="position:fixed;left:${mode === "factory" ? 160 : 400}px;top:96px"`
        : "";
    return `<section data-raw-instance="${mode}" dir="rtl"${placement}>${definition.markup}</section>`;
  };
  const setup =
    definition.setup ??
    `const factoryRoot = document.querySelector('[data-raw-instance="factory"] ${definition.rootSelector}')!; ${definition.factory}(factoryRoot); initStarwind(document.querySelector('[data-raw-instance="automatic"]')!);`;
  const imports = `import { ${definition.factory} } from "@starwind-ui/runtime/${definition.importPath}";\nimport { initStarwind } from "@starwind-ui/runtime/init-starwind";`;
  const toastApi =
    definition.family === "toast" ? `\nimport { toast } from "@starwind-ui/runtime/toast";` : "";
  return `---\n---\n<html lang="en" dir="ltr"><head><meta charset="utf-8" /><title>Raw surface ${definition.family}</title></head><body><main dir="rtl">${instance("factory")}${instance("automatic")}<p>مرحبا بالعالم · עברית · Raw R42</p><script>${imports}${toastApi}\n${setup}</script></main></body></html>`;
}

const runtimeCases: DirectionCase[] = definitions.map((definition) => ({
  id: `surface-raw-${definition.family}`,
  row: `runtime:${definition.family}`,
  acceptance: [
    "SPEC-AC-01",
    "SPEC-AC-02",
    "SPEC-AC-03",
    ...(definition.family === "slider" ? ["SPEC-AC-07"] : []),
    ...(["radio-group", "tabs", "toggle-group"].includes(definition.family) ? ["SPEC-AC-05"] : []),
    ...(["select", "drawer", "tooltip"].includes(definition.family) ? ["SPEC-AC-11"] : []),
    "SPEC-AC-14",
  ],
  rawEntrypoints: ["factory", "initStarwind"],
  fixtures: {
    astro: {
      source: source(definition),
      exports: [],
      assertions: ["factory-behavior", "initStarwind-behavior", "inherited-rtl"],
    },
  },
}));

export const themeCase: DirectionCase = {
  id: "surface-raw-theme",
  row: "theme",
  acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-14"],
  rawEntrypoints: ["factory", "initStarwind"],
  fixtures: {
    astro: {
      source: `---\n---\n<html lang="en" dir="ltr"><head><meta charset="utf-8" /><title>Raw theme surface</title></head><body><main dir="rtl"><section data-raw-instance="factory"><button data-sw-theme-toggle data-theme-on="dark" data-theme-off="light">Factory theme</button></section><section data-raw-instance="automatic"><button data-sw-theme-toggle data-theme-on="dark" data-theme-off="light">Automatic theme</button></section></main><script>import { createThemeController } from "@starwind-ui/runtime/theme"; import { initStarwind } from "@starwind-ui/runtime/init-starwind"; localStorage.setItem("colorTheme", "light"); createThemeController({ root: document.querySelector('[data-raw-instance="factory"]')!, documentElement: document.documentElement, defaultTheme: "light", storage: false }); initStarwind(document.querySelector('[data-raw-instance="automatic"]')!);</script></body></html>`,
      exports: [],
      assertions: ["factory-behavior", "initStarwind-behavior", "inherited-rtl"],
    },
  },
};

export const cases: DirectionCase[] = [...runtimeCases, themeCase];
export const rawCases: DirectionCase[] = cases;
