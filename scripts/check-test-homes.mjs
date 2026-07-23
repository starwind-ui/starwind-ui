import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const approvedTestHomePrefixes = [
  "packages/cli/tests/",
  "packages/react/tests/",
  "packages/runtime/tests/",
  "packages/vue/tests/",
  "scripts/portable-runtime/tests/",
  "scripts/tests/",
];

export const testSuiteOwners = [
  {
    name: "portable-vue",
    prefixes: ["scripts/portable-runtime/tests/generate-vue-wrappers/"],
  },
  {
    name: "portable-runtime",
    prefixes: ["scripts/portable-runtime/tests/"],
    excludePrefixes: ["scripts/portable-runtime/tests/generate-vue-wrappers/"],
  },
  {
    name: "repo-scripts",
    prefixes: ["scripts/tests/"],
  },
  {
    name: "cli",
    prefixes: ["packages/cli/tests/"],
  },
  {
    name: "react",
    prefixes: ["packages/react/tests/"],
  },
  {
    name: "runtime",
    prefixes: ["packages/runtime/tests/"],
  },
  {
    name: "vue",
    prefixes: ["packages/vue/tests/"],
  },
];

const ignoredPathPrefixes = [
  ".agents/",
  ".cache/",
  ".codex/",
  ".git/",
  ".scratch/",
  ".turbo/",
  ".vercel/",
  ".vitest-attachments/",
  ".wrangler/",
  "coverage/",
  "dist/",
];

const packageGeneratedOutputPattern = /^(apps|packages)\/[^/]+\/(coverage|dist)\//;

export function normalizeRepositoryPath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function isTestFilePath(filePath) {
  const normalizedPath = normalizeRepositoryPath(filePath);
  return (
    /(^|\/)[^/]+\.(test|spec|cases)\.[^/]+$/.test(normalizedPath) ||
    /(^|\/)verify-[^/]+-demo\.mjs$/.test(normalizedPath) ||
    /(^|\/)smoke\/.+\.(mjs|js|ts|tsx|mts|cts|jsx)$/.test(normalizedPath)
  );
}

export function isIgnoredPath(filePath) {
  const normalizedPath = normalizeRepositoryPath(filePath);
  const segments = normalizedPath.split("/");

  return (
    segments.includes("node_modules") ||
    ignoredPathPrefixes.some((prefix) => normalizedPath.startsWith(prefix)) ||
    packageGeneratedOutputPattern.test(normalizedPath)
  );
}

export function isApprovedTestHome(filePath) {
  const normalizedPath = normalizeRepositoryPath(filePath);
  return approvedTestHomePrefixes.some((prefix) => normalizedPath.startsWith(prefix));
}

export function findTestHomeViolations(filePaths) {
  return [...new Set(filePaths.map(normalizeRepositoryPath))]
    .filter((filePath) => isTestFilePath(filePath))
    .filter((filePath) => !isIgnoredPath(filePath))
    .filter((filePath) => !isApprovedTestHome(filePath))
    .sort();
}

export function findTestSuiteOwners(filePath) {
  const normalizedPath = normalizeRepositoryPath(filePath);
  return testSuiteOwners
    .filter(
      ({ excludePrefixes = [], prefixes }) =>
        prefixes.some((prefix) => normalizedPath.startsWith(prefix)) &&
        !excludePrefixes.some((prefix) => normalizedPath.startsWith(prefix)),
    )
    .map(({ name }) => name);
}

export function findTestOwnershipViolations(filePaths) {
  return [...new Set(filePaths.map(normalizeRepositoryPath))]
    .filter((filePath) => isTestFilePath(filePath))
    .filter((filePath) => !isIgnoredPath(filePath))
    .filter((filePath) => findTestSuiteOwners(filePath).length !== 1)
    .sort();
}

export function listRepositoryFiles(cwd = process.cwd()) {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd,
    },
  );

  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((filePath) => existsSync(path.join(cwd, filePath)));
}

function isMainModule(metaUrl) {
  const entrypoint = process.argv[1];
  return entrypoint ? fileURLToPath(metaUrl) === path.resolve(entrypoint) : false;
}

if (isMainModule(import.meta.url)) {
  const repositoryFiles = listRepositoryFiles();
  const violations = findTestHomeViolations(repositoryFiles);
  const ownershipViolations = findTestOwnershipViolations(repositoryFiles);

  if (violations.length > 0 || ownershipViolations.length > 0) {
    if (violations.length > 0) {
      console.error("Test files must live in approved tests homes:");
      for (const violation of violations) {
        console.error(`- ${violation}`);
      }
      console.error("");
      console.error("Approved homes:");
      for (const home of approvedTestHomePrefixes) {
        console.error(`- ${home}`);
      }
    }
    if (ownershipViolations.length > 0) {
      console.error("Test files must belong to exactly one test suite:");
      for (const violation of ownershipViolations) {
        console.error(`- ${violation}`);
      }
    }
    process.exit(1);
  }

  console.log("Test file home and suite ownership checks passed.");
}
