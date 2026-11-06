#!/usr/bin/env node
// Builds the offline kit packages. Release builds read every archive from npm.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  addMetadataOnlyNodes,
  createNpmPackumentFetcher,
  loadRootRequirements,
  REPO_ROOT,
  resolveClosure,
  withLocalPackages,
  writeKit,
} from "./builder.mjs";
import { currentPlatform, SUPPORTED_PLATFORMS } from "./platforms.mjs";

export const DEFAULT_OUTPUT_DIRECTORY = path.join(
  REPO_ROOT,
  "node_modules/.cache/starwind-offline/kit",
);

export function selectPlatforms(value) {
  if (!value || value === "all") return [...SUPPORTED_PLATFORMS];
  if (value === "current") {
    const platform = currentPlatform();
    if (!platform)
      throw new Error(
        `This machine (${process.platform}-${process.arch}) is not a supported offline kit platform.`,
      );
    return [platform];
  }
  const keys = value.split(",").map((key) => key.trim());
  return keys.map((key) => {
    const platform = SUPPORTED_PLATFORMS.find((candidate) => candidate.key === key);
    if (!platform) throw new Error(`Unknown offline kit platform: ${key}.`);
    return platform;
  });
}

export async function readCliVersion(repoRoot = REPO_ROOT) {
  const manifest = JSON.parse(
    await readFile(path.join(repoRoot, "packages/cli/package.json"), "utf8"),
  );
  return manifest.version;
}

/**
 * Builds the kit. `localArchives` replace npm versions of the packages they contain, so the result
 * is only for tests when it is set. A release passes the requirements of the CLI it ships and a
 * packument source that includes its own archives.
 */
export async function buildOfflineKit({
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  platforms = SUPPORTED_PLATFORMS,
  localArchives = [],
  repoRoot = REPO_ROOT,
  cliVersion,
  kitVersion,
  roots,
  fetchPackument,
  log = (message) => console.log(`[offline-kit] ${message}`),
} = {}) {
  cliVersion ??= await readCliVersion(repoRoot);
  kitVersion ??= cliVersion;
  roots ??= await loadRootRequirements({ repoRoot });
  log(`Resolving ${roots.length} CLI requirements for starwind ${cliVersion}`);
  fetchPackument ??= createNpmPackumentFetcher();
  if (localArchives.length > 0) {
    const local = await withLocalPackages(fetchPackument, localArchives);
    fetchPackument = local.fetchPackument;
    log(`Using local archives for ${local.localNames.join(", ")}`);
  }
  const nodes = await resolveClosure({ roots, fetchPackument });
  log(`Resolved ${nodes.size} packages`);
  await addMetadataOnlyNodes(nodes, fetchPackument);
  const result = await writeKit({
    nodes,
    outputDirectory,
    kitVersion,
    cliVersion,
    platforms,
    testBuild: localArchives.length > 0,
    requirements: roots,
    log,
  });
  log(`Wrote ${result.mainDirectory} and ${result.platformDirectories.length} platform packages`);
  return { ...result, cliVersion, kitVersion, roots };
}

async function main() {
  // `pnpm run <script> -- --flag` forwards the separator, so drop it before strict parsing.
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((argument) => argument !== "--"),
    options: {
      output: { type: "string" },
      platforms: { type: "string" },
      "local-archive": { type: "string", multiple: true },
    },
  });
  await buildOfflineKit({
    outputDirectory: values.output ? path.resolve(values.output) : DEFAULT_OUTPUT_DIRECTORY,
    platforms: selectPlatforms(values.platforms),
    localArchives: (values["local-archive"] ?? []).map((file) => path.resolve(file)),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
