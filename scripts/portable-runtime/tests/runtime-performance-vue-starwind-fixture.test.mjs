import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import {
  buildAllStarwindVueFixtures,
  buildStarwindVueFixture,
  buildStarwindVuePerformanceAliases,
  starwindVueFixtureImports,
  starwindVueFixtureScenarioKeys,
} from "../runtime-performance/vue-starwind-fixture.mjs";
import { vuePerformanceProviderRows } from "../runtime-performance/vue-plan.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const vueDemoRequire = createRequire(path.join(repoRoot, "apps/vue-demo/package.json"));

describe("Starwind Vue runtime performance fixture source", () => {
  it("generates one deterministic fixture for every planned Starwind row", () => {
    const planned = vuePerformanceProviderRows
      .filter(({ provider }) => provider === "starwind-vue")
      .map(({ scenario }) => scenario);
    expect(starwindVueFixtureScenarioKeys).toEqual(planned);
    expect(starwindVueFixtureScenarioKeys).toHaveLength(22);
    expect(starwindVueFixtureScenarioKeys).not.toContain("combobox-filter-input");
    expect(buildAllStarwindVueFixtures().map(({ scenario }) => scenario)).toEqual(planned);

    for (const scenario of planned) {
      expect(buildStarwindVueFixture(scenario).source).toBe(
        buildStarwindVueFixture(scenario).source,
      );
    }
  });

  it("compiles every generated production module", async () => {
    const { transformWithEsbuild } = await import(
      pathToFileURL(vueDemoRequire.resolve("vite")).href
    );
    for (const fixture of buildAllStarwindVueFixtures()) {
      await expect(
        transformWithEsbuild(fixture.source, `${fixture.scenario}.mjs`, {
          format: "esm",
          loader: "js",
          target: "es2020",
        }),
        fixture.scenario,
      ).resolves.toMatchObject({ code: expect.any(String) });
    }
  });

  it("uses public package subpaths and current named Vue exports", () => {
    for (const fixture of buildAllStarwindVueFixtures()) {
      expect(fixture.source).toContain(`from "@starwind-ui/vue/${fixture.plan.component}"`);
      expect(fixture.source).not.toMatch(/packages\/vue\/src|apps\/vue-demo|starwind-runtime/);
      const indexSource = readFileSync(
        path.join(repoRoot, "packages/vue/src", fixture.plan.component, "index.ts"),
        "utf8",
      );
      for (const exportName of starwindVueFixtureImports[fixture.plan.component]) {
        expect(indexSource, `${fixture.scenario}: ${exportName}`).toMatch(
          new RegExp(`(?:default\\s+as\\s+${exportName}|\\b${exportName}\\b[\\s\\S]*?export)`),
        );
      }
    }
    const radio = buildStarwindVueFixture("radio-group-change-sweep").source;
    expect(radio).toContain('import { RadioRoot } from "@starwind-ui/vue/radio";');
    expect(readFileSync(path.join(repoRoot, "packages/vue/src/radio/index.ts"), "utf8")).toContain(
      "default as RadioRoot",
    );
  });

  it("exposes the common browser endpoints and observable failure path", () => {
    for (const { source } of buildAllStarwindVueFixtures()) {
      for (const endpoint of [
        "assertVisibleEndpoint",
        "measure",
        "mount",
        "ready: true",
        "setup",
        "teardown",
        "unmount",
      ]) {
        expect(source).toContain(endpoint);
      }
      expect(source).toContain("app.config.errorHandler");
      expect(source).toContain("queueMicrotask(() => { throw error; });");
      expect(source).toContain("Missing fixture element:");
    }
  });

  it("owns mount and teardown while checking both DOM surfaces", () => {
    for (const { source } of buildAllStarwindVueFixtures()) {
      expect(source).toContain("app = createApp(Fixture);");
      expect(source).toContain("app.mount(host);");
      expect(source).toContain("app?.unmount();");
      expect(source).toContain("host.childElementCount !== 0");
      expect(source).toContain("overlay.childElementCount !== 0");
      expect(source).toContain("await nextTick();");
      expect(source).toContain("await frame();");
    }
  });

  it("projects each measurement family into its approved action and endpoint", () => {
    expect(buildStarwindVueFixture("dialog-open").source).toContain(
      'required("[data-benchmark-trigger]").click();',
    );
    expect(buildStarwindVueFixture("combobox-open").source).toContain('key: "ArrowDown"');
    expect(buildStarwindVueFixture("select-item-highlight").source).toContain(
      'new PointerEvent("pointermove"',
    );
    expect(() => buildStarwindVueFixture("combobox-filter-input")).toThrow(
      "Unknown Starwind Vue performance scenario: combobox-filter-input",
    );
    expect(buildStarwindVueFixture("menu-submenu-open").source).toContain(
      "[data-benchmark-submenu-trigger]",
    );
    expect(buildStarwindVueFixture("navigation-menu-content-switch").source).toContain(
      '[data-benchmark-nav-trigger="secondary"]',
    );
    expect(buildStarwindVueFixture("navigation-menu-content-switch").source).toContain(
      'defaultValue: "primary"',
    );
    expect(buildStarwindVueFixture("tabs-activation-click").source).toContain(
      '[data-benchmark-endpoint="999"]',
    );
    expect(buildStarwindVueFixture("accordion-toggle-click").source).toContain(
      "Last accordion panel is hidden.",
    );
    expect(buildStarwindVueFixture("radio-group-change-sweep").source).toContain(
      '!item.hasAttribute("data-checked")',
    );
  });

  it("projects the exact common Tabs activation action into generated source", () => {
    const action = {
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
    };
    const fixture = buildStarwindVueFixture("tabs-activation-click");
    expect(fixture.plan.activationAction).toEqual(action);
    expect(fixture.source).toContain(`const ACTIVATION_ACTION = ${JSON.stringify(action)};`);
    expect(fixture.source).toMatch(
      /async function setup\(\) \{[\s\S]+const target = items\.at\(-1\);[\s\S]+target\.focus\(\);[\s\S]+document\.activeElement !== target[\s\S]+assertDomPhase\("setupComplete"\);/,
    );
    expect(fixture.source).toMatch(
      /for \(const event of ACTIVATION_ACTION\.events\) \{[\s\S]+new MouseEvent\(event\.type, \{[\s\S]+bubbles: true,[\s\S]+button: event\.button,[\s\S]+cancelable: true,[\s\S]+composed: true,[\s\S]+\}\)[\s\S]+\}[\s\S]+await settle\(\);[\s\S]+forceLayout\(endpoint\);[\s\S]+assertVisibleEndpoint\(\);/,
    );
    expect(fixture.source).toContain(
      'throw new Error("The final Tabs trigger is not focused before measurement.")',
    );
    expect(fixture.source).not.toContain("target.click();");
    expect(fixture.source).not.toMatch(/ACTIVATION_ACTION\.events\.toReversed|\.reverse\(\)/);
    expect(fixture.source).not.toMatch(/button:\s*[1-9]/);
    expect(fixture.source).not.toMatch(/provider\s*===|PROVIDER/);

    for (const scenario of starwindVueFixtureScenarioKeys.filter(
      (scenario) => scenario !== "tabs-activation-click",
    )) {
      const other = buildStarwindVueFixture(scenario);
      expect(other.plan.activationAction, scenario).toBeNull();
      expect(other.source, scenario).toContain("const ACTIVATION_ACTION = null;");
    }
  });

  it("uses public modal and zero-delay tooltip configuration", () => {
    for (const scenario of [
      "menu-open",
      "menu-item-highlight",
      "menu-submenu-open",
      "menu-submenu-item-highlight",
    ]) {
      expect(buildStarwindVueFixture(scenario).source).toContain("h(MenuRoot, { modal: true,");
    }

    const tooltip = buildStarwindVueFixture("tooltip-trigger-mount").source;
    expect(tooltip).toContain('h("div", { "data-benchmark-part-provider": "" }');
    expect(tooltip).toContain("h(TooltipRoot, { closeDelay: 0, key: row.id, openDelay: 0 }");
  });

  it("asserts public state after every sweep action", () => {
    for (const scenario of [
      "select-item-highlight",
      "menu-item-highlight",
      "combobox-item-highlight",
      "menu-submenu-item-highlight",
    ]) {
      const source = buildStarwindVueFixture(scenario).source;
      expect(source).toContain(
        'throw new Error("The current highlight item is not data-highlighted.")',
      );
      const sweep = source.match(
        /for \(const item of items\) \{[\s\S]*?\n\s*\}\n\s*await settle\(\);/,
      )?.[0];
      expect(sweep).toMatch(
        /pointermove[\s\S]+await nextTick\(\);[\s\S]+data-highlighted[\s\S]+forceLayout\(item\);/,
      );
      expect(sweep?.match(/await nextTick\(\);/g)).toHaveLength(1);
      expect(sweep?.match(/await settle\(\);/g)).toHaveLength(1);
      expect(source).toContain("The final highlight item is not data-highlighted.");
      expect(source).toContain(
        'import { createApp, defineComponent, h, nextTick, ref } from "vue";',
      );
    }

    const radio = buildStarwindVueFixture("radio-group-change-sweep").source;
    const sweep = radio.match(
      /for \(const item of items\) \{[\s\S]*?\n\s*\}\n\s*await settle\(\);/,
    )?.[0];
    expect(sweep).toMatch(
      /item\.click\(\);[\s\S]+await nextTick\(\);[\s\S]+data-checked[\s\S]+forceLayout\(item\);/,
    );
    expect(sweep?.match(/await nextTick\(\);/g)).toHaveLength(1);
    expect(sweep?.match(/await settle\(\);/g)).toHaveLength(1);
    expect(radio).toContain('throw new Error("The current radio item is not data-checked.")');
    expect(radio).toContain("Last radio is not checked.");
  });

  it("uses stable keys and Ticket 03 scales in generated collections", () => {
    for (const scenario of [
      "select-open",
      "menu-open",
      "combobox-open",
      "tabs-high-count-mount",
      "accordion-high-count-mount",
      "radio-group-high-count-mount",
    ]) {
      expect(buildStarwindVueFixture(scenario).source).toContain("key: item.id");
    }
    expect(buildStarwindVueFixture("dialog-open").source).toContain("10000");
    expect(buildStarwindVueFixture("select-trigger-mount").source).toContain(
      'makeRows(1000, "select")',
    );
    expect(buildStarwindVueFixture("select-trigger-mount").source).toContain("makeRows(10,");
    expect(buildStarwindVueFixture("menu-submenu-open").source).toContain(
      'makeRows(1000, "menu-item")',
    );
    expect(buildStarwindVueFixture("menu-submenu-open").source).toContain(
      "Submenu item count differs from 1000.",
    );

    const radioMount = buildStarwindVueFixture("radio-group-high-count-mount").source;
    const radioSweep = buildStarwindVueFixture("radio-group-change-sweep").source;
    expect(radioMount).toContain('makeRows(1000, "radio")');
    expect(radioMount).not.toContain('makeRows(100, "radio")');
    expect(radioMount).toContain('item.value === "999"');
    expect(radioSweep).toContain('makeRows(100, "radio")');
    expect(radioSweep).not.toContain('makeRows(1000, "radio")');
    expect(radioSweep).toContain('item.value === "99"');
    expect(radioSweep).not.toContain('item.value === "999"');
    expect(radioMount).toContain('"itemNodes":1000');
    expect(radioSweep).toContain('"itemNodes":100');
  });

  it("mounts hidden shells while deferring heavy item DOM behind uncontrolled events", () => {
    for (const scenario of [
      "select-open",
      "select-trigger-mount",
      "menu-open",
      "combobox-open",
      "combobox-trigger-mount",
    ]) {
      const source = buildStarwindVueFixture(scenario).source;
      expect(source).toContain("h(DeferredCollection");
      expect(source).toContain("collectionOpen.value ? slots.default?.() : []");
      expect(source).toContain('"onUpdate:open": (open) =>');
      expect(source).not.toMatch(/\bopen:\s*(?:state|collectionOpen)/);
    }
    const nested = buildStarwindVueFixture("menu-submenu-open").source;
    expect(nested).toContain("await acceptSubmenuOpen();");
    expect(nested).toContain('getAttribute("data-state") !== "open"');

    const combobox = buildStarwindVueFixture("combobox-open").source;
    expect(combobox).not.toContain("ComboboxTrigger");
    expect(combobox).toContain("onVnodeMounted:");
    expect(combobox).toContain("vnode.el.focus()");
    expect(buildStarwindVueFixture("combobox-trigger-mount").source).not.toContain(
      "onVnodeMounted:",
    );
    expect(starwindVueFixtureImports.combobox).not.toContain("ComboboxTrigger");
  });

  it("defers the complete Select collection anatomy until public open acceptance", () => {
    const closedSelect = {
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
    const openSelect = {
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

    const selectOpen = buildStarwindVueFixture("select-open");
    expect(selectOpen.plan.domPhases).toEqual({
      measuredEndpoint: openSelect,
      rootInitialized: closedSelect,
      setupComplete: closedSelect,
    });

    const selectHighlight = buildStarwindVueFixture("select-item-highlight");
    expect(selectHighlight.plan.domPhases).toEqual({
      measuredEndpoint: openSelect,
      rootInitialized: closedSelect,
      setupComplete: openSelect,
    });

    for (const fixture of [selectOpen, selectHighlight]) {
      expect(fixture.source).toMatch(
        /h\(SelectPopup,[\s\S]+h\(DeferredCollection,[\s\S]+h\(SelectList,[\s\S]+data-benchmark-part-viewport[\s\S]+makeRows\(1000,/,
      );
      expect(fixture.source).toContain('"onUpdate:open": (open) =>');
      expect(fixture.source).not.toMatch(/\bopen:\s*(?:state|collectionOpen)/);
    }
  });

  it("keeps every Select mount collection node absent through browser phase assertions", () => {
    const fixture = buildStarwindVueFixture("select-trigger-mount");
    const closedMount = {
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
    };
    expect(fixture.plan.domPhases).toEqual({
      measuredEndpoint: closedMount,
      rootInitialized: closedMount,
      setupComplete: closedMount,
    });
    expect(fixture.source).toContain('assertDomPhase("rootInitialized")');
    expect(fixture.source).toContain('assertDomPhase("setupComplete")');
    expect(fixture.source).toContain('assertDomPhase("measuredEndpoint")');
    expect(fixture.source).toMatch(
      /h\(DeferredCollection,[\s\S]+h\(SelectList,[\s\S]+data-benchmark-part-viewport[\s\S]+makeRows\(10,/,
    );
  });

  it("defers complete Combobox collection anatomy until public open acceptance", () => {
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
    const comboboxOpen = buildStarwindVueFixture("combobox-open");
    const comboboxHighlight = buildStarwindVueFixture("combobox-item-highlight");
    expect(comboboxOpen.plan.domPhases).toEqual({
      measuredEndpoint: open,
      rootInitialized: closed,
      setupComplete: closed,
    });
    expect(comboboxHighlight.plan.domPhases).toEqual({
      measuredEndpoint: open,
      rootInitialized: closed,
      setupComplete: open,
    });
    for (const fixture of [comboboxOpen, comboboxHighlight]) {
      expect(fixture.source).toMatch(
        /h\(ComboboxPopup,[\s\S]+h\(DeferredCollection,[\s\S]+h\(ComboboxList,[\s\S]+data-benchmark-part-viewport[\s\S]+makeRows\(1000,/,
      );
      expect(fixture.source).not.toMatch(/h\(ComboboxList,[\s\S]+h\(DeferredCollection/);
    }

    const mount = buildStarwindVueFixture("combobox-trigger-mount");
    expect(mount.plan.domPhases.rootInitialized).toEqual(
      expect.objectContaining({ itemNodes: 0, lists: 0, popups: 1_000, viewports: 0 }),
    );
    expect(mount.source).toMatch(
      /h\(ComboboxPopup,[\s\S]+h\(DeferredCollection,[\s\S]+h\(ComboboxList,[\s\S]+data-benchmark-part-viewport[\s\S]+makeRows\(10,/,
    );
  });

  it("pins phase assertions, shell counts, and measured endpoint identity", () => {
    for (const fixture of buildAllStarwindVueFixtures()) {
      expect(fixture.source).toContain(
        `const DOM_PHASES = ${JSON.stringify(fixture.plan.domPhases)}`,
      );
      expect(fixture.source).toContain('assertDomPhase("rootInitialized")');
      expect(fixture.source).toContain('assertDomPhase("setupComplete")');
      expect(fixture.source).toContain('assertDomPhase("measuredEndpoint")');
    }

    const tooltip = buildStarwindVueFixture("tooltip-trigger-mount").source;
    expect(tooltip).toContain('makeRows(1000, "tooltip")');
    expect(tooltip).toContain('"data-benchmark-part-popup": ""');

    for (const scenario of ["select-trigger-mount", "combobox-trigger-mount"]) {
      const fixture = buildStarwindVueFixture(scenario);
      expect(fixture.plan.domPhases.rootInitialized.itemNodes).toBe(0);
      expect(fixture.plan.domPhases.rootInitialized.popups).toBe(1000);
      expect(fixture.source).toContain('"data-benchmark-part-viewport": ""');
    }

    const submenu = buildStarwindVueFixture("menu-submenu-open").source;
    expect(submenu).toContain('required("[data-benchmark-endpoint=\\"submenu\\"]")');

    for (const scenario of [
      "select-item-highlight",
      "menu-item-highlight",
      "combobox-item-highlight",
      "menu-submenu-item-highlight",
    ]) {
      expect(buildStarwindVueFixture(scenario).source).toContain(
        '!item.hasAttribute("data-highlighted")',
      );
    }
  });

  it("routes built Starwind output and one Vue runtime without source aliases", () => {
    const vueEntry = "/fixture/node_modules/vue/dist/vue.runtime.esm-bundler.js";
    const resolve = buildStarwindVuePerformanceAliases({ repoRoot, vueEntry });
    expect(resolve.dedupe).toEqual(["vue"]);
    expect(resolve.alias.map(({ replacement }) => replacement)).toEqual([
      `${repoRoot}/packages/vue/dist/$1/index.js`,
      `${repoRoot}/packages/runtime/dist/$1.js`,
      vueEntry,
    ]);
    expect(resolve.alias.map(({ find }) => String(find))).toEqual([
      String(/^@starwind-ui\/vue\/(.+)$/),
      String(/^@starwind-ui\/runtime\/(.+)$/),
      String(/^vue$/),
    ]);
    expect(JSON.stringify(resolve)).not.toMatch(/packages\/vue\/src|apps\/vue-demo/);
  });

  it("rejects unknown scenarios and invalid alias roots", () => {
    expect(() => buildStarwindVueFixture("unknown")).toThrow(
      "Unknown Starwind Vue performance scenario: unknown",
    );
    expect(() => buildStarwindVuePerformanceAliases({ repoRoot: "", vueEntry: "/vue.js" })).toThrow(
      "repoRoot must be a nonempty string",
    );
  });
});
