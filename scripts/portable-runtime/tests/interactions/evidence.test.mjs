import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  sessionContentMatches,
  validateCaptureReport,
  validateEvidenceRecords,
  writeSessionEvidence,
} from "../../runtime-performance/interactions/evidence.mjs";
import { createRunPlan } from "../../runtime-performance/interactions/plan.mjs";
import { copyFrozenDependencyWorkspace } from "../../runtime-performance/interactions/build.mjs";
import {
  buildCaptureReport,
  renderCaptureReport,
} from "../../runtime-performance/interactions/report.mjs";

const temporary = [];
afterEach(() => {
  for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true });
});

const recordedCapture = () => {
  const runId = "recorded-capture";
  const plan = createRunPlan(
    {
      mode: "capture",
      providers: ["starwind", "base-ui", "ark-ui"],
      scenarios: [],
      cpu: 1,
      seed: 20260912,
    },
    runId,
  );
  const sessions = plan.cells.map((planned) => {
    const actionIds =
      planned.scenario === "menu-20"
        ? ["open", "choose", "reopen", "escape"]
        : planned.scenario === "select-100"
          ? ["open", "navigate-next", "navigate-next", "choose", "submit"]
          : planned.scenario === "submenu-8x8"
            ? ["open", "hover-open", "choose"]
            : planned.scenario.startsWith("select-page-")
              ? ["open", "escape", "reopen", "navigate-next", "navigate-next", "choose", "submit"]
              : [
                  ...Array.from({ length: 7 }, (_, index) => `type-character-${index + 1}`),
                  "navigate-next",
                  "choose",
                  "submit",
                ];
    const flows = [planned.flow].map((flow) => ({
      ...flow,
      commands: actionIds.map((actionId, index) => ({
        uid: `${flow.flowId}/${actionId}/${index}`,
        actionId,
        kind: actionId === "hover-open" ? "pointer" : "key",
      })),
    }));
    const actions = flows.flatMap((flow) =>
      flow.commands.map((command) => ({
        ...command,
        flowId: flow.flowId,
        flowPhase: flow.flowPhase,
      })),
    );
    return {
      ...planned,
      runId,
      complete: true,
      eligible: planned.passRole !== "warmup",
      failures: [],
      flows,
      raw: { actions },
      collected: {
        observations: actions
          .filter(({ kind }) => kind !== "pointer")
          .map((action) => ({
            actionUid: action.uid,
            actionId: action.actionId,
            ordinal: action.ordinal ?? 0,
            flowId: action.flowId,
            flowPhase: action.flowPhase,
            state: "measured",
            excluded: planned.passRole === "warmup",
            durationMs: 16,
            domCompletion: { inputToObservedDOMMs: 20 },
          })),
      },
    };
  });
  const entries = sessions.map((session) => ({
    sessionId: session.sessionId,
    passRole: session.passRole,
    file: `${session.sessionId}.json`,
    complete: session.complete,
    eligible: session.eligible,
    failureCount: session.failures.length,
  }));
  const observations = {
    runId,
    mode: "capture",
    cpu: 1,
    complete: true,
    eligible: true,
    calibrationPassed: true,
    actualOrder: entries.map(({ sessionId }) => sessionId),
    cells: entries,
    failures: [],
  };
  return { plan, observations, sessionIndex: { entries }, sessions };
};

describe("saved interaction evidence", () => {
  it("accepts all 108 recorded passes and a complete provider-failure row", () => {
    const evidence = recordedCapture();
    const failedIndex = evidence.sessions.findIndex(({ passRole }) => passRole === "measured");
    const failed = evidence.sessions[failedIndex];
    const failure = { category: "correctness-failure", message: "provider task failed" };
    failed.failures.push(failure);
    failed.eligible = false;
    evidence.sessionIndex.entries[failedIndex].eligible = false;
    evidence.sessionIndex.entries[failedIndex].failureCount = 1;
    evidence.observations.eligible = false;
    evidence.observations.failures.push({ ...failure, sessionId: failed.sessionId });
    expect(validateEvidenceRecords(evidence)).toEqual([]);
  });

  it.each([
    ["omitted session", (evidence) => evidence.sessions.pop(), "session files are missing"],
    [
      "duplicate session",
      (evidence) =>
        (evidence.sessionIndex.entries[1].sessionId = evidence.sessionIndex.entries[0].sessionId),
      "indexed session identities are duplicated",
    ],
    ["mixed run", (evidence) => (evidence.sessions[0].runId = "another-run"), "mismatched runId"],
    [
      "reordered phase",
      (evidence) => (evidence.sessions[0].flows[0].flowId = "wrong-flow"),
      "missing or reordered flows",
    ],
    [
      "duplicate action identity",
      (evidence) => {
        const actions = evidence.sessions[0].raw.actions;
        actions[1].uid = actions[0].uid;
      },
      "duplicate action IDs",
    ],
    [
      "missing command observation",
      (evidence) => evidence.sessions[0].collected.observations.pop(),
      "omits collected actions",
    ],
    [
      "included warmup observation",
      (evidence) => {
        const observation = evidence.sessions[0].collected.observations.find(({ actionUid }) =>
          actionUid.startsWith("warmup-1/"),
        );
        observation.excluded = false;
      },
      "invalid phase exclusion",
    ],
    [
      "wrong pass role",
      (evidence) => (evidence.sessions[0].passRole = "measured"),
      "mismatched passRole",
    ],
    [
      "wrong flow exclusion",
      (evidence) => (evidence.sessions[0].flows[0].excluded = false),
      "mismatched flow exclusion",
    ],
    [
      "false run eligibility",
      (evidence) => (evidence.observations.eligible = false),
      "run eligibility does not match",
    ],
    [
      "malformed sample budget",
      (evidence) => (evidence.plan.measuredPerCell = 6),
      "capture sample budget differs",
    ],
    [
      "false warmup eligibility",
      (evidence) => {
        const warmup = evidence.sessions[0];
        warmup.eligible = true;
        evidence.sessionIndex.entries[0].eligible = true;
      },
      "false eligibility state",
    ],
    [
      "trace inclusion",
      (evidence) => (evidence.sessions[0].trace = { file: "trace.json" }),
      "includes a diagnostic trace",
    ],
    [
      "false complete",
      (evidence) => {
        evidence.sessions[0].complete = false;
        evidence.sessions[0].eligible = false;
      },
      "run completeness does not match",
    ],
  ])("rejects %s", (_label, mutate, message) => {
    const evidence = recordedCapture();
    mutate(evidence);
    expect(validateEvidenceRecords(evidence).join("\n")).toContain(message);
  });

  it.each([
    ["actionId", "changed-action"],
    ["ordinal", 7],
    ["flowId", "changed-flow"],
    ["flowPhase", "repeated"],
  ])("rejects changed observation %s metadata", (field, value) => {
    const evidence = recordedCapture();
    evidence.sessions[0].collected.observations[0][field] = value;
    expect(validateEvidenceRecords(evidence).join("\n")).toContain(
      "mismatched observation action metadata",
    );
  });

  it("writes each raw session once with an indexed content hash", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "interaction-evidence-"));
    temporary.push(directory);
    const cell = { ...recordedCapture().sessions[0], orderIndex: 1 };
    const entry = writeSessionEvidence(directory, cell);
    const filename = path.join(directory, entry.file);
    expect(readFileSync(filename, "utf8")).toContain(cell.sessionId);
    writeFileSync(filename, "{}\n");
    expect(readFileSync(filename, "utf8")).toBe("{}\n");
    expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionContentMatches(entry, readFileSync(filename))).toBe(false);
  });

  it("rejects a changed report statistic or rendered Markdown", () => {
    const evidence = recordedCapture();
    const report = buildCaptureReport(evidence.plan, evidence.observations, evidence.sessions);
    const markdown = renderCaptureReport(report);
    const changedReport = structuredClone(report);
    changedReport.actionRows[0].duration.median = { kind: "value", valueMs: 999 };
    expect(
      validateCaptureReport({
        ...evidence,
        report: changedReport,
        markdown,
      }),
    ).toContain("capture report differs from its session records");
    expect(
      validateCaptureReport({
        ...evidence,
        report,
        markdown: `${markdown}\nchanged`,
      }),
    ).toContain("capture Markdown differs from its session records");
  });

  it("copies frozen dependency inputs without traversing an installed node_modules tree", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "interaction-dependencies-"));
    temporary.push(directory);
    const source = path.join(directory, "source");
    const destination = path.join(directory, "copy");
    mkdirSync(path.join(source, "node_modules"), { recursive: true });
    writeFileSync(path.join(source, "package.json"), "{}\n");
    writeFileSync(path.join(source, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    symlinkSync("missing-package", path.join(source, "node_modules", "broken"));
    copyFrozenDependencyWorkspace(source, destination);
    expect(readFileSync(path.join(destination, "package.json"), "utf8")).toBe("{}\n");
    expect(existsSync(path.join(destination, "node_modules"))).toBe(false);
  });
});
