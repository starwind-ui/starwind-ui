#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const BETA_VERSION_PATTERN = /^\d+\.\d+\.\d+-beta\.\d+$/;
const PUBLIC_REPOSITORY = "starwind-ui/starwind-ui";
const EXPECTED_APPLIED_CHANGESETS = Object.freeze([
  "cli-runtime-release",
  "runtime-adapter-platform",
]);
const EXPECTED_IGNORED_PACKAGES = Object.freeze(["demo", "react-demo"]);

export const BETA_PACKAGE_SET = Object.freeze([
  Object.freeze({ directory: "packages/runtime", name: "@starwind-ui/runtime" }),
  Object.freeze({ directory: "packages/astro", name: "@starwind-ui/astro" }),
  Object.freeze({ directory: "packages/react", name: "@starwind-ui/react" }),
  Object.freeze({ directory: "packages/cli", name: "starwind" }),
]);

const BETA_PUBLISH_FLAGS = Object.freeze([
  "--tag",
  "beta",
  "--access",
  "public",
  "--no-git-checks",
]);

function getPnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function getPackageDir(entry) {
  return path.join(ROOT_DIR, entry.directory);
}

function quoteWindowsCommandArg(arg) {
  if (/^[A-Za-z0-9._:/=@+-]+$/.test(arg)) {
    return arg;
  }

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

      continue;
    }

    if (arg.startsWith("--otp=")) {
      redactedArgs.push("--otp=<redacted>");
      continue;
    }

    redactedArgs.push(arg);
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

  const index = BETA_PACKAGE_SET.findIndex((entry) => entry.name === resumeFrom);
  if (index === -1) {
    throw new Error(
      `Unknown --resume-from package: ${resumeFrom}. Expected one of: ${BETA_PACKAGE_SET.map((entry) => entry.name).join(", ")}.`,
    );
  }

  return index;
}

export function createPublishCommands({ dryRun = false, otp, resumeFrom } = {}) {
  if (otp && !/^\d{6,8}$/.test(otp)) {
    throw new Error("Expected --otp to be a numeric one-time password.");
  }

  if (dryRun && resumeFrom) {
    throw new Error("--resume-from is available only for a real publish.");
  }

  return BETA_PACKAGE_SET.slice(getResumeIndex(resumeFrom)).map((entry) => {
    const args = ["publish", ...BETA_PUBLISH_FLAGS];

    if (dryRun) {
      args.push("--dry-run");
    }

    if (otp) {
      args.push("--otp", otp);
    }

    return {
      args,
      command: getPnpmCommand(),
      cwd: getPackageDir(entry),
      packageName: entry.name,
    };
  });
}

async function readPackageManifest(entry) {
  const manifestPath = path.join(getPackageDir(entry), "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  return { entry, manifest };
}

export function validateBetaPackageManifests(packageManifests) {
  const errors = [];
  const runtimeGroup = new Map();

  for (const { entry, manifest } of packageManifests) {
    if (manifest.name !== entry.name) {
      errors.push(`${entry.directory} is expected to be ${entry.name}, found ${manifest.name}.`);
    }

    if (!BETA_VERSION_PATTERN.test(manifest.version ?? "")) {
      errors.push(`${entry.name} must use a numbered beta prerelease version.`);
    }

    if (/\bprototype\b/i.test(manifest.description ?? "")) {
      errors.push(`${entry.name} description must not describe the package as a prototype.`);
    }

    if (entry.name !== "starwind") {
      runtimeGroup.set(entry.name, manifest.version);
    }
  }

  const runtimeVersions = new Set(runtimeGroup.values());
  if (runtimeVersions.size !== 1) {
    errors.push(
      `Runtime adapter package versions must be lockstep, found ${Array.from(runtimeVersions).join(", ")}.`,
    );
  }

  return {
    errors,
    ok: errors.length === 0,
  };
}

export function validateBetaPrereleaseState(preState) {
  const errors = [];

  if (preState?.mode !== "pre") {
    errors.push("Changesets must be in prerelease mode before publishing beta packages.");
  }
  if (preState?.tag !== "beta") {
    errors.push('Changesets prerelease tag must be "beta".');
  }
  const appliedChangesets = [...(preState?.changesets ?? [])].sort();
  if (JSON.stringify(appliedChangesets) !== JSON.stringify(EXPECTED_APPLIED_CHANGESETS)) {
    errors.push(
      `Changesets prerelease state must mark these release changesets as applied: ${EXPECTED_APPLIED_CHANGESETS.join(", ")}.`,
    );
  }

  return { errors, ok: errors.length === 0 };
}

export function validateBetaChangesetConfig(config) {
  const ignoredPackages = [...(config?.ignore ?? [])].sort();
  const expectedIgnoredPackages = [...EXPECTED_IGNORED_PACKAGES].sort();
  const errors = [];

  if (JSON.stringify(ignoredPackages) !== JSON.stringify(expectedIgnoredPackages)) {
    errors.push(`Changesets must ignore exactly: ${expectedIgnoredPackages.join(", ")}.`);
  }

  return { errors, ok: errors.length === 0 };
}

async function assertBetaPrereleaseState() {
  const [preState, config] = await Promise.all([
    readFile(path.join(ROOT_DIR, ".changeset", "pre.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT_DIR, ".changeset", "config.json"), "utf8").then(JSON.parse),
  ]);
  const results = [validateBetaPrereleaseState(preState), validateBetaChangesetConfig(config)];
  const errors = results.flatMap((result) => result.errors);
  if (errors.length > 0) {
    throw new Error(`Beta prerelease state is not ready:\n${errors.join("\n")}`);
  }
}

async function assertBetaPackageMetadata() {
  const packageManifests = await Promise.all(
    BETA_PACKAGE_SET.map((entry) => readPackageManifest(entry)),
  );
  const result = validateBetaPackageManifests(packageManifests);

  if (!result.ok) {
    throw new Error(`Beta package metadata is not ready:\n${result.errors.join("\n")}`);
  }
}

export function parseArgs(argv) {
  let dryRun = false;
  let publish = false;
  let otp;
  let resumeFrom;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--publish") {
      publish = true;
      continue;
    }

    if (arg === "--otp") {
      const otpValue = argv[index + 1];

      if (!otpValue || otpValue.startsWith("--")) {
        throw new Error("Expected a value after --otp.");
      }

      otp = otpValue;
      index += 1;
      continue;
    }

    if (arg === "--resume-from") {
      const packageName = argv[index + 1];

      if (!packageName || packageName.startsWith("--")) {
        throw new Error("Expected a package name after --resume-from.");
      }

      resumeFrom = packageName;
      index += 1;
      continue;
    }

    if (arg.startsWith("--resume-from=")) {
      resumeFrom = arg.slice("--resume-from=".length);
      continue;
    }

    if (arg.startsWith("--otp=")) {
      otp = arg.slice("--otp=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (dryRun === publish) {
    throw new Error("Pass exactly one mode: --dry-run or --publish.");
  }

  if (dryRun && resumeFrom) {
    throw new Error("--resume-from is available only with --publish.");
  }
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
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(formatCommandFailure(command, args, code, options)));
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
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`git ${args.join(" ")} failed with exit code ${code}.`));
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
    errors.push("Refusing to publish beta packages from a dirty working tree.");
  }
  if (normalizeGitHubRepository(originUrl ?? "") !== PUBLIC_REPOSITORY) {
    errors.push(`Real beta publishing must run from the public ${PUBLIC_REPOSITORY} repository.`);
  }
  if (branch !== "main") {
    errors.push(`Real beta publishing must run from main, found ${branch || "detached HEAD"}.`);
  }
  if (!originMain) {
    errors.push("Real beta publishing requires a locally fetched origin/main reference.");
  } else if (head !== originMain) {
    errors.push("Real beta publishing requires HEAD to equal origin/main.");
  }

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

  if (!result.ok) {
    throw new Error(`Beta publish Git state is not ready:\n${result.errors.join("\n")}`);
  }
}

async function main() {
  const { dryRun, otp, resumeFrom } = parseArgs(process.argv.slice(2));

  await assertBetaPackageMetadata();
  await assertBetaPrereleaseState();

  if (!dryRun) {
    await assertPublicMainForPublish();
  }

  for (const publishCommand of createPublishCommands({ dryRun, otp, resumeFrom })) {
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
