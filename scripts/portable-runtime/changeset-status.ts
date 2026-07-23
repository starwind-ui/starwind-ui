import { execFile } from "node:child_process";
import { rename, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

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

const INTENT_DIRECTORIES: IntentDirectory[] = [
  { pending: STYLED_VERSION_FRAGMENT_DIR, staged: STAGED_STYLED_VERSION_FRAGMENT_DIR },
  { pending: PRIMITIVE_VERSION_FRAGMENT_DIR, staged: STAGED_PRIMITIVE_VERSION_FRAGMENT_DIR },
];

export async function runChangesetStatus(options: { repoRoot?: string } = {}): Promise<string> {
  const repoRoot = options.repoRoot ?? process.cwd();
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

    const pnpmPath = process.env.npm_execpath;
    if (!pnpmPath) throw new Error("pnpm executable path is unavailable.");
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [pnpmPath, "exec", "changeset", "status", "--verbose"],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
    );
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
