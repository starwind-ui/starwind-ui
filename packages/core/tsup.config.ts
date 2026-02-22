import { dirname, join } from "node:path";

import { copy, ensureDir } from "fs-extra";
import { glob } from "glob";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "esnext",
  outDir: "dist",
  async onSuccess() {
    // Copy all component and shared utility files into dist
    const filesToCopy = await glob("src/{components,lib/utils}/**/*.*");
    for (const file of filesToCopy) {
      const destPath = join("dist", file);
      await ensureDir(dirname(destPath));
      await copy(file, destPath);
    }
    // Copy registry.json
    // await copy("src/registry.json", "dist/registry.json");
  },
});
