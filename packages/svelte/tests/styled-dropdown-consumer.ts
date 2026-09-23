import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledDropdownConsumer(repoRoot: string): Promise<DistConsumer> {
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["dropdown", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledDropdownConsumer = `<script lang="ts">
import Dropdown, { Dropdown as Root, DropdownVariants } from "./dropdown/index.js";
import type { ButtonChildPayload } from "@starwind-ui/svelte/menu";
let open = $state<boolean | undefined>(); let checked = $state<boolean | undefined>(); let value = $state<string | undefined>();
void DropdownVariants;
</script>
{#snippet child({ props, children }: ButtonChildPayload)}<button {...props}>{@render children?.()}</button>{/snippet}
<Dropdown.Root bind:open onOpenChange={(next, detail) => { void next; detail.cancel(); }} onCloseComplete={(detail) => { void detail; }}>
 <Dropdown.Trigger {child}>Open</Dropdown.Trigger><Dropdown.Content portalContainer="#target" side="bottom" ref={(node: HTMLDivElement | null) => { void node; }}>
 <Dropdown.Group><Dropdown.Label>Settings</Dropdown.Label><Dropdown.Item inset>Profile<Dropdown.Shortcut>⌘P</Dropdown.Shortcut></Dropdown.Item><Dropdown.LinkItem href="#profile">Link</Dropdown.LinkItem></Dropdown.Group><Dropdown.Separator />
 <Dropdown.CheckboxItem bind:checked onCheckedChange={(next, detail) => { void next; detail.cancel(); }} showIndicator={false}><Dropdown.CheckboxItemIndicator />Checked</Dropdown.CheckboxItem>
 <Dropdown.RadioGroup bind:value onValueChange={(next, detail) => { void next; detail.cancel(); }}><Dropdown.RadioItem value="one" showIndicator={false}><Dropdown.RadioItemIndicator />One</Dropdown.RadioItem></Dropdown.RadioGroup>
 <Dropdown.Sub closeDelay={150}><Dropdown.SubTrigger>More</Dropdown.SubTrigger><Dropdown.SubContent><Dropdown.Item>Nested</Dropdown.Item></Dropdown.SubContent></Dropdown.Sub>
 </Dropdown.Content>
</Dropdown.Root><Root open={false} />`;
