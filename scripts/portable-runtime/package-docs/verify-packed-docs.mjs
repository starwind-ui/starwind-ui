import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { gzipSync } from "node:zlib";

import { compareCodeUnits, validatePackageDocs } from "./validate-docs.mjs";

const ARCHIVE_ROOT = "package/";

/**
 * Size budget for the installed docs in one packed package. The gzip figure compresses every
 * `docs/` file, sorted by path, as one stream. It estimates what the docs add to the archive; the
 * real archive bytes are reported beside it. Docs measured 35 to 39 KB gzip and 266 to 304 KB raw
 * when the budget was set.
 */
export const PACKAGE_DOCS_BUDGET = Object.freeze({
  maxGzipBytes: 48 * 1024,
  maxRawBytes: 384 * 1024,
});

function listArchive(archive) {
  return execFileSync("tar", ["-tzf", archive], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter((entry) => entry.startsWith(ARCHIVE_ROOT) && !entry.endsWith("/"))
    .map((entry) => entry.slice(ARCHIVE_ROOT.length));
}

function readArchiveFile(archive, file) {
  return execFileSync("tar", ["-xOzf", archive, `${ARCHIVE_ROOT}${file}`], {
    maxBuffer: 64 * 1024 * 1024,
  });
}

/**
 * Measures the installed docs in a packed archive and compares them with the docs budget.
 * `contents` maps archive paths to their bytes.
 */
export function measurePackedDocs({ archiveBytes, contents, budget = PACKAGE_DOCS_BUDGET }) {
  const docs = [...contents.keys()]
    .filter((entry) => entry.startsWith("docs/"))
    .sort(compareCodeUnits);
  const buffers = docs.map((entry) => contents.get(entry));
  const rawBytes = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
  const gzipBytes = gzipSync(Buffer.concat(buffers), { level: 9 }).byteLength;
  const failures = [];
  if (gzipBytes > budget.maxGzipBytes) {
    failures.push(`docs gzip estimate ${gzipBytes} B exceeds ${budget.maxGzipBytes} B`);
  }
  if (rawBytes > budget.maxRawBytes) {
    failures.push(`docs unpacked ${rawBytes} B exceeds ${budget.maxRawBytes} B`);
  }
  return {
    archiveBytes,
    budget: { ...budget },
    docs,
    docsFileCount: docs.length,
    docsGzipBytes: gzipBytes,
    docsRawBytes: rawBytes,
    failures,
  };
}

/** Formats one line for the release log. */
export function formatPackedDocsReport(name, report) {
  return `${name}: archive ${report.archiveBytes} B (actual); docs ${report.docsFileCount} files, ${report.docsRawBytes} B unpacked, about ${report.docsGzipBytes} B gzip (estimated contribution; budget ${report.budget.maxGzipBytes} B gzip, ${report.budget.maxRawBytes} B unpacked)`;
}

/**
 * Checks that a packed npm archive contains installed docs for its own name and version, with
 * valid links, inside the docs budget. Throws with every problem found.
 */
export function verifyPackedPackageDocs({ archive, name, version, budget = PACKAGE_DOCS_BUDGET }) {
  const entries = listArchive(archive);
  const manifest = JSON.parse(readArchiveFile(archive, "package.json").toString("utf8"));
  const errors = [];
  if (manifest.name !== name) errors.push(`${archive}: packed name ${manifest.name}`);
  if (manifest.version !== version) {
    errors.push(`${name}: packed version ${manifest.version}, expected ${version}`);
  }
  // Only Markdown and text files carry links; other entries only need to exist as link targets.
  const contents = new Map(
    entries
      .filter((entry) => entry.startsWith("docs/") || entry === "README.md")
      .map((entry) => [entry, readArchiveFile(archive, entry)]),
  );
  const files = new Map(
    entries.map((entry) => [entry, contents.get(entry)?.toString("utf8") ?? ""]),
  );
  errors.push(...validatePackageDocs({ files, name, version }));
  const report = measurePackedDocs({
    archiveBytes: statSync(archive).size,
    budget,
    contents: new Map([...contents].filter(([entry]) => entry.startsWith("docs/"))),
  });
  errors.push(...report.failures.map((failure) => `${name}: ${failure}`));
  if (errors.length > 0) {
    throw new Error(`Packed docs check failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return report;
}
