import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { inventory, sourceInventory } from "./build.mjs";
import { buildCaptureSchedule, buildLegacyCaptureSchedule } from "./plan.mjs";
import { buildCaptureReport, renderCaptureReport } from "./report.mjs";
import {
  buildCaptureReport as buildLegacyCaptureReport,
  renderCaptureReport as renderLegacyCaptureReport,
} from "./legacy-report.mjs";

const json = (filename) => JSON.parse(readFileSync(filename, "utf8"));
const hash = (content) => createHash("sha256").update(content).digest("hex");
const normalized = (value) => JSON.stringify(value, null, 2) + "\n";
const allowedStates = new Set(["measured", "censored", "unavailable", "failed"]);

export const sessionContentMatches = (entry, content) => hash(content) === entry.sha256;

const expectedEligibleActions = (scenario, actionIds) => {
  const exact = (expected) => JSON.stringify(actionIds) === JSON.stringify(expected);
  if (scenario === "menu-20") return exact(["open", "choose", "reopen", "escape"]);
  const validNavigation = (prefix) => {
    const tail = actionIds.slice(prefix.length);
    const navigation = tail.filter((id) => id === "navigate-next");
    return (
      navigation.length >= 1 &&
      navigation.length <= 10 &&
      JSON.stringify(actionIds) === JSON.stringify([...prefix, ...navigation, "choose", "submit"])
    );
  };
  if (scenario === "select-100") return validNavigation(["open"]);
  if (scenario === "submenu-8x8") return exact(["open", "hover-open", "choose"]);
  if (scenario.startsWith("select-page-")) return validNavigation(["open", "escape", "reopen"]);
  if (scenario === "combobox-500") {
    const typed = actionIds.slice(0, 7);
    const tail = actionIds.slice(7);
    const navigation = tail.filter((id) => id === "navigate-next");
    return (
      JSON.stringify(typed) ===
        JSON.stringify(Array.from({ length: 7 }, (_, index) => `type-character-${index + 1}`)) &&
      navigation.length <= 10 &&
      JSON.stringify(tail) === JSON.stringify([...navigation, "choose", "submit"])
    );
  }
  return false;
};

export function writeSessionEvidence(directory, cell) {
  const sessionsDirectory = path.join(directory, "sessions");
  mkdirSync(sessionsDirectory, { recursive: true });
  const file = `${String(cell.orderIndex).padStart(3, "0")}-${cell.provider}-${cell.scenario}.json`;
  const content = normalized(cell);
  writeFileSync(path.join(sessionsDirectory, file), content);
  return {
    runId: cell.runId,
    sessionId: cell.sessionId,
    provider: cell.provider,
    scenario: cell.scenario,
    passRole: cell.passRole,
    sessionIndex: cell.sessionIndex,
    position: cell.position,
    orderIndex: cell.orderIndex,
    cpu: cell.cpu,
    complete: cell.complete,
    eligible: cell.eligible,
    failureCount: cell.failures.length,
    file: `sessions/${file}`,
    sha256: hash(content),
  };
}

export function writeSessionIndex(directory, entries) {
  mkdirSync(path.join(directory, "sessions"), { recursive: true });
  writeFileSync(
    path.join(directory, "sessions/index.json"),
    normalized({ schemaVersion: 1, entries }),
  );
}

export function validateEvidenceRecords({ plan, observations, sessionIndex, sessions }) {
  const errors = [];
  const planned = plan.cells ?? [];
  const entries = sessionIndex.entries ?? [];
  if (plan.runId !== observations.runId) errors.push("plan and observations use different run IDs");
  if (plan.mode !== observations.mode || plan.cpu !== observations.cpu)
    errors.push("plan and observations use different run settings");
  if (plan.mode === "smoke" && !plan.modeLabel?.includes("not a publication capture"))
    errors.push("smoke evidence has a false publication label");
  if (plan.mode === "trace" && !plan.modeLabel?.includes("excluded"))
    errors.push("trace evidence is missing its exclusion label");
  if (plan.mode === "capture") {
    const expectedSchedule = (
      plan.schemaVersion === 2
        ? buildLegacyCaptureSchedule(plan.seed)
        : buildCaptureSchedule(plan.seed)
    ).map((cell) => ({
      ...cell,
      cpu: plan.cpu,
    }));
    if (JSON.stringify(planned) !== JSON.stringify(expectedSchedule))
      errors.push("capture schedule differs from its seed and matrix");
    if (
      plan.schemaVersion !== 2 &&
      (plan.sessionsPerCell !== 6 || plan.measuredPerCell !== 5 || plan.warmupsPerCell !== 1)
    )
      errors.push("capture sample budget differs from one warmup and five measured passes");
  }
  if (plan.expectedContexts !== planned.length) errors.push("plan context count is inconsistent");
  if (entries.length !== planned.length) errors.push("session index omits planned contexts");
  if (sessions.length !== entries.length) errors.push("session files are missing");
  for (const [label, values] of [
    ["planned session", planned.map(({ sessionId }) => sessionId)],
    ["indexed session", entries.map(({ sessionId }) => sessionId)],
    ["session file", entries.map(({ file }) => file)],
  ])
    if (new Set(values).size !== values.length) errors.push(`${label} identities are duplicated`);
  const plannedIds = planned.map(({ sessionId }) => sessionId);
  const indexedIds = entries.map(({ sessionId }) => sessionId);
  if (plannedIds.some((id) => !indexedIds.includes(id)))
    errors.push("session index differs from plan");
  if (JSON.stringify(observations.actualOrder ?? []) !== JSON.stringify(indexedIds))
    errors.push("actual session order differs from the index");
  if (
    JSON.stringify((observations.cells ?? []).map(({ sessionId }) => sessionId)) !==
    JSON.stringify(indexedIds)
  )
    errors.push("observation session summaries differ from the index");

  const plannedById = new Map(planned.map((cell) => [cell.sessionId, cell]));
  const entryById = new Map(entries.map((entry) => [entry.sessionId, entry]));
  for (const session of sessions) {
    const expected = plannedById.get(session.sessionId);
    const entry = entryById.get(session.sessionId);
    if (!expected) {
      errors.push(`session ${session.sessionId} is not planned`);
      continue;
    }
    for (const field of [
      "runId",
      "provider",
      "scenario",
      plan.schemaVersion === 2 ? "blockId" : "passRole",
      "sessionIndex",
      "position",
    ])
      if (session[field] !== (field === "runId" ? plan.runId : expected[field]))
        errors.push(`session ${session.sessionId} has mismatched ${field}`);
    if (
      !entry ||
      entry.complete !== session.complete ||
      entry.eligible !== session.eligible ||
      (plan.schemaVersion !== 2 && entry.passRole !== session.passRole) ||
      entry.failureCount !== session.failures?.length
    )
      errors.push(`session ${session.sessionId} differs from its index summary`);
    const flowIds =
      plan.schemaVersion === 2
        ? (plan.flows ?? []).map(({ flowId }) => flowId)
        : [expected.flow.flowId];
    if (JSON.stringify(session.flows?.map(({ flowId }) => flowId)) !== JSON.stringify(flowIds))
      errors.push(`session ${session.sessionId} has missing or reordered flows`);
    const phaseByFlow = new Map(
      (plan.schemaVersion === 2 ? plan.flows : [expected.flow]).map((flow) => [
        flow.flowId,
        flow.flowPhase,
      ]),
    );
    for (const flow of session.flows ?? [])
      if (phaseByFlow.get(flow.flowId) !== flow.flowPhase)
        errors.push(`session ${session.sessionId} has mismatched flow phase`);
    if (plan.schemaVersion !== 2 && session.flows?.[0]?.excluded !== expected.flow.excluded)
      errors.push(`session ${session.sessionId} has mismatched flow exclusion`);
    const actions = session.raw?.actions ?? [];
    const actionIds = actions.map(({ uid }) => uid);
    if (new Set(actionIds).size !== actionIds.length)
      errors.push(`session ${session.sessionId} has duplicate action IDs`);
    if (actions.some(({ flowId }) => !flowIds.includes(flowId)))
      errors.push(`session ${session.sessionId} has an action outside its flow plan`);
    const commands = (session.flows ?? []).flatMap(({ commands = [] }) => commands);
    const commandIds = commands.map(({ uid }) => uid);
    if (new Set(commandIds).size !== commandIds.length)
      errors.push(`session ${session.sessionId} has duplicate command IDs`);
    if (commands.some(({ uid }) => !actions.some((action) => action.uid === uid)))
      errors.push(`session ${session.sessionId} has a command absent from raw actions`);
    if (
      actions.some(
        ({ uid, actionId }) =>
          !commands.some((command) => command.uid === uid) &&
          !["sweep", "traverse"].includes(actionId),
      )
    )
      errors.push(`session ${session.sessionId} has a raw action absent from its flow commands`);
    if (
      session.eligible &&
      (session.flows ?? []).some(
        (flow) =>
          !expectedEligibleActions(
            session.scenario,
            (flow.commands ?? []).map(({ actionId }) => actionId),
          ),
      )
    )
      errors.push(`session ${session.sessionId} has an incomplete eligible action sequence`);
    const collected = session.collected?.observations ?? [];
    if (collected.length !== actions.filter(({ kind }) => kind !== "pointer").length)
      errors.push(`session ${session.sessionId} omits collected actions`);
    if (collected.some(({ state }) => !allowedStates.has(state)))
      errors.push(`session ${session.sessionId} has an invalid observation state`);
    for (const observation of collected) {
      const action = actions.find(({ uid }) => uid === observation.actionUid);
      if (!action) errors.push(`session ${session.sessionId} has an unowned observation`);
      else if (
        observation.actionId !== action.actionId ||
        observation.ordinal !== (action.ordinal ?? 0) ||
        observation.flowId !== (action.flowId ?? action.flowPhase) ||
        observation.flowPhase !== action.flowPhase
      )
        errors.push(`session ${session.sessionId} has mismatched observation action metadata`);
      const mustExclude =
        plan.mode === "trace" ||
        (plan.schemaVersion === 2
          ? action?.flowPhase === "warmup"
          : expected.passRole === "warmup");
      if (Boolean(observation.excluded) !== mustExclude)
        errors.push(`session ${session.sessionId} has an invalid phase exclusion`);
    }
    const expectedEligible =
      session.complete &&
      session.failures?.length === 0 &&
      observations.calibrationPassed &&
      plan.mode !== "trace" &&
      (plan.schemaVersion === 2 || expected.passRole !== "warmup");
    if (session.eligible !== expectedEligible)
      errors.push(`session ${session.sessionId} has a false eligibility state`);
  }
  const shouldBeComplete =
    sessions.length === planned.length && sessions.every(({ complete }) => complete);
  if (observations.complete !== shouldBeComplete)
    errors.push("run completeness does not match its session records");
  if (plan.schemaVersion !== 2) {
    const shouldBeEligible =
      plan.mode !== "trace" &&
      shouldBeComplete &&
      sessions.every(({ passRole, eligible }) => passRole === "warmup" || eligible);
    if (observations.eligible !== shouldBeEligible)
      errors.push("run eligibility does not match its measured passes");
  }
  if (plan.mode === "capture" && sessions.some(({ trace }) => trace))
    errors.push("capture evidence includes a diagnostic trace");
  for (const session of sessions)
    for (const failure of session.failures ?? [])
      if (
        !(observations.failures ?? []).some(
          (candidate) =>
            candidate.sessionId === session.sessionId &&
            candidate.category === failure.category &&
            candidate.message === failure.message,
        )
      )
        errors.push(`session ${session.sessionId} failure is absent from the run index`);
  return errors;
}

export function validateCaptureReport({ plan, observations, sessions, report, markdown }) {
  const errors = [];
  const expected =
    plan.schemaVersion === 2
      ? buildLegacyCaptureReport(plan, observations, sessions)
      : buildCaptureReport(plan, observations, sessions);
  if (JSON.stringify(report) !== JSON.stringify(expected))
    errors.push("capture report differs from its session records");
  if (
    markdown !==
    (plan.schemaVersion === 2 ? renderLegacyCaptureReport(expected) : renderCaptureReport(expected))
  )
    errors.push("capture Markdown differs from its session records");
  return errors;
}

const visitFiles = (directory, relative = "") => {
  const files = [];
  for (const name of readdirSync(path.join(directory, relative)).sort()) {
    const child = path.join(relative, name);
    if (child === "evidence-manifest.json") continue;
    const full = path.join(directory, child);
    if (statSync(full).isDirectory()) files.push(...visitFiles(directory, child));
    else files.push(child.split(path.sep).join("/"));
  }
  return files;
};

export function writeEvidenceManifest(directory) {
  const files = visitFiles(directory).map((file) => ({
    file,
    sha256: hash(readFileSync(path.join(directory, file))),
  }));
  writeFileSync(
    path.join(directory, "evidence-manifest.json"),
    normalized({ schemaVersion: 1, files }),
  );
  return files;
}

export function checkEvidence(directory) {
  const root = path.resolve(directory);
  const errors = [];
  for (const file of [
    "plan.json",
    "observations.json",
    "source.json",
    "source-final.json",
    "build.json",
    "environment.json",
    "calibration.json",
    "failures.json",
    "README.md",
    "evidence-manifest.json",
    "sessions/index.json",
  ])
    if (!existsSync(path.join(root, file))) errors.push(`missing ${file}`);
  if (existsSync(path.join(root, "plan.json"))) {
    const preliminaryPlan = json(path.join(root, "plan.json"));
    if (preliminaryPlan.mode === "capture" && !existsSync(path.join(root, "report.json")))
      errors.push("missing report.json");
  }
  if (errors.length) return { internalValid: false, sourceDrift: null, errors };
  const manifest = json(path.join(root, "evidence-manifest.json"));
  const manifestNames = (manifest.files ?? []).map(({ file }) => file).sort();
  const actualNames = visitFiles(root).sort();
  if (JSON.stringify(manifestNames) !== JSON.stringify(actualNames))
    errors.push("manifest file inventory differs from the run directory");
  for (const entry of manifest.files ?? []) {
    const filename = path.join(root, entry.file);
    if (!existsSync(filename)) errors.push(`missing manifest file ${entry.file}`);
    else if (hash(readFileSync(filename)) !== entry.sha256)
      errors.push(`hash mismatch for ${entry.file}`);
  }
  const plan = json(path.join(root, "plan.json"));
  const observations = json(path.join(root, "observations.json"));
  const sessionIndex = json(path.join(root, "sessions/index.json"));
  const sessions = [];
  for (const entry of sessionIndex.entries ?? []) {
    const filename = path.join(root, entry.file);
    if (!existsSync(filename)) continue;
    const content = readFileSync(filename);
    if (!sessionContentMatches(entry, content))
      errors.push(`session hash mismatch for ${entry.sessionId}`);
    const session = JSON.parse(content);
    sessions.push({
      runId: session.runId,
      sessionId: session.sessionId,
      provider: session.provider,
      scenario: session.scenario,
      blockId: session.blockId,
      passRole: session.passRole,
      sessionIndex: session.sessionIndex,
      position: session.position,
      complete: session.complete,
      eligible: session.eligible,
      failures: session.failures,
      flows: (session.flows ?? []).map(({ flowId, flowPhase, excluded, commands }) => ({
        flowId,
        flowPhase,
        excluded,
        commands: (commands ?? []).map(({ uid, actionId, kind }) => ({ uid, actionId, kind })),
      })),
      raw: {
        mount: session.raw?.mount ?? null,
        actions: (session.raw?.actions ?? []).map(
          ({ uid, flowId, flowPhase, actionId, ordinal, kind }) => ({
            uid,
            flowId,
            flowPhase,
            actionId,
            ordinal,
            kind,
          }),
        ),
      },
      collected: {
        observations: (session.collected?.observations ?? []).map(
          ({
            actionUid,
            actionId,
            ordinal,
            flowId,
            flowPhase,
            state,
            excluded,
            durationMs,
            domCompletion,
            delivery,
          }) => ({
            actionUid,
            actionId,
            ordinal,
            flowId,
            flowPhase,
            state,
            excluded,
            durationMs,
            domCompletion,
            delivery,
          }),
        ),
      },
      trace: session.trace ? true : null,
    });
  }
  errors.push(...validateEvidenceRecords({ plan, observations, sessionIndex, sessions }));
  const source = json(path.join(root, "source.json"));
  const finalSource = json(path.join(root, "source-final.json"));
  if (observations.complete && source.inventory?.sha256 !== finalSource.sha256)
    errors.push("saved source changed during the run");
  if (observations.sourceUnchanged !== (source.inventory?.sha256 === finalSource.sha256))
    errors.push("source stability flag is false");
  const build = json(path.join(root, "build.json"));
  const frozenInputs = inventory(path.join(root, "dependencies"), [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
  ]);
  if (frozenInputs.sha256 !== build.dependencies?.frozenInputs?.sha256)
    errors.push("frozen dependency inputs differ from the build record");
  if (inventory(path.join(root, "dist"), ["."]).sha256 !== build.bundles?.sha256)
    errors.push("production bundle inventory differs from the build record");
  if (plan.mode === "capture") {
    const report = json(path.join(root, "report.json"));
    errors.push(
      ...validateCaptureReport({
        plan,
        observations,
        sessions,
        report,
        markdown: readFileSync(path.join(root, "README.md"), "utf8"),
      }),
    );
  }
  const current = sourceInventory();
  return {
    internalValid: errors.length === 0,
    sourceDrift: current.sha256 !== source.inventory?.sha256,
    savedSourceSha256: source.inventory?.sha256,
    currentSourceSha256: current.sha256,
    mode: plan.mode,
    errors,
  };
}
