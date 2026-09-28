import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPublicEvidence,
  parseStandardArgs,
  renderStandardReport,
  validateStandardCapture,
} from "../../measure-performance.mjs";

const providers = ["starwind", "base-ui", "ark-ui"];
const scenarios = [
  "menu-20",
  "select-100",
  "combobox-500",
  "submenu-8x8",
  "select-page-1",
  "select-page-20",
];
const actionIds = {
  "menu-20": ["open", "choose", "reopen", "escape"],
  "select-100": ["open", "navigate-next", "choose", "submit"],
  "combobox-500": ["type-character", "navigate-next", "choose", "submit"],
  "submenu-8x8": ["open", "choose"],
  "select-page-1": ["open", "escape", "reopen", "navigate-next", "choose", "submit"],
  "select-page-20": ["open", "escape", "reopen", "navigate-next", "choose", "submit"],
};

function recordedSession(provider, scenario, pass) {
  const base = providers.indexOf(provider) + 1;
  const navCount = scenario === "combobox-500" ? 3 : provider === "base-ui" ? 3 : 2;
  const actions = actionIds[scenario].flatMap((id) => {
    const count = id === "navigate-next" ? navCount : id === "type-character" ? 7 : 1;
    return Array.from({ length: count }, (_, index) => ({
      uid: `${provider}/${scenario}/${pass}/${id}/${index}`,
      actionId: id === "type-character" ? `type-character-${index + 1}` : id,
      ordinal: count === 1 ? 0 : index + 1,
    }));
  });
  return {
    provider,
    scenario,
    sessionId: `${provider}/${scenario}/${pass}`,
    passRole: "measured",
    complete: true,
    eligible: true,
    failures: [],
    flows: [{ actualKeyCount: navCount, commands: actions }],
    raw: { mount: { durationMs: base * 10 }, actions },
    collected: {
      observations: actions.map((action) => ({
        actionUid: action.uid,
        delivery: { valid: true },
        state: "measured",
        excluded: false,
        domCompletion: {
          inputToObservedDOMMs:
            base + (action.actionId.startsWith("type-character-") ? action.ordinal : 0),
        },
      })),
    },
  };
}

const sessions = () =>
  scenarios.flatMap((scenario) =>
    providers.flatMap((provider) =>
      Array.from({ length: 5 }, (_, pass) => recordedSession(provider, scenario, pass)),
    ),
  );
const render = (records) =>
  renderStandardReport({
    directory: path.join(process.cwd(), ".scratch/realistic-react-performance/runs/saved"),
    plan: { runId: "saved" },
    sessions: records,
    source: { revision: "saved-sha", inventory: { sha256: "saved-inventory" } },
    sourceDrift: true,
    build: {
      dependencies: {
        versions: { react: "19.3.0", "@base-ui/react": "1.8.0", "@ark-ui/react": "5.39.1" },
      },
    },
    environment: {
      recordedAt: "2026-09-13T14:04:56Z",
      browser: "151.0.7922.34",
      cpu: "Apple M5 Pro",
      powerState: "unknown",
      displayRefreshRateHz: "unknown",
    },
  });

describe("standard performance report", () => {
  it("rejects invalid modes before a browser can start", () => {
    expect(parseStandardArgs(["--seed", "20260912"])).toEqual({ seed: 20260912, fromRun: null });
    expect(parseStandardArgs(["--from-run", "saved"])).toEqual({
      seed: 20260912,
      fromRun: "saved",
    });
    for (const args of [
      ["--cpu", "4"],
      ["--seed", "1.5"],
      ["--from-run"],
      ["--seed", "1", "--from-run", "saved"],
    ])
      expect(() => parseStandardArgs(args)).toThrow();
  });

  it("requires checked, complete native passes and applies the saved-run drift exception only there", () => {
    const input = {
      check: { internalValid: true, sourceDrift: false, errors: [] },
      plan: {
        runId: "saved",
        mode: "capture",
        cpu: 1,
        schemaVersion: 4,
        cells: Array(108).fill({}),
        sessionsPerCell: 6,
        measuredPerCell: 5,
      },
      observations: { complete: true, sourceUnchanged: true, calibrationPassed: true },
      report: { runId: "saved", actionRows: [{}] },
      sessions: Array.from({ length: 108 }, () => ({
        complete: true,
        eligible: true,
        failures: [],
        passRole: "measured",
      })),
    };
    expect(validateStandardCapture(input)).toEqual([]);
    const drift = { ...input, check: { internalValid: true, sourceDrift: true, errors: [] } };
    expect(validateStandardCapture(drift)).toContain("capture source differs from current source");
    expect(validateStandardCapture({ ...drift, fromSavedRun: true })).toEqual([]);
    expect(
      validateStandardCapture({
        ...drift,
        fromSavedRun: true,
        observations: { ...input.observations, sourceUnchanged: false },
      }),
    ).toContain("capture is incomplete, source-changed, or uncalibrated");
    expect(
      validateStandardCapture({
        ...input,
        sessions: [
          {
            complete: true,
            eligible: false,
            failures: [{ category: "correctness-failure" }],
            passRole: "warmup",
          },
          ...input.sessions.slice(1),
        ],
      }),
    ).toContain("capture contains failed or missing sessions");
  });

  it("puts the short method first and compares only complete three-provider DOM rows", () => {
    const content = render(sessions());
    expect(content).toMatch(
      /^# Runtime performance comparison\n\nEach provider and workload has one excluded warmup context and five measured fresh contexts\. Each context mounts once and performs one complete task flow\.\n\nValues are average milliseconds; lower is faster\./,
    );
    expect(content.indexOf("## Mounting")).toBeLessThan(content.indexOf("## Interactions"));
    expect(content.indexOf("## Interactions")).toBeLessThan(content.indexOf("## Notes"));
    expect(content).toContain("| Menu | 10.0 | 20.0 | 30.0 |");
    expect(content).toContain("| Select page (20 controls) | 10.0 | 20.0 | 30.0 |");
    expect(content).toContain("| Combobox | Filter results (per character) | 5.0 | 6.0 | 7.0 |");
    expect(content).toContain("| Submenu | Open parent menu | 1.0 | 2.0 | 3.0 |");
    expect(content).not.toContain("type-character-");
    expect(content).not.toContain("navigate-next");
    expect(content).not.toContain("Zag React");
    expect(content).not.toContain("### Navigation keys");
    expect(content).not.toContain("Corrected completed-update highlights");
    expect(content.indexOf("saved-sha")).toBeGreaterThan(content.indexOf("## Notes"));
    expect(content).toContain("Current source differs from the capture");
    expect(content).toContain("Captured 2026-09-13 with Chromium 151.0.7922.34");
    expect(content).toContain("Base UI 1.8.0, Ark UI React 5.39.1");
    expect(content).not.toContain(".scratch/");
    expect(content).not.toContain("./diagnostics/");
    expect(content).toContain("./performance-evidence/saved/README.md");
  });

  it("weights actual keys within each pass and then gives five passes equal weight", () => {
    const records = sessions();
    for (const session of records.filter(
      (entry) => entry.provider === "base-ui" && entry.scenario === "select-100",
    )) {
      const pass = Number(session.sessionId.split("/").at(-1));
      const keys = session.raw.actions.filter(({ actionId }) => actionId === "navigate-next");
      session.flows[0].actualKeyCount = pass % 2 ? 3 : 2;
      session.raw.actions = session.raw.actions.filter(
        (action) =>
          action.actionId !== "navigate-next" || action.ordinal <= session.flows[0].actualKeyCount,
      );
      session.flows[0].commands = session.raw.actions;
      session.collected.observations = session.collected.observations.filter((observation) =>
        session.raw.actions.some((action) => action.uid === observation.actionUid),
      );
      for (const key of keys) {
        const observation = session.collected.observations.find(
          ({ actionUid }) => actionUid === key.uid,
        );
        if (observation) observation.domCompletion.inputToObservedDOMMs = pass % 2 ? 10 : 2;
      }
    }
    expect(render(records)).toContain("| Select | Move highlight (per key) | 1.0 | 5.2 | 3.0 |");
    const evidence = buildPublicEvidence({
      plan: { runId: "saved" },
      sessions: records,
      source: { revision: "capture", inventory: { sha256: "digest", privatePath: "secret" } },
      environment: { cpu: "test host", operatorNotes: "private notes" },
    });
    const row = evidence.rows.find(
      ({ workload, action }) => workload === "Select" && action === "Move highlight (per key)",
    );
    const base = row.values.find(({ provider }) => provider === "base-ui");
    expect(base.samples.map(({ valuesMs }) => valuesMs)).toEqual([
      [2, 2],
      [10, 10, 10],
      [2, 2],
      [10, 10, 10],
      [2, 2],
    ]);
    expect(base.meanMs).toBe(5.2);
    expect(evidence.rows).toHaveLength(32);
    expect(JSON.stringify(evidence)).not.toMatch(/secret|private notes/);
  });

  it("omits a three-provider comparison when expected evidence is missing and names unperformed actions separately", () => {
    const missing = sessions();
    const base = missing.find(
      (session) => session.provider === "base-ui" && session.scenario === "select-100",
    );
    base.collected.observations = base.collected.observations.filter(
      (observation) =>
        observation.actionUid !==
        base.raw.actions.find((action) => action.actionId === "navigate-next").uid,
    );
    const content = render(missing);
    expect(content).not.toContain("| Select | Move highlight (per key) |");
    expect(content).toContain(
      "Select Move highlight (per key): base-ui missing DOM update evidence",
    );
    const unperformed = sessions();
    for (const session of unperformed.filter(
      (entry) => entry.provider === "base-ui" && entry.scenario === "select-100",
    )) {
      session.flows[0].actualKeyCount = 0;
      session.raw.actions = session.raw.actions.filter(
        (action) => action.actionId !== "navigate-next",
      );
      session.flows[0].commands = session.raw.actions;
    }
    expect(render(unperformed)).toContain("Select Move highlight (per key): base-ui not performed");
  });
});
