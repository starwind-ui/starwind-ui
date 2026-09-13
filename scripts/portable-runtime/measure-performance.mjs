import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkEvidence } from "./runtime-performance/interactions/evidence.mjs";
import { repoRoot } from "./runtime-performance/interactions/build.mjs";
import { parseArgs } from "./runtime-performance/interactions/command.mjs";
import { providers } from "./runtime-performance/interactions/registry.mjs";
import { acceptedPath, loadAcceptedStress } from "./runtime-performance/stress/evidence.mjs";

export const canonicalPath = path.join(
  repoRoot,
  "docs/portable-runtime/runtime-performance-comparison.md",
);
const json = (filename) => JSON.parse(readFileSync(filename, "utf8"));

export function parseStandardArgs(argv) {
  let seed = 20260912;
  let fromRun = null;
  const seen = new Set();
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--") continue;
    const [flag, inline] = token.split("=", 2);
    if (!["--seed", "--from-run"].includes(flag)) throw new Error(`Unknown option: ${token}`);
    if (seen.has(flag)) throw new Error(`Duplicate option: ${flag}`);
    seen.add(flag);
    const value = inline ?? argv[++index];
    if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value.`);
    if (flag === "--seed") {
      if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
        throw new Error("--seed needs a safe integer.");
      seed = Number(value);
    } else fromRun = value;
  }
  if (fromRun && seen.has("--seed")) throw new Error("--from-run does not accept --seed.");
  return { seed, fromRun };
}

export function validateStandardCapture({
  check,
  plan,
  observations,
  report,
  sessions,
  fromSavedRun = false,
}) {
  const errors = [];
  if (!check.internalValid) errors.push(...check.errors);
  if (check.sourceDrift && !fromSavedRun) errors.push("capture source differs from current source");
  if (plan.mode !== "capture" || plan.cpu !== 1 || plan.schemaVersion < 4)
    errors.push("standard report requires a current native capture");
  if (plan.cells?.length !== 108 || plan.sessionsPerCell !== 6 || plan.measuredPerCell !== 5)
    errors.push("capture does not have the one-warmup, five-measured matrix");
  if (!observations.complete || !observations.sourceUnchanged || !observations.calibrationPassed)
    errors.push("capture is incomplete, source-changed, or uncalibrated");
  if (
    sessions.length !== 108 ||
    sessions.some(
      ({ complete, eligible, failures, passRole }) =>
        !complete || failures?.length || (passRole !== "warmup" && !eligible),
    )
  )
    errors.push("capture contains failed or missing sessions");
  if (report.runId !== plan.runId || report.actionRows?.length === 0)
    errors.push("capture report differs from its plan");
  return errors;
}

const workloads = [
  { id: "menu-20", label: "Menu" },
  { id: "select-100", label: "Select" },
  { id: "combobox-500", label: "Combobox" },
  { id: "submenu-8x8", label: "Submenu" },
  { id: "select-page-1", label: "Select page (1 control)" },
  { id: "select-page-20", label: "Select page (20 controls)" },
];

const interactionSteps = [
  { scenario: "menu-20", label: "Open", actionId: "open" },
  { scenario: "menu-20", label: "Choose item", actionId: "choose" },
  { scenario: "menu-20", label: "Reopen", actionId: "reopen" },
  { scenario: "menu-20", label: "Close with Escape", actionId: "escape" },
  { scenario: "select-100", label: "Open", actionId: "open" },
  { scenario: "select-100", label: "Move highlight (per key)", actionId: "navigate-next" },
  { scenario: "select-100", label: "Choose item", actionId: "choose" },
  { scenario: "select-100", label: "Submit form", actionId: "submit" },
  { scenario: "combobox-500", label: "Filter results (per character)", actionId: "type-character" },
  { scenario: "combobox-500", label: "Move highlight (per key)", actionId: "navigate-next" },
  { scenario: "combobox-500", label: "Choose item", actionId: "choose" },
  { scenario: "combobox-500", label: "Submit form", actionId: "submit" },
  { scenario: "submenu-8x8", label: "Open parent menu", actionId: "open" },
  { scenario: "submenu-8x8", label: "Choose item", actionId: "choose" },
  ...["select-page-1", "select-page-20"].flatMap((scenario) => [
    { scenario, label: "Open", actionId: "open" },
    { scenario, label: "Close with Escape", actionId: "escape" },
    { scenario, label: "Reopen", actionId: "reopen" },
    { scenario, label: "Move highlight (per key)", actionId: "navigate-next" },
    { scenario, label: "Choose item", actionId: "choose" },
    { scenario, label: "Submit form", actionId: "submit" },
  ]),
];

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const validMilliseconds = (value) => Number.isFinite(value) && value >= 0;

function passValue(session, step) {
  if (step.actionId === "mount") {
    const value = session.raw?.mount?.durationMs;
    return validMilliseconds(value)
      ? { value, valuesMs: [value] }
      : { reason: "missing mount evidence" };
  }
  const flow = session.flows?.[0];
  const commands = flow?.commands ?? [];
  const rawActions = session.raw?.actions ?? [];
  let expected;
  let matches;
  if (step.actionId === "navigate-next") {
    expected = flow?.actualKeyCount;
    matches = (action) => action.actionId === "navigate-next";
  } else if (step.actionId === "type-character") {
    expected = 7;
    matches = (action) => /^type-character-[1-7]$/.test(action.actionId);
  } else {
    expected = 1;
    matches = (action) => action.actionId === step.actionId;
  }
  if (step.actionId === "navigate-next" && expected === 0) return { reason: "not performed" };
  if (step.actionId === "navigate-next" && (!Number.isInteger(expected) || expected < 0))
    return { reason: "missing key-count evidence" };
  const performed = commands.filter(matches);
  if (performed.length === 0) return { reason: "not performed" };
  const actions = rawActions.filter(matches);
  if (performed.length !== expected || actions.length !== expected)
    return { reason: "missing action evidence" };
  if (
    step.actionId === "navigate-next" &&
    actions.some((action, index) => action.ordinal !== index + 1)
  )
    return { reason: "missing key-order evidence" };
  if (
    step.actionId === "type-character" &&
    actions.some((action, index) => action.actionId !== `type-character-${index + 1}`)
  )
    return { reason: "missing character-order evidence" };
  const values = actions.map((action) => {
    const observation = session.collected?.observations?.find(
      (candidate) => candidate.actionUid === action.uid,
    );
    return observation?.delivery?.valid === true &&
      observation.state !== "failed" &&
      !observation.excluded
      ? observation.domCompletion?.inputToObservedDOMMs
      : null;
  });
  if (values.some((value) => !validMilliseconds(value)))
    return { reason: "missing DOM update evidence" };
  return { value: mean(values), valuesMs: values };
}

function comparison(sessions, scenario, step) {
  const results = providers.map((provider) => {
    const passes = sessions.filter(
      (session) =>
        session.provider === provider &&
        session.scenario === scenario &&
        session.passRole === "measured",
    );
    if (
      passes.length !== 5 ||
      new Set(passes.map((session) => session.sessionId)).size !== 5 ||
      passes.some((session) => !session.complete || !session.eligible || session.failures?.length)
    )
      return { provider, reason: "missing measured pass" };
    const values = passes.map((session) => passValue(session, step));
    const failed = values.find(({ reason }) => reason);
    return failed
      ? { provider, reason: failed.reason }
      : {
          provider,
          value: mean(values.map(({ value }) => value)),
          samples: values.map(({ valuesMs }, index) => ({
            sessionId: passes[index].sessionId,
            valuesMs,
          })),
        };
  });
  return results;
}

export function renderStandardReport({
  plan,
  sessions,
  source = {},
  sourceDrift = false,
  build = {},
  environment = {},
  stress = { rows: [], notes: [] },
}) {
  const omitted = [];
  const tableRow = (scenario, label, step, mounting = false) => {
    const title = workloads.find((workload) => workload.id === scenario)?.label ?? scenario;
    const values = comparison(sessions, scenario, step);
    if (values.some(({ reason }) => reason)) {
      omitted.push(
        `${title} ${mounting ? "mount" : label}: ${values
          .filter(({ reason }) => reason)
          .map(({ provider, reason }) => `${provider} ${reason}`)
          .join(", ")}`,
      );
      return null;
    }
    return `| ${title} |${mounting ? "" : ` ${label} |`}${values.map(({ value }) => ` ${value.toFixed(1)} |`).join("")}`;
  };
  const mounting = workloads
    .map(({ id, label }) => tableRow(id, label, { actionId: "mount" }, true))
    .filter(Boolean)
    .join("\n");
  const interactions = interactionSteps
    .map((step) => tableRow(step.scenario, step.label, step))
    .filter(Boolean)
    .join("\n");
  const stressLabels = {
    open: "Open",
    switch: "Switch panel (pointer)",
    mount: "Mount",
    "select-last": "Select last",
    "expand-last": "Expand last",
  };
  const stressRows = stress.rows.map(
    ({ label, metric, values }) =>
      `| ${label} | ${stressLabels[metric]} | ${values.map(({ meanMs }) => meanMs.toFixed(1)).join(" | ")} |`,
  );
  const stressSection = stressRows.length
    ? `\n\n## Large workloads\n\n| Workload | Measure | Starwind React | Base UI React | Ark UI React |\n| --- | --- | ---: | ---: | ---: |\n${stressRows.join("\n")}`
    : "";
  const stressNotes = stress.rows.length
    ? `\n- Large workloads use one excluded warmup and five fresh measured contexts per provider. Dialog opens beside 10,000 outside nodes; Navigation Menu switches between two 500-link panels; Tabs, Accordion, and Radio Group each contain 1,000 items, with all Tabs and Accordion panels retained. Navigation Menu uses trusted pointer entry; the other actions use trusted clicks. Each action ends at a checked DOM state. Mount rows run from React render to checked ready DOM. These values use native CPU and do not measure paint.\n- Large workload capture dates: ${[...new Map(stress.rows.map((row) => [row.workload, row])).values()].map((row) => `${row.label} ${row.recordedAt?.slice(0, 10) ?? "date unknown"}`).join("; ")}.${stress.notes.length ? ` ${stress.notes.join("; ")}` : ""}`
    : "";
  const omittedNote = omitted.length
    ? `\n- Omitted comparisons: ${omitted.join("; ")}. See the saved action records for counts and causes.`
    : "";
  return `# Runtime performance comparison\n\nEach provider and workload has one excluded warmup context and five measured fresh contexts. Each context mounts once and performs one complete task flow.\n\nValues are average milliseconds; lower is faster.\n\n## Mounting\n\nTime from React render to ready DOM.\n\n| Workload | Starwind React | Base UI React | Ark UI React |\n| --- | ---: | ---: | ---: |\n${mounting}\n\n## Interactions\n\nInput to resulting DOM update.\n\n| Workload | Action | Starwind React | Base UI React | Ark UI React |\n| --- | --- | ---: | ---: | ---: |\n${interactions}${stressSection}\n\n## Notes\n\n- Each value uses five measured passes. Filter and move-highlight values first average the seven characters or actual navigation keys within each pass, then give each pass equal weight. Navigation key counts can differ by provider.\n- Workloads: Menu has 20 actions; Select has 100 options; Combobox has 500 items; Submenu has eight parents with eight children each; each Select page control has 20 options.\n- Input-to-DOM includes observer checks and ends at a DOM condition. It does not measure painted pixels. Mount starts after module loading and excludes network and forced layout. Closed popup presence differs by provider.${omittedNote}\n- Captured ${environment.recordedAt?.slice(0, 10) ?? "date unknown"} with Chromium ${environment.browser ?? "unknown"} on ${environment.cpu ?? "unknown hardware"}. React ${build.dependencies?.versions?.react ?? "unknown"}, Base UI ${build.dependencies?.versions?.["@base-ui/react"] ?? "unknown"}, Ark UI React ${build.dependencies?.versions?.["@ark-ui/react"] ?? "unknown"}, and local Starwind source. Power source: ${environment.powerState ?? "unknown"}; display refresh rate: ${environment.displayRefreshRateHz ?? "unknown"}.\n- Captured source revision: \`${source.revision ?? "unknown"}\`; source inventory SHA-256: \`${source.inventory?.sha256 ?? "unknown"}\`. Current source ${sourceDrift ? "differs from" : "matches"} the capture. Saved run: \`${plan.runId}\`.${stressNotes}\n- [Measurements and capture details](./performance-evidence/${encodeURIComponent(plan.runId)}/README.md) contain the samples behind every comparison and the calculation method.\n`;
}

function publicCapture({ runId, source = {}, environment = {}, build = {} }) {
  const environmentKeys = [
    "recordedAt",
    "browser",
    "node",
    "pnpm",
    "os",
    "cpu",
    "logicalCpus",
    "memoryBytes",
    "viewport",
    "deviceScaleFactor",
    "actualDeviceScaleFactor",
    "cpuThrottleRate",
    "cpuLabel",
    "headed",
    "activePages",
    "powerState",
    "displayRefreshRateHz",
  ];
  return {
    runId,
    sourceRevision: source.revision ?? null,
    sourceInventorySha256: source.inventory?.sha256 ?? null,
    environment: Object.fromEntries(environmentKeys.map((key) => [key, environment[key] ?? null])),
    versions: build.dependencies?.versions ?? environment.versions?.versions ?? {},
  };
}

export function buildPublicEvidence({
  plan,
  sessions,
  source,
  environment,
  build,
  stress = { rows: [] },
}) {
  const nativeRows = [
    ...workloads.map(({ id, label }) => ({
      scenario: id,
      workload: label,
      actionId: "mount",
      action: "Mount",
    })),
    ...interactionSteps.map((step) => ({
      ...step,
      workload: workloads.find(({ id }) => id === step.scenario).label,
      action: step.label,
    })),
  ].flatMap((step) => {
    const values = comparison(sessions, step.scenario, step);
    if (values.some(({ reason }) => reason)) return [];
    return [
      {
        suite: "native",
        runId: plan.runId,
        workload: step.workload,
        action: step.action,
        values: values.map(({ provider, value, samples }) => ({
          provider,
          meanMs: value,
          samples,
        })),
      },
    ];
  });
  const captures = [publicCapture({ runId: plan.runId, source, environment, build })];
  for (const row of stress.rows) {
    if (captures.some(({ runId }) => runId === row.runId)) continue;
    captures.push(
      row.capture ??
        publicCapture({
          runId: row.runId,
          source: json(path.join(row.directory, "source.json")),
          environment: json(path.join(row.directory, "environment.json")),
          build: json(path.join(row.directory, "build.json")),
        }),
    );
  }
  return {
    schemaVersion: 1,
    protocol: {
      excludedWarmupsPerProviderWorkload: 1,
      measuredFreshContextsPerProviderWorkload: 5,
      unit: "milliseconds",
      aggregation:
        "Average valuesMs within each context, then average the five context means equally.",
      boundary: "Checked DOM completion; excludes paint. Mount starts after module loading.",
    },
    captures,
    rows: [
      ...nativeRows,
      ...stress.rows.map((row) => ({
        suite: "stress",
        runId: row.runId,
        workload: row.label,
        action: row.metric,
        values: row.values.map(({ provider, meanMs, samples }) => ({
          provider,
          meanMs,
          samples: samples.map((value, index) => ({
            sessionId: `${row.workload}/${provider}/${index + 1}`,
            valuesMs: [value],
          })),
        })),
      })),
    ],
  };
}

function writePublicEvidence(input, destination) {
  const directory = path.join(
    path.dirname(destination),
    "performance-evidence",
    encodeURIComponent(input.plan.runId),
  );
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, "measurements.json"),
    JSON.stringify(buildPublicEvidence(input), null, 2) + "\n",
  );
  writeFileSync(
    path.join(path.dirname(directory), "latest.json"),
    JSON.stringify({ runId: input.plan.runId }, null, 2) + "\n",
  );
  writeFileSync(
    path.join(directory, "README.md"),
    `# Performance evidence\n\n[Measurements](./measurements.json) contain the original timing values used by the [comparison report](../../runtime-performance-comparison.md), plus capture dates, environment details, provider versions, and source identities. These are extracted from validated saved captures; this export performs no browser measurements.\n\nEach provider and workload has one excluded warmup context and five measured fresh contexts. Every sample in this file belongs to a measured context. Average the values in each sample's \`valuesMs\` array, then average the five sample means equally to reproduce \`meanMs\`. The report rounds only the displayed result to one decimal place.\n\nMenu has 20 actions; Select has 100 options; Combobox has 500 items; Submenu has eight parents with eight children; each Select page control has 20 options. Dialog opens beside 10,000 outside nodes. Navigation Menu switches between two 500-link panels. Tabs, Accordion, and Radio Group each contain 1,000 items; Tabs and Accordion retain all panels.\n\nMount timing starts at React render after modules load. Interaction timing ends at a checked DOM state. Paint is outside both measurements. The captures use native CPU speed and one active page. Unknown host settings remain recorded as unknown. The source identities describe the captured implementation; later source changes do not alter these historical measurements.\n\nThe benchmark implementation lives under \`scripts/portable-runtime/runtime-performance\`. Run \`pnpm runtime:perf\` for a fresh native comparison with one warmup and five measurements, or \`pnpm runtime:perf:stress\` to refresh large workloads.\n`,
  );
}

export function loadReportStress(
  evidenceRoot = path.join(path.dirname(canonicalPath), "performance-evidence"),
  privateAcceptedPath = acceptedPath,
) {
  if (existsSync(privateAcceptedPath)) return loadAcceptedStress(privateAcceptedPath);
  const index = path.join(evidenceRoot, "latest.json");
  if (!existsSync(index)) return { rows: [], notes: [] };
  const { runId } = json(index);
  const evidence = json(path.join(evidenceRoot, encodeURIComponent(runId), "measurements.json"));
  if (evidence.schemaVersion !== 1) throw new Error("Unsupported public performance evidence.");
  return {
    notes: [],
    rows: evidence.rows
      .filter(({ suite }) => suite === "stress")
      .map((row) => {
        const capture = evidence.captures.find((entry) => entry.runId === row.runId);
        if (!capture) throw new Error("Saved stress capture identity is missing.");
        return {
          label: row.workload,
          workload: row.workload.toLowerCase().replaceAll(" ", "-"),
          metric: row.action,
          runId: row.runId,
          recordedAt: capture.environment.recordedAt,
          capture,
          values: row.values.map(({ provider, samples, meanMs }) => {
            const values = samples.map(({ valuesMs }) => mean(valuesMs));
            if (
              values.length !== 5 ||
              values.some((value) => !validMilliseconds(value)) ||
              mean(values) !== meanMs
            )
              throw new Error("Saved public stress measurements are invalid.");
            return { provider, samples: values, meanMs };
          }),
        };
      }),
  };
}

export function publishStandardReport(
  directory,
  destination = canonicalPath,
  { fromSavedRun = false } = {},
) {
  const check = checkEvidence(directory);
  const plan = json(path.join(directory, "plan.json"));
  const observations = json(path.join(directory, "observations.json"));
  const report = json(path.join(directory, "report.json"));
  const source = json(path.join(directory, "source.json"));
  const build = json(path.join(directory, "build.json"));
  const environment = json(path.join(directory, "environment.json"));
  const index = json(path.join(directory, "sessions/index.json"));
  const sessions = index.entries.map(({ file }) => json(path.join(directory, file)));
  const errors = validateStandardCapture({
    check,
    plan,
    observations,
    report,
    sessions,
    fromSavedRun,
  });
  if (errors.length) throw new Error(`Canonical report refused: ${errors.join("; ")}`);
  const input = {
    directory,
    plan,
    report,
    sessions,
    source,
    sourceDrift: check.sourceDrift,
    build,
    environment,
    stress: loadReportStress(),
  };
  const content = renderStandardReport(input);
  writePublicEvidence(input, destination);
  const staged = `${destination}.tmp`;
  writeFileSync(staged, content);
  renameSync(staged, destination);
  return destination;
}

export async function main(argv = process.argv.slice(2), run) {
  const { seed, fromRun } = parseStandardArgs(argv);
  const directory = fromRun
    ? path.resolve(fromRun)
    : (
        await (run ?? (await import("./runtime-performance/interactions/run.mjs")).runBenchmark)(
          parseArgs(["--capture", "--cpu", "1", "--seed", String(seed)]),
        )
      ).directory;
  const published = publishStandardReport(directory, canonicalPath, {
    fromSavedRun: Boolean(fromRun),
  });
  console.log(`Wrote ${published} from ${directory}`);
  return { directory, published };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error.stack ?? String(error));
    process.exitCode = 1;
  }
}
