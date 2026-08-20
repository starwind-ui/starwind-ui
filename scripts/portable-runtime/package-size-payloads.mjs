import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const packageCategoryOrder = [
  "Runtime-bearing code",
  "Declarations",
  "Declaration maps",
  "Source maps",
  "Package metadata",
  "Other",
];

export async function measurePublishedPackagePayload({
  isRuntimeBearing = isRuntimeBearingFile,
  minifyJavaScript,
  npmCache,
  packageDirectory,
  packDestination,
  runNpm,
}) {
  requireDirectory(packageDirectory, "packageDirectory");
  requireDirectory(npmCache, "npmCache");
  requireDirectory(packDestination, "packDestination");
  if (typeof minifyJavaScript !== "function") {
    throw new Error("minifyJavaScript must be a function");
  }
  if (typeof runNpm !== "function") throw new Error("runNpm must be a function");

  const output = runNpm(
    ["pack", "--json", "--ignore-scripts", "--pack-destination", packDestination],
    {
      cwd: packageDirectory,
      encoding: "utf8",
      env: { ...process.env, npm_config_cache: npmCache },
    },
  );
  const [packInfo] = parsePackOutput(output);
  const files = normalizePackFiles(packInfo.files, packageDirectory);
  if (typeof isRuntimeBearing !== "function")
    throw new Error("isRuntimeBearing must be a function");
  const categoryTotals = summarizePackageCategories(files, isRuntimeBearing);
  const packageUnpackedBytes = requireNonnegativeInteger(
    packInfo.unpackedSize,
    "npm pack unpackedSize",
  );
  const fileBytes = files.reduce((total, file) => total + file.size, 0);
  if (fileBytes !== packageUnpackedBytes) {
    throw new Error(
      `npm pack unpackedSize differs from file list: expected ${packageUnpackedBytes}, received ${fileBytes}`,
    );
  }
  const runtimeFiles = files.filter(({ path: filePath }) => isRuntimeBearing(filePath));
  const declarationFiles = files.filter(({ path: filePath }) => isDeclarationFile(filePath));
  const minifiedParts = await Promise.all(
    runtimeFiles.map(async ({ absolutePath, path: filePath }) =>
      minifyJavaScript(readFileSync(absolutePath, "utf8"), filePath),
    ),
  );
  const runtimeCode = Buffer.from(minifiedParts.join("\n"));
  const declarationContents = declarationFiles.map(({ absolutePath }) =>
    readFileSync(absolutePath),
  );
  const declarations = Buffer.concat(declarationContents);

  return {
    categories: categoryTotals,
    declarationBytes: declarationContents.reduce(
      (total, contents) => total + contents.byteLength,
      0,
    ),
    declarationFileCount: declarationFiles.length,
    declarationGzipBytes: gzip(declarations),
    files: files.map(({ path: filePath, size }) => ({ path: filePath, size })),
    packageGzipBytes: requireNonnegativeInteger(packInfo.size, "npm pack size"),
    packageUnpackedBytes,
    runtimeFileCount: runtimeFiles.length,
    runtimeGzipBytes: gzip(runtimeCode),
    runtimeMinifiedBytes: runtimeCode.byteLength,
    version: requireString(packInfo.version, "npm pack version"),
  };
}

export function measureStyledCopiedSourcePayload({ rootDirectory, roots }) {
  requireDirectory(rootDirectory, "rootDirectory");
  const expectedRoots = normalizeRoots(roots);
  const presentRoots = readdirSync(rootDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(presentRoots) !== JSON.stringify(expectedRoots)) {
    throw new Error(
      `Styled copied-source roots differ: expected ${expectedRoots.join(", ")}; received ${presentRoots.join(", ")}`,
    );
  }

  const files = expectedRoots.flatMap((root) => listFiles(requireChild(rootDirectory, root), root));
  const codeFiles = files.filter(({ relativePath }) => isStyledCodeFile(relativePath));
  const typeSourceFiles = files.filter(({ relativePath }) => isTypeSourceFile(relativePath));
  const codeContents = codeFiles.map(({ absolutePath }) => readFileSync(absolutePath));
  const typeSourceContents = typeSourceFiles.map(({ absolutePath }) => readFileSync(absolutePath));
  const aggregateContents = files.map(({ absolutePath }) => readFileSync(absolutePath));
  const code = Buffer.concat(codeContents);
  const typeSource = Buffer.concat(typeSourceContents);
  const aggregate = Buffer.concat(aggregateContents);

  return {
    aggregateBytes: sumBufferBytes(aggregateContents),
    aggregateGzipBytes: gzip(aggregate),
    codeBytes: sumBufferBytes(codeContents),
    codeFileCount: codeFiles.length,
    codeGzipBytes: gzip(code),
    files: files.map(({ relativePath, size }) => ({ path: relativePath, size })),
    rootCount: expectedRoots.length,
    roots: expectedRoots,
    typeSourceBytes: sumBufferBytes(typeSourceContents),
    typeSourceFileCount: typeSourceFiles.length,
    typeSourceGzipBytes: gzip(typeSource),
  };
}

export function formatPackageCategories(categories) {
  return packageCategoryOrder.map((label) => ({
    bytes: categories.find((category) => category.label === label)?.bytes ?? 0,
    fileCount: categories.find((category) => category.label === label)?.fileCount ?? 0,
    label,
  }));
}

function parsePackOutput(output) {
  try {
    const parsed = JSON.parse(output);
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 1 ||
      !parsed[0] ||
      !Array.isArray(parsed[0].files)
    ) {
      throw new Error("expected one pack result with files");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Could not parse npm pack JSON: ${error.message}`);
  }
}

function normalizePackFiles(files, packageDirectory) {
  return files
    .map((file) => {
      const filePath = requireString(file.path, "npm pack file path");
      const absolutePath = requireChild(packageDirectory, filePath);
      const size = requireNonnegativeInteger(file.size, `npm pack file size (${filePath})`);
      const actualSize = readFileSync(absolutePath).byteLength;
      if (actualSize !== size) {
        throw new Error(
          `npm pack file size differs from source file (${filePath}): expected ${size}, received ${actualSize}`,
        );
      }
      return {
        absolutePath,
        path: filePath.replaceAll("\\", "/"),
        size,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}

function summarizePackageCategories(files, isRuntimeBearing) {
  return packageCategoryOrder.map((label) => {
    const members = files.filter((file) => packageCategory(file.path, isRuntimeBearing) === label);
    return {
      bytes: members.reduce((total, file) => total + file.size, 0),
      fileCount: members.length,
      label,
    };
  });
}

function packageCategory(filePath, isRuntimeBearing) {
  if (isRuntimeBearing(filePath)) return "Runtime-bearing code";
  if (isDeclarationFile(filePath)) return "Declarations";
  if (filePath.endsWith(".d.ts.map")) return "Declaration maps";
  if (filePath.endsWith(".map")) return "Source maps";
  if (filePath === "package.json" || filePath === "README.md" || filePath === "LICENSE") {
    return "Package metadata";
  }
  return "Other";
}

function isRuntimeBearingFile(filePath) {
  return /\.(?:js|mjs|cjs)$/.test(filePath);
}

function isDeclarationFile(filePath) {
  return filePath.endsWith(".d.ts");
}

function isStyledCodeFile(filePath) {
  return /\.(?:vue|ts|tsx|js|jsx|css)$/.test(filePath) && !isTypeSourceFile(filePath);
}

function isTypeSourceFile(filePath) {
  return filePath.endsWith(".d.ts") || /(?:^|\/)(?:types|.*Types)\.ts$/.test(filePath);
}

function normalizeRoots(roots) {
  if (!Array.isArray(roots) || roots.length === 0)
    throw new Error("roots must be a nonempty array");
  const normalized = [...new Set(roots.map((root) => requireString(root, "Styled root")))].sort();
  if (normalized.length !== roots.length) throw new Error("Styled roots must be unique");
  for (const root of normalized) requireSafeRelativePath(root, "Styled root");
  return normalized;
}

function listFiles(directory, relativePrefix = "") {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolutePath = requireChild(directory, entry.name);
      const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return listFiles(absolutePath, relativePath);
      if (!entry.isFile()) return [];
      return [{ absolutePath, relativePath, size: readFileSync(absolutePath).byteLength }];
    });
}

function requireChild(parent, relativePath) {
  requireSafeRelativePath(relativePath, "file path");
  const resolvedParent = path.resolve(parent);
  const resolvedChild = path.resolve(resolvedParent, relativePath);
  if (
    resolvedChild === resolvedParent ||
    !resolvedChild.startsWith(`${resolvedParent}${path.sep}`)
  ) {
    throw new Error(`Path escapes approved root: ${relativePath}`);
  }
  if (!existsSync(resolvedChild))
    throw new Error(`Expected measured file is missing: ${relativePath}`);
  return resolvedChild;
}

function requireSafeRelativePath(value, name) {
  if (path.isAbsolute(value) || value.split(/[\\/]+/).includes("..")) {
    throw new Error(`${name} must stay inside its approved root: ${value}`);
  }
}

function requireDirectory(directory, name) {
  if (!existsSync(directory)) throw new Error(`${name} does not exist: ${directory}`);
}

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${name} must be a string`);
  return value;
}

function requireNonnegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${name} must be a nonnegative integer`);
  return value;
}

function gzip(contents) {
  return gzipSync(contents, { level: 9 }).byteLength;
}

function sumBufferBytes(buffers) {
  return buffers.reduce((total, contents) => total + contents.byteLength, 0);
}
