import { type SpawnOptions, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type FormatGeneratedOutputCommandOptions = {
  biomeConfigPath?: string;
  cwd?: string;
  npmExecPath?: string | null;
  paths: string[];
  platform?: NodeJS.Platform;
  prettierConfigPath?: string;
};

type FormatGeneratedOutputCommand = {
  args: string[];
  command: string;
  name: string;
  options: SpawnOptions;
};

export function getFormatGeneratedOutputCommands(
  options: FormatGeneratedOutputCommandOptions,
): FormatGeneratedOutputCommand[] {
  return [
    getPackageManagerCommand({
      ...options,
      name: "Prettier",
      packageManagerArgs: [
        "exec",
        "prettier",
        "-w",
        ...(options.prettierConfigPath ? ["--config", options.prettierConfigPath] : []),
        ...options.paths,
      ],
    }),
    getPackageManagerCommand({
      ...options,
      name: "Biome",
      packageManagerArgs: [
        "exec",
        "biome",
        "check",
        "--write",
        "--formatter-enabled=false",
        "--linter-enabled=false",
        "--diagnostic-level=info",
        ...(options.biomeConfigPath ? ["--config-path", options.biomeConfigPath] : []),
        ...options.paths,
      ],
    }),
  ];
}

function getPackageManagerCommand({
  cwd = process.cwd(),
  name,
  npmExecPath = process.env.npm_execpath,
  packageManagerArgs,
  platform = process.platform,
}: Omit<FormatGeneratedOutputCommandOptions, "paths"> & {
  name: string;
  packageManagerArgs: string[];
}): FormatGeneratedOutputCommand {
  const command = npmExecPath
    ? isJavaScriptFile(npmExecPath)
      ? process.execPath
      : npmExecPath
    : platform === "win32"
      ? "pnpm.cmd"
      : "pnpm";
  const args =
    npmExecPath && isJavaScriptFile(npmExecPath)
      ? [npmExecPath, ...packageManagerArgs]
      : packageManagerArgs;

  return {
    args,
    command,
    name,
    options: {
      cwd,
      shell: platform === "win32" && isWindowsCommandScript(command),
      stdio: "inherit",
    },
  };
}

export type FormatGeneratedOutputOptions = {
  /** Run Prettier around the Biome import sort. Writers that format their own files set this to false. */
  prettier?: boolean;
};

export async function formatGeneratedOutput(
  paths: string[],
  cwd = process.cwd(),
  options: FormatGeneratedOutputOptions = {},
): Promise<void> {
  // Biome never reads files under node_modules, such as a generated candidate in a tool cache.
  // Those paths are formatted in a temporary copy, then copied back.
  const resolvedPaths = paths.map((candidate) => path.resolve(cwd, candidate));
  if (!resolvedPaths.some((candidate) => candidate.split(path.sep).includes("node_modules"))) {
    await formatPaths(paths, cwd, options);
    return;
  }
  const stagingRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-format-generated-"));
  try {
    const stagedPaths = resolvedPaths.map((_, index) => path.join(stagingRoot, String(index)));
    for (const [index, source] of resolvedPaths.entries())
      await cp(source, stagedPaths[index]!, { recursive: true });
    await formatPaths(stagedPaths, cwd, options);
    for (const [index, source] of resolvedPaths.entries())
      await cp(stagedPaths[index]!, source, { force: true, recursive: true });
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
}

async function formatPaths(
  paths: string[],
  cwd: string,
  { prettier = true }: FormatGeneratedOutputOptions,
): Promise<void> {
  const formatsOutsideRepo = needsStandaloneBiomeConfig(paths, cwd);
  const temporaryBiomeConfigDir = formatsOutsideRepo
    ? await createStandaloneBiomeConfigDir()
    : undefined;
  const biomeConfigPath = temporaryBiomeConfigDir
    ? path.join(temporaryBiomeConfigDir, "biome.json")
    : undefined;
  const repoPrettierConfigPath = path.join(cwd, "prettier.config.mjs");
  const prettierConfigPath =
    formatsOutsideRepo && existsSync(repoPrettierConfigPath) ? repoPrettierConfigPath : undefined;

  try {
    const [prettierCommand, biomeCommand] = getFormatGeneratedOutputCommands({
      biomeConfigPath,
      cwd,
      paths,
      prettierConfigPath,
    });
    if (!prettier) {
      await runCommand(biomeCommand);
      return;
    }

    await runCommand(prettierCommand);
    const beforeSort = await readFileContents(paths, cwd);
    await runCommand(biomeCommand);
    // Biome can rejoin a sorted import past the line width, so Prettier runs again. Only the files
    // that Biome changed need the second pass, because Prettier output is stable on a second run.
    const sortedFiles: string[] = [];
    for (const [file, content] of await readFileContents(paths, cwd)) {
      if (beforeSort.get(file) !== content) sortedFiles.push(file);
    }
    const relativeFiles = sortedFiles.map((file) => path.relative(cwd, file) || file);
    for (const files of chunkPaths(relativeFiles, process.platform === "win32" ? 6000 : 100_000)) {
      const [command] = getFormatGeneratedOutputCommands({
        cwd,
        paths: ["--ignore-unknown", ...files],
        prettierConfigPath,
      });
      await runCommand(command!);
    }
  } finally {
    if (temporaryBiomeConfigDir) {
      await rm(temporaryBiomeConfigDir, { force: true, recursive: true });
    }
  }
}

function runCommand({ args, command, name, options }: FormatGeneratedOutputCommand): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, options);

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${name} exited with code ${code}.`));
    });
  });
}

async function readFileContents(paths: string[], cwd: string): Promise<Map<string, string>> {
  const contents = new Map<string, string>();
  const visit = async (candidate: string): Promise<void> => {
    const stats = await stat(candidate).catch(() => undefined);
    if (stats?.isDirectory()) {
      const entries = await readdir(candidate);
      await Promise.all(entries.map((entry) => visit(path.join(candidate, entry))));
    } else if (stats?.isFile()) {
      contents.set(candidate, await readFile(candidate, "utf8"));
    }
  };
  await Promise.all(paths.map((candidate) => visit(path.resolve(cwd, candidate))));
  return contents;
}

/** Keep each command line short enough for the platform, mainly the Windows command shell. */
function chunkPaths(files: string[], maxLength: number): string[][] {
  const chunks: string[][] = [];
  let chunk: string[] = [];
  let length = 0;
  for (const file of files.sort()) {
    if (chunk.length > 0 && length + file.length + 1 > maxLength) {
      chunks.push(chunk);
      chunk = [];
      length = 0;
    }
    chunk.push(file);
    length += file.length + 1;
  }
  if (chunk.length > 0) chunks.push(chunk);
  return chunks;
}

function isWindowsCommandScript(command: string): boolean {
  const extension = path.extname(command).toLowerCase();

  return extension === ".cmd" || extension === ".bat";
}

function isJavaScriptFile(command: string): boolean {
  const extension = path.extname(command).toLowerCase();

  return extension === ".cjs" || extension === ".js" || extension === ".mjs";
}

function needsStandaloneBiomeConfig(paths: string[], cwd: string): boolean {
  const resolvedCwd = path.resolve(cwd);

  return paths.some((candidate) => {
    if (!path.isAbsolute(candidate)) return false;

    const relativePath = path.relative(resolvedCwd, candidate);
    return relativePath.startsWith("..") || path.isAbsolute(relativePath);
  });
}

async function createStandaloneBiomeConfigDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "starwind-biome-generated-"));
  const configPath = path.join(dir, "biome.json");

  await writeFile(
    configPath,
    JSON.stringify(
      {
        assist: { actions: { source: { organizeImports: "on" } } },
        // Keep in sync with the repo biome.jsonc, which leaves Svelte files out of import sorting.
        files: { includes: ["**", "!**/*.svelte"] },
        formatter: { enabled: false },
        linter: { enabled: false },
      },
      null,
      2,
    ),
  );

  return dir;
}
