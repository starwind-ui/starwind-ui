import { execFile } from "node:child_process";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import semver from "semver";

import type { RegistryVersionManifest, RuntimeRegistry } from "./generate-cli-registry.js";
import {
  aggregateReleaseDecisions,
  applyVersionIntents,
  assertSafeIntentFile,
  getNewPackageReleaseBump,
  hasNewPackageRelease,
  isNodeError,
  isPlainObject,
  materializeSourceVersions,
  parseChangesetReleaseFacts,
  resolveVersionIntentDirectory,
  sortRecord,
  stageVersionIntents,
  type ChangesetReleaseFacts,
  type ReleaseDecision,
  type ReleaseImpact,
} from "./release-intent-utils.js";

export type StyledVersionBump = "major" | "minor" | "patch";

export type StyledVersionIntent = {
  components: Record<string, StyledVersionBump>;
  impact?: ReleaseImpact;
};

export type ParsedStyledVersionIntent = StyledVersionIntent & { impact: ReleaseImpact };

type StyledRegistryComponent = RuntimeRegistry["components"][number];

export type StyledReleaseSnapshot = {
  fragments: Record<string, StyledVersionIntent>;
  manifest: RegistryVersionManifest;
  registry: RuntimeRegistry;
  packageReleases: ChangesetReleaseFacts;
};

export type StyledVersionPlan = {
  fragments: string[];
  versions: Record<
    string,
    {
      bump: StyledVersionBump;
      from: string;
      to: string;
    }
  >;
};

type ValidatePullRequestOptions = {
  base: StyledReleaseSnapshot;
  head: StyledReleaseSnapshot;
};

type VersionStyledComponentsOptions = {
  repoRoot?: string;
};

const execFileAsync = promisify(execFile);
const RELEASE_MANAGED_PACKAGES = new Set([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
]);
const FIXED_GROUP_PACKAGES = [
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
] as const;

export const STYLED_VERSION_FRAGMENT_DIR = ".changeset/styled-components";
export const STAGED_STYLED_VERSION_FRAGMENT_DIR = ".styled-component-intents";
export const STYLED_VERSION_MANIFEST = "packages/cli/registry/styled-component-versions.json";
export const STYLED_REGISTRY_ARTIFACT = "packages/cli/src/registry/bundled-registry.json";
export const LEGACY_STYLED_COMPONENT_BASELINES: Readonly<Record<string, string>> = {
  "color-picker": "1.2.0",
};

export function parseStyledVersionIntent(
  value: unknown,
  source: string,
  knownComponents: ReadonlySet<string>,
): ParsedStyledVersionIntent {
  const keys = isPlainObject(value) ? Object.keys(value) : [];
  if (
    !isPlainObject(value) ||
    !keys.includes("components") ||
    keys.some((key) => key !== "components" && key !== "impact")
  ) {
    throw new Error(`${source} must contain only components and optional impact fields.`);
  }
  const impact = value.impact ?? "source";
  if (impact !== "source" && impact !== "behavior") {
    throw new Error(`${source} impact must be source or behavior.`);
  }
  if (!isPlainObject(value.components)) {
    throw new Error(`${source} components must be an object.`);
  }

  const entries = Object.entries(value.components);
  if (entries.length === 0) {
    throw new Error(`${source} must declare at least one component.`);
  }

  const components: Record<string, StyledVersionBump> = {};
  for (const [component, bump] of entries.sort(([left], [right]) => left.localeCompare(right))) {
    if (!knownComponents.has(component)) {
      throw new Error(`${source} references unknown styled component "${component}".`);
    }
    if (bump !== "patch" && bump !== "minor" && bump !== "major") {
      throw new Error(`${source} component "${component}" bump must be patch, minor, or major.`);
    }
    components[component] = bump;
  }
  return { components, impact };
}

export function aggregateStyledVersionIntents(
  fragments: Record<string, StyledVersionIntent>,
): Record<string, ReleaseDecision<StyledVersionBump>> {
  return aggregateReleaseDecisions(
    Object.fromEntries(
      Object.entries(fragments).map(([file, intent]) => [
        file,
        { impact: intent.impact ?? "source", releases: intent.components },
      ]),
    ),
  );
}

export function applyStyledVersionIntents(
  currentVersions: Record<string, string>,
  intents: Record<string, StyledVersionBump | ReleaseDecision<StyledVersionBump>>,
): Record<string, string> {
  return applyVersionIntents({
    currentVersions,
    intents,
    label: "Styled component",
  });
}

export function createStyledRegistryFingerprint(component: StyledRegistryComponent): string {
  const normalized = structuredClone(component) as StyledRegistryComponent;
  delete (normalized as Partial<StyledRegistryComponent>).version;
  delete (normalized as Partial<StyledRegistryComponent>).sourceVersion;
  for (const target of Object.values(normalized.targets ?? {})) {
    for (const requirement of target.packageRequirements ?? []) {
      if (RELEASE_MANAGED_PACKAGES.has(requirement.name)) {
        requirement.range = "<release-managed>";
      }
    }
  }
  return JSON.stringify(normalized);
}

export function validateStyledVersionPullRequest(options: ValidatePullRequestOptions): {
  addedComponents?: string[];
  changedComponents?: string[];
  mode: "intent" | "version";
  versionedComponents?: string[];
} {
  validateSnapshot(options.base, "base");
  validateSnapshot(options.head, "head");

  const baseFragmentNames = Object.keys(options.base.fragments).sort();
  const headFragmentNames = Object.keys(options.head.fragments).sort();
  const removedFragments = baseFragmentNames.filter((file) => !options.head.fragments[file]);
  const addedFragments = headFragmentNames.filter((file) => !options.base.fragments[file]);
  const modifiedFragments = baseFragmentNames.filter(
    (file) =>
      options.head.fragments[file] &&
      JSON.stringify(options.head.fragments[file]) !== JSON.stringify(options.base.fragments[file]),
  );
  const invalidModifiedFragments = modifiedFragments.filter(
    (file) => !isLegacyBaselineIntentCorrection(options, file),
  );
  const existingVersionChanges = Object.keys(options.base.manifest.components).filter(
    (component) =>
      options.head.manifest.components[component] !== options.base.manifest.components[component],
  );
  const versionMode = removedFragments.length > 0;

  if (versionMode) {
    if (headFragmentNames.length > 0 || addedFragments.length > 0 || modifiedFragments.length > 0) {
      throw new Error(
        "Version Packages PR must consume every styled version intent without adding or modifying fragments.",
      );
    }
    if (removedFragments.length !== baseFragmentNames.length) {
      throw new Error("Version Packages PR must consume every pending styled version intent.");
    }
    assertRegistrySourcesEqual(options.base.registry, options.head.registry);

    const aggregated = aggregateStyledVersionIntents(options.base.fragments);
    const expected = applyStyledVersionIntents(options.base.manifest.components, aggregated);
    const expectedSources = materializeSourceVersions({
      currentSourceVersions: sourceVersions(options.base.manifest),
      decisions: aggregated,
      nextVersions: expected,
    });
    assertManifestMetadataEqual(options.base.manifest, options.head.manifest);
    for (const [component, expectedVersion] of Object.entries(expected)) {
      const actualVersion = options.head.manifest.components[component];
      if (actualVersion !== expectedVersion) {
        throw new Error(
          `Version Packages PR expected ${component}@${expectedVersion}, received ${actualVersion ?? "missing"}.`,
        );
      }
    }
    assertSameKeys(expected, options.head.manifest.components, "styled version manifest");
    assertVersionMap(
      expectedSources,
      sourceVersions(options.head.manifest),
      "styled source version manifest",
    );
    return { mode: "version", versionedComponents: Object.keys(aggregated).sort() };
  }

  if (removedFragments.length > 0 || invalidModifiedFragments.length > 0) {
    throw new Error(
      "Feature PRs may add styled version intents but must not modify or remove merged intents.",
    );
  }
  const baseComponents = componentMap(options.base.registry);
  const headComponents = componentMap(options.head.registry);
  const removedComponents = [...baseComponents.keys()].filter((name) => !headComponents.has(name));
  if (removedComponents.length > 0) {
    throw new Error(
      `Removing styled registry components is unsupported: ${removedComponents.join(", ")}.`,
    );
  }
  const addedComponents = [...headComponents.keys()]
    .filter((name) => !baseComponents.has(name))
    .sort();
  const changedComponents = [...baseComponents.keys()]
    .filter(
      (name) =>
        headComponents.has(name) &&
        createStyledRegistryFingerprint(baseComponents.get(name)!) !==
          createStyledRegistryFingerprint(headComponents.get(name)!),
    )
    .sort();

  for (const component of addedComponents) {
    if (!options.head.manifest.components[component]) {
      throw new Error(`New styled component "${component}" requires an explicit initial version.`);
    }
  }

  const addedIntents = Object.fromEntries(
    addedFragments.map((file) => [file, options.head.fragments[file]]),
  );
  const addedDecisions = aggregateStyledVersionIntents(addedIntents);
  const addedIntentComponents = new Set(Object.keys(addedDecisions));
  const changedSet = new Set(changedComponents);
  assertFeatureManifestMigration({
    base: options.base.manifest,
    changedComponents: changedSet,
    existingVersionChanges,
    head: options.head.manifest,
  });
  assertFeatureSourceVersions(options.base.manifest, options.head.manifest, existingVersionChanges);
  const missingIntents = changedComponents.filter(
    (component) => addedDecisions[component]?.impact !== "source",
  );
  const behaviorComponents = [...addedIntentComponents].filter(
    (component) => addedDecisions[component].impact === "behavior",
  );
  const extraSourceIntents = [...addedIntentComponents].filter(
    (component) => addedDecisions[component].impact === "source" && !changedSet.has(component),
  );
  if (missingIntents.length > 0) {
    throw new Error(
      `Missing styled version intent for changed component(s): ${missingIntents.join(", ")}.`,
    );
  }
  if (extraSourceIntents.length > 0) {
    throw new Error(
      `Styled source version intent has no installable source change: ${extraSourceIntents.join(", ")}.`,
    );
  }
  for (const component of behaviorComponents) {
    const entry = headComponents.get(component);
    if (!entry || !isRuntimeBackedStyledComponent(entry)) {
      throw new Error(`Styled behavior intent requires a Runtime-backed component: ${component}.`);
    }
  }
  if (behaviorComponents.length > 0)
    assertBehaviorPackageReleases(
      options.base.packageReleases,
      options.head.packageReleases,
      "Styled",
    );
  if (
    (changedComponents.length > 0 || addedComponents.length > 0) &&
    !hasNewPackageRelease(options.base.packageReleases, options.head.packageReleases, "starwind")
  ) {
    throw new Error("Styled source changes require a new starwind package Changeset.");
  }

  return { addedComponents, changedComponents, mode: "intent" };
}

export async function versionStyledComponents(
  options: VersionStyledComponentsOptions = {},
): Promise<StyledVersionPlan> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const manifestPath = path.join(repoRoot, STYLED_VERSION_MANIFEST);
  const manifest = await readJson<RegistryVersionManifest>(manifestPath);
  validateManifest(manifest, "styled version manifest");
  const fragmentDirectory = await resolveVersionFragmentDirectory(repoRoot);
  const fragments = await readFragments(
    repoRoot,
    new Set(Object.keys(manifest.components)),
    fragmentDirectory,
  );
  const aggregated = aggregateStyledVersionIntents(fragments);
  const nextVersions = sortRecord(applyStyledVersionIntents(manifest.components, aggregated));
  const versions: StyledVersionPlan["versions"] = {};

  const nextSourceVersions = materializeSourceVersions({
    currentSourceVersions: sourceVersions(manifest),
    decisions: aggregated,
    nextVersions,
  });
  for (const [component, decision] of Object.entries(aggregated)) {
    versions[component] = {
      bump: decision.bump,
      from: manifest.components[component],
      to: nextVersions[component],
    };
  }
  if (Object.keys(versions).length === 0) return { fragments: [], versions };

  await writeFile(
    manifestPath,
    `${JSON.stringify({ ...manifest, components: nextVersions, sourceVersions: nextSourceVersions }, null, 2)}\n`,
  );
  // Changesets treats every direct child of `.changeset` as one of its own
  // files, so the consumed intent directory must disappear before
  // `changeset version` starts.
  await rm(path.join(repoRoot, fragmentDirectory), {
    force: true,
    recursive: true,
  });
  return { fragments: Object.keys(fragments).sort(), versions };
}

export async function stageStyledVersionIntents(
  options: VersionStyledComponentsOptions = {},
): Promise<{ staged: boolean }> {
  return stageVersionIntents({
    repoRoot: options.repoRoot ?? process.cwd(),
    pending: STYLED_VERSION_FRAGMENT_DIR,
    staged: STAGED_STYLED_VERSION_FRAGMENT_DIR,
    label: "styled",
  });
}

export async function checkStyledComponents(
  options: {
    baseRef?: string;
    repoRoot?: string;
  } = {},
): Promise<ReturnType<typeof validateStyledVersionPullRequest> | { mode: "state" }> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const head = await readWorkingSnapshot(repoRoot);
  validateSnapshot(head, "working tree");
  if (!options.baseRef) return { mode: "state" };
  const base = await readGitSnapshot(repoRoot, options.baseRef);
  return validateStyledVersionPullRequest({ base, head });
}

async function readWorkingSnapshot(repoRoot: string): Promise<StyledReleaseSnapshot> {
  const manifest = await readJson<RegistryVersionManifest>(
    path.join(repoRoot, STYLED_VERSION_MANIFEST),
  );
  return {
    fragments: await readFragments(repoRoot, new Set(Object.keys(manifest.components))),
    manifest,
    registry: await readJson<RuntimeRegistry>(path.join(repoRoot, STYLED_REGISTRY_ARTIFACT)),
    packageReleases: await readWorkingPackageReleases(repoRoot),
  };
}

async function readGitSnapshot(repoRoot: string, ref: string): Promise<StyledReleaseSnapshot> {
  const manifest = JSON.parse(
    await readGitFile(repoRoot, ref, STYLED_VERSION_MANIFEST),
  ) as RegistryVersionManifest;
  const knownComponents = new Set(Object.keys(manifest.components));
  const fragmentPaths = await listGitFiles(repoRoot, ref, STYLED_VERSION_FRAGMENT_DIR);
  const fragments: Record<string, ParsedStyledVersionIntent> = {};
  for (const fragmentPath of fragmentPaths) {
    if (path.posix.dirname(fragmentPath) !== STYLED_VERSION_FRAGMENT_DIR) {
      throw new Error(`Unsafe styled version intent path "${fragmentPath}".`);
    }
    const file = path.posix.basename(fragmentPath);
    assertSafeFragmentFile(file);
    fragments[file] = parseStyledVersionIntent(
      JSON.parse(await readGitFile(repoRoot, ref, fragmentPath)),
      fragmentPath,
      knownComponents,
    );
  }
  const changesetPaths = (await listGitFiles(repoRoot, ref, ".changeset")).filter(
    (file) =>
      file.endsWith(".md") &&
      path.posix.dirname(file) === ".changeset" &&
      !file.endsWith("/README.md"),
  );
  const packageReleases: ChangesetReleaseFacts = {};
  for (const changesetPath of changesetPaths) {
    packageReleases[path.posix.basename(changesetPath)] = parseChangesetReleaseFacts(
      await readGitFile(repoRoot, ref, changesetPath),
    );
  }
  return {
    fragments,
    manifest,
    registry: JSON.parse(
      await readGitFile(repoRoot, ref, STYLED_REGISTRY_ARTIFACT),
    ) as RuntimeRegistry,
    packageReleases: sortRecord(packageReleases),
  };
}

async function readFragments(
  repoRoot: string,
  knownComponents: ReadonlySet<string>,
  directory = STYLED_VERSION_FRAGMENT_DIR,
): Promise<Record<string, ParsedStyledVersionIntent>> {
  const root = path.join(repoRoot, directory);
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return {};
    throw error;
  }

  const fragments: Record<string, ParsedStyledVersionIntent> = {};
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isFile())
      throw new Error(`Styled version intent directory contains non-file entry: ${entry.name}.`);
    assertSafeFragmentFile(entry.name);
    const fragmentPath = path.join(root, entry.name);
    fragments[entry.name] = parseStyledVersionIntent(
      await readJson(fragmentPath),
      `${directory}/${entry.name}`,
      knownComponents,
    );
  }
  return fragments;
}

async function resolveVersionFragmentDirectory(repoRoot: string): Promise<string> {
  return resolveVersionIntentDirectory({
    repoRoot,
    pending: STYLED_VERSION_FRAGMENT_DIR,
    staged: STAGED_STYLED_VERSION_FRAGMENT_DIR,
    label: "styled",
  });
}

async function readWorkingPackageReleases(repoRoot: string): Promise<ChangesetReleaseFacts> {
  const root = path.join(repoRoot, ".changeset");
  const entries = await readdir(root, { withFileTypes: true });
  const files: ChangesetReleaseFacts = {};
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;
    files[entry.name] = parseChangesetReleaseFacts(
      await readFile(path.join(root, entry.name), "utf8"),
    );
  }
  return sortRecord(files);
}

function validateSnapshot(snapshot: StyledReleaseSnapshot, label: string): void {
  validateManifest(snapshot.manifest, `${label} styled version manifest`);
  if (snapshot.registry.version !== snapshot.manifest.registryVersion) {
    throw new Error(
      `${label} registry version ${snapshot.registry.version} does not match manifest registry version ${snapshot.manifest.registryVersion}.`,
    );
  }
  const registryComponents = componentMap(snapshot.registry);
  assertSameKeys(
    snapshot.manifest.components,
    Object.fromEntries(registryComponents),
    `${label} styled component inventory`,
  );
  for (const [component, version] of Object.entries(snapshot.manifest.components)) {
    if (!semver.valid(version))
      throw new Error(`${label} ${component}@${version} is not valid semver.`);
    const registryVersion = registryComponents.get(component)?.version;
    if (registryVersion !== version) {
      throw new Error(
        `${label} registry has ${component}@${registryVersion ?? "missing"}; expected ${version}.`,
      );
    }
    if (
      Object.hasOwn(snapshot.manifest, "sourceVersions") &&
      registryComponents.get(component)?.sourceVersion !==
        sourceVersions(snapshot.manifest)[component]
    ) {
      throw new Error(`${label} registry has an invalid sourceVersion for ${component}.`);
    }
  }
}

function validateManifest(manifest: RegistryVersionManifest, label: string): void {
  if (
    !isPlainObject(manifest) ||
    !semver.valid(manifest.registryVersion) ||
    !semver.valid(manifest.defaultComponentVersion) ||
    !isPlainObject(manifest.components)
  ) {
    throw new Error(`${label} contains invalid semver metadata or component inventory.`);
  }
  for (const [component, version] of Object.entries(manifest.components)) {
    if (!component || typeof version !== "string" || !semver.valid(version)) {
      throw new Error(`${label} has invalid version for styled component "${component}".`);
    }
  }
  const sources = sourceVersions(manifest);
  assertSameKeys(manifest.components, sources, `${label} source versions`);
  for (const [component, sourceVersion] of Object.entries(sources)) {
    if (!semver.valid(sourceVersion) || semver.gt(sourceVersion, manifest.components[component])) {
      throw new Error(`${label} has invalid source version for styled component "${component}".`);
    }
  }
}

function sourceVersions(manifest: RegistryVersionManifest): Record<string, string> {
  return manifest.sourceVersions ?? manifest.components;
}

function assertVersionMap(
  expected: Record<string, string>,
  actual: Record<string, string>,
  label: string,
): void {
  assertSameKeys(expected, actual, label);
  for (const [name, version] of Object.entries(expected)) {
    if (actual[name] !== version)
      throw new Error(
        `${label} expected ${name}@${version}, received ${actual[name] ?? "missing"}.`,
      );
  }
}

function isRuntimeBackedStyledComponent(component: StyledRegistryComponent): boolean {
  return Object.values(component.targets ?? {}).some((target) =>
    target.packageRequirements.some((requirement) =>
      RELEASE_MANAGED_PACKAGES.has(requirement.name),
    ),
  );
}

function assertBehaviorPackageReleases(
  base: ChangesetReleaseFacts,
  head: ChangesetReleaseFacts,
  label: string,
): void {
  const required = ["starwind", ...FIXED_GROUP_PACKAGES];
  const missing = required.filter((name) => !hasNewPackageRelease(base, head, name));
  if (missing.length > 0) {
    throw new Error(
      `${label} behavior intent requires new release intent for: ${missing.join(", ")}.`,
    );
  }
  const fixedGroupBumps = new Set(
    FIXED_GROUP_PACKAGES.map((name) => getNewPackageReleaseBump(base, head, name)),
  );
  if (fixedGroupBumps.size !== 1) {
    throw new Error(`${label} behavior intent requires matching fixed-group release bumps.`);
  }
}

function assertRegistrySourcesEqual(base: RuntimeRegistry, head: RuntimeRegistry): void {
  const baseComponents = componentMap(base);
  const headComponents = componentMap(head);
  assertSameKeys(
    Object.fromEntries(baseComponents),
    Object.fromEntries(headComponents),
    "styled registry",
  );
  const changed = [...baseComponents.keys()].filter(
    (component) =>
      createStyledRegistryFingerprint(baseComponents.get(component)!) !==
      createStyledRegistryFingerprint(headComponents.get(component)!),
  );
  if (changed.length > 0) {
    throw new Error(
      `Version Packages PR must not change styled component source: ${changed.join(", ")}.`,
    );
  }
}

function assertManifestMetadataEqual(
  base: RegistryVersionManifest,
  head: RegistryVersionManifest,
): void {
  if (
    base.registryVersion !== head.registryVersion ||
    base.defaultComponentVersion !== head.defaultComponentVersion
  ) {
    throw new Error(
      "Styled registry metadata versions must not change during component reconciliation.",
    );
  }
}

function isLegacyBaselineIntentCorrection(
  options: ValidatePullRequestOptions,
  file: string,
): boolean {
  const baseComponents = options.base.fragments[file]?.components;
  const headComponents = options.head.fragments[file]?.components;
  if (!baseComponents || !headComponents) return false;

  const removedComponents = Object.keys(baseComponents).filter(
    (component) => !(component in headComponents),
  );
  const addedOrChangedComponents = Object.entries(headComponents).filter(
    ([component, bump]) => baseComponents[component] !== bump,
  );
  if (removedComponents.length === 0 || addedOrChangedComponents.length > 0) return false;

  return removedComponents.every((component) => {
    const baseline = LEGACY_STYLED_COMPONENT_BASELINES[component];
    return (
      baseline !== undefined &&
      options.base.manifest.components[component] === baseline &&
      options.head.manifest.components[component] === baseline
    );
  });
}

function assertFeatureManifestMigration(options: {
  base: RegistryVersionManifest;
  changedComponents: ReadonlySet<string>;
  existingVersionChanges: string[];
  head: RegistryVersionManifest;
}): void {
  if (options.base.defaultComponentVersion !== options.head.defaultComponentVersion) {
    throw new Error("Feature PRs must not change the default styled component version.");
  }

  const registryVersionChanged = options.base.registryVersion !== options.head.registryVersion;
  if (
    registryVersionChanged &&
    !semver.gt(options.head.registryVersion, options.base.registryVersion)
  ) {
    throw new Error("Styled registry metadata migrations must advance the registry version.");
  }

  if (!registryVersionChanged && options.existingVersionChanges.length > 0) {
    throw new Error(
      `Feature PR must defer ${options.existingVersionChanges[0]} version changes to the Version Packages PR.`,
    );
  }

  for (const component of options.existingVersionChanges) {
    const before = options.base.components[component];
    const after = options.head.components[component];
    if (!options.changedComponents.has(component)) {
      throw new Error(
        `Styled baseline migration for ${component} requires an installable source change.`,
      );
    }
    if (!before || !after || !semver.gt(after, before)) {
      throw new Error(
        `Styled baseline migration for ${component} must advance from ${before ?? "missing"} to a later version.`,
      );
    }
  }
}

function assertFeatureSourceVersions(
  base: RegistryVersionManifest,
  head: RegistryVersionManifest,
  baselineComponents: readonly string[],
): void {
  const baselineSet = new Set(baselineComponents);
  const before = sourceVersions(base);
  const after = sourceVersions(head);
  for (const component of Object.keys(base.components)) {
    const expected = baselineSet.has(component) ? head.components[component] : before[component];
    if (after[component] !== expected) {
      throw new Error(
        `Feature PR must defer ${component} sourceVersion changes to the Version Packages PR.`,
      );
    }
  }
  for (const component of Object.keys(head.components).filter(
    (name) => !(name in base.components),
  )) {
    if (after[component] !== head.components[component]) {
      throw new Error(
        `New styled component "${component}" must start with sourceVersion equal to version.`,
      );
    }
  }
}

function componentMap(registry: RuntimeRegistry): Map<string, StyledRegistryComponent> {
  return new Map(registry.components.map((component) => [component.name, component]));
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

function assertSafeFragmentFile(file: string): void {
  assertSafeIntentFile(file, "styled");
}

async function readJson<T = unknown>(file: string): Promise<T> {
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
    maxBuffer: 8 * 1024 * 1024,
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
    if (args.length > 0)
      throw new Error("styled component version accepts no additional arguments.");
    const plan = await versionStyledComponents();
    if (Object.keys(plan.versions).length === 0) {
      console.log("No pending styled component version intents.");
      return;
    }
    for (const [component, version] of Object.entries(plan.versions)) {
      console.log(`${component}: ${version.from} -> ${version.to} (${version.bump})`);
    }
    return;
  }
  if (command === "stage") {
    if (args.length > 0) throw new Error("styled component staging accepts no arguments.");
    const result = await stageStyledVersionIntents();
    console.log(
      result.staged
        ? "Staged styled component intents for Changesets."
        : "No styled component intents to stage.",
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
    const result = await checkStyledComponents({ baseRef });
    console.log(`Styled component release check passed (${result.mode}).`);
    return;
  }
  throw new Error("Usage: styled-component-release.ts <check [--base <ref>]|stage|version>");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
