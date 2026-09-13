import { writeFileSync } from "node:fs";
import path from "node:path";
import { eligibleP95, median } from "../statistics.mjs";
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

export function summarizeObservationStates(observations, { metric = "duration" } = {}) {
  const included = observations.filter(({ excluded }) => !excluded);
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
  if (counts.failed)
    return {
      sampleCount: included.length,
      counts,
      median: { kind: "failed" },
      p95: { kind: "failed" },
    };
  if (counts.unavailable || missingMeasuredMetric)
    return {
      sampleCount: included.length,
      counts,
      median: { kind: "unavailable", reason: "unknown observations are present" },
      p95: { kind: "unavailable", reason: "unknown observations are present" },
    };
  if (!counts.censored)
    return {
      sampleCount: included.length,
      counts,
      median: values.length
        ? { kind: "value", valueMs: median(values) }
        : { kind: "unavailable", reason: "no observations" },
      p95:
        values.length >= 20
          ? { kind: "value", valueMs: eligibleP95(values) }
          : { kind: "unavailable", reason: "p95 requires 20 observations" },
    };
  return {
    sampleCount: included.length,
    counts,
    median: censoredQuantile(values, counts.censored, 0.5, { averageMiddle: true }),
    p95:
      included.length >= 20
        ? censoredQuantile(values, counts.censored, 0.95)
        : { kind: "unavailable", reason: "p95 requires 20 observations" },
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
      blockId: session.blockId,
    })),
    {
      provider: session.provider,
      scenario: session.scenario,
      sessionId: session.sessionId,
      blockId: session.blockId,
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
      excluded: false,
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
          : summarizeObservationStates(group, { metric: "domCompletion" }),
    };
  });
  const sessionRows = sessions.map((session) => {
    const repeated = (session.collected?.observations ?? []).filter(
      ({ flowPhase, excluded }) => flowPhase === "repeated" && !excluded,
    );
    return {
      sessionId: session.sessionId,
      provider: session.provider,
      scenario: session.scenario,
      blockId: session.blockId,
      position: session.position,
      complete: session.complete,
      eligible: session.eligible,
      repeated: summarizeObservationStates(repeated),
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
  if (value.kind === "value") return `${value.valueMs.toFixed(1)} ms`;
  if (value.kind === "bound") return `<${value.lessThanMs} ms reported`;
  return value.kind;
};

export function renderCaptureReport(report) {
  const actions = report.actionRows
    .map(
      (row) =>
        `| ${row.provider} | ${row.scenario} | ${row.actionId} | ${row.flowPhase ?? "once per context"} | ${row.duration.sampleCount} | ${row.duration.counts.excluded} | ${row.duration.counts.measured} | ${row.duration.counts.censored} | ${row.duration.counts.unavailable} | ${row.duration.counts.failed} | ${statistic(row.duration.median)} | ${statistic(row.duration.p95)} |`,
    )
    .join("\n");
  const sessions = report.sessionRows
    .map(
      (row) =>
        `| ${row.sessionId} | ${row.blockId} | ${row.position} | ${row.complete ? "yes" : "no"} | ${row.eligible ? "yes" : "no"} | ${row.repeated.counts.measured} | ${row.repeated.counts.censored} | ${row.repeated.counts.unavailable} | ${row.failureCount} | ${statistic(row.repeated.median)} |`,
    )
    .join("\n");
  return `# Native React interaction capture

Run: ${report.runId}. CPU rate: ${report.cpu}. This report contains absolute descriptive results.

## Action distributions

| Provider | Workload | Action | Phase | Samples | Excluded | Measured | Censored | Unavailable | Failed | Median | p95 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${actions}

## Session and block variation

Repeated observations share a browser session. Each row keeps its block and balanced provider
position so a reviewer can inspect session clusters without pooling CPU conditions.

| Session | Block | Position | Complete | Eligible | Measured | Censored | Unavailable | Failures | Repeated median |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
${sessions}

## Claim limits

Missing Event Timing entries remain unavailable because the pinned browser exposes no explicit
zero-loss proof. A missing entry is not zero. Reported durations retain the browser's 8 ms
granularity. A percentile is unavailable when unknown observations can change it. Censored ranks
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
