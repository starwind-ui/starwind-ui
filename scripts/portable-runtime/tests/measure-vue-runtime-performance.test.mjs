import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  assertVuePerformanceBrowserResult,
  assertVuePerformanceBaselineWorktree,
  buildComparatorBrowserEntry,
  buildVueComparatorInstallCommands,
  buildVuePerformanceRunConfig,
  collectVuePerformanceEnvironment,
  createVuePerformanceFlags,
  formatVuePerformanceList,
  main,
  publishRejectedVuePerformanceCandidate,
  runVuePerformance,
  runVuePerformanceBrowser,
  selectVuePerformanceRows,
  VUE_PERFORMANCE_MOUNT_GROUP_COUNT,
  VUE_PERFORMANCE_MOUNT_ITERATIONS_PER_GROUP,
  withVuePerformanceDeadline,
  writeVuePerformanceApp,
} from "../measure-vue-runtime-performance.mjs";
import { createRuntimePerformanceResult } from "../runtime-performance/model.mjs";
import {
  vueComparatorExpectedResolvedVersions,
  vueComparatorInstallSpecifiers,
} from "../runtime-performance/vue-comparator-fixtures.mjs";
import { vuePerformanceProviderRows } from "../runtime-performance/vue-plan.mjs";
import { buildStarwindVueFixture } from "../runtime-performance/vue-starwind-fixture.mjs";
import {
  buildVuePerformanceRowRecord,
  createVuePerformanceAudit,
  createVuePerformanceEligibility,
  createVuePerformanceRun,
  VUE_PERFORMANCE_BASELINE_FLAGS,
} from "../runtime-performance/vue-run-evidence.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

describe("Vue runtime performance runner", () => {
  it("selects full, focused, list, baseline, and offline-check modes from the frozen plan", () => {
    expect(buildVuePerformanceRunConfig([]).rows).toHaveLength(63);
    expect(buildVuePerformanceRunConfig(["--scenario", "dialog-open"]).rows).toHaveLength(3);
    expect(buildVuePerformanceRunConfig(["--provider=reka-ui"]).rows).toHaveLength(19);
    expect(buildVuePerformanceRunConfig(["--baseline"]).mode).toBe("baseline");
    expect(buildVuePerformanceRunConfig(["--check"]).mode).toBe("check");
    expect(buildVuePerformanceRunConfig(["--list"]).mode).toBe("list");
    expect(formatVuePerformanceList().trim().split("\n")).toHaveLength(63);
    expect(buildVuePerformanceRunConfig(["--provider=starwind-vue"]).rows).toHaveLength(22);
    expect(buildVuePerformanceRunConfig(["--provider=zag-vue"]).rows).toHaveLength(22);
    expect(buildVuePerformanceRunConfig(["--smoke"])).toMatchObject({
      focused: false,
      smoke: true,
    });
    expect(buildVuePerformanceRunConfig(["--smoke"]).rows).toHaveLength(63);
    expect(buildVuePerformanceRunConfig(["--smoke", "--provider=zag-vue"]).rows).toHaveLength(22);
    expect(buildVuePerformanceRunConfig([]).rows.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining([
        "select-item-highlight:reka-ui",
        "select-trigger-mount:reka-ui",
        "combobox-filter-input:reka-ui",
        "navigation-menu-content-switch:reka-ui",
      ]),
    );
    expect(
      buildVuePerformanceRunConfig(["--scenario=radio-group-change-sweep"]).rows.every(
        ({ itemCount, triggerCount }) => itemCount === 100 && triggerCount === 100,
      ),
    ).toBe(true);
    expect(
      buildVuePerformanceRunConfig(["--scenario=radio-group-high-count-mount"]).rows.every(
        ({ itemCount, triggerCount }) => itemCount === 1_000 && triggerCount === 1_000,
      ),
    ).toBe(true);
    expect(() => selectVuePerformanceRows({ scenarios: ["combobox-filter-input"] })).toThrow(
      "Unknown Vue performance scenario",
    );
    expect(() => buildVuePerformanceRunConfig(["--baseline", "--provider", "zag-vue"])).toThrow(
      "requires one scenario and one provider",
    );
  });

  it("records five-sample zero-warmup mount controls", () => {
    expect(
      createVuePerformanceFlags(buildVuePerformanceRunConfig([])).controls.mountSampling,
    ).toEqual({
      browserLifecycle: "one context, page, CDP session, and navigation per mount row",
      iterations: 5,
      warmupCount: 0,
    });
    expect(
      createVuePerformanceFlags(buildVuePerformanceRunConfig(["--smoke"])).controls.mountSampling,
    ).toEqual({
      browserLifecycle: "one context, page, CDP session, and navigation per mount row",
      iterations: 1,
      warmupCount: 0,
    });
  });

  it("keeps check mode offline and free from build, install, browser, and write calls", async () => {
    const checkEvidence = vi.fn(() => "checked");
    const run = vi.fn();
    await expect(main(["--check"], { checkEvidence, run })).resolves.toBe("checked");
    expect(checkEvidence).toHaveBeenCalledOnce();
    expect(run).not.toHaveBeenCalled();
  });

  it("pins exact isolated comparator requests and resolved versions", () => {
    expect(vueComparatorInstallSpecifiers["zag-vue"]).toEqual(
      expect.arrayContaining(["@zag-js/core@1.42.0", "@zag-js/vue@1.42.0"]),
    );
    expect(vueComparatorInstallSpecifiers["reka-ui"]).toEqual(["reka-ui@2.10.3"]);
    expect(
      new Set(Object.values(vueComparatorExpectedResolvedVersions).flatMap(Object.values)),
    ).toEqual(new Set(["1.42.0", "2.10.3"]));
    expect(buildVueComparatorInstallCommands({ platform: "linux" })).toEqual({
      network: {
        arguments: ["install", "--ignore-scripts", "--frozen-lockfile=false"],
        executable: "pnpm",
      },
      offline: {
        arguments: ["install", "--ignore-scripts", "--frozen-lockfile=false", "--offline"],
        executable: "pnpm",
      },
    });
    expect(buildVueComparatorInstallCommands({ platform: "win32" }).offline.arguments).toEqual([
      "/d",
      "/s",
      "/c",
      "pnpm install --ignore-scripts --frozen-lockfile=false --offline",
    ]);
  });

  it("collects exact toolchain versions from the runner resolution boundaries", () => {
    const requireFromRoot = createRequire(path.join(repoRoot, "package.json"));
    const requireFromVueDemo = createRequire(path.join(repoRoot, "apps/vue-demo/package.json"));
    const environment = collectVuePerformanceEnvironment({
      browser: { name: "chromium", revision: "1234", version: "151.0" },
      execute: () => `${"a".repeat(40)}\n`,
      garbageCollectionAvailable: true,
      packageVersions: {},
    });
    expect(environment.packageVersions).toMatchObject({
      "@vitejs/plugin-vue": JSON.parse(
        readFileSync(requireFromVueDemo.resolve("@vitejs/plugin-vue/package.json"), "utf8"),
      ).version,
      playwright: JSON.parse(
        readFileSync(requireFromRoot.resolve("playwright/package.json"), "utf8"),
      ).version,
      vite: JSON.parse(readFileSync(requireFromRoot.resolve("vite/package.json"), "utf8")).version,
    });
  });

  it("composes comparator fixtures with phase assertions, pre-action rejection, visible endpoints, and cleanup", () => {
    const row = vuePerformanceProviderRows.find(({ id }) => id === "select-open:zag-vue");
    const source = buildComparatorBrowserEntry({ fixturePath: "/tmp/fixture.mjs", row });
    const highlightRow = vuePerformanceProviderRows.find(
      ({ id }) => id === "select-item-highlight:zag-vue",
    );
    const highlightSource = buildComparatorBrowserEntry({
      fixturePath: "/tmp/fixture.mjs",
      row: highlightRow,
    });
    const radioRow = vuePerformanceProviderRows.find(
      ({ id }) => id === "radio-group-change-sweep:reka-ui",
    );
    const radioSource = buildComparatorBrowserEntry({
      fixturePath: "/tmp/fixture.mjs",
      row: radioRow,
    });
    expect(source).toContain('assertPhase("rootInitialized")');
    expect(source).toContain('assertPhase("setupComplete")');
    expect(source).toContain('assertPhase("measuredEndpoint")');
    expect(source).toContain("Visible endpoint passed before measured action");
    expect(source).toContain("fixture.teardown()");
    expect(source).toContain("assertVisibleEndpoint");
    expect(source).toContain('import { nextTick } from "vue";');
    expect(source).toContain("mountFixture, nextTick, row");
    const settleContract =
      /async function settle\(\) \{\s+await nextTick\(\);\s+await frame\(\);\s+await nextTick\(\);\s+\}/;
    const starwindHighlightSource = buildStarwindVueFixture("select-item-highlight").source;
    const starwindRadioSource = buildStarwindVueFixture("radio-group-change-sweep").source;
    expect(highlightSource).toMatch(settleContract);
    expect(radioSource).toMatch(settleContract);
    expect(starwindHighlightSource).toMatch(settleContract);
    expect(starwindRadioSource).toMatch(settleContract);
    const normalizedSettle = (source) => source.match(settleContract)?.[0].replaceAll(/\s+/g, " ");
    const comparatorSettle = normalizedSettle(highlightSource);
    expect(comparatorSettle).toBe(normalizedSettle(starwindHighlightSource));
    expect(comparatorSettle).toBe(normalizedSettle(radioSource));
    expect(comparatorSettle).toBe(normalizedSettle(starwindRadioSource));
    const highlightStart = highlightSource.indexOf(
      "for (const item of queryAll(fixtureContract.itemSelector)) {",
    );
    const highlightEnd = highlightSource.indexOf("await settle();", highlightStart);
    const highlightSweep = highlightSource.slice(
      highlightStart,
      highlightEnd + "await settle();".length,
    );
    expect(highlightStart).toBeGreaterThan(-1);
    expect(highlightEnd).toBeGreaterThan(highlightStart);
    expect(highlightSweep).toMatch(
      /dispatch\(item, "pointermove"[\s\S]+await nextTick\(\);\s+assertCurrentHighlight\(item\);\s+forceLayout\(item\)/,
    );
    expect(highlightSweep?.match(/await nextTick\(\);/g)).toHaveLength(1);
    expect(highlightSweep?.match(/await settle\(\);/g)).toHaveLength(1);
    const radioClick = radioSource.indexOf("item.click();");
    const radioStart = radioSource.lastIndexOf(
      "for (const item of queryAll(fixtureContract.itemSelector)) {",
      radioClick,
    );
    const radioEnd = radioSource.indexOf("await settle();", radioStart);
    const radioSweep = radioSource.slice(radioStart, radioEnd + "await settle();".length);
    expect(radioStart).toBeGreaterThan(-1);
    expect(radioClick).toBeGreaterThan(radioStart);
    expect(radioEnd).toBeGreaterThan(radioStart);
    expect(radioSweep).toMatch(
      /item\.click\(\);\s+await nextTick\(\);\s+assertCurrentRadioChecked\(item\);\s+forceLayout\(item\)/,
    );
    expect(radioSweep?.match(/await nextTick\(\);/g)).toHaveLength(1);
    expect(radioSweep?.match(/await settle\(\);/g)).toHaveLength(1);
    expect(starwindHighlightSource).toMatch(/forceLayout\(item\);\s+\}\s+await settle\(\);/);
    expect(starwindRadioSource).toMatch(/forceLayout\(item\);\s+\}\s+await settle\(\);/);
    expect(highlightSource).toContain(JSON.stringify(highlightRow.sweepAction));
    expect(radioSource).toContain(JSON.stringify(radioRow.sweepAction));
    expect(source).toContain("fixture sweepAction differs from the frozen plan");
    expect(source).toContain("sweepAction must use exactly one shared Vue nextTick");
    expect(source).toContain('item.hasAttribute("data-highlighted")');
    expect(source).toContain('item.hasAttribute("data-checked")');
    expect(source).toContain("The parent menu endpoint did not open during setup");
  });

  it("runs the exact frozen Tabs activation sequence for every provider", () => {
    const tabsRows = vuePerformanceProviderRows.filter(
      ({ scenario }) => scenario === "tabs-activation-click",
    );
    expect(tabsRows.map(({ provider }) => provider)).toEqual([
      "starwind-vue",
      "zag-vue",
      "reka-ui",
    ]);
    const starwindSource = buildStarwindVueFixture("tabs-activation-click").source;
    const comparatorSources = tabsRows
      .filter(({ provider }) => provider !== "starwind-vue")
      .map((row) => buildComparatorBrowserEntry({ fixturePath: "/tmp/fixture.mjs", row }));
    const mouseEventInit = (source) =>
      source
        .match(/new MouseEvent\(event\.type, \{([\s\S]*?)\}\)/)?.[1]
        .replaceAll(/\s+/g, " ")
        .trim();

    for (const source of comparatorSources) {
      expect(source).toContain("activationAction");
      expect(source).toContain("fixture activationAction differs from the frozen plan");
      expect(source).toMatch(
        /const target = queryAll\(fixtureContract\.triggerSelector\)\[0\];[\s\S]+target\.focus\(\);[\s\S]+document\.activeElement !== target[\s\S]+assertPhase\("setupComplete"\);/,
      );
      expect(source).toMatch(
        /for \(const event of row\.activationAction\.events\) \{\s+dispatchActivationEvent\(target, event\);\s+\};?\s+await settle\(\);[\s\S]+forceLayout\(panel\);\s+assertEndpoint\(\{ root, portalTarget \}\);\s+assertPhase\("measuredEndpoint"\);/,
      );
      expect(mouseEventInit(source)).toBe(mouseEventInit(starwindSource));
      expect(source).not.toContain("target.click()");
    }

    for (const row of tabsRows) {
      expect(row.activationAction.events).toEqual([
        { button: 0, type: "mousedown" },
        { button: 0, type: "mouseup" },
        { button: 0, type: "click" },
      ]);
    }
    expect(starwindSource).toMatch(
      /for \(const event of ACTIVATION_ACTION\.events\) \{[\s\S]+await settle\(\);[\s\S]+forceLayout\(endpoint\);[\s\S]+assertVisibleEndpoint\(\);/,
    );
  });

  it("rejects missing, overridden, and click-only comparator Tabs actions", () => {
    const canonical = vuePerformanceProviderRows.find(
      ({ id }) => id === "tabs-activation-click:zag-vue",
    );

    const omitted = structuredClone(canonical);
    delete omitted.activationAction;
    expect(() =>
      buildComparatorBrowserEntry({ fixturePath: "/tmp/fixture.mjs", row: omitted }),
    ).toThrow(/activationAction differs from the frozen plan/);

    const overridden = structuredClone(canonical);
    overridden.activationAction.settle = "two animation frames";
    expect(() =>
      buildComparatorBrowserEntry({ fixturePath: "/tmp/fixture.mjs", row: overridden }),
    ).toThrow(/activationAction differs from the frozen plan/);

    const clickOnly = structuredClone(canonical);
    clickOnly.activationAction.events = [{ button: 0, type: "click" }];
    expect(() =>
      buildComparatorBrowserEntry({ fixturePath: "/tmp/fixture.mjs", row: clickOnly }),
    ).toThrow(/activationAction differs from the frozen plan/);
  });

  it("preserves the existing Navigation and Accordion click paths", () => {
    const navigation = vuePerformanceProviderRows.find(
      ({ id }) => id === "navigation-menu-content-switch:zag-vue",
    );
    const accordion = vuePerformanceProviderRows.find(
      ({ id }) => id === "accordion-toggle-click:reka-ui",
    );
    for (const row of [navigation, accordion]) {
      const source = buildComparatorBrowserEntry({ fixturePath: "/tmp/fixture.mjs", row });
      expect(source).toContain('await activate(fixtureContract.triggerSelector, "click")');
    }
    expect(navigation.activationAction).toBeNull();
    expect(accordion.activationAction).toBeNull();
  });

  it("uses explicit lifecycle deadlines and records hung operations as failures", async () => {
    await expect(
      withVuePerformanceDeadline("setup", () => new Promise(() => {}), 5),
    ).rejects.toThrow("setup timed out after 5 ms");
    const source = runVuePerformanceBrowser.toString();
    for (const label of [
      "browser launch",
      "browser context creation",
      "browser page creation",
      "CDP session creation",
      "CDP CPU throttle setup",
      "CDP garbage collection",
      "navigation",
      "browser context close",
      "browser shutdown",
    ]) {
      expect(source).toContain(`deadline(\"${label}\"`);
    }
  });

  it.each([
    ["navigation", ({ page }) => (page.goto = vi.fn(() => new Promise(() => {})))],
    [
      "CDP CPU throttle setup",
      ({ session }) =>
        (session.send = vi.fn((command) =>
          command === "Emulation.setCPUThrottlingRate" ? new Promise(() => {}) : Promise.resolve(),
        )),
    ],
    [
      "browser context close",
      ({ context }) => (context.close = vi.fn(() => new Promise(() => {}))),
    ],
  ])("bounds and records a hung %s operation", async (label, mutate) => {
    const harness = createBrowserHarness();
    mutate(harness);
    const result = await runVuePerformanceBrowser({
      baseUrl: "http://127.0.0.1:1",
      browserType: harness.browserType,
      operationTimeoutMs: 5,
      rows: [vuePerformanceProviderRows[0]],
      smoke: true,
    });
    expect(result.errors.join("\n")).toContain(`${label} timed out after 5 ms`);
  });

  it("bounds and records a hung browser shutdown", async () => {
    const harness = createBrowserHarness();
    harness.browser.close = vi.fn(() => new Promise(() => {}));
    const result = await runVuePerformanceBrowser({
      baseUrl: "http://127.0.0.1:1",
      browserType: harness.browserType,
      operationTimeoutMs: 5,
      rows: [vuePerformanceProviderRows[0]],
      smoke: true,
    });
    expect(result.errors).toContain(
      "browser: Vue performance browser shutdown timed out after 5 ms",
    );
  });

  it("reuses one browser lifecycle for five mount samples with zero warmups", async () => {
    const harness = createBrowserHarness();
    const progress = vi.fn();
    const row = vuePerformanceProviderRows.find(
      ({ id }) => id === "tabs-high-count-mount:starwind-vue",
    );
    const result = await runVuePerformanceBrowser({
      baseUrl: "http://127.0.0.1:1",
      browserType: harness.browserType,
      progress,
      rows: [row],
    });

    expect(result.errors).toEqual([]);
    expect(result.rows[0].result.samples).toHaveLength(5);
    expect(harness.browser.newContext).toHaveBeenCalledOnce();
    expect(harness.context.newPage).toHaveBeenCalledOnce();
    expect(harness.context.newCDPSession).toHaveBeenCalledOnce();
    expect(harness.page.goto).toHaveBeenCalledOnce();
    expect(VUE_PERFORMANCE_MOUNT_GROUP_COUNT).toBe(1);
    expect(VUE_PERFORMANCE_MOUNT_ITERATIONS_PER_GROUP).toBe(5);
    expect(
      harness.session.send.mock.calls.filter(
        ([command]) => command === "HeapProfiler.collectGarbage",
      ),
    ).toHaveLength(5);
    expect(progress).toHaveBeenCalledWith(`[vue:perf] row 1/1 ${row.id} complete`);

    const evaluatedOperations = harness.page.evaluate.mock.calls.map(([operation]) =>
      operation.toString(),
    );
    expect(
      evaluatedOperations.filter((source) => source.includes("__runtimePerf.setup")),
    ).toHaveLength(5);
    expect(
      evaluatedOperations.filter((source) => source.includes("__runtimePerf.measure")),
    ).toHaveLength(5);
    expect(
      evaluatedOperations.filter((source) => source.includes("assertVisibleEndpoint")),
    ).toHaveLength(5);
    expect(
      evaluatedOperations.filter((source) => source.includes("__runtimePerf.teardown")),
    ).toHaveLength(5);
    expect(evaluatedOperations.filter((source) => source.includes("overlayEmpty"))).toHaveLength(5);
  });

  it("keeps five interaction samples in isolated browser lifecycles", async () => {
    const harness = createBrowserHarness();
    const row = vuePerformanceProviderRows.find(({ id }) => id === "dialog-open:starwind-vue");
    const result = await runVuePerformanceBrowser({
      baseUrl: "http://127.0.0.1:1",
      browserType: harness.browserType,
      rows: [row],
    });

    expect(result.errors).toEqual([]);
    expect(result.rows[0].result.samples).toHaveLength(5);
    expect(harness.browser.newContext).toHaveBeenCalledTimes(5);
    expect(harness.context.newPage).toHaveBeenCalledTimes(5);
    expect(harness.context.newCDPSession).toHaveBeenCalledTimes(5);
    expect(harness.page.goto).toHaveBeenCalledTimes(5);
  });

  it("pins aggregate browser lifecycle and sample counts for all 63 rows", async () => {
    const harness = createBrowserHarness();
    const progress = vi.fn();
    const result = await runVuePerformanceBrowser({
      baseUrl: "http://127.0.0.1:1",
      browserType: harness.browserType,
      progress,
      rows: vuePerformanceProviderRows,
    });

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(63);
    expect(result.rows.flatMap(({ result: rowResult }) => rowResult.samples)).toHaveLength(315);
    const mountRows = vuePerformanceProviderRows.filter(({ type }) => type === "mount").length;
    const expectedLifecycles = mountRows + (63 - mountRows) * 5;
    expect(harness.browser.newContext).toHaveBeenCalledTimes(expectedLifecycles);
    expect(harness.context.newPage).toHaveBeenCalledTimes(expectedLifecycles);
    expect(harness.context.newCDPSession).toHaveBeenCalledTimes(expectedLifecycles);
    expect(harness.page.goto).toHaveBeenCalledTimes(expectedLifecycles);
    expect(
      harness.session.send.mock.calls.filter(
        ([command]) => command === "HeapProfiler.collectGarbage",
      ),
    ).toHaveLength(315);
    expect(
      harness.page.evaluate.mock.calls.filter(([operation]) =>
        operation.toString().includes("overlayEmpty"),
      ),
    ).toHaveLength(315);
    expect(progress).toHaveBeenCalledTimes(63);
    expect(progress).toHaveBeenLastCalledWith(
      "[vue:perf] row 63/63 radio-group-change-sweep:reka-ui complete",
    );
  });

  it("runs the complete smoke census with one lifecycle and sample per row", async () => {
    const harness = createBrowserHarness();
    const progress = vi.fn();
    const result = await runVuePerformanceBrowser({
      baseUrl: "http://127.0.0.1:1",
      browserType: harness.browserType,
      progress,
      rows: vuePerformanceProviderRows,
      smoke: true,
    });

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(63);
    expect(result.rows.flatMap(({ result: rowResult }) => rowResult.samples)).toHaveLength(63);
    expect(harness.browser.newContext).toHaveBeenCalledTimes(63);
    expect(harness.context.newPage).toHaveBeenCalledTimes(63);
    expect(harness.context.newCDPSession).toHaveBeenCalledTimes(63);
    expect(harness.page.goto).toHaveBeenCalledTimes(63);
    expect(
      harness.session.send.mock.calls.filter(
        ([command]) => command === "HeapProfiler.collectGarbage",
      ),
    ).toHaveLength(63);
    expect(
      harness.page.evaluate.mock.calls.filter(([operation]) =>
        operation.toString().includes("overlayEmpty"),
      ),
    ).toHaveLength(63);
    expect(progress).toHaveBeenCalledTimes(63);
    expect(progress).toHaveBeenLastCalledWith(
      "[vue:perf] row 63/63 radio-group-change-sweep:reka-ui complete",
    );
  });

  it("keeps the React and Vue mount loops in-page", () => {
    const reactSource = readFileSync(
      path.join(repoRoot, "scripts/portable-runtime/measure-runtime-performance.mjs"),
      "utf8",
    );
    expect(reactSource).toMatch(
      /async function measureMountRow[\s\S]+page\.goto\([\s\S]+runMountSamples\(\{ groupCount, iterationsPerGroup \}\)/,
    );
    expect(reactSource).toMatch(
      /async function runMountSamples[\s\S]+groupIndex < groupCount[\s\S]+iteration < iterationsPerGroup[\s\S]+measureReactRoot\.render\(renderMountFixture\(\)\)/,
    );

    const vueSource = runVuePerformanceBrowser.toString();
    expect(vueSource).toMatch(
      /row\.type === "mount"[\s\S]+createRowPage\(\)[\s\S]+sampleIndex < sampleCount[\s\S]+runMountIteration/,
    );
    expect(vueSource).toMatch(
      /collectGarbage\(session\)[\s\S]+__runtimePerf\.setup[\s\S]+__runtimePerf\.measure[\s\S]+assertVisibleEndpoint[\s\S]+__runtimePerf\.teardown[\s\S]+assertCleanup/,
    );
  });

  it("pins shared fixture CSS and the production Vue Vite plugin", () => {
    const source = writeVuePerformanceApp.toString();
    expect(source).toContain('`import "../styles.css"');
    expect(source).toContain('requireFromVueDemo.resolve("@vitejs/plugin-vue")');
    expect(source).toContain("plugins: [vue()]");
  });

  it("allows only runner-owned evidence artifacts during baseline capture", () => {
    expect(() =>
      assertVuePerformanceBaselineWorktree({ execute: () => " M package.json\n" }),
    ).toThrow("requires a clean worktree");
    expect(() =>
      assertVuePerformanceBaselineWorktree({
        execute: () =>
          " M .scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-baseline.json\n",
      }),
    ).not.toThrow();
    expect(() =>
      assertVuePerformanceBaselineWorktree({
        execute: () =>
          " M .scratch/vue-runtime-performance-comparison/evidence/reka-ui-fair-overlap-audit.md\n",
      }),
    ).toThrow("requires a clean worktree");
    expect(() =>
      assertVuePerformanceBaselineWorktree({
        execute: () =>
          "?? .scratch/vue-runtime-performance-comparison/evidence/runs/diagnostic.json\n?? .scratch/vue-runtime-performance-comparison/evidence/rejected-candidates/rejected.json\n",
      }),
    ).not.toThrow();
  });

  it("promotes console, page, endpoint, assertion, and teardown errors to failed runs", () => {
    const row = vuePerformanceProviderRows[0];
    const valid = {
      errors: [],
      rows: [
        {
          errors: [],
          id: row.id,
          lifecycle: {
            endpointVisible: true,
            overlayEmpty: true,
            passed: true,
            rootEmpty: true,
          },
        },
      ],
    };
    expect(assertVuePerformanceBrowserResult(valid, [row])).toBe(valid);
    expect(() =>
      assertVuePerformanceBrowserResult({ ...valid, errors: ["console: boom"] }, [row]),
    ).toThrow("Vue browser run failed");
    expect(() =>
      assertVuePerformanceBrowserResult(
        {
          ...valid,
          rows: [{ ...valid.rows[0], lifecycle: { ...valid.rows[0].lifecycle, rootEmpty: false } }],
        },
        [row],
      ),
    ).toThrow("lifecycle failed");
  });

  it("captures one selected row and publishes it atomically", async () => {
    const row = vuePerformanceProviderRows[0];
    const run = makeRowRun(row);
    const publishRow = vi.fn();
    const result = await runVuePerformance(
      buildVuePerformanceRunConfig([
        "--baseline",
        `--scenario=${row.scenario}`,
        `--provider=${row.provider}`,
      ]),
      {
        assertCleanWorktree: vi.fn(),
        publishRejected: vi.fn(),
        publishRow,
        readAudit: () => testAudit(),
        readEligibility: () => eligibilityFor(run),
        readRecords: () => [],
        runOnce: vi.fn(async () => run),
      },
    );
    expect(result).toHaveLength(1);
    expect(publishRow).toHaveBeenCalledOnce();
    expect(publishRow).toHaveBeenCalledWith(expect.objectContaining({ id: row.id }));
  });

  it("resumes missing rows and stops after the first failed row while retaining prior rows", async () => {
    const first = vuePerformanceProviderRows[0];
    const second = vuePerformanceProviderRows[1];
    const firstRun = makeRowRun(first);
    const existing = [
      buildVuePerformanceRowRecord(
        { audit: testAudit(), run: firstRun },
        { requireBaselinePlatform: false },
      ),
    ];
    const publishRow = vi.fn();
    const runOnce = vi.fn(async ({ rows }) => {
      if (rows[0].id === second.id) throw new Error("second row failed");
      return makeRowRun(rows[0]);
    });
    await expect(
      runVuePerformance(baselineConfig(), {
        assertCleanWorktree: vi.fn(),
        publishRejected: vi.fn(),
        publishRow,
        readAudit: () => testAudit(),
        readEligibility: () => eligibilityFor(firstRun),
        readRecords: () => existing,
        runOnce,
      }),
    ).rejects.toThrow("second row failed");
    expect(runOnce).toHaveBeenCalledOnce();
    expect(publishRow).not.toHaveBeenCalled();
    expect(existing).toHaveLength(1);
  });

  it("publishes an earlier passing row before a later row interrupts the collection", async () => {
    const first = vuePerformanceProviderRows[0];
    const second = vuePerformanceProviderRows[1];
    const firstRun = makeRowRun(first);
    const publishRow = vi.fn();
    const runOnce = vi.fn(async ({ rows }) => {
      if (rows[0].id === second.id) throw new Error("interrupted row");
      return makeRowRun(rows[0]);
    });
    await expect(
      runVuePerformance(baselineConfig(), {
        assertCleanWorktree: vi.fn(),
        publishRejected: vi.fn(),
        publishRow,
        readAudit: () => testAudit(),
        readEligibility: () => eligibilityFor(firstRun),
        readRecords: () => [],
        runOnce,
      }),
    ).rejects.toThrow("interrupted row");
    expect(runOnce).toHaveBeenCalledTimes(2);
    expect(publishRow).toHaveBeenCalledOnce();
    expect(publishRow).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));
  });

  it("publishes an unstable row without retry and continues to the next row", async () => {
    const [first, second] = vuePerformanceProviderRows;
    const firstRun = makeRowRun(first, [1, 1, 1, 1, 100]);
    const publishRejected = vi.fn();
    const publishRow = vi.fn();
    const runOnce = vi.fn(async ({ rows }) =>
      rows[0].id === first.id ? firstRun : makeRowRun(rows[0]),
    );
    const result = await runVuePerformance(
      {
        ...baselineConfig(),
        rows: [first, second],
      },
      {
        assertCleanWorktree: vi.fn(),
        publishRejected,
        publishRow,
        readAudit: () => testAudit(),
        readEligibility: () => eligibilityFor(firstRun),
        readRecords: () => [],
        runOnce,
      },
    );
    expect(result).toHaveLength(2);
    expect(runOnce).toHaveBeenCalledTimes(2);
    expect(publishRow).toHaveBeenCalledTimes(2);
    expect(publishRow.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        candidate: expect.objectContaining({ status: "unstable-no-ceiling" }),
        stability: expect.objectContaining({ stable: false }),
      }),
    );
    expect(publishRejected).not.toHaveBeenCalled();
  });

  it("checks clean source before and after full smoke and immediately before eligibility", async () => {
    const assertCleanWorktree = vi.fn();
    const publishEligibility = vi.fn();
    const writeRunArtifacts = vi.fn();
    await runVuePerformance(buildVuePerformanceRunConfig(["--smoke"]), {
      assertCleanWorktree,
      publishEligibility,
      readAudit: () => testAudit(),
      runOnce: async () => makeRun(1),
      writeRunArtifacts,
    });
    expect(assertCleanWorktree).toHaveBeenCalledTimes(3);
    expect(publishEligibility).toHaveBeenCalledOnce();
    expect(writeRunArtifacts.mock.calls[0][0][0].content).not.toContain('"p95Ms"');

    assertCleanWorktree.mockClear();
    assertCleanWorktree.mockImplementation(() => {
      if (assertCleanWorktree.mock.calls.length === 3) throw new Error("source drift");
    });
    publishEligibility.mockClear();
    await expect(
      runVuePerformance(buildVuePerformanceRunConfig(["--smoke"]), {
        assertCleanWorktree,
        publishEligibility,
        readAudit: () => testAudit(),
        runOnce: async () => makeRun(1),
        writeRunArtifacts: vi.fn(),
      }),
    ).rejects.toThrow("source drift");
    expect(publishEligibility).not.toHaveBeenCalled();
  });

  it("checks clean source after a row run and before atomic row publication", async () => {
    const row = vuePerformanceProviderRows[0];
    const run = makeRowRun(row);
    const assertCleanWorktree = vi.fn(() => {
      if (assertCleanWorktree.mock.calls.length === 3) throw new Error("row source drift");
    });
    const publishRow = vi.fn();
    await expect(
      runVuePerformance(
        buildVuePerformanceRunConfig([
          "--baseline",
          `--scenario=${row.scenario}`,
          `--provider=${row.provider}`,
        ]),
        {
          assertCleanWorktree,
          publishRejected: vi.fn(),
          publishRow,
          readAudit: () => testAudit(),
          readEligibility: () => eligibilityFor(run),
          readRecords: () => [],
          runOnce: async () => run,
        },
      ),
    ).rejects.toThrow("row source drift");
    expect(publishRow).not.toHaveBeenCalled();
  });

  it("preserves a complete prior collection when focused aggregate publication fails", async () => {
    const row = vuePerformanceProviderRows[0];
    const run = makeRowRun(row);
    const existing = vuePerformanceProviderRows.map((candidate) =>
      buildVuePerformanceRowRecord(
        { audit: testAudit(), run: makeRowRun(candidate) },
        { requireBaselinePlatform: false },
      ),
    );
    const publishRow = vi.fn();
    await expect(
      runVuePerformance(
        buildVuePerformanceRunConfig([
          "--baseline",
          `--scenario=${row.scenario}`,
          `--provider=${row.provider}`,
        ]),
        {
          assertCleanWorktree: vi.fn(),
          publishEvidence: vi.fn(() => {
            throw new Error("aggregate transaction failed");
          }),
          publishRejected: vi.fn(),
          publishRow,
          readAudit: () => testAudit(),
          readEligibility: () => eligibilityFor(run),
          readRecords: () => existing,
          runOnce: async () => run,
        },
      ),
    ).rejects.toThrow("aggregate transaction failed");
    expect(publishRow).not.toHaveBeenCalled();
    expect(existing[0].result.samples).toEqual([10, 10, 10, 10, 10]);
  });

  it("writes deterministic rejected candidate JSON and Markdown paths", () => {
    const writeArtifacts = vi.fn((artifacts) => artifacts);
    const artifacts = publishRejectedVuePerformanceCandidate({
      config: {
        focused: false,
        mode: "baseline",
        providers: [],
        rows: vuePerformanceProviderRows,
        scenarios: [],
        smoke: false,
      },
      error: new Error("unstable rows"),
      execute: () => `${"a".repeat(40)}\n`,
      now: new Date("2026-08-22T01:02:03.000Z"),
      runs: [],
      writeArtifacts,
    });
    expect(artifacts).toHaveLength(2);
    expect(artifacts[0].path).toContain("rejected-candidates/2026-08-22T01-02-03.000Z-");
    expect(artifacts[0].content).toContain('"diagnostic": "unstable rows"');
  });

  it("adds private Vue commands without changing the public React command surface", () => {
    const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    expect(packageJson.scripts["runtime:perf"]).toBe(
      "node scripts/portable-runtime/measure-runtime-performance.mjs",
    );
    expect(packageJson.scripts["runtime:perf:snapshot"]).toContain(
      "measure-runtime-performance.mjs --snapshot",
    );
    expect(packageJson.scripts["runtime:perf:vue:check"]).toBe(
      "node scripts/portable-runtime/measure-vue-runtime-performance.mjs --check",
    );
  });
});

function baselineConfig() {
  return {
    focused: false,
    mode: "baseline",
    providers: [],
    rows: vuePerformanceProviderRows,
    scenarios: [],
    smoke: false,
  };
}

function createBrowserHarness() {
  const page = {
    evaluate: vi.fn(async (operation) => {
      const source = operation.toString();
      if (source.includes("performance.now") || source.includes("__runtimePerf.measure")) return 1;
      if (source.includes("overlayEmpty")) return { overlayEmpty: true, rootEmpty: true };
      return undefined;
    }),
    goto: vi.fn(async () => undefined),
    on: vi.fn(),
  };
  const session = { send: vi.fn(async () => undefined) };
  const context = {
    close: vi.fn(async () => undefined),
    newCDPSession: vi.fn(async () => session),
    newPage: vi.fn(async () => page),
  };
  const browser = {
    close: vi.fn(async () => undefined),
    newContext: vi.fn(async () => context),
    version: vi.fn(() => "151.0"),
  };
  const browserType = {
    executablePath: vi.fn(() => "/tmp/chromium-1234/chrome"),
    launch: vi.fn(async () => browser),
  };
  return { browser, browserType, context, page, session };
}

function makeRun(runIndex, value = 10) {
  return createVuePerformanceRun({
    command: { arguments: ["--baseline"], executable: "pnpm runtime:perf:vue" },
    completedAt: `2026-08-22T00:0${runIndex}:30.000Z`,
    environment: {
      architecture: "x64",
      browserName: "chromium",
      browserRevision: "1234",
      browserVersion: "140.0",
      commit: "a".repeat(40),
      framework: "Vue 3.5.39",
      garbageCollectionAvailable: true,
      nodeVersion: "24.1.0",
      packageVersions: {
        "@starwind-ui/runtime": "0.0.0",
        "@starwind-ui/vue": "0.0.0",
        "@vitejs/plugin-vue": "6.0.8",
        ...Object.fromEntries(
          Object.keys(vueComparatorExpectedResolvedVersions["zag-vue"]).map((name) => [
            name,
            "1.42.0",
          ]),
        ),
        "reka-ui": "2.10.3",
        playwright: "1.62.0",
        vite: "7.3.5",
        vue: "3.5.39",
      },
      platform: "linux",
      viewport: { deviceScaleFactor: 1, height: 900, width: 1280 },
    },
    flags: VUE_PERFORMANCE_BASELINE_FLAGS,
    machine: { cpuModel: "Test CPU", logicalCoreCount: 8 },
    rows: vuePerformanceProviderRows.map((row) => ({
      errors: [],
      id: row.id,
      lifecycle: { endpointVisible: true, overlayEmpty: true, passed: true, rootEmpty: true },
      result: createRuntimePerformanceResult({
        metric: row.metric,
        provider: row.provider,
        samples: Array.from({ length: row.withinRunSampleCount }, () => value),
        scenario: row.scenario,
      }),
    })),
    runIndex,
    startedAt: `2026-08-22T00:0${runIndex}:00.000Z`,
  });
}

function testAudit() {
  return createVuePerformanceAudit({
    contents: "audit",
    source: ".scratch/vue-runtime-performance-comparison/evidence/reka-ui-fair-overlap-audit.md",
  });
}

function makeRowRun(row, samples = [10, 10, 10, 10, 10]) {
  const environment = {
    architecture: "x64",
    browserName: "chromium",
    browserRevision: "1234",
    browserVersion: "140.0",
    commit: "a".repeat(40),
    framework: "Vue 3.5.39",
    garbageCollectionAvailable: true,
    nodeVersion: "24.1.0",
    packageVersions: {
      "@starwind-ui/runtime": "0.0.0",
      "@starwind-ui/vue": "0.0.0",
      "@vitejs/plugin-vue": "6.0.8",
      ...Object.fromEntries(
        Object.keys(vueComparatorExpectedResolvedVersions["zag-vue"]).map((name) => [
          name,
          "1.42.0",
        ]),
      ),
      "reka-ui": "2.10.3",
      playwright: "1.62.0",
      vite: "7.3.5",
      vue: "3.5.39",
    },
    platform: "linux",
    viewport: { deviceScaleFactor: 1, height: 900, width: 1280 },
  };
  const flags = {
    controls: {
      ...VUE_PERFORMANCE_BASELINE_FLAGS.controls,
      rows: [
        {
          cpuThrottle: row.cpuThrottle,
          id: row.id,
          warmupCount: 0,
          withinRunSampleCount: 5,
        },
      ],
    },
    focused: true,
    mode: "baseline",
    providers: [row.provider],
    scenarios: [row.scenario],
    smoke: false,
  };
  return createVuePerformanceRun({
    command: {
      arguments: ["--baseline", `--scenario=${row.scenario}`, `--provider=${row.provider}`],
      executable: "pnpm runtime:perf:vue",
    },
    completedAt: "2026-08-23T00:00:10.000Z",
    environment,
    flags,
    machine: { cpuModel: "Test CPU", logicalCoreCount: 8 },
    rows: [
      {
        errors: [],
        id: row.id,
        lifecycle: { endpointVisible: true, overlayEmpty: true, passed: true, rootEmpty: true },
        result: createRuntimePerformanceResult({
          metric: row.metric,
          provider: row.provider,
          samples,
          scenario: row.scenario,
        }),
      },
    ],
    startedAt: "2026-08-23T00:00:00.000Z",
  });
}

function eligibilityFor(run) {
  return createVuePerformanceEligibility({
    audit: testAudit(),
    environment: run.environment,
    machine: run.machine,
    refreshedAt: "2026-08-23T00:00:00.000Z",
  });
}
