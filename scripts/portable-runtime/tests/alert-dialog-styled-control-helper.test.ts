import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { alertDialogStyledControlHelper } from "../contracts/styled/components/alert-dialog.js";

const styledHomes = [
  ["react", "apps/react-demo/src/components/starwind-runtime/alert-dialog", "tsx"],
  ["vue", "apps/vue-demo/src/components/starwind-runtime/alert-dialog", "vue"],
  ["svelte", "apps/svelte-demo/src/lib/starwind-runtime/alert-dialog", "svelte"],
] as const;

async function primitiveImports(framework: string, file: string): Promise<string[]> {
  const source = await readFile(path.join(process.cwd(), file), "utf8");
  const pattern = new RegExp(
    `import \\{([^}]*)\\} from "@starwind-ui/${framework}/alert-dialog";`,
    "g",
  );
  return [...source.matchAll(pattern)].map((match) => match[1]!.trim());
}

describe("Styled Alert Dialog control helper", () => {
  for (const [framework, home, extension] of styledHomes) {
    it(`${framework} Action and Cancel import only the contracted helper`, async () => {
      for (const part of ["Action", "Cancel"]) {
        const file = `${home}/AlertDialog${part}.${extension}`;
        expect(await primitiveImports(framework, file)).toEqual([alertDialogStyledControlHelper]);
      }
    });

    it(`${framework} Primitive Alert Dialog exports the contracted helper`, async () => {
      const source = await readFile(
        path.join(process.cwd(), `packages/${framework}/src/alert-dialog/index.ts`),
        "utf8",
      );
      expect(source).toMatch(new RegExp(`export \\{ ${alertDialogStyledControlHelper} \\} from "`));
    });
  }
});
