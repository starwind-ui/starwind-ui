import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledHoverCardConsumer(repoRoot: string): Promise<DistConsumer> {
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["hover-card", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}
export const positiveStyledHoverCardConsumer = `<script lang="ts">
import HoverCard, {HoverCard as HoverCardRoot, HoverCardTrigger, HoverCardContent, type AnchorChildPayload} from "./hover-card/index.js";
let open = $state<boolean | undefined>(undefined);
void [HoverCardRoot, HoverCardTrigger, HoverCardContent];
</script>
{#snippet anchor({props, children}: AnchorChildPayload)}<a {...props}>{@render children?.()}</a>{/snippet}
<HoverCard.Root bind:open openDelay={600} closeDelay={300} disableHoverableContent={false} onOpenChange={(next, detail) => { void next; detail.cancel(); }}>
 {#snippet children(accepted)}<HoverCard.Trigger child={anchor} ref={(node:HTMLAnchorElement|null)=>{void node;}} href="#destination" disabled={false} openDelay={10} closeDelay={20}>Help</HoverCard.Trigger><HoverCard.Content positionerClass="custom" side="bottom" portalContainer="#portal" ref={(node: HTMLDivElement | null) => { void node; }}>{String(accepted)}</HoverCard.Content>{/snippet}
</HoverCard.Root>`;
