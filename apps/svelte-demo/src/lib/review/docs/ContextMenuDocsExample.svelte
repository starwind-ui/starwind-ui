<script lang="ts">
  import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
  } from "$lib/starwind-runtime/context-menu";
</script>

<ContextMenu>
  <ContextMenuTrigger
    class="flex aspect-video w-full max-w-xs min-w-40 items-center justify-center rounded-xl border border-dashed text-sm"
  >
    <span class="hidden pointer-fine:inline-block">Right click here</span>
    <span class="hidden pointer-coarse:inline-block">Long press here</span>
  </ContextMenuTrigger>
  <ContextMenuContent class="w-48">
    <ContextMenuGroup>
      <ContextMenuItem>
        Back
        <ContextMenuShortcut>⌘[</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem disabled>
        Forward
        <ContextMenuShortcut>⌘]</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem>
        Reload
        <ContextMenuShortcut>⌘R</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-44">
          <ContextMenuGroup>
            <ContextMenuItem>Save Page...</ContextMenuItem>
            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
            <ContextMenuItem>Name Window...</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>Developer Tools</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem
              class="text-destructive data-highlighted:text-destructive focus:text-destructive"
              >Delete</ContextMenuItem
            >
          </ContextMenuGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuGroup>
      <ContextMenuCheckboxItem defaultChecked>Show Bookmarks</ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>
