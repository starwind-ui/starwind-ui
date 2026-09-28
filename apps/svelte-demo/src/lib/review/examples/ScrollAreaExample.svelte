<script lang="ts">
  import ScrollArea from "$lib/starwind-runtime/scroll-area/index.js";
  import { Button } from "$lib/starwind-runtime/button/index.js";
  let count = $state(14);
  let threshold = $state(0);
  let orientation = $state<"vertical" | "horizontal">("vertical");
</script>
<div class="grid min-w-0 gap-4">
  <div class="flex flex-wrap gap-2">
    <Button variant="outline" onclick={() => count = count === 14 ? 3 : 14}>Toggle content size</Button>
    <Button variant="outline" onclick={() => threshold = threshold === 0 ? 80 : 0}>Edge threshold: {threshold}px</Button>
    <Button variant="outline" onclick={() => orientation = orientation === "vertical" ? "horizontal" : "vertical"}>Axis: {orientation}</Button>
  </div>
  <ScrollArea.Root class="h-60 w-full rounded-lg border" viewportClass="p-4" overflowEdgeThreshold={threshold}>
    <div class={orientation === "horizontal" ? "flex w-max gap-3" : "grid gap-2"}>
      {#each Array.from({ length: count }, (_, index) => index + 1) as item (item)}
        <div class={orientation === "horizontal" ? "bg-muted grid h-40 w-44 shrink-0 place-items-center rounded-md p-4" : "bg-muted rounded-md px-4 py-3"}>Collection item {item}</div>
      {/each}
    </div>
    {#snippet scrollbar()}<ScrollArea.Scrollbar {orientation} />{/snippet}
  </ScrollArea.Root>
  <p class="text-muted-foreground text-sm">Scroll the collection with the wheel, or drag its thumb.</p>
</div>
