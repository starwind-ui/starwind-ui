import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledComboboxConsumer(repoRoot: string): Promise<DistConsumer> {
  const viteManifest = path.join(repoRoot, "node_modules/vite/package.json");
  const esbuildManifest = createRequire(viteManifest).resolve("esbuild/package.json");
  const consumer = await createDistConsumer({
    packageRoot: path.join(repoRoot, "packages/svelte"),
    additionalPackages: [
      ...["tailwind-variants", "tailwind-merge"].map((name) => ({
        name,
        from: path.join(repoRoot, "apps/demo/package.json"),
      })),
      { name: "esbuild", from: viteManifest },
      { name: `@esbuild/${process.platform}-${process.arch}`, from: esbuildManifest },
    ],
  });
  try {
    await writeStyledConsumerFiles(consumer, repoRoot, [
      "combobox",
      "input-group",
      "input",
      "textarea",
      "button",
      "field",
      "form",
      "separator",
    ]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledComboboxConsumer = `<script lang="ts">
import Box, { Combobox, ComboboxVariants } from "./combobox/index.js";
import type {ButtonChildPayload} from "@starwind-ui/svelte/combobox";
let value=$state<string|null|undefined>(),inputValue=$state<string|undefined>(),open=$state<boolean|undefined>(),inputGroupRef=$state<HTMLDivElement>();void ComboboxVariants;
</script>
{#snippet child({props,children}:ButtonChildPayload)}<button {...props}>{@render children?.()}</button>{/snippet}
<Box.Root bind:value bind:inputValue bind:open defaultValue="astro" defaultInputValue="Astro" defaultOpen name="framework" required onInputValueChange={(next,detail)=>{const text:string=next;void text;detail.cancel();}} onOpenChange={(next,detail)=>{const state:boolean=next;void state;detail.cancel();}} onValueChange={(next,detail)=>{const selected:string|null=next;void selected;detail.cancel();}}>
<Box.Label>Framework</Box.Label><Box.InputGroup size="sm" bind:ref={inputGroupRef}><Box.Input size="sm" showClear showTrigger placeholder="Search" ref={(node:HTMLInputElement|null)=>{void node;}}/><Box.Trigger {child} iconClass="size-3" showIcon ref={(node:HTMLButtonElement|null)=>{void node;}}>Open</Box.Trigger><Box.Clear {child} showIcon ref={(node:HTMLButtonElement|null)=>{void node;}}>Clear</Box.Clear></Box.InputGroup><Box.Value placeholder="Choose"/>
<Box.Content portalContainer="#target" side="bottom" align="start" sideOffset={8} size="sm"><Box.Empty>Empty</Box.Empty><Box.Group><Box.GroupLabel>Frameworks</Box.GroupLabel><Box.Item value="astro"><Box.ItemText>Astro</Box.ItemText><Box.ItemIndicator/></Box.Item><Box.Separator/></Box.Group></Box.Content>
</Box.Root><Combobox value={null} inputValue="" open={false}/>`;
