import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  // minify: true,
  target: "esnext",
  outDir: "dist",
  // banner: {
  //   js: "#!/usr/bin/env node",
  // },
});
