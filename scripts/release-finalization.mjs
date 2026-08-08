#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createSpawnCommand } from "./command-process.mjs";
import { assertPublicMainForPublish, assertReleaseMetadata } from "./release-packages.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const PUBLIC_REPOSITORY = "starwind-ui/starwind-ui";

export function createCommandSystem({ cwd = ROOT_DIR, spawnProcess = spawn } = {}) {
  async function capture(command, args) {
    const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
    const shape = createSpawnCommand(executable, args);
    return await new Promise((resolve, reject) => {
      let settled = false;
      let stderr = "";
      let stdout = "";
      const child = spawnProcess(shape.command, shape.args, {
        cwd,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });
      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        resolve({ code: code ?? 1, stderr: stderr.trim(), stdout: stdout.trim() });
      });
    });
  }

  async function run(command, args) {
    const result = await capture(command, args);
    if (result.code !== 0) {
      const detail = result.stderr || result.stdout;
      throw new Error(
        `${[command, ...args].join(" ")} failed with exit code ${result.code}${detail ? `:\n${detail}` : "."}`,
      );
    }
  }

  return { capture, run };
}

export function deriveReleaseIdentity(packageManifests, npmTag, head) {
  const packages = packageManifests.map(({ entry, manifest }) => ({
    name: entry.name,
    version: manifest.version,
  }));
  const cli = packages.find((entry) => entry.name === "starwind");
  if (!cli?.version) throw new Error("The starwind package must have an exact version.");
  return {
    head,
    npmTag,
    packages,
    prerelease: cli.version.includes("-"),
    tagName: `v${cli.version}`,
  };
}

export function createGitHubReleaseArgs({ prerelease, tagName }) {
  const args = [
    "release",
    "create",
    tagName,
    "--repo",
    PUBLIC_REPOSITORY,
    "--verify-tag",
    "--generate-notes",
  ];
  if (prerelease) args.push("--prerelease", "--latest=false");
  else args.push("--latest");
  return args;
}

function parseJsonOutput(result, description) {
  if (result.code !== 0) {
    throw new Error(
      `${description} could not be verified${result.stderr ? `: ${result.stderr}` : "."}`,
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`${description} returned invalid JSON.`);
  }
}

export async function verifyPublishedPackages(release, system) {
  for (const entry of release.packages) {
    const spec = `${entry.name}@${entry.version}`;
    const versionResult = await system.capture("npm", ["view", spec, "version", "--json"]);
    if (versionResult.code !== 0) {
      throw new Error(`${spec} is not published and release finalization cannot continue.`);
    }
    const publishedVersion = parseJsonOutput(versionResult, `${spec} version`);
    if (publishedVersion !== entry.version) {
      throw new Error(
        `${spec} resolved to unexpected version ${JSON.stringify(publishedVersion)}.`,
      );
    }

    const tagsResult = await system.capture("npm", ["view", spec, "dist-tags", "--json"]);
    const tags = parseJsonOutput(tagsResult, `${spec} dist-tags`);
    if (tags?.[release.npmTag] !== entry.version) {
      throw new Error(
        `${entry.name} dist-tag ${release.npmTag} must point to ${entry.version}, found ${tags?.[release.npmTag] ?? "nothing"}.`,
      );
    }
  }
}

function firstSha(output) {
  return output.trim().split(/\s+/)[0] || undefined;
}

function remoteTagSha(output, tagName) {
  const rows = output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => row.trim().split(/\s+/));
  return (
    rows.find(([, ref]) => ref === `refs/tags/${tagName}^{}`)?.[0] ??
    rows.find(([, ref]) => ref === `refs/tags/${tagName}`)?.[0]
  );
}

function isMissingRelease(result) {
  return result.code === 1 && /(?:not found|release not found|HTTP 404)/i.test(result.stderr);
}

export async function finalizeVerifiedRelease(release, system) {
  if (!release.head) throw new Error("Release finalization requires the validated release commit.");
  const tagRef = `refs/tags/${release.tagName}`;
  const peeledTagRef = `${tagRef}^{}`;
  const [localResult, remoteResult, githubResult] = await Promise.all([
    system.capture("git", ["rev-parse", "-q", "--verify", peeledTagRef]),
    system.capture("git", ["ls-remote", "--tags", "origin", tagRef, peeledTagRef]),
    system.capture("gh", [
      "release",
      "view",
      release.tagName,
      "--repo",
      PUBLIC_REPOSITORY,
      "--json",
      "tagName,isPrerelease,isDraft",
    ]),
  ]);

  if (![0, 1].includes(localResult.code)) {
    throw new Error(`Could not inspect local tag ${release.tagName}: ${localResult.stderr}`);
  }
  if (remoteResult.code !== 0) {
    throw new Error(`Could not inspect remote tag ${release.tagName}: ${remoteResult.stderr}`);
  }
  if (githubResult.code !== 0 && !isMissingRelease(githubResult)) {
    throw new Error(`Could not inspect GitHub release ${release.tagName}: ${githubResult.stderr}`);
  }

  const localSha = localResult.code === 0 ? firstSha(localResult.stdout) : undefined;
  const remoteSha = remoteTagSha(remoteResult.stdout, release.tagName);
  for (const [location, sha] of [
    ["Local tag", localSha],
    ["Remote tag", remoteSha],
  ]) {
    if (sha && sha !== release.head) {
      throw new Error(`${location} ${release.tagName} points to ${sha}, expected ${release.head}.`);
    }
  }

  let githubRelease;
  let repairLatest = false;
  if (githubResult.code === 0) {
    githubRelease = parseJsonOutput(githubResult, `GitHub release ${release.tagName}`);
    if (githubRelease.tagName !== release.tagName) {
      throw new Error(`GitHub release returned unexpected tag ${githubRelease.tagName}.`);
    }
    if (githubRelease.isPrerelease !== release.prerelease) {
      throw new Error(
        `GitHub release ${release.tagName} has a conflicting release classification.`,
      );
    }
    if (githubRelease.isDraft) {
      throw new Error(`GitHub release ${release.tagName} is still a draft.`);
    }
    if (!remoteSha) {
      throw new Error(`GitHub release ${release.tagName} exists without its remote tag.`);
    }
    if (!release.prerelease) {
      const latestResult = await system.capture("gh", [
        "release",
        "view",
        "--repo",
        PUBLIC_REPOSITORY,
        "--json",
        "tagName",
      ]);
      if (latestResult.code !== 0) {
        throw new Error(`Could not inspect the latest GitHub release: ${latestResult.stderr}`);
      }
      const latestRelease = parseJsonOutput(latestResult, "Latest GitHub release");
      repairLatest = latestRelease.tagName !== release.tagName;
    }
  }

  if (!localSha) {
    await system.run("git", [
      "tag",
      "--annotate",
      release.tagName,
      release.head,
      "--message",
      `Release ${release.tagName}`,
    ]);
  }
  if (!remoteSha) {
    await system.run("git", ["push", "origin", `${tagRef}:${tagRef}`]);
  }
  if (!githubRelease) {
    await system.run("gh", createGitHubReleaseArgs(release));
  } else if (repairLatest) {
    await system.run("gh", [
      "release",
      "edit",
      release.tagName,
      "--repo",
      PUBLIC_REPOSITORY,
      "--latest",
    ]);
  }
}

export async function runReleaseFinalization({
  gitStateLoader = assertPublicMainForPublish,
  metadataLoader = assertReleaseMetadata,
  system = createCommandSystem(),
} = {}) {
  const { packageManifests, tag } = await metadataLoader();
  const { head } = await gitStateLoader();
  const release = deriveReleaseIdentity(packageManifests, tag, head);
  await verifyPublishedPackages(release, system);
  await finalizeVerifiedRelease(release, system);
  return release;
}

async function main() {
  if (process.argv.length > 2) throw new Error("release:finalize does not accept arguments.");
  const release = await runReleaseFinalization();
  console.log(`Release ${release.tagName} is finalized.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
