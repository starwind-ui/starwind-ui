<script lang="ts">
  import AspectRatio from "$lib/starwind-runtime/aspect-ratio";
  import { Button } from "$lib/starwind-runtime/button";
  let portrait = $state(false);
</script>

<div class="grid items-start gap-5 md:grid-cols-[2fr_1fr]">
  <div class="space-y-3 min-w-0">
    <AspectRatio
      ratio={portrait ? 4 / 3 : 16 / 9}
      as={portrait ? "section" : "figure"}
      aria-label="Cover preview"
      class="flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-linear-to-br from-primary/15 via-background to-secondary/20 p-4 text-center sm:p-6"
    >
      <div class="space-y-2">
        <span class="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
          >Cover image</span
        >
        <span class="block text-2xl font-semibold tracking-tight sm:text-3xl">Room to create</span>
        <span class="block text-sm text-muted-foreground">{portrait ? "4:3" : "16:9"} preview</span>
      </div>
    </AspectRatio>
    <Button size="sm" variant="outline" onclick={() => (portrait = !portrait)}
      >Change preview ratio</Button
    >
  </div>
  <div class="min-w-0 space-y-3">
    <AspectRatio
      class="flex items-center justify-center rounded-lg border border-border bg-muted/50"
      aria-label="Square preview"
    >
      <div class="text-center">
        <span class="block text-3xl font-semibold">1:1</span>
        <span class="mt-2 block text-sm text-muted-foreground">Profile image</span>
      </div>
    </AspectRatio>
    <p class="text-sm text-muted-foreground">
      A square keeps its shape as the available width changes.
    </p>
  </div>
</div>
