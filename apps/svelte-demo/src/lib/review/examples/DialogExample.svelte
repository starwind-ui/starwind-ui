<script lang="ts">
  import Dialog from "$lib/starwind-runtime/dialog";
  import { Button } from "$lib/starwind-runtime/button";
  let open = $state<boolean | undefined>(undefined);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props, children })}
      <Button {...props}>{@render children?.()}</Button>
    {/snippet}
    Open preferences
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Preferences</Dialog.Title>
      <Dialog.Description>Choose your defaults.</Dialog.Description>
    </Dialog.Header>
    <Dialog.Close>Done</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
