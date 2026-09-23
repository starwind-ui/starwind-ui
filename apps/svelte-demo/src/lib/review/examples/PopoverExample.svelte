<script lang="ts">
  import Popover from "$lib/starwind-runtime/popover";
  import { Button } from "$lib/starwind-runtime/button";
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props, children })}
      <Button {...props} variant="outline">{@render children?.()}</Button>
    {/snippet}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      ><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" /></svg
    >
    Display options
  </Popover.Trigger>
  <Popover.Content side="bottom" align="start" sideOffset={8}>
    <Popover.Header>
      <Popover.Title>Display options</Popover.Title>
      <Popover.Description>Set the width and spacing for your layout.</Popover.Description>
    </Popover.Header>
    <div class="grid gap-3">
      <label class="grid grid-cols-3 items-center gap-3" for="popover-width"
        >Width<input
          id="popover-width"
          class="border-input bg-background col-span-2 w-full rounded-md border px-2 py-1"
          value="100%"
        /></label
      >
      <label class="grid grid-cols-3 items-center gap-3" for="popover-gap"
        >Gap<input
          id="popover-gap"
          class="border-input bg-background col-span-2 w-full rounded-md border px-2 py-1"
          value="16 px"
        /></label
      >
    </div>
  </Popover.Content>
</Popover.Root>
