#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_DIRS = ["packages/runtime", "packages/react", "packages/cli"];

export function findMissingReleaseArtifacts(repoRoot = REPO_ROOT) {
  const missing = [];

  for (const packageDir of PACKAGE_DIRS) {
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

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const missing = findMissingReleaseArtifacts();
  if (missing.length > 0) {
    console.error("Release artifacts are missing. Run the build gate before packaging:");
    for (const file of missing) console.error(`- ${file}`);
    process.exitCode = 1;
  } else {
    console.log("Release artifacts are present; no rebuild is needed.");
  }
}
