<script lang="ts">
  import Sheet from "$lib/starwind-runtime/sheet";
  import Tooltip from "$lib/starwind-runtime/tooltip";
  import HoverCard from "$lib/starwind-runtime/hover-card";
  import Popover from "$lib/starwind-runtime/popover";
  import { Button } from "$lib/starwind-runtime/button";
</script>

<section
  id="overlay-composition-review"
  class="review-card"
  aria-labelledby="overlay-composition-heading"
>
  <h2 id="overlay-composition-heading">Overlay composition</h2>
  <p>Open display options inside a sheet to check focus and nested ownership.</p>
  <Sheet.Root>
    <Sheet.Trigger
      >{#snippet child({ props, children })}<Button {...props} variant="outline"
          >{@render children?.()}</Button
        >{/snippet}Open composition sheet</Sheet.Trigger
    >
    <Sheet.Content>
      <Sheet.Header
        ><Sheet.Title>Workspace settings</Sheet.Title><Sheet.Description
          >Adjust the display while this sheet stays open.</Sheet.Description
        ></Sheet.Header
      >
      <div class="px-4 py-6">
        <Popover.Root>
          <Popover.Trigger
            >{#snippet child({ props, children })}<Button {...props} variant="outline"
                >{@render children?.()}</Button
              >{/snippet}Nested display options</Popover.Trigger
          >
          <Popover.Content side="bottom" align="start" sideOffset={8}>
            <Popover.Header
              ><Popover.Title>Panel display</Popover.Title><Popover.Description
                >These settings belong to the workspace sheet.</Popover.Description
              ></Popover.Header
            >
            <label class="grid gap-2" for="nested-density"
              >Density<input
                id="nested-density"
                class="border-input bg-background rounded-md border px-2 py-1"
                value="Comfortable"
              /></label
            >
          </Popover.Content>
        </Popover.Root>
        <div class="mt-6 flex flex-wrap items-center gap-4">
          <Tooltip.Root>
            <Tooltip.Trigger>Nested keyboard help</Tooltip.Trigger>
            <Tooltip.Content>Use Tab to move through workspace controls.</Tooltip.Content>
          </Tooltip.Root>
          <HoverCard.Root>
            <HoverCard.Trigger href="#overlay-composition-heading"
              >Workspace owner</HoverCard.Trigger
            >
            <HoverCard.Content
              ><p>Manage the workspace profile.</p>
              <a href="#overlay-composition-heading" class="underline">Open owner profile</a
              ></HoverCard.Content
            >
          </HoverCard.Root>
        </div>
      </div>
    </Sheet.Content>
  </Sheet.Root>
</section>
