import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL("..", import.meta.url));
const PLAN_DIRECTORY = "node_modules/.cache/starwind-release/publication-plans";
const VUE_PACKAGE = "@starwind-ui/vue";

function planFile(repoRoot, head) {
  if (typeof head !== "string" || !head || head === "." || head === "..") {
    throw new Error("Publication planning requires an exact release commit.");
  }
  return path.join(repoRoot, PLAN_DIRECTORY, `${encodeURIComponent(head)}.json`);
}

function createSnapshot(packageManifests, tag) {
  return packageManifests.map(({ entry, manifest }) => ({
    name: entry.name,
    version: manifest.version,
    tag: entry.tag ?? tag,
  }));
}

function validatePlan(plan, head, snapshot) {
  if (plan?.head !== head || JSON.stringify(plan.snapshot) !== JSON.stringify(snapshot)) {
    throw new Error("The publication plan does not match this release commit and snapshot.");
  }
  if (plan.vueLatest !== null && typeof plan.vueLatest !== "string") {
    throw new Error("The publication plan contains an invalid Vue latest baseline.");
  }
  let previousIndex = -1;
  if (!Array.isArray(plan.packages)) {
    throw new Error("The publication plan packages must be an ordered subset of its snapshot.");
  }
  for (const entry of plan.packages) {
    const index = snapshot.findIndex(
      (candidate) => JSON.stringify(candidate) === JSON.stringify(entry),
    );
    if (index <= previousIndex) {
      throw new Error("The publication plan packages must be an ordered subset of its snapshot.");
    }
    previousIndex = index;
  }
  return plan;
}

export async function loadPublicationPlan({ head, packageManifests, tag, repoRoot = ROOT_DIR }) {
  let plan;
  try {
    plan = JSON.parse(await readFile(planFile(repoRoot, head), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error("The original publication plan is missing.", { cause: error });
    }
    throw new Error("The original publication plan is invalid.", { cause: error });
  }
  return validatePlan(plan, head, createSnapshot(packageManifests, tag));
}

function isMissing(result) {
  return /(?:\bE404\b|404 Not Found)/i.test(`${result.stderr}\n${result.stdout}`);
}

async function exactVersionExists(entry, registry) {
  const spec = `${entry.name}@${entry.version}`;
  const result = await registry.capture("npm", ["view", spec, "version", "--json"]);
  if (result.code !== 0) {
    if (isMissing(result)) return false;
    throw new Error(`${spec} could not be checked on npm: ${result.stderr || result.stdout}`);
  }
  let version;
  try {
    version = JSON.parse(result.stdout);
  } catch {
    throw new Error(`${spec} returned invalid version JSON.`);
  }
  if (version !== entry.version) {
    throw new Error(`${spec} resolved to unexpected version ${JSON.stringify(version)}.`);
  }
  return true;
}

async function readVueLatest(registry) {
  const result = await registry.capture("npm", ["view", VUE_PACKAGE, "dist-tags", "--json"]);
  if (result.code !== 0) {
    if (isMissing(result)) return null;
    throw new Error(`Vue latest could not be checked on npm: ${result.stderr || result.stdout}`);
  }
  let tags;
  try {
    tags = JSON.parse(result.stdout);
  } catch {
    throw new Error("Vue dist-tags returned invalid JSON.");
  }
  if (
    !tags ||
    typeof tags !== "object" ||
    Array.isArray(tags) ||
    (tags.latest !== undefined && typeof tags.latest !== "string")
  ) {
    throw new Error("Vue dist-tags returned an invalid latest baseline.");
  }
  return tags.latest ?? null;
}

async function validateRecovery(plan, registry, resumeFrom) {
  let firstMissingIndex = plan.packages.length;
  for (const [index, entry] of plan.packages.entries()) {
    const exists = await exactVersionExists(entry, registry);
    if (!exists && firstMissingIndex === plan.packages.length) firstMissingIndex = index;
    if (exists && firstMissingIndex < index) {
      throw new Error(
        "Published packages do not form an exact prefix of the original publication plan.",
      );
    }
  }
  if (plan.packages.length && firstMissingIndex === plan.packages.length) {
    throw new Error("All planned versions are already published. Run pnpm release:finalize.");
  }
  const firstMissing = plan.packages[firstMissingIndex]?.name;
  if (resumeFrom && resumeFrom !== firstMissing) {
    throw new Error(
      `--resume-from must name the first missing package: ${firstMissing ?? "none"}.`,
    );
  }
  if (!resumeFrom && firstMissingIndex > 0) {
    throw new Error(`Resume the original publication with --resume-from ${firstMissing}.`);
  }
}

export async function preparePublicationPlan({
  head,
  packageManifests,
  tag,
  registry,
  repoRoot = ROOT_DIR,
  dryRun = false,
  resumeFrom,
}) {
  if (dryRun && resumeFrom) throw new Error("--resume-from is available only for a real publish.");
  if (!registry?.capture)
    throw new Error("Publication planning requires a read-only npm registry client.");
  const file = planFile(repoRoot, head);
  const snapshot = createSnapshot(packageManifests, tag);
  if (!dryRun) {
    let saved;
    try {
      saved = await loadPublicationPlan({ head, packageManifests, tag, repoRoot });
    } catch (error) {
      if (resumeFrom || error.cause?.code !== "ENOENT") throw error;
    }
    if (saved) {
      await validateRecovery(saved, registry, resumeFrom);
      return saved;
    }
  }

  const packages = [];
  for (const entry of snapshot) {
    if (!(await exactVersionExists(entry, registry))) packages.push(entry);
  }
  const vueLatest = packages.some(({ name }) => name === VUE_PACKAGE)
    ? await readVueLatest(registry)
    : null;
  const plan = { head, snapshot, packages, vueLatest };
  if (!dryRun) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(plan, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  }
  return plan;
}
