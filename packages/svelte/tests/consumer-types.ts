import { sidebarPositive } from "./sidebar-consumer.js";
import { colorPickerPositive } from "./color-picker-consumer.js";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { rm } from "node:fs/promises";
import path from "node:path";
import { createDistConsumer, type DistConsumer } from "./dist-consumer.js";
import { negativeConsumers } from "./dist-consumer-fixtures.js";
import { styledNegativeConsumers, styledPositiveConsumers } from "./consumer-type-fixtures.js";
import { verifyNamedRejections, STYLED_REJECTION } from "./named-rejections.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";
import { getImplementedSvelteStyledRoots } from "../../../scripts/portable-runtime/renderers/framework-adapters/svelte/inventory.js";
import { starwindStyledContracts } from "../../../scripts/portable-runtime/contracts/styled/starwind.js";
import { selectSvelteStyledContracts } from "../../../scripts/portable-runtime/renderers/framework-adapters/svelte/styled/scope.js";

export async function createSvelteConsumer(repoRoot: string): Promise<DistConsumer> {
  const require = createRequire(path.join(repoRoot, "package.json"));
  const esbuild = createRequire(require.resolve("vite")).resolve("esbuild/package.json");
  return createDistConsumer({
    packageRoot: path.join(repoRoot, "packages/svelte"),
    additionalPackages: [
      ...["tailwind-variants", "tailwind-merge"].map((name) => ({
        name,
        from: path.join(repoRoot, "apps/demo/package.json"),
      })),
      { name: "esbuild", from: require.resolve("vite") },
      { name: `@esbuild/${process.platform}-${process.arch}`, from: esbuild },
    ],
  });
}

function imports(source: string): string[] {
  return [...source.matchAll(/from ["'](?:\.\/|@starwind-ui\/svelte\/)([\w-]+)/g)].map(
    (match) => match[1]!,
  );
}

/** Two checker passes per selected fixture set. Browser tests own lifecycle assertions. */
export async function verifyConsumerTypes(
  consumer: DistConsumer,
  repoRoot: string,
  selected?: readonly string[],
) {
  const selectedSet = selected ? new Set(selected) : undefined;
  const relevant = (source: string) =>
    !selectedSet || imports(source).some((root) => selectedSet.has(root));
  const positives = Object.fromEntries(
    Object.entries(styledPositiveConsumers).filter(([, source]) => relevant(source)),
  );
  if (!selectedSet || selectedSet.has("color-picker"))
    positives["ColorPickerPositive.svelte"] = colorPickerPositive;
  if (!selectedSet || selectedSet.has("sidebar"))
    positives["SidebarPositive.svelte"] = sidebarPositive;
  // The tiny root facade and accepted-model fixture also protects direct Primitive consumption.
  positives["PrimitivePositive.svelte"] = `<script lang="ts">
import Button from "@starwind-ui/svelte/button";
import Checkbox from "@starwind-ui/svelte/checkbox";
import Select from "@starwind-ui/svelte/select";
import Dialog from "@starwind-ui/svelte/dialog";
import Slider from "@starwind-ui/svelte/slider";
import type { ButtonChildPayload } from "@starwind-ui/svelte/button";
let checked=$state<boolean|undefined>(), open=$state<boolean|undefined>(), value=$state<string|null|undefined>(), range=$state<number|number[]|undefined>();
</script>
{#snippet child({props,children}:ButtonChildPayload)}<button {...props}>{@render children?.()}</button>{/snippet}
<Button.Root>Button</Button.Root>
<Checkbox.Root bind:checked onCheckedChange={(next,detail)=>{const accepted:boolean=next;detail.cancel();void accepted;}}/>
<Select.Root bind:open bind:value><Select.Trigger {child}>Select</Select.Trigger></Select.Root>
<Dialog.Root bind:open><Dialog.Trigger {child}>Dialog</Dialog.Trigger></Dialog.Root>
<Slider.Root bind:value={range}/>`;
  // A helper component imported by the Breadcrumb fixture is part of that fixture.
  if (positives["BreadcrumbPositive.svelte"])
    positives["BreadcrumbRouterLink.svelte"] =
      styledPositiveConsumers["BreadcrumbRouterLink.svelte"]!;
  const negatives = {
    ...Object.fromEntries(
      Object.entries(negativeConsumers).filter(([, fixture]) => relevant(fixture.source)),
    ),
    ...Object.fromEntries(
      Object.entries(styledNegativeConsumers)
        .filter(([, source]) => relevant(source))
        .map(([name, source]) => [
          name,
          {
            source,
            diagnostic:
              name === "FormFacadeName.svelte"
                ? /has no exported member 'FormState'/
                : STYLED_REJECTION,
          },
        ]),
    ),
  };
  const implemented = new Set(getImplementedSvelteStyledRoots());
  const roots = [
    ...new Set(
      [...Object.values(positives), ...Object.values(negatives).map((fixture) => fixture.source)]
        .flatMap(imports)
        .filter((root) => implemented.has(root)),
    ),
  ];
  const groups = selectSvelteStyledContracts(starwindStyledContracts, roots).map(
    (contract) => contract.component,
  );
  await writeStyledConsumerFiles(consumer, repoRoot, groups);
  await consumer.write(positives);
  const positive = await consumer.check();
  assert.equal(positive.code, 0, positive.output);
  assert.match(positive.output, /COMPLETED \d+ FILES 0 ERRORS 0 WARNINGS/);
  const names = Object.keys(negatives);
  if (names.length) {
    await consumer.write(
      Object.fromEntries(
        Object.entries(negatives).map(([name, fixture]) => [name, fixture.source]),
      ),
    );
    try {
      verifyNamedRejections(await consumer.check(), consumer.root, negatives);
    } finally {
      await Promise.all(names.map((name) => rm(path.join(consumer.root, name))));
    }
  }
  return { positiveFiles: Object.keys(positives), negativeFiles: names };
}
