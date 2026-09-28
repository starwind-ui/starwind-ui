import path from "node:path";
import { createRequire } from "node:module";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";

export function createPreviewCardConsumer(repoRoot: string): Promise<DistConsumer> {
  const viteManifest = createRequire(path.join(repoRoot, "package.json")).resolve("vite");
  const esbuildManifest = createRequire(viteManifest).resolve("esbuild/package.json");
  return createDistConsumer({
    packageRoot: path.join(repoRoot, "packages/svelte"),
    additionalPackages: [
      { name: "esbuild", from: viteManifest },
      { name: `@esbuild/${process.platform}-${process.arch}`, from: esbuildManifest },
    ],
  });
}
