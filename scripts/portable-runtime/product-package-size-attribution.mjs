import { readFileSync } from "node:fs";
import path from "node:path";

const categoryOrder = ["Runtime", "React adapter", "Vue adapter", "Third-party", "Other"];
const localCategories = new Set(["Runtime", "React adapter", "Vue adapter"]);

export function buildProductOverlapAttribution({
  combinedGzipBytes,
  componentRows,
  framework,
  metafile,
  readFile = readFileSync,
  repoRoot,
  topLimit = 20,
}) {
  const inputs = collectInputs(metafile).map((input) => {
    const category = categorizeInput(input.path, repoRoot);
    return {
      ...input,
      category,
      path: relativeInputPath(input.path, repoRoot),
      sourceModules: localCategories.has(category)
        ? readSourceModules(input.path, { readFile, repoRoot })
        : [],
    };
  });
  const totalBytes = inputs.reduce((total, input) => total + input.bytes, 0);
  const isolatedGzipBytes = componentRows.reduce((total, row) => total + row.gzipBytes, 0);

  return {
    categories: categoryOrder
      .map((label) => ({
        bytes: inputs
          .filter((input) => input.category === label)
          .reduce((total, input) => total + input.bytes, 0),
        label,
      }))
      .filter(({ bytes }) => bytes > 0),
    combinedGzipBytes,
    componentCount: componentRows.length,
    framework,
    isolatedGzipBytes,
    sharedSavingsGzipBytes: isolatedGzipBytes - combinedGzipBytes,
    topLocalInputs: inputs
      .filter((input) => localCategories.has(input.category))
      .sort(compareInputs)
      .slice(0, topLimit),
    totalBytes,
  };
}

function collectInputs(metafile) {
  const byInput = new Map();
  for (const output of Object.values(metafile?.outputs ?? {})) {
    for (const [input, contribution] of Object.entries(output.inputs ?? {})) {
      byInput.set(input, (byInput.get(input) ?? 0) + (contribution.bytesInOutput ?? 0));
    }
  }
  return [...byInput.entries()].map(([inputPath, bytes]) => ({ bytes, path: inputPath }));
}

function categorizeInput(input, repoRoot) {
  const absolute = absoluteInputPath(input, repoRoot);
  if (absolute.includes("/packages/runtime/")) return "Runtime";
  if (absolute.includes("/packages/react/")) return "React adapter";
  if (absolute.includes("/packages/vue/")) return "Vue adapter";
  if (absolute.includes("/node_modules/")) return "Third-party";
  return "Other";
}

function readSourceModules(input, { readFile, repoRoot }) {
  try {
    const source = readFile(absoluteInputPath(input, repoRoot), "utf8");
    return [...new Set([...source.matchAll(/^\/\/\s+(src\/[^\r\n]+)/gm)].map((match) => match[1]))];
  } catch {
    return [];
  }
}

function relativeInputPath(input, repoRoot) {
  const relative = path
    .relative(repoRoot, absoluteInputPath(input, repoRoot))
    .replaceAll("\\", "/");
  return relative.startsWith("../") ? input.replaceAll("\\", "/") : relative;
}

function absoluteInputPath(input, repoRoot) {
  return path.isAbsolute(input) ? input : path.resolve(repoRoot, input);
}

function compareInputs(left, right) {
  return right.bytes - left.bytes || left.path.localeCompare(right.path);
}
