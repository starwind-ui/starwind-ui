import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const NAMES_TO_REMOVE = new Set([
  "node_modules",
  "dist",
  ".turbo",
  "build",
  "coverage",
  "pnpm-lock.yaml",
  ".cache",
]);

const DIRS_TO_SKIP = new Set([".git", ".yalc"]);

async function findPathsToRemove(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (NAMES_TO_REMOVE.has(entry.name)) {
      paths.push(path);
      continue;
    }

    if (entry.isDirectory() && !DIRS_TO_SKIP.has(entry.name)) {
      paths.push(...(await findPathsToRemove(path)));
    }
  }

  return paths;
}

const ROOT_FILES_TO_REMOVE = ["pnpm-lock.yaml"];

async function clean() {
  try {
    const cwd = process.cwd();
    console.log("🧹 Cleaning project...");

    const paths = [
      ...(await findPathsToRemove(cwd)),
      ...ROOT_FILES_TO_REMOVE.map((file) => join(cwd, file)),
    ];

    const uniquePaths = [...new Set(paths)];

    if (uniquePaths.length === 0) {
      console.log("✨ Nothing to clean");
      return;
    }

    console.log("\nRemoving the following paths:");
    uniquePaths.forEach((path) => console.log(`- ${path}`));

    await Promise.all(
      uniquePaths.map((path) =>
        rm(path, { recursive: true, force: true }).catch((err) =>
          console.error(`Failed to remove ${path}:`, err),
        ),
      ),
    );

    console.log("\n✨ Clean complete!");
  } catch (error) {
    console.error("❌ Clean failed:", error);
    process.exit(1);
  }
}

// Run the clean script
clean();
