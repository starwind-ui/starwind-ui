import { execFile } from "node:child_process";
import { rename, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

// @ts-expect-error The shared command helper is an ESM JavaScript module.
import { createSpawnCommand, getPackageManagerCommand } from "../command-process.mjs";

import {
  PRIMITIVE_VERSION_FRAGMENT_DIR,
  STAGED_PRIMITIVE_VERSION_FRAGMENT_DIR,
} from "./primitive-component-release.js";
import {
  STAGED_STYLED_VERSION_FRAGMENT_DIR,
  STYLED_VERSION_FRAGMENT_DIR,
} from "./styled-component-release.js";

const execFileAsync = promisify(execFile);

type IntentDirectory = { pending: string; staged: string };
type CommandResult = { stdout: string; stderr: string };
type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd: string; encoding: "utf8"; maxBuffer: number },
) => Promise<CommandResult>;

const INTENT_DIRECTORIES: IntentDirectory[] = [
  { pending: STYLED_VERSION_FRAGMENT_DIR, staged: STAGED_STYLED_VERSION_FRAGMENT_DIR },
  { pending: PRIMITIVE_VERSION_FRAGMENT_DIR, staged: STAGED_PRIMITIVE_VERSION_FRAGMENT_DIR },
];

export function createChangesetStatusCommand(): { command: string; args: string[] } {
  return createSpawnCommand(getPackageManagerCommand("pnpm"), [
    "exec",
    "changeset",
    "status",
    "--verbose",
  ]);
}

export async function runChangesetStatus(
  options: { repoRoot?: string; run?: CommandRunner } = {},
): Promise<string> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const run = options.run ?? (execFileAsync as CommandRunner);
  const moved: IntentDirectory[] = [];
  try {
    for (const directory of INTENT_DIRECTORIES) {
      const pending = path.join(repoRoot, directory.pending);
      const staged = path.join(repoRoot, directory.staged);
      const [pendingExists, stagedExists] = await Promise.all([
        pathExists(pending),
        pathExists(staged),
      ]);
      if (pendingExists && stagedExists) {
        throw new Error(
          `Both pending and staged intent directories exist: ${directory.pending} and ${directory.staged}.`,
        );
      }
      if (pendingExists) {
        await rename(pending, staged);
        moved.push(directory);
      }
    }

    const command = createChangesetStatusCommand();
    const { stdout, stderr } = await run(command.command, command.args, {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    return `${stdout}${stderr}`;
  } finally {
    for (const directory of moved.reverse()) {
      await rename(path.join(repoRoot, directory.staged), path.join(repoRoot, directory.pending));
    }
  }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runChangesetStatus()
    .then((output) => process.stdout.write(output))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
