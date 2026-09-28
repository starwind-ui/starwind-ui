<script lang="ts">
  import ContextMenu from "$lib/starwind-runtime/context-menu";
  let open = $state<boolean | undefined>(false);
  let checked = $state<boolean | undefined>(true);
  let spacing = $state<string | undefined>("comfortable");
</script>

<div class="grid justify-items-start gap-4">
  <ContextMenu.Root bind:open>
    <ContextMenu.Trigger
      class="flex h-28 w-full min-w-52 max-w-xs items-center justify-center rounded-xl border border-dashed px-5 text-sm"
      data-context-example="trigger"
    >
      Workspace view
    </ContextMenu.Trigger>
    <ContextMenu.Content class="w-40 sm:w-48" data-context-example="content">
      <ContextMenu.Label>Display</ContextMenu.Label>
      <ContextMenu.CheckboxItem bind:checked>Show grid</ContextMenu.CheckboxItem>
      <ContextMenu.Separator />
      <ContextMenu.Label>Spacing</ContextMenu.Label>
      <ContextMenu.RadioGroup bind:value={spacing}>
        <ContextMenu.RadioItem value="comfortable">Comfortable</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="compact">Compact</ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
      <ContextMenu.Separator />
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
        <ContextMenu.SubContent data-context-example="submenu">
          <ContextMenu.Item>Copy link</ContextMenu.Item>
          <ContextMenu.Item>Email page</ContextMenu.Item>
          <ContextMenu.Item disabled>Public link</ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    </ContextMenu.Content>
  </ContextMenu.Root>
  <output class="text-sm text-muted-foreground" data-context-models
    >Grid: {checked ? "shown" : "hidden"} · Spacing: {spacing}</output
  >
</div>
