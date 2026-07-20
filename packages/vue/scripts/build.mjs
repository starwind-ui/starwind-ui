import { cp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { build } from "tsup";

import { validateVuePackageInventory } from "./validate-inventory.mjs";

const declarationOutput = ".vue-types";

await validateVuePackageInventory();

await Promise.all([
  rm("dist", { force: true, recursive: true }),
  rm(declarationOutput, { force: true, recursive: true }),
]);

try {
  await build({});
  const vueTsc = fileURLToPath(new URL("../node_modules/vue-tsc/bin/vue-tsc.js", import.meta.url));
  const result = spawnSync(process.execPath, [vueTsc, "-p", "tsconfig.build.json"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`vue-tsc declaration generation failed with exit code ${result.status}.`);
  }

  await cp(`${declarationOutput}/vue/src`, "dist", { recursive: true });
} finally {
  await Promise.all([
    rm(".tsup", { force: true, recursive: true }),
    rm(declarationOutput, { force: true, recursive: true }),
  ]);
}
