#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CHANGESET_IGNORED_PACKAGES,
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

function getPnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function getPackageDir(entry) {
  return path.join(ROOT_DIR, entry.directory);
}

function quoteWindowsCommandArg(arg) {
  if (/^[A-Za-z0-9._:/=@+-]+$/.test(arg)) return arg;
  if (/["&<>|^%!\r\n]/.test(arg)) {
    throw new Error(`Cannot safely pass argument to cmd.exe: ${arg}`);
  }
  return `"${arg}"`;
}

function createSpawn(command, args) {
  if (process.platform === "win32" && command.endsWith(".cmd")) {
    return {
      args: ["/d", "/s", "/c", [command, ...args].map(quoteWindowsCommandArg).join(" ")],
      command: "cmd.exe",
    };
  }
  return { args, command };
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

function getResumeIndex(resumeFrom) {
  if (!resumeFrom) return 0;
  const index = RELEASE_PACKAGE_SET.findIndex((entry) => entry.name === resumeFrom);
  if (index === -1) {
    throw new Error(
      `Unknown --resume-from package: ${resumeFrom}. Expected one of: ${RELEASE_PACKAGE_SET.map((entry) => entry.name).join(", ")}.`,
    );
  }
  return index;
}

export function createPublishCommands({ dryRun = false, otp, resumeFrom, tag = "beta" } = {}) {
  if (!SAFE_DIST_TAG_PATTERN.test(tag)) throw new Error(`Invalid npm dist-tag: ${tag}.`);
  if (otp && !/^\d{6,8}$/.test(otp)) {
    throw new Error("Expected --otp to be a numeric one-time password.");
  }
  if (dryRun && resumeFrom) {
    throw new Error("--resume-from is available only for a real publish.");
  }

  return RELEASE_PACKAGE_SET.slice(getResumeIndex(resumeFrom)).map((entry) => {
    const args = ["publish", "--tag", tag, "--access", "public", "--no-git-checks"];
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

function parseVersion(version) {
  const match = EXACT_VERSION_PATTERN.exec(version ?? "");
  if (!match) return undefined;
  const prerelease = match[4];
  return {
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

  return { errors, ok: errors.length === 0, tag };
}

export function validateReleaseChangesetConfig(config) {
  const ignoredPackages = [...(config?.ignore ?? [])].sort();
  const expectedIgnoredPackages = [...CHANGESET_IGNORED_PACKAGES].sort();
  const errors = [];
  if (JSON.stringify(ignoredPackages) !== JSON.stringify(expectedIgnoredPackages)) {
    errors.push(`Changesets must ignore exactly: ${expectedIgnoredPackages.join(", ")}.`);
  }
  return { errors, ok: errors.length === 0 };
}

export function createUserPublishHandoff({ resumeFrom, tag }) {
  const resumeIndex = getResumeIndex(resumeFrom);
  const command = resumeFrom
    ? `node scripts/release-packages.mjs --publish --resume-from ${resumeFrom}`
    : tag === "beta"
      ? "pnpm publish:beta"
      : "pnpm publish:release";
  return {
    command,
    packages: RELEASE_PACKAGE_SET.slice(resumeIndex).map((entry) => entry.name),
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

export function validatePublishedPrefix(publishedNames) {
  const expected = RELEASE_PACKAGE_SET.map((entry) => entry.name);
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

async function readPrereleaseState() {
  try {
    return JSON.parse(await readFile(path.join(ROOT_DIR, ".changeset", "pre.json"), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

async function assertReleaseMetadata() {
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
  return { tag: results[0].tag };
}

export function parseArgs(argv) {
  let dryRun = false;
  let publish = false;
  let otp;
  let resumeFrom;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--publish") publish = true;
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
  getResumeIndex(resumeFrom);
  return { dryRun, otp, resumeFrom };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const spawned = createSpawn(command, args);
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

async function readGitOutput(args) {
  let output = "";
  await new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "inherit"],
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("exit", (code) => {
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

async function assertPublicMainForPublish() {
  const [status, originUrl, branch, head, originMain] = await Promise.all([
    readGitOutput(["status", "--porcelain"]),
    readGitOutput(["remote", "get-url", "origin"]),
    readGitOutput(["branch", "--show-current"]),
    readGitOutput(["rev-parse", "HEAD"]),
    readGitOutput(["rev-parse", "--verify", "refs/remotes/origin/main"]),
  ]);
  const result = validatePublishGitState({ branch, head, originMain, originUrl, status });
  if (!result.ok) throw new Error(`Publish Git state is not ready:\n${result.errors.join("\n")}`);
}

async function main() {
  const { dryRun, otp, resumeFrom } = parseArgs(process.argv.slice(2));
  const { tag } = await assertReleaseMetadata();
  if (!dryRun) await assertPublicMainForPublish();

  for (const publishCommand of createPublishCommands({ dryRun, otp, resumeFrom, tag })) {
    const relativeDir = path.relative(ROOT_DIR, publishCommand.cwd);
    const modeLabel = dryRun ? "dry-run" : "publish";
    console.log(`[${modeLabel}] ${publishCommand.packageName} from ${relativeDir}`);
    await runCommand(publishCommand.command, publishCommand.args, {
      cwd: publishCommand.cwd,
      packageName: publishCommand.packageName,
    });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
