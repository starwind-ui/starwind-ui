<script lang="ts">
  import { ScrollArea } from "$lib/starwind-runtime/scroll-area";
  import { Separator } from "$lib/starwind-runtime/separator";
  const tags = Array.from({ length: 50 }, (_, index) => `v1.2.0-beta.${50 - index}`);
</script>

<div>
  <ScrollArea class="h-72 w-48 rounded-md border">
    <div class="p-4">
      <h4 class="mb-4 text-sm leading-none font-medium">Tags</h4>
      {#each tags as tag (tag)}<div>
          <div class="text-sm">{tag}</div>
          <Separator class="my-2" />
        </div>{/each}
    </div>
  </ScrollArea>
</div>
