import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import semver from "semver";

/** A package version that the project already has installed or locked. */
export interface InstalledPackageVersion {
  version: string;
  manifest: Record<string, unknown>;
  integrity?: string;
}

/**
 * Package managers read registry metadata for packages that the project already has, such as
 * `astro`, to check peers. The offline kit does not contain host packages, so the local registry
 * describes the installed copies instead. No archive is served for them: they are already
 * installed.
 */
export interface ProjectPackageSource {
  versions(packageName: string): InstalledPackageVersion[];
}

const MANIFEST_FIELDS = [
  "name",
  "version",
  "description",
  "license",
  "bin",
  "engines",
  "os",
  "cpu",
  "libc",
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
] as const;

function readJson(file: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function readText(file: string): string | undefined {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}

function ancestors(start: string): string[] {
  const directories: string[] = [];
  let directory = path.resolve(start);
  for (;;) {
    directories.push(directory);
    const parent = path.dirname(directory);
    if (parent === directory) return directories;
    directory = parent;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Finds the lockfile integrity for an installed version, when the lockfile records one. */
function createIntegrityLookup(directories: string[]) {
  const lockfiles = directories.flatMap((directory) =>
    ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock"].map((name) => ({
      file: path.join(directory, name),
      name,
    })),
  );
  const contents = new Map<string, string | undefined>();
  const read = (file: string) => {
    if (!contents.has(file)) contents.set(file, readText(file));
    return contents.get(file);
  };

  return (packageName: string, version: string): string | undefined => {
    const name = escapeRegExp(packageName);
    const exact = escapeRegExp(version);
    for (const { file, name: lockfile } of lockfiles) {
      const content = read(file);
      if (!content) continue;
      let match: RegExpExecArray | null = null;
      if (lockfile === "package-lock.json") {
        const lock = readJson(file) as
          | { packages?: Record<string, { version?: string; integrity?: string }> }
          | undefined;
        for (const [key, entry] of Object.entries(lock?.packages ?? {})) {
          if (
            (key === `node_modules/${packageName}` ||
              key.endsWith(`/node_modules/${packageName}`)) &&
            entry.version === version &&
            entry.integrity
          ) {
            return entry.integrity;
          }
        }
        continue;
      }
      if (lockfile === "pnpm-lock.yaml") {
        match = new RegExp(
          `^ {2}'?${name}@${exact}'?:\\n {4}resolution: \\{integrity: ([^,}\\s]+)`,
          "m",
        ).exec(content);
      } else if (lockfile === "yarn.lock") {
        match = new RegExp(
          `^"?${name}@[^\\n]*:\\n {2}version "?${exact}"?\\n(?: {2}[^\\n]*\\n)*? {2}integrity "?(sha\\d+-[^"\\s]+)`,
          "m",
        ).exec(content);
      } else if (lockfile === "bun.lock") {
        match = new RegExp(`"${name}@${exact}", "[^"]*", \\{[^\\n]*\\}, "(sha\\d+-[^"]+)"`).exec(
          content,
        );
      }
      if (match?.[1]) return match[1];
    }
    return undefined;
  };
}

type LockedVersions = Map<string, Map<string, InstalledPackageVersion>>;

function addLocked(
  locked: LockedVersions,
  name: string,
  version: string,
  manifest: Record<string, unknown>,
  integrity?: string,
): void {
  if (!name || !version) return;
  const versions = locked.get(name) ?? new Map<string, InstalledPackageVersion>();
  const existing = versions.get(version);
  if (existing) {
    // pnpm lists one package entry and several snapshot entries for each version.
    for (const field of ["dependencies", "optionalDependencies"] as const) {
      const extra = manifest[field] as Record<string, string> | undefined;
      if (extra) {
        existing.manifest[field] = {
          ...(existing.manifest[field] as Record<string, string> | undefined),
          ...extra,
        };
      }
    }
    if (!existing.integrity && integrity) existing.integrity = integrity;
  } else {
    versions.set(version, {
      version,
      manifest: { name, version, ...manifest },
      ...(integrity ? { integrity } : {}),
    });
  }
  locked.set(name, versions);
}

/** Splits a pnpm lockfile key such as `@scope/name@1.2.3(peer@1.0.0)`. */
export function splitPnpmLockKey(key: string): { name: string; version: string } | undefined {
  const withoutPeers = key.replace(/\(.*$/, "");
  const separator = withoutPeers.lastIndexOf("@");
  if (separator <= 0) return undefined;
  const version = withoutPeers.slice(separator + 1);
  if (!semver.valid(version)) return undefined;
  return { name: withoutPeers.slice(0, separator), version };
}

function unquote(value: string): string {
  const trimmed = value.trim();
  return /^(['"]).*\1$/.test(trimmed) ? trimmed.slice(1, -1) : trimmed;
}

function parseFlowList(value: string): string[] | undefined {
  const match = /^\[(.*)\]$/.exec(value.trim());
  return match ? match[1]!.split(",").map(unquote).filter(Boolean) : undefined;
}

function parseFlowMap(value: string): Record<string, string> | undefined {
  const match = /^\{(.*)\}$/.exec(value.trim());
  if (!match) return undefined;
  const entries = match[1]!
    .split(/,\s*(?=[^\s:,]+:)/)
    .map((entry) => {
      const separator = entry.indexOf(":");
      return separator > 0
        ? [unquote(entry.slice(0, separator)), unquote(entry.slice(separator + 1))]
        : undefined;
    })
    .filter((entry): entry is [string, string] => Boolean(entry));
  return Object.fromEntries(entries);
}

/**
 * Reads the `packages` and `snapshots` sections of a pnpm 9+ lockfile. pnpm writes these
 * sections in a fixed shape, so a line reader is enough and the CLI needs no YAML parser.
 */
export function readPnpmLockfile(
  content: string,
  locked: LockedVersions = new Map(),
): LockedVersions {
  let section = "";
  let key: { name: string; version: string } | undefined;
  let field = "";
  let fields: Record<string, unknown> = {};
  let integrity: string | undefined;
  const flush = () => {
    if (key) addLocked(locked, key.name, key.version, fields, integrity);
    key = undefined;
    field = "";
    fields = {};
    integrity = undefined;
  };
  for (const line of content.split(/\r?\n/)) {
    const top = /^(\S[^:]*):/.exec(line);
    if (top) {
      flush();
      section = top[1]!;
      continue;
    }
    if (section !== "packages" && section !== "snapshots") continue;
    const entry = /^ {2}(\S.*?):\s*(\{\})?$/.exec(line);
    if (entry) {
      flush();
      key = splitPnpmLockKey(unquote(entry[1]!));
      continue;
    }
    if (!key) continue;
    const property = /^ {4}(\w+):\s*(.*)$/.exec(line);
    if (property) {
      field = property[1]!;
      const value = property[2]!.trim();
      if (field === "resolution") {
        integrity = parseFlowMap(value)?.integrity;
      } else if (["os", "cpu", "libc"].includes(field)) {
        fields[field] = parseFlowList(value) ?? [unquote(value)];
      } else if (field === "engines") {
        fields.engines = parseFlowMap(value);
      } else if (field === "deprecated") {
        fields.deprecated = unquote(value);
      }
      continue;
    }
    const nested = /^ {6}(\S.*?):\s*(.*)$/.exec(line);
    if (!nested) continue;
    const name = unquote(nested[1]!);
    const value = unquote(nested[2]!);
    if (field === "peerDependencies") {
      fields.peerDependencies = { ...(fields.peerDependencies as object), [name]: value };
    } else if (field === "peerDependenciesMeta") {
      // The next line holds `optional: true`; pnpm only writes optional peers here.
      fields.peerDependenciesMeta = {
        ...(fields.peerDependenciesMeta as object),
        [name]: { optional: true },
      };
    } else if (field === "dependencies" || field === "optionalDependencies") {
      const version = value.replace(/\(.*$/, "");
      if (semver.valid(version)) {
        fields[field] = { ...(fields[field] as object), [name]: version };
      }
    }
  }
  flush();
  return locked;
}

/** Reads every package entry in an npm `package-lock.json`, including other platforms. */
export function readNpmLockfile(
  content: string,
  locked: LockedVersions = new Map(),
): LockedVersions {
  let lock: { packages?: Record<string, Record<string, unknown>> };
  try {
    lock = JSON.parse(content);
  } catch {
    return locked;
  }
  for (const [key, entry] of Object.entries(lock.packages ?? {})) {
    if (!key.includes("node_modules/") || entry.link) continue;
    const name =
      (entry.name as string | undefined) ?? key.slice(key.lastIndexOf("node_modules/") + 13);
    const version = entry.version as string | undefined;
    if (!version || !semver.valid(version)) continue;
    const manifest = Object.fromEntries(
      MANIFEST_FIELDS.filter((field) => field !== "name" && field !== "version")
        .filter((field) => entry[field] !== undefined)
        .map((field) => [field, entry[field]]),
    );
    addLocked(locked, name, version, manifest, entry.integrity as string | undefined);
  }
  return locked;
}

/** Reads installed package manifests from hoisted and pnpm `node_modules` layouts. */
export function createProjectPackageSource(cwd = process.cwd()): ProjectPackageSource {
  const directories = ancestors(cwd);
  const integrityFor = createIntegrityLookup(directories);
  const cache = new Map<string, InstalledPackageVersion[]>();

  function manifestFiles(packageName: string): string[] {
    const files: string[] = [];
    const pnpmPrefix = `${packageName.replace("/", "+")}@`;
    for (const directory of directories) {
      const modules = path.join(directory, "node_modules");
      files.push(path.join(modules, packageName, "package.json"));
      let pnpmEntries: string[] = [];
      try {
        pnpmEntries = readdirSync(path.join(modules, ".pnpm"));
      } catch {
        // Not a pnpm layout.
      }
      for (const entry of pnpmEntries) {
        if (entry.startsWith(pnpmPrefix)) {
          files.push(
            path.join(modules, ".pnpm", entry, "node_modules", packageName, "package.json"),
          );
        }
      }
    }
    return files;
  }

  let lockedVersions: LockedVersions | undefined;
  const locked = () => {
    if (lockedVersions) return lockedVersions;
    lockedVersions = new Map();
    for (const directory of directories) {
      const pnpmLock = readText(path.join(directory, "pnpm-lock.yaml"));
      if (pnpmLock) readPnpmLockfile(pnpmLock, lockedVersions);
      const npmLock = readText(path.join(directory, "package-lock.json"));
      if (npmLock) readNpmLockfile(npmLock, lockedVersions);
    }
    return lockedVersions;
  };

  return {
    versions(packageName) {
      const cached = cache.get(packageName);
      if (cached) return cached;
      const byVersion = new Map<string, InstalledPackageVersion>();
      for (const file of manifestFiles(packageName)) {
        const manifest = readJson(file);
        if (manifest?.name !== packageName || typeof manifest.version !== "string") continue;
        if (byVersion.has(manifest.version)) continue;
        const picked = Object.fromEntries(
          MANIFEST_FIELDS.filter((field) => manifest[field] !== undefined).map((field) => [
            field,
            manifest[field],
          ]),
        );
        const integrity = integrityFor(packageName, manifest.version);
        byVersion.set(manifest.version, {
          version: manifest.version,
          manifest: picked,
          ...(integrity ? { integrity } : {}),
        });
      }
      // The lockfile also records optional packages for other platforms, which are not installed.
      for (const [version, entry] of locked().get(packageName) ?? []) {
        if (!byVersion.has(version)) byVersion.set(version, entry);
      }
      const versions = [...byVersion.values()];
      cache.set(packageName, versions);
      return versions;
    },
  };
}
