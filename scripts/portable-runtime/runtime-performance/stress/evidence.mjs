import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { inventory } from "../interactions/build.mjs";
import { providers, stressPlan, workloads } from "./plan.mjs";
import { sessionErrors } from "./state.mjs";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const save = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
export const stressRunsRoot = path.resolve(
  import.meta.dirname,
  "../../../../.scratch/realistic-react-performance/stress-runs",
);
export const acceptedPath = path.join(stressRunsRoot, "accepted.json");

export function writeStressManifest(directory) {
  const names = readdirSync(directory).filter((name) => name !== "evidence-manifest.json");
  const manifest = inventory(directory, names);
  save(path.join(directory, "evidence-manifest.json"), manifest);
  return manifest;
}

export function checkStressRun(directory, { workload = null } = {}) {
  const errors = [];
  const manifestPath = path.join(directory, "evidence-manifest.json");
  if (!existsSync(manifestPath))
    return { internalValid: false, errors: ["stress manifest is missing"] };
  const manifest = read(manifestPath);
  const actual = inventory(
    directory,
    readdirSync(directory).filter((name) => name !== "evidence-manifest.json"),
  );
  if (JSON.stringify(actual) !== JSON.stringify(manifest))
    errors.push("stress evidence bytes or inventory changed");
  const plan = read(path.join(directory, "plan.json"));
  for (const name of ["source.json", "source-after.json", "build.json", "environment.json"])
    if (!existsSync(path.join(directory, name)))
      errors.push(`stress provenance is missing: ${name}`);
  if (!errors.some((error) => error.includes("provenance"))) {
    const source = read(path.join(directory, "source.json"));
    const after = read(path.join(directory, "source-after.json"));
    const build = read(path.join(directory, "build.json"));
    const environment = read(path.join(directory, "environment.json"));
    if (
      !source.revision ||
      !source.inventory?.sha256 ||
      JSON.stringify(source.inventory) !== JSON.stringify(after)
    )
      errors.push("stress source identity changed during capture");
    if (
      !build.bundles?.sha256 ||
      !build.dependencies?.frozenInputs?.sha256 ||
      !environment.browser ||
      !environment.versions
    )
      errors.push("stress build or host provenance is incomplete");
    if (
      !existsSync(path.join(directory, "dist")) ||
      JSON.stringify(build.bundles) !==
        JSON.stringify(inventory(path.join(directory, "dist"), ["."]))
    )
      errors.push("stress production bundle bytes changed");
    if (
      !existsSync(path.join(directory, "dependencies")) ||
      JSON.stringify(build.dependencies?.frozenInputs) !==
        JSON.stringify(
          inventory(path.join(directory, "dependencies"), [
            "package.json",
            "pnpm-lock.yaml",
            "pnpm-workspace.yaml",
          ]),
        )
    )
      errors.push("stress frozen dependency inputs changed");
  }
  const expected = stressPlan({ runId: plan.runId, selected: plan.selected });
  if (JSON.stringify(plan) !== JSON.stringify(expected))
    errors.push("stress plan differs from one-warmup/five-measured schedule");
  if (workload && !plan.selected.includes(workload))
    errors.push(`stress workload is absent from plan: ${workload}`);
  const result = read(path.join(directory, "result.json"));
  if (result.runId !== plan.runId || !result.sourceUnchanged)
    errors.push("stress run is incomplete or its source changed during capture");
  const plannedOrder = plan.sessions.map(({ sessionId }) => sessionId);
  if (
    JSON.stringify(result.actualOrder) !==
    JSON.stringify(plannedOrder.slice(0, result.actualOrder?.length))
  )
    errors.push("stress actual order differs from plan");
  if (
    !workload &&
    (result.actualOrder?.length !== plannedOrder.length ||
      !result.complete ||
      result.failures?.length)
  )
    errors.push("stress run has failed or missing sessions");
  const relevant = workload
    ? plan.sessions.filter((session) => session.workload === workload)
    : plan.sessions;
  if (workload && relevant.some(({ sessionId }) => !result.actualOrder?.includes(sessionId)))
    errors.push(`stress workload has missing actual passes: ${workload}`);
  if (
    workload &&
    result.failures?.some(({ sessionId }) =>
      relevant.some((session) => session.sessionId === sessionId),
    )
  )
    errors.push(`stress workload has recorded failures: ${workload}`);
  const files = readdirSync(path.join(directory, "sessions"))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const plannedFiles = new Set(
    plan.sessions.map(({ orderIndex }) => `${String(orderIndex).padStart(3, "0")}.json`),
  );
  if (files.some((file) => !plannedFiles.has(file)))
    errors.push("stress sessions contain an unplanned file");
  if (!workload && files.length !== plan.sessions.length)
    errors.push("stress session count differs from plan");
  const sessions = [];
  for (const expectedSession of relevant) {
    const file = path.join(
      directory,
      "sessions",
      `${String(expectedSession.orderIndex).padStart(3, "0")}.json`,
    );
    if (!existsSync(file)) {
      errors.push(`missing stress session ${expectedSession.sessionId}`);
      continue;
    }
    const session = read(file);
    sessions.push(session);
    for (const [key, expectedValue] of Object.entries(expectedSession))
      if (session[key] !== expectedValue)
        errors.push(`stress identity mismatch: ${expectedSession.sessionId}/${key}`);
    if (
      session.excluded !== (session.passRole === "warmup") ||
      session.eligible !== (session.passRole === "measured")
    )
      errors.push(`stress exclusion mismatch: ${expectedSession.sessionId}`);
    if (!session.complete || session.failures?.length)
      errors.push(`failed stress session: ${expectedSession.sessionId}`);
    errors.push(
      ...sessionErrors(session).map((reason) => `${expectedSession.sessionId}: ${reason}`),
    );
  }
  return { internalValid: errors.length === 0, errors, manifest, plan, result, sessions };
}

export function acceptStressRun(directory, file = acceptedPath) {
  const plan = read(path.join(directory, "plan.json"));
  const previous = existsSync(file) ? read(file) : { schemaVersion: 1, workloads: {} };
  const next = { schemaVersion: 1, workloads: { ...previous.workloads } };
  const accepted = [];
  for (const workload of plan.selected) {
    const checked = checkStressRun(directory, { workload });
    if (!checked.internalValid) continue;
    next.workloads[workload] = {
      runId: plan.runId,
      manifestSha256: sha256(path.join(directory, "evidence-manifest.json")),
    };
    accepted.push(workload);
  }
  if (!accepted.length)
    throw new Error("Stress evidence refused: no complete three-provider workload.");
  const temporary = `${file}.tmp`;
  save(temporary, next);
  renameSync(temporary, file);
  return { ...next, newlyAccepted: accepted };
}

export function loadAcceptedStress(file = acceptedPath) {
  if (!existsSync(file)) return { rows: [], notes: [], accepted: null };
  const accepted = read(file);
  if (
    accepted.schemaVersion !== 1 ||
    Object.keys(accepted.workloads ?? {}).some(
      (id) => !workloads.some((workload) => workload.id === id),
    )
  )
    throw new Error("Accepted stress manifest has an unknown workload or schema.");
  const rows = [];
  const notes = [];
  for (const workload of workloads) {
    const entry = accepted.workloads[workload.id];
    if (!entry) {
      notes.push(`${workload.label}: no accepted three-provider comparison`);
      continue;
    }
    const directory = path.join(path.dirname(file), entry.runId);
    const checked = checkStressRun(directory, { workload: workload.id });
    if (
      !checked.internalValid ||
      sha256(path.join(directory, "evidence-manifest.json")) !== entry.manifestSha256 ||
      !checked.plan.selected.includes(workload.id)
    )
      throw new Error(`Accepted stress evidence is invalid: ${workload.id}`);
    for (const metric of workload.metrics) {
      const values = providers.map((provider) => {
        const sessions = checked.sessions.filter(
          (session) =>
            session.workload === workload.id &&
            session.provider === provider &&
            session.passRole === "measured",
        );
        if (sessions.length !== 5)
          throw new Error(`Missing measured stress passes: ${workload.id}/${provider}`);
        const samples = sessions.map((session) =>
          metric === "mount" ? session.mount?.durationMs : session.action?.durationMs,
        );
        if (samples.some((sample) => !Number.isFinite(sample) || sample < 0))
          throw new Error(`Invalid stress samples: ${workload.id}/${provider}/${metric}`);
        return { provider, samples, meanMs: samples.reduce((sum, sample) => sum + sample, 0) / 5 };
      });
      rows.push({
        workload: workload.id,
        label: workload.label,
        metric,
        values,
        runId: entry.runId,
        recordedAt: checked.result.recordedAt,
        directory,
      });
    }
  }
  return { rows, notes, accepted };
}
