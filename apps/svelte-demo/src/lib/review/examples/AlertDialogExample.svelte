<script lang="ts">
  import AlertDialog from "$lib/starwind-runtime/alert-dialog";
  import { Button } from "$lib/starwind-runtime/button";
  let open = $state<boolean | undefined>(undefined);
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Trigger>
    {#snippet child({ props, children })}
      <Button {...props} variant="outline">{@render children?.()}</Button>
    {/snippet}
    Show confirmation
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This example shows a confirmation dialog. Choose Continue to close it and return to the
        catalog.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
