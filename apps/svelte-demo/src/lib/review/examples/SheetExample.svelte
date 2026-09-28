<script lang="ts">
  import Sheet from "$lib/starwind-runtime/sheet";
  import { Button } from "$lib/starwind-runtime/button";
  const sides = ["right", "left", "top", "bottom"] as const;
</script>

<div class="flex flex-wrap gap-3">
  {#each sides as side}
    <Sheet.Root>
      <Sheet.Trigger>
        {#snippet child({ props, children })}
          <Button {...props} variant="outline">{@render children?.()}</Button>
        {/snippet}
        Open {side} sheet
      </Sheet.Trigger>
      <Sheet.Content {side}>
        <Sheet.Header>
          <Sheet.Title>Edit profile</Sheet.Title>
          <Sheet.Description
            >Update your profile details. Close this sheet when you finish.</Sheet.Description
          >
        </Sheet.Header>
        <div class="grid gap-2 px-4 py-4">
          <label for={`sheet-name-${side}`}>Name</label>
          <input
            id={`sheet-name-${side}`}
            value="Alex Morgan"
            class="border-input bg-background rounded-md border px-3 py-2"
          />
        </div>
        <Sheet.Footer>
          <Sheet.Close>
            {#snippet child({ props, children })}
              <Button {...props}>{@render children?.()}</Button>
            {/snippet}
            Save changes
          </Sheet.Close>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet.Root>
  {/each}
</div>
