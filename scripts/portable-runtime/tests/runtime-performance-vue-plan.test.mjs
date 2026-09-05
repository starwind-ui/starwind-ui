import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { scenarioRows } from "../runtime-performance/model.mjs";
import {
  REKA_UI_COMPARATOR_VERSION,
  VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
  rekaUiAuditedNamedExportsByScenario,
  rekaUiExpectedResolvedVersions,
  rekaUiScenarioDecisions,
  selectVuePerformanceRows,
  validateVuePerformanceComparatorVersions,
  validateVuePerformancePlan,
  vuePerformanceDomPhaseFactsByScenario,
  vuePerformanceDomPartCountsByScenario,
  vuePerformanceExcludedScenarioKeys,
  vuePerformancePlan,
  vuePerformanceProposedScenarioKeys,
  vuePerformanceProviderOrder,
  vuePerformanceProviderRows,
  vuePerformanceScenarioKeys,
  vuePerformanceTopology,
} from "../runtime-performance/vue-plan.mjs";
import {
  ZAG_VUE_COMPARATOR_VERSION,
  zagVueExpectedResolvedVersions,
} from "../package-size-vue-plan.mjs";

describe("Vue runtime performance topology", () => {
  it("reuses every applicable shared scenario identity in stable order", () => {
    expect(vuePerformanceProposedScenarioKeys).toEqual(scenarioRows.map(({ key }) => key));
    expect(vuePerformanceExcludedScenarioKeys).toEqual(["combobox-filter-input"]);
    expect(vuePerformanceScenarioKeys).toEqual(
      scenarioRows.map(({ key }) => key).filter((key) => key !== "combobox-filter-input"),
    );
    expect(vuePerformanceTopology).toHaveLength(22);
    expect(vuePerformanceTopology.map(({ scenario }) => scenario)).toEqual(
      vuePerformanceScenarioKeys,
    );
    expect(Object.keys(vuePerformanceDomPartCountsByScenario)).toEqual(vuePerformanceScenarioKeys);
    expect(Object.keys(vuePerformanceDomPhaseFactsByScenario)).toEqual(vuePerformanceScenarioKeys);
    expect(Object.isFrozen(vuePerformanceTopology)).toBe(true);
    expect(Object.isFrozen(vuePerformanceTopology[0])).toBe(true);
    expect(Object.isFrozen(vuePerformanceTopology[0].domPhases.rootInitialized)).toBe(true);
  });

  it("declares complete topology and measurement facts for every scenario", () => {
    for (const topology of vuePerformanceTopology) {
      expect(topology).toEqual(
        expect.objectContaining({
          activationAction:
            topology.scenario === "tabs-activation-click" ? expect.any(Object) : null,
          component: expect.any(String),
          componentCount: expect.any(Number),
          controlledness: expect.any(String),
          cpuThrottle: expect.any(Number),
          domPartCounts: expect.any(Object),
          domPhases: expect.any(Object),
          itemCount: expect.any(Number),
          implementationBoundary: "public APIs only; no library or Runtime implementation changes",
          measuredStart: expect.any(String),
          metric: expect.any(String),
          mountedContentCount: expect.any(Number),
          outsideNodeCount: expect.any(Number),
          portalState: expect.any(String),
          presenceState: expect.any(String),
          scenario: expect.any(String),
          setup: expect.any(String),
          sweepAction: topology.metric.endsWith("-sweep") ? expect.any(Object) : null,
          teardown: expect.any(String),
          triggerCount: expect.any(Number),
          type: expect.any(String),
          visibleEndpoint: expect.any(String),
          warmupCount: 0,
          withinRunSampleCount: 5,
        }),
      );
      const shared = scenarioRows.find(({ key }) => key === topology.scenario);
      expect(topology.type).toBe(shared.type);
      expect(topology.controlledness).toBe(
        topology.scenario === "navigation-menu-content-switch"
          ? "uncontrolled with defaultValue='primary'"
          : "uncontrolled",
      );
      expect(topology.cpuThrottle).toBe(shared.cpuThrottle);
      expect(topology.withinRunSampleCount).toBe(5);
      expect(topology.domPartCounts).toEqual(
        vuePerformanceDomPartCountsByScenario[topology.scenario],
      );
      expect(topology.domPhases).toEqual(vuePerformanceDomPhaseFactsByScenario[topology.scenario]);
      expect(Object.keys(topology.domPartCounts)).toEqual(
        Object.keys(topology.domPartCounts).sort(),
      );
      expect(Object.values(topology.domPartCounts).every(Number.isInteger)).toBe(true);
    }
  });

  it("freezes audited per-part DOM scales for representative complex rows", () => {
    expect(vuePerformanceDomPartCountsByScenario["dialog-trigger-mount"]).toEqual({
      closeControls: 1_000,
      contents: 1_000,
      descriptions: 1_000,
      overlays: 1_000,
      popups: 1_000,
      roots: 1_000,
      titles: 1_000,
      triggers: 1_000,
    });
    expect(vuePerformanceDomPartCountsByScenario["tooltip-trigger-mount"]).toEqual({
      contents: 1_000,
      positioners: 1_000,
      popups: 1_000,
      providers: 1,
      roots: 1_000,
      triggers: 1_000,
    });
    expect(vuePerformanceDomPartCountsByScenario["select-trigger-mount"]).toEqual({
      contents: 1_000,
      items: 0,
      lists: 0,
      positioners: 1_000,
      popups: 1_000,
      roots: 1_000,
      triggers: 1_000,
      viewports: 0,
    });
    expect(vuePerformanceDomPartCountsByScenario["combobox-trigger-mount"]).toEqual({
      contents: 1_000,
      inputs: 1_000,
      items: 0,
      lists: 0,
      positioners: 1_000,
      popups: 1_000,
      roots: 1_000,
      viewports: 0,
    });
    expect(vuePerformanceDomPartCountsByScenario["popover-trigger-mount"]).toEqual({
      closeControls: 1_000,
      contents: 1_000,
      descriptions: 1_000,
      headings: 1_000,
      positioners: 1_000,
      popups: 1_000,
      roots: 1_000,
      triggers: 1_000,
    });
    expect(vuePerformanceDomPartCountsByScenario["menu-submenu-open"]).toEqual({
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
    });
    expect(vuePerformanceDomPartCountsByScenario["tabs-high-count-mount"]).toEqual({
      lists: 1,
      panels: 1_000,
      roots: 1,
      triggers: 1_000,
    });
  });

  it("freezes five measured Vue samples with no warmups independently of React", () => {
    expect(vuePerformanceTopology).toHaveLength(22);
    expect(vuePerformanceProviderRows).toHaveLength(63);
    for (const row of [...vuePerformanceTopology, ...vuePerformanceProviderRows]) {
      expect(row.warmupCount, row.scenario).toBe(0);
      expect(row.withinRunSampleCount, row.scenario).toBe(5);
    }

    for (const [scenario, type] of [
      ["dialog-open", "open"],
      ["tabs-activation-click", "tabs-activation"],
    ]) {
      expect(vuePerformanceTopology.find((row) => row.scenario === scenario)).toMatchObject({
        type,
        warmupCount: 0,
        withinRunSampleCount: 5,
      });
      expect(scenarioRows.find(({ key }) => key === scenario)).toMatchObject({ sampleCount: 5 });
    }
    for (const scenario of ["dialog-trigger-mount", "tabs-high-count-mount"]) {
      expect(vuePerformanceTopology.find((row) => row.scenario === scenario)).toMatchObject({
        type: "mount",
        warmupCount: 0,
        withinRunSampleCount: 5,
      });
      expect(scenarioRows.find(({ key }) => key === scenario)).toMatchObject({
        groupCount: 5,
        iterationsPerGroup: 20,
      });
    }
  });

  it("freezes one shared Vue settle for every highlight and radio sweep action", () => {
    const highlightAction = {
      currentItemAssertion: "data-highlighted",
      dispatch: "synchronous pointermove",
      finalEndpointAssertion: "the last item remains highlighted",
      forcedLayout: "after the current-item assertion",
      postSweepWait: "existing shared post-sweep wait",
      sharedVueNextTickCount: 1,
    };
    for (const scenario of [
      "select-item-highlight",
      "menu-item-highlight",
      "combobox-item-highlight",
      "menu-submenu-item-highlight",
    ]) {
      const topology = vuePerformanceTopology.find((row) => row.scenario === scenario);
      expect(topology.sweepAction).toEqual(highlightAction);
      expect(Object.isFrozen(topology.sweepAction)).toBe(true);
      for (const providerRow of vuePerformanceProviderRows.filter(
        (row) => row.scenario === scenario,
      )) {
        expect(providerRow.sweepAction).toEqual(highlightAction);
      }
    }

    const radioAction = {
      currentItemAssertion: "provider-public checked DOM state",
      dispatch: "synchronous click",
      finalEndpointAssertion: "the last radio remains checked",
      forcedLayout: "after the current-item assertion",
      postSweepWait: "existing shared post-sweep wait",
      sharedVueNextTickCount: 1,
    };
    const radioTopology = vuePerformanceTopology.find(
      ({ scenario }) => scenario === "radio-group-change-sweep",
    );
    expect(radioTopology.sweepAction).toEqual(radioAction);
    expect(radioTopology).toMatchObject({
      domPartCounts: { items: 100, roots: 1 },
      itemCount: 100,
      triggerCount: 100,
      visibleEndpoint:
        "After each of 100 synchronous clicks, await one shared Vue nextTick, assert the current radio is checked, then force group layout; after the shared post-sweep wait, the last radio remains checked.",
    });
    expect(radioTopology.domPhases).toEqual({
      measuredEndpoint: { checkedItems: 1, itemNodes: 100, targetCheckedItems: 1 },
      rootInitialized: { checkedItems: 1, itemNodes: 100 },
      setupComplete: { checkedItems: 1, itemNodes: 100 },
    });
    const radioProviderRows = vuePerformanceProviderRows.filter(
      ({ scenario }) => scenario === "radio-group-change-sweep",
    );
    expect(radioProviderRows.map(({ provider }) => provider)).toEqual([
      "starwind-vue",
      "zag-vue",
      "reka-ui",
    ]);
    for (const providerRow of radioProviderRows) {
      expect(providerRow.sweepAction).toEqual(radioAction);
      expect(providerRow).toMatchObject({
        domPartCounts: { items: 100, roots: 1 },
        itemCount: 100,
        triggerCount: 100,
      });
    }

    const radioMountTopology = vuePerformanceTopology.find(
      ({ scenario }) => scenario === "radio-group-high-count-mount",
    );
    expect(radioMountTopology).toMatchObject({
      domPartCounts: { items: 1_000, roots: 1 },
      itemCount: 1_000,
      triggerCount: 1_000,
    });
    expect(radioMountTopology.domPhases).toEqual({
      measuredEndpoint: { checkedItems: 1, itemNodes: 1_000 },
      rootInitialized: { checkedItems: 1, itemNodes: 1_000 },
      setupComplete: { checkedItems: 1, itemNodes: 1_000 },
    });

    expect(
      vuePerformanceTopology
        .filter(({ metric }) => !["pointermove-sweep", "radio-click-sweep"].includes(metric))
        .every(({ sweepAction }) => sweepAction === null),
    ).toBe(true);
  });

  it("freezes one exact Tabs activation action for every provider", () => {
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
    const topology = vuePerformanceTopology.find(
      ({ scenario }) => scenario === "tabs-activation-click",
    );
    expect(topology.activationAction).toEqual(action);
    expect(topology.measuredStart).toBe(
      "Synchronously dispatch left-button mousedown, mouseup, and click on the last trigger.",
    );
    expect(topology.visibleEndpoint).toBe(
      "After the existing shared settle and forced layout, the last panel marker is visible.",
    );
    expect(Object.isFrozen(topology.activationAction)).toBe(true);
    expect(Object.isFrozen(topology.activationAction.events)).toBe(true);
    expect(topology.activationAction.events.every(Object.isFrozen)).toBe(true);

    const providerRows = vuePerformanceProviderRows.filter(
      ({ scenario }) => scenario === "tabs-activation-click",
    );
    expect(providerRows.map(({ provider }) => provider)).toEqual([
      "starwind-vue",
      "zag-vue",
      "reka-ui",
    ]);
    for (const providerRow of providerRows) {
      expect(providerRow.activationAction).toEqual(action);
    }
  });

  it("materializes complete provider rows from the same topology facts", () => {
    expect(vuePerformanceProviderRows).toHaveLength(63);
    for (const providerRow of vuePerformanceProviderRows) {
      const topology = vuePerformanceTopology.find(
        ({ scenario }) => scenario === providerRow.scenario,
      );
      for (const [key, value] of Object.entries(topology)) {
        expect(providerRow[key]).toEqual(value);
      }
      expect(providerRow.packageImports.length).toBeGreaterThan(0);
      expect(providerRow.id).toBe(`${providerRow.scenario}:${providerRow.provider}`);
    }
  });

  it("freezes hidden shells and deferred heavy item DOM by lifecycle phase", () => {
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
    const selectPhases = {
      "select-item-highlight": {
        measuredEndpoint: openSelect,
        rootInitialized: closedSelect,
        setupComplete: openSelect,
      },
      "select-open": {
        measuredEndpoint: openSelect,
        rootInitialized: closedSelect,
        setupComplete: closedSelect,
      },
      "select-trigger-mount": {
        measuredEndpoint: {
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
        },
        rootInitialized: {
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
        },
        setupComplete: {
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
        },
      },
    };
    for (const [scenario, phases] of Object.entries(selectPhases)) {
      expect(vuePerformanceDomPhaseFactsByScenario[scenario]).toEqual(phases);
      const providerRows = vuePerformanceProviderRows.filter((row) => row.scenario === scenario);
      expect(providerRows.map(({ provider }) => provider)).toEqual(
        ["select-item-highlight", "select-trigger-mount"].includes(scenario)
          ? ["starwind-vue", "zag-vue"]
          : ["starwind-vue", "zag-vue", "reka-ui"],
      );
      for (const providerRow of providerRows) {
        expect(providerRow.domPhases).toEqual(phases);
      }
    }
    const closedCombobox = {
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
    const openCombobox = {
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
    const mountedCombobox = {
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
    const comboboxPhases = {
      "combobox-item-highlight": {
        measuredEndpoint: openCombobox,
        rootInitialized: closedCombobox,
        setupComplete: openCombobox,
      },
      "combobox-open": {
        measuredEndpoint: openCombobox,
        rootInitialized: closedCombobox,
        setupComplete: closedCombobox,
      },
      "combobox-trigger-mount": {
        measuredEndpoint: mountedCombobox,
        rootInitialized: mountedCombobox,
        setupComplete: mountedCombobox,
      },
    };
    for (const [scenario, phases] of Object.entries(comboboxPhases)) {
      expect(vuePerformanceDomPhaseFactsByScenario[scenario]).toEqual(phases);
      const providerRows = vuePerformanceProviderRows.filter((row) => row.scenario === scenario);
      expect(providerRows.map(({ provider }) => provider)).toEqual([
        "starwind-vue",
        "zag-vue",
        "reka-ui",
      ]);
      for (const providerRow of providerRows) {
        expect(providerRow.domPhases).toEqual(phases);
      }
    }
    expect(
      vuePerformanceDomPhaseFactsByScenario["tooltip-trigger-mount"].rootInitialized,
    ).toMatchObject({
      contents: 1_000,
      hiddenContents: 1_000,
      hiddenPopups: 1_000,
      positioners: 1_000,
      popups: 1_000,
    });
    for (const scenario of ["select-trigger-mount", "combobox-trigger-mount"]) {
      expect(vuePerformanceDomPhaseFactsByScenario[scenario].measuredEndpoint).toMatchObject({
        contents: 1_000,
        hiddenContents: 1_000,
        hiddenPopups: 1_000,
        itemNodes: 0,
        positioners: 1_000,
        popups: 1_000,
      });
    }
    expect(vuePerformanceDomPhaseFactsByScenario["menu-submenu-open"]).toMatchObject({
      measuredEndpoint: { submenuItemNodes: 1_000, visibleSubmenuContents: 1 },
      rootInitialized: {
        contents: 2,
        hiddenContents: 2,
        itemNodes: 1,
        submenuItemNodes: 0,
      },
      setupComplete: { hiddenContents: 1, itemNodes: 1, submenuItemNodes: 0 },
    });
    const navigationPhases =
      vuePerformanceDomPhaseFactsByScenario["navigation-menu-content-switch"];
    expect(navigationPhases.rootInitialized).toEqual({
      contentLinks: 1_000,
      contents: 2,
      hiddenContents: 1,
      hiddenPopups: 0,
      hiddenPrimaryContents: 0,
      hiddenPositioners: 0,
      hiddenSecondaryContents: 1,
      hiddenViewports: 0,
      itemNodes: 1_000,
      popups: 1,
      positioners: 1,
      primaryContentLinks: 500,
      secondaryContentLinks: 500,
      viewports: 1,
      visibleContents: 1,
      visiblePopups: 1,
      visiblePositioners: 1,
      visiblePrimaryContents: 1,
      visibleSecondaryContents: 0,
      visibleViewports: 1,
    });
    expect(navigationPhases.setupComplete).toEqual({
      contentLinks: 1_000,
      contents: 2,
      hiddenContents: 1,
      hiddenPopups: 0,
      hiddenPrimaryContents: 0,
      hiddenPositioners: 0,
      hiddenSecondaryContents: 1,
      hiddenViewports: 0,
      itemNodes: 1_000,
      popups: 1,
      positioners: 1,
      primaryContentLinks: 500,
      secondaryContentLinks: 500,
      viewports: 1,
      visibleContents: 1,
      visiblePopups: 1,
      visiblePositioners: 1,
      visiblePrimaryContents: 1,
      visibleSecondaryContents: 0,
      visibleViewports: 1,
    });
    expect(navigationPhases.measuredEndpoint).toMatchObject({
      hiddenPrimaryContents: 1,
      hiddenSecondaryContents: 0,
      visiblePrimaryContents: 0,
      visibleSecondaryContents: 1,
      visibleViewports: 1,
    });

    const topologyByScenario = Object.fromEntries(
      vuePerformanceTopology.map((row) => [row.scenario, row]),
    );
    expect(topologyByScenario["dialog-open"].measuredStart).toBe("DOM click on the trigger.");
    expect(topologyByScenario["menu-submenu-open"].measuredStart).toBe(
      "DOM click on the submenu trigger.",
    );
    expect(topologyByScenario["navigation-menu-content-switch"]).toMatchObject({
      controlledness: "uncontrolled with defaultValue='primary'",
      measuredStart: "DOM click on the secondary trigger.",
      presenceState:
        "defaultValue='primary' keeps the mounted primary 500-link content visible and the mounted secondary content hidden at root initialization and setup",
      setup:
        "Confirm the visible primary endpoint from defaultValue='primary', settle layout, and clear timing entries.",
      visibleEndpoint:
        "The secondary 500-link content is visible in the teleported viewport after layout.",
    });
  });
});

describe("Vue runtime performance provider provenance", () => {
  it("requires Starwind and exact Zag Vue for every scenario", () => {
    for (const scenario of vuePerformanceScenarioKeys) {
      const rows = vuePerformanceProviderRows.filter((row) => row.scenario === scenario);
      expect(rows.slice(0, 2).map(({ provider }) => provider)).toEqual(["starwind-vue", "zag-vue"]);
      expect(rows[1]).toMatchObject({
        packageName: "@zag-js/vue",
        packageVersion: ZAG_VUE_COMPARATOR_VERSION,
        provenance: "exact-zag-vue-policy",
      });
      expect(rows[1].packageImports).toContain("@zag-js/core");
      expect(rows[1].packageImports).toContain("@zag-js/vue");
    }
    expect(vuePerformancePlan.zagResolvedVersions).toBe(zagVueExpectedResolvedVersions);
    expect(() =>
      validateVuePerformanceComparatorVersions({
        reka: rekaUiExpectedResolvedVersions,
        zag: zagVueExpectedResolvedVersions,
      }),
    ).not.toThrow();
    expect(() =>
      validateVuePerformanceComparatorVersions({
        reka: rekaUiExpectedResolvedVersions,
        zag: { ...zagVueExpectedResolvedVersions, "@zag-js/vue": "1.43.0" },
      }),
    ).toThrow("@zag-js/vue: expected 1.42.0, received 1.43.0");
  });

  it("matches the reviewed exact-version Reka audit", () => {
    expect(rekaUiScenarioDecisions).toHaveLength(23);
    expect(rekaUiScenarioDecisions.filter(({ decision }) => decision === "include")).toHaveLength(
      19,
    );
    expect(rekaUiScenarioDecisions.filter(({ decision }) => decision === "exclude")).toEqual([
      {
        decision: "exclude",
        limitation:
          "Reka UI 2.10.3 SelectItem awaits nextTick before reading event.currentTarget, which is null after synchronous dispatch; trusted Playwright movement or a consumer pointer or focus shim would change the approved action and measured work, so no sample or result applies.",
        scenario: "select-item-highlight",
        source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
      },
      {
        decision: "exclude",
        limitation:
          "At the approved 1,000-root scale, Reka UI 2.10.3 forced closed Select content shells did not complete production mount and phase verification after about 150 seconds, exceeding the fixed 15-second lifecycle policy; no sample or result applies.",
        scenario: "select-trigger-mount",
        source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
      },
      expect.objectContaining({
        decision: "exclude",
        scenario: "combobox-filter-input",
        source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
      }),
      expect.objectContaining({
        decision: "exclude",
        scenario: "navigation-menu-content-switch",
        source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
      }),
    ]);
    const rekaRows = vuePerformanceProviderRows.filter(({ provider }) => provider === "reka-ui");
    expect(rekaRows).toHaveLength(19);
    expect(rekaRows.map(({ scenario }) => scenario)).toEqual(
      rekaUiScenarioDecisions
        .filter(({ decision }) => decision === "include")
        .map(({ scenario }) => scenario),
    );
    for (const row of rekaRows) {
      expect(row).toMatchObject({
        auditSource: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
        packageImports: ["reka-ui"],
        packageName: "reka-ui",
        packageVersion: REKA_UI_COMPARATOR_VERSION,
        provenance: "reviewed-reka-audit",
      });
      expect(row.auditedNamedExports).toEqual(rekaUiAuditedNamedExportsByScenario[row.scenario]);
      expect(row.limitation.length).toBeGreaterThan(0);
    }

    const audit = readFileSync(
      path.resolve(import.meta.dirname, "../../..", VUE_PERFORMANCE_REKA_AUDIT_SOURCE),
      "utf8",
    );
    const auditedDecisions = [...audit.matchAll(/^\| `([^`]+)` \| (Include|Exclude) \|/gm)].map(
      ([, scenario, decision]) => ({ scenario, decision: decision.toLowerCase() }),
    );
    expect(audit).toContain(`Selected package:** \`reka-ui@${REKA_UI_COMPARATOR_VERSION}\``);
    expect(audit).toContain(
      "Synchronously dispatch `mousedown`, `mouseup`, and `click`, in that order, on the last trigger.",
    );
    expect(auditedDecisions).toEqual(
      rekaUiScenarioDecisions.map(({ scenario, decision }) => ({ scenario, decision })),
    );
    expect(rekaUiAuditedNamedExportsByScenario["menu-submenu-open"]).toEqual([
      "DropdownMenuContent",
      "DropdownMenuItem",
      "DropdownMenuPortal",
      "DropdownMenuRoot",
      "DropdownMenuSub",
      "DropdownMenuSubContent",
      "DropdownMenuSubTrigger",
      "DropdownMenuTrigger",
    ]);
    const auditedFamilyExports = {
      "dialog-open": [
        "DialogClose",
        "DialogContent",
        "DialogDescription",
        "DialogOverlay",
        "DialogRoot",
        "DialogTitle",
        "DialogTrigger",
      ],
      "select-open": [
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
      ],
      "menu-open": [
        "DropdownMenuContent",
        "DropdownMenuItem",
        "DropdownMenuPortal",
        "DropdownMenuRoot",
        "DropdownMenuTrigger",
      ],
      "tooltip-trigger-mount": [
        "TooltipContent",
        "TooltipPortal",
        "TooltipProvider",
        "TooltipRoot",
        "TooltipTrigger",
      ],
      "popover-trigger-mount": [
        "PopoverClose",
        "PopoverContent",
        "PopoverPortal",
        "PopoverRoot",
        "PopoverTrigger",
      ],
      "preview-card-trigger-mount": [
        "HoverCardContent",
        "HoverCardPortal",
        "HoverCardRoot",
        "HoverCardTrigger",
      ],
      "combobox-open": [
        "ComboboxContent",
        "ComboboxInput",
        "ComboboxItem",
        "ComboboxPortal",
        "ComboboxRoot",
        "ComboboxViewport",
      ],
      "combobox-trigger-mount": [
        "ComboboxContent",
        "ComboboxInput",
        "ComboboxPortal",
        "ComboboxRoot",
      ],
      "tabs-high-count-mount": ["TabsContent", "TabsList", "TabsRoot", "TabsTrigger"],
      "accordion-high-count-mount": [
        "AccordionContent",
        "AccordionHeader",
        "AccordionItem",
        "AccordionRoot",
        "AccordionTrigger",
      ],
      "radio-group-high-count-mount": ["RadioGroupItem", "RadioGroupRoot"],
    };
    for (const [scenario, expectedExports] of Object.entries(auditedFamilyExports)) {
      expect(rekaUiAuditedNamedExportsByScenario[scenario]).toEqual(expectedExports);
    }
    expect(rekaUiAuditedNamedExportsByScenario["select-open"]).toEqual(
      auditedFamilyExports["select-open"],
    );
    expect(rekaUiAuditedNamedExportsByScenario["combobox-item-highlight"]).toEqual(
      auditedFamilyExports["combobox-open"],
    );
    expect(rekaUiAuditedNamedExportsByScenario["combobox-trigger-mount"]).not.toContain(
      "ComboboxItem",
    );
    expect(rekaUiAuditedNamedExportsByScenario["combobox-trigger-mount"]).not.toContain(
      "ComboboxViewport",
    );
    expect(rekaUiAuditedNamedExportsByScenario).not.toHaveProperty("select-item-highlight");
    expect(rekaUiAuditedNamedExportsByScenario).not.toHaveProperty("combobox-filter-input");
    expect(rekaUiAuditedNamedExportsByScenario).not.toHaveProperty("select-trigger-mount");
  });

  it("keeps exact provider totals after the global and Reka exclusions", () => {
    expect(
      Object.fromEntries(
        vuePerformanceProviderOrder.map((provider) => [
          provider,
          vuePerformanceProviderRows.filter((row) => row.provider === provider).length,
        ]),
      ),
    ).toEqual({ "reka-ui": 19, "starwind-vue": 22, "zag-vue": 22 });
    expect(
      vuePerformanceProviderRows.filter(({ scenario }) => scenario === "select-item-highlight"),
    ).toEqual([
      expect.objectContaining({ id: "select-item-highlight:starwind-vue" }),
      expect.objectContaining({ id: "select-item-highlight:zag-vue" }),
    ]);
    expect(
      vuePerformanceProviderRows.filter(({ scenario }) => scenario === "select-trigger-mount"),
    ).toEqual([
      expect.objectContaining({ id: "select-trigger-mount:starwind-vue" }),
      expect.objectContaining({ id: "select-trigger-mount:zag-vue" }),
    ]);
    expect(
      vuePerformanceProviderRows.some(({ scenario }) => scenario === "combobox-filter-input"),
    ).toBe(false);
    expect(() => selectVuePerformanceRows({ scenarios: ["combobox-filter-input"] })).toThrow(
      "Unknown Vue performance scenario: combobox-filter-input",
    );
  });

  it("rejects resolved Reka package drift from the audited version", () => {
    expect(vuePerformancePlan.rekaResolvedVersions).toBe(rekaUiExpectedResolvedVersions);
    expect(() =>
      validateVuePerformanceComparatorVersions({
        reka: { "reka-ui": "2.10.4" },
        zag: zagVueExpectedResolvedVersions,
      }),
    ).toThrow("reka-ui: expected 2.10.3, received 2.10.4");
  });
});

describe("Vue runtime performance plan selection and validation", () => {
  it("selects full and focused rows without changing canonical order", () => {
    expect(selectVuePerformanceRows()).toEqual(vuePerformanceProviderRows);
    expect(
      selectVuePerformanceRows({
        providers: ["zag-vue", "starwind-vue"],
        scenarios: ["select-open", "dialog-open"],
      }).map(({ id }) => id),
    ).toEqual([
      "dialog-open:starwind-vue",
      "dialog-open:zag-vue",
      "select-open:starwind-vue",
      "select-open:zag-vue",
    ]);
    expect(() => selectVuePerformanceRows({ providers: ["zag-vue", "zag-vue"] })).toThrow(
      /Duplicate provider filter/,
    );
    expect(() => selectVuePerformanceRows({ scenarios: ["unknown"] })).toThrow(
      /Unknown Vue performance scenario/,
    );
  });

  it("rejects missing, duplicate, unknown, partial, and reordered facts", () => {
    const missing = clonePlan();
    missing.rows.splice(1, 1);
    expect(() => validateVuePerformancePlan(missing)).toThrow(/membership or order differs/);

    const duplicate = clonePlan();
    duplicate.rows.splice(1, 0, duplicate.rows[0]);
    expect(() => validateVuePerformancePlan(duplicate)).toThrow(/membership or order differs/);

    const unknown = clonePlan();
    unknown.providers[0] = "unknown-vue";
    expect(() => validateVuePerformancePlan(unknown)).toThrow(/provider order/);

    const partial = clonePlan();
    delete partial.topology[0].metric;
    expect(() => validateVuePerformancePlan(partial)).toThrow(/Fields differ/);

    const reordered = clonePlan();
    reordered.topology.reverse();
    expect(() => validateVuePerformancePlan(reordered)).toThrow(/membership or order differs/);
  });

  it("rejects Vue sampling drift at topology and provider level", () => {
    for (const scenario of ["dialog-open", "tabs-high-count-mount"]) {
      const warmupDrift = clonePlan();
      warmupDrift.topology.find((row) => row.scenario === scenario).warmupCount = 1;
      expect(() => validateVuePerformancePlan(warmupDrift)).toThrow(/zero Vue warmups/);

      const sampleDrift = clonePlan();
      sampleDrift.topology.find((row) => row.scenario === scenario).withinRunSampleCount = 6;
      expect(() => validateVuePerformancePlan(sampleDrift)).toThrow(
        /exactly five measured Vue samples/,
      );
    }

    const reducedSampleDrift = clonePlan();
    reducedSampleDrift.topology.find(
      ({ scenario }) => scenario === "dialog-open",
    ).withinRunSampleCount = 4;
    expect(() => validateVuePerformancePlan(reducedSampleDrift)).toThrow(
      /Topology dialog-open must use exactly five measured Vue samples/,
    );

    const providerWarmupDrift = clonePlan();
    providerWarmupDrift.rows.find(({ id }) => id === "dialog-open:starwind-vue").warmupCount = 1;
    expect(() => validateVuePerformancePlan(providerWarmupDrift)).toThrow(
      /Provider row dialog-open:starwind-vue must use zero Vue warmups/,
    );

    const providerSampleDrift = clonePlan();
    providerSampleDrift.rows.find(
      ({ id }) => id === "tabs-high-count-mount:reka-ui",
    ).withinRunSampleCount = 100;
    expect(() => validateVuePerformancePlan(providerSampleDrift)).toThrow(
      /Provider row tabs-high-count-mount:reka-ui must use exactly five measured Vue samples/,
    );
  });

  it("rejects provider, comparator, and audit drift", () => {
    const providerDrift = clonePlan();
    providerDrift.rows[0].setup = "Changed setup";
    expect(() => validateVuePerformancePlan(providerDrift)).toThrow(/differs from topology/);

    const domDrift = clonePlan();
    domDrift.topology.find(
      ({ scenario }) => scenario === "dialog-trigger-mount",
    ).domPartCounts.overlays = 1;
    expect(() => validateVuePerformancePlan(domDrift)).toThrow(/differs from the frozen Vue plan/);

    const zagDrift = clonePlan();
    zagDrift.rows.find(({ provider }) => provider === "zag-vue").packageVersion = "1.43.0";
    expect(() => validateVuePerformancePlan(zagDrift)).toThrow(/exact Zag Vue policy/);

    const provenanceDrift = clonePlan();
    provenanceDrift.zagResolvedVersions["@zag-js/core"] = "1.43.0";
    expect(() => validateVuePerformancePlan(provenanceDrift)).toThrow(
      "@zag-js/core: expected 1.42.0, received 1.43.0",
    );

    const rekaProvenanceDrift = clonePlan();
    rekaProvenanceDrift.rekaResolvedVersions["reka-ui"] = "2.10.4";
    expect(() => validateVuePerformancePlan(rekaProvenanceDrift)).toThrow(
      "reka-ui: expected 2.10.3, received 2.10.4",
    );

    const rekaExportDrift = clonePlan();
    rekaExportDrift.rows
      .find(({ provider, scenario }) => provider === "reka-ui" && scenario === "menu-submenu-open")
      .auditedNamedExports.pop();
    expect(() => validateVuePerformancePlan(rekaExportDrift)).toThrow(/reviewed Reka audit/);

    const comboboxMountExportDrift = clonePlan();
    comboboxMountExportDrift.rows
      .find(
        ({ provider, scenario }) => provider === "reka-ui" && scenario === "combobox-trigger-mount",
      )
      .auditedNamedExports.push("ComboboxViewport");
    expect(() => validateVuePerformancePlan(comboboxMountExportDrift)).toThrow(
      /reviewed Reka audit/,
    );

    const auditDrift = clonePlan();
    auditDrift.rekaDecisions.find(
      ({ scenario }) => scenario === "navigation-menu-content-switch",
    ).decision = "include";
    expect(() => validateVuePerformancePlan(auditDrift)).toThrow(/differs from the reviewed audit/);

    const selectMountMembershipDrift = clonePlan();
    selectMountMembershipDrift.rekaDecisions.find(
      ({ scenario }) => scenario === "select-trigger-mount",
    ).decision = "include";
    expect(() => validateVuePerformancePlan(selectMountMembershipDrift)).toThrow(
      /differs from the reviewed audit/,
    );

    const selectHighlightMembershipDrift = clonePlan();
    selectHighlightMembershipDrift.rekaDecisions.find(
      ({ scenario }) => scenario === "select-item-highlight",
    ).decision = "include";
    expect(() => validateVuePerformancePlan(selectHighlightMembershipDrift)).toThrow(
      /differs from the reviewed audit/,
    );

    const reintroducedSelectHighlightRow = clonePlan();
    const zagSelectHighlightIndex = reintroducedSelectHighlightRow.rows.findIndex(
      ({ id }) => id === "select-item-highlight:zag-vue",
    );
    const extraSelectHighlightRow = structuredClone(
      reintroducedSelectHighlightRow.rows[zagSelectHighlightIndex],
    );
    extraSelectHighlightRow.id = "select-item-highlight:reka-ui";
    extraSelectHighlightRow.provider = "reka-ui";
    reintroducedSelectHighlightRow.rows.splice(
      zagSelectHighlightIndex + 1,
      0,
      extraSelectHighlightRow,
    );
    expect(() => validateVuePerformancePlan(reintroducedSelectHighlightRow)).toThrow(
      /provider rows/,
    );

    const reintroducedSelectMountRow = clonePlan();
    const zagSelectMountIndex = reintroducedSelectMountRow.rows.findIndex(
      ({ id }) => id === "select-trigger-mount:zag-vue",
    );
    const extraRow = structuredClone(reintroducedSelectMountRow.rows[zagSelectMountIndex]);
    extraRow.id = "select-trigger-mount:reka-ui";
    extraRow.provider = "reka-ui";
    reintroducedSelectMountRow.rows.splice(zagSelectMountIndex + 1, 0, extraRow);
    expect(() => validateVuePerformancePlan(reintroducedSelectMountRow)).toThrow(/provider rows/);
  });

  it("rejects lifecycle phase, click-action, endpoint, and excluded-row drift", () => {
    const radioSweepScaleDrift = clonePlan();
    radioSweepScaleDrift.topology.find(
      ({ scenario }) => scenario === "radio-group-change-sweep",
    ).itemCount = 1_000;
    expect(() => validateVuePerformancePlan(radioSweepScaleDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const radioSweepDomScaleDrift = clonePlan();
    radioSweepDomScaleDrift.topology.find(
      ({ scenario }) => scenario === "radio-group-change-sweep",
    ).domPartCounts.items = 1_000;
    expect(() => validateVuePerformancePlan(radioSweepDomScaleDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const radioSweepActionCountDrift = clonePlan();
    radioSweepActionCountDrift.topology.find(
      ({ scenario }) => scenario === "radio-group-change-sweep",
    ).triggerCount = 1_000;
    expect(() => validateVuePerformancePlan(radioSweepActionCountDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const radioMountScaleDrift = clonePlan();
    radioMountScaleDrift.topology.find(
      ({ scenario }) => scenario === "radio-group-high-count-mount",
    ).itemCount = 100;
    expect(() => validateVuePerformancePlan(radioMountScaleDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const radioProviderScaleDrift = clonePlan();
    radioProviderScaleDrift.rows.find(
      ({ id }) => id === "radio-group-change-sweep:starwind-vue",
    ).triggerCount = 1_000;
    expect(() => validateVuePerformancePlan(radioProviderScaleDrift)).toThrow(
      /differs from topology/,
    );

    const missingSweepAction = clonePlan();
    delete missingSweepAction.topology.find(({ scenario }) => scenario === "menu-item-highlight")
      .sweepAction;
    expect(() => validateVuePerformancePlan(missingSweepAction)).toThrow(/Fields differ/);

    const sweepSettleDrift = clonePlan();
    sweepSettleDrift.topology.find(
      ({ scenario }) => scenario === "combobox-item-highlight",
    ).sweepAction.sharedVueNextTickCount = 2;
    expect(() => validateVuePerformancePlan(sweepSettleDrift)).toThrow(
      /exactly one shared Vue nextTick/,
    );

    const phaseCountDrift = clonePlan();
    phaseCountDrift.topology.find(
      ({ scenario }) => scenario === "select-open",
    ).domPhases.rootInitialized.itemNodes = 1_000;
    expect(() => validateVuePerformancePlan(phaseCountDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const hiddenClosedSelectCollectionDrift = clonePlan();
    const closedSelectPhase = hiddenClosedSelectCollectionDrift.topology.find(
      ({ scenario }) => scenario === "select-open",
    ).domPhases.rootInitialized;
    closedSelectPhase.hiddenLists = 1;
    closedSelectPhase.hiddenViewports = 1;
    closedSelectPhase.lists = 1;
    closedSelectPhase.viewports = 1;
    expect(() => validateVuePerformancePlan(hiddenClosedSelectCollectionDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const hiddenClosedComboboxCollectionDrift = clonePlan();
    const closedComboboxPhase = hiddenClosedComboboxCollectionDrift.topology.find(
      ({ scenario }) => scenario === "combobox-open",
    ).domPhases.rootInitialized;
    closedComboboxPhase.hiddenLists = 1;
    closedComboboxPhase.hiddenViewports = 1;
    closedComboboxPhase.lists = 1;
    closedComboboxPhase.viewports = 1;
    expect(() => validateVuePerformancePlan(hiddenClosedComboboxCollectionDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const comboboxHighlightSetupDrift = clonePlan();
    comboboxHighlightSetupDrift.topology.find(
      ({ scenario }) => scenario === "combobox-item-highlight",
    ).domPhases.setupComplete.itemNodes = 0;
    expect(() => validateVuePerformancePlan(comboboxHighlightSetupDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const comboboxMountCollectionDrift = clonePlan();
    const comboboxMountEndpoint = comboboxMountCollectionDrift.topology.find(
      ({ scenario }) => scenario === "combobox-trigger-mount",
    ).domPhases.measuredEndpoint;
    comboboxMountEndpoint.lists = 1_000;
    comboboxMountEndpoint.viewports = 1_000;
    expect(() => validateVuePerformancePlan(comboboxMountCollectionDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const setupPhaseDrift = clonePlan();
    setupPhaseDrift.topology.find(
      ({ scenario }) => scenario === "menu-submenu-open",
    ).domPhases.setupComplete.submenuItemNodes = 1_000;
    expect(() => validateVuePerformancePlan(setupPhaseDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const clickDrift = clonePlan();
    clickDrift.topology.find(({ scenario }) => scenario === "dialog-open").measuredStart =
      "Enter keydown on the trigger.";
    expect(() => validateVuePerformancePlan(clickDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const endpointDrift = clonePlan();
    endpointDrift.topology.find(
      ({ scenario }) => scenario === "navigation-menu-content-switch",
    ).visibleEndpoint = "A generic marker is visible.";
    expect(() => validateVuePerformancePlan(endpointDrift)).toThrow(
      /differs from the frozen Vue plan/,
    );

    const excludedAuditDrift = clonePlan();
    excludedAuditDrift.rekaDecisions.find(
      ({ scenario }) => scenario === "combobox-filter-input",
    ).decision = "include";
    expect(() => validateVuePerformancePlan(excludedAuditDrift)).toThrow(
      /differs from the reviewed audit/,
    );
  });

  it("rejects every Tabs activation action drift", () => {
    const providerOverride = clonePlan();
    providerOverride.rows.find(
      ({ id }) => id === "tabs-activation-click:reka-ui",
    ).activationAction.dispatch = "provider-specific";
    expect(() => validateVuePerformancePlan(providerOverride)).toThrow(
      /tabs-activation-click:reka-ui Tabs activation action differs from shared topology/,
    );

    const providerOmission = clonePlan();
    delete providerOmission.rows.find(({ id }) => id === "tabs-activation-click:zag-vue")
      .activationAction;
    expect(() => validateVuePerformancePlan(providerOmission)).toThrow(
      /tabs-activation-click:zag-vue Tabs activation action differs from shared topology/,
    );

    const omitted = clonePlan();
    delete omitted.topology.find(({ scenario }) => scenario === "tabs-activation-click")
      .activationAction;
    expect(() => validateVuePerformancePlan(omitted)).toThrow(/Tabs activation action is required/);

    const reorderedEvents = clonePlan();
    reorderedEvents.topology
      .find(({ scenario }) => scenario === "tabs-activation-click")
      .activationAction.events.reverse();
    expect(() => validateVuePerformancePlan(reorderedEvents)).toThrow(
      /Tabs activation action must dispatch mousedown, mouseup, and click in order/,
    );

    const wrongButton = clonePlan();
    wrongButton.topology.find(
      ({ scenario }) => scenario === "tabs-activation-click",
    ).activationAction.events[0].button = 2;
    expect(() => validateVuePerformancePlan(wrongButton)).toThrow(
      /Tabs activation action events must declare the left button/,
    );

    const absentButton = clonePlan();
    delete absentButton.topology.find(({ scenario }) => scenario === "tabs-activation-click")
      .activationAction.events[0].button;
    expect(() => validateVuePerformancePlan(absentButton)).toThrow(
      /Tabs activation action events must declare the left button/,
    );

    const clickOnly = clonePlan();
    clickOnly.topology.find(
      ({ scenario }) => scenario === "tabs-activation-click",
    ).activationAction.events = [{ button: 0, type: "click" }];
    expect(() => validateVuePerformancePlan(clickOnly)).toThrow(
      /Tabs activation action must dispatch mousedown, mouseup, and click in order/,
    );
  });
});

function clonePlan() {
  return structuredClone(vuePerformancePlan);
}
