import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

import semver from "semver";

import {
  createProjectPackageSource,
  type InstalledPackageVersion,
  type ProjectPackageSource,
} from "./offline-project-packages.js";
import { parsePackageSpec } from "./package-spec.js";

/** Environment variable that the offline kit sets to the store directories it ships. */
export const OFFLINE_STORE_ENV = "STARWIND_OFFLINE_STORE";

/** Registry origin written into lockfiles after an offline install. */
export const PUBLIC_REGISTRY_ORIGIN = "https://registry.npmjs.org";

export const OFFLINE_INDEX_SCHEMA_VERSION = 1;

/** Optional file where the local registry appends one line for each request, for diagnostics. */
export const OFFLINE_REQUEST_LOG_ENV = "STARWIND_OFFLINE_REQUEST_LOG";

/** One stored package version, as recorded by the offline kit builder. */
export interface OfflineVersionRecord {
  /** The npm version manifest without `dist`. */
  manifest: Record<string, unknown>;
  dist: {
    integrity: string;
    shasum: string;
    /** Archive file name inside a store `archives` directory. */
    file: string;
    /** Supported platform packages that carry this archive, or null when the main package does. */
    platforms: string[] | null;
  };
}

export interface OfflinePackageRecord {
  distTags: Record<string, string>;
  time: Record<string, string>;
  versions: Record<string, OfflineVersionRecord>;
}

export interface OfflineIndex {
  schemaVersion: number;
  kitVersion: string;
  createdAt: string;
  platforms: string[];
  packages: Record<string, OfflinePackageRecord>;
}

export interface OfflineStore {
  index: OfflineIndex;
  /** Store directories, main package first. */
  directories: string[];
  /** Supported platforms that have a platform package in this store. */
  installedPlatforms: Set<string>;
}

export class OfflineKitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfflineKitError";
  }
}

/** Returns the store directories when the CLI runs from the offline kit. */
export function getOfflineStoreDirectories(env: NodeJS.ProcessEnv = process.env): string[] | null {
  const value = env[OFFLINE_STORE_ENV]?.trim();
  if (!value) return null;
  const directories = value
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return directories.length > 0 ? directories : null;
}

export function isOfflineMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return getOfflineStoreDirectories(env) !== null;
}

/** Message for a feature that needs the network while the CLI runs from the offline kit. */
export function offlineNetworkMessage(feature: string): string {
  return `${feature} needs a network connection. The Starwind offline kit cannot provide it. Run the command with starwind instead of starwind-offline when you are online.`;
}

/** Message for a host framework that a project must install before it works offline. */
export function offlineHostFrameworkMessage(packageName: string, minimumVersion: string): string {
  return `The Starwind offline kit does not contain ${packageName}. Install ${packageName} ${minimumVersion} or later with a network connection, then run starwind-offline init again.`;
}

/** Throws when the CLI runs from the offline kit and the feature needs the network. */
export function assertOnlineFeature(feature: string, env: NodeJS.ProcessEnv = process.env): void {
  if (isOfflineMode(env)) throw new OfflineKitError(offlineNetworkMessage(feature));
}

/** Returns the supported platform key for this machine, such as `darwin-arm64` or `linux-x64-gnu`. */
export function getCurrentOfflinePlatform(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
  libc: "gnu" | "musl" = detectLibc(),
): string {
  return platform === "linux" ? `${platform}-${arch}-${libc}` : `${platform}-${arch}`;
}

function detectLibc(): "gnu" | "musl" {
  if (process.platform !== "linux") return "gnu";
  const report = process.report?.getReport?.() as { header?: { glibcVersionRuntime?: string } };
  return report?.header?.glibcVersionRuntime ? "gnu" : "musl";
}

const storeCache = new Map<string, OfflineStore>();

/** Loads the kit index from the main store directory and finds the installed platform packages. */
export function loadOfflineStore(directories: string[]): OfflineStore {
  const key = directories.join(path.delimiter);
  const cached = storeCache.get(key);
  if (cached) return cached;

  const [mainDirectory] = directories;
  const indexPath = path.join(mainDirectory!, "index.json");
  let index: OfflineIndex;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf8")) as OfflineIndex;
  } catch (error) {
    throw new OfflineKitError(
      `The Starwind offline kit index could not be read at ${indexPath}: ${error instanceof Error ? error.message : String(error)}. Reinstall @starwind-ui/offline.`,
    );
  }
  if (index.schemaVersion !== OFFLINE_INDEX_SCHEMA_VERSION || !index.packages) {
    throw new OfflineKitError(
      `The Starwind offline kit index at ${indexPath} has an unsupported format. Reinstall @starwind-ui/offline.`,
    );
  }

  const installedPlatforms = new Set<string>();
  for (const directory of directories.slice(1)) {
    try {
      const marker = JSON.parse(readFileSync(path.join(directory, "platform.json"), "utf8")) as {
        platform?: string;
        kitVersion?: string;
      };
      // A platform package from another kit version holds other native archives.
      if (marker.platform && marker.kitVersion === index.kitVersion) {
        installedPlatforms.add(marker.platform);
      }
    } catch {
      // A store directory without a platform marker carries no native archives.
    }
  }

  const store = { index, directories, installedPlatforms };
  storeCache.set(key, store);
  return store;
}

/** Splits a validated `name@selector` spec into its package name and optional selector. */
export function splitPackageSpec(spec: string): { name: string; version?: string } {
  parsePackageSpec(spec, "package dependency");
  const separator = spec.lastIndexOf("@");
  if (separator <= 0) return { name: spec };
  return { name: spec.slice(0, separator), version: spec.slice(separator + 1) };
}

/** Selects the stored version for a range or dist-tag, or undefined when none matches. */
export function selectOfflineVersion(
  record: OfflinePackageRecord,
  range: string | undefined,
): string | undefined {
  const requested = range?.trim() || "latest";
  const tagged = record.distTags[requested];
  if (tagged && record.versions[tagged]) return tagged;
  const validRange = semver.validRange(requested);
  if (!validRange) return undefined;
  return semver.maxSatisfying(Object.keys(record.versions), validRange) ?? undefined;
}

function findArchive(store: OfflineStore, file: string): string | undefined {
  for (const directory of store.directories) {
    const archivePath = path.join(directory, "archives", file);
    if (existsSync(archivePath)) return archivePath;
  }
  return undefined;
}

/**
 * Lists every requested package that the kit cannot install on this machine. An empty list means
 * the package manager can run with the local registry.
 */
export function findUnavailableOfflinePackages(
  store: OfflineStore,
  packageSpecs: string[],
  platform: string = getCurrentOfflinePlatform(),
): string[] {
  const problems: string[] = [];
  if (store.index.platforms.includes(platform) && !store.installedPlatforms.has(platform)) {
    problems.push(
      `the native packages for ${platform} (install @starwind-ui/offline-${platform} at the kit version)`,
    );
  } else if (!store.index.platforms.includes(platform)) {
    problems.push(
      `native packages for ${platform}, which the kit does not support (supported: ${store.index.platforms.join(", ")})`,
    );
  }

  for (const spec of packageSpecs) {
    const { name, version } = splitPackageSpec(spec);
    const record = store.index.packages[name];
    if (!record) {
      problems.push(spec);
      continue;
    }
    const selected = selectOfflineVersion(record, version);
    const archive = selected ? record.versions[selected]?.dist.file : undefined;
    if (!selected || !archive || !findArchive(store, archive)) problems.push(spec);
  }
  return problems;
}

/** True when the output names this exact package, not a longer name such as `sass-embedded`. */
function mentionsPackage(output: string, packageName: string): boolean {
  return [packageName, packageName.replace("/", "%2f")].some((form) => {
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // A slash may come before the name, as in a registry URL, but not after a scope such as
    // `@types/`, so `react` does not match `@types/react`.
    return new RegExp(`(?<![\\w@.-])(?<!@[\\w.~-]+/)${escaped}(?![\\w.-])`, "i").test(output);
  });
}

/**
 * Explains a package manager failure that came from a package outside the kit, such as a peer
 * that the project has not installed. Returns undefined when the kit was not the cause.
 */
export function explainOfflineInstallFailure(
  missingPackages: Iterable<string>,
  error: unknown,
): OfflineKitError | undefined {
  // npm also asks for optional peers that it does not need, so name only the packages that the
  // package manager output mentions.
  const output = error instanceof Error ? error.message : String(error);
  const names = [...missingPackages].filter((name) => mentionsPackage(output, name)).sort();
  if (names.length === 0) return undefined;
  const detail = error instanceof Error ? `\n\n${error.message}` : "";
  return new OfflineKitError(
    `The Starwind offline kit does not contain ${names.join(", ")}, which the package manager needed. Install ${names.length === 1 ? "it" : "them"} with a network connection, then run the command again.${detail}`,
  );
}

/** Fails with one message that names every package the kit cannot install. */
export function assertOfflinePackagesAvailable(store: OfflineStore, packageSpecs: string[]): void {
  const problems = findUnavailableOfflinePackages(store, packageSpecs);
  if (problems.length === 0) return;
  throw new OfflineKitError(
    `The Starwind offline kit cannot install ${problems.join(", ")}. Install ${problems.length === 1 ? "it" : "them"} with a network connection, then run the command again.`,
  );
}

function archiveFileName(packageName: string, version: string): string {
  return `${packageName.split("/").at(-1)}-${version}.tgz`;
}

/**
 * Publish time for installed host versions. The real time is unknown offline, and the version
 * already passed any release-age rule when it was installed.
 */
export const INSTALLED_VERSION_TIME = "2000-01-01T00:00:00.000Z";

/**
 * Builds the npm package document that package managers read from the local registry. Kit
 * versions come first. Installed project versions that the kit lacks are added as metadata only.
 */
export function createOfflinePackument(
  packageName: string,
  record: OfflinePackageRecord | undefined,
  origin: string,
  installed: InstalledPackageVersion[] = [],
): Record<string, unknown> {
  const versions: Record<string, unknown> = {};
  const time: Record<string, string> = { ...(record?.time ?? {}) };
  for (const [version, entry] of Object.entries(record?.versions ?? {})) {
    versions[version] = {
      ...entry.manifest,
      name: packageName,
      version,
      dist: {
        integrity: entry.dist.integrity,
        shasum: entry.dist.shasum,
        tarball: `${origin}/${packageName}/-/${archiveFileName(packageName, version)}`,
      },
    };
  }
  for (const entry of installed) {
    if (versions[entry.version]) continue;
    versions[entry.version] = {
      ...entry.manifest,
      name: packageName,
      version: entry.version,
      dist: {
        ...(entry.integrity ? { integrity: entry.integrity } : {}),
        tarball: `${origin}/${packageName}/-/${archiveFileName(packageName, entry.version)}`,
      },
    };
    time[entry.version] = INSTALLED_VERSION_TIME;
  }
  const distTags = { ...(record?.distTags ?? {}) };
  if (!distTags.latest) {
    const latest = semver.maxSatisfying(Object.keys(versions), "*", { includePrerelease: true });
    if (latest) distTags.latest = latest;
  }
  const times = Object.entries(time)
    .filter(([key]) => key !== "created" && key !== "modified")
    .map(([, value]) => value)
    .sort();
  time.created ??= times[0] ?? INSTALLED_VERSION_TIME;
  time.modified ??= times.at(-1) ?? INSTALLED_VERSION_TIME;
  return {
    _id: packageName,
    name: packageName,
    "dist-tags": distTags,
    time,
    modified: time.modified,
    versions,
  };
}

/** Splits a registry request path into a package name and an optional archive file name. */
export function parseOfflineRequestPath(
  requestPath: string,
): { packageName: string; archive?: string } | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return undefined;
  }
  const match = /^\/((?:@[^/]+\/)?[^/@][^/]*)(?:\/-\/((?:@[^/]+\/)?[^/]+\.tgz))?\/?$/.exec(decoded);
  if (!match) return undefined;
  const archive = match[2]?.split("/").at(-1);
  return { packageName: match[1]!, ...(archive ? { archive } : {}) };
}

export interface OfflineRegistry {
  origin: string;
  /** Package names that a package manager asked for and the kit could not describe. */
  missingPackages: Set<string>;
  close(): Promise<void>;
}

/**
 * Starts a loopback registry. It serves archives only from the kit, and metadata for kit packages
 * and for packages already installed in the project.
 */
export async function startOfflineRegistry(
  store: OfflineStore,
  projectPackages: ProjectPackageSource = createProjectPackageSource(),
): Promise<OfflineRegistry> {
  let origin = "";
  const missingPackages = new Set<string>();
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response).catch(() => {
      if (!response.headersSent) response.writeHead(500);
      response.end();
    });
  });

  const requestLog = process.env[OFFLINE_REQUEST_LOG_ENV];
  if (requestLog) {
    server.on("request", (request: IncomingMessage, response: ServerResponse) => {
      response.on("finish", () => {
        try {
          appendFileSync(requestLog, `${response.statusCode} ${request.method} ${request.url}\n`);
        } catch {
          // Diagnostics must never break an install.
        }
      });
    });
  }

  async function handleRequest(request: IncomingMessage, response: ServerResponse) {
    if ((request.method !== "GET" && request.method !== "HEAD") || !request.url) {
      response.writeHead(405).end();
      return;
    }
    const parsed = parseOfflineRequestPath(new URL(request.url, "http://127.0.0.1").pathname);
    const record = parsed ? store.index.packages[parsed.packageName] : undefined;
    const installed = parsed && !parsed.archive ? projectPackages.versions(parsed.packageName) : [];
    if (parsed && !parsed.archive && !record && installed.length === 0) {
      missingPackages.add(parsed.packageName);
    }
    if (!parsed || (!record && installed.length === 0)) {
      response.writeHead(404, { "content-type": "application/json" }).end('{"error":"not_found"}');
      return;
    }

    if (parsed.archive) {
      const version = Object.keys(record?.versions ?? {}).find(
        (candidate) => archiveFileName(parsed.packageName, candidate) === parsed.archive,
      );
      const archive =
        record && version ? findArchive(store, record.versions[version]!.dist.file) : undefined;
      if (!archive) {
        // Recorded so a failed install can name it, such as a pinned pnpm the launcher never cached.
        missingPackages.add(parsed.packageName);
        response.writeHead(404).end();
        return;
      }
      const body = await readFile(archive);
      response.writeHead(200, {
        "content-length": body.length,
        "content-type": "application/octet-stream",
      });
      response.end(request.method === "HEAD" ? undefined : body);
      return;
    }

    const body = JSON.stringify(
      createOfflinePackument(parsed.packageName, record, origin, installed),
    );
    response.writeHead(200, {
      "content-length": Buffer.byteLength(body),
      "content-type": "application/json",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  }

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  origin = `http://127.0.0.1:${port}`;

  return {
    origin,
    missingPackages,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}

/** Environment that points each package manager at the local registry for one install. */
export function getOfflinePackageManagerEnv(origin: string): NodeJS.ProcessEnv {
  const registry = `${origin}/`;
  return {
    // npm, pnpm 10 and earlier, and Yarn 1
    npm_config_registry: registry,
    npm_config_update_notifier: "false",
    npm_config_audit: "false",
    npm_config_fund: "false",
    // pnpm 11 and later read only `pnpm_config_*` variables.
    pnpm_config_registry: registry,
    pnpm_config_update_notifier: "false",
    YARN_REGISTRY: registry,
    // Yarn 2 and later
    // Yarn 2+ joins this value and the archive path itself, so a trailing slash would make it
    // record an encoded `__archiveUrl` in yarn.lock.
    YARN_NPM_REGISTRY_SERVER: origin,
    YARN_UNSAFE_HTTP_WHITELIST: "127.0.0.1",
    YARN_ENABLE_TELEMETRY: "0",
  };
}

/** Returns the Yarn major version, or undefined when Yarn does not run. */
export async function detectYarnMajor(
  runYarn: (args: string[]) => Promise<string>,
): Promise<number | undefined> {
  try {
    return semver.coerce((await runYarn(["--version"])).trim())?.major;
  } catch {
    return undefined;
  }
}

/**
 * Yarn 2+ caches registry metadata by host name without the port, so archive URLs from an earlier
 * offline run would point at a closed port. A temporary global folder keeps that metadata out of
 * the user's cache. The package cache stays where the project expects it.
 */
export async function getYarnBerryIsolationEnv(
  runYarn: (args: string[]) => Promise<string>,
  temporaryGlobalFolder: string,
): Promise<NodeJS.ProcessEnv> {
  // `cacheFolder` reports the global cache when the global cache is on. Pointing a project cache at
  // that same folder keeps every existing archive available after the global folder moves.
  const cacheFolder = (await runYarn(["config", "get", "cacheFolder"])).trim();
  if (!cacheFolder) return {};
  return {
    YARN_GLOBAL_FOLDER: temporaryGlobalFolder,
    YARN_ENABLE_GLOBAL_CACHE: "false",
    YARN_CACHE_FOLDER: cacheFolder,
    YARN_ENABLE_MIRROR: "false",
  };
}

/**
 * Bun keys its package cache by registry, so with the kit registry it downloads installed
 * packages again when it rearranges `node_modules`. The kit does not contain those packages.
 */
export function bunOfflineMessage(): string {
  return "The Starwind offline kit does not support Bun, which downloads installed packages again from the kit registry. Use npm, pnpm, or Yarn 2 or later, or run starwind with a network connection.";
}

/**
 * Yarn 1 downloads the optional native packages for every platform from the URLs in `yarn.lock`
 * on each install. The kit stores native archives only for supported platforms, so Yarn 1 cannot
 * install offline after the first native package.
 */
export function yarnClassicOfflineMessage(): string {
  return "The Starwind offline kit does not support Yarn 1, which downloads native packages for every platform on each install. Use npm, pnpm, or Yarn 2 or later, or run starwind with a network connection.";
}

const LOCKFILE_NAMES = [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  path.join("node_modules", ".package-lock.json"),
  path.join("node_modules", ".modules.yaml"),
  path.join("node_modules", ".pnpm", "lock.yaml"),
  path.join("node_modules", ".yarn-integrity"),
];

function repairContent(content: string, origin: string): string {
  return content.split(origin).join(PUBLIC_REGISTRY_ORIGIN);
}

function lockfileCandidates(cwd: string): string[] {
  const files: string[] = [];
  let directory = path.resolve(cwd);
  for (;;) {
    for (const name of LOCKFILE_NAMES) files.push(path.join(directory, name));
    const parent = path.dirname(directory);
    if (parent === directory) return files;
    directory = parent;
  }
}

/**
 * Replaces the local registry origin with the public npm registry in the lockfiles of the project
 * and its parent directories. Returns the files that changed.
 */
export async function repairOfflineLockfiles(
  origin: string,
  cwd = process.cwd(),
): Promise<string[]> {
  const changed: string[] = [];
  for (const file of lockfileCandidates(cwd)) {
    let content: string;
    try {
      content = await readFile(file, "utf8");
    } catch {
      continue;
    }
    if (!content.includes(origin)) continue;
    await writeFile(file, repairContent(content, origin), "utf8");
    changed.push(file);
  }
  return changed;
}

/** Synchronous repair for interrupt and exit handlers, where async work cannot finish. */
export function repairOfflineLockfilesSync(origin: string, cwd = process.cwd()): void {
  for (const file of lockfileCandidates(cwd)) {
    try {
      const content = readFileSync(file, "utf8");
      if (content.includes(origin)) writeFileSync(file, repairContent(content, origin), "utf8");
    } catch {
      // Missing or unreadable files have nothing to repair.
    }
  }
}

/** Thrown after an interrupted offline install has repaired the lockfiles. */
export class OfflineInstallInterruptedError extends Error {
  readonly exitCode: number;
  constructor(readonly signal: NodeJS.Signals) {
    super(`The offline install stopped on ${signal}.`);
    this.name = "OfflineInstallInterruptedError";
    this.exitCode = signal === "SIGINT" ? 130 : 143;
  }
}

/**
 * Runs an offline install and repairs lockfiles even when the user interrupts it. An interrupt
 * stops the package manager through `signal`, waits for it to exit, repairs the lockfiles, and
 * throws `OfflineInstallInterruptedError`. The exit handler repairs again in case another handler
 * exits the process first.
 */
export async function withOfflineLockfileRepair<T>(
  origin: string,
  task: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let interruptedBy: NodeJS.Signals | undefined;
  const repairOnExit = () => repairOfflineLockfilesSync(origin);
  const interrupt = (signal: NodeJS.Signals) => {
    interruptedBy ??= signal;
    controller.abort();
  };
  process.once("exit", repairOnExit);
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  let result: T;
  try {
    result = await task(controller.signal);
  } catch (error) {
    if (!interruptedBy) throw error;
  } finally {
    // The handlers stay active until the repair finishes, so a second interrupt cannot cut it short.
    await repairOfflineLockfiles(origin);
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    process.removeListener("exit", repairOnExit);
  }
  // The caller cleans up its registry and temporary folder, then exits with this code.
  if (interruptedBy) throw new OfflineInstallInterruptedError(interruptedBy);
  return result!;
}
