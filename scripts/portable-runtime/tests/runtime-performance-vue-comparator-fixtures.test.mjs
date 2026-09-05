import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  buildVueComparatorFixture,
  buildVueComparatorFixtures,
  validateVueComparatorFixture,
  validateVueComparatorInstall,
  vueComparatorExcludedRows,
  vueComparatorExpectedResolvedVersions,
  vueComparatorFixtureRows,
  vueComparatorInstallSpecifiers,
} from "../runtime-performance/vue-comparator-fixtures.mjs";
import { zagVueComparatorInstallSpecifiers } from "../package-size-vue-plan.mjs";
import {
  REKA_UI_COMPARATOR_VERSION,
  rekaUiAuditedNamedExportsByScenario,
  vuePerformanceProviderRows,
  vuePerformanceTopology,
} from "../runtime-performance/vue-plan.mjs";

const zagRows = vuePerformanceProviderRows.filter(({ provider }) => provider === "zag-vue");
const rekaRows = vuePerformanceProviderRows.filter(({ provider }) => provider === "reka-ui");

function clone(value) {
  return structuredClone(value);
}

describe("Vue comparator fixture membership", () => {
  it("builds one exact Zag fixture for every frozen scenario", () => {
    const fixtures = vueComparatorFixtureRows.filter(({ provider }) => provider === "zag-vue");
    expect(fixtures.map(({ id }) => id)).toEqual(zagRows.map(({ id }) => id));
    expect(fixtures).toHaveLength(vuePerformanceTopology.length);
    expect(
      fixtures.every(
        ({ installSpecifiers }) => installSpecifiers === zagVueComparatorInstallSpecifiers,
      ),
    ).toBe(true);
  });

  it("builds Reka fixtures only for reviewed audit inclusions", () => {
    const fixtures = vueComparatorFixtureRows.filter(({ provider }) => provider === "reka-ui");
    expect(fixtures.map(({ id }) => id)).toEqual(rekaRows.map(({ id }) => id));
    expect(fixtures).toHaveLength(vuePerformanceTopology.length - 3);
    expect(vueComparatorExcludedRows).toEqual([
      expect.objectContaining({
        id: "select-item-highlight:reka-ui",
        scenario: "select-item-highlight",
      }),
      expect.objectContaining({
        id: "select-trigger-mount:reka-ui",
        scenario: "select-trigger-mount",
      }),
      expect.objectContaining({
        id: "combobox-filter-input:reka-ui",
        scenario: "combobox-filter-input",
      }),
      expect.objectContaining({
        id: "navigation-menu-content-switch:reka-ui",
        scenario: "navigation-menu-content-switch",
      }),
    ]);
    expect(() => buildVueComparatorFixture("navigation-menu-content-switch:reka-ui")).toThrow(
      /Unknown or excluded/,
    );
    expect(() => buildVueComparatorFixture("combobox-filter-input:reka-ui")).toThrow(
      /Unknown or excluded/,
    );
    expect(() => buildVueComparatorFixture("select-trigger-mount:reka-ui")).toThrow(
      /Unknown or excluded/,
    );
    expect(() => buildVueComparatorFixture("select-item-highlight:reka-ui")).toThrow(
      /Unknown or excluded/,
    );
    expect(vueComparatorFixtureRows).toHaveLength(41);
  });

  it("generates deterministic rows in frozen provider order", () => {
    expect(buildVueComparatorFixtures()).toBe(vueComparatorFixtureRows);
    expect(vueComparatorFixtureRows.map(({ id }) => buildVueComparatorFixture(id).source)).toEqual(
      vueComparatorFixtureRows.map(({ source }) => source),
    );
    expect(vueComparatorFixtureRows.map(({ id }) => id)).toEqual(
      vuePerformanceProviderRows
        .filter(({ provider }) => provider !== "starwind-vue")
        .map(({ id }) => id),
    );
  });
});

describe("exact comparator installation and imports", () => {
  it("uses the complete order-13 exact Zag policy and exact audited Reka version", () => {
    expect(vueComparatorInstallSpecifiers).toEqual({
      "zag-vue": zagVueComparatorInstallSpecifiers,
      "reka-ui": [`reka-ui@${REKA_UI_COMPARATOR_VERSION}`],
    });
    expect(
      validateVueComparatorInstall({
        requested: vueComparatorInstallSpecifiers,
        resolved: vueComparatorExpectedResolvedVersions,
      }),
    ).toBe(true);
  });

  it("rejects missing, extra, or mismatched requested packages", () => {
    const missing = clone(vueComparatorInstallSpecifiers);
    missing["zag-vue"].pop();
    expect(() =>
      validateVueComparatorInstall({
        requested: missing,
        resolved: vueComparatorExpectedResolvedVersions,
      }),
    ).toThrow(/install specifiers differ/);

    const extra = clone(vueComparatorInstallSpecifiers);
    extra["reka-ui"].push("another-package@1.0.0");
    expect(() =>
      validateVueComparatorInstall({
        requested: extra,
        resolved: vueComparatorExpectedResolvedVersions,
      }),
    ).toThrow(/install specifiers differ/);

    const mismatch = clone(vueComparatorInstallSpecifiers);
    mismatch["reka-ui"] = ["reka-ui@2.10.4"];
    expect(() =>
      validateVueComparatorInstall({
        requested: mismatch,
        resolved: vueComparatorExpectedResolvedVersions,
      }),
    ).toThrow(/install specifiers differ/);
  });

  it("rejects missing, extra, or mismatched resolved packages", () => {
    const missing = clone(vueComparatorExpectedResolvedVersions);
    delete missing["zag-vue"]["@zag-js/core"];
    expect(() =>
      validateVueComparatorInstall({
        requested: vueComparatorInstallSpecifiers,
        resolved: missing,
      }),
    ).toThrow(/Zag Vue comparator version validation failed/);

    const extra = clone(vueComparatorExpectedResolvedVersions);
    extra["reka-ui"].extra = REKA_UI_COMPARATOR_VERSION;
    expect(() =>
      validateVueComparatorInstall({ requested: vueComparatorInstallSpecifiers, resolved: extra }),
    ).toThrow(/Fields differ/);

    const mismatch = clone(vueComparatorExpectedResolvedVersions);
    mismatch["reka-ui"]["reka-ui"] = "2.10.4";
    expect(() =>
      validateVueComparatorInstall({
        requested: vueComparatorInstallSpecifiers,
        resolved: mismatch,
      }),
    ).toThrow("reka-ui: expected 2.10.3, received 2.10.4");
  });

  it("imports one shared Vue runtime and each frozen provider package exactly once", () => {
    for (const fixture of vueComparatorFixtureRows) {
      const imports = [
        ...fixture.source.matchAll(/\bimport\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["'];?/g),
      ]
        .map((match) => match[1])
        .filter((specifier) => specifier !== "./styles.css");
      expect(
        imports.filter((specifier) => specifier === "vue"),
        fixture.id,
      ).toHaveLength(1);
      expect(
        [...imports].sort((left, right) => left.localeCompare(right, "en")),
        fixture.id,
      ).toEqual([...fixture.packageImports].sort((left, right) => left.localeCompare(right, "en")));
      expect(
        imports.some((specifier) => specifier.startsWith("vue/")),
        fixture.id,
      ).toBe(false);
    }
  });

  it("uses every and only the audited Reka named export set per row", () => {
    for (const fixture of vueComparatorFixtureRows.filter(
      ({ provider }) => provider === "reka-ui",
    )) {
      const match = fixture.source.match(/import\s*\{([^}]+)\}\s*from\s*"reka-ui"/);
      const names = match[1]
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "en"));
      expect(names, fixture.id).toEqual(rekaUiAuditedNamedExportsByScenario[fixture.scenario]);
      expect(fixture.provenance, fixture.id).toEqual({
        auditSource:
          ".scratch/vue-runtime-performance-comparison/evidence/reka-ui-fair-overlap-audit.md",
        auditedNamedExports: rekaUiAuditedNamedExportsByScenario[fixture.scenario],
        limitation: expect.any(String),
        packageName: "reka-ui",
        packageVersion: "2.10.3",
        policy: "reviewed-reka-audit",
      });
    }
  });

  it("retains exact Zag provenance on every mandatory row", () => {
    for (const fixture of vueComparatorFixtureRows.filter(
      ({ provider }) => provider === "zag-vue",
    )) {
      expect(fixture.provenance, fixture.id).toEqual({
        auditSource: null,
        auditedNamedExports: [],
        limitation: null,
        packageName: "@zag-js/vue",
        packageVersion: "1.42.0",
        policy: "exact-zag-vue-policy",
      });
    }
  });
});

describe("source, topology, endpoint, and cleanup contracts", () => {
  it("emits syntactically valid production modules for every planned comparator row", () => {
    for (const fixture of vueComparatorFixtureRows) {
      const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
        encoding: "utf8",
        input: fixture.source,
      });
      expect(result.stderr, fixture.id).toBe("");
      expect(result.status, fixture.id).toBe(0);
    }
  });

  it("copies the full frozen topology and interaction facts into each fixture contract", () => {
    for (const fixture of vueComparatorFixtureRows) {
      const row = vuePerformanceProviderRows.find(({ id }) => id === fixture.id);
      expect(fixture.contract, fixture.id).toEqual({
        activationAction: row.activationAction,
        domPhases: row.domPhases,
        endpointSelector: expect.any(String),
        expectedVisibleItemCount: null,
        inputSelector: row.scenario.startsWith("combobox-") ? "[data-benchmark-input]" : null,
        itemSelector: row.scenario.includes("item-highlight")
          ? "[data-benchmark-item]"
          : row.scenario === "radio-group-change-sweep"
            ? "[data-benchmark-radio-item]"
            : null,
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
        triggerSelector: expect.any(String),
        visibleEndpoint: row.visibleEndpoint,
      });
    }
  });

  it("copies only the frozen Tabs activation action and leaves dispatch to the runner", () => {
    for (const fixture of vueComparatorFixtureRows) {
      const row = vuePerformanceProviderRows.find(({ id }) => id === fixture.id);
      expect(fixture.contract.activationAction, fixture.id).toEqual(
        fixture.scenario === "tabs-activation-click" ? row.activationAction : null,
      );
      expect(fixture.source, fixture.id).not.toContain("dispatchEvent(");
      expect(fixture.source, fixture.id).not.toContain("new MouseEvent(");
      expect(fixture.source, fixture.id).not.toMatch(/onMouse(?:down|up)|onClick/);
    }

    for (const provider of ["zag-vue", "reka-ui"]) {
      const fixture = buildVueComparatorFixture(`tabs-activation-click:${provider}`);
      expect(fixture.source, fixture.id).toContain(JSON.stringify(fixture.contract, null, 2));
      expect(fixture.contract.activationAction.events.map(({ type }) => type)).toEqual([
        "mousedown",
        "mouseup",
        "click",
      ]);
    }
  });

  it("rejects missing, overridden, or click-only activation actions", () => {
    const canonical = buildVueComparatorFixture("tabs-activation-click:zag-vue");

    const omitted = clone(canonical);
    delete omitted.contract.activationAction;
    expect(() => validateVueComparatorFixture(omitted)).toThrow(
      /copy the frozen activation action/,
    );

    const overridden = clone(canonical);
    overridden.contract.activationAction.settle = "two animation frames";
    expect(() => validateVueComparatorFixture(overridden)).toThrow(
      /activation action differs from the frozen topology/,
    );

    const clickOnly = clone(canonical);
    clickOnly.contract.activationAction.events = [{ button: 0, type: "click" }];
    expect(() => validateVueComparatorFixture(clickOnly)).toThrow(
      /activation action differs from the frozen topology/,
    );

    const sourceDrift = clone(canonical);
    sourceDrift.source = sourceDrift.source.replace('"type": "mousedown"', '"type": "click"');
    expect(() => validateVueComparatorFixture(sourceDrift)).toThrow(
      /source differs from the frozen fixture contract/,
    );

    const nonTabs = clone(buildVueComparatorFixture("dialog-open:zag-vue"));
    nonTabs.contract.activationAction = canonical.contract.activationAction;
    expect(() => validateVueComparatorFixture(nonTabs)).toThrow(
      /activation action differs from the frozen topology/,
    );
  });

  it("preserves visible endpoints, lifecycle cleanup, and one-shot teardown", () => {
    for (const fixture of vueComparatorFixtureRows) {
      expect(fixture.contract.endpointSelector, fixture.id).toMatch(
        /^\[data-benchmark-|^\[data-state/,
      );
      expect(fixture.source, fixture.id).toContain("app.mount(root)");
      expect(fixture.source, fixture.id).toContain("app.unmount()");
      expect(fixture.source, fixture.id).toContain("await nextTick()");
      expect(fixture.source, fixture.id).toContain('assertEmpty(root, "Vue root after unmount")');
      expect(fixture.source, fixture.id).toContain(
        'assertEmpty(portalTarget, "Teleport target after unmount")',
      );
      expect(fixture.source, fixture.id).toContain("teardown called more than once");
      expect(fixture.source, fixture.id).toContain("export function assertEndpoint");
      expect(fixture.source, fixture.id).toContain(
        JSON.stringify(fixture.contract.endpointSelector),
      );
    }
  });

  it("keeps inline Dialog topology and provider-owned state", () => {
    for (const provider of ["zag-vue", "reka-ui"]) {
      const dialogOpen = buildVueComparatorFixture(`dialog-open:${provider}`);
      const dialogMount = buildVueComparatorFixture(`dialog-trigger-mount:${provider}`);
      expect(dialogOpen.contract.portalState).toBe("inline");
      expect(dialogMount.contract.portalState).toBe("inline");
      expect(dialogOpen.source).not.toContain("teleport(props.portalTarget");
      expect(dialogMount.source).not.toContain("teleport(props.portalTarget");
    }
    expect(buildVueComparatorFixture("dialog-open:reka-ui").source).not.toContain("DialogPortal");
  });

  it("keeps forced inactive content mounted and hidden for audited mount rows", () => {
    for (const scenario of [
      "dialog-trigger-mount",
      "popover-trigger-mount",
      "preview-card-trigger-mount",
      "tabs-high-count-mount",
      "accordion-high-count-mount",
    ]) {
      for (const provider of ["zag-vue", "reka-ui"]) {
        expect(
          buildVueComparatorFixture(`${scenario}:${provider}`).source,
          `${scenario}:${provider}`,
        ).toContain("hidden");
      }
    }
  });

  it("uses library-owned uncontrolled defaults and required interaction policies", () => {
    for (const fixture of vueComparatorFixtureRows) {
      expect(fixture.source, fixture.id).not.toMatch(/\bopen:\s*(?:true|false)/);
      expect(fixture.source, fixture.id).not.toContain("modelValue:");
    }
    expect(buildVueComparatorFixture("tabs-activation-click:zag-vue").source).toContain(
      'activationMode: "manual"',
    );
    expect(buildVueComparatorFixture("tabs-activation-click:reka-ui").source).toContain(
      'activationMode: "manual"',
    );
    expect(
      vueComparatorFixtureRows.some(({ scenario }) => scenario === "combobox-filter-input"),
    ).toBe(false);
    expect(buildVueComparatorFixture("menu-submenu-open:zag-vue").source).toContain(
      'type: "CHILD.SET"',
    );
    expect(buildVueComparatorFixture("navigation-menu-content-switch:zag-vue").source).toContain(
      'defaultValue: "primary"',
    );
  });

  it("pins forced shell presence and deferred heavy item DOM", () => {
    for (const scenario of [
      "select-open",
      "select-item-highlight",
      "menu-open",
      "menu-item-highlight",
      "combobox-open",
      "combobox-item-highlight",
    ]) {
      const providers = scenario === "select-item-highlight" ? ["zag-vue"] : ["zag-vue", "reka-ui"];
      for (const provider of providers) {
        const fixture = buildVueComparatorFixture(`${scenario}:${provider}`);
        expect(fixture.contract.domPhases.rootInitialized.itemNodes, fixture.id).toBe(0);
        expect(fixture.contract.domPhases.measuredEndpoint.itemNodes, fixture.id).toBe(1_000);
        expect(fixture.source, fixture.id).toContain("itemsMounted");
        expect(fixture.source, fixture.id).toContain("hidden:");
      }
    }
    for (const scenario of ["combobox-trigger-mount"]) {
      for (const provider of ["zag-vue", "reka-ui"]) {
        const fixture = buildVueComparatorFixture(`${scenario}:${provider}`);
        expect(fixture.contract.domPhases.rootInitialized.popups, fixture.id).toBe(1_000);
        expect(fixture.contract.domPhases.rootInitialized.itemNodes, fixture.id).toBe(0);
      }
    }
    const zagSelectMount = buildVueComparatorFixture("select-trigger-mount:zag-vue");
    expect(zagSelectMount.contract.domPhases.rootInitialized.popups).toBe(1_000);
    expect(zagSelectMount.contract.domPhases.rootInitialized.itemNodes).toBe(0);
    for (const provider of ["zag-vue", "reka-ui"]) {
      const fixture = buildVueComparatorFixture(`tooltip-trigger-mount:${provider}`);
      expect(fixture.contract.domPhases.rootInitialized.hiddenPopups).toBe(1_000);
      expect(fixture.source).toContain("hidden:");
    }
  });

  it("materializes one Select list and provider viewport only on accepted open", () => {
    const selectRows = [
      ["select-open", "zag-vue"],
      ["select-open", "reka-ui"],
      ["select-item-highlight", "zag-vue"],
      ["select-trigger-mount", "zag-vue"],
    ];
    for (const [scenario, provider] of selectRows) {
      const fixture = buildVueComparatorFixture(`${scenario}:${provider}`);
      for (const phaseName of ["rootInitialized", "setupComplete"]) {
        const phase = fixture.contract.domPhases[phaseName];
        const openSetup = scenario === "select-item-highlight" && phaseName === "setupComplete";
        expect(phase.contents, `${fixture.id}:${phaseName}:contents`).toBe(
          scenario === "select-trigger-mount" ? 1_000 : 1,
        );
        expect(phase.lists, `${fixture.id}:${phaseName}:lists`).toBe(openSetup ? 1 : 0);
        expect(phase.viewports, `${fixture.id}:${phaseName}:viewports`).toBe(openSetup ? 1 : 0);
        expect(phase.itemNodes, `${fixture.id}:${phaseName}:items`).toBe(openSetup ? 1_000 : 0);
      }
      const measured = fixture.contract.domPhases.measuredEndpoint;
      const mount = scenario === "select-trigger-mount";
      expect(measured.lists, `${fixture.id}:measured:lists`).toBe(mount ? 0 : 1);
      expect(measured.viewports, `${fixture.id}:measured:viewports`).toBe(mount ? 0 : 1);
      expect(measured.itemNodes, `${fixture.id}:measured:items`).toBe(mount ? 0 : 1_000);
    }

    for (const scenario of ["select-open"]) {
      const reka = buildVueComparatorFixture(`${scenario}:reka-ui`).source;
      expect(reka, scenario).toContain(
        'open && itemsMounted.value\n                ? [h(SelectViewport, { class: "bench-list-popup", "data-benchmark-list": "true", "data-benchmark-viewport": "true" }',
      );
      expect(reka.match(/"data-benchmark-viewport": "true"/g), scenario).toHaveLength(1);
      expect(reka, scenario).not.toContain("onPointermove");
      expect(reka, scenario).not.toContain("preventScroll");
      expect(reka.indexOf("const roots = "), scenario).toBeLessThan(
        reka.indexOf("function renderRoot"),
      );
    }
    for (const scenario of ["select-open", "select-item-highlight", "select-trigger-mount"]) {
      const zag = buildVueComparatorFixture(`${scenario}:zag-vue`).source;
      expect(zag, scenario).toContain(
        'api.open && itemsMounted.value ? [h("ul", { class: "bench-list-popup", "data-benchmark-list": "true", "data-benchmark-viewport": "true" }',
      );
      expect(zag.match(/"data-benchmark-viewport": "true"/g), scenario).toHaveLength(1);
    }
  });

  it("materializes complete Combobox collections only after accepted open", () => {
    for (const provider of ["zag-vue", "reka-ui"]) {
      for (const scenario of ["combobox-open", "combobox-item-highlight"]) {
        const fixture = buildVueComparatorFixture(`${scenario}:${provider}`);
        expect(fixture.contract.domPhases.rootInitialized).toEqual(
          expect.objectContaining({ itemNodes: 0, lists: 0, viewports: 0 }),
        );
        expect(fixture.contract.domPhases.measuredEndpoint).toEqual(
          expect.objectContaining({ itemNodes: 1_000, lists: 1, viewports: 1 }),
        );
        expect(fixture.source.match(/"data-benchmark-list": "true"/g)).toHaveLength(1);
        expect(fixture.source.match(/"data-benchmark-viewport": "true"/g)).toHaveLength(1);
        expect(fixture.source).toMatch(
          provider === "zag-vue"
            ? /api\.open && itemsMounted\.value \? \[h\("ul",[\s\S]+currentItems\.map/
            : /open && itemsMounted\.value \? \[h\(ComboboxViewport,[\s\S]+items\.map/,
        );
      }

      const mount = buildVueComparatorFixture(`combobox-trigger-mount:${provider}`);
      expect(mount.contract.domPhases.rootInitialized).toEqual(
        expect.objectContaining({ itemNodes: 0, lists: 0, popups: 1_000, viewports: 0 }),
      );
      if (provider === "reka-ui") {
        expect(mount.source).not.toContain('"data-benchmark-list": "true"');
        expect(mount.source).not.toContain('"data-benchmark-viewport": "true"');
      } else {
        expect(mount.source).toContain("api.open && itemsMounted.value");
      }
    }

    const rekaMount = buildVueComparatorFixture("combobox-trigger-mount:reka-ui");
    expect(rekaMount.packageImports).not.toContain("ComboboxItem");
    expect(rekaMount.packageImports).not.toContain("ComboboxViewport");
    expect(rekaMount.source).not.toContain("ComboboxItem");
    expect(rekaMount.source).not.toContain("ComboboxViewport");
  });

  it("uses public uncontrolled presence events and exact provider controls", () => {
    for (const scenario of ["select-open", "menu-open", "combobox-open"]) {
      expect(buildVueComparatorFixture(`${scenario}:reka-ui`).source).toContain('"onUpdate:open"');
      expect(buildVueComparatorFixture(`${scenario}:reka-ui`).source).toContain("forceMount: true");
      expect(buildVueComparatorFixture(`${scenario}:zag-vue`).source).toContain("onOpenChange");
    }
    expect(buildVueComparatorFixture("dialog-open:reka-ui").source).toContain(
      "unmountOnHide: false",
    );
    expect(buildVueComparatorFixture("combobox-open:reka-ui").source).not.toContain(
      "ComboboxTrigger",
    );
    expect(buildVueComparatorFixture("dialog-open:zag-vue").contract.measuredStart).toBe(
      "DOM click on the trigger.",
    );
  });

  it("pins submenu and Navigation Menu endpoints to their exact phase facts", () => {
    for (const provider of ["zag-vue", "reka-ui"]) {
      const fixture = buildVueComparatorFixture(`menu-submenu-open:${provider}`);
      expect(fixture.contract.endpointSelector).toBe(
        '[data-benchmark-popup="submenu"]:not([hidden])',
      );
      expect(fixture.contract.domPhases.rootInitialized.submenuItemNodes).toBe(0);
      expect(fixture.contract.domPhases.measuredEndpoint.submenuItemNodes).toBe(1_000);
      expect(fixture.source).toContain('"data-benchmark-submenu-item"');
    }
    const navigation = buildVueComparatorFixture("navigation-menu-content-switch:zag-vue");
    expect(navigation.contract.endpointSelector).toBe(
      '[data-benchmark-navigation-content="secondary"]:not([hidden])',
    );
    expect(navigation.contract.triggerSelector).toBe('[data-benchmark-nav-trigger="secondary"]');
    expect(navigation.contract.domPhases.rootInitialized).toEqual(
      navigation.contract.domPhases.setupComplete,
    );
    expect(navigation.contract.domPhases.rootInitialized.visiblePrimaryContents).toBe(1);
    expect(navigation.contract.domPhases.rootInitialized.hiddenSecondaryContents).toBe(1);
    expect(navigation.contract.domPhases.measuredEndpoint.visibleSecondaryContents).toBe(1);
    expect(navigation.source).toContain('"data-benchmark-navigation-link": name');
    expect(navigation.source).toMatch(
      /groups\[index\]\.map\(\(item\) => h\("a", \{ "data-benchmark-item": "true", "data-benchmark-navigation-link": name,/,
    );
    expect(navigation.source.match(/h\("a"/g)).toHaveLength(1);
    expect(navigation.source).not.toContain('h("span", { "data-benchmark-navigation-link"');
    expect(navigation.contract.domPhases.rootInitialized).toEqual(
      expect.objectContaining({
        contentLinks: 1_000,
        itemNodes: 1_000,
        primaryContentLinks: 500,
        secondaryContentLinks: 500,
      }),
    );
  });

  it("pins highlighted item endpoints to provider-owned data-highlighted state", () => {
    for (const fixture of vueComparatorFixtureRows.filter(({ scenario }) =>
      scenario.includes("item-highlight"),
    )) {
      expect(fixture.contract.endpointSelector, fixture.id).toBe(
        '[data-benchmark-item="target"][data-highlighted]',
      );
      expect(fixture.source, fixture.id).toContain('"data-benchmark-item"');
    }
  });

  it("pins separate Radio Group mount and change-sweep scales for both providers", () => {
    for (const provider of ["zag-vue", "reka-ui"]) {
      const mount = buildVueComparatorFixture(`radio-group-high-count-mount:${provider}`);
      const sweep = buildVueComparatorFixture(`radio-group-change-sweep:${provider}`);
      const row = vuePerformanceProviderRows.find(({ id }) => id === sweep.id);

      expect(mount.contract.topology.itemCount).toBe(1_000);
      expect(mount.contract.topology.triggerCount).toBe(1_000);
      expect(mount.contract.sweepAction).toBeNull();
      expect(mount.source).toContain("const ITEM_COUNT = 1000;");
      expect(mount.source).not.toContain("const ITEM_COUNT = 100;");

      expect(sweep.contract.topology.itemCount).toBe(100);
      expect(sweep.contract.topology.triggerCount).toBe(100);
      expect(sweep.contract.sweepAction).toEqual(row.sweepAction);
      expect(sweep.source).toContain("const ITEM_COUNT = 100;");
      expect(sweep.source).not.toContain("const ITEM_COUNT = 1000;");
      expect(sweep.source).toContain(
        '"data-benchmark-radio-item": index === items.length - 1 ? "target" : "true"',
      );
      expect(sweep.contract.domPhases.measuredEndpoint.itemNodes).toBe(100);
      expect(sweep.contract.domPhases.measuredEndpoint.targetCheckedItems).toBe(1);
    }
  });

  it("adds no synthetic marker elements to any generated topology", () => {
    for (const fixture of vueComparatorFixtureRows) {
      expect(fixture.source, fixture.id).not.toContain("data-benchmark-marker");
      expect(fixture.source, fixture.id).not.toContain("marker(");
    }
  });

  it("requires every action endpoint to reject its pre-action state", () => {
    for (const fixture of vueComparatorFixtureRows.filter(
      ({ scenario }) => !scenario.endsWith("-mount"),
    )) {
      const selector = fixture.contract.endpointSelector;
      if (fixture.scenario.includes("item-highlight")) {
        expect(selector, fixture.id).toContain("[data-highlighted]");
      } else if (fixture.scenario === "radio-group-change-sweep") {
        expect(selector, fixture.id).toContain('[data-state="checked"]');
      } else {
        expect(selector, fixture.id).toContain(":not([hidden])");
      }
    }
  });

  it("uses only planned topology elements for shell identities", () => {
    for (const scenario of ["combobox-trigger-mount"]) {
      for (const provider of ["zag-vue", "reka-ui"]) {
        const source = buildVueComparatorFixture(`${scenario}:${provider}`).source;
        for (const identity of ["content", "positioner", "popup"]) {
          expect(source, `${scenario}:${provider}:${identity}`).toContain(
            `"data-benchmark-${identity}"`,
          );
        }
        if (provider === "reka-ui") {
          expect(source, `${scenario}:${provider}:list`).not.toContain('"data-benchmark-list"');
          expect(source, `${scenario}:${provider}:viewport`).not.toContain(
            '"data-benchmark-viewport"',
          );
        }
      }
    }
    const selectMount = buildVueComparatorFixture("select-trigger-mount:zag-vue").source;
    for (const identity of ["content", "list", "positioner", "popup", "viewport"]) {
      expect(selectMount, `select-trigger-mount:zag-vue:${identity}`).toContain(
        `"data-benchmark-${identity}"`,
      );
    }
    for (const provider of ["zag-vue", "reka-ui"]) {
      const dialog = buildVueComparatorFixture(`dialog-trigger-mount:${provider}`).source;
      expect(dialog).toContain('"data-benchmark-overlay"');
      expect(dialog).toContain('"data-benchmark-content"');
      expect(dialog).toContain('"data-benchmark-popup"');
    }
  });

  it("removes provider-only Dialog and floating-content anatomy", () => {
    for (const scenario of ["dialog-open", "dialog-trigger-mount"]) {
      expect(buildVueComparatorFixture(`${scenario}:zag-vue`).source).not.toContain(
        "getPositionerProps",
      );
    }
    for (const scenario of ["tooltip-trigger-mount", "preview-card-trigger-mount"]) {
      for (const provider of ["zag-vue", "reka-ui"]) {
        const source = buildVueComparatorFixture(`${scenario}:${provider}`).source;
        expect(source, `${scenario}:${provider}`).not.toContain('h("p"');
        expect(source, `${scenario}:${provider}`).not.toContain('h("h2"');
      }
    }
  });

  it("rejects fixture identity, import, topology, endpoint, and cleanup drift", () => {
    const canonical = buildVueComparatorFixture("select-open:zag-vue");

    const identity = clone(canonical);
    identity.provider = "reka-ui";
    expect(() => validateVueComparatorFixture(identity)).toThrow(/identity differs/);

    const imports = clone(canonical);
    imports.packageImports.push("@zag-js/tooltip");
    expect(() => validateVueComparatorFixture(imports)).toThrow(/package imports differ/);

    const topology = clone(canonical);
    topology.contract.topology.itemCount = 999;
    expect(() => validateVueComparatorFixture(topology)).toThrow(/frozen topology/);

    const phases = clone(canonical);
    phases.contract.domPhases.rootInitialized.itemNodes = 1;
    expect(() => validateVueComparatorFixture(phases)).toThrow(/frozen topology/);

    const provenance = clone(canonical);
    provenance.provenance.packageVersion = "1.43.0";
    expect(() => validateVueComparatorFixture(provenance)).toThrow(/provenance differs/);

    const endpoint = clone(canonical);
    endpoint.source = endpoint.source.replace(
      JSON.stringify(endpoint.contract.endpointSelector),
      '"[data-missing-endpoint]"',
    );
    expect(() => validateVueComparatorFixture(endpoint)).toThrow(/required source contract/);

    const cleanup = clone(canonical);
    cleanup.source = cleanup.source.replace("app.unmount()", "void app");
    expect(() => validateVueComparatorFixture(cleanup)).toThrow(/required source contract/);

    const presence = clone(buildVueComparatorFixture("select-open:reka-ui"));
    presence.source = presence.source.replace("forceMount: true", "forceMount: false");
    expect(() => validateVueComparatorFixture(presence)).toThrow(/forceMount control/);
  });
});
