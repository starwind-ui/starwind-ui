<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/starwind-runtime/dialog";
</script>

<div>
  <Dialog>
    <DialogTrigger>
      {#snippet child({ props, children })}
        <Button {...props}>{@render children?.()}</Button>
      {/snippet}
      Open Dialog
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Example Dialog</DialogTitle>
        <DialogDescription>
          This is a simple dialog example that demonstrates the basic functionality.
        </DialogDescription>
      </DialogHeader>
      <div class="py-8">Your dialog content goes here.</div>
      <DialogFooter>
        <DialogClose>
          {#snippet child({ props, children })}
            <Button {...props} variant="outline">{@render children?.()}</Button>
          {/snippet}
          Cancel
        </DialogClose>
        <Button>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
