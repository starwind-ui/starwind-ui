import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";

export async function createStyledSelectConsumer(repoRoot: string): Promise<DistConsumer> {
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
    for (const group of ["select", "button"]) {
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
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledSelectConsumer = `<script lang="ts">
import Select, { SelectVariants, type SelectProps, type SelectContentProps } from "./select/index.js";
import { Button } from "./button/index.js";
let open = $state<boolean | undefined>(undefined);
let value = $state<string | null | undefined>(undefined);
const ref = (element: HTMLButtonElement | null) => { void element; };
const popupRef = (element: HTMLDivElement | null) => { void element; };
const options: SelectProps = { autoComplete: "off", defaultOpen: false, defaultValue: "alpha", modal: false, readOnly: false, required: true, disabled: false, name: "choice", class: ["extra", { active: true }] };
const placement: SelectContentProps = { portalContainer: typeof document === "undefined" ? undefined : document.body, alignItemWithTrigger: false, disablePortal: true, side: "top", align: "end", sideOffset: 8, size: "sm", ref: popupRef };
void SelectVariants.selectTrigger;
</script>
<Select.Root {...options} bind:open bind:value onOpenChange={(next, detail) => { const flag: boolean = next; void flag; detail.cancel(); }} onValueChange={(next, detail) => { const selected: string | null = next; void selected; detail.cancel(); }}>
  <Select.Trigger {ref} popovertarget="target" size="lg" onclick={(event) => { const button: HTMLButtonElement = event.currentTarget; void button; }}>
    {#snippet child({ props, children })}<Button {...props} variant="outline">{@render children?.()}</Button>{/snippet}
    <Select.Value placeholder="Choose">{#snippet children(label, selected)}{label ?? selected ?? "Empty"}{/snippet}</Select.Value>
  </Select.Trigger>
  <Select.Trigger>{#snippet icon()}<span>⌄</span>{/snippet}</Select.Trigger>
  <Select.Content {...placement}>
    <Select.Group><Select.Label>Items</Select.Label><Select.Item value="alpha" inset indicatorClass="icon" showIndicator>{#snippet indicator()}<span>✓</span>{/snippet}Alpha</Select.Item></Select.Group>
    <Select.Separator /><Select.Item value="beta" disabled>Beta</Select.Item><Select.ScrollUpButton>Up</Select.ScrollUpButton><Select.ScrollDownButton>Down</Select.ScrollDownButton>
  </Select.Content>
</Select.Root>`;
