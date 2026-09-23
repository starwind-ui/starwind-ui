import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";

/** Copy generated Styled files while resolving every Primitive import through built package exports. */
export async function createStyledButtonConsumer(repoRoot: string): Promise<DistConsumer> {
  const consumer = await createDistConsumer({
    packageRoot: path.join(repoRoot, "packages/svelte"),
    additionalPackages: ["tailwind-variants", "tailwind-merge"].map((name) => ({
      name,
      from: path.join(repoRoot, "apps/demo/package.json"),
    })),
  });
  try {
    const localRequire = createRequire(path.join(consumer.root, "package.json"));
    const ts: typeof import("typescript") = localRequire("typescript");
    const generated = path.join(repoRoot, "apps/svelte-demo/src/lib/starwind-runtime/button");
    const files: Record<string, string> = {};
    for (const name of ["Button.svelte", "variants.ts", "index.ts"]) {
      const source = await readFile(path.join(generated, name), "utf8");
      files[`button/${name}`] = source;
      if (name.endsWith(".ts")) {
        files[`button/${name.slice(0, -3)}.js`] = ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText;
      }
    }
    await consumer.write(files);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledButtonConsumer = `<script lang="ts">
import { Button, type ButtonProps } from "./button/index.js";
let buttonRef: HTMLButtonElement | null = null;
let anchorRef: HTMLAnchorElement | null = null;
const button = (element: HTMLButtonElement | null) => { buttonRef = element; };
const anchor = (element: HTMLAnchorElement | null) => { anchorRef = element; };
const props: ButtonProps = { type: "submit", variant: "primary", size: "sm" };
</script>
<Button {...props} ref={button} onclick={(event: MouseEvent & { currentTarget: HTMLButtonElement }) => { const element: HTMLButtonElement = event.currentTarget; void element; }}>Submit</Button>
<Button as="a" href="/docs" ref={anchor} onclick={(event) => { const element: HTMLAnchorElement = event.currentTarget; void element; }}>Docs</Button>
<Button href="/docs" ref={anchor}>Inferred anchor</Button>
<Button as="button" href="/docs" ref={anchor}>Href selects anchor</Button>`;
