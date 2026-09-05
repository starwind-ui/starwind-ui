#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createSpawnCommand } from "./command-process.mjs";
import {
  CHANGESET_IGNORED_PACKAGES,
  CHANGESET_PRIVATE_PACKAGE_POLICY,
  RUNTIME_FIXED_GROUP,
  RUNTIME_RELEASE_PACKAGE_SET,
} from "./runtime-release-policy.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const EXACT_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const SAFE_DIST_TAG_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;
const PUBLIC_REPOSITORY = "starwind-ui/starwind-ui";
export const RELEASE_PACKAGE_SET = RUNTIME_RELEASE_PACKAGE_SET;

export const BETA_PACKAGE_SET = RELEASE_PACKAGE_SET;

export const VUE_BETA_RELEASE_PLAN = Object.freeze([
  Object.freeze({
    directory: "packages/vue",
    name: "@starwind-ui/vue",
    tag: "beta",
    version: "0.1.0",
  }),
  Object.freeze({ directory: "packages/cli", name: "starwind", tag: "latest", version: "3.3.0" }),
]);

const VUE_BETA_RUNTIME_VERSION = "1.2.0";
const VUE_BETA_REGISTRY_BASELINE_FILE =
  "node_modules/.cache/starwind-release/vue-beta-registry-baseline.json";

function getPnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function getPackageDir(entry) {
  return path.join(ROOT_DIR, entry.directory);
}

function getVueBetaRegistryBaselineFile(repoRoot) {
  return path.join(repoRoot, VUE_BETA_REGISTRY_BASELINE_FILE);
}

function getVueBetaPlanIdentity() {
  return VUE_BETA_RELEASE_PLAN.map(({ name, tag, version }) => ({ name, tag, version }));
}

export async function loadVueBetaRegistryBaseline({ head, repoRoot = ROOT_DIR }) {
  const file = getVueBetaRegistryBaselineFile(repoRoot);
  let baseline;
  try {
    baseline = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error("The Vue beta registry baseline is missing.");
    }
    throw new Error("The Vue beta registry baseline is invalid.");
  }
  if (
    baseline?.head !== head ||
    JSON.stringify(baseline?.plan) !== JSON.stringify(getVueBetaPlanIdentity()) ||
    (baseline?.vueLatest !== null && typeof baseline?.vueLatest !== "string")
  ) {
    throw new Error("The Vue beta registry baseline does not match this release commit and plan.");
  }
  return baseline;
}

async function captureNpmOutput(args, spawnProcess = spawn) {
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const spawned = createSpawnCommand(command, args);
  return await new Promise((resolve, reject) => {
    let stderr = "";
    let stdout = "";
    const child = spawnProcess(spawned.command, spawned.args, {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({ code: code ?? 1, stderr: stderr.trim(), stdout: stdout.trim() }),
    );
  });
}

export async function captureVueBetaRegistryBaseline({
  head,
  registry = { capture: (_command, args) => captureNpmOutput(args) },
  repoRoot = ROOT_DIR,
  resumeFrom,
}) {
  try {
    return await loadVueBetaRegistryBaseline({ head, repoRoot });
  } catch (error) {
    if (resumeFrom) {
      throw new Error(
        `Cannot resume the Vue beta publication without its original registry baseline: ${error.message}`,
      );
    }
  }

  const result = await registry.capture("npm", ["view", "@starwind-ui/vue", "dist-tags", "--json"]);
  let vueLatest = null;
  if (result.code === 0) {
    let tags;
    try {
      tags = JSON.parse(result.stdout);
    } catch {
      throw new Error("@starwind-ui/vue dist-tags returned invalid JSON.");
    }
    if (tags?.latest !== undefined && typeof tags.latest !== "string") {
      throw new Error("@starwind-ui/vue latest returned an invalid value.");
    }
    vueLatest = tags?.latest ?? null;
  } else if (!/(?:E404|404 Not Found)/i.test(`${result.stderr}\n${result.stdout}`)) {
    throw new Error(
      `Could not capture @starwind-ui/vue latest before publication: ${result.stderr || result.stdout}`,
    );
  }

  const baseline = { head, plan: getVueBetaPlanIdentity(), vueLatest };
  const file = getVueBetaRegistryBaselineFile(repoRoot);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  return baseline;
}

export function redactCommandArgs(args) {
  const redactedArgs = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--otp") {
      redactedArgs.push(arg);
      if (index + 1 < args.length && !args[index + 1].startsWith("--")) {
        redactedArgs.push("<redacted>");
        index += 1;
      }
    } else if (arg.startsWith("--otp=")) {
      redactedArgs.push("--otp=<redacted>");
    } else {
      redactedArgs.push(arg);
    }
  }
  return redactedArgs;
}

export function formatCommandFailure(command, args, exitCode, options = {}) {
  const formattedCommand = [command, ...redactCommandArgs(args)].join(" ");
  const context = [
    options.packageName ? `package ${options.packageName}` : undefined,
    options.cwd ? `cwd ${options.cwd}` : undefined,
  ].filter(Boolean);
  const formattedContext = context.length > 0 ? ` (${context.join(", ")})` : "";
  return `${formattedCommand}${formattedContext} failed with exit code ${exitCode}.`;
}

function getResumeIndex(resumeFrom, releasePlan = RELEASE_PACKAGE_SET) {
  if (!resumeFrom) return 0;
  const index = releasePlan.findIndex((entry) => entry.name === resumeFrom);
  if (index === -1) {
    throw new Error(
      `Unknown --resume-from package: ${resumeFrom}. Expected one of: ${releasePlan.map((entry) => entry.name).join(", ")}.`,
    );
  }
  return index;
}

export function createPublishCommands({
  dryRun = false,
  otp,
  releasePlan = RELEASE_PACKAGE_SET,
  resumeFrom,
  tag = "beta",
} = {}) {
  if (otp && !/^\d{6,8}$/.test(otp)) {
    throw new Error("Expected --otp to be a numeric one-time password.");
  }
  if (dryRun && resumeFrom) {
    throw new Error("--resume-from is available only for a real publish.");
  }

  return releasePlan.slice(getResumeIndex(resumeFrom, releasePlan)).map((entry) => {
    const packageTag = entry.tag ?? tag;
    if (!SAFE_DIST_TAG_PATTERN.test(packageTag)) {
      throw new Error(`Invalid npm dist-tag: ${packageTag}.`);
    }
    const args = ["publish", "--tag", packageTag, "--access", "public", "--no-git-checks"];
    if (dryRun) args.push("--dry-run");
    if (otp) args.push("--otp", otp);
    return {
      args,
      command: getPnpmCommand(),
      cwd: getPackageDir(entry),
      packageName: entry.name,
    };
  });
}

export function createVueBetaPublishCommands(options = {}) {
  return createPublishCommands({ ...options, releasePlan: VUE_BETA_RELEASE_PLAN });
}

export function formatPublishPlan(packageManifests) {
  return packageManifests.map(
    ({ entry, manifest }) => `${entry.name}@${manifest.version} -> npm tag ${entry.tag}`,
  );
}

function parseVersion(version) {
  const match = EXACT_VERSION_PATTERN.exec(version ?? "");
  if (!match) return undefined;
  const prerelease = match[4];
  return {
    major: Number(match[1]),
    prerelease,
    tag: prerelease ? prerelease.split(".")[0] : "latest",
    version,
  };
}

export function validateReleasePackageManifests(packageManifests, preState) {
  const errors = [];
  const runtimeVersions = new Set();
  const parsedVersions = [];

  for (const { entry, manifest } of packageManifests) {
    if (manifest.name !== entry.name) {
      errors.push(`${entry.directory} is expected to be ${entry.name}, found ${manifest.name}.`);
    }
    const parsed = parseVersion(manifest.version);
    if (!parsed) errors.push(`${entry.name} must use an exact SemVer version.`);
    else parsedVersions.push({ entry, ...parsed });
    if (/\bprototype\b/i.test(manifest.description ?? "")) {
      errors.push(`${entry.name} description must not describe the package as a prototype.`);
    }
    if (entry.name !== "starwind") runtimeVersions.add(manifest.version);
  }

  if (runtimeVersions.size !== 1) {
    errors.push(
      `Runtime adapter package versions must be lockstep, found ${Array.from(runtimeVersions).join(", ")}.`,
    );
  }

  const tags = new Set(parsedVersions.map((item) => item.tag));
  if (tags.size > 1) {
    errors.push(
      `Release packages must share one release channel, found ${Array.from(tags).join(", ")}.`,
    );
  }
  const tag = tags.size === 1 ? tags.values().next().value : undefined;
  if (tag && tag !== "latest") {
    if (preState?.mode !== "pre") {
      errors.push("Changesets must be in active prerelease mode for prerelease publication.");
    }
    if (preState?.tag !== tag) {
      errors.push(`Changesets prerelease tag must match package versions: ${tag}.`);
    }
  } else if (tag === "latest" && preState) {
    errors.push("Stable publication requires Changesets prerelease state to be fully consumed.");
  }

  if (tag === "latest") {
    for (const parsed of parsedVersions) {
      if (parsed.entry.name !== "starwind" && parsed.major < 1) {
        errors.push(`${parsed.entry.name} stable releases must start at 1.0.0 or later.`);
      }
    }
  }

  return { errors, ok: errors.length === 0, tag };
}

export function validateReleaseChangesetConfig(config) {
  const ignoredPackages = [...(config?.ignore ?? [])].sort();
  const expectedIgnoredPackages = [...CHANGESET_IGNORED_PACKAGES].sort();
  const errors = [];
  if (JSON.stringify(ignoredPackages) !== JSON.stringify(expectedIgnoredPackages)) {
    errors.push(`Changesets must ignore exactly: ${expectedIgnoredPackages.join(", ")}.`);
  }
  if (
    JSON.stringify(config?.privatePackages) !== JSON.stringify(CHANGESET_PRIVATE_PACKAGE_POLICY)
  ) {
    errors.push("Changesets must disable private package versioning and tagging.");
  }
  return { errors, ok: errors.length === 0 };
}

export function validateVueBetaReleaseMetadata({ config, fixedGroupManifests, packageManifests }) {
  const errors = [];
  const expectedPlan = VUE_BETA_RELEASE_PLAN.map(({ name, tag, version }) => ({
    name,
    tag,
    version,
  }));
  const actualPlan = packageManifests.map(({ entry, manifest }) => ({
    name: manifest.name,
    tag: entry.tag,
    version: manifest.version,
  }));
  if (JSON.stringify(actualPlan) !== JSON.stringify(expectedPlan)) {
    errors.push(
      `Vue beta release plan must be exactly ${expectedPlan.map(({ name, tag, version }) => `${name}@${version} on ${tag}`).join(", ")} in that order.`,
    );
  }

  const vue = packageManifests.find(({ entry }) => entry.name === "@starwind-ui/vue")?.manifest;
  if (vue?.private === true)
    errors.push("@starwind-ui/vue must be public before beta publication.");
  if (vue?.dependencies?.["@starwind-ui/runtime"] !== VUE_BETA_RUNTIME_VERSION) {
    errors.push(
      `@starwind-ui/vue must depend on exact @starwind-ui/runtime ${VUE_BETA_RUNTIME_VERSION}.`,
    );
  }

  const expectedFixedNames = RUNTIME_RELEASE_PACKAGE_SET.slice(0, 3).map(({ name }) => name);
  const fixedNames = fixedGroupManifests.map(({ manifest }) => manifest.name);
  const fixedVersions = new Set(fixedGroupManifests.map(({ manifest }) => manifest.version));
  if (
    JSON.stringify(fixedNames) !== JSON.stringify(expectedFixedNames) ||
    fixedVersions.size !== 1 ||
    fixedVersions.values().next().value !== VUE_BETA_RUNTIME_VERSION
  ) {
    errors.push(
      `Runtime, Astro, and React must remain unchanged at ${VUE_BETA_RUNTIME_VERSION} for the initial Vue beta.`,
    );
  }

  const configResult = validateReleaseChangesetConfig(config);
  errors.push(...configResult.errors);
  if (JSON.stringify(config?.fixed) !== JSON.stringify([RUNTIME_FIXED_GROUP])) {
    errors.push(
      `Changesets fixed groups must contain only Runtime, Astro, and React in their existing group.`,
    );
  }
  return { errors, ok: errors.length === 0, plan: expectedPlan };
}

export function createUserPublishHandoff({ releasePlan = RELEASE_PACKAGE_SET, resumeFrom, tag }) {
  const resumeIndex = getResumeIndex(resumeFrom, releasePlan);
  const command = resumeFrom
    ? `node scripts/release-packages.mjs${releasePlan === VUE_BETA_RELEASE_PLAN ? " --vue-beta" : ""} --publish --resume-from ${resumeFrom}`
    : releasePlan === VUE_BETA_RELEASE_PLAN
      ? "pnpm publish:vue-beta"
      : tag === "beta"
        ? "pnpm publish:beta"
        : "pnpm publish:release";
  return {
    command,
    packages: releasePlan.slice(resumeIndex).map((entry) => entry.name),
  };
}

export function parsePublishOutput(output) {
  const published = [];
  const pattern = /Published package\s+((?:@[^/\s]+\/)?[^@\s]+)@([^\s]+)/g;
  for (const match of output.matchAll(pattern)) {
    published.push({ name: match[1], version: match[2] });
  }
  return published;
}

export function validatePublishedPrefix(publishedNames, releasePlan = RELEASE_PACKAGE_SET) {
  const expected = releasePlan.map((entry) => entry.name);
  const valid = publishedNames.every((name, index) => name === expected[index]);
  return {
    complete: valid && publishedNames.length === expected.length,
    firstMissing: valid ? expected[publishedNames.length] : undefined,
    valid,
  };
}

async function readPackageManifest(entry) {
  const manifestPath = path.join(getPackageDir(entry), "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  return { entry, manifest };
}

export async function assertVueBetaReleaseMetadata() {
  const fixedGroupEntries = RUNTIME_RELEASE_PACKAGE_SET.slice(0, 3);
  const [packageManifests, fixedGroupManifests, config] = await Promise.all([
    Promise.all(VUE_BETA_RELEASE_PLAN.map((entry) => readPackageManifest(entry))),
    Promise.all(fixedGroupEntries.map((entry) => readPackageManifest(entry))),
    readFile(path.join(ROOT_DIR, ".changeset", "config.json"), "utf8").then(JSON.parse),
  ]);
  const result = validateVueBetaReleaseMetadata({ config, fixedGroupManifests, packageManifests });
  if (!result.ok)
    throw new Error(`Vue beta release metadata is not ready:\n${result.errors.join("\n")}`);
  return { packageManifests, plan: result.plan };
}

async function readPrereleaseState() {
  try {
    return JSON.parse(await readFile(path.join(ROOT_DIR, ".changeset", "pre.json"), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function assertReleaseMetadata() {
  const [packageManifests, preState, config] = await Promise.all([
    Promise.all(RELEASE_PACKAGE_SET.map((entry) => readPackageManifest(entry))),
    readPrereleaseState(),
    readFile(path.join(ROOT_DIR, ".changeset", "config.json"), "utf8").then(JSON.parse),
  ]);
  const results = [
    validateReleasePackageManifests(packageManifests, preState),
    validateReleaseChangesetConfig(config),
  ];
  const errors = results.flatMap((result) => result.errors);
  if (errors.length > 0) throw new Error(`Release metadata is not ready:\n${errors.join("\n")}`);
  return { packageManifests, tag: results[0].tag };
}

export function parseArgs(argv) {
  let dryRun = false;
  let publish = false;
  let otp;
  let resumeFrom;
  let vueBeta = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--publish") publish = true;
    else if (arg === "--vue-beta") vueBeta = true;
    else if (arg === "--otp") {
      const otpValue = argv[index + 1];
      if (!otpValue || otpValue.startsWith("--")) throw new Error("Expected a value after --otp.");
      otp = otpValue;
      index += 1;
    } else if (arg.startsWith("--otp=")) otp = arg.slice("--otp=".length);
    else if (arg === "--resume-from") {
      const packageName = argv[index + 1];
      if (!packageName || packageName.startsWith("--")) {
        throw new Error("Expected a package name after --resume-from.");
      }
      resumeFrom = packageName;
      index += 1;
    } else if (arg.startsWith("--resume-from=")) {
      resumeFrom = arg.slice("--resume-from=".length);
    } else throw new Error(`Unknown argument: ${arg}`);
  }

  if (dryRun === publish) throw new Error("Pass exactly one mode: --dry-run or --publish.");
  if (dryRun && resumeFrom) throw new Error("--resume-from is available only with --publish.");
  getResumeIndex(resumeFrom, vueBeta ? VUE_BETA_RELEASE_PLAN : RELEASE_PACKAGE_SET);
  return { dryRun, otp, resumeFrom, vueBeta };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const spawned = createSpawnCommand(command, args);
    const child = spawn(spawned.command, spawned.args, {
      cwd: options.cwd ?? ROOT_DIR,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(formatCommandFailure(command, args, code, options)));
    });
  });
}

export async function readGitOutput(args, spawnGit = spawn) {
  let output = "";
  await new Promise((resolve, reject) => {
    const child = spawnGit("git", args, {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "inherit"],
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`git ${args.join(" ")} failed with exit code ${code}.`));
    });
  });
  return output.trim();
}

export function isDirtyGitStatusOutput(output) {
  return Boolean(output.trim());
}

function normalizeGitHubRepository(remoteUrl) {
  return remoteUrl
    .trim()
    .replace(/^git@github\.com:/, "")
    .replace(/^ssh:\/\/git@github\.com\//, "")
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "");
}

export function validatePublishGitState({ branch, head, originMain, originUrl, status }) {
  const errors = [];
  if (isDirtyGitStatusOutput(status)) {
    errors.push("Refusing to publish packages from a dirty working tree.");
  }
  if (normalizeGitHubRepository(originUrl ?? "") !== PUBLIC_REPOSITORY) {
    errors.push(`Real publishing must run from the public ${PUBLIC_REPOSITORY} repository.`);
  }
  if (branch !== "main") {
    errors.push(`Real publishing must run from main, found ${branch || "detached HEAD"}.`);
  }
  if (!originMain) errors.push("Real publishing requires a locally fetched origin/main reference.");
  else if (head !== originMain) errors.push("Real publishing requires HEAD to equal origin/main.");
  return { errors, ok: errors.length === 0 };
}

export async function assertPublicMainForPublish() {
  const [status, originUrl, branch, head, originMain] = await Promise.all([
    readGitOutput(["status", "--porcelain"]),
    readGitOutput(["remote", "get-url", "origin"]),
    readGitOutput(["branch", "--show-current"]),
    readGitOutput(["rev-parse", "HEAD"]),
    readGitOutput(["rev-parse", "--verify", "refs/remotes/origin/main"]),
  ]);
  const result = validatePublishGitState({ branch, head, originMain, originUrl, status });
  if (!result.ok) throw new Error(`Publish Git state is not ready:\n${result.errors.join("\n")}`);
  return { head };
}

export async function executeReleasePublication({
  dryRun,
  finalize,
  publishCommands,
  runPublish = runCommand,
}) {
  for (const publishCommand of publishCommands) {
    const relativeDir = path.relative(ROOT_DIR, publishCommand.cwd);
    const modeLabel = dryRun ? "dry-run" : "publish";
    console.log(`[${modeLabel}] ${publishCommand.packageName} from ${relativeDir}`);
    await runPublish(publishCommand.command, publishCommand.args, {
      cwd: publishCommand.cwd,
      packageName: publishCommand.packageName,
    });
  }
  if (!dryRun) await finalize();
}

async function main() {
  const { dryRun, otp, resumeFrom, vueBeta } = parseArgs(process.argv.slice(2));
  const metadata = vueBeta ? await assertVueBetaReleaseMetadata() : await assertReleaseMetadata();
  const gitState = !dryRun ? await assertPublicMainForPublish() : undefined;
  if (vueBeta && gitState) {
    await captureVueBetaRegistryBaseline({ head: gitState.head, resumeFrom });
  }
  if (vueBeta) {
    console.log("[publish-plan] Approved Vue beta release order:");
    for (const target of formatPublishPlan(metadata.packageManifests)) console.log(`- ${target}`);
  }
  const finalize = async () => {
    const { runReleaseFinalization } = await import("./release-finalization.mjs");
    await runReleaseFinalization({ vueBeta });
  };
  await executeReleasePublication({
    dryRun,
    finalize,
    publishCommands: createPublishCommands({
      dryRun,
      otp,
      releasePlan: vueBeta ? VUE_BETA_RELEASE_PLAN : RELEASE_PACKAGE_SET,
      resumeFrom,
      tag: metadata.tag,
    }),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
