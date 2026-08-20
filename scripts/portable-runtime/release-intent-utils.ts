import { rename, stat } from "node:fs/promises";
import path from "node:path";

import semver from "semver";

export type ReleaseVersionBump = "major" | "minor" | "patch";
export type ReleaseImpact = "source" | "behavior";
export type ReleaseDecision<T extends ReleaseVersionBump = ReleaseVersionBump> = {
  bump: T;
  impact: ReleaseImpact;
};
export type PackageReleaseFacts = Record<string, ReleaseVersionBump>;
export type ChangesetReleaseFacts = Record<string, PackageReleaseFacts>;

const BUMP_PRIORITY: Record<ReleaseVersionBump, number> = { patch: 0, minor: 1, major: 2 };
const FRAGMENT_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;

export function aggregateVersionIntents<T extends ReleaseVersionBump>(
  fragments: Record<string, Record<string, T>>,
): Record<string, T> {
  const aggregated: Record<string, T> = {};
  for (const file of Object.keys(fragments).sort()) {
    for (const [name, bump] of Object.entries(fragments[file])) {
      const current = aggregated[name];
      if (!current || BUMP_PRIORITY[bump] > BUMP_PRIORITY[current]) aggregated[name] = bump;
    }
  }
  return sortRecord(aggregated);
}

export function aggregateReleaseDecisions<T extends ReleaseVersionBump>(
  fragments: Record<string, { impact: ReleaseImpact; releases: Record<string, T> }>,
): Record<string, ReleaseDecision<T>> {
  const bumps = aggregateVersionIntents(
    Object.fromEntries(Object.entries(fragments).map(([file, value]) => [file, value.releases])),
  );
  const decisions: Record<string, ReleaseDecision<T>> = {};
  for (const [name, bump] of Object.entries(bumps)) {
    const impact = Object.keys(fragments)
      .sort()
      .some((file) => fragments[file].impact === "source" && name in fragments[file].releases)
      ? "source"
      : "behavior";
    decisions[name] = { bump, impact };
  }
  return sortRecord(decisions);
}

export function applyVersionIntents<T extends ReleaseVersionBump>(options: {
  currentVersions: Record<string, string>;
  intents: Record<string, T | ReleaseDecision<T>>;
  label: string;
  validateNext?: (name: string, current: string, next: string, bump: T) => void;
}): Record<string, string> {
  const nextVersions = { ...options.currentVersions };
  for (const [name, intent] of Object.entries(options.intents)) {
    const bump = typeof intent === "string" ? intent : intent.bump;
    const current = options.currentVersions[name];
    if (!current || !semver.valid(current)) {
      throw new Error(`${options.label} "${name}" has invalid semver version "${current}".`);
    }
    const next = semver.inc(current, bump);
    if (!next) throw new Error(`Unable to apply ${bump} bump to ${name}@${current}.`);
    options.validateNext?.(name, current, next, bump);
    nextVersions[name] = next;
  }
  return nextVersions;
}

export function materializeSourceVersions<T extends ReleaseVersionBump>(options: {
  currentSourceVersions: Record<string, string>;
  decisions: Record<string, ReleaseDecision<T>>;
  nextVersions: Record<string, string>;
}): Record<string, string> {
  const next = { ...options.currentSourceVersions };
  for (const [name, decision] of Object.entries(options.decisions)) {
    if (decision.impact === "source") next[name] = options.nextVersions[name];
  }
  return sortRecord(next);
}

export function parseChangesetReleaseFacts(content: string): PackageReleaseFacts {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match) return {};
  const releases: PackageReleaseFacts = {};
  for (const line of match[1].split(/\r?\n/)) {
    const release = /^(?:"([^"]+)"|'([^']+)'|([^:'"\s][^:]*)):\s*(patch|minor|major)\s*$/.exec(
      line.trim(),
    );
    if (release)
      releases[(release[1] ?? release[2] ?? release[3]).trim()] = release[4] as ReleaseVersionBump;
  }
  return sortRecord(releases);
}

export function hasNewPackageRelease(
  base: ChangesetReleaseFacts,
  head: ChangesetReleaseFacts,
  packageName: string,
): boolean {
  return Object.keys(head).some((file) => !(file in base) && packageName in head[file]);
}

export function getNewPackageReleaseBump(
  base: ChangesetReleaseFacts,
  head: ChangesetReleaseFacts,
  packageName: string,
): ReleaseVersionBump | undefined {
  let result: ReleaseVersionBump | undefined;
  for (const file of Object.keys(head).sort()) {
    if (file in base) continue;
    const bump = head[file][packageName];
    if (bump && (!result || BUMP_PRIORITY[bump] > BUMP_PRIORITY[result])) result = bump;
  }
  return result;
}

export function assertSafeIntentFile(file: string, label: string): void {
  if (!FRAGMENT_FILE_PATTERN.test(file)) {
    throw new Error(`Unsafe ${label} version intent filename "${file}".`);
  }
}

export async function resolveVersionIntentDirectory(options: {
  pending: string;
  repoRoot: string;
  staged: string;
  label: string;
}): Promise<string> {
  const pendingExists = await pathExists(path.join(options.repoRoot, options.pending));
  const stagedExists = await pathExists(path.join(options.repoRoot, options.staged));
  if (pendingExists && stagedExists) {
    throw new Error(`Both pending and staged ${options.label} version intent directories exist.`);
  }
  return stagedExists ? options.staged : options.pending;
}

export async function stageVersionIntents(options: {
  pending: string;
  repoRoot: string;
  staged: string;
  label: string;
}): Promise<{ staged: boolean }> {
  const source = path.join(options.repoRoot, options.pending);
  const destination = path.join(options.repoRoot, options.staged);
  if (await pathExists(destination)) {
    throw new Error(
      `${capitalize(options.label)} version staging directory already exists: ${options.staged}.`,
    );
  }
  if (!(await pathExists(source))) return { staged: false };
  await rename(source, destination);
  return { staged: true };
}

export function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
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

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
