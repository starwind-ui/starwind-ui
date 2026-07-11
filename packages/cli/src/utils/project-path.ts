import { lstat, realpath } from "node:fs/promises";
import path from "node:path";

export interface ProjectMutationPathOptions {
  projectRoot?: string;
  recursive?: boolean;
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isInsidePath(rootPath: string, candidatePath: string): boolean {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === "" || !isEscapingRelativePath(relativePath);
}

function isEscapingRelativePath(relativePath: string): boolean {
  return (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  );
}

function normalizePortablePath(projectRelativePath: string): string {
  return projectRelativePath.replace(/[\\/]+/g, path.sep);
}

export function resolveProjectPathLexically(
  projectRelativePath: string,
  projectRoot = process.cwd(),
): string {
  if (projectRelativePath.includes("\0")) {
    throw new Error("Project mutation path must not contain a NUL byte.");
  }

  if (
    path.posix.isAbsolute(projectRelativePath.replace(/\\/g, "/")) ||
    path.win32.isAbsolute(projectRelativePath) ||
    /^[a-zA-Z]:/.test(projectRelativePath)
  ) {
    throw new Error(`Project mutation path "${projectRelativePath}" must be relative.`);
  }

  const rootPath = path.resolve(projectRoot);
  const destination = path.resolve(rootPath, normalizePortablePath(projectRelativePath));
  const relativePath = path.relative(rootPath, destination);

  if (relativePath === "") {
    throw new Error("Project mutation path must not target the project root.");
  }

  if (isEscapingRelativePath(relativePath)) {
    throw new Error(`Project mutation path "${projectRelativePath}" must stay inside the project.`);
  }

  return destination;
}

export function assertSafePathSegment(value: string, label: string): string {
  if (
    value.length === 0 ||
    value === "." ||
    value === ".." ||
    value.includes("\0") ||
    value.includes("/") ||
    value.includes("\\") ||
    /^[a-zA-Z]:/.test(value)
  ) {
    throw new Error(`Invalid ${label} "${value}". Expected a safe single path segment.`);
  }

  return value;
}

export function assertProjectRelativePath(value: string, label: string): string {
  try {
    resolveProjectPathLexically(value);
  } catch (error) {
    throw new Error(
      `Invalid ${label}: ${error instanceof Error ? error.message : "unsafe project path"}`,
    );
  }

  return value;
}

export async function resolveProjectMutationPath(
  projectRelativePath: string,
  options: ProjectMutationPathOptions = {},
): Promise<string> {
  const configuredRoot = path.resolve(options.projectRoot ?? process.cwd());
  const realProjectRoot = await realpath(configuredRoot);
  const destination = resolveProjectPathLexically(projectRelativePath, realProjectRoot);

  let finalStats;
  try {
    finalStats = await lstat(destination);
  } catch (error) {
    if (!isMissingPathError(error)) throw error;
  }

  if (finalStats?.isSymbolicLink()) {
    throw new Error(
      `Project mutation path "${projectRelativePath}" must not target a symbolic link or junction.`,
    );
  }

  let existingAncestor = destination;
  while (true) {
    try {
      await lstat(existingAncestor);
      break;
    } catch (error) {
      if (!isMissingPathError(error)) throw error;

      const parent = path.dirname(existingAncestor);
      if (parent === existingAncestor) throw error;
      existingAncestor = parent;
    }
  }

  const realAncestor = await realpath(existingAncestor);
  if (!isInsidePath(realProjectRoot, realAncestor)) {
    throw new Error(
      `Project mutation path "${projectRelativePath}" resolves outside the real project root.`,
    );
  }

  const safeDestination = path.resolve(realAncestor, path.relative(existingAncestor, destination));
  if (!isInsidePath(realProjectRoot, safeDestination)) {
    throw new Error(
      `Project mutation path "${projectRelativePath}" resolves outside the real project root.`,
    );
  }

  if (options.recursive && safeDestination === realProjectRoot) {
    throw new Error("Recursive project mutation must not target the project root.");
  }

  return safeDestination;
}
