import { execFileSync } from "node:child_process";
import { readFile, realpath, readdir, rm, mkdir, mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MAX_TARBALL_BYTES = 460_800;
export const MAX_UNPACKED_BYTES = 3_145_728;
export const INSTALLED_CLI_COMMAND = Object.freeze(["exec", "starwind", "--help"]);

const PACKAGE_DIRECTORY = fileURLToPath(new URL("..", import.meta.url));
const PNPM_EXECUTABLE = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

export function validatePackMetadata(packInfo) {
  const errors = [];
  const paths = (packInfo.files ?? []).map((file) => file.path);
  const pathSet = new Set(paths);

  if (!isByteMeasurement(packInfo.tarballBytes)) {
    errors.push("tarball bytes must be a finite nonnegative integer");
  } else if (packInfo.tarballBytes > MAX_TARBALL_BYTES) {
    errors.push(`tarball is ${packInfo.tarballBytes} bytes; limit is ${MAX_TARBALL_BYTES} bytes`);
  }
  if (!isByteMeasurement(packInfo.unpackedBytes)) {
    errors.push("unpacked package bytes must be a finite nonnegative integer");
  } else if (packInfo.unpackedBytes > MAX_UNPACKED_BYTES) {
    errors.push(
      `unpacked package is ${packInfo.unpackedBytes} bytes; limit is ${MAX_UNPACKED_BYTES} bytes`,
    );
  }
  if (!pathSet.has("dist/index.js")) {
    errors.push("package is missing dist/index.js");
  }
  if (!pathSet.has("dist/index.d.ts")) {
    errors.push("package is missing dist/index.d.ts");
  }

  const sourceMaps = paths.filter((filePath) => /\.(?:c|m)?js\.map$/.test(filePath));
  if (sourceMaps.length > 0) {
    errors.push(`package contains JavaScript source maps: ${sourceMaps.join(", ")}`);
  }

  return errors;
}

function isByteMeasurement(value) {
  return (
    typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0
  );
}

export async function checkCliPackage() {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "starwind-package-check-"));

  try {
    const packDirectory = path.join(temporaryDirectory, "pack");
    await mkdir(packDirectory);

    const packOutput = runPnpm(
      ["pack", "--json", "--pack-destination", packDirectory],
      PACKAGE_DIRECTORY,
    );
    const packResult = JSON.parse(packOutput);
    const packInfo = Array.isArray(packResult) ? packResult[0] : packResult;
    if (!packInfo || typeof packInfo.filename !== "string") {
      throw new Error("pnpm pack did not return package metadata");
    }

    const tarballPath = path.join(packDirectory, path.basename(packInfo.filename));
    const tarballBytes = (await stat(tarballPath)).size;
    const installDirectory = path.join(temporaryDirectory, "install");
    await mkdir(installDirectory);
    await writeFile(
      path.join(installDirectory, "package.json"),
      `${JSON.stringify(
        {
          name: "starwind-package-check",
          private: true,
          dependencies: {
            starwind: pathToFileURL(tarballPath).href,
          },
        },
        null,
        2,
      )}\n`,
    );

    runPnpm(["install", "--prod"], installDirectory);

    const installedPackageDirectory = await realpath(
      path.join(installDirectory, "node_modules/starwind"),
    );
    const unpackedBytes = await measureRegularPackageFiles(installedPackageDirectory);
    const metadataErrors = validatePackMetadata({
      tarballBytes,
      unpackedBytes,
      files: packInfo.files,
    });
    if (metadataErrors.length > 0) {
      throw new Error(
        `${tarballBytes} packed bytes; ${unpackedBytes} unpacked bytes\n${metadataErrors.join("\n")}`,
      );
    }

    const installedPackageJson = JSON.parse(
      await readFile(path.join(installedPackageDirectory, "package.json"), "utf8"),
    );
    if (typeof installedPackageJson.dependencies?.["@babel/parser"] !== "string") {
      throw new Error("packed manifest does not declare @babel/parser as a production dependency");
    }

    const installedEntryPath = path.join(installedPackageDirectory, "dist/index.js");
    const installedEntry = await readFile(installedEntryPath, "utf8");
    if (!/from\s*["']@babel\/parser["']/.test(installedEntry)) {
      throw new Error("built CLI does not keep @babel/parser external");
    }

    const helpOutput = runPnpm(INSTALLED_CLI_COMMAND, installDirectory);
    if (!helpOutput.includes("Usage: starwind")) {
      throw new Error("installed CLI did not print Starwind help");
    }

    await rm(temporaryDirectory, { recursive: true, force: true });
    return {
      tarballBytes,
      unpackedBytes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}\nDiagnostics: ${temporaryDirectory}`, { cause: error });
  }
}

async function measureRegularPackageFiles(directory) {
  let bytes = 0;
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      bytes += await measureRegularPackageFiles(entryPath);
      continue;
    }

    if (entry.isFile()) {
      bytes += (await stat(entryPath)).size;
    }
  }

  return bytes;
}

function runPnpm(args, cwd) {
  if (process.env.npm_execpath) {
    return runCommand(process.execPath, [process.env.npm_execpath, ...args], cwd);
  }

  return runCommand(PNPM_EXECUTABLE, args, cwd);
}

function runCommand(command, args, cwd) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
    const detail = stderr ? `\n${stderr.slice(-1_000)}` : "";
    throw new Error(`${path.basename(command)} ${args[0]} failed${detail}`, { cause: error });
  }
}

const isMain =
  typeof process.argv[1] === "string" &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  try {
    const result = await checkCliPackage();
    console.log(
      `CLI package check passed: ${result.tarballBytes} packed bytes, ${result.unpackedBytes} unpacked bytes`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
