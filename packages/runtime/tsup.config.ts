import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsup";

import {
  internalPropertyPattern,
  planRuntimeInternalProperties,
} from "./build/mangle-internal-properties";
import { manglePrivateMembersPlugin } from "./build/mangle-private-members";

const tsconfigPath = fileURLToPath(new URL("./tsconfig.json", import.meta.url));

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
  sourcemap: true,
  clean: true,
  target: "es2022",
  outDir: "dist",
  esbuildOptions(options) {
    options.mangleProps = internalPropertyPattern(planRuntimeInternalProperties(tsconfigPath));
  },
  esbuildPlugins: [manglePrivateMembersPlugin(tsconfigPath)],
});
