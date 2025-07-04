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
    // Copy all component files to dist/src/components
    const componentFiles = await glob("src/components/**/*.*");
    for (const file of componentFiles) {
      const destPath = join("dist", file);
      await ensureDir(dirname(destPath));
      await copy(file, destPath);
    }
    // Copy registry.json
    // await copy("src/registry.json", "dist/registry.json");
  },
});
