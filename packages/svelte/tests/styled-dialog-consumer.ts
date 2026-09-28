import { createRequire } from "node:module";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledDialogConsumer(repoRoot: string): Promise<DistConsumer> {
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
    await writeStyledConsumerFiles(consumer, repoRoot, ["dialog", "select", "button"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledDialogConsumer = `<script lang="ts">
import Dialog, { type DialogProps, type DialogContentProps } from "./dialog/index.js";
import { Button } from "./button/index.js";
import Select from "./select/index.js";
let open = $state<boolean | undefined>(undefined);
const root: DialogProps = { defaultOpen: false, closeOnEscape: true, closeOnOutsideInteract: true, modal: true, ref: (element: HTMLDivElement | null) => { void element; } };
const popup: DialogContentProps = { class: ["extra", { active: true }], ref: (element: HTMLDialogElement | null) => { void element; } };
</script>
<Dialog.Root {...root} bind:open onOpenChange={(next, detail) => { const flag: boolean = next; void flag; detail.cancel(); }} onCloseComplete={(detail) => { void detail; }}>
  {#snippet children(accepted)}
    <Dialog.Trigger popovertarget="target" ref={(element: HTMLButtonElement | null) => { void element; }} onclick={(event) => { const button: HTMLButtonElement = event.currentTarget; void button; }}>
      {#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button>{/snippet}Open
    </Dialog.Trigger>
    <Dialog.Content {...popup}>
      {#snippet icon()}<span>×</span>{/snippet}
      <Dialog.Header ref={(element: HTMLDivElement | null) => { void element; }}><Dialog.Title ref={(element: HTMLHeadingElement | null) => { void element; }}>Title</Dialog.Title><Dialog.Description ref={(element: HTMLParagraphElement | null) => { void element; }}>Description {String(accepted)}</Dialog.Description></Dialog.Header>
      <Select.Root><Select.Trigger aria-label="Choose" /><Select.Content><Select.Item value="alpha">Alpha</Select.Item></Select.Content></Select.Root>
      <Dialog.Footer><Dialog.Close ref={(element: HTMLButtonElement | null) => { void element; }}>{#snippet child({ props, children })}<Button {...props} variant="outline">{@render children?.()}</Button>{/snippet}Close</Dialog.Close></Dialog.Footer>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>`;
