import path from "node:path";
import { gzipSync } from "node:zlib";

export function summarizeInitialBundleOutput({
  entryFilePath,
  gzip = gzipSync,
  metafile,
  outputFiles,
}) {
  const entryOutput = findOutputFile(outputFiles, entryFilePath);
  const initialOutputFiles = collectInitialOutputFiles(outputFiles, entryOutput.path);
  const minifiedBytes = initialOutputFiles.reduce(
    (total, outputFile) => total + outputFile.contents.byteLength,
    0,
  );
  const gzipBytes = gzip(combineOutputContents(initialOutputFiles), { level: 9 }).byteLength;
  const initialOutputPaths = initialOutputFiles.map((outputFile) => outputFile.path);

  return {
    gzipBytes,
    initialOutputPaths,
    metafile: metafile ? filterMetafileToOutputs(metafile, initialOutputPaths) : undefined,
    minifiedBytes,
  };
}

function collectInitialOutputFiles(outputFiles, entryFilePath) {
  const filesByPath = new Map(
    outputFiles.map((outputFile) => [normalizePath(outputFile.path), outputFile]),
  );
  const seen = new Set();
  const queue = [normalizePath(entryFilePath)];

  while (queue.length > 0) {
    const currentPath = queue.shift();
    if (!currentPath || seen.has(currentPath)) continue;

    seen.add(currentPath);
    const outputFile = filesByPath.get(currentPath);
    if (!outputFile) continue;

    for (const importPath of collectStaticImports(outputFile.text)) {
      const importedPath = resolveStaticImportPath(currentPath, importPath);
      if (!seen.has(importedPath)) {
        queue.push(importedPath);
      }
    }
  }

  return [...seen].map((outputPath) => filesByPath.get(outputPath)).filter(Boolean);
}

function combineOutputContents(outputFiles) {
  return Buffer.concat(outputFiles.map((outputFile) => Buffer.from(outputFile.contents)));
}

function resolveStaticImportPath(outputPath, importPath) {
  return normalizePath(
    path.posix.normalize(path.posix.join(path.posix.dirname(outputPath), importPath)),
  );
}

function collectStaticImports(source) {
  const imports = [];
  const importPatterns = [
    /\bimport\s*["'](\.\/[^"']+\.js)["']/g,
    /\b(?:import|export)\s*[^"']*?\bfrom\s*["'](\.\/[^"']+\.js)["']/g,
  ];

  for (const importPattern of importPatterns) {
    for (const match of source.matchAll(importPattern)) {
      imports.push(match[1]);
    }
  }

  return imports;
}

function findOutputFile(outputFiles, entryFilePath) {
  const normalizedEntryFilePath = normalizePath(entryFilePath);
  const exactMatch = outputFiles.find(
    (outputFile) => normalizePath(outputFile.path) === normalizedEntryFilePath,
  );
  if (exactMatch) return exactMatch;

  const entryFileName = path.basename(entryFilePath);
  const basenameMatch = outputFiles.find(
    (outputFile) => path.basename(outputFile.path) === entryFileName,
  );
  if (basenameMatch) return basenameMatch;

  throw new Error(`Could not find esbuild entry output: ${entryFilePath}`);
}

function filterMetafileToOutputs(metafile, outputPaths) {
  const outputPathSet = new Set(outputPaths.map(normalizePath));
  const outputBasenames = new Set(outputPaths.map((outputPath) => path.basename(outputPath)));
  const outputs = {};

  for (const [outputPath, output] of Object.entries(metafile.outputs ?? {})) {
    const normalizedOutputPath = normalizePath(outputPath);
    if (
      !outputPathSet.has(normalizedOutputPath) &&
      !outputBasenames.has(path.basename(outputPath))
    ) {
      continue;
    }

    outputs[outputPath] = output;
  }

  return {
    ...metafile,
    outputs,
  };
}

function normalizePath(value) {
  return path.normalize(value).replaceAll("\\", "/");
}
