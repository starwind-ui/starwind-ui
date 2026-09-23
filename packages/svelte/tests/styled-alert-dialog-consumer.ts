import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledAlertDialogConsumer(repoRoot: string): Promise<DistConsumer> {
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["alert-dialog", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledAlertDialogConsumer = `<script lang="ts">
import AlertDialog from "./alert-dialog/index.js";
let open = $state<boolean | undefined>(undefined);
</script>
<AlertDialog.Root bind:open onOpenChange={(next, detail) => { void next; detail.cancel(); }} onCloseComplete={(detail) => { void detail; }}>
 {#snippet children(accepted)}
 <AlertDialog.Trigger>Open</AlertDialog.Trigger><AlertDialog.Content ref={(node: HTMLDialogElement | null) => { void node; }}>
 <AlertDialog.Header><AlertDialog.Title>Confirmation</AlertDialog.Title><AlertDialog.Description>{String(accepted)}</AlertDialog.Description></AlertDialog.Header>
 <AlertDialog.Footer><AlertDialog.Cancel variant="outline" size="sm">Cancel</AlertDialog.Cancel><AlertDialog.Action href="#confirmed" target="_self">Confirm</AlertDialog.Action></AlertDialog.Footer>
 </AlertDialog.Content>
 {/snippet}
</AlertDialog.Root>`;
