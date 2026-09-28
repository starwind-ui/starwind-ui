<script lang="ts">
  import ButtonGroup from "$lib/starwind-runtime/button-group";
  import { Button } from "$lib/starwind-runtime/button";
  let alignment = $state("Left");
  let vertical = $state(false);
</script>

<div class="space-y-6">
  <div>
    <h3 class="mb-3 text-sm font-medium">Text alignment</h3>
    <ButtonGroup.Root aria-label="Text alignment">
      {#each ["Left", "Center", "Right"] as value (value)}
        <Button
          size="sm"
          variant={alignment === value ? "secondary" : "outline"}
          aria-pressed={alignment === value}
          onclick={() => (alignment = value)}>{value}</Button
        >
      {/each}
    </ButtonGroup.Root>
    <p class="mt-2 text-sm text-muted-foreground" aria-live="polite">{alignment} aligned</p>
  </div>
  <div>
    <h3 class="mb-3 text-sm font-medium">Export format</h3>
    <ButtonGroup.Root aria-label="Export format"
      ><ButtonGroup.Text>Format</ButtonGroup.Text><Button size="sm" variant="outline">PDF</Button
      ><ButtonGroup.Separator /><Button size="sm" variant="outline">CSV</Button></ButtonGroup.Root
    >
  </div>
  <div>
    <h3 class="mb-3 text-sm font-medium">Group orientation</h3>
    <ButtonGroup.Root
      orientation={vertical ? "vertical" : "horizontal"}
      aria-label="Workspace sections"
      data-review-orientation
      ><Button size="sm" variant="outline">Overview</Button><ButtonGroup.Separator
        orientation={vertical ? "horizontal" : "vertical"}
      /><Button size="sm" variant="outline">Activity</Button></ButtonGroup.Root
    >
    <Button size="sm" variant="ghost" class="mt-3" onclick={() => (vertical = !vertical)}
      >Change group orientation</Button
    >
  </div>
</div>
