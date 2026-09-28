import { writeFileSync } from "node:fs";
import path from "node:path";
import { median } from "../statistics.mjs";
import { reportingThresholdMs } from "./collector.mjs";

const metricValue = (observation, metric) =>
  metric === "duration" ? observation.durationMs : observation.domCompletion?.inputToObservedDOMMs;

function censoredQuantile(values, censoredCount, percentile, { averageMiddle = false } = {}) {
  const count = values.length + censoredCount;
  if (!count) return { kind: "unavailable", reason: "no observations" };
  if (censoredCount && values.some((value) => value < reportingThresholdMs))
    return { kind: "unavailable", reason: "censor order overlaps measured values" };
  const sorted = [...values].sort((left, right) => left - right);
  const ranks =
    averageMiddle && count % 2 === 0 ? [count / 2, count / 2 + 1] : [Math.ceil(count * percentile)];
  if (ranks.every((rank) => rank <= censoredCount))
    return {
      kind: "bound",
      lessThanMs: reportingThresholdMs,
      domain: "browser reported duration (8 ms granularity)",
    };
  if (ranks.some((rank) => rank <= censoredCount))
    return { kind: "unavailable", reason: "quantile crosses censor boundary" };
  const selected = ranks.map((rank) => sorted[rank - censoredCount - 1]);
  return {
    kind: "value",
    valueMs: selected.reduce((sum, value) => sum + value, 0) / selected.length,
  };
}

export function summarizeObservationStates(
  observations,
  { metric = "duration", independentDOM = false } = {},
) {
  const included = observations
    .filter(({ excluded }) => !excluded)
    .map((observation) => {
      if (metric !== "domCompletion" || !independentDOM) return observation;
      const state =
        observation.state === "failed" || observation.delivery?.valid === false
          ? "failed"
          : observation.delivery?.valid === true &&
              Number.isFinite(observation.domCompletion?.inputToObservedDOMMs)
            ? "measured"
            : "unavailable";
      return { ...observation, state };
    });
  const counts = Object.fromEntries(
    ["measured", "censored", "unavailable", "failed"].map((state) => [
      state,
      included.filter((observation) => observation.state === state).length,
    ]),
  );
  counts.excluded = observations.length - included.length;
  const values = included
    .filter(({ state }) => state === "measured")
    .map((observation) => metricValue(observation, metric))
    .filter((value) => Number.isFinite(value));
  const missingMeasuredMetric = counts.measured - values.length;
  const samples = included.map((observation) => ({
    sessionId: observation.sessionId ?? null,
    state: observation.state,
    valueMs: observation.state === "measured" ? (metricValue(observation, metric) ?? null) : null,
  }));
  const range =
    counts.failed ||
    counts.unavailable ||
    counts.censored ||
    missingMeasuredMetric ||
    !values.length
      ? { kind: "unavailable" }
      : { kind: "value", minMs: Math.min(...values), maxMs: Math.max(...values) };
  const common = { sampleCount: included.length, counts, samples, range, p95: null };
  if (counts.failed)
    return {
      ...common,
      median: { kind: "failed" },
    };
  if (counts.unavailable || missingMeasuredMetric)
    return {
      ...common,
      median: { kind: "unavailable", reason: "unknown observations are present" },
    };
  if (!counts.censored)
    return {
      ...common,
      median: values.length
        ? { kind: "value", valueMs: median(values) }
        : { kind: "unavailable", reason: "no observations" },
    };
  return {
    ...common,
    median: censoredQuantile(values, counts.censored, 0.5, { averageMiddle: true }),
  };
}

const groupBy = (values, key) => {
  const groups = new Map();
  for (const value of values) {
    const id = key(value);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(value);
  }
  return groups;
};

export function buildCaptureReport(plan, observations, sessions) {
  const records = sessions.flatMap((session) => [
    ...(session.collected?.observations ?? []).map((observation) => ({
      ...observation,
      actionKey: observation.ordinal
        ? `${observation.actionId}-${observation.ordinal}`
        : observation.actionId,
      provider: session.provider,
      scenario: session.scenario,
      sessionId: session.sessionId,
      passRole: session.passRole,
    })),
    {
      provider: session.provider,
      scenario: session.scenario,
      sessionId: session.sessionId,
      passRole: session.passRole,
      flowPhase: null,
      actionId: "mount",
      actionKey: "mount",
      state:
        session.failures.length > 0
          ? "failed"
          : session.complete && session.raw?.mount?.durationMs != null
            ? "measured"
            : "unavailable",
      durationMs: session.raw?.mount?.durationMs,
      excluded: session.passRole === "warmup",
    },
  ]);
  const actionRows = [
    ...groupBy(records, (record) =>
      JSON.stringify([record.provider, record.scenario, record.actionKey, record.flowPhase]),
    ),
  ].map(([id, group]) => {
    const [provider, scenario, actionId, flowPhase] = JSON.parse(id);
    return {
      provider,
      scenario,
      actionId,
      flowPhase,
      duration: summarizeObservationStates(group),
      domCompletion:
        actionId === "mount"
          ? null
          : summarizeObservationStates(group, {
              metric: "domCompletion",
              independentDOM: plan.schemaVersion >= 4,
            }),
    };
  });
  const sessionRows = sessions.map((session) => {
    const flowObservations = (session.collected?.observations ?? []).map((observation) => ({
      ...observation,
      sessionId: session.sessionId,
    }));
    return {
      sessionId: session.sessionId,
      provider: session.provider,
      scenario: session.scenario,
      passRole: session.passRole,
      position: session.position,
      complete: session.complete,
      eligible: session.eligible,
      actions: summarizeObservationStates(flowObservations),
      failureCount: session.failures.length,
    };
  });
  return {
    schemaVersion: 1,
    runId: plan.runId,
    mode: plan.mode,
    cpu: plan.cpu,
    complete: observations.complete,
    sourceUnchanged: observations.sourceUnchanged,
    actionRows,
    sessionRows,
  };
}

const statistic = (value) => {
  if (!value) return "unavailable";
  if (value.kind === "value") return `${value.valueMs.toFixed(1)} ms`;
  if (value.kind === "bound") return `<${value.lessThanMs} ms reported`;
  return value.kind;
};

const range = (value) =>
  value.kind === "value" ? `${value.minMs.toFixed(1)}–${value.maxMs.toFixed(1)} ms` : "unavailable";
const samples = (value) =>
  value
    .map(
      ({ sessionId, state, valueMs }) =>
        `${sessionId ?? "session"}:${state === "measured" ? `${valueMs?.toFixed(1) ?? "unknown"} ms` : state}`,
    )
    .join(", ");

export function renderCaptureReport(report) {
  const actions = report.actionRows
    .map(
      (row) =>
        `| ${row.provider} | ${row.scenario} | ${row.actionId} | ${row.flowPhase ?? "once per context"} | ${row.duration.sampleCount} | ${row.duration.counts.excluded} | ${row.duration.counts.measured} | ${row.duration.counts.censored} | ${row.duration.counts.unavailable} | ${row.duration.counts.failed} | ${statistic(row.duration.median)} | ${range(row.duration.range)} | ${samples(row.duration.samples)} |`,
    )
    .join("\n");
  const sessions = report.sessionRows
    .map(
      (row) =>
        `| ${row.sessionId} | ${row.passRole} | ${row.position} | ${row.complete ? "yes" : "no"} | ${row.eligible ? "yes" : "no"} | ${row.actions.counts.measured} | ${row.actions.counts.censored} | ${row.actions.counts.unavailable} | ${row.failureCount} |`,
    )
    .join("\n");
  return `# Native React interaction capture

Run: ${report.runId}. CPU rate: ${report.cpu}. This report contains absolute descriptive results.

## Action distributions

| Provider | Workload | Action | Phase | Samples | Excluded | Measured | Censored | Unavailable | Failed | Median | Min–max | Individual samples |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${actions}

## Pass records

Each pass has one fresh browser context and one complete task flow. One warmup per cell is
excluded. Five measured passes per cell retain their seeded provider position.

| Session | Role | Position | Complete | Eligible | Measured | Censored | Unavailable | Failures |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: |
${sessions}

## Claim limits

Missing Event Timing entries remain unavailable because the pinned browser exposes no explicit
zero-loss proof. A missing entry is not zero. Reported durations retain the browser's 8 ms
granularity. A median is unavailable when unknown observations can change it. Censored ranks
are shown as bounds in the browser-reported duration domain.

DOM completion is a supporting observation with observer and validation overhead. It does not
prove presented pixels. Pointer movement has no Event Timing latency result. Mount values describe
render-to-ready DOM and exclude module loading. Closed DOM counts can differ through each
provider's documented presence policy.

The report contains no overall winner, pooled ratio, confidence interval, or significance claim.
Results apply to these fixed tasks, production bundles, headed Chromium environment, and recorded
host. Valid slow observations stay in the raw session files. Failed cells remain visible and are
ineligible for speed comparisons.
`;
}

export function writeCaptureReport(directory, plan, observations, sessions) {
  const report = buildCaptureReport(plan, observations, sessions);
  writeFileSync(path.join(directory, "report.json"), JSON.stringify(report, null, 2) + "\n");
  writeFileSync(path.join(directory, "README.md"), renderCaptureReport(report));
  return report;
}
