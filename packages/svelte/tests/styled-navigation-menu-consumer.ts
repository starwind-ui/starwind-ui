import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledNavigationMenuConsumer(repoRoot: string): Promise<DistConsumer> {
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["navigation-menu", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledNavigationMenuConsumer = `<script lang="ts">
import Menu, { NavigationMenu, NavigationMenuVariants, navigationMenuTriggerStyle } from "./navigation-menu/index.js";
import type { ButtonChildPayload } from "@starwind-ui/svelte/navigation-menu";
let value = $state<string | null | undefined>();
void NavigationMenuVariants;
</script>
{#snippet child({props, children}: ButtonChildPayload)}<button {...props}>{@render children?.()}</button>{/snippet}
<Menu.Root bind:value defaultValue="intro" size="sm" contentSize="md" portalContainer="#target" side="bottom" onValueChange={(next, detail) => { const selection: string | null = next; void selection; detail.cancel(); }}>
{#snippet children(accepted)}
<Menu.List><Menu.Item value="intro"><Menu.Trigger {child} ref={(node:HTMLButtonElement|null)=>{void node;}}>Intro {String(accepted)}</Menu.Trigger><Menu.Content ref={(node:HTMLDivElement|null)=>{void node;}}><Menu.Link href="#intro" active ref={(node:HTMLAnchorElement|null)=>{void node;}}>Introduction</Menu.Link></Menu.Content></Menu.Item><Menu.Item><Menu.Link href="#docs" class={navigationMenuTriggerStyle()}>Docs</Menu.Link></Menu.Item></Menu.List>
{/snippet}
</Menu.Root><NavigationMenu value={null}/><Menu.Indicator /><Menu.Positioner portalContainer="#target" />`;
