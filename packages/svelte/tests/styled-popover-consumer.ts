import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledPopoverConsumer(repoRoot: string): Promise<DistConsumer> {
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["popover", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledPopoverConsumer = `<script lang="ts">
import Popover from "./popover/index.js";
let open = $state<boolean | undefined>(undefined);
</script>
<Popover.Root bind:open onOpenChange={(next, detail) => { void next; detail.cancel(); }} onCloseComplete={(detail) => { void detail; }}>
 {#snippet children(accepted)}
 <Popover.Trigger>Open</Popover.Trigger><Popover.Content ref={(node: HTMLDivElement | null) => { void node; }}>
 <Popover.Header><Popover.Title>Confirmation</Popover.Title><Popover.Description>{String(accepted)}</Popover.Description></Popover.Header>


 </Popover.Content>
 {/snippet}
</Popover.Root>`;
