import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledSheetConsumer(repoRoot: string): Promise<DistConsumer> {
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["sheet", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledSheetConsumer = `<script lang="ts">
import Sheet from "./sheet/index.js";
let open = $state<boolean | undefined>(undefined);
</script>
<Sheet.Root bind:open onOpenChange={(next, detail) => { void next; detail.cancel(); }} onCloseComplete={(detail) => { void detail; }}>
 {#snippet children(accepted)}
 <Sheet.Trigger>Open</Sheet.Trigger><Sheet.Content ref={(node: HTMLDialogElement | null) => { void node; }}>
 <Sheet.Header><Sheet.Title>Confirmation</Sheet.Title><Sheet.Description>{String(accepted)}</Sheet.Description></Sheet.Header>
 <Sheet.Footer><Sheet.Close>Close</Sheet.Close></Sheet.Footer>
 <Sheet.Close>{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Confirm</Sheet.Close>
 </Sheet.Content>
 {/snippet}
</Sheet.Root>`;
