import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { inventory } from "../../runtime-performance/interactions/build.mjs";
import { main } from "../../measure-react-stress.mjs";
import {
  acceptStressRun,
  checkStressRun,
  loadAcceptedStress,
  writeStressManifest,
} from "../../runtime-performance/stress/evidence.mjs";
import { parseStressArgs, stressPlan } from "../../runtime-performance/stress/plan.mjs";
import { initialStateErrors, sessionErrors } from "../../runtime-performance/stress/state.mjs";
import { renderStandardReport } from "../../measure-performance.mjs";
import { radioEndpointReady } from "../../runtime-performance/stress/fixtures/radio-endpoint.mjs";
import {
  abortAfterWarmup,
  navigationTargetHitTest,
} from "../../runtime-performance/stress/run.mjs";

const json = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const tabsInitial = {
  triggerCount: 1000,
  panelCount: 1000,
  primarySelected: true,
  targetSelected: false,
  selectedTabCount: 1,
  primaryVisible: true,
  targetVisible: false,
};
const tabsFinal = {
  ...tabsInitial,
  primarySelected: false,
  targetSelected: true,
  primaryVisible: false,
  targetVisible: true,
};
const dialogInitial = {
  outsideCount: 10000,
  triggerCount: 1,
  contentVisible: false,
  focusInside: false,
};
const dialogFinal = { ...dialogInitial, contentVisible: true, focusInside: true };
const navigationInitial = {
  triggerCount: 2,
  primaryLinks: 500,
  primaryVisible: true,
  targetVisible: false,
  primarySelected: true,
  targetSelected: false,
  targetLinks: 500,
};
const navigationFinal = {
  ...navigationInitial,
  primaryVisible: false,
  targetVisible: true,
  primarySelected: false,
  targetSelected: true,
};
const accordionInitial = {
  itemCount: 1000,
  panelCount: 1000,
  selectedCount: 0,
  targetSelected: false,
  targetVisible: false,
};
const accordionFinal = {
  ...accordionInitial,
  selectedCount: 1,
  targetSelected: true,
  targetVisible: true,
};
const radioInitial = {
  itemCount: 1000,
  triggerCount: 1000,
  selectedCount: 1,
  checkedInputCount: 1,
  primarySelected: true,
  targetSelected: false,
  submittedValue: "item-1",
  checkedValue: "item-1",
};
const radioFinal = {
  ...radioInitial,
  primarySelected: false,
  targetSelected: true,
  submittedValue: "item-1000",
  checkedValue: "item-1000",
};
const states = {
  tabs: [tabsInitial, tabsFinal],
  dialog: [dialogInitial, dialogFinal],
  "navigation-menu": [navigationInitial, navigationFinal],
  accordion: [accordionInitial, accordionFinal],
  "radio-group": [radioInitial, radioFinal],
};

function recordedRun(root, runId, workload, bonus = 0) {
  const directory = path.join(root, runId);
  mkdirSync(path.join(directory, "sessions"), { recursive: true });
  mkdirSync(path.join(directory, "dist"));
  mkdirSync(path.join(directory, "dependencies"));
  writeFileSync(path.join(directory, "dist/app.js"), "fixture");
  for (const file of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"])
    writeFileSync(path.join(directory, "dependencies", file), file);
  const plan = stressPlan({ runId, selected: Array.isArray(workload) ? workload : [workload] });
  json(path.join(directory, "plan.json"), plan);
  const source = { sha256: "saved-source", files: [] };
  json(path.join(directory, "source.json"), { revision: "abc123", inventory: source });
  json(path.join(directory, "source-after.json"), source);
  json(path.join(directory, "build.json"), {
    bundles: inventory(path.join(directory, "dist"), ["."]),
    dependencies: {
      frozenInputs: inventory(path.join(directory, "dependencies"), [
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
      ]),
    },
  });
  json(path.join(directory, "environment.json"), {
    browser: "151.0",
    versions: { react: "19.3.0" },
  });
  for (const planned of plan.sessions) {
    const [initial, final] = states[planned.workload];
    json(path.join(directory, "sessions", `${String(planned.orderIndex).padStart(3, "0")}.json`), {
      ...planned,
      complete: true,
      eligible: planned.passRole === "measured",
      failures: [],
      pageErrors: [],
      mount: { durationMs: 10 + bonus, state: initial },
      action: {
        durationMs: 20 + planned.pass + bonus,
        ...(planned.workload === "navigation-menu"
          ? {
              input: {
                type: "pointerover",
                trusted: true,
                target: "true",
                preInputTargetSelected: false,
                enteredFromOutside: true,
              },
            }
          : planned.workload === "dialog"
            ? { click: { trusted: true, target: "true", preClickTargetSelected: false } }
            : {
                input: {
                  type: "click",
                  trusted: true,
                  target: "true",
                  preInputTargetSelected: false,
                },
              }),
        state: final,
      },
      initial,
      final,
    });
  }
  json(path.join(directory, "result.json"), {
    runId,
    recordedAt: "2026-09-13T15:00:00Z",
    complete: true,
    sourceUnchanged: true,
    actualOrder: plan.sessions.map(({ sessionId }) => sessionId),
    failures: [],
  });
  writeStressManifest(directory);
  return directory;
}

describe("retained React stress", () => {
  it("plans one warmup and five measured fresh contexts per provider and workload", () => {
    const plan = stressPlan({ runId: "fixed" });
    expect(plan.sessions).toHaveLength(90);
    for (const workload of plan.selected)
      for (const provider of ["starwind", "base-ui", "ark-ui"]) {
        const passes = plan.sessions.filter(
          (session) => session.workload === workload && session.provider === provider,
        );
        expect(passes.map(({ passRole }) => passRole)).toEqual([
          "warmup",
          "measured",
          "measured",
          "measured",
          "measured",
          "measured",
        ]);
        expect(new Set(passes.map(({ sessionId }) => sessionId)).size).toBe(6);
      }
    expect(stressPlan({ runId: "fixed" })).toEqual(plan);
  });

  it("rejects invalid CLI requests before starting the runner", async () => {
    expect(() => parseStressArgs(["--workload", "zag"])).toThrow();
    expect(() => parseStressArgs(["--check"])).toThrow();
    expect(() => parseStressArgs(["--workload", "tabs", "--workload", "tabs"])).toThrow();
    expect(() =>
      parseStressArgs(["--check", "a", "--workload", "tabs", "--workload", "dialog"]),
    ).toThrow();
    expect(parseStressArgs(["--check", "a", "--workload", "dialog"]).checkWorkload).toBe("dialog");
    const remaining = ["navigation-menu", "tabs", "accordion", "radio-group"];
    const config = parseStressArgs(remaining.flatMap((id) => ["--workload", id]));
    expect(config.selected).toEqual(remaining);
    expect(stressPlan({ runId: "remaining", selected: config.selected }).sessions).toHaveLength(72);
    let selected;
    await main(["--workload", "tabs"], (config) => {
      selected = config.selected;
    });
    expect(selected).toEqual(["tabs"]);
  });

  it("checks navigation hit delivery before timing and stops after one failed warmup", async () => {
    let scrolled = false;
    const page = {
      locator: () => ({
        scrollIntoViewIfNeeded: async () => {
          scrolled = true;
        },
      }),
      evaluate: async () => ({ ready: false, x: 10, y: 20, hitTag: "A", hitText: "Link 1" }),
    };
    await expect(navigationTargetHitTest(page)).rejects.toThrow(/covered before input.*Link 1/);
    expect(scrolled).toBe(true);
    page.evaluate = async () => ({
      ready: true,
      x: 10,
      y: 20,
      hitTag: "BUTTON",
      hitText: "target",
    });
    expect((await navigationTargetHitTest(page)).ready).toBe(true);
    page.evaluate = async () => ({ ready: false, hovered: true, x: 10, y: 20 });
    await expect(navigationTargetHitTest(page)).rejects.toThrow(/hovered before input/);
    expect(abortAfterWarmup({ passRole: "warmup", failures: ["covered"] })).toBe(true);
    expect(abortAfterWarmup({ passRole: "measured", failures: ["covered"] })).toBe(false);
    expect(abortAfterWarmup({ passRole: "warmup", failures: [] })).toBe(false);
  });

  it("keeps each copied production entry within its provider imports", () => {
    const fixtures = path.resolve(import.meta.dirname, "../../runtime-performance/stress/fixtures");
    for (const provider of ["starwind", "base-ui", "ark-ui"]) {
      const source = readFileSync(path.join(fixtures, `${provider}.jsx`), "utf8");
      expect(source).toContain(`boot("${provider}", App)`);
      expect(source).toMatch(/NavigationMenu\.List data-stress-nav-list/);
      expect(source).not.toContain("@zag-js/");
      for (const relative of source.matchAll(/from "(\.\/[^\"]+)"|import "(\.\/[^\"]+)"/g))
        expect(existsSync(path.join(fixtures, relative[1] ?? relative[2]))).toBe(true);
      for (const other of ["starwind", "base-ui", "ark-ui"].filter((name) => name !== provider))
        expect(source).not.toContain(`./${other}.jsx`);
    }
    expect(readFileSync(path.join(fixtures, "style.css"), "utf8")).toMatch(
      /\[data-stress-nav-list\]\s*\{\s*display:\s*flex;/,
    );
    expect(existsSync(path.join(fixtures, "radio-endpoint.mjs"))).toBe(true);
  });

  it("rejects stale, wrong, missing, and untrusted task endpoints", () => {
    const session = {
      workload: "tabs",
      initial: tabsInitial,
      final: tabsFinal,
      mount: { durationMs: 10, state: tabsInitial },
      action: {
        durationMs: 20,
        input: { type: "click", trusted: true, target: "true", preInputTargetSelected: false },
        state: tabsFinal,
      },
      pageErrors: [],
    };
    expect(sessionErrors(session)).toEqual([]);
    expect(
      sessionErrors({
        ...session,
        action: { ...session.action, input: null, click: { trusted: true, target: "true" } },
      }),
    ).toContain("trusted target input is missing");
    expect(
      sessionErrors({
        ...session,
        action: {
          ...session.action,
          input: { type: "pointerover", trusted: true, target: "true" },
        },
      }),
    ).toContain("trusted target input is missing");
    expect(initialStateErrors("tabs", { ...tabsInitial, panelCount: 999 })).not.toEqual([]);
    expect(
      sessionErrors({
        ...session,
        action: { ...session.action, input: { ...session.action.input, trusted: false } },
      }),
    ).toContain("trusted target input is missing");
    expect(
      sessionErrors({
        ...session,
        action: {
          ...session.action,
          input: { ...session.action.input, preInputTargetSelected: true },
        },
      }),
    ).toContain("target was already active before input");
    expect(
      sessionErrors({ ...session, action: { ...session.action, state: tabsInitial } }),
    ).toContain("timed endpoint state differs from the checked task result");
    expect(
      sessionErrors({ ...session, final: { ...tabsFinal, targetVisible: false } }).length,
    ).toBeGreaterThan(0);
    expect(
      sessionErrors({ ...session, action: { ...session.action, durationMs: null } }).length,
    ).toBeGreaterThan(0);
    expect(sessionErrors({ ...session, mount: { durationMs: 10 } })).toContain(
      "mount ready-DOM state is missing",
    );
    expect(sessionErrors({ ...session, action: { ...session.action, state: null } })).toContain(
      "timed endpoint state is missing",
    );
    expect(
      initialStateErrors("navigation-menu", { ...navigationInitial, primaryLinks: 499 }),
    ).not.toEqual([]);
    expect(
      sessionErrors({
        ...session,
        workload: "navigation-menu",
        initial: navigationInitial,
        final: { ...navigationFinal, primaryVisible: true },
        action: { ...session.action, state: navigationFinal },
      }).length,
    ).toBeGreaterThan(0);
    const navigationSession = {
      ...session,
      workload: "navigation-menu",
      initial: navigationInitial,
      final: navigationFinal,
      mount: { durationMs: 10, state: navigationInitial },
      action: {
        durationMs: 20,
        input: {
          type: "pointerover",
          trusted: true,
          target: "true",
          preInputTargetSelected: false,
          enteredFromOutside: true,
        },
        state: navigationFinal,
      },
    };
    expect(sessionErrors(navigationSession)).toEqual([]);
    expect(
      sessionErrors({
        ...navigationSession,
        action: {
          ...navigationSession.action,
          input: { ...navigationSession.action.input, type: "click" },
        },
      }),
    ).toContain("trusted target input is missing");
    expect(
      sessionErrors({
        ...navigationSession,
        action: {
          ...navigationSession.action,
          input: { ...navigationSession.action.input, preInputTargetSelected: true },
        },
      }),
    ).toContain("target was already active before input");
    expect(
      sessionErrors({
        ...navigationSession,
        action: {
          ...navigationSession.action,
          input: { ...navigationSession.action.input, enteredFromOutside: false },
        },
      }),
    ).toContain("navigation pointer did not enter the target from outside");
    expect(
      sessionErrors({ ...navigationSession, action: { ...navigationSession.action, input: null } }),
    ).toContain("trusted target input is missing");
    expect(
      initialStateErrors("radio-group", { ...radioInitial, submittedValue: "item-1000" }),
    ).not.toEqual([]);
    expect(
      sessionErrors({
        ...session,
        workload: "radio-group",
        initial: radioInitial,
        final: { ...radioFinal, checkedInputCount: 2 },
        action: { ...session.action, state: radioFinal },
      }).length,
    ).toBeGreaterThan(0);
  });

  it("waits for one checked radio inside the timed endpoint", () => {
    expect(radioEndpointReady(radioFinal)).toBe(true);
    expect(radioEndpointReady({ ...radioFinal, selectedCount: 2 })).toBe(false);
    expect(radioEndpointReady({ ...radioFinal, checkedInputCount: 2 })).toBe(false);
  });

  it("checks raw bytes and replaces only a complete focused workload", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "stress-evidence-"));
    try {
      const accepted = path.join(root, "accepted.json");
      const tabs = recordedRun(root, "tabs-first", "tabs");
      expect(checkStressRun(tabs).internalValid).toBe(true);
      acceptStressRun(tabs, accepted);
      const dialog = recordedRun(root, "dialog-first", "dialog");
      acceptStressRun(dialog, accepted);
      let loaded = loadAcceptedStress(accepted);
      expect(loaded.rows.map(({ workload, metric }) => `${workload}/${metric}`)).toEqual([
        "dialog/open",
        "tabs/mount",
        "tabs/select-last",
      ]);
      expect(
        loaded.rows
          .find(({ workload, metric }) => workload === "tabs" && metric === "select-last")
          .values.map(({ meanMs }) => meanMs),
      ).toEqual([23, 23, 23]);
      const replacement = recordedRun(root, "tabs-second", "tabs", 5);
      acceptStressRun(replacement, accepted);
      loaded = loadAcceptedStress(accepted);
      expect(loaded.rows.find(({ workload }) => workload === "dialog").runId).toBe("dialog-first");
      expect(loaded.rows.find(({ workload }) => workload === "tabs").runId).toBe("tabs-second");
      const sessionFile = path.join(replacement, "sessions/000.json");
      const session = JSON.parse(readFileSync(sessionFile));
      session.action.durationMs = 0;
      json(sessionFile, session);
      expect(checkStressRun(replacement).internalValid).toBe(false);
      expect(() => loadAcceptedStress(accepted)).toThrow(/invalid/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("places complete large-workload means below the unchanged task tables", () => {
    const stress = {
      rows: [
        {
          label: "Tabs",
          metric: "mount",
          values: [{ meanMs: 19.25 }, { meanMs: 21 }, { meanMs: 23 }],
          workload: "tabs",
          runId: "saved",
          recordedAt: "2026-09-13",
        },
        {
          label: "Navigation Menu",
          metric: "switch",
          values: [{ meanMs: 9 }, { meanMs: 10 }, { meanMs: 11 }],
          workload: "navigation-menu",
          runId: "saved-navigation",
          recordedAt: "2026-09-13",
        },
      ],
      notes: [],
    };
    const report = renderStandardReport({
      directory: "/tmp/run",
      plan: { runId: "native" },
      sessions: [],
      stress,
    });
    expect(report.indexOf("## Interactions")).toBeLessThan(report.indexOf("## Large workloads"));
    expect(report).toContain("| Tabs | Mount | 19.3 | 21.0 | 23.0 |");
    expect(report).toContain("| Navigation Menu | Switch panel (pointer) | 9.0 | 10.0 | 11.0 |");
    expect(report).toContain("Navigation Menu uses trusted pointer entry");
    expect(report).toContain(
      "Large workload capture dates: Tabs 2026-09-13; Navigation Menu 2026-09-13.",
    );
    expect(report).not.toContain(".scratch/");
    expect(report).not.toContain("Zag React");
  });

  it("loads all eight rows only from complete three-provider workload runs", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "stress-complete-"));
    try {
      const accepted = path.join(root, "accepted.json");
      for (const workload of ["dialog", "navigation-menu", "tabs", "accordion", "radio-group"])
        acceptStressRun(recordedRun(root, `run-${workload}`, workload), accepted);
      const loaded = loadAcceptedStress(accepted);
      expect(loaded.rows).toHaveLength(8);
      expect(
        loaded.rows.every(
          ({ values }) =>
            values.length === 3 && values.every(({ samples }) => samples.length === 5),
        ),
      ).toBe(true);
      const broken = path.join(root, "run-radio-group", "sessions/017.json");
      rmSync(broken);
      expect(() => loadAcceptedStress(accepted)).toThrow(/invalid/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps a complete workload when another workload needs a focused retry", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "stress-partial-"));
    try {
      const accepted = path.join(root, "accepted.json");
      const directory = recordedRun(root, "mixed", ["dialog", "tabs"]);
      const plan = JSON.parse(readFileSync(path.join(directory, "plan.json")));
      const failed = plan.sessions.find(({ workload }) => workload === "tabs");
      const file = path.join(
        directory,
        "sessions",
        `${String(failed.orderIndex).padStart(3, "0")}.json`,
      );
      const session = JSON.parse(readFileSync(file));
      session.failures = ["provider correctness failure"];
      session.eligible = false;
      json(file, session);
      const resultFile = path.join(directory, "result.json");
      const result = JSON.parse(readFileSync(resultFile));
      result.complete = false;
      result.failures = [{ sessionId: failed.sessionId, reasons: session.failures }];
      json(resultFile, result);
      writeStressManifest(directory);
      expect(checkStressRun(directory).internalValid).toBe(false);
      expect(checkStressRun(directory, { workload: "dialog" }).internalValid).toBe(true);
      expect((await main(["--check", directory, "--workload", "dialog"])).internalValid).toBe(true);
      expect(acceptStressRun(directory, accepted).newlyAccepted).toEqual(["dialog"]);
      expect(loadAcceptedStress(accepted).rows.map(({ workload }) => workload)).toEqual(["dialog"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
