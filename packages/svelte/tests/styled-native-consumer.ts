import path from "node:path";
import { createRequire } from "node:module";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export const nativeStyledRoots = ["separator", "label", "skeleton"] as const;
export async function createStyledNativeConsumer(
  repoRoot: string,
  groups: readonly string[] = nativeStyledRoots,
): Promise<DistConsumer> {
  const viteManifest = createRequire(import.meta.url).resolve("vite/package.json");
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
    await writeStyledConsumerFiles(consumer, repoRoot, groups);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const nativeStyledImports = `import Separator, { Separator as NamedSeparator, SeparatorVariants, type SeparatorProps } from "./separator/index.js";
import Label, { Label as NamedLabel, LabelVariants, type LabelProps } from "./label/index.js";
import Skeleton, { Skeleton as NamedSkeleton, SkeletonVariants, type SkeletonProps } from "./skeleton/index.js";`;

export const nativeStyledPositive = `<script lang="ts">
${nativeStyledImports}
let separatorRef = $state<HTMLDivElement>(), labelRef = $state<HTMLLabelElement>(), skeletonRef = $state<HTMLDivElement>();
const separator: SeparatorProps = { orientation: "vertical", "data-slot": "custom", ref: separatorRef };
const label: LabelProps = { for: "native-field", size: "sm", ref: labelRef };
const skeleton: SkeletonProps = { style: "height: 1rem", ref: skeletonRef };
void [SeparatorVariants.separator({ orientation: "horizontal" }), LabelVariants.label({ size: "lg" }), SkeletonVariants.skeleton()];
</script>
<Separator {...separator} onpointerdown={(event) => { const el: HTMLDivElement = event.currentTarget; void el; }} />
<NamedSeparator />
<Label {...label} onclick={(event) => { const el: HTMLLabelElement = event.currentTarget; void el; }}>Name</Label><input id="native-field" />
<NamedLabel for="native-field">Alias</NamedLabel>
<Skeleton {...skeleton} onpointerdown={(event) => { const el: HTMLDivElement = event.currentTarget; void el; }} /><NamedSkeleton />`;
