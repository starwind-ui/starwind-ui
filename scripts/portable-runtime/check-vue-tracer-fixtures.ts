import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buttonRuntimeAdapterContract,
  checkboxRuntimeAdapterContract,
  selectRuntimeAdapterContract,
} from "./contracts/primitive/representatives.js";
import {
  buildGenericAdapterPlan,
  printFutureFrameworkTracerPlan,
} from "./renderers/generic-adapter-plan/index.js";
import {
  buildSelectSpecializedAdapterSpec,
  printFutureSelectSpecializedAdapterSpecFixture,
} from "./renderers/specialized-adapter-spec/index.js";

const repoRoot = process.cwd();
const fixtureRoot = await mkdtemp(path.join(repoRoot, ".scratch", "vue-tracer-"));

try {
  const files = [
    ...printFutureFrameworkTracerPlan("vue", buildGenericAdapterPlan(buttonRuntimeAdapterContract)),
    ...printFutureFrameworkTracerPlan(
      "vue",
      buildGenericAdapterPlan(checkboxRuntimeAdapterContract),
    ),
    ...printFutureSelectSpecializedAdapterSpecFixture(
      "vue",
      buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract),
    ),
  ];

  for (const file of files) {
    const outputPath = path.join(fixtureRoot, file.path);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, file.contents, "utf8");
  }

  const tsconfigPath = path.join(fixtureRoot, "tsconfig.json");
  await writeFile(
    tsconfigPath,
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: repoRoot.replaceAll("\\", "/"),
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          paths: {
            "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
          },
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["__future-fixtures/vue/**/*.ts", "__future-fixtures/vue/**/*.vue"],
        vueCompilerOptions: {
          checkUnknownProps: false,
          strictTemplates: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const vueTsc = path.join(repoRoot, "node_modules", "vue-tsc", "bin", "vue-tsc.js");
  const result = spawnSync(process.execPath, [vueTsc, "--noEmit", "-p", tsconfigPath], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Vue tracer SFC typecheck failed with exit code ${String(result.status)}.`);
  }
} finally {
  await rm(fixtureRoot, { force: true, recursive: true });
}
