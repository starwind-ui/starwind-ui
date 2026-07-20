import { execFile } from "node:child_process";
import { readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import semver from "semver";

import type { RegistryVersionManifest, RuntimeRegistry } from "./generate-cli-registry.js";

export type StyledVersionBump = "major" | "minor" | "patch";

export type StyledVersionIntent = {
  components: Record<string, StyledVersionBump>;
};

type StyledRegistryComponent = RuntimeRegistry["components"][number];

export type StyledReleaseSnapshot = {
  fragments: Record<string, StyledVersionIntent>;
  manifest: RegistryVersionManifest;
  registry: RuntimeRegistry;
  starwindChangesets: string[];
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
const BUMP_PRIORITY: Record<StyledVersionBump, number> = { patch: 0, minor: 1, major: 2 };
const FRAGMENT_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;
const RELEASE_MANAGED_PACKAGES = new Set([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
]);

export const STYLED_VERSION_FRAGMENT_DIR = ".changeset/styled-components";
export const STAGED_STYLED_VERSION_FRAGMENT_DIR = ".styled-component-intents";
export const STYLED_VERSION_MANIFEST = "packages/cli/registry/styled-component-versions.json";
export const STYLED_REGISTRY_ARTIFACT = "packages/cli/src/registry/bundled-registry.json";

export function parseStyledVersionIntent(
  value: unknown,
  source: string,
  knownComponents: ReadonlySet<string>,
): StyledVersionIntent {
  if (!isPlainObject(value) || Object.keys(value).length !== 1 || !("components" in value)) {
    throw new Error(`${source} must contain only a components object.`);
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
  return { components };
}

export function aggregateStyledVersionIntents(
  fragments: Record<string, StyledVersionIntent>,
): Record<string, StyledVersionBump> {
  const aggregated: Record<string, StyledVersionBump> = {};
  for (const file of Object.keys(fragments).sort()) {
    for (const [component, bump] of Object.entries(fragments[file].components)) {
      const current = aggregated[component];
      if (!current || BUMP_PRIORITY[bump] > BUMP_PRIORITY[current]) {
        aggregated[component] = bump;
      }
    }
  }
  return sortRecord(aggregated);
}

export function applyStyledVersionIntents(
  currentVersions: Record<string, string>,
  intents: Record<string, StyledVersionBump>,
): Record<string, string> {
  const nextVersions = { ...currentVersions };
  for (const [component, bump] of Object.entries(intents)) {
    const current = currentVersions[component];
    if (!current || !semver.valid(current)) {
      throw new Error(`Styled component "${component}" has invalid semver version "${current}".`);
    }
    const next = semver.inc(current, bump);
    if (!next) throw new Error(`Unable to apply ${bump} bump to ${component}@${current}.`);
    nextVersions[component] = next;
  }
  return nextVersions;
}

export function createStyledRegistryFingerprint(component: StyledRegistryComponent): string {
  const normalized = structuredClone(component) as StyledRegistryComponent;
  delete (normalized as Partial<StyledRegistryComponent>).version;
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
  const existingVersionChanges = Object.keys(options.base.manifest.components).filter(
    (component) =>
      options.head.manifest.components[component] !== options.base.manifest.components[component],
  );
  const versionMode = removedFragments.length > 0 || existingVersionChanges.length > 0;

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
    return { mode: "version", versionedComponents: Object.keys(aggregated).sort() };
  }

  if (removedFragments.length > 0 || modifiedFragments.length > 0) {
    throw new Error(
      "Feature PRs may add styled version intents but must not modify or remove merged intents.",
    );
  }
  assertManifestMetadataEqual(options.base.manifest, options.head.manifest);

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

  for (const component of baseComponents.keys()) {
    const before = options.base.manifest.components[component];
    const after = options.head.manifest.components[component];
    if (before !== after) {
      throw new Error(
        `Feature PR must defer ${component} version changes to the Version Packages PR.`,
      );
    }
  }
  for (const component of addedComponents) {
    if (!options.head.manifest.components[component]) {
      throw new Error(`New styled component "${component}" requires an explicit initial version.`);
    }
  }

  const addedIntentComponents = new Set<string>();
  for (const file of addedFragments) {
    for (const component of Object.keys(options.head.fragments[file].components)) {
      addedIntentComponents.add(component);
    }
  }
  const changedSet = new Set(changedComponents);
  const missingIntents = changedComponents.filter(
    (component) => !addedIntentComponents.has(component),
  );
  const extraIntents = [...addedIntentComponents].filter((component) => !changedSet.has(component));
  if (missingIntents.length > 0) {
    throw new Error(
      `Missing styled version intent for changed component(s): ${missingIntents.join(", ")}.`,
    );
  }
  if (extraIntents.length > 0) {
    throw new Error(
      `Styled version intent has no installable source change: ${extraIntents.join(", ")}.`,
    );
  }
  if (
    (changedComponents.length > 0 || addedComponents.length > 0) &&
    !options.head.starwindChangesets.some((file) => !options.base.starwindChangesets.includes(file))
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

  for (const [component, bump] of Object.entries(aggregated)) {
    versions[component] = {
      bump,
      from: manifest.components[component],
      to: nextVersions[component],
    };
  }
  if (Object.keys(versions).length === 0) return { fragments: [], versions };

  await writeFile(
    manifestPath,
    `${JSON.stringify({ ...manifest, components: nextVersions }, null, 2)}\n`,
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
  const repoRoot = options.repoRoot ?? process.cwd();
  const source = path.join(repoRoot, STYLED_VERSION_FRAGMENT_DIR);
  const destination = path.join(repoRoot, STAGED_STYLED_VERSION_FRAGMENT_DIR);
  if (await pathExists(destination)) {
    throw new Error(
      `Styled version staging directory already exists: ${STAGED_STYLED_VERSION_FRAGMENT_DIR}.`,
    );
  }
  if (!(await pathExists(source))) return { staged: false };
  await rename(source, destination);
  return { staged: true };
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
    starwindChangesets: await readWorkingStarwindChangesets(repoRoot),
  };
}

async function readGitSnapshot(repoRoot: string, ref: string): Promise<StyledReleaseSnapshot> {
  const manifest = JSON.parse(
    await readGitFile(repoRoot, ref, STYLED_VERSION_MANIFEST),
  ) as RegistryVersionManifest;
  const knownComponents = new Set(Object.keys(manifest.components));
  const fragmentPaths = await listGitFiles(repoRoot, ref, STYLED_VERSION_FRAGMENT_DIR);
  const fragments: Record<string, StyledVersionIntent> = {};
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
  const starwindChangesets: string[] = [];
  for (const changesetPath of changesetPaths) {
    if (changesetReleasesStarwind(await readGitFile(repoRoot, ref, changesetPath))) {
      starwindChangesets.push(path.posix.basename(changesetPath));
    }
  }
  return {
    fragments,
    manifest,
    registry: JSON.parse(
      await readGitFile(repoRoot, ref, STYLED_REGISTRY_ARTIFACT),
    ) as RuntimeRegistry,
    starwindChangesets: starwindChangesets.sort(),
  };
}

async function readFragments(
  repoRoot: string,
  knownComponents: ReadonlySet<string>,
  directory = STYLED_VERSION_FRAGMENT_DIR,
): Promise<Record<string, StyledVersionIntent>> {
  const root = path.join(repoRoot, directory);
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return {};
    throw error;
  }

  const fragments: Record<string, StyledVersionIntent> = {};
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
  const pending = await pathExists(path.join(repoRoot, STYLED_VERSION_FRAGMENT_DIR));
  const staged = await pathExists(path.join(repoRoot, STAGED_STYLED_VERSION_FRAGMENT_DIR));
  if (pending && staged) {
    throw new Error("Both pending and staged styled version intent directories exist.");
  }
  return staged ? STAGED_STYLED_VERSION_FRAGMENT_DIR : STYLED_VERSION_FRAGMENT_DIR;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return false;
    throw error;
  }
}

async function readWorkingStarwindChangesets(repoRoot: string): Promise<string[]> {
  const root = path.join(repoRoot, ".changeset");
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;
    if (changesetReleasesStarwind(await readFile(path.join(root, entry.name), "utf8"))) {
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

function validateSnapshot(snapshot: StyledReleaseSnapshot, label: string): void {
  validateManifest(snapshot.manifest, `${label} styled version manifest`);
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
  if (!FRAGMENT_FILE_PATTERN.test(file)) {
    throw new Error(`Unsafe styled version intent filename "${file}".`);
  }
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

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
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
