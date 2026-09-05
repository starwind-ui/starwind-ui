#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_PACKAGE_DIRS = ["packages/runtime", "packages/react", "packages/cli"];
const VUE_BETA_PACKAGE_DIRS = ["packages/vue", "packages/cli"];
const VUE_BETA_INPUTS = [
  "tsconfig.json",
  "pnpm-lock.yaml",
  "packages/vue/package.json",
  "packages/vue/scripts",
  "packages/vue/src",
  "packages/vue/tsconfig.json",
  "packages/vue/tsconfig.build.json",
  "packages/vue/tsup.config.ts",
  "scripts/portable-runtime/renderers/framework-adapters/vue/inventory.ts",
  "packages/cli/package.json",
  "packages/cli/src",
  "packages/cli/tsconfig.json",
  "packages/cli/tsup.config.ts",
];
const VUE_BETA_OUTPUTS = ["packages/vue/dist", "packages/cli/dist"];
const VUE_BETA_FINGERPRINT_FILE = "node_modules/.cache/starwind-release/vue-beta-artifacts.json";

function collectFiles(repoRoot, entries) {
  const files = [];
  function visit(relativePath) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) return;
    if (statSync(absolutePath).isDirectory()) {
      for (const name of readdirSync(absolutePath).sort()) visit(path.join(relativePath, name));
    } else {
      files.push(relativePath.replaceAll(path.sep, "/"));
    }
  }
  for (const entry of entries) visit(entry);
  return files.sort();
}

function fingerprintFiles(repoRoot, entries) {
  const hash = createHash("sha256");
  const files = collectFiles(repoRoot, entries);
  for (const file of files) {
    hash.update(file);
    hash.update("\0");
    hash.update(readFileSync(path.join(repoRoot, file)));
    hash.update("\0");
  }
  return { files, sha256: hash.digest("hex") };
}

export function createVueBetaArtifactFingerprint(repoRoot = REPO_ROOT) {
  return {
    inputs: fingerprintFiles(repoRoot, VUE_BETA_INPUTS),
    outputs: fingerprintFiles(repoRoot, VUE_BETA_OUTPUTS),
    schemaVersion: 1,
  };
}

function getVueBetaFingerprintFile(repoRoot) {
  return path.join(repoRoot, VUE_BETA_FINGERPRINT_FILE);
}

export function recordVueBetaArtifactFingerprint(repoRoot = REPO_ROOT) {
  const fingerprint = createVueBetaArtifactFingerprint(repoRoot);
  if (fingerprint.outputs.files.length === 0) {
    throw new Error("Cannot record Vue beta artifacts before Vue and CLI are built.");
  }
  const file = getVueBetaFingerprintFile(repoRoot);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(fingerprint, null, 2)}\n`, "utf8");
  return fingerprint;
}

export function findStaleVueBetaReleaseArtifacts(repoRoot = REPO_ROOT) {
  const file = getVueBetaFingerprintFile(repoRoot);
  if (!existsSync(file)) return [VUE_BETA_FINGERPRINT_FILE];
  let recorded;
  try {
    recorded = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return [VUE_BETA_FINGERPRINT_FILE];
  }
  const current = createVueBetaArtifactFingerprint(repoRoot);
  const stale = [];
  if (JSON.stringify(recorded.inputs) !== JSON.stringify(current.inputs))
    stale.push("source inputs");
  if (JSON.stringify(recorded.outputs) !== JSON.stringify(current.outputs)) {
    stale.push("built outputs");
  }
  return stale;
}

export function findMissingReleaseArtifacts(repoRoot = REPO_ROOT, { vueBeta = false } = {}) {
  const missing = [];

  for (const packageDir of vueBeta ? VUE_BETA_PACKAGE_DIRS : RELEASE_PACKAGE_DIRS) {
    const manifest = JSON.parse(
      readFileSync(path.join(repoRoot, packageDir, "package.json"), "utf8"),
    );
    for (const relativePath of [manifest.main, manifest.types]) {
      if (typeof relativePath !== "string") continue;
      const normalizedPath = relativePath.replace(/^\.\//, "");
      if (!existsSync(path.join(repoRoot, packageDir, normalizedPath))) {
        missing.push(`${packageDir}/${normalizedPath}`);
      }
    }
  }

  return missing.sort();
}

function parseArgs(argv) {
  if (argv.length === 0) return { vueBeta: false };
  if (argv.length === 1 && argv[0] === "--vue-beta") return { vueBeta: true };
  if (argv.length === 2 && argv[0] === "--vue-beta" && argv[1] === "--record") {
    return { record: true, vueBeta: true };
  }
  throw new Error(`Unknown argument: ${argv[0]}`);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const options = parseArgs(process.argv.slice(2));
  const missing = findMissingReleaseArtifacts(REPO_ROOT, options);
  if (missing.length > 0) {
    console.error("Release artifacts are missing. Run the build gate before packaging:");
    for (const file of missing) console.error(`- ${file}`);
    process.exitCode = 1;
  } else if (options.record) {
    recordVueBetaArtifactFingerprint();
    console.log("Vue beta artifact fingerprint recorded.");
  } else if (options.vueBeta) {
    const stale = findStaleVueBetaReleaseArtifacts();
    if (stale.length > 0) {
      console.error(
        "Vue beta release artifacts are stale. Build Vue and CLI, then run pnpm release:vue-beta:artifacts:record:",
      );
      for (const item of stale) console.error(`- ${item}`);
      process.exitCode = 1;
    } else {
      console.log(
        "Vue beta release artifacts match their recorded source and output fingerprints.",
      );
    }
  } else {
    console.log("Release artifacts are present; no rebuild is needed.");
  }
}
