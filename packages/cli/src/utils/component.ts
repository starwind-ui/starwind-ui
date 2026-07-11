import * as path from "node:path";

import fs from "fs-extra";

import type { StarwindFramework } from "./config.js";
import { assertSafePathSegment, resolveProjectMutationPath } from "./project-path.js";

export interface RemoveTarget {
  name: string;
  framework: StarwindFramework;
  componentDir: string;
}

export interface RemoveResult {
  componentDir: string;
  name: string;
  framework: StarwindFramework;
  status: "removed" | "failed";
  error?: string;
}

function resolveConfigPath(directory: string): string {
  if (directory.startsWith("@/")) {
    return path.join("src", directory.slice(2));
  }

  return directory;
}

/**
 * Removes a component from the project's component directory.
 */
export async function removeComponent(target: RemoveTarget): Promise<RemoveResult> {
  const { componentDir, framework, name } = target;

  try {
    assertSafePathSegment(name, "component name");
    const componentRelativePath = path.join(resolveConfigPath(componentDir), name);
    const componentPath = await resolveProjectMutationPath(componentRelativePath, {
      recursive: true,
    });

    if (await fs.pathExists(componentPath)) {
      const removalPath = await resolveProjectMutationPath(componentRelativePath, {
        recursive: true,
      });
      await fs.remove(removalPath);
      return { componentDir, name, framework, status: "removed" };
    }

    return {
      componentDir,
      name,
      framework,
      status: "failed",
      error: "Component directory not found",
    };
  } catch (error) {
    return {
      componentDir,
      name,
      framework,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
