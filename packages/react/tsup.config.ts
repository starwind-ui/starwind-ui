import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/*/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
  outDir: "dist",
  external: ["@starwind-ui/runtime", "react", "react-dom"],
});
