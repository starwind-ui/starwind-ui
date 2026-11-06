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

// The release writes this file before the first kit upload and removes it after the last one. A
// later run must publish the same build, even when npm does not list the uploaded packages yet.
export const PUBLICATION_MARKER = "publication-started.json";

/**
 * Reads the unfinished kit publication in a build directory. Returns undefined when there is none.
 * A marker without a readable version blocks every kit version.
 */
export async function readPublicationMarker(outputDirectory) {
  let source;
  try {
    source = await readFile(path.join(outputDirectory, PUBLICATION_MARKER), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
  try {
    const { kitVersion } = JSON.parse(source);
    return { kitVersion: typeof kitVersion === "string" ? kitVersion : undefined };
  } catch {
    return { kitVersion: undefined };
  }
}

/** A build replaces its directory, which would delete the files an unfinished release needs. */
export async function assertNoUnfinishedPublication(outputDirectory) {
  const marker = await readPublicationMarker(outputDirectory);
  if (!marker) return;
  throw new Error(
    `${outputDirectory} holds an unfinished offline kit publication${marker.kitVersion ? ` of ${marker.kitVersion}` : ""}. Run the publication command again to finish it, or build somewhere else with --output.`,
  );
}

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
  const outputDirectory = values.output ? path.resolve(values.output) : DEFAULT_OUTPUT_DIRECTORY;
  await assertNoUnfinishedPublication(outputDirectory);
  await buildOfflineKit({
    outputDirectory,
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
