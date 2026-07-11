import { readFileSync } from "node:fs";
import path from "node:path";

const categoryOrder = ["Runtime", "React adapter", "Third-party", "Other"];
const starwindCategories = new Set(["Runtime", "React adapter"]);

export function buildSourceContributionAnalyses({
  readFile = readFileSync,
  repoRoot,
  results,
  tmpRoot,
  topLimit = 12,
}) {
  return results
    .filter((row) => row.sourceContribution && row.metafile)
    .map((row) =>
      buildSourceContributionAnalysis({
        context: row.sourceContribution.context,
        label: row.sourceContribution.label ?? row.label,
        metafile: row.metafile,
        readFile,
        repoRoot,
        tmpRoot,
        topLimit,
      }),
    );
}

export function formatSourceContributionMarkdown(analyses, { formatBytes }) {
  if (analyses.length === 0) {
    return [
      "No source-contribution analyses were generated. This usually means the selected measurement rows did not capture esbuild metafiles.",
    ];
  }

  return analyses.flatMap((analysis, index) => [
    ...(index === 0 ? [] : [""]),
    ...formatAnalysisMarkdown(analysis, { formatBytes }),
  ]);
}

export function buildSourceContributionContext({
  componentCount,
  combinedGzipBytes,
  componentRows,
  interpretation,
}) {
  const isolatedGzipBytes = sumMeasuredGzipBytes(componentRows);

  return {
    combinedGzipBytes,
    componentCount,
    interpretation,
    isolatedGzipBytes,
    sharedSavingsGzipBytes:
      isolatedGzipBytes == null || combinedGzipBytes == null
        ? null
        : isolatedGzipBytes - combinedGzipBytes,
  };
}

function formatAnalysisMarkdown(analysis, { formatBytes }) {
  return [
    `### ${analysis.label}`,
    "",
    "This section is architecture analysis, not an apples-to-apples public marketing table. It uses esbuild metafile `bytesInOutput`, which are minified byte contributions before gzip.",
    "",
    ...formatContextMarkdown(analysis.context, { formatBytes }),
    ...(analysis.context ? [""] : []),
    "| Category | Minified bytes in output | Share |",
    "| --- | ---: | ---: |",
    ...analysis.categories.map((category) =>
      [
        category.label,
        formatBytes(category.bytes),
        formatPercent(category.bytes, analysis.totalBytes),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "| Rank | Category | Source owner | Minified bytes in output |",
    "| ---: | --- | --- | ---: |",
    ...analysis.topStarwindContributors.map((contributor, index) =>
      [
        index + 1,
        contributor.category,
        `\`${contributor.sourceOwner}\``,
        formatBytes(contributor.bytes),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
  ];
}

function buildSourceContributionAnalysis({
  context,
  label,
  metafile,
  readFile,
  repoRoot,
  tmpRoot,
  topLimit,
}) {
  const contributors = collectMetafileContributors(metafile).map((contributor) => {
    const category = categorizeInput(contributor.input, { repoRoot, tmpRoot });
    const input = formatInputPath(contributor.input, { repoRoot, tmpRoot });

    return {
      ...contributor,
      category,
      input,
      sourceOwner: resolveSourceOwner(contributor.input, { readFile, repoRoot, tmpRoot }) ?? input,
    };
  });
  const totalBytes = contributors.reduce((total, contributor) => total + contributor.bytes, 0);
  const categories = categoryOrder
    .map((label) => ({
      bytes: contributors
        .filter((contributor) => contributor.category === label)
        .reduce((total, contributor) => total + contributor.bytes, 0),
      label,
    }))
    .filter((category) => category.bytes > 0);
  const topStarwindContributors = contributors
    .filter((contributor) => starwindCategories.has(contributor.category))
    .sort(compareContributors)
    .slice(0, topLimit);

  return {
    categories,
    context,
    label,
    topStarwindContributors,
    totalBytes,
  };
}

function formatContextMarkdown(context, { formatBytes }) {
  if (!context) return [];

  return [
    "| Components | Combined min+gzip | Isolated per-component sum | Shared-code savings | Interpretation |",
    "| ---: | ---: | ---: | ---: | --- |",
    [
      context.componentCount,
      formatBytes(context.combinedGzipBytes),
      formatBytes(context.isolatedGzipBytes),
      formatSavings(context.sharedSavingsGzipBytes, context.isolatedGzipBytes, { formatBytes }),
      context.interpretation,
    ]
      .join(" | ")
      .replace(/^/, "| ")
      .replace(/$/, " |"),
  ];
}

function sumMeasuredGzipBytes(results) {
  if (results.some((result) => !result || result.gzipBytes == null)) {
    return null;
  }

  return results.reduce((total, result) => total + result.gzipBytes, 0);
}

function formatSavings(savingsBytes, isolatedBytes, { formatBytes }) {
  if (savingsBytes == null || isolatedBytes == null) return "N/A";
  const percent = isolatedBytes === 0 ? 0 : (savingsBytes / isolatedBytes) * 100;

  return `${formatBytes(savingsBytes)} (${percent.toFixed(1)}%)`;
}

function collectMetafileContributors(metafile) {
  const byInput = new Map();

  for (const output of Object.values(metafile.outputs ?? {})) {
    for (const [input, contribution] of Object.entries(output.inputs ?? {})) {
      byInput.set(input, (byInput.get(input) ?? 0) + (contribution.bytesInOutput ?? 0));
    }
  }

  return [...byInput.entries()]
    .map(([input, bytes]) => ({ bytes, input }))
    .sort(compareContributors);
}

function compareContributors(left, right) {
  return right.bytes - left.bytes || left.input.localeCompare(right.input);
}

function categorizeInput(input, { repoRoot, tmpRoot }) {
  const normalizedInput = normalizePath(input);
  const absoluteInput = resolvePortablePath(tmpRoot, input);
  const runtimeSegment = "/packages/runtime/";
  const reactSegment = "/packages/react/";

  if (absoluteInput.includes(runtimeSegment) || normalizedInput.includes(runtimeSegment)) {
    return "Runtime";
  }

  if (absoluteInput.includes(reactSegment) || normalizedInput.includes(reactSegment)) {
    return "React adapter";
  }

  if (absoluteInput.includes("/node_modules/") || normalizedInput.includes("/node_modules/")) {
    return "Third-party";
  }

  return "Other";
}

function resolveSourceOwner(input, { readFile, repoRoot, tmpRoot }) {
  const absoluteInput = resolvePortablePath(tmpRoot, input);
  const relativeToRepo = relativePortablePath(repoRoot, absoluteInput);

  if (
    !relativeToRepo.startsWith("packages/runtime/") &&
    !relativeToRepo.startsWith("packages/react/")
  ) {
    return null;
  }

  try {
    const source = readFile(absoluteInput, "utf8").slice(0, 4096);

    return source.match(/^\/\/\s+(src\/[^\r\n]+)/m)?.[1] ?? null;
  } catch {
    return null;
  }
}

function formatInputPath(input, { repoRoot, tmpRoot }) {
  const absoluteInput = resolvePortablePath(tmpRoot, input);
  const relativeToRepo = relativePortablePath(repoRoot, absoluteInput);

  if (!relativeToRepo.startsWith("../")) {
    return relativeToRepo;
  }

  const relativeToTmp = relativePortablePath(tmpRoot, absoluteInput);
  if (!relativeToTmp.startsWith("../")) {
    return relativeToTmp;
  }

  return normalizePath(input);
}

function formatPercent(bytes, totalBytes) {
  if (totalBytes === 0) return "0.0%";
  return `${((bytes / totalBytes) * 100).toFixed(1)}%`;
}

function normalizePath(value) {
  const portable = value.replaceAll("\\", "/");
  const normalized = path.posix.normalize(portable);

  if (portable.startsWith("//") && !normalized.startsWith("//")) {
    return `/${normalized}`;
  }

  return normalized.replace(/^[a-z]:\//, (drive) => drive.toUpperCase());
}

function resolvePortablePath(base, value) {
  const normalizedValue = normalizePath(value);

  if (isPortableAbsolute(normalizedValue)) {
    return normalizedValue;
  }

  return normalizePath(`${normalizePath(base)}/${normalizedValue}`);
}

function relativePortablePath(from, to) {
  const normalizedFrom = normalizePath(from);
  const normalizedTo = normalizePath(to);

  if (portableRoot(normalizedFrom) !== portableRoot(normalizedTo)) {
    return normalizedTo;
  }

  return normalizePath(path.posix.relative(normalizedFrom, normalizedTo));
}

function isPortableAbsolute(value) {
  return value.startsWith("/") || /^[A-Z]:\//.test(value);
}

function portableRoot(value) {
  const drive = value.match(/^([A-Z]:)\//)?.[1];
  if (drive) return drive;

  const unc = value.match(/^(\/\/[^/]+\/[^/]+)/)?.[1];
  if (unc) return unc.toLowerCase();

  return value.startsWith("/") ? "/" : "";
}
