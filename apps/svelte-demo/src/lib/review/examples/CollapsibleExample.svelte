<script lang="ts">
  import Collapsible from "$lib/starwind-runtime/collapsible/index.js";
  import { Button } from "$lib/starwind-runtime/button/index.js";
  let open = $state(false);
  let disabled = $state(false);
  let keepOpen = $state(false);
</script>

<div class="grid gap-4">
  <div class="flex flex-wrap gap-2">
    <Button variant="outline" onclick={() => (open = !open)}>Parent command</Button>
    <Button variant="outline" onclick={() => (disabled = !disabled)}
      >Trigger: {disabled ? "disabled" : "enabled"}</Button
    >
    <Button variant="outline" onclick={() => (keepOpen = !keepOpen)}
      >Cancel close: {keepOpen ? "on" : "off"}</Button
    >
  </div>
  <Collapsible.Root
    bind:open
    {disabled}
    onOpenChange={(next, details) => {
      if (keepOpen && !next) details.cancel();
    }}
  >
    <Collapsible.Trigger>
      Collection details <span aria-hidden="true">{open ? "−" : "+"}</span>
    </Collapsible.Trigger>
    <Collapsible.Content hiddenUntilFound>
      <p class="text-sm">
        A collection groups saved examples. The parent command changes this panel without a proposal
        callback.
      </p>
      <p class="text-muted-foreground mt-2 text-sm">
        Turn on Cancel close, then use the trigger to keep the panel open.
      </p>
    </Collapsible.Content>
  </Collapsible.Root>
  <p class="text-muted-foreground text-sm" aria-live="polite">
    Accepted state: {open ? "open" : "closed"}
  </p>
</div>
