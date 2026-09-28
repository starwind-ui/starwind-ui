import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { DistConsumer } from "./dist-consumer.js";

/** Copy complete generated groups into a consumer that already owns its compiler and dependencies. */
export async function writeStyledConsumerFiles(
  consumer: DistConsumer,
  repoRoot: string,
  groups: readonly string[],
) {
  const ts: typeof import("typescript") = createRequire(path.join(consumer.root, "package.json"))(
    "typescript",
  );
  const files: Record<string, string> = {};
  for (const group of groups) {
    const directory = path.join(repoRoot, "apps/svelte-demo/src/lib/starwind-runtime", group);
    for (const name of await readdir(directory)) {
      const source = await readFile(path.join(directory, name), "utf8");
      files[`${group}/${name}`] = source;
      if (name.endsWith(".ts"))
        files[`${group}/${name.slice(0, -3)}.js`] = ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText;
    }
  }
  await consumer.write(files);
}
