<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import { Input } from "$lib/starwind-runtime/input";
  import { Label } from "$lib/starwind-runtime/label";
  import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
  } from "$lib/starwind-runtime/popover";
</script>

<div class="flex items-center justify-center">
  <Popover>
    <PopoverTrigger>
      {#snippet child({ props, children })}
        <Button {...props} variant="outline">{@render children?.()}</Button>
      {/snippet}
      Open popover
    </PopoverTrigger>
    <PopoverContent class="w-80">
      <PopoverHeader>
        <PopoverTitle>Dimensions</PopoverTitle>
        <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
      </PopoverHeader>
      <div class="grid gap-2 px-0.5">
        <div class="grid grid-cols-3 items-center gap-3">
          <Label for="docs-popover-popover-width">Width</Label>
          <Input id="docs-popover-popover-width" value="100%" class="col-span-2 h-8" />
        </div>
        <div class="grid grid-cols-3 items-center gap-3">
          <Label for="docs-popover-popover-max-width">Max. width</Label>
          <Input id="docs-popover-popover-max-width" value="300px" class="col-span-2 h-8" />
        </div>
        <div class="grid grid-cols-3 items-center gap-3">
          <Label for="docs-popover-popover-height">Height</Label>
          <Input id="docs-popover-popover-height" value="25px" class="col-span-2 h-8" />
        </div>
        <div class="grid grid-cols-3 items-center gap-3">
          <Label for="docs-popover-popover-max-height">Max. height</Label>
          <Input id="docs-popover-popover-max-height" value="none" class="col-span-2 h-8" />
        </div>
      </div>
    </PopoverContent>
  </Popover>
</div>
