import { execFile } from "node:child_process";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import semver from "semver";

import type {
  PrimitiveVendoringArtifact,
  PrimitiveVendoringArtifacts,
  PrimitiveVersionManifest,
} from "./generate-cli-registry.js";
import {
  aggregateVersionIntents,
  applyVersionIntents,
  assertSafeIntentFile,
  isNodeError,
  isPlainObject,
  resolveVersionIntentDirectory,
  sortRecord,
  stageVersionIntents,
} from "./release-intent-utils.js";

export type PrimitiveVersionBump = "minor" | "patch";

export type PrimitiveVersionIntent = {
  primitives: Record<string, PrimitiveVersionBump>;
};

export type PrimitiveReleaseSnapshot = {
  artifacts: PrimitiveVendoringArtifacts;
  fragments: Record<string, PrimitiveVersionIntent>;
  manifest: PrimitiveVersionManifest;
  starwindChangesets: string[];
};

export type PrimitiveVersionPlan = {
  fragments: string[];
  versions: Record<string, { bump: PrimitiveVersionBump; from: string; to: string }>;
};

const execFileAsync = promisify(execFile);
const RELEASE_MANAGED_PACKAGES = new Set([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
]);

export const PRIMITIVE_VERSION_FRAGMENT_DIR = ".changeset/primitive-components";
export const STAGED_PRIMITIVE_VERSION_FRAGMENT_DIR = ".primitive-component-intents";
export const PRIMITIVE_VERSION_MANIFEST = "packages/cli/registry/primitive-versions.json";
export const PRIMITIVE_REGISTRY_ARTIFACT =
  "packages/cli/src/registry/primitive-vendoring-artifacts.json";

export function parsePrimitiveVersionIntent(
  value: unknown,
  source: string,
  knownPrimitives: ReadonlySet<string>,
): PrimitiveVersionIntent {
  if (!isPlainObject(value) || Object.keys(value).length !== 1 || !("primitives" in value)) {
    throw new Error(`${source} must contain only a primitives object.`);
  }
  if (!isPlainObject(value.primitives)) {
    throw new Error(`${source} primitives must be an object.`);
  }
  const entries = Object.entries(value.primitives);
  if (entries.length === 0) throw new Error(`${source} must declare at least one primitive.`);

  const primitives: Record<string, PrimitiveVersionBump> = {};
  for (const [primitive, bump] of entries.sort(([left], [right]) => left.localeCompare(right))) {
    if (!knownPrimitives.has(primitive)) {
      throw new Error(`${source} references unknown primitive "${primitive}".`);
    }
    if (bump !== "patch" && bump !== "minor") {
      throw new Error(`${source} primitive "${primitive}" bump must be patch or minor.`);
    }
    primitives[primitive] = bump;
  }
  return { primitives };
}

export function aggregatePrimitiveVersionIntents(
  fragments: Record<string, PrimitiveVersionIntent>,
): Record<string, PrimitiveVersionBump> {
  return aggregateVersionIntents(
    Object.fromEntries(
      Object.entries(fragments).map(([file, intent]) => [file, intent.primitives]),
    ),
  );
}

export function applyPrimitiveVersionIntents(
  currentVersions: Record<string, string>,
  intents: Record<string, PrimitiveVersionBump>,
): Record<string, string> {
  return applyVersionIntents({
    currentVersions,
    intents,
    label: "Primitive",
    validateNext(name, _current, next) {
      if (semver.major(next) !== 0) {
        throw new Error(`Primitive "${name}" must remain below 1.0.0 during Runtime beta.`);
      }
    },
  });
}

export function createPrimitiveArtifactFingerprint(
  artifacts: readonly PrimitiveVendoringArtifact[],
): string {
  const normalized = [...structuredClone(artifacts)]
    .sort((left, right) => left.framework.localeCompare(right.framework))
    .map((artifact) => {
      const value = { ...artifact } as Partial<PrimitiveVendoringArtifact>;
      delete value.version;
      for (const requirement of value.packageRequirements ?? []) {
        if (RELEASE_MANAGED_PACKAGES.has(requirement.name)) {
          requirement.range = "<release-managed>";
        }
      }
      return value;
    });
  return JSON.stringify(normalized);
}

export function validatePrimitiveVersionPullRequest(options: {
  base: PrimitiveReleaseSnapshot;
  head: PrimitiveReleaseSnapshot;
}): {
  addedPrimitives?: string[];
  changedPrimitives?: string[];
  mode: "intent" | "version";
  versionedPrimitives?: string[];
} {
  validateSnapshot(options.base, "base");
  validateSnapshot(options.head, "head");

  const removedManifestPrimitives = Object.keys(options.base.manifest.primitives).filter(
    (primitive) => options.head.manifest.primitives[primitive] === undefined,
  );
  if (removedManifestPrimitives.length > 0) {
    throw new Error(
      `Removing vendorable primitives is unsupported: ${removedManifestPrimitives.join(", ")}.`,
    );
  }

  const baseFragmentNames = Object.keys(options.base.fragments).sort();
  const headFragmentNames = Object.keys(options.head.fragments).sort();
  const removedFragments = baseFragmentNames.filter((file) => !options.head.fragments[file]);
  const addedFragments = headFragmentNames.filter((file) => !options.base.fragments[file]);
  const modifiedFragments = baseFragmentNames.filter(
    (file) =>
      options.head.fragments[file] &&
      JSON.stringify(options.head.fragments[file]) !== JSON.stringify(options.base.fragments[file]),
  );
  const existingVersionChanges = Object.keys(options.base.manifest.primitives).filter(
    (primitive) =>
      options.head.manifest.primitives[primitive] !== options.base.manifest.primitives[primitive],
  );
  const versionMode = removedFragments.length > 0 || existingVersionChanges.length > 0;

  if (versionMode) {
    if (headFragmentNames.length > 0 || addedFragments.length > 0 || modifiedFragments.length > 0) {
      throw new Error(
        "Version Packages PR must consume every primitive version intent without adding or modifying fragments.",
      );
    }
    if (removedFragments.length !== baseFragmentNames.length) {
      throw new Error("Version Packages PR must consume every pending primitive version intent.");
    }
    assertArtifactSourcesEqual(options.base.artifacts, options.head.artifacts);
    const aggregated = aggregatePrimitiveVersionIntents(options.base.fragments);
    const expected = applyPrimitiveVersionIntents(options.base.manifest.primitives, aggregated);
    assertManifestMetadataEqual(options.base.manifest, options.head.manifest);
    assertSameKeys(expected, options.head.manifest.primitives, "primitive version manifest");
    for (const [primitive, expectedVersion] of Object.entries(expected)) {
      const actual = options.head.manifest.primitives[primitive];
      if (actual !== expectedVersion) {
        throw new Error(
          `Version Packages PR expected ${primitive}@${expectedVersion}, received ${actual ?? "missing"}.`,
        );
      }
    }
    return { mode: "version", versionedPrimitives: Object.keys(aggregated).sort() };
  }

  if (removedFragments.length > 0 || modifiedFragments.length > 0) {
    throw new Error(
      "Feature PRs may add primitive version intents but must not modify or remove merged intents.",
    );
  }
  assertManifestMetadataEqual(options.base.manifest, options.head.manifest);

  const baseArtifacts = artifactMap(options.base.artifacts);
  const headArtifacts = artifactMap(options.head.artifacts);
  const removedPrimitives = [...baseArtifacts.keys()].filter((name) => !headArtifacts.has(name));
  if (removedPrimitives.length > 0) {
    throw new Error(
      `Removing vendorable primitives is unsupported: ${removedPrimitives.join(", ")}.`,
    );
  }
  const addedPrimitives = [...headArtifacts.keys()]
    .filter((name) => !baseArtifacts.has(name))
    .sort();
  const changedPrimitives = [...baseArtifacts.keys()]
    .filter(
      (name) =>
        headArtifacts.has(name) &&
        createPrimitiveArtifactFingerprint(baseArtifacts.get(name)!) !==
          createPrimitiveArtifactFingerprint(headArtifacts.get(name)!),
    )
    .sort();

  for (const primitive of baseArtifacts.keys()) {
    if (
      options.base.manifest.primitives[primitive] !== options.head.manifest.primitives[primitive]
    ) {
      throw new Error(
        `Feature PR must defer ${primitive} version changes to the Version Packages PR.`,
      );
    }
  }
  for (const primitive of addedPrimitives) {
    if (!options.head.manifest.primitives[primitive]) {
      throw new Error(`New primitive "${primitive}" requires an explicit initial version.`);
    }
  }

  const addedIntentPrimitives = new Set<string>();
  for (const file of addedFragments) {
    for (const primitive of Object.keys(options.head.fragments[file].primitives)) {
      addedIntentPrimitives.add(primitive);
    }
  }
  const changedSet = new Set(changedPrimitives);
  const missingIntents = changedPrimitives.filter(
    (primitive) => !addedIntentPrimitives.has(primitive),
  );
  const extraIntents = [...addedIntentPrimitives].filter((primitive) => !changedSet.has(primitive));
  if (missingIntents.length > 0) {
    throw new Error(
      `Missing primitive version intent for changed primitive(s): ${missingIntents.join(", ")}.`,
    );
  }
  if (extraIntents.length > 0) {
    throw new Error(
      `Primitive version intent has no installable source change: ${extraIntents.join(", ")}.`,
    );
  }
  if (
    (changedPrimitives.length > 0 || addedPrimitives.length > 0) &&
    !options.head.starwindChangesets.some((file) => !options.base.starwindChangesets.includes(file))
  ) {
    throw new Error("Primitive source changes require a new starwind package Changeset.");
  }
  return { addedPrimitives, changedPrimitives, mode: "intent" };
}

export async function versionPrimitiveComponents(
  options: { repoRoot?: string } = {},
): Promise<PrimitiveVersionPlan> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const manifestPath = path.join(repoRoot, PRIMITIVE_VERSION_MANIFEST);
  const manifest = await readJson<PrimitiveVersionManifest>(manifestPath);
  validateManifest(manifest, "primitive version manifest");
  const fragmentDirectory = await resolveVersionFragmentDirectory(repoRoot);
  const fragments = await readFragments(
    repoRoot,
    new Set(Object.keys(manifest.primitives)),
    fragmentDirectory,
  );
  const aggregated = aggregatePrimitiveVersionIntents(fragments);
  const nextVersions = sortRecord(applyPrimitiveVersionIntents(manifest.primitives, aggregated));
  const versions: PrimitiveVersionPlan["versions"] = {};
  for (const [primitive, bump] of Object.entries(aggregated)) {
    versions[primitive] = {
      bump,
      from: manifest.primitives[primitive],
      to: nextVersions[primitive],
    };
  }
  if (Object.keys(versions).length === 0) return { fragments: [], versions };
  await writeFile(
    manifestPath,
    `${JSON.stringify({ ...manifest, primitives: nextVersions }, null, 2)}\n`,
  );
  await rm(path.join(repoRoot, fragmentDirectory), { force: true, recursive: true });
  return { fragments: Object.keys(fragments).sort(), versions };
}

export async function stagePrimitiveVersionIntents(
  options: { repoRoot?: string } = {},
): Promise<{ staged: boolean }> {
  return stageVersionIntents({
    repoRoot: options.repoRoot ?? process.cwd(),
    pending: PRIMITIVE_VERSION_FRAGMENT_DIR,
    staged: STAGED_PRIMITIVE_VERSION_FRAGMENT_DIR,
    label: "primitive",
  });
}

export async function checkPrimitiveComponents(
  options: { baseRef?: string; repoRoot?: string } = {},
): Promise<ReturnType<typeof validatePrimitiveVersionPullRequest> | { mode: "state" }> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const head = await readWorkingSnapshot(repoRoot);
  validateSnapshot(head, "working tree");
  if (!options.baseRef) return { mode: "state" };
  const base = await readGitSnapshot(repoRoot, options.baseRef);
  return validatePrimitiveVersionPullRequest({ base, head });
}

async function readWorkingSnapshot(repoRoot: string): Promise<PrimitiveReleaseSnapshot> {
  const manifest = await readJson<PrimitiveVersionManifest>(
    path.join(repoRoot, PRIMITIVE_VERSION_MANIFEST),
  );
  return {
    artifacts: await readJson<PrimitiveVendoringArtifacts>(
      path.join(repoRoot, PRIMITIVE_REGISTRY_ARTIFACT),
    ),
    fragments: await readFragments(repoRoot, new Set(Object.keys(manifest.primitives))),
    manifest,
    starwindChangesets: await readWorkingStarwindChangesets(repoRoot),
  };
}

async function readGitSnapshot(repoRoot: string, ref: string): Promise<PrimitiveReleaseSnapshot> {
  const manifest = JSON.parse(
    await readGitFile(repoRoot, ref, PRIMITIVE_VERSION_MANIFEST),
  ) as PrimitiveVersionManifest;
  const knownPrimitives = new Set(Object.keys(manifest.primitives));
  const fragmentPaths = await listGitFiles(repoRoot, ref, PRIMITIVE_VERSION_FRAGMENT_DIR);
  const fragments: Record<string, PrimitiveVersionIntent> = {};
  for (const fragmentPath of fragmentPaths) {
    if (path.posix.dirname(fragmentPath) !== PRIMITIVE_VERSION_FRAGMENT_DIR) {
      throw new Error(`Unsafe primitive version intent path "${fragmentPath}".`);
    }
    const file = path.posix.basename(fragmentPath);
    assertSafeIntentFile(file, "primitive");
    fragments[file] = parsePrimitiveVersionIntent(
      JSON.parse(await readGitFile(repoRoot, ref, fragmentPath)),
      fragmentPath,
      knownPrimitives,
    );
  }
  const changesetPaths = (await listGitFiles(repoRoot, ref, ".changeset")).filter(
    (file) => file.endsWith(".md") && path.posix.dirname(file) === ".changeset",
  );
  const starwindChangesets: string[] = [];
  for (const changesetPath of changesetPaths) {
    if (changesetReleasesStarwind(await readGitFile(repoRoot, ref, changesetPath))) {
      starwindChangesets.push(path.posix.basename(changesetPath));
    }
  }
  return {
    artifacts: JSON.parse(
      await readGitFile(repoRoot, ref, PRIMITIVE_REGISTRY_ARTIFACT),
    ) as PrimitiveVendoringArtifacts,
    fragments,
    manifest,
    starwindChangesets: starwindChangesets.sort(),
  };
}

async function readFragments(
  repoRoot: string,
  knownPrimitives: ReadonlySet<string>,
  directory = PRIMITIVE_VERSION_FRAGMENT_DIR,
): Promise<Record<string, PrimitiveVersionIntent>> {
  const root = path.join(repoRoot, directory);
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return {};
    throw error;
  }
  const fragments: Record<string, PrimitiveVersionIntent> = {};
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isFile()) {
      throw new Error(`Primitive version intent directory contains non-file entry: ${entry.name}.`);
    }
    assertSafeIntentFile(entry.name, "primitive");
    fragments[entry.name] = parsePrimitiveVersionIntent(
      await readJson(path.join(root, entry.name)),
      `${directory}/${entry.name}`,
      knownPrimitives,
    );
  }
  return fragments;
}

async function resolveVersionFragmentDirectory(repoRoot: string): Promise<string> {
  return resolveVersionIntentDirectory({
    repoRoot,
    pending: PRIMITIVE_VERSION_FRAGMENT_DIR,
    staged: STAGED_PRIMITIVE_VERSION_FRAGMENT_DIR,
    label: "primitive",
  });
}

function validateSnapshot(snapshot: PrimitiveReleaseSnapshot, label: string): void {
  validateManifest(snapshot.manifest, `${label} primitive version manifest`);
  const artifacts = artifactMap(snapshot.artifacts);
  assertSameKeys(
    snapshot.manifest.primitives,
    Object.fromEntries([...artifacts.keys()].map((name) => [name, true])),
    `${label} primitive inventory`,
  );
  for (const [primitive, version] of Object.entries(snapshot.manifest.primitives)) {
    const versions = new Set(artifacts.get(primitive)?.map((artifact) => artifact.version));
    if (versions.size !== 1 || !versions.has(version)) {
      throw new Error(`${label} primitive artifacts for ${primitive} must all use ${version}.`);
    }
  }
}

function validateManifest(manifest: PrimitiveVersionManifest, label: string): void {
  if (
    !isPlainObject(manifest) ||
    !semver.valid(manifest.defaultPrimitiveVersion) ||
    semver.major(manifest.defaultPrimitiveVersion) !== 0 ||
    !isPlainObject(manifest.primitives)
  ) {
    throw new Error(`${label} contains invalid beta semver metadata or primitive inventory.`);
  }
  for (const [primitive, version] of Object.entries(manifest.primitives)) {
    if (
      !primitive ||
      typeof version !== "string" ||
      !semver.valid(version) ||
      semver.major(version) !== 0
    ) {
      throw new Error(`${label} has invalid pre-1.0 version for primitive "${primitive}".`);
    }
  }
}

function artifactMap(
  document: PrimitiveVendoringArtifacts,
): Map<string, PrimitiveVendoringArtifact[]> {
  const result = new Map<string, PrimitiveVendoringArtifact[]>();
  for (const artifact of document.primitives) {
    const entries = result.get(artifact.component) ?? [];
    entries.push(artifact);
    result.set(artifact.component, entries);
  }
  return result;
}

function assertArtifactSourcesEqual(
  base: PrimitiveVendoringArtifacts,
  head: PrimitiveVendoringArtifacts,
): void {
  const baseMap = artifactMap(base);
  const headMap = artifactMap(head);
  assertSameKeys(Object.fromEntries(baseMap), Object.fromEntries(headMap), "primitive registry");
  const changed = [...baseMap.keys()].filter(
    (primitive) =>
      createPrimitiveArtifactFingerprint(baseMap.get(primitive)!) !==
      createPrimitiveArtifactFingerprint(headMap.get(primitive)!),
  );
  if (changed.length > 0) {
    throw new Error(`Version Packages PR must not change primitive source: ${changed.join(", ")}.`);
  }
}

function assertManifestMetadataEqual(
  base: PrimitiveVersionManifest,
  head: PrimitiveVersionManifest,
): void {
  if (base.defaultPrimitiveVersion !== head.defaultPrimitiveVersion) {
    throw new Error("Default primitive version must not change during primitive reconciliation.");
  }
}

function assertSameKeys(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  label: string,
): void {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (JSON.stringify(leftKeys) !== JSON.stringify(rightKeys)) {
    throw new Error(`${label} keys differ: ${leftKeys.join(", ")} vs ${rightKeys.join(", ")}.`);
  }
}

async function readWorkingStarwindChangesets(repoRoot: string): Promise<string[]> {
  const entries = await readdir(path.join(repoRoot, ".changeset"), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;
    if (
      changesetReleasesStarwind(
        await readFile(path.join(repoRoot, ".changeset", entry.name), "utf8"),
      )
    ) {
      files.push(entry.name);
    }
  }
  return files.sort();
}

function changesetReleasesStarwind(content: string): boolean {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  return Boolean(
    match?.[1]
      .split(/\r?\n/)
      .some((line) =>
        /^(?:"starwind"|'starwind'|starwind):\s*(?:patch|minor|major)\s*$/.test(line.trim()),
      ),
  );
}

async function readJson<T>(file: string): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    throw new Error(
      `Failed to read JSON from ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function readGitFile(repoRoot: string, ref: string, file: string): Promise<string> {
  const { stdout } = await execFileAsync("git", ["show", `${ref}:${file.replaceAll("\\", "/")}`], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

async function listGitFiles(repoRoot: string, ref: string, directory: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    "git",
    ["ls-tree", "-r", "--name-only", ref, "--", directory.replaceAll("\\", "/")],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  return stdout.split(/\r?\n/).filter(Boolean).sort();
}

async function runCli(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "version") {
    if (args.length > 0) throw new Error("primitive component version accepts no arguments.");
    const plan = await versionPrimitiveComponents();
    if (Object.keys(plan.versions).length === 0) {
      console.log("No pending primitive component version intents.");
      return;
    }
    for (const [primitive, version] of Object.entries(plan.versions)) {
      console.log(`${primitive}: ${version.from} -> ${version.to} (${version.bump})`);
    }
    return;
  }
  if (command === "stage") {
    if (args.length > 0) throw new Error("primitive component staging accepts no arguments.");
    const result = await stagePrimitiveVersionIntents();
    console.log(
      result.staged
        ? "Staged primitive component intents for Changesets."
        : "No primitive component intents to stage.",
    );
    return;
  }
  if (command === "check") {
    let baseRef: string | undefined;
    for (let index = 0; index < args.length; index += 1) {
      const argument = args[index];
      if (argument === "--base") {
        baseRef = args[index + 1];
        if (!baseRef || baseRef.startsWith("--")) throw new Error("Pass a Git ref after --base.");
        index++;
      } else if (argument.startsWith("--base=")) {
        baseRef = argument.slice("--base=".length);
      } else {
        throw new Error(`Unknown argument: ${argument}`);
      }
    }
    const result = await checkPrimitiveComponents({ baseRef });
    console.log(`Primitive component release check passed (${result.mode}).`);
    return;
  }
  throw new Error("Usage: primitive-component-release.ts <check [--base <ref>]|stage|version>");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
