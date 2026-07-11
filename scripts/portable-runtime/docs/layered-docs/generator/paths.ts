import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(scriptDirectory, "../../../../..");

export const PRIMITIVE_AUTHORED_USAGE_ROOT = path.join(
  repoRoot,
  "scripts",
  "portable-runtime",
  "docs",
  "layered-docs",
  "primitives",
);

export const runtimePackageJsonPath = path.join(repoRoot, "packages", "runtime", "package.json");

export const runtimeIndexPath = path.join(repoRoot, "packages", "runtime", "src", "index.ts");

export const runtimeInitStarwindPath = path.join(
  repoRoot,
  "packages",
  "runtime",
  "src",
  "init-starwind.ts",
);

export const themeTemplatePath = path.join(
  repoRoot,
  "packages",
  "cli",
  "src",
  "templates",
  "starwind.css.ts",
);
