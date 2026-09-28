import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";

export async function createStyledCheckboxConsumer(repoRoot: string): Promise<DistConsumer> {
  const consumer = await createDistConsumer({
    packageRoot: path.join(repoRoot, "packages/svelte"),
    additionalPackages: ["tailwind-variants", "tailwind-merge"].map((name) => ({
      name,
      from: path.join(repoRoot, "apps/demo/package.json"),
    })),
  });
  try {
    const ts: typeof import("typescript") = createRequire(path.join(consumer.root, "package.json"))(
      "typescript",
    );
    const files: Record<string, string> = {};
    for (const name of ["Checkbox.svelte", "styles.css", "variants.ts", "index.ts"]) {
      const source = await readFile(
        path.join(repoRoot, "apps/svelte-demo/src/lib/starwind-runtime/checkbox", name),
        "utf8",
      );
      files[`checkbox/${name}`] = source;
      if (name.endsWith(".ts"))
        files[`checkbox/${name.slice(0, -3)}.js`] = ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText;
    }
    await consumer.write(files);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledCheckboxConsumer = `<script lang="ts">
import Checkbox, { CheckboxVariants, type CheckboxProps } from "./checkbox/index.js";
let checked = $state<boolean | undefined>(undefined);
const props: CheckboxProps = { nativeButton: true, popovertarget: "popover", size: "sm", variant: "primary", form: "form", name: "terms", value: "yes", uncheckedValue: "no", class: ["extra", { active: true }] };
const ref = (element: HTMLSpanElement | HTMLButtonElement | null) => { void element; };
void CheckboxVariants.checkbox;
</script>
<Checkbox {...props} bind:checked {ref} label="Accept terms" onCheckedChange={(next, detail) => { const accepted: boolean = next; void accepted; detail.cancel(); }} />
<Checkbox nativeButton onclick={(event) => { const button: HTMLButtonElement = event.currentTarget; void button; }} />
<Checkbox id="other" defaultChecked indeterminate disabled required readOnly label="Other" />`;
