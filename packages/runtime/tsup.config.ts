import { readdirSync } from "node:fs";

import { defineConfig } from "tsup";

const componentEntries = Object.fromEntries(
  readdirSync(new URL("./src/components", import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, `src/components/${entry.name}/index.ts`]),
);

export default defineConfig({
  entry: {
    index: "src/index.ts",
    ...componentEntries,
    "init-starwind": "src/init-starwind.ts",
    theme: "src/theme/theme.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
  outDir: "dist",
});
