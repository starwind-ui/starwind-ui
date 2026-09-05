import { writeFile } from "node:fs/promises";
import { format } from "prettier";

import { renderVueBetaReadinessAudit } from "./beta-readiness-audit.js";

const output = "docs/portable-runtime/diagnostics/vue-beta-readiness-audit.md";

await writeFile(
  output,
  await format(renderVueBetaReadinessAudit(), { parser: "markdown" }),
  "utf8",
);
console.log(`Wrote ${output}`);
