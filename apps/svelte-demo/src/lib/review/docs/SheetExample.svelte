<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import { Input } from "$lib/starwind-runtime/input";
  import { Label } from "$lib/starwind-runtime/label";
  import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "$lib/starwind-runtime/sheet";
</script>

<div>
  <Sheet>
    <SheetTrigger>
      {#snippet child({ props, children })}
        <Button {...props}>{@render children?.()}</Button>
      {/snippet}
      Open Sheet
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Edit Profile</SheetTitle>
        <SheetDescription>
          Make changes to your profile here. Click save when you're done.
        </SheetDescription>
      </SheetHeader>
      <div class="grid gap-4 px-4">
        <div class="grid gap-2">
          <Label for="docs-sheet-name">Name</Label>
          <Input id="docs-sheet-name" value="Pedro Duarte" />
        </div>
        <div class="grid gap-2">
          <Label for="docs-sheet-username">Username</Label>
          <Input id="docs-sheet-username" value="@peduarte" />
        </div>
      </div>
      <SheetFooter>
        <SheetClose>
          {#snippet child({ props, children })}
            <Button {...props} type="submit">{@render children?.()}</Button>
          {/snippet}
          Save changes
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</div>
