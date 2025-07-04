import { rm } from "node:fs/promises";
import globby from "globby";

const PATTERNS_TO_REMOVE = [
  "**/node_modules",
  "**/dist",
  "**/.turbo",
  "**/build",
  "**/coverage",
  "pnpm-lock.yaml",
  "**/.cache",
];

async function clean() {
  try {
    const cwd = process.cwd();
    console.log("🧹 Cleaning project...");

    const paths = await globby(PATTERNS_TO_REMOVE, {
      cwd,
      onlyFiles: false,
      dot: true,
      absolute: true,
    });

    if (paths.length === 0) {
      console.log("✨ Nothing to clean");
      return;
    }

    console.log("\nRemoving the following paths:");
    paths.forEach((path) => console.log(`- ${path}`));

    await Promise.all(
      paths.map((path) =>
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
