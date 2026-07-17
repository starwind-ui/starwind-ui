import { existsSync, readdirSync } from "node:fs";

import { defineConfig } from "tsup";

export function createReactEntryPoints(componentDirectories: Iterable<string>) {
  return Object.fromEntries([
    ["index", "src/index.ts"],
    ...[...componentDirectories]
      .sort()
      .map((component) => [`${component}/index`, `src/${component}/index.ts`]),
  ]);
}

const sourceDirectory = new URL("./src/", import.meta.url);
const componentDirectories = readdirSync(sourceDirectory, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      entry.name !== "internal" &&
      existsSync(new URL(`./${entry.name}/index.ts`, sourceDirectory)),
  )
  .map((entry) => entry.name);
export const reactEntryPoints = createReactEntryPoints(componentDirectories);

export default defineConfig({
  entry: reactEntryPoints,
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
  outDir: "dist",
  external: ["@starwind-ui/runtime", "react", "react-dom"],
});
