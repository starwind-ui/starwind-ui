import { existsSync } from "node:fs";

// The public sync intentionally omits private adapter source and evidence.
export const hasPrivateSvelte = existsSync("packages/svelte/package.json");
export const expectedPrimitiveTargets = [
  "astro",
  "react",
  "vue",
  ...(hasPrivateSvelte ? ["svelte"] : []),
];
