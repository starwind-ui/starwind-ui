<script lang="ts">
  import Kbd from "$lib/starwind-runtime/kbd";
</script>

<div class="grid gap-5">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <span>Open search</span><Kbd.Group aria-label="Control plus K"
      ><Kbd.Root>Ctrl</Kbd.Root><span>+</span><Kbd.Root>K</Kbd.Root></Kbd.Group
    >
  </div>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <span>Save changes</span><Kbd.Group aria-label="Command plus S"
      ><Kbd.Root>⌘</Kbd.Root><Kbd.Root>S</Kbd.Root></Kbd.Group
    >
  </div>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <span>Close a panel</span><Kbd.Root>Esc</Kbd.Root>
  </div>
</div>
