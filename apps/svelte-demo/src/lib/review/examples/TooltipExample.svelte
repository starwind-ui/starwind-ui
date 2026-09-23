<script lang="ts">
  import Tooltip from "$lib/starwind-runtime/tooltip";
  import { Button } from "$lib/starwind-runtime/button";
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
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
      ><circle cx="12" cy="12" r="10" /><path
        d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01"
      /></svg
    >
    Keyboard shortcuts
  </Tooltip.Trigger>
  <Tooltip.Content>Press ⌘K to open the command menu.</Tooltip.Content>
</Tooltip.Root>
