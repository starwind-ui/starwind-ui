import { type SpawnOptions, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
  const command =
    npmExecPath && !isWindowsCommandScript(npmExecPath)
      ? process.execPath
      : (npmExecPath ?? (platform === "win32" ? "pnpm.cmd" : "pnpm"));
  const args =
    npmExecPath && !isWindowsCommandScript(npmExecPath)
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

export async function formatGeneratedOutput(paths: string[], cwd = process.cwd()): Promise<void> {
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
    const commands = getFormatGeneratedOutputCommands({
      biomeConfigPath,
      cwd,
      paths,
      prettierConfigPath,
    });

    for (const { args, command, name, options } of commands) {
      await new Promise<void>((resolve, reject) => {
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
  } finally {
    if (temporaryBiomeConfigDir) {
      await rm(temporaryBiomeConfigDir, { force: true, recursive: true });
    }
  }
}

function isWindowsCommandScript(command: string): boolean {
  const extension = path.extname(command).toLowerCase();

  return extension === ".cmd" || extension === ".bat";
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
        files: { includes: ["**"] },
        formatter: { enabled: false },
        linter: { enabled: false },
      },
      null,
      2,
    ),
  );

  return dir;
}
