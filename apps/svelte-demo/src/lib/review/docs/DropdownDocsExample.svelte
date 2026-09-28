<script lang="ts">
  import Dropdown from "$lib/starwind-runtime/dropdown";
  import { Button } from "$lib/starwind-runtime/button";
</script>

<Dropdown.Root>
  <Dropdown.Trigger>
    {#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button
      >{/snippet}
    Open Menu
  </Dropdown.Trigger>
  <Dropdown.Content>
    <Dropdown.Label>My Account</Dropdown.Label>
    <Dropdown.Separator />
    <Dropdown.Item>Profile</Dropdown.Item>
    <Dropdown.Item>Settings</Dropdown.Item>
    <Dropdown.Separator />
    <Dropdown.Item>Help</Dropdown.Item>
    <Dropdown.Item disabled>Sign out</Dropdown.Item>
  </Dropdown.Content>
</Dropdown.Root>
