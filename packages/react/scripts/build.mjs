import { rm } from "node:fs/promises";

import { build } from "tsup";

try {
  await build({});
} finally {
  await rm(".tsup", { force: true, recursive: true });
}
