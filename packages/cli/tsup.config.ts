import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: Boolean(options.watch),
  minify: !options.watch,
  keepNames: true,
  target: "esnext",
  outDir: "dist",
}));
