import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

// Each demo app keeps its own chart catalog copy. Only the Styled chart import may differ.
const copies = [
  ["apps/demo/src/components/demos/chart/chart-catalog.ts", "../../starwind-runtime/chart"],
  [
    "apps/react-demo/src/runtime-prototype/charts/chart-catalog.ts",
    "../../components/starwind-runtime/chart",
  ],
  ["apps/vue-demo/src/components/chart/chart-catalog.ts", "../starwind-runtime/chart"],
  ["apps/svelte-demo/src/lib/review/chart/chart-catalog.ts", "$lib/starwind-runtime/chart"],
] as const;

const importLine = /^} from "([^"]*starwind-runtime\/chart)";$/gm;

function read(file: string) {
  return readFileSync(path.join(root, file), "utf8");
}

describe("chart gallery catalog copies", () => {
  it.each(copies)("%s imports the app's Styled chart parts once", (file, specifier) => {
    const imports = [...read(file).matchAll(importLine)].map((match) => match[1]);
    expect(imports).toEqual([specifier]);
  });

  it("are identical apart from the Styled chart import", () => {
    const [first, ...rest] = copies.map(([file]) => ({
      file,
      body: read(file).replace(importLine, '} from "<styled chart>";'),
    }));
    for (const copy of rest) {
      expect(copy.body, `${copy.file} differs from ${first!.file}`).toBe(first!.body);
    }
  });
});
