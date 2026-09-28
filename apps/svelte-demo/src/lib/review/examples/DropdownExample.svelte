<script lang="ts">
  import Dropdown from "$lib/starwind-runtime/dropdown";
  import { Button } from "$lib/starwind-runtime/button";
  let open = $state<boolean | undefined>(false);
  let checked = $state<boolean | undefined>(true);
  let density = $state<string | undefined>("comfortable");
</script>

<div class="grid justify-items-start gap-4">
  <Dropdown.Root bind:open>
    <Dropdown.Trigger>
      {#snippet child({ props, children })}<Button {...props} variant="outline"
          >{@render children?.()}</Button
        >{/snippet}
      Workspace menu
    </Dropdown.Trigger>
    <Dropdown.Content class="w-48 sm:w-60" sideOffset={8} data-dropdown-example="content">
      <Dropdown.Label>Workspace</Dropdown.Label>
      <Dropdown.LinkItem href="#dropdown-review"
        >Account settings<Dropdown.Shortcut>⌘K</Dropdown.Shortcut></Dropdown.LinkItem
      >
      <Dropdown.Separator />
      <Dropdown.CheckboxItem bind:checked>Show status</Dropdown.CheckboxItem>
      <Dropdown.Label>Density</Dropdown.Label>
      <Dropdown.RadioGroup bind:value={density}>
        <Dropdown.RadioItem value="comfortable">Comfortable</Dropdown.RadioItem>
        <Dropdown.RadioItem value="compact">Compact</Dropdown.RadioItem>
      </Dropdown.RadioGroup>
      <Dropdown.Separator />
      <Dropdown.Sub>
        <Dropdown.SubTrigger>Invite team</Dropdown.SubTrigger>
        <Dropdown.SubContent data-dropdown-example="submenu">
          <Dropdown.Item>Email invitation</Dropdown.Item>
          <Dropdown.Item>Copy invite link</Dropdown.Item>
          <Dropdown.Item disabled>Invite from directory</Dropdown.Item>
        </Dropdown.SubContent>
      </Dropdown.Sub>
    </Dropdown.Content>
  </Dropdown.Root>
  <output class="text-sm text-muted-foreground" data-dropdown-models
    >Status: {checked ? "shown" : "hidden"} · Density: {density}</output
  >
</div>
