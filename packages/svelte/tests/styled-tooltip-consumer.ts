import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledTooltipConsumer(repoRoot: string): Promise<DistConsumer> {
  const viteManifest = createRequire(path.join(repoRoot, "package.json")).resolve("vite");
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["tooltip", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}
export const positiveStyledTooltipConsumer = `<script lang="ts">
import Tooltip from "./tooltip/index.js";
let open = $state<boolean | undefined>(undefined);
</script>
<Tooltip.Root bind:open disabled={false} openDelay={200} closeDelay={200} disableHoverableContent={false} onOpenChange={(next, detail) => { void next; detail.cancel(); }}>
 {#snippet children(accepted)}<Tooltip.Trigger>Help</Tooltip.Trigger><Tooltip.Content positionerClass="custom" side="bottom" portalContainer="#portal" ref={(node: HTMLDivElement | null) => { void node; }}>{String(accepted)}{#snippet icon()}<svg aria-hidden="true"></svg>{/snippet}</Tooltip.Content>{/snippet}
</Tooltip.Root>`;
