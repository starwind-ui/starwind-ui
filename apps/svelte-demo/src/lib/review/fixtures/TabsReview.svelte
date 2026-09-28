<script lang="ts">
  import Tabs from "$lib/starwind-runtime/tabs";
  let value = $state<string | null>("overview");
</script>

<Tabs.Root bind:value>
  <Tabs.List aria-label="Project information">
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
    <Tabs.Trigger value="disabled" disabled>Disabled</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview"><p>Keep your project details in one place.</p></Tabs.Content>
  <Tabs.Content value="activity"><p>Your latest project updates appear here.</p></Tabs.Content>
  <Tabs.Content value="disabled">Unavailable content</Tabs.Content>
</Tabs.Root>
